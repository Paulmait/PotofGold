import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface PowerUpProps {
  type: 'magnet' | 'slowMotion' | 'doublePoints' | 'goldRush';
}

const PowerUp: React.FC<PowerUpProps> = ({ type }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spinning animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const getPowerUpConfig = () => {
    switch (type) {
      case 'magnet':
        return {
          icon: 'magnet',
          colors: ['#FFD700', '#FFA500'],
          glowColor: '#FFD700',
          size: 40,
        };
      case 'slowMotion':
        return {
          icon: 'time',
          colors: ['#4ECDC4', '#45B7D1'],
          glowColor: '#4ECDC4',
          size: 40,
        };
      case 'doublePoints':
        return {
          icon: 'flash',
          colors: ['#FF6B6B', '#FF8E53'],
          glowColor: '#FF6B6B',
          size: 40,
        };
      case 'goldRush':
        return {
          icon: 'trending-up',
          colors: ['#FFD700', '#FFA500', '#FF8C00'],
          glowColor: '#FFD700',
          size: 45,
        };
      default:
        return {
          icon: 'star',
          colors: ['#FFD700', '#FFA500'],
          glowColor: '#FFD700',
          size: 40,
        };
    }
  };

  const config = getPowerUpConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ rotate: spin }, { scale: pulseAnim }, { translateY: floatY }],
        },
      ]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: config.glowColor,
            width: config.size + 20,
            height: config.size + 20,
            borderRadius: (config.size + 20) / 2,
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Main power-up */}
      <LinearGradient
        colors={config.colors}
        style={[
          styles.powerUp,
          {
            width: config.size,
            height: config.size,
            borderRadius: config.size / 2,
          },
        ]}
      >
        <Ionicons
          name={config.icon as keyof typeof Ionicons.glyphMap}
          size={config.size * 0.6}
          color="white"
        />
      </LinearGradient>

      {/* Sparkle effects */}
      <Animated.View
        style={[
          styles.sparkle,
          {
            opacity: glowAnim,
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <Ionicons
          name={'sparkles' as keyof typeof Ionicons.glyphMap}
          size={12}
          color={config.glowColor}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
  },
  powerUp: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sparkle: {
    position: 'absolute',
    top: -15,
    right: -15,
  },
});

export default PowerUp;
