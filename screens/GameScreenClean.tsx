import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameLoop } from '../utils/gameLoop';
import { useResponsive, scale, scaleFont, scaleSpacing } from '../utils/responsiveScaling';
import FallingItemsVisual from '../components/FallingItemsVisual';
import EnhancedTouchHandler from '../components/EnhancedTouchHandler';
import EnhancedGameHUD from '../components/EnhancedGameHUD';
import HTML5CanvasRenderer from '../components/HTML5CanvasRenderer';
import MineCart from '../components/MineCart';
import RailTrack from '../components/RailTrack';
import PauseModal from './PauseModal';
import { CollisionDetection } from '../utils/collisionDetection';
import GameBottomBar from '../components/GameBottomBar';
import MobileZoomPrevention from '../components/MobileZoomPrevention';
import { dailyStreakSystem } from '../utils/dailyStreakSystem';
import { seasonPassSystem } from '../utils/seasonPassSystem';

const { width, height } = Dimensions.get('window');

// Constants
const MAX_FALLING_ITEMS = 30;
const CULL_DISTANCE = height + 100;
const BASE_FALL_SPEED = 3; // Consistent base speed
const SPEED_INCREMENT = 0.2; // Speed increase per level

interface GameScreenCleanProps {
  navigation: any;
  route?: any;
}

// Minimal HUD component at the top
const GameHUD = memo(({ score, coins, lives, blockages, activePowerUps, fps }: any) => {
  const { scaleFont: sf, scaleSpacing: ss } = useResponsive();
  
  return (
    <View style={[styles.hudContainer, { padding: ss(8) }]}>
      <View style={styles.hudRow}>
        <Text style={[styles.hudText, { fontSize: sf(14) }]}>💰 {coins}</Text>
        <Text style={[styles.hudText, { fontSize: sf(16) }]}>Score: {score}</Text>
        <Text style={[styles.hudText, { fontSize: sf(14) }]}>{'❤️'.repeat(Math.max(0, lives))}</Text>
      </View>
      
      {/* Blockage indicator */}
      {blockages > 0 && (
        <View style={styles.blockageRow}>
          <Text style={[styles.blockageText, { fontSize: sf(12) }]}>
            Blockages: {'🚫'.repeat(blockages)} ({blockages}/5)
          </Text>
        </View>
      )}
      
      {/* Active power-ups */}
      {activePowerUps.size > 0 && (
        <View style={styles.powerUpRow}>
          {Array.from(activePowerUps.keys()).map(powerUp => (
            <Text key={powerUp} style={[styles.powerUpText, { fontSize: sf(12) }]}>
              {powerUp === 'magnet' && '🧲'}
              {powerUp === 'shield' && '🛡️'}
              {powerUp === 'doublePoints' && '⚡x2'}
              {powerUp === 'timeBonus' && '⏰'}
            </Text>
          ))}
        </View>
      )}
      
      {__DEV__ && (
        <Text style={[styles.fpsText, { fontSize: sf(10) }]}>FPS: {fps}</Text>
      )}
    </View>
  );
});

const GameScreenClean: React.FC<GameScreenCleanProps> = memo(({
  navigation,
  route,
}) => {
  const gameLoop = useGameLoop();
  const { dimensions, scale: s, scaleFont: sf, scaleSpacing: ss } = useResponsive();
  
  // Check if we should auto-start (coming from home screen)
  const autoStart = route?.params?.autoStart || false;
  
  // Game state
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [gems, setGems] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [fps, setFps] = useState(60);
  
  // Cart state
  const cartSize = dimensions.cartSize;
  const [cartPosition, setCartPosition] = useState(width / 2);
  const [cartVelocity, setCartVelocity] = useState(0);
  const cartAnimation = useRef(new Animated.Value(width / 2)).current;
  
  // Falling items
  const [fallingItems, setFallingItems] = useState<any[]>([]);
  const itemIdCounter = useRef(0);
  const spawnTimer = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Power-ups
  const [activePowerUps, setActivePowerUps] = useState<Map<string, number>>(new Map());
  const [useCanvasRenderer] = useState(Platform.OS === 'web' && dimensions.width >= 1024);
  const powerUpTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Blockages
  const [blockages, setBlockages] = useState<number>(0);
  const MAX_BLOCKAGES = 5;
  
  // Auto-start if coming from home/onboarding
  useEffect(() => {
    // Initialize Daily Streak and Season Pass systems (as per commit 055da6b)
    const initializeSystems = async () => {
      try {
        // Initialize with guest user for now (will be replaced with actual user ID when logged in)
        await dailyStreakSystem.initializeStreak('guest');
        await seasonPassSystem.initializeSeasonPass('guest');
      } catch (error) {
        console.log('Systems initialization:', error);
      }
    };
    
    initializeSystems();
    
    if (autoStart) {
      // Small delay for smooth transition
      setTimeout(() => startGame(), 500);
    }
  }, []);
  
  // Consistent falling speed calculation
  const getFallSpeed = useCallback((itemLevel: number) => {
    return BASE_FALL_SPEED + (itemLevel - 1) * SPEED_INCREMENT;
  }, []);
  
  // Game loop update
  const updateGame = useCallback((deltaTime: number) => {
    if (!isGameActive || isPaused) return;
    
    const currentSpeed = getFallSpeed(level);
    
    // Update falling items with consistent speed
    setFallingItems(prev => {
      const updated = prev.map(item => ({
        ...item,
        y: item.y + currentSpeed * deltaTime * 60, // Consistent speed based on level
      }));
      
      // Check collisions with improved accuracy (60px cart height as per commit 055da6b)
      updated.forEach(item => {
        // Check if item is at cart level (more accurate collision detection)
        const cartTop = height - 100;
        const cartHeight = 60; // More accurate cart height for better collision
        
        if (!item.collected && item.y >= cartTop - 30 && item.y <= cartTop + cartHeight) {
          // Cart collision box with improved boundaries
          const cartBounds = {
            x: cartPosition - cartSize / 2,
            y: cartTop,
            width: cartSize,
            height: cartHeight,
          };
          
          // Item collision box (50x50 size)
          const itemBounds = {
            x: item.x - 25,
            y: item.y,
            width: 50,
            height: 50,
          };
          
          // Check if item overlaps with cart
          if (
            itemBounds.x < cartBounds.x + cartBounds.width &&
            itemBounds.x + itemBounds.width > cartBounds.x &&
            itemBounds.y < cartBounds.y + cartBounds.height &&
            itemBounds.y + itemBounds.height > cartBounds.y
          ) {
            collectItem(item);
          }
        }
      });
      
      // Remove items that fell off screen
      const filtered = updated.filter(item => {
        if (!item.collected && item.y > height) {
          // Create blockages for missed treasure items (unless shield is active)
          if (!item.isPowerUp && !activePowerUps.has('shield')) {
            setBlockages(prev => {
              const newBlockages = Math.min(prev + 1, MAX_BLOCKAGES);
              // Game over if too many blockages
              if (newBlockages >= MAX_BLOCKAGES) {
                setLives(0);
              }
              return newBlockages;
            });
          }
          return false;
        }
        return !item.collected && item.y < CULL_DISTANCE;
      });
      
      return filtered.slice(-MAX_FALLING_ITEMS);
    });
    
    // Update cart position with velocity
    if (Math.abs(cartVelocity) > 0.1) {
      const newPosition = cartPosition + cartVelocity * deltaTime;
      setCartPosition(Math.max(cartSize / 2, Math.min(width - cartSize / 2, newPosition)));
      setCartVelocity(v => v * 0.92); // Friction
    }
  }, [isGameActive, isPaused, cartPosition, cartSize, cartVelocity, level, getFallSpeed]);
  
  // Render interpolation
  const renderGame = useCallback((interpolation: number) => {
    Animated.timing(cartAnimation, {
      toValue: cartPosition,
      duration: 16,
      useNativeDriver: false,
    }).start();
  }, [cartPosition, cartAnimation]);
  
  // Start game
  const startGame = useCallback(() => {
    setIsGameActive(true);
    setIsPaused(false);
    setScore(0);
    setCoins(0);
    setGems(0);
    setLives(3);
    setLevel(1);
    setFallingItems([]);
    setShowGameOver(false);
    
    // Start game loop
    gameLoop.start(updateGame, renderGame);
    
    // Start spawning with consistent interval
    spawnTimer.current = setInterval(() => {
      spawnFallingItem();
    }, 1200 - level * 50); // Spawn rate increases with level
    
    // Cleanup timer
    cleanupTimer.current = setInterval(() => {
      const metrics = gameLoop.getMetrics();
      setFps(metrics.fps);
    }, 1000);
  }, [gameLoop, updateGame, renderGame, level]);
  
  // Spawn items with consistent initial speed
  const spawnFallingItem = useCallback(() => {
    if (!isGameActive || isPaused) return;
    
    // Decide type of item to spawn
    const rand = Math.random();
    let itemType: string;
    let isDangerous = false;
    
    if (rand < 0.12) {
      // Power-ups (12% chance)
      const powerUps = ['magnet', 'shield', 'doublePoints', 'timeBonus'];
      itemType = powerUps[Math.floor(Math.random() * powerUps.length)];
    } else if (rand < 0.25) {
      // Dangerous items (13% chance) - BOMBS!
      itemType = 'bomb';
      isDangerous = true;
    } else {
      // Treasures (75% chance): coins, gems, and diamonds
      const types = ['coin', 'gem', 'diamond'];
      const weights = [60, 30, 10]; // 60% coins, 30% gems, 10% diamonds
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const random = Math.random() * totalWeight;
      
      itemType = 'coin';
      let cumWeight = 0;
      for (let i = 0; i < types.length; i++) {
        cumWeight += weights[i];
        if (random <= cumWeight) {
          itemType = types[i];
          break;
        }
      }
    }
    
    const newItem = {
      id: `item_${itemIdCounter.current++}`,
      x: Math.random() * (width - 60) + 30,
      y: -50,
      type: itemType,
      speed: getFallSpeed(level), // Use consistent speed
      collected: false,
      isPowerUp: itemType === 'magnet' || itemType === 'shield' || itemType === 'doublePoints' || itemType === 'timeBonus',
      isDangerous,
    };
    
    setFallingItems(prev => [...prev, newItem].slice(-MAX_FALLING_ITEMS));
  }, [isGameActive, isPaused, level, getFallSpeed]);
  
  // Collect item
  const collectItem = useCallback((item: any) => {
    setFallingItems(prev => 
      prev.map(i => i.id === item.id ? { ...i, collected: true } : i)
    );
    
    // Correct point values as specified
    let points = 0;
    switch(item.type) {
      case 'coin':
        points = 10;
        setCoins(prev => prev + 1);
        break;
      case 'gem':
        points = 25;
        setGems(prev => prev + 1);
        break;
      case 'diamond':
        points = 50;
        setGems(prev => prev + 2); // Diamonds give 2 gems
        break;
      case 'magnet':
        activatePowerUp('magnet', 5000); // 5 seconds
        return;
      case 'shield':
        activatePowerUp('shield', 8000); // 8 seconds
        return;
      case 'doublePoints':
        activatePowerUp('doublePoints', 10000); // 10 seconds
        return;
      case 'timeBonus':
        activatePowerUp('timeBonus', 15000); // 15 seconds
        return;
      case 'bomb':
        // Bomb damages player!
        if (!activePowerUps.has('shield')) {
          setLives(prev => Math.max(0, prev - 1));
          if (lives <= 1) {
            setShowGameOver(true);
          }
          // Visual feedback
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }
        return;
    }
    
    // Apply double points if active
    if (activePowerUps.has('doublePoints')) {
      points *= 2;
    }
    
    setScore(prev => prev + points);
    
    // Level up every 100 points
    const newLevel = Math.floor((score + points) / 100) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      // Restart spawn timer with new speed
      if (spawnTimer.current) {
        clearInterval(spawnTimer.current);
        spawnTimer.current = setInterval(() => {
          spawnFallingItem();
        }, Math.max(500, 1200 - newLevel * 50));
      }
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [score, level, spawnFallingItem, activePowerUps]);
  
  // Activate power-up
  const activatePowerUp = useCallback((type: string, duration: number) => {
    // Clear existing timer if any
    const existingTimer = powerUpTimers.current.get(type);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set power-up active
    setActivePowerUps(prev => new Map(prev.set(type, Date.now() + duration)));
    
    // Set timer to deactivate
    const timer = setTimeout(() => {
      setActivePowerUps(prev => {
        const newMap = new Map(prev);
        newMap.delete(type);
        return newMap;
      });
      powerUpTimers.current.delete(type);
    }, duration);
    
    powerUpTimers.current.set(type, timer);
    
    // Special effects for certain power-ups
    if (type === 'magnet') {
      // Auto-collect nearby items
      magnetEffect();
    } else if (type === 'shield') {
      // Protect from blockages
      setBlockages(0);
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  
  // Magnet effect - attract nearby items
  const magnetEffect = useCallback(() => {
    const magnetInterval = setInterval(() => {
      if (!activePowerUps.has('magnet')) {
        clearInterval(magnetInterval);
        return;
      }
      
      setFallingItems(prev => prev.map(item => {
        if (!item.collected && Math.abs(item.x - cartPosition) < 100) {
          // Move item towards cart
          const newX = item.x + (cartPosition - item.x) * 0.2;
          return { ...item, x: newX };
        }
        return item;
      }));
    }, 50);
  }, [cartPosition, activePowerUps]);
  
  // Touch handlers
  const handleCartMove = useCallback((x: number, velocity: number) => {
    if (!isGameActive || isPaused) return;
    
    const minPos = cartSize / 2;
    const maxPos = width - cartSize / 2;
    const targetPos = Math.max(minPos, Math.min(maxPos, x));
    
    setCartPosition(targetPos);
    setCartVelocity(velocity * 0.15);
  }, [isGameActive, isPaused, cartSize]);
  
  const handleTap = useCallback((x: number) => {
    if (!isGameActive) {
      startGame();
    } else if (!isPaused) {
      handleCartMove(x, 0);
    }
  }, [isGameActive, isPaused, startGame, handleCartMove]);
  
  // Pause/Resume
  const pauseGame = useCallback(() => {
    setIsPaused(true);
    setShowPauseMenu(true);
    gameLoop.pause();
  }, [gameLoop]);
  
  const resumeGame = useCallback(() => {
    setIsPaused(false);
    setShowPauseMenu(false);
    gameLoop.resume();
  }, [gameLoop]);
  
  // End game
  const endGame = useCallback(() => {
    setIsGameActive(false);
    setShowGameOver(true);
    
    gameLoop.stop();
    if (spawnTimer.current) clearInterval(spawnTimer.current);
    if (cleanupTimer.current) clearInterval(cleanupTimer.current);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [gameLoop]);
  
  // Check game over
  useEffect(() => {
    if (lives <= 0 && isGameActive) {
      endGame();
    }
  }, [lives, isGameActive, endGame]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      gameLoop.stop();
      if (spawnTimer.current) clearInterval(spawnTimer.current);
      if (cleanupTimer.current) clearInterval(cleanupTimer.current);
    };
  }, [gameLoop]);
  
  return (
    <>
      <MobileZoomPrevention />
      <EnhancedTouchHandler
        onMove={handleCartMove}
        onTap={handleTap}
        enabled={!showGameOver && !showPauseMenu}
        smoothingFactor={0.4}
        velocityThreshold={30}
      >
        <View style={styles.container}>
        {/* Clean game area */}
        <View style={styles.gameArea}>
          {/* Enhanced HUD with inventory and progress */}
          {isGameActive && (
            <EnhancedGameHUD 
              score={score} 
              coins={coins}
              gems={gems}
              lives={lives}
              level={level}
              blockages={blockages}
              activePowerUps={activePowerUps}
              fps={fps}
              userId="guest" // Pass actual userId when available
              isPro={false} // Pass pro status
              onStreakClick={() => {
                // Navigate to daily streak screen
                console.log('Open daily streak');
              }}
              onSeasonPassClick={() => {
                // Navigate to season pass screen
                console.log('Open season pass');
              }}
            />
          )}
          
          {/* Pause button - only when game is active */}
          {isGameActive && !isPaused && (
            <TouchableOpacity style={styles.pauseButton} onPress={pauseGame}>
              <Text style={styles.pauseButtonText}>⏸️</Text>
            </TouchableOpacity>
          )}
          
          {/* Rail Track at bottom */}
          <View style={styles.trackContainer}>
            <RailTrack showDust={Math.abs(cartVelocity) > 10} isMoving={false} />
          </View>
          
          {/* Falling Items with improved visuals */}
          <FallingItemsVisual
            items={fallingItems}
            onItemCollect={collectItem}
            viewportHeight={height}
            renderBuffer={100}
          />
          
          {/* Mine Cart */}
          <Animated.View
            style={[
              styles.cartContainer,
              {
                left: cartAnimation,
                transform: [{ translateX: -cartSize / 2 }],
              },
            ]}
          >
            <MineCart
              position={0}
              size={cartSize}
              isTurboActive={false}
              activeSkin={null}
            />
          </Animated.View>
        </View>
        
        {/* Start prompt - clean and centered */}
        {!isGameActive && !showGameOver && !autoStart && (
          <View style={styles.startOverlay}>
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={[styles.startButtonText, { fontSize: sf(24) }]}>
                Tap to Start
              </Text>
              <Text style={[styles.startHint, { fontSize: sf(14) }]}>
                Move cart to catch falling items!
              </Text>
            </TouchableOpacity>
          </View>
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
            navigation.navigate('Home');
          }}
          currentScore={score}
          currentCoins={coins}
          potLevel={level}
          currentSkin=""
          availablePowerUps={[]}
        />
        
        {/* Game Over - clean overlay */}
        {showGameOver && (
          <View style={styles.gameOverOverlay}>
            <View style={styles.gameOverCard}>
              <Text style={[styles.gameOverTitle, { fontSize: sf(32) }]}>
                Game Over
              </Text>
              <View style={styles.gameOverStats}>
                <Text style={[styles.gameOverText, { fontSize: sf(18) }]}>
                  Final Score: {score}
                </Text>
                <Text style={[styles.gameOverText, { fontSize: sf(16) }]}>
                  Coins Collected: {coins}
                </Text>
                <Text style={[styles.gameOverText, { fontSize: sf(16) }]}>
                  Level Reached: {level}
                </Text>
              </View>
              <View style={styles.gameOverButtons}>
                <TouchableOpacity 
                  style={styles.gameOverButton} 
                  onPress={startGame}
                >
                  <Text style={[styles.gameOverButtonText, { fontSize: sf(18) }]}>
                    Play Again
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.gameOverButton, styles.homeButton]} 
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={[styles.gameOverButtonText, { fontSize: sf(18) }]}>
                    Home
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
        {/* Bottom Action Bar - Always visible during gameplay */}
        {isGameActive && !showGameOver && (
          <GameBottomBar
            coins={coins}
            streakDays={7} // TODO: Get from DailyStreakSystem
            seasonTier={1} // TODO: Get from SeasonPassSystem
            onStreakPress={() => {
              pauseGame();
              // Navigate to streak modal
              console.log('Open streak modal');
            }}
            onSeasonPassPress={() => {
              pauseGame();
              // Navigate to season pass
              console.log('Open season pass');
            }}
            onShopPress={() => {
              pauseGame();
              // Navigate to shop
              console.log('Open shop');
            }}
            onSkinsPress={() => {
              pauseGame();
              // Navigate to skins
              console.log('Open skins');
            }}
            onVacuumPress={() => {
              if (coins >= 25) {
                setCoins(prev => prev - 25);
                // Vacuum all items on screen
                setFallingItems(prev => 
                  prev.map(item => ({ ...item, collected: true }))
                );
                setBlockages(0);
              }
            }}
            onClearAllPress={() => {
              if (coins >= 50) {
                setCoins(prev => prev - 50);
                // Clear all blockages
                setBlockages(0);
                setFallingItems([]);
              }
            }}
            vacuumCost={25}
            clearAllCost={50}
            hasNewStreak={false}
            hasNewTier={false}
          />
        )}
      </View>
      </EnhancedTouchHandler>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  hudContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    marginHorizontal: 10,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  blockageRow: {
    marginTop: 5,
    alignItems: 'center',
  },
  blockageText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  powerUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
    gap: 10,
  },
  powerUpText: {
    color: '#FFF',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fpsText: {
    color: '#0F0',
    position: 'absolute',
    top: 2,
    right: 5,
  },
  pauseButton: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pauseButtonText: {
    fontSize: 20,
  },
  trackContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 5,
  },
  cartContainer: {
    position: 'absolute',
    bottom: 20,
    zIndex: 20,
  },
  startOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  startButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  startButtonText: {
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  startHint: {
    color: '#333',
    marginTop: 5,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  gameOverCard: {
    backgroundColor: '#2a2a2a',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 300,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  gameOverTitle: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  gameOverStats: {
    marginBottom: 30,
  },
  gameOverText: {
    color: 'white',
    marginVertical: 5,
    textAlign: 'center',
  },
  gameOverButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  gameOverButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  homeButton: {
    backgroundColor: '#666',
  },
  gameOverButtonText: {
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
});

export default GameScreenClean;