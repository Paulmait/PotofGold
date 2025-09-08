import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';

interface ShakeOptions {
  duration?: number;
  intensity?: number;
  decay?: boolean;
}

export const useScreenShake = () => {
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  const shake = useCallback((options: ShakeOptions = {}) => {
    const {
      duration = 300,
      intensity = 10,
      decay = true,
    } = options;
    
    const sequence: Animated.CompositeAnimation[] = [];
    const steps = 10;
    
    for (let i = 0; i < steps; i++) {
      const currentIntensity = decay 
        ? intensity * (1 - i / steps) 
        : intensity;
      
      sequence.push(
        Animated.timing(shakeAnimation, {
          toValue: i % 2 === 0 ? currentIntensity : -currentIntensity,
          duration: duration / steps,
          useNativeDriver: true,
        })
      );
    }
    
    // Return to center
    sequence.push(
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: duration / steps,
        useNativeDriver: true,
      })
    );
    
    Animated.sequence(sequence).start();
  }, [shakeAnimation]);
  
  const getShakeTransform = () => ({
    transform: [
      {
        translateX: shakeAnimation,
      },
      {
        translateY: shakeAnimation.interpolate({
          inputRange: [-10, 10],
          outputRange: [-5, 5],
        }),
      },
    ],
  });
  
  return {
    shake,
    shakeAnimation,
    shakeTransform: getShakeTransform(),
  };
};