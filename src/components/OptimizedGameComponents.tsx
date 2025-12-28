import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Image } from 'expo-image';

// Optimized Coin Component
interface OptimizedCoinProps {
  id: string;
  x: number;
  y: number;
  value: number;
  type: 'gold' | 'silver' | 'bronze';
  onCollect: (id: string, value: number) => void;
}

export const OptimizedCoin = memo<OptimizedCoinProps>(
  ({ id, x, y, value, type, onCollect }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const rotation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      // Spin animation
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }, [rotation]);

    const handlePress = useCallback(() => {
      // Collection animation
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onCollect(id, value);
      });
    }, [id, value, onCollect, animatedValue]);

    const coinColor = useMemo(() => {
      switch (type) {
        case 'gold':
          return '#FFD700';
        case 'silver':
          return '#C0C0C0';
        case 'bronze':
          return '#CD7F32';
      }
    }, [type]);

    const scale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.5],
    });

    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    });

    const spin = rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        style={[
          styles.coin,
          {
            left: x,
            top: y,
            backgroundColor: coinColor,
            opacity,
            transform: [{ scale }, { rotateY: spin }],
          },
        ]}
      >
        <Pressable onPress={handlePress} style={styles.coinPressable}>
          <Text style={styles.coinValue}>{value}</Text>
        </Pressable>
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.x === nextProps.x &&
      prevProps.y === nextProps.y &&
      prevProps.value === nextProps.value &&
      prevProps.type === nextProps.type
    );
  }
);

OptimizedCoin.displayName = 'OptimizedCoin';

// Optimized Score Display
interface OptimizedScoreProps {
  score: number;
  multiplier: number;
  combo: number;
}

export const OptimizedScore = memo<OptimizedScoreProps>(({ score, multiplier, combo }) => {
  const animatedScore = useRef(new Animated.Value(0)).current;
  const previousScore = useRef(score);

  useEffect(() => {
    if (score !== previousScore.current) {
      Animated.timing(animatedScore, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        animatedScore.setValue(0);
      });
      previousScore.current = score;
    }
  }, [score, animatedScore]);

  const formattedScore = useMemo(() => score.toLocaleString(), [score]);

  const multiplierColor = useMemo(() => {
    if (multiplier >= 5) return '#FF0000';
    if (multiplier >= 3) return '#FFA500';
    if (multiplier >= 2) return '#FFD700';
    return '#FFFFFF';
  }, [multiplier]);

  const comboText = useMemo(() => {
    if (combo >= 50) return 'MEGA COMBO!';
    if (combo >= 20) return 'SUPER COMBO!';
    if (combo >= 10) return 'COMBO!';
    return '';
  }, [combo]);

  const scale = animatedScore.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.2, 1],
  });

  return (
    <View style={styles.scoreContainer}>
      <Animated.Text style={[styles.scoreText, { transform: [{ scale }] }]}>
        {formattedScore}
      </Animated.Text>
      {multiplier > 1 && (
        <Text style={[styles.multiplierText, { color: multiplierColor }]}>x{multiplier}</Text>
      )}
      {combo > 0 && (
        <View style={styles.comboContainer}>
          <Text style={styles.comboText}>{comboText}</Text>
          <Text style={styles.comboCount}>{combo}</Text>
        </View>
      )}
    </View>
  );
});

OptimizedScore.displayName = 'OptimizedScore';

// Optimized Power-Up Display
interface PowerUpDisplayProps {
  powerUps: Array<{
    id: string;
    type: string;
    duration: number;
    remainingTime: number;
  }>;
}

export const OptimizedPowerUpDisplay = memo<PowerUpDisplayProps>(({ powerUps }) => {
  const activePowerUps = useMemo(() => powerUps.filter((p) => p.remainingTime > 0), [powerUps]);

  return (
    <View style={styles.powerUpContainer}>
      {activePowerUps.map((powerUp) => (
        <PowerUpItem key={powerUp.id} powerUp={powerUp} />
      ))}
    </View>
  );
});

const PowerUpItem = memo<{ powerUp: any }>(({ powerUp }) => {
  const progress = useMemo(
    () => powerUp.remainingTime / powerUp.duration,
    [powerUp.remainingTime, powerUp.duration]
  );

  const progressColor = useMemo(() => {
    if (progress > 0.5) return '#00FF00';
    if (progress > 0.25) return '#FFA500';
    return '#FF0000';
  }, [progress]);

  return (
    <View style={styles.powerUpItem}>
      <Text style={styles.powerUpType}>{powerUp.type}</Text>
      <View style={styles.powerUpProgress}>
        <View
          style={[
            styles.powerUpProgressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: progressColor,
            },
          ]}
        />
      </View>
    </View>
  );
});

PowerUpItem.displayName = 'PowerUpItem';

// Optimized Cart Component with Heavy Computations
interface OptimizedCartProps {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  skin: string;
  trail: string;
  capacity: number;
  items: number;
}

export const OptimizedCart = memo<OptimizedCartProps>(
  ({ position, velocity, skin, trail, capacity, items }) => {
    const animatedX = useRef(new Animated.Value(position.x)).current;
    const animatedY = useRef(new Animated.Value(position.y)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(animatedX, {
          toValue: position.x,
          duration: 16,
          useNativeDriver: true,
        }),
        Animated.timing(animatedY, {
          toValue: position.y,
          duration: 16,
          useNativeDriver: true,
        }),
      ]).start();
    }, [position, animatedX, animatedY]);

    const fillPercentage = useMemo(
      () => Math.min(100, (items / capacity) * 100),
      [items, capacity]
    );

    const cartTint = useMemo(() => {
      if (fillPercentage >= 90) return '#FF0000';
      if (fillPercentage >= 70) return '#FFA500';
      return '#00FF00';
    }, [fillPercentage]);

    const speed = useMemo(
      () => Math.sqrt(velocity.x ** 2 + velocity.y ** 2),
      [velocity.x, velocity.y]
    );

    const rotation = useMemo(() => {
      if (Math.abs(velocity.x) < 0.1) return 0;
      return velocity.x > 0 ? 5 : -5;
    }, [velocity.x]);

    return (
      <Animated.View
        style={[
          styles.cart,
          {
            transform: [
              { translateX: animatedX },
              { translateY: animatedY },
              { rotate: `${rotation}deg` },
            ],
          },
        ]}
      >
        <View style={[styles.cartBody, { borderColor: cartTint }]}>
          <View
            style={[
              styles.cartFill,
              {
                height: `${fillPercentage}%`,
                backgroundColor: cartTint,
              },
            ]}
          />
        </View>
        {speed > 5 && trail && (
          <View style={styles.trailEffect}>{/* Trail particles would go here */}</View>
        )}
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    // Deep comparison for nested objects
    return (
      prevProps.position.x === nextProps.position.x &&
      prevProps.position.y === nextProps.position.y &&
      prevProps.velocity.x === nextProps.velocity.x &&
      prevProps.velocity.y === nextProps.velocity.y &&
      prevProps.skin === nextProps.skin &&
      prevProps.trail === nextProps.trail &&
      prevProps.capacity === nextProps.capacity &&
      prevProps.items === nextProps.items
    );
  }
);

OptimizedCart.displayName = 'OptimizedCart';

// Heavy computation example with useMemo
export const useGameCalculations = (items: any[], multipliers: number[], bonuses: any[]) => {
  const totalScore = useMemo(() => {
    return items.reduce((acc, item) => {
      const baseValue = item.value || 0;
      const multiplier = multipliers.reduce((m, mult) => m * mult, 1);
      const bonus = bonuses
        .filter((b) => b.appliesTo === item.type)
        .reduce((sum, b) => sum + b.value, 0);
      return acc + baseValue * multiplier + bonus;
    }, 0);
  }, [items, multipliers, bonuses]);

  const averageValue = useMemo(() => {
    if (items.length === 0) return 0;
    return totalScore / items.length;
  }, [totalScore, items.length]);

  const bestItem = useMemo(() => {
    return items.reduce((best, item) => {
      if (!best || item.value > best.value) return item;
      return best;
    }, null);
  }, [items]);

  const itemsByType = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
      },
      {} as Record<string, any[]>
    );
  }, [items]);

  const projectedScore = useMemo(() => {
    // Complex projection calculation
    const growthRate = 1.1;
    const timeRemaining = 120; // seconds
    const itemsPerSecond = items.length / 60;
    const projectedItems = itemsPerSecond * timeRemaining;
    return Math.floor(totalScore + projectedItems * averageValue * growthRate);
  }, [totalScore, averageValue, items.length]);

  return {
    totalScore,
    averageValue,
    bestItem,
    itemsByType,
    projectedScore,
  };
};

// Optimized particle system
export const OptimizedParticles = memo<{
  particles: Array<{ id: string; x: number; y: number; type: string }>;
  maxParticles?: number;
}>(({ particles, maxParticles = 100 }) => {
  const visibleParticles = useMemo(
    () => particles.slice(0, maxParticles),
    [particles, maxParticles]
  );

  return (
    <View style={styles.particleContainer} pointerEvents="none">
      {visibleParticles.map((particle) => (
        <Particle key={particle.id} {...particle} />
      ))}
    </View>
  );
});

const Particle = memo<{ id: string; x: number; y: number; type: string }>(({ x, y, type }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const particleColor = useMemo(() => {
    switch (type) {
      case 'gold':
        return '#FFD700';
      case 'explosion':
        return '#FF4500';
      case 'star':
        return '#FFFFFF';
      default:
        return '#888888';
    }
  }, [type]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: x,
          top: y,
          backgroundColor: particleColor,
          opacity,
        },
      ]}
    />
  );
});

Particle.displayName = 'Particle';

const styles = StyleSheet.create({
  coin: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinPressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scoreContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  multiplierText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  comboContainer: {
    marginTop: 5,
  },
  comboText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  comboCount: {
    fontSize: 24,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  powerUpContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
  },
  powerUpItem: {
    marginVertical: 5,
  },
  powerUpType: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  powerUpProgress: {
    width: 100,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  powerUpProgressFill: {
    height: '100%',
  },
  cart: {
    position: 'absolute',
    width: 60,
    height: 60,
  },
  cartBody: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderRadius: 5,
    overflow: 'hidden',
  },
  cartFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.3,
  },
  trailEffect: {
    position: 'absolute',
    width: 100,
    height: 20,
    left: -40,
    top: 20,
  },
  particleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default {
  OptimizedCoin,
  OptimizedScore,
  OptimizedPowerUpDisplay,
  OptimizedCart,
  OptimizedParticles,
  useGameCalculations,
};
