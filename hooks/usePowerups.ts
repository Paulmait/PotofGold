import { useState, useRef, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';

interface PowerUpState {
  magnetActive: boolean;
  slowMotionActive: boolean;
  doublePointsActive: boolean;
  goldRushActive: boolean;
  magnetDuration: number;
  slowMotionDuration: number;
  doublePointsDuration: number;
  goldRushDuration: number;
}

interface PowerUpConfig {
  onPowerUpActivated: (type: string) => void;
  onPowerUpDeactivated: (type: string) => void;
}

export const usePowerups = (config: PowerUpConfig) => {
  const [powerUpState, setPowerUpState] = useState<PowerUpState>({
    magnetActive: false,
    slowMotionActive: false,
    doublePointsActive: false,
    goldRushActive: false,
    magnetDuration: 0,
    slowMotionDuration: 0,
    doublePointsDuration: 0,
    goldRushDuration: 0,
  });

  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const activatePowerUp = useCallback((powerUpType: string, duration: number) => {
    const powerUpKey = `${powerUpType}Active`;
    const durationKey = `${powerUpType}Duration`;

    setPowerUpState(prev => ({
      ...prev,
      [powerUpKey]: true,
      [durationKey]: duration,
    }));

    // Clear existing timer for this power-up
    if (timersRef.current[powerUpType]) {
      clearTimeout(timersRef.current[powerUpType]);
    }

    // Set new timer
    timersRef.current[powerUpType] = setTimeout(() => {
      deactivatePowerUp(powerUpType);
    }, duration);

    // Trigger activation callback
    config.onPowerUpActivated(powerUpType);

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [config]);

  const deactivatePowerUp = useCallback((powerUpType: string) => {
    const powerUpKey = `${powerUpType}Active`;
    const durationKey = `${powerUpType}Duration`;

    setPowerUpState(prev => ({
      ...prev,
      [powerUpKey]: false,
      [durationKey]: 0,
    }));

    // Clear timer
    if (timersRef.current[powerUpType]) {
      clearTimeout(timersRef.current[powerUpType]);
      delete timersRef.current[powerUpType];
    }

    // Trigger deactivation callback
    config.onPowerUpDeactivated(powerUpType);
  }, [config]);

  const isPowerUpActive = useCallback((powerUpType: string): boolean => {
    const powerUpKey = `${powerUpType}Active`;
    return powerUpState[powerUpKey as keyof PowerUpState] as boolean;
  }, [powerUpState]);

  const getPowerUpDuration = useCallback((powerUpType: string): number => {
    const durationKey = `${powerUpType}Duration`;
    return powerUpState[durationKey as keyof PowerUpState] as number;
  }, [powerUpState]);

  const getActivePowerUps = useCallback(() => {
    return {
      magnet: powerUpState.magnetActive,
      slowMotion: powerUpState.slowMotionActive,
      doublePoints: powerUpState.doublePointsActive,
      goldRush: powerUpState.goldRushActive,
    };
  }, [powerUpState]);

  const clearAllPowerUps = useCallback(() => {
    // Clear all timers
    Object.values(timersRef.current).forEach(timer => {
      clearTimeout(timer);
    });
    timersRef.current = {};

    // Reset state
    setPowerUpState({
      magnetActive: false,
      slowMotionActive: false,
      doublePointsActive: false,
      goldRushActive: false,
      magnetDuration: 0,
      slowMotionDuration: 0,
      doublePointsDuration: 0,
      goldRushDuration: 0,
    });
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup timers on unmount
      Object.values(timersRef.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);

  return {
    powerUpState,
    activatePowerUp,
    deactivatePowerUp,
    isPowerUpActive,
    getPowerUpDuration,
    getActivePowerUps,
    clearAllPowerUps,
  };
}; 