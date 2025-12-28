import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export interface FallingItem {
  id: string;
  type: 'coin' | 'diamond' | 'star' | 'clover' | 'bomb' | 'heart' | 'magnet' | 'multiplier';
  x: number;
  y: Animated.Value;
  speed: number;
  value: number;
}

interface FallingItemsEnhancedProps {
  items: FallingItem[];
  onItemReachBottom: (itemId: string) => void;
}

const FallingItemsEnhanced: React.FC<FallingItemsEnhancedProps> = ({
  items,
  onItemReachBottom,
}) => {
  useEffect(() => {
    items.forEach((item) => {
      const animation = Animated.timing(item.y, {
        toValue: height,
        duration: ((height - item.y._value) / item.speed) * 16,
        useNativeDriver: true,
      });

      animation.start(() => {
        onItemReachBottom(item.id);
      });
    });
  }, [items]);

  const renderItem = (item: FallingItem) => {
    switch (item.type) {
      case 'coin':
        return (
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.coin}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome5 name="coins" size={20} color="#FFF" />
          </LinearGradient>
        );

      case 'diamond':
        return (
          <View style={styles.diamondContainer}>
            <LinearGradient
              colors={['#00CED1', '#4682B4']}
              style={styles.diamond}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="diamond-stone" size={24} color="#FFF" />
            </LinearGradient>
          </View>
        );

      case 'star':
        return (
          <LinearGradient
            colors={['#FFD700', '#FFEB3B']}
            style={styles.star}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome5 name="star" size={22} color="#FFF" />
          </LinearGradient>
        );

      case 'clover':
        return (
          <LinearGradient
            colors={['#228B22', '#32CD32']}
            style={styles.clover}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="clover" size={24} color="#FFF" />
          </LinearGradient>
        );

      case 'bomb':
        return (
          <LinearGradient
            colors={['#2C2C2C', '#1A1A1A']}
            style={styles.bomb}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="bomb" size={24} color="#FF4444" />
          </LinearGradient>
        );

      case 'heart':
        return (
          <LinearGradient
            colors={['#FF69B4', '#FF1493']}
            style={styles.heart}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome5 name="heart" size={20} color="#FFF" />
          </LinearGradient>
        );

      case 'magnet':
        return (
          <LinearGradient
            colors={['#FF6B6B', '#C44569']}
            style={styles.powerUp}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="magnet" size={22} color="#FFF" />
          </LinearGradient>
        );

      case 'multiplier':
        return (
          <LinearGradient
            colors={['#00FF00', '#00CC00']}
            style={styles.powerUp}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.multiplierContent}>
              <FontAwesome5 name="times" size={16} color="#FFF" />
              <FontAwesome5 name="dice-two" size={16} color="#FFF" />
            </View>
          </LinearGradient>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <Animated.View
          key={item.id}
          style={[
            styles.itemContainer,
            {
              transform: [{ translateX: item.x }, { translateY: item.y }],
            },
          ]}
        >
          {renderItem(item)}
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },

  itemContainer: {
    position: 'absolute',
    width: 40,
    height: 40,
  },

  coin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },

  diamondContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  diamond: {
    width: 36,
    height: 36,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00CED1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },

  star: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },

  clover: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#228B22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },

  bomb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },

  heart: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },

  powerUp: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },

  multiplierContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});

export default FallingItemsEnhanced;
