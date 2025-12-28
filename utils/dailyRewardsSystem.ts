import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface DailyReward {
  day: number;
  coins: number;
  powerups?: string[];
  skins?: string[];
  multiplier?: number;
  special?: string;
}

export interface DailyRewardProgress {
  currentStreak: number;
  longestStreak: number;
  lastClaimDate: string | null;
  totalDaysClaimed: number;
  currentCycle: number;
  nextRewardDay: number;
  missedYesterday: boolean;
}

export class DailyRewardsSystem {
  private static instance: DailyRewardsSystem;
  private progress: DailyRewardProgress;
  private readonly STORAGE_KEY = 'daily_rewards_progress';

  // Escalating rewards that reset every 30 days
  private readonly rewards: DailyReward[] = [
    { day: 1, coins: 50 },
    { day: 2, coins: 75 },
    { day: 3, coins: 100, powerups: ['magnet'] },
    { day: 4, coins: 125 },
    { day: 5, coins: 150, multiplier: 2 },
    { day: 6, coins: 200 },
    { day: 7, coins: 300, special: 'mystery_box' },
    { day: 8, coins: 175 },
    { day: 9, coins: 200 },
    { day: 10, coins: 250, powerups: ['shield', 'magnet'] },
    { day: 11, coins: 275 },
    { day: 12, coins: 300 },
    { day: 13, coins: 350 },
    { day: 14, coins: 500, special: 'premium_skin' },
    { day: 15, coins: 400, multiplier: 3 },
    { day: 16, coins: 425 },
    { day: 17, coins: 450 },
    { day: 18, coins: 475 },
    { day: 19, coins: 500 },
    { day: 20, coins: 600, powerups: ['gold_rush'] },
    { day: 21, coins: 750, special: 'legendary_crate' },
    { day: 22, coins: 550 },
    { day: 23, coins: 575 },
    { day: 24, coins: 600 },
    { day: 25, coins: 650, multiplier: 4 },
    { day: 26, coins: 700 },
    { day: 27, coins: 750 },
    { day: 28, coins: 800, special: 'epic_bundle' },
    { day: 29, coins: 900 },
    { day: 30, coins: 1500, special: 'monthly_mega_reward' },
  ];

  static getInstance(): DailyRewardsSystem {
    if (!DailyRewardsSystem.instance) {
      DailyRewardsSystem.instance = new DailyRewardsSystem();
    }
    return DailyRewardsSystem.instance;
  }

  constructor() {
    this.progress = {
      currentStreak: 0,
      longestStreak: 0,
      lastClaimDate: null,
      totalDaysClaimed: 0,
      currentCycle: 1,
      nextRewardDay: 1,
      missedYesterday: false,
    };
    this.initialize();
  }

  private async initialize() {
    await this.loadProgress();
    await this.scheduleNotification();
  }

  private async loadProgress() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.progress = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading daily rewards progress:', error);
    }
  }

  private async saveProgress() {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.progress));
    } catch (error) {
      console.error('Error saving daily rewards progress:', error);
    }
  }

  canClaimReward(): boolean {
    if (!this.progress.lastClaimDate) return true;

    const lastClaim = new Date(this.progress.lastClaimDate);
    const now = new Date();

    // Reset to beginning of day for comparison
    lastClaim.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    return now.getTime() > lastClaim.getTime();
  }

  getStreakStatus(): 'active' | 'broken' | 'recoverable' {
    if (!this.progress.lastClaimDate) return 'active';

    const lastClaim = new Date(this.progress.lastClaimDate);
    const now = new Date();
    const daysSinceLastClaim = Math.floor(
      (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastClaim === 1) return 'active';
    if (daysSinceLastClaim === 2) return 'recoverable'; // Missed one day, can recover
    return 'broken'; // Missed more than one day
  }

  async claimReward(): Promise<DailyReward | null> {
    if (!this.canClaimReward()) return null;

    const status = this.getStreakStatus();
    const now = new Date();

    // Handle streak logic
    if (status === 'active') {
      this.progress.currentStreak++;
      this.progress.missedYesterday = false;
    } else if (status === 'recoverable') {
      // Keep streak but mark that they missed yesterday
      this.progress.missedYesterday = true;
    } else {
      // Streak broken, reset
      this.progress.currentStreak = 1;
      this.progress.nextRewardDay = 1;
      this.progress.missedYesterday = false;
    }

    // Update longest streak
    if (this.progress.currentStreak > this.progress.longestStreak) {
      this.progress.longestStreak = this.progress.currentStreak;
    }

    // Get current reward
    const rewardIndex = (this.progress.nextRewardDay - 1) % this.rewards.length;
    const reward = { ...this.rewards[rewardIndex] };

    // Apply streak multipliers for long streaks
    if (this.progress.currentStreak > 30) {
      const streakMultiplier = Math.floor(this.progress.currentStreak / 30) + 1;
      reward.coins = Math.floor(reward.coins * streakMultiplier);
    }

    // Update progress
    this.progress.lastClaimDate = now.toISOString();
    this.progress.totalDaysClaimed++;
    this.progress.nextRewardDay++;

    // Check for cycle completion
    if (this.progress.nextRewardDay > 30) {
      this.progress.nextRewardDay = 1;
      this.progress.currentCycle++;
    }

    await this.saveProgress();
    await this.scheduleNotification();

    return reward;
  }

  async recoverStreak(useGems: boolean = false): Promise<boolean> {
    if (this.getStreakStatus() !== 'recoverable') return false;

    if (useGems) {
      // Deduct gems/coins for streak recovery (implement gem cost logic)
      const cost = Math.min(100 * Math.ceil(this.progress.currentStreak / 7), 500);
      // Deduct cost from user's gems
    }

    // Recover the streak
    this.progress.missedYesterday = false;
    const now = new Date();
    now.setDate(now.getDate() - 1); // Set as if claimed yesterday
    this.progress.lastClaimDate = now.toISOString();

    await this.saveProgress();
    return true;
  }

  getProgress(): DailyRewardProgress {
    return { ...this.progress };
  }

  getNextReward(): DailyReward {
    const rewardIndex = (this.progress.nextRewardDay - 1) % this.rewards.length;
    return { ...this.rewards[rewardIndex] };
  }

  getUpcomingRewards(count: number = 7): DailyReward[] {
    const upcoming: DailyReward[] = [];
    for (let i = 0; i < count; i++) {
      const dayIndex = (this.progress.nextRewardDay + i - 1) % this.rewards.length;
      upcoming.push({ ...this.rewards[dayIndex] });
    }
    return upcoming;
  }

  getAllRewards(): DailyReward[] {
    return [...this.rewards];
  }

  private async scheduleNotification() {
    try {
      // Cancel existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule for tomorrow at 9 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Reward Available! 🎁',
          body: `Day ${this.progress.nextRewardDay} reward is waiting! Don't break your ${this.progress.currentStreak} day streak!`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: tomorrow,
        },
      });

      // Schedule a reminder if streak is at risk (evening notification)
      if (this.progress.currentStreak >= 3) {
        const today = new Date();
        today.setHours(20, 0, 0, 0); // 8 PM today

        if (today.getTime() > Date.now()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Don't lose your streak! ⚠️",
              body: `Claim your daily reward before midnight to keep your ${this.progress.currentStreak} day streak alive!`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
              date: today,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  // Special event multipliers
  isSpecialEventActive(): { active: boolean; multiplier: number; name: string } {
    const now = new Date();
    const day = now.getDay();
    const date = now.getDate();

    // Weekend bonus
    if (day === 0 || day === 6) {
      return { active: true, multiplier: 1.5, name: 'Weekend Bonus' };
    }

    // First day of month mega bonus
    if (date === 1) {
      return { active: true, multiplier: 3, name: 'Monthly Mega Day' };
    }

    // Friday the 13th special
    if (date === 13 && day === 5) {
      return { active: true, multiplier: 13, name: 'Lucky 13' };
    }

    return { active: false, multiplier: 1, name: '' };
  }
}

export const dailyRewardsSystem = DailyRewardsSystem.getInstance();
