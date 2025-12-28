import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { deviceInfoManager } from '../utils/deviceInfo';
import { performanceMonitor } from '../utils/performanceMonitor';
import { dynamicDifficulty } from './DynamicDifficulty';

/**
 * Advanced Telemetry & Analytics System
 * Comprehensive tracking for player behavior, monetization, and performance
 */

export interface TelemetryEvent {
  eventId: string;
  eventType: EventType;
  eventName: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  properties: Record<string, any>;
  context: EventContext;
}

export interface EventContext {
  device: {
    id: string;
    type: string;
    os: string;
    version: string;
    performanceTier: string;
  };
  session: {
    id: string;
    startTime: number;
    duration: number;
    eventCount: number;
  };
  player: {
    level: number;
    totalPlayTime: number;
    sessionCount: number;
    spendingTier: 'non_spender' | 'minnow' | 'dolphin' | 'whale';
    retentionDay: number;
  };
  game: {
    version: string;
    build: string;
    difficulty: string;
    fps: number;
    memoryUsage: number;
  };
  network: {
    type: string;
    quality: string;
    latency: number;
  };
}

export enum EventType {
  // Core Game Events
  GAME_START = 'game_start',
  GAME_END = 'game_end',
  LEVEL_COMPLETE = 'level_complete',
  LEVEL_FAIL = 'level_fail',

  // Monetization Events
  PURCHASE_INITIATED = 'purchase_initiated',
  PURCHASE_COMPLETED = 'purchase_completed',
  PURCHASE_FAILED = 'purchase_failed',
  PURCHASE_RESTORED = 'purchase_restored',
  AD_REQUESTED = 'ad_requested',
  AD_SHOWN = 'ad_shown',
  AD_CLICKED = 'ad_clicked',
  AD_REWARDED = 'ad_rewarded',

  // Progression Events
  LEVEL_UP = 'level_up',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  ITEM_UNLOCKED = 'item_unlocked',
  SKIN_EQUIPPED = 'skin_equipped',
  CURRENCY_EARNED = 'currency_earned',
  CURRENCY_SPENT = 'currency_spent',

  // Social Events
  SHARE_INITIATED = 'share_initiated',
  SHARE_COMPLETED = 'share_completed',
  FRIEND_INVITED = 'friend_invited',
  LEADERBOARD_VIEWED = 'leaderboard_viewed',

  // UI Events
  SCREEN_VIEW = 'screen_view',
  BUTTON_CLICK = 'button_click',
  TUTORIAL_STEP = 'tutorial_step',
  SETTINGS_CHANGED = 'settings_changed',

  // Performance Events
  FPS_DROP = 'fps_drop',
  MEMORY_WARNING = 'memory_warning',
  CRASH_DETECTED = 'crash_detected',
  ANR_DETECTED = 'anr_detected',

  // User Behavior
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  SESSION_PAUSE = 'session_pause',
  SESSION_RESUME = 'session_resume',
  RAGE_QUIT = 'rage_quit',

  // Feature Events
  DAILY_BONUS_CLAIMED = 'daily_bonus_claimed',
  MYSTERY_BOX_OPENED = 'mystery_box_opened',
  BATTLE_PASS_PROGRESS = 'battle_pass_progress',
  SEASON_EVENT_PARTICIPATION = 'season_event_participation',
}

interface SessionMetrics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  events: TelemetryEvent[];
  crashes: number;
  errors: number;
  purchases: number;
  adsWatched: number;
  revenue: number;
}

interface PlayerProfile {
  userId: string;
  firstSeen: number;
  lastSeen: number;
  totalSessions: number;
  totalPlayTime: number;
  totalRevenue: number;
  totalAdsWatched: number;
  averageSessionLength: number;
  churnRisk: number;
  ltv: number; // Lifetime value
  retentionDays: number[];
  favoriteFeatures: string[];
  purchaseHistory: Array<{
    timestamp: number;
    productId: string;
    amount: number;
    currency: string;
  }>;
}

interface AggregatedMetrics {
  dau: number; // Daily Active Users
  mau: number; // Monthly Active Users
  arpu: number; // Average Revenue Per User
  arppu: number; // Average Revenue Per Paying User
  conversionRate: number;
  retentionD1: number;
  retentionD7: number;
  retentionD30: number;
  avgSessionLength: number;
  avgSessionsPerUser: number;
  crashRate: number;
  churnRate: number;
}

class TelemetrySystem {
  private static instance: TelemetrySystem;

  private currentSession: SessionMetrics | null = null;
  private eventQueue: TelemetryEvent[] = [];
  private playerProfile: PlayerProfile | null = null;
  private aggregatedMetrics: AggregatedMetrics;

  // Configuration
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly BATCH_INTERVAL = 30000; // 30 seconds
  private readonly STORAGE_KEY = '@telemetry_data';
  private readonly PROFILE_KEY = '@player_profile';
  private readonly METRICS_KEY = '@aggregated_metrics';

  // Tracking state
  private isTracking: boolean = true;
  private userId: string | null = null;
  private sessionStartTime: number = 0;
  private lastEventTime: number = 0;
  private batchTimer: NodeJS.Timeout | null = null;

  // Feature flags
  private featureFlags: Map<string, boolean> = new Map();

  // AB Testing
  private experiments: Map<string, string> = new Map();

  private constructor() {
    this.aggregatedMetrics = this.getDefaultMetrics();
    this.initialize();
  }

  static getInstance(): TelemetrySystem {
    if (!TelemetrySystem.instance) {
      TelemetrySystem.instance = new TelemetrySystem();
    }
    return TelemetrySystem.instance;
  }

  private getDefaultMetrics(): AggregatedMetrics {
    return {
      dau: 0,
      mau: 0,
      arpu: 0,
      arppu: 0,
      conversionRate: 0,
      retentionD1: 0,
      retentionD7: 0,
      retentionD30: 0,
      avgSessionLength: 0,
      avgSessionsPerUser: 0,
      crashRate: 0,
      churnRate: 0,
    };
  }

  private async initialize(): Promise<void> {
    await this.loadStoredData();
    await this.loadPlayerProfile();
    await this.loadAggregatedMetrics();

    // Start batch processing
    this.startBatchProcessing();

    // Initialize feature flags
    this.loadFeatureFlags();

    // Initialize AB tests
    this.assignExperiments();
  }

  private async loadStoredData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.eventQueue = parsed.queue || [];
      }
    } catch (error) {
      console.error('Failed to load telemetry data:', error);
    }
  }

  private async loadPlayerProfile(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.PROFILE_KEY);
      if (data) {
        this.playerProfile = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load player profile:', error);
    }
  }

  private async loadAggregatedMetrics(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.METRICS_KEY);
      if (data) {
        this.aggregatedMetrics = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load aggregated metrics:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          queue: this.eventQueue,
          session: this.currentSession,
        })
      );

      if (this.playerProfile) {
        await AsyncStorage.setItem(this.PROFILE_KEY, JSON.stringify(this.playerProfile));
      }

      await AsyncStorage.setItem(this.METRICS_KEY, JSON.stringify(this.aggregatedMetrics));
    } catch (error) {
      console.error('Failed to save telemetry data:', error);
    }
  }

  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      this.processBatch();
    }, this.BATCH_INTERVAL);
  }

  private async processBatch(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const batch = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send to analytics backend
      await this.sendToBackend(batch);

      // Update local metrics
      this.updateLocalMetrics(batch);

      // Save state
      await this.saveData();
    } catch (error) {
      console.error('Failed to process telemetry batch:', error);
      // Re-queue events on failure
      this.eventQueue = [...batch, ...this.eventQueue].slice(0, this.MAX_QUEUE_SIZE * 2);
    }
  }

  private async sendToBackend(events: TelemetryEvent[]): Promise<void> {
    // Implement actual backend communication
    // For now, just log to console in development
    if (__DEV__) {
      console.log('Telemetry batch:', events.length, 'events');
    }

    // In production, send to your analytics endpoint
    // await fetch('https://analytics.yourapp.com/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ events })
    // });
  }

  private updateLocalMetrics(events: TelemetryEvent[]): void {
    events.forEach((event) => {
      // Update session metrics
      if (this.currentSession) {
        this.currentSession.events.push(event);

        if (event.eventType === EventType.PURCHASE_COMPLETED) {
          this.currentSession.purchases++;
          this.currentSession.revenue += event.properties.amount || 0;
        }

        if (event.eventType === EventType.AD_REWARDED) {
          this.currentSession.adsWatched++;
        }

        if (event.eventType === EventType.CRASH_DETECTED) {
          this.currentSession.crashes++;
        }
      }

      // Update player profile
      if (this.playerProfile) {
        this.playerProfile.lastSeen = Date.now();

        if (event.eventType === EventType.PURCHASE_COMPLETED) {
          this.playerProfile.totalRevenue += event.properties.amount || 0;
          this.playerProfile.purchaseHistory.push({
            timestamp: event.timestamp,
            productId: event.properties.productId,
            amount: event.properties.amount,
            currency: event.properties.currency,
          });
        }

        if (event.eventType === EventType.AD_REWARDED) {
          this.playerProfile.totalAdsWatched++;
        }
      }
    });

    // Update aggregated metrics
    this.recalculateAggregatedMetrics();
  }

  private recalculateAggregatedMetrics(): void {
    if (!this.playerProfile) return;

    // Calculate ARPU
    this.aggregatedMetrics.arpu =
      this.playerProfile.totalRevenue / Math.max(1, this.playerProfile.totalSessions);

    // Calculate session metrics
    this.aggregatedMetrics.avgSessionLength = this.playerProfile.averageSessionLength;
    this.aggregatedMetrics.avgSessionsPerUser = this.playerProfile.totalSessions;

    // Calculate crash rate
    if (this.currentSession) {
      this.aggregatedMetrics.crashRate =
        this.currentSession.crashes / Math.max(1, this.currentSession.events.length);
    }
  }

  private createEventContext(): EventContext {
    const deviceProfile = deviceInfoManager.getDeviceProfile();
    const perfMetrics = performanceMonitor.getMetrics();
    const difficultyParams = dynamicDifficulty.getCurrentDifficulty();

    return {
      device: {
        id: deviceProfile.deviceId,
        type: deviceProfile.deviceType,
        os: Platform.OS,
        version: deviceProfile.osVersion || 'unknown',
        performanceTier: deviceProfile.performanceTier,
      },
      session: {
        id: this.currentSession?.sessionId || 'unknown',
        startTime: this.sessionStartTime,
        duration: Date.now() - this.sessionStartTime,
        eventCount: this.currentSession?.events.length || 0,
      },
      player: {
        level: this.playerProfile?.totalSessions || 1,
        totalPlayTime: this.playerProfile?.totalPlayTime || 0,
        sessionCount: this.playerProfile?.totalSessions || 0,
        spendingTier: this.getSpendingTier(),
        retentionDay: this.getRetentionDay(),
      },
      game: {
        version: '1.0.0',
        build: '100',
        difficulty: dynamicDifficulty.getDifficultyLevel().toString(),
        fps: perfMetrics.fps,
        memoryUsage: perfMetrics.memoryUsage,
      },
      network: {
        type: deviceProfile.networkType,
        quality: deviceProfile.networkQuality,
        latency: 0,
      },
    };
  }

  private getSpendingTier(): 'non_spender' | 'minnow' | 'dolphin' | 'whale' {
    if (!this.playerProfile) return 'non_spender';

    const revenue = this.playerProfile.totalRevenue;
    if (revenue === 0) return 'non_spender';
    if (revenue < 10) return 'minnow';
    if (revenue < 100) return 'dolphin';
    return 'whale';
  }

  private getRetentionDay(): number {
    if (!this.playerProfile) return 0;

    const daysSinceFirst = Math.floor(
      (Date.now() - this.playerProfile.firstSeen) / (1000 * 60 * 60 * 24)
    );

    return daysSinceFirst;
  }

  private loadFeatureFlags(): void {
    // Load feature flags from remote config or local defaults
    this.featureFlags.set('new_tutorial', true);
    this.featureFlags.set('seasonal_events', true);
    this.featureFlags.set('battle_pass', false);
    this.featureFlags.set('social_features', false);
  }

  private assignExperiments(): void {
    // Assign user to AB test groups
    const userId = this.userId || 'anonymous';
    const hash = this.hashString(userId);

    // 50/50 split for onboarding experiment
    this.experiments.set('onboarding_flow', hash % 2 === 0 ? 'control' : 'variant_a');

    // 33/33/33 split for monetization experiment
    const monetizationGroup = hash % 3;
    this.experiments.set(
      'pricing_model',
      monetizationGroup === 0 ? 'standard' : monetizationGroup === 1 ? 'discount' : 'premium'
    );
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Public API

  startSession(userId?: string): void {
    this.userId = userId || 'anonymous';
    this.sessionStartTime = Date.now();

    const sessionId = `${this.userId}_${this.sessionStartTime}`;

    this.currentSession = {
      sessionId,
      startTime: this.sessionStartTime,
      events: [],
      crashes: 0,
      errors: 0,
      purchases: 0,
      adsWatched: 0,
      revenue: 0,
    };

    // Initialize or update player profile
    if (!this.playerProfile) {
      this.playerProfile = {
        userId: this.userId,
        firstSeen: this.sessionStartTime,
        lastSeen: this.sessionStartTime,
        totalSessions: 1,
        totalPlayTime: 0,
        totalRevenue: 0,
        totalAdsWatched: 0,
        averageSessionLength: 0,
        churnRisk: 0,
        ltv: 0,
        retentionDays: [0],
        favoriteFeatures: [],
        purchaseHistory: [],
      };
    } else {
      this.playerProfile.totalSessions++;
      this.playerProfile.lastSeen = this.sessionStartTime;
    }

    // Track session start
    this.track(EventType.SESSION_START, {
      sessionId,
      userId: this.userId,
      timestamp: this.sessionStartTime,
    });

    // Update DAU/MAU
    this.updateActiveUsers();
  }

  endSession(): void {
    if (!this.currentSession) return;

    const duration = Date.now() - this.sessionStartTime;
    this.currentSession.endTime = Date.now();

    // Track session end
    this.track(EventType.SESSION_END, {
      sessionId: this.currentSession.sessionId,
      duration,
      eventCount: this.currentSession.events.length,
      crashes: this.currentSession.crashes,
      purchases: this.currentSession.purchases,
      revenue: this.currentSession.revenue,
    });

    // Update player profile
    if (this.playerProfile) {
      this.playerProfile.totalPlayTime += duration;
      this.playerProfile.averageSessionLength =
        (this.playerProfile.averageSessionLength * (this.playerProfile.totalSessions - 1) +
          duration) /
        this.playerProfile.totalSessions;

      // Calculate churn risk
      this.calculateChurnRisk();

      // Calculate LTV
      this.calculateLTV();
    }

    // Force batch processing
    this.processBatch();

    // Clear session
    this.currentSession = null;
  }

  track(eventType: EventType, properties: Record<string, any> = {}): void {
    if (!this.isTracking) return;

    const event: TelemetryEvent = {
      eventId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      eventName: eventType,
      timestamp: Date.now(),
      sessionId: this.currentSession?.sessionId || 'no_session',
      userId: this.userId || undefined,
      properties: {
        ...properties,
        experiments: Object.fromEntries(this.experiments),
        featureFlags: Object.fromEntries(this.featureFlags),
      },
      context: this.createEventContext(),
    };

    // Add to queue
    this.eventQueue.push(event);
    this.lastEventTime = Date.now();

    // Process immediately if queue is full
    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      this.processBatch();
    }

    // Special handling for critical events
    if (this.isCriticalEvent(eventType)) {
      this.handleCriticalEvent(event);
    }
  }

  private isCriticalEvent(eventType: EventType): boolean {
    return [
      EventType.CRASH_DETECTED,
      EventType.PURCHASE_COMPLETED,
      EventType.PURCHASE_FAILED,
      EventType.ANR_DETECTED,
    ].includes(eventType);
  }

  private handleCriticalEvent(event: TelemetryEvent): void {
    // Immediately save and send critical events
    this.saveData();
    this.sendToBackend([event]);
  }

  private updateActiveUsers(): void {
    // This would typically update a backend service
    // For now, just update local metrics
    this.aggregatedMetrics.dau = 1; // Simplified for demo
    this.aggregatedMetrics.mau = 1;
  }

  private calculateChurnRisk(): void {
    if (!this.playerProfile) return;

    // Simple churn risk calculation based on session frequency
    const daysSinceLastSession = (Date.now() - this.playerProfile.lastSeen) / (1000 * 60 * 60 * 24);
    const avgDaysBetweenSessions =
      this.playerProfile.totalPlayTime / (this.playerProfile.totalSessions * 1000 * 60 * 60 * 24);

    if (daysSinceLastSession > avgDaysBetweenSessions * 3) {
      this.playerProfile.churnRisk = 0.8;
    } else if (daysSinceLastSession > avgDaysBetweenSessions * 2) {
      this.playerProfile.churnRisk = 0.5;
    } else {
      this.playerProfile.churnRisk = 0.2;
    }
  }

  private calculateLTV(): void {
    if (!this.playerProfile) return;

    // Simple LTV calculation
    const avgRevenuePerSession =
      this.playerProfile.totalRevenue / Math.max(1, this.playerProfile.totalSessions);
    const projectedSessions = 50; // Estimated lifetime sessions

    this.playerProfile.ltv = avgRevenuePerSession * projectedSessions;
  }

  // Monetization tracking
  trackPurchase(productId: string, amount: number, currency: string): void {
    this.track(EventType.PURCHASE_COMPLETED, {
      productId,
      amount,
      currency,
      paymentMethod: 'in_app_purchase',
    });
  }

  trackAdImpression(adType: string, provider: string): void {
    this.track(EventType.AD_SHOWN, {
      adType,
      provider,
      placement: 'interstitial',
    });
  }

  // Performance tracking
  trackPerformanceIssue(issue: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    this.track(EventType.FPS_DROP, {
      issue,
      severity,
      fps: performanceMonitor.getMetrics().fps,
      memoryUsage: performanceMonitor.getMetrics().memoryUsage,
    });
  }

  // Feature tracking
  trackFeatureUsage(feature: string, action: string): void {
    this.track(EventType.BUTTON_CLICK, {
      feature,
      action,
      screen: 'unknown',
    });

    // Update favorite features
    if (this.playerProfile) {
      if (!this.playerProfile.favoriteFeatures.includes(feature)) {
        this.playerProfile.favoriteFeatures.push(feature);
        if (this.playerProfile.favoriteFeatures.length > 10) {
          this.playerProfile.favoriteFeatures.shift();
        }
      }
    }
  }

  // Screen tracking
  trackScreenView(screenName: string): void {
    this.track(EventType.SCREEN_VIEW, {
      screenName,
      previousScreen: 'unknown',
    });
  }

  // Get methods
  getMetrics(): AggregatedMetrics {
    return { ...this.aggregatedMetrics };
  }

  getPlayerProfile(): PlayerProfile | null {
    return this.playerProfile ? { ...this.playerProfile } : null;
  }

  getSessionMetrics(): SessionMetrics | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  getFeatureFlag(flag: string): boolean {
    return this.featureFlags.get(flag) || false;
  }

  getExperimentGroup(experiment: string): string {
    return this.experiments.get(experiment) || 'control';
  }

  // Settings
  setTracking(enabled: boolean): void {
    this.isTracking = enabled;
  }

  clearData(): void {
    this.eventQueue = [];
    this.currentSession = null;
    AsyncStorage.multiRemove([this.STORAGE_KEY, this.PROFILE_KEY, this.METRICS_KEY]);
  }

  // Cleanup
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.processBatch();
    this.saveData();
  }
}

// Export singleton instance
export const telemetrySystem = TelemetrySystem.getInstance();

// Convenience functions
export function trackEvent(eventType: EventType, properties?: Record<string, any>): void {
  telemetrySystem.track(eventType, properties);
}

export function trackScreen(screenName: string): void {
  telemetrySystem.trackScreenView(screenName);
}

export function trackPurchase(productId: string, amount: number, currency: string = 'USD'): void {
  telemetrySystem.trackPurchase(productId, amount, currency);
}

export function getPlayerLTV(): number {
  return telemetrySystem.getPlayerProfile()?.ltv || 0;
}

export function isFeatureEnabled(flag: string): boolean {
  return telemetrySystem.getFeatureFlag(flag);
}
