import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameLoop } from '../utils/gameLoop';
import { useResponsive, scale, scaleFont, scaleSpacing } from '../utils/responsiveScaling';
import VirtualFallingItems from '../components/VirtualFallingItems';
import EnhancedTouchHandler from '../components/EnhancedTouchHandler';
import MineCart from '../components/MineCart';
import RailTrack from '../components/RailTrack';
import PauseModal from './PauseModal';
import { CollisionDetection } from '../utils/collisionDetection';
import { ITEM_CONFIGS } from '../utils/itemConfig';

const { width, height } = Dimensions.get('window');

// Constants for performance
const MAX_FALLING_ITEMS = 30;
const CULL_DISTANCE = height + 100;
const ITEM_SPAWN_INTERVAL = 1000;
const CLEANUP_INTERVAL = 2000;

interface GameScreenOptimizedProps {
  navigation: any;
  orientation?: 'portrait' | 'landscape';
  layout?: any;
  isTablet?: boolean;
  savedGameState?: any;
  clearSavedState?: () => void;
}

// Memoized UI components
const ScoreDisplay = memo(({ score, coins, lives, time }: any) => {
  const { scaleFont: sf, scaleSpacing: ss } = useResponsive();

  return (
    <View style={[styles.scoreContainer, { padding: ss(10) }]}>
      <Text style={[styles.scoreText, { fontSize: sf(18) }]}>Score: {score}</Text>
      <Text style={[styles.coinText, { fontSize: sf(16) }]}>Coins: {coins}</Text>
      <Text style={[styles.timeText, { fontSize: sf(16) }]}>Time: {time}s</Text>
      <Text style={[styles.livesText, { fontSize: sf(16) }]}>Lives: {'❤️'.repeat(lives)}</Text>
    </View>
  );
});

const BoostBar = memo(({ boostBar }: { boostBar: number }) => {
  const { scaleSpacing: ss } = useResponsive();

  return (
    <View
      style={[
        styles.boostContainer,
        {
          top: ss(150),
          left: ss(20),
          right: ss(20),
          height: ss(20),
        },
      ]}
    >
      <View style={[styles.boostBar, { width: `${boostBar}%` }]} />
      <Text style={styles.boostText}>Boost: {boostBar}%</Text>
    </View>
  );
});

const GameScreenOptimized: React.FC<GameScreenOptimizedProps> = memo(
  ({
    navigation,
    orientation = 'portrait',
    layout,
    isTablet = false,
    savedGameState,
    clearSavedState,
  }) => {
    // Game loop
    const gameLoop = useGameLoop();
    const { dimensions, scale: s, scaleFont: sf, scaleSpacing: ss, select } = useResponsive();

    // Game state
    const [isGameActive, setIsGameActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [score, setScore] = useState(0);
    const [coins, setCoins] = useState(0);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [timeSurvived, setTimeSurvived] = useState(0);
    const [combo, setCombo] = useState(0);
    const [boostBar, setBoostBar] = useState(100);
    const [turboBoost, setTurboBoost] = useState(false);
    const [showPauseMenu, setShowPauseMenu] = useState(false);
    const [showGameOver, setShowGameOver] = useState(false);

    // Cart state
    const cartSize = useMemo(() => dimensions.cartSize, [dimensions]);
    const [potPosition, setPotPosition] = useState(width / 2);
    const [cartVelocity, setCartVelocity] = useState(0);
    const potAnimation = useRef(new Animated.Value(width / 2)).current;

    // Falling items state with memory management
    const [fallingItems, setFallingItems] = useState<any[]>([]);
    const itemIdCounter = useRef(0);

    // Performance tracking
    const [fps, setFps] = useState(60);
    const frameSkipCounter = useRef(0);
    const lastCleanupTime = useRef(Date.now());

    // Timers
    const gameTimer = useRef<NodeJS.Timeout | null>(null);
    const spawnTimer = useRef<NodeJS.Timeout | null>(null);
    const cleanupTimer = useRef<NodeJS.Timeout | null>(null);

    // Initialize game with saved state
    useEffect(() => {
      if (savedGameState && !isGameActive) {
        setScore(savedGameState.score || 0);
        setCoins(savedGameState.coins || 0);
        setLevel(savedGameState.level || 1);
        setPotPosition(savedGameState.cartPosition || width / 2);
        setFallingItems(savedGameState.fallingItems || []);
        setCombo(savedGameState.combo || 0);
        setTimeSurvived(savedGameState.timeSurvived || 0);

        if (clearSavedState) {
          clearSavedState();
        }

        if (!savedGameState.isPaused) {
          startGame();
        }
      }
    }, [savedGameState, clearSavedState]);

    // Game loop update function
    const updateGame = useCallback(
      (deltaTime: number) => {
        if (!isGameActive || isPaused) return;

        // Update falling items
        setFallingItems((prev) => {
          const updated = prev.map((item) => ({
            ...item,
            y: item.y + item.speed * deltaTime * 60, // 60fps baseline
          }));

          // Check collisions
          updated.forEach((item) => {
            if (
              !item.collected &&
              CollisionDetection.checkItemCollision(item, {
                x: potPosition,
                y: height - 100,
                width: cartSize,
                height: cartSize * 0.67,
              })
            ) {
              collectItem(item);
            }
          });

          // Remove items that are off-screen or collected
          return updated
            .filter((item) => !item.collected && item.y < CULL_DISTANCE)
            .slice(-MAX_FALLING_ITEMS);
        });

        // Update cart position with velocity
        if (Math.abs(cartVelocity) > 0.1) {
          const newPosition = potPosition + cartVelocity * deltaTime;
          setPotPosition(Math.max(cartSize / 2, Math.min(width - cartSize / 2, newPosition)));
          setCartVelocity((v) => v * 0.95); // Apply friction
        }
      },
      [isGameActive, isPaused, potPosition, cartSize, cartVelocity]
    );

    // Render function for interpolation
    const renderGame = useCallback(
      (interpolation: number) => {
        // Update animations with interpolation
        Animated.timing(potAnimation, {
          toValue: potPosition,
          duration: 16, // One frame
          useNativeDriver: false,
        }).start();
      },
      [potPosition, potAnimation]
    );

    // Start game
    const startGame = useCallback(() => {
      setIsGameActive(true);
      setIsPaused(false);
      setScore(0);
      setCoins(0);
      setLives(3);
      setTimeSurvived(0);
      setCombo(0);
      setBoostBar(100);
      setLevel(1);
      setFallingItems([]);

      // Start game loop with 60fps target
      gameLoop.start(updateGame, renderGame);

      // Start spawning items
      startItemSpawning();

      // Start cleanup timer
      startCleanupTimer();

      // Start game timer
      gameTimer.current = setInterval(() => {
        setTimeSurvived((prev) => prev + 1);
      }, 1000);
    }, [gameLoop, updateGame, renderGame]);

    // Spawn falling items
    const spawnFallingItem = useCallback(() => {
      if (!isGameActive || isPaused) return;

      const itemType = selectItemType();
      const newItem = {
        id: `item_${itemIdCounter.current++}`,
        x: Math.random() * (width - 60) + 30,
        y: -50,
        type: itemType,
        speed: 2 + level * 0.1,
        collected: false,
        rarity: getItemRarity(itemType),
      };

      setFallingItems((prev) => [...prev, newItem].slice(-MAX_FALLING_ITEMS));
    }, [isGameActive, isPaused, level]);

    // Start item spawning
    const startItemSpawning = useCallback(() => {
      spawnTimer.current = setInterval(spawnFallingItem, ITEM_SPAWN_INTERVAL);
    }, [spawnFallingItem]);

    // Memory cleanup timer
    const startCleanupTimer = useCallback(() => {
      cleanupTimer.current = setInterval(() => {
        const now = Date.now();

        // Cleanup off-screen items
        setFallingItems((prev) =>
          prev.filter((item) => item.y < CULL_DISTANCE && !item.collected).slice(-MAX_FALLING_ITEMS)
        );

        // Update FPS
        const metrics = gameLoop.getMetrics();
        setFps(metrics.fps);

        // Adjust quality based on performance
        if (metrics.fps < 30) {
          console.log('Low FPS detected, reducing quality');
          // Reduce particle effects, animations, etc.
        }

        lastCleanupTime.current = now;
      }, CLEANUP_INTERVAL);
    }, [gameLoop]);

    // Collect item
    const collectItem = useCallback(
      (item: any) => {
        setFallingItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, collected: true } : i))
        );

        // Update score and coins
        const points = getItemPoints(item.type);
        setScore((prev) => prev + points);
        if (item.type === 'coin') {
          setCoins((prev) => prev + 1);
        }

        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Check for level up
        const newLevel = Math.floor(score / 100) + 1;
        if (newLevel > level) {
          setLevel(newLevel);
        }
      },
      [score, level]
    );

    // Enhanced touch handling with velocity
    const handleCartMove = useCallback(
      (x: number, velocity: number) => {
        if (!isGameActive || isPaused) return;

        const minPosition = cartSize / 2;
        const maxPosition = width - cartSize / 2;
        const targetPosition = Math.max(minPosition, Math.min(maxPosition, x));

        setPotPosition(targetPosition);
        setCartVelocity(velocity * 0.1); // Scale down velocity
      },
      [isGameActive, isPaused, cartSize]
    );

    const handleTap = useCallback(
      (x: number) => {
        if (!isGameActive) {
          startGame();
        } else if (!isPaused) {
          handleCartMove(x, 0);
        }
      },
      [isGameActive, isPaused, startGame, handleCartMove]
    );

    const handleSwipeUp = useCallback(() => {
      if (isGameActive && !isPaused && boostBar >= 20) {
        activateTurboBoost();
      }
    }, [isGameActive, isPaused, boostBar]);

    // Activate turbo boost
    const activateTurboBoost = useCallback(() => {
      setTurboBoost(true);
      setBoostBar((prev) => Math.max(0, prev - 20));
      setTimeout(() => setTurboBoost(false), 5000);
    }, []);

    // Pause game
    const pauseGame = useCallback(() => {
      setIsPaused(true);
      setShowPauseMenu(true);
      gameLoop.pause();
    }, [gameLoop]);

    // Resume game
    const resumeGame = useCallback(() => {
      setIsPaused(false);
      setShowPauseMenu(false);
      gameLoop.resume();
    }, [gameLoop]);

    // End game
    const endGame = useCallback(() => {
      setIsGameActive(false);
      setShowGameOver(true);

      // Stop all timers
      gameLoop.stop();
      if (gameTimer.current) clearInterval(gameTimer.current);
      if (spawnTimer.current) clearInterval(spawnTimer.current);
      if (cleanupTimer.current) clearInterval(cleanupTimer.current);

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, [gameLoop]);

    // Check game over
    useEffect(() => {
      if (lives <= 0 && isGameActive) {
        endGame();
      }
    }, [lives, isGameActive, endGame]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        gameLoop.stop();
        if (gameTimer.current) clearInterval(gameTimer.current);
        if (spawnTimer.current) clearInterval(spawnTimer.current);
        if (cleanupTimer.current) clearInterval(cleanupTimer.current);
      };
    }, [gameLoop]);

    // Helper functions
    const selectItemType = () => {
      const types = ['coin', 'gem', 'star', 'heart', 'lightning'];
      return types[Math.floor(Math.random() * types.length)];
    };

    const getItemRarity = (type: string) => {
      const rarities: { [key: string]: string } = {
        coin: 'common',
        gem: 'uncommon',
        star: 'rare',
        heart: 'common',
        lightning: 'epic',
      };
      return rarities[type] || 'common';
    };

    const getItemPoints = (type: string) => {
      const points: { [key: string]: number } = {
        coin: 1,
        gem: 5,
        star: 10,
        heart: 3,
        lightning: 25,
      };
      return points[type] || 1;
    };

    return (
      <EnhancedTouchHandler
        onMove={handleCartMove}
        onTap={handleTap}
        onSwipeUp={handleSwipeUp}
        enabled={isGameActive && !isPaused}
        smoothingFactor={0.3}
        velocityThreshold={50}
      >
        <View style={styles.container}>
          {/* Game Area */}
          <View style={styles.gameArea}>
            {/* HUD */}
            <ScoreDisplay score={score} coins={coins} lives={lives} time={timeSurvived} />

            {/* Boost Bar */}
            <BoostBar boostBar={boostBar} />

            {/* FPS Counter (dev only) */}
            {__DEV__ && (
              <View style={styles.fpsCounter}>
                <Text style={styles.fpsText}>FPS: {fps}</Text>
              </View>
            )}

            {/* Rail Track */}
            <RailTrack showDust={Math.abs(cartVelocity) > 10} isMoving={false} />

            {/* Virtual Falling Items with culling */}
            <VirtualFallingItems
              items={fallingItems}
              onItemCollect={collectItem}
              viewportHeight={height}
              renderBuffer={100}
            />

            {/* Mine Cart */}
            <MineCart
              position={potPosition}
              size={cartSize}
              isTurboActive={turboBoost}
              activeSkin={null}
            />
          </View>

          {/* Controls */}
          {!isGameActive && (
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={[styles.startButtonText, { fontSize: sf(18) }]}>Start Game</Text>
            </TouchableOpacity>
          )}

          {isGameActive && (
            <TouchableOpacity style={styles.pauseButton} onPress={pauseGame}>
              <Text style={styles.pauseButtonText}>⏸️</Text>
            </TouchableOpacity>
          )}

          {/* Pause Modal */}
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
            potLevel={level}
            currentSkin=""
            availablePowerUps={[]}
          />

          {/* Game Over */}
          {showGameOver && (
            <View style={styles.gameOverMenu}>
              <Text style={[styles.gameOverTitle, { fontSize: sf(28) }]}>Game Over!</Text>
              <Text style={[styles.gameOverText, { fontSize: sf(18) }]}>Score: {score}</Text>
              <Text style={[styles.gameOverText, { fontSize: sf(18) }]}>Coins: {coins}</Text>
              <TouchableOpacity
                style={styles.gameOverButton}
                onPress={() => setShowGameOver(false)}
              >
                <Text style={[styles.gameOverButtonText, { fontSize: sf(16) }]}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </EnhancedTouchHandler>
    );
  }
);

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
    fontWeight: 'bold',
  },
  coinText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  timeText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  livesText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  boostContainer: {
    position: 'absolute',
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
    fontWeight: 'bold',
    marginBottom: 20,
  },
  gameOverText: {
    color: 'white',
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
    fontWeight: 'bold',
  },
  fpsCounter: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 5,
    zIndex: 100,
  },
  fpsText: {
    color: '#0F0',
    fontSize: 10,
  },
});

export default GameScreenOptimized;
