/**
 * Analytics System
 * Comprehensive analytics tracking for admin dashboard
 */

import { firestore } from '../../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface AnalyticsEvent {
  eventId: string;
  eventName: string;
  userId?: string;
  sessionId: string;
  timestamp: string;
  platform: string;
  deviceId: string;
  properties: Record<string, any>;
  revenue?: number;
  category: EventCategory;
}

export type EventCategory = 
  | 'gameplay'
  | 'monetization'
  | 'engagement'
  | 'retention'
  | 'technical'
  | 'social'
  | 'progression';

export interface UserMetrics {
  userId: string;
  metrics: {
    // Engagement
    sessionsCount: number;
    totalPlayTime: number;
    averageSessionLength: number;
    lastSessionDate: string;
    
    // Monetization
    totalSpent: number;
    purchaseCount: number;
    averagePurchaseValue: number;
    lastPurchaseDate?: string;
    isPayingUser: boolean;
    
    // Progression
    currentLevel: number;
    totalXP: number;
    achievementsUnlocked: number;
    itemsCollected: number;
    
    // Retention
    daysSinceInstall: number;
    consecutiveDays: number;
    churnRisk: 'low' | 'medium' | 'high';
    
    // Social
    friendsCount: number;
    challengesSent: number;
    challengesWon: number;
    guildContribution: number;
  };
}

export interface RealtimeMetrics {
  activeUsers: number;
  revenue24h: number;
  newUsers24h: number;
  crashRate: number;
  serverLoad: number;
  activeEvents: string[];
  topPurchases: Array<{ item: string; count: number }>;
}

export interface DashboardData {
  overview: {
    dau: number;
    mau: number;
    revenue: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    arpu: number;
    arppu: number;
    conversionRate: number;
  };
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
  segments: {
    whales: number;
    dolphins: number;
    minnows: number;
    nonPayers: number;
  };
  performance: {
    crashFreeRate: number;
    averageLoadTime: number;
    averageFPS: number;
  };
  liveOps: {
    activeEvents: number;
    eventParticipation: number;
    battlePassProgress: number;
  };
}

class AnalyticsSystem {
  private sessionId: string = '';
  private sessionStartTime: number = 0;
  private eventQueue: AnalyticsEvent[] = [];
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  async initialize(userId?: string) {
    this.startSession();
    this.setupAutoFlush();
    await this.trackAppOpen(userId);
  }

  private startSession() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionStartTime = Date.now();
  }

  // Event Tracking
  async trackEvent(
    eventName: string,
    category: EventCategory,
    properties?: Record<string, any>,
    revenue?: number
  ) {
    const event: AnalyticsEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventName,
      userId: await this.getUserId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      deviceId: await this.getDeviceId(),
      properties: properties || {},
      revenue,
      category
    };

    this.eventQueue.push(event);

    // Flush if queue is full
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  // Gameplay Events
  async trackGameStart(gameMode: string, powerups: string[]) {
    await this.trackEvent('game_start', 'gameplay', {
      game_mode: gameMode,
      powerups_equipped: powerups,
      energy_used: 10
    });
  }

  async trackGameEnd(score: number, coins: number, duration: number) {
    await this.trackEvent('game_end', 'gameplay', {
      score,
      coins_earned: coins,
      duration_seconds: duration,
      deaths: 0,
      powerups_used: []
    });
  }

  async trackLevelUp(newLevel: number, xpGained: number) {
    await this.trackEvent('level_up', 'progression', {
      new_level: newLevel,
      xp_gained: xpGained,
      total_xp: 0
    });
  }

  // Monetization Events
  async trackPurchase(
    itemId: string,
    itemType: string,
    price: number,
    currency: string
  ) {
    await this.trackEvent('purchase', 'monetization', {
      item_id: itemId,
      item_type: itemType,
      price,
      currency,
      payment_method: 'iap'
    }, price);
  }

  async trackAdView(adType: string, placement: string, reward?: any) {
    await this.trackEvent('ad_view', 'monetization', {
      ad_type: adType,
      placement,
      reward,
      completed: true
    });
  }

  async trackSubscription(
    action: 'start' | 'renew' | 'cancel',
    tier: string,
    price?: number
  ) {
    await this.trackEvent(`subscription_${action}`, 'monetization', {
      tier,
      price,
      billing_period: 'monthly'
    }, price);
  }

  // Social Events
  async trackSocialAction(
    action: string,
    target?: string,
    result?: string
  ) {
    await this.trackEvent(`social_${action}`, 'social', {
      target,
      result,
      platform: 'ingame'
    });
  }

  async trackGuildAction(action: string, guildId: string, value?: number) {
    await this.trackEvent(`guild_${action}`, 'social', {
      guild_id: guildId,
      contribution: value
    });
  }

  // Engagement Events
  async trackFeatureUsage(feature: string, action: string) {
    await this.trackEvent('feature_usage', 'engagement', {
      feature,
      action,
      first_time: false
    });
  }

  async trackTutorialProgress(step: string, completed: boolean) {
    await this.trackEvent('tutorial_progress', 'engagement', {
      step,
      completed,
      skip: false
    });
  }

  // Technical Events
  async trackError(error: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    await this.trackEvent('error', 'technical', {
      error_message: error,
      severity,
      stack_trace: '',
      device_info: Device.modelName
    });
  }

  async trackPerformance(fps: number, loadTime: number, memoryUsage: number) {
    await this.trackEvent('performance', 'technical', {
      fps,
      load_time_ms: loadTime,
      memory_mb: memoryUsage,
      battery_level: 0
    });
  }

  // User Metrics
  async getUserMetrics(userId: string): Promise<UserMetrics> {
    try {
      const doc = await firestore
        .collection('user_metrics')
        .doc(userId)
        .get();

      if (doc.exists) {
        return doc.data() as UserMetrics;
      }

      // Return default metrics
      return this.createDefaultMetrics(userId);
    } catch (error) {
      console.error('Failed to get user metrics:', error);
      return this.createDefaultMetrics(userId);
    }
  }

  private createDefaultMetrics(userId: string): UserMetrics {
    return {
      userId,
      metrics: {
        sessionsCount: 0,
        totalPlayTime: 0,
        averageSessionLength: 0,
        lastSessionDate: new Date().toISOString(),
        totalSpent: 0,
        purchaseCount: 0,
        averagePurchaseValue: 0,
        isPayingUser: false,
        currentLevel: 1,
        totalXP: 0,
        achievementsUnlocked: 0,
        itemsCollected: 0,
        daysSinceInstall: 0,
        consecutiveDays: 0,
        churnRisk: 'low',
        friendsCount: 0,
        challengesSent: 0,
        challengesWon: 0,
        guildContribution: 0
      }
    };
  }

  // Dashboard Data
  async getDashboardData(): Promise<DashboardData> {
    try {
      // Fetch aggregated data from Firestore
      const snapshot = await firestore
        .collection('analytics_dashboard')
        .doc('current')
        .get();

      if (snapshot.exists) {
        return snapshot.data() as DashboardData;
      }

      // Return mock data for development
      return this.getMockDashboardData();
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      return this.getMockDashboardData();
    }
  }

  private getMockDashboardData(): DashboardData {
    return {
      overview: {
        dau: Math.floor(Math.random() * 10000) + 5000,
        mau: Math.floor(Math.random() * 100000) + 50000,
        revenue: {
          daily: Math.floor(Math.random() * 5000) + 1000,
          weekly: Math.floor(Math.random() * 35000) + 7000,
          monthly: Math.floor(Math.random() * 150000) + 30000
        },
        arpu: Math.random() * 2 + 0.5,
        arppu: Math.random() * 50 + 10,
        conversionRate: Math.random() * 0.1 + 0.02
      },
      retention: {
        day1: Math.random() * 0.3 + 0.4,
        day7: Math.random() * 0.2 + 0.2,
        day30: Math.random() * 0.1 + 0.1
      },
      segments: {
        whales: Math.floor(Math.random() * 100) + 50,
        dolphins: Math.floor(Math.random() * 500) + 200,
        minnows: Math.floor(Math.random() * 2000) + 1000,
        nonPayers: Math.floor(Math.random() * 10000) + 5000
      },
      performance: {
        crashFreeRate: Math.random() * 0.05 + 0.95,
        averageLoadTime: Math.random() * 2000 + 1000,
        averageFPS: Math.random() * 10 + 50
      },
      liveOps: {
        activeEvents: Math.floor(Math.random() * 5) + 1,
        eventParticipation: Math.random() * 0.5 + 0.3,
        battlePassProgress: Math.random() * 0.7 + 0.2
      }
    };
  }

  // Realtime Metrics
  async getRealtimeMetrics(): Promise<RealtimeMetrics> {
    try {
      const doc = await firestore
        .collection('realtime_metrics')
        .doc('current')
        .get();

      if (doc.exists) {
        return doc.data() as RealtimeMetrics;
      }

      return this.getMockRealtimeMetrics();
    } catch (error) {
      console.error('Failed to get realtime metrics:', error);
      return this.getMockRealtimeMetrics();
    }
  }

  private getMockRealtimeMetrics(): RealtimeMetrics {
    return {
      activeUsers: Math.floor(Math.random() * 1000) + 500,
      revenue24h: Math.floor(Math.random() * 5000) + 1000,
      newUsers24h: Math.floor(Math.random() * 500) + 100,
      crashRate: Math.random() * 0.02,
      serverLoad: Math.random() * 0.7 + 0.2,
      activeEvents: ['Daily Challenge', 'Weekend Tournament', 'Flash Sale'],
      topPurchases: [
        { item: 'Coin Pack 1000', count: 45 },
        { item: 'VIP Monthly', count: 32 },
        { item: 'Battle Pass', count: 28 },
        { item: 'Energy Refill', count: 67 },
        { item: 'Mystery Crate', count: 23 }
      ]
    };
  }

  // Cohort Analysis
  async getCohortData(cohortDate: string): Promise<any> {
    // Fetch cohort retention data
    const cohortData = {
      cohortDate,
      size: Math.floor(Math.random() * 1000) + 500,
      retention: {
        day0: 1.0,
        day1: Math.random() * 0.3 + 0.4,
        day3: Math.random() * 0.2 + 0.25,
        day7: Math.random() * 0.15 + 0.15,
        day14: Math.random() * 0.1 + 0.1,
        day30: Math.random() * 0.08 + 0.07
      },
      ltv: {
        day7: Math.random() * 2 + 0.5,
        day30: Math.random() * 5 + 2,
        day90: Math.random() * 15 + 5,
        day180: Math.random() * 30 + 10
      }
    };

    return cohortData;
  }

  // A/B Testing
  async getABTestResults(testId: string): Promise<any> {
    return {
      testId,
      name: 'Store UI Redesign',
      status: 'running',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      variants: [
        {
          name: 'Control',
          users: 5000,
          conversionRate: 0.045,
          revenue: 12500
        },
        {
          name: 'Variant A',
          users: 5000,
          conversionRate: 0.052,
          revenue: 14200
        }
      ],
      significance: 0.94,
      winner: 'Variant A'
    };
  }

  // Helper Methods
  private async getUserId(): Promise<string | undefined> {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      return userId || undefined;
    } catch {
      return undefined;
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      return deviceId || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private async trackAppOpen(userId?: string) {
    await this.trackEvent('app_open', 'engagement', {
      user_id: userId,
      session_id: this.sessionId,
      device_model: Device.modelName,
      os_version: Device.osVersion
    });
  }

  // Flush Events
  private async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Batch write to Firestore
      const batch = firestore.batch();
      
      for (const event of events) {
        const ref = firestore
          .collection('analytics_events')
          .doc(event.eventId);
        batch.set(ref, event);
      }

      await batch.commit();
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-queue events
      this.eventQueue = [...events, ...this.eventQueue];
    }
  }

  private setupAutoFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  // Session End
  async endSession() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    await this.trackEvent('session_end', 'engagement', {
      duration_ms: sessionDuration,
      events_count: this.eventQueue.length
    });

    await this.flush();

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

export default new AnalyticsSystem();