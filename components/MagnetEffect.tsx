import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface MagnetEffectProps {
  cartX: number;
  cartY: number;
  itemX: number;
  itemY: number;
  isActive: boolean;
  onComplete: () => void;
}

const MagnetEffect: React.FC<MagnetEffectProps> = ({
  cartX,
  cartY,
  itemX,
  itemY,
  isActive,
  onComplete,
}) => {
  const animX = useRef(new Animated.Value(itemX)).current;
  const animY = useRef(new Animated.Value(itemY)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) return;

    // Animate item being pulled to cart
    Animated.parallel([
      Animated.timing(animX, {
        toValue: cartX,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(animY, {
        toValue: cartY,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  }, [isActive, cartX, cartY]);

  if (!isActive) return null;

  return (
    <Animated.View
      style={[
        styles.magnetLine,
        {
          opacity,
          transform: [{ translateX: animX }, { translateY: animY }, { scale }],
        },
      ]}
    >
      <View style={styles.magnetParticle} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  magnetLine: {
    position: 'absolute',
    width: 2,
    height: 50,
    backgroundColor: '#FFD700',
    opacity: 0.6,
  },
  magnetParticle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
});

export default MagnetEffect;
