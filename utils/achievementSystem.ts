export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'score' | 'combo' | 'collection' | 'state' | 'special';
  requirement: {
    type: string;
    value: number;
  };
  reward: {
    type: 'coins' | 'powerUp' | 'skin' | 'stateUnlock';
    value: number | string;
  };
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Score Achievements
  {
    id: 'first_1000',
    title: 'Getting Started',
    description: 'Score 1,000 points',
    icon: '🎯',
    category: 'score',
    requirement: { type: 'score', value: 1000 },
    reward: { type: 'coins', value: 50 },
    isUnlocked: false,
    progress: 0,
    maxProgress: 1000,
  },
  {
    id: 'score_master',
    title: 'Score Master',
    description: 'Score 10,000 points',
    icon: '🏆',
    category: 'score',
    requirement: { type: 'score', value: 10000 },
    reward: { type: 'powerUp', value: 'doubleScore' },
    isUnlocked: false,
    progress: 0,
    maxProgress: 10000,
  },
  {
    id: 'score_legend',
    title: 'Score Legend',
    description: 'Score 100,000 points',
    icon: '👑',
    category: 'score',
    requirement: { type: 'score', value: 100000 },
    reward: { type: 'skin', value: 'golden_cart' },
    isUnlocked: false,
    progress: 0,
    maxProgress: 100000,
  },

  // Combo Achievements
  {
    id: 'combo_starter',
    title: 'Combo Starter',
    description: 'Achieve a 5x combo',
    icon: '⚡',
    category: 'combo',
    requirement: { type: 'combo', value: 5 },
    reward: { type: 'coins', value: 25 },
    isUnlocked: false,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'combo_master',
    title: 'Combo Master',
    description: 'Achieve a 15x combo',
    icon: '🔥',
    category: 'combo',
    requirement: { type: 'combo', value: 15 },
    reward: { type: 'powerUp', value: 'comboLock' },
    isUnlocked: false,
    progress: 0,
    maxProgress: 15,
  },
  {
    id: 'combo_legend',
    title: 'Combo Legend',
    description: 'Achieve a 50x combo',
    icon: '💎',
    category: 'combo',
    requirement: { type: 'combo', value: 50 },
    reward: { type: 'skin', value: 'diamond_cart' },
    isUnlocked: false,
    progress: 0,
    maxProgress: 50,
  },

  // Collection Achievements
  {
    id: 'coin_collector',
    title: 'Coin Collector',
    description: 'Collect 100 coins',
    icon: '🪙',
    category: 'collection',
    requirement: { type: 'coins', value: 100 },
    reward: { type: 'coins', value: 100 },
    isUnlocked: false,
    progress: 0,
    maxProgress: 100,
  },
  {
    id: 'gem_hunter',
    title: 'Gem Hunter',
    description: 'Collect 50 gemstones',
    icon: '💎',
    category: 'collection',
    requirement: { type: 'gems', value: 50 },
    reward: { type: 'powerUp', value: 'gemMagnet' },
    isUnlocked: false,
    progress: 0,
    maxProgress: 50,
  },
  {
    id: 'state_explorer',
    title: 'State Explorer',
    description: 'Unlock 10 states',
    icon: '🗺️',
    category: 'state',
    requirement: { type: 'states', value: 10 },
    reward: { type: 'stateUnlock', value: 'special_theme' },
    isUnlocked: false,
    progress: 0,
    maxProgress: 10,
  },

  // Special Achievements
  {
    id: 'survival_expert',
    title: 'Survival Expert',
    description: 'Survive for 5 minutes',
    icon: '⏱️',
    category: 'special',
    requirement: { type: 'time', value: 300 },
    reward: { type: 'powerUp', value: 'extraLife' },
    isUnlocked: false,
    progress: 0,
    maxProgress: 300,
  },
  {
    id: 'perfect_catcher',
    title: 'Perfect Catcher',
    description: 'Catch 100 items without missing',
    icon: '🎯',
    category: 'special',
    requirement: { type: 'perfectCatches', value: 100 },
    reward: { type: 'skin', value: 'precision_cart' },
    isUnlocked: false,
    progress: 0,
    maxProgress: 100,
  },
];

export class AchievementSystem {
  private achievements: Map<string, Achievement> = new Map();
  private unlockedAchievements: Set<string> = new Set();

  constructor() {
    ACHIEVEMENTS.forEach((achievement) => {
      this.achievements.set(achievement.id, { ...achievement });
    });
    this.loadUnlockedAchievements();
  }

  /**
   * Update achievement progress
   */
  updateProgress(type: string, value: number): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    this.achievements.forEach((achievement, id) => {
      if (this.unlockedAchievements.has(id)) return;

      if (achievement.requirement.type === type) {
        achievement.progress = Math.min(value, achievement.maxProgress);

        if (achievement.progress >= achievement.requirement.value) {
          this.unlockAchievement(id);
          newlyUnlocked.push(achievement);
        }
      }
    });

    return newlyUnlocked;
  }

  /**
   * Unlock an achievement
   */
  private unlockAchievement(achievementId: string): void {
    this.unlockedAchievements.add(achievementId);
    const achievement = this.achievements.get(achievementId);
    if (achievement) {
      achievement.isUnlocked = true;
    }
    this.saveUnlockedAchievements();
  }

  /**
   * Get all achievements
   */
  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Get unlocked achievements
   */
  getUnlockedAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter((a) => a.isUnlocked);
  }

  /**
   * Get achievement progress
   */
  getProgress(achievementId: string): number {
    const achievement = this.achievements.get(achievementId);
    return achievement ? achievement.progress : 0;
  }

  /**
   * Check if achievement is unlocked
   */
  isUnlocked(achievementId: string): boolean {
    return this.unlockedAchievements.has(achievementId);
  }

  /**
   * Get achievement by ID
   */
  getAchievement(achievementId: string): Achievement | undefined {
    return this.achievements.get(achievementId);
  }

  /**
   * Load unlocked achievements from storage
   */
  private loadUnlockedAchievements(): void {
    // In a real app, load from AsyncStorage
    console.log('Loading unlocked achievements...');
  }

  /**
   * Save unlocked achievements to storage
   */
  private saveUnlockedAchievements(): void {
    // In a real app, save to AsyncStorage
    console.log('Saving unlocked achievements:', Array.from(this.unlockedAchievements));
  }
}
