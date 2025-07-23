import { offlineManager } from './offlineManager';

export interface SeasonPass {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  duration: number; // days
  isActive: boolean;
  tiers: SeasonPassTier[];
  currentTier: number;
  experience: number;
  experienceToNext: number;
  premium: boolean;
}

export interface SeasonPassTier {
  level: number;
  freeRewards: SeasonPassReward[];
  premiumRewards: SeasonPassReward[];
  experienceRequired: number;
  unlocked: boolean;
  claimed: boolean;
}

export interface SeasonPassReward {
  type: 'coins' | 'gems' | 'powerup' | 'skin' | 'boost' | 'experience';
  amount: number;
  itemId?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  claimed: boolean;
}

export interface SeasonPassProgress {
  userId: string;
  currentSeason: SeasonPass | null;
  completedSeasons: string[];
  totalExperience: number;
  premiumSeasons: string[];
  lastUpdated: Date;
}

export class SeasonPassSystem {
  private static instance: SeasonPassSystem;
  private progress: SeasonPassProgress | null = null;

  static getInstance(): SeasonPassSystem {
    if (!SeasonPassSystem.instance) {
      SeasonPassSystem.instance = new SeasonPassSystem();
    }
    return SeasonPassSystem.instance;
  }

  // Initialize season pass
  async initializeSeasonPass(userId: string): Promise<SeasonPassProgress> {
    try {
      const offlineData = await offlineManager.getOfflineData(userId);
      
      if (offlineData.seasonPass) {
        this.progress = offlineData.seasonPass;
        return this.progress;
      }
    } catch (error) {
      console.log('Error loading season pass data:', error);
    }

    // Create default season pass progress
    this.progress = {
      userId,
      currentSeason: this.createDefaultSeason(),
      completedSeasons: [],
      totalExperience: 0,
      premiumSeasons: [],
      lastUpdated: new Date(),
    };

    await this.saveSeasonPassProgress();
    return this.progress;
  }

  // Create default season
  private createDefaultSeason(): SeasonPass {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    return {
      id: 'gold_rush_season_1',
      name: 'Gold Rush Season',
      description: 'Unlock rare pot skins and exclusive rewards',
      startDate,
      endDate,
      duration: 14,
      isActive: true,
      tiers: this.generateSeasonTiers(),
      currentTier: 1,
      experience: 0,
      experienceToNext: 100,
      premium: false,
    };
  }

  // Generate season tiers
  private generateSeasonTiers(): SeasonPassTier[] {
    const tiers: SeasonPassTier[] = [];
    
    for (let level = 1; level <= 50; level++) {
      const experienceRequired = level * 100;
      
      tiers.push({
        level,
        freeRewards: this.generateFreeRewards(level),
        premiumRewards: this.generatePremiumRewards(level),
        experienceRequired,
        unlocked: false,
        claimed: false,
      });
    }
    
    return tiers;
  }

  // Generate free rewards
  private generateFreeRewards(level: number): SeasonPassReward[] {
    const rewards: SeasonPassReward[] = [];
    
    // Every level gives coins
    rewards.push({
      type: 'coins',
      amount: 10 + (level * 2),
      rarity: 'common',
      claimed: false,
    });

    // Special rewards at milestone levels
    if (level % 5 === 0) {
      rewards.push({
        type: 'powerup',
        amount: 1,
        itemId: 'magnet',
        rarity: 'rare',
        claimed: false,
      });
    }

    if (level % 10 === 0) {
      rewards.push({
        type: 'gems',
        amount: 5,
        rarity: 'epic',
        claimed: false,
      });
    }

    return rewards;
  }

  // Generate premium rewards
  private generatePremiumRewards(level: number): SeasonPassReward[] {
    const rewards: SeasonPassReward[] = [];
    
    // Premium gets more coins
    rewards.push({
      type: 'coins',
      amount: 25 + (level * 5),
      rarity: 'rare',
      claimed: false,
    });

    // Premium exclusive skins
    if (level === 5) {
      rewards.push({
        type: 'skin',
        amount: 1,
        itemId: 'golden_flame_pot',
        rarity: 'epic',
        claimed: false,
      });
    }

    if (level === 15) {
      rewards.push({
        type: 'skin',
        amount: 1,
        itemId: 'rainbow_aura_pot',
        rarity: 'legendary',
        claimed: false,
      });
    }

    if (level === 30) {
      rewards.push({
        type: 'skin',
        amount: 1,
        itemId: 'cosmic_void_pot',
        rarity: 'legendary',
        claimed: false,
      });
    }

    // Premium power-ups
    if (level % 3 === 0) {
      rewards.push({
        type: 'powerup',
        amount: 1,
        itemId: 'doublePoints',
        rarity: 'epic',
        claimed: false,
      });
    }

    return rewards;
  }

  // Add experience to season pass
  async addExperience(amount: number): Promise<{
    newTier: number;
    rewards: SeasonPassReward[];
    tierUnlocked: boolean;
  }> {
    if (!this.progress?.currentSeason) {
      return { newTier: 0, rewards: [], tierUnlocked: false };
    }

    const season = this.progress.currentSeason;
    season.experience += amount;
    this.progress.totalExperience += amount;

    let newTier = season.currentTier;
    let rewards: SeasonPassReward[] = [];
    let tierUnlocked = false;

    // Check for tier unlocks
    while (season.experience >= season.experienceToNext && newTier < season.tiers.length) {
      const tier = season.tiers[newTier];
      if (!tier.unlocked) {
        tier.unlocked = true;
        tierUnlocked = true;
        
        // Collect rewards
        rewards.push(...tier.freeRewards);
        if (season.premium) {
          rewards.push(...tier.premiumRewards);
        }
      }
      
      newTier++;
      season.currentTier = newTier;
      
      if (newTier < season.tiers.length) {
        season.experienceToNext = season.tiers[newTier].experienceRequired;
      }
    }

    await this.saveSeasonPassProgress();

    return {
      newTier,
      rewards,
      tierUnlocked,
    };
  }

  // Claim tier rewards
  async claimTierRewards(tierLevel: number): Promise<{
    success: boolean;
    rewards: SeasonPassReward[];
  }> {
    if (!this.progress?.currentSeason) {
      return { success: false, rewards: [] };
    }

    const tier = this.progress.currentSeason.tiers.find(t => t.level === tierLevel);
    if (!tier || !tier.unlocked || tier.claimed) {
      return { success: false, rewards: [] };
    }

    tier.claimed = true;
    const rewards = [...tier.freeRewards];
    
    if (this.progress.currentSeason.premium) {
      rewards.push(...tier.premiumRewards);
    }

    await this.saveSeasonPassProgress();

    return {
      success: true,
      rewards,
    };
  }

  // Upgrade to premium
  async upgradeToPremium(): Promise<boolean> {
    if (!this.progress?.currentSeason) return false;

    this.progress.currentSeason.premium = true;
    this.progress.premiumSeasons.push(this.progress.currentSeason.id);
    
    await this.saveSeasonPassProgress();
    return true;
  }

  // Check season completion
  async checkSeasonCompletion(): Promise<{
    completed: boolean;
    nextSeason: SeasonPass | null;
  }> {
    if (!this.progress?.currentSeason) {
      return { completed: false, nextSeason: null };
    }

    const season = this.progress.currentSeason;
    const now = new Date();
    
    if (now > season.endDate) {
      // Season completed
      this.progress.completedSeasons.push(season.id);
      
      // Create next season
      const nextSeason = this.createNextSeason();
      this.progress.currentSeason = nextSeason;
      
      await this.saveSeasonPassProgress();
      
      return {
        completed: true,
        nextSeason,
      };
    }

    return { completed: false, nextSeason: null };
  }

  // Create next season
  private createNextSeason(): SeasonPass {
    const seasonNames = ['Gold Rush', 'Volcano Fury', 'Rainbow Storm', 'Crystal Quest', 'Cosmic Chaos'];
    const seasonId = this.progress!.completedSeasons.length + 1;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    return {
      id: `season_${seasonId}`,
      name: `${seasonNames[seasonId % seasonNames.length]} Season`,
      description: `Unlock exclusive rewards and rare items`,
      startDate,
      endDate,
      duration: 14,
      isActive: true,
      tiers: this.generateSeasonTiers(),
      currentTier: 1,
      experience: 0,
      experienceToNext: 100,
      premium: false,
    };
  }

  // Get current season
  getCurrentSeason(): SeasonPass | null {
    return this.progress?.currentSeason || null;
  }

  // Get available rewards
  getAvailableRewards(): SeasonPassReward[] {
    if (!this.progress?.currentSeason) return [];

    const rewards: SeasonPassReward[] = [];
    const season = this.progress.currentSeason;

    season.tiers.forEach(tier => {
      if (tier.unlocked && !tier.claimed) {
        rewards.push(...tier.freeRewards);
        if (season.premium) {
          rewards.push(...tier.premiumRewards);
        }
      }
    });

    return rewards;
  }

  // Get season progress
  getSeasonProgress(): {
    currentTier: number;
    experience: number;
    experienceToNext: number;
    totalTiers: number;
    progressPercentage: number;
  } {
    if (!this.progress?.currentSeason) {
      return {
        currentTier: 0,
        experience: 0,
        experienceToNext: 0,
        totalTiers: 0,
        progressPercentage: 0,
      };
    }

    const season = this.progress.currentSeason;
    const progressPercentage = (season.experience / season.experienceToNext) * 100;

    return {
      currentTier: season.currentTier,
      experience: season.experience,
      experienceToNext: season.experienceToNext,
      totalTiers: season.tiers.length,
      progressPercentage,
    };
  }

  // Save season pass progress
  private async saveSeasonPassProgress(): Promise<void> {
    if (!this.progress) return;

    try {
      await offlineManager.saveOfflineData(this.progress.userId, {
        seasonPass: this.progress,
      });

      await offlineManager.addPendingAction(this.progress.userId, {
        type: 'season_pass_update',
        data: this.progress,
      });
    } catch (error) {
      console.log('Error saving season pass progress:', error);
    }
  }
}

export const seasonPassSystem = SeasonPassSystem.getInstance(); 