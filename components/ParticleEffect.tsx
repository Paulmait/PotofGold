import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  color: string;
}

interface ParticleEffectProps {
  x: number;
  y: number;
  type: 'collect' | 'explosion' | 'sparkle' | 'damage';
  onComplete: () => void;
}

const ParticleEffect: React.FC<ParticleEffectProps> = ({ x, y, type, onComplete }) => {
  const particles = useRef<Particle[]>([]);
  
  useEffect(() => {
    const particleConfig = getParticleConfig(type);
    
    // Create particles
    for (let i = 0; i < particleConfig.count; i++) {
      const angle = (Math.PI * 2 * i) / particleConfig.count;
      const velocity = particleConfig.velocity + Math.random() * 50;
      
      particles.current.push({
        id: i,
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
        rotation: new Animated.Value(0),
        color: particleConfig.colors[Math.floor(Math.random() * particleConfig.colors.length)],
      });
      
      // Animate particle
      const particle = particles.current[i];
      
      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: Math.cos(angle) * velocity,
          duration: particleConfig.duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: Math.sin(angle) * velocity + (particleConfig.gravity ? 100 : 0),
          duration: particleConfig.duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.scale, {
          toValue: 0,
          duration: particleConfig.duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: particleConfig.duration * 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(particle.rotation, {
          toValue: Math.random() * 360,
          duration: particleConfig.duration,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    // Cleanup after animation
    setTimeout(onComplete, particleConfig.duration);
  }, [type, onComplete]);
  
  const getParticleConfig = (type: string) => {
    switch (type) {
      case 'collect':
        return {
          count: 8,
          colors: ['#FFD700', '#FFA500', '#FFFF00'],
          velocity: 100,
          duration: 600,
          gravity: false,
        };
      case 'explosion':
        return {
          count: 12,
          colors: ['#FF0000', '#FF6600', '#FFAA00'],
          velocity: 150,
          duration: 800,
          gravity: true,
        };
      case 'sparkle':
        return {
          count: 6,
          colors: ['#FFFFFF', '#FFD700', '#87CEEB'],
          velocity: 60,
          duration: 500,
          gravity: false,
        };
      case 'damage':
        return {
          count: 10,
          colors: ['#FF0000', '#8B0000', '#DC143C'],
          velocity: 120,
          duration: 700,
          gravity: true,
        };
      default:
        return {
          count: 6,
          colors: ['#FFFFFF'],
          velocity: 80,
          duration: 500,
          gravity: false,
        };
    }
  };
  
  return (
    <View style={[styles.container, { left: x - 50, top: y - 50 }]}>
      {particles.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
                { rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })
                },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default ParticleEffect;