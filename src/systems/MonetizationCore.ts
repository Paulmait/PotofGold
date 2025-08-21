/**
 * Core Monetization System
 * Implements dual currency, economy management, and monetization infrastructure
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../firebase/firebase';
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';

// ========== CURRENCY SYSTEM ==========

export interface Currency {
  type: 'soft' | 'hard';
  amount: number;
  icon: string;
  color: string;
  name: string;
}

export interface PlayerWallet {
  coins: number;      // Soft currency
  gems: number;       // Hard currency
  tickets: number;    // Event currency
  stars: number;      // Progression currency
  energy: number;     // Energy system
  keys: number;       // Loot box keys
  lastUpdated: number;
  totalSpent: CurrencySpent;
  totalEarned: CurrencyEarned;
}

interface CurrencySpent {
  coins: number;
  gems: number;
  realMoney: number;
  firstPurchaseDate?: number;
  lastPurchaseDate?: number;
  purchaseCount: number;
  vipPoints: number;
}

interface CurrencyEarned {
  coins: number;
  gems: number;
  fromGameplay: number;
  fromPurchases: number;
  fromEvents: number;
  fromBattlePass: number;
  fromDailyRewards: number;
}

export class CurrencyManager {
  private wallet: PlayerWallet;
  private exchangeRates: Map<string, number> = new Map();
  
  constructor() {
    this.wallet = this.getDefaultWallet();
    this.initializeExchangeRates();
  }
  
  private getDefaultWallet(): PlayerWallet {
    return {
      coins: 100,     // Start with 100 coins
      gems: 5,        // Start with 5 gems
      tickets: 0,
      stars: 0,
      energy: 50,
      keys: 1,        // Give 1 free key
      lastUpdated: Date.now(),
      totalSpent: {
        coins: 0,
        gems: 0,
        realMoney: 0,
        purchaseCount: 0,
        vipPoints: 0
      },
      totalEarned: {
        coins: 100,
        gems: 5,
        fromGameplay: 0,
        fromPurchases: 0,
        fromEvents: 0,
        fromBattlePass: 0,
        fromDailyRewards: 0
      }
    };
  }
  
  private initializeExchangeRates() {
    // Soft to hard currency exchange (intentionally bad rate to encourage purchases)
    this.exchangeRates.set('coins_to_gems', 100); // 100 coins = 1 gem
    this.exchangeRates.set('gems_to_coins', 20);  // 1 gem = 20 coins (loss on conversion)
    this.exchangeRates.set('tickets_to_gems', 50); // Event tickets to gems
  }
  
  async loadWallet(userId: string): Promise<PlayerWallet> {
    try {
      const docRef = doc(db, 'wallets', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        this.wallet = docSnap.data() as PlayerWallet;
      } else {
        this.wallet = this.getDefaultWallet();
        await this.saveWallet(userId);
      }
      
      return this.wallet;
    } catch (error) {
      console.error('Error loading wallet:', error);
      return this.getDefaultWallet();
    }
  }
  
  async saveWallet(userId: string): Promise<void> {
    try {
      const docRef = doc(db, 'wallets', userId);
      await setDoc(docRef, this.wallet, { merge: true });
    } catch (error) {
      console.error('Error saving wallet:', error);
    }
  }
  
  async addCurrency(
    type: 'coins' | 'gems' | 'tickets' | 'stars' | 'energy' | 'keys',
    amount: number,
    source: string,
    userId: string
  ): Promise<boolean> {
    try {
      this.wallet[type] += amount;
      this.wallet.lastUpdated = Date.now();
      
      // Track earnings
      if (type === 'coins') {
        this.wallet.totalEarned.coins += amount;
      } else if (type === 'gems') {
        this.wallet.totalEarned.gems += amount;
      }
      
      // Track source
      switch(source) {
        case 'gameplay':
          this.wallet.totalEarned.fromGameplay += amount;
          break;
        case 'purchase':
          this.wallet.totalEarned.fromPurchases += amount;
          break;
        case 'event':
          this.wallet.totalEarned.fromEvents += amount;
          break;
        case 'battlepass':
          this.wallet.totalEarned.fromBattlePass += amount;
          break;
        case 'daily':
          this.wallet.totalEarned.fromDailyRewards += amount;
          break;
      }
      
      await this.saveWallet(userId);
      this.triggerWalletAnimation(type, amount, true);
      return true;
    } catch (error) {
      console.error('Error adding currency:', error);
      return false;
    }
  }
  
  async spendCurrency(
    type: 'coins' | 'gems' | 'tickets' | 'stars' | 'energy' | 'keys',
    amount: number,
    userId: string
  ): Promise<boolean> {
    if (this.wallet[type] < amount) {
      this.showInsufficientFundsPrompt(type, amount);
      return false;
    }
    
    try {
      this.wallet[type] -= amount;
      this.wallet.lastUpdated = Date.now();
      
      // Track spending
      if (type === 'coins') {
        this.wallet.totalSpent.coins += amount;
      } else if (type === 'gems') {
        this.wallet.totalSpent.gems += amount;
        // Gems spent contribute to VIP points
        this.wallet.totalSpent.vipPoints += amount;
      }
      
      await this.saveWallet(userId);
      this.triggerWalletAnimation(type, amount, false);
      return true;
    } catch (error) {
      console.error('Error spending currency:', error);
      return false;
    }
  }
  
  canAfford(type: keyof PlayerWallet, amount: number): boolean {
    return typeof this.wallet[type] === 'number' && this.wallet[type] >= amount;
  }
  
  private showInsufficientFundsPrompt(type: string, needed: number) {
    const current = this.wallet[type as keyof PlayerWallet];
    const deficit = needed - (current as number);
    
    // Trigger purchase prompt with smart suggestions
    return {
      show: true,
      type: 'insufficient_funds',
      currency: type,
      needed: deficit,
      suggestions: this.getSmartPurchaseSuggestions(type, deficit)
    };
  }
  
  private getSmartPurchaseSuggestions(type: string, deficit: number): any[] {
    const suggestions = [];
    
    if (type === 'coins') {
      // Suggest coin packages
      suggestions.push(
        { package: 'small_coin_pack', amount: 1000, price: '$0.99', highlight: deficit <= 1000 },
        { package: 'medium_coin_pack', amount: 5000, price: '$4.99', highlight: deficit > 1000 && deficit <= 5000 },
        { package: 'large_coin_pack', amount: 12000, price: '$9.99', highlight: deficit > 5000, bestValue: true }
      );
    } else if (type === 'gems') {
      // Suggest gem packages
      suggestions.push(
        { package: 'small_gem_pack', amount: 100, price: '$1.99', highlight: deficit <= 100 },
        { package: 'medium_gem_pack', amount: 500, price: '$9.99', highlight: deficit > 100 && deficit <= 500 },
        { package: 'large_gem_pack', amount: 1200, price: '$19.99', highlight: deficit > 500, bestValue: true }
      );
    }
    
    return suggestions;
  }
  
  private triggerWalletAnimation(type: string, amount: number, isGain: boolean) {
    // Emit event for UI to show currency animation
    return {
      type: isGain ? 'currency_gain' : 'currency_spend',
      currency: type,
      amount,
      animation: this.selectAnimation(type, amount, isGain)
    };
  }
  
  private selectAnimation(type: string, amount: number, isGain: boolean): string {
    if (type === 'gems' && amount >= 100) return 'epic_gem_shower';
    if (type === 'coins' && amount >= 1000) return 'coin_explosion';
    if (isGain) return 'sparkle_collect';
    return 'fade_out';
  }
}

// ========== PRICING STRATEGIES ==========

export class PricingStrategy {
  private playerSegment: PlayerSegment;
  private regionalPricing: Map<string, number> = new Map();
  
  async determinePlayerSegment(wallet: PlayerWallet): Promise<PlayerSegment> {
    const totalSpent = wallet.totalSpent.realMoney;
    const daysSinceFirstPurchase = wallet.totalSpent.firstPurchaseDate 
      ? (Date.now() - wallet.totalSpent.firstPurchaseDate) / (1000 * 60 * 60 * 24)
      : 0;
    
    if (totalSpent === 0) {
      return PlayerSegment.NON_PAYER;
    } else if (totalSpent < 5) {
      return PlayerSegment.MINNOW;
    } else if (totalSpent < 50) {
      return PlayerSegment.DOLPHIN;
    } else if (totalSpent < 500) {
      return PlayerSegment.WHALE;
    } else {
      return PlayerSegment.SUPER_WHALE;
    }
  }
  
  getPersonalizedOffers(segment: PlayerSegment): Offer[] {
    switch(segment) {
      case PlayerSegment.NON_PAYER:
        return this.getFirstTimeBuyerOffers();
      case PlayerSegment.MINNOW:
        return this.getValueOffers();
      case PlayerSegment.DOLPHIN:
        return this.getMidTierOffers();
      case PlayerSegment.WHALE:
        return this.getPremiumOffers();
      case PlayerSegment.SUPER_WHALE:
        return this.getExclusiveOffers();
      default:
        return this.getStandardOffers();
    }
  }
  
  private getFirstTimeBuyerOffers(): Offer[] {
    return [
      {
        id: 'starter_pack',
        name: 'Starter Pack - 80% OFF!',
        description: 'One-time offer for new players',
        originalPrice: 4.99,
        discountedPrice: 0.99,
        contents: [
          { type: 'gems', amount: 100 },
          { type: 'coins', amount: 5000 },
          { type: 'keys', amount: 3 },
          { type: 'energy', amount: 50 }
        ],
        timeLimit: 48 * 60 * 60 * 1000, // 48 hours
        highlight: 'BEST VALUE',
        oneTimePurchase: true
      }
    ];
  }
  
  private getValueOffers(): Offer[] {
    return [
      {
        id: 'value_bundle',
        name: 'Value Bundle',
        description: 'Great value for regular players',
        originalPrice: 9.99,
        discountedPrice: 4.99,
        contents: [
          { type: 'gems', amount: 300 },
          { type: 'coins', amount: 10000 }
        ],
        timeLimit: 24 * 60 * 60 * 1000,
        highlight: '50% OFF'
      }
    ];
  }
  
  private getMidTierOffers(): Offer[] {
    return [
      {
        id: 'premium_bundle',
        name: 'Premium Bundle',
        description: 'For serious players',
        originalPrice: 29.99,
        discountedPrice: 19.99,
        contents: [
          { type: 'gems', amount: 1000 },
          { type: 'coins', amount: 50000 },
          { type: 'exclusive_skin', amount: 1 }
        ],
        timeLimit: 72 * 60 * 60 * 1000,
        highlight: 'EXCLUSIVE SKIN'
      }
    ];
  }
  
  private getPremiumOffers(): Offer[] {
    return [
      {
        id: 'whale_special',
        name: 'VIP Mega Bundle',
        description: 'Ultimate value package',
        originalPrice: 99.99,
        discountedPrice: 79.99,
        contents: [
          { type: 'gems', amount: 5000 },
          { type: 'coins', amount: 200000 },
          { type: 'vip_points', amount: 1000 },
          { type: 'legendary_crate', amount: 5 }
        ],
        highlight: 'VIP BONUS'
      }
    ];
  }
  
  private getExclusiveOffers(): Offer[] {
    return [
      {
        id: 'super_whale_exclusive',
        name: 'Founder\'s Collection',
        description: 'Ultra-exclusive limited edition',
        originalPrice: 499.99,
        discountedPrice: 399.99,
        contents: [
          { type: 'gems', amount: 30000 },
          { type: 'coins', amount: 1000000 },
          { type: 'founder_badge', amount: 1 },
          { type: 'all_skins_unlock', amount: 1 },
          { type: 'lifetime_vip', amount: 1 }
        ],
        highlight: 'LIFETIME VIP',
        limited: 100 // Only 100 available
      }
    ];
  }
  
  private getStandardOffers(): Offer[] {
    return [
      {
        id: 'daily_deal',
        name: 'Daily Deal',
        description: 'Today\'s special offer',
        originalPrice: 2.99,
        discountedPrice: 1.99,
        contents: [
          { type: 'gems', amount: 60 },
          { type: 'coins', amount: 2000 }
        ],
        timeLimit: 24 * 60 * 60 * 1000
      }
    ];
  }
  
  calculateDynamicPricing(basePrice: number, factors: PricingFactors): number {
    let price = basePrice;
    
    // Time-based pricing
    const hour = new Date().getHours();
    if (hour >= 18 && hour <= 22) {
      price *= 0.9; // 10% discount during peak hours
    }
    
    // Engagement-based pricing
    if (factors.daysSinceLastPurchase > 30) {
      price *= 0.85; // 15% discount for returning buyers
    }
    
    // Competition-based pricing
    if (factors.friendsPurchased > 2) {
      price *= 0.95; // 5% social discount
    }
    
    // Regional pricing
    price *= factors.regionalMultiplier;
    
    return Math.round(price * 100) / 100;
  }
}

// ========== OFFER MANAGEMENT ==========

export class OfferManager {
  private activeOffers: Map<string, Offer> = new Map();
  private offerHistory: OfferHistory[] = [];
  
  async generateDailyOffers(userId: string, wallet: PlayerWallet): Promise<Offer[]> {
    const strategy = new PricingStrategy();
    const segment = await strategy.determinePlayerSegment(wallet);
    const offers = strategy.getPersonalizedOffers(segment);
    
    // Add flash sales
    if (Math.random() < 0.3) { // 30% chance of flash sale
      offers.push(this.generateFlashSale());
    }
    
    // Add progressive offers
    const progressiveOffer = this.generateProgressiveOffer(wallet);
    if (progressiveOffer) {
      offers.push(progressiveOffer);
    }
    
    // Store active offers
    offers.forEach(offer => {
      this.activeOffers.set(offer.id, offer);
    });
    
    return offers;
  }
  
  private generateFlashSale(): Offer {
    const flashSales = [
      {
        id: 'flash_gems',
        name: '⚡ FLASH SALE - 70% OFF GEMS!',
        description: 'Limited time mega discount',
        originalPrice: 9.99,
        discountedPrice: 2.99,
        contents: [{ type: 'gems', amount: 500 }],
        timeLimit: 30 * 60 * 1000, // 30 minutes
        highlight: 'ENDING SOON',
        flashSale: true
      },
      {
        id: 'flash_energy',
        name: '⚡ UNLIMITED ENERGY - 1 HOUR',
        description: 'Play without limits',
        originalPrice: 4.99,
        discountedPrice: 1.99,
        contents: [{ type: 'unlimited_energy', duration: 3600000 }],
        timeLimit: 15 * 60 * 1000, // 15 minutes
        highlight: 'RARE OFFER',
        flashSale: true
      }
    ];
    
    return flashSales[Math.floor(Math.random() * flashSales.length)];
  }
  
  private generateProgressiveOffer(wallet: PlayerWallet): Offer | null {
    const spentToday = this.calculateDailySpend(wallet);
    
    if (spentToday > 0 && spentToday < 20) {
      return {
        id: 'progressive_offer',
        name: 'Thank You Bonus!',
        description: 'Exclusive for today\'s supporters',
        originalPrice: 14.99,
        discountedPrice: 4.99,
        contents: [
          { type: 'gems', amount: 300 },
          { type: 'coins', amount: 15000 },
          { type: 'keys', amount: 5 }
        ],
        timeLimit: 6 * 60 * 60 * 1000, // 6 hours
        highlight: 'VIP BONUS',
        requirement: 'Made a purchase today'
      };
    }
    
    return null;
  }
  
  private calculateDailySpend(wallet: PlayerWallet): number {
    const today = new Date().setHours(0, 0, 0, 0);
    const lastPurchase = wallet.totalSpent.lastPurchaseDate || 0;
    
    if (lastPurchase >= today) {
      // Return approximate daily spend (would track actual in production)
      return 10; // Placeholder
    }
    
    return 0;
  }
  
  async purchaseOffer(offerId: string, userId: string): Promise<PurchaseResult> {
    const offer = this.activeOffers.get(offerId);
    
    if (!offer) {
      return { success: false, error: 'Offer not found' };
    }
    
    // Check if offer is still valid
    if (offer.timeLimit && Date.now() > offer.timeLimit) {
      return { success: false, error: 'Offer expired' };
    }
    
    // Process payment (integrate with payment provider)
    const paymentResult = await this.processPayment(offer.discountedPrice, userId);
    
    if (!paymentResult.success) {
      return { success: false, error: 'Payment failed' };
    }
    
    // Grant rewards
    const currencyManager = new CurrencyManager();
    for (const content of offer.contents) {
      if (content.type in ['gems', 'coins', 'tickets', 'stars', 'energy', 'keys']) {
        await currencyManager.addCurrency(
          content.type as any,
          content.amount,
          'purchase',
          userId
        );
      }
    }
    
    // Record purchase
    this.offerHistory.push({
      offerId,
      userId,
      purchaseDate: Date.now(),
      price: offer.discountedPrice
    });
    
    // Remove one-time offers
    if (offer.oneTimePurchase) {
      this.activeOffers.delete(offerId);
    }
    
    return { 
      success: true, 
      rewards: offer.contents,
      vipPointsEarned: Math.floor(offer.discountedPrice * 10)
    };
  }
  
  private async processPayment(amount: number, userId: string): Promise<any> {
    // Integrate with payment provider (Stripe, Apple Pay, Google Pay, etc.)
    // This is a placeholder
    return { success: true, transactionId: `txn_${Date.now()}` };
  }
}

// ========== TYPE DEFINITIONS ==========

export enum PlayerSegment {
  NON_PAYER = 'non_payer',
  MINNOW = 'minnow',        // < $5
  DOLPHIN = 'dolphin',      // $5-50
  WHALE = 'whale',          // $50-500
  SUPER_WHALE = 'super_whale' // $500+
}

export interface Offer {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  contents: OfferContent[];
  timeLimit?: number;
  highlight?: string;
  oneTimePurchase?: boolean;
  flashSale?: boolean;
  requirement?: string;
  limited?: number;
}

interface OfferContent {
  type: string;
  amount: number;
  duration?: number;
}

interface OfferHistory {
  offerId: string;
  userId: string;
  purchaseDate: number;
  price: number;
}

interface PricingFactors {
  daysSinceLastPurchase: number;
  friendsPurchased: number;
  regionalMultiplier: number;
}

interface PurchaseResult {
  success: boolean;
  error?: string;
  rewards?: OfferContent[];
  vipPointsEarned?: number;
}

// ========== EXPORT ==========

export class MonetizationCore {
  public currencyManager = new CurrencyManager();
  public pricingStrategy = new PricingStrategy();
  public offerManager = new OfferManager();
  
  async initialize(userId: string): Promise<void> {
    await this.currencyManager.loadWallet(userId);
  }
}