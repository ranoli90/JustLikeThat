/**
 * Apply as a Service - Redux Store
 * State management with Redux Toolkit and Redux Persist for offline support
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

import authSlice from './slices/authSlice';
import jobsSlice from './slices/jobsSlice';
import applicationsSlice from './slices/applicationsSlice';
import notificationsSlice from './slices/notificationsSlice';

// Combine reducers
const rootReducer = combineReducers({
  auth: authSlice,
  jobs: jobsSlice,
  applications: applicationsSlice,
  notifications: notificationsSlice,
});

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'jobs', 'applications'], // Reducers to persist
  blacklist: ['notifications'], // Reducers to not persist
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

// Create persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export slices
export { default as authSlice, setUser, setLoading, setError, logout } from './slices/authSlice';
export { default as jobsSlice, setJobs, setLoading as setJobsLoading, setError as setJobsError } from './slices/jobsSlice';
export { default as applicationsSlice, setApplications, setLoading as setAppsLoading } from './slices/applicationsSlice';
export { default as notificationsSlice, setNotifications } from './slices/notificationsSlice';
