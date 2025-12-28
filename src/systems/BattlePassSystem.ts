/**
 * Battle Pass System
 * Monthly subscription model with exclusive rewards and progression
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestore } from '../../firebase/config';
import RevenueCatService from '../services/revenuecat';

export interface BattlePassTier {
  tier: number;
  requiredXP: number;
  freeReward?: Reward;
  premiumReward: Reward;
  isUnlocked: boolean;
  isClaimed: boolean;
  isPremiumClaimed: boolean;
}

export interface Reward {
  type: 'coins' | 'skin' | 'powerup' | 'crate' | 'vip_points' | 'energy' | 'title';
  id: string;
  name: string;
  amount: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  icon: string;
}

export interface BattlePassProgress {
  seasonId: string;
  seasonName: string;
  currentTier: number;
  currentXP: number;
  totalXP: number;
  isPremium: boolean;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  weeklyQuests: Quest[];
  dailyQuests: Quest[];
  seasonQuests: Quest[];
  claimedRewards: string[];
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  progress: number;
  target: number;
  isCompleted: boolean;
  type: 'daily' | 'weekly' | 'seasonal';
  expiresAt?: string;
}

class BattlePassSystem {
  private currentSeason: BattlePassProgress | null = null;
  private tiers: BattlePassTier[] = [];
  private readonly MAX_TIER = 100;
  private readonly XP_PER_TIER = 1000;

  // Season themes for variety
  private readonly SEASON_THEMES = [
    { name: 'Golden Dynasty', color: '#FFD700', exclusive: 'Dragon Pot' },
    { name: 'Crystal Frost', color: '#00CED1', exclusive: 'Ice Queen Cart' },
    { name: 'Neon Nights', color: '#FF1493', exclusive: 'Cyberpunk Trail' },
    { name: 'Ancient Ruins', color: '#8B4513', exclusive: 'Mayan Calendar' },
    { name: 'Space Odyssey', color: '#4B0082', exclusive: 'Galaxy Pot' },
  ];

  async initialize(userId: string) {
    await this.loadCurrentSeason(userId);
    await this.generateTiers();
    await this.checkSeasonReset();
    await this.loadQuests();
  }

  private async loadCurrentSeason(userId: string) {
    try {
      const doc = await firestore.collection('battlepass').doc(userId).get();

      if (doc.exists) {
        this.currentSeason = doc.data() as BattlePassProgress;
      } else {
        await this.createNewSeason(userId);
      }
    } catch (error) {
      console.error('Failed to load battle pass:', error);
      await this.createNewSeason(userId);
    }
  }

  private async createNewSeason(userId: string) {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const seasonIndex = now.getMonth() % this.SEASON_THEMES.length;
    const theme = this.SEASON_THEMES[seasonIndex];

    this.currentSeason = {
      seasonId: `season_${now.getFullYear()}_${now.getMonth() + 1}`,
      seasonName: theme.name,
      currentTier: 0,
      currentXP: 0,
      totalXP: 0,
      isPremium: false,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      daysRemaining: 30,
      weeklyQuests: this.generateWeeklyQuests(),
      dailyQuests: this.generateDailyQuests(),
      seasonQuests: this.generateSeasonQuests(theme.name),
      claimedRewards: [],
    };

    await this.saveSeason(userId);
  }

  private async generateTiers() {
    this.tiers = [];

    for (let i = 1; i <= this.MAX_TIER; i++) {
      const tier: BattlePassTier = {
        tier: i,
        requiredXP: i * this.XP_PER_TIER,
        isUnlocked: false,
        isClaimed: false,
        isPremiumClaimed: false,
        premiumReward: this.generateReward(i, true),
        freeReward: i % 5 === 0 ? this.generateReward(i, false) : undefined,
      };

      // Check if tier is unlocked
      if (this.currentSeason && this.currentSeason.totalXP >= tier.requiredXP) {
        tier.isUnlocked = true;
      }

      this.tiers.push(tier);
    }
  }

  private generateReward(tierLevel: number, isPremium: boolean): Reward {
    // Better rewards at higher tiers and for premium
    const rarityChance = Math.random() + tierLevel / 100 + (isPremium ? 0.3 : 0);

    let rarity: Reward['rarity'] = 'common';
    if (rarityChance > 1.8) rarity = 'mythic';
    else if (rarityChance > 1.5) rarity = 'legendary';
    else if (rarityChance > 1.2) rarity = 'epic';
    else if (rarityChance > 0.8) rarity = 'rare';

    // Special rewards at milestone tiers
    if (tierLevel === 100) {
      return {
        type: 'skin',
        id: `ultimate_skin_${this.currentSeason?.seasonId}`,
        name: 'Ultimate Season Skin',
        amount: 1,
        rarity: 'mythic',
        icon: '👑',
      };
    }

    if (tierLevel % 25 === 0) {
      return {
        type: 'crate',
        id: `legendary_crate_${tierLevel}`,
        name: 'Legendary Crate',
        amount: 1,
        rarity: 'legendary',
        icon: '🎁',
      };
    }

    // Regular tier rewards
    const rewardTypes: Array<Reward['type']> = ['coins', 'powerup', 'energy', 'vip_points'];

    if (isPremium) {
      rewardTypes.push('skin', 'crate', 'title');
    }

    const type = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];

    const amounts: Record<string, number> = {
      coins: 100 * tierLevel * (isPremium ? 2 : 1),
      powerup: Math.min(5 + Math.floor(tierLevel / 10), 20),
      energy: Math.min(10 + Math.floor(tierLevel / 5), 50),
      vip_points: 50 * tierLevel,
      skin: 1,
      crate: 1,
      title: 1,
    };

    return {
      type,
      id: `${type}_tier_${tierLevel}`,
      name: this.getRewardName(type, rarity),
      amount: amounts[type] || 1,
      rarity,
      icon: this.getRewardIcon(type),
    };
  }

  private getRewardName(type: Reward['type'], rarity: Reward['rarity']): string {
    const names: Record<string, string[]> = {
      coins: ['Gold Coins', 'Premium Coins', 'Royal Treasury', 'Dragon Hoard'],
      skin: ['Exclusive Skin', 'Season Skin', 'Limited Edition', "Collector's Item"],
      powerup: ['Power Bundle', 'Boost Pack', 'Enhancement Kit', 'Ultimate Powers'],
      crate: ['Mystery Crate', 'Treasure Chest', 'Legendary Box', 'Mythic Container'],
      vip_points: ['VIP Points', 'Prestige Points', 'Elite Credits', 'Royal Tokens'],
      energy: ['Energy Refill', 'Stamina Boost', 'Power Cells', 'Infinite Energy'],
      title: ['Exclusive Title', 'Season Badge', 'Achievement Banner', 'Legend Status'],
    };

    const rarityPrefix = rarity.charAt(0).toUpperCase() + rarity.slice(1);
    const baseName = names[type]?.[Math.min(Math.floor(Math.random() * 4), 3)] || 'Reward';
    return `${rarityPrefix} ${baseName}`;
  }

  private getRewardIcon(type: Reward['type']): string {
    const icons: Record<string, string> = {
      coins: '💰',
      skin: '🎨',
      powerup: '⚡',
      crate: '📦',
      vip_points: '💎',
      energy: '🔋',
      title: '🏆',
    };
    return icons[type] || '🎁';
  }

  // Quest Generation
  private generateDailyQuests(): Quest[] {
    const templates = [
      { name: 'Daily Player', description: 'Play 3 games', target: 3, xp: 100 },
      { name: 'Coin Collector', description: 'Collect 500 coins', target: 500, xp: 150 },
      { name: 'Power User', description: 'Use 5 power-ups', target: 5, xp: 125 },
      { name: 'Social Butterfly', description: 'Challenge 2 friends', target: 2, xp: 175 },
      { name: 'High Scorer', description: 'Score over 1000 points', target: 1000, xp: 200 },
    ];

    const selected = this.shuffleArray(templates).slice(0, 3);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return selected.map((template, index) => ({
      id: `daily_${Date.now()}_${index}`,
      name: template.name,
      description: template.description,
      xpReward: template.xp,
      progress: 0,
      target: template.target,
      isCompleted: false,
      type: 'daily' as const,
      expiresAt: tomorrow.toISOString(),
    }));
  }

  private generateWeeklyQuests(): Quest[] {
    const templates = [
      { name: 'Marathon Runner', description: 'Play 20 games', target: 20, xp: 500 },
      { name: 'Treasure Hunter', description: 'Collect 5000 coins', target: 5000, xp: 750 },
      { name: 'Streak Master', description: 'Maintain 7-day streak', target: 7, xp: 1000 },
      { name: 'Social Champion', description: 'Win 10 challenges', target: 10, xp: 800 },
      { name: 'Collection Expert', description: 'Open 5 crates', target: 5, xp: 600 },
    ];

    const selected = this.shuffleArray(templates).slice(0, 3);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return selected.map((template, index) => ({
      id: `weekly_${Date.now()}_${index}`,
      name: template.name,
      description: template.description,
      xpReward: template.xp,
      progress: 0,
      target: template.target,
      isCompleted: false,
      type: 'weekly' as const,
      expiresAt: nextWeek.toISOString(),
    }));
  }

  private generateSeasonQuests(seasonName: string): Quest[] {
    return [
      {
        id: `season_tier_50`,
        name: 'Halfway Hero',
        description: 'Reach Battle Pass Tier 50',
        xpReward: 5000,
        progress: 0,
        target: 50,
        isCompleted: false,
        type: 'seasonal',
      },
      {
        id: `season_tier_100`,
        name: `${seasonName} Legend`,
        description: 'Complete the Battle Pass (Tier 100)',
        xpReward: 10000,
        progress: 0,
        target: 100,
        isCompleted: false,
        type: 'seasonal',
      },
      {
        id: `season_collection`,
        name: 'Season Collector',
        description: 'Collect 10 seasonal items',
        xpReward: 3000,
        progress: 0,
        target: 10,
        isCompleted: false,
        type: 'seasonal',
      },
    ];
  }

  // XP and Progression
  async addXP(amount: number, source: string): Promise<any> {
    if (!this.currentSeason) return null;

    const previousTier = Math.floor(this.currentSeason.totalXP / this.XP_PER_TIER);
    this.currentSeason.totalXP += amount;
    this.currentSeason.currentXP = this.currentSeason.totalXP % this.XP_PER_TIER;
    const newTier = Math.floor(this.currentSeason.totalXP / this.XP_PER_TIER);

    const result = {
      xpGained: amount,
      totalXP: this.currentSeason.totalXP,
      currentTier: newTier,
      previousTier,
      leveledUp: newTier > previousTier,
      unlockedRewards: [] as Reward[],
    };

    // Check for newly unlocked rewards
    if (result.leveledUp) {
      for (let tier = previousTier + 1; tier <= newTier; tier++) {
        const tierData = this.tiers[tier - 1];
        if (tierData) {
          if (tierData.freeReward) {
            result.unlockedRewards.push(tierData.freeReward);
          }
          if (this.currentSeason.isPremium && tierData.premiumReward) {
            result.unlockedRewards.push(tierData.premiumReward);
          }
        }
      }
    }

    await this.saveSeason();
    return result;
  }

  // Premium Upgrade
  async upgradeToPremium(): Promise<boolean> {
    try {
      // Check RevenueCat for active subscription
      const hasSubscription = await RevenueCatService.hasActiveEntitlement('battle_pass_premium');

      if (hasSubscription && this.currentSeason) {
        this.currentSeason.isPremium = true;
        await this.saveSeason();

        // Retroactively grant all premium rewards up to current tier
        const retroactiveRewards: Reward[] = [];
        for (let i = 1; i <= this.currentSeason.currentTier; i++) {
          const tier = this.tiers[i - 1];
          if (tier && tier.premiumReward && !tier.isPremiumClaimed) {
            retroactiveRewards.push(tier.premiumReward);
            tier.isPremiumClaimed = true;
          }
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to upgrade battle pass:', error);
      return false;
    }
  }

  // Claim Rewards
  async claimReward(tierNumber: number, isPremium: boolean): Promise<Reward | null> {
    const tier = this.tiers[tierNumber - 1];
    if (!tier || !tier.isUnlocked) return null;

    if (isPremium && !this.currentSeason?.isPremium) {
      throw new Error('Premium subscription required');
    }

    const reward = isPremium ? tier.premiumReward : tier.freeReward;
    if (!reward) return null;

    if (isPremium) {
      if (tier.isPremiumClaimed) return null;
      tier.isPremiumClaimed = true;
    } else {
      if (tier.isClaimed) return null;
      tier.isClaimed = true;
    }

    this.currentSeason?.claimedRewards.push(reward.id);
    await this.saveSeason();

    return reward;
  }

  // Quest Progress
  async updateQuestProgress(questType: string, amount: number = 1) {
    if (!this.currentSeason) return;

    const updateQuests = (quests: Quest[]) => {
      quests.forEach((quest) => {
        if (
          !quest.isCompleted &&
          quest.description.toLowerCase().includes(questType.toLowerCase())
        ) {
          quest.progress = Math.min(quest.progress + amount, quest.target);
          if (quest.progress >= quest.target) {
            quest.isCompleted = true;
            this.addXP(quest.xpReward, `quest_${quest.id}`);
          }
        }
      });
    };

    updateQuests(this.currentSeason.dailyQuests);
    updateQuests(this.currentSeason.weeklyQuests);
    updateQuests(this.currentSeason.seasonQuests);

    await this.saveSeason();
  }

  // Season Management
  private async checkSeasonReset() {
    if (!this.currentSeason) return;

    const endDate = new Date(this.currentSeason.endDate);
    const now = new Date();

    if (now > endDate) {
      // Season ended - archive and create new
      await this.archiveSeason();
      await this.createNewSeason('current_user'); // Pass actual user ID
    } else {
      // Update days remaining
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      this.currentSeason.daysRemaining = daysRemaining;
    }
  }

  private async archiveSeason() {
    if (!this.currentSeason) return;

    // Save to archived seasons
    await firestore
      .collection('archived_seasons')
      .doc(this.currentSeason.seasonId)
      .set({
        ...this.currentSeason,
        archivedAt: new Date().toISOString(),
      });
  }

  private async loadQuests() {
    // Refresh daily quests if expired
    if (this.currentSeason?.dailyQuests[0]?.expiresAt) {
      const expiry = new Date(this.currentSeason.dailyQuests[0].expiresAt);
      if (new Date() > expiry) {
        this.currentSeason.dailyQuests = this.generateDailyQuests();
        await this.saveSeason();
      }
    }
  }

  private async saveSeason(userId?: string) {
    if (!this.currentSeason) return;

    const id = userId || 'current_user'; // Get actual user ID
    await firestore.collection('battlepass').doc(id).set(this.currentSeason);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Getters
  getCurrentSeason(): BattlePassProgress | null {
    return this.currentSeason;
  }

  getTiers(): BattlePassTier[] {
    return this.tiers;
  }

  getTimeRemaining(): string {
    if (!this.currentSeason) return 'Season Ended';

    const days = this.currentSeason.daysRemaining;
    if (days > 1) return `${days} days remaining`;
    if (days === 1) return '1 day remaining';

    const endDate = new Date(this.currentSeason.endDate);
    const now = new Date();
    const hours = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    return `${hours} hours remaining`;
  }
}

export default new BattlePassSystem();
