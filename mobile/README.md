# Apply as a Service - Mobile App

React Native mobile application built with Expo for iOS and Android.

## Features

- **Native Authentication**: Face ID, Touch ID, and fingerprint support
- **Push Notifications**: Real-time job matches, application updates, and interview reminders
- **Offline Support**: Work offline with automatic sync when reconnected
- **Job Search**: Browse and search jobs with advanced filters
- **Application Tracking**: Track all your job applications in one place
- **Interview Preparation**: Practice questions and track upcoming interviews
- **Profile Management**: Manage your profile, preferences, and documents

## Tech Stack

- **Framework**: React Native with Expo 50
- **Navigation**: React Navigation (Native Stack + Bottom Tabs)
- **State Management**: Zustand
- **Storage**: AsyncStorage + SecureStore
- **Authentication**: Expo LocalAuthentication + SecureStore
- **Push Notifications**: Expo Notifications
- **Offline Sync**: NetInfo + AsyncStorage queue system
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- For iOS: macOS with Xcode
- For Android: Android Studio

### Installation

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
API_URL=https://api.simpleasthat.com
EXPO_PROJECT_ID=your-project-id
```

## Project Structure

```
mobile/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/         # App screens
│   ├── navigation/      # Navigation configuration
│   ├── store/           # Zustand state stores
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and external services
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── assets/          # Images, fonts, etc.
├── App.tsx              # App entry point
├── app.json             # Expo configuration
├── babel.config.js      # Babel configuration
├── tsconfig.json        # TypeScript configuration
└── eas.json             # EAS Build configuration
```

## Deployment

### Development Build

```bash
# Create development build
eas build --profile development
```

### Preview Build

```bash
# Create preview build for testing
eas build --profile preview
```

### Production Build

```bash
# Create production build
eas build --profile production

# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

## App Store Configuration

### iOS

1. Configure app identifier and capabilities in Apple Developer Portal
2. Set up Push Notification certificates
3. Configure associated domains for universal links
4. Submit App Store metadata and screenshots

### Android

1. Configure app identifier in Google Play Console
2. Set up Firebase Cloud Messaging for push notifications
3. Configure deep links for job sharing
4. Submit Play Store listing

## Key Features Implementation

### Biometric Authentication

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

// Check if biometrics are available
const hasHardware = await LocalAuthentication.hasHardwareAsync();
const isEnrolled = await LocalAuthentication.isEnrolledAsync();

// Authenticate
const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Authenticate to access your job dashboard',
});
```

### Push Notifications

```typescript
import * as Notifications from 'expo-notifications';

// Request permissions
const { status } = await Notifications.requestPermissionsAsync();

// Get push token
const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-project-id',
});
```

### Offline Sync

```typescript
import NetInfo from '@react-native-community/netinfo';

// Listen for network changes
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    // Sync pending changes
    syncPendingChanges();
  }
});
```

## Performance Optimization

- **Memoization**: React.memo and useMemo for expensive computations
- **Virtual Lists**: FlatList with proper key extraction
- **Image Optimization**: Use appropriate sizes and caching
- **Code Splitting**: Lazy loading of screens
- **Bundle Optimization**: Remove unused dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
