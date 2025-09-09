import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Purchase, Subscription, Reward } from '../types/game.types';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: 'consumable' | 'non-consumable' | 'subscription';
  rewards: Reward[];
  bonus?: string;
  popular?: boolean;
  bestValue?: boolean;
}

interface AdReward {
  type: 'coins' | 'gems' | 'powerup' | 'life' | 'continue';
  amount: number;
  cooldown: number; // in seconds
}

interface DailyReward {
  day: number;
  rewards: Reward[];
  claimed: boolean;
}

class MonetizationManager {
  private products: Map<string, Product> = new Map();
  private activeSubscription: Subscription | null = null;
  private purchases: Purchase[] = [];
  private adRewards: Map<string, AdReward> = new Map();
  private lastAdWatchTime: Map<string, number> = new Map();
  private dailyRewards: DailyReward[] = [];
  private currentDailyStreak: number = 0;
  private lastDailyClaimDate: string | null = null;
  private watchedAdsToday: number = 0;
  private maxDailyAds: number = 10;
  private totalSpent: number = 0;
  private vipLevel: number = 0;
  
  constructor() {
    this.initializeProducts();
    this.initializeAdRewards();
    this.initializeDailyRewards();
    this.loadUserData();
  }
  
  private initializeProducts() {
    // Coin Packages
    this.products.set('coins_small', {
      id: 'coins_small',
      name: 'Handful of Coins',
      description: '500 Coins',
      price: 0.99,
      currency: 'USD',
      type: 'consumable',
      rewards: [{ type: 'coins', amount: 500 }],
    });
    
    this.products.set('coins_medium', {
      id: 'coins_medium',
      name: 'Bag of Coins',
      description: '2,500 Coins + 10% Bonus',
      price: 4.99,
      currency: 'USD',
      type: 'consumable',
      rewards: [{ type: 'coins', amount: 2750 }],
      bonus: '+10% Bonus',
      popular: true,
    });
    
    this.products.set('coins_large', {
      id: 'coins_large',
      name: 'Chest of Coins',
      description: '6,000 Coins + 20% Bonus',
      price: 9.99,
      currency: 'USD',
      type: 'consumable',
      rewards: [{ type: 'coins', amount: 7200 }],
      bonus: '+20% Bonus',
    });
    
    this.products.set('coins_mega', {
      id: 'coins_mega',
      name: 'Vault of Coins',
      description: '15,000 Coins + 30% Bonus',
      price: 19.99,
      currency: 'USD',
      type: 'consumable',
      rewards: [{ type: 'coins', amount: 19500 }],
      bonus: '+30% Bonus',
      bestValue: true,
    });
    
    // Gem Packages
    this.products.set('gems_small', {
      id: 'gems_small',
      name: 'Gem Pouch',
      description: '50 Gems',
      price: 1.99,
      currency: 'USD',
      type: 'consumable',
      rewards: [{ type: 'gems', amount: 50 }],
    });
    
    this.products.set('gems_medium', {
      id: 'gems_medium',
      name: 'Gem Box',
      description: '250 Gems + 25 Bonus',
      price: 9.99,
      currency: 'USD',
      type: 'consumable',
      rewards: [{ type: 'gems', amount: 275 }],
      bonus: '+25 Bonus Gems',
      popular: true,
    });
    
    this.products.set('gems_large', {
      id: 'gems_large',
      name: 'Gem Treasure',
      description: '600 Gems + 100 Bonus',
      price: 19.99,
      currency: 'USD',
      type: 'consumable',
      rewards: [{ type: 'gems', amount: 700 }],
      bonus: '+100 Bonus Gems',
      bestValue: true,
    });
    
    // Starter Packs (One-time purchases)
    this.products.set('starter_pack', {
      id: 'starter_pack',
      name: 'Starter Pack',
      description: 'Great value for new players!',
      price: 2.99,
      currency: 'USD',
      type: 'non-consumable',
      rewards: [
        { type: 'coins', amount: 2000 },
        { type: 'gems', amount: 50 },
        { type: 'powerup', amount: 5 },
        { type: 'skin', itemId: 'starter_cart', rarity: 'rare' },
      ],
      popular: true,
    });
    
    this.products.set('pro_pack', {
      id: 'pro_pack',
      name: 'Pro Player Pack',
      description: 'Everything you need to dominate!',
      price: 9.99,
      currency: 'USD',
      type: 'non-consumable',
      rewards: [
        { type: 'coins', amount: 10000 },
        { type: 'gems', amount: 200 },
        { type: 'powerup', amount: 20 },
        { type: 'skin', itemId: 'pro_cart', rarity: 'epic' },
        { type: 'achievement', itemId: 'pro_player' },
      ],
      bestValue: true,
    });
    
    // Season Pass
    this.products.set('season_pass', {
      id: 'season_pass',
      name: 'Season Pass',
      description: 'Unlock premium rewards for the season!',
      price: 4.99,
      currency: 'USD',
      type: 'non-consumable',
      rewards: [
        { type: 'achievement', itemId: 'season_pass_holder' },
      ],
    });
    
    // Subscriptions
    this.products.set('vip_monthly', {
      id: 'vip_monthly',
      name: 'VIP Monthly',
      description: 'VIP benefits for 30 days',
      price: 4.99,
      currency: 'USD',
      type: 'subscription',
      rewards: [
        { type: 'coins', amount: 500 }, // Daily login bonus
        { type: 'gems', amount: 50 },   // Weekly bonus
      ],
    });
    
    this.products.set('vip_yearly', {
      id: 'vip_yearly',
      name: 'VIP Yearly',
      description: 'VIP benefits for 365 days - Save 40%!',
      price: 34.99,
      currency: 'USD',
      type: 'subscription',
      rewards: [
        { type: 'coins', amount: 1000 }, // Daily login bonus
        { type: 'gems', amount: 100 },   // Weekly bonus
        { type: 'skin', itemId: 'vip_exclusive', rarity: 'legendary' },
      ],
      bestValue: true,
    });
    
    // Special Offers
    this.products.set('no_ads', {
      id: 'no_ads',
      name: 'Remove Ads',
      description: 'Remove all ads forever!',
      price: 3.99,
      currency: 'USD',
      type: 'non-consumable',
      rewards: [
        { type: 'achievement', itemId: 'ad_free' },
      ],
    });
    
    this.products.set('double_coins', {
      id: 'double_coins',
      name: 'Double Coins Forever',
      description: 'Permanently double all coin rewards!',
      price: 7.99,
      currency: 'USD',
      type: 'non-consumable',
      rewards: [
        { type: 'achievement', itemId: 'double_coins' },
      ],
    });
  }
  
  private initializeAdRewards() {
    this.adRewards.set('bonus_coins', {
      type: 'coins',
      amount: 100,
      cooldown: 300, // 5 minutes
    });
    
    this.adRewards.set('bonus_gems', {
      type: 'gems',
      amount: 5,
      cooldown: 1800, // 30 minutes
    });
    
    this.adRewards.set('free_powerup', {
      type: 'powerup',
      amount: 1,
      cooldown: 600, // 10 minutes
    });
    
    this.adRewards.set('extra_life', {
      type: 'life',
      amount: 1,
      cooldown: 900, // 15 minutes
    });
    
    this.adRewards.set('continue_game', {
      type: 'continue',
      amount: 1,
      cooldown: 0, // No cooldown, but costs increase
    });
  }
  
  private initializeDailyRewards() {
    // 7-day reward cycle
    this.dailyRewards = [
      { day: 1, rewards: [{ type: 'coins', amount: 100 }], claimed: false },
      { day: 2, rewards: [{ type: 'coins', amount: 200 }], claimed: false },
      { day: 3, rewards: [{ type: 'gems', amount: 10 }], claimed: false },
      { day: 4, rewards: [{ type: 'coins', amount: 500 }], claimed: false },
      { day: 5, rewards: [{ type: 'powerup', amount: 3 }], claimed: false },
      { day: 6, rewards: [{ type: 'gems', amount: 25 }], claimed: false },
      { day: 7, rewards: [
        { type: 'coins', amount: 1000 },
        { type: 'gems', amount: 50 },
        { type: 'skin', itemId: 'weekly_reward', rarity: 'rare' },
      ], claimed: false },
    ];
  }
  
  private async loadUserData() {
    try {
      const data = await AsyncStorage.multiGet([
        'monetization_purchases',
        'monetization_subscription',
        'monetization_daily_streak',
        'monetization_last_claim',
        'monetization_total_spent',
        'monetization_vip_level',
        'monetization_watched_ads',
      ]);
      
      data.forEach(([key, value]) => {
        if (value) {
          switch (key) {
            case 'monetization_purchases':
              this.purchases = JSON.parse(value);
              break;
            case 'monetization_subscription':
              this.activeSubscription = JSON.parse(value);
              break;
            case 'monetization_daily_streak':
              this.currentDailyStreak = parseInt(value);
              break;
            case 'monetization_last_claim':
              this.lastDailyClaimDate = value;
              break;
            case 'monetization_total_spent':
              this.totalSpent = parseFloat(value);
              break;
            case 'monetization_vip_level':
              this.vipLevel = parseInt(value);
              break;
            case 'monetization_watched_ads':
              const adData = JSON.parse(value);
              if (adData.date === new Date().toDateString()) {
                this.watchedAdsToday = adData.count;
              }
              break;
          }
        }
      });
      
      this.updateVIPLevel();
    } catch (error) {
      console.error('Error loading monetization data:', error);
    }
  }
  
  private async saveUserData() {
    try {
      await AsyncStorage.multiSet([
        ['monetization_purchases', JSON.stringify(this.purchases)],
        ['monetization_subscription', JSON.stringify(this.activeSubscription)],
        ['monetization_daily_streak', this.currentDailyStreak.toString()],
        ['monetization_last_claim', this.lastDailyClaimDate || ''],
        ['monetization_total_spent', this.totalSpent.toString()],
        ['monetization_vip_level', this.vipLevel.toString()],
        ['monetization_watched_ads', JSON.stringify({
          date: new Date().toDateString(),
          count: this.watchedAdsToday,
        })],
      ]);
    } catch (error) {
      console.error('Error saving monetization data:', error);
    }
  }
  
  // Purchase handling
  public async purchaseProduct(productId: string): Promise<{ success: boolean; rewards?: Reward[]; error?: string }> {
    const product = this.products.get(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    
    // Check if already purchased (for non-consumables)
    if (product.type === 'non-consumable') {
      const alreadyPurchased = this.purchases.some(p => p.productId === productId && p.status === 'completed');
      if (alreadyPurchased) {
        return { success: false, error: 'Already purchased' };
      }
    }
    
    // Create purchase record
    const purchaseType = product.type === 'subscription' ? 'subscription' : 
                        productId.includes('season') ? 'seasonpass' : 
                        product.rewards[0]?.type === 'skin' ? 'skin' :
                        product.rewards[0]?.type === 'powerup' ? 'powerup' :
                        product.rewards[0]?.type === 'gems' ? 'gems' : 'coins';
    
    const purchase: Purchase = {
      id: `purchase_${Date.now()}`,
      type: purchaseType as any,
      productId: productId,
      price: product.price,
      currency: product.currency,
      purchaseDate: new Date(),
      status: 'pending',
    };
    
    this.purchases.push(purchase);
    
    // Simulate purchase (in production, this would call the platform's IAP API)
    try {
      // Mock successful purchase
      purchase.status = 'completed';
      this.totalSpent += product.price;
      this.updateVIPLevel();
      
      await this.saveUserData();
      
      return { success: true, rewards: product.rewards };
    } catch (error) {
      purchase.status = 'failed';
      return { success: false, error: 'Purchase failed' };
    }
  }
  
  // Ad watching
  public async watchAd(rewardType: string): Promise<{ success: boolean; reward?: AdReward; error?: string }> {
    // Check daily ad limit
    if (this.watchedAdsToday >= this.maxDailyAds) {
      return { success: false, error: 'Daily ad limit reached' };
    }
    
    const adReward = this.adRewards.get(rewardType);
    if (!adReward) {
      return { success: false, error: 'Invalid reward type' };
    }
    
    // Check cooldown
    const lastWatchTime = this.lastAdWatchTime.get(rewardType) || 0;
    const now = Date.now();
    const cooldownRemaining = (lastWatchTime + adReward.cooldown * 1000) - now;
    
    if (cooldownRemaining > 0) {
      return { 
        success: false, 
        error: `Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds` 
      };
    }
    
    // Simulate ad watching (in production, this would call the ad SDK)
    try {
      // Mock successful ad watch
      this.lastAdWatchTime.set(rewardType, now);
      this.watchedAdsToday++;
      
      await this.saveUserData();
      
      return { success: true, reward: adReward };
    } catch (error) {
      return { success: false, error: 'Ad failed to load' };
    }
  }
  
  // Daily rewards
  public async claimDailyReward(): Promise<{ success: boolean; rewards?: Reward[]; nextDay?: number; error?: string }> {
    const today = new Date().toDateString();
    
    // Check if already claimed today
    if (this.lastDailyClaimDate === today) {
      return { success: false, error: 'Already claimed today' };
    }
    
    // Check streak
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    if (this.lastDailyClaimDate === yesterday) {
      this.currentDailyStreak++;
    } else {
      this.currentDailyStreak = 1;
    }
    
    // Get current day reward (cycles every 7 days)
    const dayIndex = (this.currentDailyStreak - 1) % 7;
    const dailyReward = this.dailyRewards[dayIndex];
    
    if (!dailyReward) {
      return { success: false, error: 'Invalid daily reward' };
    }
    
    // Mark as claimed
    dailyReward.claimed = true;
    this.lastDailyClaimDate = today;
    
    // Apply streak bonus
    let rewards = [...dailyReward.rewards];
    if (this.currentDailyStreak >= 7) {
      // Add streak bonus every 7 days
      const streakMultiplier = Math.floor(this.currentDailyStreak / 7);
      rewards = rewards.map(r => ({
        ...r,
        amount: r.amount ? r.amount * (1 + streakMultiplier * 0.1) : r.amount,
      }));
    }
    
    await this.saveUserData();
    
    return { 
      success: true, 
      rewards,
      nextDay: (dayIndex + 1) % 7 + 1,
    };
  }
  
  // VIP Level calculation
  private updateVIPLevel() {
    const vipThresholds = [0, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
    
    for (let i = vipThresholds.length - 1; i >= 0; i--) {
      if (this.totalSpent >= vipThresholds[i]) {
        this.vipLevel = i;
        break;
      }
    }
  }
  
  // VIP Benefits
  public getVIPBenefits(): { [key: string]: any } {
    const benefits: { [key: string]: any } = {
      0: {
        coinMultiplier: 1.0,
        gemMultiplier: 1.0,
        xpMultiplier: 1.0,
        maxLives: 3,
        dailyAds: 10,
      },
      1: {
        coinMultiplier: 1.1,
        gemMultiplier: 1.0,
        xpMultiplier: 1.1,
        maxLives: 4,
        dailyAds: 12,
      },
      2: {
        coinMultiplier: 1.2,
        gemMultiplier: 1.1,
        xpMultiplier: 1.2,
        maxLives: 4,
        dailyAds: 15,
      },
      3: {
        coinMultiplier: 1.3,
        gemMultiplier: 1.2,
        xpMultiplier: 1.3,
        maxLives: 5,
        dailyAds: 20,
      },
      4: {
        coinMultiplier: 1.5,
        gemMultiplier: 1.3,
        xpMultiplier: 1.5,
        maxLives: 5,
        dailyAds: 25,
      },
      5: {
        coinMultiplier: 1.75,
        gemMultiplier: 1.5,
        xpMultiplier: 1.75,
        maxLives: 6,
        dailyAds: 30,
      },
      6: {
        coinMultiplier: 2.0,
        gemMultiplier: 1.75,
        xpMultiplier: 2.0,
        maxLives: 7,
        dailyAds: 40,
      },
      7: {
        coinMultiplier: 2.5,
        gemMultiplier: 2.0,
        xpMultiplier: 2.5,
        maxLives: 8,
        dailyAds: 50,
      },
      8: {
        coinMultiplier: 3.0,
        gemMultiplier: 2.5,
        xpMultiplier: 3.0,
        maxLives: 9,
        dailyAds: 75,
      },
      9: {
        coinMultiplier: 5.0,
        gemMultiplier: 3.0,
        xpMultiplier: 5.0,
        maxLives: 10,
        dailyAds: 100,
      },
    };
    
    return benefits[this.vipLevel] || benefits[0];
  }
  
  // Subscription management
  public async activateSubscription(type: 'monthly' | 'yearly'): Promise<{ success: boolean; error?: string }> {
    const productId = type === 'monthly' ? 'vip_monthly' : 'vip_yearly';
    const product = this.products.get(productId);
    
    if (!product) {
      return { success: false, error: 'Invalid subscription type' };
    }
    
    const duration = type === 'monthly' ? 30 : 365;
    
    this.activeSubscription = {
      id: `sub_${Date.now()}`,
      type,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      benefits: [
        'Double daily rewards',
        'No ads',
        'Exclusive skins',
        'Priority support',
        'VIP badge',
      ],
      autoRenew: true,
    };
    
    await this.saveUserData();
    
    return { success: true };
  }
  
  public cancelSubscription(): void {
    if (this.activeSubscription) {
      this.activeSubscription.autoRenew = false;
      this.activeSubscription.status = 'cancelled';
      this.saveUserData();
    }
  }
  
  // Getters
  public getProducts(): Product[] {
    return Array.from(this.products.values());
  }
  
  public getActiveSubscription(): Subscription | null {
    return this.activeSubscription;
  }
  
  public getDailyStreak(): number {
    return this.currentDailyStreak;
  }
  
  public getVIPLevel(): number {
    return this.vipLevel;
  }
  
  public getTotalSpent(): number {
    return this.totalSpent;
  }
  
  public canWatchAd(): boolean {
    return this.watchedAdsToday < this.maxDailyAds;
  }
  
  public getRemainingAds(): number {
    return Math.max(0, this.maxDailyAds - this.watchedAdsToday);
  }
  
  public hasProduct(productId: string): boolean {
    return this.purchases.some(p => p.productId === productId && p.status === 'completed');
  }
  
  public isSubscriptionActive(): boolean {
    if (!this.activeSubscription) return false;
    
    const now = new Date();
    return this.activeSubscription.status === 'active' && 
           (!this.activeSubscription.endDate || new Date(this.activeSubscription.endDate) > now);
  }
  
  // Special offers
  public getSpecialOffers(): Product[] {
    const offers: Product[] = [];
    
    // First-time buyer offer
    if (this.totalSpent === 0) {
      offers.push({
        id: 'first_time_offer',
        name: 'First Time Special',
        description: '80% OFF - One time only!',
        price: 0.99,
        currency: 'USD',
        type: 'non-consumable',
        rewards: [
          { type: 'coins', amount: 5000 },
          { type: 'gems', amount: 100 },
        ],
        bonus: 'Limited Time!',
        bestValue: true,
      });
    }
    
    // Weekend offer (Friday-Sunday)
    const day = new Date().getDay();
    if (day === 0 || day === 5 || day === 6) {
      offers.push({
        id: 'weekend_special',
        name: 'Weekend Bonanza',
        description: 'Double rewards this weekend!',
        price: 4.99,
        currency: 'USD',
        type: 'consumable',
        rewards: [
          { type: 'coins', amount: 10000 },
          { type: 'gems', amount: 100 },
        ],
        bonus: 'Weekend Only!',
        popular: true,
      });
    }
    
    return offers;
  }
}

export const monetizationManager = new MonetizationManager();