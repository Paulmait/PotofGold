/**
 * Enhanced Falling Items Component V2
 * Integrates with the new intelligent spawning system
 * Provides rich visual effects and animations
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { IntelligentItemSpawner, SpawnContext } from '../utils/intelligentItemSpawner';
import { ENHANCED_ITEMS, EnhancedItemConfig, SPECIAL_EFFECTS } from '../utils/enhancedItemConfig';
import { VIPLevel } from '../src/systems/VIPSubscriptionSystem';

const { width, height } = Dimensions.get('window');

interface FallingItemProps {
  item: EnhancedItemConfig;
  position: { x: number; y: number };
  onCollect: (item: EnhancedItemConfig) => void;
  onMiss: (item: EnhancedItemConfig) => void;
  isMagnetActive: boolean;
  cartPosition: number;
  cartSize: number;
}

const FallingItem: React.FC<FallingItemProps> = ({
  item,
  position,
  onCollect,
  onMiss,
  isMagnetActive,
  cartPosition,
  cartSize,
}) => {
  const animatedY = useRef(new Animated.Value(position.y)).current;
  const animatedX = useRef(new Animated.Value(position.x)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(scale, {
        toValue: item.size || 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotation animation
    if (item.rotationSpeed && item.rotationSpeed > 0) {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 360,
          duration: 3000 / item.rotationSpeed,
          useNativeDriver: true,
        })
      ).start();
    }

    // Fall animation with magnet effect
    const fallDuration = (height / item.fallSpeed) * 10;

    if (isMagnetActive && item.magnetAttracted) {
      // Magnetic attraction effect
      const magnetRange = 150;
      const distanceToCart = Math.abs(position.x - cartPosition);

      if (distanceToCart < magnetRange) {
        // Curve towards cart
        Animated.parallel([
          Animated.timing(animatedY, {
            toValue: height - 100, // Cart position
            duration: fallDuration * 0.7,
            useNativeDriver: true,
          }),
          Animated.timing(animatedX, {
            toValue: cartPosition,
            duration: fallDuration * 0.7,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished) {
            onCollect(item);
          }
        });
        return;
      }
    }

    // Normal fall
    Animated.timing(animatedY, {
      toValue: height,
      duration: fallDuration,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        // Check if collected
        const finalX = position.x;
        const cartLeft = cartPosition - cartSize / 2;
        const cartRight = cartPosition + cartSize / 2;

        if (finalX >= cartLeft && finalX <= cartRight) {
          onCollect(item);
        } else {
          onMiss(item);
        }
      }
    });
  }, [isMagnetActive]);

  // Visual effects based on rarity
  const getRarityGlow = () => {
    switch (item.rarity) {
      case 'rare':
        return ['#4A90E2', '#357ABD'];
      case 'epic':
        return ['#9B59B6', '#8E44AD'];
      case 'legendary':
        return ['#FFD700', '#FFA500'];
      case 'mythic':
        return ['#FF1744', '#D50000'];
      case 'cosmic':
        return ['#00E5FF', '#FF00FF', '#FFD700'];
      default:
        return null;
    }
  };

  const glowColors = getRarityGlow() as string[] | null;

  return (
    <Animated.View
      style={[
        styles.itemContainer,
        {
          transform: [
            { translateX: animatedX },
            { translateY: animatedY },
            {
              rotate: rotation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }),
            },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      {glowColors && (
        <LinearGradient
          colors={glowColors}
          style={[
            styles.glowEffect,
            {
              width: 60 * (item.size || 1),
              height: 60 * (item.size || 1),
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      <View
        style={[
          styles.itemVisual,
          {
            width: 50 * (item.size || 1),
            height: 50 * (item.size || 1),
          },
        ]}
      >
        <Text
          style={[
            styles.itemEmoji,
            {
              fontSize: 30 * (item.size || 1),
            },
          ]}
        >
          {item.visual}
        </Text>

        {/* Special VIP badge */}
        {item.vipRequired && (
          <View style={styles.vipBadge}>
            <Text style={styles.vipBadgeText}>VIP</Text>
          </View>
        )}

        {/* Event badge */}
        {item.eventOnly && (
          <View style={styles.eventBadge}>
            <Text style={styles.eventBadgeText}>EVENT</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

interface EnhancedFallingItemsProps {
  isGameActive: boolean;
  level: number;
  score: number;
  combo: number;
  vipLevel: VIPLevel;
  battlePassTier: number;
  cartPosition: number;
  cartSize: number;
  activePowerUps: string[];
  onItemCollect: (item: EnhancedItemConfig, position: { x: number; y: number }) => void;
  onItemMiss: (item: EnhancedItemConfig) => void;
}

export default function EnhancedFallingItemsV2({
  isGameActive,
  level,
  score,
  combo,
  vipLevel,
  battlePassTier,
  cartPosition,
  cartSize,
  activePowerUps,
  onItemCollect,
  onItemMiss,
}: EnhancedFallingItemsProps) {
  const [fallingItems, setFallingItems] = useState<
    Array<{
      id: string;
      item: EnhancedItemConfig;
      position: { x: number; y: number };
    }>
  >([]);

  const spawner = useRef(new IntelligentItemSpawner()).current;
  const spawnTimer = useRef<ReturnType<typeof setInterval>>();
  const gameTime = useRef(0);
  const isMagnetActive = activePowerUps.includes('magnet');

  // Spawn items
  useEffect(() => {
    if (!isGameActive) {
      if (spawnTimer.current) {
        clearInterval(spawnTimer.current);
      }
      return;
    }

    // Calculate spawn rate based on level
    const baseSpawnRate = 2000; // Base: 1 item per 2 seconds
    const levelModifier = Math.max(0.5, 1 - level * 0.02); // Speed up with level
    const spawnRate = baseSpawnRate * levelModifier;

    spawnTimer.current = setInterval(() => {
      gameTime.current += spawnRate;

      const context: SpawnContext = {
        currentLevel: level,
        currentScore: score,
        comboCount: combo,
        activePowerUps,
        timeInGame: gameTime.current,
        difficultyMultiplier: 1 + level * 0.1,
        isEventActive: false, // Check for active events
      };

      const newItem = spawner.spawnNextItem(context);

      if (newItem) {
        const itemId = `${Date.now()}-${Math.random()}`;
        const xPosition = Math.random() * (width - 50) + 25;

        setFallingItems((prev) => [
          ...prev,
          {
            id: itemId,
            item: newItem,
            position: { x: xPosition, y: -100 },
          },
        ]);

        // Special spawn effects for rare items
        if (
          newItem.rarity === 'legendary' ||
          newItem.rarity === 'mythic' ||
          newItem.rarity === 'cosmic'
        ) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }, spawnRate);

    return () => {
      if (spawnTimer.current) {
        clearInterval(spawnTimer.current);
      }
    };
  }, [isGameActive, level, score, combo, vipLevel, activePowerUps]);

  const handleItemCollect = (collectedItem: EnhancedItemConfig, itemId: string) => {
    const itemData = fallingItems.find((fi) => fi.id === itemId);
    if (itemData) {
      onItemCollect(collectedItem, itemData.position);

      // Haptic feedback based on rarity
      switch (collectedItem.rarity) {
        case 'common':
        case 'uncommon':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'rare':
        case 'epic':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'legendary':
        case 'mythic':
        case 'cosmic':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    }

    setFallingItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleItemMiss = (missedItem: EnhancedItemConfig, itemId: string) => {
    onItemMiss(missedItem);
    setFallingItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  return (
    <View style={styles.container}>
      {/* Special effect overlays */}
      {activePowerUps.includes('goldenTouch') && (
        <LinearGradient
          colors={['rgba(255,215,0,0.3)', 'rgba(255,165,0,0.1)']}
          style={styles.goldenOverlay}
        />
      )}

      {activePowerUps.includes('rainbowMode') && (
        <Animated.View style={styles.rainbowOverlay}>
          <LinearGradient
            colors={['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']}
            style={styles.rainbowGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      )}

      {/* Falling items */}
      {fallingItems.map(({ id, item, position }) => (
        <FallingItem
          key={id}
          item={item}
          position={position}
          onCollect={() => handleItemCollect(item, id)}
          onMiss={() => handleItemMiss(item, id)}
          isMagnetActive={isMagnetActive}
          cartPosition={cartPosition}
          cartSize={cartSize}
        />
      ))}

      {/* VIP indicator */}
      {vipLevel > VIPLevel.NONE && (
        <View style={styles.vipIndicator}>
          <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.vipGradient}>
            <Text style={styles.vipText}>VIP {vipLevel}</Text>
          </LinearGradient>
        </View>
      )}
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
  },
  itemContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    borderRadius: 30,
    opacity: 0.6,
  },
  itemVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
  },
  itemEmoji: {
    textAlign: 'center',
  },
  vipBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  vipBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
  },
  eventBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: '#FF1744',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  eventBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFF',
  },
  goldenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  rainbowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
    pointerEvents: 'none',
  },
  rainbowGradient: {
    flex: 1,
  },
  vipIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  vipGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  vipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
});
