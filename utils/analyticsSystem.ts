import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface AnalyticsEvent {
  eventId: string;
  eventType: string;
  category: 'gameplay' | 'monetization' | 'engagement' | 'technical' | 'user_action';
  timestamp: string;
  sessionId: string;
  userId?: string;
  properties: Record<string, any>;
  context: DeviceContext;
}

export interface DeviceContext {
  platform: string;
  osVersion: string;
  deviceModel: string;
  deviceId: string;
  appVersion: string;
  buildNumber: string;
  locale: string;
  timezone: string;
  networkType?: string;
  carrier?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface UserMetrics {
  userId: string;
  firstSeen: string;
  lastSeen: string;
  totalSessions: number;
  totalPlayTime: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  totalPurchases: number;
  purchaseValue: number;
  averageSessionLength: number;
  daysPlayed: number;
  currentStreak: number;
  longestStreak: number;
  retentionCohort: string;
  ltv: number;
  churnRisk: 'low' | 'medium' | 'high';
}

export interface SessionMetrics {
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  coinsEarned: number;
  coinsSpent: number;
  gamesPlayed: number;
  highScore: number;
  adsWatched: number;
  purchasesMade: number;
  purchaseValue: number;
  crashes: number;
  errors: string[];
}

export class AnalyticsSystem {
  private static instance: AnalyticsSystem;
  private events: AnalyticsEvent[] = [];
  private currentSession: SessionMetrics | null = null;
  private deviceContext: DeviceContext | null = null;
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_INTERVAL = 30000; // 30 seconds
  private readonly STORAGE_KEY = 'analytics_queue';
  private readonly ENDPOINT = process.env.ANALYTICS_ENDPOINT || 'https://api.cienrios.com/analytics';

  static getInstance(): AnalyticsSystem {
    if (!AnalyticsSystem.instance) {
      AnalyticsSystem.instance = new AnalyticsSystem();
    }
    return AnalyticsSystem.instance;
  }

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.setupDeviceContext();
    await this.loadQueuedEvents();
    this.startBatchTimer();
    this.startSession();
  }

  private async setupDeviceContext() {
    try {
      // Only request location if user has consented via privacy settings
      const { privacyManager } = await import('./privacy');
      await privacyManager.initialize();

      let location = undefined;

      // Only track location on mobile platforms (iOS/Android), not web
      if (Platform.OS !== 'web' && privacyManager.isLocationTrackingEnabled()) {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          const reverseGeo = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });

          if (reverseGeo[0]) {
            location = {
              country: reverseGeo[0].country,
              region: reverseGeo[0].region,
              city: reverseGeo[0].city,
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
          }
        }
      }

      // Get network info
      const netInfo = await NetInfo.fetch();

      this.deviceContext = {
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        deviceModel: Device.modelName || 'Unknown',
        deviceId: Device.osBuildId || 'Unknown',
        appVersion: '1.0.0', // Get from app.json
        buildNumber: '1',
        locale: Device.locale || 'en-US',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        networkType: netInfo.type,
        carrier: netInfo.details?.carrier,
        location,
      };
    } catch (error) {
      console.error('Error setting up device context:', error);
    }
  }

  // Core Analytics Tracking
  track(eventType: string, properties: Record<string, any> = {}) {
    const event: AnalyticsEvent = {
      eventId: this.generateEventId(),
      eventType,
      category: this.categorizeEvent(eventType),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSession?.sessionId || 'unknown',
      userId: properties.userId,
      properties,
      context: this.deviceContext || {} as DeviceContext,
    };

    this.events.push(event);
    this.processEventTriggers(event);

    // Send immediately for critical events
    if (this.isCriticalEvent(eventType)) {
      this.flushEvents();
    }
  }

  // Gameplay Events
  trackGameStart(level: number, mode: string) {
    this.track('game_start', { level, mode });
  }

  trackGameEnd(score: number, duration: number, coinsEarned: number) {
    this.track('game_end', { score, duration, coinsEarned });
    
    if (this.currentSession) {
      this.currentSession.gamesPlayed++;
      this.currentSession.coinsEarned += coinsEarned;
      if (score > this.currentSession.highScore) {
        this.currentSession.highScore = score;
      }
    }
  }

  trackCoinCatch(value: number, combo: number, multiplier: number) {
    this.track('coin_catch', { value, combo, multiplier });
  }

  trackPowerUpUsed(powerUpType: string, duration: number) {
    this.track('powerup_used', { powerUpType, duration });
  }

  trackAchievementUnlocked(achievementId: string, reward: any) {
    this.track('achievement_unlocked', { achievementId, reward });
  }

  // Monetization Events
  trackPurchaseInitiated(productId: string, price: number) {
    this.track('purchase_initiated', { productId, price });
  }

  trackPurchaseCompleted(productId: string, price: number, currency: string) {
    this.track('purchase_completed', { productId, price, currency });
    
    if (this.currentSession) {
      this.currentSession.purchasesMade++;
      this.currentSession.purchaseValue += price;
    }
  }

  trackAdRequested(adType: string, placement: string) {
    this.track('ad_requested', { adType, placement });
  }

  trackAdWatched(adType: string, placement: string, reward?: any) {
    this.track('ad_watched', { adType, placement, reward });
    
    if (this.currentSession) {
      this.currentSession.adsWatched++;
    }
  }

  // User Behavior Events
  trackScreenView(screenName: string, previousScreen?: string) {
    this.track('screen_view', { screenName, previousScreen });
  }

  trackButtonClick(buttonName: string, screen: string) {
    this.track('button_click', { buttonName, screen });
  }

  trackTutorialStep(step: number, completed: boolean) {
    this.track('tutorial_step', { step, completed });
  }

  trackSocialAction(action: string, target?: string) {
    this.track('social_action', { action, target });
  }

  // Session Management
  private startSession() {
    const sessionId = this.generateSessionId();
    this.currentSession = {
      sessionId,
      startTime: new Date().toISOString(),
      duration: 0,
      coinsEarned: 0,
      coinsSpent: 0,
      gamesPlayed: 0,
      highScore: 0,
      adsWatched: 0,
      purchasesMade: 0,
      purchaseValue: 0,
      crashes: 0,
      errors: [],
    };

    this.track('session_start', {
      sessionId,
      previousSessionEnd: this.getLastSessionEnd(),
    });
  }

  endSession() {
    if (!this.currentSession) return;

    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.duration = Date.now() - new Date(this.currentSession.startTime).getTime();

    this.track('session_end', {
      sessionId: this.currentSession.sessionId,
      metrics: this.currentSession,
    });

    this.flushEvents();
    this.currentSession = null;
  }

  // Error Tracking
  trackError(error: Error, context?: any) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context,
    });

    if (this.currentSession) {
      this.currentSession.errors.push(error.message);
    }
  }

  trackCrash(error: Error) {
    this.track('crash', {
      message: error.message,
      stack: error.stack,
    });

    if (this.currentSession) {
      this.currentSession.crashes++;
    }

    // Force flush on crash
    this.flushEvents();
  }

  // A/B Testing
  trackExperiment(experimentId: string, variant: string, properties?: any) {
    this.track('experiment_exposure', {
      experimentId,
      variant,
      ...properties,
    });
  }

  // Custom Events
  trackCustom(eventName: string, properties: Record<string, any>) {
    this.track(`custom_${eventName}`, properties);
  }

  // Player Metrics Calculation
  async calculatePlayerMetrics(userId: string): Promise<UserMetrics> {
    const events = await this.getEventsForUser(userId);
    
    const firstSeen = events[0]?.timestamp || new Date().toISOString();
    const lastSeen = events[events.length - 1]?.timestamp || new Date().toISOString();
    
    const sessions = events.filter(e => e.eventType === 'session_start').length;
    const playTime = events
      .filter(e => e.eventType === 'session_end')
      .reduce((sum, e) => sum + (e.properties.metrics?.duration || 0), 0);
    
    const coinsEarned = events
      .filter(e => e.eventType === 'coin_catch')
      .reduce((sum, e) => sum + (e.properties.value || 0), 0);
    
    const purchases = events.filter(e => e.eventType === 'purchase_completed');
    const purchaseValue = purchases.reduce((sum, e) => sum + (e.properties.price || 0), 0);
    
    const daysPlayed = this.calculateUniqueDays(events);
    const retentionCohort = this.calculateRetentionCohort(firstSeen);
    const churnRisk = this.calculateChurnRisk(lastSeen, sessions, daysPlayed);
    
    return {
      userId,
      firstSeen,
      lastSeen,
      totalSessions: sessions,
      totalPlayTime: playTime,
      totalCoinsEarned: coinsEarned,
      totalCoinsSpent: 0, // Calculate from spend events
      totalPurchases: purchases.length,
      purchaseValue,
      averageSessionLength: playTime / (sessions || 1),
      daysPlayed,
      currentStreak: 0, // Calculate from daily login events
      longestStreak: 0,
      retentionCohort,
      ltv: purchaseValue + (coinsEarned * 0.001), // Estimated LTV
      churnRisk,
    };
  }

  // Helper Methods
  private categorizeEvent(eventType: string): AnalyticsEvent['category'] {
    if (eventType.includes('game_') || eventType.includes('coin_') || eventType.includes('powerup_')) {
      return 'gameplay';
    }
    if (eventType.includes('purchase_') || eventType.includes('ad_')) {
      return 'monetization';
    }
    if (eventType.includes('session_') || eventType.includes('screen_') || eventType.includes('tutorial_')) {
      return 'engagement';
    }
    if (eventType.includes('error') || eventType.includes('crash')) {
      return 'technical';
    }
    return 'user_action';
  }

  private isCriticalEvent(eventType: string): boolean {
    const criticalEvents = [
      'purchase_completed',
      'crash',
      'error',
      'session_end',
      'user_signup',
      'user_delete',
    ];
    return criticalEvents.includes(eventType);
  }

  private processEventTriggers(event: AnalyticsEvent) {
    // Trigger real-time alerts for critical events
    if (event.eventType === 'crash') {
      this.sendAlert('App Crash Detected', event);
    }
    if (event.eventType === 'purchase_completed' && event.properties.price > 50) {
      this.sendAlert('High Value Purchase', event);
    }
  }

  private async sendAlert(type: string, event: AnalyticsEvent) {
    // Send to admin dashboard or notification service
    console.log(`ALERT: ${type}`, event);
  }

  private calculateUniqueDays(events: AnalyticsEvent[]): number {
    const days = new Set(
      events.map(e => new Date(e.timestamp).toDateString())
    );
    return days.size;
  }

  private calculateRetentionCohort(firstSeen: string): string {
    const daysAgo = Math.floor((Date.now() - new Date(firstSeen).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) return 'D0';
    if (daysAgo === 1) return 'D1';
    if (daysAgo <= 7) return 'D7';
    if (daysAgo <= 30) return 'D30';
    return 'D30+';
  }

  private calculateChurnRisk(lastSeen: string, sessions: number, daysPlayed: number): 'low' | 'medium' | 'high' {
    const daysSinceLastSeen = Math.floor((Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastSeen > 7) return 'high';
    if (daysSinceLastSeen > 3) return 'medium';
    if (sessions < 3) return 'medium';
    if (daysPlayed < 2) return 'high';
    return 'low';
  }

  // Data Persistence
  private async loadQueuedEvents() {
    try {
      const queued = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (queued) {
        this.events = JSON.parse(queued);
      }
    } catch (error) {
      console.error('Error loading queued events:', error);
    }
  }

  private async saveQueuedEvents() {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.error('Error saving queued events:', error);
    }
  }

  // Batch Processing
  private startBatchTimer() {
    this.batchTimer = setInterval(() => {
      if (this.events.length >= this.BATCH_SIZE) {
        this.flushEvents();
      }
    }, this.BATCH_INTERVAL);
  }

  async flushEvents() {
    if (this.events.length === 0) return;

    const batch = [...this.events];
    this.events = [];

    try {
      await this.sendBatch(batch);
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      // Re-queue events on failure
      this.events = [...batch, ...this.events];
      await this.saveQueuedEvents();
      console.error('Error flushing events:', error);
    }
  }

  private async sendBatch(events: AnalyticsEvent[]) {
    const response = await fetch(this.ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ANALYTICS_API_KEY || '',
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
  }

  // Utility Methods
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLastSessionEnd(): string | null {
    // Get from storage or previous session
    return null;
  }

  private async getEventsForUser(userId: string): Promise<AnalyticsEvent[]> {
    // In production, fetch from backend
    return this.events.filter(e => e.userId === userId);
  }

  // Public API for Admin Dashboard
  async getRealtimeMetrics() {
    return {
      activeUsers: await this.getActiveUserCount(),
      currentRevenue: await this.getTodayRevenue(),
      sessionsToday: await this.getTodaySessions(),
      crashRate: await this.getCrashRate(),
      topEvents: await this.getTopEvents(),
    };
  }

  private async getActiveUserCount(): Promise<number> {
    // Count unique users in last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const activeUsers = new Set(
      this.events
        .filter(e => new Date(e.timestamp).getTime() > fiveMinutesAgo)
        .map(e => e.userId)
        .filter(Boolean)
    );
    return activeUsers.size;
  }

  private async getTodayRevenue(): Promise<number> {
    const today = new Date().toDateString();
    return this.events
      .filter(e => e.eventType === 'purchase_completed' && new Date(e.timestamp).toDateString() === today)
      .reduce((sum, e) => sum + (e.properties.price || 0), 0);
  }

  private async getTodaySessions(): Promise<number> {
    const today = new Date().toDateString();
    return this.events
      .filter(e => e.eventType === 'session_start' && new Date(e.timestamp).toDateString() === today)
      .length;
  }

  private async getCrashRate(): Promise<number> {
    const sessions = this.events.filter(e => e.eventType === 'session_start').length;
    const crashes = this.events.filter(e => e.eventType === 'crash').length;
    return sessions > 0 ? (crashes / sessions) * 100 : 0;
  }

  private async getTopEvents(): Promise<{ event: string; count: number }[]> {
    const eventCounts: Record<string, number> = {};
    this.events.forEach(e => {
      eventCounts[e.eventType] = (eventCounts[e.eventType] || 0) + 1;
    });
    
    return Object.entries(eventCounts)
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

export const analyticsSystem = AnalyticsSystem.getInstance();