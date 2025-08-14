/**
 * LiveOps Management System
 * Real-time game operations, events, and remote configuration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { telemetrySystem, EventType } from './TelemetrySystem';

export interface LiveOpsConfig {
  // Feature Flags
  features: {
    doubleCoins: boolean;
    specialEvent: boolean;
    newSkins: boolean;
    battlePass: boolean;
    tournaments: boolean;
    dailyChallenges: boolean;
    socialFeatures: boolean;
    offlineMode: boolean;
  };
  
  // Game Balancing
  balancing: {
    coinSpawnRate: number;
    scoreMultiplier: number;
    powerUpDuration: number;
    difficultyMultiplier: number;
    magnetRange: number;
    minCoinValue: number;
    maxCoinValue: number;
    specialCoinChance: number;
  };
  
  // Monetization
  monetization: {
    iapPriceMultiplier: number;
    saleActive: boolean;
    saleDiscount: number;
    offerRotation: string[];
    bundleDeals: BundleDeal[];
    currencyExchangeRate: number;
    adFrequency: number;
    rewardedAdBonus: number;
  };
  
  // Events
  events: {
    current: LiveEvent | null;
    upcoming: LiveEvent[];
    seasonal: SeasonalEvent | null;
  };
  
  // A/B Testing
  experiments: {
    [key: string]: ExperimentConfig;
  };
  
  // Messages
  messages: {
    motd: string; // Message of the day
    alerts: Alert[];
    news: NewsItem[];
  };
  
  // Maintenance
  maintenance: {
    enabled: boolean;
    message: string;
    estimatedEnd: number;
    allowedUsers: string[];
  };
}

export interface LiveEvent {
  id: string;
  name: string;
  type: 'tournament' | 'challenge' | 'special' | 'seasonal';
  startTime: number;
  endTime: number;
  active: boolean;
  config: {
    scoreMultiplier: number;
    coinMultiplier: number;
    specialRewards: Reward[];
    leaderboard: boolean;
    entryFee?: number;
  };
  requirements: {
    minLevel?: number;
    minScore?: number;
    previousEventId?: string;
  };
}

export interface SeasonalEvent {
  id: string;
  name: string;
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'holiday';
  theme: string;
  startDate: number;
  endDate: number;
  rewards: {
    daily: Reward[];
    weekly: Reward[];
    seasonal: Reward[];
  };
  specialSkins: string[];
  questLine: Quest[];
}

export interface BundleDeal {
  id: string;
  name: string;
  price: number;
  contents: {
    coins?: number;
    gems?: number;
    skins?: string[];
    powerUps?: { [key: string]: number };
  };
  discount: number;
  expiresAt: number;
  limitPerUser: number;
}

export interface Reward {
  type: 'coins' | 'gems' | 'skin' | 'powerup' | 'xp';
  amount?: number;
  itemId?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  rewards: Reward[];
  unlockRequirements?: {
    previousQuestId?: string;
    level?: number;
  };
}

export interface QuestObjective {
  type: 'collect_coins' | 'score_points' | 'play_games' | 'use_powerup' | 'complete_challenge';
  target: number;
  current: number;
  completed: boolean;
}

export interface ExperimentConfig {
  id: string;
  name: string;
  enabled: boolean;
  variants: {
    [key: string]: any;
  };
  allocation: {
    [variant: string]: number; // Percentage
  };
  metrics: string[];
  startDate: number;
  endDate?: number;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'urgent';
  title: string;
  message: string;
  actionButton?: {
    text: string;
    action: string;
  };
  expiresAt: number;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  link?: string;
  publishedAt: number;
  priority: number;
}

interface CachedConfig {
  config: LiveOpsConfig;
  timestamp: number;
  version: string;
}

class LiveOpsManager {
  private static instance: LiveOpsManager;
  private config: LiveOpsConfig;
  private cachedConfig: CachedConfig | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private eventTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Configuration
  private readonly CONFIG_URL = 'https://api.potofgold.app/liveops/config';
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_KEY = '@liveops_config';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  private constructor() {
    this.config = this.getDefaultConfig();
    this.initialize();
  }
  
  static getInstance(): LiveOpsManager {
    if (!LiveOpsManager.instance) {
      LiveOpsManager.instance = new LiveOpsManager();
    }
    return LiveOpsManager.instance;
  }
  
  private getDefaultConfig(): LiveOpsConfig {
    return {
      features: {
        doubleCoins: false,
        specialEvent: false,
        newSkins: true,
        battlePass: false,
        tournaments: true,
        dailyChallenges: true,
        socialFeatures: true,
        offlineMode: true
      },
      balancing: {
        coinSpawnRate: 1.0,
        scoreMultiplier: 1.0,
        powerUpDuration: 10000,
        difficultyMultiplier: 1.0,
        magnetRange: 100,
        minCoinValue: 1,
        maxCoinValue: 10,
        specialCoinChance: 0.1
      },
      monetization: {
        iapPriceMultiplier: 1.0,
        saleActive: false,
        saleDiscount: 0,
        offerRotation: ['starter_pack', 'value_bundle', 'premium_pack'],
        bundleDeals: [],
        currencyExchangeRate: 100, // 100 coins = 1 gem
        adFrequency: 3, // Show ad every 3 games
        rewardedAdBonus: 50 // Bonus coins for watching ad
      },
      events: {
        current: null,
        upcoming: [],
        seasonal: null
      },
      experiments: {},
      messages: {
        motd: 'Welcome to Pot of Gold! 🏺💰',
        alerts: [],
        news: []
      },
      maintenance: {
        enabled: false,
        message: '',
        estimatedEnd: 0,
        allowedUsers: []
      }
    };
  }
  
  private async initialize(): Promise<void> {
    // Load cached config
    await this.loadCachedConfig();
    
    // Fetch latest config
    await this.fetchRemoteConfig();
    
    // Start update timer
    this.startUpdateTimer();
    
    // Initialize event timers
    this.initializeEventTimers();
    
    // Track initialization
    telemetrySystem.track(EventType.SESSION_START, {
      liveops_version: this.cachedConfig?.version || 'default',
      features_enabled: Object.keys(this.config.features).filter(f => 
        this.config.features[f as keyof typeof this.config.features]
      )
    });
  }
  
  private async loadCachedConfig(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cached) {
        this.cachedConfig = JSON.parse(cached);
        
        // Check if cache is still valid
        if (Date.now() - this.cachedConfig.timestamp < this.CACHE_DURATION) {
          this.config = this.cachedConfig.config;
          console.log('Loaded cached LiveOps config:', this.cachedConfig.version);
        }
      }
    } catch (error) {
      console.error('Failed to load cached config:', error);
    }
  }
  
  private async fetchRemoteConfig(): Promise<void> {
    try {
      // In production, this would fetch from your backend
      if (__DEV__) {
        // Use mock config for development
        this.applyMockConfig();
        return;
      }
      
      const response = await fetch(this.CONFIG_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Version': '1.0.0',
          'X-Platform': Platform.OS
        }
      });
      
      if (response.ok) {
        const remoteConfig = await response.json();
        this.config = { ...this.config, ...remoteConfig };
        
        // Cache the config
        this.cachedConfig = {
          config: this.config,
          timestamp: Date.now(),
          version: remoteConfig.version || 'unknown'
        };
        
        await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cachedConfig));
        
        console.log('Updated LiveOps config:', this.cachedConfig.version);
        
        // Reinitialize event timers with new config
        this.initializeEventTimers();
      }
    } catch (error) {
      console.error('Failed to fetch remote config:', error);
    }
  }
  
  private applyMockConfig(): void {
    // Development/testing configuration
    const now = Date.now();
    
    this.config = {
      ...this.getDefaultConfig(),
      features: {
        ...this.config.features,
        doubleCoins: true, // Enable for testing
        specialEvent: true,
        tournaments: true
      },
      events: {
        current: {
          id: 'weekend_tournament',
          name: 'Weekend Gold Rush',
          type: 'tournament',
          startTime: now,
          endTime: now + (2 * 24 * 60 * 60 * 1000), // 2 days
          active: true,
          config: {
            scoreMultiplier: 2.0,
            coinMultiplier: 1.5,
            specialRewards: [
              { type: 'coins', amount: 5000 },
              { type: 'skin', itemId: 'tournament_winner_skin' }
            ],
            leaderboard: true
          },
          requirements: {
            minLevel: 1
          }
        },
        upcoming: [
          {
            id: 'halloween_event',
            name: 'Spooky Gold Hunt',
            type: 'seasonal',
            startTime: now + (7 * 24 * 60 * 60 * 1000), // Next week
            endTime: now + (14 * 24 * 60 * 60 * 1000), // 2 weeks
            active: false,
            config: {
              scoreMultiplier: 3.0,
              coinMultiplier: 2.0,
              specialRewards: [
                { type: 'skin', itemId: 'halloween_pot', rarity: 'legendary' }
              ],
              leaderboard: true
            },
            requirements: {}
          }
        ],
        seasonal: null
      },
      monetization: {
        ...this.config.monetization,
        saleActive: true,
        saleDiscount: 25,
        bundleDeals: [
          {
            id: 'starter_pack',
            name: 'Starter Pack',
            price: 0.99,
            contents: {
              coins: 1000,
              gems: 50,
              powerUps: { magnet: 3, doubleCoins: 2 }
            },
            discount: 50,
            expiresAt: now + (24 * 60 * 60 * 1000),
            limitPerUser: 1
          }
        ]
      },
      messages: {
        motd: '🎃 Halloween Event Coming Soon! Get ready for spooky rewards!',
        alerts: [
          {
            id: 'sale_alert',
            type: 'info',
            title: '⚡ Flash Sale!',
            message: '25% off all purchases for the next 24 hours!',
            actionButton: {
              text: 'Shop Now',
              action: 'navigate:shop'
            },
            expiresAt: now + (24 * 60 * 60 * 1000)
          }
        ],
        news: [
          {
            id: 'update_1_1',
            title: 'Version 1.1 Coming Soon!',
            content: 'New skins, power-ups, and tournament mode!',
            publishedAt: now,
            priority: 1
          }
        ]
      }
    };
  }
  
  private startUpdateTimer(): void {
    this.updateInterval = setInterval(() => {
      this.fetchRemoteConfig();
    }, this.UPDATE_INTERVAL);
  }
  
  private initializeEventTimers(): void {
    // Clear existing timers
    this.eventTimers.forEach(timer => clearTimeout(timer));
    this.eventTimers.clear();
    
    // Set up event start/end timers
    if (this.config.events.current) {
      this.scheduleEventEnd(this.config.events.current);
    }
    
    this.config.events.upcoming.forEach(event => {
      this.scheduleEventStart(event);
    });
  }
  
  private scheduleEventStart(event: LiveEvent): void {
    const timeUntilStart = event.startTime - Date.now();
    
    if (timeUntilStart > 0) {
      const timer = setTimeout(() => {
        this.activateEvent(event);
      }, timeUntilStart);
      
      this.eventTimers.set(`start_${event.id}`, timer);
    }
  }
  
  private scheduleEventEnd(event: LiveEvent): void {
    const timeUntilEnd = event.endTime - Date.now();
    
    if (timeUntilEnd > 0) {
      const timer = setTimeout(() => {
        this.deactivateEvent(event);
      }, timeUntilEnd);
      
      this.eventTimers.set(`end_${event.id}`, timer);
    }
  }
  
  private activateEvent(event: LiveEvent): void {
    event.active = true;
    this.config.events.current = event;
    
    // Remove from upcoming
    this.config.events.upcoming = this.config.events.upcoming.filter(e => e.id !== event.id);
    
    // Track event start
    telemetrySystem.track(EventType.SESSION_START, {
      event_started: event.id,
      event_type: event.type
    });
    
    // Schedule end
    this.scheduleEventEnd(event);
    
    console.log(`Event activated: ${event.name}`);
  }
  
  private deactivateEvent(event: LiveEvent): void {
    event.active = false;
    
    if (this.config.events.current?.id === event.id) {
      this.config.events.current = null;
    }
    
    // Track event end
    telemetrySystem.track(EventType.SESSION_END, {
      event_ended: event.id,
      event_type: event.type
    });
    
    console.log(`Event deactivated: ${event.name}`);
  }
  
  // Public API
  
  getConfig(): LiveOpsConfig {
    return { ...this.config };
  }
  
  getFeatureFlag(feature: keyof LiveOpsConfig['features']): boolean {
    return this.config.features[feature] || false;
  }
  
  getBalancing(param: keyof LiveOpsConfig['balancing']): number {
    return this.config.balancing[param] || 1;
  }
  
  getCurrentEvent(): LiveEvent | null {
    return this.config.events.current;
  }
  
  getUpcomingEvents(): LiveEvent[] {
    return [...this.config.events.upcoming];
  }
  
  isEventActive(eventId: string): boolean {
    return this.config.events.current?.id === eventId && this.config.events.current.active;
  }
  
  getActiveModifiers(): {
    scoreMultiplier: number;
    coinMultiplier: number;
  } {
    let scoreMultiplier = this.config.balancing.scoreMultiplier;
    let coinMultiplier = 1.0;
    
    // Apply event modifiers
    if (this.config.events.current?.active) {
      scoreMultiplier *= this.config.events.current.config.scoreMultiplier;
      coinMultiplier *= this.config.events.current.config.coinMultiplier;
    }
    
    // Apply feature modifiers
    if (this.config.features.doubleCoins) {
      coinMultiplier *= 2.0;
    }
    
    return { scoreMultiplier, coinMultiplier };
  }
  
  getBundleDeals(): BundleDeal[] {
    const now = Date.now();
    return this.config.monetization.bundleDeals.filter(deal => 
      deal.expiresAt > now
    );
  }
  
  getMessages(): {
    motd: string;
    alerts: Alert[];
    news: NewsItem[];
  } {
    const now = Date.now();
    
    return {
      motd: this.config.messages.motd,
      alerts: this.config.messages.alerts.filter(alert => alert.expiresAt > now),
      news: this.config.messages.news.sort((a, b) => b.priority - a.priority)
    };
  }
  
  isInMaintenance(): boolean {
    return this.config.maintenance.enabled;
  }
  
  getMaintenanceInfo(): {
    message: string;
    estimatedEnd: number;
  } | null {
    if (!this.config.maintenance.enabled) return null;
    
    return {
      message: this.config.maintenance.message,
      estimatedEnd: this.config.maintenance.estimatedEnd
    };
  }
  
  // A/B Testing
  getExperimentVariant(experimentId: string, userId: string): string {
    const experiment = this.config.experiments[experimentId];
    if (!experiment || !experiment.enabled) return 'control';
    
    // Simple hash-based allocation
    const hash = this.hashString(userId + experimentId);
    const allocation = hash % 100;
    
    let cumulative = 0;
    for (const [variant, percentage] of Object.entries(experiment.allocation)) {
      cumulative += percentage;
      if (allocation < cumulative) {
        return variant;
      }
    }
    
    return 'control';
  }
  
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  // Admin functions
  async overrideConfig(overrides: Partial<LiveOpsConfig>): Promise<void> {
    this.config = { ...this.config, ...overrides };
    
    // Save override
    this.cachedConfig = {
      config: this.config,
      timestamp: Date.now(),
      version: 'override'
    };
    
    await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cachedConfig));
    
    // Reinitialize timers
    this.initializeEventTimers();
  }
  
  async resetToDefault(): Promise<void> {
    this.config = this.getDefaultConfig();
    await AsyncStorage.removeItem(this.CACHE_KEY);
    this.cachedConfig = null;
  }
  
  // Cleanup
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.eventTimers.forEach(timer => clearTimeout(timer));
    this.eventTimers.clear();
  }
}

// Export singleton instance
export const liveOpsManager = LiveOpsManager.getInstance();

// Convenience functions
export function isFeatureEnabled(feature: keyof LiveOpsConfig['features']): boolean {
  return liveOpsManager.getFeatureFlag(feature);
}

export function getActiveEvent(): LiveEvent | null {
  return liveOpsManager.getCurrentEvent();
}

export function getGameModifiers(): { scoreMultiplier: number; coinMultiplier: number } {
  return liveOpsManager.getActiveModifiers();
}

export function isMaintenanceMode(): boolean {
  return liveOpsManager.isInMaintenance();
}