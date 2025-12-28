import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GameState {
  // Basic stats
  coins: number;
  totalCoins: number;
  highScore: number;
  currentScore: number;
  level: number;

  // Pot upgrades
  potLevel: number;
  potSpeed: number;
  potSize: number;

  // Power-ups
  magnetActive: boolean;
  slowMotionActive: boolean;
  doublePointsActive: boolean;
  goldRushActive: boolean;

  // Power-up durations
  magnetDuration: number;
  slowMotionDuration: number;
  doublePointsDuration: number;
  goldRushDuration: number;

  // Game state
  isPlaying: boolean;
  isPaused: boolean;
  gameSpeed: number;

  // Cosmetic
  ownedSkins: string[];
  currentSkin: string;

  // Settings
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  tiltControlsEnabled: boolean;

  // Statistics
  gamesPlayed: number;
  totalPlayTime: number;
  coinsCollected: number;
  powerUpsUsed: number;

  // Achievements
  achievements: string[];
}

interface GameContextType {
  gameState: GameState;
  updateGameState: (updates: Partial<GameState>) => void;
  addCoins: (amount: number) => void;
  addScore: (points: number) => void;
  activatePowerUp: (powerUp: string, duration: number) => void;
  resetGame: () => void;
  saveGameData: () => Promise<void>;
  loadGameData: () => Promise<void>;
}

const defaultGameState: GameState = {
  coins: 100,
  totalCoins: 100,
  highScore: 0,
  currentScore: 0,
  level: 1,

  potLevel: 1,
  potSpeed: 1,
  potSize: 1,

  magnetActive: false,
  slowMotionActive: false,
  doublePointsActive: false,
  goldRushActive: false,

  magnetDuration: 0,
  slowMotionDuration: 0,
  doublePointsDuration: 0,
  goldRushDuration: 0,

  isPlaying: false,
  isPaused: false,
  gameSpeed: 1,

  ownedSkins: ['default'],
  currentSkin: 'default',

  soundEnabled: true,
  vibrationEnabled: true,
  tiltControlsEnabled: false,

  gamesPlayed: 0,
  totalPlayTime: 0,
  coinsCollected: 0,
  powerUpsUsed: 0,

  achievements: [],
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const powerUpTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const updateGameState = (updates: Partial<GameState>) => {
    setGameState((prev) => ({ ...prev, ...updates }));
  };

  const addCoins = (amount: number) => {
    setGameState((prev) => ({
      ...prev,
      coins: prev.coins + amount,
      totalCoins: prev.totalCoins + amount,
      coinsCollected: prev.coinsCollected + amount,
    }));
  };

  const addScore = (points: number) => {
    setGameState((prev) => {
      const newScore = prev.currentScore + points;
      const newHighScore = Math.max(prev.highScore, newScore);
      return {
        ...prev,
        currentScore: newScore,
        highScore: newHighScore,
      };
    });
  };

  const activatePowerUp = (powerUp: string, duration: number) => {
    setGameState((prev) => ({
      ...prev,
      powerUpsUsed: prev.powerUpsUsed + 1,
      [`${powerUp}Active`]: true,
      [`${powerUp}Duration`]: duration,
    }));

    // Set up power-up timer
    const timer = setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        [`${powerUp}Active`]: false,
        [`${powerUp}Duration`]: 0,
      }));
    }, duration);

    // Store timer reference for cleanup
    powerUpTimersRef.current[powerUp] = timer;
  };

  const resetGame = () => {
    setGameState((prev) => ({
      ...prev,
      currentScore: 0,
      level: 1,
      isPlaying: false,
      isPaused: false,
      gameSpeed: 1,
      magnetActive: false,
      slowMotionActive: false,
      doublePointsActive: false,
      goldRushActive: false,
      magnetDuration: 0,
      slowMotionDuration: 0,
      doublePointsDuration: 0,
      goldRushDuration: 0,
    }));
  };

  const saveGameData = async () => {
    try {
      await AsyncStorage.setItem('gameData', JSON.stringify(gameState));
    } catch (error) {
      console.error('Error saving game data:', error);
    }
  };

  const loadGameData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('gameData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setGameState((prev) => ({ ...prev, ...parsedData }));
      }
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  };

  // Auto-save game data when it changes
  useEffect(() => {
    saveGameData();
  }, [gameState]);

  // Load game data on mount
  useEffect(() => {
    loadGameData();
  }, []);

  const value: GameContextType = {
    gameState,
    updateGameState,
    addCoins,
    addScore,
    activatePowerUp,
    resetGame,
    saveGameData,
    loadGameData,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
