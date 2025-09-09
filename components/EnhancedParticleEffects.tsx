import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, {
  Circle,
  Path,
  G,
  Defs,
  RadialGradient,
  Stop,
  Polygon,
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface ParticleEffectProps {
  x: number;
  y: number;
  type: 'collect' | 'explosion' | 'sparkle' | 'damage' | 'levelUp' | 'combo' | 'magnet' | 'shield';
  onComplete?: () => void;
  color?: string;
  size?: number;
}

const AnimatedView = Animated.View;
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export function CoinCollectEffect({ x, y, onComplete }: ParticleEffectProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const particles = useRef([...Array(8)].map(() => ({
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
    opacity: new Animated.Value(1),
  }))).current;

  useEffect(() => {
    // Main coin effect
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 2,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Particle burst
    particles.forEach((particle, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const distance = 50 + Math.random() * 30;
      
      Animated.parallel([
        Animated.timing(particle.translateX, {
          toValue: Math.cos(angle) * distance,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(particle.translateY, {
          toValue: Math.sin(angle) * distance,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (i === particles.length - 1) {
          onComplete?.();
        }
      });
    });
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  return (
    <View style={[styles.container, { left: x - 50, top: y - 50 }]}>
      {/* Main coin */}
      <AnimatedView
        style={[
          styles.centerEffect,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: rotation },
            ],
            opacity: fadeAnim,
          },
        ]}
      >
        <Svg width={50} height={50} viewBox="0 0 50 50">
          <Defs>
            <RadialGradient id="goldGrad" cx="50%" cy="50%">
              <Stop offset="0%" stopColor="#FFEF94" />
              <Stop offset="100%" stopColor="#FFD700" />
            </RadialGradient>
          </Defs>
          <Circle cx="25" cy="25" r="20" fill="url(#goldGrad)" />
          <Path
            d="M 25 15 L 25 35 M 20 20 Q 20 18, 25 18 Q 30 18, 30 22 Q 30 25, 25 25 Q 20 25, 20 28 Q 20 32, 25 32 Q 30 32, 30 30"
            fill="none"
            stroke="#B8860B"
            strokeWidth="2"
          />
        </Svg>
      </AnimatedView>

      {/* Particles */}
      {particles.map((particle, i) => (
        <AnimatedView
          key={i}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          <View style={[styles.goldParticle, { backgroundColor: '#FFD700' }]} />
        </AnimatedView>
      ))}
    </View>
  );
}

export function ExplosionEffect({ x, y, onComplete }: ParticleEffectProps) {
  const explosionScale = useRef(new Animated.Value(0)).current;
  const explosionOpacity = useRef(new Animated.Value(1)).current;
  const shockwaveScale = useRef(new Animated.Value(0)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0.8)).current;
  const debris = useRef([...Array(12)].map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    rotate: new Animated.Value(0),
    opacity: new Animated.Value(1),
  }))).current;

  useEffect(() => {
    // Shockwave
    Animated.parallel([
      Animated.timing(shockwaveScale, {
        toValue: 3,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(shockwaveOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Main explosion
    Animated.parallel([
      Animated.timing(explosionScale, {
        toValue: 2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(explosionOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(explosionOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Flying debris
    debris.forEach((piece, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 60 + Math.random() * 40;
      const rotationEnd = Math.random() * 720 - 360;
      
      Animated.parallel([
        Animated.timing(piece.x, {
          toValue: Math.cos(angle) * distance,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(piece.y, {
            toValue: Math.sin(angle) * distance - 20,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(piece.y, {
            toValue: Math.sin(angle) * distance + 20,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(piece.rotate, {
          toValue: rotationEnd,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(piece.opacity, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (i === debris.length - 1) {
          onComplete?.();
        }
      });
    });
  }, []);

  return (
    <View style={[styles.container, { left: x - 75, top: y - 75 }]}>
      {/* Shockwave */}
      <AnimatedView
        style={[
          styles.shockwave,
          {
            transform: [{ scale: shockwaveScale }],
            opacity: shockwaveOpacity,
          },
        ]}
      />

      {/* Main explosion */}
      <AnimatedView
        style={[
          styles.explosion,
          {
            transform: [{ scale: explosionScale }],
            opacity: explosionOpacity,
          },
        ]}
      >
        <RadialGradient id="explosionGrad" cx="50%" cy="50%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="30%" stopColor="#FFD700" />
          <Stop offset="60%" stopColor="#FF6347" />
          <Stop offset="100%" stopColor="#FF0000" />
        </RadialGradient>
      </AnimatedView>

      {/* Debris */}
      {debris.map((piece, i) => (
        <AnimatedView
          key={i}
          style={[
            styles.debris,
            {
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                { rotate: piece.rotate.interpolate({
                  inputRange: [-360, 360],
                  outputRange: ['-360deg', '360deg'],
                }) },
              ],
              opacity: piece.opacity,
              backgroundColor: i % 3 === 0 ? '#FF6347' : i % 3 === 1 ? '#FFD700' : '#FF4500',
            },
          ]}
        />
      ))}
    </View>
  );
}

export function ComboEffect({ x, y, onComplete, combo = 1 }: ParticleEffectProps & { combo?: number }) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const stars = useRef([...Array(Math.min(combo, 5))].map(() => ({
    scale: new Animated.Value(0),
    rotate: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    // Main combo text animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.5,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -30,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(onComplete);
      }, 500);
    });

    // Animate stars
    stars.forEach((star, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(star.scale, {
            toValue: 1,
            friction: 4,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.timing(star.rotate, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start();
      }, i * 100);
    });
  }, []);

  const getComboColor = () => {
    if (combo >= 10) return '#FF00FF';
    if (combo >= 5) return '#FFD700';
    if (combo >= 3) return '#00FF00';
    return '#00BFFF';
  };

  return (
    <AnimatedView
      style={[
        styles.comboContainer,
        {
          left: x - 75,
          top: y - 50,
          transform: [
            { scale: scaleAnim },
            { translateY },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Combo text */}
      <Text style={[styles.comboText, { color: getComboColor() }]}>
        COMBO x{combo}!
      </Text>

      {/* Stars */}
      <View style={styles.starsContainer}>
        {stars.map((star, i) => (
          <AnimatedView
            key={i}
            style={[
              styles.star,
              {
                transform: [
                  { scale: star.scale },
                  { rotate: star.rotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }) },
                ],
              },
            ]}
          >
            <Svg width={20} height={20} viewBox="0 0 20 20">
              <Polygon
                points="10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8"
                fill={getComboColor()}
              />
            </Svg>
          </AnimatedView>
        ))}
      </View>
    </AnimatedView>
  );
}

export function LevelUpEffect({ x, y, onComplete }: ParticleEffectProps) {
  const ringScale = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(1)).current;
  const beamHeight = useRef(new Animated.Value(0)).current;
  const beamOpacity = useRef(new Animated.Value(0.8)).current;
  const textScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Light beam effect
    Animated.parallel([
      Animated.timing(beamHeight, {
        toValue: height,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(beamOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(beamOpacity, {
          toValue: 0,
          duration: 800,
          delay: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Expanding ring
    Animated.parallel([
      Animated.timing(ringScale, {
        toValue: 4,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(ringOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Level up text
    Animated.spring(textScale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      delay: 200,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(textScale, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(onComplete);
      }, 1000);
    });
  }, []);

  return (
    <View style={[styles.container, { left: 0, top: 0, width, height }]}>
      {/* Light beam */}
      <AnimatedView
        style={[
          styles.lightBeam,
          {
            left: x - 25,
            top: 0,
            height: beamHeight,
            opacity: beamOpacity,
          },
        ]}
      />

      {/* Expanding ring */}
      <AnimatedView
        style={[
          styles.ring,
          {
            left: x - 50,
            top: y - 50,
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]}
      />

      {/* Level up text */}
      <AnimatedView
        style={[
          styles.levelUpText,
          {
            left: x - 100,
            top: y - 30,
            transform: [{ scale: textScale }],
          },
        ]}
      >
        <Text style={styles.levelUpTextStyle}>LEVEL UP!</Text>
      </AnimatedView>
    </View>
  );
}

// Main component
export default function EnhancedParticleEffect(props: ParticleEffectProps) {
  switch (props.type) {
    case 'collect':
      return <CoinCollectEffect {...props} />;
    case 'explosion':
      return <ExplosionEffect {...props} />;
    case 'combo':
      return <ComboEffect {...props} />;
    case 'levelUp':
      return <LevelUpEffect {...props} />;
    default:
      return <CoinCollectEffect {...props} />;
  }
}

const Text = ({ children, style }: any) => (
  <Animated.Text style={style}>{children}</Animated.Text>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  centerEffect: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldParticle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  shockwave: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'transparent',
  },
  explosion: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6347',
  },
  debris: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  comboContainer: {
    position: 'absolute',
    width: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comboText: {
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  star: {
    marginHorizontal: 2,
  },
  lightBeam: {
    position: 'absolute',
    width: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFD700',
    backgroundColor: 'transparent',
  },
  levelUpText: {
    position: 'absolute',
    width: 200,
    alignItems: 'center',
  },
  levelUpTextStyle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});