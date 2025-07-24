import { FirebaseUnlockSystem } from './firebaseUnlockSystem';
import { HapticFeedback } from './hapticFeedback';

export interface UserData {
  level: number;
  score: number;
  coins: number;
  gamesPlayed: number;
  survivalTime: number;
  itemsCollected: { [key: string]: number };
  achievements: string[];
  lastPlayed: Date;
}

export interface SkinConfig {
  id: string;
  name: string;
  type: 'flag' | 'shape' | 'trail';
  unlock: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'seasonal';
  seasonalEvent?: string;
  condition: {
    type: 'level' | 'score' | 'coins' | 'games' | 'survival' | 'items' | 'achievement' | 'seasonal' | 'invite';
    value: number | string;
    itemType?: string;
  };
}

export class UnlockManager {
  private static rarityColors = {
    common: '#CCCCCC',
    uncommon: '#4ADE80',
    rare: '#60A5FA',
    epic: '#A78BFA',
    legendary: '#FBBF24',
    seasonal: '#F87171',
  };

  private static seasonalEvents = {
    'black-history-month': {
      name: 'Black History Month',
      startMonth: 2, // February
      endMonth: 2,
      states: ['georgia', 'alabama', 'mississippi', 'louisiana'],
      description: 'Celebrate Black History Month'
    },
    'hispanic-heritage-month': {
      name: 'Hispanic Heritage Month',
      startMonth: 9, // September 15 - October 15
      endMonth: 10,
      states: ['california', 'texas', 'new_mexico', 'arizona', 'florida'],
      description: 'Celebrate Hispanic Heritage'
    },
    'presidents-day': {
      name: 'Presidents Day',
      startMonth: 2,
      endMonth: 2,
      states: ['illinois', 'virginia', 'ohio', 'massachusetts'],
      description: 'Honor U.S. Presidents'
    },
    'independence-day': {
      name: 'Independence Day',
      startMonth: 7,
      endMonth: 7,
      states: ['pennsylvania', 'massachusetts', 'virginia', 'delaware'],
      description: 'Celebrate Independence Day'
    },
    'thanksgiving': {
      name: 'Thanksgiving',
      startMonth: 11,
      endMonth: 11,
      states: ['massachusetts', 'pennsylvania', 'virginia'],
      description: 'Give thanks with special unlocks'
    }
  };

  /**
   * Check if a skin unlock condition is met
   */
  static checkUnlockConditions(userData: UserData, skinConfig: SkinConfig): boolean {
    const { condition } = skinConfig;

    switch (condition.type) {
      case 'level':
        return userData.level >= (condition.value as number);
      
      case 'score':
        return userData.score >= (condition.value as number);
      
      case 'coins':
        return userData.coins >= (condition.value as number);
      
      case 'games':
        return userData.gamesPlayed >= (condition.value as number);
      
      case 'survival':
        return userData.survivalTime >= (condition.value as number);
      
      case 'items':
        const itemType = condition.itemType || skinConfig.id;
        return (userData.itemsCollected[itemType] || 0) >= (condition.value as number);
      
      case 'achievement':
        return userData.achievements.includes(condition.value as string);
      
      case 'seasonal':
        return this.isSeasonalEventActive(condition.value as string);
      
      case 'invite':
        // This would be handled separately in the invite system
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Check if a seasonal event is currently active
   */
  static isSeasonalEventActive(eventId: string): boolean {
    const event = this.seasonalEvents[eventId as keyof typeof this.seasonalEvents];
    if (!event) return false;

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11

    if (event.startMonth <= event.endMonth) {
      return currentMonth >= event.startMonth && currentMonth <= event.endMonth;
    } else {
      // Handle events that span across year end (like Hispanic Heritage Month)
      return currentMonth >= event.startMonth || currentMonth <= event.endMonth;
    }
  }

  /**
   * Get currently active seasonal events
   */
  static getActiveSeasonalEvents(): string[] {
    return Object.keys(this.seasonalEvents).filter(eventId => 
      this.isSeasonalEventActive(eventId)
    );
  }

  /**
   * Get available seasonal skins for current events
   */
  static getSeasonalSkins(): string[] {
    const activeEvents = this.getActiveSeasonalEvents();
    const seasonalSkins: string[] = [];

    activeEvents.forEach(eventId => {
      const event = this.seasonalEvents[eventId as keyof typeof this.seasonalEvents];
      if (event) {
        seasonalSkins.push(...event.states);
      }
    });

    return seasonalSkins;
  }

  /**
   * Get rarity color for a skin
   */
  static getRarityColor(rarity: string): string {
    return this.rarityColors[rarity as keyof typeof this.rarityColors] || '#CCCCCC';
  }

  /**
   * Check all unlock conditions and return newly unlocked skins
   */
  static async checkAllUnlocks(userData: UserData, skinConfigs: SkinConfig[]): Promise<string[]> {
    const newlyUnlocked: string[] = [];

    for (const skinConfig of skinConfigs) {
      try {
        // Check if already unlocked
        const isUnlocked = await FirebaseUnlockSystem.isSkinUnlocked(skinConfig.id);
        if (isUnlocked) continue;

        // Check if condition is met
        if (this.checkUnlockConditions(userData, skinConfig)) {
          // Unlock the skin
          const success = await FirebaseUnlockSystem.unlockSkin(skinConfig.id, skinConfig);
          if (success) {
            newlyUnlocked.push(skinConfig.id);
            
            // Haptic feedback for unlock
            HapticFeedback.achievementUnlock();
          }
        }
      } catch (error) {
        console.error(`Error checking unlock for ${skinConfig.id}:`, error);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Generate mystery unlock crate drop
   */
  static async generateMysteryCrate(userId: string): Promise<{
    type: 'skin' | 'coins' | 'powerup';
    value: string | number;
    rarity: string;
  } | null> {
    try {
      const dropChance = Math.random();
      
      if (dropChance < 0.05) { // 5% chance for skin
        // Get all unlocked skins
        const unlockedSkins = await FirebaseUnlockSystem.getUnlocks();
        const availableSkins = Object.keys(unlockedSkins);
        
        if (availableSkins.length > 0) {
          const randomSkin = availableSkins[Math.floor(Math.random() * availableSkins.length)];
          return {
            type: 'skin',
            value: randomSkin,
            rarity: 'epic'
          };
        }
      } else if (dropChance < 0.15) { // 10% chance for powerup
        const powerups = ['speedBoost', 'magnetPull', 'explosion', 'frenzyMode'];
        const randomPowerup = powerups[Math.floor(Math.random() * powerups.length)];
        return {
          type: 'powerup',
          value: randomPowerup,
          rarity: 'rare'
        };
      } else if (dropChance < 0.35) { // 20% chance for coins
        const coinAmount = Math.floor(Math.random() * 100) + 50; // 50-150 coins
        return {
          type: 'coins',
          value: coinAmount,
          rarity: 'common'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error generating mystery crate:', error);
      return null;
    }
  }

  /**
   * Process mystery crate reward
   */
  static async processMysteryCrate(
    userId: string, 
    crate: { type: string; value: string | number; rarity: string }
  ): Promise<boolean> {
    try {
      switch (crate.type) {
        case 'skin':
          // The skin is already unlocked, just notify user
          return true;
        
        case 'coins':
          // Add coins to user account
          // This would be handled by the game's coin system
          return true;
        
        case 'powerup':
          // Add powerup to user inventory
          // This would be handled by the game's powerup system
          return true;
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error processing mystery crate:', error);
      return false;
    }
  }

  /**
   * Get unlock progress for a specific skin
   */
  static getUnlockProgress(userData: UserData, skinConfig: SkinConfig): {
    current: number;
    required: number;
    percentage: number;
    isComplete: boolean;
  } {
    const { condition } = skinConfig;

    let current = 0;
    let required = condition.value as number;

    switch (condition.type) {
      case 'level':
        current = userData.level;
        break;
      case 'score':
        current = userData.score;
        break;
      case 'coins':
        current = userData.coins;
        break;
      case 'games':
        current = userData.gamesPlayed;
        break;
      case 'survival':
        current = userData.survivalTime;
        break;
      case 'items':
        const itemType = condition.itemType || skinConfig.id;
        current = userData.itemsCollected[itemType] || 0;
        break;
      case 'achievement':
        current = userData.achievements.includes(condition.value as string) ? 1 : 0;
        required = 1;
        break;
      case 'seasonal':
        current = this.isSeasonalEventActive(condition.value as string) ? 1 : 0;
        required = 1;
        break;
      default:
        current = 0;
        required = 1;
    }

    const percentage = Math.min((current / required) * 100, 100);
    const isComplete = current >= required;

    return { current, required, percentage, isComplete };
  }

  /**
   * Get seasonal event information
   */
  static getSeasonalEventInfo(eventId: string) {
    return this.seasonalEvents[eventId as keyof typeof this.seasonalEvents];
  }

  /**
   * Get all seasonal events
   */
  static getAllSeasonalEvents() {
    return this.seasonalEvents;
  }
} 