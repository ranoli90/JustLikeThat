import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from './src/store/authStore';
import { useNotificationSetup } from './src/hooks/useNotifications';
import { useOfflineSyncManager } from './src/hooks/useOfflineSync';
import RootNavigator from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { LoadingSpinner } from './src/components/LoadingSpinner';
import { LogBox } from 'react-native';
import { logger } from './src/utils';

// Ignore specific warnings that are not critical
LogBox.ignoreLogs([
  'AsyncStorage',
  'expo-notifications',
  'Non-serializable values were found in the navigation state',
]);

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const App: React.FC = () => {
  const { initializeAuth, isLoading: authLoading } = useAuthStore();
  const { setupNotifications, isLoading: notificationsLoading } = useNotificationSetup();
  const { syncNow } = useOfflineSyncManager();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeAuth();
        await setupNotifications();
        // Initialize offline sync (this sets up listeners but doesn't await)
        syncNow();
      } catch (error) {
        logger.error('App initialization error:', error);
      } finally {
        setIsAppReady(true);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (isAppReady && !authLoading && !notificationsLoading) {
      SplashScreen.hideAsync().catch((error) => {
        logger.error('Failed to hide splash screen:', error);
      });
    }
  }, [isAppReady, authLoading, notificationsLoading]);

  if (!isAppReady) {
    return <LoadingSpinner text="Loading..." />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default gestureHandlerRootHOC(App);
