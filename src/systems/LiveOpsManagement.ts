import { eventBus } from '../core/EventBus';
import { GameEventType, gameEvents } from '../core/GameEvents';

export interface LiveEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  status: 'scheduled' | 'active' | 'ended';
  startTime: number;
  endTime: number;
  config: EventConfig;
  rewards: EventRewards;
  leaderboard?: Leaderboard;
  requirements?: EventRequirements;
  progression?: EventProgression;
  analytics: EventAnalytics;
}

export enum EventType {
  DOUBLE_GOLD = 'double_gold',
  HAPPY_HOUR = 'happy_hour',
  WEEKEND_RUSH = 'weekend_rush',
  SEASONAL = 'seasonal',
  FLASH_SALE = 'flash_sale',
  TOURNAMENT = 'tournament',
  COMMUNITY_GOAL = 'community_goal',
  LIMITED_TIME_SHOP = 'limited_time_shop',
  SPECIAL_BOSS = 'special_boss',
  MYSTERY_BOX = 'mystery_box',
}

export interface EventConfig {
  multipliers?: {
    gold?: number;
    xp?: number;
    items?: number;
    score?: number;
  };
  specialItems?: string[];
  discounts?: Map<string, number>;
  rules?: string[];
  theme?: EventTheme;
  difficulty?: number;
  playerSegments?: PlayerSegment[];
}

export interface EventTheme {
  name: string;
  colors: { primary: string; secondary: string; accent: string };
  assets: { background: string; icon: string; music?: string };
  particles?: string[];
}

export interface EventRewards {
  participation: { gold: number; gems: number; items: string[] };
  milestones: MilestoneReward[];
  leaderboard: LeaderboardRewards;
  completion: { gold: number; gems: number; items: string[]; exclusive?: string };
}

export interface MilestoneReward {
  threshold: number;
  rewards: { gold: number; gems: number; items: string[] };
  claimed: boolean;
}

export interface LeaderboardRewards {
  top1: { gold: number; gems: number; items: string[]; title?: string };
  top10: { gold: number; gems: number; items: string[] };
  top100: { gold: number; gems: number; items: string[] };
  top1000: { gold: number; gems: number; items: string[] };
}

export interface Leaderboard {
  entries: LeaderboardEntry[];
  lastUpdated: number;
  updateInterval: number;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
  avatar: string;
  rewards?: any;
}

export interface EventRequirements {
  minLevel?: number;
  maxLevel?: number;
  vipOnly?: boolean;
  regionRestriction?: string[];
  deviceRestriction?: string[];
}

export interface EventProgression {
  currentProgress: number;
  targetProgress: number;
  checkpoints: ProgressCheckpoint[];
}

export interface ProgressCheckpoint {
  value: number;
  reward: { gold: number; gems: number; items: string[] };
  reached: boolean;
}

export interface EventAnalytics {
  participants: number;
  revenue: number;
  engagement: number;
  completionRate: number;
  averageSessionTime: number;
  topSpenders: string[];
}

export interface PlayerSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria;
  customConfig?: Partial<EventConfig>;
}

export interface SegmentCriteria {
  spendingTier?: 'whale' | 'dolphin' | 'minnow' | 'f2p';
  playTime?: { min?: number; max?: number };
  level?: { min?: number; max?: number };
  lastActive?: { daysAgo: number };
  region?: string[];
}

export interface ABTestConfig {
  id: string;
  name: string;
  variants: ABVariant[];
  metrics: string[];
  status: 'running' | 'completed' | 'paused';
}

export interface ABVariant {
  id: string;
  name: string;
  weight: number; // Distribution percentage
  config: any;
  performance: {
    conversion: number;
    revenue: number;
    retention: number;
  };
}

export interface RemoteConfig {
  version: number;
  lastUpdated: number;
  features: Map<string, boolean>;
  values: Map<string, any>;
  experiments: ABTestConfig[];
}

export class LiveOpsManagement {
  private static instance: LiveOpsManagement;
  private activeEvents: Map<string, LiveEvent> = new Map();
  private scheduledEvents: LiveEvent[] = [];
  private remoteConfig: RemoteConfig;
  private updateInterval: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private eventCalendar: Map<string, LiveEvent[]> = new Map(); // date -> events
  private playerSegments: Map<string, PlayerSegment> = new Map();
  private abTests: Map<string, ABTestConfig> = new Map();
  private eventHistory: LiveEvent[] = [];
  private personalizedOffers: Map<string, any> = new Map();

  private constructor() {
    this.remoteConfig = this.getDefaultRemoteConfig();
    this.setupEventListeners();
    this.startUpdateLoop();
    this.startSyncLoop();
  }

  static getInstance(): LiveOpsManagement {
    if (!LiveOpsManagement.instance) {
      LiveOpsManagement.instance = new LiveOpsManagement();
    }
    return LiveOpsManagement.instance;
  }

  private setupEventListeners() {
    eventBus.on('player:login', (data: { playerId: string }) => {
      this.onPlayerLogin(data.playerId);
    });

    eventBus.on('player:action', (data: any) => {
      this.trackPlayerAction(data);
    });

    eventBus.on('purchase:complete', (data: any) => {
      this.trackPurchase(data);
    });
  }

  private startUpdateLoop() {
    this.updateInterval = setInterval(() => {
      this.checkEventSchedule();
      this.updateActiveEvents();
      this.updateLeaderboards();
      this.cleanupEndedEvents();
    }, 60000); // Check every minute
  }

  private startSyncLoop() {
    this.syncInterval = setInterval(() => {
      this.syncWithServer();
    }, 300000); // Sync every 5 minutes
  }

  private async syncWithServer() {
    try {
      const response = await fetch(`${this.getServerUrl()}/liveops/config`);
      const data = await response.json();

      // Update remote config
      this.remoteConfig.version = data.version;
      this.remoteConfig.lastUpdated = Date.now();
      this.remoteConfig.features = new Map(Object.entries(data.features));
      this.remoteConfig.values = new Map(Object.entries(data.values));

      // Update scheduled events
      this.scheduledEvents = data.events || [];

      // Update AB tests
      data.experiments?.forEach((exp: ABTestConfig) => {
        this.abTests.set(exp.id, exp);
      });

      gameEvents.emit(GameEventType.LIVEOPS_UPDATE, {
        version: data.version,
        eventsUpdated: this.scheduledEvents.length,
      });
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  }

  createEvent(eventData: Partial<LiveEvent>): LiveEvent {
    const event: LiveEvent = {
      id: this.generateEventId(),
      name: eventData.name || 'Special Event',
      description: eventData.description || '',
      type: eventData.type || EventType.DOUBLE_GOLD,
      status: 'scheduled',
      startTime: eventData.startTime || Date.now(),
      endTime: eventData.endTime || Date.now() + 3600000,
      config: eventData.config || this.getDefaultEventConfig(eventData.type!),
      rewards: eventData.rewards || this.getDefaultRewards(),
      analytics: {
        participants: 0,
        revenue: 0,
        engagement: 0,
        completionRate: 0,
        averageSessionTime: 0,
        topSpenders: [],
      },
      ...eventData,
    };

    this.scheduledEvents.push(event);
    this.scheduleEvent(event);

    return event;
  }

  private scheduleEvent(event: LiveEvent) {
    const now = Date.now();
    const timeUntilStart = event.startTime - now;

    if (timeUntilStart <= 0) {
      // Event should already be active
      this.activateEvent(event);
    } else {
      // Schedule for future activation
      setTimeout(() => {
        this.activateEvent(event);
      }, timeUntilStart);
    }

    // Add to calendar
    const dateKey = new Date(event.startTime).toDateString();
    if (!this.eventCalendar.has(dateKey)) {
      this.eventCalendar.set(dateKey, []);
    }
    this.eventCalendar.get(dateKey)!.push(event);
  }

  private activateEvent(event: LiveEvent) {
    if (event.status === 'active') return;

    event.status = 'active';
    this.activeEvents.set(event.id, event);

    // Apply event configuration
    this.applyEventConfig(event);

    // Initialize leaderboard if needed
    if (this.requiresLeaderboard(event.type)) {
      event.leaderboard = {
        entries: [],
        lastUpdated: Date.now(),
        updateInterval: 60000,
      };
    }

    // Initialize progression if needed
    if (this.requiresProgression(event.type)) {
      event.progression = {
        currentProgress: 0,
        targetProgress: this.getTargetProgress(event.type),
        checkpoints: this.generateCheckpoints(event),
      };
    }

    gameEvents.emit(GameEventType.LIVEOPS_EVENT_START, {
      eventId: event.id,
      eventType: event.type,
      duration: event.endTime - event.startTime,
      rewards: event.rewards,
    });

    // Schedule event end
    const timeUntilEnd = event.endTime - Date.now();
    setTimeout(() => {
      this.endEvent(event);
    }, timeUntilEnd);

    // Notify players
    this.notifyPlayers(event);
  }

  private endEvent(event: LiveEvent) {
    event.status = 'ended';
    this.activeEvents.delete(event.id);

    // Process final rewards
    this.processFinalRewards(event);

    // Save to history
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > 100) {
      this.eventHistory = this.eventHistory.slice(0, 100);
    }

    gameEvents.emit(GameEventType.LIVEOPS_EVENT_END, {
      eventId: event.id,
      analytics: event.analytics,
    });

    // Remove event configuration
    this.removeEventConfig(event);
  }

  private applyEventConfig(event: LiveEvent) {
    const config = event.config;

    // Apply multipliers
    if (config.multipliers) {
      Object.entries(config.multipliers).forEach(([type, value]) => {
        eventBus.emit('multiplier:apply', { type, value });
      });
    }

    // Enable special items
    if (config.specialItems) {
      config.specialItems.forEach(itemId => {
        eventBus.emit('item:enable:special', { itemId });
      });
    }

    // Apply theme
    if (config.theme) {
      eventBus.emit('theme:apply', { theme: config.theme });
    }
  }

  private removeEventConfig(event: LiveEvent) {
    const config = event.config;

    // Remove multipliers
    if (config.multipliers) {
      Object.keys(config.multipliers).forEach(type => {
        eventBus.emit('multiplier:remove', { type });
      });
    }

    // Disable special items
    if (config.specialItems) {
      config.specialItems.forEach(itemId => {
        eventBus.emit('item:disable:special', { itemId });
      });
    }

    // Remove theme
    if (config.theme) {
      eventBus.emit('theme:remove');
    }
  }

  private checkEventSchedule() {
    const now = Date.now();

    this.scheduledEvents.forEach(event => {
      if (event.status === 'scheduled' && event.startTime <= now) {
        this.activateEvent(event);
      }
    });
  }

  private updateActiveEvents() {
    const now = Date.now();

    this.activeEvents.forEach(event => {
      if (event.endTime <= now) {
        this.endEvent(event);
      } else {
        // Update event analytics
        this.updateEventAnalytics(event);
      }
    });
  }

  private updateLeaderboards() {
    this.activeEvents.forEach(event => {
      if (event.leaderboard) {
        this.updateLeaderboard(event);
      }
    });
  }

  private async updateLeaderboard(event: LiveEvent) {
    if (!event.leaderboard) return;

    try {
      const response = await fetch(`${this.getServerUrl()}/liveops/leaderboard/${event.id}`);
      const data = await response.json();

      event.leaderboard.entries = data.entries;
      event.leaderboard.lastUpdated = Date.now();

      eventBus.emit('leaderboard:updated', {
        eventId: event.id,
        entries: data.entries.slice(0, 10), // Top 10
      });
    } catch (error) {
      console.error('Failed to update leaderboard:', error);
    }
  }

  private cleanupEndedEvents() {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    this.scheduledEvents = this.scheduledEvents.filter(event => {
      return event.status !== 'ended' || event.endTime > cutoffTime;
    });
  }

  private onPlayerLogin(playerId: string) {
    // Check for personalized offers
    this.generatePersonalizedOffer(playerId);

    // Check AB test assignment
    this.assignPlayerToABTests(playerId);

    // Show active events
    this.showActiveEventsToPlayer(playerId);
  }

  private async generatePersonalizedOffer(playerId: string) {
    const playerData = await this.getPlayerData(playerId);
    const segment = this.determinePlayerSegment(playerData);

    if (segment === 'whale') {
      this.createPersonalizedEvent({
        playerId,
        type: EventType.FLASH_SALE,
        config: {
          discounts: new Map([
            ['mega_bundle', 30],
            ['vip_subscription', 20],
          ]),
        },
        duration: 3600000, // 1 hour
      });
    } else if (segment === 'at_risk') {
      this.createPersonalizedEvent({
        playerId,
        type: EventType.DOUBLE_GOLD,
        config: {
          multipliers: { gold: 3, xp: 2 },
        },
        duration: 7200000, // 2 hours
      });
    }
  }

  private assignPlayerToABTests(playerId: string) {
    this.abTests.forEach(test => {
      if (test.status === 'running') {
        const variant = this.selectVariant(test, playerId);
        this.applyVariantConfig(playerId, variant);
      }
    });
  }

  private selectVariant(test: ABTestConfig, playerId: string): ABVariant {
    // Use consistent hashing for assignment
    const hash = this.hashPlayerId(playerId);
    const normalized = hash / 0xFFFFFFFF;
    
    let accumulated = 0;
    for (const variant of test.variants) {
      accumulated += variant.weight / 100;
      if (normalized <= accumulated) {
        return variant;
      }
    }

    return test.variants[test.variants.length - 1];
  }

  private hashPlayerId(playerId: string): number {
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
      const char = playerId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private applyVariantConfig(playerId: string, variant: ABVariant) {
    eventBus.emit('abtest:variant:applied', {
      playerId,
      variantId: variant.id,
      config: variant.config,
    });
  }

  private trackPlayerAction(data: any) {
    // Update event progression
    this.activeEvents.forEach(event => {
      if (event.progression && this.actionContributesToEvent(data.action, event.type)) {
        event.progression.currentProgress += data.value || 1;
        this.checkProgressionMilestones(event, data.playerId);
      }
    });

    // Update leaderboards
    this.updatePlayerLeaderboardScore(data.playerId, data.value || 1);
  }

  private trackPurchase(data: any) {
    // Update event analytics
    this.activeEvents.forEach(event => {
      event.analytics.revenue += data.amount;
      
      if (!event.analytics.topSpenders.includes(data.playerId)) {
        event.analytics.topSpenders.push(data.playerId);
      }
    });

    // Track AB test conversion
    this.trackABTestConversion(data.playerId, data.amount);
  }

  private trackABTestConversion(playerId: string, amount: number) {
    this.abTests.forEach(test => {
      const variant = this.getPlayerVariant(test, playerId);
      if (variant) {
        variant.performance.conversion++;
        variant.performance.revenue += amount;
      }
    });
  }

  private getPlayerVariant(test: ABTestConfig, playerId: string): ABVariant | null {
    // Get assigned variant for player
    return this.selectVariant(test, playerId);
  }

  private checkProgressionMilestones(event: LiveEvent, playerId: string) {
    if (!event.progression) return;

    event.progression.checkpoints.forEach(checkpoint => {
      if (!checkpoint.reached && event.progression!.currentProgress >= checkpoint.value) {
        checkpoint.reached = true;
        this.awardCheckpointReward(playerId, checkpoint.reward);
      }
    });

    // Check completion
    if (event.progression.currentProgress >= event.progression.targetProgress) {
      this.awardCompletionReward(playerId, event.rewards.completion);
    }
  }

  private awardCheckpointReward(playerId: string, reward: any) {
    gameEvents.emit(GameEventType.CURRENCY_EARNED, {
      type: 'gold',
      amount: reward.gold,
      source: 'event_checkpoint',
    });

    if (reward.gems > 0) {
      gameEvents.emit(GameEventType.CURRENCY_EARNED, {
        type: 'gems',
        amount: reward.gems,
        source: 'event_checkpoint',
      });
    }
  }

  private awardCompletionReward(playerId: string, reward: any) {
    gameEvents.emit(GameEventType.CURRENCY_EARNED, {
      type: 'gold',
      amount: reward.gold,
      source: 'event_completion',
    });

    if (reward.exclusive) {
      eventBus.emit('item:unlock:exclusive', {
        playerId,
        itemId: reward.exclusive,
      });
    }
  }

  private updatePlayerLeaderboardScore(playerId: string, score: number) {
    this.activeEvents.forEach(event => {
      if (event.leaderboard) {
        const entry = event.leaderboard.entries.find(e => e.playerId === playerId);
        if (entry) {
          entry.score += score;
        } else {
          event.leaderboard.entries.push({
            playerId,
            playerName: 'Player',
            score,
            rank: 0,
            avatar: 'default',
          });
        }

        // Re-sort and update ranks
        event.leaderboard.entries.sort((a, b) => b.score - a.score);
        event.leaderboard.entries.forEach((entry, index) => {
          entry.rank = index + 1;
        });
      }
    });
  }

  private processFinalRewards(event: LiveEvent) {
    if (event.leaderboard) {
      // Award leaderboard rewards
      event.leaderboard.entries.forEach(entry => {
        const rewards = this.getLeaderboardRewards(entry.rank, event.rewards.leaderboard);
        if (rewards) {
          this.awardLeaderboardRewards(entry.playerId, rewards);
        }
      });
    }

    // Award participation rewards to all participants
    if (event.analytics.participants > 0) {
      eventBus.emit('event:participation:rewards', {
        eventId: event.id,
        rewards: event.rewards.participation,
      });
    }
  }

  private getLeaderboardRewards(rank: number, rewards: LeaderboardRewards): any {
    if (rank === 1) return rewards.top1;
    if (rank <= 10) return rewards.top10;
    if (rank <= 100) return rewards.top100;
    if (rank <= 1000) return rewards.top1000;
    return null;
  }

  private awardLeaderboardRewards(playerId: string, rewards: any) {
    eventBus.emit('leaderboard:rewards:awarded', {
      playerId,
      rewards,
    });
  }

  private updateEventAnalytics(event: LiveEvent) {
    // This would normally fetch from server
    event.analytics.participants = this.activeEvents.size * 100; // Placeholder
    event.analytics.engagement = Math.random() * 100;
    event.analytics.completionRate = Math.random() * 100;
  }

  private notifyPlayers(event: LiveEvent) {
    eventBus.emit('notification:broadcast', {
      title: event.name,
      message: event.description,
      type: 'event_start',
      data: { eventId: event.id },
    });
  }

  private showActiveEventsToPlayer(playerId: string) {
    const events = Array.from(this.activeEvents.values());
    eventBus.emit('events:show', {
      playerId,
      events: events.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        timeRemaining: e.endTime - Date.now(),
      })),
    });
  }

  private createPersonalizedEvent(data: any) {
    const event = this.createEvent({
      name: `Special Offer for ${data.playerId}`,
      type: data.type,
      config: data.config,
      startTime: Date.now(),
      endTime: Date.now() + data.duration,
      requirements: {
        minLevel: 1,
      },
    });

    this.personalizedOffers.set(data.playerId, event);
  }

  private requiresLeaderboard(type: EventType): boolean {
    return [EventType.TOURNAMENT, EventType.WEEKEND_RUSH, EventType.COMMUNITY_GOAL].includes(type);
  }

  private requiresProgression(type: EventType): boolean {
    return [EventType.COMMUNITY_GOAL, EventType.SEASONAL, EventType.SPECIAL_BOSS].includes(type);
  }

  private actionContributesToEvent(action: string, eventType: EventType): boolean {
    // Define which actions contribute to which event types
    const contributions: Record<EventType, string[]> = {
      [EventType.COMMUNITY_GOAL]: ['collect', 'win', 'donate'],
      [EventType.SEASONAL]: ['collect', 'complete_quest'],
      [EventType.SPECIAL_BOSS]: ['damage_boss', 'defeat_boss'],
      [EventType.DOUBLE_GOLD]: ['collect_gold'],
      [EventType.HAPPY_HOUR]: ['play'],
      [EventType.WEEKEND_RUSH]: ['win', 'score'],
      [EventType.FLASH_SALE]: [],
      [EventType.TOURNAMENT]: ['win', 'score'],
      [EventType.LIMITED_TIME_SHOP]: [],
      [EventType.MYSTERY_BOX]: ['open_box'],
    };

    return contributions[eventType]?.includes(action) || false;
  }

  private getTargetProgress(type: EventType): number {
    const targets: Record<EventType, number> = {
      [EventType.COMMUNITY_GOAL]: 1000000,
      [EventType.SEASONAL]: 10000,
      [EventType.SPECIAL_BOSS]: 100000,
      [EventType.DOUBLE_GOLD]: 0,
      [EventType.HAPPY_HOUR]: 0,
      [EventType.WEEKEND_RUSH]: 0,
      [EventType.FLASH_SALE]: 0,
      [EventType.TOURNAMENT]: 0,
      [EventType.LIMITED_TIME_SHOP]: 0,
      [EventType.MYSTERY_BOX]: 100,
    };

    return targets[type] || 0;
  }

  private generateCheckpoints(event: LiveEvent): ProgressCheckpoint[] {
    const checkpoints: ProgressCheckpoint[] = [];
    const target = event.progression?.targetProgress || 1000;

    for (let i = 1; i <= 5; i++) {
      checkpoints.push({
        value: (target / 5) * i,
        reward: {
          gold: 1000 * i,
          gems: 10 * i,
          items: [],
        },
        reached: false,
      });
    }

    return checkpoints;
  }

  private async getPlayerData(playerId: string): Promise<any> {
    // Fetch player data from storage/firebase
    return {
      playerId,
      level: 1,
      totalSpent: 0,
      lastActive: Date.now(),
      playTime: 0,
    };
  }

  private determinePlayerSegment(playerData: any): string {
    if (playerData.totalSpent > 1000) return 'whale';
    if (playerData.totalSpent > 100) return 'dolphin';
    if (playerData.totalSpent > 0) return 'minnow';
    if (Date.now() - playerData.lastActive > 7 * 24 * 60 * 60 * 1000) return 'at_risk';
    return 'f2p';
  }

  private getDefaultEventConfig(type: EventType): EventConfig {
    const configs: Record<EventType, EventConfig> = {
      [EventType.DOUBLE_GOLD]: {
        multipliers: { gold: 2 },
      },
      [EventType.HAPPY_HOUR]: {
        multipliers: { gold: 1.5, xp: 1.5 },
      },
      [EventType.WEEKEND_RUSH]: {
        multipliers: { gold: 2, xp: 2, score: 1.5 },
      },
      [EventType.SEASONAL]: {
        theme: {
          name: 'Winter',
          colors: { primary: '#4A90E2', secondary: '#FFFFFF', accent: '#E6F3FF' },
          assets: { background: 'winter_bg', icon: 'snowflake' },
        },
        specialItems: ['snowflake', 'gift_box'],
      },
      [EventType.FLASH_SALE]: {
        discounts: new Map([['starter_pack', 50], ['gem_bundle', 30]]),
      },
      [EventType.TOURNAMENT]: {
        rules: ['Best of 3 rounds', 'No powerups'],
        difficulty: 2,
      },
      [EventType.COMMUNITY_GOAL]: {
        multipliers: { gold: 1.5 },
      },
      [EventType.LIMITED_TIME_SHOP]: {
        specialItems: ['exclusive_skin', 'rare_powerup'],
      },
      [EventType.SPECIAL_BOSS]: {
        difficulty: 3,
        specialItems: ['boss_weapon'],
      },
      [EventType.MYSTERY_BOX]: {
        specialItems: ['mystery_key'],
      },
    };

    return configs[type] || {};
  }

  private getDefaultRewards(): EventRewards {
    return {
      participation: { gold: 100, gems: 5, items: [] },
      milestones: [],
      leaderboard: {
        top1: { gold: 10000, gems: 500, items: ['exclusive_crown'] },
        top10: { gold: 5000, gems: 200, items: ['rare_badge'] },
        top100: { gold: 1000, gems: 50, items: [] },
        top1000: { gold: 100, gems: 10, items: [] },
      },
      completion: { gold: 5000, gems: 100, items: [] },
    };
  }

  private getDefaultRemoteConfig(): RemoteConfig {
    return {
      version: 1,
      lastUpdated: Date.now(),
      features: new Map([
        ['multiplayer', true],
        ['guilds', true],
        ['tournaments', true],
      ]),
      values: new Map([
        ['max_energy', 100],
        ['energy_regen_rate', 1],
        ['daily_bonus_multiplier', 2],
      ]),
      experiments: [],
    };
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getServerUrl(): string {
    return process.env.LIVEOPS_SERVER_URL || 'https://api.potofgold.com';
  }

  // Public methods
  getActiveEvents(): LiveEvent[] {
    return Array.from(this.activeEvents.values());
  }

  getScheduledEvents(): LiveEvent[] {
    return this.scheduledEvents;
  }

  getEventCalendar(date?: Date): LiveEvent[] {
    const dateKey = (date || new Date()).toDateString();
    return this.eventCalendar.get(dateKey) || [];
  }

  getRemoteConfig(): RemoteConfig {
    return this.remoteConfig;
  }

  getFeatureFlag(feature: string): boolean {
    return this.remoteConfig.features.get(feature) || false;
  }

  getConfigValue(key: string): any {
    return this.remoteConfig.values.get(key);
  }

  getPersonalizedOffer(playerId: string): LiveEvent | null {
    return this.personalizedOffers.get(playerId) || null;
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const liveOpsManagement = LiveOpsManagement.getInstance();