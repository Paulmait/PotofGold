import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { eventBus } from '../core/EventBus';
import { GameEventType, gameEvents } from '../core/GameEvents';

export interface OfflineData {
  id: string;
  type: DataType;
  action: ActionType;
  data: any;
  timestamp: number;
  synced: boolean;
  retries: number;
  priority: number;
  hash?: string;
}

export enum DataType {
  GAME_STATE = 'game_state',
  SCORE = 'score',
  CURRENCY = 'currency',
  ACHIEVEMENT = 'achievement',
  PURCHASE = 'purchase',
  PROGRESS = 'progress',
  INVENTORY = 'inventory',
  STATISTICS = 'statistics',
  SOCIAL = 'social',
  SETTINGS = 'settings',
}

export enum ActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  INCREMENT = 'increment',
  DECREMENT = 'decrement',
}

export interface SyncQueue {
  pending: OfflineData[];
  failed: OfflineData[];
  syncing: OfflineData[];
}

export interface OfflineProgress {
  startTime: number;
  endTime: number;
  duration: number;
  earnings: OfflineEarnings;
  events: OfflineEvent[];
  bonuses: OfflineBonus[];
}

export interface OfflineEarnings {
  gold: number;
  gems: number;
  xp: number;
  items: { [key: string]: number };
}

export interface OfflineEvent {
  type: string;
  timestamp: number;
  data: any;
}

export interface OfflineBonus {
  type: string;
  multiplier: number;
  source: string;
}

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // Time to live in ms
  size: number;
}

export interface ConflictResolution {
  strategy: 'client_wins' | 'server_wins' | 'merge' | 'manual';
  resolver?: (local: any, remote: any) => any;
}

export class OfflineSystem {
  private static instance: OfflineSystem;
  private isOnline = true;
  private syncQueue: SyncQueue = {
    pending: [],
    failed: [],
    syncing: [],
  };
  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private currentCacheSize = 0;
  private lastSyncTime = 0;
  private syncInterval: NodeJS.Timeout | null = null;
  private offlineStartTime = 0;
  private offlineEarningsRate = 100; // Gold per minute
  private networkListener: any = null;
  private conflictStrategies: Map<DataType, ConflictResolution> = new Map();
  private dataPersistenceKeys: Set<string> = new Set();

  private constructor() {
    // Constructor is kept minimal, actual initialization happens in initialize()
  }

  async initialize(): Promise<void> {
    this.initializeConflictStrategies();
    this.setupNetworkListener();
    this.setupEventListeners();
    await this.loadPersistedData();
    this.startSyncInterval();
  }

  static getInstance(): OfflineSystem {
    if (!OfflineSystem.instance) {
      OfflineSystem.instance = new OfflineSystem();
    }
    return OfflineSystem.instance;
  }

  private initializeConflictStrategies() {
    // Define conflict resolution strategies for different data types
    this.conflictStrategies.set(DataType.SCORE, {
      strategy: 'merge',
      resolver: (local: number, remote: number) => Math.max(local, remote),
    });

    this.conflictStrategies.set(DataType.CURRENCY, {
      strategy: 'merge',
      resolver: (local: any, remote: any) => ({
        gold: local.gold + remote.gold,
        gems: Math.max(local.gems, remote.gems), // Gems are more controlled
      }),
    });

    this.conflictStrategies.set(DataType.ACHIEVEMENT, {
      strategy: 'server_wins', // Achievements are server-authoritative
    });

    this.conflictStrategies.set(DataType.PURCHASE, {
      strategy: 'server_wins', // Purchases must be server-validated
    });

    this.conflictStrategies.set(DataType.GAME_STATE, {
      strategy: 'manual',
      resolver: this.resolveGameStateConflict.bind(this),
    });
  }

  private setupNetworkListener() {
    this.networkListener = NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected || false;

      if (!wasOnline && this.isOnline) {
        this.handleOnlineTransition();
      } else if (wasOnline && !this.isOnline) {
        this.handleOfflineTransition();
      }
    });
  }

  private setupEventListeners() {
    // Capture all game events for offline queuing
    const eventsToCapture = [
      GameEventType.CURRENCY_EARNED,
      GameEventType.ACHIEVEMENT_UNLOCKED,
      GameEventType.ITEM_COLLECTED,
      GameEventType.GAME_OVER,
    ];

    eventsToCapture.forEach(eventType => {
      eventBus.on(eventType, (data: any) => {
        this.captureEvent(eventType, data);
      });
    });

    eventBus.on('data:save', (data: any) => {
      this.saveData(data.type, data.action, data.data);
    });

    eventBus.on('data:load', (data: any) => {
      this.loadData(data.key);
    });

    eventBus.on('sync:force', () => {
      this.forceSyncNow();
    });
  }

  private async loadPersistedData() {
    try {
      // Load sync queue
      const queueData = await AsyncStorage.getItem('offline_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }

      // Load cache
      const cacheKeys = await AsyncStorage.getAllKeys();
      const cacheData = await AsyncStorage.multiGet(
        cacheKeys.filter(key => key.startsWith('cache_'))
      );

      cacheData.forEach(([key, value]) => {
        if (value) {
          const entry = JSON.parse(value);
          if (this.isValidCacheEntry(entry)) {
            this.cache.set(key.replace('cache_', ''), entry);
            this.currentCacheSize += entry.size;
          }
        }
      });

      // Load last sync time
      const lastSync = await AsyncStorage.getItem('last_sync_time');
      if (lastSync) {
        this.lastSyncTime = parseInt(lastSync, 10);
      }
    } catch (error) {
      console.error('Failed to load persisted data:', error);
    }
  }

  private startSyncInterval() {
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.processSyncQueue();
      }
      this.cleanupCache();
    }, 30000); // Every 30 seconds
  }

  private handleOnlineTransition() {
    console.log('Device is now online');
    
    // Calculate offline progress
    const offlineProgress = this.calculateOfflineProgress();
    
    // Grant offline earnings
    this.grantOfflineEarnings(offlineProgress);
    
    // Start syncing
    this.processSyncQueue();
    
    eventBus.emit(GameEventType.NETWORK_CONNECTED, {
      offlineDuration: offlineProgress.duration,
      earnings: offlineProgress.earnings,
    });
  }

  private handleOfflineTransition() {
    console.log('Device is now offline');
    this.offlineStartTime = Date.now();
    
    eventBus.emit(GameEventType.NETWORK_DISCONNECTED, {});
    
    // Save current state
    this.saveCurrentState();
  }

  private calculateOfflineProgress(): OfflineProgress {
    const endTime = Date.now();
    const duration = this.offlineStartTime > 0 
      ? endTime - this.offlineStartTime 
      : 0;

    const minutes = duration / 60000;
    const baseEarnings = minutes * this.offlineEarningsRate;

    // Apply offline multipliers
    const multipliers = this.getOfflineMultipliers();
    const totalMultiplier = multipliers.reduce((acc, m) => acc * m.multiplier, 1);

    const earnings: OfflineEarnings = {
      gold: Math.floor(baseEarnings * totalMultiplier),
      gems: Math.floor(minutes / 60), // 1 gem per hour
      xp: Math.floor(minutes * 10),
      items: {},
    };

    // Cap offline earnings (max 8 hours)
    const maxMinutes = 8 * 60;
    if (minutes > maxMinutes) {
      const ratio = maxMinutes / minutes;
      earnings.gold = Math.floor(earnings.gold * ratio);
      earnings.gems = Math.floor(earnings.gems * ratio);
      earnings.xp = Math.floor(earnings.xp * ratio);
    }

    return {
      startTime: this.offlineStartTime,
      endTime,
      duration,
      earnings,
      events: [],
      bonuses: multipliers,
    };
  }

  private getOfflineMultipliers(): OfflineBonus[] {
    const bonuses: OfflineBonus[] = [
      { type: 'base', multiplier: 1, source: 'default' },
    ];

    // Add prestige multipliers
    const prestigeMultiplier = this.getPrestigeOfflineMultiplier();
    if (prestigeMultiplier > 1) {
      bonuses.push({
        type: 'prestige',
        multiplier: prestigeMultiplier,
        source: 'prestige_system',
      });
    }

    // Add VIP multipliers
    const vipMultiplier = this.getVIPOfflineMultiplier();
    if (vipMultiplier > 1) {
      bonuses.push({
        type: 'vip',
        multiplier: vipMultiplier,
        source: 'vip_subscription',
      });
    }

    return bonuses;
  }

  private grantOfflineEarnings(progress: OfflineProgress) {
    if (progress.duration === 0) return;

    // Show offline earnings modal
    eventBus.emit('ui:modal:open', {
      type: 'offline_earnings',
      data: progress,
    });

    // Grant earnings
    if (progress.earnings.gold > 0) {
      gameEvents.emit(GameEventType.CURRENCY_EARNED, {
        type: 'gold',
        amount: progress.earnings.gold,
        source: 'offline',
      });
    }

    if (progress.earnings.gems > 0) {
      gameEvents.emit(GameEventType.CURRENCY_EARNED, {
        type: 'gems',
        amount: progress.earnings.gems,
        source: 'offline',
      });
    }
  }

  async saveData(
    type: DataType,
    action: ActionType,
    data: any,
    priority = 5
  ): Promise<void> {
    const offlineData: OfflineData = {
      id: this.generateId(),
      type,
      action,
      data: this.compressData(data),
      timestamp: Date.now(),
      synced: false,
      retries: 0,
      priority,
      hash: this.hashData(data),
    };

    // Add to queue
    this.syncQueue.pending.push(offlineData);
    this.sortQueueByPriority();

    // Persist to storage
    await this.persistQueue();

    // Try immediate sync if online
    if (this.isOnline) {
      this.syncSingleItem(offlineData);
    }
  }

  async loadData(key: string): Promise<any> {
    // Check cache first
    const cached = this.getFromCache(key);
    if (cached !== null) {
      return cached;
    }

    // Load from storage
    try {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        this.addToCache(key, parsed);
        return parsed;
      }
    } catch (error) {
      console.error(`Failed to load data for key ${key}:`, error);
    }

    // If online, fetch from server
    if (this.isOnline) {
      return this.fetchFromServer(key);
    }

    return null;
  }

  private async syncSingleItem(item: OfflineData): Promise<boolean> {
    if (!this.isOnline) return false;

    try {
      // Move to syncing
      this.moveToSyncing(item);

      // Send to server
      const response = await this.sendToServer(item);

      if (response.success) {
        // Handle conflicts if any
        if (response.conflict) {
          await this.resolveConflict(item, response.serverData);
        }

        // Mark as synced
        item.synced = true;
        this.removeFromQueue(item);

        return true;
      } else {
        // Move to failed
        this.moveToFailed(item);
        return false;
      }
    } catch (error) {
      console.error('Sync failed:', error);
      item.retries++;
      
      if (item.retries >= 3) {
        this.moveToFailed(item);
      } else {
        this.moveToPending(item);
      }

      return false;
    }
  }

  private async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.pending.length === 0) return;

    console.log(`Processing sync queue: ${this.syncQueue.pending.length} items`);

    // Process in batches
    const batchSize = 10;
    const batch = this.syncQueue.pending.slice(0, batchSize);

    await Promise.all(batch.map(item => this.syncSingleItem(item)));

    // Update last sync time
    this.lastSyncTime = Date.now();
    await AsyncStorage.setItem('last_sync_time', this.lastSyncTime.toString());

    // Emit sync complete if queue is empty
    if (this.syncQueue.pending.length === 0) {
      eventBus.emit(GameEventType.SYNC_COMPLETE, {
        syncedItems: batch.length,
        failedItems: this.syncQueue.failed.length,
      });
    }
  }

  private async resolveConflict(local: OfflineData, serverData: any) {
    const strategy = this.conflictStrategies.get(local.type);
    if (!strategy) {
      console.warn(`No conflict strategy for type ${local.type}`);
      return;
    }

    let resolved: any;

    switch (strategy.strategy) {
      case 'client_wins':
        resolved = local.data;
        break;
      case 'server_wins':
        resolved = serverData;
        break;
      case 'merge':
        if (strategy.resolver) {
          resolved = strategy.resolver(local.data, serverData);
        } else {
          resolved = { ...serverData, ...local.data };
        }
        break;
      case 'manual':
        if (strategy.resolver) {
          resolved = await strategy.resolver(local.data, serverData);
        } else {
          resolved = await this.promptUserForResolution(local.data, serverData);
        }
        break;
    }

    // Update local data with resolved version
    await this.updateLocalData(local.type, resolved);
  }

  private async resolveGameStateConflict(local: any, remote: any): Promise<any> {
    // Complex game state resolution
    const resolved = {
      ...remote,
      // Keep local progress if higher
      score: Math.max(local.score || 0, remote.score || 0),
      level: Math.max(local.level || 1, remote.level || 1),
      // Merge inventories
      inventory: this.mergeInventories(local.inventory, remote.inventory),
      // Use server timestamp
      lastUpdated: remote.lastUpdated,
    };

    return resolved;
  }

  private mergeInventories(local: any[], remote: any[]): any[] {
    const merged = new Map();

    // Add remote items
    remote.forEach(item => {
      merged.set(item.id, item);
    });

    // Merge local items
    local.forEach(item => {
      if (merged.has(item.id)) {
        const remoteItem = merged.get(item.id);
        merged.set(item.id, {
          ...remoteItem,
          count: Math.max(item.count, remoteItem.count),
        });
      } else {
        merged.set(item.id, item);
      }
    });

    return Array.from(merged.values());
  }

  private async promptUserForResolution(local: any, remote: any): Promise<any> {
    return new Promise((resolve) => {
      eventBus.emit('ui:modal:open', {
        type: 'conflict_resolution',
        data: {
          local,
          remote,
          callback: (choice: 'local' | 'remote' | 'merge') => {
            switch (choice) {
              case 'local':
                resolve(local);
                break;
              case 'remote':
                resolve(remote);
                break;
              case 'merge':
                resolve({ ...remote, ...local });
                break;
            }
          },
        },
      });
    });
  }

  private captureEvent(eventType: string, data: any) {
    if (!this.isOnline) {
      // Queue event for later sync
      const dataType = this.mapEventToDataType(eventType);
      if (dataType) {
        this.saveData(dataType, ActionType.CREATE, {
          event: eventType,
          data,
          timestamp: Date.now(),
        });
      }
    }
  }

  private mapEventToDataType(eventType: string): DataType | null {
    const mapping: { [key: string]: DataType } = {
      [GameEventType.CURRENCY_EARNED]: DataType.CURRENCY,
      [GameEventType.ACHIEVEMENT_UNLOCKED]: DataType.ACHIEVEMENT,
      [GameEventType.ITEM_COLLECTED]: DataType.INVENTORY,
      [GameEventType.GAME_OVER]: DataType.GAME_STATE,
    };

    return mapping[eventType] || null;
  }

  private async sendToServer(item: OfflineData): Promise<any> {
    // Simulate server request
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.1, // 90% success rate
          conflict: Math.random() > 0.8, // 20% conflict rate
          serverData: item.data,
        });
      }, 100);
    });
  }

  private async fetchFromServer(key: string): Promise<any> {
    // Simulate server fetch
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ key, data: 'server_data', timestamp: Date.now() });
      }, 100);
    });
  }

  private addToCache(key: string, data: any, ttl = 3600000) {
    const size = JSON.stringify(data).length;

    // Check cache size limit
    if (this.currentCacheSize + size > this.maxCacheSize) {
      this.evictFromCache(size);
    }

    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      size,
    };

    this.cache.set(key, entry);
    this.currentCacheSize += size;

    // Persist important cache entries
    if (this.dataPersistenceKeys.has(key)) {
      AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    }
  }

  private getFromCache(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.currentCacheSize -= entry.size;
      return null;
    }

    return entry.data;
  }

  private evictFromCache(requiredSize: number) {
    // LRU eviction
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    let freedSize = 0;
    for (const [key, entry] of entries) {
      if (freedSize >= requiredSize) break;
      
      this.cache.delete(key);
      freedSize += entry.size;
      this.currentCacheSize -= entry.size;
    }
  }

  private cleanupCache() {
    const now = Date.now();
    const toDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
        this.currentCacheSize -= entry.size;
      }
    });

    toDelete.forEach(key => this.cache.delete(key));
  }

  private isValidCacheEntry(entry: any): boolean {
    return (
      entry &&
      entry.timestamp &&
      entry.ttl &&
      entry.data !== undefined &&
      Date.now() - entry.timestamp < entry.ttl
    );
  }

  private async saveCurrentState() {
    const state = {
      score: 0, // Get from game
      currency: { gold: 0, gems: 0 },
      inventory: [],
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem('game_state', JSON.stringify(state));
  }

  private async updateLocalData(type: DataType, data: any) {
    const key = `data_${type}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
    this.addToCache(key, data);
  }

  private async persistQueue() {
    await AsyncStorage.setItem('offline_queue', JSON.stringify(this.syncQueue));
  }

  private sortQueueByPriority() {
    this.syncQueue.pending.sort((a, b) => a.priority - b.priority);
  }

  private moveToSyncing(item: OfflineData) {
    const index = this.syncQueue.pending.indexOf(item);
    if (index !== -1) {
      this.syncQueue.pending.splice(index, 1);
      this.syncQueue.syncing.push(item);
    }
  }

  private moveToFailed(item: OfflineData) {
    const index = this.syncQueue.syncing.indexOf(item);
    if (index !== -1) {
      this.syncQueue.syncing.splice(index, 1);
      this.syncQueue.failed.push(item);
    }
  }

  private moveToPending(item: OfflineData) {
    const index = this.syncQueue.syncing.indexOf(item);
    if (index !== -1) {
      this.syncQueue.syncing.splice(index, 1);
      this.syncQueue.pending.push(item);
      this.sortQueueByPriority();
    }
  }

  private removeFromQueue(item: OfflineData) {
    const index = this.syncQueue.syncing.indexOf(item);
    if (index !== -1) {
      this.syncQueue.syncing.splice(index, 1);
    }
  }

  private compressData(data: any): any {
    // Simple compression by removing null/undefined values
    if (typeof data !== 'object') return data;

    const compressed: any = {};
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        compressed[key] = data[key];
      }
    }
    return compressed;
  }

  private hashData(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPrestigeOfflineMultiplier(): number {
    // Get from prestige system
    return 1;
  }

  private getVIPOfflineMultiplier(): number {
    // Get from VIP system
    return 1;
  }

  // Public methods
  async forceSyncNow() {
    if (!this.isOnline) {
      eventBus.emit('notification:show', {
        message: 'Cannot sync while offline',
        type: 'error',
      });
      return;
    }

    await this.processSyncQueue();
  }

  getQueueStatus(): { pending: number; failed: number; syncing: number } {
    return {
      pending: this.syncQueue.pending.length,
      failed: this.syncQueue.failed.length,
      syncing: this.syncQueue.syncing.length,
    };
  }

  getCacheStatus(): { size: number; maxSize: number; entries: number } {
    return {
      size: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      entries: this.cache.size,
    };
  }

  isOnlineMode(): boolean {
    return this.isOnline;
  }

  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  async clearFailedQueue() {
    this.syncQueue.failed = [];
    await this.persistQueue();
  }

  async retryFailed() {
    this.syncQueue.pending.push(...this.syncQueue.failed);
    this.syncQueue.failed = [];
    this.sortQueueByPriority();
    await this.persistQueue();
    
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.networkListener) {
      this.networkListener();
      this.networkListener = null;
    }

    // Save current state before cleanup
    this.saveCurrentState();
    this.persistQueue();
  }
}

export const offlineSystem = OfflineSystem.getInstance();