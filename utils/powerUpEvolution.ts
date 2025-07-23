import { offlineManager } from './offlineManager';

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  baseEffect: {
    duration: number;
    intensity: number;
    range: number;
  };
  evolvedEffects: string[];
  upgradeCost: number;
  fusionRequirements: string[];
  unlocked: boolean;
  image: string;
}

export interface PowerUpFusion {
  id: string;
  name: string;
  description: string;
  requirements: {
    powerUp1: string;
    powerUp2: string;
    level1: number;
    level2: number;
  };
  result: {
    powerUpId: string;
    level: number;
    specialEffect: string;
  };
  unlocked: boolean;
  image: string;
}

export interface PowerUpCollection {
  userId: string;
  ownedPowerUps: PowerUp[];
  activePowerUps: string[];
  fusionRecipes: PowerUpFusion[];
  unlockedFusions: string[];
  totalPowerUpsUsed: number;
  lastUpdated: Date;
}

export class PowerUpEvolutionSystem {
  private static instance: PowerUpEvolutionSystem;
  private collection: PowerUpCollection | null = null;

  static getInstance(): PowerUpEvolutionSystem {
    if (!PowerUpEvolutionSystem.instance) {
      PowerUpEvolutionSystem.instance = new PowerUpEvolutionSystem();
    }
    return PowerUpEvolutionSystem.instance;
  }

  // Initialize power-up collection
  async initializeCollection(userId: string): Promise<PowerUpCollection> {
    try {
      const offlineData = await offlineManager.getOfflineData(userId);
      
      if (offlineData.powerUpCollection) {
        this.collection = offlineData.powerUpCollection;
        return this.collection;
      }
    } catch (error) {
      console.log('Error loading power-up collection:', error);
    }

    // Create default collection
    this.collection = {
      userId,
      ownedPowerUps: this.getDefaultPowerUps(),
      activePowerUps: ['magnet'],
      fusionRecipes: this.getFusionRecipes(),
      unlockedFusions: [],
      totalPowerUpsUsed: 0,
      lastUpdated: new Date(),
    };

    await this.saveCollection();
    return this.collection;
  }

  // Get default power-ups
  private getDefaultPowerUps(): PowerUp[] {
    return [
      {
        id: 'magnet',
        name: 'Magnet',
        description: 'Attracts nearby coins automatically',
        level: 1,
        maxLevel: 5,
        rarity: 'common',
        baseEffect: {
          duration: 5000,
          intensity: 1,
          range: 50,
        },
        evolvedEffects: ['magnet_plus', 'magnet_ultra', 'magnet_master'],
        upgradeCost: 100,
        fusionRequirements: [],
        unlocked: true,
        image: 'magnet_powerup',
      },
      {
        id: 'slowMotion',
        name: 'Slow Motion',
        description: 'Slows down falling objects',
        level: 1,
        maxLevel: 5,
        rarity: 'common',
        baseEffect: {
          duration: 3000,
          intensity: 0.5,
          range: 0,
        },
        evolvedEffects: ['time_freeze', 'time_reverse', 'time_master'],
        upgradeCost: 150,
        fusionRequirements: [],
        unlocked: true,
        image: 'slow_motion_powerup',
      },
      {
        id: 'doublePoints',
        name: 'Double Points',
        description: 'Doubles all points earned',
        level: 1,
        maxLevel: 5,
        rarity: 'rare',
        baseEffect: {
          duration: 4000,
          intensity: 2,
          range: 0,
        },
        evolvedEffects: ['triple_points', 'quadruple_points', 'point_master'],
        upgradeCost: 200,
        fusionRequirements: [],
        unlocked: false,
        image: 'double_points_powerup',
      },
      {
        id: 'goldRush',
        name: 'Gold Rush',
        description: 'Increases coin spawn rate and value',
        level: 1,
        maxLevel: 5,
        rarity: 'epic',
        baseEffect: {
          duration: 6000,
          intensity: 1.5,
          range: 0,
        },
        evolvedEffects: ['gold_storm', 'gold_tsunami', 'gold_master'],
        upgradeCost: 300,
        fusionRequirements: [],
        unlocked: false,
        image: 'gold_rush_powerup',
      },
    ];
  }

  // Get fusion recipes
  private getFusionRecipes(): PowerUpFusion[] {
    return [
      {
        id: 'magnet_slow_fusion',
        name: 'Time Magnet',
        description: 'Combines magnet and slow motion effects',
        requirements: {
          powerUp1: 'magnet',
          powerUp2: 'slowMotion',
          level1: 3,
          level2: 3,
        },
        result: {
          powerUpId: 'timeMagnet',
          level: 1,
          specialEffect: 'magnet_with_slow_motion',
        },
        unlocked: false,
        image: 'time_magnet_powerup',
      },
      {
        id: 'double_gold_fusion',
        name: 'Golden Storm',
        description: 'Combines double points and gold rush',
        requirements: {
          powerUp1: 'doublePoints',
          powerUp2: 'goldRush',
          level1: 4,
          level2: 4,
        },
        result: {
          powerUpId: 'goldenStorm',
          level: 1,
          specialEffect: 'double_points_with_gold_rush',
        },
        unlocked: false,
        image: 'golden_storm_powerup',
      },
      {
        id: 'ultimate_fusion',
        name: 'Ultimate Power',
        description: 'Combines all power-ups for ultimate effect',
        requirements: {
          powerUp1: 'timeMagnet',
          powerUp2: 'goldenStorm',
          level1: 5,
          level2: 5,
        },
        result: {
          powerUpId: 'ultimatePower',
          level: 1,
          specialEffect: 'all_power_ups_combined',
        },
        unlocked: false,
        image: 'ultimate_power_powerup',
      },
    ];
  }

  // Upgrade power-up
  async upgradePowerUp(powerUpId: string): Promise<{
    success: boolean;
    newLevel: number;
    cost: number;
    effects: any;
  }> {
    if (!this.collection) return { success: false, newLevel: 0, cost: 0, effects: {} };

    const powerUp = this.collection.ownedPowerUps.find(p => p.id === powerUpId);
    if (!powerUp || powerUp.level >= powerUp.maxLevel) {
      return { success: false, newLevel: powerUp?.level || 0, cost: 0, effects: {} };
    }

    const upgradeCost = powerUp.upgradeCost * Math.pow(1.5, powerUp.level - 1);
    
    // Check if player has enough coins (this would come from game state)
    // For now, we'll assume they have enough
    const hasEnoughCoins = true; // This should check actual coin balance

    if (!hasEnoughCoins) {
      return { success: false, newLevel: powerUp.level, cost: upgradeCost, effects: {} };
    }

    // Perform upgrade
    powerUp.level++;
    
    // Update effects based on level
    const effects = this.calculatePowerUpEffects(powerUp);
    
    await this.saveCollection();

    return {
      success: true,
      newLevel: powerUp.level,
      cost: upgradeCost,
      effects,
    };
  }

  // Fuse power-ups
  async fusePowerUps(powerUp1Id: string, powerUp2Id: string): Promise<{
    success: boolean;
    result: PowerUp | null;
    fusionRecipe: PowerUpFusion | null;
  }> {
    if (!this.collection) return { success: false, result: null, fusionRecipe: null };

    const powerUp1 = this.collection.ownedPowerUps.find(p => p.id === powerUp1Id);
    const powerUp2 = this.collection.ownedPowerUps.find(p => p.id === powerUp2Id);

    if (!powerUp1 || !powerUp2) {
      return { success: false, result: null, fusionRecipe: null };
    }

    // Find matching fusion recipe
    const fusionRecipe = this.collection.fusionRecipes.find(recipe => 
      (recipe.requirements.powerUp1 === powerUp1Id && recipe.requirements.powerUp2 === powerUp2Id) ||
      (recipe.requirements.powerUp1 === powerUp2Id && recipe.requirements.powerUp2 === powerUp1Id)
    );

    if (!fusionRecipe) {
      return { success: false, result: null, fusionRecipe: null };
    }

    // Check level requirements
    if (powerUp1.level < fusionRecipe.requirements.level1 || 
        powerUp2.level < fusionRecipe.requirements.level2) {
      return { success: false, result: null, fusionRecipe };
    }

    // Create fused power-up
    const fusedPowerUp: PowerUp = {
      id: fusionRecipe.result.powerUpId,
      name: this.getFusedPowerUpName(fusionRecipe),
      description: fusionRecipe.description,
      level: fusionRecipe.result.level,
      maxLevel: 5,
      rarity: 'legendary',
      baseEffect: this.calculateFusedEffects(powerUp1, powerUp2),
      evolvedEffects: [fusionRecipe.result.specialEffect],
      upgradeCost: 500,
      fusionRequirements: [],
      unlocked: true,
      image: fusionRecipe.image,
    };

    // Remove original power-ups and add fused one
    this.collection.ownedPowerUps = this.collection.ownedPowerUps.filter(
      p => p.id !== powerUp1Id && p.id !== powerUp2Id
    );
    this.collection.ownedPowerUps.push(fusedPowerUp);
    this.collection.unlockedFusions.push(fusionRecipe.id);

    await this.saveCollection();

    return {
      success: true,
      result: fusedPowerUp,
      fusionRecipe,
    };
  }

  // Calculate power-up effects
  private calculatePowerUpEffects(powerUp: PowerUp): any {
    const baseEffect = powerUp.baseEffect;
    const levelMultiplier = 1 + (powerUp.level - 1) * 0.2;

    return {
      duration: baseEffect.duration * levelMultiplier,
      intensity: baseEffect.intensity * levelMultiplier,
      range: baseEffect.range * levelMultiplier,
      evolvedEffects: powerUp.evolvedEffects.slice(0, powerUp.level - 1),
    };
  }

  // Calculate fused effects
  private calculateFusedEffects(powerUp1: PowerUp, powerUp2: PowerUp): PowerUp['baseEffect'] {
    return {
      duration: Math.max(powerUp1.baseEffect.duration, powerUp2.baseEffect.duration) * 1.5,
      intensity: (powerUp1.baseEffect.intensity + powerUp2.baseEffect.intensity) * 1.2,
      range: Math.max(powerUp1.baseEffect.range, powerUp2.baseEffect.range) * 1.3,
    };
  }

  // Get fused power-up name
  private getFusedPowerUpName(fusionRecipe: PowerUpFusion): string {
    return fusionRecipe.name;
  }

  // Unlock power-up
  async unlockPowerUp(powerUpId: string): Promise<boolean> {
    if (!this.collection) return false;

    const powerUp = this.collection.ownedPowerUps.find(p => p.id === powerUpId);
    if (!powerUp) return false;

    powerUp.unlocked = true;
    await this.saveCollection();
    return true;
  }

  // Get available fusions
  getAvailableFusions(): PowerUpFusion[] {
    if (!this.collection) return [];
    
    return this.collection.fusionRecipes.filter(recipe => {
      const powerUp1 = this.collection!.ownedPowerUps.find(p => p.id === recipe.requirements.powerUp1);
      const powerUp2 = this.collection!.ownedPowerUps.find(p => p.id === recipe.requirements.powerUp2);
      
      return powerUp1 && powerUp2 && 
             powerUp1.level >= recipe.requirements.level1 && 
             powerUp2.level >= recipe.requirements.level2;
    });
  }

  // Get owned power-ups
  getOwnedPowerUps(): PowerUp[] {
    if (!this.collection) return [];
    return this.collection.ownedPowerUps.filter(p => p.unlocked);
  }

  // Get active power-ups
  getActivePowerUps(): PowerUp[] {
    if (!this.collection) return [];
    return this.collection.ownedPowerUps.filter(p => 
      this.collection!.activePowerUps.includes(p.id)
    );
  }

  // Activate power-up
  async activatePowerUp(powerUpId: string): Promise<boolean> {
    if (!this.collection) return false;

    const powerUp = this.collection.ownedPowerUps.find(p => p.id === powerUpId);
    if (!powerUp || !powerUp.unlocked) return false;

    if (!this.collection.activePowerUps.includes(powerUpId)) {
      this.collection.activePowerUps.push(powerUpId);
      await this.saveCollection();
    }

    return true;
  }

  // Deactivate power-up
  async deactivatePowerUp(powerUpId: string): Promise<boolean> {
    if (!this.collection) return false;

    const index = this.collection.activePowerUps.indexOf(powerUpId);
    if (index > -1) {
      this.collection.activePowerUps.splice(index, 1);
      await this.saveCollection();
      return true;
    }

    return false;
  }

  // Get power-up effects for game
  getPowerUpEffects(powerUpId: string): any {
    if (!this.collection) return null;

    const powerUp = this.collection.ownedPowerUps.find(p => p.id === powerUpId);
    if (!powerUp) return null;

    return this.calculatePowerUpEffects(powerUp);
  }

  // Record power-up usage
  async recordPowerUpUsage(powerUpId: string): Promise<void> {
    if (!this.collection) return;

    this.collection.totalPowerUpsUsed++;
    this.collection.lastUpdated = new Date();
    await this.saveCollection();
  }

  // Get collection statistics
  getCollectionStats(): {
    totalPowerUps: number;
    unlockedPowerUps: number;
    maxLevelPowerUps: number;
    totalFusions: number;
    totalUsage: number;
  } {
    if (!this.collection) {
      return {
        totalPowerUps: 0,
        unlockedPowerUps: 0,
        maxLevelPowerUps: 0,
        totalFusions: 0,
        totalUsage: 0,
      };
    }

    return {
      totalPowerUps: this.collection.ownedPowerUps.length,
      unlockedPowerUps: this.collection.ownedPowerUps.filter(p => p.unlocked).length,
      maxLevelPowerUps: this.collection.ownedPowerUps.filter(p => p.level === p.maxLevel).length,
      totalFusions: this.collection.unlockedFusions.length,
      totalUsage: this.collection.totalPowerUpsUsed,
    };
  }

  // Save collection
  private async saveCollection(): Promise<void> {
    if (!this.collection) return;

    try {
      await offlineManager.saveOfflineData(this.collection.userId, {
        powerUpCollection: this.collection,
      });

      await offlineManager.addPendingAction(this.collection.userId, {
        type: 'powerup_update',
        data: this.collection,
      });
    } catch (error) {
      console.log('Error saving power-up collection:', error);
    }
  }
}

export const powerUpEvolutionSystem = PowerUpEvolutionSystem.getInstance(); 