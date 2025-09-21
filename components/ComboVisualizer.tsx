import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import particleSystem, { ParticleType } from '../utils/particleSystem';
import audioManager from '../utils/audioManager';

interface ComboVisualizerProps {
  comboCount: number;
  multiplier: number;
  position?: { x: number; y: number };
  onComboEnd?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ComboVisualizer: React.FC<ComboVisualizerProps> = ({
  comboCount,
  multiplier,
  position,
  onComboEnd,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const textScaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (comboCount > 0) {
      // Play combo sound with increasing pitch
      audioManager.playComboSound(comboCount);

      // Create particle effects
      if (position) {
        particleSystem.createComboEffect(comboCount, position);
      }

      // Animate combo display
      Animated.parallel([
        // Main scale animation
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),

        // Text scale with overshoot
        Animated.spring(textScaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 4,
          delay: 50,
          useNativeDriver: true,
        }),

        // Continuous rotation for high combos
        comboCount > 5
          ? Animated.loop(
              Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
              })
            )
          : Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),

        // Pulsing effect
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 500,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 500,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        ),

        // Glow effect for high combos
        comboCount > 10
          ? Animated.loop(
              Animated.sequence([
                Animated.timing(glowAnim, {
                  toValue: 1,
                  duration: 800,
                  easing: Easing.inOut(Easing.quad),
                  useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                  toValue: 0.3,
                  duration: 800,
                  easing: Easing.inOut(Easing.quad),
                  useNativeDriver: true,
                }),
              ])
            )
          : Animated.timing(glowAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),

        // Shake effect for epic combos
        comboCount > 20
          ? Animated.loop(
              Animated.sequence([
                Animated.timing(shakeAnim, {
                  toValue: 1,
                  duration: 50,
                  useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                  toValue: -1,
                  duration: 50,
                  useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                  toValue: 0,
                  duration: 50,
                  useNativeDriver: true,
                }),
              ])
            )
          : Animated.timing(shakeAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
      ]).start();
    } else {
      // Reset animations when combo ends
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(textScaleAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onComboEnd) {
          onComboEnd();
        }
      });
    }
  }, [comboCount]);

  const getComboTitle = () => {
    if (comboCount <= 5) return 'COMBO!';
    if (comboCount <= 10) return 'SUPER COMBO!';
    if (comboCount <= 20) return 'MEGA COMBO!';
    if (comboCount <= 30) return 'ULTRA COMBO!';
    if (comboCount <= 50) return 'LEGENDARY!';
    return 'GODLIKE!!!';
  };

  const getComboColors = () => {
    if (comboCount <= 5) return ['#FFD700', '#FFA500'];
    if (comboCount <= 10) return ['#FF69B4', '#FF1493'];
    if (comboCount <= 20) return ['#00FFFF', '#FF00FF'];
    if (comboCount <= 30) return ['#FF0000', '#FFD700'];
    if (comboCount <= 50) return ['#9400D3', '#FF1493'];
    return ['#FF0000', '#00FF00', '#0000FF'];
  };

  const getComboFontSize = () => {
    return Math.min(60, 30 + comboCount);
  };

  if (comboCount === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
            {
              translateX: shakeAnim.interpolate({
                inputRange: [-1, 1],
                outputRange: [-5, 5],
              }),
            },
          ],
        },
      ]}
    >
      {/* Glow effect background */}
      {comboCount > 10 && (
        <Animated.View
          style={[
            styles.glowBackground,
            {
              opacity: glowAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[...getComboColors(), 'transparent']}
            style={styles.gradient}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      )}

      {/* Main combo display */}
      <LinearGradient
        colors={getComboColors()}
        style={styles.comboBox}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={{
            transform: [
              { scale: pulseAnim },
              { scale: textScaleAnim },
            ],
          }}
        >
          <Text style={[styles.comboTitle, { fontSize: getComboFontSize() * 0.4 }]}>
            {getComboTitle()}
          </Text>
          <Text style={[styles.comboCount, { fontSize: getComboFontSize() }]}>
            {comboCount}
          </Text>
          <Text style={styles.multiplierText}>x{multiplier.toFixed(1)}</Text>
        </Animated.View>

        {/* Streak fire effect for high combos */}
        {comboCount > 15 && (
          <View style={styles.fireContainer}>
            <Text style={styles.fireEmoji}>🔥🔥🔥</Text>
          </View>
        )}
      </LinearGradient>

      {/* Lightning bolts for epic combos */}
      {comboCount > 25 && (
        <>
          <Text style={[styles.lightning, styles.lightningLeft]}>⚡</Text>
          <Text style={[styles.lightning, styles.lightningRight]}>⚡</Text>
        </>
      )}

      {/* Crown for legendary combos */}
      {comboCount > 40 && (
        <Text style={styles.crown}>👑</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowBackground: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: 200,
    borderRadius: 20,
  },
  gradient: {
    flex: 1,
    borderRadius: 20,
  },
  comboBox: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  comboTitle: {
    color: '#FFF',
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    letterSpacing: 2,
  },
  comboCount: {
    color: '#FFF',
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 5,
    marginVertical: 5,
  },
  multiplierText: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  fireContainer: {
    position: 'absolute',
    bottom: -10,
  },
  fireEmoji: {
    fontSize: 30,
  },
  lightning: {
    position: 'absolute',
    fontSize: 50,
    top: -20,
  },
  lightningLeft: {
    left: -30,
    transform: [{ rotate: '-20deg' }],
  },
  lightningRight: {
    right: -30,
    transform: [{ rotate: '20deg' }],
  },
  crown: {
    position: 'absolute',
    top: -40,
    fontSize: 40,
  },
});

export default ComboVisualizer;