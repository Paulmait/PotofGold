import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  Dimensions,
  Platform,
} from 'react-native';

interface TouchHandlerProps {
  onMove: (x: number) => void;
  onTap: (x: number) => void;
  enabled: boolean;
  children: React.ReactNode;
}

const TouchHandler: React.FC<TouchHandlerProps> = ({
  onMove,
  onTap,
  enabled,
  children,
}) => {
  const lastTouchTime = useRef(0);
  const touchStartX = useRef(0);
  const isTouchMove = useRef(false);
  
  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    if (!enabled) return;
    
    touchStartX.current = e.nativeEvent.locationX;
    isTouchMove.current = false;
    lastTouchTime.current = Date.now();
    
    // Prevent default browser behavior
    if (Platform.OS === 'web') {
      e.preventDefault?.();
    }
  }, [enabled]);
  
  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    if (!enabled) return;
    
    const currentX = e.nativeEvent.locationX;
    const deltaX = Math.abs(currentX - touchStartX.current);
    
    // Consider it a move if finger moved more than 10 pixels
    if (deltaX > 10) {
      isTouchMove.current = true;
      onMove(currentX);
    }
    
    // Prevent default browser behavior
    if (Platform.OS === 'web') {
      e.preventDefault?.();
    }
  }, [enabled, onMove]);
  
  const handleTouchEnd = useCallback((e: GestureResponderEvent) => {
    if (!enabled) return;
    
    const touchEndX = e.nativeEvent.locationX;
    
    // If it wasn't a move, treat it as a tap
    if (!isTouchMove.current) {
      onTap(touchEndX);
    }
    
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