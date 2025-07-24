import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface FallingItem {
  id: string;
  type: 'coin' | 'star' | 'lightning' | 'magnet';
  x: number;
  y: number;
  speed: number;
  collected: boolean;
}

interface FallingItemsProps {
  items: FallingItem[];
  onItemCollect: (itemId: string) => void;
}

export default function FallingItems({ items, onItemCollect }: FallingItemsProps) {
  const itemAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Initialize animations for new items
  useEffect(() => {
    items.forEach(item => {
      if (!itemAnimations[item.id]) {
        itemAnimations[item.id] = new Animated.Value(0);
        
        // Start falling animation
        Animated.timing(itemAnimations[item.id], {
          toValue: height,
          duration: (height - item.y) / item.speed * 1000,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [items, itemAnimations]);

  const getItemStyle = (item: FallingItem) => {
    const baseStyle = {
      position: 'absolute' as const,
      left: item.x,
      width: 30,
      height: 30,
      zIndex: 5,
    };

    switch (item.type) {
      case 'coin':
        return {
          ...baseStyle,
          backgroundColor: '#FFD700',
          borderRadius: 15,
          borderWidth: 2,
          borderColor: '#FFA500',
        };
      case 'star':
        return {
          ...baseStyle,
          backgroundColor: '#FFD700',
          transform: [{ rotate: '45deg' }],
        };
      case 'lightning':
        return {
          ...baseStyle,
          backgroundColor: '#FFFF00',
          borderRadius: 0,
        };
      case 'magnet':
        return {
          ...baseStyle,
          backgroundColor: '#FF0000',
          borderRadius: 15,
          borderWidth: 2,
          borderColor: '#8B0000',
        };
      default:
        return baseStyle;
    }
  };

  const renderItem = (item: FallingItem) => {
    if (item.collected) return null;

    const animation = itemAnimations[item.id];
    if (!animation) return null;

    return (
      <Animated.View
        key={item.id}
        style={[
          getItemStyle(item),
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
        {/* Item-specific visual details */}
        {item.type === 'coin' && (
          <View style={styles.coinDetails}>
            <View style={styles.coinInner} />
            <View style={styles.coinShine} />
          </View>
        )}
        
        {item.type === 'star' && (
          <View style={styles.starDetails}>
            <View style={styles.starCenter} />
          </View>
        )}
        
        {item.type === 'lightning' && (
          <View style={styles.lightningDetails}>
            <View style={styles.lightningBolt} />
          </View>
        )}
        
        {item.type === 'magnet' && (
          <View style={styles.magnetDetails}>
            <View style={styles.magnetPole1} />
            <View style={styles.magnetPole2} />
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
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
  },
  coinDetails: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  coinInner: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    backgroundColor: '#FFA500',
    borderRadius: 10,
  },
  coinShine: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    opacity: 0.8,
  },
  starDetails: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  starCenter: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 14,
    height: 14,
    backgroundColor: '#FFA500',
    borderRadius: 7,
  },
  lightningDetails: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  lightningBolt: {
    position: 'absolute',
    top: 2,
    left: 8,
    width: 14,
    height: 26,
    backgroundColor: '#FFA500',
    borderRadius: 2,
  },
  magnetDetails: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  magnetPole1: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 6,
    height: 22,
    backgroundColor: '#696969',
    borderRadius: 3,
  },
  magnetPole2: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 22,
    backgroundColor: '#696969',
    borderRadius: 3,
  },
}); 