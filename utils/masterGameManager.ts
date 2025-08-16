import { progressionSystem } from './progressionSystem';
import { metaGameSystem } from './metaGameSystem';
import { missionSystem } from './missionSystem';
import { powerUpEvolutionSystem } from './powerUpEvolution';
import { skillMechanicsSystem } from './skillMechanics';
import { seasonPassSystem } from './seasonPassSystem';
import { dailyStreakSystem } from './dailyStreakSystem';
import { unlockTreeSystem } from './unlockTreeSystem';
import { adRewardsSystem } from './adRewardsSystem';
import { offlineManager } from './offlineManager';




export interface GameState {
  userId: string;
  isInitialized: boolean;
  currentLevel: any;
  currentWorld: any;
  playerProgress: any;
  metaGameProgress: any;
  missionProgress: any;
  powerUpCollection: any;
  skillProgress: any;
  seasonPass: any;
  dailyStreak: any;
  unlockTree: any;
  adRewards: any;
  lastUpdated: Date;
}

export class MasterGameManager {
  private static instance: MasterGameManager;
  private gameState: GameState | null = null;

  static getInstance(): MasterGameManager {
    if (!MasterGameManager.instance) {
      MasterGameManager.instance = new MasterGameManager();
    }
    return MasterGameManager.instance;
  }

  // Initialize all game systems
  async initializeGame(userId: string): Promise<GameState> {
    try {
      // Initialize all systems in parallel
      const [
        playerProgress,
        metaGameProgress,
        missionProgress,
        powerUpCollection,
        skillProgress,
        seasonPass,
        dailyStreak,
        unlockTree,
        adRewards,
      ] = await Promise.all([
        progressionSystem.loadPlayerProgress(userId),
        metaGameSystem.initializeMetaGame(userId),
        missionSystem.initializeMissions(userId),
        powerUpEvolutionSystem.initializeCollection(userId),
        skillMechanicsSystem.initializeSkillProgress(userId),
        seasonPassSystem.initializeSeasonPass(userId),
        dailyStreakSystem.initializeStreak(userId),
        unlockTreeSystem.initializeTree(userId),
        adRewardsSystem.initializeAdRewards(userId),
      ]);

      this.gameState = {
        userId,
        isInitialized: true,
        currentLevel: progressionSystem.getCurrentLevel(),
        currentWorld: progressionSystem.getWorlds().find(w => w.id === playerProgress.currentWorld),
        playerProgress,
        metaGameProgress,
        missionProgress,
        powerUpCollection,
        skillProgress,
        seasonPass,
        dailyStreak,
        unlockTree,
        adRewards,
        lastUpdated: new Date(),
      };

      return this.gameState;
    } catch (error) {
      console.log('Error initializing game:', error);
      throw error;
    }
  }

  // Complete a game session
  async completeGameSession(gameData: {
    score: number;
    coinsCollected: number;
    timeSurvived: number;
    obstaclesAvoided: number;
    comboAchieved: number;
    comboCount: number;
    powerUpsUsed: number;
    accuracy: number;
  }): Promise<{
    rewards: any;
    progression: any;
    missions: any;
    seasonPass: any;
    streak: any;
  }> {
    if (!this.gameState) {
      throw new Error('Game not initialized');
    }

    const results = {
      rewards: {},
      progression: {},
      missions: {},
      seasonPass: {},
      streak: {},
    };

    try {
      // Update progression system
      const currentLevel = progressionSystem.getCurrentLevel();
      if (currentLevel) {
        const progressionResult = await progressionSystem.completeLevel(
          currentLevel.id,
          gameData.score,
          gameData.coinsCollected
        );
        results.progression = progressionResult;
      }

      // Update mission system
      const missionUpdates = [
        { type: 'coin_collected', value: gameData.coinsCollected },
        { type: 'time_survived', value: gameData.timeSurvived },
        { type: 'combo_achieved', value: gameData.comboAchieved },
      ];

      for (const update of missionUpdates) {
        const missionResult = await missionSystem.updateMissionProgress(
          update.type,
          update.value,
          gameData
        );
        if (missionResult.completedMissions.length > 0) {
          results.missions = missionResult;
        }
      }

      // Update skill system
      await skillMechanicsSystem.updateSkillProgress(gameData);

      // Update season pass
      const seasonPassResult = await seasonPassSystem.addExperience(
        Math.floor(gameData.score / 10)
      );
      results.seasonPass = seasonPassResult;

      // Update daily streak
      const streakResult = await dailyStreakSystem.updateStreak();
      results.streak = streakResult;

      // Update unlock tree
      await unlockTreeSystem.addExperience(Math.floor(gameData.score / 20));

      // Update meta game (passive income)
      await metaGameSystem.generatePassiveIncome();

      this.gameState.lastUpdated = new Date();
      await this.saveGameState();

    } catch (error) {
      console.log('Error completing game session:', error);
    }

    return results;
  }

  // Get current game state
  getGameState(): GameState | null {
    return this.gameState;
  }

  // Mockable for tests: get current user state
  public getUserState(): GameState | null {
    return this.gameState;
  }

  // Get available actions for player
  getAvailableActions(): {
    missions: any[];
    challenges: any[];
    seasonPass: any;
    dailyGifts: any[];
    unlockableNodes: any[];
    adRewards: any[];
  } {
    if (!this.gameState) {
      return {
        missions: [],
        challenges: [],
        seasonPass: null,
        dailyGifts: [],
        unlockableNodes: [],
        adRewards: [],
      };
    }

    return {
      missions: missionSystem.getAvailableMissions(),
      challenges: missionSystem.getDailyChallenges(),
      seasonPass: seasonPassSystem.getCurrentSeason(),
      dailyGifts: dailyStreakSystem.getAvailableGifts(),
      unlockableNodes: unlockTreeSystem.getUnlockableNodes(),
      adRewards: adRewardsSystem.getAvailableAdRewards(),
    };
  }

  // Get player statistics
  getPlayerStats(): {
    level: number;
    experience: number;
    totalCoins: number;
    totalGames: number;
    bestScore: number;
    achievements: string[];
    streak: number;
    seasonProgress: number;
  } {
    if (!this.gameState) {
      return {
        level: 0,
        experience: 0,
        totalCoins: 0,
        totalGames: 0,
        bestScore: 0,
        achievements: [],
        streak: 0,
        seasonProgress: 0,
      };
    }

    const playerProgress = this.gameState.playerProgress;
    const skillProgress = this.gameState.skillProgress;
    const dailyStreak = this.gameState.dailyStreak;
    const seasonPass = this.gameState.seasonPass;

    return {
      level: playerProgress?.level || 1,
      experience: playerProgress?.experience || 0,
      totalCoins: metaGameSystem.getProgress()?.currency.coins || 0,
      totalGames: skillProgress?.totalGamesPlayed || 0,
      bestScore: skillProgress?.averageScore || 0,
      achievements: skillProgress?.achievements || [],
      streak: dailyStreak?.currentStreak || 0,
      seasonProgress: seasonPass?.currentSeason?.currentTier || 0,
    };
  }

  // Get monetization opportunities
  getMonetizationOpportunities(): {
    seasonPass: any;
    premiumUpgrades: any[];
    exclusiveSkins: any[];
    adRewards: any[];
    inviteRewards: any[];
  } {
    if (!this.gameState) {
      return {
        seasonPass: null,
        premiumUpgrades: [],
        exclusiveSkins: [],
        adRewards: [],
        inviteRewards: [],
      };
    }

    return {
      seasonPass: seasonPassSystem.getCurrentSeason(),
      premiumUpgrades: metaGameSystem.getAvailableShopItems().filter(item => 
        item.currency === 'real_money'
      ),
      exclusiveSkins: metaGameSystem.getOwnedSkins().filter(skin => 
        skin.rarity === 'legendary'
      ),
      adRewards: adRewardsSystem.getAvailableAdRewards(),
      inviteRewards: [], // Would be implemented with social features
    };
  }

  // Save game state
  private async saveGameState(): Promise<void> {
    if (!this.gameState) return;

    try {
      await offlineManager.saveOfflineData(this.gameState.userId, {
        gameState: this.gameState,
      });

      await offlineManager.addPendingAction(this.gameState.userId, {
        type: 'game_state_update',
        data: this.gameState,
      });
    } catch (error) {
      console.log('Error saving game state:', error);
    }
  }

  // Reset game state (for testing)
  async resetGameState(): Promise<void> {
    if (!this.gameState) return;

    this.gameState = null;
    // Clear all system states
    // This would be implemented based on your needs
  }
}

export const masterGameManager = MasterGameManager.getInstance();