# React Native Expo Mobile - Implementation Plan

## Executive Summary

Based on the comprehensive audit report, this plan addresses all critical issues, missing features, and infrastructure gaps in the React Native Expo mobile application. The plan is organized into **6 phases** with clear, actionable steps.

---

## Phase 1: Critical Infrastructure Setup

### Objective: Create missing directories and establish shared utilities

### 1.1 Create Missing Directory Structure

**Files to create:**
- [`mobile/src/components/`](mobile/src/components) - Reusable UI components
- [`mobile/src/services/`](mobile/src/services) - API client and service layer
- [`mobile/src/utils/`](mobile/src/utils) - Utility functions and helpers
- [`mobile/src/constants/`](mobile/src/constants) - Constants, colors, theme

### 1.2 Create Core Components

**Priority Components:**
1. **ErrorBoundary** - Global error handling component
2. **LoadingSpinner** - Reusable loading indicator
3. **SkeletonLoader** - Skeleton screen for loading states
4. **EmptyState** - Placeholder for empty lists
5. **StatusBadge** - Standardized status badge component
6. **Button** - Custom button component with variants

### 1.3 Create Shared Utilities

**Files to create:**
- [`mobile/src/utils/format.ts`](mobile/src/utils/format.ts) - Date and number formatting
- [`mobile/src/utils/validation.ts`](mobile/src/utils/validation.ts) - Email, password validation
- [`mobile/src/utils/constants.ts`](mobile/src/utils/constants.ts) - Status mappings, color helpers
- [`mobile/src/utils/navigation.ts`](mobile/src/utils/navigation.ts) - Navigation type helpers

### 1.4 Create Constants File

**File:** [`mobile/src/constants/colors.ts`](mobile/src/constants/colors.ts)

```typescript
export const COLORS = {
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  secondary: '#10B981',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
};

export const STATUS_COLORS = {
  submitted: '#3B82F6',
  screening: '#F59E0B',
  interview: '#10B981',
  offer: '#10B981',
  rejected: '#EF4444',
  withdrawn: '#6B7280',
};

export const API_TIMEOUT = 30000;
export const MAX_RETRY_ATTEMPTS = 3;
export const SYNC_DEBOUNCE_MS = 2000;
```

---

## Phase 2: Environment Configuration

### Objective: Replace hardcoded values with environment variables

### 2.1 Create Environment Configuration

**File:** [`mobile/.env.example`](mobile/.env.example)

```env
# API Configuration
API_BASE_URL=https://api.simpleasthat.com
API_VERSION=v1

# Expo Configuration
EXPO_PROJECT_ID=your-project-id
EXPO_IOS_CLIENT_ID=your-ios-client-id

# Feature Flags
ENABLE_ANALYTICS=false
ENABLE_OFFLINE_MODE=true
```

**File:** [`mobile/src/config.ts`](mobile/src/config.ts)

```typescript
import Constants from 'expo-constants';

const config = {
  apiBaseUrl: Constants.manifest?.extra?.apiBaseUrl || process.env.API_BASE_URL,
  apiVersion: Constants.manifest?.extra?.apiVersion || 'v1',
  expoProjectId: Constants.manifest?.extra?.expoProjectId || Constants.expoConfig?.extra?.eas?.projectId,
  enableAnalytics: Constants.manifest?.extra?.enableAnalytics === 'true',
  enableOfflineMode: Constants.manifest?.extra?.enableOfflineMode !== 'false',
};

export const getApiUrl = (endpoint: string) => 
  `${config.apiBaseUrl}/${config.apiVersion}${endpoint}`;

export default config;
```

### 2.2 Update Configuration Files

**Files to update:**
- [`mobile/app.json`](mobile/app.json) - Replace placeholders with actual values
- [`mobile/eas.json`](mobile/eas.json) - Add proper configuration
- [`mobile/babel.config.js`](mobile/babel.config.js) - Add environment variable support

### 2.3 Update TypeScript Paths

**File:** [`mobile/tsconfig.json`](mobile/tsconfig.json) - Already configured, just needs directories created

---

## Phase 3: API Integration & Error Handling

### Objective: Replace mock data with real API calls and add proper error handling

### 3.1 Create API Client Service

**File:** [`mobile/src/services/api.ts`](mobile/src/services/api.ts)

```typescript
import { getApiUrl } from '../config';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

interface ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = getApiUrl('')) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, requireAuth = true } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (requireAuth && this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 401) {
        throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || 'Request failed',
          response.status,
          errorData.code
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network error', 0, 'NETWORK_ERROR');
    }
  }
}

export const apiClient = new ApiClient();
```

### 3.2 Create Authentication Service

**File:** [`mobile/src/services/authService.ts`](mobile/src/services/authService.ts)

```typescript
import apiClient from './api';
import { getApiUrl } from '../config';

export interface LoginParams {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const authService = {
  async login(params: LoginParams): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', { body: params });
  },

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    return apiClient.post('/auth/refresh', { 
      body: { refreshToken },
      requireAuth: false 
    });
  },

  async logout(): Promise<void> {
    return apiClient.post('/auth/logout');
  },
};
```

### 3.3 Create Job Service

**File:** [`mobile/src/services/jobService.ts`](mobile/src/services/jobService.ts)

```typescript
import apiClient from './api';

export interface JobSearchParams {
  query?: string;
  location?: string;
  type?: string;
  salary?: number;
  page?: number;
  limit?: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  matchScore: number;
  matchReasons: string[];
  postedAt: string;
  applyUrl: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const jobService = {
  async search(params: JobSearchParams): Promise<PaginatedResponse<Job>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, String(value));
    });
    return apiClient.get(`/jobs?${queryParams.toString()}`);
  },

  async getById(id: string): Promise<Job> {
    return apiClient.get(`/jobs/${id}`);
  },

  async saveJob(jobId: string): Promise<void> {
    return apiClient.post(`/jobs/${jobId}/save`);
  },

  async unsaveJob(jobId: string): Promise<void> {
    return apiClient.delete(`/jobs/${jobId}/save`);
  },
};
```

### 3.4 Create Error Handling Layer

**File:** [`mobile/src/utils/errorHandler.ts`](mobile/src/utils/errorHandler.ts)

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleApiError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  
  if (error instanceof Error) {
    if (error.message === 'Network error') {
      return new AppError(
        'Unable to connect. Please check your internet connection.',
        'NETWORK_ERROR',
        'high'
      );
    }
  }
  
  return new AppError(
    'Something went wrong. Please try again.',
    'UNKNOWN_ERROR',
    'medium'
  );
};
```

### 3.5 Update Auth Store

**File:** [`mobile/src/store/authStore.ts`](mobile/src/store/authStore.ts)

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';
import { handleApiError } from '../utils/errorHandler';
import { apiClient } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await authService.login({ email, password });
      
      await SecureStore.setItemAsync('token', response.token);
      await SecureStore.setItemAsync('refreshToken', response.refreshToken);
      
      apiClient.setToken(response.token);
      
      set({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw handleApiError(error);
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    }
    
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('refreshToken');
    apiClient.clearToken();
    
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  refreshToken: async () => {
    const { refreshToken: currentRefresh } = get();
    if (!currentRefresh) return;
    
    try {
      const response = await authService.refreshToken(currentRefresh);
      await SecureStore.setItemAsync('token', response.token);
      apiClient.setToken(response.token);
      set({ token: response.token });
    } catch {
      get().logout();
    }
  },

  updateUser: (data: Partial<User>) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...data } });
    }
  },
}));
```

---

## Phase 4: UI/UX Improvements

### Objective: Add loading states, accessibility, and polish

### 4.1 Add Loading States to Screens

**Files to update:**
- [`mobile/src/screens/JobSearchScreen.tsx`](mobile/src/screens/JobSearchScreen.tsx)
- [`mobile/src/screens/ApplicationsScreen.tsx`](mobile/src/screens/ApplicationsScreen.tsx)
- [`mobile/src/screens/DashboardScreen.tsx`](mobile/src/screens/DashboardScreen.tsx)

### 4.2 Implement Skeleton Loaders

**File:** [`mobile/src/components/SkeletonLoader.tsx`](mobile/src/components/SkeletonLoader.tsx)

```typescript
import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const SkeletonLoader: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const animatedValue = React.useMemo(() => new Animated.Value(0), []);
  
  React.useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.item}>
          <View style={styles.skeleton} />
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX }] },
            ]}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  item: {
    marginBottom: 16,
  },
  skeleton: {
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
```

### 4.3 Add Accessibility Features

**File:** [`mobile/src/components/AccessibleButton.tsx`](mobile/src/components/AccessibleButton.tsx)

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, AccessibilityProps } from 'react-native';

interface AccessibleButtonProps extends AccessibilityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant]]}
      onPress={onPress}
      accessibilityLabel={props.accessibilityLabel || title}
      accessibilityHint={props.accessibilityHint}
      accessibilityRole="button"
      {...props}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#4F46E5',
  },
  secondary: {
    backgroundColor: '#E5E7EB',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
```

### 4.4 Create Status Badge Component

**File:** [`mobile/src/components/StatusBadge.tsx`](mobile/src/components/StatusBadge.tsx)

```typescript
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { STATUS_COLORS } from '../constants/colors';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);
  const backgroundColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6B7280';

  return (
    <Text
      style={[styles.badge, { backgroundColor }]}
      accessibilityLabel={`Status: ${statusText}`}
    >
      {statusText}
    </Text>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
```

### 4.5 Consolidate Duplicate Functions

**Replace `getStatusColor()` functions in:**
- [`mobile/src/screens/DashboardScreen.tsx`](mobile/src/screens/DashboardScreen.tsx)
- [`mobile/src/screens/ApplicationsScreen.tsx`](mobile/src/screens/ApplicationsScreen.tsx)
- [`mobile/src/screens/JobDetailScreen.tsx`](mobile/src/screens/JobDetailScreen.tsx)

With import from [`mobile/src/constants/colors.ts`](mobile/src/constants/colors.ts)

---

## Phase 5: Missing Features Implementation

### Objective: Complete all incomplete features

### 5.1 Implement Saved Jobs

**Files to create/update:**
- [`mobile/src/services/savedJobService.ts`](mobile/src/services/savedJobService.ts)
- Update [`mobile/src/screens/JobSearchScreen.tsx`](mobile/src/screens/JobSearchScreen.tsx)
- Update [`mobile/src/types/index.ts`](mobile/src/types/index.ts)

### 5.2 Implement Document Upload

**Files to create:**
- [`mobile/src/components/DocumentPicker.tsx`](mobile/src/components/DocumentPicker.tsx)
- [`mobile/src/services/documentService.ts`](mobile/src/services/documentService.ts)
- Update [`mobile/src/screens/ProfileScreen.tsx`](mobile/src/screens/ProfileScreen.tsx)

### 5.3 Implement Job Sharing

**Files to create:**
- [`mobile/src/utils/share.ts`](mobile/src/utils/share.ts)
- Update [`mobile/src/screens/JobDetailScreen.tsx`](mobile/src/screens/JobDetailScreen.tsx)

```typescript
import { Share } from 'react-native';

export const shareJob = async (job: Job) => {
  await Share.share({
    message: `Check out this job: ${job.title} at ${job.company}\n\n${job.applyUrl}`,
    title: `Job: ${job.title}`,
  });
};
```

### 5.4 Implement Search Filters

**Files to create:**
- [`mobile/src/components/JobFilters.tsx`](mobile/src/components/JobFilters.tsx)
- Update [`mobile/src/screens/JobSearchScreen.tsx`](mobile/src/screens/JobSearchScreen.tsx)

### 5.5 Implement Notifications Center

**Files to create:**
- [`mobile/src/screens/NotificationsScreen.tsx`](mobile/src/screens/NotificationsScreen.tsx)
- Update navigation in [`mobile/src/navigation/RootNavigator.tsx`](mobile/src/navigation/RootNavigator.tsx)

### 5.6 Implement Pagination

**Files to update:**
- [`mobile/src/screens/JobSearchScreen.tsx`](mobile/src/screens/JobSearchScreen.tsx)
- [`mobile/src/screens/ApplicationsScreen.tsx`](mobile/src/screens/ApplicationsScreen.tsx)

```typescript
const loadMoreJobs = async () => {
  if (isLoadingMore || !hasMore) return;
  
  setIsLoadingMore(true);
  const nextPage = page + 1;
  const newJobs = await jobService.search({ ...params, page: nextPage });
  
  setJobs((prev) => [...prev, ...newJobs.data]);
  setPage(nextPage);
  setHasMore(newJobs.hasMore);
  setIsLoadingMore(false);
};
```

---

## Phase 6: Testing & Polish

### Objective: Add tests, logging, and final polish

### 6.1 Set Up Testing Framework

**File:** [`mobile/package.json`](mobile/package.json)

Add to dependencies:
```json
{
  "devDependencies": {
    "@testing-library/react-native": "^12.4.0",
    "@testing-library/jest-dom": "^6.4.0",
    "jest": "^29.7.0",
    "jest-expo": "~50.0.0"
  }
}
```

**File:** [`mobile/jest.config.js`](mobile/jest.config.js)

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  testPathIgnorePatterns: ['node_modules'],
};
```

### 6.2 Create Unit Tests

**Files to create:**
- [`mobile/src/store/authStore.test.ts`](mobile/src/store/authStore.test.ts)
- [`mobile/src/utils/validation.test.ts`](mobile/src/utils/validation.test.ts)
- [`mobile/src/services/api.test.ts`](mobile/src/services/api.test.ts)

### 6.3 Set Up Logging Service

**File:** [`mobile/src/utils/logger.ts`](mobile/src/utils/logger.ts)

```typescript
interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

const logs: LogEntry[] = [];

export const logger = {
  debug: (message: string, data?: unknown) => {
    console.debug(message, data);
    logs.push({ timestamp: new Date(), level: 'debug', message, data });
  },
  
  info: (message: string, data?: unknown) => {
    console.info(message, data);
    logs.push({ timestamp: new Date(), level: 'info', message, data });
  },
  
  warn: (message: string, data?: unknown) => {
    console.warn(message, data);
    logs.push({ timestamp: new Date(), level: 'warn', message, data });
  },
  
  error: (message: string, data?: unknown) => {
    console.error(message, data);
    logs.push({ timestamp: new Date(), level: 'error', message, data });
  },
  
  getLogs: () => logs.slice(-100),
};
```

### 6.4 Add Analytics (Optional)

**File:** [`mobile/src/utils/analytics.ts`](mobile/src/utils/analytics.ts)

```typescript
import * as Amplitude from 'expo-analytics-amplitude';

export const analytics = {
  trackEvent: async (eventName: string, properties?: Record<string, unknown>) => {
    if (__DEV__) {
      console.log('Analytics:', eventName, properties);
      return;
    }
    await Amplitude.logEventWithPropertiesAsync(eventName, properties);
  },
  
  setUserId: async (userId: string) => {
    if (!__DEV__) {
      await Amplitude.setUserIdAsync(userId);
    }
  },
};
```

### 6.5 Update App Initialization

**File:** [`mobile/App.tsx`](mobile/App.tsx)

```typescript
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { useNotificationSetup } from './src/hooks/useNotifications';
import { ErrorBoundary } from './src/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const { isLoading } = useAuthStore();
  const { setupNotifications } = useNotificationSetup();

  useEffect(() => {
    const initialize = async () => {
      try {
        await setupNotifications();
      } catch (error) {
        console.error('Failed to setup notifications:', error);
      }
      setIsReady(true);
      await SplashScreen.hideAsync();
    };

    if (!isLoading) {
      initialize();
    }
  }, [isLoading, setupNotifications]);

  if (!isReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <RootNavigator />
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}
```

---

## Implementation Order

### Week 1: Infrastructure & Configuration
1. Create missing directories (components, services, utils, constants)
2. Create environment configuration (.env.example, config.ts)
3. Update app.json with real values
4. Create constants/colors.ts

### Week 2: API Integration
1. Create API client service
2. Create authService and jobService
3. Update authStore with proper error handling
4. Update useOfflineSync with proper API endpoints

### Week 3: UI/UX Improvements
1. Create reusable components (SkeletonLoader, StatusBadge, AccessibleButton)
2. Update all screens with loading states
3. Add accessibility to all interactive elements
4. Consolidate duplicate functions

### Week 4: Feature Completion
1. Implement saved jobs
2. Implement document upload
3. Implement job sharing
4. Implement search filters
5. Implement pagination

### Week 5: Testing & Polish
1. Set up Jest testing framework
2. Create unit tests for stores and utilities
3. Set up logging service
4. Add analytics (optional)
5. Final code review and cleanup

---

## Files to Create Summary

```
mobile/src/
├── components/
│   ├── index.ts
│   ├── ErrorBoundary.tsx
│   ├── LoadingSpinner.tsx
│   ├── SkeletonLoader.tsx
│   ├── EmptyState.tsx
│   ├── StatusBadge.tsx
│   ├── AccessibleButton.tsx
│   └── DocumentPicker.tsx
├── services/
│   ├── index.ts
│   ├── api.ts
│   ├── authService.ts
│   ├── jobService.ts
│   └── savedJobService.ts
├── utils/
│   ├── index.ts
│   ├── format.ts
│   ├── validation.ts
│   ├── errorHandler.ts
│   ├── constants.ts
│   ├── share.ts
│   └── logger.ts
├── constants/
│   ├── index.ts
│   └── colors.ts
└── config.ts
```

## Files to Update Summary

```
mobile/
├── app.json (replace placeholders)
├── eas.json (update configuration)
├── package.json (add dependencies)
├── tsconfig.json (verify paths)
├── babel.config.js (env support)
└── src/
    ├── store/authStore.ts
    ├── hooks/useOfflineSync.ts
    ├── hooks/useNotifications.ts
    ├── screens/
    │   ├── DashboardScreen.tsx
    │   ├── JobSearchScreen.tsx
    │   ├── ApplicationsScreen.tsx
    │   ├── JobDetailScreen.tsx
    │   └── ProfileScreen.tsx
    └── navigation/RootNavigator.tsx
```

---

## Dependencies to Add

```bash
npm install expo-analytics-amplitude
npm install --save-dev jest @testing-library/react-native @testing-library/jest-dom
```

---

## Success Criteria

- ✅ All hardcoded API endpoints replaced with environment variables
- ✅ Proper error handling with user-friendly messages
- ✅ Loading states on all screens
- ✅ Accessibility features on all interactive elements
- ✅ API calls replacing mock data
- ✅ Pagination implemented for all list screens
- ✅ Unit tests for critical functionality
- ✅ Logging service for debugging
- ✅ All missing features implemented
