/**
 * Pricing Constants
 * Centralized pricing configuration for consistency across the app
 */

// Currency Types
export enum CurrencyType {
  COINS = 'coins',
  GEMS = 'gems',
  USD = 'usd',
}

// Starting amounts
export const STARTING_AMOUNTS = {
  COINS: 100,
  GEMS: 0,
} as const;

// In-App Purchases (USD)
export const IAP_PRICING = {
  // Coin Packages
  SMALL_COIN_PACK: {
    id: 'small_coin_pack',
    amount: 1000,
    price: '$0.99',
    currency: CurrencyType.USD,
    bonus: 0,
  },
  MEDIUM_COIN_PACK: {
    id: 'medium_coin_pack',
    amount: 5000,
    price: '$3.99',
    currency: CurrencyType.USD,
    bonus: 500,
  },
  LARGE_COIN_PACK: {
    id: 'large_coin_pack',
    amount: 12000,
    price: '$6.99',
    currency: CurrencyType.USD,
    bonus: 2000,
  },
  MEGA_COIN_PACK: {
    id: 'mega_coin_pack',
    amount: 25000,
    price: '$14.99',
    currency: CurrencyType.USD,
    bonus: 5000,
  },

  // Gem Packages
  SMALL_GEM_PACK: {
    id: 'small_gem_pack',
    amount: 100,
    price: '$1.99',
    currency: CurrencyType.USD,
    bonus: 0,
  },
  LARGE_GEM_PACK: {
    id: 'large_gem_pack',
    amount: 500,
    price: '$2.99',
    currency: CurrencyType.USD,
    bonus: 50,
  },

  // Subscriptions
  GOLD_VAULT_MONTHLY: {
    id: 'gold_vault_monthly',
    price: '$4.99',
    currency: CurrencyType.USD,
    period: 'month',
    benefits: ['Daily 500 coin bonus', 'Monthly Pro Drops', 'Exclusive skins', 'Priority support'],
  },

  // Special Items
  REMOVE_ADS: {
    id: 'remove_ads',
    price: '$1.99',
    currency: CurrencyType.USD,
    permanent: true,
  },

  // State Skins
  STATE_SKIN_UNLOCK: {
    id: 'state_skin_unlock',
    price: '$0.99',
    currency: CurrencyType.USD,
  },
} as const;

// In-Game Shop Items (Coins/Gems)
export const SHOP_PRICING = {
  // Carts
  CARTS: {
    aurora_gold_v1: { price: 5000, currency: CurrencyType.COINS, rarity: 'legendary' },
    harvest_brass_v1: { price: 3000, currency: CurrencyType.COINS, rarity: 'epic' },
    mystic_silver_v1: { price: 2000, currency: CurrencyType.COINS, rarity: 'rare' },
    woodland_copper_v1: { price: 1000, currency: CurrencyType.COINS, rarity: 'uncommon' },
    basic_iron_v1: { price: 500, currency: CurrencyType.COINS, rarity: 'common' },
  },

  // Trails
  TRAILS: {
    sunflare_v1: { price: 2000, currency: CurrencyType.COINS, rarity: 'rare' },
    crystal_snow_v1: { price: 100, currency: CurrencyType.GEMS, rarity: 'seasonal' },
    rainbow_spark_v1: { price: 1500, currency: CurrencyType.COINS, rarity: 'uncommon' },
    golden_dust_v1: { price: 3000, currency: CurrencyType.COINS, rarity: 'epic' },
  },

  // Badges
  BADGES: {
    founders_vault_v1: { price: 1500, currency: CurrencyType.COINS, rarity: 'epic' },
    achievement_master_v1: { price: 2500, currency: CurrencyType.COINS, rarity: 'legendary' },
    skilled_collector_v1: { price: 1000, currency: CurrencyType.COINS, rarity: 'rare' },
    starter_badge_v1: { price: 250, currency: CurrencyType.COINS, rarity: 'common' },
  },

  // Frames
  FRAMES: {
    aurum_ribbon_v1: { price: 1000, currency: CurrencyType.COINS, rarity: 'uncommon' },
    platinum_border_v1: { price: 2000, currency: CurrencyType.COINS, rarity: 'rare' },
    diamond_edge_v1: { price: 4000, currency: CurrencyType.COINS, rarity: 'legendary' },
    seasonal_wreath_v1: { price: 150, currency: CurrencyType.GEMS, rarity: 'seasonal' },
  },
} as const;

// Upgrade Pricing
export const UPGRADE_PRICING = {
  // Base costs for different upgrade types
  BASE_COSTS: {
    POT_SIZE: 100,
    POT_SPEED: 150,
    MAGNET_RANGE: 200,
    COIN_VALUE: 300,
    BONUS_CHANCE: 250,
    SPECIAL_ITEMS: 500,
  },

  // Price scaling multiplier per level
  SCALING_MULTIPLIER: 1.5,

  // Maximum levels
  MAX_LEVELS: {
    POT_SIZE: 10,
    POT_SPEED: 10,
    MAGNET_RANGE: 8,
    COIN_VALUE: 15,
    BONUS_CHANCE: 12,
    SPECIAL_ITEMS: 5,
  },
} as const;

// Unlock Requirements
export const UNLOCK_REQUIREMENTS = {
  // Coin-based unlocks
  FIRST_SKIN: 1000,
  RARE_ITEMS: 5000,
  EPIC_ITEMS: 10000,
  LEGENDARY_ITEMS: 25000,

  // Achievement-based unlocks
  SCORE_MILESTONES: {
    BRONZE: 1000,
    SILVER: 5000,
    GOLD: 10000,
    PLATINUM: 25000,
    DIAMOND: 50000,
    MASTER: 100000,
  },

  // Collection milestones
  COLLECTION_TIERS: {
    BEGINNER: 5, // items collected
    AMATEUR: 15,
    EXPERT: 30,
    MASTER: 50,
    LEGENDARY: 100,
  },
} as const;

// Mission Rewards
export const MISSION_REWARDS = {
  DAILY: {
    EASY: { coins: 50, gems: 0 },
    MEDIUM: { coins: 100, gems: 0 },
    HARD: { coins: 200, gems: 5 },
  },

  WEEKLY: {
    EASY: { coins: 300, gems: 10 },
    MEDIUM: { coins: 600, gems: 25 },
    HARD: { coins: 1000, gems: 50 },
  },

  SPECIAL: {
    SEASONAL: { coins: 2000, gems: 100 },
    ACHIEVEMENT: { coins: 1500, gems: 75 },
    MILESTONE: { coins: 5000, gems: 200 },
  },
} as const;

// Helper functions
export function calculateUpgradePrice(basePrice: number, currentLevel: number): number {
  return Math.floor(basePrice * Math.pow(UPGRADE_PRICING.SCALING_MULTIPLIER, currentLevel));
}

export function formatPrice(amount: number, currency: CurrencyType): string {
  switch (currency) {
    case CurrencyType.COINS:
      return `${amount.toLocaleString()} 🪙`;
    case CurrencyType.GEMS:
      return `${amount.toLocaleString()} 💎`;
    case CurrencyType.USD:
      return `$${(amount / 100).toFixed(2)}`;
    default:
      return amount.toString();
  }
}

export function getCurrencyEmoji(currency: CurrencyType): string {
  switch (currency) {
    case CurrencyType.COINS:
      return '🪙';
    case CurrencyType.GEMS:
      return '💎';
    case CurrencyType.USD:
      return '$';
    default:
      return '';
  }
}

export function validatePricing(): boolean {
  // Validate that all prices are reasonable
  const issues: string[] = [];

  // Check for negative prices
  Object.entries(SHOP_PRICING).forEach(([category, items]) => {
    Object.entries(items).forEach(([itemId, config]) => {
      if (config.price < 0) {
        issues.push(`Negative price for ${category}.${itemId}: ${config.price}`);
      }
    });
  });

  // Check for unreasonably high prices
  const MAX_COIN_PRICE = 50000;
  const MAX_GEM_PRICE = 1000;

  Object.entries(SHOP_PRICING).forEach(([category, items]) => {
    Object.entries(items).forEach(([itemId, config]) => {
      if (config.currency === CurrencyType.COINS && config.price > MAX_COIN_PRICE) {
        issues.push(`Price too high for ${category}.${itemId}: ${config.price} coins`);
      }
      if (config.currency === CurrencyType.GEMS && config.price > MAX_GEM_PRICE) {
        issues.push(`Price too high for ${category}.${itemId}: ${config.price} gems`);
      }
    });
  });

  if (issues.length > 0) {
    console.warn('Pricing validation issues:', issues);
    return false;
  }

  return true;
}

// Export pricing validation
export const PRICING_VALID = validatePricing();
