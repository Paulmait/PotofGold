import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class DeviceTracker {
  private deviceId: string | null = null;

  /**
   * Get or create a unique device ID
   */
  async getDeviceId(): Promise<string> {
    try {
      // Check if we already have a device ID in memory
      if (this.deviceId) {
        return this.deviceId;
      }

      // Try to get existing device ID from storage
      const storedId = await AsyncStorage.getItem('device_id');
      if (storedId) {
        this.deviceId = storedId;
        return storedId;
      }

      // Generate a new device ID
      const newId = await this.generateDeviceId();
      await AsyncStorage.setItem('device_id', newId);
      await AsyncStorage.setItem('device_first_seen', new Date().toISOString());

      this.deviceId = newId;
      return newId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      // Fallback to a simple timestamp-based ID
      const fallbackId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.deviceId = fallbackId;
      return fallbackId;
    }
  }

  /**
   * Generate a unique device ID
   */
  private async generateDeviceId(): Promise<string> {
    // Generate UUID without crypto dependency
    return `${Platform.OS}_${this.generateUUID()}`;
  }

  /**
   * Generate a UUID v4-like string
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Check if onboarding has been completed on this device
   */
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const deviceId = await this.getDeviceId();
      const onboardingStatus = await AsyncStorage.getItem('hasSeenOnboarding');
      const onboardingDeviceId = await AsyncStorage.getItem('onboarding_device_id');

      // Check if onboarding was completed and it was on this device
      return onboardingStatus === 'true' && onboardingDeviceId === deviceId;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // If we can't determine, check simple flag as fallback
      const status = await AsyncStorage.getItem('hasSeenOnboarding');
      return status === 'true';
    }
  }

  /**
   * Mark onboarding as completed for this device
   */
  async markOnboardingCompleted(): Promise<void> {
    try {
      const deviceId = await this.getDeviceId();
      await AsyncStorage.multiSet([
        ['hasSeenOnboarding', 'true'],
        ['onboarding_device_id', deviceId],
        ['onboarding_completed_at', new Date().toISOString()],
      ]);
      console.log(`Onboarding marked as completed for device: ${deviceId}`);
    } catch (error) {
      console.error('Error marking onboarding as completed:', error);
      // Fallback to simple flag
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    }
  }

  /**
   * Get device analytics data
   */
  async getDeviceAnalytics(): Promise<any> {
    try {
      const deviceId = await this.getDeviceId();
      const firstSeen = await AsyncStorage.getItem('device_first_seen');
      const lastSeen = new Date().toISOString();

      // Update last seen
      await AsyncStorage.setItem('device_last_seen', lastSeen);

      // Get session count
      const sessionCountStr = await AsyncStorage.getItem('device_session_count');
      const sessionCount = sessionCountStr ? parseInt(sessionCountStr, 10) + 1 : 1;
      await AsyncStorage.setItem('device_session_count', sessionCount.toString());

      return {
        deviceId,
        platform: Platform.OS,
        firstSeen,
        lastSeen,
        sessionCount,
        screenWidth: Platform.OS === 'web' ? window.innerWidth : undefined,
        screenHeight: Platform.OS === 'web' ? window.innerHeight : undefined,
      };
    } catch (error) {
      console.error('Error getting device analytics:', error);
      return null;
    }
  }

  /**
   * Clear all device tracking data (for testing)
   */
  async clearDeviceData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'device_id',
        'device_first_seen',
        'device_last_seen',
        'device_session_count',
        'hasSeenOnboarding',
        'onboarding_device_id',
        'onboarding_completed_at',
      ]);
      this.deviceId = null;
      console.log('Device tracking data cleared');
    } catch (error) {
      console.error('Error clearing device data:', error);
    }
  }
}

// Export singleton instance
export const deviceTracker = new DeviceTracker();

// Export convenience functions
export const getDeviceId = () => deviceTracker.getDeviceId();
export const hasCompletedOnboarding = () => deviceTracker.hasCompletedOnboarding();
export const markOnboardingCompleted = () => deviceTracker.markOnboardingCompleted();
export const getDeviceAnalytics = () => deviceTracker.getDeviceAnalytics();
