import { useState, useEffect, useRef, useCallback } from 'react';
import { Dimensions } from 'react-native';
import { masterGameManager } from '../utils/masterGameManager';
import { soundSystem } from '../utils/soundSystem';

const { width, height } = Dimensions.get('window');

export interface GameState {
  isActive: boolean;
  isPaused: boolean;
  score: number;
  coins: number;
  timeSurvived: number;
  combo: number;
  obstaclesAvoided: number;
  powerUpsUsed: number;
  potLevel: number;
  potSpeed: number;
  turboBoost: boolean;
  boostBar: number;
  potPosition: number;
  potSize: number;
  currentSkin: string;
  goldRushActive: boolean;
  blockagePercentage: number;
  consecutiveFails: number;
}

export interface GameAction {
  type: 'START_GAME' | 'PAUSE_GAME' | 'RESUME_GAME' | 'END_GAME' | 'COLLECT_COIN' | 'ACTIVATE_TURBO' | 'UPDATE_POT_POSITION' | 'TRIGGER_GOLD_RUSH' | 'UPDATE_BLOCKAGE' | 'INCREMENT_TIME' | 'RESET_COMBO' | 'INCREMENT_COMBO';
  payload?: any;
}

export const useGameEngine = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    isPaused: false,
    score: 0,
    coins: 0,
    timeSurvived: 0,
    combo: 0,
    obstaclesAvoided: 0,
    powerUpsUsed: 0,
    potLevel: 1,
    potSpeed: 0.5,
    turboBoost: false,
    boostBar: 100,
    potPosition: width / 2,
    potSize: 60,
    currentSkin: 'default_pot',
    goldRushActive: false,
    blockagePercentage: 0,
    consecutiveFails: 0,
  });

  // Game timers
  const gameTimer = useRef<NodeJS.Timeout | null>(null);
  const boostTimer = useRef<NodeJS.Timeout | null>(null);
  const coinSpawnTimer = useRef<NodeJS.Timeout | null>(null);
  const obstacleTimer = useRef<NodeJS.Timeout | null>(null);
  const goldRushTimer = useRef<NodeJS.Timeout | null>(null);
  const comboTimer = useRef<NodeJS.Timeout | null>(null);

  // Game reducer for complex state updates
  const gameReducer = useCallback((state: GameState, action: GameAction): GameState => {
    switch (action.type) {
      case 'START_GAME':
        return {
          ...state,
          isActive: true,
          isPaused: false,
          score: 0,
          coins: 0,
          timeSurvived: 0,
          combo: 0,
          obstaclesAvoided: 0,
          powerUpsUsed: 0,
          boostBar: 100,
          blockagePercentage: 0,
        };

      case 'PAUSE_GAME':
        return {
          ...state,
          isActive: false,
          isPaused: true,
        };

      case 'RESUME_GAME':
        return {
          ...state,
          isActive: true,
          isPaused: false,
        };

      case 'END_GAME':
        return {
          ...state,
          isActive: false,
          isPaused: false,
        };

      case 'COLLECT_COIN':
        const coinValue = state.turboBoost ? 2 : 1;
        const newCombo = state.combo + 1;
        const comboBonus = Math.floor(newCombo / 10) * 5; // Bonus every 10 combo
        
        return {
          ...state,
          coins: state.coins + coinValue,
          score: state.score + (10 * coinValue) + comboBonus,
          combo: newCombo,
        };

      case 'ACTIVATE_TURBO':
        return {
          ...state,
          turboBoost: true,
          boostBar: Math.max(0, state.boostBar - 20),
        };

      case 'UPDATE_POT_POSITION':
        return {
          ...state,
          potPosition: action.payload,
        };

      case 'TRIGGER_GOLD_RUSH':
        return {
          ...state,
          goldRushActive: true,
        };

      case 'UPDATE_BLOCKAGE':
        return {
          ...state,
          blockagePercentage: action.payload,
        };

      case 'INCREMENT_TIME':
        return {
          ...state,
          timeSurvived: state.timeSurvived + 1,
        };

      case 'RESET_COMBO':
        return {
          ...state,
          combo: 0,
        };

      case 'INCREMENT_COMBO':
        return {
          ...state,
          combo: state.combo + 1,
        };

      default:
        return state;
    }
  }, []);

  // Dispatch game actions
  const dispatch = useCallback((action: GameAction) => {
    setGameState(prevState => gameReducer(prevState, action));
  }, [gameReducer]);

  // Start game timers
  const startGameTimers = useCallback(() => {
    // Game timer
    gameTimer.current = setInterval(() => {
      dispatch({ type: 'INCREMENT_TIME' });
    }, 1000);

    // Coin spawning
    coinSpawnTimer.current = setInterval(() => {
      // Spawn coins based on difficulty
      const difficulty = gameState.potLevel || 1;
      const spawnRate = Math.max(1000 - (difficulty * 100), 300);
      
      // This would spawn visual coin objects
      // For now, just track time
    }, 1000);

    // Obstacle spawning
    obstacleTimer.current = setInterval(() => {
      // Spawn obstacles based on level
      const difficulty = gameState.potLevel || 1;
      const spawnRate = Math.max(2000 - (difficulty * 200), 800);
      
      // This would spawn visual obstacle objects
    }, 2000);

    // Combo timer
    comboTimer.current = setInterval(() => {
      if (gameState.combo > 0) {
        dispatch({ type: 'RESET_COMBO' });
      }
    }, 3000);
  }, [dispatch, gameState.potLevel, gameState.combo]);

  // Stop game timers
  const stopGameTimers = useCallback(() => {
    if (gameTimer.current) clearInterval(gameTimer.current);
    if (boostTimer.current) clearInterval(boostTimer.current);
    if (coinSpawnTimer.current) clearInterval(coinSpawnTimer.current);
    if (obstacleTimer.current) clearInterval(obstacleTimer.current);
    if (goldRushTimer.current) clearInterval(goldRushTimer.current);
    if (comboTimer.current) clearInterval(comboTimer.current);
  }, []);

  // Start game
  const startGame = useCallback(async () => {
    dispatch({ type: 'START_GAME' });
    startGameTimers();
    
    // Play background music
    await soundSystem.playMusic('cave_ambient');
  }, [dispatch, startGameTimers]);

  // Pause game
  const pauseGame = useCallback(() => {
    dispatch({ type: 'PAUSE_GAME' });
    stopGameTimers();
  }, [dispatch, stopGameTimers]);

  // Resume game
  const resumeGame = useCallback(() => {
    dispatch({ type: 'RESUME_GAME' });
    startGameTimers();
  }, [dispatch, startGameTimers]);

  // End game
  const endGame = useCallback(async () => {
    dispatch({ type: 'END_GAME' });
    stopGameTimers();
    
    // Stop background music
    await soundSystem.stopMusic();
    
    // Play game over sound
    await soundSystem.playSound('game_over');
    
    // Complete game session
    const gameData = {
      score: gameState.score,
      coinsCollected: gameState.coins,
      timeSurvived: gameState.timeSurvived,
      obstaclesAvoided: gameState.obstaclesAvoided,
      comboAchieved: gameState.combo,
      powerUpsUsed: gameState.powerUpsUsed,
      accuracy: Math.min(100, (gameState.coins / Math.max(gameState.timeSurvived, 1)) * 100),
    };

    try {
      await masterGameManager.completeGameSession(gameData);
    } catch (error) {
      console.log('Error completing game session:', error);
    }
  }, [dispatch, stopGameTimers, gameState]);

  // Collect coin
  const collectCoin = useCallback(async () => {
    if (!gameState.isActive || gameState.isPaused) return;

    dispatch({ type: 'COLLECT_COIN' });
    
    // Play coin sound
    await soundSystem.playSound('coin_catch');
    
    // Play combo sound if combo milestone
    if (gameState.combo > 0 && gameState.combo % 10 === 0) {
      await soundSystem.playSound('combo_multiplier');
    }
  }, [dispatch, gameState.isActive, gameState.isPaused, gameState.combo]);

  // Activate turbo boost
  const activateTurboBoost = useCallback(async () => {
    if (gameState.boostBar < 20) return;

    dispatch({ type: 'ACTIVATE_TURBO' });
    
    // Play power-up sound
    await soundSystem.playSound('powerup_activate');
    
    // Turbo boost duration
    boostTimer.current = setTimeout(() => {
      setGameState(prev => ({ ...prev, turboBoost: false }));
    }, 5000);
  }, [dispatch, gameState.boostBar]);

  // Update pot position
  const updatePotPosition = useCallback((newPosition: number) => {
    // Keep pot within screen bounds
    const clampedPosition = Math.max(gameState.potSize / 2, Math.min(width - gameState.potSize / 2, newPosition));
    dispatch({ type: 'UPDATE_POT_POSITION', payload: clampedPosition });
  }, [dispatch, gameState.potSize]);

  // Trigger gold rush
  const triggerGoldRush = useCallback(async () => {
    dispatch({ type: 'TRIGGER_GOLD_RUSH' });
    
    // Play gold rush music
    await soundSystem.playMusic('gold_rush_theme');
    
    // Gold rush duration
    goldRushTimer.current = setTimeout(() => {
      setGameState(prev => ({ ...prev, goldRushActive: false }));
      soundSystem.playMusic('cave_ambient');
    }, 10000);
  }, [dispatch]);

  // Update blockage percentage
  const updateBlockage = useCallback((percentage: number) => {
    dispatch({ type: 'UPDATE_BLOCKAGE', payload: percentage });
    
    // Check for game over condition
    if (percentage >= 100) {
      endGame();
    }
  }, [dispatch, endGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopGameTimers();
    };
  }, [stopGameTimers]);

  return {
    gameState,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    collectCoin,
    activateTurboBoost,
    updatePotPosition,
    triggerGoldRush,
    updateBlockage,
  };
}; 