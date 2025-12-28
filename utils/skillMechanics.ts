import { Dimensions } from 'react-native';
import { offlineManager } from './offlineManager';

const { width, height } = Dimensions.get('window');

export interface Obstacle {
  id: string;
  type: 'falling_rock' | 'fake_coin' | 'slippery_platform' | 'wind_gust' | 'gravity_shift';
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  direction: number;
  damage: number;
  effect: string;
  active: boolean;
}

export interface ComboSystem {
  currentCombo: number;
  maxCombo: number;
  comboMultiplier: number;
  comboTimeWindow: number;
  lastCoinTime: number;
  comboRewards: {
    coins: number;
    experience: number;
    powerUps: string[];
  };
}

export interface SkillProgression {
  userId: string;
  level: number;
  experience: number;
  skills: {
    accuracy: number;
    speed: number;
    reflexes: number;
    strategy: number;
    endurance: number;
  };
  achievements: string[];
  masteryLevels: {
    [skillName: string]: number;
  };
  totalGamesPlayed: number;
  averageScore: number;
  bestCombo: number;
  obstaclesAvoided: number;
  lastUpdated: Date;
}

export class SkillMechanicsSystem {
  private static instance: SkillMechanicsSystem;
  private skillProgress: SkillProgression | null = null;
  private comboSystem: ComboSystem;
  private obstacles: Obstacle[] = [];

  static getInstance(): SkillMechanicsSystem {
    if (!SkillMechanicsSystem.instance) {
      SkillMechanicsSystem.instance = new SkillMechanicsSystem();
    }
    return SkillMechanicsSystem.instance;
  }

  constructor() {
    this.comboSystem = {
      currentCombo: 0,
      maxCombo: 0,
      comboMultiplier: 1,
      comboTimeWindow: 3000, // 3 seconds
      lastCoinTime: 0,
      comboRewards: {
        coins: 0,
        experience: 0,
        powerUps: [],
      },
    };
  }

  // Initialize skill progression
  async initializeSkillProgress(userId: string): Promise<SkillProgression> {
    try {
      const offlineData = await offlineManager.getOfflineData(userId);

      if (offlineData.skillProgress) {
        this.skillProgress = offlineData.skillProgress;
        return this.skillProgress;
      }
    } catch (error) {
      console.log('Error loading skill progress:', error);
    }

    // Create default skill progress
    this.skillProgress = {
      userId,
      level: 1,
      experience: 0,
      skills: {
        accuracy: 1,
        speed: 1,
        reflexes: 1,
        strategy: 1,
        endurance: 1,
      },
      achievements: [],
      masteryLevels: {},
      totalGamesPlayed: 0,
      averageScore: 0,
      bestCombo: 0,
      obstaclesAvoided: 0,
      lastUpdated: new Date(),
    };

    await this.saveSkillProgress();
    return this.skillProgress!;
  }

  // Generate obstacles based on level and difficulty
  generateObstacles(level: number, difficulty: number): Obstacle[] {
    const obstacles: Obstacle[] = [];
    const obstacleCount = Math.min(3 + Math.floor(level / 5), 10);

    for (let i = 0; i < obstacleCount; i++) {
      const obstacleType = this.getRandomObstacleType(level);
      const obstacle = this.createObstacle(obstacleType, level, difficulty);
      obstacles.push(obstacle);
    }

    this.obstacles = obstacles;
    return obstacles;
  }

  // Get random obstacle type based on level
  private getRandomObstacleType(level: number): Obstacle['type'] {
    const types: Obstacle['type'][] = [
      'falling_rock',
      'fake_coin',
      'slippery_platform',
      'wind_gust',
      'gravity_shift',
    ];
    const weights = [0.4, 0.3, 0.2, 0.08, 0.02]; // Probability weights

    // Adjust weights based on level
    if (level >= 10) weights[3] += 0.1; // More wind gusts
    if (level >= 20) weights[4] += 0.05; // More gravity shifts

    const random = Math.random();
    let cumulativeWeight = 0;

    for (let i = 0; i < types.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return types[i] || 'falling_rock';
      }
    }

    return 'falling_rock';
  }

  // Create obstacle with properties
  private createObstacle(type: Obstacle['type'], level: number, difficulty: number): Obstacle {
    const baseSpeed = 2 + level * 0.1 + difficulty * 0.2;
    const baseDamage = 1 + Math.floor(level / 5);

    switch (type) {
      case 'falling_rock':
        return {
          id: `rock_${Date.now()}_${Math.random()}`,
          type,
          x: Math.random() * (width - 60),
          y: -50,
          width: 40 + Math.random() * 20,
          height: 40 + Math.random() * 20,
          speed: baseSpeed + Math.random() * 2,
          direction: Math.PI / 2 + (Math.random() - 0.5) * 0.3,
          damage: baseDamage,
          effect: 'damage_on_hit',
          active: true,
        };

      case 'fake_coin':
        return {
          id: `fake_coin_${Date.now()}_${Math.random()}`,
          type,
          x: Math.random() * (width - 30),
          y: -30,
          width: 30,
          height: 30,
          speed: baseSpeed * 0.8,
          direction: Math.PI / 2,
          damage: baseDamage * 2,
          effect: 'penalty_on_collect',
          active: true,
        };

      case 'slippery_platform':
        return {
          id: `platform_${Date.now()}_${Math.random()}`,
          type,
          x: Math.random() * (width - 100),
          y: height - 200,
          width: 100,
          height: 20,
          speed: 0,
          direction: 0,
          damage: baseDamage * 0.5,
          effect: 'reduced_control',
          active: true,
        };

      case 'wind_gust':
        return {
          id: `wind_${Date.now()}_${Math.random()}`,
          type,
          x: Math.random() * width,
          y: -20,
          width: 150,
          height: 20,
          speed: baseSpeed * 1.5,
          direction: Math.PI / 2,
          damage: baseDamage * 0.3,
          effect: 'push_effect',
          active: true,
        };

      case 'gravity_shift':
        return {
          id: `gravity_${Date.now()}_${Math.random()}`,
          type,
          x: Math.random() * width,
          y: -20,
          width: 200,
          height: 30,
          speed: baseSpeed,
          direction: Math.PI / 2,
          damage: baseDamage * 1.5,
          effect: 'reverse_gravity',
          active: true,
        };

      default:
        return {
          id: `obstacle_${Date.now()}_${Math.random()}`,
          type: 'falling_rock',
          x: Math.random() * (width - 40),
          y: -50,
          width: 40,
          height: 40,
          speed: baseSpeed,
          direction: Math.PI / 2,
          damage: baseDamage,
          effect: 'damage_on_hit',
          active: true,
        };
    }
  }

  // Update obstacle positions
  updateObstacles(deltaTime: number): void {
    this.obstacles.forEach((obstacle) => {
      if (!obstacle.active) return;

      // Update position
      obstacle.x += Math.cos(obstacle.direction) * obstacle.speed * deltaTime;
      obstacle.y += Math.sin(obstacle.direction) * obstacle.speed * deltaTime;

      // Remove obstacles that are off screen
      if (obstacle.y > height + 50 || obstacle.x < -50 || obstacle.x > width + 50) {
        obstacle.active = false;
      }
    });
  }

  // Check collision with obstacles
  checkObstacleCollision(
    potX: number,
    potY: number,
    potWidth: number,
    potHeight: number
  ): {
    collision: boolean;
    damage: number;
    effect: string;
    obstacleType: string;
  } {
    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue;

      if (
        this.isColliding(
          potX,
          potY,
          potWidth,
          potHeight,
          obstacle.x,
          obstacle.y,
          obstacle.width,
          obstacle.height
        )
      ) {
        obstacle.active = false;
        return {
          collision: true,
          damage: obstacle.damage,
          effect: obstacle.effect,
          obstacleType: obstacle.type,
        };
      }
    }

    return {
      collision: false,
      damage: 0,
      effect: '',
      obstacleType: '',
    };
  }

  // Check collision between two rectangles
  private isColliding(
    x1: number,
    y1: number,
    w1: number,
    h1: number,
    x2: number,
    y2: number,
    w2: number,
    h2: number
  ): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  // Update combo system
  updateCombo(
    coinCollected: boolean,
    timeSinceLastCoin: number
  ): {
    combo: number;
    multiplier: number;
    rewards: any;
  } {
    const now = Date.now();

    if (coinCollected) {
      if (timeSinceLastCoin <= this.comboSystem.comboTimeWindow) {
        this.comboSystem.currentCombo++;
        this.comboSystem.comboMultiplier = Math.min(1 + this.comboSystem.currentCombo * 0.1, 5);
      } else {
        this.comboSystem.currentCombo = 1;
        this.comboSystem.comboMultiplier = 1;
      }

      this.comboSystem.lastCoinTime = now;
      this.comboSystem.maxCombo = Math.max(
        this.comboSystem.maxCombo,
        this.comboSystem.currentCombo
      );

      // Calculate combo rewards
      this.comboSystem.comboRewards = this.calculateComboRewards(this.comboSystem.currentCombo);
    } else {
      // Reset combo if too much time has passed
      if (timeSinceLastCoin > this.comboSystem.comboTimeWindow) {
        this.comboSystem.currentCombo = 0;
        this.comboSystem.comboMultiplier = 1;
      }
    }

    return {
      combo: this.comboSystem.currentCombo,
      multiplier: this.comboSystem.comboMultiplier,
      rewards: this.comboSystem.comboRewards,
    };
  }

  // Calculate combo rewards
  private calculateComboRewards(combo: number): ComboSystem['comboRewards'] {
    const baseCoins = 1;
    const baseExperience = 2;

    return {
      coins: baseCoins * combo,
      experience: baseExperience * combo,
      powerUps: combo >= 10 ? ['magnet'] : combo >= 20 ? ['doublePoints'] : [],
    };
  }

  // Update skill progression
  async updateSkillProgress(gameData: {
    score: number;
    coinsCollected: number;
    obstaclesAvoided: number;
    comboAchieved: number;
    accuracy: number;
    timeSurvived: number;
  }): Promise<void> {
    if (!this.skillProgress) return;

    // Update basic stats
    this.skillProgress.totalGamesPlayed++;
    this.skillProgress.averageScore =
      (this.skillProgress.averageScore * (this.skillProgress.totalGamesPlayed - 1) +
        gameData.score) /
      this.skillProgress.totalGamesPlayed;

    this.skillProgress.bestCombo = Math.max(this.skillProgress.bestCombo, gameData.comboAchieved);
    this.skillProgress.obstaclesAvoided += gameData.obstaclesAvoided;

    // Update skills based on performance
    this.updateSkill('accuracy', gameData.accuracy);
    this.updateSkill('speed', gameData.coinsCollected / Math.max(gameData.timeSurvived, 1));
    this.updateSkill('reflexes', gameData.obstaclesAvoided);
    this.updateSkill('strategy', gameData.comboAchieved);
    this.updateSkill('endurance', gameData.timeSurvived);

    // Check for level up
    const totalExperience = Object.values(this.skillProgress.skills).reduce(
      (sum, skill) => sum + skill,
      0
    );
    const newLevel = Math.floor(totalExperience / 100) + 1;

    if (newLevel > this.skillProgress.level) {
      this.skillProgress.level = newLevel;
      this.checkAchievements();
    }

    this.skillProgress.lastUpdated = new Date();
    await this.saveSkillProgress();
  }

  // Update individual skill
  private updateSkill(skillName: keyof SkillProgression['skills'], value: number): void {
    if (!this.skillProgress) return;

    const currentSkill = this.skillProgress.skills[skillName];
    const improvement = Math.min(value * 0.1, 5); // Cap improvement per game

    this.skillProgress.skills[skillName] = Math.min(currentSkill + improvement, 100);

    // Update mastery level
    const masteryLevel = Math.floor(this.skillProgress.skills[skillName] / 20);
    this.skillProgress.masteryLevels[skillName] = masteryLevel;
  }

  // Check for achievements
  private checkAchievements(): void {
    if (!this.skillProgress) return;

    const achievements = [
      { id: 'first_combo', condition: () => this.skillProgress!.bestCombo >= 5 },
      { id: 'combo_master', condition: () => this.skillProgress!.bestCombo >= 20 },
      { id: 'obstacle_avoider', condition: () => this.skillProgress!.obstaclesAvoided >= 100 },
      { id: 'speed_demon', condition: () => this.skillProgress!.skills.speed >= 50 },
      { id: 'accuracy_expert', condition: () => this.skillProgress!.skills.accuracy >= 80 },
      { id: 'endurance_champion', condition: () => this.skillProgress!.skills.endurance >= 60 },
      { id: 'strategy_master', condition: () => this.skillProgress!.skills.strategy >= 70 },
      { id: 'reflex_legend', condition: () => this.skillProgress!.skills.reflexes >= 90 },
    ];

    achievements.forEach((achievement) => {
      if (!this.skillProgress!.achievements.includes(achievement.id) && achievement.condition()) {
        this.skillProgress!.achievements.push(achievement.id);
      }
    });
  }

  // Get current obstacles
  getObstacles(): Obstacle[] {
    return this.obstacles.filter((obstacle) => obstacle.active);
  }

  // Get combo system
  getComboSystem(): ComboSystem {
    return { ...this.comboSystem };
  }

  // Get skill progress
  getSkillProgress(): SkillProgression | null {
    return this.skillProgress;
  }

  // Get skill-based difficulty multiplier
  getSkillDifficultyMultiplier(): number {
    if (!this.skillProgress) return 1;

    const averageSkill =
      Object.values(this.skillProgress.skills).reduce((sum, skill) => sum + skill, 0) / 5;
    return Math.max(0.5, Math.min(2, 1 + (averageSkill - 50) / 100));
  }

  // Save skill progress
  private async saveSkillProgress(): Promise<void> {
    if (!this.skillProgress) return;

    try {
      await offlineManager.saveOfflineData(this.skillProgress.userId, {
        skillProgress: this.skillProgress,
      });

      await offlineManager.addPendingAction(this.skillProgress.userId, {
        type: 'skill_update',
        data: this.skillProgress,
      });
    } catch (error) {
      console.log('Error saving skill progress:', error);
    }
  }
}

export const skillMechanicsSystem = SkillMechanicsSystem.getInstance();
