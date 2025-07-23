import { offlineManager } from './offlineManager';

export interface PauseTrigger {
  id: string;
  name: string;
  description: string;
  shouldShowPause: boolean;
  priority: number;
  conditions: {
    gameState: string[];
    playerState: any;
    timeThreshold?: number;
  };
  actions: {
    showRetry: boolean;
    showRevive: boolean;
    showPowerUps: boolean;
    showShop: boolean;
    showUpgrade: boolean;
    showSkinSwitch: boolean;
  };
  monetizationOpportunity: {
    type: 'revive' | 'powerup' | 'upgrade' | 'skin' | 'none';
    urgency: 'high' | 'medium' | 'low';
    message: string;
  };
}

export interface GameContext {
  gameState: 'playing' | 'paused' | 'failed' | 'gold_rush' | 'blocked';
  playerLives: number;
  playerCoins: number;
  playerScore: number;
  potLevel: number;
  currentSkin: string;
  availablePowerUps: any[];
  timeInLevel: number;
  blockagePercentage: number;
  goldRushActive: boolean;
  consecutiveFails: number;
}

export class PauseTriggerSystem {
  private static instance: PauseTriggerSystem;
  private triggers: PauseTrigger[] = [];

  static getInstance(): PauseTriggerSystem {
    if (!PauseTriggerSystem.instance) {
      PauseTriggerSystem.instance = new PauseTriggerSystem();
    }
    return PauseTriggerSystem.instance;
  }

  constructor() {
    this.initializeTriggers();
  }

  private initializeTriggers(): void {
    this.triggers = [
      // After level fail - HIGH PRIORITY
      {
        id: 'level_fail',
        name: 'Level Failed',
        description: 'Player failed the level, offer retry and revive options',
        shouldShowPause: true,
        priority: 100,
        conditions: {
          gameState: ['failed'],
          playerState: { consecutiveFails: { min: 1 } },
        },
        actions: {
          showRetry: true,
          showRevive: true,
          showPowerUps: true,
          showShop: false,
          showUpgrade: true,
          showSkinSwitch: false,
        },
        monetizationOpportunity: {
          type: 'revive',
          urgency: 'high',
          message: 'Continue your progress with a revive!',
        },
      },

      // Manual pause - MEDIUM PRIORITY
      {
        id: 'manual_pause',
        name: 'Manual Pause',
        description: 'Player manually paused, give full access to features',
        shouldShowPause: true,
        priority: 50,
        conditions: {
          gameState: ['playing'],
          playerState: { timeInLevel: { min: 5 } }, // At least 5 seconds in
        },
        actions: {
          showRetry: false,
          showRevive: false,
          showPowerUps: true,
          showShop: true,
          showUpgrade: true,
          showSkinSwitch: true,
        },
        monetizationOpportunity: {
          type: 'upgrade',
          urgency: 'medium',
          message: 'Upgrade your pot for better performance!',
        },
      },

      // Low lives / blocked pot - HIGH PRIORITY
      {
        id: 'low_lives_blocked',
        name: 'Low Lives or Blocked',
        description: 'Player is in danger, offer power-ups and revives',
        shouldShowPause: true,
        priority: 90,
        conditions: {
          gameState: ['playing', 'blocked'],
          playerState: { 
            playerLives: { max: 1 },
            blockagePercentage: { min: 75 }
          },
        },
        actions: {
          showRetry: false,
          showRevive: true,
          showPowerUps: true,
          showShop: true,
          showUpgrade: false,
          showSkinSwitch: false,
        },
        monetizationOpportunity: {
          type: 'powerup',
          urgency: 'high',
          message: 'Get a power-up to survive!',
        },
      },

      // Gold Rush active - BLOCK PAUSE
      {
        id: 'gold_rush_active',
        name: 'Gold Rush Active',
        description: 'Gold Rush is active, lock pause to maintain intensity',
        shouldShowPause: false,
        priority: 200, // Highest priority to block
        conditions: {
          gameState: ['playing'],
          playerState: { goldRushActive: true },
        },
        actions: {
          showRetry: false,
          showRevive: false,
          showPowerUps: false,
          showShop: false,
          showUpgrade: false,
          showSkinSwitch: false,
        },
        monetizationOpportunity: {
          type: 'none',
          urgency: 'low',
          message: 'Focus on the gold rush!',
        },
      },

      // High score opportunity - MEDIUM PRIORITY
      {
        id: 'high_score_opportunity',
        name: 'High Score Opportunity',
        description: 'Player is close to beating their high score',
        shouldShowPause: true,
        priority: 60,
        conditions: {
          gameState: ['playing'],
          playerState: { 
            playerScore: { min: 1000 },
            timeInLevel: { min: 30 }
          },
        },
        actions: {
          showRetry: false,
          showRevive: true,
          showPowerUps: true,
          showShop: false,
          showUpgrade: true,
          showSkinSwitch: false,
        },
        monetizationOpportunity: {
          type: 'revive',
          urgency: 'medium',
          message: 'Don\'t lose your high score!',
        },
      },

      // Long session - LOW PRIORITY
      {
        id: 'long_session',
        name: 'Long Session',
        description: 'Player has been playing for a while, offer break',
        shouldShowPause: true,
        priority: 30,
        conditions: {
          gameState: ['playing'],
          playerState: { timeInLevel: { min: 300 } }, // 5 minutes
        },
        actions: {
          showRetry: false,
          showRevive: false,
          showPowerUps: true,
          showShop: true,
          showUpgrade: true,
          showSkinSwitch: true,
        },
        monetizationOpportunity: {
          type: 'upgrade',
          urgency: 'low',
          message: 'Take a break and upgrade!',
        },
      },

      // First time player - HIGH PRIORITY
      {
        id: 'first_time_player',
        name: 'First Time Player',
        description: 'New player, offer guidance and features',
        shouldShowPause: true,
        priority: 80,
        conditions: {
          gameState: ['playing', 'failed'],
          playerState: { 
            totalGamesPlayed: { max: 3 },
            consecutiveFails: { min: 1 }
          },
        },
        actions: {
          showRetry: true,
          showRevive: true,
          showPowerUps: true,
          showShop: true,
          showUpgrade: true,
          showSkinSwitch: true,
        },
        monetizationOpportunity: {
          type: 'powerup',
          urgency: 'high',
          message: 'Welcome! Try a power-up to help you get started!',
        },
      },
    ];
  }

  // Determine if pause menu should be shown
  shouldShowPauseMenu(context: GameContext): {
    shouldShow: boolean;
    trigger: PauseTrigger | null;
    reason: string;
    actions: any;
    monetization: any;
  } {
    // Sort triggers by priority (highest first)
    const sortedTriggers = [...this.triggers].sort((a, b) => b.priority - a.priority);

    for (const trigger of sortedTriggers) {
      if (this.matchesTrigger(trigger, context)) {
        return {
          shouldShow: trigger.shouldShowPause,
          trigger,
          reason: trigger.description,
          actions: trigger.actions,
          monetization: trigger.monetizationOpportunity,
        };
      }
    }

    // Default behavior - allow manual pause
    return {
      shouldShow: true,
      trigger: null,
      reason: 'Manual pause allowed',
      actions: {
        showRetry: false,
        showRevive: false,
        showPowerUps: true,
        showShop: true,
        showUpgrade: true,
        showSkinSwitch: true,
      },
      monetization: {
        type: 'none',
        urgency: 'low',
        message: '',
      },
    };
  }

  // Check if context matches trigger conditions
  private matchesTrigger(trigger: PauseTrigger, context: GameContext): boolean {
    // Check game state
    if (!trigger.conditions.gameState.includes(context.gameState)) {
      return false;
    }

    // Check player state conditions
    for (const [key, condition] of Object.entries(trigger.conditions.playerState)) {
      const playerValue = (context as any)[key];
      
      if (typeof condition === 'object') {
        if (condition.min !== undefined && playerValue < condition.min) {
          return false;
        }
        if (condition.max !== undefined && playerValue > condition.max) {
          return false;
        }
      } else if (playerValue !== condition) {
        return false;
      }
    }

    // Check time threshold
    if (trigger.conditions.timeThreshold && context.timeInLevel < trigger.conditions.timeThreshold) {
      return false;
    }

    return true;
  }

  // Get strategic advice for pause menu
  getStrategicAdvice(context: GameContext): {
    showPause: boolean;
    reason: string;
    recommendedActions: string[];
    monetizationTips: string[];
  } {
    const pauseDecision = this.shouldShowPauseMenu(context);
    
    const recommendedActions = [];
    const monetizationTips = [];

    if (pauseDecision.shouldShow) {
      if (pauseDecision.actions.showRetry) {
        recommendedActions.push('Show retry option prominently');
      }
      if (pauseDecision.actions.showRevive) {
        recommendedActions.push('Offer revive with clear value proposition');
        monetizationTips.push('Highlight progress preservation');
      }
      if (pauseDecision.actions.showPowerUps) {
        recommendedActions.push('Display available power-ups');
        monetizationTips.push('Show power-up effectiveness');
      }
      if (pauseDecision.actions.showShop) {
        recommendedActions.push('Show shop with limited-time offers');
        monetizationTips.push('Create urgency with time-limited deals');
      }
      if (pauseDecision.actions.showUpgrade) {
        recommendedActions.push('Suggest pot upgrades');
        monetizationTips.push('Show upgrade benefits clearly');
      }
      if (pauseDecision.actions.showSkinSwitch) {
        recommendedActions.push('Allow skin switching');
        monetizationTips.push('Show locked skins to create desire');
      }
    } else {
      recommendedActions.push('Block pause to maintain game intensity');
      recommendedActions.push('Show "Gold Rush Active" message');
    }

    return {
      showPause: pauseDecision.shouldShow,
      reason: pauseDecision.reason,
      recommendedActions,
      monetizationTips,
    };
  }

  // Log pause trigger for analytics
  async logPauseTrigger(context: GameContext, trigger: PauseTrigger | null): Promise<void> {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        triggerId: trigger?.id || 'manual',
        gameState: context.gameState,
        playerLives: context.playerLives,
        playerScore: context.playerScore,
        timeInLevel: context.timeInLevel,
        goldRushActive: context.goldRushActive,
        blockagePercentage: context.blockagePercentage,
      };

      await offlineManager.addPendingAction('analytics', {
        type: 'pause_trigger_log',
        data: logData,
      });

      console.log('📊 Pause trigger logged:', logData);
    } catch (error) {
      console.log('❌ Error logging pause trigger:', error);
    }
  }
}

export const pauseTriggerSystem = PauseTriggerSystem.getInstance(); 