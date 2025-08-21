import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  Image,
} from 'react-native';
import { ITEM_CONFIGS } from '../utils/itemConfig';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export interface FallingItem {
  id: string;
  type: string;
  x: number;
  y: number;
  speed: number;
  collected: boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'ultraRare';
  size?: number;
  rotation?: number;
}

interface EnhancedFallingItemsProps {
  items: FallingItem[];
  onItemCollect: (item: FallingItem) => void;
  onItemMiss: (item: FallingItem) => void;
  isPaused: boolean;
  magnetActive?: boolean;
  magnetPosition?: { x: number; y: number };
}

export default function EnhancedFallingItems({ 
  items, 
  onItemCollect, 
  onItemMiss,
  isPaused,
  magnetActive,
  magnetPosition 
}: EnhancedFallingItemsProps) {
  const itemAnimations = useRef<{ [key: string]: {
    y: Animated.Value;
    x: Animated.Value;
    rotation: Animated.Value;
    scale: Animated.Value;
    opacity: Animated.Value;
  } }>({}).current;

  // Initialize animations for new items
  useEffect(() => {
    items.forEach(item => {
      if (!itemAnimations[item.id]) {
        const config = ITEM_CONFIGS[item.type];
        if (!config) return;

        // Create animation values
        itemAnimations[item.id] = {
          y: new Animated.Value(item.y),
          x: new Animated.Value(item.x),
          rotation: new Animated.Value(0),
          scale: new Animated.Value(0),
          opacity: new Animated.Value(0),
        };

        const anims = itemAnimations[item.id];

        // Entry animation (scale and fade in)
        Animated.parallel([
          Animated.spring(anims.scale, {
            toValue: config.size || 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(anims.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        // Rotation animation if configured
        if (config.rotationSpeed && config.rotationSpeed > 0) {
          Animated.loop(
            Animated.timing(anims.rotation, {
              toValue: 360,
              duration: 3000 / config.rotationSpeed,
              useNativeDriver: true,
            })
          ).start();
        }

        // Main falling animation
        if (!isPaused) {
          const fallDuration = (height - item.y) / (item.speed * 100);
          
          // Check for magnet effect
          if (magnetActive && magnetPosition && isGoodItem(item.type)) {
            // Calculate magnetic pull
            const distance = Math.sqrt(
              Math.pow(item.x - magnetPosition.x, 2) + 
              Math.pow(item.y - magnetPosition.y, 2)
            );
            
            if (distance < 150) { // Magnet radius
              // Animate to magnet position
              Animated.parallel([
                Animated.timing(anims.x, {
                  toValue: magnetPosition.x,
                  duration: 500,
                  useNativeDriver: true,
                }),
                Animated.timing(anims.y, {
                  toValue: magnetPosition.y,
                  duration: 500,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                onItemCollect(item);
              });
            } else {
              // Normal fall
              startFallingAnimation(anims.y, height, fallDuration, item, onItemMiss);
            }
          } else {
            // Normal fall
            startFallingAnimation(anims.y, height, fallDuration, item, onItemMiss);
          }
        }
      }
    });
  }, [items, itemAnimations, isPaused, magnetActive, magnetPosition]);

  // Pause/resume animations
  useEffect(() => {
    Object.values(itemAnimations).forEach(anims => {
      if (isPaused) {
        anims.y.stopAnimation();
        anims.x.stopAnimation();
      }
    });
  }, [isPaused, itemAnimations]);

  const startFallingAnimation = (
    yAnim: Animated.Value,
    targetY: number,
    duration: number,
    item: FallingItem,
    onMiss: (item: FallingItem) => void
  ) => {
    Animated.timing(yAnim, {
      toValue: targetY,
      duration: duration * 1000,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !item.collected) {
        onMiss(item);
      }
    });
  };

  const isGoodItem = (type: string): boolean => {
    const goodItems = ['coin', 'moneyBag', 'diamond', 'goldStar', 'megaStar', 'treasureSack'];
    return goodItems.includes(type);
  };

  const renderItem = (item: FallingItem) => {
    const config = ITEM_CONFIGS[item.type];
    if (!config || !itemAnimations[item.id]) return null;

    const anims = itemAnimations[item.id];
    const rarityColors = {
      common: '#A0A0A0',
      uncommon: '#4CAF50',
      rare: '#2196F3',
      epic: '#9C27B0',
      ultraRare: '#FFD700',
    };

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.itemContainer,
          {
            transform: [
              { translateX: anims.x },
              { translateY: anims.y },
              { rotate: anims.rotation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })},
              { scale: anims.scale },
            ],
            opacity: anims.opacity,
          },
        ]}
      >
        {/* Rarity glow effect */}
        {item.rarity !== 'common' && (
          <View
            style={[
              styles.rarityGlow,
              { 
                backgroundColor: rarityColors[item.rarity],
                shadowColor: rarityColors[item.rarity],
              },
            ]}
          />
        )}

        {/* Item visual */}
        {config.assetPath ? (
          <Image
            source={{ uri: config.assetPath }}
            style={[
              styles.itemImage,
              { 
                width: 40 * (config.size || 1),
                height: 40 * (config.size || 1),
              },
            ]}
            resizeMode="contain"
          />
        ) : (
          <Text style={[styles.itemEmoji, { fontSize: 30 * (config.size || 1) }]}>
            {config.visual}
          </Text>
        )}

        {/* Special effect indicators */}
        {config.specialEffect && (
          <View style={styles.effectIndicator}>
            <Text style={styles.effectText}>
              {getEffectSymbol(config.specialEffect)}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const getEffectSymbol = (effect: string): string => {
    const symbols: { [key: string]: string } = {
      speedBoost: '⚡',
      magnetPull: '🧲',
      frenzyMode: '🌟',
      scoreMultiplier: '×2',
      explosion: '💥',
      damage: '❌',
      addGem: '💎',
      mysteryReward: '❓',
    };
    return symbols[effect] || '';
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {items.map(renderItem)}
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
    width: 50,
    height: 50,
  },
  rarityGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.3,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  itemImage: {
    position: 'absolute',
  },
  itemEmoji: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  effectIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 2,
    minWidth: 20,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});