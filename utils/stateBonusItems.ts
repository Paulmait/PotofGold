export interface StateBonusItem {
  type: string;
  emoji: string;
  points: number;
  effect: 'bonus_points' | 'double_score' | 'slow_fall' | 'extra_life' | 'magnet_boost' | 'combo_multiplier';
  description: string;
  state: string;
}

export class StateBonusItemManager {
  private static items: StateBonusItem[] = [
    {
      type: 'georgia_peach',
      emoji: '🍑',
      points: 15,
      effect: 'bonus_points',
      description: 'Georgia Peach - Sweet bonus points!',
      state: 'Georgia'
    },
    {
      type: 'vermont_maple',
      emoji: '🍁',
      points: 10,
      effect: 'double_score',
      description: 'Vermont Maple - Double score for 10 seconds!',
      state: 'Vermont'
    },
    {
      type: 'colorado_crystal',
      emoji: '🏔️',
      points: 12,
      effect: 'slow_fall',
      description: 'Colorado Crystal - Slows falling items!',
      state: 'Colorado'
    },
    {
      type: 'hawaii_hibiscus',
      emoji: '🌸',
      points: 14,
      effect: 'extra_life',
      description: 'Hawaii Hibiscus - Grants an extra life!',
      state: 'Hawaii'
    },
    {
      type: 'maine_lobster',
      emoji: '🦞',
      points: 20,
      effect: 'bonus_points',
      description: 'Maine Lobster - Premium bonus points!',
      state: 'Maine'
    },
    {
      type: 'texas_star',
      emoji: '⭐',
      points: 18,
      effect: 'bonus_points',
      description: 'Texas Star - Lone star bonus!',
      state: 'Texas'
    },
    {
      type: 'alaska_aurora',
      emoji: '✨',
      points: 16,
      effect: 'bonus_points',
      description: 'Alaska Aurora - Northern lights bonus!',
      state: 'Alaska'
    },
    {
      type: 'arizona_cactus',
      emoji: '🌵',
      points: 13,
      effect: 'bonus_points',
      description: 'Arizona Cactus - Desert bonus!',
      state: 'Arizona'
    },
    {
      type: 'washington_apple',
      emoji: '🍎',
      points: 11,
      effect: 'bonus_points',
      description: 'Washington Apple - Evergreen bonus!',
      state: 'Washington'
    },
    {
      type: 'louisiana_bayou',
      emoji: '🌿',
      points: 17,
      effect: 'bonus_points',
      description: 'Louisiana Bayou - Mystical bonus!',
      state: 'Louisiana'
    },
    {
      type: 'nevada_silver',
      emoji: '🥈',
      points: 19,
      effect: 'bonus_points',
      description: 'Nevada Silver - Silver state bonus!',
      state: 'Nevada'
    },
    {
      type: 'oregon_beaver',
      emoji: '🦫',
      points: 16,
      effect: 'bonus_points',
      description: 'Oregon Beaver - Beaver state bonus!',
      state: 'Oregon'
    },
    {
      type: 'montana_star',
      emoji: '⭐',
      points: 15,
      effect: 'bonus_points',
      description: 'Montana Star - Big sky bonus!',
      state: 'Montana'
    }
  ];

  /**
   * Get all state bonus items
   */
  static getAllItems(): StateBonusItem[] {
    return this.items;
  }

  /**
   * Get a random state bonus item
   */
  static getRandomItem(): StateBonusItem {
    return this.items[Math.floor(Math.random() * this.items.length)];
  }

  /**
   * Get item by type
   */
  static getItemByType(type: string): StateBonusItem | undefined {
    return this.items.find(item => item.type === type);
  }

  /**
   * Check if an item type is a state bonus item
   */
  static isStateBonusItem(type: string): boolean {
    return this.items.some(item => item.type === type);
  }

  /**
   * Get spawn chance based on level
   * Returns 0.01 (1%) after Level 5, 0 before
   */
  static getSpawnChance(level: number): number {
    return level >= 5 ? 0.01 : 0;
  }

  /**
   * Should spawn a state bonus item
   */
  static shouldSpawnStateItem(level: number): boolean {
    return Math.random() < this.getSpawnChance(level);
  }

  /**
   * Apply item effect to game state
   */
  static applyItemEffect(
    itemType: string, 
    gameState: {
      score: number;
      coins: number;
      combo: number;
      fallSpeed: number;
      magnetRange: number;
    }
  ): {
    newScore: number;
    newCoins: number;
    newCombo: number;
    newFallSpeed: number;
    newMagnetRange: number;
    effectMessage: string;
    effectDuration: number;
  } {
    const item = this.getItemByType(itemType);
    if (!item) {
      return {
        newScore: gameState.score,
        newCoins: gameState.coins,
        newCombo: gameState.combo,
        newFallSpeed: gameState.fallSpeed,
        newMagnetRange: gameState.magnetRange,
        effectMessage: '',
        effectDuration: 0
      };
    }

    let newScore = gameState.score;
    let newCoins = gameState.coins;
    let newCombo = gameState.combo;
    let newFallSpeed = gameState.fallSpeed;
    let newMagnetRange = gameState.magnetRange;
    let effectMessage = '';
    let effectDuration = 0;

    switch (item.effect) {
      case 'bonus_points':
        newScore += item.points;
        effectMessage = `+${item.points} points from ${item.state}!`;
        break;
      
      case 'double_score':
        newScore *= 2;
        effectDuration = 10000; // 10 seconds
        effectMessage = `Double score from ${item.state}!`;
        break;
      
      case 'slow_fall':
        newFallSpeed *= 0.7; // 30% slower
        effectDuration = 8000; // 8 seconds
        effectMessage = `Slow fall from ${item.state}!`;
        break;
      
      case 'magnet_boost':
        newMagnetRange *= 1.5; // 50% stronger magnet
        effectDuration = 12000; // 12 seconds
        effectMessage = `Magnet boost from ${item.state}!`;
        break;
      
      case 'combo_multiplier':
        newCombo *= 2;
        effectDuration = 15000; // 15 seconds
        effectMessage = `Combo multiplier from ${item.state}!`;
        break;
    }

    return {
      newScore,
      newCoins,
      newCombo,
      newFallSpeed,
      newMagnetRange,
      effectMessage,
      effectDuration
    };
  }

  /**
   * Get items by state
   */
  static getItemsByState(state: string): StateBonusItem[] {
    return this.items.filter(item => item.state === state);
  }

  /**
   * Get all available states
   */
  static getAvailableStates(): string[] {
    return [...new Set(this.items.map(item => item.state))];
  }
} 