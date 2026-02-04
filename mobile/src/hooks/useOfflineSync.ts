import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineAction, SyncStatus } from '../types';
import { useAuthStore } from '../store/authStore';

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
  const { token, refreshToken } = useAuthStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
      if (state.isConnected && pendingChanges > 0) {
        syncNow();
      }
    });

    loadPendingChanges();

    return () => unsubscribe();
  }, []);

  const loadPendingChanges = async () => {
    try {
      const stored = await AsyncStorage.getItem('offline_actions');
      if (stored) {
        const actions = JSON.parse(stored) as OfflineAction[];
        setPendingChanges(actions.filter((a: OfflineAction) => !a.synced).length);
      }
    } catch (error) {
      console.error('Error loading pending changes:', error);
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

      if (isOnline) {
        await syncAction(newAction);
      }
    } catch (error) {
      console.error('Error queuing action:', error);
    }
  };

  const syncAction = async (action: OfflineAction): Promise<boolean> => {
    try {
      const endpoint = `https://api.simpleasthat.com/${action.entity}`;
      
      const response = await fetch(endpoint, {
        method: action.type === 'create' ? 'POST' : action.type === 'update' ? 'PUT' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(action.data),
      });

      if (response.status === 401) {
        await refreshToken();
        return false;
      }

      return response.ok;
    } catch (error) {
      console.error('Error syncing action:', error);
      return false;
    }
  };

  const syncNow = async () => {
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
        }
      }

      await AsyncStorage.setItem('offline_actions', JSON.stringify(actions));
      
      const stillPending = actions.filter((a: OfflineAction) => !a.synced).length;
      setPendingChanges(stillPending);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  const clearPendingActions = async () => {
    await AsyncStorage.removeItem('offline_actions');
    setPendingChanges(0);
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
