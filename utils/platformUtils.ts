import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Platform-safe haptic feedback utilities
 * Prevents crashes on web where haptics are not supported
 */

export const triggerHapticLight = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Silently fail on unsupported devices
  }
};

export const triggerHapticMedium = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    // Silently fail on unsupported devices
  }
};

export const triggerHapticHeavy = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    // Silently fail on unsupported devices
  }
};

export const triggerHapticSuccess = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    // Silently fail on unsupported devices
  }
};

export const triggerHapticWarning = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    // Silently fail on unsupported devices
  }
};

export const triggerHapticError = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    // Silently fail on unsupported devices
  }
};

export const triggerHapticSelection = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    // Silently fail on unsupported devices
  }
};

/**
 * Check if current platform supports native features
 */
export const platformCapabilities = {
  hasHaptics: Platform.OS !== 'web',
  hasScreenOrientation: Platform.OS !== 'web',
  hasNativeAudio: Platform.OS !== 'web',
  hasPushNotifications: Platform.OS !== 'web',
  hasInAppPurchases: Platform.OS !== 'web',
  isWeb: Platform.OS === 'web',
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
};

/**
 * Safe screen orientation lock (no-op on web)
 */
export const lockToPortrait = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    const ScreenOrientation = require('expo-screen-orientation');
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  } catch (error) {
    // Silently fail if not available
  }
};

export const unlockOrientation = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    const ScreenOrientation = require('expo-screen-orientation');
    await ScreenOrientation.unlockAsync();
  } catch (error) {
    // Silently fail if not available
  }
};
