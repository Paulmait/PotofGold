import React, { useEffect, useState, useCallback } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type OrientationType = 'portrait' | 'landscape';

interface OrientationData {
  orientation: OrientationType;
  width: number;
  height: number;
  isTablet: boolean;
  scale: number;
}

interface GameState {
  isPaused: boolean;
  score: number;
  coins: number;
  level: number;
  cartPosition: number;
  fallingItems: any[];
  powerUps: any[];
}

export function useOrientation(gameState?: GameState) {
  const [orientationData, setOrientationData] = useState<OrientationData>(() => {
    const { width, height } = Dimensions.get('window');
    return {
      orientation: width < height ? 'portrait' : 'landscape',
      width,
      height,
      isTablet: Math.min(width, height) >= 600,
      scale: 1,
    };
  });

  const [previousOrientation, setPreviousOrientation] = useState<OrientationType>(
    orientationData.orientation
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Save game state before orientation change
  const saveGameState = useCallback(async (state: GameState) => {
    try {
      await AsyncStorage.setItem(
        'orientationGameState',
        JSON.stringify({
          ...state,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Error saving game state during orientation change:', error);
    }
  }, []);

  // Restore game state after orientation change
  const restoreGameState = useCallback(async (): Promise<GameState | null> => {
    try {
      const saved = await AsyncStorage.getItem('orientationGameState');
      if (saved) {
        const state = JSON.parse(saved);
        // Only restore if saved within last 5 seconds
        if (Date.now() - state.timestamp < 5000) {
          await AsyncStorage.removeItem('orientationGameState');
          return state;
        }
      }
    } catch (error) {
      console.error('Error restoring game state after orientation change:', error);
    }
    return null;
  }, []);

  // Calculate responsive scaling
  const calculateScale = useCallback((width: number, height: number): number => {
    const baseWidth = 375; // iPhone X width as base
    const baseHeight = 812; // iPhone X height as base

    const orientation = width < height ? 'portrait' : 'landscape';

    if (orientation === 'portrait') {
      return Math.min(width / baseWidth, height / baseHeight);
    } else {
      // In landscape, use height as the limiting factor
      return Math.min(height / baseWidth, width / baseHeight);
    }
  }, []);

  // Handle dimension changes
  const handleDimensionChange = useCallback(
    ({ window }: { window: ScaledSize }) => {
      const { width, height } = window;
      const newOrientation: OrientationType = width < height ? 'portrait' : 'landscape';
      const scale = calculateScale(width, height);

      // Detect orientation change
      if (newOrientation !== previousOrientation) {
        setIsTransitioning(true);

        // Save current game state if provided
        if (gameState && !gameState.isPaused) {
          saveGameState(gameState);
        }

        setPreviousOrientation(newOrientation);

        // Complete transition after animation
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }

      setOrientationData({
        orientation: newOrientation,
        width,
        height,
        isTablet: Math.min(width, height) >= 600,
        scale,
      });
    },
    [previousOrientation, gameState, saveGameState, calculateScale]
  );

  // Lock orientation for specific screens if needed
  const lockOrientation = useCallback(async (orientation: 'portrait' | 'landscape' | 'default') => {
    try {
      switch (orientation) {
        case 'portrait':
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          break;
        case 'landscape':
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
          break;
        case 'default':
          await ScreenOrientation.unlockAsync();
          break;
      }
    } catch (error) {
      console.error('Error locking orientation:', error);
    }
  }, []);

  // Get optimized layout for current orientation
  const getLayout = useCallback(() => {
    const { orientation, width, height, isTablet, scale } = orientationData;

    if (orientation === 'portrait') {
      return {
        // Portrait layout
        gameAreaHeight: height * 0.7,
        uiAreaHeight: height * 0.3,
        cartSize: isTablet ? 100 : 80,
        itemSize: isTablet ? 50 : 40,
        fontSize: {
          small: 12 * scale,
          medium: 16 * scale,
          large: 24 * scale,
          xlarge: 32 * scale,
        },
        padding: {
          small: 8 * scale,
          medium: 16 * scale,
          large: 24 * scale,
        },
        buttonSize: {
          small: 40 * scale,
          medium: 50 * scale,
          large: 60 * scale,
        },
      };
    } else {
      return {
        // Landscape layout
        gameAreaHeight: height * 0.8,
        uiAreaHeight: height * 0.2,
        cartSize: isTablet ? 80 : 60,
        itemSize: isTablet ? 40 : 30,
        fontSize: {
          small: 10 * scale,
          medium: 14 * scale,
          large: 20 * scale,
          xlarge: 28 * scale,
        },
        padding: {
          small: 6 * scale,
          medium: 12 * scale,
          large: 18 * scale,
        },
        buttonSize: {
          small: 35 * scale,
          medium: 45 * scale,
          large: 55 * scale,
        },
      };
    }
  }, [orientationData]);

  // Adjust game coordinates for orientation change
  const translateCoordinates = useCallback(
    (
      x: number,
      y: number,
      fromOrientation: OrientationType,
      toOrientation: OrientationType
    ): { x: number; y: number } => {
      const { width, height } = orientationData;

      if (fromOrientation === toOrientation) {
        return { x, y };
      }

      if (fromOrientation === 'portrait' && toOrientation === 'landscape') {
        // Portrait to landscape
        const xRatio = x / width;
        const yRatio = y / height;
        return {
          x: yRatio * height,
          y: xRatio * width,
        };
      } else {
        // Landscape to portrait
        const xRatio = x / height;
        const yRatio = y / width;
        return {
          x: yRatio * width,
          y: xRatio * height,
        };
      }
    },
    [orientationData]
  );

  // Setup orientation change listener
  useEffect(() => {
    // Initial setup
    ScreenOrientation.getOrientationAsync().then((orientation) => {
      console.log('Initial orientation:', orientation);
    });

    // Listen for dimension changes
    const subscription = Dimensions.addEventListener('change', handleDimensionChange);

    // Listen for orientation changes
    const orientationSubscription = ScreenOrientation.addOrientationChangeListener((event) => {
      console.log('Orientation changed:', event.orientationInfo.orientation);
    });

    return () => {
      subscription?.remove();
      orientationSubscription?.remove();
    };
  }, [handleDimensionChange]);

  return {
    ...orientationData,
    isTransitioning,
    lockOrientation,
    getLayout,
    translateCoordinates,
    restoreGameState,
  };
}

// HOC to wrap game components with orientation handling
export function withOrientationSupport<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return (props: P) => {
    const orientation = useOrientation();

    return <Component {...props} orientation={orientation} />;
  };
}

// Utility functions for responsive design
export const responsive = {
  // Get responsive value based on orientation
  value: (portrait: number, landscape: number, orientation: OrientationType): number => {
    return orientation === 'portrait' ? portrait : landscape;
  },

  // Get responsive font size
  fontSize: (baseSize: number, scale: number): number => {
    return Math.round(baseSize * scale);
  },

  // Get responsive spacing
  spacing: (baseSpacing: number, scale: number): number => {
    return Math.round(baseSpacing * scale);
  },

  // Check if device is tablet
  isTablet: (): boolean => {
    const { width, height } = Dimensions.get('window');
    return Math.min(width, height) >= 600;
  },
};
