import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import particleSystem, { ParticleType } from '../utils/particleSystem';
import audioManager from '../utils/audioManager';

interface PowerUpEffectsProps {
  activePowerUps: ActivePowerUp[];
  cartPosition: { x: number; y: number };
}

interface ActivePowerUp {
  id: string;
  type: PowerUpType;
  duration: number;
  remainingTime: number;
  level: number;
}

export enum PowerUpType {
  MAGNET = 'magnet',
  SHIELD = 'shield',
  MULTIPLIER = 'multiplier',
  SLOW_TIME = 'slow_time',
  BOMB = 'bomb',
  GOLDEN_TOUCH = 'golden_touch',
  RAINBOW_RUSH = 'rainbow_rush',
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PowerUpEffects: React.FC<PowerUpEffectsProps> = ({ activePowerUps, cartPosition }) => {
  const magnetFieldAnim = useRef(new Animated.Value(0)).current;
  const shieldRotateAnim = useRef(new Animated.Value(0)).current;
  const shieldPulseAnim = useRef(new Animated.Value(1)).current;
  const multiplierGlowAnim = useRef(new Animated.Value(0)).current;
  const timeWarpAnim = useRef(new Animated.Value(0)).current;
  const goldenAuraAnim = useRef(new Animated.Value(0)).current;
  const rainbowHueAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];

    activePowerUps.forEach((powerUp) => {
      switch (powerUp.type) {
        case PowerUpType.MAGNET:
          animations.push(createMagnetAnimation());
          break;
        case PowerUpType.SHIELD:
          animations.push(createShieldAnimation());
          break;
        case PowerUpType.MULTIPLIER:
          animations.push(createMultiplierAnimation(powerUp.level));
          break;
        case PowerUpType.SLOW_TIME:
          animations.push(createTimeWarpAnimation());
          break;
        case PowerUpType.GOLDEN_TOUCH:
          animations.push(createGoldenTouchAnimation());
          break;
        case PowerUpType.RAINBOW_RUSH:
          animations.push(createRainbowAnimation());
          break;
      }

      // Play power-up activation sound
      audioManager.playSound('powerUpActivate');

      // Create particle effects
      particleSystem.createPowerUpEffect(powerUp.type, cartPosition);
    });

    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }

    return () => {
      // Cleanup animations
      magnetFieldAnim.setValue(0);
      shieldRotateAnim.setValue(0);
      shieldPulseAnim.setValue(1);
      multiplierGlowAnim.setValue(0);
      timeWarpAnim.setValue(0);
      goldenAuraAnim.setValue(0);
      rainbowHueAnim.setValue(0);
    };
  }, [activePowerUps]);

  const createMagnetAnimation = () => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(magnetFieldAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(magnetFieldAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
  };

  const createShieldAnimation = () => {
    return Animated.parallel([
      Animated.loop(
        Animated.timing(shieldRotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(shieldPulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(shieldPulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ),
    ]);
  };

  const createMultiplierAnimation = (level: number) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(multiplierGlowAnim, {
          toValue: level,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(multiplierGlowAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );
  };

  const createTimeWarpAnimation = () => {
    return Animated.loop(
      Animated.timing(timeWarpAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
  };

  const createGoldenTouchAnimation = () => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(goldenAuraAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(goldenAuraAnim, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.in(Easing.exp),
          useNativeDriver: true,
        }),
      ])
    );
  };

  const createRainbowAnimation = () => {
    return Animated.loop(
      Animated.timing(rainbowHueAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
  };

  const renderMagnetField = () => {
    const hasMagnet = activePowerUps.some((p) => p.type === PowerUpType.MAGNET);
    if (!hasMagnet) return null;

    return (
      <Animated.View
        style={[
          styles.magnetField,
          {
            left: cartPosition.x - 100,
            top: cartPosition.y - 100,
            opacity: magnetFieldAnim,
            transform: [
              {
                scale: magnetFieldAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.5],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(138, 43, 226, 0.3)', 'rgba(75, 0, 130, 0.1)', 'transparent']}
          style={styles.magnetGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.magnetLines}>
          <Text style={styles.magnetIcon}>🧲</Text>
        </View>
      </Animated.View>
    );
  };

  const renderShield = () => {
    const hasShield = activePowerUps.some((p) => p.type === PowerUpType.SHIELD);
    if (!hasShield) return null;

    return (
      <Animated.View
        style={[
          styles.shield,
          {
            left: cartPosition.x - 60,
            top: cartPosition.y - 60,
            transform: [
              { scale: shieldPulseAnim },
              {
                rotate: shieldRotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(0, 191, 255, 0.4)', 'rgba(30, 144, 255, 0.2)', 'transparent']}
          style={styles.shieldGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.shieldBubble}>
          <Text style={styles.shieldIcon}>🛡️</Text>
        </View>
      </Animated.View>
    );
  };

  const renderMultiplierAura = () => {
    const multiplierPowerUp = activePowerUps.find((p) => p.type === PowerUpType.MULTIPLIER);
    if (!multiplierPowerUp) return null;

    return (
      <Animated.View
        style={[
          styles.multiplierAura,
          {
            left: cartPosition.x - 50,
            top: cartPosition.y - 50,
            opacity: multiplierGlowAnim.interpolate({
              inputRange: [0, multiplierPowerUp.level],
              outputRange: [0, 1],
            }),
          },
        ]}
      >
        {[...Array(3)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.multiplierRing,
              {
                transform: [
                  {
                    scale: multiplierGlowAnim.interpolate({
                      inputRange: [0, multiplierPowerUp.level],
                      outputRange: [1, 1.5 + i * 0.3],
                    }),
                  },
                ],
                opacity: multiplierGlowAnim.interpolate({
                  inputRange: [0, multiplierPowerUp.level],
                  outputRange: [0.8, 0.2],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500', 'transparent']}
              style={styles.ringGradient}
            />
          </Animated.View>
        ))}
        <Text style={styles.multiplierText}>x{multiplierPowerUp.level}</Text>
      </Animated.View>
    );
  };

  const renderTimeWarp = () => {
    const hasTimeWarp = activePowerUps.some((p) => p.type === PowerUpType.SLOW_TIME);
    if (!hasTimeWarp) return null;

    return (
      <Animated.View
        style={[
          styles.timeWarpOverlay,
          {
            opacity: timeWarpAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(147, 112, 219, 0.3)', 'rgba(138, 43, 226, 0.1)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View
          style={[
            styles.clockContainer,
            {
              transform: [
                {
                  rotate: timeWarpAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '-360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.clockIcon}>⏰</Text>
        </Animated.View>
      </Animated.View>
    );
  };

  const renderGoldenTouch = () => {
    const hasGoldenTouch = activePowerUps.some((p) => p.type === PowerUpType.GOLDEN_TOUCH);
    if (!hasGoldenTouch) return null;

    return (
      <Animated.View
        style={[
          styles.goldenAura,
          {
            left: cartPosition.x - 75,
            top: cartPosition.y - 75,
            opacity: goldenAuraAnim,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.5)', 'rgba(255, 223, 0, 0.3)', 'transparent']}
          style={styles.goldenGradient}
        />
        {[...Array(5)].map((_, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.goldenSparkle,
              {
                transform: [
                  {
                    translateX: Math.cos((i * 72 * Math.PI) / 180) * 50,
                  },
                  {
                    translateY: Math.sin((i * 72 * Math.PI) / 180) * 50,
                  },
                  {
                    scale: goldenAuraAnim,
                  },
                ],
              },
            ]}
          >
            ✨
          </Animated.Text>
        ))}
      </Animated.View>
    );
  };

  const renderRainbowRush = () => {
    const hasRainbow = activePowerUps.some((p) => p.type === PowerUpType.RAINBOW_RUSH);
    if (!hasRainbow) return null;

    return (
      <Animated.View
        style={[
          styles.rainbowTrail,
          {
            left: cartPosition.x - 30,
            top: cartPosition.y,
          },
        ]}
      >
        {[...Array(7)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.rainbowStripe,
              {
                backgroundColor: rainbowHueAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    `hsl(${(i * 51 + 0) % 360}, 100%, 50%)`,
                    `hsl(${(i * 51 + 360) % 360}, 100%, 50%)`,
                  ],
                }),
                transform: [
                  {
                    translateX: -i * 10,
                  },
                ],
                opacity: 0.6 - i * 0.08,
              },
            ]}
          />
        ))}
      </Animated.View>
    );
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {renderTimeWarp()}
      {renderMagnetField()}
      {renderShield()}
      {renderMultiplierAura()}
      {renderGoldenTouch()}
      {renderRainbowRush()}
    </View>
  );
};

const styles = StyleSheet.create({
  magnetField: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  magnetGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 100,
  },
  magnetLines: {
    position: 'absolute',
  },
  magnetIcon: {
    fontSize: 40,
  },
  shield: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(0, 191, 255, 0.6)',
  },
  shieldBubble: {
    position: 'absolute',
  },
  shieldIcon: {
    fontSize: 30,
  },
  multiplierAura: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiplierRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  ringGradient: {
    flex: 1,
    borderRadius: 50,
  },
  multiplierText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timeWarpOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  clockContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  clockIcon: {
    fontSize: 40,
  },
  goldenAura: {
    position: 'absolute',
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldenGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 75,
  },
  goldenSparkle: {
    position: 'absolute',
    fontSize: 20,
  },
  rainbowTrail: {
    position: 'absolute',
    flexDirection: 'row',
  },
  rainbowStripe: {
    width: 10,
    height: 30,
    marginHorizontal: 1,
    borderRadius: 5,
  },
});

export default PowerUpEffects;
