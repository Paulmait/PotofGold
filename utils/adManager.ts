import { Platform } from 'react-native';
import { privacyManager } from './privacy';

export interface AdConfig {
  rewardedAdUnitId: string;
  interstitialAdUnitId: string;
  bannerAdUnitId: string;
  testMode: boolean;
}

export interface RewardItem {
  type: 'coins' | 'powerup' | 'doubleReward';
  amount: number;
  description: string;
}

export class AdManager {
  private static instance: AdManager;
  private config: AdConfig;
  private isInitialized = false;
  private rewardedAd: any = null;
  private interstitialAd: any = null;
  private adLoadAttempts = 0;
  private maxAdLoadAttempts = 3;

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  async initialize(config: AdConfig): Promise<void> {
    this.config = config;

    if (this.isInitialized) return;

    try {
      // Initialize AdMob SDK
      // In real implementation, you'd use react-native-google-mobile-ads
      // await mobileAds().initialize();

      this.isInitialized = true;
      this.loadRewardedAd();
      this.loadInterstitialAd();
    } catch (error) {
      console.log('Error initializing AdMob:', error);
    }
  }

  private async loadRewardedAd(): Promise<void> {
    if (this.adLoadAttempts >= this.maxAdLoadAttempts) {
      console.log('Max ad load attempts reached');
      return;
    }

    try {
      // In real implementation:
      // this.rewardedAd = RewardedAd.createForAdRequest(this.config.rewardedAdUnitId);
      // await this.rewardedAd.load();

      // Mock implementation for demo
      this.rewardedAd = { loaded: true, show: this.mockShowRewardedAd };
      this.adLoadAttempts = 0;
    } catch (error) {
      console.log('Error loading rewarded ad:', error);
      this.adLoadAttempts++;
      setTimeout(() => this.loadRewardedAd(), 5000);
    }
  }

  private async loadInterstitialAd(): Promise<void> {
    try {
      // In real implementation:
      // this.interstitialAd = InterstitialAd.createForAdRequest(this.config.interstitialAdUnitId);
      // await this.interstitialAd.load();

      // Mock implementation for demo
      this.interstitialAd = { loaded: true, show: this.mockShowInterstitialAd };
    } catch (error) {
      console.log('Error loading interstitial ad:', error);
    }
  }

  async showRewardedAd(
    rewardType: 'coins' | 'powerup' | 'doubleReward'
  ): Promise<RewardItem | null> {
    if (!this.isInitialized) {
      console.log('AdMob not initialized');
      return null;
    }

    if (!privacyManager.isPersonalizedAdsEnabled()) {
      // Show non-personalized ad or skip
      return this.giveRewardWithoutAd(rewardType);
    }

    try {
      if (!this.rewardedAd?.loaded) {
        await this.loadRewardedAd();
      }

      return new Promise((resolve) => {
        // In real implementation:
        // this.rewardedAd.show()
        //   .then(() => {
        //     const reward = this.getRewardForType(rewardType);
        //     resolve(reward);
        //   })
        //   .catch((error) => {
        //     console.log('Error showing rewarded ad:', error);
        //     resolve(null);
        //   });

        // Mock implementation
        setTimeout(() => {
          const reward = this.getRewardForType(rewardType);
          resolve(reward);
        }, 1000);
      });
    } catch (error) {
      console.log('Error showing rewarded ad:', error);
      return null;
    }
  }

  async showInterstitialAd(): Promise<boolean> {
    if (!this.isInitialized || !privacyManager.isPersonalizedAdsEnabled()) {
      return false;
    }

    try {
      if (!this.interstitialAd?.loaded) {
        await this.loadInterstitialAd();
      }

      // In real implementation:
      // await this.interstitialAd.show();

      // Mock implementation
      return true;
    } catch (error) {
      console.log('Error showing interstitial ad:', error);
      return false;
    }
  }

  private getRewardForType(type: 'coins' | 'powerup' | 'doubleReward'): RewardItem {
    switch (type) {
      case 'coins':
        return {
          type: 'coins',
          amount: 25,
          description: '25 coins earned!',
        };
      case 'powerup':
        return {
          type: 'powerup',
          amount: 1,
          description: 'Free power-up earned!',
        };
      case 'doubleReward':
        return {
          type: 'doubleReward',
          amount: 2,
          description: 'Double rewards activated!',
        };
      default:
        return {
          type: 'coins',
          amount: 25,
          description: '25 coins earned!',
        };
    }
  }

  private giveRewardWithoutAd(type: 'coins' | 'powerup' | 'doubleReward'): RewardItem {
    // Give smaller reward without ad for privacy compliance
    const reward = this.getRewardForType(type);
    reward.amount = Math.floor(reward.amount * 0.5); // 50% of normal reward
    reward.description = `${reward.amount} coins (privacy mode)`;
    return reward;
  }

  // Mock implementations for demo
  private mockShowRewardedAd = async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(resolve, 3000); // Simulate 3-second ad
    });
  };

  private mockShowInterstitialAd = async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(resolve, 2000); // Simulate 2-second ad
    });
  };

  // Ad frequency capping
  private lastAdShown = 0;
  private readonly minAdInterval = 60000; // 1 minute

  canShowAd(): boolean {
    const now = Date.now();
    if (now - this.lastAdShown < this.minAdInterval) {
      return false;
    }
    this.lastAdShown = now;
    return true;
  }

  // Age-appropriate content
  isAgeAppropriate(userAge?: number): boolean {
    if (!userAge) return true;
    return userAge >= 13; // COPPA compliance
  }
}

export const adManager = AdManager.getInstance();
