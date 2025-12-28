export interface DifficultySettings {
  level: number;
  itemSpawnRate: number;
  itemFallSpeed: number;
  bombChance: number;
  powerUpChance: number;
  rareItemChance: number;
  comboMultiplier: number;
  scoreMultiplier: number;
  blockageBuildup: number; // How fast blockages accumulate
}

export interface DifficultyProgression {
  timeElapsed: number;
  score: number;
  itemsCollected: number;
  currentDifficulty: number;
}

class DifficultyManager {
  private baseDifficulty: DifficultySettings = {
    level: 1,
    itemSpawnRate: 2000, // ms between spawns
    itemFallSpeed: 2,
    bombChance: 0.05,
    powerUpChance: 0.1,
    rareItemChance: 0.15,
    comboMultiplier: 1,
    scoreMultiplier: 1,
    blockageBuildup: 0.3, // 30% chance missed items create blockage
  };

  private currentDifficulty: DifficultySettings;
  private progression: DifficultyProgression;
  private isNewPlayer: boolean = true;

  constructor() {
    this.currentDifficulty = { ...this.baseDifficulty };
    this.progression = {
      timeElapsed: 0,
      score: 0,
      itemsCollected: 0,
      currentDifficulty: 1,
    };
  }

  // Initialize for new or returning player
  initialize(isFirstTime: boolean = true) {
    this.isNewPlayer = isFirstTime;

    if (isFirstTime) {
      // Easier start for new players
      this.currentDifficulty = {
        ...this.baseDifficulty,
        itemSpawnRate: 2500,
        itemFallSpeed: 1.5,
        bombChance: 0.02,
        blockageBuildup: 0.2,
      };
    } else {
      this.currentDifficulty = { ...this.baseDifficulty };
    }

    this.resetProgression();
  }

  // Reset progression counters
  resetProgression() {
    this.progression = {
      timeElapsed: 0,
      score: 0,
      itemsCollected: 0,
      currentDifficulty: 1,
    };
  }

  // Update difficulty based on game progress
  updateDifficulty(stats: {
    timeElapsed: number;
    score: number;
    itemsCollected: number;
    level: number;
  }) {
    this.progression.timeElapsed = stats.timeElapsed;
    this.progression.score = stats.score;
    this.progression.itemsCollected = stats.itemsCollected;

    // Calculate new difficulty level
    const timeFactor = Math.floor(stats.timeElapsed / 30); // Every 30 seconds
    const scoreFactor = Math.floor(stats.score / 500); // Every 500 points
    const levelFactor = stats.level - 1;

    const newDifficultyLevel = Math.max(1, 1 + timeFactor + scoreFactor + levelFactor);

    if (newDifficultyLevel !== this.progression.currentDifficulty) {
      this.progression.currentDifficulty = newDifficultyLevel;
      this.applyDifficultyLevel(newDifficultyLevel);

      return {
        levelChanged: true,
        newLevel: newDifficultyLevel,
        settings: this.currentDifficulty,
      };
    }

    return {
      levelChanged: false,
      newLevel: this.progression.currentDifficulty,
      settings: this.currentDifficulty,
    };
  }

  // Apply difficulty settings for a specific level
  private applyDifficultyLevel(level: number) {
    // Progressive scaling
    const scaleFactor = 1 + (level - 1) * 0.1;

    // Spawn rate gets faster (lower value = faster)
    this.currentDifficulty.itemSpawnRate = Math.max(
      500, // Minimum 500ms between spawns
      this.baseDifficulty.itemSpawnRate / scaleFactor
    );

    // Fall speed increases
    this.currentDifficulty.itemFallSpeed = Math.min(
      10, // Maximum fall speed
      this.baseDifficulty.itemFallSpeed * scaleFactor
    );

    // Bomb chance increases
    this.currentDifficulty.bombChance = Math.min(
      0.25, // Maximum 25% bombs
      this.baseDifficulty.bombChance * scaleFactor
    );

    // Power-up chance decreases slightly at higher levels
    this.currentDifficulty.powerUpChance = Math.max(
      0.05, // Minimum 5% power-ups
      this.baseDifficulty.powerUpChance / (1 + level * 0.02)
    );

    // Rare items become more common
    this.currentDifficulty.rareItemChance = Math.min(
      0.4, // Maximum 40% rare items
      this.baseDifficulty.rareItemChance * (1 + level * 0.05)
    );

    // Score and combo multipliers increase
    this.currentDifficulty.comboMultiplier = 1 + level * 0.1;
    this.currentDifficulty.scoreMultiplier = 1 + level * 0.05;

    // Blockage buildup increases
    this.currentDifficulty.blockageBuildup = Math.min(
      0.8, // Maximum 80% chance
      this.baseDifficulty.blockageBuildup * scaleFactor
    );

    this.currentDifficulty.level = level;
  }

  // Get spawn configuration for current difficulty
  getSpawnConfig() {
    const random = Math.random();

    // Determine item type based on current chances
    if (random < this.currentDifficulty.bombChance) {
      return { type: 'bomb', rarity: 'common' };
    } else if (random < this.currentDifficulty.bombChance + this.currentDifficulty.powerUpChance) {
      return { type: 'powerup', rarity: 'rare' };
    } else if (
      random <
      this.currentDifficulty.bombChance +
        this.currentDifficulty.powerUpChance +
        this.currentDifficulty.rareItemChance
    ) {
      // Rare valuable items
      const rareTypes = ['diamond', 'gem', 'star'];
      return {
        type: rareTypes[Math.floor(Math.random() * rareTypes.length)],
        rarity: 'rare',
      };
    } else {
      // Common items
      return { type: 'coin', rarity: 'common' };
    }
  }

  // Check if tutorial should be shown
  shouldShowTutorial(): boolean {
    return this.isNewPlayer && this.progression.timeElapsed < 10;
  }

  // Get current difficulty description for UI
  getDifficultyDescription(): string {
    const level = this.progression.currentDifficulty;

    if (level <= 2) return 'Easy';
    if (level <= 5) return 'Normal';
    if (level <= 8) return 'Hard';
    if (level <= 12) return 'Expert';
    return 'Insane';
  }

  // Get difficulty color for UI
  getDifficultyColor(): string {
    const level = this.progression.currentDifficulty;

    if (level <= 2) return '#4CAF50'; // Green
    if (level <= 5) return '#2196F3'; // Blue
    if (level <= 8) return '#FF9800'; // Orange
    if (level <= 12) return '#F44336'; // Red
    return '#9C27B0'; // Purple
  }

  // Get current settings
  getCurrentSettings(): DifficultySettings {
    return { ...this.currentDifficulty };
  }

  // Check if blockage should be created for missed item
  shouldCreateBlockage(): boolean {
    return Math.random() < this.currentDifficulty.blockageBuildup;
  }
}

export const difficultyManager = new DifficultyManager();
