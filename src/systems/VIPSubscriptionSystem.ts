/**
 * VIP & Subscription System
 * Premium membership tiers with exclusive benefits
 */

import Purchases, { CustomerInfo, PurchasesEntitlementInfo } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../firebase/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

// ========== VIP SYSTEM ==========

export interface VIPStatus {
  level: VIPLevel;
  points: number;
  pointsToNextLevel: number;
  totalSpent: number;
  benefits: VIPBenefit[];
  exclusiveAccess: string[];
  joinDate: number;
  expiryDate?: number;
  lifetime: boolean;
}

export enum VIPLevel {
  NONE = 0,
  BRONZE = 1,
  SILVER = 2,
  GOLD = 3,
  PLATINUM = 4,
  DIAMOND = 5,
  MASTER = 6,
  GRANDMASTER = 7,
  LEGENDARY = 8,
  MYTHIC = 9,
  ETERNAL = 10,
}

interface VIPBenefit {
  id: string;
  name: string;
  description: string;
  type: BenefitType;
  value: number;
  icon: string;
}

type BenefitType =
  | 'coin_bonus'
  | 'gem_bonus'
  | 'xp_bonus'
  | 'energy_regen'
  | 'shop_discount'
  | 'exclusive_items'
  | 'priority_support'
  | 'early_access'
  | 'free_respins'
  | 'daily_bonus';

export interface Subscription {
  id: string;
  type: SubscriptionType;
  name: string;
  price: number;
  period: 'monthly' | 'yearly' | 'lifetime';
  benefits: SubscriptionBenefit[];
  isActive: boolean;
  startDate?: number;
  endDate?: number;
  autoRenew: boolean;
  platform: 'ios' | 'android';
}

type SubscriptionType = 'basic' | 'premium' | 'premium_plus' | 'ultimate';

interface SubscriptionBenefit {
  id: string;
  description: string;
  permanent: boolean;
}

export class VIPManager {
  private vipStatus: VIPStatus | null = null;
  private activeSubscriptions: Map<string, Subscription> = new Map();
  private vipThresholds: Map<VIPLevel, number> = new Map();

  constructor() {
    this.initializeVIPThresholds();
  }

  private initializeVIPThresholds() {
    this.vipThresholds.set(VIPLevel.BRONZE, 10); // $10
    this.vipThresholds.set(VIPLevel.SILVER, 50); // $50
    this.vipThresholds.set(VIPLevel.GOLD, 100); // $100
    this.vipThresholds.set(VIPLevel.PLATINUM, 250); // $250
    this.vipThresholds.set(VIPLevel.DIAMOND, 500); // $500
    this.vipThresholds.set(VIPLevel.MASTER, 1000); // $1,000
    this.vipThresholds.set(VIPLevel.GRANDMASTER, 2500); // $2,500
    this.vipThresholds.set(VIPLevel.LEGENDARY, 5000); // $5,000
    this.vipThresholds.set(VIPLevel.MYTHIC, 10000); // $10,000
    this.vipThresholds.set(VIPLevel.ETERNAL, 25000); // $25,000
  }

  async loadVIPStatus(userId: string): Promise<VIPStatus> {
    try {
      const docRef = doc(db, 'vip', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        this.vipStatus = docSnap.data() as VIPStatus;
      } else {
        this.vipStatus = this.createDefaultVIPStatus();
      }

      // Update benefits based on current level
      this.vipStatus.benefits = this.getVIPBenefits(this.vipStatus.level);

      return this.vipStatus;
    } catch (error) {
      console.error('Error loading VIP status:', error);
      return this.createDefaultVIPStatus();
    }
  }

  private createDefaultVIPStatus(): VIPStatus {
    return {
      level: VIPLevel.NONE,
      points: 0,
      pointsToNextLevel: 10,
      totalSpent: 0,
      benefits: [],
      exclusiveAccess: [],
      joinDate: Date.now(),
      lifetime: false,
    };
  }

  async addVIPPoints(amount: number, userId: string): Promise<VIPLevelUpResult | null> {
    if (!this.vipStatus) {
      await this.loadVIPStatus(userId);
    }

    const previousLevel = this.vipStatus!.level;
    this.vipStatus!.points += amount;
    this.vipStatus!.totalSpent += amount;

    // Check for level up
    const newLevel = this.calculateVIPLevel(this.vipStatus!.totalSpent);
    let levelUpResult: VIPLevelUpResult | null = null;

    if (newLevel > previousLevel) {
      this.vipStatus!.level = newLevel;
      this.vipStatus!.benefits = this.getVIPBenefits(newLevel);
      this.vipStatus!.pointsToNextLevel = this.getPointsToNextLevel(newLevel);

      // Grant level up rewards
      const rewards = this.getVIPLevelUpRewards(newLevel);

      levelUpResult = {
        previousLevel,
        newLevel,
        rewards,
        newBenefits: this.vipStatus!.benefits,
        celebration: this.getVIPCelebration(newLevel),
      };

      // Unlock exclusive content
      this.unlockVIPContent(newLevel);
    }

    await this.saveVIPStatus(userId);
    return levelUpResult;
  }

  private calculateVIPLevel(totalSpent: number): VIPLevel {
    let level = VIPLevel.NONE;

    for (const [vipLevel, threshold] of this.vipThresholds) {
      if (totalSpent >= threshold) {
        level = vipLevel;
      } else {
        break;
      }
    }

    return level;
  }

  private getPointsToNextLevel(currentLevel: VIPLevel): number {
    const nextLevel = currentLevel + 1;
    const nextThreshold = this.vipThresholds.get(nextLevel);

    if (!nextThreshold) return 0; // Max level reached

    const currentThreshold = this.vipThresholds.get(currentLevel) || 0;
    return nextThreshold - currentThreshold;
  }

  private getVIPBenefits(level: VIPLevel): VIPBenefit[] {
    const benefits: VIPBenefit[] = [];

    // Cumulative benefits (each level includes all previous benefits)
    if (level >= VIPLevel.BRONZE) {
      benefits.push(
        {
          id: 'coin_bonus_10',
          name: '+10% Coins',
          description: 'Earn 10% more coins',
          type: 'coin_bonus',
          value: 0.1,
          icon: '🪙',
        },
        {
          id: 'daily_bonus_bronze',
          name: 'Daily Gift',
          description: '100 gems daily',
          type: 'daily_bonus',
          value: 100,
          icon: '🎁',
        }
      );
    }

    if (level >= VIPLevel.SILVER) {
      benefits.push(
        {
          id: 'coin_bonus_20',
          name: '+20% Coins',
          description: 'Earn 20% more coins total',
          type: 'coin_bonus',
          value: 0.2,
          icon: '🪙',
        },
        {
          id: 'gem_bonus_10',
          name: '+10% Gems',
          description: 'Earn 10% more gems',
          type: 'gem_bonus',
          value: 0.1,
          icon: '💎',
        },
        {
          id: 'energy_regen_2x',
          name: '2x Energy Regen',
          description: 'Energy regenerates twice as fast',
          type: 'energy_regen',
          value: 2,
          icon: '⚡',
        }
      );
    }

    if (level >= VIPLevel.GOLD) {
      benefits.push(
        {
          id: 'shop_discount_10',
          name: '10% Shop Discount',
          description: 'All shop items 10% off',
          type: 'shop_discount',
          value: 0.1,
          icon: '🛍️',
        },
        {
          id: 'xp_bonus_50',
          name: '+50% XP',
          description: 'Earn 50% more XP',
          type: 'xp_bonus',
          value: 0.5,
          icon: '⭐',
        },
        {
          id: 'exclusive_gold_skin',
          name: 'Gold VIP Skin',
          description: 'Exclusive golden skin',
          type: 'exclusive_items',
          value: 1,
          icon: '👑',
        }
      );
    }

    if (level >= VIPLevel.PLATINUM) {
      benefits.push(
        {
          id: 'coin_bonus_50',
          name: '+50% Coins',
          description: 'Earn 50% more coins total',
          type: 'coin_bonus',
          value: 0.5,
          icon: '🪙',
        },
        {
          id: 'gem_bonus_25',
          name: '+25% Gems',
          description: 'Earn 25% more gems total',
          type: 'gem_bonus',
          value: 0.25,
          icon: '💎',
        },
        {
          id: 'free_respins_3',
          name: '3 Free Respins Daily',
          description: 'Get 3 free loot box respins',
          type: 'free_respins',
          value: 3,
          icon: '🎰',
        }
      );
    }

    if (level >= VIPLevel.DIAMOND) {
      benefits.push(
        {
          id: 'shop_discount_20',
          name: '20% Shop Discount',
          description: 'All shop items 20% off',
          type: 'shop_discount',
          value: 0.2,
          icon: '🛍️',
        },
        {
          id: 'xp_bonus_100',
          name: '+100% XP',
          description: 'Double XP permanently',
          type: 'xp_bonus',
          value: 1.0,
          icon: '⭐',
        },
        {
          id: 'priority_support',
          name: 'Priority Support',
          description: '24/7 VIP support',
          type: 'priority_support',
          value: 1,
          icon: '🎯',
        },
        {
          id: 'early_access',
          name: 'Early Access',
          description: 'Get new content first',
          type: 'early_access',
          value: 1,
          icon: '🚀',
        }
      );
    }

    if (level >= VIPLevel.MASTER) {
      benefits.push(
        {
          id: 'coin_bonus_100',
          name: '+100% Coins',
          description: 'Double coins permanently',
          type: 'coin_bonus',
          value: 1.0,
          icon: '🪙',
        },
        {
          id: 'gem_bonus_50',
          name: '+50% Gems',
          description: 'Earn 50% more gems total',
          type: 'gem_bonus',
          value: 0.5,
          icon: '💎',
        },
        {
          id: 'exclusive_master_badge',
          name: 'Master Badge',
          description: 'Exclusive Master VIP badge',
          type: 'exclusive_items',
          value: 1,
          icon: '🏆',
        }
      );
    }

    if (level >= VIPLevel.LEGENDARY) {
      benefits.push(
        {
          id: 'shop_discount_50',
          name: '50% Shop Discount',
          description: 'Half price on everything',
          type: 'shop_discount',
          value: 0.5,
          icon: '🛍️',
        },
        {
          id: 'unlimited_energy',
          name: 'Unlimited Energy',
          description: 'Never run out of energy',
          type: 'energy_regen',
          value: 999,
          icon: '♾️',
        },
        {
          id: 'legendary_frame',
          name: 'Legendary Frame',
          description: 'Animated legendary frame',
          type: 'exclusive_items',
          value: 1,
          icon: '✨',
        }
      );
    }

    if (level >= VIPLevel.ETERNAL) {
      benefits.push(
        {
          id: 'everything_free',
          name: 'Lifetime Premium',
          description: 'All premium features forever',
          type: 'exclusive_items',
          value: 999,
          icon: '👑',
        },
        {
          id: 'name_in_credits',
          name: 'Game Credits',
          description: 'Your name in game credits',
          type: 'exclusive_items',
          value: 1,
          icon: '🌟',
        },
        {
          id: 'design_input',
          name: 'Design Input',
          description: 'Help design new content',
          type: 'exclusive_items',
          value: 1,
          icon: '🎨',
        }
      );
    }

    return benefits;
  }

  private getVIPLevelUpRewards(level: VIPLevel): VIPReward[] {
    const rewards: VIPReward[] = [];

    switch (level) {
      case VIPLevel.BRONZE:
        rewards.push(
          { type: 'gems', amount: 500 },
          { type: 'coins', amount: 10000 },
          { type: 'vip_badge', amount: 1 }
        );
        break;
      case VIPLevel.SILVER:
        rewards.push(
          { type: 'gems', amount: 1000 },
          { type: 'coins', amount: 25000 },
          { type: 'epic_crate', amount: 3 }
        );
        break;
      case VIPLevel.GOLD:
        rewards.push(
          { type: 'gems', amount: 2500 },
          { type: 'coins', amount: 50000 },
          { type: 'legendary_crate', amount: 1 },
          { type: 'exclusive_skin', amount: 1 }
        );
        break;
      case VIPLevel.PLATINUM:
        rewards.push(
          { type: 'gems', amount: 5000 },
          { type: 'coins', amount: 100000 },
          { type: 'legendary_crate', amount: 3 },
          { type: 'exclusive_trail', amount: 1 }
        );
        break;
      case VIPLevel.DIAMOND:
        rewards.push(
          { type: 'gems', amount: 10000 },
          { type: 'coins', amount: 250000 },
          { type: 'mythic_crate', amount: 1 },
          { type: 'exclusive_frame', amount: 1 }
        );
        break;
      default:
        rewards.push(
          { type: 'gems', amount: level * 5000 },
          { type: 'coins', amount: level * 100000 }
        );
    }

    return rewards;
  }

  private getVIPCelebration(level: VIPLevel): string {
    if (level >= VIPLevel.LEGENDARY) return 'legendary_vip_celebration';
    if (level >= VIPLevel.DIAMOND) return 'diamond_vip_celebration';
    if (level >= VIPLevel.GOLD) return 'gold_vip_celebration';
    return 'vip_level_up';
  }

  private unlockVIPContent(level: VIPLevel) {
    const exclusiveContent: string[] = [];

    if (level >= VIPLevel.GOLD) {
      exclusiveContent.push('vip_lounge', 'exclusive_events');
    }

    if (level >= VIPLevel.DIAMOND) {
      exclusiveContent.push('vip_tournaments', 'beta_features');
    }

    if (level >= VIPLevel.LEGENDARY) {
      exclusiveContent.push('developer_chat', 'custom_content');
    }

    if (this.vipStatus) {
      this.vipStatus.exclusiveAccess = exclusiveContent;
    }
  }

  private async saveVIPStatus(userId: string) {
    if (!this.vipStatus) return;

    try {
      const docRef = doc(db, 'vip', userId);
      await setDoc(docRef, this.vipStatus, { merge: true });
    } catch (error) {
      console.error('Error saving VIP status:', error);
    }
  }
}

// ========== SUBSCRIPTION MANAGER ==========

export class SubscriptionManager {
  private subscriptions: Map<string, Subscription> = new Map();

  async initialize() {
    this.defineSubscriptionTiers();
    await this.loadActiveSubscriptions();
  }

  private defineSubscriptionTiers() {
    // Basic Subscription
    this.subscriptions.set('basic_monthly', {
      id: 'basic_monthly',
      type: 'basic',
      name: 'Basic Pass',
      price: 4.99,
      period: 'monthly',
      benefits: [
        { id: 'remove_ads', description: 'No ads', permanent: false },
        { id: 'daily_gems_50', description: '50 gems daily', permanent: false },
        { id: 'energy_boost', description: '+25% energy capacity', permanent: false },
      ],
      isActive: false,
      autoRenew: true,
      platform: 'ios',
    });

    // Premium Subscription
    this.subscriptions.set('premium_monthly', {
      id: 'premium_monthly',
      type: 'premium',
      name: 'Premium Pass',
      price: 9.99,
      period: 'monthly',
      benefits: [
        { id: 'remove_ads', description: 'No ads', permanent: false },
        { id: 'daily_gems_100', description: '100 gems daily', permanent: false },
        { id: 'energy_unlimited', description: 'Unlimited energy', permanent: false },
        { id: 'battle_pass_included', description: 'Battle Pass included', permanent: false },
        { id: 'xp_boost_2x', description: '2x XP permanently', permanent: false },
      ],
      isActive: false,
      autoRenew: true,
      platform: 'ios',
    });

    // Premium Plus Subscription
    this.subscriptions.set('premium_plus_monthly', {
      id: 'premium_plus_monthly',
      type: 'premium_plus',
      name: 'Premium Plus',
      price: 19.99,
      period: 'monthly',
      benefits: [
        { id: 'all_premium_benefits', description: 'All Premium benefits', permanent: false },
        { id: 'daily_gems_200', description: '200 gems daily', permanent: false },
        { id: 'monthly_legendary', description: 'Monthly legendary skin', permanent: false },
        { id: 'vip_double_points', description: 'Double VIP points', permanent: false },
        { id: 'exclusive_content', description: 'Exclusive subscriber content', permanent: false },
      ],
      isActive: false,
      autoRenew: true,
      platform: 'ios',
    });

    // Lifetime Ultimate
    this.subscriptions.set('ultimate_lifetime', {
      id: 'ultimate_lifetime',
      type: 'ultimate',
      name: 'Lifetime Ultimate',
      price: 499.99,
      period: 'lifetime',
      benefits: [
        { id: 'everything_unlocked', description: 'All content unlocked forever', permanent: true },
        { id: 'daily_gems_500', description: '500 gems daily forever', permanent: true },
        { id: 'founder_status', description: 'Founder status and badge', permanent: true },
        { id: 'name_in_game', description: 'Your name in the game', permanent: true },
        { id: 'custom_skin', description: 'Custom designed skin', permanent: true },
      ],
      isActive: false,
      autoRenew: false,
      platform: 'ios',
    });
  }

  async loadActiveSubscriptions(): Promise<void> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();

      // Check active entitlements
      for (const [key, entitlement] of Object.entries(customerInfo.entitlements.active)) {
        const subscription = this.subscriptions.get(entitlement.productIdentifier);
        if (subscription) {
          subscription.isActive = true;
          subscription.startDate = new Date(entitlement.originalPurchaseDate).getTime();
          subscription.endDate = entitlement.expirationDate
            ? new Date(entitlement.expirationDate).getTime()
            : undefined;
        }
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  }

  async subscribe(subscriptionId: string): Promise<SubscriptionResult> {
    try {
      const offerings = await Purchases.getOfferings();
      const subscription = this.subscriptions.get(subscriptionId);

      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      // Find the package for this subscription
      let targetPackage = null;
      for (const offering of Object.values(offerings.all)) {
        const pkg = offering.availablePackages.find((p) => p.product.identifier === subscriptionId);
        if (pkg) {
          targetPackage = pkg;
          break;
        }
      }

      if (!targetPackage) {
        return { success: false, error: 'Package not found' };
      }

      // Purchase the subscription
      const { customerInfo } = await Purchases.purchasePackage(targetPackage);

      // Verify subscription
      const isActive = customerInfo.entitlements.active[subscriptionId] !== undefined;

      if (isActive) {
        subscription.isActive = true;
        subscription.startDate = Date.now();

        // Grant subscription benefits
        await this.activateSubscriptionBenefits(subscription);

        return {
          success: true,
          subscription,
          benefits: subscription.benefits,
        };
      }

      return { success: false, error: 'Subscription verification failed' };
    } catch (error: any) {
      if (error.userCancelled) {
        return { success: false, error: 'User cancelled' };
      }
      return { success: false, error: error.message };
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    // This typically opens the platform's subscription management
    try {
      await Purchases.showManageSubscriptions();
      return true;
    } catch (error) {
      console.error('Error managing subscription:', error);
      return false;
    }
  }

  async restorePurchases(): Promise<RestoreResult> {
    try {
      const customerInfo = await Purchases.restoreTransactions();
      const restored: string[] = [];

      for (const [key, entitlement] of Object.entries(customerInfo.entitlements.active)) {
        restored.push(entitlement.productIdentifier);

        const subscription = this.subscriptions.get(entitlement.productIdentifier);
        if (subscription) {
          subscription.isActive = true;
          await this.activateSubscriptionBenefits(subscription);
        }
      }

      return {
        success: true,
        restoredSubscriptions: restored,
      };
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return {
        success: false,
        restoredSubscriptions: [],
      };
    }
  }

  private async activateSubscriptionBenefits(subscription: Subscription) {
    // Grant benefits based on subscription type
    for (const benefit of subscription.benefits) {
      await this.grantBenefit(benefit);
    }
  }

  private async grantBenefit(benefit: SubscriptionBenefit) {
    // Implement benefit granting logic
    switch (benefit.id) {
      case 'remove_ads':
        await AsyncStorage.setItem('ads_removed', 'true');
        break;
      case 'daily_gems_50':
      case 'daily_gems_100':
      case 'daily_gems_200':
      case 'daily_gems_500':
        // Set up daily reward
        const amount = parseInt(benefit.id.split('_')[2]);
        await this.setupDailyReward('gems', amount);
        break;
      case 'battle_pass_included':
        // Activate battle pass
        await this.activateBattlePass();
        break;
      // Add more benefit implementations
    }
  }

  private async setupDailyReward(type: string, amount: number) {
    // Implement daily reward logic
  }

  private async activateBattlePass() {
    // Implement battle pass activation
  }

  getActiveSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values()).filter((s) => s.isActive);
  }

  hasActiveSubscription(type?: SubscriptionType): boolean {
    const active = this.getActiveSubscriptions();
    if (!type) return active.length > 0;
    return active.some((s) => s.type === type);
  }

  getSubscriptionBenefits(): SubscriptionBenefit[] {
    const benefits: SubscriptionBenefit[] = [];
    const active = this.getActiveSubscriptions();

    for (const subscription of active) {
      benefits.push(...subscription.benefits);
    }

    // Remove duplicates
    return benefits.filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i);
  }
}

// ========== TYPE DEFINITIONS ==========

interface VIPLevelUpResult {
  previousLevel: VIPLevel;
  newLevel: VIPLevel;
  rewards: VIPReward[];
  newBenefits: VIPBenefit[];
  celebration: string;
}

interface VIPReward {
  type: string;
  amount: number;
}

interface SubscriptionResult {
  success: boolean;
  error?: string;
  subscription?: Subscription;
  benefits?: SubscriptionBenefit[];
}

interface RestoreResult {
  success: boolean;
  restoredSubscriptions: string[];
}

// ========== COMBINED MANAGER ==========

export class PremiumManager {
  public vipManager = new VIPManager();
  public subscriptionManager = new SubscriptionManager();

  async initialize(userId: string) {
    await this.vipManager.loadVIPStatus(userId);
    await this.subscriptionManager.initialize();
  }

  getTotalBonuses(): BonusSummary {
    const vipBenefits = this.vipManager.vipStatus?.benefits || [];
    const subBenefits = this.subscriptionManager.getSubscriptionBenefits();

    let coinBonus = 1;
    let gemBonus = 1;
    let xpBonus = 1;
    let shopDiscount = 0;

    // Calculate VIP bonuses
    for (const benefit of vipBenefits) {
      switch (benefit.type) {
        case 'coin_bonus':
          coinBonus += benefit.value;
          break;
        case 'gem_bonus':
          gemBonus += benefit.value;
          break;
        case 'xp_bonus':
          xpBonus += benefit.value;
          break;
        case 'shop_discount':
          shopDiscount = Math.max(shopDiscount, benefit.value);
          break;
      }
    }

    // Add subscription bonuses
    if (this.subscriptionManager.hasActiveSubscription('premium')) {
      xpBonus *= 2; // Premium gives 2x XP
    }

    return {
      coinMultiplier: coinBonus,
      gemMultiplier: gemBonus,
      xpMultiplier: xpBonus,
      shopDiscount,
      hasUnlimitedEnergy: subBenefits.some((b) => b.id === 'energy_unlimited'),
      hasNoAds: subBenefits.some((b) => b.id === 'remove_ads'),
    };
  }
}

interface BonusSummary {
  coinMultiplier: number;
  gemMultiplier: number;
  xpMultiplier: number;
  shopDiscount: number;
  hasUnlimitedEnergy: boolean;
  hasNoAds: boolean;
}

export default PremiumManager;
