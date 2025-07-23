import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

interface GoldRushState {
  isActive: boolean;
  duration: number;
  spawnRate: number;
  coinMultiplier: number;
}

interface GoldRushConfig {
  duration: number;
  spawnRate: number;
  coinMultiplier: number;
  backgroundAnimation: Animated.Value;
}

export const useGoldRush = (config: GoldRushConfig) => {
  const [state, setState] = useState<GoldRushState>({
    isActive: false,
    duration: 0,
    spawnRate: 1000,
    coinMultiplier: 1,
  });

  const timerRef = useRef<NodeJS.Timeout>();
  const animationRef = useRef<Animated.CompositeAnimation>();

  const activateGoldRush = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: true,
      duration: config.duration,
      spawnRate: config.spawnRate,
      coinMultiplier: config.coinMultiplier,
    }));

    // Start background animation
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(config.backgroundAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(config.backgroundAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animationRef.current.start();

    // Set timer to deactivate
    timerRef.current = setTimeout(() => {
      deactivateGoldRush();
    }, config.duration);
  }, [config]);

  const deactivateGoldRush = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      duration: 0,
      spawnRate: 1000,
      coinMultiplier: 1,
    }));

    // Stop background animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Clear timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const getSpawnInterval = useCallback(() => {
    return state.isActive ? state.spawnRate : 1000;
  }, [state.isActive, state.spawnRate]);

  const getCoinMultiplier = useCallback(() => {
    return state.isActive ? state.coinMultiplier : 1;
  }, [state.isActive, state.coinMultiplier]);

  const getRemainingTime = useCallback(() => {
    return Math.max(0, state.duration);
  }, [state.duration]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  return {
    isActive: state.isActive,
    spawnInterval: getSpawnInterval(),
    coinMultiplier: getCoinMultiplier(),
    remainingTime: getRemainingTime(),
    activateGoldRush,
    deactivateGoldRush,
  };
}; 