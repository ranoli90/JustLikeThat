import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from './src/store/authStore';
import { useNotificationSetup } from './src/hooks/useNotifications';
import { useOfflineSync } from './src/hooks/useOfflineSync';
import RootNavigator from './src/navigation/RootNavigator';
import { LogBox } from 'react-native';

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
  const { initializeOfflineSupport } = useOfflineSync();

  useEffect(() => {
    const initializeApp = async () => {
      await initializeAuth();
      await setupNotifications();
      await initializeOfflineSupport();
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (!authLoading && !notificationsLoading) {
      SplashScreen.hideAsync();
    }
  }, [authLoading, notificationsLoading]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default gestureHandlerRootHOC(App);
