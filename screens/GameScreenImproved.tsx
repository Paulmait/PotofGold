import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Animated, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import GameHUD from '../components/GameHUD';
import MineCart from '../components/MineCart';
import RailTrack from '../components/RailTrack';
import FallingItems from '../components/FallingItems';
import TouchHandler from '../components/TouchHandler';
import TapIndicator from '../components/TapIndicator';
import { CollisionDetection } from '../utils/collisionDetection';
import { CollisionHandler } from '../utils/collisionHandler';
import { ComboSystem } from '../utils/comboSystem';

const { width, height } = Dimensions.get('window');

interface GameScreenImprovedProps {
  navigation: any;
}

export default function GameScreenImproved({ navigation }: GameScreenImprovedProps) {
  // Game state
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [timeSurvived, setTimeSurvived] = useState(0);

  // Cart state
  const [cartPosition, setCartPosition] = useState(width / 2);
  const cartSize = 100; // Larger for mobile
  const [isCartMoving, setIsCartMoving] = useState(false);
  const cartAnimation = useRef(new Animated.Value(width / 2)).current;

  // Falling items
  const [fallingItems, setFallingItems] = useState<any[]>([]);
  const [spawnRate, setSpawnRate] = useState(2000);

  // Visual feedback
  const [tapIndicators, setTapIndicators] = useState<any[]>([]);
  const [showStartScreen, setShowStartScreen] = useState(true);

  // Boost state
  const [boostAvailable, setBoostAvailable] = useState(true);
  const [boostCooldown, setBoostCooldown] = useState(0);

  // Systems
  const collisionHandler = useRef<CollisionHandler | null>(null);
  const comboSystem = useRef(new ComboSystem()).current;

  // Timers
  const gameTimer = useRef<NodeJS.Timeout | null>(null);
  const spawnTimer = useRef<NodeJS.Timeout | null>(null);
  const boostTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize collision handler
  useEffect(() => {
    collisionHandler.current = new CollisionHandler({
      onScoreChange: (change) => setScore((prev) => prev + change),
      onCoinChange: (change) => setCoins((prev) => prev + change),
      onLifeChange: (change) => setLives((prev) => Math.max(0, prev + change)),
      onPowerUpActivate: (type, duration) => {
        console.log(`Power-up activated: ${type} for ${duration}ms`);
      },
      onItemCollect: (itemId) => {
        setFallingItems((prev) => prev.filter((item) => item.id !== itemId));
        // Haptic feedback on collection
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onComboUpdate: (newCombo) => {
        setCombo(newCombo);
        if (newCombo > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
      onAchievement: (achievement) => {
        console.log(`Achievement: ${achievement}`);
      },
      onSoundPlay: (sound) => {
        console.log(`Sound: ${sound}`);
      },
    });
  }, []);

  // Handle touch movement
  const handleTouchMove = useCallback(
    (touchX: number) => {
      if (!isGameActive || isPaused) return;

      const minPos = cartSize / 2;
      const maxPos = width - cartSize / 2;
      const targetPos = Math.max(minPos, Math.min(maxPos, touchX));

      setCartPosition(targetPos);
      setIsCartMoving(true);

      // Smooth animation
      Animated.timing(cartAnimation, {
        toValue: targetPos,
        duration: 100,
        useNativeDriver: false,
      }).start();
    },
    [isGameActive, isPaused, cartSize]
  );

  // Handle tap
  const handleTap = useCallback(
    (touchX: number) => {
      if (!isGameActive || isPaused) return;

      // Show tap indicator
      const indicator = {
        id: Date.now(),
        x: touchX,
        y: height - 150, // Near cart level
      };
      setTapIndicators((prev) => [...prev, indicator]);

      const minPos = cartSize / 2;
      const maxPos = width - cartSize / 2;
      const targetPos = Math.max(minPos, Math.min(maxPos, touchX));

      setCartPosition(targetPos);
      setIsCartMoving(true);

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Spring animation for tap
      Animated.spring(cartAnimation, {
        toValue: targetPos,
        tension: 50,
        friction: 8,
        useNativeDriver: false,
      }).start(() => {
        setIsCartMoving(false);
      });
    },
    [isGameActive, isPaused, cartSize]
  );

  // Remove tap indicator
  const removeTapIndicator = useCallback((id: number) => {
    setTapIndicators((prev) => prev.filter((ind) => ind.id !== id));
  }, []);

  // Start game
  const startGame = useCallback(() => {
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
    setSpawnRate(2000);

    // Start timers
    gameTimer.current = setInterval(() => {
      setTimeSurvived((prev) => prev + 1);
    }, 1000);

    startItemSpawning();
  }, []);

  // Spawn items
  const startItemSpawning = () => {
    const spawn = () => {
      if (!isPaused) {
        spawnItem();
      }

      // Dynamic spawn rate based on level
      const rate = Math.max(500, 2000 - level * 100);
      spawnTimer.current = setTimeout(spawn, rate);
    };
    spawn();
  };

  // Spawn a single item
  const spawnItem = () => {
    const types = ['coin', 'gem', 'diamond', 'bomb'];
    const weights = [60, 25, 10, 5]; // Probability weights

    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedType = 'coin';

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        selectedType = types[i];
        break;
      }
    }

    const newItem = {
      id: Date.now() + Math.random(),
      x: Math.random() * (width - 40) + 20,
      y: -50,
      type: selectedType,
      speed: 2 + level * 0.2, // Speed increases with level
    };

    setFallingItems((prev) => [...prev, newItem]);
  };

  // Check collisions
  useEffect(() => {
    if (!isGameActive || isPaused) return;

    const checkInterval = setInterval(() => {
      const cart = {
        x: cartPosition,
        y: height - 120,
        width: cartSize,
        height: cartSize * 0.7,
      };

      fallingItems.forEach((item) => {
        if (CollisionDetection.checkItemCollision(item, cart)) {
          collisionHandler.current?.handleItemCollision(item.type, item.id);

          // Update combo
          if (item.type !== 'bomb') {
            const newCombo = comboSystem.addHit();
            setCombo(newCombo.count);
          } else {
            comboSystem.reset();
            setCombo(0);
          }
        }
      });

      // Remove items that fell off screen
      setFallingItems((prev) => prev.filter((item) => item.y < height));
    }, 16);

    return () => clearInterval(checkInterval);
  }, [isGameActive, isPaused, cartPosition, fallingItems, cartSize]);

  // Update falling items position
  useEffect(() => {
    if (!isGameActive || isPaused) return;

    const moveInterval = setInterval(() => {
      setFallingItems((prev) =>
        prev.map((item) => ({
          ...item,
          y: item.y + item.speed,
        }))
      );
    }, 16);

    return () => clearInterval(moveInterval);
  }, [isGameActive, isPaused]);

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
    if (lives <= 0 && isGameActive) {
      endGame();
    }
  }, [lives, isGameActive]);

  // End game
  const endGame = () => {
    setIsGameActive(false);

    // Clear timers
    if (gameTimer.current) clearInterval(gameTimer.current);
    if (spawnTimer.current) clearTimeout(spawnTimer.current);
    if (boostTimer.current) clearTimeout(boostTimer.current);

    // Navigate to game over screen
    navigation.navigate('GameOver', {
      score,
      coins,
      level,
      timeSurvived,
    });
  };

  // Pause/Resume
  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Boost function
  const activateBoost = () => {
    if (!boostAvailable) return;

    setBoostAvailable(false);
    setBoostCooldown(10);

    // Double speed for 5 seconds
    setSpawnRate((prev) => prev / 2);

    // Cooldown timer
    let cooldown = 10;
    boostTimer.current = setInterval(() => {
      cooldown--;
      setBoostCooldown(cooldown);

      if (cooldown <= 0) {
        setBoostAvailable(true);
        setSpawnRate((prev) => prev * 2);
        if (boostTimer.current) {
          clearInterval(boostTimer.current);
        }
      }
    }, 1000);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Start screen
  if (showStartScreen) {
    return (
      <View style={styles.startScreen}>
        <Text style={styles.title}>Pot of Gold</Text>
        <Text style={styles.subtitle}>Tap anywhere to move the cart!</Text>
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchHandler onMove={handleTouchMove} onTap={handleTap} enabled={isGameActive && !isPaused}>
      <View style={styles.container}>
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

          {/* Falling Items */}
          <FallingItems
            items={fallingItems}
            onItemCollect={(id) => {
              setFallingItems((prev) => prev.filter((item) => item.id !== id));
            }}
          />

          {/* Tap Indicators */}
          {tapIndicators.map((indicator) => (
            <TapIndicator
              key={indicator.id}
              x={indicator.x}
              y={indicator.y}
              onComplete={() => removeTapIndicator(indicator.id)}
            />
          ))}

          {/* Mine Cart */}
          <Animated.View
            style={[
              styles.cartContainer,
              {
                left: Animated.subtract(cartAnimation, cartSize / 2),
              },
            ]}
          >
            <MineCart
              position={cartPosition}
              size={cartSize}
              isTurboActive={!boostAvailable}
              onWheelSpin={() => {}}
              activeSkin={null}
            />
          </Animated.View>
        </View>

        {/* Pause Overlay */}
        {isPaused && (
          <View style={styles.pauseOverlay}>
            <Text style={styles.pauseText}>PAUSED</Text>
            <TouchableOpacity style={styles.resumeButton} onPress={togglePause}>
              <Text style={styles.resumeButtonText}>Resume</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
