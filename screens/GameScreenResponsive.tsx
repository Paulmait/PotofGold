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
  Platform,
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
import ResponsiveGameContainer from '../components/ResponsiveGameContainer';

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
import {
  scale,
  verticalScale,
  fontScale,
  getGameSettings,
  getResponsiveLayout,
  responsiveDimensions,
  handleOrientationChange,
} from '../utils/responsive';

interface GameScreenResponsiveProps {
  navigation: any;
  dimensions?: any;
  layout?: any;
  isResponsive?: boolean;
}

export default function GameScreenResponsive({
  navigation,
  dimensions: propDimensions,
  layout: propLayout,
  isResponsive,
}: GameScreenResponsiveProps) {
  // Use responsive dimensions
  const [screenDimensions, setScreenDimensions] = useState(
    propDimensions || {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    }
  );

  const gameSettings = getGameSettings();
  const layout = propLayout || getResponsiveLayout();

  // Game state
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(5);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [highestCombo, setHighestCombo] = useState(0);
  const [timeSurvived, setTimeSurvived] = useState(0);
  const [showLoadingSplash, setShowLoadingSplash] = useState(true);
  const [cartSkin, setCartSkin] = useState<'default' | 'golden' | 'diamond' | 'emerald' | 'ruby'>(
    'default'
  );

  // Responsive cart size
  const cartSize = responsiveDimensions.cartSize.width;
  const itemSize = responsiveDimensions.itemSize.width;

  // Cart state with momentum
  const {
    position: cartPosition,
    moveTo,
    isMoving,
  } = useMomentumMovement({
    friction: 0.92,
    acceleration: gameSettings.cartSpeed / 3,
    maxSpeed: gameSettings.cartSpeed * 2,
  });
  const [isCartMoving, setIsCartMoving] = useState(false);

  // Visual effects
  const [particles, setParticles] = useState<any[]>([]);
  const { shake, shakeTransform } = useScreenShake();

  // Falling items & blockages
  const [fallingItems, setFallingItems] = useState<any[]>([]);
  const [blockages, setBlockages] = useState<any[]>([]);
  const [blockageWarning, setBlockageWarning] = useState<
    'safe' | 'warning' | 'danger' | 'critical'
  >('safe');

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

  // Handle orientation changes
  useEffect(() => {
    if (!isResponsive) {
      const unsubscribe = handleOrientationChange((newDimensions) => {
        setScreenDimensions(newDimensions);
      });
      return unsubscribe;
    }
  }, [isResponsive]);

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

  // Initialize collision handler
  useEffect(() => {
    collisionHandler.current = new CollisionHandler({
      onCoinCollect: handleCoinCollect,
      onTreasureCollect: handleTreasureCollect,
      onPowerUpCollect: handlePowerUpCollect,
      onBombHit: handleBombHit,
      onBlockageCollision: handleBlockageCollision,
    });
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isPaused]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/active/) && nextAppState === 'background') {
      pauseGame();
    }
    appState.current = nextAppState;
  };

  // Game loop
  useEffect(() => {
    let animationId: number;

    const gameLoop = () => {
      if (isGameActive && !isPaused) {
        updateFallingItems();
        updateBlockages();
        checkCollisions();
        checkMagnetEffect();
      }
      animationId = requestAnimationFrame(gameLoop);
    };

    if (isGameActive) {
      animationId = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isGameActive, isPaused, cartPosition, magnetActive]);

  const startGame = useCallback(() => {
    setIsGameActive(true);
    setIsPaused(false);
    setScore(0);
    setLevel(1);
    setCombo(0);
    setTimeSurvived(0);
    setFallingItems([]);
    setBlockages([]);

    // Start spawning items
    startItemSpawning();

    // Start timer
    gameTimer.current = setInterval(() => {
      setTimeSurvived((prev) => prev + 1);
    }, 1000);

    gameSoundManager.playSound('gameStart');
  }, []);

  const pauseGame = useCallback(() => {
    setIsPaused(true);
    if (spawnTimer.current) clearInterval(spawnTimer.current);
    gameSoundManager.playSound('pause');
  }, []);

  const resumeGame = useCallback(() => {
    setIsPaused(false);
    startItemSpawning();
    gameSoundManager.playSound('resume');
  }, []);

  const endGame = useCallback(() => {
    setIsGameActive(false);
    setIsPaused(false);

    if (gameTimer.current) clearInterval(gameTimer.current);
    if (spawnTimer.current) clearInterval(spawnTimer.current);

    // Save stats
    saveGameStats();

    // Navigate to game over
    navigation.navigate('GameOver', {
      score,
      coins,
      level,
      timeSurvived,
      highestCombo,
    });

    gameSoundManager.playSound('gameOver');
  }, [score, coins, level, timeSurvived, highestCombo, navigation]);

  const saveGameStats = async () => {
    try {
      const stats = {
        lastScore: score,
        totalCoins: coins,
        highestLevel: level,
        longestSurvival: timeSurvived,
        bestCombo: highestCombo,
      };
      await AsyncStorage.setItem('game_stats', JSON.stringify(stats));
      await AsyncStorage.setItem('user_coins', coins.toString());
    } catch (error) {
      console.error('Error saving game stats:', error);
    }
  };

  const startItemSpawning = () => {
    if (spawnTimer.current) clearInterval(spawnTimer.current);

    const spawnItem = () => {
      if (fallingItems.length < gameSettings.maxItems) {
        const newItem = createRandomItem();
        setFallingItems((prev) => [...prev, newItem]);
      }
    };

    spawnTimer.current = setInterval(spawnItem, gameSettings.spawnRate / level);
  };

  const createRandomItem = () => {
    const types = ['coin', 'gem', 'treasure', 'bomb', 'powerup'];
    const weights = [40, 25, 15, 15, 5]; // Probability weights

    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedType = 'coin';

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) {
        selectedType = types[i];
        break;
      }
    }

    // Random power-up type
    let powerUpType = undefined;
    if (selectedType === 'powerup') {
      const powerUps = ['magnet', 'shield', 'multiplier'];
      powerUpType = powerUps[Math.floor(Math.random() * powerUps.length)];
    }

    return {
      id: Date.now() + Math.random(),
      type: selectedType,
      powerUpType,
      x: Math.random() * (screenDimensions.width - itemSize),
      y: -itemSize,
      value:
        selectedType === 'coin'
          ? 10
          : selectedType === 'gem'
            ? 25
            : selectedType === 'treasure'
              ? 50
              : 0,
      speed: gameSettings.itemFallSpeed + (Math.random() * 2 - 1),
      rotation: new Animated.Value(0),
    };
  };

  const updateFallingItems = () => {
    setFallingItems((prev) => {
      return prev
        .map((item) => ({
          ...item,
          y: item.y + (isPaused ? 0 : item.speed),
        }))
        .filter((item) => item.y < screenDimensions.height + itemSize);
    });
  };

  const updateBlockages = () => {
    const currentBlockages = blockageManager.getBlockages(level);
    setBlockages(currentBlockages);

    // Update warning level based on blockage count
    const blockageCount = currentBlockages.length;
    if (blockageCount >= 4) {
      setBlockageWarning('critical');
    } else if (blockageCount >= 3) {
      setBlockageWarning('danger');
    } else if (blockageCount >= 2) {
      setBlockageWarning('warning');
    } else {
      setBlockageWarning('safe');
    }
  };

  const checkCollisions = () => {
    if (!collisionHandler.current) return;

    fallingItems.forEach((item) => {
      const collision = CollisionDetection.checkCollision(
        {
          x: cartPosition,
          y: screenDimensions.height - verticalScale(120),
          width: cartSize,
          height: responsiveDimensions.cartSize.height,
        },
        { x: item.x, y: item.y, width: itemSize, height: itemSize }
      );

      if (collision && !item.collected) {
        item.collected = true;
        collisionHandler.current!.handleCollision(item.type, item);
      }
    });
  };

  const checkMagnetEffect = () => {
    if (!magnetActive) return;

    setFallingItems((prev) => {
      return prev.map((item) => {
        if (item.type === 'coin' || item.type === 'gem') {
          const distance = Math.abs(item.x - cartPosition);
          if (distance < scale(150)) {
            const pull = (cartPosition - item.x) * 0.1;
            return { ...item, x: item.x + pull };
          }
        }
        return item;
      });
    });
  };

  const handleCoinCollect = (item: any) => {
    const value = item.value * multiplierValue;
    setScore((prev) => prev + value);
    setCoins((prev) => prev + Math.floor(value / 10));

    const comboData = comboSystem.addCollection();
    setCombo(comboData.currentCombo);
    if (comboData.currentCombo > highestCombo) {
      setHighestCombo(comboData.currentCombo);
    }

    // Create particle effect
    setParticles((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: item.x,
        y: item.y,
        type: 'coin',
      },
    ]);

    gameSoundManager.playSound('coinCollect');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleTreasureCollect = (item: any) => {
    const value = item.value * multiplierValue;
    setScore((prev) => prev + value);
    setCoins((prev) => prev + Math.floor(value / 5));

    setParticles((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: item.x,
        y: item.y,
        type: 'treasure',
      },
    ]);

    gameSoundManager.playSound('treasureCollect');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePowerUpCollect = (item: any) => {
    switch (item.powerUpType) {
      case 'magnet':
        setMagnetActive(true);
        setTimeout(() => setMagnetActive(false), 10000);
        break;
      case 'shield':
        setShieldActive(true);
        setTimeout(() => setShieldActive(false), 8000);
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

    gameSoundManager.playSound('powerUp');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const handleBombHit = (item: any) => {
    if (shieldActive) {
      setShieldActive(false);
      gameSoundManager.playSound('shieldBlock');
      return;
    }

    setLives((prev) => Math.max(0, prev - 1));
    shake();
    comboSystem.resetCombo();
    setCombo(0);

    if (lives <= 1) {
      endGame();
    }

    gameSoundManager.playSound('explosion');
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleBlockageCollision = () => {
    // Blockages limit movement, handled in TouchHandler
  };

  const handleTouch = (event: any) => {
    if (!isGameActive || isPaused) return;

    const touchX = event.nativeEvent.locationX || event.nativeEvent.pageX;
    const targetX = Math.max(0, Math.min(touchX - cartSize / 2, screenDimensions.width - cartSize));

    // Check if movement is blocked
    const isBlocked = blockages.some((blockage) => {
      return Math.abs(blockage.x - targetX) < cartSize;
    });

    if (!isBlocked) {
      moveTo(targetX);
      setIsCartMoving(true);
      setTimeout(() => setIsCartMoving(false), 300);
    } else {
      shake();
      gameSoundManager.playSound('blocked');
    }
  };

  // Render game content wrapped in responsive container
  const renderGame = () => (
    <View style={styles.container}>
      <Animated.View style={[styles.gameArea, shakeTransform]}>
        {/* Background */}
        <SimpleMineBackground level={level} />

        {/* Falling Items */}
        {fallingItems.map((item) => (
          <GoldRushItem
            key={item.id}
            type={item.type}
            x={item.x}
            y={item.y}
            size={itemSize}
            rotation={item.rotation}
            powerUpType={item.powerUpType}
          />
        ))}

        {/* Blockages */}
        <BlockageDisplay blockages={blockages} warningLevel={blockageWarning} />

        {/* Cart */}
        <MiningCart
          position={cartPosition}
          size={cartSize}
          skin={cartSkin}
          isMoving={isCartMoving}
          hasShield={shieldActive}
          hasMagnet={magnetActive}
        />

        {/* Particle Effects */}
        {particles.map((particle) => (
          <EnhancedParticleEffect
            key={particle.id}
            x={particle.x}
            y={particle.y}
            type={particle.type}
            onComplete={() => {
              setParticles((prev) => prev.filter((p) => p.id !== particle.id));
            }}
          />
        ))}

        {/* Touch Handler */}
        <TouchHandler onTouch={handleTouch} />

        {/* HUD */}
        <GameHUD
          score={score}
          coins={coins}
          lives={lives}
          level={level}
          combo={combo}
          isPaused={isPaused}
          onPause={pauseGame}
          onResume={resumeGame}
          magnetActive={magnetActive}
          shieldActive={shieldActive}
          multiplierActive={multiplierActive}
          multiplierValue={multiplierValue}
        />
      </Animated.View>

      {/* Loading Splash */}
      {showLoadingSplash && (
        <GameLoadingSplash
          onComplete={() => {
            setShowLoadingSplash(false);
            startGame();
          }}
          duration={2000}
        />
      )}
    </View>
  );

  // Use responsive container if not already wrapped
  if (isResponsive) {
    return renderGame();
  }

  return <ResponsiveGameContainer>{renderGame()}</ResponsiveGameContainer>;
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
});
