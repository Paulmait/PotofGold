import { useRef, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';

interface MomentumConfig {
  friction: number;
  acceleration: number;
  maxSpeed: number;
  deceleration: number;
}

export const useMomentumMovement = (config?: Partial<MomentumConfig>) => {
  const defaultConfig: MomentumConfig = {
    friction: 0.95,
    acceleration: 2,
    maxSpeed: 15,
    deceleration: 0.9,
    ...config,
  };
  
  const position = useRef(new Animated.Value(0)).current;
  const velocity = useRef(0);
  const targetPosition = useRef(0);
  const animationFrame = useRef<number | null>(null);
  const lastUpdateTime = useRef(Date.now());
  const isMoving = useRef(false);
  
  // Physics update loop
  const updatePhysics = useCallback(() => {
    const now = Date.now();
    const deltaTime = (now - lastUpdateTime.current) / 1000; // Convert to seconds
    lastUpdateTime.current = now;
    
    // Calculate distance to target
    const currentPos = (position as any)._value;
    const distance = targetPosition.current - currentPos;
    
    // Apply acceleration towards target
    if (Math.abs(distance) > 1) {
      // Accelerate towards target
      const direction = Math.sign(distance);
      const targetVelocity = direction * Math.min(
        Math.abs(distance) * defaultConfig.acceleration,
        defaultConfig.maxSpeed
      );
      
      // Smooth velocity change
      velocity.current += (targetVelocity - velocity.current) * 0.2;
      
      // Apply friction
      velocity.current *= defaultConfig.friction;
      
      // Update position
      const newPosition = currentPos + velocity.current;
      position.setValue(newPosition);
      
      isMoving.current = true;
    } else {
      // Apply deceleration when close to target
      velocity.current *= defaultConfig.deceleration;
      
      if (Math.abs(velocity.current) < 0.1) {
        velocity.current = 0;
        position.setValue(targetPosition.current);
        isMoving.current = false;
      } else {
        const newPosition = currentPos + velocity.current;
        position.setValue(newPosition);
      }
    }
    
    // Continue animation if still moving
    if (isMoving.current || Math.abs(velocity.current) > 0.01) {
      animationFrame.current = requestAnimationFrame(updatePhysics);
    }
  }, [position, defaultConfig]);
  
  // Start movement to target
  const moveTo = useCallback((target: number, instant: boolean = false) => {
    targetPosition.current = target;
    
    if (instant) {
      // Instant movement without physics
      position.setValue(target);
      velocity.current = 0;
      isMoving.current = false;
      
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    } else {
      // Start physics-based movement
      if (!animationFrame.current) {
        lastUpdateTime.current = Date.now();
        animationFrame.current = requestAnimationFrame(updatePhysics);
      }
    }
  }, [position, updatePhysics]);
  
  // Apply impulse (for power-ups, boosts, etc.)
  const applyImpulse = useCallback((force: number) => {
    velocity.current += force;
    velocity.current = Math.max(
      -defaultConfig.maxSpeed,
      Math.min(defaultConfig.maxSpeed, velocity.current)
    );
    
    if (!animationFrame.current) {
      animationFrame.current = requestAnimationFrame(updatePhysics);
    }
  }, [updatePhysics, defaultConfig.maxSpeed]);
  
  // Stop all movement
  const stop = useCallback(() => {
    velocity.current = 0;
    isMoving.current = false;
    
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);
  
  return {
    position,
    moveTo,
    applyImpulse,
    stop,
    isMoving: isMoving.current,
    velocity: velocity.current,
  };
};