/**
 * Inventory Management System
 * Tracks all collected items, consumables, and permanent upgrades
 * Handles item consumption, storage limits, and economy balancing
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase/firebase';
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';

export interface InventoryItem {
  id: string;
  type: ItemType;
  quantity: number;
  maxStack: number;
  value: number; // Base value in coins
  gemValue?: number; // Value in gems
  tradeable: boolean;
  consumable: boolean;
  permanent: boolean;
  rarity: string;
  obtained: number; // Timestamp
  source: string; // How it was obtained
}

export enum ItemType {
  // Currencies
  COIN = 'coin',
  GEM = 'gem',
  TOKEN = 'token',
  TICKET = 'ticket',
  
  // Power-ups (Consumable)
  MAGNET = 'magnet',
  SHIELD = 'shield',
  TURBO = 'turbo',
  TIME_SLOW = 'time_slow',
  GOLDEN_TOUCH = 'golden_touch',
  
  // Collectibles
  ANCIENT_COIN = 'ancient_coin',
  CRYSTAL_SHARD = 'crystal_shard',
  PHOENIX_FEATHER = 'phoenix_feather',
  DRAGON_SCALE = 'dragon_scale',
  INFINITY_GEM = 'infinity_gem',
  
  // Crafting Materials
  METAL_SCRAP = 'metal_scrap',
  GOLDEN_ORE = 'golden_ore',
  DIAMOND_DUST = 'diamond_dust',
  COSMIC_ESSENCE = 'cosmic_essence',
  
  // Seasonal Items
  SNOWFLAKE = 'snowflake',
  PUMPKIN = 'pumpkin',
  CLOVER = 'clover',
  
  // Keys & Chests
  BRONZE_KEY = 'bronze_key',
  SILVER_KEY = 'silver_key',
  GOLDEN_KEY = 'golden_key',
  MYSTERY_CHEST = 'mystery_chest',
  ELITE_CHEST = 'elite_chest',
  
  // Boosters
  XP_BOOSTER = 'xp_booster',
  COIN_BOOSTER = 'coin_booster',
  GEM_BOOSTER = 'gem_booster',
  LUCK_BOOSTER = 'luck_booster',
}

export interface PlayerInventory {
  userId: string;
  coins: number;
  gems: number;
  tokens: number;
  items: Map<string, InventoryItem>;
  collections: Map<string, CollectionProgress>;
  statistics: InventoryStatistics;
  storage: StorageInfo;
}

export interface CollectionProgress {
  setId: string;
  name: string;
  collected: string[];
  total: number;
  completed: boolean;
  reward?: CollectionReward;
}

export interface CollectionReward {
  coins?: number;
  gems?: number;
  items?: { id: string; quantity: number }[];
  title?: string;
  skin?: string;
  permanent?: string; // Permanent buff
}

export interface InventoryStatistics {
  totalItemsCollected: number;
  totalCoinsEarned: number;
  totalGemsEarned: number;
  totalCoinsSpent: number;
  totalGemsSpent: number;
  itemsConsumed: Map<string, number>;
  favoriteItem: string;
  rareItemsFound: number;
  legendaryItemsFound: number;
}

export interface StorageInfo {
  currentCapacity: number;
  maxCapacity: number;
  expansions: number;
  nextExpansionCost: number;
}

export class InventoryManager {
  private inventory: PlayerInventory | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private transactionHistory: Transaction[] = [];
  
  constructor() {
    this.initializeInventory();
  }
  
  /**
   * Initialize or load existing inventory
   */
  async initializeInventory(userId?: string): Promise<PlayerInventory> {
    try {
      // Try to load from AsyncStorage first (offline support)
      const localData = await AsyncStorage.getItem('playerInventory');
      if (localData) {
        const parsed = JSON.parse(localData);
        this.inventory = this.deserializeInventory(parsed);
      }
      
      // Sync with Firebase if user is logged in
      if (userId) {
        const firebaseInventory = await this.loadFromFirebase(userId);
        if (firebaseInventory) {
          this.inventory = firebaseInventory;
          await this.saveToLocal();
        }
      }
      
      // Create new inventory if none exists
      if (!this.inventory) {
        this.inventory = this.createNewInventory(userId || 'guest');
      }
      
      // Start auto-save
      this.startAutoSave();
      
      return this.inventory;
    } catch (error) {
      console.error('Error initializing inventory:', error);
      return this.createNewInventory(userId || 'guest');
    }
  }
  
  /**
   * Create a new inventory for a player
   */
  private createNewInventory(userId: string): PlayerInventory {
    return {
      userId,
      coins: 0,
      gems: 0,
      tokens: 0,
      items: new Map(),
      collections: new Map(),
      statistics: {
        totalItemsCollected: 0,
        totalCoinsEarned: 0,
        totalGemsEarned: 0,
        totalCoinsSpent: 0,
        totalGemsSpent: 0,
        itemsConsumed: new Map(),
        favoriteItem: '',
        rareItemsFound: 0,
        legendaryItemsFound: 0,
      },
      storage: {
        currentCapacity: 0,
        maxCapacity: 100, // Start with 100 slots
        expansions: 0,
        nextExpansionCost: 1000,
      },
    };
  }
  
  /**
   * Add items to inventory from gameplay
   */
  async addItem(
    itemId: string,
    quantity: number = 1,
    source: string = 'gameplay'
  ): Promise<boolean> {
    if (!this.inventory) return false;
    
    try {
      // Check storage capacity
      if (this.inventory.storage.currentCapacity >= this.inventory.storage.maxCapacity) {
        // Storage full - need to handle this
        return false;
      }
      
      // Special handling for currencies
      if (itemId === 'coin') {
        await this.addCoins(quantity);
        return true;
      }
      
      if (itemId === 'gem') {
        await this.addGems(quantity);
        return true;
      }
      
      // Regular items
      const existingItem = this.inventory.items.get(itemId);
      
      if (existingItem) {
        // Stack existing item
        const newQuantity = Math.min(
          existingItem.quantity + quantity,
          existingItem.maxStack
        );
        existingItem.quantity = newQuantity;
      } else {
        // Add new item
        const newItem: InventoryItem = {
          id: itemId,
          type: this.getItemType(itemId),
          quantity,
          maxStack: this.getMaxStack(itemId),
          value: this.getItemValue(itemId),
          gemValue: this.getItemGemValue(itemId),
          tradeable: this.isItemTradeable(itemId),
          consumable: this.isItemConsumable(itemId),
          permanent: this.isItemPermanent(itemId),
          rarity: this.getItemRarity(itemId),
          obtained: Date.now(),
          source,
        };
        
        this.inventory.items.set(itemId, newItem);
        this.inventory.storage.currentCapacity++;
      }
      
      // Update statistics
      this.inventory.statistics.totalItemsCollected += quantity;
      
      // Check for collection progress
      await this.updateCollectionProgress(itemId);
      
      // Record transaction
      this.recordTransaction('add', itemId, quantity, source);
      
      // Save changes
      await this.saveInventory();
      
      return true;
    } catch (error) {
      console.error('Error adding item:', error);
      return false;
    }
  }
  
  /**
   * Remove/consume items from inventory
   */
  async removeItem(itemId: string, quantity: number = 1): Promise<boolean> {
    if (!this.inventory) return false;
    
    const item = this.inventory.items.get(itemId);
    if (!item || item.quantity < quantity) {
      return false; // Not enough items
    }
    
    item.quantity -= quantity;
    
    if (item.quantity === 0) {
      this.inventory.items.delete(itemId);
      this.inventory.storage.currentCapacity--;
    }
    
    // Update consumed statistics
    const consumed = this.inventory.statistics.itemsConsumed.get(itemId) || 0;
    this.inventory.statistics.itemsConsumed.set(itemId, consumed + quantity);
    
    // Record transaction
    this.recordTransaction('remove', itemId, quantity, 'consumed');
    
    await this.saveInventory();
    return true;
  }
  
  /**
   * Currency management
   */
  async addCoins(amount: number): Promise<void> {
    if (!this.inventory) return;
    
    this.inventory.coins += amount;
    this.inventory.statistics.totalCoinsEarned += amount;
    
    await this.saveInventory();
  }
  
  async spendCoins(amount: number): Promise<boolean> {
    if (!this.inventory || this.inventory.coins < amount) return false;
    
    this.inventory.coins -= amount;
    this.inventory.statistics.totalCoinsSpent += amount;
    
    await this.saveInventory();
    return true;
  }
  
  async addGems(amount: number): Promise<void> {
    if (!this.inventory) return;
    
    this.inventory.gems += amount;
    this.inventory.statistics.totalGemsEarned += amount;
    
    await this.saveInventory();
  }
  
  async spendGems(amount: number): Promise<boolean> {
    if (!this.inventory || this.inventory.gems < amount) return false;
    
    this.inventory.gems -= amount;
    this.inventory.statistics.totalGemsSpent += amount;
    
    await this.saveInventory();
    return true;
  }
  
  /**
   * Use consumable item
   */
  async consumeItem(itemId: string): Promise<any> {
    const item = this.inventory?.items.get(itemId);
    if (!item || !item.consumable || item.quantity < 1) {
      return null;
    }
    
    // Remove item
    await this.removeItem(itemId, 1);
    
    // Return effect data for game to process
    return this.getItemEffect(itemId);
  }
  
  /**
   * Storage expansion
   */
  async expandStorage(): Promise<boolean> {
    if (!this.inventory) return false;
    
    const cost = this.inventory.storage.nextExpansionCost;
    
    if (this.inventory.gems < cost) {
      return false; // Not enough gems
    }
    
    await this.spendGems(cost);
    
    this.inventory.storage.maxCapacity += 50; // Add 50 slots
    this.inventory.storage.expansions++;
    this.inventory.storage.nextExpansionCost = Math.floor(cost * 1.5); // Increase cost
    
    await this.saveInventory();
    return true;
  }
  
  /**
   * Collection management
   */
  private async updateCollectionProgress(itemId: string): Promise<void> {
    if (!this.inventory) return;
    
    // Check if item belongs to any collection
    const collectionId = this.getItemCollection(itemId);
    if (!collectionId) return;
    
    let collection = this.inventory.collections.get(collectionId);
    
    if (!collection) {
      collection = {
        setId: collectionId,
        name: this.getCollectionName(collectionId),
        collected: [],
        total: this.getCollectionTotal(collectionId),
        completed: false,
      };
      this.inventory.collections.set(collectionId, collection);
    }
    
    if (!collection.collected.includes(itemId)) {
      collection.collected.push(itemId);
      
      // Check if collection is complete
      if (collection.collected.length === collection.total) {
        collection.completed = true;
        await this.grantCollectionReward(collectionId);
      }
    }
  }
  
  private async grantCollectionReward(collectionId: string): Promise<void> {
    const rewards = this.getCollectionRewards(collectionId);
    if (!rewards) return;
    
    if (rewards.coins) {
      await this.addCoins(rewards.coins);
    }
    
    if (rewards.gems) {
      await this.addGems(rewards.gems);
    }
    
    if (rewards.items) {
      for (const item of rewards.items) {
        await this.addItem(item.id, item.quantity, 'collection_reward');
      }
    }
    
    // TODO: Grant titles, skins, permanent buffs
  }
  
  /**
   * Transaction history
   */
  private recordTransaction(
    type: 'add' | 'remove' | 'trade',
    itemId: string,
    quantity: number,
    source: string
  ): void {
    this.transactionHistory.push({
      type,
      itemId,
      quantity,
      source,
      timestamp: Date.now(),
    });
    
    // Keep only last 100 transactions
    if (this.transactionHistory.length > 100) {
      this.transactionHistory.shift();
    }
  }
  
  /**
   * Save and load functions
   */
  private async saveInventory(): Promise<void> {
    if (!this.inventory) return;
    
    try {
      // Save to local storage
      await this.saveToLocal();
      
      // Save to Firebase if online
      if (this.inventory.userId !== 'guest') {
        await this.saveToFirebase();
      }
    } catch (error) {
      console.error('Error saving inventory:', error);
    }
  }
  
  private async saveToLocal(): Promise<void> {
    if (!this.inventory) return;
    
    const serialized = this.serializeInventory(this.inventory);
    await AsyncStorage.setItem('playerInventory', JSON.stringify(serialized));
  }
  
  private async saveToFirebase(): Promise<void> {
    if (!this.inventory || this.inventory.userId === 'guest') return;
    
    try {
      const docRef = doc(db, 'inventories', this.inventory.userId);
      const serialized = this.serializeInventory(this.inventory);
      await setDoc(docRef, serialized, { merge: true });
    } catch (error) {
      console.error('Error saving to Firebase:', error);
    }
  }
  
  private async loadFromFirebase(userId: string): Promise<PlayerInventory | null> {
    try {
      const docRef = doc(db, 'inventories', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return this.deserializeInventory(docSnap.data());
      }
    } catch (error) {
      console.error('Error loading from Firebase:', error);
    }
    
    return null;
  }
  
  /**
   * Serialization helpers
   */
  private serializeInventory(inventory: PlayerInventory): any {
    return {
      ...inventory,
      items: Array.from(inventory.items.entries()),
      collections: Array.from(inventory.collections.entries()),
      statistics: {
        ...inventory.statistics,
        itemsConsumed: Array.from(inventory.statistics.itemsConsumed.entries()),
      },
    };
  }
  
  private deserializeInventory(data: any): PlayerInventory {
    return {
      ...data,
      items: new Map(data.items),
      collections: new Map(data.collections),
      statistics: {
        ...data.statistics,
        itemsConsumed: new Map(data.statistics.itemsConsumed),
      },
    };
  }
  
  /**
   * Auto-save functionality
   */
  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      this.saveInventory();
    }, 30000); // Auto-save every 30 seconds
  }
  
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }
  
  // ========== HELPER FUNCTIONS ==========
  
  private getItemType(itemId: string): ItemType {
    // Map item IDs to types
    const typeMap: { [key: string]: ItemType } = {
      'coin': ItemType.COIN,
      'gem': ItemType.GEM,
      'magnet': ItemType.MAGNET,
      'shield': ItemType.SHIELD,
      'phoenix_feather': ItemType.PHOENIX_FEATHER,
      'dragon_scale': ItemType.DRAGON_SCALE,
      // ... add all mappings
    };
    
    return typeMap[itemId] || ItemType.COIN;
  }
  
  private getMaxStack(itemId: string): number {
    // Different items have different stack limits
    const stackLimits: { [key: string]: number } = {
      'coin': 999999999,
      'gem': 999999,
      'magnet': 99,
      'shield': 99,
      'phoenix_feather': 1,
      'dragon_scale': 1,
      'infinity_gem': 1,
      // ... add all limits
    };
    
    return stackLimits[itemId] || 99;
  }
  
  private getItemValue(itemId: string): number {
    // Base coin value for selling/trading
    const values: { [key: string]: number } = {
      'magnet': 100,
      'shield': 150,
      'phoenix_feather': 10000,
      'dragon_scale': 10000,
      // ... add all values
    };
    
    return values[itemId] || 1;
  }
  
  private getItemGemValue(itemId: string): number | undefined {
    // Gem value for premium items
    const gemValues: { [key: string]: number } = {
      'phoenix_feather': 100,
      'dragon_scale': 100,
      'infinity_gem': 1000,
      // ... add gem values
    };
    
    return gemValues[itemId];
  }
  
  private isItemTradeable(itemId: string): boolean {
    const nonTradeable = ['infinity_gem', 'vip_crown'];
    return !nonTradeable.includes(itemId);
  }
  
  private isItemConsumable(itemId: string): boolean {
    const consumables = ['magnet', 'shield', 'turbo', 'time_slow', 'golden_touch'];
    return consumables.includes(itemId);
  }
  
  private isItemPermanent(itemId: string): boolean {
    const permanent = ['phoenix_feather', 'dragon_scale', 'infinity_gem'];
    return permanent.includes(itemId);
  }
  
  private getItemRarity(itemId: string): string {
    const rarities: { [key: string]: string } = {
      'coin': 'common',
      'gem': 'epic',
      'phoenix_feather': 'cosmic',
      'dragon_scale': 'cosmic',
      'infinity_gem': 'cosmic',
      // ... add all rarities
    };
    
    return rarities[itemId] || 'common';
  }
  
  private getItemEffect(itemId: string): any {
    const effects: { [key: string]: any } = {
      'magnet': { type: 'magnet', duration: 15000 },
      'shield': { type: 'shield', duration: 10000 },
      'turbo': { type: 'speed', multiplier: 3, duration: 8000 },
      'time_slow': { type: 'time_scale', value: 0.5, duration: 12000 },
      'golden_touch': { type: 'golden_mode', duration: 10000 },
      // ... add all effects
    };
    
    return effects[itemId];
  }
  
  private getItemCollection(itemId: string): string | null {
    const collections: { [key: string]: string } = {
      'ancient_coin': 'ancient_treasures',
      'crystal_shard': 'crystal_power',
      'snowflake': 'winter_collection',
      'pumpkin': 'halloween_collection',
      // ... map items to collections
    };
    
    return collections[itemId] || null;
  }
  
  private getCollectionName(collectionId: string): string {
    const names: { [key: string]: string } = {
      'ancient_treasures': 'Ancient Treasures',
      'crystal_power': 'Crystal Power',
      'winter_collection': 'Winter Wonders',
      'halloween_collection': 'Spooky Collection',
      // ... add all collection names
    };
    
    return names[collectionId] || collectionId;
  }
  
  private getCollectionTotal(collectionId: string): number {
    const totals: { [key: string]: number } = {
      'ancient_treasures': 10,
      'crystal_power': 7,
      'winter_collection': 5,
      'halloween_collection': 5,
      // ... add all collection totals
    };
    
    return totals[collectionId] || 1;
  }
  
  private getCollectionRewards(collectionId: string): CollectionReward | null {
    const rewards: { [key: string]: CollectionReward } = {
      'ancient_treasures': {
        coins: 10000,
        gems: 100,
        title: 'Archaeologist',
      },
      'crystal_power': {
        coins: 7777,
        gems: 77,
        skin: 'crystal_cart',
      },
      // ... add all rewards
    };
    
    return rewards[collectionId] || null;
  }
  
  /**
   * Get current inventory state
   */
  getInventory(): PlayerInventory | null {
    return this.inventory;
  }
  
  /**
   * Get specific item quantity
   */
  getItemQuantity(itemId: string): number {
    if (!this.inventory) return 0;
    
    if (itemId === 'coin') return this.inventory.coins;
    if (itemId === 'gem') return this.inventory.gems;
    
    const item = this.inventory.items.get(itemId);
    return item?.quantity || 0;
  }
  
  /**
   * Check if player can afford something
   */
  canAfford(coins: number, gems: number = 0): boolean {
    if (!this.inventory) return false;
    
    return this.inventory.coins >= coins && this.inventory.gems >= gems;
  }
}

// Transaction interface for history
interface Transaction {
  type: 'add' | 'remove' | 'trade';
  itemId: string;
  quantity: number;
  source: string;
  timestamp: number;
}

// Export singleton instance
export const inventoryManager = new InventoryManager();