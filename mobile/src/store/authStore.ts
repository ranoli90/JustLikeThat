import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  biometricsEnabled: boolean;
  lastSyncTime: Date | null;
  
  // Actions
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  logout: () => Promise<void>;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  biometricsEnabled: false,
  lastSyncTime: null,

  initializeAuth: async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');
      const biometricsEnabled = (await AsyncStorage.getItem('biometrics_enabled')) === 'true';

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        set({
          token: storedToken,
          user,
          isAuthenticated: true,
          biometricsEnabled,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // Simulate API call - replace with actual API
      const response = await fetch('https://api.simpleasthat.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        await SecureStore.setItemAsync('auth_token', data.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
        
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  loginWithBiometrics: async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your job dashboard',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        const storedToken = await SecureStore.getItemAsync('auth_token');
        const storedUser = await AsyncStorage.getItem('user_data');
        
        if (storedToken && storedUser) {
          const user = JSON.parse(storedUser);
          set({
            user,
            token: storedToken,
            isAuthenticated: true,
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await AsyncStorage.removeItem('user_data');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      biometricsEnabled: false,
    });
  },

  enableBiometrics: async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication',
      });

      if (result.success) {
        await AsyncStorage.setItem('biometrics_enabled', 'true');
        set({ biometricsEnabled: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Enable biometrics error:', error);
      return false;
    }
  },

  disableBiometrics: async () => {
    await AsyncStorage.setItem('biometrics_enabled', 'false');
    set({ biometricsEnabled: false });
  },

  updateUser: async (userData: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },

  refreshToken: async () => {
    const currentToken = get().token;
    if (currentToken) {
      try {
        const response = await fetch('https://api.simpleasthat.com/auth/refresh', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          await SecureStore.setItemAsync('auth_token', data.token);
          set({ token: data.token, lastSyncTime: new Date() });
        }
      } catch (error) {
        console.error('Token refresh error:', error);
      }
    }
  },
}));
