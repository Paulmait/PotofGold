import React, { useEffect, useRef } from 'react';
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
  type: 'coin' | 'moneyBag' | 'lightning' | 'magnet' | 'gemstone' | 'dynamite' | 'blackRock' | 'luckyStar';
  x: number;
  y: number;
  speed: number;
  collected: boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'ultraRare';
}

interface FallingItemsProps {
  items: FallingItem[];
  onItemCollect: (itemId: string) => void;
}

export default function FallingItems({ items, onItemCollect }: FallingItemsProps) {
  const itemAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const sparkleAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Initialize animations for new items
  useEffect(() => {
    items.forEach(item => {
      if (!itemAnimations[item.id]) {
        itemAnimations[item.id] = new Animated.Value(0);
        sparkleAnimations[item.id] = new Animated.Value(0);
        
        // Start falling animation
        const itemAnim = itemAnimations[item.id];
        if (itemAnim) {
          Animated.timing(itemAnim, {
            toValue: height,
            duration: (height - item.y) / item.speed * 1000,
            useNativeDriver: true,
          }).start();
        }

        // Start sparkle animation for special items
        if (item.type === 'coin' || item.type === 'gemstone' || item.type === 'luckyStar') {
          const sparkleAnim = sparkleAnimations[item.id];
          if (sparkleAnim) {
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
        }
      }
    });
  }, [items, itemAnimations, sparkleAnimations]);

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
      case 'moneyBag':
        return {
          ...baseStyle,
          backgroundColor: '#8B4513',
          borderRadius: 8,
          borderWidth: 2,
          borderColor: '#654321',
        };
      case 'lightning':
        return {
          ...baseStyle,
          backgroundColor: '#FFA500',
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
      case 'gemstone':
        return {
          ...baseStyle,
          backgroundColor: '#4169E1',
          borderRadius: 0,
          transform: [{ rotate: '45deg' }],
        };
      case 'dynamite':
        return {
          ...baseStyle,
          backgroundColor: '#DC143C',
          borderRadius: 4,
          borderWidth: 2,
          borderColor: '#8B0000',
        };
      case 'blackRock':
        return {
          ...baseStyle,
          backgroundColor: '#2F2F2F',
          borderRadius: 8,
          borderWidth: 2,
          borderColor: '#1A1A1A',
        };
      case 'luckyStar':
        return {
          ...baseStyle,
          backgroundColor: '#FFD700',
          borderRadius: 0,
        };
      default:
        return baseStyle;
    }
  };

  const renderItem = (item: FallingItem) => {
    if (item.collected) return null;

    const animation = itemAnimations[item.id];
    const sparkleAnimation = sparkleAnimations[item.id];
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
            {sparkleAnimation && (
              <Animated.View 
                style={[
                  styles.coinShine,
                  {
                    opacity: sparkleAnimation,
                    transform: [{ scale: sparkleAnimation }],
                  }
                ]} 
              />
            )}
          </View>
        )}
        
        {item.type === 'moneyBag' && (
          <View style={styles.moneyBagDetails}>
            <Text style={styles.moneyBagText}>$</Text>
            <View style={styles.moneyBagStrap} />
          </View>
        )}
        
        {item.type === 'lightning' && (
          <View style={styles.lightningDetails}>
            <View style={styles.lightningBolt} />
            {sparkleAnimation && (
              <Animated.View 
                style={[
                  styles.lightningTrail,
                  {
                    opacity: sparkleAnimation,
                  }
                ]} 
              />
            )}
          </View>
        )}
        
        {item.type === 'magnet' && (
          <View style={styles.magnetDetails}>
            <View style={styles.magnetPole1} />
            <View style={styles.magnetPole2} />
            {sparkleAnimation && (
              <Animated.View 
                style={[
                  styles.magnetField,
                  {
                    opacity: sparkleAnimation,
                    transform: [{ scale: sparkleAnimation }],
                  }
                ]} 
              />
            )}
          </View>
        )}

        {item.type === 'gemstone' && (
          <View style={styles.gemstoneDetails}>
            <View style={styles.gemstoneFacet1} />
            <View style={styles.gemstoneFacet2} />
            {sparkleAnimation && (
              <Animated.View 
                style={[
                  styles.gemstoneGlow,
                  {
                    opacity: sparkleAnimation,
                  }
                ]} 
              />
            )}
          </View>
        )}

        {item.type === 'dynamite' && (
          <View style={styles.dynamiteDetails}>
            <View style={styles.dynamiteBody} />
            <View style={styles.dynamiteFuse} />
            <View style={styles.dynamiteSpark} />
          </View>
        )}

        {item.type === 'blackRock' && (
          <View style={styles.blackRockDetails}>
            <View style={styles.blackRockCrack1} />
            <View style={styles.blackRockCrack2} />
          </View>
        )}

        {item.type === 'luckyStar' && (
          <View style={styles.luckyStarDetails}>
            <View style={styles.luckyStarCenter} />
            {sparkleAnimation && (
              <Animated.View 
                style={[
                  styles.luckyStarTrail,
                  {
                    opacity: sparkleAnimation,
                    transform: [{ rotate: sparkleAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }) }],
                  }
                ]} 
              />
            )}
          </View>
        )}

        {/* Rarity indicator */}
        <View style={[styles.rarityIndicator, styles[`rarity_${item.rarity}`]]} />
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
  // Coin details
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
  },
  // Money bag details
  moneyBagDetails: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moneyBagText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  moneyBagStrap: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: '#654321',
    borderRadius: 1,
  },
  // Lightning details
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
  lightningTrail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFF00',
    borderRadius: 15,
    opacity: 0.3,
  },
  // Magnet details
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
  magnetField: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderWidth: 2,
    borderColor: '#FF0000',
    borderRadius: 20,
    opacity: 0.5,
  },
  // Gemstone details
  gemstoneDetails: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  gemstoneFacet1: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 14,
    height: 14,
    backgroundColor: '#1E90FF',
    borderRadius: 2,
  },
  gemstoneFacet2: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    backgroundColor: '#4169E1',
    borderRadius: 2,
  },
  gemstoneGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: '#87CEEB',
    borderRadius: 17,
    opacity: 0.6,
  },
  // Dynamite details
  dynamiteDetails: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  dynamiteBody: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 8,
    backgroundColor: '#DC143C',
    borderRadius: 2,
  },
  dynamiteFuse: {
    position: 'absolute',
    top: 2,
    left: 12,
    width: 6,
    height: 8,
    backgroundColor: '#8B4513',
    borderRadius: 1,
  },
  dynamiteSpark: {
    position: 'absolute',
    top: 0,
    left: 12,
    width: 6,
    height: 4,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  // Black rock details
  blackRockDetails: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  blackRockCrack1: {
    position: 'absolute',
    top: 8,
    left: 6,
    width: 18,
    height: 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 1,
  },
  blackRockCrack2: {
    position: 'absolute',
    top: 12,
    left: 8,
    width: 14,
    height: 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 1,
  },
  // Lucky star details
  luckyStarDetails: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  luckyStarCenter: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 14,
    height: 14,
    backgroundColor: '#FFA500',
    borderRadius: 7,
  },
  luckyStarTrail: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 20,
    opacity: 0.3,
  },
  // Rarity indicators
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
}); 