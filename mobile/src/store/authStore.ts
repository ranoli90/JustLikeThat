import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authService, apiClient } from '../services';
import { handleApiError } from '../utils';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
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
  refreshAuthToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
  biometricsEnabled: false,
  lastSyncTime: null,

  initializeAuth: async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('auth_token');
      const storedRefreshToken = await SecureStore.getItemAsync('refresh_token');
      const storedUser = await AsyncStorage.getItem('user_data');
      const biometricsEnabled = (await AsyncStorage.getItem('biometrics_enabled')) === 'true';

      if (storedToken && storedUser) {
        apiClient.setToken(storedToken);
        const user = JSON.parse(storedUser);
        set({
          token: storedToken,
          refreshToken: storedRefreshToken,
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
      const response = await authService.login({ email, password });
      
      await SecureStore.setItemAsync('auth_token', response.token);
      await SecureStore.setItemAsync('refresh_token', response.refreshToken);
      apiClient.setToken(response.token);
      
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      
      set({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error) {
      const appError = handleApiError(error);
      console.error('Login error:', appError.message);
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
        const storedRefreshToken = await SecureStore.getItemAsync('refresh_token');
        const storedUser = await AsyncStorage.getItem('user_data');
        
        if (storedToken && storedUser) {
          apiClient.setToken(storedToken);
          const user = JSON.parse(storedUser);
          set({
            user,
            token: storedToken,
            refreshToken: storedRefreshToken,
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
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    }
    
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await AsyncStorage.removeItem('user_data');
    apiClient.clearToken();
    
    set({
      user: null,
      token: null,
      refreshToken: null,
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

  refreshAuthToken: async () => {
    const currentRefresh = get().refreshToken;
    if (!currentRefresh) return;
    
    try {
      const response = await authService.refreshToken(currentRefresh);
      await SecureStore.setItemAsync('auth_token', response.token);
      apiClient.setToken(response.token);
      set({ token: response.token, lastSyncTime: new Date() });
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      get().logout();
    }
  },
}));
