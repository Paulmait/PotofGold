import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Dimensions,
  Platform,
} from 'react-native';
import { gameResponsive } from '../utils/responsiveSystem';

interface TouchHandlerProps {
  onMove: (x: number) => void;
  onTap?: (x: number) => void;
  currentPosition: number;
  minPosition?: number;
  maxPosition?: number;
  enabled: boolean;
  children: React.ReactNode;
}

const TouchHandler: React.FC<TouchHandlerProps> = ({
  onMove,
  onTap,
  currentPosition,
  minPosition = 0,
  maxPosition,
  enabled,
  children,
}) => {
  const lastTouchTime = useRef(0);
  const touchStartX = useRef(0);
  const touchStartPosition = useRef(0);
  const isTouchMove = useRef(false);
  const sensitivity = gameResponsive.movementSensitivity();
  
  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    if (!enabled) return;

    touchStartX.current = e.nativeEvent.pageX;
    touchStartPosition.current = currentPosition;
    isTouchMove.current = false;
    lastTouchTime.current = Date.now();

    // Prevent default browser behavior
    if (Platform.OS === 'web') {
      e.preventDefault?.();
    }
  }, [enabled, currentPosition]);
  
  const handleTouchMove = useCallback((e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    if (!enabled) return;

    const deltaX = gestureState.dx * sensitivity;
    const absMove = Math.abs(deltaX);

    // Consider it a move if finger moved more than 5 pixels
    if (absMove > 5) {
      isTouchMove.current = true;

      // Calculate new position based on delta
      let newPosition = touchStartPosition.current + deltaX;

      // Apply boundaries
      if (minPosition !== undefined) {
        newPosition = Math.max(minPosition, newPosition);
      }
      if (maxPosition !== undefined) {
        newPosition = Math.min(maxPosition, newPosition);
      }

      onMove(newPosition);
    }

    // Prevent default browser behavior
    if (Platform.OS === 'web') {
      e.preventDefault?.();
    }
  }, [enabled, onMove, sensitivity, minPosition, maxPosition]);
  
  const handleTouchEnd = useCallback((e: GestureResponderEvent) => {
    if (!enabled) return;

    const touchEndX = e.nativeEvent.pageX;

    // If it wasn't a move, treat it as a tap
    if (!isTouchMove.current && onTap) {
      onTap(touchEndX);
    }

    // Reset refs
    touchStartX.current = 0;
    touchStartPosition.current = 0;

    // Prevent default browser behavior
    if (Platform.OS === 'web') {
      e.preventDefault?.();
    }
  }, [enabled, onTap]);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enabled,
      onMoveShouldSetPanResponder: () => enabled,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: handleTouchStart,
      onPanResponderMove: handleTouchMove,
      onPanResponderRelease: handleTouchEnd,
      onPanResponderTerminate: handleTouchEnd,
    })
  ).current;
  
  // Keyboard controls for accessibility
  useEffect(() => {
    if (Platform.OS === 'web' && enabled) {
      const handleKeyDown = (e: KeyboardEvent) => {
        const moveAmount = gameResponsive.cartSize() / 2;
        let newPosition = currentPosition;

        switch (e.key) {
          case 'ArrowLeft':
          case 'a':
          case 'A':
            newPosition = currentPosition - moveAmount;
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            newPosition = currentPosition + moveAmount;
            break;
          default:
            return;
        }

        // Apply boundaries
        if (minPosition !== undefined) {
          newPosition = Math.max(minPosition, newPosition);
        }
        if (maxPosition !== undefined) {
          newPosition = Math.min(maxPosition, newPosition);
        }

        onMove(newPosition);
        e.preventDefault();
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, currentPosition, minPosition, maxPosition, onMove]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});

export default TouchHandler;