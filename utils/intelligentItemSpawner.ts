/**
 * Intelligent Item Spawning System
 * Dynamically adjusts item spawning based on player progression,
 * VIP status, events, and engagement metrics
 */

import { ENHANCED_ITEMS, EnhancedItemConfig, ItemRarity, PROGRESSION_MODIFIERS, VIP_SPAWN_POOLS, EVENT_CALENDAR } from './enhancedItemConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VIPLevel } from '../src/systems/VIPSubscriptionSystem';

export interface PlayerProfile {
  level: number;
  vipLevel: VIPLevel;
  totalPlayTime: number;
  currentStreak: number;
  lastSessionScore: number;
  preferredDifficulty: 'casual' | 'normal' | 'hardcore';
  collectionProgress: Map<string, number>;
  battlePassTier: number;
  isSubscriber: boolean;
  engagement: EngagementMetrics;
}

export interface EngagementMetrics {
  sessionLength: number;
  sessionsToday: number;
  averageScore: number;
  retentionDays: number;
  purchaseHistory: number;
  adWatchRate: number;
  socialShares: number;
}

export interface SpawnContext {
  currentLevel: number;
  currentScore: number;
  comboCount: number;
  activePowerUps: string[];
  timeInGame: number;
  difficultyMultiplier: number;
  isEventActive: boolean;
  currentEvent?: string;
}

export class IntelligentItemSpawner {
  private playerProfile: PlayerProfile;
  private spawnContext: SpawnContext;
  private spawnPool: Map<string, number> = new Map();
  private vipPool: string[] = [];
  private eventPool: string[] = [];
  private lastSpawnedItems: string[] = [];
  private spawnHistory: Map<string, number> = new Map();
  
  constructor() {
    this.initializeSpawnPools();
  }
  
  /**
   * Initialize spawn pools based on current game state
   */
  private async initializeSpawnPools() {
    // Load player profile
    const profile = await this.loadPlayerProfile();
    this.playerProfile = profile;
    
    // Build base spawn pool
    this.buildBaseSpawnPool();
    
    // Apply VIP modifications
    this.applyVIPModifications();
    
    // Apply event modifications
    this.applyEventModifications();
    
    // Apply progression modifications
    this.applyProgressionModifications();
  }
  
  /**
   * Build the base spawn pool from all available items
   */
  private buildBaseSpawnPool() {
    Object.entries(ENHANCED_ITEMS).forEach(([key, item]) => {
      // Skip VIP items if player doesn't have required level
      if (item.vipRequired && this.playerProfile.vipLevel < item.vipRequired) {
        return;
      }
      
      // Skip battle pass items if not active
      if (item.seasonPass && !this.playerProfile.isSubscriber) {
        return;
      }
      
      // Skip event items if event not active
      if (item.eventOnly && !this.isEventActive(item.eventOnly)) {
        return;
      }
      
      // Skip items above player's unlock level
      if (item.unlockLevel && this.playerProfile.level < item.unlockLevel) {
        return;
      }
      
      // Add to spawn pool with base weight
      this.spawnPool.set(key, item.spawnWeight);
    });
  }
  
  /**
   * Apply VIP-specific modifications to spawn rates
   */
  private applyVIPModifications() {
    const vipLevel = this.playerProfile.vipLevel;
    
    if (vipLevel === VIPLevel.NONE) return;
    
    // Get VIP-specific items
    const vipTierName = this.getVIPTierName(vipLevel);
    const vipItems = VIP_SPAWN_POOLS[vipTierName.toLowerCase()] || [];
    
    // Add VIP items to special pool
    this.vipPool = vipItems;
    
    // Boost legendary item spawn rates for VIP
    const legendaryBonus = PROGRESSION_MODIFIERS.vip[vipLevel]?.legendaryBonus || 1.0;
    
    this.spawnPool.forEach((weight, itemKey) => {
      const item = ENHANCED_ITEMS[itemKey];
      if (item.rarity === 'legendary' || item.rarity === 'mythic' || item.rarity === 'cosmic') {
        this.spawnPool.set(itemKey, weight * legendaryBonus);
      }
    });
    
    // VIP members get reduced obstacle spawn rates
    this.spawnPool.forEach((weight, itemKey) => {
      const item = ENHANCED_ITEMS[itemKey];
      if (item.category === 'obstacle') {
        this.spawnPool.set(itemKey, weight * 0.7); // 30% fewer obstacles
      }
    });
  }
  
  /**
   * Apply event-specific modifications
   */
  private applyEventModifications() {
    const currentDate = new Date();
    const currentEvent = this.getCurrentEvent(currentDate);
    
    if (currentEvent) {
      const eventItems = EVENT_CALENDAR[currentEvent].items;
      this.eventPool = eventItems;
      
      // Boost event item spawn rates
      eventItems.forEach(itemKey => {
        const currentWeight = this.spawnPool.get(itemKey) || 0;
        this.spawnPool.set(itemKey, currentWeight + 10); // Significant boost during events
      });
    }
  }
  
  /**
   * Apply progression-based modifications
   */
  private applyProgressionModifications() {
    const level = this.playerProfile.level;
    const levelModifier = this.getLevelModifier(level);
    
    this.spawnPool.forEach((weight, itemKey) => {
      const item = ENHANCED_ITEMS[itemKey];
      const rarityModifier = levelModifier[item.rarity] || 1.0;
      this.spawnPool.set(itemKey, weight * rarityModifier);
    });
    
    // Streak bonuses
    const streak = this.playerProfile.currentStreak;
    if (streak >= 3) {
      const streakBonus = this.getStreakBonus(streak);
      this.applyStreakBonus(streakBonus);
    }
    
    // Engagement-based adjustments
    this.applyEngagementAdjustments();
  }
  
  /**
   * Apply engagement-based spawn adjustments
   */
  private applyEngagementAdjustments() {
    const engagement = this.playerProfile.engagement;
    
    // High engagement players get better items
    if (engagement.retentionDays >= 7) {
      this.boostRareItems(1.2);
    }
    
    if (engagement.retentionDays >= 30) {
      this.boostRareItems(1.5);
    }
    
    // Reward paying players
    if (engagement.purchaseHistory > 0) {
      this.boostPremiumItems(1.3);
    }
    
    // Adjust difficulty for player preference
    switch (this.playerProfile.preferredDifficulty) {
      case 'casual':
        this.reduceObstacles(0.5);
        this.boostPowerUps(1.5);
        break;
      case 'hardcore':
        this.boostObstacles(1.5);
        this.boostRareItems(1.3);
        break;
    }
  }
  
  /**
   * Main spawn function - returns next item to spawn
   */
  public spawnNextItem(context: SpawnContext): EnhancedItemConfig | null {
    this.spawnContext = context;
    
    // Dynamic adjustments based on current game state
    const adjustedPool = this.getDynamicSpawnPool();
    
    // Special spawn conditions
    if (this.shouldSpawnSpecialItem()) {
      return this.spawnSpecialItem();
    }
    
    // Weighted random selection
    const selectedKey = this.weightedRandomSelect(adjustedPool);
    
    if (selectedKey) {
      this.recordSpawn(selectedKey);
      return ENHANCED_ITEMS[selectedKey];
    }
    
    return null;
  }
  
  /**
   * Get dynamically adjusted spawn pool based on current context
   */
  private getDynamicSpawnPool(): Map<string, number> {
    const pool = new Map(this.spawnPool);
    
    // Combo bonuses - more valuable items during combos
    if (this.spawnContext.comboCount > 5) {
      pool.forEach((weight, key) => {
        const item = ENHANCED_ITEMS[key];
        if (item.chainBonus) {
          pool.set(key, weight * 1.5);
        }
      });
    }
    
    // Time-based adjustments - increase difficulty over time
    const timeMultiplier = 1 + (this.spawnContext.timeInGame / 60000) * 0.1; // +10% per minute
    pool.forEach((weight, key) => {
      const item = ENHANCED_ITEMS[key];
      if (item.category === 'obstacle') {
        pool.set(key, weight * Math.min(timeMultiplier, 2)); // Cap at 2x
      }
    });
    
    // Score milestones - reward high scores
    const scoreMilestone = Math.floor(this.spawnContext.currentScore / 1000);
    if (scoreMilestone > 0) {
      this.boostRareItemsInPool(pool, 1 + scoreMilestone * 0.1);
    }
    
    // Prevent repetition
    this.lastSpawnedItems.forEach(itemKey => {
      const currentWeight = pool.get(itemKey) || 0;
      pool.set(itemKey, currentWeight * 0.3); // Reduce chance of recent items
    });
    
    return pool;
  }
  
  /**
   * Check if special item should spawn
   */
  private shouldSpawnSpecialItem(): boolean {
    // VIP guaranteed spawn every X items
    if (this.playerProfile.vipLevel >= VIPLevel.GOLD) {
      const spawnCount = Array.from(this.spawnHistory.values()).reduce((a, b) => a + b, 0);
      if (spawnCount % 50 === 0) return true; // Every 50 items for Gold+ VIP
    }
    
    // Pity system for rare items
    const rareSpawnGap = this.getLastRareSpawnGap();
    if (rareSpawnGap > 100) return true; // Force rare item after 100 common items
    
    // Special combo rewards
    if (this.spawnContext.comboCount >= 20) return true;
    
    // Time-based special spawns
    if (this.spawnContext.timeInGame % 60000 < 1000) return true; // Every minute
    
    return false;
  }
  
  /**
   * Spawn a guaranteed special item
   */
  private spawnSpecialItem(): EnhancedItemConfig {
    const specialPools = [];
    
    // Add VIP pool if applicable
    if (this.vipPool.length > 0) {
      specialPools.push(...this.vipPool);
    }
    
    // Add event pool if active
    if (this.eventPool.length > 0) {
      specialPools.push(...this.eventPool);
    }
    
    // Default to rare+ items
    if (specialPools.length === 0) {
      Object.entries(ENHANCED_ITEMS).forEach(([key, item]) => {
        if (item.rarity === 'epic' || item.rarity === 'legendary' || item.rarity === 'mythic') {
          specialPools.push(key);
        }
      });
    }
    
    const selectedKey = specialPools[Math.floor(Math.random() * specialPools.length)];
    this.recordSpawn(selectedKey);
    
    return ENHANCED_ITEMS[selectedKey];
  }
  
  /**
   * Weighted random selection from spawn pool
   */
  private weightedRandomSelect(pool: Map<string, number>): string | null {
    const totalWeight = Array.from(pool.values()).reduce((a, b) => a + b, 0);
    
    if (totalWeight === 0) return null;
    
    let random = Math.random() * totalWeight;
    
    for (const [key, weight] of pool.entries()) {
      random -= weight;
      if (random <= 0) {
        return key;
      }
    }
    
    return null;
  }
  
  /**
   * Record spawn for history and anti-repetition
   */
  private recordSpawn(itemKey: string) {
    // Update spawn history
    const currentCount = this.spawnHistory.get(itemKey) || 0;
    this.spawnHistory.set(itemKey, currentCount + 1);
    
    // Update recent spawns (keep last 5)
    this.lastSpawnedItems.push(itemKey);
    if (this.lastSpawnedItems.length > 5) {
      this.lastSpawnedItems.shift();
    }
  }
  
  // ========== HELPER FUNCTIONS ==========
  
  private async loadPlayerProfile(): Promise<PlayerProfile> {
    try {
      const stored = await AsyncStorage.getItem('playerProfile');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading player profile:', error);
    }
    
    // Return default profile
    return {
      level: 1,
      vipLevel: VIPLevel.NONE,
      totalPlayTime: 0,
      currentStreak: 0,
      lastSessionScore: 0,
      preferredDifficulty: 'normal',
      collectionProgress: new Map(),
      battlePassTier: 0,
      isSubscriber: false,
      engagement: {
        sessionLength: 0,
        sessionsToday: 0,
        averageScore: 0,
        retentionDays: 0,
        purchaseHistory: 0,
        adWatchRate: 0,
        socialShares: 0,
      }
    };
  }
  
  private getVIPTierName(level: VIPLevel): string {
    const tiers = ['none', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster', 'legendary', 'mythic', 'eternal'];
    return tiers[level] || 'none';
  }
  
  private isEventActive(eventName: string): boolean {
    const event = EVENT_CALENDAR[eventName];
    if (!event) return false;
    
    const now = new Date();
    const currentMMDD = `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    return currentMMDD >= event.start && currentMMDD <= event.end;
  }
  
  private getCurrentEvent(date: Date): string | null {
    const currentMMDD = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    
    for (const [eventName, event] of Object.entries(EVENT_CALENDAR)) {
      if (currentMMDD >= event.start && currentMMDD <= event.end) {
        return eventName;
      }
    }
    
    return null;
  }
  
  private getLevelModifier(level: number): any {
    const tiers = [1, 10, 25, 50, 100];
    let modifier = PROGRESSION_MODIFIERS.level[1];
    
    for (const tier of tiers) {
      if (level >= tier) {
        modifier = PROGRESSION_MODIFIERS.level[tier];
      }
    }
    
    return modifier;
  }
  
  private getStreakBonus(streak: number): any {
    const tiers = [3, 7, 15, 30];
    let bonus = { multiplier: 1, rareBonus: 0 };
    
    for (const tier of tiers) {
      if (streak >= tier) {
        bonus = PROGRESSION_MODIFIERS.streak[tier];
      }
    }
    
    return bonus;
  }
  
  private applyStreakBonus(bonus: any) {
    this.spawnPool.forEach((weight, key) => {
      const item = ENHANCED_ITEMS[key];
      if (item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary') {
        this.spawnPool.set(key, weight * (1 + bonus.rareBonus));
      }
    });
  }
  
  private boostRareItems(multiplier: number) {
    this.spawnPool.forEach((weight, key) => {
      const item = ENHANCED_ITEMS[key];
      if (item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary' || item.rarity === 'mythic') {
        this.spawnPool.set(key, weight * multiplier);
      }
    });
  }
  
  private boostRareItemsInPool(pool: Map<string, number>, multiplier: number) {
    pool.forEach((weight, key) => {
      const item = ENHANCED_ITEMS[key];
      if (item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary') {
        pool.set(key, weight * multiplier);
      }
    });
  }
  
  private boostPremiumItems(multiplier: number) {
    this.spawnPool.forEach((weight, key) => {
      const item = ENHANCED_ITEMS[key];
      if (item.gemValue && item.gemValue > 0) {
        this.spawnPool.set(key, weight * multiplier);
      }
    });
  }
  
  private boostPowerUps(multiplier: number) {
    this.spawnPool.forEach((weight, key) => {
      const item = ENHANCED_ITEMS[key];
      if (item.category === 'powerup') {
        this.spawnPool.set(key, weight * multiplier);
      }
    });
  }
  
  private reduceObstacles(multiplier: number) {
    this.spawnPool.forEach((weight, key) => {
      const item = ENHANCED_ITEMS[key];
      if (item.category === 'obstacle') {
        this.spawnPool.set(key, weight * multiplier);
      }
    });
  }
  
  private boostObstacles(multiplier: number) {
    this.spawnPool.forEach((weight, key) => {
      const item = ENHANCED_ITEMS[key];
      if (item.category === 'obstacle') {
        this.spawnPool.set(key, weight * multiplier);
      }
    });
  }
  
  private getLastRareSpawnGap(): number {
    let commonCount = 0;
    const history = Array.from(this.lastSpawnedItems).reverse();
    
    for (const itemKey of history) {
      const item = ENHANCED_ITEMS[itemKey];
      if (item.rarity === 'common' || item.rarity === 'uncommon') {
        commonCount++;
      } else {
        break;
      }
    }
    
    return commonCount;
  }
  
  /**
   * Get spawn statistics for analytics
   */
  public getSpawnStatistics(): any {
    const stats = {
      totalSpawns: 0,
      byRarity: {},
      byCategory: {},
      vipItems: 0,
      eventItems: 0,
    };
    
    this.spawnHistory.forEach((count, itemKey) => {
      const item = ENHANCED_ITEMS[itemKey];
      if (!item) return;
      
      stats.totalSpawns += count;
      
      // By rarity
      stats.byRarity[item.rarity] = (stats.byRarity[item.rarity] || 0) + count;
      
      // By category
      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + count;
      
      // VIP items
      if (item.vipRequired) {
        stats.vipItems += count;
      }
      
      // Event items
      if (item.eventOnly) {
        stats.eventItems += count;
      }
    });
    
    return stats;
  }
}