import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { height } = Dimensions.get('window');

interface FallingItem {
  id: string | number;
  x: number;
  y: number;
  type: string;
  speed: number;
  rotation?: number;
  scale?: number;
}

interface FallingItemsImprovedProps {
  items: FallingItem[];
  isPaused?: boolean;
}

const FallingItemsImproved: React.FC<FallingItemsImprovedProps> = ({ 
  items, 
  isPaused = false 
}) => {
  return (
    <View style={styles.container}>
      {items.map(item => (
        <FallingItemComponent key={item.id} item={item} isPaused={isPaused} />
      ))}
    </View>
  );
};

const FallingItemComponent: React.FC<{ item: FallingItem; isPaused: boolean }> = ({ 
  item, 
  isPaused 
}) => {
  const translateY = useRef(new Animated.Value(item.y)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.spring(scale, {
        toValue: item.scale || 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotation animation (continuous)
    if (item.type !== 'bomb') {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 360,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, []);

  useEffect(() => {
    // Update position
    translateY.setValue(item.y);
  }, [item.y]);

  const getItemStyle = () => {
    const baseStyle = {
      emoji: '🪙',
      size: 40,
      glow: false,
      shadowColor: '#FFD700',
    };

    switch (item.type) {
      case 'coin':
        return { ...baseStyle, emoji: '🪙', shadowColor: '#FFD700' };
      case 'gem':
        return { ...baseStyle, emoji: '💎', size: 35, glow: true, shadowColor: '#00FFFF' };
      case 'diamond':
        return { ...baseStyle, emoji: '💎', size: 45, glow: true, shadowColor: '#FFFFFF' };
      case 'star':
        return { ...baseStyle, emoji: '⭐', size: 42, glow: true, shadowColor: '#FFFF00' };
      case 'heart':
        return { ...baseStyle, emoji: '❤️', size: 38, shadowColor: '#FF1493' };
      case 'bomb':
        return { ...baseStyle, emoji: '💣', size: 45, shadowColor: '#FF0000' };
      case 'powerup':
        return { ...baseStyle, emoji: '⚡', size: 40, glow: true, shadowColor: '#00FF00' };
      default:
        return baseStyle;
    }
  };

  const itemStyle = getItemStyle();

  return (
    <Animated.View
      style={[
        styles.item,
        {
          left: item.x - itemStyle.size / 2,
          transform: [
            { translateY },
            { 
              rotate: rotation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })
            },
            { scale },
          ],
          opacity,
        },
        itemStyle.glow && styles.glowing,
        {
          shadowColor: itemStyle.shadowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: itemStyle.glow ? 0.8 : 0.3,
          shadowRadius: itemStyle.glow ? 10 : 5,
        },
      ]}
    >
      <Text style={[styles.itemEmoji, { fontSize: itemStyle.size }]}>
        {itemStyle.emoji}
      </Text>
      {item.type === 'bomb' && (
        <Animated.View
          style={[
            styles.fuseSpark,
            {
              opacity: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          <Text style={styles.fuseEmoji}>✨</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  item: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    textAlign: 'center',
  },
  glowing: {
    elevation: 10,
  },
  fuseSpark: {
    position: 'absolute',
    top: -10,
    right: -5,
  },
  fuseEmoji: {
    fontSize: 16,
  },
});

export default FallingItemsImproved;