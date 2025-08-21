/**
 * Limited Time Events System
 * Special events, seasonal content, and time-limited gameplay modes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// ========== EVENT SYSTEM CORE ==========

export interface LimitedTimeEvent {
  id: string;
  type: EventType;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  requirements?: EventRequirements;
  rewards: EventReward[];
  leaderboard?: EventLeaderboard;
  specialRules?: SpecialRules;
  shopOffers?: EventShopOffer[];
  milestones: EventMilestone[];
  currentProgress: number;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export type EventType = 
  | 'weekend_tournament'
  | 'flash_event'
  | 'seasonal_celebration'
  | 'community_goal'
  | 'special_mode'
  | 'collection_event'
  | 'pvp_tournament'
  | 'boss_raid';

interface EventRequirements {
  minLevel?: number;
  vipLevel?: number;
  previousEventCompleted?: string;
}

interface EventReward {
  type: string;
  amount: number;
  exclusive: boolean;
  icon: string;
}

interface EventLeaderboard {
  id: string;
  prizes: LeaderboardPrize[];
  currentRank?: number;
  topPlayers: LeaderboardEntry[];
}

interface LeaderboardPrize {
  rankRange: [number, number];
  rewards: EventReward[];
}

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  avatar: string;
}

interface SpecialRules {
  scoreMultiplier?: number;
  specialItems?: string[];
  disabledFeatures?: string[];
  modifiers?: GameModifier[];
}

interface GameModifier {
  type: string;
  value: number;
  description: string;
}

interface EventShopOffer {
  id: string;
  name: string;
  price: number;
  currency: 'gems' | 'event_tokens';
  contents: EventReward[];
  limit: number;
  purchased: number;
}

interface EventMilestone {
  id: string;
  requirement: number;
  reward: EventReward;
  claimed: boolean;
}

export class EventManager {
  private activeEvents: Map<string, LimitedTimeEvent> = new Map();
  private eventSchedule: EventSchedule[] = [];
  private eventHistory: CompletedEvent[] = [];
  
  async initialize(): Promise<LimitedTimeEvent[]> {
    // Load saved event progress
    await this.loadEventProgress();
    
    // Check and activate scheduled events
    this.checkScheduledEvents();
    
    // Generate dynamic events
    this.generateDynamicEvents();
    
    return Array.from(this.activeEvents.values());
  }
  
  private checkScheduledEvents() {
    const now = Date.now();
    
    // Regular weekend events
    if (this.isWeekend()) {
      this.activateWeekendTournament();
    }
    
    // Holiday events
    const holiday = this.checkHoliday();
    if (holiday) {
      this.activateHolidayEvent(holiday);
    }
    
    // Monthly events
    if (this.isFirstWeekOfMonth()) {
      this.activateMonthlyChallenge();
    }
  }
  
  private generateDynamicEvents() {
    const now = Date.now();
    
    // Flash events (random, short duration)
    if (Math.random() < 0.2) { // 20% chance
      this.createFlashEvent();
    }
    
    // Community goals (based on player activity)
    if (this.shouldCreateCommunityGoal()) {
      this.createCommunityGoal();
    }
    
    // Boss raids (scheduled but dynamic difficulty)
    if (this.isBossRaidTime()) {
      this.createBossRaid();
    }
  }
  
  private activateWeekendTournament() {
    const tournament: LimitedTimeEvent = {
      id: `weekend_${Date.now()}`,
      type: 'weekend_tournament',
      name: 'Weekend Gold Rush',
      description: 'Compete for the top spot and win exclusive rewards!',
      startTime: this.getWeekendStart(),
      endTime: this.getWeekendEnd(),
      rewards: [
        { type: 'exclusive_skin', amount: 1, exclusive: true, icon: '👑' },
        { type: 'gems', amount: 500, exclusive: false, icon: '💎' },
        { type: 'tournament_trophy', amount: 1, exclusive: true, icon: '🏆' }
      ],
      leaderboard: {
        id: 'weekend_leaderboard',
        prizes: [
          {
            rankRange: [1, 1],
            rewards: [
              { type: 'exclusive_skin', amount: 1, exclusive: true, icon: '👑' },
              { type: 'gems', amount: 1000, exclusive: false, icon: '💎' }
            ]
          },
          {
            rankRange: [2, 10],
            rewards: [
              { type: 'gems', amount: 500, exclusive: false, icon: '💎' },
              { type: 'epic_crate', amount: 3, exclusive: false, icon: '📦' }
            ]
          },
          {
            rankRange: [11, 100],
            rewards: [
              { type: 'gems', amount: 100, exclusive: false, icon: '💎' },
              { type: 'rare_crate', amount: 2, exclusive: false, icon: '📦' }
            ]
          }
        ],
        topPlayers: []
      },
      milestones: [
        {
          id: 'play_10',
          requirement: 10,
          reward: { type: 'energy', amount: 50, exclusive: false, icon: '⚡' },
          claimed: false
        },
        {
          id: 'score_100k',
          requirement: 100000,
          reward: { type: 'gems', amount: 50, exclusive: false, icon: '💎' },
          claimed: false
        },
        {
          id: 'top_100',
          requirement: 100,
          reward: { type: 'exclusive_frame', amount: 1, exclusive: true, icon: '🖼️' },
          claimed: false
        }
      ],
      currentProgress: 0,
      isActive: true,
      priority: 'high'
    };
    
    this.activeEvents.set(tournament.id, tournament);
  }
  
  private createFlashEvent() {
    const flashEvents = [
      {
        name: '⚡ Double Gems Hour!',
        description: 'All gem rewards doubled for the next hour!',
        duration: 60 * 60 * 1000, // 1 hour
        rules: { scoreMultiplier: 2 },
        priority: 'critical' as const
      },
      {
        name: '🌟 Rare Item Rain!',
        description: 'Rare items spawn 5x more frequently!',
        duration: 30 * 60 * 1000, // 30 minutes
        rules: { specialItems: ['rare_coin', 'epic_gem'] },
        priority: 'high' as const
      },
      {
        name: '🎯 Perfect Run Challenge',
        description: 'Complete a flawless run for massive rewards!',
        duration: 2 * 60 * 60 * 1000, // 2 hours
        rules: { modifiers: [{ type: 'no_hits', value: 1, description: 'Take no damage' }] },
        priority: 'medium' as const
      }
    ];
    
    const selected = flashEvents[Math.floor(Math.random() * flashEvents.length)];
    const now = Date.now();
    
    const flashEvent: LimitedTimeEvent = {
      id: `flash_${now}`,
      type: 'flash_event',
      name: selected.name,
      description: selected.description,
      startTime: now,
      endTime: now + selected.duration,
      rewards: [
        { type: 'mystery_reward', amount: 1, exclusive: false, icon: '🎁' }
      ],
      specialRules: selected.rules,
      milestones: [],
      currentProgress: 0,
      isActive: true,
      priority: selected.priority
    };
    
    this.activeEvents.set(flashEvent.id, flashEvent);
    this.notifyFlashEvent(flashEvent);
  }
  
  private createCommunityGoal() {
    const goal: LimitedTimeEvent = {
      id: `community_${Date.now()}`,
      type: 'community_goal',
      name: '🌍 Global Gold Hunt',
      description: 'Work together to collect 1 billion coins!',
      startTime: Date.now(),
      endTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week
      rewards: [
        { type: 'coins', amount: 10000, exclusive: false, icon: '🪙' },
        { type: 'community_badge', amount: 1, exclusive: true, icon: '🏅' }
      ],
      milestones: [
        {
          id: 'quarter',
          requirement: 250000000,
          reward: { type: 'coins', amount: 1000, exclusive: false, icon: '🪙' },
          claimed: false
        },
        {
          id: 'half',
          requirement: 500000000,
          reward: { type: 'gems', amount: 100, exclusive: false, icon: '💎' },
          claimed: false
        },
        {
          id: 'three_quarter',
          requirement: 750000000,
          reward: { type: 'epic_crate', amount: 1, exclusive: false, icon: '📦' },
          claimed: false
        },
        {
          id: 'complete',
          requirement: 1000000000,
          reward: { type: 'legendary_skin', amount: 1, exclusive: true, icon: '✨' },
          claimed: false
        }
      ],
      currentProgress: 0,
      isActive: true,
      priority: 'medium'
    };
    
    this.activeEvents.set(goal.id, goal);
  }
  
  private createBossRaid() {
    const bosses = [
      {
        name: 'Golden Dragon',
        health: 1000000,
        rewards: { type: 'dragon_scale', amount: 1, exclusive: true, icon: '🐉' }
      },
      {
        name: 'Crystal Golem',
        health: 2000000,
        rewards: { type: 'crystal_heart', amount: 1, exclusive: true, icon: '💠' }
      },
      {
        name: 'Shadow Phoenix',
        health: 3000000,
        rewards: { type: 'phoenix_feather', amount: 1, exclusive: true, icon: '🦅' }
      }
    ];
    
    const boss = bosses[Math.floor(Math.random() * bosses.length)];
    
    const raid: LimitedTimeEvent = {
      id: `raid_${Date.now()}`,
      type: 'boss_raid',
      name: `🗡️ ${boss.name} Raid`,
      description: `Defeat ${boss.name} with the community!`,
      startTime: Date.now(),
      endTime: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
      rewards: [boss.rewards],
      specialRules: {
        modifiers: [
          { type: 'boss_health', value: boss.health, description: 'Boss total health' },
          { type: 'damage_multiplier', value: 10, description: 'Your damage is multiplied' }
        ]
      },
      milestones: [
        {
          id: 'damage_10k',
          requirement: 10000,
          reward: { type: 'energy', amount: 25, exclusive: false, icon: '⚡' },
          claimed: false
        },
        {
          id: 'damage_100k',
          requirement: 100000,
          reward: { type: 'gems', amount: 200, exclusive: false, icon: '💎' },
          claimed: false
        },
        {
          id: 'damage_1m',
          requirement: 1000000,
          reward: { type: 'legendary_crate', amount: 1, exclusive: false, icon: '📦' },
          claimed: false
        }
      ],
      currentProgress: 0,
      isActive: true,
      priority: 'high'
    };
    
    this.activeEvents.set(raid.id, raid);
  }
  
  private activateHolidayEvent(holiday: string) {
    const holidayEvents: Record<string, Partial<LimitedTimeEvent>> = {
      christmas: {
        name: '🎄 Winter Wonderland',
        description: 'Celebrate the holidays with special rewards!',
        rewards: [
          { type: 'santa_skin', amount: 1, exclusive: true, icon: '🎅' },
          { type: 'snow_trail', amount: 1, exclusive: true, icon: '❄️' }
        ],
        specialRules: {
          specialItems: ['candy_cane', 'present', 'snowflake']
        }
      },
      halloween: {
        name: '🎃 Spooky Season',
        description: 'Trick or treat your way to exclusive rewards!',
        rewards: [
          { type: 'ghost_skin', amount: 1, exclusive: true, icon: '👻' },
          { type: 'pumpkin_trail', amount: 1, exclusive: true, icon: '🎃' }
        ],
        specialRules: {
          specialItems: ['candy', 'spider', 'bat']
        }
      },
      easter: {
        name: '🐰 Egg Hunt Extravaganza',
        description: 'Find hidden eggs for amazing prizes!',
        rewards: [
          { type: 'bunny_skin', amount: 1, exclusive: true, icon: '🐰' },
          { type: 'rainbow_trail', amount: 1, exclusive: true, icon: '🌈' }
        ],
        specialRules: {
          specialItems: ['golden_egg', 'chocolate', 'flower']
        }
      }
    };
    
    const eventData = holidayEvents[holiday];
    if (!eventData) return;
    
    const event: LimitedTimeEvent = {
      id: `holiday_${holiday}_${Date.now()}`,
      type: 'seasonal_celebration',
      name: eventData.name!,
      description: eventData.description!,
      startTime: Date.now(),
      endTime: Date.now() + 14 * 24 * 60 * 60 * 1000, // 2 weeks
      rewards: eventData.rewards!,
      specialRules: eventData.specialRules,
      milestones: this.generateHolidayMilestones(holiday),
      currentProgress: 0,
      isActive: true,
      priority: 'high'
    };
    
    this.activeEvents.set(event.id, event);
  }
  
  private generateHolidayMilestones(holiday: string): EventMilestone[] {
    return [
      {
        id: 'collect_special_10',
        requirement: 10,
        reward: { type: 'holiday_currency', amount: 100, exclusive: false, icon: '🎁' },
        claimed: false
      },
      {
        id: 'collect_special_50',
        requirement: 50,
        reward: { type: 'holiday_crate', amount: 1, exclusive: false, icon: '📦' },
        claimed: false
      },
      {
        id: 'collect_special_100',
        requirement: 100,
        reward: { type: 'exclusive_emote', amount: 1, exclusive: true, icon: '😊' },
        claimed: false
      }
    ];
  }
  
  private activateMonthlyChallenge() {
    const challenges = [
      {
        name: 'Speed Demon',
        description: 'Complete 100 speed runs',
        requirement: 'speed_runs'
      },
      {
        name: 'Combo King',
        description: 'Achieve 1000 total combo',
        requirement: 'total_combo'
      },
      {
        name: 'Collector',
        description: 'Collect 1 million coins',
        requirement: 'coins_collected'
      }
    ];
    
    const challenge = challenges[new Date().getMonth() % challenges.length];
    
    const event: LimitedTimeEvent = {
      id: `monthly_${Date.now()}`,
      type: 'collection_event',
      name: `📅 ${challenge.name} Challenge`,
      description: challenge.description,
      startTime: this.getMonthStart(),
      endTime: this.getMonthEnd(),
      rewards: [
        { type: 'monthly_badge', amount: 1, exclusive: true, icon: '🏅' },
        { type: 'gems', amount: 1000, exclusive: false, icon: '💎' }
      ],
      milestones: [],
      currentProgress: 0,
      isActive: true,
      priority: 'medium'
    };
    
    this.activeEvents.set(event.id, event);
  }
  
  async updateEventProgress(eventId: string, progress: number): Promise<EventProgressResult> {
    const event = this.activeEvents.get(eventId);
    if (!event) return { success: false };
    
    event.currentProgress += progress;
    
    // Check milestones
    const unlockedMilestones: EventMilestone[] = [];
    for (const milestone of event.milestones) {
      if (!milestone.claimed && event.currentProgress >= milestone.requirement) {
        milestone.claimed = true;
        unlockedMilestones.push(milestone);
      }
    }
    
    // Update leaderboard if applicable
    if (event.leaderboard) {
      await this.updateLeaderboard(event.leaderboard, event.currentProgress);
    }
    
    // Check if event completed
    const isCompleted = this.checkEventCompletion(event);
    
    if (isCompleted) {
      this.completeEvent(event);
    }
    
    await this.saveEventProgress();
    
    return {
      success: true,
      newProgress: event.currentProgress,
      unlockedMilestones,
      isCompleted,
      leaderboardRank: event.leaderboard?.currentRank
    };
  }
  
  private checkEventCompletion(event: LimitedTimeEvent): boolean {
    // Check time expiry
    if (Date.now() > event.endTime) return true;
    
    // Check if all milestones completed
    const allMilestonesComplete = event.milestones.every(m => m.claimed);
    
    return allMilestonesComplete;
  }
  
  private completeEvent(event: LimitedTimeEvent) {
    // Move to history
    this.eventHistory.push({
      ...event,
      completedAt: Date.now(),
      finalProgress: event.currentProgress
    });
    
    // Remove from active
    this.activeEvents.delete(event.id);
    
    // Trigger completion rewards
    this.grantCompletionRewards(event);
  }
  
  private grantCompletionRewards(event: LimitedTimeEvent) {
    // Emit event for reward granting
    return {
      type: 'event_completed',
      event: event.name,
      rewards: event.rewards,
      animation: 'event_completion_celebration'
    };
  }
  
  private async updateLeaderboard(leaderboard: EventLeaderboard, score: number) {
    // This would connect to backend for real leaderboard
    // For now, simulate leaderboard position
    leaderboard.currentRank = Math.max(1, Math.floor(Math.random() * 1000) - Math.floor(score / 1000));
  }
  
  private async loadEventProgress() {
    try {
      const saved = await AsyncStorage.getItem('event_progress');
      if (saved) {
        const data = JSON.parse(saved);
        // Restore active events
        data.activeEvents?.forEach((event: LimitedTimeEvent) => {
          if (event.endTime > Date.now()) {
            this.activeEvents.set(event.id, event);
          }
        });
      }
    } catch (error) {
      console.error('Error loading event progress:', error);
    }
  }
  
  private async saveEventProgress() {
    try {
      const data = {
        activeEvents: Array.from(this.activeEvents.values()),
        eventHistory: this.eventHistory
      };
      await AsyncStorage.setItem('event_progress', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving event progress:', error);
    }
  }
  
  private async notifyFlashEvent(event: LimitedTimeEvent) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: event.name,
        body: event.description,
        data: { eventId: event.id }
      },
      trigger: null // Immediate
    });
  }
  
  // Helper methods
  private isWeekend(): boolean {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  }
  
  private checkHoliday(): string | null {
    const today = new Date();
    const month = today.getMonth();
    const date = today.getDate();
    
    if (month === 11 && date >= 20 && date <= 31) return 'christmas';
    if (month === 9 && date >= 25 && date <= 31) return 'halloween';
    if (month === 3 && date >= 1 && date <= 15) return 'easter';
    
    return null;
  }
  
  private isFirstWeekOfMonth(): boolean {
    return new Date().getDate() <= 7;
  }
  
  private shouldCreateCommunityGoal(): boolean {
    // Create community goal if no active one exists
    return !Array.from(this.activeEvents.values()).some(e => e.type === 'community_goal');
  }
  
  private isBossRaidTime(): boolean {
    // Boss raids every Friday at 6 PM
    const now = new Date();
    return now.getDay() === 5 && now.getHours() === 18;
  }
  
  private getWeekendStart(): number {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -1 : (5 - day);
    now.setDate(now.getDate() + diff);
    now.setHours(18, 0, 0, 0); // Friday 6 PM
    return now.getTime();
  }
  
  private getWeekendEnd(): number {
    const start = new Date(this.getWeekendStart());
    start.setDate(start.getDate() + 2);
    start.setHours(23, 59, 59, 999); // Sunday midnight
    return start.getTime();
  }
  
  private getMonthStart(): number {
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }
  
  private getMonthEnd(): number {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    now.setDate(0);
    now.setHours(23, 59, 59, 999);
    return now.getTime();
  }
}

// ========== TYPE DEFINITIONS ==========

interface EventSchedule {
  id: string;
  type: EventType;
  recurring: boolean;
  schedule: string; // cron expression or date
}

interface CompletedEvent extends LimitedTimeEvent {
  completedAt: number;
  finalProgress: number;
}

interface EventProgressResult {
  success: boolean;
  newProgress?: number;
  unlockedMilestones?: EventMilestone[];
  isCompleted?: boolean;
  leaderboardRank?: number;
}

export default EventManager;