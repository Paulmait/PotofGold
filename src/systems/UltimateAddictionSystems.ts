/**
 * Ultimate Addiction Systems
 * Guild, Live Events, Collection, Prestige, and VIP Tiers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestore } from '../../firebase/config';
import * as Notifications from 'expo-notifications';

// ============= GUILD/CLAN SYSTEM =============
export interface Guild {
  id: string;
  name: string;
  tag: string;
  level: number;
  xp: number;
  members: GuildMember[];
  maxMembers: number;
  leader: string;
  officers: string[];
  treasury: number;
  perks: GuildPerk[];
  weeklyGoals: GuildGoal[];
  warWins: number;
  created: string;
  description: string;
  requirements: GuildRequirements;
  chat: GuildMessage[];
}

export interface GuildMember {
  userId: string;
  username: string;
  role: 'leader' | 'officer' | 'member';
  contribution: number;
  joinedAt: string;
  lastActive: string;
  weeklyActivity: number;
}

export interface GuildPerk {
  id: string;
  name: string;
  level: number;
  bonus: string;
  cost: number;
}

export interface GuildGoal {
  id: string;
  description: string;
  progress: number;
  target: number;
  reward: number;
  deadline: string;
}

export interface GuildMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'chat' | 'system' | 'achievement';
}

export interface GuildRequirements {
  minLevel: number;
  minTrophies: number;
  approvalRequired: boolean;
}

class GuildSystem {
  private currentGuild: Guild | null = null;
  private guildInvites: string[] = [];

  async createGuild(name: string, tag: string, leaderId: string): Promise<Guild> {
    const guild: Guild = {
      id: `guild_${Date.now()}`,
      name,
      tag: tag.toUpperCase().substring(0, 4),
      level: 1,
      xp: 0,
      members: [
        {
          userId: leaderId,
          username: 'Founder',
          role: 'leader',
          contribution: 0,
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          weeklyActivity: 0,
        },
      ],
      maxMembers: 30,
      leader: leaderId,
      officers: [],
      treasury: 0,
      perks: this.getDefaultPerks(),
      weeklyGoals: this.generateWeeklyGoals(),
      warWins: 0,
      created: new Date().toISOString(),
      description: 'A new guild ready to conquer!',
      requirements: {
        minLevel: 1,
        minTrophies: 0,
        approvalRequired: false,
      },
      chat: [
        {
          id: '1',
          userId: 'system',
          username: 'System',
          message: `Guild "${name}" has been created!`,
          timestamp: new Date().toISOString(),
          type: 'system',
        },
      ],
    };

    await firestore.collection('guilds').doc(guild.id).set(guild);
    this.currentGuild = guild;
    return guild;
  }

  async joinGuild(guildId: string, userId: string): Promise<boolean> {
    const guildDoc = await firestore.collection('guilds').doc(guildId).get();
    if (!guildDoc.exists) return false;

    const guild = guildDoc.data() as Guild;

    if (guild.members.length >= guild.maxMembers) {
      throw new Error('Guild is full');
    }

    guild.members.push({
      userId,
      username: 'Player',
      role: 'member',
      contribution: 0,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      weeklyActivity: 0,
    });

    await firestore.collection('guilds').doc(guildId).update({ members: guild.members });
    this.currentGuild = guild;

    // Send welcome notification to guild
    this.broadcastToGuild(`New member joined the guild!`);

    return true;
  }

  async contributeToGuild(amount: number): Promise<void> {
    if (!this.currentGuild) return;

    this.currentGuild.treasury += amount;
    this.currentGuild.xp += Math.floor(amount / 10);

    // Update member contribution
    const member = this.currentGuild.members.find((m) => m.userId === 'current_user');
    if (member) {
      member.contribution += amount;
      member.weeklyActivity += amount;
    }

    // Check for level up
    const requiredXP = this.currentGuild.level * 1000;
    if (this.currentGuild.xp >= requiredXP) {
      this.currentGuild.level++;
      this.currentGuild.xp = 0;
      this.unlockNewPerk();
      this.broadcastToGuild(`Guild reached level ${this.currentGuild.level}! New perks unlocked!`);
    }

    await this.saveGuild();
  }

  private getDefaultPerks(): GuildPerk[] {
    return [
      { id: 'coin_bonus', name: 'Coin Bonus', level: 1, bonus: '+5% coins', cost: 1000 },
      { id: 'xp_bonus', name: 'XP Bonus', level: 2, bonus: '+10% XP', cost: 2500 },
      { id: 'energy_regen', name: 'Faster Energy', level: 3, bonus: '-20% regen time', cost: 5000 },
      {
        id: 'guild_chest',
        name: 'Daily Guild Chest',
        level: 5,
        bonus: 'Free daily chest',
        cost: 10000,
      },
      { id: 'war_bonus', name: 'War Rewards', level: 7, bonus: '+50% war rewards', cost: 20000 },
    ];
  }

  private generateWeeklyGoals(): GuildGoal[] {
    return [
      {
        id: 'weekly_coins',
        description: 'Collect 100,000 coins as a guild',
        progress: 0,
        target: 100000,
        reward: 5000,
        deadline: this.getWeekEnd(),
      },
      {
        id: 'weekly_games',
        description: 'Play 500 games total',
        progress: 0,
        target: 500,
        reward: 3000,
        deadline: this.getWeekEnd(),
      },
      {
        id: 'weekly_challenges',
        description: 'Win 100 friend challenges',
        progress: 0,
        target: 100,
        reward: 4000,
        deadline: this.getWeekEnd(),
      },
    ];
  }

  private unlockNewPerk() {
    // Unlock perks based on guild level
    const availablePerks = this.currentGuild?.perks.filter(
      (p) => p.level <= this.currentGuild!.level
    );
    // Apply perks to all members
  }

  private broadcastToGuild(message: string) {
    if (!this.currentGuild) return;

    this.currentGuild.chat.push({
      id: Date.now().toString(),
      userId: 'system',
      username: 'System',
      message,
      timestamp: new Date().toISOString(),
      type: 'system',
    });
  }

  private getWeekEnd(): string {
    const now = new Date();
    const daysUntilSunday = 7 - now.getDay();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd.toISOString();
  }

  private async saveGuild() {
    if (!this.currentGuild) return;
    await firestore.collection('guilds').doc(this.currentGuild.id).set(this.currentGuild);
  }
}

// ============= LIVE EVENTS SYSTEM =============
export interface LiveEvent {
  id: string;
  name: string;
  type: 'tournament' | 'race' | 'collection' | 'boss_battle';
  startTime: string;
  endTime: string;
  participants: number;
  leaderboard: EventLeaderboard[];
  rewards: EventReward[];
  rules: string[];
  entryFee?: number;
  maxParticipants?: number;
  currentPhase: 'waiting' | 'active' | 'ended';
}

export interface EventLeaderboard {
  rank: number;
  userId: string;
  username: string;
  score: number;
  reward?: EventReward;
}

export interface EventReward {
  minRank: number;
  maxRank: number;
  coins?: number;
  gems?: number;
  items?: string[];
  title?: string;
}

class LiveEventsSystem {
  private activeEvents: LiveEvent[] = [];
  private participatingEvents: string[] = [];

  async getActiveEvents(): Promise<LiveEvent[]> {
    const now = new Date();

    // Generate hourly mini-events
    const hourlyEvent: LiveEvent = {
      id: `hourly_${now.getHours()}`,
      name: 'Coin Rush Hour',
      type: 'race',
      startTime: new Date(now.setMinutes(0, 0, 0)).toISOString(),
      endTime: new Date(now.setMinutes(59, 59, 999)).toISOString(),
      participants: Math.floor(Math.random() * 1000) + 500,
      leaderboard: [],
      rewards: [
        { minRank: 1, maxRank: 1, coins: 5000, gems: 50 },
        { minRank: 2, maxRank: 10, coins: 2000, gems: 20 },
        { minRank: 11, maxRank: 50, coins: 500 },
      ],
      rules: ['Collect the most coins in 1 hour', 'Power-ups allowed'],
      currentPhase: 'active',
    };

    // Daily tournament
    const dailyTournament: LiveEvent = {
      id: `daily_${now.toDateString()}`,
      name: 'Daily Championship',
      type: 'tournament',
      startTime: new Date(now.setHours(0, 0, 0, 0)).toISOString(),
      endTime: new Date(now.setHours(23, 59, 59, 999)).toISOString(),
      participants: Math.floor(Math.random() * 10000) + 5000,
      leaderboard: this.generateMockLeaderboard(100),
      rewards: [
        { minRank: 1, maxRank: 1, coins: 50000, gems: 500, title: 'Daily Champion' },
        { minRank: 2, maxRank: 3, coins: 25000, gems: 250 },
        { minRank: 4, maxRank: 10, coins: 10000, gems: 100 },
        { minRank: 11, maxRank: 100, coins: 1000 },
      ],
      rules: ['Highest total score wins', 'Unlimited attempts', 'Best score counts'],
      entryFee: 100,
      currentPhase: 'active',
    };

    // Weekend special
    if (now.getDay() === 0 || now.getDay() === 6) {
      const weekendEvent: LiveEvent = {
        id: `weekend_special`,
        name: 'Weekend Bonanza',
        type: 'boss_battle',
        startTime: new Date(now.setHours(0, 0, 0, 0)).toISOString(),
        endTime: new Date(now.setHours(23, 59, 59, 999)).toISOString(),
        participants: Math.floor(Math.random() * 50000) + 20000,
        leaderboard: [],
        rewards: [
          { minRank: 1, maxRank: 100, coins: 10000, items: ['legendary_crate'] },
          { minRank: 101, maxRank: 1000, coins: 5000, items: ['epic_crate'] },
        ],
        rules: [
          'Defeat the boss together',
          'Damage accumulates globally',
          'Everyone wins if boss dies',
        ],
        currentPhase: 'active',
      };
      this.activeEvents.push(weekendEvent);
    }

    this.activeEvents = [hourlyEvent, dailyTournament];
    return this.activeEvents;
  }

  async joinEvent(eventId: string, userId: string): Promise<boolean> {
    const event = this.activeEvents.find((e) => e.id === eventId);
    if (!event) return false;

    if (event.maxParticipants && event.participants >= event.maxParticipants) {
      throw new Error('Event is full');
    }

    if (event.entryFee) {
      // Deduct entry fee
    }

    this.participatingEvents.push(eventId);
    event.participants++;

    // Add to leaderboard
    event.leaderboard.push({
      rank: event.leaderboard.length + 1,
      userId,
      username: 'Player',
      score: 0,
    });

    return true;
  }

  async updateScore(eventId: string, userId: string, score: number): Promise<number> {
    const event = this.activeEvents.find((e) => e.id === eventId);
    if (!event) return 0;

    const entry = event.leaderboard.find((e) => e.userId === userId);
    if (!entry) return 0;

    entry.score = Math.max(entry.score, score);

    // Re-sort leaderboard
    event.leaderboard.sort((a, b) => b.score - a.score);
    event.leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entry.rank;
  }

  private generateMockLeaderboard(size: number): EventLeaderboard[] {
    const names = ['Phoenix', 'Dragon', 'Wizard', 'Knight', 'Ninja', 'Samurai'];
    return Array.from({ length: size }, (_, i) => ({
      rank: i + 1,
      userId: `user_${i}`,
      username: `${names[i % names.length]}${i}`,
      score: Math.floor(Math.random() * 10000) * (size - i),
    }));
  }
}

// ============= COLLECTION SYSTEM =============
export interface Collection {
  id: string;
  name: string;
  items: CollectionItem[];
  completed: boolean;
  reward?: CollectionReward;
  progress: number;
  category: string;
}

export interface CollectionItem {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  owned: boolean;
  quantity: number;
  discoveredAt?: string;
}

export interface CollectionReward {
  title?: string;
  skin?: string;
  coins?: number;
  gems?: number;
}

class CollectionSystem {
  private collections: Collection[] = [];

  async initializeCollections(): Promise<Collection[]> {
    this.collections = [
      {
        id: 'starter_set',
        name: 'Starter Collection',
        category: 'Basic',
        progress: 0,
        completed: false,
        items: this.generateCollectionItems('starter', 10),
        reward: { coins: 1000, title: 'Collector' },
      },
      {
        id: 'seasonal_set',
        name: 'Season Collection',
        category: 'Limited',
        progress: 0,
        completed: false,
        items: this.generateCollectionItems('seasonal', 20),
        reward: { skin: 'golden_pot', gems: 100 },
      },
      {
        id: 'legendary_set',
        name: 'Legendary Collection',
        category: 'Elite',
        progress: 0,
        completed: false,
        items: this.generateCollectionItems('legendary', 50),
        reward: { title: 'Legend', skin: 'mythic_pot', coins: 50000 },
      },
    ];

    return this.collections;
  }

  async collectItem(itemId: string): Promise<{
    isNew: boolean;
    completedCollections: string[];
  }> {
    let isNew = false;
    const completedCollections: string[] = [];

    for (const collection of this.collections) {
      const item = collection.items.find((i) => i.id === itemId);
      if (item) {
        if (!item.owned) {
          isNew = true;
          item.owned = true;
          item.quantity = 1;
          item.discoveredAt = new Date().toISOString();
        } else {
          item.quantity++;
        }

        // Update progress
        collection.progress =
          collection.items.filter((i) => i.owned).length / collection.items.length;

        // Check completion
        if (collection.progress === 1 && !collection.completed) {
          collection.completed = true;
          completedCollections.push(collection.id);
          await this.grantCollectionReward(collection);
        }
      }
    }

    await this.saveCollections();
    return { isNew, completedCollections };
  }

  private generateCollectionItems(type: string, count: number): CollectionItem[] {
    const rarities = ['common', 'common', 'common', 'rare', 'rare', 'epic', 'legendary', 'mythic'];
    return Array.from({ length: count }, (_, i) => ({
      id: `${type}_item_${i}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Item ${i + 1}`,
      rarity: rarities[Math.floor(Math.random() * rarities.length)] as any,
      owned: false,
      quantity: 0,
    }));
  }

  private async grantCollectionReward(collection: Collection) {
    if (!collection.reward) return;

    // Grant rewards
    console.log(`Collection "${collection.name}" completed! Rewards granted:`, collection.reward);

    // Send notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏆 Collection Complete!',
        body: `You've completed the ${collection.name}! Claim your rewards!`,
        data: { type: 'collection_complete', collectionId: collection.id },
      },
      trigger: null,
    });
  }

  private async saveCollections() {
    await AsyncStorage.setItem('collections', JSON.stringify(this.collections));
  }
}

// ============= PRESTIGE SYSTEM =============
export interface PrestigeLevel {
  level: number;
  name: string;
  requiredXP: number;
  permanentBonuses: PrestigeBonus[];
  resetBonuses: PrestigeBonus[];
  badge: string;
  color: string;
}

export interface PrestigeBonus {
  type: 'coins' | 'xp' | 'energy' | 'luck' | 'power';
  value: number;
  description: string;
}

class PrestigeSystem {
  private currentPrestige: number = 0;
  private prestigeXP: number = 0;
  private totalPrestiges: number = 0;

  getPrestigeLevels(): PrestigeLevel[] {
    return [
      {
        level: 1,
        name: 'Bronze Prestige',
        requiredXP: 100000,
        permanentBonuses: [{ type: 'coins', value: 10, description: '+10% coins forever' }],
        resetBonuses: [{ type: 'coins', value: 10000, description: '10,000 starting coins' }],
        badge: '🥉',
        color: '#CD7F32',
      },
      {
        level: 2,
        name: 'Silver Prestige',
        requiredXP: 250000,
        permanentBonuses: [
          { type: 'coins', value: 20, description: '+20% coins forever' },
          { type: 'xp', value: 15, description: '+15% XP forever' },
        ],
        resetBonuses: [{ type: 'coins', value: 25000, description: '25,000 starting coins' }],
        badge: '🥈',
        color: '#C0C0C0',
      },
      {
        level: 3,
        name: 'Gold Prestige',
        requiredXP: 500000,
        permanentBonuses: [
          { type: 'coins', value: 30, description: '+30% coins forever' },
          { type: 'xp', value: 25, description: '+25% XP forever' },
          { type: 'energy', value: 20, description: '+20 max energy' },
        ],
        resetBonuses: [{ type: 'coins', value: 50000, description: '50,000 starting coins' }],
        badge: '🥇',
        color: '#FFD700',
      },
      {
        level: 4,
        name: 'Platinum Prestige',
        requiredXP: 1000000,
        permanentBonuses: [
          { type: 'coins', value: 50, description: '+50% coins forever' },
          { type: 'xp', value: 40, description: '+40% XP forever' },
          { type: 'luck', value: 10, description: '+10% rare drop chance' },
        ],
        resetBonuses: [{ type: 'coins', value: 100000, description: '100,000 starting coins' }],
        badge: '💎',
        color: '#E5E4E2',
      },
      {
        level: 5,
        name: 'Diamond Prestige',
        requiredXP: 2500000,
        permanentBonuses: [
          { type: 'coins', value: 100, description: '+100% coins forever' },
          { type: 'xp', value: 75, description: '+75% XP forever' },
          { type: 'power', value: 50, description: '+50% power-up duration' },
        ],
        resetBonuses: [{ type: 'coins', value: 500000, description: '500,000 starting coins' }],
        badge: '💠',
        color: '#B9F2FF',
      },
    ];
  }

  async prestige(): Promise<{
    success: boolean;
    newLevel: number;
    bonuses: PrestigeBonus[];
  }> {
    const levels = this.getPrestigeLevels();
    const nextLevel = levels[this.currentPrestige];

    if (!nextLevel || this.prestigeXP < nextLevel.requiredXP) {
      return {
        success: false,
        newLevel: this.currentPrestige,
        bonuses: [],
      };
    }

    // Reset progress but grant permanent bonuses
    this.currentPrestige++;
    this.totalPrestiges++;
    this.prestigeXP = 0;

    // Reset game progress
    await this.resetGameProgress();

    // Apply permanent bonuses
    const allBonuses = [...nextLevel.permanentBonuses, ...nextLevel.resetBonuses];

    // Show epic animation
    await this.showPrestigeAnimation(nextLevel);

    return {
      success: true,
      newLevel: this.currentPrestige,
      bonuses: allBonuses,
    };
  }

  private async resetGameProgress() {
    // Reset coins, levels, etc. but keep permanent bonuses
    console.log('Resetting game progress for prestige...');
  }

  private async showPrestigeAnimation(level: PrestigeLevel) {
    // Epic prestige animation
    console.log(`Prestige animation for ${level.name}`);
  }

  getPrestigeMultipliers(): Record<string, number> {
    const multipliers: Record<string, number> = {
      coins: 1,
      xp: 1,
      energy: 0,
      luck: 0,
      power: 0,
    };

    const levels = this.getPrestigeLevels();
    for (let i = 0; i < this.currentPrestige; i++) {
      const level = levels[i];
      if (level) {
        for (const bonus of level.permanentBonuses) {
          if (bonus.type in multipliers) {
            multipliers[bonus.type] += bonus.value / 100;
          }
        }
      }
    }

    return multipliers;
  }
}

// ============= VIP TIERS SYSTEM =============
export interface VIPTier {
  level: number;
  name: string;
  requiredPoints: number;
  benefits: VIPBenefit[];
  monthlyRewards: VIPReward[];
  exclusiveAccess: string[];
  color: string;
  icon: string;
}

export interface VIPBenefit {
  id: string;
  description: string;
  value: number | string;
}

export interface VIPReward {
  type: string;
  amount: number;
  claimable: boolean;
}

class VIPSystem {
  private vipLevel: number = 0;
  private vipPoints: number = 0;
  private lifetimeSpending: number = 0;

  getVIPTiers(): VIPTier[] {
    return [
      {
        level: 0,
        name: 'Free Player',
        requiredPoints: 0,
        benefits: [],
        monthlyRewards: [],
        exclusiveAccess: [],
        color: '#808080',
        icon: '🆓',
      },
      {
        level: 1,
        name: 'Bronze VIP',
        requiredPoints: 100,
        benefits: [
          { id: 'daily_bonus', description: 'Daily login bonus', value: 100 },
          { id: 'ad_skip', description: 'Skip 1 ad per day', value: 1 },
        ],
        monthlyRewards: [{ type: 'coins', amount: 1000, claimable: true }],
        exclusiveAccess: ['bronze_frame'],
        color: '#CD7F32',
        icon: '🥉',
      },
      {
        level: 2,
        name: 'Silver VIP',
        requiredPoints: 500,
        benefits: [
          { id: 'daily_bonus', description: 'Daily login bonus', value: 250 },
          { id: 'ad_skip', description: 'Skip 3 ads per day', value: 3 },
          { id: 'energy_bonus', description: '+10 max energy', value: 10 },
        ],
        monthlyRewards: [
          { type: 'coins', amount: 5000, claimable: true },
          { type: 'crate', amount: 1, claimable: true },
        ],
        exclusiveAccess: ['silver_frame', 'vip_chat'],
        color: '#C0C0C0',
        icon: '🥈',
      },
      {
        level: 3,
        name: 'Gold VIP',
        requiredPoints: 1000,
        benefits: [
          { id: 'daily_bonus', description: 'Daily login bonus', value: 500 },
          { id: 'ad_skip', description: 'No ads', value: -1 },
          { id: 'energy_bonus', description: '+25 max energy', value: 25 },
          { id: 'coin_multiplier', description: '1.5x coins', value: 1.5 },
        ],
        monthlyRewards: [
          { type: 'coins', amount: 10000, claimable: true },
          { type: 'legendary_crate', amount: 1, claimable: true },
          { type: 'gems', amount: 100, claimable: true },
        ],
        exclusiveAccess: ['gold_frame', 'vip_chat', 'early_access'],
        color: '#FFD700',
        icon: '🥇',
      },
      {
        level: 4,
        name: 'Platinum VIP',
        requiredPoints: 2500,
        benefits: [
          { id: 'daily_bonus', description: 'Daily login bonus', value: 1000 },
          { id: 'energy_bonus', description: '+50 max energy', value: 50 },
          { id: 'coin_multiplier', description: '2x coins', value: 2 },
          { id: 'exclusive_events', description: 'VIP-only events', value: 'access' },
        ],
        monthlyRewards: [
          { type: 'coins', amount: 25000, claimable: true },
          { type: 'mythic_crate', amount: 1, claimable: true },
          { type: 'gems', amount: 500, claimable: true },
        ],
        exclusiveAccess: ['platinum_frame', 'vip_chat', 'early_access', 'beta_features'],
        color: '#E5E4E2',
        icon: '💎',
      },
      {
        level: 5,
        name: 'Diamond VIP',
        requiredPoints: 5000,
        benefits: [
          { id: 'daily_bonus', description: 'Daily login bonus', value: 2500 },
          { id: 'energy_bonus', description: 'Unlimited energy', value: -1 },
          { id: 'coin_multiplier', description: '3x coins', value: 3 },
          { id: 'personal_manager', description: 'VIP concierge', value: 'enabled' },
        ],
        monthlyRewards: [
          { type: 'coins', amount: 100000, claimable: true },
          { type: 'exclusive_skin', amount: 1, claimable: true },
          { type: 'gems', amount: 2000, claimable: true },
        ],
        exclusiveAccess: ['everything'],
        color: '#B9F2FF',
        icon: '💠',
      },
    ];
  }

  async addVIPPoints(amount: number): Promise<{
    levelUp: boolean;
    newLevel: number;
    rewards: VIPBenefit[];
  }> {
    const previousLevel = this.vipLevel;
    this.vipPoints += amount;
    this.lifetimeSpending += amount;

    // Check for level up
    const tiers = this.getVIPTiers();
    let newLevel = 0;

    for (let i = tiers.length - 1; i >= 0; i--) {
      if (this.vipPoints >= tiers[i].requiredPoints) {
        newLevel = i;
        break;
      }
    }

    this.vipLevel = newLevel;
    const levelUp = newLevel > previousLevel;

    if (levelUp) {
      await this.sendVIPLevelUpNotification(newLevel);
    }

    return {
      levelUp,
      newLevel,
      rewards: tiers[newLevel].benefits,
    };
  }

  private async sendVIPLevelUpNotification(level: number) {
    const tiers = this.getVIPTiers();
    const tier = tiers[level];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${tier.icon} VIP Level ${level} Achieved!`,
        body: `Welcome to ${tier.name}! Enjoy your exclusive benefits.`,
        data: { type: 'vip_levelup', level },
      },
      trigger: null,
    });
  }

  getVIPStatus(): {
    level: number;
    points: number;
    nextLevel: VIPTier | null;
    pointsToNext: number;
    benefits: VIPBenefit[];
  } {
    const tiers = this.getVIPTiers();
    const currentTier = tiers[this.vipLevel];
    const nextTier = tiers[this.vipLevel + 1] || null;

    return {
      level: this.vipLevel,
      points: this.vipPoints,
      nextLevel: nextTier,
      pointsToNext: nextTier ? nextTier.requiredPoints - this.vipPoints : 0,
      benefits: currentTier.benefits,
    };
  }
}

// Export all systems
export const GuildSystemInstance = new GuildSystem();
export const LiveEventsSystemInstance = new LiveEventsSystem();
export const CollectionSystemInstance = new CollectionSystem();
export const PrestigeSystemInstance = new PrestigeSystem();
export const VIPSystemInstance = new VIPSystem();
