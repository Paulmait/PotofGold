/**
 * Addiction Mechanics System
 * Implements psychological hooks and engagement patterns to maximize player retention
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPlayDate: string;
  streakMultiplier: number;
  streakRewards: number[];
}

export interface NearMissEvent {
  timestamp: number;
  scoreDeficit: number;
  almostUnlocked: string;
  emotionalIntensity: number;
}

export interface SocialPressure {
  friendsPlaying: number;
  friendsBeatYou: string[];
  globalRank: number;
  percentileBetter: number;
}

class AddictionMechanicsSystem {
  private streakData: StreakData | null = null;
  private nearMissBuffer: NearMissEvent[] = [];
  private lastSessionEnd: number = 0;
  private progressAnchors: Map<string, number> = new Map();

  // 1. DAILY STREAK SYSTEM - Creates habit formation
  async initializeStreakSystem() {
    const stored = await AsyncStorage.getItem('streakData');
    if (stored) {
      this.streakData = JSON.parse(stored);
      this.checkStreakStatus();
    } else {
      this.streakData = {
        currentStreak: 0,
        longestStreak: 0,
        lastPlayDate: new Date().toISOString(),
        streakMultiplier: 1.0,
        streakRewards: []
      };
    }
  }

  private checkStreakStatus() {
    if (!this.streakData) return;
    
    const lastPlay = new Date(this.streakData.lastPlayDate);
    const now = new Date();
    const hoursSinceLastPlay = (now.getTime() - lastPlay.getTime()) / (1000 * 60 * 60);
    
    // Send notification if streak is about to break
    if (hoursSinceLastPlay > 20 && hoursSinceLastPlay < 24) {
      this.sendStreakWarning();
    }
  }

  // 2. NEAR-MISS MECHANICS - Creates "almost won" feeling
  registerNearMiss(scoreDeficit: number, almostUnlocked: string) {
    const nearMiss: NearMissEvent = {
      timestamp: Date.now(),
      scoreDeficit,
      almostUnlocked,
      emotionalIntensity: this.calculateEmotionalIntensity(scoreDeficit)
    };
    
    this.nearMissBuffer.push(nearMiss);
    
    // Trigger near-miss feedback
    if (nearMiss.emotionalIntensity > 0.8) {
      return {
        showSpecialEffect: true,
        message: `SO CLOSE! Just ${scoreDeficit} points away from ${almostUnlocked}!`,
        offerBoost: true,
        boostCost: Math.floor(scoreDeficit / 10)
      };
    }
    
    return null;
  }

  private calculateEmotionalIntensity(deficit: number): number {
    // Closer misses create stronger emotional response
    if (deficit < 10) return 0.95;
    if (deficit < 50) return 0.85;
    if (deficit < 100) return 0.7;
    if (deficit < 500) return 0.5;
    return 0.3;
  }

  // 3. VARIABLE RATIO REWARDS - Gambling psychology
  calculateReward(baseReward: number): number {
    const random = Math.random();
    
    // 60% normal reward
    if (random < 0.6) return baseReward;
    
    // 25% small bonus (1.5x)
    if (random < 0.85) return Math.floor(baseReward * 1.5);
    
    // 10% medium bonus (3x)
    if (random < 0.95) return Math.floor(baseReward * 3);
    
    // 4% large bonus (5x)
    if (random < 0.99) return Math.floor(baseReward * 5);
    
    // 1% MEGA bonus (10x) - creates excitement
    return Math.floor(baseReward * 10);
  }

  // 4. LOSS AVERSION MECHANICS
  createLossAversion() {
    return {
      // Limited time offers
      flashSale: {
        item: this.getRandomPremiumItem(),
        discount: 70,
        timeLeft: 300, // 5 minutes
        message: "⏰ ENDING SOON! 70% OFF - Only 5 minutes left!"
      },
      
      // Expiring currency
      expiringCoins: {
        amount: 500,
        expiresIn: 86400, // 24 hours
        message: "🔥 Use your 500 bonus coins before they expire!"
      },
      
      // Streak at risk
      streakWarning: {
        currentStreak: this.streakData?.currentStreak || 0,
        hoursLeft: 4,
        message: `⚠️ Your ${this.streakData?.currentStreak} day streak ends in 4 hours!`
      }
    };
  }

  // 5. SOCIAL PRESSURE & FOMO
  generateSocialPressure(userId: string, friends: any[]): SocialPressure {
    const friendsCurrentlyPlaying = friends.filter(f => 
      Date.now() - f.lastSeen < 300000 // Active in last 5 min
    ).length;
    
    const friendsWithHigherScore = friends.filter(f => 
      f.highScore > 0 // Simplified, would check actual user score
    ).map(f => f.name);
    
    return {
      friendsPlaying: friendsCurrentlyPlaying,
      friendsBeatYou: friendsWithHigherScore.slice(0, 3),
      globalRank: Math.floor(Math.random() * 10000) + 1000,
      percentileBetter: Math.floor(Math.random() * 30) + 40
    };
  }

  // 6. PROGRESS ANCHORING - Sunk cost fallacy
  anchorProgress(category: string, progress: number) {
    this.progressAnchors.set(category, progress);
    
    // Remind player of their investment
    if (progress > 75) {
      return {
        showReminder: true,
        message: `You're ${progress}% complete! Don't lose your progress!`,
        highlightProgress: true
      };
    }
    return null;
  }

  // 7. APPOINTMENT MECHANICS - Timed events
  getTimedEvents() {
    const now = new Date();
    const hour = now.getHours();
    
    return {
      // Happy Hour - Double coins
      happyHour: {
        active: hour >= 18 && hour <= 20,
        multiplier: 2,
        nextIn: hour < 18 ? 18 - hour : 24 - hour + 18,
        message: "🎉 HAPPY HOUR: Double coins for 2 hours!"
      },
      
      // Daily Challenge
      dailyChallenge: {
        refreshIn: this.getTimeUntilMidnight(),
        reward: 1000,
        completed: false,
        message: "Complete today's challenge for 1000 coins!"
      },
      
      // Weekend Tournament
      weekendTournament: {
        active: now.getDay() === 0 || now.getDay() === 6,
        prize: 10000,
        message: "🏆 Weekend Tournament: Top 10 win 10,000 coins!"
      }
    };
  }

  // 8. ESCALATING COMMITMENT
  getCommitmentLadder(sessionCount: number) {
    const milestones = [
      { sessions: 1, reward: "Welcome Bonus", coins: 100 },
      { sessions: 3, reward: "New Player Pack", coins: 500 },
      { sessions: 7, reward: "Week Warrior", coins: 1000 },
      { sessions: 14, reward: "Dedicated Player", coins: 2500 },
      { sessions: 30, reward: "Monthly Master", coins: 5000 },
      { sessions: 60, reward: "Expert Status", coins: 10000 },
      { sessions: 100, reward: "Legendary Player", coins: 25000 }
    ];
    
    const nextMilestone = milestones.find(m => m.sessions > sessionCount);
    const progress = nextMilestone 
      ? (sessionCount / nextMilestone.sessions) * 100 
      : 100;
    
    return {
      currentLevel: milestones.filter(m => m.sessions <= sessionCount).length,
      nextMilestone,
      progress,
      sessionsToNext: nextMilestone ? nextMilestone.sessions - sessionCount : 0
    };
  }

  // 9. CURIOSITY GAPS & MYSTERY
  generateMysteryMechanics() {
    return {
      // Mystery Box
      mysteryBox: {
        available: Math.random() > 0.7,
        cost: Math.floor(Math.random() * 500) + 200,
        possibleRewards: "??? to ???",
        guaranteedMinimum: 100,
        message: "🎁 Mystery Box appeared! Contents unknown..."
      },
      
      // Hidden achievements
      secretAchievement: {
        progress: Math.floor(Math.random() * 100),
        hint: this.getRandomHint(),
        reward: "???",
        message: "Secret achievement progress: ??%"
      },
      
      // Random events
      randomEvent: {
        probability: 0.05,
        type: this.getRandomEventType(),
        duration: 60,
        message: "✨ Special event active for 1 minute!"
      }
    };
  }

  // 10. MICRO-REWARDS SYSTEM
  getMicroRewards(action: string) {
    const rewards: Record<string, number> = {
      'app_open': 10,
      'game_start': 5,
      'coin_collect': 1,
      'powerup_use': 3,
      'friend_challenge': 20,
      'watch_ad': 50,
      'share_score': 30,
      'rate_app': 100,
      'invite_friend': 200
    };
    
    return {
      coins: rewards[action] || 0,
      experience: Math.floor((rewards[action] || 0) / 2),
      showAnimation: true,
      stackable: true
    };
  }

  // Notification System for Re-engagement
  async scheduleAddictiveNotifications() {
    // Clear existing
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const notifications = [
      {
        content: {
          title: "🔥 Your streak is on fire!",
          body: "Keep it going - play now for 2x rewards!",
        },
        trigger: { hours: 20, repeats: true }
      },
      {
        content: {
          title: "⚡ Energy recharged!",
          body: "Your free spins are ready. Claim them now!",
        },
        trigger: { hours: 8, repeats: true }
      },
      {
        content: {
          title: "🎁 Mystery gift waiting!",
          body: "A special reward has appeared. Don't miss out!",
        },
        trigger: { hours: 12, repeats: true }
      },
      {
        content: {
          title: "👑 You've been challenged!",
          body: "A friend beat your high score. Reclaim your throne!",
        },
        trigger: { hours: 18, repeats: true }
      },
      {
        content: {
          title: "💰 Coin Rush Hour!",
          body: "Triple coins for the next hour. Play now!",
        },
        trigger: { weekday: 6, hour: 19, repeats: true } // Friday evening
      }
    ];
    
    for (const notif of notifications) {
      await Notifications.scheduleNotificationAsync(notif);
    }
  }

  // Helper Methods
  private getTimeUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  }

  private getRandomPremiumItem(): string {
    const items = [
      "Golden Magnet", "Diamond Multiplier", "Platinum Shield",
      "Rainbow Trail", "Cosmic Pot", "Legendary Boost"
    ];
    return items[Math.floor(Math.random() * items.length)];
  }

  private getRandomHint(): string {
    const hints = [
      "Try collecting in a pattern...",
      "Sometimes less is more...",
      "The answer lies in the rainbow...",
      "Count your perfect catches...",
      "Speed isn't everything..."
    ];
    return hints[Math.floor(Math.random() * hints.length)];
  }

  private getRandomEventType(): string {
    const events = [
      "COIN_RAIN", "SLOW_MOTION", "MAGNET_MADNESS",
      "GOLDEN_MINUTE", "PERFECT_CATCH_BONUS"
    ];
    return events[Math.floor(Math.random() * events.length)];
  }

  private async sendStreakWarning() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚠️ Streak in danger!",
        body: `Your ${this.streakData?.currentStreak} day streak ends soon!`,
        data: { type: 'streak_warning' }
      },
      trigger: null
    });
  }
}

export default new AddictionMechanicsSystem();