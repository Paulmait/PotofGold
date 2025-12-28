/**
 * Enhanced Falling Items System for Pot of Gold
 * Designed for maximum engagement across all age groups
 * Integrates with VIP, Battle Pass, and Monetization systems
 */

export interface EnhancedItemConfig {
  type: string;
  visual: string;
  assetPath?: string;
  purpose: string;
  category: ItemCategory;
  rarity: ItemRarity;
  scoreValue: number;
  coinValue: number;
  gemValue?: number; // Premium currency
  fallSpeed: number;
  spawnWeight: number;
  soundEffect: string;
  animationEffect: string;
  specialEffect?: string;
  size?: number;
  rotationSpeed?: number;
  vipRequired?: number; // Minimum VIP level required
  seasonPass?: boolean; // Battle pass exclusive
  eventOnly?: string; // Event-specific item
  collectionSet?: string; // Collection achievement
  unlockLevel?: number; // Player level requirement
  chainBonus?: boolean; // Can trigger combo chains
  magnetAttracted?: boolean; // Affected by magnet power-up
}

export type ItemCategory =
  | 'currency' // Coins, gems, tokens
  | 'powerup' // Temporary abilities
  | 'multiplier' // Score/coin multipliers
  | 'special' // Unique mechanics
  | 'obstacle' // Avoid these
  | 'vip' // VIP exclusive
  | 'seasonal' // Time-limited
  | 'collection' // Collectibles
  | 'mystery' // Random rewards
  | 'legendary'; // Ultra-rare items

export type ItemRarity =
  | 'common' // 40% spawn rate
  | 'uncommon' // 25% spawn rate
  | 'rare' // 15% spawn rate
  | 'epic' // 10% spawn rate
  | 'legendary' // 5% spawn rate
  | 'mythic' // 3% spawn rate
  | 'exclusive' // 2% spawn rate (VIP/Event only)
  | 'cosmic'; // 0.1% spawn rate (Ultra-rare)

export const ENHANCED_ITEMS: { [key: string]: EnhancedItemConfig } = {
  // ========== BASIC CURRENCY ==========
  coin: {
    type: 'coin',
    visual: '🪙',
    assetPath: 'assets/items/coin.png',
    purpose: 'Basic currency +1',
    category: 'currency',
    rarity: 'common',
    scoreValue: 1,
    coinValue: 1,
    fallSpeed: 1.0,
    spawnWeight: 30,
    soundEffect: 'coin_collect.wav',
    animationEffect: 'sparkle_pop',
    size: 1.0,
    rotationSpeed: 2,
    chainBonus: true,
    magnetAttracted: true,
  },

  silverCoin: {
    type: 'silverCoin',
    visual: '🥈',
    assetPath: 'assets/items/silver_coin.png',
    purpose: 'Silver coin +5',
    category: 'currency',
    rarity: 'uncommon',
    scoreValue: 5,
    coinValue: 5,
    fallSpeed: 0.95,
    spawnWeight: 20,
    soundEffect: 'silver_coin.wav',
    animationEffect: 'silver_shine',
    size: 1.1,
    rotationSpeed: 2.5,
    chainBonus: true,
    magnetAttracted: true,
  },

  goldCoin: {
    type: 'goldCoin',
    visual: '🥇',
    assetPath: 'assets/items/gold_coin.png',
    purpose: 'Gold coin +10',
    category: 'currency',
    rarity: 'rare',
    scoreValue: 10,
    coinValue: 10,
    fallSpeed: 0.9,
    spawnWeight: 12,
    soundEffect: 'gold_coin.wav',
    animationEffect: 'gold_burst',
    size: 1.2,
    rotationSpeed: 3,
    chainBonus: true,
    magnetAttracted: true,
  },

  // ========== PREMIUM CURRENCY ==========
  gem: {
    type: 'gem',
    visual: '💎',
    assetPath: 'assets/items/gem.png',
    purpose: 'Premium gem +1',
    category: 'currency',
    rarity: 'epic',
    scoreValue: 50,
    coinValue: 0,
    gemValue: 1,
    fallSpeed: 0.7,
    spawnWeight: 5,
    soundEffect: 'gem_collect.wav',
    animationEffect: 'rainbow_shine',
    specialEffect: 'addGem',
    size: 1.1,
    rotationSpeed: 4,
    magnetAttracted: true,
  },

  ruby: {
    type: 'ruby',
    visual: '♦️',
    assetPath: 'assets/items/ruby.png',
    purpose: 'Rare ruby +3 gems',
    category: 'currency',
    rarity: 'legendary',
    scoreValue: 100,
    coinValue: 0,
    gemValue: 3,
    fallSpeed: 0.6,
    spawnWeight: 2,
    soundEffect: 'ruby_sparkle.wav',
    animationEffect: 'red_radiance',
    specialEffect: 'addGems',
    size: 1.2,
    rotationSpeed: 5,
    magnetAttracted: true,
  },

  // ========== VIP EXCLUSIVE ITEMS ==========
  vipCrown: {
    type: 'vipCrown',
    visual: '👑',
    assetPath: 'assets/items/vip_crown.png',
    purpose: 'VIP Crown: +100 coins & 2x multiplier',
    category: 'vip',
    rarity: 'exclusive',
    scoreValue: 100,
    coinValue: 100,
    fallSpeed: 0.5,
    spawnWeight: 3,
    soundEffect: 'crown_fanfare.wav',
    animationEffect: 'royal_glow',
    specialEffect: 'vipBonus',
    size: 1.5,
    rotationSpeed: 2,
    vipRequired: 1, // Bronze VIP minimum
    magnetAttracted: true,
  },

  platinumChest: {
    type: 'platinumChest',
    visual: '🗝️',
    assetPath: 'assets/items/platinum_chest.png',
    purpose: 'Platinum chest: 50-500 coins + rare item',
    category: 'vip',
    rarity: 'mythic',
    scoreValue: 200,
    coinValue: 0,
    fallSpeed: 0.4,
    spawnWeight: 1,
    soundEffect: 'chest_open_epic.wav',
    animationEffect: 'platinum_sparkle',
    specialEffect: 'platinumReward',
    size: 1.6,
    rotationSpeed: 1,
    vipRequired: 4, // Platinum VIP
    magnetAttracted: false,
  },

  diamondRain: {
    type: 'diamondRain',
    visual: '💠',
    assetPath: 'assets/items/diamond_rain.png',
    purpose: 'Diamond Rain: Gems fall for 10 seconds',
    category: 'vip',
    rarity: 'cosmic',
    scoreValue: 500,
    coinValue: 0,
    gemValue: 10,
    fallSpeed: 0.3,
    spawnWeight: 0.5,
    soundEffect: 'diamond_rain.wav',
    animationEffect: 'diamond_cascade',
    specialEffect: 'diamondRainEvent',
    size: 2.0,
    rotationSpeed: 6,
    vipRequired: 5, // Diamond VIP
    magnetAttracted: false,
  },

  // ========== POWER-UPS ==========
  magnet: {
    type: 'magnet',
    visual: '🧲',
    assetPath: 'assets/items/magnet.png',
    purpose: 'Magnetic field: Auto-collect for 15s',
    category: 'powerup',
    rarity: 'rare',
    scoreValue: 0,
    coinValue: 0,
    fallSpeed: 1.0,
    spawnWeight: 8,
    soundEffect: 'magnet_activate.wav',
    animationEffect: 'magnetic_pulse',
    specialEffect: 'magnetField',
    size: 1.3,
    rotationSpeed: 8,
    magnetAttracted: false,
  },

  shield: {
    type: 'shield',
    visual: '🛡️',
    assetPath: 'assets/items/shield.png',
    purpose: 'Protection: Immune to obstacles for 10s',
    category: 'powerup',
    rarity: 'rare',
    scoreValue: 0,
    coinValue: 0,
    fallSpeed: 0.9,
    spawnWeight: 7,
    soundEffect: 'shield_up.wav',
    animationEffect: 'shield_bubble',
    specialEffect: 'invincibility',
    size: 1.4,
    rotationSpeed: 3,
    magnetAttracted: true,
  },

  turboBoost: {
    type: 'turboBoost',
    visual: '🚀',
    assetPath: 'assets/items/turbo.png',
    purpose: 'Turbo: 3x movement speed for 8s',
    category: 'powerup',
    rarity: 'epic',
    scoreValue: 0,
    coinValue: 0,
    fallSpeed: 1.5,
    spawnWeight: 5,
    soundEffect: 'turbo_boost.wav',
    animationEffect: 'flame_trail',
    specialEffect: 'speedBoost',
    size: 1.3,
    rotationSpeed: 0,
    magnetAttracted: true,
  },

  goldenTouch: {
    type: 'goldenTouch',
    visual: '✨',
    assetPath: 'assets/items/golden_touch.png',
    purpose: 'Midas Touch: All items turn to gold for 10s',
    category: 'powerup',
    rarity: 'legendary',
    scoreValue: 0,
    coinValue: 0,
    fallSpeed: 0.8,
    spawnWeight: 2,
    soundEffect: 'midas_touch.wav',
    animationEffect: 'gold_transformation',
    specialEffect: 'goldenTouch',
    size: 1.5,
    rotationSpeed: 10,
    magnetAttracted: true,
  },

  // ========== MULTIPLIERS ==========
  x2Multiplier: {
    type: 'x2Multiplier',
    visual: '2️⃣',
    assetPath: 'assets/items/x2.png',
    purpose: 'Double points for 20s',
    category: 'multiplier',
    rarity: 'uncommon',
    scoreValue: 25,
    coinValue: 0,
    fallSpeed: 1.0,
    spawnWeight: 10,
    soundEffect: 'multiplier_2x.wav',
    animationEffect: 'number_pulse',
    specialEffect: 'multiplierX2',
    size: 1.2,
    rotationSpeed: 5,
    chainBonus: true,
    magnetAttracted: true,
  },

  x5Multiplier: {
    type: 'x5Multiplier',
    visual: '5️⃣',
    assetPath: 'assets/items/x5.png',
    purpose: '5x points for 15s',
    category: 'multiplier',
    rarity: 'epic',
    scoreValue: 50,
    coinValue: 0,
    fallSpeed: 0.9,
    spawnWeight: 4,
    soundEffect: 'multiplier_5x.wav',
    animationEffect: 'rainbow_numbers',
    specialEffect: 'multiplierX5',
    size: 1.3,
    rotationSpeed: 7,
    chainBonus: true,
    magnetAttracted: true,
  },

  x10Multiplier: {
    type: 'x10Multiplier',
    visual: '🔟',
    assetPath: 'assets/items/x10.png',
    purpose: 'MEGA 10x points for 10s',
    category: 'multiplier',
    rarity: 'mythic',
    scoreValue: 100,
    coinValue: 0,
    fallSpeed: 0.7,
    spawnWeight: 1,
    soundEffect: 'multiplier_mega.wav',
    animationEffect: 'explosive_numbers',
    specialEffect: 'multiplierX10',
    size: 1.5,
    rotationSpeed: 10,
    chainBonus: true,
    magnetAttracted: true,
  },

  // ========== SPECIAL MECHANICS ==========
  timeSlow: {
    type: 'timeSlow',
    visual: '⏰',
    assetPath: 'assets/items/time_slow.png',
    purpose: 'Time Warp: Slow motion for 12s',
    category: 'special',
    rarity: 'epic',
    scoreValue: 0,
    coinValue: 0,
    fallSpeed: 0.8,
    spawnWeight: 4,
    soundEffect: 'time_warp.wav',
    animationEffect: 'time_distortion',
    specialEffect: 'bulletTime',
    size: 1.4,
    rotationSpeed: -3, // Reverse rotation
    magnetAttracted: true,
  },

  rainbowStar: {
    type: 'rainbowStar',
    visual: '🌈',
    assetPath: 'assets/items/rainbow_star.png',
    purpose: 'Rainbow Mode: All effects for 20s',
    category: 'special',
    rarity: 'cosmic',
    scoreValue: 1000,
    coinValue: 100,
    gemValue: 5,
    fallSpeed: 0.5,
    spawnWeight: 0.2,
    soundEffect: 'rainbow_power.wav',
    animationEffect: 'rainbow_explosion',
    specialEffect: 'rainbowMode',
    size: 2.0,
    rotationSpeed: 12,
    magnetAttracted: true,
  },

  mysteryBox: {
    type: 'mysteryBox',
    visual: '🎁',
    assetPath: 'assets/items/mystery_box.png',
    purpose: 'Mystery Box: Random epic reward',
    category: 'mystery',
    rarity: 'rare',
    scoreValue: 0,
    coinValue: 0,
    fallSpeed: 0.85,
    spawnWeight: 6,
    soundEffect: 'mystery_reveal.wav',
    animationEffect: 'box_shake',
    specialEffect: 'mysteryReward',
    size: 1.4,
    rotationSpeed: 2,
    magnetAttracted: false,
  },

  goldenEgg: {
    type: 'goldenEgg',
    visual: '🥚',
    assetPath: 'assets/items/golden_egg.png',
    purpose: 'Golden Egg: Hatches into mega reward',
    category: 'mystery',
    rarity: 'legendary',
    scoreValue: 0,
    coinValue: 0,
    fallSpeed: 0.6,
    spawnWeight: 1.5,
    soundEffect: 'egg_crack.wav',
    animationEffect: 'egg_wobble',
    specialEffect: 'goldenEggHatch',
    size: 1.5,
    rotationSpeed: 1,
    magnetAttracted: false,
  },

  // ========== SEASONAL/EVENT ITEMS ==========
  snowflake: {
    type: 'snowflake',
    visual: '❄️',
    assetPath: 'assets/items/snowflake.png',
    purpose: 'Winter Special: Freeze time + 50 coins',
    category: 'seasonal',
    rarity: 'epic',
    scoreValue: 50,
    coinValue: 50,
    fallSpeed: 0.7,
    spawnWeight: 0,
    soundEffect: 'winter_chime.wav',
    animationEffect: 'snow_sparkle',
    specialEffect: 'winterFreeze',
    size: 1.3,
    rotationSpeed: 4,
    eventOnly: 'winter',
    magnetAttracted: true,
  },

  pumpkin: {
    type: 'pumpkin',
    visual: '🎃',
    assetPath: 'assets/items/pumpkin.png',
    purpose: 'Halloween: Spooky bonus 100 coins',
    category: 'seasonal',
    rarity: 'epic',
    scoreValue: 100,
    coinValue: 100,
    fallSpeed: 0.8,
    spawnWeight: 0,
    soundEffect: 'spooky_laugh.wav',
    animationEffect: 'ghost_trail',
    specialEffect: 'halloweenBonus',
    size: 1.5,
    rotationSpeed: 3,
    eventOnly: 'halloween',
    magnetAttracted: true,
  },

  fourLeafClover: {
    type: 'fourLeafClover',
    visual: '🍀',
    assetPath: 'assets/items/clover.png',
    purpose: "St. Patrick's: Lucky streak activated",
    category: 'seasonal',
    rarity: 'legendary',
    scoreValue: 77,
    coinValue: 77,
    gemValue: 7,
    fallSpeed: 0.77,
    spawnWeight: 0,
    soundEffect: 'irish_jig.wav',
    animationEffect: 'green_sparkles',
    specialEffect: 'luckyStreak',
    size: 1.3,
    rotationSpeed: 7,
    eventOnly: 'stpatricks',
    magnetAttracted: true,
  },

  // ========== COLLECTION ITEMS ==========
  ancientCoin: {
    type: 'ancientCoin',
    visual: '🏺',
    assetPath: 'assets/items/ancient_coin.png',
    purpose: 'Ancient Collection 1/10',
    category: 'collection',
    rarity: 'rare',
    scoreValue: 100,
    coinValue: 25,
    fallSpeed: 0.8,
    spawnWeight: 3,
    soundEffect: 'ancient_discovery.wav',
    animationEffect: 'dust_reveal',
    specialEffect: 'addToCollection',
    size: 1.2,
    rotationSpeed: 1,
    collectionSet: 'ancient_treasures',
    magnetAttracted: true,
  },

  crystalShard: {
    type: 'crystalShard',
    visual: '🔮',
    assetPath: 'assets/items/crystal_shard.png',
    purpose: 'Crystal Collection 1/7',
    category: 'collection',
    rarity: 'epic',
    scoreValue: 150,
    coinValue: 30,
    gemValue: 1,
    fallSpeed: 0.75,
    spawnWeight: 2,
    soundEffect: 'crystal_resonate.wav',
    animationEffect: 'crystal_glow',
    specialEffect: 'addToCollection',
    size: 1.1,
    rotationSpeed: 6,
    collectionSet: 'crystal_power',
    magnetAttracted: true,
  },

  // ========== LEGENDARY ITEMS ==========
  phoenixFeather: {
    type: 'phoenixFeather',
    visual: '🪶',
    assetPath: 'assets/items/phoenix_feather.png',
    purpose: 'Phoenix Rising: Revive with full power',
    category: 'legendary',
    rarity: 'cosmic',
    scoreValue: 500,
    coinValue: 200,
    gemValue: 10,
    fallSpeed: 0.4,
    spawnWeight: 0.1,
    soundEffect: 'phoenix_cry.wav',
    animationEffect: 'fire_rebirth',
    specialEffect: 'phoenixRevive',
    size: 1.8,
    rotationSpeed: 5,
    magnetAttracted: false,
  },

  dragonScale: {
    type: 'dragonScale',
    visual: '🐉',
    assetPath: 'assets/items/dragon_scale.png',
    purpose: 'Dragon Power: Burn all obstacles',
    category: 'legendary',
    rarity: 'cosmic',
    scoreValue: 666,
    coinValue: 333,
    gemValue: 15,
    fallSpeed: 0.3,
    spawnWeight: 0.05,
    soundEffect: 'dragon_roar.wav',
    animationEffect: 'dragon_fire',
    specialEffect: 'dragonBreath',
    size: 2.0,
    rotationSpeed: 3,
    magnetAttracted: false,
  },

  infinityGem: {
    type: 'infinityGem',
    visual: '♾️',
    assetPath: 'assets/items/infinity_gem.png',
    purpose: 'Infinity Power: Unlimited everything for 30s',
    category: 'legendary',
    rarity: 'cosmic',
    scoreValue: 9999,
    coinValue: 999,
    gemValue: 99,
    fallSpeed: 0.1,
    spawnWeight: 0.01,
    soundEffect: 'infinity_power.wav',
    animationEffect: 'reality_warp',
    specialEffect: 'infinityMode',
    size: 2.5,
    rotationSpeed: 15,
    magnetAttracted: false,
  },

  // ========== OBSTACLES (Balanced for Fun) ==========
  rock: {
    type: 'rock',
    visual: '🪨',
    assetPath: 'assets/items/rock.png',
    purpose: 'Obstacle: -10 points (dodge it!)',
    category: 'obstacle',
    rarity: 'common',
    scoreValue: -10,
    coinValue: 0,
    fallSpeed: 1.2,
    spawnWeight: 8, // Reduced from 12
    soundEffect: 'rock_thud.wav',
    animationEffect: 'dust_puff',
    specialEffect: 'minorDamage',
    size: 1.3,
    rotationSpeed: 1,
    magnetAttracted: false,
  },

  thundercloud: {
    type: 'thundercloud',
    visual: '⛈️',
    assetPath: 'assets/items/thundercloud.png',
    purpose: 'Storm: Slows movement for 5s',
    category: 'obstacle',
    rarity: 'uncommon',
    scoreValue: -20,
    coinValue: 0,
    fallSpeed: 0.8,
    spawnWeight: 4,
    soundEffect: 'thunder_strike.wav',
    animationEffect: 'lightning_flash',
    specialEffect: 'slowDebuff',
    size: 1.5,
    rotationSpeed: 2,
    magnetAttracted: false,
  },

  blackHole: {
    type: 'blackHole',
    visual: '🕳️',
    assetPath: 'assets/items/black_hole.png',
    purpose: 'Black Hole: Sucks in nearby items',
    category: 'obstacle',
    rarity: 'rare',
    scoreValue: -50,
    coinValue: -10,
    fallSpeed: 0.5,
    spawnWeight: 2,
    soundEffect: 'vortex_pull.wav',
    animationEffect: 'gravity_distortion',
    specialEffect: 'blackHolePull',
    size: 1.8,
    rotationSpeed: -8,
    magnetAttracted: false,
  },

  // ========== BATTLE PASS EXCLUSIVE ==========
  battleToken: {
    type: 'battleToken',
    visual: '🎖️',
    assetPath: 'assets/items/battle_token.png',
    purpose: 'Battle Pass: +100 XP',
    category: 'special',
    rarity: 'epic',
    scoreValue: 100,
    coinValue: 50,
    fallSpeed: 0.9,
    spawnWeight: 0,
    soundEffect: 'battle_honor.wav',
    animationEffect: 'medal_shine',
    specialEffect: 'battlePassXP',
    size: 1.3,
    rotationSpeed: 4,
    seasonPass: true,
    magnetAttracted: true,
  },

  eliteChest: {
    type: 'eliteChest',
    visual: '📦',
    assetPath: 'assets/items/elite_chest.png',
    purpose: 'Elite Chest: Premium rewards',
    category: 'special',
    rarity: 'legendary',
    scoreValue: 250,
    coinValue: 0,
    fallSpeed: 0.7,
    spawnWeight: 0,
    soundEffect: 'elite_unlock.wav',
    animationEffect: 'golden_burst',
    specialEffect: 'eliteRewards',
    size: 1.6,
    rotationSpeed: 2,
    seasonPass: true,
    magnetAttracted: false,
  },
};

// Spawn weight adjustments based on player progression
export const PROGRESSION_MODIFIERS = {
  level: {
    1: { common: 1.2, uncommon: 0.8, rare: 0.5, epic: 0.3, legendary: 0.1 },
    10: { common: 1.0, uncommon: 1.0, rare: 0.8, epic: 0.6, legendary: 0.3 },
    25: { common: 0.8, uncommon: 1.1, rare: 1.0, epic: 0.8, legendary: 0.5 },
    50: { common: 0.6, uncommon: 1.2, rare: 1.2, epic: 1.0, legendary: 0.7 },
    100: { common: 0.4, uncommon: 1.0, rare: 1.3, epic: 1.2, legendary: 1.0 },
  },
  vip: {
    0: { vipItems: 0, legendaryBonus: 1.0 },
    1: { vipItems: 0.5, legendaryBonus: 1.2 }, // Bronze
    3: { vipItems: 1.0, legendaryBonus: 1.5 }, // Gold
    5: { vipItems: 2.0, legendaryBonus: 2.0 }, // Diamond
    10: { vipItems: 5.0, legendaryBonus: 3.0 }, // Eternal
  },
  streak: {
    3: { multiplier: 1.1, rareBonus: 0.1 },
    7: { multiplier: 1.3, rareBonus: 0.2 },
    15: { multiplier: 1.5, rareBonus: 0.3 },
    30: { multiplier: 2.0, rareBonus: 0.5 },
  },
};

// Special effect implementations
export const SPECIAL_EFFECTS = {
  addGem: (player: any) => (player.gems += 1),
  addGems: (player: any, value: number) => (player.gems += value),
  vipBonus: (player: any) => {
    player.score *= 2;
    player.coins += 100;
  },
  platinumReward: (player: any) => {
    const reward = Math.floor(Math.random() * 450) + 50;
    player.coins += reward;
    return { type: 'platinum_chest', coins: reward };
  },
  diamondRainEvent: (game: any) => {
    game.startDiamondRain(10000); // 10 seconds of gems
  },
  magnetField: (player: any) => {
    player.activatePowerUp('magnet', 15000);
  },
  invincibility: (player: any) => {
    player.activatePowerUp('shield', 10000);
  },
  speedBoost: (player: any) => {
    player.speed *= 3;
    setTimeout(() => (player.speed /= 3), 8000);
  },
  goldenTouch: (game: any) => {
    game.activateGoldenMode(10000);
  },
  bulletTime: (game: any) => {
    game.setTimeScale(0.5, 12000);
  },
  rainbowMode: (player: any) => {
    player.activateAllPowerUps(20000);
  },
  mysteryReward: (player: any) => {
    const rewards = ['coins', 'gems', 'multiplier', 'powerup'];
    const chosen = rewards[Math.floor(Math.random() * rewards.length)];
    return { type: 'mystery', reward: chosen };
  },
  goldenEggHatch: (player: any) => {
    return {
      coins: 500,
      gems: 10,
      multiplier: 5,
      duration: 30000,
    };
  },
  phoenixRevive: (player: any) => {
    player.revive();
    player.invincible = true;
    setTimeout(() => (player.invincible = false), 5000);
  },
  dragonBreath: (game: any) => {
    game.clearAllObstacles();
    game.burnEffect(5000);
  },
  infinityMode: (player: any) => {
    player.godMode = true;
    setTimeout(() => (player.godMode = false), 30000);
  },
};

// Collection sets for achievements
export const COLLECTION_SETS = {
  ancient_treasures: {
    name: 'Ancient Treasures',
    items: 10,
    reward: { coins: 1000, gems: 50, title: 'Archaeologist' },
  },
  crystal_power: {
    name: 'Crystal Power',
    items: 7,
    reward: { coins: 777, gems: 77, skin: 'crystal_cart' },
  },
  seasonal_grand_slam: {
    name: 'Seasonal Grand Slam',
    items: 12, // All seasonal items
    reward: { coins: 5000, gems: 200, badge: 'seasons_master' },
  },
  legendary_collector: {
    name: 'Legendary Collector',
    items: 5,
    reward: { coins: 10000, gems: 500, title: 'Legend', skin: 'legendary_cart' },
  },
};

// VIP-specific spawn pools
export const VIP_SPAWN_POOLS = {
  bronze: ['vipCrown'],
  silver: ['vipCrown'],
  gold: ['vipCrown', 'platinumChest'],
  platinum: ['vipCrown', 'platinumChest'],
  diamond: ['vipCrown', 'platinumChest', 'diamondRain'],
  master: ['vipCrown', 'platinumChest', 'diamondRain'],
  eternal: ['vipCrown', 'platinumChest', 'diamondRain', 'infinityGem'],
};

// Event calendars
export const EVENT_CALENDAR = {
  winter: { start: '12-01', end: '02-28', items: ['snowflake'] },
  halloween: { start: '10-01', end: '11-01', items: ['pumpkin'] },
  stpatricks: { start: '03-10', end: '03-20', items: ['fourLeafClover'] },
  summer: { start: '06-01', end: '08-31', items: ['sunburst'] },
  anniversary: { start: '01-01', end: '01-07', items: ['birthdayCake'] },
};
