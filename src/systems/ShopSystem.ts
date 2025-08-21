/**
 * Shop System
 * Complete in-game store with IAP integration and item management
 */

import Purchases, { 
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  PRODUCT_CATEGORY
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { MonetizationCore, CurrencyManager } from './MonetizationCore';

// ========== SHOP CORE ==========

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  description: string;
  price: number;
  currency: 'coins' | 'gems' | 'real_money';
  originalPrice?: number; // For discounts
  discount?: number; // Percentage
  icon: string;
  preview?: string; // Preview image URL
  contents: ItemContent[];
  tags: string[];
  featured: boolean;
  new: boolean;
  limited?: LimitedOffer;
  requirements?: ItemRequirements;
  purchaseLimit?: number;
  timesPurchased: number;
}

export type ShopCategory = 
  | 'currency'
  | 'skins'
  | 'power_ups'
  | 'loot_boxes'
  | 'bundles'
  | 'battle_pass'
  | 'energy'
  | 'special_offers';

interface ItemContent {
  type: string;
  amount: number;
  quality?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
}

interface LimitedOffer {
  endTime: number;
  stock?: number;
  personalLimit?: number;
}

interface ItemRequirements {
  minLevel?: number;
  vipLevel?: number;
  achievement?: string;
}

export class ShopManager {
  private shopInventory: Map<string, ShopItem> = new Map();
  private purchaseHistory: PurchaseRecord[] = [];
  private currencyManager: CurrencyManager;
  private activeOffers: Map<string, ShopItem> = new Map();
  
  constructor() {
    this.currencyManager = new CurrencyManager();
    this.initializeRevenueCat();
  }
  
  private async initializeRevenueCat() {
    try {
      const apiKey = Platform.OS === 'ios' 
        ? process.env.REVENUECAT_IOS_KEY || ''
        : process.env.REVENUECAT_ANDROID_KEY || '';
      
      await Purchases.configure({ apiKey });
      
      // Set up listener for customer info updates
      Purchases.addCustomerInfoUpdateListener((info) => {
        this.handleCustomerInfoUpdate(info);
      });
    } catch (error) {
      console.error('RevenueCat initialization error:', error);
    }
  }
  
  async loadShop(userId: string): Promise<ShopSection[]> {
    // Load shop inventory
    this.loadBaseInventory();
    
    // Load personalized offers
    await this.loadPersonalizedOffers(userId);
    
    // Load IAP products
    await this.loadIAPProducts();
    
    // Organize into sections
    return this.organizeShopSections();
  }
  
  private loadBaseInventory() {
    // Currency Packs
    this.addShopItem({
      id: 'coins_small',
      category: 'currency',
      name: 'Handful of Coins',
      description: '1,000 coins to spend',
      price: 0.99,
      currency: 'real_money',
      icon: '🪙',
      contents: [{ type: 'coins', amount: 1000 }],
      tags: ['popular'],
      featured: false,
      new: false,
      timesPurchased: 0
    });
    
    this.addShopItem({
      id: 'coins_medium',
      category: 'currency',
      name: 'Bag of Coins',
      description: '5,500 coins (10% bonus)',
      price: 4.99,
      currency: 'real_money',
      originalPrice: 5.49,
      discount: 10,
      icon: '💰',
      contents: [{ type: 'coins', amount: 5500 }],
      tags: ['popular', 'value'],
      featured: true,
      new: false,
      timesPurchased: 0
    });
    
    this.addShopItem({
      id: 'coins_large',
      category: 'currency',
      name: 'Chest of Coins',
      description: '12,000 coins (20% bonus)',
      price: 9.99,
      currency: 'real_money',
      originalPrice: 11.99,
      discount: 20,
      icon: '🏆',
      contents: [{ type: 'coins', amount: 12000 }],
      tags: ['best_value'],
      featured: true,
      new: false,
      timesPurchased: 0
    });
    
    this.addShopItem({
      id: 'gems_small',
      category: 'currency',
      name: 'Gem Pouch',
      description: '100 precious gems',
      price: 1.99,
      currency: 'real_money',
      icon: '💎',
      contents: [{ type: 'gems', amount: 100 }],
      tags: ['premium'],
      featured: false,
      new: false,
      timesPurchased: 0
    });
    
    this.addShopItem({
      id: 'gems_medium',
      category: 'currency',
      name: 'Gem Bundle',
      description: '550 gems (10% bonus)',
      price: 9.99,
      currency: 'real_money',
      originalPrice: 10.99,
      discount: 10,
      icon: '💎',
      contents: [{ type: 'gems', amount: 550 }],
      tags: ['premium', 'popular'],
      featured: true,
      new: false,
      timesPurchased: 0
    });
    
    this.addShopItem({
      id: 'gems_large',
      category: 'currency',
      name: 'Gem Vault',
      description: '1,200 gems (20% bonus)',
      price: 19.99,
      currency: 'real_money',
      originalPrice: 23.99,
      discount: 20,
      icon: '💎',
      contents: [{ type: 'gems', amount: 1200 }],
      tags: ['premium', 'best_value'],
      featured: true,
      new: false,
      timesPurchased: 0
    });
    
    // Bundles
    this.addShopItem({
      id: 'starter_bundle',
      category: 'bundles',
      name: 'Starter Pack',
      description: 'Perfect for new players!',
      price: 2.99,
      currency: 'real_money',
      originalPrice: 9.99,
      discount: 70,
      icon: '🎁',
      contents: [
        { type: 'coins', amount: 5000 },
        { type: 'gems', amount: 200 },
        { type: 'energy', amount: 50 },
        { type: 'loot_box', amount: 3, quality: 'rare' }
      ],
      tags: ['limited', 'new_player', 'best_value'],
      featured: true,
      new: true,
      limited: {
        endTime: Date.now() + 48 * 60 * 60 * 1000,
        personalLimit: 1
      },
      timesPurchased: 0
    });
    
    this.addShopItem({
      id: 'pro_bundle',
      category: 'bundles',
      name: 'Pro Player Bundle',
      description: 'Everything you need to dominate!',
      price: 49.99,
      currency: 'real_money',
      originalPrice: 99.99,
      discount: 50,
      icon: '👑',
      contents: [
        { type: 'coins', amount: 50000 },
        { type: 'gems', amount: 2500 },
        { type: 'battle_pass', amount: 1 },
        { type: 'legendary_skin', amount: 1, quality: 'legendary' },
        { type: 'xp_boost', amount: 7 }
      ],
      tags: ['premium', 'exclusive'],
      featured: true,
      new: false,
      requirements: {
        minLevel: 10
      },
      timesPurchased: 0
    });
    
    // Loot Boxes
    this.addShopItem({
      id: 'mystery_box_common',
      category: 'loot_boxes',
      name: 'Mystery Box',
      description: 'Contains 3 random items',
      price: 100,
      currency: 'coins',
      icon: '📦',
      contents: [
        { type: 'random_item', amount: 3, quality: 'common' }
      ],
      tags: ['gacha'],
      featured: false,
      new: false,
      timesPurchased: 0
    });
    
    this.addShopItem({
      id: 'rare_crate',
      category: 'loot_boxes',
      name: 'Rare Crate',
      description: 'Guaranteed rare or better!',
      price: 50,
      currency: 'gems',
      icon: '🎁',
      contents: [
        { type: 'random_item', amount: 3, quality: 'rare' }
      ],
      tags: ['gacha', 'popular'],
      featured: true,
      new: false,
      timesPurchased: 0
    });
    
    this.addShopItem({
      id: 'legendary_chest',
      category: 'loot_boxes',
      name: 'Legendary Chest',
      description: 'Guaranteed legendary item!',
      price: 200,
      currency: 'gems',
      icon: '💝',
      contents: [
        { type: 'random_item', amount: 1, quality: 'legendary' },
        { type: 'random_item', amount: 2, quality: 'epic' }
      ],
      tags: ['gacha', 'premium'],
      featured: true,
      new: false,
      timesPurchased: 0
    });
    
    // Power-ups
    this.addShopItem({
      id: 'energy_refill',
      category: 'energy',
      name: 'Energy Refill',
      description: 'Instantly refill your energy',
      price: 20,
      currency: 'gems',
      icon: '⚡',
      contents: [{ type: 'energy', amount: 50 }],
      tags: ['utility'],
      featured: false,
      new: false,
      timesPurchased: 0
    });
    
    this.addShopItem({
      id: 'xp_boost_1d',
      category: 'power_ups',
      name: '2X XP Boost (24h)',
      description: 'Double XP for 24 hours',
      price: 100,
      currency: 'gems',
      icon: '⭐',
      contents: [{ type: 'xp_boost', amount: 1 }],
      tags: ['boost'],
      featured: false,
      new: false,
      timesPurchased: 0
    });
    
    // Skins (Coin Shop)
    this.addShopItem({
      id: 'skin_golden',
      category: 'skins',
      name: 'Golden Cart',
      description: 'Shine like gold!',
      price: 10000,
      currency: 'coins',
      icon: '✨',
      preview: 'golden_cart_preview.png',
      contents: [{ type: 'skin', amount: 1, quality: 'rare' }],
      tags: ['cosmetic'],
      featured: false,
      new: false,
      purchaseLimit: 1,
      timesPurchased: 0
    });
    
    this.addShopItem({
      id: 'skin_rainbow',
      category: 'skins',
      name: 'Rainbow Trail',
      description: 'Leave a rainbow in your wake',
      price: 500,
      currency: 'gems',
      icon: '🌈',
      preview: 'rainbow_trail_preview.png',
      contents: [{ type: 'trail', amount: 1, quality: 'epic' }],
      tags: ['cosmetic', 'effects'],
      featured: true,
      new: true,
      purchaseLimit: 1,
      timesPurchased: 0
    });
  }
  
  private async loadPersonalizedOffers(userId: string) {
    // Get player segment for personalized pricing
    const wallet = await this.currencyManager.loadWallet(userId);
    const monCore = new MonetizationCore();
    const segment = await monCore.pricingStrategy.determinePlayerSegment(wallet);
    const offers = monCore.pricingStrategy.getPersonalizedOffers(segment);
    
    // Convert offers to shop items
    offers.forEach(offer => {
      const shopItem: ShopItem = {
        id: offer.id,
        category: 'special_offers',
        name: offer.name,
        description: offer.description,
        price: offer.discountedPrice,
        currency: 'real_money',
        originalPrice: offer.originalPrice,
        discount: Math.round((1 - offer.discountedPrice / offer.originalPrice) * 100),
        icon: '🎯',
        contents: offer.contents.map(c => ({
          type: c.type,
          amount: c.amount
        })),
        tags: ['personalized', 'limited'],
        featured: true,
        new: true,
        limited: offer.timeLimit ? {
          endTime: Date.now() + offer.timeLimit
        } : undefined,
        timesPurchased: 0
      };
      
      this.activeOffers.set(shopItem.id, shopItem);
    });
  }
  
  private async loadIAPProducts() {
    try {
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current) {
        this.processOffering(offerings.current);
      }
      
      // Process other offerings (seasonal, etc.)
      Object.values(offerings.all).forEach(offering => {
        if (offering.identifier !== offerings.current?.identifier) {
          this.processOffering(offering);
        }
      });
    } catch (error) {
      console.error('Error loading IAP products:', error);
    }
  }
  
  private processOffering(offering: PurchasesOffering) {
    offering.availablePackages.forEach(pkg => {
      // Map RevenueCat package to shop item
      const shopItem = this.mapPackageToShopItem(pkg);
      if (shopItem) {
        this.shopInventory.set(shopItem.id, shopItem);
      }
    });
  }
  
  private mapPackageToShopItem(pkg: PurchasesPackage): ShopItem | null {
    // Map RevenueCat packages to shop items
    const mapping: Record<string, Partial<ShopItem>> = {
      'coins_small': {
        contents: [{ type: 'coins', amount: 1000 }],
        category: 'currency'
      },
      'coins_medium': {
        contents: [{ type: 'coins', amount: 5500 }],
        category: 'currency'
      },
      'coins_large': {
        contents: [{ type: 'coins', amount: 12000 }],
        category: 'currency'
      },
      'gems_small': {
        contents: [{ type: 'gems', amount: 100 }],
        category: 'currency'
      },
      'gems_medium': {
        contents: [{ type: 'gems', amount: 550 }],
        category: 'currency'
      },
      'gems_large': {
        contents: [{ type: 'gems', amount: 1200 }],
        category: 'currency'
      }
    };
    
    const itemData = mapping[pkg.product.identifier];
    if (!itemData) return null;
    
    return {
      id: pkg.product.identifier,
      category: itemData.category as ShopCategory,
      name: pkg.product.title,
      description: pkg.product.description,
      price: pkg.product.price,
      currency: 'real_money',
      icon: '💰',
      contents: itemData.contents || [],
      tags: [],
      featured: false,
      new: false,
      timesPurchased: 0
    };
  }
  
  async purchaseItem(itemId: string, userId: string): Promise<PurchaseResult> {
    const item = this.shopInventory.get(itemId) || this.activeOffers.get(itemId);
    
    if (!item) {
      return { success: false, error: 'Item not found' };
    }
    
    // Check requirements
    if (item.requirements) {
      const meetsRequirements = await this.checkRequirements(item.requirements, userId);
      if (!meetsRequirements) {
        return { success: false, error: 'Requirements not met' };
      }
    }
    
    // Check purchase limit
    if (item.purchaseLimit && item.timesPurchased >= item.purchaseLimit) {
      return { success: false, error: 'Purchase limit reached' };
    }
    
    // Check limited time/stock
    if (item.limited) {
      if (item.limited.endTime && Date.now() > item.limited.endTime) {
        return { success: false, error: 'Offer expired' };
      }
      if (item.limited.stock !== undefined && item.limited.stock <= 0) {
        return { success: false, error: 'Out of stock' };
      }
    }
    
    // Process purchase based on currency type
    let purchaseSuccess = false;
    
    if (item.currency === 'real_money') {
      purchaseSuccess = await this.processIAPPurchase(item, userId);
    } else {
      purchaseSuccess = await this.processVirtualCurrencyPurchase(item, userId);
    }
    
    if (!purchaseSuccess) {
      return { success: false, error: 'Purchase failed' };
    }
    
    // Grant items
    await this.grantPurchasedItems(item, userId);
    
    // Update purchase count
    item.timesPurchased++;
    
    // Update limited stock
    if (item.limited?.stock) {
      item.limited.stock--;
    }
    
    // Record purchase
    this.recordPurchase(item, userId);
    
    // Trigger purchase celebration
    this.triggerPurchaseEffects(item);
    
    return {
      success: true,
      items: item.contents,
      celebration: this.getPurchaseCelebration(item)
    };
  }
  
  private async processIAPPurchase(item: ShopItem, userId: string): Promise<boolean> {
    try {
      // Find the RevenueCat package
      const offerings = await Purchases.getOfferings();
      let targetPackage: PurchasesPackage | null = null;
      
      for (const offering of Object.values(offerings.all)) {
        const pkg = offering.availablePackages.find(p => 
          p.product.identifier === item.id
        );
        if (pkg) {
          targetPackage = pkg;
          break;
        }
      }
      
      if (!targetPackage) {
        console.error('Package not found for item:', item.id);
        return false;
      }
      
      // Make the purchase through RevenueCat
      const { customerInfo } = await Purchases.purchasePackage(targetPackage);
      
      // Verify the purchase
      return this.verifyPurchase(customerInfo, item.id);
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('User cancelled purchase');
      } else {
        console.error('Purchase error:', error);
      }
      return false;
    }
  }
  
  private async processVirtualCurrencyPurchase(item: ShopItem, userId: string): Promise<boolean> {
    const currency = item.currency as 'coins' | 'gems';
    return await this.currencyManager.spendCurrency(currency, item.price, userId);
  }
  
  private verifyPurchase(customerInfo: CustomerInfo, productId: string): boolean {
    // Check if the product is in active entitlements
    return customerInfo.entitlements.active[productId] !== undefined;
  }
  
  private async grantPurchasedItems(item: ShopItem, userId: string) {
    for (const content of item.contents) {
      switch(content.type) {
        case 'coins':
        case 'gems':
        case 'tickets':
        case 'energy':
        case 'keys':
          await this.currencyManager.addCurrency(
            content.type as any,
            content.amount,
            'purchase',
            userId
          );
          break;
        
        case 'skin':
        case 'trail':
        case 'frame':
        case 'badge':
          // Grant cosmetic items
          await this.grantCosmeticItem(content, userId);
          break;
        
        case 'battle_pass':
          // Activate battle pass
          await this.activateBattlePass(userId);
          break;
        
        case 'xp_boost':
          // Activate XP boost
          await this.activateBoost('xp', content.amount, userId);
          break;
        
        case 'loot_box':
        case 'random_item':
          // Open loot box
          await this.openLootBox(content.quality || 'common', content.amount, userId);
          break;
      }
    }
  }
  
  private async checkRequirements(requirements: ItemRequirements, userId: string): Promise<boolean> {
    // Check player level, VIP status, achievements, etc.
    // This would connect to player profile system
    return true; // Placeholder
  }
  
  private recordPurchase(item: ShopItem, userId: string) {
    this.purchaseHistory.push({
      itemId: item.id,
      userId,
      price: item.price,
      currency: item.currency,
      timestamp: Date.now()
    });
  }
  
  private triggerPurchaseEffects(item: ShopItem) {
    return {
      type: 'purchase_complete',
      item: item.name,
      rarity: this.getItemRarity(item),
      effects: this.getPurchaseEffects(item)
    };
  }
  
  private getPurchaseCelebration(item: ShopItem): string {
    if (item.price > 20 || item.currency === 'real_money') {
      return 'epic_purchase';
    } else if (item.tags.includes('legendary')) {
      return 'legendary_purchase';
    } else {
      return 'standard_purchase';
    }
  }
  
  private getPurchaseEffects(item: ShopItem): string[] {
    const effects = ['confetti'];
    
    if (item.price > 10) effects.push('fireworks');
    if (item.tags.includes('legendary')) effects.push('legendary_aura');
    if (item.category === 'bundles') effects.push('bundle_explosion');
    
    return effects;
  }
  
  private getItemRarity(item: ShopItem): string {
    // Determine rarity based on contents
    const qualities = item.contents.map(c => c.quality).filter(Boolean);
    if (qualities.includes('mythic')) return 'mythic';
    if (qualities.includes('legendary')) return 'legendary';
    if (qualities.includes('epic')) return 'epic';
    if (qualities.includes('rare')) return 'rare';
    return 'common';
  }
  
  private organizeShopSections(): ShopSection[] {
    const sections: ShopSection[] = [];
    
    // Featured section
    const featured = Array.from(this.shopInventory.values())
      .filter(item => item.featured);
    if (featured.length > 0) {
      sections.push({
        id: 'featured',
        title: '✨ Featured',
        items: featured,
        layout: 'carousel'
      });
    }
    
    // Special offers
    const offers = Array.from(this.activeOffers.values());
    if (offers.length > 0) {
      sections.push({
        id: 'special_offers',
        title: '🎯 Special Offers',
        items: offers,
        layout: 'grid'
      });
    }
    
    // Categories
    const categories: ShopCategory[] = [
      'bundles', 'currency', 'loot_boxes', 'skins', 
      'power_ups', 'energy', 'battle_pass'
    ];
    
    categories.forEach(category => {
      const items = Array.from(this.shopInventory.values())
        .filter(item => item.category === category);
      
      if (items.length > 0) {
        sections.push({
          id: category,
          title: this.getCategoryTitle(category),
          items,
          layout: category === 'currency' ? 'grid' : 'list'
        });
      }
    });
    
    return sections;
  }
  
  private getCategoryTitle(category: ShopCategory): string {
    const titles: Record<ShopCategory, string> = {
      currency: '💰 Currency',
      skins: '🎨 Skins & Cosmetics',
      power_ups: '⚡ Power-Ups',
      loot_boxes: '🎁 Mystery Boxes',
      bundles: '📦 Bundles',
      battle_pass: '🎖️ Battle Pass',
      energy: '⚡ Energy',
      special_offers: '🎯 Special'
    };
    return titles[category];
  }
  
  private addShopItem(item: ShopItem) {
    this.shopInventory.set(item.id, item);
  }
  
  private handleCustomerInfoUpdate(info: CustomerInfo) {
    // Handle subscription status changes
    console.log('Customer info updated:', info.activeSubscriptions);
  }
  
  // Placeholder methods for item granting
  private async grantCosmeticItem(content: ItemContent, userId: string) {
    // Implement cosmetic item granting
  }
  
  private async activateBattlePass(userId: string) {
    // Implement battle pass activation
  }
  
  private async activateBoost(type: string, duration: number, userId: string) {
    // Implement boost activation
  }
  
  private async openLootBox(quality: string, amount: number, userId: string) {
    // Implement loot box opening
  }
}

// ========== TYPE DEFINITIONS ==========

interface ShopSection {
  id: string;
  title: string;
  items: ShopItem[];
  layout: 'grid' | 'list' | 'carousel';
}

interface PurchaseRecord {
  itemId: string;
  userId: string;
  price: number;
  currency: string;
  timestamp: number;
}

interface PurchaseResult {
  success: boolean;
  error?: string;
  items?: ItemContent[];
  celebration?: string;
}

export default ShopManager;