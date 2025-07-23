import { offlineManager } from './offlineManager';

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'achievement' | 'special';
  category: 'collection' | 'survival' | 'skill' | 'combo' | 'powerup';
  objective: {
    type: string;
    target: number;
    current: number;
  };
  rewards: {
    coins: number;
    experience: number;
    powerUps: string[];
    gems: number;
  };
  completed: boolean;
  expiresAt?: Date;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  objective: string;
  target: number;
  reward: {
    coins: number;
    experience: number;
    specialReward?: string;
  };
  completed: boolean;
  progress: number;
  date: string;
}

export interface MissionProgress {
  userId: string;
  activeMissions: Mission[];
  completedMissions: string[];
  dailyChallenges: DailyChallenge[];
  weeklyChallenges: Mission[];
  achievements: string[];
  totalMissionsCompleted: number;
  streakDays: number;
  lastUpdated: Date;
}

export class MissionSystem {
  private static instance: MissionSystem;
  private progress: MissionProgress | null = null;

  static getInstance(): MissionSystem {
    if (!MissionSystem.instance) {
      MissionSystem.instance = new MissionSystem();
    }
    return MissionSystem.instance;
  }

  // Initialize mission system
  async initializeMissions(userId: string): Promise<MissionProgress> {
    try {
      const offlineData = await offlineManager.getOfflineData(userId);
      
      if (offlineData.missions) {
        this.progress = offlineData.missions;
        return this.progress;
      }
    } catch (error) {
      console.log('Error loading mission data:', error);
    }

    // Create default mission progress
    this.progress = {
      userId,
      activeMissions: this.generateDailyMissions(),
      completedMissions: [],
      dailyChallenges: this.generateDailyChallenges(),
      weeklyChallenges: this.generateWeeklyChallenges(),
      achievements: [],
      totalMissionsCompleted: 0,
      streakDays: 0,
      lastUpdated: new Date(),
    };

    await this.saveMissionProgress();
    return this.progress;
  }

  // Generate daily missions
  private generateDailyMissions(): Mission[] {
    const today = new Date().toISOString().split('T')[0];
    const missions: Mission[] = [];

    // Collection missions
    missions.push({
      id: `daily_collect_${today}`,
      title: 'Coin Collector',
      description: 'Collect coins in a single game',
      type: 'daily',
      category: 'collection',
      objective: {
        type: 'collect_coins',
        target: 50,
        current: 0,
      },
      rewards: {
        coins: 25,
        experience: 10,
        powerUps: [],
        gems: 0,
      },
      completed: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      difficulty: 'easy',
    });

    // Survival missions
    missions.push({
      id: `daily_survive_${today}`,
      title: 'Survivor',
      description: 'Survive for a certain time without power-ups',
      type: 'daily',
      category: 'survival',
      objective: {
        type: 'survive_no_powerups',
        target: 30,
        current: 0,
      },
      rewards: {
        coins: 50,
        experience: 20,
        powerUps: ['magnet'],
        gems: 1,
      },
      completed: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      difficulty: 'medium',
    });

    // Skill missions
    missions.push({
      id: `daily_combo_${today}`,
      title: 'Combo Master',
      description: 'Achieve a coin catching combo',
      type: 'daily',
      category: 'combo',
      objective: {
        type: 'coin_combo',
        target: 10,
        current: 0,
      },
      rewards: {
        coins: 75,
        experience: 30,
        powerUps: ['doublePoints'],
        gems: 2,
      },
      completed: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      difficulty: 'hard',
    });

    return missions;
  }

  // Generate daily challenges
  private generateDailyChallenges(): DailyChallenge[] {
    const today = new Date().toISOString().split('T')[0];
    const challenges: DailyChallenge[] = [];

    challenges.push({
      id: `challenge_1_${today}`,
      title: 'Perfect Catch',
      description: 'Catch 10 bonus coins without missing',
      objective: 'Catch bonus coins without missing',
      target: 10,
      reward: {
        coins: 100,
        experience: 50,
        specialReward: 'perfect_catch_badge',
      },
      completed: false,
      progress: 0,
      date: today,
    });

    challenges.push({
      id: `challenge_2_${today}`,
      title: 'Power-up Free',
      description: 'Survive 60 seconds with no power-ups',
      objective: 'Survive without power-ups',
      target: 60,
      reward: {
        coins: 150,
        experience: 75,
        specialReward: 'pure_skill_badge',
      },
      completed: false,
      progress: 0,
      date: today,
    });

    challenges.push({
      id: `challenge_3_${today}`,
      title: 'Speed Demon',
      description: 'Catch 20 coins in under 30 seconds',
      objective: 'Fast coin collection',
      target: 20,
      reward: {
        coins: 200,
        experience: 100,
        specialReward: 'speed_demon_badge',
      },
      completed: false,
      progress: 0,
      date: today,
    });

    return challenges;
  }

  // Generate weekly challenges
  private generateWeeklyChallenges(): Mission[] {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekId = weekStart.toISOString().split('T')[0];

    return [
      {
        id: `weekly_master_${weekId}`,
        title: 'Weekly Master',
        description: 'Complete all daily missions for 7 days',
        type: 'weekly',
        category: 'achievement',
        objective: {
          type: 'complete_daily_missions',
          target: 7,
          current: 0,
        },
        rewards: {
          coins: 500,
          experience: 200,
          powerUps: ['goldRush'],
          gems: 10,
        },
        completed: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        difficulty: 'expert',
      },
      {
        id: `weekly_collector_${weekId}`,
        title: 'Coin Collector',
        description: 'Collect 1000 coins in total',
        type: 'weekly',
        category: 'collection',
        objective: {
          type: 'total_coins_collected',
          target: 1000,
          current: 0,
        },
        rewards: {
          coins: 300,
          experience: 150,
          powerUps: ['magnet'],
          gems: 5,
        },
        completed: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        difficulty: 'medium',
      },
    ];
  }

  // Update mission progress
  async updateMissionProgress(
    missionType: string,
    value: number,
    gameData?: {
      coinsCollected: number;
      timeSurvived: number;
      powerUpsUsed: number;
      comboCount: number;
    }
  ): Promise<{
    completedMissions: Mission[];
    rewards: any;
  }> {
    if (!this.progress) return { completedMissions: [], rewards: {} };

    const completedMissions: Mission[] = [];
    let totalRewards = {
      coins: 0,
      experience: 0,
      powerUps: [] as string[],
      gems: 0,
    };

    // Update daily missions
    for (const mission of this.progress.activeMissions) {
      if (mission.completed) continue;

      let shouldUpdate = false;
      let progressValue = value;

      switch (mission.objective.type) {
        case 'collect_coins':
          if (missionType === 'coin_collected') {
            mission.objective.current += value;
            shouldUpdate = true;
          }
          break;
        case 'survive_no_powerups':
          if (missionType === 'time_survived' && gameData?.powerUpsUsed === 0) {
            mission.objective.current += value;
            shouldUpdate = true;
          }
          break;
        case 'coin_combo':
          if (missionType === 'combo_achieved') {
            mission.objective.current = Math.max(mission.objective.current, value);
            shouldUpdate = true;
          }
          break;
      }

      if (shouldUpdate && mission.objective.current >= mission.objective.target) {
        mission.completed = true;
        completedMissions.push(mission);
        
        totalRewards.coins += mission.rewards.coins;
        totalRewards.experience += mission.rewards.experience;
        totalRewards.powerUps.push(...mission.rewards.powerUps);
        totalRewards.gems += mission.rewards.gems;
      }
    }

    // Update daily challenges
    for (const challenge of this.progress.dailyChallenges) {
      if (challenge.completed) continue;

      let shouldUpdate = false;
      let progressValue = value;

      switch (challenge.objective) {
        case 'Catch bonus coins without missing':
          if (missionType === 'bonus_coin_caught') {
            challenge.progress += value;
            shouldUpdate = true;
          }
          break;
        case 'Survive without power-ups':
          if (missionType === 'time_survived_no_powerups') {
            challenge.progress += value;
            shouldUpdate = true;
          }
          break;
        case 'Fast coin collection':
          if (missionType === 'fast_coins' && gameData) {
            const timeElapsed = gameData.timeSurvived;
            if (timeElapsed <= 30 && gameData.coinsCollected >= 20) {
              challenge.progress = Math.max(challenge.progress, gameData.coinsCollected);
              shouldUpdate = true;
            }
          }
          break;
      }

      if (shouldUpdate && challenge.progress >= challenge.target) {
        challenge.completed = true;
        
        totalRewards.coins += challenge.reward.coins;
        totalRewards.experience += challenge.reward.experience;
        if (challenge.reward.specialReward) {
          totalRewards.powerUps.push(challenge.reward.specialReward);
        }
      }
    }

    // Update weekly challenges
    for (const challenge of this.progress.weeklyChallenges) {
      if (challenge.completed) continue;

      let shouldUpdate = false;

      switch (challenge.objective.type) {
        case 'complete_daily_missions':
          if (missionType === 'daily_mission_completed') {
            challenge.objective.current += value;
            shouldUpdate = true;
          }
          break;
        case 'total_coins_collected':
          if (missionType === 'coin_collected') {
            challenge.objective.current += value;
            shouldUpdate = true;
          }
          break;
      }

      if (shouldUpdate && challenge.objective.current >= challenge.objective.target) {
        challenge.completed = true;
        completedMissions.push(challenge);
        
        totalRewards.coins += challenge.rewards.coins;
        totalRewards.experience += challenge.rewards.experience;
        totalRewards.powerUps.push(...challenge.rewards.powerUps);
        totalRewards.gems += challenge.rewards.gems;
      }
    }

    // Update progress
    this.progress.totalMissionsCompleted += completedMissions.length;
    this.progress.lastUpdated = new Date();

    await this.saveMissionProgress();

    return {
      completedMissions,
      rewards: totalRewards,
    };
  }

  // Get available missions
  getAvailableMissions(): Mission[] {
    if (!this.progress) return [];
    return this.progress.activeMissions.filter(mission => !mission.completed);
  }

  // Get daily challenges
  getDailyChallenges(): DailyChallenge[] {
    if (!this.progress) return [];
    return this.progress.dailyChallenges;
  }

  // Get weekly challenges
  getWeeklyChallenges(): Mission[] {
    if (!this.progress) return [];
    return this.progress.weeklyChallenges;
  }

  // Check if missions need refresh
  async checkMissionRefresh(): Promise<boolean> {
    if (!this.progress) return false;

    const today = new Date().toISOString().split('T')[0];
    const lastUpdated = this.progress.lastUpdated.toISOString().split('T')[0];

    if (today !== lastUpdated) {
      // Refresh daily missions
      this.progress.activeMissions = this.generateDailyMissions();
      this.progress.dailyChallenges = this.generateDailyChallenges();
      this.progress.lastUpdated = new Date();

      // Check for weekly refresh
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const currentWeekId = weekStart.toISOString().split('T')[0];

      const firstMission = this.progress.weeklyChallenges[0];
      if (firstMission && !firstMission.id.includes(currentWeekId)) {
        this.progress.weeklyChallenges = this.generateWeeklyChallenges();
      }

      await this.saveMissionProgress();
      return true;
    }

    return false;
  }

  // Get mission progress
  getMissionProgress(): MissionProgress | null {
    return this.progress;
  }

  // Save mission progress
  private async saveMissionProgress(): Promise<void> {
    if (!this.progress) return;

    try {
      await offlineManager.saveOfflineData(this.progress.userId, {
        missions: this.progress,
      });

      await offlineManager.addPendingAction(this.progress.userId, {
        type: 'mission_update',
        data: this.progress,
      });
    } catch (error) {
      console.log('Error saving mission progress:', error);
    }
  }

  // Get mission statistics
  getMissionStats(): {
    totalCompleted: number;
    dailyCompleted: number;
    weeklyCompleted: number;
    streakDays: number;
  } {
    if (!this.progress) {
      return {
        totalCompleted: 0,
        dailyCompleted: 0,
        weeklyCompleted: 0,
        streakDays: 0,
      };
    }

    const dailyCompleted = this.progress.activeMissions.filter(m => m.completed).length;
    const weeklyCompleted = this.progress.weeklyChallenges.filter(m => m.completed).length;

    return {
      totalCompleted: this.progress.totalMissionsCompleted,
      dailyCompleted,
      weeklyCompleted,
      streakDays: this.progress.streakDays,
    };
  }
}

export const missionSystem = MissionSystem.getInstance(); 