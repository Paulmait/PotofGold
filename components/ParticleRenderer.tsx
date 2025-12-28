import React, { useEffect, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import particleSystem, { Particle, ParticleType } from '../utils/particleSystem';

interface ParticleRendererProps {
  active: boolean;
}

const ParticleRenderer: React.FC<ParticleRendererProps> = ({ active }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      particleSystem.clearAllParticles();
      setParticles([]);
      return;
    }

    const updateInterval = setInterval(() => {
      const activeParticles = particleSystem.getActiveParticles();
      setParticles([...activeParticles]);
    }, 16); // 60 FPS

    return () => {
      clearInterval(updateInterval);
    };
  }, [active]);

  const getParticleShape = (type: ParticleType) => {
    switch (type) {
      case ParticleType.STAR_EXPLOSION:
      case ParticleType.ACHIEVEMENT_STARS:
        return '⭐';
      case ParticleType.COIN_SPARKLE:
      case ParticleType.GOLD_BURST:
        return '✨';
      case ParticleType.LEVEL_UP_CONFETTI:
        return '🎉';
      case ParticleType.POWER_UP_AURA:
        return '💫';
      case ParticleType.COMBO_TRAIL:
        return '🔥';
      case ParticleType.COLLISION_SPARK:
        return '💥';
      default:
        return '•';
    }
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.particleText,
              {
                color: particle.color,
                fontSize: particle.scale.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 30],
                }),
              },
            ]}
          >
            {getParticleShape(particle.type)}
          </Animated.Text>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleText: {
    fontWeight: 'bold',
  },
});

export default ParticleRenderer;
