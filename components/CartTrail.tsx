import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface TrailSegment {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
}

interface CartTrailProps {
  cartX: number;
  cartY: number;
  isMoving: boolean;
  color?: string;
}

const CartTrail: React.FC<CartTrailProps> = ({ cartX, cartY, isMoving, color = '#FFD700' }) => {
  const [trails, setTrails] = useState<TrailSegment[]>([]);
  const trailCounter = useRef(0);
  const lastPosition = useRef({ x: cartX, y: cartY });

  useEffect(() => {
    if (!isMoving) return;

    const distance = Math.abs(cartX - lastPosition.current.x);

    // Only create trail if cart moved significantly
    if (distance > 5) {
      const newTrail: TrailSegment = {
        id: trailCounter.current++,
        x: new Animated.Value(lastPosition.current.x),
        y: new Animated.Value(cartY),
        opacity: new Animated.Value(0.6),
        scale: new Animated.Value(1),
      };

      setTrails((prev) => [...prev, newTrail]);

      // Animate trail fade out
      Animated.parallel([
        Animated.timing(newTrail.opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(newTrail.scale, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Remove trail after animation
        setTrails((prev) => prev.filter((t) => t.id !== newTrail.id));
      });

      lastPosition.current = { x: cartX, y: cartY };
    }
  }, [cartX, cartY, isMoving]);

  return (
    <View style={styles.container}>
      {trails.map((trail) => (
        <Animated.View
          key={trail.id}
          style={[
            styles.trailSegment,
            {
              backgroundColor: color,
              opacity: trail.opacity,
              transform: [{ translateX: trail.x }, { translateY: trail.y }, { scale: trail.scale }],
            },
          ]}
        />
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
    pointerEvents: 'none',
  },
  trailSegment: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
});

export default CartTrail;
