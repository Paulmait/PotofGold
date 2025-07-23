import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface PotProps {
  size: number;
  skin: string;
  magnetActive: boolean;
}

const Pot: React.FC<PotProps> = ({ size, skin, magnetActive }) => {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const magnetAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Magnet effect animation
    if (magnetActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(magnetAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(magnetAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow effect for magnet
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      magnetAnim.setValue(0);
      glowAnim.setValue(0);
    }
  }, [magnetActive]);

  const getPotColors = () => {
    switch (skin) {
      case 'golden':
        return ['#FFD700', '#FFA500', '#FF8C00'];
      case 'silver':
        return ['#C0C0C0', '#A0A0A0', '#808080'];
      case 'rainbow':
        return ['#FF6B6B', '#4ECDC4', '#45B7D1'];
      case 'neon':
        return ['#00FF00', '#00FFFF', '#FF00FF'];
      default:
        return ['#8B4513', '#A0522D', '#CD853F'];
    }
  };

  const getPotStyle = () => {
    const colors = getPotColors();
    return {
      width: size,
      height: size * 0.8,
      borderRadius: size * 0.4,
    };
  };

  const magnetScale = magnetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: bounceAnim },
            { scaleX: magnetActive ? magnetScale : 1 },
          ],
        },
      ]}
    >
      {/* Magnet glow effect */}
      {magnetActive && (
        <Animated.View
          style={[
            styles.magnetGlow,
            {
              width: size * 1.5,
              height: size * 1.5,
              borderRadius: size * 0.75,
              opacity: glowOpacity,
            },
          ]}
        />
      )}

      {/* Main pot */}
      <LinearGradient
        colors={getPotColors()}
        style={[styles.pot, getPotStyle()]}
      >
        {/* Pot rim */}
        <View
          style={[
            styles.potRim,
            {
              width: size * 0.9,
              height: size * 0.1,
              borderRadius: size * 0.05,
              top: -size * 0.05,
            },
          ]}
        />
        
        {/* Pot handle */}
        <View
          style={[
            styles.potHandle,
            {
              width: size * 0.2,
              height: size * 0.3,
              borderRadius: size * 0.1,
              right: -size * 0.1,
              top: size * 0.1,
            },
          ]}
        />

        {/* Pot contents glow */}
        <View
          style={[
            styles.potContents,
            {
              width: size * 0.6,
              height: size * 0.4,
              borderRadius: size * 0.3,
            },
          ]}
        >
          <Ionicons
            name="sparkles"
            size={size * 0.3}
            color="rgba(255, 255, 255, 0.3)"
          />
        </View>
      </LinearGradient>

      {/* Magnet indicator */}
      {magnetActive && (
        <Animated.View
          style={[
            styles.magnetIndicator,
            {
              opacity: magnetAnim,
            },
          ]}
        >
          <Ionicons name="magnet" size={20} color="#FFD700" />
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  magnetGlow: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    opacity: 0.3,
  },
  pot: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  potRim: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  potHandle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  potContents: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  magnetIndicator: {
    position: 'absolute',
    top: -30,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 8,
  },
});

export default Pot; 