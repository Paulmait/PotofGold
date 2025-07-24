export interface ItemConfig {
  type: string;
  visual: string;
  purpose: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'ultraRare';
  scoreValue: number;
  coinValue: number;
  fallSpeed: number; // Higher = faster fall
  spawnWeight: number; // Higher = more likely to spawn
  soundEffect: string;
  animationEffect: string;
  specialEffect?: string;
}

export const ITEM_CONFIGS: { [key: string]: ItemConfig } = {
  coin: {
    type: 'coin',
    visual: '🪙',
    purpose: '+1 Score',
    rarity: 'common',
    scoreValue: 1,
    coinValue: 1,
    fallSpeed: 1.0,
    spawnWeight: 40,
    soundEffect: 'coin_ding.wav',
    animationEffect: '✨Twinkle',
  },
  moneyBag: {
    type: 'moneyBag',
    visual: '💰',
    purpose: '+10 Score',
    rarity: 'uncommon',
    scoreValue: 10,
    coinValue: 5,
    fallSpeed: 0.8, // Slower fall
    spawnWeight: 20,
    soundEffect: 'money_bag.wav',
    animationEffect: '💥Bounce',
  },
  lightning: {
    type: 'lightning',
    visual: '🔋',
    purpose: 'Speed Boost for 5s',
    rarity: 'rare',
    scoreValue: 0,
    coinValue: 0,
    fallSpeed: 1.5, // Fast fall
    spawnWeight: 15,
    soundEffect: 'lightning_zap.wav',
    animationEffect: '⚡Flash trail',
    specialEffect: 'speedBoost',
  },
  magnet: {
    type: 'magnet',
    visual: '🧲',
    purpose: 'Attracts nearby coins',
    rarity: 'rare',
    scoreValue: 0,
    coinValue: 0,
    fallSpeed: 1.2,
    spawnWeight: 10,
    soundEffect: 'magnet_pull.wav',
    animationEffect: '🌀Wobble pull',
    specialEffect: 'magnetPull',
  },
  gemstone: {
    type: 'gemstone',
    visual: '💎',
    purpose: '+25 Score',
    rarity: 'epic',
    scoreValue: 25,
    coinValue: 10,
    fallSpeed: 0.6, // Very slow fall
    spawnWeight: 8,
    soundEffect: 'gem_sparkle.wav',
    animationEffect: '💫Glow pulse',
  },
  dynamite: {
    type: 'dynamite',
    visual: '🧨',
    purpose: 'Explosion clears nearby coins',
    rarity: 'epic',
    scoreValue: 0,
    coinValue: 0,
    fallSpeed: 1.8, // Very fast fall
    spawnWeight: 5,
    soundEffect: 'dynamite_boom.wav',
    animationEffect: '🔥Spark explosion',
    specialEffect: 'explosion',
  },
  blackRock: {
    type: 'blackRock',
    visual: '🕳',
    purpose: '-1 life / miss',
    rarity: 'common',
    scoreValue: -5,
    coinValue: 0,
    fallSpeed: 1.3,
    spawnWeight: 10,
    soundEffect: 'rock_thud.wav',
    animationEffect: '🗯 Dust poof',
    specialEffect: 'damage',
  },
  luckyStar: {
    type: 'luckyStar',
    visual: '🌟',
    purpose: 'Trigger "Frenzy Mode"',
    rarity: 'ultraRare',
    scoreValue: 500,
    coinValue: 25,
    fallSpeed: 0.5, // Slowest fall
    spawnWeight: 2,
    soundEffect: 'lucky_star.wav',
    animationEffect: '🌈Trail burst',
    specialEffect: 'frenzyMode',
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