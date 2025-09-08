import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Text,
  AppState,
  AppStateStatus,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// Components
import GameHUD from '../components/GameHUD';
import MineCart from '../components/MineCart';
import RailTrack from '../components/RailTrack';
import FallingItemsImproved from '../components/FallingItemsImproved';
import TouchHandler from '../components/TouchHandler';
import TapIndicator from '../components/TapIndicator';
import ParticleEffect from '../components/ParticleEffect';
import CartTrail from '../components/CartTrail';
import BlockageDisplay from '../components/BlockageDisplay';
import TutorialOverlay from '../components/TutorialOverlay';
import MagnetEffect from '../components/MagnetEffect';

// Hooks
import { useScreenShake } from '../hooks/useScreenShake';
import { useMomentumMovement } from '../hooks/useMomentumMovement';

// Utils
import { CollisionDetection } from '../utils/collisionDetection';
import { CollisionHandler } from '../utils/collisionHandler';
import { ComboSystem } from '../utils/comboSystem';
import { gameSoundManager } from '../utils/gameSoundManager';
import { blockageManager } from '../utils/blockageManager';
import { difficultyManager } from '../utils/difficultyManager';

const { width, height } = Dimensions.get('window');

interface GameScreenEnhancedProps {
  navigation: any;
}

export default function GameScreenEnhanced({ navigation }: GameScreenEnhancedProps) {
  // Game state
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [timeSurvived, setTimeSurvived] = useState(0);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  
  // Cart state with momentum
  const { position: cartPosition, moveTo, isMoving } = useMomentumMovement({
    friction: 0.92,
    acceleration: 3,
    maxSpeed: 20,
  });
  const cartSize = 100; // Larger for mobile
  const [isCartMoving, setIsCartMoving] = useState(false);
  
  // Visual effects
  const [tapIndicators, setTapIndicators] = useState<any[]>([]);
  const [particles, setParticles] = useState<any[]>([]);
  const [magnetEffects, setMagnetEffects] = useState<any[]>([]);
  const { shake, shakeTransform } = useScreenShake();
  
  // Falling items & blockages
  const [fallingItems, setFallingItems] = useState<any[]>([]);
  const [blockages, setBlockages] = useState<any[]>([]);
  const [blockageWarning, setBlockageWarning] = useState<'safe' | 'warning' | 'danger' | 'critical'>('safe');
  
  // Boost state
  const [boostAvailable, setBoostAvailable] = useState(true);
  const [boostCooldown, setBoostCooldown] = useState(0);
  const [magnetActive, setMagnetActive] = useState(false);
  
  // Systems
  const collisionHandler = useRef<CollisionHandler | null>(null);
  const comboSystem = useRef(new ComboSystem()).current;
  const appState = useRef(AppState.currentState);
  
  // Timers
  const gameTimer = useRef<NodeJS.Timeout | null>(null);
  const spawnTimer = useRef<NodeJS.Timeout | null>(null);
  const boostTimer = useRef<NodeJS.Timeout | null>(null);

  // Check if first time player
  useEffect(() => {
    const checkFirstTime = async () => {
      const hasPlayed = await AsyncStorage.getItem('has_played_before');
      if (!hasPlayed) {
        setIsFirstTime(true);
        setShowTutorial(true);
      } else {
        setIsFirstTime(false);
      }
    };
    checkFirstTime();
  }, []);

  // Handle app state changes (auto-pause)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        if (isGameActive && !isPaused) {
          pauseGame();
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isGameActive, isPaused]);

  // Initialize systems
  useEffect(() => {
    // Initialize difficulty
    difficultyManager.initialize(isFirstTime);
    
    // Initialize collision handler
    collisionHandler.current = new CollisionHandler({
      onScoreChange: (change) => setScore(prev => prev + change),
      onCoinChange: (change) => setCoins(prev => prev + change),
      onLifeChange: (change) => {
        const newLives = Math.max(0, lives + change);
        setLives(newLives);
        if (change < 0) {
          shake({ intensity: 15, duration: 500 });
          gameSoundManager.playSound('bombHit', { haptic: true });
        }
      },
      onPowerUpActivate: (type, duration) => {
        if (type === 'magnet') {
          setMagnetActive(true);
          setTimeout(() => setMagnetActive(false), duration);
        }
      },
      onItemCollect: (itemId) => {
        const item = fallingItems.find(i => i.id === itemId);
        if (item) {
          // Play sound based on item type
          gameSoundManager.playSound(`${item.type}Collect`, { haptic: true });
          
          // Create particle effect
          addParticleEffect(item.x, item.y, 'collect');
        }
        setFallingItems(prev => prev.filter(i => i.id !== itemId));
      },
      onComboUpdate: (newCombo) => {
        setCombo(newCombo);
        if (newCombo > 0 && newCombo % 5 === 0) {
          gameSoundManager.playSound('comboIncrease', { haptic: true });
        }
      },
      onAchievement: (achievement) => {
        console.log(`Achievement: ${achievement}`);
      },
      onSoundPlay: (sound) => {
        gameSoundManager.playSound(sound);
      },
    });
    
    // Start background music
    gameSoundManager.startBackgroundMusic();
    
    return () => {
      gameSoundManager.cleanup();
      blockageManager.reset();
    };
  }, []);

  // Handle touch movement with momentum
  const handleTouchMove = useCallback((touchX: number) => {
    if (!isGameActive || isPaused) return;
    moveTo(touchX);
    setIsCartMoving(true);
  }, [isGameActive, isPaused, moveTo]);

  // Handle tap with visual feedback
  const handleTap = useCallback((touchX: number) => {
    if (!isGameActive || isPaused) return;
    
    // Add tap indicator
    addTapIndicator(touchX, height - 150);
    
    // Move cart with momentum
    moveTo(touchX);
    setIsCartMoving(true);
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    gameSoundManager.playSound('buttonTap');
  }, [isGameActive, isPaused, moveTo]);

  // Visual effect helpers
  const addTapIndicator = (x: number, y: number) => {
    const indicator = { id: Date.now(), x, y };
    setTapIndicators(prev => [...prev, indicator]);
  };

  const addParticleEffect = (x: number, y: number, type: 'collect' | 'explosion' | 'sparkle' | 'damage') => {
    const particle = { id: Date.now(), x, y, type };
    setParticles(prev => [...prev, particle]);
  };

  const addMagnetEffect = (itemX: number, itemY: number) => {
    const effect = { id: Date.now(), itemX, itemY };
    setMagnetEffects(prev => [...prev, effect]);
  };

  // Start game
  const startGame = useCallback(async () => {
    setShowStartScreen(false);
    setIsGameActive(true);
    setIsPaused(false);
    setScore(0);
    setCoins(0);
    setLives(3);
    setLevel(1);
    setCombo(0);
    setTimeSurvived(0);
    setFallingItems([]);
    setBlockages([]);
    blockageManager.reset();
    difficultyManager.resetProgression();
    
    // Save that player has played
    await AsyncStorage.setItem('has_played_before', 'true');
    
    // Start timers
    gameTimer.current = setInterval(() => {
      setTimeSurvived(prev => prev + 1);
    }, 1000);
    
    startItemSpawning();
  }, []);

  // Spawn items with difficulty scaling
  const startItemSpawning = () => {
    const spawn = () => {
      if (!isPaused && isGameActive) {
        spawnItem();
      }
      
      const settings = difficultyManager.getCurrentSettings();
      spawnTimer.current = setTimeout(spawn, settings.itemSpawnRate);
    };
    spawn();
  };

  // Spawn a single item
  const spawnItem = () => {
    const config = difficultyManager.getSpawnConfig();
    const settings = difficultyManager.getCurrentSettings();
    
    const newItem = {
      id: Date.now() + Math.random(),
      x: Math.random() * (width - 40) + 20,
      y: -50,
      type: config.type,
      speed: settings.itemFallSpeed,
      scale: config.rarity === 'rare' ? 1.2 : 1,
    };
    
    setFallingItems(prev => [...prev, newItem]);
  };

  // Check collisions with magnetism
  useEffect(() => {
    if (!isGameActive || isPaused) return;
    
    const checkInterval = setInterval(() => {
      const cartX = (cartPosition as any)._value;
      const cart = {
        x: cartX,
        y: height - 120,
        width: cartSize,
        height: cartSize * 0.7,
      };
      
      // Check blockage collision
      const blockageCheck = blockageManager.checkCartPassage(cartX - cartSize/2, cartSize);
      if (!blockageCheck.canPass) {
        // Cart hit blockage - damage it
        blockageCheck.collidingBlockages.forEach(blockage => {
          const result = blockageManager.damageBlockage(blockage.id, 1);
          if (result.destroyed) {
            addParticleEffect(blockage.x + blockage.width/2, blockage.y, 'explosion');
            gameSoundManager.playSound('bombHit');
          }
        });
      }
      
      fallingItems.forEach(item => {
        // Magnetism effect
        if (magnetActive) {
          const distance = Math.abs(item.x - cartX);
          if (distance < 150 && item.type !== 'bomb') {
            // Pull item towards cart
            item.x += (cartX - item.x) * 0.1;
            addMagnetEffect(item.x, item.y);
          }
        }
        
        // Regular collision
        if (CollisionDetection.checkItemCollision(item, cart)) {
          collisionHandler.current?.handleItemCollision(item.type, item.id);
          
          // Update combo
          if (item.type !== 'bomb') {
            const newCombo = comboSystem.addHit();
            setCombo(newCombo.count);
          } else {
            comboSystem.reset();
            setCombo(0);
            shake({ intensity: 20, duration: 400 });
          }
        }
        
        // Check if item hit ground (missed)
        if (item.y > height - 100) {
          if (item.type !== 'bomb' && difficultyManager.shouldCreateBlockage()) {
            const result = blockageManager.addMissedItem({
              x: item.x,
              type: item.type,
              size: 40,
            });
            
            if (result.gameOver) {
              endGame();
            } else if (result.blockage) {
              setBlockages(blockageManager.getAllBlockages());
              setBlockageWarning(blockageManager.getWarningLevel());
            }
          }
          
          // Remove missed item
          setFallingItems(prev => prev.filter(i => i.id !== item.id));
        }
      });
    }, 16);
    
    return () => clearInterval(checkInterval);
  }, [isGameActive, isPaused, cartPosition, fallingItems, cartSize, magnetActive]);

  // Update falling items position
  useEffect(() => {
    if (!isGameActive || isPaused) return;
    
    const moveInterval = setInterval(() => {
      setFallingItems(prev => prev.map(item => ({
        ...item,
        y: item.y + item.speed,
      })));
    }, 16);
    
    return () => clearInterval(moveInterval);
  }, [isGameActive, isPaused]);

  // Update difficulty
  useEffect(() => {
    const result = difficultyManager.updateDifficulty({
      timeElapsed: timeSurvived,
      score,
      itemsCollected: coins,
      level,
    });
    
    if (result.levelChanged) {
      gameSoundManager.playSound('levelUp', { haptic: true });
      addParticleEffect(width / 2, height / 2, 'sparkle');
    }
  }, [timeSurvived, score, level]);

  // Level progression
  useEffect(() => {
    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [score, level]);

  // Game over check
  useEffect(() => {
    if ((lives <= 0 || blockageManager.isGameOver()) && isGameActive) {
      endGame();
    }
  }, [lives, isGameActive]);

  // End game
  const endGame = () => {
    setIsGameActive(false);
    gameSoundManager.playSound('gameOver', { haptic: true });
    gameSoundManager.stopBackgroundMusic();
    
    // Clear timers
    if (gameTimer.current) clearInterval(gameTimer.current);
    if (spawnTimer.current) clearTimeout(spawnTimer.current);
    if (boostTimer.current) clearTimeout(boostTimer.current);
    
    // Navigate to game over
    navigation.navigate('GameOver', {
      score,
      coins,
      level,
      timeSurvived,
    });
  };

  // Pause/Resume
  const pauseGame = () => {
    setIsPaused(true);
    gameSoundManager.pauseBackgroundMusic();
    gameSoundManager.playSound('pause');
  };

  const resumeGame = () => {
    setIsPaused(false);
    gameSoundManager.resumeBackgroundMusic();
  };

  const togglePause = () => {
    if (isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  };

  // Boost function
  const activateBoost = () => {
    if (!boostAvailable) return;
    
    setBoostAvailable(false);
    setBoostCooldown(10);
    
    // Clear some blockages
    const cleared = blockageManager.clearBlockages(0.5);
    if (cleared > 0) {
      setBlockages(blockageManager.getAllBlockages());
      setBlockageWarning(blockageManager.getWarningLevel());
      addParticleEffect(width / 2, height - 100, 'explosion');
    }
    
    // Activate magnet
    setMagnetActive(true);
    setTimeout(() => setMagnetActive(false), 5000);
    
    // Cooldown
    let cooldown = 10;
    boostTimer.current = setInterval(() => {
      cooldown--;
      setBoostCooldown(cooldown);
      
      if (cooldown <= 0) {
        setBoostAvailable(true);
        if (boostTimer.current) clearInterval(boostTimer.current);
      }
    }, 1000);
    
    gameSoundManager.playSound('powerupCollect', { haptic: true });
  };

  // Tutorial complete
  const handleTutorialComplete = () => {
    setShowTutorial(false);
    startGame();
  };

  // Start screen
  if (showStartScreen && !showTutorial) {
    return (
      <View style={styles.startScreen}>
        <Text style={styles.title}>Pot of Gold</Text>
        <Text style={styles.subtitle}>Tap anywhere to move the cart!</Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            if (isFirstTime) {
              setShowTutorial(true);
            } else {
              startGame();
            }
          }}
        >
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchHandler
      onMove={handleTouchMove}
      onTap={handleTap}
      enabled={isGameActive && !isPaused}
    >
      <Animated.View style={[styles.container, shakeTransform]}>
        {/* Tutorial */}
        <TutorialOverlay
          visible={showTutorial}
          onComplete={handleTutorialComplete}
        />
        
        {/* Game HUD */}
        <GameHUD
          score={score}
          coins={coins}
          lives={lives}
          level={level}
          combo={combo}
          timeSurvived={timeSurvived}
          isPaused={isPaused}
          onPause={togglePause}
          onBoost={activateBoost}
          boostAvailable={boostAvailable}
          boostCooldown={boostCooldown}
        />
        
        {/* Game Area */}
        <View style={styles.gameArea}>
          {/* Rail Track */}
          <RailTrack showDust={isCartMoving} isMoving={isCartMoving} />
          
          {/* Cart Trail */}
          <CartTrail
            cartX={(cartPosition as any)._value}
            cartY={height - 120}
            isMoving={isCartMoving}
            color={magnetActive ? '#00FF00' : '#FFD700'}
          />
          
          {/* Blockages */}
          <BlockageDisplay
            blockages={blockages}
            warningLevel={blockageWarning}
            onBlockageHit={(id) => {
              const result = blockageManager.damageBlockage(id);
              if (result.destroyed) {
                setBlockages(blockageManager.getAllBlockages());
              }
            }}
          />
          
          {/* Falling Items */}
          <FallingItemsImproved
            items={fallingItems}
            isPaused={isPaused}
          />
          
          {/* Visual Effects */}
          {tapIndicators.map(indicator => (
            <TapIndicator
              key={indicator.id}
              x={indicator.x}
              y={indicator.y}
              onComplete={() => {
                setTapIndicators(prev => prev.filter(i => i.id !== indicator.id));
              }}
            />
          ))}
          
          {particles.map(particle => (
            <ParticleEffect
              key={particle.id}
              x={particle.x}
              y={particle.y}
              type={particle.type}
              onComplete={() => {
                setParticles(prev => prev.filter(p => p.id !== particle.id));
              }}
            />
          ))}
          
          {magnetEffects.map(effect => (
            <MagnetEffect
              key={effect.id}
              cartX={(cartPosition as any)._value}
              cartY={height - 120}
              itemX={effect.itemX}
              itemY={effect.itemY}
              isActive={true}
              onComplete={() => {
                setMagnetEffects(prev => prev.filter(e => e.id !== effect.id));
              }}
            />
          ))}
          
          {/* Mine Cart */}
          <Animated.View
            style={[
              styles.cartContainer,
              {
                transform: [
                  { translateX: Animated.subtract(cartPosition, cartSize / 2) },
                ],
              },
            ]}
          >
            <MineCart
              position={(cartPosition as any)._value}
              size={cartSize}
              isTurboActive={magnetActive}
              onWheelSpin={() => {}}
              activeSkin={null}
            />
            {magnetActive && (
              <View style={styles.magnetField} />
            )}
          </Animated.View>
        </View>
        
        {/* Pause Overlay */}
        {isPaused && (
          <View style={styles.pauseOverlay}>
            <Text style={styles.pauseText}>PAUSED</Text>
            <Text style={styles.difficultyText}>
              Difficulty: {difficultyManager.getDifficultyDescription()}
            </Text>
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={togglePause}
            >
              <Text style={styles.resumeButtonText}>Resume</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </TouchHandler>
  );
}

const TouchableOpacity = ({ style, onPress, children }: any) => (
  <View style={style} onTouchEnd={onPress}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  cartContainer: {
    position: 'absolute',
    bottom: 50,
    width: 100,
    height: 100,
  },
  magnetField: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 0, 0.3)',
    left: -50,
    top: -50,
  },
  startScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  difficultyText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 30,
  },
  resumeButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  resumeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
});