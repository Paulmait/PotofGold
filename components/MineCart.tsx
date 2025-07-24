import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface MineCartProps {
  position: number;
  size: number;
  isTurboActive: boolean;
  onWheelSpin?: (direction: 'left' | 'right') => void;
}

export default function MineCart({ 
  position, 
  size, 
  isTurboActive, 
  onWheelSpin 
}: MineCartProps) {
  const wheelRotation = useRef(new Animated.Value(0)).current;
  const cartScale = useRef(new Animated.Value(1)).current;
  const lastPosition = useRef(position);

  // Animate wheels when cart moves
  useEffect(() => {
    if (position !== lastPosition.current) {
      const direction = position > lastPosition.current ? 'right' : 'left';
      const distance = Math.abs(position - lastPosition.current);
      
      // Spin wheels based on movement distance
      const spinDuration = Math.max(100, distance * 2);
      const spinValue = direction === 'right' ? 1 : -1;
      
      Animated.timing(wheelRotation, {
        toValue: wheelRotation._value + (spinValue * distance / 10),
        duration: spinDuration,
        useNativeDriver: true,
      }).start();

      onWheelSpin?.(direction);
      lastPosition.current = position;
    }
  }, [position, wheelRotation, onWheelSpin]);

  // Turbo boost animation
  useEffect(() => {
    Animated.timing(cartScale, {
      toValue: isTurboActive ? 1.2 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isTurboActive, cartScale]);

  return (
    <Animated.View
      style={[
        styles.cart,
        {
          left: position - size / 2,
          width: size,
          height: size * 0.67, // Maintain aspect ratio
          transform: [
            { scale: cartScale },
          ],
        },
      ]}
    >
      {/* Cart Body */}
      <View style={styles.cartBody}>
        {/* Wooden planks */}
        <View style={styles.plank1} />
        <View style={styles.plank2} />
        <View style={styles.plank3} />
        
        {/* Metal straps */}
        <View style={styles.strap1} />
        <View style={styles.strap2} />
        <View style={styles.strap3} />
      </View>

      {/* Wheels */}
      <View style={styles.wheelsContainer}>
        <Animated.View
          style={[
            styles.wheel,
            styles.wheelLeft,
            {
              transform: [
                { rotate: wheelRotation.interpolate({
                  inputRange: [-1000, 1000],
                  outputRange: ['-1000deg', '1000deg'],
                }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.wheel,
            styles.wheelRight,
            {
              transform: [
                { rotate: wheelRotation.interpolate({
                  inputRange: [-1000, 1000],
                  outputRange: ['-1000deg', '1000deg'],
                }) },
              ],
            },
          ]}
        />
      </View>

      {/* Extended hitbox for better catching */}
      <View style={styles.hitbox} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cart: {
    position: 'absolute',
    bottom: 20,
    zIndex: 20,
  },
  cartBody: {
    position: 'relative',
    width: '100%',
    height: '70%',
    backgroundColor: '#8B4513', // Brown wood
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#654321',
  },
  plank1: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    height: 4,
    backgroundColor: '#A0522D',
    borderRadius: 2,
  },
  plank2: {
    position: 'absolute',
    top: 8,
    left: 2,
    right: 2,
    height: 4,
    backgroundColor: '#A0522D',
    borderRadius: 2,
  },
  plank3: {
    position: 'absolute',
    top: 14,
    left: 2,
    right: 2,
    height: 4,
    backgroundColor: '#A0522D',
    borderRadius: 2,
  },
  strap1: {
    position: 'absolute',
    top: 0,
    left: 4,
    width: 2,
    height: '100%',
    backgroundColor: '#696969',
  },
  strap2: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 2,
    height: '100%',
    backgroundColor: '#696969',
  },
  strap3: {
    position: 'absolute',
    top: 0,
    right: 4,
    width: 2,
    height: '100%',
    backgroundColor: '#696969',
  },
  wheelsContainer: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wheel: {
    width: 12,
    height: 12,
    backgroundColor: '#2F2F2F',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  wheelLeft: {
    marginLeft: 4,
  },
  wheelRight: {
    marginRight: 4,
  },
  hitbox: {
    position: 'absolute',
    top: -10,
    left: -5,
    right: -5,
    height: 20,
    backgroundColor: 'transparent',
    // This creates an invisible extended hitbox for better collision detection
  },
}); 