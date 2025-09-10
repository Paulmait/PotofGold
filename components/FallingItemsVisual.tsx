import React, { useMemo, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  Platform,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface FallingItem {
  id: string;
  type: string;
  x: number;
  y: number;
  speed: number;
  collected: boolean;
  isPowerUp?: boolean;
  isDangerous?: boolean;
  rarity?: string;
}

interface FallingItemsVisualProps {
  items: FallingItem[];
  onItemCollect: (itemId: string) => void;
  viewportHeight?: number;
  viewportOffset?: number;
  renderBuffer?: number;
}

// Individual item component with better visuals
const FallingItemVisual = memo(({ 
  item, 
  animation,
  sparkleAnimation 
}: { 
  item: FallingItem;
  animation: Animated.Value;
  sparkleAnimation?: Animated.Value;
}) => {
  const itemStyle = useMemo(() => getItemStyle(item), [item.type]);
  const emoji = useMemo(() => getItemEmoji(item.type), [item.type]);
  
  if (item.collected) return null;

  return (
    <Animated.View
      style={[
        styles.itemContainer,
        itemStyle,
        {
          left: item.x - 25, // Center the item
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, height],
                outputRange: [item.y, height],
              }),
            },
            {
              scale: animation.interpolate({
                inputRange: [0, height * 0.8, height],
                outputRange: [1, 1.2, 0.9],
              }),
            },
            ...(item.type === 'diamond' || item.type === 'gem' ? [{
              rotate: animation.interpolate({
                inputRange: [0, height],
                outputRange: ['0deg', '360deg'],
              }),
            }] : []),
          ],
        },
      ]}
    >
      {/* Main item visual */}
      <View style={styles.itemInner}>
        <Text style={styles.itemEmoji}>{emoji}</Text>
      </View>
      
      {/* Sparkle effect for special items */}
      {sparkleAnimation && (
        <Animated.View 
          style={[
            styles.sparkleEffect,
            {
              opacity: sparkleAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
              transform: [{ 
                scale: sparkleAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.3],
                })
              }],
            }
          ]} 
        />
      )}
      
      {/* Glow effect for power-ups */}
      {item.isPowerUp && (
        <View style={styles.powerUpGlow} />
      )}
      
      {/* Danger warning for bombs */}
      {item.type === 'bomb' && (
        <Animated.View 
          style={[
            styles.dangerWarning,
            {
              opacity: animation.interpolate({
                inputRange: [0, height],
                outputRange: [1, 1],
              }),
              transform: [{
                scale: animation.interpolate({
                  inputRange: [0, height/2, height],
                  outputRange: [1, 1.5, 1],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.dangerText}>⚠️</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.collected === nextProps.item.collected &&
         prevProps.item.y === nextProps.item.y;
});

// Main component
const FallingItemsVisual: React.FC<FallingItemsVisualProps> = memo(({
  items,
  onItemCollect,
  viewportHeight = height,
  viewportOffset = 0,
  renderBuffer = 100,
}) => {
  // Filter visible items
  const visibleItems = useMemo(() => {
    const minY = viewportOffset - renderBuffer;
    const maxY = viewportOffset + viewportHeight + renderBuffer;
    
    return items.filter(item => {
      return item.y >= minY && item.y <= maxY && !item.collected;
    });
  }, [items, viewportOffset, viewportHeight, renderBuffer]);

  // Animation cache
  const animationsCache = useMemo(() => {
    const cache = new Map<string, Animated.Value>();
    visibleItems.forEach(item => {
      if (!cache.has(item.id)) {
        const anim = new Animated.Value(0);
        cache.set(item.id, anim);
        
        // Start falling animation
        Animated.timing(anim, {
          toValue: height,
          duration: (height - item.y) / item.speed * 1000,
          useNativeDriver: true,
        }).start();
      }
    });
    return cache;
  }, [visibleItems]);

  // Sparkle animations
  const sparkleAnimationsCache = useMemo(() => {
    const cache = new Map<string, Animated.Value>();
    const sparkleTypes = ['coin', 'gem', 'diamond', 'magnet', 'shield', 'doublePoints', 'timeBonus'];
    
    visibleItems
      .filter(item => sparkleTypes.includes(item.type))
      .forEach(item => {
        if (!cache.has(item.id)) {
          const sparkleAnim = new Animated.Value(0);
          cache.set(item.id, sparkleAnim);
          
          Animated.loop(
            Animated.sequence([
              Animated.timing(sparkleAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(sparkleAnim, {
                toValue: 0,
                duration: 1500,
                useNativeDriver: true,
              }),
            ])
          ).start();
        }
      });
    return cache;
  }, [visibleItems]);

  return (
    <View style={styles.container} pointerEvents="none">
      {visibleItems.map(item => {
        const animation = animationsCache.get(item.id);
        const sparkleAnimation = sparkleAnimationsCache.get(item.id);
        
        if (!animation) return null;
        
        return (
          <FallingItemVisual
            key={item.id}
            item={item}
            animation={animation}
            sparkleAnimation={sparkleAnimation}
          />
        );
      })}
    </View>
  );
});

// Helper functions
function getItemStyle(item: FallingItem) {
  const baseStyle = {
    position: 'absolute' as const,
    width: 50,
    height: 50,
    zIndex: item.isPowerUp ? 10 : 5,
  };

  const typeStyles: { [key: string]: any } = {
    // Treasures - golden/shiny appearance
    coin: {
      backgroundColor: 'rgba(255, 215, 0, 0.15)',
      borderRadius: 25,
      borderWidth: 2,
      borderColor: '#FFD700',
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 5,
    },
    gem: {
      backgroundColor: 'rgba(255, 20, 147, 0.15)',
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#FF1493',
      shadowColor: '#FF1493',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 5,
    },
    diamond: {
      backgroundColor: 'rgba(185, 242, 255, 0.15)',
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#B9F2FF',
      shadowColor: '#B9F2FF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
      elevation: 6,
    },
    // Power-ups - glowing appearance
    magnet: {
      backgroundColor: 'rgba(255, 0, 0, 0.2)',
      borderRadius: 25,
      borderWidth: 3,
      borderColor: '#FF4444',
      shadowColor: '#FF0000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 8,
    },
    shield: {
      backgroundColor: 'rgba(135, 206, 235, 0.2)',
      borderRadius: 15,
      borderWidth: 3,
      borderColor: '#87CEEB',
      shadowColor: '#87CEEB',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 8,
    },
    doublePoints: {
      backgroundColor: 'rgba(255, 165, 0, 0.2)',
      borderRadius: 10,
      borderWidth: 3,
      borderColor: '#FFA500',
      shadowColor: '#FFA500',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 8,
    },
    timeBonus: {
      backgroundColor: 'rgba(50, 205, 50, 0.2)',
      borderRadius: 25,
      borderWidth: 3,
      borderColor: '#32CD32',
      shadowColor: '#32CD32',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 8,
    },
    // DANGEROUS - Bomb with warning appearance
    bomb: {
      backgroundColor: 'rgba(255, 0, 0, 0.3)',
      borderRadius: 25,
      borderWidth: 3,
      borderColor: '#FF0000',
      borderStyle: 'dashed',
      shadowColor: '#FF0000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 10,
      // Add pulsing red background
      ...Platform.select({
        web: {
          animation: 'pulse 1s infinite',
        },
        default: {},
      }),
    },
  };

  return { ...baseStyle, ...(typeStyles[item.type] || {}) };
}

function getItemEmoji(type: string): string {
  const emojis: { [key: string]: string } = {
    // Treasures (exact as specified)
    coin: '🪙',
    gem: '💎', 
    diamond: '💠',
    // Power-ups (exact as specified)
    magnet: '🧲',
    shield: '🛡️',
    doublePoints: '⚡',
    timeBonus: '⏰',
    // DANGEROUS ITEMS
    bomb: '💣',  // Clear bomb emoji
  };
  return emojis[type] || '✨';
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemEmoji: {
    fontSize: Platform.OS === 'web' ? 28 : 32,
    textAlign: 'center',
    // Ensure emoji renders properly on web
    fontFamily: Platform.select({
      web: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      default: undefined,
    }),
  },
  sparkleEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
  },
  dangerWarning: {
    position: 'absolute',
    top: -15,
    right: -15,
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFF00',
  },
  dangerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  powerUpGlow: {
    position: 'absolute',
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default FallingItemsVisual;