/**
 * Complete TypeScript type definitions for the game
 */

// Core game types
export interface GameState {
  isActive: boolean;
  isPaused: boolean;
  score: number;
  coins: number;
  lives: number;
  level: number;
  combo: number;
  timeSurvived: number;
  highScore: number;
  totalCoinsCollected: number;
  powerUpsUsed: number;
  obstaclesAvoided: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Velocity {
  x: number;
  y: number;
}

// Item types
export type ItemType = 
  | 'coin' 
  | 'gem' 
  | 'diamond' 
  | 'star' 
  | 'heart' 
  | 'bomb' 
  | 'powerup'
  | 'mystery'
  | 'special';

export type ItemRarity = 
  | 'common' 
  | 'uncommon' 
  | 'rare' 
  | 'epic' 
  | 'legendary' 
  | 'mythic';

export interface FallingItem {
  id: string | number;
  type: ItemType;
  position: Position;
  velocity: Velocity;
  size: number;
  rarity: ItemRarity;
  points: number;
  collected: boolean;
  rotation?: number;
  scale?: number;
  specialEffect?: string;
}

// Power-up types
export type PowerUpType = 
  | 'magnet' 
  | 'shield' 
  | 'doublePoints' 
  | 'slowTime' 
  | 'explosion' 
  | 'invincibility';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  duration: number;
  startTime: number;
  endTime: number;
  multiplier?: number;
  range?: number;
}

// Cart/Player types
export interface Cart {
  position: Position;
  size: Size;
  velocity: Velocity;
  skin: CartSkin | null;
  trail: boolean;
  magnetActive: boolean;
  shieldActive: boolean;
}

export interface CartSkin {
  id: string;
  name: string;
  type: 'default' | 'flag' | 'shape' | 'trail' | 'special';
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  asset?: string;
  unlocked: boolean;
  rarity: ItemRarity;
}

// Blockage system types
export interface Blockage {
  id: string;
  position: Position;
  size: Size;
  type: string;
  health: number;
  maxHealth: number;
  isBreaking: boolean;
  layer: number;
}

export interface BlockageLayer {
  level: number;
  blockages: Blockage[];
  totalHeight: number;
}

export type BlockageWarningLevel = 'safe' | 'warning' | 'danger' | 'critical';

// Achievement types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

// Level/Difficulty types
export interface Level {
  id: number;
  name: string;
  theme: LevelTheme;
  difficulty: DifficultySettings;
  objectives: LevelObjective[];
  rewards: Reward[];
  unlocked: boolean;
  stars: number;
  highScore: number;
}

export interface LevelTheme {
  name: string;
  backgroundColor: string;
  foregroundColor: string;
  particleColors: string[];
  musicTrack: string;
  specialItems: ItemType[];
}

export interface DifficultySettings {
  level: number;
  itemSpawnRate: number;
  itemFallSpeed: number;
  bombChance: number;
  powerUpChance: number;
  rareItemChance: number;
  comboMultiplier: number;
  scoreMultiplier: number;
  blockageBuildup: number;
}

export interface LevelObjective {
  id: string;
  type: 'score' | 'coins' | 'combo' | 'survive' | 'collect' | 'avoid';
  target: number;
  current: number;
  completed: boolean;
  reward?: Reward;
}

// Reward types
export interface Reward {
  type: 'coins' | 'gems' | 'skin' | 'powerup' | 'achievement' | 'xp';
  amount?: number;
  itemId?: string;
  rarity?: ItemRarity;
}

// Mission types
export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special' | 'achievement';
  objectives: MissionObjective[];
  rewards: Reward[];
  expiresAt?: Date;
  completed: boolean;
  claimed: boolean;
}

export interface MissionObjective {
  id: string;
  description: string;
  current: number;
  target: number;
  completed: boolean;
}

// Season Pass types
export interface SeasonPass {
  id: string;
  name: string;
  theme: string;
  startDate: Date;
  endDate: Date;
  currentTier: number;
  maxTier: number;
  isPremium: boolean;
  tiers: SeasonTier[];
}

export interface SeasonTier {
  level: number;
  requiredXP: number;
  freeReward: Reward;
  premiumReward?: Reward;
  unlocked: boolean;
  claimed: boolean;
}

// User/Player types
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  level: number;
  experience: number;
  totalScore: number;
  totalCoins: number;
  totalGems: number;
  gamesPlayed: number;
  achievements: string[];
  unlockedSkins: string[];
  selectedSkin: string;
  settings: UserSettings;
  statistics: UserStatistics;
  subscription?: Subscription;
}

export interface UserSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
}

export interface UserStatistics {
  highScore: number;
  longestCombo: number;
  totalPlayTime: number;
  favoriteItem: ItemType;
  itemsCollected: Record<ItemType, number>;
  powerUpsUsed: Record<PowerUpType, number>;
  achievementsUnlocked: number;
  dailyStreak: number;
  winRate: number;
}

// Subscription/Monetization types
export interface Subscription {
  id: string;
  type: 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'expired' | 'cancelled' | 'paused';
  startDate: Date;
  endDate?: Date;
  benefits: string[];
  autoRenew: boolean;
}

export interface Purchase {
  id: string;
  type: 'coins' | 'gems' | 'skin' | 'powerup' | 'subscription' | 'seasonpass';
  productId: string;
  price: number;
  currency: string;
  purchaseDate: Date;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Game: { mode?: 'classic' | 'challenge' | 'endless' };
  GameOver: { score: number; coins: number; level: number; timeSurvived: number };
  Settings: undefined;
  Shop: undefined;
  SkinShop: undefined;
  Locker: undefined;
  Leaderboard: undefined;
  Stats: undefined;
  Auth: undefined;
  Onboarding: { onComplete: () => void };
  LegalAgreement: { onAccept: () => void; onDecline: () => void };
  AdminPanel: undefined;
};

// Event types for analytics
export interface GameEvent {
  type: string;
  timestamp: Date;
  data: Record<string, any>;
  userId?: string;
  sessionId: string;
}

// Collision types
export interface CollisionBox {
  position: Position;
  size: Size;
  type: 'cart' | 'item' | 'blockage' | 'powerup';
  entity: any;
}

// Animation types
export interface AnimationConfig {
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  delay?: number;
  loop?: boolean;
  useNativeDriver: boolean;
}

// Touch/Input types
export interface TouchEvent {
  x: number;
  y: number;
  timestamp: number;
  type: 'tap' | 'swipe' | 'hold' | 'drag';
  velocity?: Velocity;
}

// Particle Effect types
export interface ParticleConfig {
  type: 'collect' | 'explosion' | 'sparkle' | 'damage' | 'trail';
  position: Position;
  count: number;
  colors: string[];
  velocity: number;
  duration: number;
  gravity: boolean;
}

// Combo types
export interface ComboState {
  count: number;
  multiplier: number;
  timer: number;
  maxTimer: number;
  tier: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

// Tutorial types
export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  highlightArea?: {
    position: Position;
    size: Size;
  };
  action?: 'tap' | 'swipe' | 'hold' | 'wait';
  completed: boolean;
}

// Export utility type helpers
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;