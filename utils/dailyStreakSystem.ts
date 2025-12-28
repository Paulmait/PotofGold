import { offlineManager } from './offlineManager';

export interface DailyStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  totalLogins: number;
  gifts: DailyGift[];
  streakRewards: StreakReward[];
  lastUpdated: Date;
}

export interface DailyGift {
  id: string;
  day: number;
  type: 'coins' | 'gems' | 'powerup' | 'skin' | 'boost';
  amount: number;
  itemId?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  claimed: boolean;
  available: boolean;
}

export interface StreakReward {
  streakDays: number;
  rewards: DailyGift[];
  claimed: boolean;
}

export class DailyStreakSystem {
  private static instance: DailyStreakSystem;
  private streak: DailyStreak | null = null;

  static getInstance(): DailyStreakSystem {
    if (!DailyStreakSystem.instance) {
      DailyStreakSystem.instance = new DailyStreakSystem();
    }
    return DailyStreakSystem.instance;
  }

  // Initialize daily streak
  async initializeStreak(userId: string): Promise<DailyStreak> {
    try {
      const offlineData = await offlineManager.getOfflineData(userId);

      if (offlineData.dailyStreak) {
        this.streak = offlineData.dailyStreak;
        return this.streak;
      }
    } catch (error) {
      console.log('Error loading daily streak data:', error);
    }

    // Create default streak
    this.streak = {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastLoginDate: '',
      totalLogins: 0,
      gifts: this.generateDailyGifts(),
      streakRewards: this.generateStreakRewards(),
      lastUpdated: new Date(),
    };

    await this.saveStreak();
    return this.streak;
  }

  // Generate daily gifts
  private generateDailyGifts(): DailyGift[] {
    const gifts: DailyGift[] = [];

    for (let day = 1; day <= 30; day++) {
      const gift: DailyGift = {
        id: `gift_day_${day}`,
        day,
        type: this.getGiftType(day),
        amount: this.getGiftAmount(day),
        itemId: this.getGiftItemId(day),
        rarity: this.getGiftRarity(day),
        claimed: false,
        available: false,
      };

      gifts.push(gift);
    }

    return gifts;
  }

  // Get gift type based on day
  private getGiftType(day: number): DailyGift['type'] {
    if (day % 7 === 0) return 'skin';
    if (day % 3 === 0) return 'powerup';
    if (day % 2 === 0) return 'gems';
    return 'coins';
  }

  // Get gift amount based on day
  private getGiftAmount(day: number): number {
    if (day % 7 === 0) return 1; // Skin
    if (day % 3 === 0) return 1; // Powerup
    if (day % 2 === 0) return Math.floor(5 + day * 0.5); // Gems
    return Math.floor(10 + day * 2); // Coins
  }

  // Get gift item ID
  private getGiftItemId(day: number): string | undefined {
    if (day % 7 === 0) {
      const skins = ['golden_pot', 'rainbow_pot', 'cosmic_pot', 'flame_pot'];
      return skins[(day / 7 - 1) % skins.length];
    }
    if (day % 3 === 0) {
      const powerups = ['magnet', 'doublePoints', 'slowMotion', 'goldRush'];
      return powerups[(day / 3 - 1) % powerups.length];
    }
    return undefined;
  }

  // Get gift rarity
  private getGiftRarity(day: number): DailyGift['rarity'] {
    if (day % 7 === 0) return 'epic';
    if (day % 3 === 0) return 'rare';
    if (day % 2 === 0) return 'common';
    return 'common';
  }

  // Generate streak rewards
  private generateStreakRewards(): StreakReward[] {
    return [
      {
        streakDays: 7,
        rewards: [
          {
            id: 'streak_7_skin',
            day: 7,
            type: 'skin',
            amount: 1,
            itemId: 'streak_7_exclusive',
            rarity: 'epic',
            claimed: false,
            available: false,
          },
          {
            id: 'streak_7_coins',
            day: 7,
            type: 'coins',
            amount: 100,
            rarity: 'common',
            claimed: false,
            available: false,
          },
        ],
        claimed: false,
      },
      {
        streakDays: 14,
        rewards: [
          {
            id: 'streak_14_skin',
            day: 14,
            type: 'skin',
            amount: 1,
            itemId: 'streak_14_exclusive',
            rarity: 'legendary',
            claimed: false,
            available: false,
          },
          {
            id: 'streak_14_gems',
            day: 14,
            type: 'gems',
            amount: 50,
            rarity: 'epic',
            claimed: false,
            available: false,
          },
        ],
        claimed: false,
      },
      {
        streakDays: 30,
        rewards: [
          {
            id: 'streak_30_skin',
            day: 30,
            type: 'skin',
            amount: 1,
            itemId: 'streak_30_exclusive',
            rarity: 'legendary',
            claimed: false,
            available: false,
          },
          {
            id: 'streak_30_boost',
            day: 30,
            type: 'boost',
            amount: 1,
            itemId: 'permanent_coin_multiplier',
            rarity: 'legendary',
            claimed: false,
            available: false,
          },
        ],
        claimed: false,
      },
    ];
  }

  // Update daily streak
  async updateStreak(): Promise<{
    streakUpdated: boolean;
    newStreak: number;
    giftsAvailable: DailyGift[];
    streakRewardsAvailable: StreakReward[];
  }> {
    if (!this.streak) {
      return {
        streakUpdated: false,
        newStreak: 0,
        giftsAvailable: [],
        streakRewardsAvailable: [],
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = this.streak.lastLoginDate;

    if (lastLogin === today) {
      // Already logged in today
      return {
        streakUpdated: false,
        newStreak: this.streak.currentStreak,
        giftsAvailable: this.getAvailableGifts(),
        streakRewardsAvailable: this.getAvailableStreakRewards(),
      };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastLogin === yesterdayStr) {
      // Consecutive day
      this.streak.currentStreak++;
    } else {
      // Streak broken
      this.streak.currentStreak = 1;
    }

    this.streak.lastLoginDate = today;
    this.streak.totalLogins++;
    this.streak.longestStreak = Math.max(this.streak.longestStreak, this.streak.currentStreak);

    // Update available gifts
    this.updateAvailableGifts();

    // Update available streak rewards
    this.updateAvailableStreakRewards();

    await this.saveStreak();

    return {
      streakUpdated: true,
      newStreak: this.streak.currentStreak,
      giftsAvailable: this.getAvailableGifts(),
      streakRewardsAvailable: this.getAvailableStreakRewards(),
    };
  }

  // Update available gifts
  private updateAvailableGifts(): void {
    if (!this.streak) return;

    this.streak.gifts.forEach((gift) => {
      gift.available = gift.day <= this.streak!.currentStreak && !gift.claimed;
    });
  }

  // Update available streak rewards
  private updateAvailableStreakRewards(): void {
    if (!this.streak) return;

    this.streak.streakRewards.forEach((reward) => {
      reward.claimed = false;
      reward.rewards.forEach((gift) => {
        gift.available = this.streak!.currentStreak >= reward.streakDays && !gift.claimed;
      });
    });
  }

  // Claim daily gift
  async claimDailyGift(giftId: string): Promise<{
    success: boolean;
    gift: DailyGift | null;
    rewards: any;
  }> {
    if (!this.streak) {
      return { success: false, gift: null, rewards: {} };
    }

    const gift = this.streak.gifts.find((g) => g.id === giftId);
    if (!gift || !gift.available || gift.claimed) {
      return { success: false, gift: null, rewards: {} };
    }

    gift.claimed = true;
    await this.saveStreak();

    return {
      success: true,
      gift,
      rewards: {
        type: gift.type,
        amount: gift.amount,
        itemId: gift.itemId,
        rarity: gift.rarity,
      },
    };
  }

  // Claim streak reward
  async claimStreakReward(streakDays: number): Promise<{
    success: boolean;
    rewards: DailyGift[];
  }> {
    if (!this.streak) {
      return { success: false, rewards: [] };
    }

    const streakReward = this.streak.streakRewards.find((r) => r.streakDays === streakDays);
    if (!streakReward || streakReward.claimed || this.streak.currentStreak < streakDays) {
      return { success: false, rewards: [] };
    }

    streakReward.claimed = true;
    streakReward.rewards.forEach((gift) => {
      gift.claimed = true;
    });

    await this.saveStreak();

    return {
      success: true,
      rewards: streakReward.rewards,
    };
  }

  // Get available gifts
  getAvailableGifts(): DailyGift[] {
    if (!this.streak) return [];
    return this.streak.gifts.filter((gift) => gift.available);
  }

  // Get available streak rewards
  getAvailableStreakRewards(): StreakReward[] {
    if (!this.streak) return [];
    return this.streak.streakRewards.filter(
      (reward) => this.streak!.currentStreak >= reward.streakDays && !reward.claimed
    );
  }

  // Get streak statistics
  getStreakStats(): {
    currentStreak: number;
    longestStreak: number;
    totalLogins: number;
    nextReward: number;
  } {
    if (!this.streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalLogins: 0,
        nextReward: 0,
      };
    }

    const nextReward =
      this.streak.streakRewards.find((reward) => this.streak!.currentStreak < reward.streakDays)
        ?.streakDays || 0;

    return {
      currentStreak: this.streak.currentStreak,
      longestStreak: this.streak.longestStreak,
      totalLogins: this.streak.totalLogins,
      nextReward,
    };
  }

  // Save streak
  private async saveStreak(): Promise<void> {
    if (!this.streak) return;

    try {
      await offlineManager.saveOfflineData(this.streak.userId, {
        dailyStreak: this.streak,
      });

      await offlineManager.addPendingAction(this.streak.userId, {
        type: 'streak_update',
        data: this.streak,
      });
    } catch (error) {
      console.log('Error saving streak data:', error);
    }
  }
}

export const dailyStreakSystem = DailyStreakSystem.getInstance();
