/**
 * Energy System
 * Manages play sessions with regenerating energy
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface EnergyState {
  current: number;
  max: number;
  lastUpdate: string;
  regenRate: number; // Minutes per energy
  infiniteUntil?: string;
  bonusEnergy: number;
  dailyRefills: number;
  maxDailyRefills: number;
}

export interface EnergyBoost {
  type: 'watch_ad' | 'purchase' | 'friend_gift' | 'daily_bonus' | 'level_up';
  amount: number;
  cooldown?: number;
}

class EnergySystem {
  private energyState: EnergyState = {
    current: 100,
    max: 100,
    lastUpdate: new Date().toISOString(),
    regenRate: 3, // 3 minutes per energy
    bonusEnergy: 0,
    dailyRefills: 0,
    maxDailyRefills: 3,
  };

  private readonly BASE_MAX_ENERGY = 100;
  private readonly VIP_ENERGY_BONUS = [0, 10, 20, 30, 50, 100]; // Per VIP level
  private regenerationTimer: NodeJS.Timeout | null = null;

  async initialize(userId: string) {
    await this.loadEnergyState(userId);
    this.startRegeneration();
    await this.scheduleEnergyNotifications();
  }

  private async loadEnergyState(userId: string) {
    try {
      const stored = await AsyncStorage.getItem(`energy_${userId}`);
      if (stored) {
        this.energyState = JSON.parse(stored);
        this.calculateRegeneration();
      }
    } catch (error) {
      console.error('Failed to load energy state:', error);
    }
  }

  private calculateRegeneration() {
    const now = new Date();
    const lastUpdate = new Date(this.energyState.lastUpdate);
    const minutesPassed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

    if (this.energyState.current < this.energyState.max) {
      const energyToAdd = Math.floor(minutesPassed / this.energyState.regenRate);
      this.energyState.current = Math.min(
        this.energyState.current + energyToAdd,
        this.energyState.max
      );
      this.energyState.lastUpdate = now.toISOString();
    }
  }

  private startRegeneration() {
    if (this.regenerationTimer) {
      clearInterval(this.regenerationTimer);
    }

    this.regenerationTimer = setInterval(
      () => {
        if (this.energyState.current < this.energyState.max) {
          this.energyState.current++;
          this.energyState.lastUpdate = new Date().toISOString();
          this.saveEnergyState();
        }
      },
      this.energyState.regenRate * 60 * 1000
    );
  }

  // Consume energy for playing
  consumeEnergy(amount: number = 10): {
    success: boolean;
    remaining: number;
    message?: string;
  } {
    // Check for infinite energy
    if (this.energyState.infiniteUntil) {
      const infiniteEnd = new Date(this.energyState.infiniteUntil);
      if (new Date() < infiniteEnd) {
        return {
          success: true,
          remaining: Infinity,
          message: 'Infinite energy active!',
        };
      } else {
        this.energyState.infiniteUntil = undefined;
      }
    }

    if (this.energyState.current >= amount) {
      this.energyState.current -= amount;
      this.saveEnergyState();

      return {
        success: true,
        remaining: this.energyState.current,
      };
    } else {
      return {
        success: false,
        remaining: this.energyState.current,
        message: `Not enough energy! Need ${amount}, have ${this.energyState.current}`,
      };
    }
  }

  // Various ways to get energy
  async watchAdForEnergy(): Promise<EnergyBoost> {
    const amount = 20;
    this.energyState.current = Math.min(
      this.energyState.current + amount,
      this.energyState.max + 50 // Can exceed max by 50
    );

    await this.saveEnergyState();

    return {
      type: 'watch_ad',
      amount,
      cooldown: 30 * 60, // 30 minutes
    };
  }

  async purchaseEnergy(package: 'small' | 'medium' | 'large' | 'infinite'): Promise<EnergyBoost> {
    const packages = {
      small: { amount: 50, cost: 100 },
      medium: { amount: 150, cost: 250 },
      large: { amount: 500, cost: 750 },
      infinite: { duration: 24 * 60 * 60 * 1000, cost: 1500 }, // 24 hours
    };

    const selected = packages[package];

    if (package === 'infinite') {
      const infinitePackage = selected as { duration: number; cost: number };
      this.energyState.infiniteUntil = new Date(
        Date.now() + infinitePackage.duration
      ).toISOString();

      await this.saveEnergyState();

      return {
        type: 'purchase',
        amount: Infinity,
      };
    } else {
      const energyPackage = selected as { amount: number; cost: number };
      this.energyState.current = Math.min(
        this.energyState.current + energyPackage.amount,
        this.energyState.max * 2 // Can have up to 2x max
      );

      await this.saveEnergyState();

      return {
        type: 'purchase',
        amount: energyPackage.amount,
      };
    }
  }

  async acceptFriendEnergy(friendId: string): Promise<EnergyBoost> {
    const amount = 10;
    this.energyState.current = Math.min(this.energyState.current + amount, this.energyState.max);

    await this.saveEnergyState();

    return {
      type: 'friend_gift',
      amount,
    };
  }

  async claimDailyRefill(): Promise<EnergyBoost | null> {
    if (this.energyState.dailyRefills >= this.energyState.maxDailyRefills) {
      return null;
    }

    this.energyState.current = this.energyState.max;
    this.energyState.dailyRefills++;

    await this.saveEnergyState();

    return {
      type: 'daily_bonus',
      amount: this.energyState.max - this.energyState.current,
    };
  }

  // VIP benefits
  applyVIPBonus(vipLevel: number) {
    const bonus = this.VIP_ENERGY_BONUS[Math.min(vipLevel, 5)];
    this.energyState.max = this.BASE_MAX_ENERGY + bonus;

    // Faster regeneration for VIP
    if (vipLevel > 0) {
      this.energyState.regenRate = Math.max(1, 3 - Math.floor(vipLevel / 2));
    }

    // More daily refills for VIP
    this.energyState.maxDailyRefills = 3 + Math.floor(vipLevel / 2);

    this.saveEnergyState();
  }

  // Time-based bonuses
  getTimeBasedBonus(): EnergyBoost | null {
    const hour = new Date().getHours();

    // Morning bonus (6-9 AM)
    if (hour >= 6 && hour < 9) {
      return {
        type: 'daily_bonus',
        amount: 30,
      };
    }

    // Lunch bonus (12-1 PM)
    if (hour >= 12 && hour < 13) {
      return {
        type: 'daily_bonus',
        amount: 20,
      };
    }

    // Evening bonus (6-9 PM)
    if (hour >= 18 && hour < 21) {
      return {
        type: 'daily_bonus',
        amount: 30,
      };
    }

    return null;
  }

  // Get energy status
  getEnergyStatus(): {
    current: number;
    max: number;
    percentage: number;
    timeUntilFull: string;
    canPlay: boolean;
    nextRegenIn: string;
  } {
    const percentage = (this.energyState.current / this.energyState.max) * 100;
    const energyNeeded = this.energyState.max - this.energyState.current;
    const minutesUntilFull = energyNeeded * this.energyState.regenRate;

    return {
      current: this.energyState.current,
      max: this.energyState.max,
      percentage,
      timeUntilFull: this.formatTime(minutesUntilFull * 60),
      canPlay: this.energyState.current >= 10,
      nextRegenIn: this.formatTime(this.energyState.regenRate * 60),
    };
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.floor(seconds)}s`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  // Notifications
  private async scheduleEnergyNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Full energy notification
    if (this.energyState.current < this.energyState.max) {
      const energyNeeded = this.energyState.max - this.energyState.current;
      const secondsUntilFull = energyNeeded * this.energyState.regenRate * 60;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚡ Energy Full!',
          body: 'Your energy is fully recharged. Time to play!',
          data: { type: 'energy_full' },
        },
        trigger: {
          seconds: secondsUntilFull,
        },
      });
    }

    // Daily refill reminders
    const refillTimes = [8, 14, 20]; // 8 AM, 2 PM, 8 PM
    for (const hour of refillTimes) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎁 Free Energy Refill!',
          body: 'Claim your free energy refill now!',
          data: { type: 'energy_refill' },
        },
        trigger: {
          hour,
          minute: 0,
          repeats: true,
        },
      });
    }
  }

  // Save state
  private async saveEnergyState() {
    try {
      await AsyncStorage.setItem(`energy_${Date.now()}`, JSON.stringify(this.energyState));
    } catch (error) {
      console.error('Failed to save energy state:', error);
    }
  }

  // Reset daily refills
  async resetDaily() {
    this.energyState.dailyRefills = 0;
    await this.saveEnergyState();
  }

  // Cleanup
  cleanup() {
    if (this.regenerationTimer) {
      clearInterval(this.regenerationTimer);
      this.regenerationTimer = null;
    }
  }
}

export default new EnergySystem();
