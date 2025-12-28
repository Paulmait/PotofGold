import { useEffect, useRef, useState } from 'react';
import { PanResponder, Animated } from 'react-native';
import { PlatformUtils } from '../src/utils/platformUtils';

interface InputPosition {
  x: number;
  y: number;
  isPressed: boolean;
}

export const useCrossPlatformInput = (onMove: (x: number) => void) => {
  const [inputPosition, setInputPosition] = useState<InputPosition>({
    x: 0,
    y: 0,
    isPressed: false,
  });

  const panValue = useRef(new Animated.ValueXY()).current;

  // Mobile touch input
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setInputPosition((prev) => ({ ...prev, isPressed: true }));
        PlatformUtils.hapticFeedback('light');
      },
      onPanResponderMove: (evt, gestureState) => {
        const newX = gestureState.dx;
        onMove(newX);
        setInputPosition({
          x: newX,
          y: gestureState.dy,
          isPressed: true,
        });
      },
      onPanResponderRelease: () => {
        setInputPosition((prev) => ({ ...prev, isPressed: false }));
        panValue.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  // Web keyboard/mouse input
  useEffect(() => {
    if (!PlatformUtils.isWeb) return;

    let currentX = 0;
    let isMouseDown = false;
    let animationFrame: number;

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          currentX = Math.max(currentX - 10, -150);
          onMove(currentX);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          currentX = Math.min(currentX + 10, 150);
          onMove(currentX);
          break;
        case ' ':
        case 'Enter':
          // Action button
          break;
      }
    };

    // Mouse controls
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const centerX = rect.width / 2;
      const relativeX = e.clientX - rect.left - centerX;
      const normalizedX = Math.max(-150, Math.min(150, relativeX));

      currentX = normalizedX;
      onMove(normalizedX);

      setInputPosition({
        x: normalizedX,
        y: e.clientY - rect.top,
        isPressed: true,
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      handleMouseMove(e);
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      setInputPosition((prev) => ({ ...prev, isPressed: false }));
    };

    // Touch controls for web
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const centerX = rect.width / 2;
      const relativeX = touch.clientX - rect.left - centerX;
      const normalizedX = Math.max(-150, Math.min(150, relativeX));

      currentX = normalizedX;
      onMove(normalizedX);

      setInputPosition({
        x: normalizedX,
        y: touch.clientY - rect.top,
        isPressed: true,
      });
    };

    const handleTouchEnd = () => {
      setInputPosition((prev) => ({ ...prev, isPressed: false }));
    };

    // Gamepad support
    const handleGamepad = () => {
      const gamepads = navigator.getGamepads();
      const gamepad = gamepads[0];

      if (gamepad && gamepad.connected) {
        const leftStickX = gamepad.axes[0];
        if (Math.abs(leftStickX) > 0.1) {
          currentX = leftStickX * 150;
          onMove(currentX);
        }

        // Check buttons
        if (gamepad.buttons[0].pressed) {
          // A button pressed
        }
      }

      animationFrame = requestAnimationFrame(handleGamepad);
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    // Start gamepad polling if available
    if ('getGamepads' in navigator) {
      animationFrame = requestAnimationFrame(handleGamepad);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [onMove]);

  return {
    panResponder: PlatformUtils.isMobile ? panResponder : null,
    inputPosition,
    panValue,
  };
};
