import { Level, Achievement, CartSkin, ItemRarity, LevelTheme } from '../types/game.types';

// Level Themes
export const levelThemes: { [key: string]: LevelTheme } = {
  goldMine: {
    name: 'Gold Mine',
    backgroundColor: '#2C1810',
    foregroundColor: '#FFD700',
    particleColors: ['#FFD700', '#FFA500', '#FF8C00'],
    musicTrack: 'goldmine',
    specialItems: ['coin', 'gem', 'diamond'],
  },
  crystalCave: {
    name: 'Crystal Cave',
    backgroundColor: '#1A0E2E',
    foregroundColor: '#E0B0FF',
    particleColors: ['#E0B0FF', '#B19CD9', '#9370DB'],
    musicTrack: 'crystalcave',
    specialItems: ['gem', 'diamond', 'mystery'],
  },
  lavaDepths: {
    name: 'Lava Depths',
    backgroundColor: '#330000',
    foregroundColor: '#FF4500',
    particleColors: ['#FF4500', '#FF6347', '#DC143C'],
    musicTrack: 'lavadepths',
    specialItems: ['coin', 'powerup', 'bomb'],
  },
  iceCavern: {
    name: 'Ice Cavern',
    backgroundColor: '#0A1929',
    foregroundColor: '#87CEEB',
    particleColors: ['#87CEEB', '#4682B4', '#1E90FF'],
    musicTrack: 'icecavern',
    specialItems: ['diamond', 'star', 'mystery'],
  },
  ancientTemple: {
    name: 'Ancient Temple',
    backgroundColor: '#1A1A0A',
    foregroundColor: '#DAA520',
    particleColors: ['#DAA520', '#B8860B', '#CD853F'],
    musicTrack: 'temple',
    specialItems: ['coin', 'gem', 'special'],
  },
  cosmicVoid: {
    name: 'Cosmic Void',
    backgroundColor: '#000033',
    foregroundColor: '#FF69B4',
    particleColors: ['#FF69B4', '#FF1493', '#C71585'],
    musicTrack: 'cosmic',
    specialItems: ['star', 'mystery', 'special'],
  },
  emeraldForest: {
    name: 'Emerald Forest',
    backgroundColor: '#0D2818',
    foregroundColor: '#50C878',
    particleColors: ['#50C878', '#228B22', '#008000'],
    musicTrack: 'forest',
    specialItems: ['gem', 'heart', 'powerup'],
  },
  desertRuins: {
    name: 'Desert Ruins',
    backgroundColor: '#3D2817',
    foregroundColor: '#F4A460',
    particleColors: ['#F4A460', '#DEB887', '#D2691E'],
    musicTrack: 'desert',
    specialItems: ['coin', 'diamond', 'bomb'],
  },
  underwaterCave: {
    name: 'Underwater Cave',
    backgroundColor: '#001F3F',
    foregroundColor: '#00CED1',
    particleColors: ['#00CED1', '#48D1CC', '#20B2AA'],
    musicTrack: 'underwater',
    specialItems: ['gem', 'star', 'heart'],
  },
  volcanicCore: {
    name: 'Volcanic Core',
    backgroundColor: '#1A0000',
    foregroundColor: '#FF0000',
    particleColors: ['#FF0000', '#DC143C', '#8B0000'],
    musicTrack: 'volcanic',
    specialItems: ['powerup', 'bomb', 'special'],
  },
};

// Levels
export const levels: Level[] = [
  // World 1: Beginner's Mine (Levels 1-10)
  {
    id: 1,
    name: 'First Dig',
    theme: levelThemes.goldMine,
    difficulty: {
      level: 1,
      itemSpawnRate: 1.5,
      itemFallSpeed: 2,
      bombChance: 0.05,
      powerUpChance: 0.1,
      rareItemChance: 0.05,
      comboMultiplier: 1,
      scoreMultiplier: 1,
      blockageBuildup: 0.5,
    },
    objectives: [
      { id: 'score_500', type: 'score', target: 500, current: 0, completed: false },
      { id: 'coins_10', type: 'coins', target: 10, current: 0, completed: false },
    ],
    rewards: [
      { type: 'coins', amount: 50 },
      { type: 'xp', amount: 100 },
    ],
    unlocked: true,
    stars: 0,
    highScore: 0,
  },
  {
    id: 2,
    name: 'Deeper Underground',
    theme: levelThemes.goldMine,
    difficulty: {
      level: 2,
      itemSpawnRate: 1.4,
      itemFallSpeed: 2.2,
      bombChance: 0.08,
      powerUpChance: 0.12,
      rareItemChance: 0.06,
      comboMultiplier: 1.1,
      scoreMultiplier: 1.1,
      blockageBuildup: 0.6,
    },
    objectives: [
      { id: 'score_1000', type: 'score', target: 1000, current: 0, completed: false },
      { id: 'combo_5', type: 'combo', target: 5, current: 0, completed: false },
    ],
    rewards: [
      { type: 'coins', amount: 75 },
      { type: 'xp', amount: 150 },
    ],
    unlocked: false,
    stars: 0,
    highScore: 0,
  },
  // Levels 3-10 with progressive difficulty
  ...Array.from(
    { length: 8 },
    (_, i) =>
      ({
        id: i + 3,
        name: `Mine Level ${i + 3}`,
        theme: levelThemes.goldMine,
        difficulty: {
          level: i + 3,
          itemSpawnRate: Math.max(0.8, 1.5 - (i + 3) * 0.05),
          itemFallSpeed: 2 + (i + 3) * 0.2,
          bombChance: 0.05 + (i + 3) * 0.01,
          powerUpChance: 0.1 + (i + 3) * 0.01,
          rareItemChance: 0.05 + (i + 3) * 0.005,
          comboMultiplier: 1 + (i + 3) * 0.1,
          scoreMultiplier: 1 + (i + 3) * 0.1,
          blockageBuildup: 0.5 + (i + 3) * 0.1,
        },
        objectives: [
          {
            id: `score_${500 * (i + 3)}`,
            type: 'score' as const,
            target: 500 * (i + 3),
            current: 0,
            completed: false,
          },
          {
            id: `survive_${30 + i * 10}`,
            type: 'survive' as const,
            target: 30 + i * 10,
            current: 0,
            completed: false,
          },
        ],
        rewards: [
          { type: 'coins' as const, amount: 50 + (i + 3) * 25 },
          { type: 'xp' as const, amount: 100 + (i + 3) * 50 },
        ],
        unlocked: false,
        stars: 0,
        highScore: 0,
      }) as Level
  ),

  // World 2: Crystal Cave (Levels 11-20)
  {
    id: 11,
    name: 'Crystal Discovery',
    theme: levelThemes.crystalCave,
    difficulty: {
      level: 11,
      itemSpawnRate: 1.2,
      itemFallSpeed: 3,
      bombChance: 0.15,
      powerUpChance: 0.15,
      rareItemChance: 0.1,
      comboMultiplier: 1.5,
      scoreMultiplier: 1.5,
      blockageBuildup: 1.0,
    },
    objectives: [
      { id: 'score_5000', type: 'score', target: 5000, current: 0, completed: false },
      { id: 'collect_gems_20', type: 'collect', target: 20, current: 0, completed: false },
    ],
    rewards: [
      { type: 'coins', amount: 300 },
      { type: 'gems', amount: 10 },
      { type: 'skin', itemId: 'crystal_cart', rarity: 'uncommon' },
    ],
    unlocked: false,
    stars: 0,
    highScore: 0,
  },

  // World 3: Lava Depths (Levels 21-30)
  {
    id: 21,
    name: 'Molten Madness',
    theme: levelThemes.lavaDepths,
    difficulty: {
      level: 21,
      itemSpawnRate: 1.0,
      itemFallSpeed: 4,
      bombChance: 0.25,
      powerUpChance: 0.2,
      rareItemChance: 0.15,
      comboMultiplier: 2,
      scoreMultiplier: 2,
      blockageBuildup: 1.5,
    },
    objectives: [
      { id: 'score_10000', type: 'score', target: 10000, current: 0, completed: false },
      { id: 'avoid_bombs_10', type: 'avoid', target: 10, current: 0, completed: false },
    ],
    rewards: [
      { type: 'coins', amount: 500 },
      { type: 'gems', amount: 25 },
      { type: 'skin', itemId: 'lava_cart', rarity: 'rare' },
    ],
    unlocked: false,
    stars: 0,
    highScore: 0,
  },
];

// Achievements
export const achievements: Achievement[] = [
  // Collection Achievements
  {
    id: 'first_coin',
    name: 'First Coin',
    description: 'Collect your first coin',
    icon: '🪙',
    points: 10,
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    tier: 'bronze',
  },
  {
    id: 'coin_collector_100',
    name: 'Coin Collector',
    description: 'Collect 100 coins total',
    icon: '💰',
    points: 50,
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    tier: 'bronze',
  },
  {
    id: 'coin_master_1000',
    name: 'Coin Master',
    description: 'Collect 1,000 coins total',
    icon: '💎',
    points: 100,
    unlocked: false,
    progress: 0,
    maxProgress: 1000,
    tier: 'silver',
  },
  {
    id: 'coin_legend_10000',
    name: 'Coin Legend',
    description: 'Collect 10,000 coins total',
    icon: '👑',
    points: 500,
    unlocked: false,
    progress: 0,
    maxProgress: 10000,
    tier: 'gold',
  },

  // Combo Achievements
  {
    id: 'combo_starter',
    name: 'Combo Starter',
    description: 'Get a 5x combo',
    icon: '🔥',
    points: 25,
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    tier: 'bronze',
  },
  {
    id: 'combo_expert',
    name: 'Combo Expert',
    description: 'Get a 20x combo',
    icon: '💥',
    points: 100,
    unlocked: false,
    progress: 0,
    maxProgress: 20,
    tier: 'silver',
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Get a 50x combo',
    icon: '⚡',
    points: 250,
    unlocked: false,
    progress: 0,
    maxProgress: 50,
    tier: 'gold',
  },
  {
    id: 'combo_god',
    name: 'Combo God',
    description: 'Get a 100x combo',
    icon: '🌟',
    points: 1000,
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    tier: 'platinum',
  },

  // Survival Achievements
  {
    id: 'survivor_1min',
    name: 'Survivor',
    description: 'Survive for 1 minute',
    icon: '⏱️',
    points: 30,
    unlocked: false,
    progress: 0,
    maxProgress: 60,
    tier: 'bronze',
  },
  {
    id: 'survivor_5min',
    name: 'Endurance',
    description: 'Survive for 5 minutes',
    icon: '⏰',
    points: 150,
    unlocked: false,
    progress: 0,
    maxProgress: 300,
    tier: 'silver',
  },
  {
    id: 'survivor_10min',
    name: 'Immortal',
    description: 'Survive for 10 minutes',
    icon: '♾️',
    points: 500,
    unlocked: false,
    progress: 0,
    maxProgress: 600,
    tier: 'gold',
  },

  // Score Achievements
  {
    id: 'score_1k',
    name: 'Point Scorer',
    description: 'Score 1,000 points in a single game',
    icon: '📊',
    points: 20,
    unlocked: false,
    progress: 0,
    maxProgress: 1000,
    tier: 'bronze',
  },
  {
    id: 'score_10k',
    name: 'High Scorer',
    description: 'Score 10,000 points in a single game',
    icon: '📈',
    points: 100,
    unlocked: false,
    progress: 0,
    maxProgress: 10000,
    tier: 'silver',
  },
  {
    id: 'score_100k',
    name: 'Score Legend',
    description: 'Score 100,000 points in a single game',
    icon: '🏆',
    points: 500,
    unlocked: false,
    progress: 0,
    maxProgress: 100000,
    tier: 'gold',
  },
  {
    id: 'score_1m',
    name: 'Millionaire',
    description: 'Score 1,000,000 points in a single game',
    icon: '💸',
    points: 2000,
    unlocked: false,
    progress: 0,
    maxProgress: 1000000,
    tier: 'platinum',
  },

  // Special Achievements
  {
    id: 'no_bombs',
    name: 'Bomb Dodger',
    description: 'Play for 2 minutes without hitting a bomb',
    icon: '💣',
    points: 75,
    unlocked: false,
    progress: 0,
    maxProgress: 120,
    tier: 'silver',
  },
  {
    id: 'all_powerups',
    name: 'Power Player',
    description: 'Use all power-up types in a single game',
    icon: '⚡',
    points: 100,
    unlocked: false,
    progress: 0,
    maxProgress: 6,
    tier: 'silver',
  },
  {
    id: 'perfect_clear',
    name: 'Perfect Clear',
    description: 'Collect 50 items in a row without missing',
    icon: '✨',
    points: 200,
    unlocked: false,
    progress: 0,
    maxProgress: 50,
    tier: 'gold',
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Collect 100 items in 60 seconds',
    icon: '🏃',
    points: 150,
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    tier: 'silver',
  },

  // World Completion
  {
    id: 'complete_goldmine',
    name: 'Gold Mine Master',
    description: 'Complete all Gold Mine levels',
    icon: '⛏️',
    points: 250,
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    tier: 'gold',
  },
  {
    id: 'complete_crystal',
    name: 'Crystal Cave Conqueror',
    description: 'Complete all Crystal Cave levels',
    icon: '💎',
    points: 500,
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    tier: 'gold',
  },
  {
    id: 'complete_lava',
    name: 'Lava Depths Champion',
    description: 'Complete all Lava Depths levels',
    icon: '🌋',
    points: 750,
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    tier: 'platinum',
  },
];

// Cart Skins
export const cartSkins: CartSkin[] = [
  // Default Skins
  {
    id: 'default',
    name: 'Classic Cart',
    type: 'default',
    theme: {
      primaryColor: '#8B4513',
      secondaryColor: '#A0522D',
      accentColor: '#D2691E',
    },
    unlocked: true,
    rarity: 'common',
  },

  // Flag Skins (US States)
  {
    id: 'flag_california',
    name: 'California Cart',
    type: 'flag',
    theme: {
      primaryColor: '#FFFFFF',
      secondaryColor: '#C8102E',
      accentColor: '#6B4226',
    },
    asset: 'california_flag',
    unlocked: false,
    rarity: 'uncommon',
  },
  {
    id: 'flag_texas',
    name: 'Texas Cart',
    type: 'flag',
    theme: {
      primaryColor: '#002868',
      secondaryColor: '#FFFFFF',
      accentColor: '#BF0A30',
    },
    asset: 'texas_flag',
    unlocked: false,
    rarity: 'uncommon',
  },
  {
    id: 'flag_newyork',
    name: 'New York Cart',
    type: 'flag',
    theme: {
      primaryColor: '#002D72',
      secondaryColor: '#FFFFFF',
      accentColor: '#FF6900',
    },
    asset: 'newyork_flag',
    unlocked: false,
    rarity: 'uncommon',
  },

  // Shape Skins
  {
    id: 'shape_diamond',
    name: 'Diamond Cart',
    type: 'shape',
    theme: {
      primaryColor: '#B9F2FF',
      secondaryColor: '#00D4FF',
      accentColor: '#0099CC',
    },
    unlocked: false,
    rarity: 'rare',
  },
  {
    id: 'shape_star',
    name: 'Star Cart',
    type: 'shape',
    theme: {
      primaryColor: '#FFD700',
      secondaryColor: '#FFA500',
      accentColor: '#FF8C00',
    },
    unlocked: false,
    rarity: 'rare',
  },
  {
    id: 'shape_heart',
    name: 'Heart Cart',
    type: 'shape',
    theme: {
      primaryColor: '#FF69B4',
      secondaryColor: '#FF1493',
      accentColor: '#C71585',
    },
    unlocked: false,
    rarity: 'epic',
  },

  // Trail Skins
  {
    id: 'trail_rainbow',
    name: 'Rainbow Trail',
    type: 'trail',
    theme: {
      primaryColor: '#FF0000',
      secondaryColor: '#00FF00',
      accentColor: '#0000FF',
    },
    unlocked: false,
    rarity: 'epic',
  },
  {
    id: 'trail_fire',
    name: 'Fire Trail',
    type: 'trail',
    theme: {
      primaryColor: '#FF4500',
      secondaryColor: '#FF6347',
      accentColor: '#DC143C',
    },
    unlocked: false,
    rarity: 'epic',
  },
  {
    id: 'trail_ice',
    name: 'Ice Trail',
    type: 'trail',
    theme: {
      primaryColor: '#87CEEB',
      secondaryColor: '#4682B4',
      accentColor: '#1E90FF',
    },
    unlocked: false,
    rarity: 'epic',
  },

  // Special/Legendary Skins
  {
    id: 'special_golden',
    name: 'Golden Cart',
    type: 'special',
    theme: {
      primaryColor: '#FFD700',
      secondaryColor: '#FFED4E',
      accentColor: '#FFC125',
    },
    unlocked: false,
    rarity: 'legendary',
  },
  {
    id: 'special_crystal',
    name: 'Crystal Cart',
    type: 'special',
    theme: {
      primaryColor: '#E0B0FF',
      secondaryColor: '#B19CD9',
      accentColor: '#9370DB',
    },
    unlocked: false,
    rarity: 'legendary',
  },
  {
    id: 'special_cosmic',
    name: 'Cosmic Cart',
    type: 'special',
    theme: {
      primaryColor: '#000033',
      secondaryColor: '#FF69B4',
      accentColor: '#C71585',
    },
    unlocked: false,
    rarity: 'mythic',
  },
  {
    id: 'special_void',
    name: 'Void Cart',
    type: 'special',
    theme: {
      primaryColor: '#000000',
      secondaryColor: '#4B0082',
      accentColor: '#8A2BE2',
    },
    unlocked: false,
    rarity: 'mythic',
  },
];

// Power-up Definitions
export const powerUpDefinitions = {
  magnet: {
    name: 'Magnet',
    description: 'Attracts nearby items',
    duration: 10000,
    icon: '🧲',
    color: '#FF0000',
    range: 150,
  },
  shield: {
    name: 'Shield',
    description: 'Protects from bombs',
    duration: 8000,
    icon: '🛡️',
    color: '#4169E1',
  },
  doublePoints: {
    name: 'Double Points',
    description: '2x score multiplier',
    duration: 15000,
    icon: '×2',
    color: '#FFD700',
    multiplier: 2,
  },
  slowTime: {
    name: 'Slow Time',
    description: 'Slows falling items',
    duration: 12000,
    icon: '⏰',
    color: '#00CED1',
    multiplier: 0.5,
  },
  explosion: {
    name: 'Explosion',
    description: 'Clears all items on screen',
    duration: 0,
    icon: '💥',
    color: '#FF4500',
  },
  invincibility: {
    name: 'Invincibility',
    description: 'Become invincible',
    duration: 5000,
    icon: '⭐',
    color: '#FFD700',
  },
};

// Item Value Definitions
export const itemValues = {
  coin: {
    points: 10,
    coins: 1,
    rarity: 'common' as ItemRarity,
    spawnWeight: 40,
  },
  gem: {
    points: 25,
    coins: 3,
    rarity: 'uncommon' as ItemRarity,
    spawnWeight: 25,
  },
  diamond: {
    points: 50,
    coins: 5,
    rarity: 'rare' as ItemRarity,
    spawnWeight: 15,
  },
  star: {
    points: 100,
    coins: 10,
    rarity: 'epic' as ItemRarity,
    spawnWeight: 8,
  },
  heart: {
    points: 0,
    coins: 0,
    lives: 1,
    rarity: 'uncommon' as ItemRarity,
    spawnWeight: 5,
  },
  bomb: {
    points: -50,
    coins: 0,
    damage: 1,
    rarity: 'common' as ItemRarity,
    spawnWeight: 15,
  },
  powerup: {
    points: 0,
    coins: 0,
    rarity: 'rare' as ItemRarity,
    spawnWeight: 7,
  },
  mystery: {
    points: 0,
    coins: 0,
    rarity: 'epic' as ItemRarity,
    spawnWeight: 3,
  },
  special: {
    points: 500,
    coins: 50,
    rarity: 'legendary' as ItemRarity,
    spawnWeight: 1,
  },
};

// Season Pass Tiers
export const seasonPassTiers = Array.from({ length: 50 }, (_, i) => ({
  level: i + 1,
  requiredXP: (i + 1) * 1000,
  freeReward: {
    type: i % 5 === 0 ? 'gems' : 'coins',
    amount: i % 5 === 0 ? 5 + Math.floor(i / 5) * 5 : 100 + i * 50,
  } as any,
  premiumReward: {
    type: i % 10 === 0 ? 'skin' : i % 5 === 0 ? 'powerup' : 'gems',
    amount: i % 10 === 0 ? undefined : i % 5 === 0 ? 3 : 10 + i * 2,
    itemId: i % 10 === 0 ? `season_skin_${i / 10}` : undefined,
    rarity: i % 10 === 0 ? (i >= 40 ? 'legendary' : i >= 30 ? 'epic' : 'rare') : undefined,
  } as any,
  unlocked: false,
  claimed: false,
}));

// Daily Challenges
export const dailyChallenges = [
  {
    id: 'daily_coins_100',
    title: 'Coin Collector',
    description: 'Collect 100 coins',
    type: 'daily',
    objectives: [
      { id: 'coins', description: 'Collect coins', current: 0, target: 100, completed: false },
    ],
    rewards: [
      { type: 'coins', amount: 200 },
      { type: 'xp', amount: 500 },
    ],
    completed: false,
    claimed: false,
  },
  {
    id: 'daily_combo_10',
    title: 'Combo Master',
    description: 'Get a 10x combo',
    type: 'daily',
    objectives: [
      { id: 'combo', description: 'Reach combo', current: 0, target: 10, completed: false },
    ],
    rewards: [
      { type: 'gems', amount: 5 },
      { type: 'xp', amount: 750 },
    ],
    completed: false,
    claimed: false,
  },
  {
    id: 'daily_survive_120',
    title: 'Survivor',
    description: 'Survive for 2 minutes',
    type: 'daily',
    objectives: [
      { id: 'survive', description: 'Survive seconds', current: 0, target: 120, completed: false },
    ],
    rewards: [
      { type: 'powerup', amount: 2 },
      { type: 'xp', amount: 1000 },
    ],
    completed: false,
    claimed: false,
  },
];

// Weekly Challenges
export const weeklyChallenges = [
  {
    id: 'weekly_score_50k',
    title: 'Score Champion',
    description: 'Score 50,000 points total',
    type: 'weekly',
    objectives: [
      { id: 'score', description: 'Total score', current: 0, target: 50000, completed: false },
    ],
    rewards: [
      { type: 'gems', amount: 50 },
      { type: 'skin', itemId: 'weekly_skin', rarity: 'rare' },
    ],
    completed: false,
    claimed: false,
  },
  {
    id: 'weekly_games_25',
    title: 'Dedicated Player',
    description: 'Play 25 games',
    type: 'weekly',
    objectives: [
      { id: 'games', description: 'Games played', current: 0, target: 25, completed: false },
    ],
    rewards: [
      { type: 'coins', amount: 2500 },
      { type: 'xp', amount: 5000 },
    ],
    completed: false,
    claimed: false,
  },
];
