import { COMBO_BONUSES, RARITY_MULTIPLIERS } from './itemConfig';

export interface ComboState {
  count: number;
  multiplier: number;
  lastItemType: string;
  streakStartTime: number;
  bonusItems: string[];
}

export class ComboSystem {
  private comboState: ComboState = {
    count: 0,
    multiplier: 1,
    lastItemType: '',
    streakStartTime: 0,
    bonusItems: [],
  };

  private readonly COMBO_TIMEOUT = 3000; // 3 seconds to maintain combo

  /**
   * Process an item collection and update combo state
   */
  processItemCollection(itemType: string, rarity: string, baseScore: number): {
    finalScore: number;
    comboMultiplier: number;
    comboBonus: number;
    isNewCombo: boolean;
  } {
    const now = Date.now();
    const timeSinceLastItem = now - this.comboState.streakStartTime;
    
    // Check if combo should continue or reset
    if (timeSinceLastItem > this.COMBO_TIMEOUT || this.comboState.lastItemType !== itemType) {
      // Reset combo
      this.comboState = {
        count: 1,
        multiplier: 1,
        lastItemType: itemType,
        streakStartTime: now,
        bonusItems: [itemType],
      };
    } else {
      // Continue combo
      this.comboState.count++;
      this.comboState.lastItemType = itemType;
      this.comboState.bonusItems.push(itemType);
    }

    // Calculate combo multiplier
    const comboMultiplier = this.calculateComboMultiplier(this.comboState.count);
    const rarityMultiplier = RARITY_MULTIPLIERS[rarity as keyof typeof RARITY_MULTIPLIERS] || 1;
    
    // Apply multipliers
    const finalScore = Math.floor(baseScore * comboMultiplier * rarityMultiplier);
    const comboBonus = finalScore - baseScore;

    return {
      finalScore,
      comboMultiplier,
      comboBonus,
      isNewCombo: this.comboState.count === 1,
    };
  }

  /**
   * Calculate combo multiplier based on combo count
   */
  private calculateComboMultiplier(comboCount: number): number {
    // Find the highest applicable combo bonus
    const comboThresholds = Object.keys(COMBO_BONUSES)
      .map(Number)
      .sort((a, b) => b - a); // Sort descending

    for (const threshold of comboThresholds) {
      if (comboCount >= threshold) {
        return COMBO_BONUSES[threshold as keyof typeof COMBO_BONUSES];
      }
    }

    return 1; // No combo bonus
  }

  /**
   * Get current combo state
   */
  getComboState(): ComboState {
    return { ...this.comboState };
  }

  /**
   * Reset combo (e.g., when missing an item)
   */
  resetCombo(): void {
    this.comboState = {
      count: 0,
      multiplier: 1,
      lastItemType: '',
      streakStartTime: 0,
      bonusItems: [],
    };
  }

  /**
   * Check if combo is still active
   */
  isComboActive(): boolean {
    const now = Date.now();
    return now - this.comboState.streakStartTime < this.COMBO_TIMEOUT;
  }

  /**
   * Get combo display text
   */
  getComboDisplayText(): string {
    if (this.comboState.count <= 1) return '';
    
    const multiplier = this.calculateComboMultiplier(this.comboState.count);
    return `${this.comboState.count}x COMBO! (${multiplier.toFixed(1)}x)`;
  }

  /**
   * Get combo bonus items for special effects
   */
  getComboBonusItems(): string[] {
    return [...this.comboState.bonusItems];
  }

  /**
   * Check for special combo achievements
   */
  checkComboAchievements(): string[] {
    const achievements: string[] = [];
    const { count } = this.comboState;

    if (count === 3) achievements.push('Triple Combo!');
    if (count === 5) achievements.push('Quintuple Combo!');
    if (count === 10) achievements.push('Decuple Combo!');
    if (count === 15) achievements.push('Ultimate Combo!');
    if (count === 20) achievements.push('Legendary Combo!');

    return achievements;
  }
} 