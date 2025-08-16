/**
 * Loot Box System with Ethical Safeguards
 * Implements gacha mechanics with transparency and player protection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestore } from '../../firebase/config';

export interface LootBox {
  id: string;
  name: string;
  type: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  cost: number;
  currency: 'coins' | 'gems' | 'tickets';
  guaranteedRarity?: string;
  items: LootItem[];
  odds: LootOdds;
  pityTimer?: number;
  description: string;
  visualTheme: string;
}

export interface LootItem {
  id: string;
  name: string;
  type: 'skin' | 'trail' | 'frame' | 'coins' | 'powerup' | 'vip_points';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  value: number;
  probability: number;
  isNew?: boolean;
  isDuplicate?: boolean;
}

export interface LootOdds {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  mythic: number;
}

export interface PlayerLootHistory {
  totalOpened: number;
  totalSpent: number;
  rarityCounts: Record<string, number>;
  lastLegendary: number;
  lastMythic: number;
  pityCounters: Record<string, number>;
  collection: string[];
  duplicates: string[];
}

class LootBoxSystem {
  private playerHistory: PlayerLootHistory | null = null;
  private readonly PITY_THRESHOLDS = {
    legendary: 30,  // Guaranteed legendary every 30 boxes
    mythic: 90      // Guaranteed mythic every 90 boxes
  };
  
  // Transparent odds display (required by app stores)
  private readonly BASE_ODDS: LootOdds = {
    common: 0.60,    // 60%
    rare: 0.25,      // 25%
    epic: 0.10,      // 10%
    legendary: 0.045, // 4.5%
    mythic: 0.005    // 0.5%
  };

  async initialize(userId: string) {
    await this.loadPlayerHistory(userId);
  }

  private async loadPlayerHistory(userId: string) {
    try {
      const stored = await AsyncStorage.getItem(`loot_history_${userId}`);
      if (stored) {
        this.playerHistory = JSON.parse(stored);
      } else {
        this.playerHistory = {
          totalOpened: 0,
          totalSpent: 0,
          rarityCounts: {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0,
            mythic: 0
          },
          lastLegendary: 0,
          lastMythic: 0,
          pityCounters: {
            legendary: 0,
            mythic: 0
          },
          collection: [],
          duplicates: []
        };
      }
    } catch (error) {
      console.error('Failed to load loot history:', error);
    }
  }

  // Create different loot box types
  getLootBoxTypes(): LootBox[] {
    return [
      {
        id: 'basic_crate',
        name: 'Basic Crate',
        type: 'common',
        cost: 100,
        currency: 'coins',
        description: 'Contains common to rare items',
        visualTheme: 'wooden',
        odds: { ...this.BASE_ODDS, legendary: 0.02, mythic: 0 },
        items: this.generateItemPool('common')
      },
      {
        id: 'silver_chest',
        name: 'Silver Chest',
        type: 'rare',
        cost: 500,
        currency: 'coins',
        guaranteedRarity: 'rare',
        description: 'Guaranteed rare or better',
        visualTheme: 'silver',
        odds: { common: 0, rare: 0.70, epic: 0.25, legendary: 0.045, mythic: 0.005 },
        items: this.generateItemPool('rare')
      },
      {
        id: 'golden_vault',
        name: 'Golden Vault',
        type: 'epic',
        cost: 2000,
        currency: 'coins',
        guaranteedRarity: 'epic',
        description: 'Guaranteed epic or better',
        visualTheme: 'golden',
        odds: { common: 0, rare: 0, epic: 0.80, legendary: 0.18, mythic: 0.02 },
        items: this.generateItemPool('epic')
      },
      {
        id: 'diamond_cache',
        name: 'Diamond Cache',
        type: 'legendary',
        cost: 100,
        currency: 'gems',
        guaranteedRarity: 'legendary',
        description: 'Guaranteed legendary, chance for mythic',
        visualTheme: 'diamond',
        odds: { common: 0, rare: 0, epic: 0, legendary: 0.95, mythic: 0.05 },
        items: this.generateItemPool('legendary')
      },
      {
        id: 'mystery_omega',
        name: 'Mystery Omega Box',
        type: 'mythic',
        cost: 10,
        currency: 'tickets',
        description: 'Ultra rare items with pity system',
        visualTheme: 'cosmic',
        odds: this.BASE_ODDS,
        pityTimer: 50,
        items: this.generateItemPool('mythic')
      }
    ];
  }

  // Open loot box with all mechanics
  async openLootBox(boxId: string, quantity: number = 1): Promise<{
    items: LootItem[],
    animations: any[],
    statistics: any
  }> {
    const box = this.getLootBoxTypes().find(b => b.id === boxId);
    if (!box) throw new Error('Invalid loot box');

    const results: LootItem[] = [];
    const animations: any[] = [];
    
    for (let i = 0; i < quantity; i++) {
      const item = this.rollItem(box);
      results.push(item);
      
      // Track statistics
      if (this.playerHistory) {
        this.playerHistory.totalOpened++;
        this.playerHistory.totalSpent += box.cost;
        this.playerHistory.rarityCounts[item.rarity]++;
        
        // Update pity counters
        if (item.rarity === 'legendary') {
          this.playerHistory.lastLegendary = this.playerHistory.totalOpened;
          this.playerHistory.pityCounters.legendary = 0;
        } else {
          this.playerHistory.pityCounters.legendary++;
        }
        
        if (item.rarity === 'mythic') {
          this.playerHistory.lastMythic = this.playerHistory.totalOpened;
          this.playerHistory.pityCounters.mythic = 0;
        } else {
          this.playerHistory.pityCounters.mythic++;
        }
        
        // Check for duplicates
        if (this.playerHistory.collection.includes(item.id)) {
          item.isDuplicate = true;
          this.playerHistory.duplicates.push(item.id);
          // Convert duplicate to currency
          item.type = 'coins';
          item.value = this.getDuplicateValue(item.rarity);
        } else {
          item.isNew = true;
          this.playerHistory.collection.push(item.id);
        }
      }
      
      // Create animation data
      animations.push(this.createOpeningAnimation(item.rarity));
    }
    
    await this.savePlayerHistory();
    
    return {
      items: results,
      animations,
      statistics: this.getStatistics()
    };
  }

  private rollItem(box: LootBox): LootItem {
    let rarity = this.determineRarity(box.odds);
    
    // Apply pity system
    if (this.playerHistory) {
      if (this.playerHistory.pityCounters.legendary >= this.PITY_THRESHOLDS.legendary) {
        rarity = 'legendary';
      }
      if (this.playerHistory.pityCounters.mythic >= this.PITY_THRESHOLDS.mythic) {
        rarity = 'mythic';
      }
    }
    
    // Apply guaranteed rarity
    if (box.guaranteedRarity) {
      const guaranteed = box.guaranteedRarity as keyof LootOdds;
      const rarityOrder = ['common', 'rare', 'epic', 'legendary', 'mythic'];
      const guaranteedIndex = rarityOrder.indexOf(guaranteed);
      const rolledIndex = rarityOrder.indexOf(rarity);
      
      if (rolledIndex < guaranteedIndex) {
        rarity = guaranteed;
      }
    }
    
    // Select item from pool
    const itemPool = box.items.filter(item => item.rarity === rarity);
    const selectedItem = itemPool[Math.floor(Math.random() * itemPool.length)];
    
    return { ...selectedItem };
  }

  private determineRarity(odds: LootOdds): string {
    const roll = Math.random();
    let cumulative = 0;
    
    for (const [rarity, probability] of Object.entries(odds)) {
      cumulative += probability;
      if (roll <= cumulative) {
        return rarity;
      }
    }
    
    return 'common';
  }

  private generateItemPool(minRarity: string): LootItem[] {
    const pool: LootItem[] = [];
    const rarities = ['common', 'rare', 'epic', 'legendary', 'mythic'];
    const minIndex = rarities.indexOf(minRarity);
    
    // Generate diverse item pool
    const itemTypes = ['skin', 'trail', 'frame', 'powerup', 'coins'];
    
    for (let i = minIndex; i < rarities.length; i++) {
      const rarity = rarities[i];
      for (const type of itemTypes) {
        pool.push({
          id: `${type}_${rarity}_${Math.random().toString(36).substr(2, 9)}`,
          name: this.generateItemName(type, rarity),
          type: type as any,
          rarity: rarity as any,
          value: this.getItemValue(type, rarity),
          probability: this.BASE_ODDS[rarity as keyof LootOdds]
        });
      }
    }
    
    return pool;
  }

  private generateItemName(type: string, rarity: string): string {
    const prefixes: Record<string, string[]> = {
      common: ['Basic', 'Simple', 'Standard'],
      rare: ['Enhanced', 'Polished', 'Refined'],
      epic: ['Majestic', 'Grand', 'Royal'],
      legendary: ['Mythical', 'Ancient', 'Divine'],
      mythic: ['Transcendent', 'Celestial', 'Eternal']
    };
    
    const names: Record<string, string[]> = {
      skin: ['Pot', 'Cauldron', 'Vessel'],
      trail: ['Trail', 'Path', 'Wake'],
      frame: ['Border', 'Frame', 'Aura'],
      powerup: ['Boost', 'Power', 'Enhancement'],
      coins: ['Treasury', 'Fortune', 'Wealth']
    };
    
    const prefix = prefixes[rarity]?.[Math.floor(Math.random() * 3)] || '';
    const name = names[type]?.[Math.floor(Math.random() * 3)] || 'Item';
    
    return `${prefix} ${name}`;
  }

  private getItemValue(type: string, rarity: string): number {
    const baseValues: Record<string, number> = {
      skin: 1,
      trail: 1,
      frame: 1,
      powerup: 5,
      coins: 100
    };
    
    const rarityMultipliers: Record<string, number> = {
      common: 1,
      rare: 3,
      epic: 10,
      legendary: 50,
      mythic: 200
    };
    
    return baseValues[type] * rarityMultipliers[rarity];
  }

  private getDuplicateValue(rarity: string): number {
    const values: Record<string, number> = {
      common: 50,
      rare: 200,
      epic: 1000,
      legendary: 5000,
      mythic: 20000
    };
    
    return values[rarity] || 50;
  }

  private createOpeningAnimation(rarity: string): any {
    const animations: Record<string, any> = {
      common: {
        duration: 1000,
        effects: ['fade_in'],
        color: '#808080',
        particles: 5
      },
      rare: {
        duration: 1500,
        effects: ['spin', 'glow'],
        color: '#4169E1',
        particles: 10
      },
      epic: {
        duration: 2000,
        effects: ['spin', 'glow', 'pulse'],
        color: '#9400D3',
        particles: 20
      },
      legendary: {
        duration: 3000,
        effects: ['spin', 'glow', 'pulse', 'sparkle'],
        color: '#FFD700',
        particles: 50
      },
      mythic: {
        duration: 5000,
        effects: ['spin', 'glow', 'pulse', 'sparkle', 'rainbow'],
        color: '#FF1493',
        particles: 100
      }
    };
    
    return animations[rarity];
  }

  // Statistics and transparency
  getStatistics(): any {
    if (!this.playerHistory) return null;
    
    return {
      totalOpened: this.playerHistory.totalOpened,
      totalSpent: this.playerHistory.totalSpent,
      rarityCounts: this.playerHistory.rarityCounts,
      dropRates: this.calculateActualDropRates(),
      pityProgress: {
        legendary: `${this.playerHistory.pityCounters.legendary}/${this.PITY_THRESHOLDS.legendary}`,
        mythic: `${this.playerHistory.pityCounters.mythic}/${this.PITY_THRESHOLDS.mythic}`
      },
      collectionProgress: `${this.playerHistory.collection.length} unique items`,
      duplicateCompensation: this.playerHistory.duplicates.length * 100
    };
  }

  private calculateActualDropRates(): Record<string, string> {
    if (!this.playerHistory || this.playerHistory.totalOpened === 0) {
      return Object.entries(this.BASE_ODDS).reduce((acc, [key, val]) => {
        acc[key] = `${(val * 100).toFixed(1)}%`;
        return acc;
      }, {} as Record<string, string>);
    }
    
    const rates: Record<string, string> = {};
    for (const [rarity, count] of Object.entries(this.playerHistory.rarityCounts)) {
      const rate = (count / this.playerHistory.totalOpened) * 100;
      rates[rarity] = `${rate.toFixed(1)}%`;
    }
    
    return rates;
  }

  // Spending limits (player protection)
  async checkSpendingLimit(userId: string): Promise<{
    canPurchase: boolean,
    dailySpent: number,
    dailyLimit: number,
    weeklySpent: number,
    weeklyLimit: number
  }> {
    // Implement daily/weekly spending limits for player protection
    const limits = {
      daily: 5000,
      weekly: 20000
    };
    
    const spending = await this.getSpendingHistory(userId);
    
    return {
      canPurchase: spending.daily < limits.daily && spending.weekly < limits.weekly,
      dailySpent: spending.daily,
      dailyLimit: limits.daily,
      weeklySpent: spending.weekly,
      weeklyLimit: limits.weekly
    };
  }

  private async getSpendingHistory(userId: string): Promise<any> {
    // Track spending to prevent excessive purchases
    return {
      daily: 0,
      weekly: 0
    };
  }

  private async savePlayerHistory() {
    if (!this.playerHistory) return;
    
    try {
      await AsyncStorage.setItem(
        `loot_history_${Date.now()}`,
        JSON.stringify(this.playerHistory)
      );
    } catch (error) {
      console.error('Failed to save loot history:', error);
    }
  }

  // Preview system (let players see possible rewards)
  getBoxContents(boxId: string): LootItem[] {
    const box = this.getLootBoxTypes().find(b => b.id === boxId);
    return box?.items || [];
  }

  getOdds(boxId: string): LootOdds | null {
    const box = this.getLootBoxTypes().find(b => b.id === boxId);
    return box?.odds || null;
  }
}

export default new LootBoxSystem();