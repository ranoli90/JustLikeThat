import { Alert, Platform } from 'react-native';

/**
 * Centralized notification helpers to replace alert/confirm/prompt
 * Uses React Native's Alert API for cross-platform compatibility
 */

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * Display an informational alert
 */
export function info(title: string, message?: string): void {
  Alert.alert(title, message, [{ text: 'OK' }]);
}

/**
 * Display an error alert
 */
export function error(title: string, message?: string): void {
  Alert.alert(title, message, [{ text: 'OK' }]);
}

/**
 * Display a success alert
 */
export function success(title: string, message?: string): void {
  Alert.alert(title, message, [{ text: 'OK' }]);
}

/**
 * Display a confirmation alert
 * @returns Promise<boolean> - true if confirmed, false if cancelled
 */
export function confirm(
  title: string,
  message?: string,
  confirmText: string = 'Confirm',
  cancelText: string = 'Cancel',
): Promise<boolean> {
  return new Promise((resolve) => {
    // eslint-disable-next-line no-alert
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, onPress: () => resolve(false), style: 'cancel' },
        { text: confirmText, onPress: () => resolve(true), style: 'default' },
      ],
      { cancelable: false },
    );
  });
}

/**
 * Display a prompt alert
 * @returns Promise<string | null> - the input text if submitted, null if cancelled
 */
export function prompt(
  title: string,
  message?: string,
  placeholder: string = 'Enter value',
  defaultValue: string = '',
): Promise<string | null> {
  return new Promise((resolve) => {
    if (Platform.OS === 'ios') {
      // eslint-disable-next-line no-alert
      Alert.alert(
        title,
        message,
        [
          { text: 'Cancel', onPress: () => resolve(null), style: 'cancel' },
          {
            text: 'OK',
            onPress: (text?: string) => resolve(text ?? defaultValue),
            style: 'default',
          },
        ],
        { cancelable: false, type: 'plain-text-input' },
      );
    } else {
      // Android doesn't support native prompt, use alert with input handling
      // For now, return empty string as Android doesn't have native prompt
      // eslint-disable-next-line no-alert
      Alert.alert(
        title,
        'Text input prompt is not fully supported on Android. Returning empty string.',
        [{ text: 'OK', onPress: () => resolve('') }],
      );
    }
  });
}

/**
 * Display a destructive confirmation alert (for dangerous actions)
 * @returns Promise<boolean> - true if confirmed, false if cancelled
 */
export function destructiveConfirm(
  title: string,
  message?: string,
  confirmText: string = 'Delete',
  cancelText: string = 'Cancel',
): Promise<boolean> {
  return new Promise((resolve) => {
    // eslint-disable-next-line no-alert
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, onPress: () => resolve(false), style: 'cancel' },
        { text: confirmText, onPress: () => resolve(true), style: 'destructive' },
      ],
      { cancelable: false },
    );
  });
}
