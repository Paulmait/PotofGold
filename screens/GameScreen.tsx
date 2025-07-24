import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
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

const { width, height } = Dimensions.get('window');

interface GameScreenProps {
  navigation: any;
}

export default function GameScreen({ navigation }: GameScreenProps) {
  // Game state
  const [gameState, setGameState] = useState<any>(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [timeSurvived, setTimeSurvived] = useState(0);
  const [combo, setCombo] = useState(0);
  const [obstaclesAvoided, setObstaclesAvoided] = useState(0);
  const [powerUpsUsed, setPowerUpsUsed] = useState(0);

  // Pot mechanics
  const [potSpeed, setPotSpeed] = useState(0.5); // Slow by default
  const [turboBoost, setTurboBoost] = useState(false);
  const [boostBar, setBoostBar] = useState(0);
  const [potPosition, setPotPosition] = useState(width / 2);
  const [potSize, setPotSize] = useState(60);

  // UI state
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
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
  const [isPaused, setIsPaused] = useState(false);
  const [pauseTrigger, setPauseTrigger] = useState<any>(null);
  const [pauseActions, setPauseActions] = useState<any>(null);
  const [pauseMonetization, setPauseMonetization] = useState<any>(null);

  // Falling items state
  const [fallingItems, setFallingItems] = useState<any[]>([]);
  const [isCartMoving, setIsCartMoving] = useState(false);

  // Combo system
  const comboSystem = useRef(new ComboSystem()).current;
  const [comboDisplay, setComboDisplay] = useState('');
  const [comboMultiplier, setComboMultiplier] = useState(1);

  // Collision handler
  const collisionHandler = useRef<CollisionHandler | null>(null);
  const [lives, setLives] = useState(3);
  const [activePowerUps, setActivePowerUps] = useState<Map<string, number>>(new Map());

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

  const initializeGame = async () => {
    try {
      const userId = 'player_1'; // In real app, get from auth
      const state = await masterGameManager.initializeGame(userId);
      setGameState(state);

      // Load pot settings from meta game
      const metaProgress = metaGameSystem.getProgress();
      if (metaProgress) {
        const currentPot = metaProgress.pots.currentPot;
        setPotSpeed(currentPot.effects.speed || 0.5);
        setPotSize(currentPot.effects.size * 60 || 60);
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

    // Start game timers
    startGameTimers();
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

  // Handle mine cart movement (only when not paused)
  const onPanGestureEvent = (event: any) => {
    if (!isGameActive || isPaused) return;

    const { translationX } = event.nativeEvent;
    const newPosition = potPosition + translationX * potSpeed;
    
    // Clamp cart position to stay within screen bounds
    const cartWidth = potSize;
    const minPosition = cartWidth / 2;
    const maxPosition = width - cartWidth / 2;
    const clampedPosition = Math.max(minPosition, Math.min(maxPosition, newPosition));
    
    setPotPosition(clampedPosition);
    setIsCartMoving(Math.abs(translationX) > 5);

    // Animate cart movement
    Animated.spring(potAnimation, {
      toValue: clampedPosition,
      useNativeDriver: false,
    }).start();
  };

  // Handle falling items collection with proper hitbox detection
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
          // Handle collision based on item type
          collisionHandler.current?.handleItemCollision(item.type, item.id);
        }
      }
    });
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

  // Spawn falling items
  const spawnFallingItem = () => {
    // Get current level for spawn modifiers
    const currentLevel = progressionSystem.getCurrentLevel();
    const level = currentLevel?.level || 1;
    
    // Get level spawn modifiers
    const levelModifiers = LEVEL_SPAWN_MODIFIERS[level] || LEVEL_SPAWN_MODIFIERS[1];
    
    // Create weighted item list based on level
    const weightedItems: Array<{ type: string; weight: number; config: any }> = [];
    
    Object.entries(ITEM_CONFIGS).forEach(([type, config]) => {
      const rarity = config.rarity;
      const levelModifier = levelModifiers[rarity] || 1;
      const adjustedWeight = config.spawnWeight * levelModifier;
      
      if (adjustedWeight > 0) {
        weightedItems.push({
          type,
          weight: adjustedWeight,
          config,
        });
      }
    });
    
    // Weighted random selection
    const totalWeight = weightedItems.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedItem = weightedItems[0];
    for (const item of weightedItems) {
      random -= item.weight;
      if (random <= 0) {
        selectedItem = item;
        break;
      }
    }
    
    const randomX = Math.random() * (width - 60) + 30;
    
    const newItem = {
      id: `item_${Date.now()}_${Math.random()}`,
      type: selectedItem.type,
      x: randomX,
      y: -50,
      speed: selectedItem.config.fallSpeed,
      collected: false,
      rarity: selectedItem.config.rarity,
    };

    setFallingItems(prev => [...prev, newItem]);

    // Remove item after it falls off screen (adjusted for fall speed)
    const fallDuration = (height + 50) / (selectedItem.config.fallSpeed * 100) * 1000;
    setTimeout(() => {
      setFallingItems(prev => prev.filter(item => item.id !== newItem.id));
    }, fallDuration);
  };

  // Collect coin
  const collectCoin = () => {
    const coinValue = turboBoost ? 2 : 1;
    setCoins(prev => prev + coinValue);
    setScore(prev => prev + (10 * coinValue));
    
    // Update combo
    setCombo(prev => prev + 1);
    
    // Animate coin collection
    Animated.sequence([
      Animated.timing(coinAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(coinAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
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
    setIsGameActive(false);
    setShowGameOver(true);
    
    // Clear all timers
    if (gameTimer.current) clearInterval(gameTimer.current);
    if (boostTimer.current) clearInterval(boostTimer.current);
    if (coinSpawnTimer.current) clearInterval(coinSpawnTimer.current);
    if (obstacleTimer.current) clearInterval(obstacleTimer.current);

    // Save game results
    try {
      const userId = 'player_1'; // In real app, get from auth
      await masterGameManager.saveGameResults(userId, {
        score,
        coins,
        timeSurvived,
        combo,
        obstaclesAvoided,
        powerUpsUsed,
        lives,
      });

      // Update progression
      await progressionSystem.updateProgress(score, coins);
      
      // Check for achievements
      await skillMechanicsSystem.checkAchievements(score, combo);
      
      // Update daily streak
      await dailyStreakSystem.updateStreak();
      
      // Check for mission completion
      await missionSystem.checkMissionCompletion(score, coins, combo);
      
    } catch (error) {
      console.log('Error saving game results:', error);
    }
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

  return (
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
          <Text style={styles.boostText}>Boost: {boostBar}%</Text>
        </View>

        {/* Rail Track */}
        <RailTrack showDust={isCartMoving} isMoving={isCartMoving} />

        {/* Falling Items */}
        <FallingItems 
          items={fallingItems}
          onItemCollect={onItemCollect}
        />

        {/* Mine Cart */}
        <PanGestureHandler onGestureEvent={onPanGestureEvent}>
          <MineCart
            position={potPosition}
            size={potSize}
            isTurboActive={turboBoost}
            onWheelSpin={(direction) => {
              // Optional: Add sound effects for wheel spinning
              console.log(`Cart wheels spinning ${direction}`);
            }}
          />
        </PanGestureHandler>
      </View>

      {/* Game Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={collectCoin}>
          <Text style={styles.controlButtonText}>Collect Coin</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, turboBoost && styles.turboActive]} 
          onPress={activateTurboBoost}
        >
          <Text style={styles.controlButtonText}>
            {turboBoost ? 'TURBO ACTIVE!' : 'Turbo Boost'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={pauseGame}>
          <Text style={styles.controlButtonText}>Pause</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Buttons */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuButton} onPress={navigateToShop}>
          <Text style={styles.menuButtonText}>Shop</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={navigateToCamp}>
          <Text style={styles.menuButtonText}>Camp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={navigateToMissions}>
          <Text style={styles.menuButtonText}>Missions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={navigateToSeasonPass}>
          <Text style={styles.menuButtonText}>Season Pass</Text>
        </TouchableOpacity>
      </View>

      {/* Start Game Button */}
      {!isGameActive && !showPauseMenu && (
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
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
          <Text style={styles.gameOverTitle}>Game Over!</Text>
          <Text style={styles.gameOverText}>Score: {score}</Text>
          <Text style={styles.gameOverText}>Coins: {coins}</Text>
          <Text style={styles.gameOverText}>Time: {timeSurvived}s</Text>
          <Text style={styles.gameOverText}>Combo: {combo}</Text>
          <TouchableOpacity style={styles.gameOverButton} onPress={() => setShowGameOver(false)}>
            <Text style={styles.gameOverButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
}); 