import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineAction, SyncStatus } from '../types';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../services';
import { logger } from '../utils';
import { getApiUrl } from '../config';
import { MAX_RETRY_ATTEMPTS, SYNC_DEBOUNCE_MS } from '../constants/colors';

interface UseOfflineSyncReturn extends SyncStatus {
  queueAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>) => Promise<void>;
  syncNow: () => Promise<void>;
  clearPendingActions: () => Promise<void>;
}

export const useOfflineSyncManager = (): UseOfflineSyncReturn => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { token, refreshAuthToken } = useAuthStore();
  const retryCounts = useRef<Record<string, number>>({});

  // Debounce sync attempts
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !isOnline;
      setIsOnline(state.isConnected ?? false);
      
      if (state.isConnected && wasOffline && pendingChanges > 0) {
        // Debounce sync when coming back online
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(() => {
          syncNow();
        }, SYNC_DEBOUNCE_MS);
      }
    });

    loadPendingChanges();

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, pendingChanges]);

  const loadPendingChanges = async () => {
    try {
      const stored = await AsyncStorage.getItem('offline_actions');
      if (stored) {
        const actions = JSON.parse(stored) as OfflineAction[];
        setPendingChanges(actions.filter((a: OfflineAction) => !a.synced).length);
      }
    } catch (error) {
      logger.error('Error loading pending changes:', error);
    }
  };

  const queueAction = async (action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      synced: false,
    };

    try {
      const stored = await AsyncStorage.getItem('offline_actions');
      const actions = stored ? JSON.parse(stored) : [];
      actions.push(newAction);
      await AsyncStorage.setItem('offline_actions', JSON.stringify(actions));
      setPendingChanges((prev) => prev + 1);
      retryCounts.current[newAction.id] = 0;

      if (isOnline) {
        await syncAction(newAction);
      }
    } catch (error) {
      logger.error('Error queuing action:', error);
    }
  };

  const syncAction = async (action: OfflineAction, retryCount = 0): Promise<boolean> => {
    const baseUrl = getApiUrl('');
    
    try {
      const endpoint = `${baseUrl}/${action.entity}`;
      const method = action.type === 'create' ? 'POST' : action.type === 'update' ? 'PUT' : 'DELETE';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(action.data),
      });

      if (response.status === 401) {
        // Try to refresh token
        await refreshAuthToken();
        return false;
      }

      if (!response.ok && retryCount < MAX_RETRY_ATTEMPTS) {
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return syncAction(action, retryCount + 1);
      }

      return response.ok;
    } catch (error) {
      logger.error('Error syncing action:', error);
      
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return syncAction(action, retryCount + 1);
      }
      
      return false;
    }
  };

  const syncNow = useCallback(async () => {
    if (!isOnline || syncInProgress) return;

    setSyncInProgress(true);

    try {
      const stored = await AsyncStorage.getItem('offline_actions');
      if (!stored) {
        setSyncInProgress(false);
        return;
      }

      const actions = JSON.parse(stored) as OfflineAction[];
      const unsynced = actions.filter((a: OfflineAction) => !a.synced);

      for (const action of unsynced) {
        const success = await syncAction(action);
        
        if (success) {
          action.synced = true;
          retryCounts.current[action.id] = 0;
        } else {
          retryCounts.current[action.id] = (retryCounts.current[action.id] || 0) + 1;
          
          // Mark as failed if max retries exceeded
          if (retryCounts.current[action.id] >= MAX_RETRY_ATTEMPTS) {
            action.synced = true; // Mark as processed to avoid endless retrying
            logger.warn('Action exceeded max retries, marking as processed:', action.id);
          }
        }
      }

      await AsyncStorage.setItem('offline_actions', JSON.stringify(actions));
      
      const stillPending = actions.filter((a: OfflineAction) => !a.synced).length;
      setPendingChanges(stillPending);
      setLastSyncTime(new Date());
    } catch (error) {
      logger.error('Error during sync:', error);
    } finally {
      setSyncInProgress(false);
    }
  }, [isOnline, syncInProgress, token]);

  const clearPendingActions = async () => {
    await AsyncStorage.removeItem('offline_actions');
    setPendingChanges(0);
    retryCounts.current = {};
  };

  return {
    isOnline,
    syncInProgress,
    pendingChanges,
    lastSyncTime,
    queueAction,
    syncNow,
    clearPendingActions,
  };
};
