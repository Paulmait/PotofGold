import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineManager } from './offlineManager';

export interface Level {
  id: string;
  world: number;
  day: number;
  name: string;
  description: string;
  difficulty: number;
  requiredScore: number;
  unlockedPowerUps: string[];
  obstacles: string[];
  background: string;
  music: string;
  rewards: {
    coins: number;
    experience: number;
    powerUps: string[];
  };
}

export interface World {
  id: number;
  name: string;
  theme: string;
  description: string;
  background: string;
  unlocked: boolean;
  requiredLevel: number;
  levels: Level[];
}

export interface PlayerProgress {
  userId: string;
  currentWorld: number;
  currentDay: number;
  totalDaysCompleted: number;
  experience: number;
  level: number;
  unlockedWorlds: number[];
  completedLevels: string[];
  dailyStreak: number;
  lastPlayedDate: string;
  achievements: string[];
  metaProgress: {
    campLevel: number;
    shopLevel: number;
    potCollection: string[];
    skinCollection: string[];
  };
}

export class ProgressionSystem {
  private static instance: ProgressionSystem;
  private worlds: World[] = [];
  private playerProgress: PlayerProgress | null = null;

  static getInstance(): ProgressionSystem {
    if (!ProgressionSystem.instance) {
      ProgressionSystem.instance = new ProgressionSystem();
    }
    return ProgressionSystem.instance;
  }

  constructor() {
    this.initializeWorlds();
  }

  private initializeWorlds(): void {
    this.worlds = [
      {
        id: 1,
        name: 'Gold Mine',
        theme: 'mining',
        description: 'Start your journey in the depths of the gold mine',
        background: 'mine_background',
        unlocked: true,
        requiredLevel: 1,
        levels: this.generateMineLevels(),
      },
      {
        id: 2,
        name: 'Volcano Cave',
        theme: 'volcano',
        description: 'Navigate through the fiery depths of the volcano',
        background: 'volcano_background',
        unlocked: false,
        requiredLevel: 10,
        levels: this.generateVolcanoLevels(),
      },
      {
        id: 3,
        name: 'Rainbow Realm',
        theme: 'rainbow',
        description: 'Discover the magical rainbow realm',
        background: 'rainbow_background',
        unlocked: false,
        requiredLevel: 20,
        levels: this.generateRainbowLevels(),
      },
      {
        id: 4,
        name: 'Crystal Caverns',
        theme: 'crystal',
        description: 'Explore the mysterious crystal caverns',
        background: 'crystal_background',
        unlocked: false,
        requiredLevel: 30,
        levels: this.generateCrystalLevels(),
      },
      {
        id: 5,
        name: 'Cosmic Void',
        theme: 'cosmic',
        description: 'Journey through the infinite cosmic void',
        background: 'cosmic_background',
        unlocked: false,
        requiredLevel: 40,
        levels: this.generateCosmicLevels(),
      },
    ];
  }

  private generateMineLevels(): Level[] {
    const levels: Level[] = [];

    for (let day = 1; day <= 30; day++) {
      const difficulty = Math.min(1 + (day - 1) * 0.2, 5);
      const requiredScore = Math.floor(100 + (day - 1) * 50);

      levels.push({
        id: `mine_day_${day}`,
        world: 1,
        day,
        name: `Day ${day} in the Mine`,
        description: `Mining deeper into the gold mine`,
        difficulty,
        requiredScore,
        unlockedPowerUps: this.getUnlockedPowerUps(day),
        obstacles: this.getObstacles(day),
        background: `mine_day_${day}`,
        music: `mine_theme_${Math.ceil(day / 10)}`,
        rewards: {
          coins: Math.floor(10 + day * 2),
          experience: Math.floor(20 + day * 5),
          powerUps: day % 5 === 0 ? ['new_powerup'] : [],
        },
      });
    }

    return levels;
  }

  private generateVolcanoLevels(): Level[] {
    const levels: Level[] = [];

    for (let day = 1; day <= 30; day++) {
      const difficulty = Math.min(2 + (day - 1) * 0.3, 6);
      const requiredScore = Math.floor(200 + (day - 1) * 75);

      levels.push({
        id: `volcano_day_${day}`,
        world: 2,
        day,
        name: `Volcano Day ${day}`,
        description: `Surviving the fiery depths`,
        difficulty,
        requiredScore,
        unlockedPowerUps: this.getUnlockedPowerUps(30 + day),
        obstacles: this.getObstacles(30 + day),
        background: `volcano_day_${day}`,
        music: `volcano_theme_${Math.ceil(day / 10)}`,
        rewards: {
          coins: Math.floor(20 + day * 3),
          experience: Math.floor(40 + day * 8),
          powerUps: day % 5 === 0 ? ['volcano_powerup'] : [],
        },
      });
    }

    return levels;
  }

  private generateRainbowLevels(): Level[] {
    const levels: Level[] = [];

    for (let day = 1; day <= 30; day++) {
      const difficulty = Math.min(3 + (day - 1) * 0.4, 7);
      const requiredScore = Math.floor(300 + (day - 1) * 100);

      levels.push({
        id: `rainbow_day_${day}`,
        world: 3,
        day,
        name: `Rainbow Day ${day}`,
        description: `Exploring the magical rainbow realm`,
        difficulty,
        requiredScore,
        unlockedPowerUps: this.getUnlockedPowerUps(60 + day),
        obstacles: this.getObstacles(60 + day),
        background: `rainbow_day_${day}`,
        music: `rainbow_theme_${Math.ceil(day / 10)}`,
        rewards: {
          coins: Math.floor(30 + day * 4),
          experience: Math.floor(60 + day * 10),
          powerUps: day % 5 === 0 ? ['rainbow_powerup'] : [],
        },
      });
    }

    return levels;
  }

  private generateCrystalLevels(): Level[] {
    const levels: Level[] = [];

    for (let day = 1; day <= 30; day++) {
      const difficulty = Math.min(4 + (day - 1) * 0.5, 8);
      const requiredScore = Math.floor(400 + (day - 1) * 125);

      levels.push({
        id: `crystal_day_${day}`,
        world: 4,
        day,
        name: `Crystal Day ${day}`,
        description: `Navigating the mysterious crystal caverns`,
        difficulty,
        requiredScore,
        unlockedPowerUps: this.getUnlockedPowerUps(90 + day),
        obstacles: this.getObstacles(90 + day),
        background: `crystal_day_${day}`,
        music: `crystal_theme_${Math.ceil(day / 10)}`,
        rewards: {
          coins: Math.floor(40 + day * 5),
          experience: Math.floor(80 + day * 12),
          powerUps: day % 5 === 0 ? ['crystal_powerup'] : [],
        },
      });
    }

    return levels;
  }

  private generateCosmicLevels(): Level[] {
    const levels: Level[] = [];

    for (let day = 1; day <= 30; day++) {
      const difficulty = Math.min(5 + (day - 1) * 0.6, 10);
      const requiredScore = Math.floor(500 + (day - 1) * 150);

      levels.push({
        id: `cosmic_day_${day}`,
        world: 5,
        day,
        name: `Cosmic Day ${day}`,
        description: `Journeying through the infinite cosmic void`,
        difficulty,
        requiredScore,
        unlockedPowerUps: this.getUnlockedPowerUps(120 + day),
        obstacles: this.getObstacles(120 + day),
        background: `cosmic_day_${day}`,
        music: `cosmic_theme_${Math.ceil(day / 10)}`,
        rewards: {
          coins: Math.floor(50 + day * 6),
          experience: Math.floor(100 + day * 15),
          powerUps: day % 5 === 0 ? ['cosmic_powerup'] : [],
        },
      });
    }

    return levels;
  }

  private getUnlockedPowerUps(day: number): string[] {
    const powerUps = ['magnet', 'slowMotion', 'doublePoints', 'goldRush'];
    const unlocked: string[] = [];

    if (day >= 1) unlocked.push('magnet');
    if (day >= 5) unlocked.push('slowMotion');
    if (day >= 10) unlocked.push('doublePoints');
    if (day >= 15) unlocked.push('goldRush');

    return unlocked;
  }

  private getObstacles(day: number): string[] {
    const obstacles: string[] = [];

    if (day >= 5) obstacles.push('falling_rocks');
    if (day >= 10) obstacles.push('fake_coins');
    if (day >= 15) obstacles.push('slippery_platforms');
    if (day >= 20) obstacles.push('wind_gusts');
    if (day >= 25) obstacles.push('gravity_shifts');

    return obstacles;
  }

  // Load player progress
  async loadPlayerProgress(userId: string): Promise<PlayerProgress> {
    try {
      // Try to load from offline storage first
      const offlineData = await offlineManager.getOfflineData(userId);

      if (offlineData.progression) {
        this.playerProgress = offlineData.progression;
        return this.playerProgress;
      }
    } catch (error) {
      console.log('Error loading offline progression:', error);
    }

    // Default progress
    this.playerProgress = {
      userId,
      currentWorld: 1,
      currentDay: 1,
      totalDaysCompleted: 0,
      experience: 0,
      level: 1,
      unlockedWorlds: [1],
      completedLevels: [],
      dailyStreak: 0,
      lastPlayedDate: new Date().toISOString().split('T')[0],
      achievements: [],
      metaProgress: {
        campLevel: 1,
        shopLevel: 1,
        potCollection: ['basic_pot'],
        skinCollection: ['default_skin'],
      },
    };

    await this.savePlayerProgress();
    return this.playerProgress;
  }

  // Save player progress
  async savePlayerProgress(): Promise<void> {
    if (!this.playerProgress) return;

    try {
      // Save to offline storage
      await offlineManager.saveOfflineData(this.playerProgress.userId, {
        progression: this.playerProgress,
      });

      // Add to sync queue for online storage
      await offlineManager.addPendingAction(this.playerProgress.userId, {
        type: 'progression_update',
        data: this.playerProgress,
      });
    } catch (error) {
      console.log('Error saving player progress:', error);
    }
  }

  // Complete a level
  async completeLevel(
    levelId: string,
    score: number,
    coinsEarned: number
  ): Promise<{
    success: boolean;
    rewards: any;
    nextLevel?: Level;
    worldUnlocked?: World;
  }> {
    if (!this.playerProgress) return { success: false, rewards: {} };

    const level = this.getLevelById(levelId);
    if (!level) return { success: false, rewards: {} };

    // Check if score meets requirement
    if (score < level.requiredScore) {
      return { success: false, rewards: {} };
    }

    // Add to completed levels
    if (!this.playerProgress.completedLevels.includes(levelId)) {
      this.playerProgress.completedLevels.push(levelId);
      this.playerProgress.totalDaysCompleted++;
    }

    // Add experience and coins
    this.playerProgress.experience += level.rewards.experience;
    this.playerProgress.coins = (this.playerProgress.coins || 0) + coinsEarned;

    // Check for level up
    const newLevel = Math.floor(this.playerProgress.experience / 100) + 1;
    if (newLevel > this.playerProgress.level) {
      this.playerProgress.level = newLevel;
    }

    // Check for world unlock
    const worldUnlocked = this.checkWorldUnlock();

    // Get next level
    const nextLevel = this.getNextLevel();

    // Update current progress
    if (nextLevel) {
      this.playerProgress.currentWorld = nextLevel.world;
      this.playerProgress.currentDay = nextLevel.day;
    }

    // Save progress
    await this.savePlayerProgress();

    return {
      success: true,
      rewards: level.rewards,
      nextLevel,
      worldUnlocked,
    };
  }

  // Get current level
  getCurrentLevel(): Level | null {
    if (!this.playerProgress) return null;

    return this.getLevelById(
      `${this.getWorldTheme(this.playerProgress.currentWorld)}_day_${this.playerProgress.currentDay}`
    );
  }

  // Get next level
  getNextLevel(): Level | null {
    if (!this.playerProgress) return null;

    const currentLevel = this.getCurrentLevel();
    if (!currentLevel) return null;

    const world = this.worlds.find((w) => w.id === currentLevel.world);
    if (!world) return null;

    const nextDay = currentLevel.day + 1;
    if (nextDay > world.levels.length) {
      // Move to next world
      const nextWorld = this.worlds.find((w) => w.id === currentLevel.world + 1);
      if (nextWorld && this.playerProgress!.unlockedWorlds.includes(nextWorld.id)) {
        return nextWorld.levels[0];
      }
      return null;
    }

    return world.levels.find((l) => l.day === nextDay) || null;
  }

  // Check for world unlock
  private checkWorldUnlock(): World | null {
    if (!this.playerProgress) return null;

    for (const world of this.worlds) {
      if (
        !this.playerProgress.unlockedWorlds.includes(world.id) &&
        this.playerProgress.level >= world.requiredLevel
      ) {
        this.playerProgress.unlockedWorlds.push(world.id);
        return world;
      }
    }

    return null;
  }

  // Get level by ID
  private getLevelById(levelId: string): Level | null {
    for (const world of this.worlds) {
      const level = world.levels.find((l) => l.id === levelId);
      if (level) return level;
    }
    return null;
  }

  // Get world theme
  private getWorldTheme(worldId: number): string {
    const themes = ['mine', 'volcano', 'rainbow', 'crystal', 'cosmic'];
    return themes[worldId - 1] || 'mine';
  }

  // Get all worlds
  getWorlds(): World[] {
    return this.worlds;
  }

  // Get player progress
  getPlayerProgress(): PlayerProgress | null {
    return this.playerProgress;
  }

  // Update daily streak
  async updateDailyStreak(): Promise<void> {
    if (!this.playerProgress) return;

    const today = new Date().toISOString().split('T')[0];
    const lastPlayed = this.playerProgress.lastPlayedDate;

    if (lastPlayed === today) {
      // Already played today
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastPlayed === yesterdayStr) {
      // Consecutive day
      this.playerProgress.dailyStreak++;
    } else {
      // Streak broken
      this.playerProgress.dailyStreak = 1;
    }

    this.playerProgress.lastPlayedDate = today;
    await this.savePlayerProgress();
  }

  // Get available power-ups for current level
  getAvailablePowerUps(): string[] {
    const currentLevel = this.getCurrentLevel();
    return currentLevel?.unlockedPowerUps || ['magnet'];
  }

  // Get level difficulty multiplier
  getDifficultyMultiplier(): number {
    const currentLevel = this.getCurrentLevel();
    return currentLevel?.difficulty || 1;
  }
}

export const progressionSystem = ProgressionSystem.getInstance();
