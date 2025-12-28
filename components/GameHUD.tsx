/**
 * Game HUD Component
 * Displays all game metrics, scores, and item collection feedback
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface GameHUDProps {
  score: number;
  coins: number;
  gems: number;
  level: number;
  combo: number;
  multiplier: number;
  cartName: string;
  cartTier: string;
  vipLevel: number;
  activePowerUps: ActivePowerUp[];
  recentCollection: CollectionEvent[];
  onPause: () => void;
  onShop: () => void;
  onUpgrade: () => void;
}

interface ActivePowerUp {
  name: string;
  icon: string;
  timeRemaining: number;
  color: string;
}

interface CollectionEvent {
  id: string;
  type: string;
  value: number;
  icon: string;
  rarity: string;
  timestamp: number;
}

const ScoreDisplay: React.FC<{ score: number; multiplier: number }> = ({ score, multiplier }) => {
  const animatedScale = useRef(new Animated.Value(1)).current;
  const previousScore = useRef(score);

  useEffect(() => {
    if (score > previousScore.current) {
      // Pulse animation on score increase
      Animated.sequence([
        Animated.timing(animatedScale, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(animatedScale, {
          toValue: 1,
          tension: 30,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }
    previousScore.current = score;
  }, [score]);

  return (
    <View
      style={styles.scoreContainer}
      accessible={true}
      accessibilityLabel={`Score: ${score.toLocaleString()}${multiplier > 1 ? `, ${multiplier}x multiplier active` : ''}`}
    >
      <Text style={styles.scoreLabel}>SCORE</Text>
      <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
        <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
      </Animated.View>
      {multiplier > 1 && (
        <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.multiplierBadge}>
          <Text style={styles.multiplierText}>x{multiplier}</Text>
        </LinearGradient>
      )}
    </View>
  );
};

const CurrencyDisplay: React.FC<{ coins: number; gems: number }> = ({ coins, gems }) => {
  const coinAnimation = useRef(new Animated.Value(0)).current;
  const gemAnimation = useRef(new Animated.Value(0)).current;
  const prevCoins = useRef(coins);
  const prevGems = useRef(gems);

  useEffect(() => {
    if (coins > prevCoins.current) {
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
    }
    prevCoins.current = coins;
  }, [coins]);

  useEffect(() => {
    if (gems > prevGems.current) {
      Animated.sequence([
        Animated.timing(gemAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(gemAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevGems.current = gems;
  }, [gems]);

  return (
    <View
      style={styles.currencyContainer}
      accessible={true}
      accessibilityLabel={`${coins.toLocaleString()} coins, ${gems.toLocaleString()} gems`}
    >
      <Animated.View
        style={[
          styles.currencyItem,
          {
            transform: [
              {
                scale: coinAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.3],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.currencyIcon}>🪙</Text>
        <Text style={styles.currencyValue}>{coins.toLocaleString()}</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.currencyItem,
          {
            transform: [
              {
                scale: gemAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.3],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.currencyIcon}>💎</Text>
        <Text style={styles.currencyValue}>{gems.toLocaleString()}</Text>
      </Animated.View>
    </View>
  );
};

const ComboIndicator: React.FC<{ combo: number }> = ({ combo }) => {
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (combo > 0) {
      // Show combo with animation
      Animated.parallel([
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(shakeAnimation, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
              toValue: -1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
          { iterations: -1 }
        ),
      ]).start();

      // Haptic feedback for combo milestones
      if (combo === 5 || combo === 10 || combo === 20 || combo === 50) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      // Hide combo
      Animated.timing(scaleAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [combo]);

  const getComboColor = (): string[] => {
    if (combo >= 50) return ['#FF00FF', '#FFD700']; // Legendary
    if (combo >= 20) return ['#FFD700', '#FFA500']; // Gold
    if (combo >= 10) return ['#FF4500', '#FF6347']; // Orange
    if (combo >= 5) return ['#4169E1', '#1E90FF']; // Blue
    return ['#32CD32', '#90EE90']; // Green
  };

  if (combo === 0) return null;

  return (
    <Animated.View
      style={[
        styles.comboContainer,
        {
          transform: [
            { scale: scaleAnimation },
            {
              rotate: shakeAnimation.interpolate({
                inputRange: [-1, 1],
                outputRange: ['-5deg', '5deg'],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient colors={getComboColor()} style={styles.comboGradient}>
        <Text style={styles.comboText}>COMBO</Text>
        <Text style={styles.comboValue}>x{combo}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

const PowerUpDisplay: React.FC<{ powerUps: ActivePowerUp[] }> = ({ powerUps }) => {
  return (
    <View style={styles.powerUpContainer}>
      {powerUps.map((powerUp, index) => (
        <Animated.View
          key={powerUp.name}
          style={[styles.powerUpItem, { backgroundColor: powerUp.color }]}
        >
          <Text style={styles.powerUpIcon}>{powerUp.icon}</Text>
          <Text style={styles.powerUpTime}>{Math.ceil(powerUp.timeRemaining / 1000)}s</Text>
        </Animated.View>
      ))}
    </View>
  );
};

const CollectionFeedback: React.FC<{ events: CollectionEvent[] }> = ({ events }) => {
  const [visibleEvents, setVisibleEvents] = useState<CollectionEvent[]>([]);

  useEffect(() => {
    const recent = events.filter((e) => Date.now() - e.timestamp < 3000);
    setVisibleEvents(recent);
  }, [events]);

  return (
    <View style={styles.feedbackContainer}>
      {visibleEvents.map((event) => (
        <FloatingFeedback key={event.id} event={event} />
      ))}
    </View>
  );
};

const FloatingFeedback: React.FC<{ event: CollectionEvent }> = ({ event }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getRarityColor = () => {
    switch (event.rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9B59B6';
      case 'rare':
        return '#3498DB';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <Animated.View
      style={[
        styles.feedbackItem,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Text style={[styles.feedbackText, { color: getRarityColor() }]}>
        {event.icon} +{event.value}
      </Text>
    </Animated.View>
  );
};

export default function GameHUD(props: GameHUDProps) {
  const {
    score,
    coins,
    gems,
    level,
    combo,
    multiplier,
    cartName,
    cartTier,
    vipLevel,
    activePowerUps,
    recentCollection,
    onPause,
    onShop,
    onUpgrade,
  } = props;

  return (
    <View style={styles.hudContainer}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <ScoreDisplay score={score} multiplier={multiplier} />
          <View style={styles.levelDisplay}>
            <Text style={styles.levelText}>Level {level}</Text>
          </View>
        </View>

        <View style={styles.topCenter}>
          <ComboIndicator combo={combo} />
        </View>

        <View style={styles.topRight}>
          <CurrencyDisplay coins={coins} gems={gems} />
          <TouchableOpacity
            onPress={onPause}
            style={styles.pauseButton}
            accessibilityLabel="Pause game"
            accessibilityHint="Pauses the current game"
            accessibilityRole="button"
          >
            <Text style={styles.pauseIcon}>⏸️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cart Info Bar */}
      <View style={styles.cartInfoBar}>
        <LinearGradient colors={getCartTierColors(cartTier)} style={styles.cartInfoGradient}>
          <Text style={styles.cartName}>{cartName}</Text>
          {vipLevel > 0 && (
            <View style={styles.vipBadge}>
              <Text style={styles.vipText}>VIP {vipLevel}</Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Power-ups Display */}
      {activePowerUps.length > 0 && <PowerUpDisplay powerUps={activePowerUps} />}

      {/* Collection Feedback */}
      <CollectionFeedback events={recentCollection} />

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          onPress={onShop}
          style={styles.actionButton}
          accessibilityLabel="Open shop"
          accessibilityHint="Opens the in-game shop"
          accessibilityRole="button"
        >
          <LinearGradient colors={['#3498DB', '#2980B9']} style={styles.actionGradient}>
            <Text style={styles.actionIcon}>🛒</Text>
            <Text style={styles.actionLabel}>Shop</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onUpgrade}
          style={styles.actionButton}
          accessibilityLabel="Upgrade cart"
          accessibilityHint="Opens cart upgrade options"
          accessibilityRole="button"
        >
          <LinearGradient colors={['#E74C3C', '#C0392B']} style={styles.actionGradient}>
            <Text style={styles.actionIcon}>⬆️</Text>
            <Text style={styles.actionLabel}>Upgrade</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getCartTierColors = (tier: string): string[] => {
  switch (tier) {
    case 'bronze':
      return ['#CD7F32', '#8B4513'];
    case 'silver':
      return ['#C0C0C0', '#808080'];
    case 'gold':
      return ['#FFD700', '#FFA500'];
    case 'platinum':
      return ['#E5E4E2', '#C0C0C0'];
    case 'diamond':
      return ['#B9F2FF', '#00FFFF'];
    case 'legendary':
      return ['#FF00FF', '#FFD700'];
    case 'cosmic':
      return ['#000000', '#FF00FF'];
    default:
      return ['#8B4513', '#696969'];
  }
};

const styles = StyleSheet.create({
  hudContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topLeft: {
    flex: 1,
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  scoreContainer: {
    alignItems: 'flex-start',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.8,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  multiplierBadge: {
    position: 'absolute',
    right: -30,
    top: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  multiplierText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  currencyContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  currencyIcon: {
    fontSize: 20,
    marginRight: 5,
  },
  currencyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  levelDisplay: {
    marginTop: 5,
  },
  levelText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
  },
  pauseButton: {
    marginTop: 10,
    padding: 10,
  },
  pauseIcon: {
    fontSize: 24,
  },
  comboContainer: {
    alignItems: 'center',
  },
  comboGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  comboText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  comboValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  cartInfoBar: {
    marginTop: 10,
    marginHorizontal: 20,
  },
  cartInfoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 15,
  },
  cartName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  vipBadge: {
    marginLeft: 10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  powerUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  powerUpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  powerUpIcon: {
    fontSize: 20,
    marginRight: 5,
  },
  powerUpTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  feedbackContainer: {
    position: 'absolute',
    top: height * 0.3,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  feedbackItem: {
    position: 'absolute',
  },
  feedbackText: {
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  quickActions: {
    position: 'absolute',
    bottom: 100,
    right: 10,
    gap: 10,
  },
  actionButton: {
    marginVertical: 5,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 5,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
