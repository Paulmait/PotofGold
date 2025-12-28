import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export interface GameItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  speed: number;
  collected: boolean;
  value: number;
  special?: boolean;
}

export type ItemType =
  // Basic collectibles
  | 'goldCoin'
  | 'silverCoin'
  | 'bronzeCoin'
  // Lucky items
  | 'horseshoe'
  | 'fourLeafClover'
  | 'shamrock'
  // Mystery crates
  | 'mysteryCrateOrange'
  | 'mysteryCrateBrown'
  | 'mysteryCratePurple'
  // Gift boxes
  | 'giftBoxRed'
  | 'giftBoxOrange'
  // Power-ups
  | 'stopwatch'
  | 'magnet'
  | 'multiplier'
  // Mine carts with state flags
  | 'cartTexas'
  | 'cartCalifornia'
  | 'cartFlorida'
  | 'cartNewYork'
  | 'cartArizona'
  // Special effects
  | 'starBurst'
  | 'sparkle';

interface GameItemsProps {
  items: GameItem[];
  onItemCollect: (item: GameItem) => void;
  isPaused: boolean;
}

export default function GameItems({ items, onItemCollect, isPaused }: GameItemsProps) {
  const itemAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const rotationAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const sparkleAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  useEffect(() => {
    items.forEach((item) => {
      if (!itemAnimations[item.id]) {
        // Initialize animations
        itemAnimations[item.id] = new Animated.Value(item.y);
        rotationAnimations[item.id] = new Animated.Value(0);
        sparkleAnimations[item.id] = new Animated.Value(0);

        // Start falling animation
        if (!isPaused && !item.collected) {
          Animated.timing(itemAnimations[item.id], {
            toValue: height + 100,
            duration: ((height - item.y) / item.speed) * 1000,
            useNativeDriver: true,
          }).start();

          // Rotation for coins and special items
          if (item.type.includes('Coin') || item.type.includes('clover')) {
            Animated.loop(
              Animated.timing(rotationAnimations[item.id], {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
              })
            ).start();
          }

          // Sparkle effect for special items
          if (item.special || item.type.includes('gift') || item.type.includes('mystery')) {
            Animated.loop(
              Animated.sequence([
                Animated.timing(sparkleAnimations[item.id], {
                  toValue: 1,
                  duration: 1000,
                  useNativeDriver: true,
                }),
                Animated.timing(sparkleAnimations[item.id], {
                  toValue: 0,
                  duration: 1000,
                  useNativeDriver: true,
                }),
              ])
            ).start();
          }
        }
      }
    });
  }, [items, isPaused]);

  const getItemContent = (item: GameItem) => {
    const baseSize = 50;

    switch (item.type) {
      // Coins
      case 'goldCoin':
        return (
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={[styles.coin, { width: baseSize, height: baseSize }]}
          >
            <Text style={styles.coinText}>💰</Text>
          </LinearGradient>
        );

      case 'silverCoin':
        return (
          <LinearGradient
            colors={['#C0C0C0', '#808080']}
            style={[styles.coin, { width: baseSize * 0.9, height: baseSize * 0.9 }]}
          >
            <Text style={styles.coinText}>🪙</Text>
          </LinearGradient>
        );

      case 'bronzeCoin':
        return (
          <LinearGradient
            colors={['#CD7F32', '#8B4513']}
            style={[styles.coin, { width: baseSize * 0.8, height: baseSize * 0.8 }]}
          >
            <Text style={styles.coinText}>🟫</Text>
          </LinearGradient>
        );

      // Lucky items
      case 'horseshoe':
        return (
          <View style={[styles.luckyItem, { width: baseSize, height: baseSize }]}>
            <Text style={styles.itemEmoji}>🧲</Text>
          </View>
        );

      case 'fourLeafClover':
        return (
          <View style={[styles.luckyItem, { width: baseSize, height: baseSize }]}>
            <Text style={styles.itemEmoji}>🍀</Text>
          </View>
        );

      case 'shamrock':
        return (
          <View style={[styles.luckyItem, { width: baseSize * 0.9, height: baseSize * 0.9 }]}>
            <Text style={styles.itemEmoji}>☘️</Text>
          </View>
        );

      // Mystery crates
      case 'mysteryCrateOrange':
        return (
          <LinearGradient
            colors={['#FF8C00', '#FF6347']}
            style={[styles.crate, { width: baseSize * 1.2, height: baseSize * 1.2 }]}
          >
            <Text style={styles.crateText}>?</Text>
          </LinearGradient>
        );

      case 'mysteryCrateBrown':
        return (
          <LinearGradient
            colors={['#8B4513', '#654321']}
            style={[styles.crate, { width: baseSize * 1.2, height: baseSize * 1.2 }]}
          >
            <Text style={styles.crateText}>?</Text>
          </LinearGradient>
        );

      case 'mysteryCratePurple':
        return (
          <LinearGradient
            colors={['#9370DB', '#8A2BE2']}
            style={[styles.crate, { width: baseSize * 1.3, height: baseSize * 1.3 }]}
          >
            <Text style={styles.crateText}>?</Text>
          </LinearGradient>
        );

      // Gift boxes
      case 'giftBoxRed':
        return (
          <LinearGradient
            colors={['#FF0000', '#DC143C']}
            style={[styles.giftBox, { width: baseSize * 1.1, height: baseSize * 1.1 }]}
          >
            <View style={styles.ribbon} />
            <Text style={styles.giftEmoji}>🎁</Text>
          </LinearGradient>
        );

      case 'giftBoxOrange':
        return (
          <LinearGradient
            colors={['#FFA500', '#FF8C00']}
            style={[styles.giftBox, { width: baseSize * 1.1, height: baseSize * 1.1 }]}
          >
            <View style={styles.ribbon} />
            <Text style={styles.giftEmoji}>🎁</Text>
          </LinearGradient>
        );

      // Power-ups
      case 'stopwatch':
        return (
          <View style={[styles.powerUp, { width: baseSize, height: baseSize }]}>
            <Text style={styles.powerUpEmoji}>⏱️</Text>
          </View>
        );

      case 'magnet':
        return (
          <View style={[styles.powerUp, { width: baseSize, height: baseSize }]}>
            <Text style={styles.powerUpEmoji}>🧲</Text>
          </View>
        );

      case 'multiplier':
        return (
          <LinearGradient
            colors={['#FFD700', '#FF6347']}
            style={[styles.powerUp, { width: baseSize, height: baseSize }]}
          >
            <Text style={styles.multiplierText}>2X</Text>
          </LinearGradient>
        );

      // Mine carts with state flags
      case 'cartTexas':
        return (
          <View style={[styles.mineCart, { width: baseSize * 1.5, height: baseSize * 1.2 }]}>
            <View style={styles.cartBody}>
              <Text style={styles.cartFlag}>🌟</Text>
            </View>
            <View style={styles.cartWheels} />
          </View>
        );

      case 'cartCalifornia':
        return (
          <View style={[styles.mineCart, { width: baseSize * 1.5, height: baseSize * 1.2 }]}>
            <View style={[styles.cartBody, { backgroundColor: '#FFD700' }]}>
              <Text style={styles.cartFlag}>🐻</Text>
            </View>
            <View style={styles.cartWheels} />
          </View>
        );

      case 'cartFlorida':
        return (
          <View style={[styles.mineCart, { width: baseSize * 1.5, height: baseSize * 1.2 }]}>
            <View style={[styles.cartBody, { backgroundColor: '#FFA500' }]}>
              <Text style={styles.cartFlag}>🌴</Text>
            </View>
            <View style={styles.cartWheels} />
          </View>
        );

      // Special effects
      case 'starBurst':
        return (
          <View style={[styles.effect, { width: baseSize * 0.8, height: baseSize * 0.8 }]}>
            <Text style={styles.effectEmoji}>✨</Text>
          </View>
        );

      case 'sparkle':
        return (
          <View style={[styles.effect, { width: baseSize * 0.6, height: baseSize * 0.6 }]}>
            <Text style={styles.effectEmoji}>⭐</Text>
          </View>
        );

      default:
        return (
          <View style={[styles.defaultItem, { width: baseSize, height: baseSize }]}>
            <Text style={styles.defaultEmoji}>💎</Text>
          </View>
        );
    }
  };

  const handleItemTouch = (item: GameItem) => {
    if (!item.collected && !isPaused) {
      // Haptic feedback for collection
      Haptics.impactAsync(
        item.type.includes('mystery') || item.type.includes('gift')
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Light
      );
      onItemCollect(item);
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {items.map((item) => {
        if (item.collected) return null;

        const fallAnimation = itemAnimations[item.id];
        const rotateAnimation = rotationAnimations[item.id];
        const sparkleAnimation = sparkleAnimations[item.id];

        if (!fallAnimation) return null;

        return (
          <Animated.View
            key={item.id}
            style={[
              styles.itemContainer,
              {
                left: item.x,
                transform: [
                  { translateY: fallAnimation },
                  {
                    rotate:
                      rotateAnimation?.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }) || '0deg',
                  },
                  {
                    scale: item.collected ? 0 : 1,
                  },
                ],
              },
            ]}
          >
            {/* Sparkle effect overlay */}
            {(item.special || sparkleAnimation) && (
              <Animated.View
                style={[
                  styles.sparkleOverlay,
                  {
                    opacity: sparkleAnimation || 0,
                  },
                ]}
              >
                <Text style={styles.sparkleText}>✨</Text>
              </Animated.View>
            )}

            {/* Main item content */}
            {getItemContent(item)}

            {/* Value indicator for high-value items */}
            {item.value >= 100 && (
              <View style={styles.valueIndicator}>
                <Text style={styles.valueText}>+{item.value}</Text>
              </View>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  itemContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Coins
  coin: {
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  coinText: {
    fontSize: 24,
  },
  // Lucky items
  luckyItem: {
    backgroundColor: '#90EE90',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#228B22',
  },
  itemEmoji: {
    fontSize: 30,
  },
  // Mystery crates
  crate: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000',
    elevation: 8,
  },
  crateText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  // Gift boxes
  giftBox: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  ribbon: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#FFD700',
  },
  giftEmoji: {
    fontSize: 28,
  },
  // Power-ups
  powerUp: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4169E1',
  },
  powerUpEmoji: {
    fontSize: 28,
  },
  multiplierText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  // Mine carts
  mineCart: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBody: {
    backgroundColor: '#8B4513',
    borderRadius: 8,
    padding: 8,
    borderWidth: 2,
    borderColor: '#654321',
  },
  cartFlag: {
    fontSize: 24,
  },
  cartWheels: {
    position: 'absolute',
    bottom: -5,
    left: 10,
    right: 10,
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
  },
  // Effects
  effect: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectEmoji: {
    fontSize: 24,
  },
  // Default item
  defaultItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultEmoji: {
    fontSize: 24,
  },
  // Sparkle overlay
  sparkleOverlay: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sparkleText: {
    fontSize: 40,
  },
  // Value indicator
  valueIndicator: {
    position: 'absolute',
    top: -20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  valueText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
});
