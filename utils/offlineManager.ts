import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface OfflineData {
  userId: string;
  coins: number;
  highScore: number;
  gamesPlayed: number;
  achievements: string[];
  purchases: any[];
  lastSync: number;
  pendingActions: OfflineAction[];
}

export interface OfflineAction {
  id: string;
  type: 'score_update' | 'coin_update' | 'purchase' | 'achievement';
  data: any;
  timestamp: number;
}

export class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = true;
  private syncQueue: OfflineAction[] = [];
  private syncInProgress: boolean = false;

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  async initialize(): Promise<void> {
    // Monitor network connectivity
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncPendingActions();
      }
    });

    // Load offline data
    await this.loadOfflineData();
  }

  // Check if we're online
  isConnected(): boolean {
    return this.isOnline;
  }

  // Save data locally (works offline)
  async saveOfflineData(userId: string, data: Partial<OfflineData>): Promise<void> {
    try {
      const key = `offline_data_${userId}`;
      const existing = await this.getOfflineData(userId);
      
      const updatedData: OfflineData = {
        userId,
        coins: data.coins ?? existing.coins ?? 0,
        highScore: data.highScore ?? existing.highScore ?? 0,
        gamesPlayed: data.gamesPlayed ?? existing.gamesPlayed ?? 0,
        achievements: data.achievements ?? existing.achievements ?? [],
        purchases: data.purchases ?? existing.purchases ?? [],
        lastSync: Date.now(),
        pendingActions: existing.pendingActions ?? [],
      };

      await AsyncStorage.setItem(key, JSON.stringify(updatedData));
    } catch (error) {
      console.log('Error saving offline data:', error);
    }
  }

  // Get offline data
  async getOfflineData(userId: string): Promise<OfflineData> {
    try {
      const key = `offline_data_${userId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('Error loading offline data:', error);
    }

    // Return default data if none exists
    return {
      userId,
      coins: 0,
      highScore: 0,
      gamesPlayed: 0,
      achievements: [],
      purchases: [],
      lastSync: Date.now(),
      pendingActions: [],
    };
  }

  // Add action to sync queue
  async addPendingAction(userId: string, action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<void> {
    try {
      const offlineData = await this.getOfflineData(userId);
      
      const newAction: OfflineAction = {
        id: `action_${Date.now()}_${Math.random()}`,
        ...action,
        timestamp: Date.now(),
      };

      offlineData.pendingActions.push(newAction);
      await this.saveOfflineData(userId, offlineData);
      
      // Try to sync immediately if online
      if (this.isOnline) {
        this.syncPendingActions();
      }
    } catch (error) {
      console.log('Error adding pending action:', error);
    }
  }

  // Sync pending actions when online
  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    
    try {
      // Get all offline data files
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('offline_data_'));
      
      for (const key of offlineKeys) {
        const userId = key.replace('offline_data_', '');
        const offlineData = await this.getOfflineData(userId);
        
        if (offlineData.pendingActions.length > 0) {
          await this.syncUserActions(userId, offlineData.pendingActions);
          
          // Clear synced actions
          offlineData.pendingActions = [];
          await this.saveOfflineData(userId, offlineData);
        }
      }
    } catch (error) {
      console.log('Error syncing pending actions:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync actions for a specific user
  private async syncUserActions(userId: string, actions: OfflineAction[]): Promise<void> {
    try {
      for (const action of actions) {
        switch (action.type) {
          case 'score_update':
            await this.syncScoreUpdate(userId, action.data);
            break;
          case 'coin_update':
            await this.syncCoinUpdate(userId, action.data);
            break;
          case 'purchase':
            await this.syncPurchase(userId, action.data);
            break;
          case 'achievement':
            await this.syncAchievement(userId, action.data);
            break;
        }
      }
    } catch (error) {
      console.log('Error syncing user actions:', error);
    }
  }

  // Sync score update to Firebase
  private async syncScoreUpdate(userId: string, data: any): Promise<void> {
    // In real implementation, you'd update Firebase here
    console.log('Syncing score update:', { userId, data });
  }

  // Sync coin update to Firebase
  private async syncCoinUpdate(userId: string, data: any): Promise<void> {
    // In real implementation, you'd update Firebase here
    console.log('Syncing coin update:', { userId, data });
  }

  // Sync purchase to Firebase
  private async syncPurchase(userId: string, data: any): Promise<void> {
    // In real implementation, you'd update Firebase here
    console.log('Syncing purchase:', { userId, data });
  }

  // Sync achievement to Firebase
  private async syncAchievement(userId: string, data: any): Promise<void> {
    // In real implementation, you'd update Firebase here
    console.log('Syncing achievement:', { userId, data });
  }

  // Update score (works offline)
  async updateScore(userId: string, score: number): Promise<void> {
    const offlineData = await this.getOfflineData(userId);
    
    // Update local data
    if (score > offlineData.highScore) {
      offlineData.highScore = score;
    }
    offlineData.gamesPlayed += 1;
    
    await this.saveOfflineData(userId, offlineData);
    
    // Add to sync queue
    await this.addPendingAction(userId, {
      type: 'score_update',
      data: { score, highScore: offlineData.highScore, gamesPlayed: offlineData.gamesPlayed }
    });
  }

  // Update coins (works offline)
  async updateCoins(userId: string, coins: number): Promise<void> {
    const offlineData = await this.getOfflineData(userId);
    offlineData.coins += coins;
    
    await this.saveOfflineData(userId, offlineData);
    
    // Add to sync queue
    await this.addPendingAction(userId, {
      type: 'coin_update',
      data: { coins: offlineData.coins, change: coins }
    });
  }

  // Add achievement (works offline)
  async addAchievement(userId: string, achievement: string): Promise<void> {
    const offlineData = await this.getOfflineData(userId);
    
    if (!offlineData.achievements.includes(achievement)) {
      offlineData.achievements.push(achievement);
      await this.saveOfflineData(userId, offlineData);
      
      // Add to sync queue
      await this.addPendingAction(userId, {
        type: 'achievement',
        data: { achievement, timestamp: Date.now() }
      });
    }
  }

  // Record purchase (works offline)
  async recordPurchase(userId: string, purchase: any): Promise<void> {
    const offlineData = await this.getOfflineData(userId);
    offlineData.purchases.push(purchase);
    
    await this.saveOfflineData(userId, offlineData);
    
    // Add to sync queue
    await this.addPendingAction(userId, {
      type: 'purchase',
      data: purchase
    });
  }

  // Get offline status
  getOfflineStatus(): { isOnline: boolean; pendingActions: number; lastSync: number } {
    return {
      isOnline: this.isOnline,
      pendingActions: this.syncQueue.length,
      lastSync: Date.now(),
    };
  }

  // Clear all offline data (for testing)
  async clearAllOfflineData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('offline_data_'));
      await AsyncStorage.multiRemove(offlineKeys);
    } catch (error) {
      console.log('Error clearing offline data:', error);
    }
  }
}

export const offlineManager = OfflineManager.getInstance(); 