import { offlineManager } from './offlineManager';

export interface AdReward {
  id: string;
  type: 'coins' | 'gems' | 'powerup' | 'skin' | 'boost' | 'multiplier';
  amount: number;
  itemId?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  adType: 'rewarded' | 'interstitial' | 'banner';
  duration: number; // seconds
  cooldown: number; // minutes
  lastWatched: Date | null;
  available: boolean;
}

export interface AdCampaign {
  id: string;
  name: string;
  description: string;
  rewards: AdReward[];
  requirements: {
    level: number;
    coins: number;
    achievements: string[];
  };
  active: boolean;
  startDate: Date;
  endDate: Date;
}

export interface AdRewardsProgress {
  userId: string;
  watchedAds: string[];
  totalAdsWatched: number;
  totalRewardsEarned: {
    coins: number;
    gems: number;
    powerups: number;
    skins: number;
  };
  activeCampaigns: AdCampaign[];
  dailyAdLimit: number;
  adsWatchedToday: number;
  lastAdDate: string;
  lastUpdated: Date;
}

export class AdRewardsSystem {
  private static instance: AdRewardsSystem;
  private progress: AdRewardsProgress | null = null;

  static getInstance(): AdRewardsSystem {
    if (!AdRewardsSystem.instance) {
      AdRewardsSystem.instance = new AdRewardsSystem();
    }
    return AdRewardsSystem.instance;
  }

  // Initialize ad rewards
  async initializeAdRewards(userId: string): Promise<AdRewardsProgress> {
    try {
      const offlineData = await offlineManager.getOfflineData(userId);
      
      if (offlineData.adRewards) {
        this.progress = offlineData.adRewards;
        return this.progress;
      }
    } catch (error) {
      console.log('Error loading ad rewards data:', error);
    }

    // Create default ad rewards progress
    this.progress = {
      userId,
      watchedAds: [],
      totalAdsWatched: 0,
      totalRewardsEarned: {
        coins: 0,
        gems: 0,
        powerups: 0,
        skins: 0,
      },
      activeCampaigns: this.generateDefaultCampaigns(),
      dailyAdLimit: 10,
      adsWatchedToday: 0,
      lastAdDate: '',
      lastUpdated: new Date(),
    };

    await this.saveAdRewards();
    return this.progress;
  }

  // Generate default campaigns
  private generateDefaultCampaigns(): AdCampaign[] {
    return [
      {
        id: 'daily_coins_campaign',
        name: 'Daily Coin Boost',
        description: 'Watch ads to earn bonus coins',
        rewards: [
          {
            id: 'daily_coins_reward',
            type: 'coins',
            amount: 25,
            rarity: 'common',
            adType: 'rewarded',
            duration: 30,
            cooldown: 60,
            lastWatched: null,
            available: true,
          },
        ],
        requirements: {
          level: 1,
          coins: 0,
          achievements: [],
        },
        active: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      {
        id: 'powerup_campaign',
        name: 'Power-up Boost',
        description: 'Watch ads to get free power-ups',
        rewards: [
          {
            id: 'magnet_powerup_reward',
            type: 'powerup',
            amount: 1,
            itemId: 'magnet',
            rarity: 'rare',
            adType: 'rewarded',
            duration: 30,
            cooldown: 120,
            lastWatched: null,
            available: true,
          },
        ],
        requirements: {
          level: 3,
          coins: 100,
          achievements: ['first_combo'],
        },
        active: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'multiplier_campaign',
        name: 'Coin Multiplier',
        description: 'Watch ads to get coin multipliers',
        rewards: [
          {
            id: 'double_coins_reward',
            type: 'multiplier',
            amount: 2,
            rarity: 'epic',
            adType: 'rewarded',
            duration: 30,
            cooldown: 180,
            lastWatched: null,
            available: true,
          },
        ],
        requirements: {
          level: 5,
          coins: 500,
          achievements: ['combo_master'],
        },
        active: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'skin_campaign',
        name: 'Exclusive Skins',
        description: 'Watch ads to unlock exclusive pot skins',
        rewards: [
          {
            id: 'exclusive_skin_reward',
            type: 'skin',
            amount: 1,
            itemId: 'ad_exclusive_skin',
            rarity: 'legendary',
            adType: 'rewarded',
            duration: 45,
            cooldown: 1440, // 24 hours
            lastWatched: null,
            available: true,
          },
        ],
        requirements: {
          level: 10,
          coins: 1000,
          achievements: ['obstacle_avoider'],
        },
        active: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  // Watch ad and earn reward
  async watchAd(campaignId: string, rewardId: string): Promise<{
    success: boolean;
    reward: AdReward | null;
    rewards: any;
  }> {
    if (!this.progress) {
      return { success: false, reward: null, rewards: {} };
    }

    const campaign = this.progress.activeCampaigns.find(c => c.id === campaignId);
    if (!campaign || !campaign.active) {
      return { success: false, reward: null, rewards: {} };
    }

    const reward = campaign.rewards.find(r => r.id === rewardId);
    if (!reward || !reward.available) {
      return { success: false, reward: null, rewards: {} };
    }

    // Check daily limit
    if (this.progress.adsWatchedToday >= this.progress.dailyAdLimit) {
      return { success: false, reward: null, rewards: {} };
    }

    // Check cooldown
    if (reward.lastWatched) {
      const timeSinceLastWatch = Date.now() - reward.lastWatched.getTime();
      const cooldownMs = reward.cooldown * 60 * 1000;
      if (timeSinceLastWatch < cooldownMs) {
        return { success: false, reward: null, rewards: {} };
      }
    }

    // Update progress
    reward.lastWatched = new Date();
    this.progress.watchedAds.push(rewardId);
    this.progress.totalAdsWatched++;
    this.progress.adsWatchedToday++;

    // Update total rewards earned
    switch (reward.type) {
      case 'coins':
        this.progress.totalRewardsEarned.coins += reward.amount;
        break;
      case 'gems':
        this.progress.totalRewardsEarned.gems += reward.amount;
        break;
      case 'powerup':
        this.progress.totalRewardsEarned.powerups += reward.amount;
        break;
      case 'skin':
        this.progress.totalRewardsEarned.skins += reward.amount;
        break;
    }

    await this.saveAdRewards();

    return {
      success: true,
      reward,
      rewards: {
        type: reward.type,
        amount: reward.amount,
        itemId: reward.itemId,
        rarity: reward.rarity,
      },
    };
  }

  // Get available ad rewards
  getAvailableAdRewards(): {
    campaign: AdCampaign;
    rewards: AdReward[];
  }[] {
    if (!this.progress) return [];

    return this.progress.activeCampaigns
      .filter(campaign => campaign.active)
      .map(campaign => ({
        campaign,
        rewards: campaign.rewards.filter(reward => {
          if (!reward.available) return false;
          
          // Check cooldown
          if (reward.lastWatched) {
            const timeSinceLastWatch = Date.now() - reward.lastWatched.getTime();
            const cooldownMs = reward.cooldown * 60 * 1000;
            if (timeSinceLastWatch < cooldownMs) return false;
          }
          
          // Check daily limit
          if (this.progress!.adsWatchedToday >= this.progress!.dailyAdLimit) return false;
          
          return true;
        }),
      }))
      .filter(result => result.rewards.length > 0);
  }

  // Get ad statistics
  getAdStats(): {
    totalAdsWatched: number;
    adsWatchedToday: number;
    dailyLimit: number;
    totalRewards: any;
  } {
    if (!this.progress) {
      return {
        totalAdsWatched: 0,
        adsWatchedToday: 0,
        dailyLimit: 0,
        totalRewards: {},
      };
    }

    return {
      totalAdsWatched: this.progress.totalAdsWatched,
      adsWatchedToday: this.progress.adsWatchedToday,
      dailyLimit: this.progress.dailyAdLimit,
      totalRewards: this.progress.totalRewardsEarned,
    };
  }

  // Reset daily ad count
  async resetDailyAdCount(): Promise<void> {
    if (!this.progress) return;

    const today = new Date().toISOString().split('T')[0];
    if (this.progress.lastAdDate !== today) {
      this.progress.adsWatchedToday = 0;
      this.progress.lastAdDate = today;
      await this.saveAdRewards();
    }
  }

  // Increase daily ad limit (premium feature)
  async increaseDailyAdLimit(amount: number): Promise<boolean> {
    if (!this.progress) return false;

    this.progress.dailyAdLimit += amount;
    await this.saveAdRewards();
    return true;
  }

  // Save ad rewards
  private async saveAdRewards(): Promise<void> {
    if (!this.progress) return;

    try {
      await offlineManager.saveOfflineData(this.progress.userId, {
        adRewards: this.progress,
      });

      await offlineManager.addPendingAction(this.progress.userId, {
        type: 'ad_rewards_update',
        data: this.progress,
      });
    } catch (error) {
      console.log('Error saving ad rewards data:', error);
    }
  }
}

export const adRewardsSystem = AdRewardsSystem.getInstance(); 