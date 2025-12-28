import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface OfflineData {
  // Core user data
  userId?: string;
  authState?: any;
  userProfile?: any;

  // Game progress
  gameState?: any;
  progression?: any;
  score?: number;
  coins?: number;
  level?: number;
  highScore?: number;
  gamesPlayed?: number;

  // Collections and unlocks
  unlocks?: string[];
  skinCollection?: any;
  powerUpCollection?: any;
  stateCollection?: any;
  unlockTree?: any;
  achievements?: any[];
  purchases?: any[];

  // Systems
  missions?: any;
  dailyStreak?: any;
  seasonPass?: any;
  chapterProgress?: any;
  metaGame?: any;
  blockageState?: any;
  adRewards?: any;

  // Settings
  settings?: any;
  privacySettings?: any;

  // Analytics
  analytics?: any;
  soundUsage?: any;
  musicUsage?: any;

  // Sync
  pendingActions?: OfflineAction[];

  // Timestamps
  lastSync?: number;
  lastUpdated?: number;
}

export interface OfflineAction {
  id: string;
  timestamp: number;
  type:
    | 'score_update'
    | 'coin_update'
    | 'purchase'
    | 'achievement'
    | 'ad_rewards_update'
    | 'user_creation'
    | 'blockage_update'
    | 'chapter_progress_update'
    | 'streak_update'
    | 'game_state_update'
    | 'meta_game_update'
    | 'mission_update'
    | 'powerup_update'
    | 'progression_update'
    | 'season_pass_update'
    | 'skin_collection_update'
    | 'state_collection_update'
    | 'unlock_tree_update'
    | 'sound_usage'
    | 'music_usage'
    | 'pause_trigger_log';
  data: any;
  userId: string;
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
    NetInfo.addEventListener((state) => {
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

  async loadOfflineData(userId: string): Promise<OfflineData | null> {
    try {
      const data = await AsyncStorage.getItem(`offline_data_${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading offline data:', error);
      return null;
    }
  }

  // Add action to sync queue
  async addPendingAction(
    userId: string,
    action: Omit<OfflineAction, 'id' | 'timestamp' | 'userId'>
  ): Promise<void> {
    try {
      const offlineData = await this.getOfflineData(userId);

      const newAction: OfflineAction = {
        id: `action_${Date.now()}_${Math.random()}`,
        ...action,
        timestamp: Date.now(),
        userId,
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
      const offlineKeys = keys.filter((key) => key.startsWith('offline_data_'));

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
      data: { score, highScore: offlineData.highScore, gamesPlayed: offlineData.gamesPlayed },
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
      data: { coins: offlineData.coins, change: coins },
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
        data: { achievement, timestamp: Date.now() },
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
      data: purchase,
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
      const offlineKeys = keys.filter((key) => key.startsWith('offline_data_'));
      await AsyncStorage.multiRemove(offlineKeys);
    } catch (error) {
      console.log('Error clearing offline data:', error);
    }
  }
}

export const offlineManager = OfflineManager.getInstance();
