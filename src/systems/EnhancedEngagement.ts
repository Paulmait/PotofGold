/**
 * Enhanced Engagement System
 * Competitive mobile game mechanics for maximum retention
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';

// ========== CORE ENGAGEMENT LOOPS ==========

export class DopamineScheduler {
  private rewardHistory: number[] = [];
  private sessionStartTime: number = 0;
  
  // Optimal reward timing based on neuroscience
  scheduleRewards(sessionTime: number): RewardEvent | null {
    const optimalIntervals = [30, 90, 180, 300, 600]; // seconds
    const currentInterval = optimalIntervals.find(t => 
      Math.abs(sessionTime - t) < 5
    );
    
    if (currentInterval) {
      return this.generateRewardEvent(currentInterval);
    }
    return null;
  }
  
  private generateRewardEvent(timing: number): RewardEvent {
    const intensity = this.calculateIntensity(timing);
    return {
      type: this.selectRewardType(intensity),
      value: this.calculateRewardValue(intensity),
      animation: intensity > 0.7 ? 'epic' : 'normal',
      sound: intensity > 0.7 ? 'jackpot' : 'coin'
    };
  }
  
  private calculateIntensity(timing: number): number {
    // Variable ratio schedule - unpredictable rewards are most addictive
    const random = Math.random();
    const timeBonus = Math.min(timing / 600, 1); // Longer play = better rewards
    return random * 0.7 + timeBonus * 0.3;
  }
  
  private selectRewardType(intensity: number): string {
    if (intensity > 0.9) return 'legendary_item';
    if (intensity > 0.7) return 'rare_skin';
    if (intensity > 0.5) return 'power_up_bundle';
    if (intensity > 0.3) return 'coin_shower';
    return 'small_bonus';
  }
  
  private calculateRewardValue(intensity: number): number {
    const base = 100;
    const multiplier = Math.floor(1 + intensity * 10);
    // Add randomness for excitement
    const variance = Math.random() * 0.3 + 0.85; // 85%-115%
    return Math.floor(base * multiplier * variance);
  }
}

// ========== FOMO MECHANICS ==========

export class FOMOEngine {
  private activeEvents: LimitedTimeEvent[] = [];
  
  generateDailyEvents(): LimitedTimeEvent[] {
    const now = Date.now();
    return [
      {
        id: 'flash_sale',
        type: 'sale',
        title: '⚡ FLASH SALE - 80% OFF!',
        description: 'Premium Cart Bundle',
        endTime: now + 3600000, // 1 hour
        urgency: 'critical',
        discount: 80,
        originalPrice: 999,
        salePrice: 199
      },
      {
        id: 'golden_hour',
        type: 'multiplier',
        title: '🌟 GOLDEN HOUR - 3X COINS!',
        description: 'All coins worth triple',
        endTime: now + 1800000, // 30 min
        urgency: 'high',
        multiplier: 3
      },
      {
        id: 'mystery_box',
        type: 'gacha',
        title: '🎁 MYSTERY BOX APPEARS!',
        description: 'Contains 1 guaranteed legendary',
        endTime: now + 900000, // 15 min
        urgency: 'extreme',
        cost: 500
      }
    ];
  }
  
  calculateUrgencyLevel(event: LimitedTimeEvent): UrgencyIndicator {
    const timeLeft = event.endTime - Date.now();
    const minutes = Math.floor(timeLeft / 60000);
    
    if (minutes < 5) {
      return {
        level: 'critical',
        color: '#FF0000',
        animation: 'pulse_fast',
        message: `ENDING IN ${minutes} MINUTES!`,
        haptic: 'heavy'
      };
    } else if (minutes < 15) {
      return {
        level: 'high',
        color: '#FF6600',
        animation: 'pulse_medium',
        message: `Only ${minutes} minutes left!`,
        haptic: 'medium'
      };
    } else {
      return {
        level: 'normal',
        color: '#FFD700',
        animation: 'pulse_slow',
        message: `${minutes} minutes remaining`,
        haptic: 'light'
      };
    }
  }
}

// ========== COMPETITIVE PRESSURE ==========

export class SocialCompetition {
  async generateCompetitivePressure(userId: string): Promise<CompetitivePressure> {
    // Simulated competitive data - would connect to real multiplayer
    const friendScores = await this.getFriendScores(userId);
    const globalRank = await this.getGlobalRank(userId);
    const nearbyPlayers = await this.getNearbyPlayers(userId);
    
    return {
      friendsAhead: friendScores.filter(f => f.score > 0).length,
      nextFriendGap: friendScores[0]?.score || 1000,
      globalRank: globalRank,
      percentile: this.calculatePercentile(globalRank),
      nearbyRivals: nearbyPlayers.slice(0, 3),
      motivationalMessage: this.generateMotivation(globalRank),
      suggestedAction: this.suggestCompetitiveAction(friendScores)
    };
  }
  
  private async getFriendScores(userId: string): Promise<any[]> {
    // Mock data - would fetch from Firebase
    return [
      { name: 'Alex', score: 15420, avatar: '🦊', status: 'online' },
      { name: 'Sam', score: 14200, avatar: '🐯', status: 'playing' },
      { name: 'Jordan', score: 13100, avatar: '🦁', status: 'offline' }
    ];
  }
  
  private calculatePercentile(rank: number): number {
    // Top percentile calculation
    const totalPlayers = 1000000; // Simulated
    return Math.max(1, 100 - (rank / totalPlayers * 100));
  }
  
  private generateMotivation(rank: number): string {
    if (rank <= 100) return "🏆 You're in the TOP 100!";
    if (rank <= 1000) return "⭐ Top 1000 player!";
    if (rank <= 10000) return "🔥 Keep climbing!";
    return "💪 Beat your friends!";
  }
  
  private suggestCompetitiveAction(friends: any[]): string {
    const topFriend = friends[0];
    if (!topFriend) return "Invite friends to compete!";
    
    const gap = topFriend.score;
    if (gap < 100) return `Beat ${topFriend.name} by just ${gap} points!`;
    if (gap < 1000) return `${topFriend.name} is ${gap} ahead - catch up!`;
    return `Challenge ${topFriend.name} to a duel!`;
  }
  
  private async getGlobalRank(userId: string): Promise<number> {
    // Mock ranking
    return Math.floor(Math.random() * 50000) + 1000;
  }
  
  private async getNearbyPlayers(userId: string): Promise<any[]> {
    return [
      { name: 'Player_9999', score: 16000, rank: 9999 },
      { name: 'You', score: 15500, rank: 10000 },
      { name: 'Player_10001', score: 15400, rank: 10001 }
    ];
  }
}

// ========== PROGRESSION PSYCHOLOGY ==========

export class ProgressionPsychology {
  private progressAnchors: Map<string, number> = new Map();
  
  calculateProgressFeedback(current: number, target: number): ProgressFeedback {
    const progress = current / target;
    const remaining = target - current;
    
    // Psychological anchoring - make progress feel closer
    const psychologicalProgress = this.applyPsychologicalAnchoring(progress);
    
    return {
      actualProgress: progress,
      displayProgress: psychologicalProgress,
      message: this.generateProgressMessage(psychologicalProgress, remaining),
      visualization: this.selectVisualization(psychologicalProgress),
      motivator: this.selectMotivator(progress, remaining)
    };
  }
  
  private applyPsychologicalAnchoring(progress: number): number {
    // Make early progress feel faster, late progress feel imminent
    if (progress < 0.2) return progress * 1.5; // Boost early progress
    if (progress > 0.8) return 0.8 + (progress - 0.8) * 1.5; // Accelerate near completion
    return progress;
  }
  
  private generateProgressMessage(progress: number, remaining: number): string {
    if (progress < 0.1) return "Great start! Keep going!";
    if (progress < 0.3) return "Building momentum!";
    if (progress < 0.5) return "Halfway there!";
    if (progress < 0.7) return "You're crushing it!";
    if (progress < 0.9) return `Almost there! Just ${remaining} to go!`;
    if (progress < 1.0) return "SO CLOSE! Don't stop now!";
    return "COMPLETE! 🎉";
  }
  
  private selectVisualization(progress: number): string {
    if (progress < 0.25) return 'filling_bar';
    if (progress < 0.5) return 'growing_circle';
    if (progress < 0.75) return 'climbing_mountain';
    if (progress < 0.95) return 'racing_finish';
    return 'celebration_burst';
  }
  
  private selectMotivator(progress: number, remaining: number): Motivator {
    return {
      type: progress > 0.8 ? 'near_miss' : 'encouragement',
      intensity: progress > 0.9 ? 'extreme' : 'normal',
      action: remaining < 100 ? 'offer_boost' : 'show_progress',
      reward_preview: progress > 0.7
    };
  }
}

// ========== HABIT FORMATION ==========

export class HabitFormation {
  private routineData: RoutineData = {
    preferredPlayTime: [],
    averageSessionLength: 0,
    dailyPattern: new Map()
  };
  
  async analyzeAndReinforce(): Promise<HabitReinforcement> {
    const patterns = await this.detectPlayPatterns();
    const optimalTime = this.calculateOptimalPlayTime(patterns);
    
    return {
      notifications: this.scheduleHabitNotifications(optimalTime),
      rewards: this.createRoutineRewards(patterns),
      challenges: this.generateHabitChallenges(patterns)
    };
  }
  
  private async detectPlayPatterns(): Promise<PlayPattern> {
    const history = await AsyncStorage.getItem('play_history');
    const sessions = history ? JSON.parse(history) : [];
    
    // Analyze play times
    const hourCounts = new Map<number, number>();
    sessions.forEach((session: any) => {
      const hour = new Date(session.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    // Find peak play hours
    const peakHour = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 20; // Default 8 PM
    
    return {
      peakHour,
      averageDuration: this.calculateAverageDuration(sessions),
      frequency: sessions.length / 30, // Sessions per day over 30 days
      consistency: this.calculateConsistency(sessions)
    };
  }
  
  private calculateOptimalPlayTime(pattern: PlayPattern): number {
    // Return hour of day (0-23) for optimal engagement
    return pattern.peakHour;
  }
  
  private scheduleHabitNotifications(optimalHour: number): NotificationSchedule[] {
    const now = new Date();
    const notifications: NotificationSchedule[] = [];
    
    // Prime time notification
    notifications.push({
      id: 'prime_time',
      title: '🎮 Your favorite time to play!',
      body: 'Your friends are online now!',
      hour: optimalHour,
      priority: 'high'
    });
    
    // Pre-prime reminder
    notifications.push({
      id: 'pre_prime',
      title: '⏰ Game time in 30 minutes!',
      body: 'Prepare for your daily bonus!',
      hour: optimalHour - 0.5,
      priority: 'medium'
    });
    
    // Streak protection
    notifications.push({
      id: 'streak_protect',
      title: '🔥 Protect your streak!',
      body: 'Play now to keep your 7-day streak!',
      hour: 22, // Late evening
      priority: 'critical'
    });
    
    return notifications;
  }
  
  private createRoutineRewards(pattern: PlayPattern): RoutineReward[] {
    return [
      {
        trigger: 'same_time_3_days',
        reward: 500,
        message: 'Punctual Player Bonus!'
      },
      {
        trigger: 'weekly_routine',
        reward: 2000,
        message: 'Weekly Warrior Reward!'
      },
      {
        trigger: 'morning_player',
        reward: 300,
        message: 'Early Bird Bonus!'
      }
    ];
  }
  
  private generateHabitChallenges(pattern: PlayPattern): Challenge[] {
    return [
      {
        id: 'daily_habit',
        title: 'Play 7 days in a row',
        reward: 5000,
        progress: 0,
        target: 7
      },
      {
        id: 'time_master',
        title: `Play at ${pattern.peakHour}:00 for 3 days`,
        reward: 1000,
        progress: 0,
        target: 3
      }
    ];
  }
  
  private calculateAverageDuration(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((sum, s) => sum + s.duration, 0);
    return total / sessions.length;
  }
  
  private calculateConsistency(sessions: any[]): number {
    // Calculate standard deviation of play times
    if (sessions.length < 2) return 0;
    
    const hours = sessions.map(s => new Date(s.timestamp).getHours());
    const mean = hours.reduce((a, b) => a + b, 0) / hours.length;
    const variance = hours.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / hours.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower std dev = more consistent
    return Math.max(0, 1 - (stdDev / 12)); // Normalize to 0-1
  }
}

// ========== TYPE DEFINITIONS ==========

interface RewardEvent {
  type: string;
  value: number;
  animation: string;
  sound: string;
}

interface LimitedTimeEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  endTime: number;
  urgency: string;
  [key: string]: any;
}

interface UrgencyIndicator {
  level: string;
  color: string;
  animation: string;
  message: string;
  haptic: string;
}

interface CompetitivePressure {
  friendsAhead: number;
  nextFriendGap: number;
  globalRank: number;
  percentile: number;
  nearbyRivals: any[];
  motivationalMessage: string;
  suggestedAction: string;
}

interface ProgressFeedback {
  actualProgress: number;
  displayProgress: number;
  message: string;
  visualization: string;
  motivator: Motivator;
}

interface Motivator {
  type: string;
  intensity: string;
  action: string;
  reward_preview: boolean;
}

interface RoutineData {
  preferredPlayTime: number[];
  averageSessionLength: number;
  dailyPattern: Map<number, number>;
}

interface HabitReinforcement {
  notifications: NotificationSchedule[];
  rewards: RoutineReward[];
  challenges: Challenge[];
}

interface PlayPattern {
  peakHour: number;
  averageDuration: number;
  frequency: number;
  consistency: number;
}

interface NotificationSchedule {
  id: string;
  title: string;
  body: string;
  hour: number;
  priority: string;
}

interface RoutineReward {
  trigger: string;
  reward: number;
  message: string;
}

interface Challenge {
  id: string;
  title: string;
  reward: number;
  progress: number;
  target: number;
}

// ========== EXPORT MAIN CLASS ==========

export class EnhancedEngagementSystem {
  private dopamineScheduler = new DopamineScheduler();
  private fomoEngine = new FOMOEngine();
  private socialCompetition = new SocialCompetition();
  private progressionPsychology = new ProgressionPsychology();
  private habitFormation = new HabitFormation();
  
  async initialize() {
    // Set up all engagement systems
    await this.habitFormation.analyzeAndReinforce();
    const events = this.fomoEngine.generateDailyEvents();
    
    // Schedule notifications
    await this.setupNotifications();
    
    return {
      events,
      initialized: true
    };
  }
  
  private async setupNotifications() {
    await Notifications.requestPermissionsAsync();
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
  
  checkEngagementTriggers(gameState: any): EngagementTrigger[] {
    const triggers: EngagementTrigger[] = [];
    const sessionTime = Date.now() - gameState.sessionStart;
    
    // Check dopamine schedule
    const reward = this.dopamineScheduler.scheduleRewards(sessionTime / 1000);
    if (reward) {
      triggers.push({
        type: 'reward',
        data: reward,
        priority: 'high'
      });
    }
    
    // Check FOMO events
    const events = this.fomoEngine.generateDailyEvents();
    events.forEach(event => {
      const urgency = this.fomoEngine.calculateUrgencyLevel(event);
      if (urgency.level === 'critical') {
        triggers.push({
          type: 'fomo',
          data: { event, urgency },
          priority: 'critical'
        });
      }
    });
    
    // Check progress milestones
    const progress = this.progressionPsychology.calculateProgressFeedback(
      gameState.score,
      gameState.nextMilestone
    );
    if (progress.displayProgress > 0.9) {
      triggers.push({
        type: 'near_milestone',
        data: progress,
        priority: 'high'
      });
    }
    
    return triggers;
  }
}

interface EngagementTrigger {
  type: string;
  data: any;
  priority: string;
}

export default EnhancedEngagementSystem;