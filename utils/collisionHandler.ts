import { ITEM_CONFIGS } from './itemConfig';
import { CollisionDetection } from './collisionDetection';

export interface CollisionHandlerCallbacks {
  onScoreChange: (score: number) => void;
  onCoinChange: (coins: number) => void;
  onLifeChange: (lives: number) => void;
  onPowerUpActivate: (type: string, duration: number) => void;
  onItemCollect: (itemId: string) => void;
  onComboUpdate: (combo: number, multiplier: number) => void;
  onAchievement: (achievement: string) => void;
  onSoundPlay: (soundEffect: string) => void;
}

export class CollisionHandler {
  private callbacks: CollisionHandlerCallbacks;
  private activePowerUps: Map<string, number> = new Map();
  private comboCount: number = 0;
  private lastCollisionTime: number = 0;

  constructor(callbacks: CollisionHandlerCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Main collision handler function
   */
  handleItemCollision(itemType: string, itemId: string): void {
    const config = ITEM_CONFIGS[itemType];
    if (!config) return;

    const now = Date.now();
    const timeSinceLastCollision = now - this.lastCollisionTime;
    this.lastCollisionTime = now;

    // Play sound effect
    this.callbacks.onSoundPlay(config.soundEffect);

    // Handle different item types
    switch (itemType) {
      case 'coin':
        this.handleCoinCollision(config);
        break;
      case 'moneyBag':
        this.handleMoneyBagCollision(config);
        break;
      case 'gemstone':
        this.handleGemstoneCollision(config);
        break;
      case 'lightning':
        this.handleLightningCollision(config);
        break;
      case 'magnet':
        this.handleMagnetCollision(config);
        break;
      case 'dynamite':
        this.handleDynamiteCollision(config);
        break;
      case 'blackRock':
        this.handleBlackRockCollision(config);
        break;
      case 'luckyStar':
        this.handleLuckyStarCollision(config);
        break;
    }

    // Update combo
    this.updateCombo(itemType, timeSinceLastCollision);

    // Mark item as collected
    this.callbacks.onItemCollect(itemId);
  }

  /**
   * Handle coin collision
   */
  private handleCoinCollision(config: any): void {
    const baseScore = config.scoreValue;
    const baseCoins = config.coinValue;
    
    // Apply power-up multipliers
    const multiplier = this.getActiveMultiplier();
    const finalScore = Math.floor(baseScore * multiplier);
    const finalCoins = Math.floor(baseCoins * multiplier);

    this.callbacks.onScoreChange(finalScore);
    this.callbacks.onCoinChange(finalCoins);
  }

  /**
   * Handle money bag collision
   */
  private handleMoneyBagCollision(config: any): void {
    const baseScore = config.scoreValue;
    const baseCoins = config.coinValue;
    
    const multiplier = this.getActiveMultiplier();
    const finalScore = Math.floor(baseScore * multiplier);
    const finalCoins = Math.floor(baseCoins * multiplier);

    this.callbacks.onScoreChange(finalScore);
    this.callbacks.onCoinChange(finalCoins);
  }

  /**
   * Handle gemstone collision
   */
  private handleGemstoneCollision(config: any): void {
    const baseScore = config.scoreValue;
    const baseCoins = config.coinValue;
    
    const multiplier = this.getActiveMultiplier();
    const finalScore = Math.floor(baseScore * multiplier);
    const finalCoins = Math.floor(baseCoins * multiplier);

    this.callbacks.onScoreChange(finalScore);
    this.callbacks.onCoinChange(finalCoins);
    
    // Gemstone achievement
    this.callbacks.onAchievement('Gem Collector!');
  }

  /**
   * Handle lightning collision
   */
  private handleLightningCollision(config: any): void {
    this.callbacks.onPowerUpActivate('speedBoost', 5000); // 5 seconds
    this.callbacks.onAchievement('Speed Demon!');
  }

  /**
   * Handle magnet collision
   */
  private handleMagnetCollision(config: any): void {
    this.callbacks.onPowerUpActivate('magnetPull', 5000); // 5 seconds
    this.callbacks.onAchievement('Magnetic Attraction!');
  }

  /**
   * Handle dynamite collision
   */
  private handleDynamiteCollision(config: any): void {
    this.callbacks.onPowerUpActivate('explosion', 1000); // 1 second explosion
    this.callbacks.onAchievement('Explosive!');
  }

  /**
   * Handle black rock collision
   */
  private handleBlackRockCollision(config: any): void {
    this.callbacks.onLifeChange(-1);
    this.resetCombo(); // Reset combo on damage
  }

  /**
   * Handle lucky star collision
   */
  private handleLuckyStarCollision(config: any): void {
    const baseScore = config.scoreValue;
    const baseCoins = config.coinValue;
    
    const multiplier = this.getActiveMultiplier();
    const finalScore = Math.floor(baseScore * multiplier);
    const finalCoins = Math.floor(baseCoins * multiplier);

    this.callbacks.onScoreChange(finalScore);
    this.callbacks.onCoinChange(finalCoins);
    
    // Activate frenzy mode
    this.callbacks.onPowerUpActivate('frenzyMode', 10000); // 10 seconds
    this.callbacks.onAchievement('Lucky Star!');
  }

  /**
   * Update combo system
   */
  private updateCombo(itemType: string, timeSinceLastCollision: number): void {
    const comboTimeout = 3000; // 3 seconds
    
    if (timeSinceLastCollision > comboTimeout) {
      // Reset combo
      this.comboCount = 1;
    } else {
      // Continue combo
      this.comboCount++;
    }

    // Calculate combo multiplier
    const comboMultiplier = this.calculateComboMultiplier(this.comboCount);
    
    this.callbacks.onComboUpdate(this.comboCount, comboMultiplier);
  }

  /**
   * Calculate combo multiplier
   */
  private calculateComboMultiplier(comboCount: number): number {
    if (comboCount >= 15) return 5;
    if (comboCount >= 10) return 3;
    if (comboCount >= 5) return 2;
    if (comboCount >= 3) return 1.5;
    return 1;
  }

  /**
   * Get active power-up multiplier
   */
  private getActiveMultiplier(): number {
    let multiplier = 1;
    
    if (this.activePowerUps.has('frenzyMode')) {
      multiplier *= 2; // Double score in frenzy mode
    }
    
    if (this.activePowerUps.has('speedBoost')) {
      multiplier *= 1.2; // 20% bonus with speed boost
    }
    
    return multiplier;
  }

  /**
   * Reset combo
   */
  private resetCombo(): void {
    this.comboCount = 0;
    this.callbacks.onComboUpdate(0, 1);
  }

  /**
   * Update active power-ups
   */
  updatePowerUps(deltaTime: number): void {
    const now = Date.now();
    
    for (const [powerUp, endTime] of this.activePowerUps.entries()) {
      if (now >= endTime) {
        this.activePowerUps.delete(powerUp);
      }
    }
  }

  /**
   * Get active power-ups
   */
  getActivePowerUps(): Map<string, number> {
    return new Map(this.activePowerUps);
  }

  /**
   * Check if power-up is active
   */
  isPowerUpActive(type: string): boolean {
    return this.activePowerUps.has(type);
  }
} 