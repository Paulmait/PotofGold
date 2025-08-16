import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export interface Particle {
  id: string;
  type: 'star' | 'coin' | 'heart' | 'sparkle' | 'confetti' | 'bubble' | 'rainbow';
  x: number;
  y: number;
  color?: string;
  size?: number;
  duration?: number;
}

interface ParticleEffectsProps {
  particles: Particle[];
  onParticleComplete?: (id: string) => void;
}

export default function ParticleEffects({ particles, onParticleComplete }: ParticleEffectsProps) {
  const particleAnimations = useRef<{ [key: string]: {
    scale: Animated.Value;
    opacity: Animated.Value;
    translateX: Animated.Value;
    translateY: Animated.Value;
    rotate: Animated.Value;
  }}>({}).current;

  useEffect(() => {
    particles.forEach(particle => {
      if (!particleAnimations[particle.id]) {
        // Initialize animations for new particle
        particleAnimations[particle.id] = {
          scale: new Animated.Value(0),
          opacity: new Animated.Value(1),
          translateX: new Animated.Value(0),
          translateY: new Animated.Value(0),
          rotate: new Animated.Value(0),
        };

        // Start particle animation based on type
        startParticleAnimation(particle);
      }
    });
  }, [particles]);

  const startParticleAnimation = (particle: Particle) => {
    const anims = particleAnimations[particle.id];
    if (!anims) return;

    const duration = particle.duration || 1500;

    switch (particle.type) {
      case 'star':
        // Burst outward and fade
        Animated.parallel([
          Animated.sequence([
            Animated.timing(anims.scale, {
              toValue: 1.5,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(anims.scale, {
              toValue: 0,
              duration: duration * 0.7,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anims.opacity, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(anims.rotate, {
            toValue: 3,
            duration: duration,
            useNativeDriver: true,
          }),
        ]).start(() => onParticleComplete?.(particle.id));
        break;

      case 'coin':
        // Float up with rotation
        Animated.parallel([
          Animated.timing(anims.translateY, {
            toValue: -100,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(anims.opacity, {
            toValue: 0,
            duration: duration,
            delay: duration * 0.5,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(anims.rotate, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            })
          ),
          Animated.sequence([
            Animated.timing(anims.scale, {
              toValue: 1.2,
              duration: duration * 0.5,
              useNativeDriver: true,
            }),
            Animated.timing(anims.scale, {
              toValue: 0,
              duration: duration * 0.5,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => onParticleComplete?.(particle.id));
        break;

      case 'heart':
        // Float up with wiggle
        Animated.parallel([
          Animated.timing(anims.translateY, {
            toValue: -150,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(anims.translateX, {
              toValue: 20,
              duration: duration * 0.25,
              useNativeDriver: true,
            }),
            Animated.timing(anims.translateX, {
              toValue: -20,
              duration: duration * 0.25,
              useNativeDriver: true,
            }),
            Animated.timing(anims.translateX, {
              toValue: 20,
              duration: duration * 0.25,
              useNativeDriver: true,
            }),
            Animated.timing(anims.translateX, {
              toValue: 0,
              duration: duration * 0.25,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anims.opacity, {
            toValue: 0,
            duration: duration,
            delay: duration * 0.6,
            useNativeDriver: true,
          }),
          Animated.spring(anims.scale, {
            toValue: 1.5,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start(() => onParticleComplete?.(particle.id));
        break;

      case 'sparkle':
        // Twinkle effect
        Animated.loop(
          Animated.sequence([
            Animated.timing(anims.scale, {
              toValue: 1.2,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(anims.scale, {
              toValue: 0.8,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        ).start();
        
        Animated.timing(anims.opacity, {
          toValue: 0,
          duration: duration,
          delay: duration * 0.7,
          useNativeDriver: true,
        }).start(() => onParticleComplete?.(particle.id));
        break;

      case 'confetti':
        // Fall down with rotation
        Animated.parallel([
          Animated.timing(anims.translateY, {
            toValue: height,
            duration: duration * 2,
            useNativeDriver: true,
          }),
          Animated.timing(anims.translateX, {
            toValue: (Math.random() - 0.5) * 100,
            duration: duration * 2,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(anims.rotate, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            })
          ),
          Animated.sequence([
            Animated.timing(anims.scale, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(anims.opacity, {
              toValue: 0,
              duration: duration * 2,
              delay: duration,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => onParticleComplete?.(particle.id));
        break;

      case 'bubble':
        // Float up with wobble
        Animated.parallel([
          Animated.timing(anims.translateY, {
            toValue: -200,
            duration: duration * 1.5,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(anims.translateX, {
                toValue: 10,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(anims.translateX, {
                toValue: -10,
                duration: 500,
                useNativeDriver: true,
              }),
            ])
          ),
          Animated.sequence([
            Animated.spring(anims.scale, {
              toValue: 1,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.timing(anims.scale, {
              toValue: 1.2,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(anims.scale, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => onParticleComplete?.(particle.id));
        break;

      case 'rainbow':
        // Arc motion
        Animated.parallel([
          Animated.timing(anims.translateX, {
            toValue: 100,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(anims.translateY, {
              toValue: -50,
              duration: duration * 0.5,
              useNativeDriver: true,
            }),
            Animated.timing(anims.translateY, {
              toValue: 0,
              duration: duration * 0.5,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anims.opacity, {
            toValue: 0,
            duration: duration,
            delay: duration * 0.7,
            useNativeDriver: true,
          }),
        ]).start(() => onParticleComplete?.(particle.id));
        break;
    }
  };

  const getParticleEmoji = (type: string) => {
    switch (type) {
      case 'star': return '⭐';
      case 'coin': return '🪙';
      case 'heart': return '❤️';
      case 'sparkle': return '✨';
      case 'confetti': return '🎊';
      case 'bubble': return '🫧';
      case 'rainbow': return '🌈';
      default: return '✨';
    }
  };

  const getParticleColor = (particle: Particle) => {
    if (particle.color) return particle.color;
    
    switch (particle.type) {
      case 'star': return '#FFD700';
      case 'coin': return '#FFD700';
      case 'heart': return '#FF69B4';
      case 'sparkle': return '#FFFFFF';
      case 'confetti': return ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'][Math.floor(Math.random() * 5)];
      case 'bubble': return '#87CEEB';
      case 'rainbow': return '#FF69B4';
      default: return '#FFFFFF';
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map(particle => {
        const anims = particleAnimations[particle.id];
        if (!anims) return null;

        const size = particle.size || 30;

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x - size / 2,
                top: particle.y - size / 2,
                width: size,
                height: size,
                transform: [
                  { translateX: anims.translateX },
                  { translateY: anims.translateY },
                  { scale: anims.scale },
                  {
                    rotate: anims.rotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: anims.opacity,
              },
            ]}
          >
            <Text style={[styles.particleEmoji, { fontSize: size * 0.8 }]}>
              {getParticleEmoji(particle.type)}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleEmoji: {
    textAlign: 'center',
  },
});