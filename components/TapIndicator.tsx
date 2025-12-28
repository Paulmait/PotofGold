import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface TapIndicatorProps {
  x: number;
  y: number;
  onComplete: () => void;
}

const TapIndicator: React.FC<TapIndicatorProps> = ({ x, y, onComplete }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 2,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.indicator,
        {
          left: x - 25,
          top: y - 25,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
});

export default TapIndicator;
