import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  Platform,
  Animated,
} from 'react-native';

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface EnhancedTouchHandlerProps {
  onMove: (x: number, velocity: number) => void;
  onTap: (x: number) => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: (x: number) => void;
  enabled: boolean;
  children: React.ReactNode;
  smoothingFactor?: number;
  velocityThreshold?: number;
  swipeThreshold?: number;
}

const EnhancedTouchHandler: React.FC<EnhancedTouchHandlerProps> = ({
  onMove,
  onTap,
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  enabled,
  children,
  smoothingFactor = 0.3,
  velocityThreshold = 0.5,
  swipeThreshold = 50,
}) => {
  // Touch tracking
  const touchHistory = useRef<TouchPoint[]>([]);
  const lastTapTime = useRef(0);
  const touchStartY = useRef(0);
  const isTouchMove = useRef(false);
  const velocityX = useRef(0);
  const smoothedX = useRef(0);
  const animatedX = useRef(new Animated.Value(0)).current;

  // Gesture state
  const [isMultiTouch, setIsMultiTouch] = useState(false);

  // Calculate velocity from touch history
  const calculateVelocity = useCallback((): number => {
    const history = touchHistory.current;
    if (history.length < 2) return 0;

    const recentPoints = history.slice(-5); // Last 5 points
    if (recentPoints.length < 2) return 0;

    const first = recentPoints[0];
    const last = recentPoints[recentPoints.length - 1];
    const timeDelta = last.timestamp - first.timestamp;

    if (timeDelta === 0) return 0;

    const velocity = ((last.x - first.x) / timeDelta) * 1000; // pixels per second
    return velocity;
  }, []);

  // Smooth position updates
  const updateSmoothPosition = useCallback(
    (targetX: number) => {
      const currentX = smoothedX.current;
      const newX = currentX + (targetX - currentX) * smoothingFactor;
      smoothedX.current = newX;

      // Animate to smooth position
      Animated.spring(animatedX, {
        toValue: newX,
        tension: 40,
        friction: 7,
        useNativeDriver: false,
      }).start();

      return newX;
    },
    [smoothingFactor, animatedX]
  );

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      if (!enabled) return;

      const touches = e.nativeEvent.touches;

      // Detect multi-touch
      if (touches.length > 1) {
        setIsMultiTouch(true);
        return;
      }

      const touchX = e.nativeEvent.locationX;
      touchStartY.current = e.nativeEvent.locationY;
      isTouchMove.current = false;

      // Initialize touch history
      touchHistory.current = [
        {
          x: touchX,
          y: e.nativeEvent.locationY,
          timestamp: Date.now(),
        },
      ];

      // Initialize smooth position
      smoothedX.current = touchX;

      // Prevent default browser behavior on web
      if (Platform.OS === 'web') {
        e.preventDefault?.();
      }
    },
    [enabled]
  );

  // Handle touch move with velocity tracking
  const handleTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      if (!enabled || isMultiTouch) return;

      const currentX = e.nativeEvent.locationX;
      const currentY = e.nativeEvent.locationY;
      const currentTime = Date.now();

      // Add to touch history
      touchHistory.current.push({
        x: currentX,
        y: currentY,
        timestamp: currentTime,
      });

      // Keep history size limited
      if (touchHistory.current.length > 10) {
        touchHistory.current.shift();
      }

      // Calculate velocity
      const velocity = calculateVelocity();
      velocityX.current = velocity;

      // Check if this is a move (not just a tap)
      const deltaX = Math.abs(currentX - touchHistory.current[0].x);
      if (deltaX > 10) {
        isTouchMove.current = true;

        // Apply smoothing
        const smoothedPosition = updateSmoothPosition(currentX);

        // Call move handler with velocity
        onMove(smoothedPosition, velocity);
      }

      // Prevent default browser behavior
      if (Platform.OS === 'web') {
        e.preventDefault?.();
      }
    },
    [enabled, isMultiTouch, calculateVelocity, updateSmoothPosition, onMove]
  );

  // Handle touch end with gesture detection
  const handleTouchEnd = useCallback(
    (e: GestureResponderEvent) => {
      if (!enabled) return;

      // Reset multi-touch
      setIsMultiTouch(false);

      const touchEndX = e.nativeEvent.locationX;
      const touchEndY = e.nativeEvent.locationY;
      const currentTime = Date.now();

      // Check for swipe gestures
      const verticalDelta = touchEndY - touchStartY.current;
      if (Math.abs(verticalDelta) > swipeThreshold) {
        if (verticalDelta < 0 && onSwipeUp) {
          onSwipeUp();
          return;
        } else if (verticalDelta > 0 && onSwipeDown) {
          onSwipeDown();
          return;
        }
      }

      // Check for tap or double tap
      if (!isTouchMove.current) {
        const timeSinceLastTap = currentTime - lastTapTime.current;

        if (timeSinceLastTap < 300 && onDoubleTap) {
          // Double tap detected
          onDoubleTap(touchEndX);
        } else {
          // Single tap
          onTap(touchEndX);
        }

        lastTapTime.current = currentTime;
      }

      // Apply momentum if velocity is significant
      if (Math.abs(velocityX.current) > velocityThreshold) {
        applyMomentum(touchEndX, velocityX.current);
      }

      // Clear touch history
      touchHistory.current = [];
      velocityX.current = 0;

      // Prevent default browser behavior
      if (Platform.OS === 'web') {
        e.preventDefault?.();
      }
    },
    [enabled, swipeThreshold, onSwipeUp, onSwipeDown, onDoubleTap, onTap, velocityThreshold]
  );

  // Apply momentum after touch release
  const applyMomentum = useCallback(
    (startX: number, velocity: number) => {
      const friction = 0.95;
      let currentVelocity = velocity;
      let currentX = startX;

      const momentumAnimation = () => {
        if (Math.abs(currentVelocity) < 0.1) return;

        currentVelocity *= friction;
        currentX += currentVelocity * 0.016; // 60fps frame time

        onMove(currentX, currentVelocity);

        requestAnimationFrame(momentumAnimation);
      };

      requestAnimationFrame(momentumAnimation);
    },
    [onMove]
  );

  // Create pan responder
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
      onShouldBlockNativeResponder: () => true,
    })
  ).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      touchHistory.current = [];
    };
  }, []);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}

      {/* Debug velocity indicator */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <View
            style={[
              styles.velocityIndicator,
              {
                width: Math.min(Math.abs(velocityX.current) * 10, 100),
                backgroundColor: velocityX.current > 0 ? '#0F0' : '#F00',
              },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  debugInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
  },
  velocityIndicator: {
    height: 4,
    backgroundColor: '#0F0',
  },
});

export default EnhancedTouchHandler;
