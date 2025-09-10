import React, { useMemo, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface FallingItem {
  id: string;
  type: string;
  x: number;
  y: number;
  speed: number;
  collected: boolean;
  rarity?: string;
}

interface VirtualFallingItemsProps {
  items: FallingItem[];
  onItemCollect: (itemId: string) => void;
  viewportHeight?: number;
  viewportOffset?: number;
  renderBuffer?: number;
}

// Memoized individual item component
const FallingItemComponent = memo(({ 
  item, 
  animation,
  sparkleAnimation 
}: { 
  item: FallingItem;
  animation: Animated.Value;
  sparkleAnimation?: Animated.Value;
}) => {
  const itemStyle = useMemo(() => getItemStyle(item), [item.type]);
  
  if (item.collected) return null;

  return (
    <Animated.View
      style={[
        itemStyle,
        {
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
                outputRange: [1, 1.1, 0.8],
              }),
            },
          ],
        },
      ]}
    >
      <ItemVisual type={item.type} sparkleAnimation={sparkleAnimation} />
      {item.rarity && <RarityIndicator rarity={item.rarity} />}
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return prevProps.item.collected === nextProps.item.collected &&
         prevProps.item.y === nextProps.item.y;
});

// Memoized item visual component
const ItemVisual = memo(({ 
  type, 
  sparkleAnimation 
}: { 
  type: string;
  sparkleAnimation?: Animated.Value;
}) => {
  const emoji = getItemEmoji(type);
  
  return (
    <View style={styles.itemContent}>
      <Text style={styles.itemEmoji}>{emoji}</Text>
      {sparkleAnimation && (
        <Animated.View 
          style={[
            styles.sparkle,
            {
              opacity: sparkleAnimation,
              transform: [{ scale: sparkleAnimation }],
            }
          ]} 
        />
      )}
    </View>
  );
});

// Memoized rarity indicator
const RarityIndicator = memo(({ rarity }: { rarity: string }) => (
  <View style={[styles.rarityIndicator, styles[`rarity_${rarity}`]]} />
));

// Main virtual scrolling component
const VirtualFallingItems: React.FC<VirtualFallingItemsProps> = memo(({
  items,
  onItemCollect,
  viewportHeight = height,
  viewportOffset = 0,
  renderBuffer = 100,
}) => {
  // Filter items within viewport + buffer
  const visibleItems = useMemo(() => {
    const minY = viewportOffset - renderBuffer;
    const maxY = viewportOffset + viewportHeight + renderBuffer;
    
    return items.filter(item => {
      // Only render items within the visible viewport + buffer
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
        
        // Start animation
        Animated.timing(anim, {
          toValue: height,
          duration: (height - item.y) / item.speed * 1000,
          useNativeDriver: true,
        }).start();
      }
    });
    return cache;
  }, [visibleItems]);

  // Sparkle animations for special items
  const sparkleAnimationsCache = useMemo(() => {
    const cache = new Map<string, Animated.Value>();
    const sparkleTypes = ['coin', 'gemstone', 'luckyStar', 'diamond', 'star'];
    
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
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(sparkleAnim, {
                toValue: 0,
                duration: 1000,
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
          <FallingItemComponent
            key={item.id}
            item={item}
            animation={animation}
            sparkleAnimation={sparkleAnimation}
          />
        );
      })}
      
      {/* Performance overlay in dev mode */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Rendered: {visibleItems.length}/{items.length} items
          </Text>
        </View>
      )}
    </View>
  );
});

// Helper functions
function getItemStyle(item: FallingItem) {
  const baseStyle = {
    position: 'absolute' as const,
    left: item.x,
    width: 30,
    height: 30,
    zIndex: 5,
  };

  const typeStyles: { [key: string]: any } = {
    coin: {
      backgroundColor: '#FFD700',
      borderRadius: 15,
      borderWidth: 2,
      borderColor: '#FFA500',
    },
    moneyBag: {
      backgroundColor: '#8B4513',
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#654321',
    },
    lightning: {
      backgroundColor: '#FFA500',
      borderRadius: 0,
    },
    magnet: {
      backgroundColor: '#FF0000',
      borderRadius: 15,
      borderWidth: 2,
      borderColor: '#8B0000',
    },
    gemstone: {
      backgroundColor: '#4169E1',
      borderRadius: 0,
      transform: [{ rotate: '45deg' }],
    },
    diamond: {
      backgroundColor: '#B9F2FF',
      borderRadius: 0,
      transform: [{ rotate: '45deg' }],
    },
    star: {
      backgroundColor: '#FFD700',
      borderRadius: 0,
    },
  };

  return { ...baseStyle, ...(typeStyles[item.type] || {}) };
}

function getItemEmoji(type: string): string {
  const emojis: { [key: string]: string } = {
    coin: '🪙',
    gem: '💎',
    diamond: '💎',
    ruby: '🔴',
    emerald: '💚',
    sapphire: '💙',
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉',
    star: '⭐',
    heart: '❤️',
    lightning: '⚡',
    shield: '🛡️',
    crown: '👑',
    trophy: '🏆',
    moneyBag: '💰',
    magnet: '🧲',
    gemstone: '💎',
    luckyStar: '🌟',
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
  itemContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemEmoji: {
    fontSize: 20,
  },
  sparkle: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
  },
  rarityIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rarity_common: {
    backgroundColor: '#FFFFFF',
  },
  rarity_uncommon: {
    backgroundColor: '#00FF00',
  },
  rarity_rare: {
    backgroundColor: '#0080FF',
  },
  rarity_epic: {
    backgroundColor: '#8000FF',
  },
  rarity_ultraRare: {
    backgroundColor: '#FFD700',
  },
  debugInfo: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 5,
  },
  debugText: {
    color: '#0F0',
    fontSize: 10,
  },
});

export default VirtualFallingItems;