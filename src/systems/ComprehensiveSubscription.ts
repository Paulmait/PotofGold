/**
 * Comprehensive Subscription Management System
 * One-click cancellation, transparent billing, and player-friendly features
 */

import Purchases, { 
  CustomerInfo, 
  PurchasesPackage,
  PurchasesEntitlementInfo 
} from 'react-native-purchases';
import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly' | 'weekly';
  benefits: SubscriptionBenefit[];
  savingsPercent?: number;
  trialDays?: number;
  popular?: boolean;
}

export interface SubscriptionBenefit {
  id: string;
  name: string;
  description: string;
  icon: string;
  value?: number | string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier?: SubscriptionTier;
  expiresAt?: string;
  willRenew: boolean;
  managementUrl: string;
  cancelUrl: string;
  gracePeriod: boolean;
  trialActive: boolean;
  trialEndsAt?: string;
  billingHistory: BillingRecord[];
  totalSpent: number;
}

export interface BillingRecord {
  date: string;
  amount: number;
  tier: string;
  transactionId: string;
  refunded?: boolean;
}

class ComprehensiveSubscriptionSystem {
  private customerInfo: CustomerInfo | null = null;
  private subscriptionStatus: SubscriptionStatus | null = null;
  private readonly ENTITLEMENT_IDS = {
    vip: 'vip_access',
    premium: 'premium_features',
    battlepass: 'battle_pass_premium',
    noads: 'remove_ads'
  };

  async initialize(userId: string) {
    try {
      // Initialize RevenueCat
      await Purchases.logIn(userId);
      this.customerInfo = await Purchases.getCustomerInfo();
      await this.updateSubscriptionStatus();
      await this.setupListeners();
      await this.checkForExpiredTrials();
    } catch (error) {
      console.error('Failed to initialize subscriptions:', error);
    }
  }

  // Get available subscription tiers
  getSubscriptionTiers(): SubscriptionTier[] {
    return [
      {
        id: 'vip_weekly',
        name: 'VIP Weekly',
        price: 2.99,
        currency: 'USD',
        period: 'weekly',
        benefits: [
          {
            id: 'unlimited_energy',
            name: 'Unlimited Energy',
            description: 'Play without energy limits',
            icon: '⚡'
          },
          {
            id: 'double_coins',
            name: '2x Coins',
            description: 'Double all coin rewards',
            icon: '💰'
          },
          {
            id: 'no_ads',
            name: 'No Ads',
            description: 'Ad-free experience',
            icon: '🚫'
          }
        ],
        trialDays: 3
      },
      {
        id: 'vip_monthly',
        name: 'VIP Monthly',
        price: 9.99,
        currency: 'USD',
        period: 'monthly',
        benefits: [
          {
            id: 'unlimited_energy',
            name: 'Unlimited Energy',
            description: 'Play without energy limits',
            icon: '⚡'
          },
          {
            id: 'triple_coins',
            name: '3x Coins',
            description: 'Triple all coin rewards',
            icon: '💰'
          },
          {
            id: 'exclusive_skins',
            name: 'VIP Skins',
            description: 'Access to exclusive VIP skins',
            icon: '👑'
          },
          {
            id: 'daily_crate',
            name: 'Daily VIP Crate',
            description: 'Free legendary crate daily',
            icon: '🎁'
          },
          {
            id: 'no_ads',
            name: 'No Ads',
            description: 'Ad-free experience',
            icon: '🚫'
          }
        ],
        savingsPercent: 17,
        popular: true,
        trialDays: 7
      },
      {
        id: 'vip_yearly',
        name: 'VIP Yearly',
        price: 79.99,
        currency: 'USD',
        period: 'yearly',
        benefits: [
          {
            id: 'unlimited_energy',
            name: 'Unlimited Energy',
            description: 'Play without energy limits',
            icon: '⚡'
          },
          {
            id: 'quintuple_coins',
            name: '5x Coins',
            description: '5x all coin rewards',
            icon: '💰'
          },
          {
            id: 'all_skins',
            name: 'All Skins Unlocked',
            description: 'Instant access to all skins',
            icon: '🎨'
          },
          {
            id: 'hourly_crate',
            name: 'Hourly VIP Crate',
            description: 'Free mythic crate every hour',
            icon: '🎁'
          },
          {
            id: 'exclusive_badge',
            name: 'Founder Badge',
            description: 'Exclusive yearly subscriber badge',
            icon: '🏅'
          },
          {
            id: 'priority_support',
            name: 'Priority Support',
            description: '24/7 VIP support',
            icon: '🎯'
          },
          {
            id: 'no_ads',
            name: 'No Ads',
            description: 'Ad-free experience',
            icon: '🚫'
          }
        ],
        savingsPercent: 33,
        trialDays: 14
      }
    ];
  }

  // Subscribe to a tier
  async subscribe(tierId: string): Promise<{
    success: boolean;
    message: string;
    customerInfo?: CustomerInfo;
  }> {
    try {
      const offerings = await Purchases.getOfferings();
      const product = offerings.current?.availablePackages.find(
        pkg => pkg.product.identifier === tierId
      );

      if (!product) {
        return {
          success: false,
          message: 'Product not found'
        };
      }

      const { customerInfo } = await Purchases.purchasePackage(product);
      this.customerInfo = customerInfo;
      await this.updateSubscriptionStatus();

      // Send welcome notification
      await this.sendWelcomeNotification(tierId);

      return {
        success: true,
        message: 'Successfully subscribed!',
        customerInfo
      };
    } catch (error: any) {
      if (error.userCancelled) {
        return {
          success: false,
          message: 'Purchase cancelled'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Subscription failed'
      };
    }
  }

  // ONE-CLICK CANCELLATION
  async cancelSubscription(): Promise<{
    success: boolean;
    message: string;
    managementUrl?: string;
  }> {
    try {
      // Direct management URLs for each platform
      const managementUrls = {
        ios: 'https://apps.apple.com/account/subscriptions',
        android: 'https://play.google.com/store/account/subscriptions',
        web: 'https://potofgold.com/account/subscriptions'
      };

      const platform = Platform.OS as keyof typeof managementUrls;
      const url = managementUrls[platform] || managementUrls.web;

      // Show confirmation with clear messaging
      Alert.alert(
        '🎯 Cancel Subscription',
        'We\'re sorry to see you go! Your benefits will continue until the end of your billing period.\n\nYou can resubscribe anytime to regain your VIP benefits.',
        [
          {
            text: 'Keep Subscription',
            style: 'cancel'
          },
          {
            text: 'Cancel Subscription',
            style: 'destructive',
            onPress: async () => {
              // Open system subscription management
              await Linking.openURL(url);
              
              // Track cancellation reason
              await this.trackCancellation();
              
              // Schedule win-back campaign
              await this.scheduleWinBackCampaign();
            }
          }
        ]
      );

      return {
        success: true,
        message: 'Opening subscription management...',
        managementUrl: url
      };
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return {
        success: false,
        message: 'Failed to open subscription management'
      };
    }
  }

  // Restore purchases
  async restorePurchases(): Promise<{
    success: boolean;
    message: string;
    restored: string[];
  }> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      await this.updateSubscriptionStatus();

      const restored = Object.keys(customerInfo.entitlements.active);

      return {
        success: true,
        message: restored.length > 0 
          ? 'Purchases restored successfully!' 
          : 'No purchases to restore',
        restored
      };
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return {
        success: false,
        message: 'Failed to restore purchases',
        restored: []
      };
    }
  }

  // Get subscription status with transparency
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    await this.updateSubscriptionStatus();
    
    return {
      isActive: this.hasActiveSubscription(),
      tier: this.getActiveTier(),
      expiresAt: this.getExpirationDate(),
      willRenew: this.willAutoRenew(),
      managementUrl: this.getManagementUrl(),
      cancelUrl: this.getCancelUrl(),
      gracePeriod: this.isInGracePeriod(),
      trialActive: this.isTrialActive(),
      trialEndsAt: this.getTrialEndDate(),
      billingHistory: await this.getBillingHistory(),
      totalSpent: await this.getTotalSpent()
    };
  }

  // Check specific entitlements
  hasEntitlement(entitlementId: string): boolean {
    if (!this.customerInfo) return false;
    return this.customerInfo.entitlements.active[entitlementId] !== undefined;
  }

  hasVIPAccess(): boolean {
    return this.hasEntitlement(this.ENTITLEMENT_IDS.vip);
  }

  hasPremiumFeatures(): boolean {
    return this.hasEntitlement(this.ENTITLEMENT_IDS.premium);
  }

  hasBattlePass(): boolean {
    return this.hasEntitlement(this.ENTITLEMENT_IDS.battlepass);
  }

  hasNoAds(): boolean {
    return this.hasEntitlement(this.ENTITLEMENT_IDS.noads);
  }

  // Private helper methods
  private async updateSubscriptionStatus() {
    if (!this.customerInfo) {
      this.customerInfo = await Purchases.getCustomerInfo();
    }

    const activeEntitlements = this.customerInfo.entitlements.active;
    const hasActive = Object.keys(activeEntitlements).length > 0;

    this.subscriptionStatus = {
      isActive: hasActive,
      tier: this.getActiveTier(),
      expiresAt: this.getExpirationDate(),
      willRenew: this.willAutoRenew(),
      managementUrl: this.getManagementUrl(),
      cancelUrl: this.getCancelUrl(),
      gracePeriod: this.isInGracePeriod(),
      trialActive: this.isTrialActive(),
      trialEndsAt: this.getTrialEndDate(),
      billingHistory: await this.getBillingHistory(),
      totalSpent: await this.getTotalSpent()
    };
  }

  private hasActiveSubscription(): boolean {
    if (!this.customerInfo) return false;
    return Object.keys(this.customerInfo.entitlements.active).length > 0;
  }

  private getActiveTier(): SubscriptionTier | undefined {
    if (!this.customerInfo) return undefined;
    
    const activeEntitlements = Object.values(this.customerInfo.entitlements.active);
    if (activeEntitlements.length === 0) return undefined;

    // Map entitlement to tier
    const entitlement = activeEntitlements[0];
    const tiers = this.getSubscriptionTiers();
    
    return tiers.find(tier => 
      tier.id === entitlement.productIdentifier
    );
  }

  private getExpirationDate(): string | undefined {
    if (!this.customerInfo) return undefined;
    
    const entitlement = Object.values(this.customerInfo.entitlements.active)[0];
    return entitlement?.expirationDate || undefined;
  }

  private willAutoRenew(): boolean {
    if (!this.customerInfo) return false;
    
    const entitlement = Object.values(this.customerInfo.entitlements.active)[0];
    return entitlement?.willRenew || false;
  }

  private getManagementUrl(): string {
    return Platform.select({
      ios: 'https://apps.apple.com/account/subscriptions',
      android: 'https://play.google.com/store/account/subscriptions',
      default: 'https://potofgold.com/account'
    });
  }

  private getCancelUrl(): string {
    return this.getManagementUrl();
  }

  private isInGracePeriod(): boolean {
    if (!this.customerInfo) return false;
    
    const entitlement = Object.values(this.customerInfo.entitlements.active)[0];
    return entitlement?.billingIssueDetectedAt !== undefined;
  }

  private isTrialActive(): boolean {
    if (!this.customerInfo) return false;
    
    const entitlement = Object.values(this.customerInfo.entitlements.active)[0];
    return entitlement?.periodType === 'trial';
  }

  private getTrialEndDate(): string | undefined {
    if (!this.isTrialActive()) return undefined;
    return this.getExpirationDate();
  }

  private async getBillingHistory(): Promise<BillingRecord[]> {
    // Load from AsyncStorage or backend
    const history = await AsyncStorage.getItem('billing_history');
    return history ? JSON.parse(history) : [];
  }

  private async getTotalSpent(): Promise<number> {
    const history = await this.getBillingHistory();
    return history.reduce((total, record) => 
      total + (record.refunded ? 0 : record.amount), 0
    );
  }

  // Notification helpers
  private async sendWelcomeNotification(tierId: string) {
    const tier = this.getSubscriptionTiers().find(t => t.id === tierId);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Welcome to VIP!',
        body: `Your ${tier?.name} subscription is now active. Enjoy your exclusive benefits!`,
        data: { type: 'subscription_welcome' }
      },
      trigger: null
    });
  }

  private async scheduleWinBackCampaign() {
    // Schedule win-back notifications
    const campaigns = [
      { days: 3, discount: 20 },
      { days: 7, discount: 30 },
      { days: 14, discount: 50 }
    ];

    for (const campaign of campaigns) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎁 We miss you!',
          body: `Come back with ${campaign.discount}% off your subscription!`,
          data: { type: 'winback', discount: campaign.discount }
        },
        trigger: {
          seconds: campaign.days * 24 * 60 * 60
        }
      });
    }
  }

  private async trackCancellation() {
    // Track cancellation reason for analytics
    const reason = await this.askCancellationReason();
    await AsyncStorage.setItem('cancellation_reason', JSON.stringify({
      date: new Date().toISOString(),
      reason
    }));
  }

  private async askCancellationReason(): Promise<string> {
    return new Promise((resolve) => {
      Alert.alert(
        'Help us improve',
        'Why are you cancelling?',
        [
          { text: 'Too expensive', onPress: () => resolve('price') },
          { text: 'Not using enough', onPress: () => resolve('usage') },
          { text: 'Missing features', onPress: () => resolve('features') },
          { text: 'Other', onPress: () => resolve('other') }
        ]
      );
    });
  }

  private async checkForExpiredTrials() {
    if (this.isTrialActive()) {
      const trialEnd = this.getTrialEndDate();
      if (trialEnd) {
        const endDate = new Date(trialEnd);
        const now = new Date();
        const hoursUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilEnd <= 24 && hoursUntilEnd > 0) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '⏰ Trial Ending Soon!',
              body: 'Your free trial ends tomorrow. Subscribe now to keep your VIP benefits!',
              data: { type: 'trial_ending' }
            },
            trigger: null
          });
        }
      }
    }
  }

  private async setupListeners() {
    // Listen for purchase updates
    Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      this.customerInfo = customerInfo;
      this.updateSubscriptionStatus();
    });
  }
}

export default new ComprehensiveSubscriptionSystem();