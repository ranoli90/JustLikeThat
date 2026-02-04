import Constants from 'expo-constants';

const manifest = Constants.expoConfig?.extra || Constants.manifest?.extra || {};

const config = {
  apiBaseUrl: process.env.API_BASE_URL || 'https://api.simpleasthat.com',
  apiVersion: process.env.API_VERSION || 'v1',
  expoProjectId: manifest.eas?.projectId || manifest.expoProjectId || '',
  enableAnalytics: manifest.enableAnalytics === 'true',
  enableOfflineMode: manifest.enableOfflineMode !== 'false',
};

export const getApiUrl = (endpoint: string): string => {
  return `${config.apiBaseUrl}/${config.apiVersion}${endpoint}`;
};

export default config;
