import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface PrivacySettings {
  analyticsEnabled: boolean;
  personalizedAds: boolean;
  dataCollection: boolean;
  crashReporting: boolean;
  marketingEmails: boolean;
}

export class PrivacyManager {
  private static instance: PrivacyManager;
  private settings: PrivacySettings = {
    analyticsEnabled: false,
    personalizedAds: false,
    dataCollection: false,
    crashReporting: true,
    marketingEmails: false,
  };

  static getInstance(): PrivacyManager {
    if (!PrivacyManager.instance) {
      PrivacyManager.instance = new PrivacyManager();
    }
    return PrivacyManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('privacy_settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.log('Error loading privacy settings:', error);
    }
  }

  async updateSettings(newSettings: Partial<PrivacySettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await AsyncStorage.setItem('privacy_settings', JSON.stringify(this.settings));
  }

  getSettings(): PrivacySettings {
    return { ...this.settings };
  }

  isAnalyticsEnabled(): boolean {
    return this.settings.analyticsEnabled;
  }

  isPersonalizedAdsEnabled(): boolean {
    return this.settings.personalizedAds;
  }

  isDataCollectionEnabled(): boolean {
    return this.settings.dataCollection;
  }

  // GDPR/CCPA compliance
  async exportUserData(userId: string): Promise<any> {
    // Export all user data for GDPR compliance
    const userData = await AsyncStorage.getItem(`user_${userId}`);
    return userData ? JSON.parse(userData) : null;
  }

  async deleteUserData(userId: string): Promise<void> {
    // Delete all user data for GDPR compliance
    await AsyncStorage.removeItem(`user_${userId}`);
    await AsyncStorage.removeItem(`game_data_${userId}`);
    await AsyncStorage.removeItem(`purchases_${userId}`);
  }
}

export const privacyManager = PrivacyManager.getInstance(); 