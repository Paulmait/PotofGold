// --- Add these near the top of the file ---
const levelRarityChances = {
  1: { common: 80, uncommon: 15, rare: 4, epic: 1, ultraRare: 0 },
  5: { common: 60, uncommon: 25, rare: 10, epic: 4, ultraRare: 1 },
  10: { common: 40, uncommon: 30, rare: 20, epic: 8, ultraRare: 2 },
  15: { common: 30, uncommon: 30, rare: 25, epic: 12, ultraRare: 3 },
  20: { common: 20, uncommon: 30, rare: 30, epic: 15, ultraRare: 5 },
};
const itemTypes = Object.values(ITEM_CONFIGS);
function getFallSpeed(level: number) {
  // Example: scale with level
  return 1 + level * 0.05;
}
// --- End add ---
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Alert,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { masterGameManager } from '../utils/masterGameManager';
import { metaGameSystem } from '../utils/metaGameSystem';
import { skillMechanicsSystem } from '../utils/skillMechanics';
import { missionSystem } from '../utils/missionSystem';
import { seasonPassSystem } from '../utils/seasonPassSystem';
import { dailyStreakSystem } from '../utils/dailyStreakSystem';
import { unlockTreeSystem } from '../utils/unlockTreeSystem';
import { adRewardsSystem } from '../utils/adRewardsSystem';
import { powerUpEvolutionSystem } from '../utils/powerUpEvolution';
import { progressionSystem } from '../utils/progressionSystem';
import { pauseTriggerSystem, GameContext } from '../utils/pauseTriggerSystem';
import PauseModal from './PauseModal';
import MineCart from '../components/MineCart';
import RailTrack from '../components/RailTrack';
import FallingItems from '../components/FallingItems';
import { CollisionDetection } from '../utils/collisionDetection';
import { ITEM_CONFIGS, LEVEL_SPAWN_MODIFIERS } from '../utils/itemConfig';
import { ComboSystem } from '../utils/comboSystem';
import { CollisionHandler } from '../utils/collisionHandler';
import { StateUnlockSystem } from '../utils/stateUnlockSystem';
import { StateUnlockNotification } from '../components/StateUnlockNotification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateBonusItemManager } from '../utils/stateBonusItems';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { auth } from '../firebase/auth';
import { FirebaseUnlockSystem } from '../utils/firebaseUnlockSystem';
import { UnlockManager, UserData, SkinConfig } from '../utils/unlockManager';
import { useUserUnlocks, UserUnlockContextType } from '../context/UserUnlockContext';
import { useUnlocks } from '../context/UnlocksContext';
import { useGameUnlocks } from '../hooks/useGameUnlocks';
import { MysterySkinSystem } from '../utils/mysterySkinSystem';
import MysteryCrate from '../components/MysteryCrate';
import { useSeasonalSkins } from '../hooks/useSeasonalSkins';
import { useEntitlements } from '../src/features/subscriptions/useEntitlements';
// import { useUnlockMultiplier } from '../src/features/subscriptions/useUnlockMultiplier';
import ResponsiveGameWrapper from '../components/ResponsiveGameWrapper';
import { useOrientation } from '../hooks/useOrientation';
import TouchHandler from '../components/TouchHandler';
import { responsive, gameResponsive, layouts, dimensions } from '../utils/responsiveSystem';

const { width, height } = Dimensions.get('window');

interface GameScreenProps {
  navigation: any;
  orientation?: 'portrait' | 'landscape';
  layout?: any;
  isTablet?: boolean;
  scale?: number;
  savedGameState?: any;
  clearSavedState?: () => void;
}

export default function GameScreen({ 
  navigation, 
  orientation = 'portrait',
  layout,
  isTablet = false,
  scale = 1,
  savedGameState,
  clearSavedState
}: GameScreenProps): React.ReactElement {
  // (removed duplicate spawnFallingItem, keep only the correct one below)
  // Helper to select item type based on level/rarity
  const { userUnlocks, isSkinUnlocked } = useUserUnlocks() as UserUnlockContextType;
  const unlockedSkins = userUnlocks.unlockedSkins;
  const selectedCartSkin = userUnlocks.selectedCartSkin;
  
  // New unlocks system integration
  const unlocks = useUnlocks();
  const gameUnlocks = useGameUnlocks();
  const { activeSeasonalSkins, isSkinCurrentlyAvailable } = useSeasonalSkins();
  const { isSubscriber, isLoading: entitlementsLoading } = useEntitlements();
  // const { getMultiplier } = useUnlockMultiplier(); // Not used or not exported
  
  // Game state
  // Additional game stats
  const [powerUpsUsed, setPowerUpsUsed] = useState(0);
  const [obstaclesAvoided, setObstaclesAvoided] = useState(0);
  const [gameState, setGameState] = useState<any>(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeSurvived, setTimeSurvived] = useState(0);
  const [combo, setCombo] = useState(0);
  // Use responsive cart size from layout
  const responsiveCartSize = layout?.cartSize || (isTablet ? 100 : 80);
  const [potPosition, setPotPosition] = useState(width / 2);
  const [potSize, setPotSize] = useState(responsiveCartSize);
  const [isCartMoving, setIsCartMoving] = useState(false);
  const [fallingItems, setFallingItems] = useState<any[]>([]);
  const [turboBoost, setTurboBoost] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showMysteryCrate, setShowMysteryCrate] = useState(false);
  const [mysteryCrate, setMysteryCrate] = useState<any>(null);

  // Get selected cart skin from context
  const selectedSkinId = selectedCartSkin;
  // Active skin state (typed)
  const [activeSkin, setActiveSkin] = useState<{
    id: string;
    type: 'flag' | 'shape' | 'trail';
    theme: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
    };
    asset?: string;
  } | null>(null);
  // Unlock notification state
  const [showUnlockNotification, setShowUnlockNotification] = useState(false);
  const [currentUnlock, setCurrentUnlock] = useState<any>(null);
  
  // Apply subscription multiplier
  // const baseMultiplier = getMultiplier();

  // Restore game state after orientation change
  useEffect(() => {
    if (savedGameState && !isGameActive) {
      setScore(savedGameState.score || 0);
      setCoins(savedGameState.coins || 0);
      setLevel(savedGameState.level || 1);
      setPotPosition(savedGameState.cartPosition || width / 2);
      setFallingItems(savedGameState.fallingItems || []);
      setCombo(savedGameState.combo || 0);
      setTimeSurvived(savedGameState.timeSurvived || 0);
      setPowerUpsUsed(savedGameState.powerUpsUsed || 0);
      setObstaclesAvoided(savedGameState.obstaclesAvoided || 0);
      
      // Clear the saved state after restoration
      if (clearSavedState) {
        clearSavedState();
      }
      
      // Resume game if it was active
      if (!savedGameState.isPaused) {
        setIsGameActive(true);
      }
    }
  }, [savedGameState, clearSavedState]);

  // Update cart size when orientation changes
  useEffect(() => {
    const newSize = layout?.cartSize || (isTablet ? 100 : 80);
    setPotSize(newSize);
  }, [orientation, layout, isTablet]);

  // Load active skin data when selected skin changes
  // --- Function declarations hoisted for reference ---
  async function loadSkinData(skinId: string) {
    try {
      // In a real app, this would load from the JSON file
      // For now, we'll use a hardcoded mapping that matches the config file
      const skinDataMap: { [key: string]: any } = {
        california: {
          name: "Golden Bear Flag",
          type: "flag",
          unlock: "Collect 1,000 coins",
          rarity: "rare",
          theme: {
            primaryColor: "#FFD700",
            secondaryColor: "#8B4513",
            accentColor: "#FFA500"
          }
        },
        texas: {
          name: "Lone Star Cart",
          type: "shape",
          unlock: "Reach Level 5",
          rarity: "common",
          theme: {
            primaryColor: "#1E3A8A",
            secondaryColor: "#F59E0B",
            accentColor: "#EF4444"
          }
        },

        florida: {
          name: "Sunshine Seal Wrap",
          type: "flag",
          unlock: "Score 300 in one round",
          // ...existing code...
        }
      };
      // ...rest of loadSkinData...
    } catch (e) {
      // ...error handling...
    }
  }

  // Helper to select item type based on level/rarity
  function selectItemType() {
    const levelKey = Math.min(level, 20);
    const rarityChances = levelRarityChances[levelKey] || levelRarityChances[1];
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const [rarity, chance] of Object.entries(rarityChances)) {
      cumulative += Number(chance);
      if (rand <= cumulative) {
        const itemsOfRarity = itemTypes.filter(item => item.rarity === rarity);
        if (itemsOfRarity.length > 0) {
          return itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)].type;
        }
      }
    }
    // Fallback to common items
    return itemTypes.find(item => item.rarity === 'common')?.type || 'coin';
  }

  // Helper to spawn a falling item
  function spawnFallingItem() {
    if (!isGameActive || isPaused) return;
    const x = Math.random() * (width - 60) + 30;
    const itemType = selectItemType();
    const newItem = {
      id: Date.now() + Math.random(),
      x,
      y: -50,
      type: itemType,
      collected: false,
      fallSpeed: getFallSpeed(level),
    };
    setFallingItems(prev => [...prev, newItem]);
  }

  useEffect(() => {
    if (selectedSkinId) {
      loadSkinData(selectedSkinId);
    } else {
      setActiveSkin(null);
    }
  }, [selectedSkinId]);

  // Pot mechanics
  const [potSpeed, setPotSpeed] = useState(0.5); // Slow by default
  const [boostBar, setBoostBar] = useState(0);

  // UI state
  const [currentSkin, setCurrentSkin] = useState('default_pot');

  // Animations
  const potAnimation = useRef(new Animated.Value(width / 2)).current;
  const scoreAnimation = useRef(new Animated.Value(0)).current;
  const coinAnimation = useRef(new Animated.Value(0)).current;
  const comboAnimation = useRef(new Animated.Value(0)).current;

  // Game timers
  const gameTimer = useRef<NodeJS.Timeout | null>(null);
  const boostTimer = useRef<NodeJS.Timeout | null>(null);
  const coinSpawnTimer = useRef<NodeJS.Timeout | null>(null);
  const obstacleTimer = useRef<NodeJS.Timeout | null>(null);

  // Pause state
  const [pauseTrigger, setPauseTrigger] = useState<any>(null);
  const [pauseActions, setPauseActions] = useState<any>(null);
  const [pauseMonetization, setPauseMonetization] = useState<any>(null);

  // Falling items state (already declared above)

  // Combo system
  const comboSystem = useRef(new ComboSystem()).current;
  const [comboDisplay, setComboDisplay] = useState('');
  const [comboMultiplier, setComboMultiplier] = useState(1);

  // Collision handler
  const collisionHandler = useRef<CollisionHandler | null>(null);
  const [lives, setLives] = useState(3);
  const [activePowerUps, setActivePowerUps] = useState<Map<string, number>>(new Map());

  // State unlock system
  const stateUnlockSystem = useRef(new StateUnlockSystem()).current;
  const [currentStateTheme, setCurrentStateTheme] = useState<any>(null);
  const [unlockedStates, setUnlockedStates] = useState<any[]>([]);
  const [newUnlocks, setNewUnlocks] = useState<any[]>([]);

  // Touchscreen optimization
  const [touchZones, setTouchZones] = useState({
    leftZone: { x: 0, y: 0, width: width / 2, height: height },
    rightZone: { x: width / 2, y: 0, width: width / 2, height: height },
  });

  // Touch movement tracking
  const lastTouchX = useRef(potPosition);

  // Handle touch-to-move: Move cart to tap position
  const handleTouchMove = useCallback((touchX: number) => {
    if (!isGameActive || isPaused) return;

    // Move cart directly to touch position
    const cartWidth = potSize;
    const minPosition = cartWidth / 2;
    const maxPosition = width - cartWidth / 2;
    const targetPosition = Math.max(minPosition, Math.min(maxPosition, touchX));
    
    setPotPosition(targetPosition);
    setIsCartMoving(true);
    lastTouchX.current = targetPosition;

    // Smooth animation to target position
    Animated.timing(potAnimation, {
      toValue: targetPosition,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [isGameActive, isPaused, potSize, potAnimation]);
  
  // Handle tap to move
  const handleTap = useCallback((touchX: number) => {
    if (!isGameActive || isPaused) return;
    
    // Move cart to tap position with animation
    const cartWidth = potSize;
    const minPosition = cartWidth / 2;
    const maxPosition = width - cartWidth / 2;
    const targetPosition = Math.max(minPosition, Math.min(maxPosition, touchX));
    
    setPotPosition(targetPosition);
    setIsCartMoving(true);
    lastTouchX.current = targetPosition;
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Smooth spring animation
    Animated.spring(potAnimation, {
      toValue: targetPosition,
      useNativeDriver: false,
      tension: 40,
      friction: 7,
    }).start(() => {
      setIsCartMoving(false);
    });
  }, [isGameActive, isPaused, potSize, potAnimation]);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, []);

  // Initialize collision handler
  useEffect(() => {
    collisionHandler.current = new CollisionHandler({
      onScoreChange: (scoreChange) => {
        setScore(prev => prev + scoreChange);
      },
      onCoinChange: (coinChange) => {
        setCoins(prev => prev + coinChange);
      },
      onLifeChange: (lifeChange) => {
        setLives(prev => Math.max(0, prev + lifeChange));
      },
      onPowerUpActivate: (type, duration) => {
        const endTime = Date.now() + duration;
        setActivePowerUps(prev => new Map(prev.set(type, endTime)));
        setPowerUpsUsed(prev => prev + 1);
      },
      onItemCollect: (itemId) => {
        setFallingItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, collected: true } : item
        ));
      },
      onComboUpdate: (combo, multiplier) => {
        setCombo(combo);
        setComboMultiplier(multiplier);
      },
      onAchievement: (achievement) => {
        console.log(`Achievement: ${achievement}`);
        // Could show achievement notification here
      },
      onSoundPlay: (soundEffect) => {
        console.log(`Playing sound: ${soundEffect}`);
        // Could play sound effect here
      },
    });
  }, []);

  // Handle state special item collection
  const handleStateSpecialItem = (itemType: string) => {
    const stateUnlock = unlockedStates.find(unlock => 
      unlock.visualElements.specialItem === itemType
    );

    if (stateUnlock) {
      // State special items give bonus points and coins
      const bonusScore = 50;
      const bonusCoins = 10;
      
      setScore(prev => prev + bonusScore);
      setCoins(prev => prev + bonusCoins);
      
      console.log(`🏆 State Special: ${stateUnlock.stateName} - +${bonusScore} score, +${bonusCoins} coins`);
    }
  };

  // Check for state unlocks
  useEffect(() => {
    if (isGameActive && score > 0) {
      const gameStats = {
        score,
        coins,
        combo,
        timeSurvived,
        itemsCollected: fallingItems.filter(item => item.collected).length,
      };

      const newUnlocks = stateUnlockSystem.checkForNewUnlocks(gameStats);
      if (newUnlocks.length > 0) {
        setNewUnlocks(newUnlocks);
        // Show unlock notification
        newUnlocks.forEach(unlock => {
          console.log(`🎉 Unlocked: ${unlock.stateName} - ${unlock.description}`);
          setCurrentUnlock(unlock);
          setShowUnlockNotification(true);
        });
      }

      // Update unlocked states
      setUnlockedStates(stateUnlockSystem.getUnlockedStates());
    }
  }, [score, coins, combo, timeSurvived, fallingItems, isGameActive]);

  const initializeGame = async () => {
    try {
      const userId = 'player_1'; // In real app, get from auth
      const state = await masterGameManager.initializeGame(userId);
      setGameState(state);

      // Load pot settings from meta game
      const metaProgress = metaGameSystem.getProgress();
      if (metaProgress) {
        const currentPot = metaProgress.pots.currentPot;
  setPotSpeed(Number((currentPot as any).speed) || 0.5);
  setPotSize(Number((currentPot as any).size ?? 1) * 60 || 60);
  setCurrentSkin(metaProgress.pots.currentSkin.image);
      }

      // Check for daily streak
      await dailyStreakSystem.updateStreak();

      // Check for available missions
      await missionSystem.checkMissionRefresh();

    } catch (error) {
      console.log('Error initializing game:', error);
    }
  };

  // Start game
  const startGame = () => {
    setIsGameActive(true);
    setIsPaused(false);
    setScore(0);
    setCoins(0);
    setTimeSurvived(0);
    setCombo(0);
    setObstaclesAvoided(0);
    setPowerUpsUsed(0);
    setBoostBar(100);
    setLevel(1); // Reset level

    // Start game timers
  // startGameTimers(); // Removed: not defined
  };

  // Coin spawning system
  const startCoinSpawning = () => {
    coinSpawnTimer.current = setInterval(() => {
      // Spawn falling items based on difficulty
      const currentLevel = progressionSystem.getCurrentLevel();
      const difficulty = currentLevel?.difficulty || 1;
      const spawnRate = Math.max(1000 - (difficulty * 100), 300);
      
      // Spawn a falling item
      spawnFallingItem();
    }, 1000);
  };

  // Obstacle spawning system
  const startObstacleSpawning = () => {
    obstacleTimer.current = setInterval(() => {
      // Spawn obstacles based on level
      const currentLevel = progressionSystem.getCurrentLevel();
      const difficulty = currentLevel?.difficulty || 1;
      const spawnRate = Math.max(2000 - (difficulty * 200), 800);
      
      // This would spawn visual obstacle objects
      // For now, just track obstacles
      setObstaclesAvoided(prev => prev + 1);
    }, 2000);
  };

  // Enhanced collision detection with haptic feedback
  const checkCollisions = () => {
    if (!collisionHandler.current || !isGameActive || isPaused) return;

    const cart = {
      x: potPosition,
      y: height - 100, // Cart position at bottom
      width: potSize,
      height: potSize * 0.67, // Cart height
    };

    // Check each falling item for collision
    fallingItems.forEach(item => {
      if (item.collected) return;

      const itemBox = {
        x: item.x - 15, // Center the item
        y: item.y,
        width: 30,
        height: 30,
      };

      // Check if item is in cart's vertical range
      if (CollisionDetection.isItemInCartRange(item, cart)) {
        // Check for collision
        if (CollisionDetection.checkItemCollision(item, cart)) {
          // Haptic feedback on item collection
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          
          // Check if it's a state bonus item
          if (StateBonusItemManager.isStateBonusItem(item.type)) {
            handleStateBonusItem(item.type);
          } else {
            // Handle regular item collision with subscription multiplier
            if (collisionHandler.current) {
              collisionHandler.current.handleItemCollision(item.type, item.id);
            }
          }
        }
      }
    });
  };

  const handleStateBonusItem = (itemType: string) => {
    const bonusItem = StateBonusItemManager.getItemByType(itemType);
    if (!bonusItem) return;

    // Apply item effect
    const effectResult = StateBonusItemManager.applyItemEffect(itemType, {
      score,
      coins,
      combo,
      fallSpeed: 1, // Base fall speed
      magnetRange: 50, // Base magnet range
    });

    // Update game state based on effect
    setScore(effectResult.newScore);
    setCoins(effectResult.newCoins);
    setCombo(effectResult.newCombo);

    // Show effect message
    if (effectResult.effectMessage) {
      // In a real app, show a toast or notification
      console.log(effectResult.effectMessage);
    }

    // Apply temporary effects
    if (effectResult.effectDuration > 0) {
      // Apply temporary effects like double score, slow fall, etc.
      setTimeout(() => {
        // Reset effects after duration
        console.log(`Effect from ${bonusItem.state} expired`);
      }, effectResult.effectDuration);
    }

    // Mark item as collected
    setFallingItems(prev => 
      prev.map(item => 
        item.type === itemType ? { ...item, collected: true } : item
      )
    );

    // Update state unlock progress
  // Removed: recordItemCollection does not exist on StateUnlockSystem
  // Handler for item collection (for FallingItems component)
  const onItemCollect = (itemId: string) => {
    setFallingItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, collected: true } : item
    ));
  };

  // Update collision detection on every frame
  useEffect(() => {
    if (!isGameActive) return;

    const collisionInterval = setInterval(checkCollisions, 16); // ~60fps

    return () => clearInterval(collisionInterval);
  }, [isGameActive, isPaused, fallingItems, potPosition, potSize]);

  // Update power-ups
  useEffect(() => {
    if (!isGameActive) return;

    const powerUpInterval = setInterval(() => {
      collisionHandler.current?.updatePowerUps(16);
      setActivePowerUps(new Map(collisionHandler.current?.getActivePowerUps() || []));
    }, 16);

    return () => clearInterval(powerUpInterval);
  }, [isGameActive]);

  // Enhanced item spawning with state bonus items
  const spawnFallingItem = () => {
    if (!isGameActive || isPaused) return;

    const x = Math.random() * (width - 60) + 30;
    const itemType = selectItemType();
    
    const newItem = {
      id: Date.now() + Math.random(),
      x,
      y: -50,
      type: itemType,
      collected: false,
      fallSpeed: getFallSpeed(level),
    };

    setFallingItems(prev => [...prev, newItem]);
  };

  const selectItemType = () => {
    // Check if we should spawn a state bonus item
    if (StateBonusItemManager.shouldSpawnStateItem(level)) {
      const bonusItem = StateBonusItemManager.getRandomItem();
      return bonusItem.type;
    }

    // Regular item selection logic
    const levelKey = Math.min(level, 20);
    const rarityChances = levelRarityChances[levelKey] || levelRarityChances[1];
    
    const rand = Math.random() * 100;
    let cumulative = 0;
    
    for (const [rarity, chance] of Object.entries(rarityChances)) {
  cumulative += Number(chance);
      if (rand <= cumulative) {
        const itemsOfRarity = itemTypes.filter(item => item.rarity === rarity);
        return itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)].type;
      }
    }
    
    // Fallback to common items
    return itemTypes.find(item => item.rarity === 'common')?.type || 'coin';
  };

  const getItemEmoji = (type: string) => {
    // Check if it's a state bonus item
    const bonusItem = StateBonusItemManager.getItemByType(type);
    if (bonusItem) {
      return bonusItem.emoji;
    }

    // Regular item emojis
    const icons: { [key: string]: string } = {
      coin: '🪙',
      gem: '💎',
      diamond: '💎',
      ruby: '🔴',
      emerald: '💚',
      sapphire: '💙',
      gold: '🥇',
      silver: '🥈',
      bronze: '🥉',
      star: '⭐',
      heart: '❤️',
      lightning: '⚡',
      shield: '🛡️',
      crown: '👑',
      trophy: '🏆',
    };
    return icons[type] || '✨';
  };

  const getItemPoints = (type: string) => {
    // Check if it's a state bonus item
    const bonusItem = StateBonusItemManager.getItemByType(type);
    if (bonusItem) {
      return bonusItem.points;
    }

    // Regular item points
    const points: { [key: string]: number } = {
      coin: 1,
      gem: 5,
      diamond: 10,
      ruby: 8,
      emerald: 7,
      sapphire: 6,
      gold: 15,
      silver: 10,
      bronze: 5,
      star: 20,
      heart: 3,
      lightning: 25,
      shield: 12,
      crown: 50,
      trophy: 100,
    };
    return points[type] || 1;
  };

  // Enhanced scoring with unlock checking and subscription multiplier
  const collectCoin = () => {
    if (!isGameActive || isPaused) return;

    const points = getItemPoints('coin');
  const multipliedPoints = Math.floor(points); // No multiplier
  const newScore = score + multipliedPoints;
  const newCoins = coins + 1;
    
    setScore(newScore);
    setCoins(newCoins);
    
    // Check for level up
    const newLevel = Math.floor(newScore / 100) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      checkForUnlocks('level', newLevel);
    }
    
    // Check for coin-based unlocks
    checkForUnlocks('coins', newCoins);
    
    // Check for score-based unlocks
    checkForUnlocks('score', newScore);
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Enhanced unlock checking with UserUnlockContext
  const checkForUnlocks = async (conditionType: string, value: number) => {
    try {
      // Create user data object for UnlockManager
      const userData = {
        level,
        score,
        coins,
        gamesPlayed: 1, // This would be tracked separately
        survivalTime: timeSurvived,
        itemsCollected: {}, // This would be populated from game state
        achievements: [], // This would be populated from achievement system
        lastPlayed: new Date(),
      };

      // Get all skin configs (in a real app, this would load from config file)
      const skinConfigs = [
        {
          id: 'texas',
          name: 'Lone Star Cart',
          type: 'shape',
          unlock: 'Reach Level 5',
          rarity: 'common',
          condition: { type: 'level', value: 5 }
        },
        {
          id: 'california',
          name: 'Golden Bear Flag',
          type: 'flag',
          unlock: 'Collect 1,000 coins',
          rarity: 'rare',
          condition: { type: 'coins', value: 1000 }
        },
        {
          id: 'florida',
          name: 'Sunshine Seal Wrap',
          type: 'flag',
          unlock: 'Score 300 in one round',
          rarity: 'uncommon',
          condition: { type: 'score', value: 300 }
        },
        // Add more skin configs as needed
      ];

      // Check each skin config
      for (const skinConfig of skinConfigs) {
        // Skip if already unlocked
        if (isSkinUnlocked(skinConfig.id)) continue;

        // Check if condition is met
  if (UnlockManager.checkUnlockConditions(userData, skinConfig as any)) {
          // Unlock the skin using context
          const success = await FirebaseUnlockSystem.unlockSkin(skinConfig.id, skinConfig);
          if (success) {
            showUnlockNotificationHandler(skinConfig.name, skinConfig.type);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for unlocks:', error);
    }
  };

  // Generate mystery crate after game win
  const generateMysteryCrate = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const crate = await UnlockManager.generateMysteryCrate(user.uid);
      if (crate) {
        // Process the crate
        const success = await UnlockManager.processMysteryCrate(user.uid, crate);
        if (success) {
          // Show crate notification
          showCrateNotification(crate);
        }
      }
    } catch (error) {
      console.error('Error generating mystery crate:', error);
    }
  };

  // Show crate notification
  const showCrateNotification = (crate: { type: string; value: string | number; rarity: string }) => {
    let message = '';
    switch (crate.type) {
      case 'skin':
        message = `Mystery Crate: Unlocked ${crate.value} skin!`;
        break;
      case 'coins':
        message = `Mystery Crate: +${crate.value} coins!`;
        break;
      case 'powerup':
        message = `Mystery Crate: ${crate.value} powerup!`;
        break;
    }

    Alert.alert(
      '🎁 Mystery Crate!',
      message,
      [{ text: 'Awesome!' }]
    );

    // Haptic feedback for crate
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Unlock skin if not already unlocked
  const unlockSkinIfNotAlready = async (skinId: string, skinName: string) => {
    try {
      const isUnlocked = await FirebaseUnlockSystem.isSkinUnlocked(skinId);
      if (!isUnlocked) {
        // Load skin data
        const skinData = await loadSkinData(skinId);
        if (skinData) {
          // Unlock the skin
          const success = await FirebaseUnlockSystem.unlockSkin(skinId, skinData);
          if (success) {
            // Show unlock notification
            showUnlockNotificationHandler(skinName, skinData.type);
            
            // Haptic feedback for unlock
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      }
    } catch (error) {
      console.error('Error unlocking skin:', error);
    }
  };

  // Show unlock notification
  const showUnlockNotificationHandler = (skinName: string, skinType: string) => {
    setCurrentUnlock({
      name: skinName,
      type: skinType,
      message: `New Cart Unlocked: ${skinName}!`
    });
  setShowUnlockNotification(true);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowUnlockNotification(false);
      setCurrentUnlock(null);
    }, 3000);
  };

  // Activate turbo boost
  const activateTurboBoost = () => {
    if (boostBar < 20) return; // Need minimum boost

    setTurboBoost(true);
    setBoostBar(prev => Math.max(0, prev - 20));

    // Turbo boost duration
    boostTimer.current = setTimeout(() => {
      setTurboBoost(false);
    }, 5000); // 5 seconds
  };

  // Check for game over conditions
  useEffect(() => {
    if (lives <= 0 && isGameActive) {
      endGame();
    }
  }, [lives, isGameActive]);

  // End game
  const endGame = async () => {
    if (!isGameActive) return;

    setIsGameActive(false);
    setShowGameOver(true);

    // Stop all timers
    if (gameTimer.current) clearInterval(gameTimer.current);
    if (boostTimer.current) clearInterval(boostTimer.current);
    if (coinSpawnTimer.current) clearInterval(coinSpawnTimer.current);
    if (obstacleTimer.current) clearInterval(obstacleTimer.current);

    // Check for unlocks
    await checkForUnlocks('score', score);
    await checkForUnlocks('coins', coins);
    await checkForUnlocks('level', level);

    // Check for mystery skin unlock
    if (MysterySkinSystem.shouldUnlockMysterySkin()) {
      const crate = await MysterySkinSystem.unlockMysterySkin();
      if (crate) {
        setMysteryCrate(crate);
        setShowMysteryCrate(true);
      }
    }

    // Generate mystery crate if score is high enough
    if (score > 500) {
      await generateMysteryCrate();
    }

    // Save game results
    try {
      const user = auth.currentUser;
      if (user) {
        // Update user progress
        await updateDoc(doc(db, 'users', user.uid), {
          'stats.totalScore': increment(score),
          'stats.totalCoins': increment(coins),
          'stats.gamesPlayed': increment(1),
          'stats.highestScore': score > 1000 ? score : 0,
          lastPlayed: new Date(),
        });
      }
    } catch (error) {
      console.error('Error saving game results:', error);
    }

    // Haptic feedback for game over
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  // Check pause trigger before showing pause menu
  const checkPauseTrigger = (): boolean => {
    const gameContext: GameContext = {
      gameState: isGameActive ? 'playing' : showGameOver ? 'failed' : 'paused',
      playerLives: 3, // This would come from game state
      playerCoins: coins,
      playerScore: score,
      potLevel: 1, // This would come from game state
      currentSkin: currentSkin,
      availablePowerUps: [], // This would come from power-up system
      timeInLevel: timeSurvived,
      blockagePercentage: 0, // This would come from blockage system
      goldRushActive: false, // This would come from game state
      consecutiveFails: 0, // This would come from game state
    };

    const pauseDecision = pauseTriggerSystem.shouldShowPauseMenu(gameContext);
    
    setPauseTrigger(pauseDecision.trigger);
    setPauseActions(pauseDecision.actions);
    setPauseMonetization(pauseDecision.monetization);

    // Log the pause trigger for analytics
    pauseTriggerSystem.logPauseTrigger(gameContext, pauseDecision.trigger);

    return pauseDecision.shouldShow;
  };

  // Pause game with smart trigger check
  const pauseGame = () => {
    if (checkPauseTrigger()) {
      setIsGameActive(false);
      setIsPaused(true);
      setShowPauseMenu(true);
      
      // Stop all game timers when paused
      if (gameTimer.current) clearInterval(gameTimer.current);
      if (boostTimer.current) clearInterval(boostTimer.current);
      if (coinSpawnTimer.current) clearInterval(coinSpawnTimer.current);
      if (obstacleTimer.current) clearInterval(obstacleTimer.current);
    } else {
      // Show message that pause is blocked
      Alert.alert(
        'Gold Rush Active!',
        'Pause is disabled during Gold Rush to maintain intensity!',
        [{ text: 'OK' }]
      );
    }
  };

  // Resume game
  const resumeGame = () => {
    setIsGameActive(true);
    setIsPaused(false);
    setShowPauseMenu(false);
    
    // Restart game timers
    startGameTimers();
  };

  // Start game timers
  const startGameTimers = () => {
    // Start game timer
    gameTimer.current = setInterval(() => {
      setTimeSurvived(prev => prev + 1);
    }, 1000);

    // Start coin spawning
    startCoinSpawning();

    // Start obstacle spawning
    startObstacleSpawning();
  };

  // Navigation to other screens
  const navigateToShop = () => {
    navigation.navigate('Shop');
  };

  const navigateToCamp = () => {
    navigation.navigate('Camp');
  };

  const navigateToMissions = () => {
    navigation.navigate('Missions');
  };

  const navigateToSeasonPass = () => {
    navigation.navigate('SeasonPass');
  };

  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  // Helper function for power-up icons
  const getPowerUpIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      speedBoost: '⚡',
      magnetPull: '🧲',
      explosion: '💥',
      frenzyMode: '🌟',
    };
    return icons[type] || '✨';
  };

  // State-themed bonus items
  const stateBonusItems = [
    { type: 'georgia_peach', emoji: '🍑', points: 15, effect: 'bonus_points' },
    { type: 'vermont_maple', emoji: '🍁', points: 10, effect: 'double_score' },
    { type: 'colorado_crystal', emoji: '🏔️', points: 12, effect: 'slow_fall' },
    { type: 'maine_lobster', emoji: '🦞', points: 20, effect: 'bonus_points' },
    { type: 'texas_star', emoji: '⭐', points: 18, effect: 'bonus_points' },
    { type: 'hawaii_hibiscus', emoji: '🌸', points: 14, effect: 'bonus_points' },
    { type: 'alaska_aurora', emoji: '✨', points: 16, effect: 'bonus_points' },
    { type: 'arizona_cactus', emoji: '🌵', points: 13, effect: 'bonus_points' },
    { type: 'washington_apple', emoji: '🍎', points: 11, effect: 'bonus_points' },
    { type: 'louisiana_bayou', emoji: '🌿', points: 17, effect: 'bonus_points' },
  ];

  // Enhanced active skin state with loading from Firebase

  // Load active skin from Firebase
  useEffect(() => {
    const loadActiveSkin = async () => {
      try {
        // First try to load from local storage for immediate display
        const localSkinData = await AsyncStorage.getItem('activeSkin');
        if (localSkinData) {
          setActiveSkin(JSON.parse(localSkinData));
        }

        // Then load from Firebase for persistence
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const firebaseSkin = userData?.profile?.skin;
            
            if (firebaseSkin) {
              // Load the full skin data from state_skins.json
              const skinData = await loadSkinData(firebaseSkin.id);
              if (skinData) {
                const fullSkin = {
                  ...firebaseSkin,
                  ...skinData,
                };
                setActiveSkin(fullSkin);
                await AsyncStorage.setItem('activeSkin', JSON.stringify(fullSkin));
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading active skin:', error);
      }
    };
    loadActiveSkin();
  }, []);

  // Load skin data from config/state_skins.json
  const loadSkinData = async (skinId: string) => {
    try {
      // In a real app, this would load from the JSON file
      // For now, we'll use a hardcoded mapping that matches the config file
      const skinDataMap: { [key: string]: any } = {
        california: {
          name: "Golden Bear Flag",
          type: "flag",
          unlock: "Collect 1,000 coins",
          rarity: "rare",
          theme: {
            primaryColor: "#FFD700",
            secondaryColor: "#8B4513",
            accentColor: "#FFA500"
          }
        },
        texas: {
          name: "Lone Star Cart",
          type: "shape",
          unlock: "Reach Level 5",
          rarity: "common",
          theme: {
            primaryColor: "#1E3A8A",
            secondaryColor: "#F59E0B",
            accentColor: "#EF4444"
          }
        },
        florida: {
          name: "Sunshine Seal Wrap",
          type: "flag",
          unlock: "Score 300 in one round",
          rarity: "uncommon",
          theme: {
            primaryColor: "#1E3A8A",
            secondaryColor: "#F59E0B",
            accentColor: "#EF4444"
          }
        },
        new_york: {
          name: "Empire Emblem",
          type: "shape",
          unlock: "Play 5 games",
          rarity: "common",
          theme: {
            primaryColor: "#1E3A8A",
            secondaryColor: "#F59E0B",
            accentColor: "#EF4444"
          }
        },
        georgia: {
          name: "Peach Glow Trail",
          type: "trail",
          unlock: "Invite 1 friend",
          rarity: "rare",
          theme: {
            primaryColor: "#F59E0B",
            secondaryColor: "#EF4444",
            accentColor: "#059669"
          }
        },
        vermont: {
          name: "Maple Leaf Trail",
          type: "trail",
          unlock: "Catch the falling maple leaf item",
          rarity: "epic",
          theme: {
            primaryColor: "#F59E0B",
            secondaryColor: "#EF4444",
            accentColor: "#059669"
          }
        },
        hawaii: {
          name: "Hibiscus Drift Trail",
          type: "trail",
          unlock: "Survive 60 seconds without missing",
          rarity: "legendary",
          theme: {
            primaryColor: "#059669",
            secondaryColor: "#F59E0B",
            accentColor: "#EF4444"
          }
        },
        colorado: {
          name: "Rocky Cart Crystal",
          type: "shape",
          unlock: "Catch the mountain crystal",
          rarity: "epic",
          theme: {
            primaryColor: "#1E3A8A",
            secondaryColor: "#059669",
            accentColor: "#F59E0B"
          }
        },
        alaska: {
          name: "Northern Lights Flag",
          type: "flag",
          unlock: "Reach Level 15",
          rarity: "legendary",
          theme: {
            primaryColor: "#1E3A8A",
            secondaryColor: "#059669",
            accentColor: "#8B5CF6"
          }
        },
        illinois: {
          name: "Lincoln Trail Cart",
          type: "shape",
          unlock: "Play during U.S. Presidents Week",
          rarity: "seasonal",
          theme: {
            primaryColor: "#1E3A8A",
            secondaryColor: "#EF4444",
            accentColor: "#F59E0B"
          }
        },
        // Add more states as needed...
      };
      
      return skinDataMap[skinId];
    } catch (error) {
      console.error('Error loading skin data:', error);
      return null;
    }
  };

  return (
    <TouchHandler
      onMove={handleTouchMove}
      onTap={handleTap}
      enabled={isGameActive && !isPaused}
    >
      <View style={styles.container}>
        {/* Game Area */}
        <View style={styles.gameArea}>
        {/* Pause Button */}
        <TouchableOpacity 
          style={styles.pauseButton} 
          onPress={pauseGame}
        >
          <Text style={styles.pauseButtonText}>⏸️</Text>
        </TouchableOpacity>

        {/* Score Display */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: {score}</Text>
          <Text style={styles.coinText}>Coins: {coins}</Text>
          <Text style={styles.timeText}>Time: {timeSurvived}s</Text>
          <Text style={styles.livesText}>Lives: {'❤️'.repeat(lives)}</Text>
          {isSubscriber && (
            <View style={styles.vipIndicator}>
              <Text style={styles.vipText}>⭐ VIP</Text>
            </View>
          )}
        </View>

        {/* Power-up Indicators */}
        {activePowerUps.size > 0 && (
          <View style={styles.powerUpContainer}>
            {Array.from(activePowerUps.entries()).map(([type, endTime]) => {
              const timeLeft = Math.max(0, endTime - Date.now());
              const progress = (timeLeft / 5000) * 100; // 5 second duration
              
              return (
                <View key={type} style={styles.powerUpIndicator}>
                  <Text style={styles.powerUpText}>{getPowerUpIcon(type)}</Text>
                  <View style={styles.powerUpBar}>
                    <View style={[styles.powerUpProgress, { width: `${progress}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Combo Display */}
        {comboDisplay && (
          <Animated.View style={[styles.comboContainer, { opacity: comboAnimation }]}>
            <Text style={styles.comboText}>{comboDisplay}</Text>
            {comboMultiplier > 1 && (
              <Text style={styles.comboMultiplierText}>x{comboMultiplier.toFixed(1)}</Text>
            )}
          </Animated.View>
        )}

        {/* Boost Bar */}
        <View style={styles.boostContainer}>
          <View style={[styles.boostBar, { width: `${boostBar}%` }]} />
          <Text style={styles.boostText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>Boost: {boostBar}%</Text>
        </View>

        {/* Rail Track */}
        <RailTrack showDust={isCartMoving} isMoving={isCartMoving} />

        {/* Falling Items */}
        <FallingItems 
          items={fallingItems}
          onItemCollect={onItemCollect}
        />


        {/* Mine Cart */}
        <View>
          <MineCart
            position={potPosition}
            size={potSize}
            isTurboActive={turboBoost}
            onWheelSpin={(direction) => {
              // Optional: Add sound effects for wheel spinning
              console.log(`Cart wheels spinning ${direction}`);
            }}
            activeSkin={activeSkin}
          />
        </View>

        {/* State Unlock Notification */}
  {showUnlockNotification && currentUnlock && (
          <StateUnlockNotification
            unlock={currentUnlock}
            visible={showUnlockNotification}
            onHide={() => {
              setShowUnlockNotification(false);
              setCurrentUnlock(null);
            }}
          />
        )}
        {/* Mystery Crate Modal */}
        <MysteryCrate
          visible={showMysteryCrate}
          crate={mysteryCrate}
          onClose={() => setShowMysteryCrate(false)}
          onClaim={() => {
            setShowMysteryCrate(false);
            setMysteryCrate(null);
          }}
        />
      </View>

      {/* Game Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={collectCoin}>
          <Text style={styles.controlButtonText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>Collect Coin</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, turboBoost && styles.turboActive]} 
          onPress={activateTurboBoost}
        >
          <Text style={styles.controlButtonText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>
            {turboBoost ? 'TURBO ACTIVE!' : 'Turbo Boost'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={pauseGame}>
          <Text style={styles.controlButtonText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>Pause</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Buttons */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuButton} onPress={navigateToShop}>
          <Text style={styles.menuButtonText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>Shop</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={navigateToCamp}>
          <Text style={styles.menuButtonText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>Camp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={navigateToMissions}>
          <Text style={styles.menuButtonText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>Missions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={navigateToSeasonPass}>
          <Text style={styles.menuButtonText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>Season Pass</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={navigateToSettings}>
          <Text style={styles.menuButtonText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Start Game Button */}
      {!isGameActive && !showPauseMenu && (
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>Start Game</Text>
        </TouchableOpacity>
      )}

      {/* Smart Pause Modal */}
      <PauseModal
        visible={showPauseMenu}
        onClose={() => setShowPauseMenu(false)}
        onResume={resumeGame}
        onRetry={() => {
          setShowPauseMenu(false);
          startGame();
        }}
        onExit={() => {
          setShowPauseMenu(false);
          endGame();
        }}
        currentScore={score}
        currentCoins={coins}
        potLevel={1}
        currentSkin={currentSkin}
        availablePowerUps={[]}
        // Pass smart trigger data
        pauseTrigger={pauseTrigger}
        pauseActions={pauseActions}
        pauseMonetization={pauseMonetization}
      />

      {/* Game Over Screen */}
      {showGameOver && (
        <View style={styles.gameOverMenu}>
          <Text style={styles.gameOverTitle} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>Game Over!</Text>
          <Text style={styles.gameOverText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>Score: {score}</Text>
          <Text style={styles.gameOverText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>Coins: {coins}</Text>
          <Text style={styles.gameOverText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>Time: {timeSurvived}s</Text>
          <Text style={styles.gameOverText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>Combo: {combo}</Text>
          <TouchableOpacity style={styles.gameOverButton} onPress={() => setShowGameOver(false)}>
            <Text style={styles.gameOverButtonText} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* State Unlock Notification */}
  {showUnlockNotification && currentUnlock && (
        <StateUnlockNotification
          unlock={currentUnlock}
          visible={showUnlockNotification}
          onHide={() => setShowUnlockNotification(false)}
        />
      )}
      </View>
    </TouchHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  scoreContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  scoreText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  coinText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  livesText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comboContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  comboText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comboMultiplierText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  boostContainer: {
    position: 'absolute',
    top: 150,
    left: 20,
    right: 20,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 10,
  },
  boostBar: {
    height: '100%',
    backgroundColor: '#00FF00',
    borderRadius: 10,
  },
  boostText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  // Mine cart specific styles
  mineCartContainer: {
    position: 'absolute',
    bottom: 20,
    zIndex: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  controlButton: {
    backgroundColor: '#4a4a4a',
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  turboActive: {
    backgroundColor: '#FFD700',
  },
  menuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#333',
  },
  menuButton: {
    backgroundColor: '#555',
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  menuButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  startButton: {
    position: 'absolute',
    top: height / 2 - 50,
    left: width / 2 - 100,
    backgroundColor: '#FFD700',
    padding: 20,
    borderRadius: 15,
    width: 200,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pauseMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pauseMenuTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  pauseMenuButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    minWidth: 150,
    alignItems: 'center',
  },
  pauseMenuButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameOverMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  gameOverTitle: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  gameOverText: {
    color: 'white',
    fontSize: 18,
    marginVertical: 5,
  },
  gameOverButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    minWidth: 150,
    alignItems: 'center',
  },
  gameOverButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pauseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pauseButtonText: {
    fontSize: 24,
  },
  powerUpContainer: {
    position: 'absolute',
    top: 200,
    left: 20,
    zIndex: 10,
  },
  powerUpIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  powerUpText: {
    fontSize: 20,
    marginRight: 8,
  },
  powerUpBar: {
    width: 60,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  powerUpProgress: {
    height: '100%',
    backgroundColor: '#00FF00',
    borderRadius: 4,
  },
  vipIndicator: {
    marginTop: 5,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vipText: {
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: 'bold',
  },

});


} // Closing brace for GameScreen function
