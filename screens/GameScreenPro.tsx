import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Text,
  AppState,
  AppStateStatus,
  TouchableOpacity,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// Professional Components
import GameLoadingSplash from '../components/GameLoadingSplash';
import SimpleMineBackground from '../components/SimpleMineBackground';
import MiningCart from '../components/MiningCart';
import GoldRushItem from '../components/GoldRushItems';
import EnhancedParticleEffect from '../components/EnhancedParticleEffects';
import GameHUD from '../components/GameHUD';
import TouchHandler from '../components/TouchHandler';
import BlockageDisplay from '../components/BlockageDisplay';

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

interface GameScreenProProps {
  navigation: any;
}

export default function GameScreenPro({ navigation }: GameScreenProProps) {
  // Game state
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(5); // Start with 5 lives for monetization
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [highestCombo, setHighestCombo] = useState(0);
  const [timeSurvived, setTimeSurvived] = useState(0);
  const [showLoadingSplash, setShowLoadingSplash] = useState(true);
  const [cartSkin, setCartSkin] = useState<'default' | 'golden' | 'diamond' | 'emerald' | 'ruby'>('default');
  
  // Cart state with momentum
  const { position: cartPosition, moveTo, isMoving } = useMomentumMovement({
    friction: 0.92,
    acceleration: 3,
    maxSpeed: 20,
  });
  const cartSize = 100;
  const [isCartMoving, setIsCartMoving] = useState(false);
  
  // Visual effects
  const [particles, setParticles] = useState<any[]>([]);
  const { shake, shakeTransform } = useScreenShake();
  
  // Falling items & blockages
  const [fallingItems, setFallingItems] = useState<any[]>([]);
  const [blockages, setBlockages] = useState<any[]>([]);
  const [blockageWarning, setBlockageWarning] = useState<'safe' | 'warning' | 'danger' | 'critical'>('safe');
  
  // Power-ups
  const [magnetActive, setMagnetActive] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);
  const [multiplierActive, setMultiplierActive] = useState(false);
  const [multiplierValue, setMultiplierValue] = useState(1);
  
  // Systems
  const collisionHandler = useRef<CollisionHandler | null>(null);
  const comboSystem = useRef(new ComboSystem()).current;
  const appState = useRef(AppState.currentState);
  
  // Timers
  const gameTimer = useRef<NodeJS.Timeout | null>(null);
  const spawnTimer = useRef<NodeJS.Timeout | null>(null);

  // Load user preferences
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedCoins = await AsyncStorage.getItem('user_coins');
      const savedSkin = await AsyncStorage.getItem('selected_cart_skin');
      const savedLives = await AsyncStorage.getItem('user_lives');
      
      if (savedCoins) setCoins(parseInt(savedCoins, 10));
      if (savedSkin) setCartSkin(savedSkin as any);
      if (savedLives) setLives(parseInt(savedLives, 10));
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/active/) && nextAppState === 'background') {
        if (isGameActive && !isPaused) {
          pauseGame();
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isGameActive, isPaused]);

  // Initialize collision handler
  useEffect(() => {
    collisionHandler.current = new CollisionHandler({
      onCoinCollect: (value: number) => {
        const finalValue = value * multiplierValue;
        setCoins(prev => prev + finalValue);
        setScore(prev => prev + (10 * multiplierValue));
        addParticleEffect(cartPosition._value, height - 120, 'collect');
        gameSoundManager.playSound('coinCollect');
      },
      onGemCollect: (value: number) => {
        const finalValue = value * multiplierValue * 5;
        setCoins(prev => prev + finalValue);
        setScore(prev => prev + (50 * multiplierValue));
        addParticleEffect(cartPosition._value, height - 120, 'collect');
        gameSoundManager.playSound('gemCollect');
      },
      onBombHit: () => {
        if (!shieldActive) {
          setLives(prev => Math.max(0, prev - 1));
          shake({ intensity: 20, duration: 400 });
          addParticleEffect(cartPosition._value, height - 120, 'explosion');
        } else {
          setShieldActive(false);
          addParticleEffect(cartPosition._value, height - 120, 'shield');
        }
        gameSoundManager.playSound('bombHit');
      },
      onPowerupCollect: (type: string) => {
        switch (type) {
          case 'magnet':
            setMagnetActive(true);
            setTimeout(() => setMagnetActive(false), 10000);
            break;
          case 'shield':
            setShieldActive(true);
            break;
          case 'multiplier':
            setMultiplierActive(true);
            setMultiplierValue(2);
            setTimeout(() => {
              setMultiplierActive(false);
              setMultiplierValue(1);
            }, 15000);
            break;
        }
        addParticleEffect(cartPosition._value, height - 120, 'powerup');
        gameSoundManager.playSound('powerupCollect');
      },
      onItemRemove: (itemId: string) => {
        setFallingItems(prev => prev.filter(item => item.id !== itemId));
      },
    });
  }, [multiplierValue, shieldActive]);

  // Handle touch movement
  const handleTouchMove = useCallback((touchX: number) => {
    if (!isGameActive || isPaused) return;
    
    const blockageCheck = blockageManager.checkCartPassage(touchX - cartSize/2, cartSize);
    if (blockageCheck.canPass) {
      moveTo(touchX);
      setIsCartMoving(true);
    } else {
      shake({ intensity: 5, duration: 100 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [isGameActive, isPaused, moveTo, cartSize, shake]);

  // Handle tap
  const handleTap = useCallback((touchX: number) => {
    if (!isGameActive || isPaused) return;
    
    const blockageCheck = blockageManager.checkCartPassage(touchX - cartSize/2, cartSize);
    if (blockageCheck.canPass) {
      moveTo(touchX);
      setIsCartMoving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      gameSoundManager.playSound('buttonTap');
    } else {
      shake({ intensity: 10, duration: 200 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      gameSoundManager.playSound('bombHit');
    }
  }, [isGameActive, isPaused, moveTo, cartSize, shake]);

  // Visual effect helpers
  const addParticleEffect = (x: number, y: number, type: string) => {
    const particle = { 
      id: Date.now() + Math.random(), 
      x, 
      y, 
      type,
      combo: type === 'combo' ? combo : undefined 
    };
    setParticles(prev => [...prev, particle]);
  };

  // Start game
  const startGame = useCallback(async () => {
    if (lives <= 0) {
      // Show "Buy Lives" modal
      navigation.navigate('Shop', { tab: 'lives' });
      return;
    }

    setShowLoadingSplash(false);
    setIsGameActive(true);
    setIsPaused(false);
    setScore(0);
    setLevel(1);
    setCombo(0);
    setHighestCombo(0);
    setTimeSurvived(0);
    setFallingItems([]);
    setBlockages([]);
    blockageManager.reset();
    difficultyManager.resetProgression();
    
    gameSoundManager.playBackgroundMusic();
    
    // Start game timer
    gameTimer.current = setInterval(() => {
      setTimeSurvived(prev => prev + 1);
    }, 1000);
    
    // Start spawning items
    spawnItems();
  }, [lives]);

  // Spawn items with new graphics
  const spawnItems = () => {
    if (!isGameActive || isPaused) return;
    
    const spawnDelay = difficultyManager.getSpawnDelay();
    const itemTypes = ['coin', 'coin', 'coin', 'gem', 'diamond', 'nugget', 'bomb', 'powerup', 'mystery'];
    const weights = [40, 40, 40, 15, 10, 20, 15, 5, 3];
    
    const randomType = () => {
      const random = Math.random() * 100;
      let cumulative = 0;
      for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) return itemTypes[i];
      }
      return 'coin';
    };
    
    const newItem = {
      id: Date.now() + Math.random(),
      type: randomType(),
      x: Math.random() * (width - 40) + 20,
      y: -50,
      speed: difficultyManager.getItemSpeed(),
    };
    
    setFallingItems(prev => [...prev, newItem]);
    
    spawnTimer.current = setTimeout(spawnItems, spawnDelay);
  };

  // Collision detection
  useEffect(() => {
    if (!isGameActive) return;
    
    const checkInterval = setInterval(() => {
      const cartX = (cartPosition as any)._value;
      const cart = {
        x: cartX - cartSize / 2,
        y: height - 120,
        width: cartSize,
        height: cartSize * 0.7,
      };
      
      if (!isPaused) {
        fallingItems.forEach(item => {
          // Magnetism effect
          if (magnetActive) {
            const distance = Math.abs(item.x - cartX);
            if (distance < 150 && item.type !== 'bomb') {
              item.x += (cartX - item.x) * 0.1;
            }
          }
          
          // Check collision
          if (CollisionDetection.checkItemCollision(item, cart)) {
            collisionHandler.current?.handleItemCollision(item.type, item.id);
            
            // Update combo
            if (item.type !== 'bomb') {
              const newCombo = combo + 1;
              setCombo(newCombo);
              if (newCombo > highestCombo) setHighestCombo(newCombo);
              
              if (newCombo % 5 === 0) {
                addParticleEffect(cartX, height - 120, 'combo');
              }
            } else {
              setCombo(0);
            }
          }
          
          // Check if item hit ground
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
            setFallingItems(prev => prev.filter(i => i.id !== item.id));
          }
        });
      }
    }, 16);
    
    return () => clearInterval(checkInterval);
  }, [isGameActive, isPaused, cartPosition, fallingItems, cartSize, magnetActive, combo, highestCombo]);

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

  // Level progression
  useEffect(() => {
    const newLevel = Math.floor(score / 500) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      addParticleEffect(width / 2, height / 2, 'levelUp');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      gameSoundManager.playSound('levelUp');
    }
  }, [score, level]);

  // Game over check
  useEffect(() => {
    if (lives <= 0 && isGameActive) {
      endGame();
    }
  }, [lives, isGameActive]);

  // End game
  const endGame = async () => {
    setIsGameActive(false);
    gameSoundManager.playSound('gameOver');
    gameSoundManager.stopBackgroundMusic();
    
    if (gameTimer.current) clearInterval(gameTimer.current);
    if (spawnTimer.current) clearTimeout(spawnTimer.current);
    
    // Save coins
    const totalCoins = coins;
    await AsyncStorage.setItem('user_coins', totalCoins.toString());
    
    // Navigate to game over with continue option
    navigation.navigate('GameOver', {
      score,
      coins,
      level,
      timeSurvived,
      highestCombo,
      canContinue: coins >= 500, // Can continue with coins
    });
  };

  // Pause/Resume
  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      gameSoundManager.resumeBackgroundMusic();
      spawnItems();
    } else {
      setIsPaused(true);
      gameSoundManager.pauseBackgroundMusic();
      if (spawnTimer.current) clearTimeout(spawnTimer.current);
    }
  };

  // Show loading splash first
  if (showLoadingSplash) {
    return (
      <GameLoadingSplash
        onComplete={() => setShowLoadingSplash(false)}
        duration={2500}
      />
    );
  }

  return (
    <TouchHandler
      onMove={handleTouchMove}
      onTap={handleTap}
      enabled={isGameActive && !isPaused}
    >
      <Animated.View style={[styles.container, shakeTransform]}>
        {/* Parallax mine background */}
        <SimpleMineBackground 
          speed={isCartMoving ? 2 : 1} 
          isPaused={isPaused}
          level={level}
        />
        
        {/* Game HUD */}
        <GameHUD
          score={score}
          coins={coins}
          level={level}
          combo={combo}
          timeSurvived={timeSurvived}
          isPaused={isPaused}
          onPause={togglePause}
          lives={lives}
          magnetActive={magnetActive}
          shieldActive={shieldActive}
          multiplierActive={multiplierActive}
          multiplierValue={multiplierValue}
        />
        
        {/* Game Area */}
        <View style={styles.gameArea}>
          {/* Blockages */}
          <BlockageDisplay
            blockages={blockages}
            warningLevel={blockageWarning}
            onBlockageHit={(id) => {
              const result = blockageManager.damageBlockage(id);
              if (result.destroyed) {
                setBlockages(blockageManager.getAllBlockages());
                addParticleEffect(result.blockage?.x || 0, result.blockage?.y || 0, 'explosion');
              }
            }}
          />
          
          {/* Falling Items with new graphics */}
          {fallingItems.map(item => (
            <View
              key={item.id}
              style={[
                styles.fallingItem,
                {
                  left: item.x - 20,
                  top: item.y,
                },
              ]}
            >
              <GoldRushItem type={item.type} size={40} isAnimated={true} />
            </View>
          ))}
          
          {/* Particle Effects */}
          {particles.map(particle => (
            <EnhancedParticleEffect
              key={particle.id}
              x={particle.x}
              y={particle.y}
              type={particle.type}
              combo={particle.combo}
              onComplete={() => {
                setParticles(prev => prev.filter(p => p.id !== particle.id));
              }}
            />
          ))}
          
          {/* Mining Rail Cart */}
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
            <MiningCart
              position={(cartPosition as any)._value}
              size={cartSize}
              isTurboActive={magnetActive || multiplierActive}
              isMoving={isCartMoving}
              skin={cartSkin}
              level={level}
            />
            
            {/* Power-up indicators */}
            {magnetActive && (
              <View style={styles.magnetField} />
            )}
            {shieldActive && (
              <View style={styles.shieldBubble} />
            )}
          </Animated.View>
        </View>
        
        {/* Pause Menu */}
        {isPaused && (
          <Modal transparent animationType="fade">
            <View style={styles.pauseOverlay}>
              <View style={styles.pauseMenu}>
                <Text style={styles.pauseTitle}>PAUSED</Text>
                <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
                  <Text style={styles.pauseButtonText}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pauseButton} onPress={() => navigation.navigate('Shop')}>
                  <Text style={styles.pauseButtonText}>Shop</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pauseButton} onPress={() => navigation.navigate('Home')}>
                  <Text style={styles.pauseButtonText}>Main Menu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </Animated.View>
    </TouchHandler>
  );
}

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
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    left: -50,
    top: -50,
  },
  shieldBubble: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 191, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(0, 191, 255, 0.5)',
    left: -10,
    top: -10,
  },
  fallingItem: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseMenu: {
    backgroundColor: '#2C1810',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  pauseTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 30,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  pauseButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  pauseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C1810',
  },
});