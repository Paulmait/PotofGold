export interface ItemConfig {
  type: string;
  visual: string;
  assetPath?: string; // Path to actual image asset
  purpose: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'ultraRare';
  scoreValue: number;
  coinValue: number;
  fallSpeed: number; // Higher = faster fall
  spawnWeight: number; // Higher = more likely to spawn
  soundEffect: string;
  animationEffect: string;
  specialEffect?: string;
  size?: number; // Size multiplier for visual
  rotationSpeed?: number; // Rotation animation speed
}

export const ITEM_CONFIGS: { [key: string]: ItemConfig } = {
  // ========== COLLECTIBLES (Good Items) ==========
  coin: {
    type: 'coin',
    visual: '🪙',
    assetPath: 'assets/items/coin.png',
    purpose: 'Basic currency +1',
    rarity: 'common',
    scoreValue: 1,
    coinValue: 1,
    fallSpeed: 1.0,
    spawnWeight: 35,
    soundEffect: 'coin_collect.wav',
    animationEffect: 'sparkle_pop',
    size: 1.0,
    rotationSpeed: 2,
  },
  
  moneyBag: {
    type: 'moneyBag',
    visual: '💰',
    assetPath: 'assets/items/money_bag.png',
    purpose: 'Coin bundle +10',
    rarity: 'uncommon',
    scoreValue: 10,
    coinValue: 10,
    fallSpeed: 0.9,
    spawnWeight: 15,
    soundEffect: 'money_bag_collect.wav',
    animationEffect: 'coin_burst',
    size: 1.2,
    rotationSpeed: 1,
  },
  
  diamond: {
    type: 'diamond',
    visual: '💎',
    assetPath: 'assets/items/diamond.png',
    purpose: 'Premium currency +1 gem',
    rarity: 'rare',
    scoreValue: 50,
    coinValue: 0,
    fallSpeed: 0.7,
    spawnWeight: 5,
    soundEffect: 'diamond_sparkle.wav',
    animationEffect: 'rainbow_shine',
    specialEffect: 'addGem',
    size: 1.1,
    rotationSpeed: 3,
  },
  
  goldStar: {
    type: 'goldStar',
    visual: '⭐',
    assetPath: 'assets/items/gold_star.png',
    purpose: 'Score multiplier x2 for 10s',
    rarity: 'rare',
    scoreValue: 25,
    coinValue: 5,
    fallSpeed: 0.8,
    spawnWeight: 8,
    soundEffect: 'star_collect.wav',
    animationEffect: 'star_trail',
    specialEffect: 'scoreMultiplier',
    size: 1.3,
    rotationSpeed: 4,
  },
  
  megaStar: {
    type: 'megaStar',
    visual: '🌟',
    assetPath: 'assets/items/mega_star.png',
    purpose: 'Frenzy mode - all coins x5 for 15s',
    rarity: 'ultraRare',
    scoreValue: 100,
    coinValue: 20,
    fallSpeed: 0.5,
    spawnWeight: 1,
    soundEffect: 'mega_star_fanfare.wav',
    animationEffect: 'rainbow_explosion',
    specialEffect: 'frenzyMode',
    size: 1.5,
    rotationSpeed: 5,
  },
  
  treasureSack: {
    type: 'treasureSack',
    visual: '🎒',
    assetPath: 'assets/items/treasure_sack.png',
    purpose: 'Mystery reward (5-50 coins)',
    rarity: 'uncommon',
    scoreValue: 0,
    coinValue: 0, // Handled by special effect
    fallSpeed: 0.85,
    spawnWeight: 10,
    soundEffect: 'sack_open.wav',
    animationEffect: 'sack_bounce',
    specialEffect: 'mysteryReward',
    size: 1.4,
    rotationSpeed: 0.5,
  },
  
  // ========== POWER-UPS ==========
  lightning: {
    type: 'lightning',
    visual: '⚡',
    assetPath: 'assets/items/lightning.png',
    purpose: 'Speed boost - move 2x faster for 8s',
    rarity: 'rare',
    scoreValue: 0,
    coinValue: 0,
    fallSpeed: 1.5,
    spawnWeight: 7,
    soundEffect: 'lightning_strike.wav',
    animationEffect: 'electric_surge',
    specialEffect: 'speedBoost',
    size: 1.2,
    rotationSpeed: 0,
  },
  
  magnet: {
    type: 'magnet',
    visual: '🧲',
    assetPath: 'assets/items/magnet.png',
    purpose: 'Auto-collect items in radius for 10s',
    rarity: 'rare',
    scoreValue: 0,
    coinValue: 0,
    fallSpeed: 1.1,
    spawnWeight: 6,
    soundEffect: 'magnet_activate.wav',
    animationEffect: 'magnetic_field',
    specialEffect: 'magnetPull',
    size: 1.2,
    rotationSpeed: 6,
  },
  
  // ========== OBSTACLES (Bad Items) ==========
  rock: {
    type: 'rock',
    visual: '🪨',
    assetPath: 'assets/items/rock.png',
    purpose: 'Obstacle - lose 1 life if hit',
    rarity: 'common',
    scoreValue: -10,
    coinValue: 0,
    fallSpeed: 1.4,
    spawnWeight: 12,
    soundEffect: 'rock_impact.wav',
    animationEffect: 'dust_cloud',
    specialEffect: 'damage',
    size: 1.3,
    rotationSpeed: 1.5,
  },
  
  dynamite: {
    type: 'dynamite',
    visual: '🧨',
    assetPath: 'assets/items/dynamite.png',
    purpose: 'Danger! Explodes and clears area',
    rarity: 'uncommon',
    scoreValue: -20,
    coinValue: 0,
    fallSpeed: 1.8,
    spawnWeight: 4,
    soundEffect: 'dynamite_explosion.wav',
    animationEffect: 'explosion_blast',
    specialEffect: 'explosion',
    size: 1.1,
    rotationSpeed: 8,
  },
};

export const RARITY_MULTIPLIERS = {
  common: 1,
  uncommon: 1.5,
  rare: 2,
  epic: 3,
  ultraRare: 5,
};

export const COMBO_BONUSES = {
  3: 1.5,  // 3 items in a row = 1.5x multiplier
  5: 2,    // 5 items in a row = 2x multiplier
  10: 3,   // 10 items in a row = 3x multiplier
  15: 5,   // 15 items in a row = 5x multiplier
};

export const LEVEL_SPAWN_MODIFIERS = {
  1: { common: 1, uncommon: 0.5, rare: 0.2, epic: 0.1, ultraRare: 0.05 },
  5: { common: 1, uncommon: 0.8, rare: 0.4, epic: 0.2, ultraRare: 0.1 },
  10: { common: 1, uncommon: 1, rare: 0.6, epic: 0.3, ultraRare: 0.15 },
  15: { common: 1, uncommon: 1, rare: 0.8, epic: 0.5, ultraRare: 0.2 },
  20: { common: 1, uncommon: 1, rare: 1, epic: 0.7, ultraRare: 0.25 },
}; 