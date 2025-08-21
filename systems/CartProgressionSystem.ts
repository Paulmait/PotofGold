/**
 * Cart Progression System
 * Complete upgrade path from basic mine cart to legendary vehicles
 * Each upgrade increases collection radius, speed, and special abilities
 */

export interface CartStats {
  id: string;
  name: string;
  tier: CartTier;
  level: number;
  collectionRadius: number;
  movementSpeed: number;
  capacity: number; // How many items can be held
  magnetRange: number;
  specialAbility?: CartAbility;
  visual: CartVisual;
  requirements: UpgradeRequirement;
  stats: {
    coinBonus: number; // Multiplier for coins collected
    gemBonus: number; // Multiplier for gems
    scoreBonus: number; // Score multiplier
    rarityBoost: number; // Increases rare item chances
  };
}

export enum CartTier {
  STARTER = 'starter',
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
  COSMIC = 'cosmic',
}

export interface CartVisual {
  baseColor: string;
  accentColor: string;
  wheelStyle: 'basic' | 'reinforced' | 'golden' | 'diamond' | 'rocket';
  effects: string[]; // ['trail', 'glow', 'sparkles', 'fire', 'rainbow']
  size: number; // Size multiplier
  customModel?: string; // For special carts
}

export interface CartAbility {
  name: string;
  description: string;
  type: AbilityType;
  cooldown: number;
  duration: number;
  effect: () => void;
}

type AbilityType = 
  | 'vacuum' // Sucks all items on screen
  | 'teleport' // Instant movement
  | 'shield' // Temporary invincibility
  | 'double_jump' // Can jump to catch items
  | 'time_freeze' // Freezes falling items
  | 'golden_touch' // Turns nearby items to gold
  | 'phoenix' // Revives once per game
  | 'dragon_breath' // Clears obstacles
  | 'infinity_mode'; // All abilities for short time

export interface UpgradeRequirement {
  coins: number;
  gems?: number;
  level?: number;
  vipLevel?: number;
  collectibles?: { [key: string]: number };
  previousCart?: string;
}

export const CART_PROGRESSION: { [key: string]: CartStats } = {
  // ========== STARTER TIER ==========
  basic_cart: {
    id: 'basic_cart',
    name: 'Rusty Mine Cart',
    tier: CartTier.STARTER,
    level: 1,
    collectionRadius: 40,
    movementSpeed: 1.0,
    capacity: 100,
    magnetRange: 0,
    visual: {
      baseColor: '#8B4513', // Brown wood
      accentColor: '#696969', // Gray metal
      wheelStyle: 'basic',
      effects: [],
      size: 1.0,
    },
    requirements: {
      coins: 0, // Free starter
    },
    stats: {
      coinBonus: 1.0,
      gemBonus: 1.0,
      scoreBonus: 1.0,
      rarityBoost: 1.0,
    },
  },

  // ========== BRONZE TIER ==========
  bronze_cart: {
    id: 'bronze_cart',
    name: 'Bronze Hauler',
    tier: CartTier.BRONZE,
    level: 2,
    collectionRadius: 50,
    movementSpeed: 1.2,
    capacity: 150,
    magnetRange: 20,
    visual: {
      baseColor: '#CD7F32', // Bronze
      accentColor: '#8B4513',
      wheelStyle: 'reinforced',
      effects: ['trail'],
      size: 1.1,
    },
    requirements: {
      coins: 500,
      level: 5,
    },
    stats: {
      coinBonus: 1.1,
      gemBonus: 1.0,
      scoreBonus: 1.1,
      rarityBoost: 1.05,
    },
  },

  reinforced_cart: {
    id: 'reinforced_cart',
    name: 'Reinforced Carrier',
    tier: CartTier.BRONZE,
    level: 3,
    collectionRadius: 55,
    movementSpeed: 1.3,
    capacity: 200,
    magnetRange: 30,
    specialAbility: {
      name: 'Quick Dash',
      description: 'Dash quickly to either side',
      type: 'teleport',
      cooldown: 10000,
      duration: 0,
      effect: () => {},
    },
    visual: {
      baseColor: '#A0522D', // Sienna
      accentColor: '#CD7F32',
      wheelStyle: 'reinforced',
      effects: ['trail'],
      size: 1.15,
    },
    requirements: {
      coins: 1000,
      level: 10,
      previousCart: 'bronze_cart',
    },
    stats: {
      coinBonus: 1.2,
      gemBonus: 1.1,
      scoreBonus: 1.15,
      rarityBoost: 1.1,
    },
  },

  // ========== SILVER TIER ==========
  silver_cart: {
    id: 'silver_cart',
    name: 'Silver Speedster',
    tier: CartTier.SILVER,
    level: 4,
    collectionRadius: 60,
    movementSpeed: 1.5,
    capacity: 300,
    magnetRange: 50,
    specialAbility: {
      name: 'Magnetic Pulse',
      description: 'Attracts all items for 3 seconds',
      type: 'vacuum',
      cooldown: 15000,
      duration: 3000,
      effect: () => {},
    },
    visual: {
      baseColor: '#C0C0C0', // Silver
      accentColor: '#708090',
      wheelStyle: 'reinforced',
      effects: ['trail', 'glow'],
      size: 1.2,
    },
    requirements: {
      coins: 2500,
      gems: 10,
      level: 20,
    },
    stats: {
      coinBonus: 1.3,
      gemBonus: 1.2,
      scoreBonus: 1.3,
      rarityBoost: 1.2,
    },
  },

  // ========== GOLD TIER ==========
  golden_cart: {
    id: 'golden_cart',
    name: 'Golden Express',
    tier: CartTier.GOLD,
    level: 5,
    collectionRadius: 70,
    movementSpeed: 1.7,
    capacity: 500,
    magnetRange: 75,
    specialAbility: {
      name: 'Midas Touch',
      description: 'Turns nearby items to gold',
      type: 'golden_touch',
      cooldown: 20000,
      duration: 5000,
      effect: () => {},
    },
    visual: {
      baseColor: '#FFD700', // Gold
      accentColor: '#FFA500',
      wheelStyle: 'golden',
      effects: ['trail', 'glow', 'sparkles'],
      size: 1.3,
    },
    requirements: {
      coins: 5000,
      gems: 25,
      level: 30,
    },
    stats: {
      coinBonus: 1.5,
      gemBonus: 1.3,
      scoreBonus: 1.5,
      rarityBoost: 1.3,
    },
  },

  royal_cart: {
    id: 'royal_cart',
    name: 'Royal Chariot',
    tier: CartTier.GOLD,
    level: 6,
    collectionRadius: 80,
    movementSpeed: 1.8,
    capacity: 750,
    magnetRange: 100,
    specialAbility: {
      name: 'Royal Decree',
      description: 'All items become premium for 10s',
      type: 'golden_touch',
      cooldown: 30000,
      duration: 10000,
      effect: () => {},
    },
    visual: {
      baseColor: '#FFD700',
      accentColor: '#FF1493', // Royal purple accent
      wheelStyle: 'golden',
      effects: ['trail', 'glow', 'sparkles', 'crown'],
      size: 1.4,
    },
    requirements: {
      coins: 10000,
      gems: 50,
      level: 40,
      vipLevel: 1, // Requires VIP
    },
    stats: {
      coinBonus: 1.7,
      gemBonus: 1.5,
      scoreBonus: 1.7,
      rarityBoost: 1.5,
    },
  },

  // ========== PLATINUM TIER ==========
  platinum_cart: {
    id: 'platinum_cart',
    name: 'Platinum Cruiser',
    tier: CartTier.PLATINUM,
    level: 7,
    collectionRadius: 90,
    movementSpeed: 2.0,
    capacity: 1000,
    magnetRange: 125,
    specialAbility: {
      name: 'Time Warp',
      description: 'Slows time for precise collection',
      type: 'time_freeze',
      cooldown: 25000,
      duration: 7000,
      effect: () => {},
    },
    visual: {
      baseColor: '#E5E4E2', // Platinum
      accentColor: '#C0C0C0',
      wheelStyle: 'diamond',
      effects: ['trail', 'glow', 'sparkles', 'shimmer'],
      size: 1.5,
    },
    requirements: {
      coins: 20000,
      gems: 100,
      level: 50,
      vipLevel: 3, // Gold VIP
    },
    stats: {
      coinBonus: 2.0,
      gemBonus: 1.7,
      scoreBonus: 2.0,
      rarityBoost: 1.7,
    },
  },

  // ========== DIAMOND TIER ==========
  diamond_cart: {
    id: 'diamond_cart',
    name: 'Diamond Destroyer',
    tier: CartTier.DIAMOND,
    level: 8,
    collectionRadius: 100,
    movementSpeed: 2.2,
    capacity: 1500,
    magnetRange: 150,
    specialAbility: {
      name: 'Diamond Shield',
      description: 'Invincible and destroys obstacles',
      type: 'shield',
      cooldown: 30000,
      duration: 10000,
      effect: () => {},
    },
    visual: {
      baseColor: '#B9F2FF', // Diamond blue
      accentColor: '#00FFFF',
      wheelStyle: 'diamond',
      effects: ['trail', 'glow', 'sparkles', 'shimmer', 'prism'],
      size: 1.6,
    },
    requirements: {
      coins: 50000,
      gems: 250,
      level: 75,
      vipLevel: 5, // Diamond VIP
    },
    stats: {
      coinBonus: 2.5,
      gemBonus: 2.0,
      scoreBonus: 2.5,
      rarityBoost: 2.0,
    },
  },

  // ========== LEGENDARY TIER ==========
  phoenix_cart: {
    id: 'phoenix_cart',
    name: 'Phoenix Wings',
    tier: CartTier.LEGENDARY,
    level: 9,
    collectionRadius: 120,
    movementSpeed: 2.5,
    capacity: 2000,
    magnetRange: 200,
    specialAbility: {
      name: 'Phoenix Rising',
      description: 'Revive with full power once per game',
      type: 'phoenix',
      cooldown: 0, // Once per game
      duration: 0,
      effect: () => {},
    },
    visual: {
      baseColor: '#FF4500', // Phoenix orange
      accentColor: '#FFD700',
      wheelStyle: 'rocket',
      effects: ['trail', 'glow', 'fire', 'wings', 'feathers'],
      size: 1.8,
      customModel: 'phoenix_cart',
    },
    requirements: {
      coins: 100000,
      gems: 500,
      level: 100,
      collectibles: { 'phoenix_feather': 1 },
    },
    stats: {
      coinBonus: 3.0,
      gemBonus: 2.5,
      scoreBonus: 3.0,
      rarityBoost: 2.5,
    },
  },

  dragon_cart: {
    id: 'dragon_cart',
    name: 'Dragon Throne',
    tier: CartTier.LEGENDARY,
    level: 9,
    collectionRadius: 120,
    movementSpeed: 2.5,
    capacity: 2000,
    magnetRange: 200,
    specialAbility: {
      name: 'Dragon Breath',
      description: 'Burns all obstacles and doubles coins',
      type: 'dragon_breath',
      cooldown: 35000,
      duration: 8000,
      effect: () => {},
    },
    visual: {
      baseColor: '#8B0000', // Dragon red
      accentColor: '#FFD700',
      wheelStyle: 'rocket',
      effects: ['trail', 'glow', 'fire', 'scales', 'smoke'],
      size: 2.0,
      customModel: 'dragon_cart',
    },
    requirements: {
      coins: 100000,
      gems: 500,
      level: 100,
      collectibles: { 'dragon_scale': 1 },
    },
    stats: {
      coinBonus: 3.0,
      gemBonus: 2.5,
      scoreBonus: 3.0,
      rarityBoost: 2.5,
    },
  },

  // ========== MYTHIC TIER ==========
  cosmic_cart: {
    id: 'cosmic_cart',
    name: 'Cosmic Infinity',
    tier: CartTier.COSMIC,
    level: 10,
    collectionRadius: 150,
    movementSpeed: 3.0,
    capacity: 9999,
    magnetRange: 300,
    specialAbility: {
      name: 'Infinity Mode',
      description: 'All abilities activated for 30s',
      type: 'infinity_mode',
      cooldown: 60000,
      duration: 30000,
      effect: () => {},
    },
    visual: {
      baseColor: '#000000', // Space black
      accentColor: '#FF00FF', // Cosmic purple
      wheelStyle: 'rocket',
      effects: ['trail', 'glow', 'fire', 'rainbow', 'stars', 'galaxy'],
      size: 2.5,
      customModel: 'cosmic_cart',
    },
    requirements: {
      coins: 1000000,
      gems: 5000,
      level: 200,
      collectibles: { 'infinity_gem': 1 },
      vipLevel: 10, // Eternal VIP
    },
    stats: {
      coinBonus: 5.0,
      gemBonus: 5.0,
      scoreBonus: 5.0,
      rarityBoost: 5.0,
    },
  },

  // ========== SPECIAL EVENT CARTS ==========
  halloween_cart: {
    id: 'halloween_cart',
    name: 'Spooky Wagon',
    tier: CartTier.GOLD,
    level: 5,
    collectionRadius: 75,
    movementSpeed: 1.8,
    capacity: 666,
    magnetRange: 66,
    specialAbility: {
      name: 'Spooky Scare',
      description: 'Scares away obstacles',
      type: 'shield',
      cooldown: 13000,
      duration: 6660,
      effect: () => {},
    },
    visual: {
      baseColor: '#FF6600', // Halloween orange
      accentColor: '#000000',
      wheelStyle: 'golden',
      effects: ['trail', 'glow', 'bats', 'pumpkins'],
      size: 1.4,
      customModel: 'halloween_cart',
    },
    requirements: {
      coins: 6666,
      gems: 66,
      collectibles: { 'pumpkin': 10 },
    },
    stats: {
      coinBonus: 1.666,
      gemBonus: 1.666,
      scoreBonus: 1.666,
      rarityBoost: 1.666,
    },
  },

  christmas_cart: {
    id: 'christmas_cart',
    name: "Santa's Sleigh",
    tier: CartTier.GOLD,
    level: 5,
    collectionRadius: 80,
    movementSpeed: 2.0,
    capacity: 1225,
    magnetRange: 100,
    specialAbility: {
      name: 'Gift Drop',
      description: 'Spawns gift boxes with rewards',
      type: 'golden_touch',
      cooldown: 25000,
      duration: 10000,
      effect: () => {},
    },
    visual: {
      baseColor: '#FF0000', // Christmas red
      accentColor: '#FFFFFF',
      wheelStyle: 'golden',
      effects: ['trail', 'glow', 'snow', 'bells'],
      size: 1.5,
      customModel: 'christmas_sleigh',
    },
    requirements: {
      coins: 12250,
      gems: 125,
      collectibles: { 'snowflake': 25 },
    },
    stats: {
      coinBonus: 2.0,
      gemBonus: 2.0,
      scoreBonus: 2.0,
      rarityBoost: 2.0,
    },
  },
};

// Cart upgrade paths
export const UPGRADE_PATHS = {
  starter: ['basic_cart', 'bronze_cart', 'reinforced_cart'],
  speed: ['silver_cart', 'platinum_cart'],
  collection: ['golden_cart', 'royal_cart'],
  legendary: ['phoenix_cart', 'dragon_cart', 'cosmic_cart'],
  seasonal: ['halloween_cart', 'christmas_cart'],
};

// Cart abilities implementation
export class CartAbilityManager {
  private activeAbilities: Map<string, any> = new Map();
  private cooldowns: Map<string, number> = new Map();
  
  activateAbility(cart: CartStats, gameContext: any): boolean {
    if (!cart.specialAbility) return false;
    
    const ability = cart.specialAbility;
    const cooldownKey = `${cart.id}_${ability.type}`;
    
    // Check cooldown
    if (this.cooldowns.has(cooldownKey)) {
      const remainingTime = this.cooldowns.get(cooldownKey)! - Date.now();
      if (remainingTime > 0) {
        return false; // Still on cooldown
      }
    }
    
    // Execute ability
    switch (ability.type) {
      case 'vacuum':
        this.activateVacuum(gameContext);
        break;
      case 'teleport':
        this.activateTeleport(gameContext);
        break;
      case 'shield':
        this.activateShield(gameContext);
        break;
      case 'time_freeze':
        this.activateTimeFreeze(gameContext);
        break;
      case 'golden_touch':
        this.activateGoldenTouch(gameContext);
        break;
      case 'phoenix':
        this.activatePhoenix(gameContext);
        break;
      case 'dragon_breath':
        this.activateDragonBreath(gameContext);
        break;
      case 'infinity_mode':
        this.activateInfinityMode(gameContext);
        break;
    }
    
    // Set cooldown
    this.cooldowns.set(cooldownKey, Date.now() + ability.cooldown);
    
    // Set duration if applicable
    if (ability.duration > 0) {
      setTimeout(() => {
        this.deactivateAbility(ability.type, gameContext);
      }, ability.duration);
    }
    
    return true;
  }
  
  private activateVacuum(context: any) {
    context.magnetRange = 9999; // Collect everything on screen
  }
  
  private activateTeleport(context: any) {
    context.canTeleport = true;
  }
  
  private activateShield(context: any) {
    context.invincible = true;
    context.destroyObstacles = true;
  }
  
  private activateTimeFreeze(context: any) {
    context.timeScale = 0.2; // Slow motion
  }
  
  private activateGoldenTouch(context: any) {
    context.goldenMode = true;
    context.coinMultiplier *= 3;
  }
  
  private activatePhoenix(context: any) {
    context.hasRevive = true;
  }
  
  private activateDragonBreath(context: any) {
    context.dragonMode = true;
    context.burnObstacles = true;
    context.coinMultiplier *= 2;
  }
  
  private activateInfinityMode(context: any) {
    // Activate ALL abilities
    this.activateVacuum(context);
    this.activateShield(context);
    this.activateGoldenTouch(context);
    this.activateDragonBreath(context);
    context.infinityMode = true;
  }
  
  private deactivateAbility(type: AbilityType, context: any) {
    switch (type) {
      case 'vacuum':
        context.magnetRange = context.baseCart.magnetRange;
        break;
      case 'shield':
        context.invincible = false;
        context.destroyObstacles = false;
        break;
      case 'time_freeze':
        context.timeScale = 1.0;
        break;
      case 'golden_touch':
        context.goldenMode = false;
        context.coinMultiplier /= 3;
        break;
      case 'dragon_breath':
        context.dragonMode = false;
        context.burnObstacles = false;
        context.coinMultiplier /= 2;
        break;
      case 'infinity_mode':
        context.infinityMode = false;
        // Deactivate all
        this.deactivateAbility('vacuum', context);
        this.deactivateAbility('shield', context);
        this.deactivateAbility('golden_touch', context);
        this.deactivateAbility('dragon_breath', context);
        break;
    }
  }
  
  getCooldownRemaining(cart: CartStats): number {
    if (!cart.specialAbility) return 0;
    
    const cooldownKey = `${cart.id}_${cart.specialAbility.type}`;
    if (!this.cooldowns.has(cooldownKey)) return 0;
    
    const remaining = this.cooldowns.get(cooldownKey)! - Date.now();
    return Math.max(0, remaining);
  }
}