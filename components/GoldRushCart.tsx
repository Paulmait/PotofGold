import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { 
  Path, 
  Rect, 
  Circle, 
  G, 
  Defs, 
  LinearGradient, 
  Stop,
  RadialGradient,
  Ellipse,
  Polygon
} from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

interface GoldRushCartProps {
  position: number;
  size: number;
  isTurboActive?: boolean;
  isMoving?: boolean;
  skin?: 'default' | 'golden' | 'diamond' | 'emerald' | 'ruby';
  level?: number;
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedG = Animated.createAnimatedComponent(G);

export default function GoldRushCart({
  position,
  size,
  isTurboActive = false,
  isMoving = false,
  skin = 'default',
  level = 1,
}: GoldRushCartProps) {
  const wheelRotation = useRef(new Animated.Value(0)).current;
  const cartBounce = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.8)).current;

  // Wheel spinning animation
  useEffect(() => {
    if (isMoving || isTurboActive) {
      const speed = isTurboActive ? 100 : 300;
      Animated.loop(
        Animated.timing(wheelRotation, {
          toValue: 1,
          duration: speed,
          useNativeDriver: true,
        })
      ).start();
    } else {
      wheelRotation.setValue(0);
    }
  }, [isMoving, isTurboActive, wheelRotation]);

  // Cart bounce animation when moving
  useEffect(() => {
    if (isMoving) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cartBounce, {
            toValue: -2,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(cartBounce, {
            toValue: 2,
            duration: 150,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(cartBounce, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [isMoving, cartBounce]);

  // Sparkle animation for premium skins
  useEffect(() => {
    if (skin !== 'default') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [skin, sparkleAnim]);

  // Glow animation for turbo mode
  useEffect(() => {
    if (isTurboActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0.8);
    }
  }, [isTurboActive, glowAnim]);

  const getSkinColors = () => {
    switch (skin) {
      case 'golden':
        return {
          primary: '#FFD700',
          secondary: '#FFA500',
          accent: '#FF8C00',
          metal: '#B8860B',
        };
      case 'diamond':
        return {
          primary: '#B9F2FF',
          secondary: '#87CEEB',
          accent: '#4169E1',
          metal: '#C0C0C0',
        };
      case 'emerald':
        return {
          primary: '#50C878',
          secondary: '#228B22',
          accent: '#006400',
          metal: '#2F4F4F',
        };
      case 'ruby':
        return {
          primary: '#E0115F',
          secondary: '#DC143C',
          accent: '#8B0000',
          metal: '#800020',
        };
      default:
        return {
          primary: '#8B4513',
          secondary: '#654321',
          accent: '#3E2723',
          metal: '#696969',
        };
    }
  };

  const colors = getSkinColors();
  const wheelRotationDeg = wheelRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: cartBounce },
          ],
        },
      ]}
    >
      {/* Glow effect for turbo mode */}
      {isTurboActive && (
        <Animated.View
          style={[
            styles.glowEffect,
            {
              opacity: glowAnim,
              transform: [{ scale: glowAnim.interpolate({
                inputRange: [0.3, 1],
                outputRange: [1, 1.3],
              })}],
            },
          ]}
        />
      )}

      <Svg width={size} height={size * 0.8} viewBox="0 0 100 80">
        <Defs>
          {/* Gradients for cart body */}
          <LinearGradient id="cartBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.secondary} stopOpacity="1" />
          </LinearGradient>
          
          {/* Metal gradient for wheels and details */}
          <LinearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.metal} stopOpacity="1" />
            <Stop offset="50%" stopColor="#A9A9A9" stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.metal} stopOpacity="1" />
          </LinearGradient>

          {/* Gold gradient for premium effects */}
          <RadialGradient id="goldShine" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#FFFF00" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#FFD700" stopOpacity="0.2" />
          </RadialGradient>
        </Defs>

        {/* Cart Rails */}
        <Rect x="10" y="55" width="80" height="3" fill="url(#metal)" />
        <Rect x="10" y="58" width="80" height="2" fill="#4A4A4A" />

        {/* Main Cart Body */}
        <G>
          {/* Cart bucket shape - trapezoidal mining cart */}
          <Path
            d="M 20 25 L 80 25 L 75 50 L 25 50 Z"
            fill="url(#cartBody)"
            stroke={colors.accent}
            strokeWidth="2"
          />
          
          {/* Cart front panel */}
          <Path
            d="M 25 50 L 20 25 L 15 30 L 22 52 Z"
            fill={colors.secondary}
            stroke={colors.accent}
            strokeWidth="1"
          />
          
          {/* Cart back panel */}
          <Path
            d="M 75 50 L 80 25 L 85 30 L 78 52 Z"
            fill={colors.secondary}
            stroke={colors.accent}
            strokeWidth="1"
          />

          {/* Decorative metal bands */}
          <Rect x="18" y="30" width="64" height="2" fill="url(#metal)" />
          <Rect x="18" y="40" width="64" height="2" fill="url(#metal)" />

          {/* Cart interior shadow */}
          <Ellipse cx="50" cy="35" rx="25" ry="8" fill="#000000" opacity="0.2" />

          {/* Gold/treasure pile inside cart */}
          {level > 1 && (
            <G>
              <Circle cx="45" cy="35" r="3" fill="#FFD700" />
              <Circle cx="50" cy="33" r="3" fill="#FFD700" />
              <Circle cx="55" cy="35" r="3" fill="#FFD700" />
              <Circle cx="48" cy="38" r="2" fill="#FFA500" />
              <Circle cx="52" cy="37" r="2" fill="#FFA500" />
            </G>
          )}

          {/* Premium skin sparkles */}
          {skin !== 'default' && (
            <AnimatedG
              opacity={sparkleAnim}
            >
              <Circle cx="30" cy="28" r="1" fill="#FFFFFF" />
              <Circle cx="70" cy="32" r="1" fill="#FFFFFF" />
              <Circle cx="50" cy="45" r="1" fill="#FFFFFF" />
              <Circle cx="40" cy="38" r="0.5" fill="#FFFFAA" />
              <Circle cx="60" cy="35" r="0.5" fill="#FFFFAA" />
            </AnimatedG>
          )}
        </G>

        {/* Wheels */}
        <G>
          {/* Left wheel */}
          <AnimatedG
            transform={`rotate(${wheelRotationDeg}, 25, 60)`}
            origin="25, 60"
          >
            <Circle cx="25" cy="60" r="8" fill="url(#metal)" stroke="#2C2C2C" strokeWidth="1" />
            <Circle cx="25" cy="60" r="6" fill="#3C3C3C" />
            {/* Wheel spokes */}
            <Rect x="24" y="54" width="2" height="12" fill="#888888" />
            <Rect x="19" y="59" width="12" height="2" fill="#888888" />
          </AnimatedG>

          {/* Right wheel */}
          <AnimatedG
            transform={`rotate(${wheelRotationDeg}, 75, 60)`}
            origin="75, 60"
          >
            <Circle cx="75" cy="60" r="8" fill="url(#metal)" stroke="#2C2C2C" strokeWidth="1" />
            <Circle cx="75" cy="60" r="6" fill="#3C3C3C" />
            {/* Wheel spokes */}
            <Rect x="74" y="54" width="2" height="12" fill="#888888" />
            <Rect x="69" y="59" width="12" height="2" fill="#888888" />
          </AnimatedG>
        </G>

        {/* Level indicator stars */}
        {level > 0 && (
          <G>
            {[...Array(Math.min(level, 5))].map((_, i) => (
              <Polygon
                key={i}
                points="0,-4 1.2,-1.2 4,-0.8 1.2,1.2 2,4 0,2.4 -2,4 -1.2,1.2 -4,-0.8 -1.2,-1.2"
                fill="#FFD700"
                stroke="#FFA500"
                strokeWidth="0.5"
                transform={`translate(${35 + i * 8}, 20)`}
              />
            ))}
          </G>
        )}
      </Svg>

      {/* Turbo flame effect */}
      {isTurboActive && (
        <View style={styles.turboFlames}>
          <Animated.View
            style={[
              styles.flame,
              {
                opacity: glowAnim,
                transform: [{ scaleY: glowAnim }],
              },
            ]}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFD700',
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  turboFlames: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
    gap: 5,
  },
  flame: {
    width: 15,
    height: 20,
    backgroundColor: '#FF4500',
    borderRadius: 10,
    transform: [{ skewX: '-10deg' }],
  },
});