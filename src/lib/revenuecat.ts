import Purchases, {
  PurchasesOfferings,
  CustomerInfo,
  PurchasesEntitlementInfos,
  LOG_LEVEL,
  PurchasesPackage,
  PurchasesError,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'revenuecat_entitlements_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface CachedEntitlements {
  entitlements: PurchasesEntitlementInfos;
  timestamp: number;
  userId?: string;
}

class RevenueCatService {
  private static instance: RevenueCatService;
  private isInitialized = false;
  private currentUserId?: string;

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized && this.currentUserId === userId) {
      return;
    }

    try {
      const apiKey = Platform.select({
        ios: process.env.REVENUECAT_API_KEY_IOS,
        android: process.env.REVENUECAT_API_KEY_ANDROID,
      });

      if (!apiKey) {
        console.warn('RevenueCat API key not found. Subscriptions will be disabled.');
        return;
      }

      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      } else {
        Purchases.setLogLevel(LOG_LEVEL.ERROR);
      }

      // Configure RevenueCat
      await Purchases.configure({
        apiKey,
        appUserID: userId || null,
        observerMode: false,
        useAmazon: false,
      });

      this.isInitialized = true;
      this.currentUserId = userId;

      // Set up listener for customer info updates
      Purchases.addCustomerInfoUpdateListener((info) => {
        this.cacheEntitlements(info.entitlements);
      });

      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.isInitialized) {
      console.warn('RevenueCat not initialized');
      return null;
    }

    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Error getting customer info:', error);

      // Fall back to cached data for offline support
      const cached = await this.getCachedEntitlements();
      if (cached && this.isCacheValid(cached)) {
        // Return a partial CustomerInfo object with cached entitlements
        return {
          entitlements: cached.entitlements,
        } as CustomerInfo;
      }

      return null;
    }
  }

  async getOfferings(): Promise<PurchasesOfferings | null> {
    if (!this.isInitialized) {
      console.warn('RevenueCat not initialized');
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error) {
      console.error('Error getting offerings:', error);
      return null;
    }
  }

  async purchasePackage(purchasePackage: PurchasesPackage): Promise<CustomerInfo | null> {
    if (!this.isInitialized) {
      console.warn('RevenueCat not initialized');
      return null;
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(purchasePackage);
      await this.cacheEntitlements(customerInfo.entitlements);
      return customerInfo;
    } catch (error) {
      const purchasesError = error as PurchasesError;

      // Handle specific error codes
      if (purchasesError.code === PURCHASES_ERROR_CODE.USER_CANCELLED) {
        console.log('User cancelled purchase');
      } else if (purchasesError.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED) {
        console.log('Product already purchased');
        // Restore purchases to refresh entitlements
        return await this.restorePurchases();
      } else {
        console.error('Purchase error:', purchasesError);
      }

      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo | null> {
    if (!this.isInitialized) {
      console.warn('RevenueCat not initialized');
      return null;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      await this.cacheEntitlements(customerInfo.entitlements);
      return customerInfo;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  }

  async checkEntitlement(entitlementId: string): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    if (!customerInfo) return false;

    const entitlement = customerInfo.entitlements.active[entitlementId];
    return entitlement?.isActive === true;
  }

  async getActiveEntitlements(): Promise<string[]> {
    const customerInfo = await this.getCustomerInfo();
    if (!customerInfo) return [];

    return Object.keys(customerInfo.entitlements.active).filter(
      (key) => customerInfo.entitlements.active[key].isActive
    );
  }

  async manageSubscriptions(): Promise<void> {
    if (Platform.OS === 'ios') {
      // iOS: Open App Store subscriptions management
      await Purchases.showManageSubscriptions();
    } else {
      // Android: RevenueCat doesn't support this directly, use deep link
      const { Linking } = require('react-native');
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  }

  // Caching for offline support
  private async cacheEntitlements(entitlements: PurchasesEntitlementInfos): Promise<void> {
    try {
      const cache: CachedEntitlements = {
        entitlements,
        timestamp: Date.now(),
        userId: this.currentUserId,
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching entitlements:', error);
    }
  }

  private async getCachedEntitlements(): Promise<CachedEntitlements | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      return JSON.parse(cached) as CachedEntitlements;
    } catch (error) {
      console.error('Error getting cached entitlements:', error);
      return null;
    }
  }

  private isCacheValid(cache: CachedEntitlements): boolean {
    const now = Date.now();
    const age = now - cache.timestamp;
    return age < CACHE_TTL && cache.userId === this.currentUserId;
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Helper methods for subscription status
  async getSubscriptionStatus(): Promise<{
    isActive: boolean;
    expiresAt?: string;
    willRenew?: boolean;
    platform?: string;
  }> {
    const customerInfo = await this.getCustomerInfo();
    if (!customerInfo) {
      return { isActive: false };
    }

    const goldVault = customerInfo.entitlements.active['gold_vault'];
    if (!goldVault || !goldVault.isActive) {
      return { isActive: false };
    }

    return {
      isActive: true,
      expiresAt: goldVault.expirationDate || undefined,
      willRenew: goldVault.willRenew,
      platform: goldVault.store,
    };
  }

  // Development/Testing helpers
  async syncPurchases(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await Purchases.syncPurchases();
      console.log('Purchases synced successfully');
    } catch (error) {
      console.error('Error syncing purchases:', error);
    }
  }

  async logOut(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await Purchases.logOut();
      await this.clearCache();
      this.currentUserId = undefined;
      console.log('Logged out from RevenueCat');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  async openManageSubscriptions(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      // RevenueCat SDK doesn't have direct subscription management
      // On iOS, this would open Settings > Apple ID > Subscriptions
      // On Android, this would open Google Play subscriptions
      if (Platform.OS === 'ios') {
        // In production, you'd use Linking to open the subscription management URL
        console.log('Opening iOS subscription management...');
      } else if (Platform.OS === 'android') {
        // In production, you'd use Linking to open the Google Play subscription URL
        console.log('Opening Android subscription management...');
      }
    } catch (error) {
      console.error('Error opening subscription management:', error);
      throw error;
    }
  }
}

export const revenueCatService = RevenueCatService.getInstance();
export const RevenueCatManager = RevenueCatService.getInstance();

// Export types for use in other files
export type {
  CustomerInfo,
  PurchasesPackage,
  PurchasesOfferings,
  PurchasesEntitlementInfos,
} from 'react-native-purchases';
