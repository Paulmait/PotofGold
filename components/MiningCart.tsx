import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  Platform,
} from 'react-native';

interface MiningCartProps {
  position: number;
  size: number;
  isTurboActive?: boolean;
  isMoving?: boolean;
  skin?: 'default' | 'golden' | 'diamond' | 'emerald' | 'ruby';
  level?: number;
}

export default function MiningCart({
  position,
  size,
  isTurboActive = false,
  isMoving = false,
  skin = 'default',
  level = 1,
}: MiningCartProps) {
  const wheelRotation = useRef(new Animated.Value(0)).current;
  const cartBounce = useRef(new Animated.Value(0)).current;
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
  }, [isMoving, isTurboActive]);

  // Cart bounce animation
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
      cartBounce.setValue(0);
    }
  }, [isMoving]);

  // Glow animation for turbo
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
    }
  }, [isTurboActive]);

  const getSkinColors = () => {
    switch (skin) {
      case 'golden':
        return {
          body: '#FFD700',
          trim: '#FFA500',
          wheels: '#B8860B',
        };
      case 'diamond':
        return {
          body: '#B9F2FF',
          trim: '#87CEEB',
          wheels: '#4169E1',
        };
      case 'emerald':
        return {
          body: '#50C878',
          trim: '#228B22',
          wheels: '#006400',
        };
      case 'ruby':
        return {
          body: '#E0115F',
          trim: '#DC143C',
          wheels: '#8B0000',
        };
      default:
        return {
          body: '#8B4513',
          trim: '#654321',
          wheels: '#2C2C2C',
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
          transform: [{ translateY: cartBounce }],
        },
      ]}
    >
      {/* Glow effect */}
      {isTurboActive && (
        <Animated.View
          style={[
            styles.glowEffect,
            {
              opacity: glowAnim,
              transform: [{ 
                scale: glowAnim.interpolate({
                  inputRange: [0.3, 1],
                  outputRange: [1, 1.5],
                })
              }],
            },
          ]}
        />
      )}

      {/* Cart Body - Mining Cart Style */}
      <View style={[styles.cartBody, { backgroundColor: colors.body }]}>
        {/* Cart top rim */}
        <View style={[styles.cartRim, { backgroundColor: colors.trim }]} />
        
        {/* Cart front panel - angled for mining cart look */}
        <View style={[styles.cartFront, { backgroundColor: colors.trim }]} />
        
        {/* Cart back panel - angled for mining cart look */}
        <View style={[styles.cartBack, { backgroundColor: colors.trim }]} />
        
        {/* Metal bands */}
        <View style={[styles.metalBand, styles.metalBandTop]} />
        <View style={[styles.metalBand, styles.metalBandBottom]} />
        
        {/* Gold inside cart (if level > 1) */}
        {level > 1 && (
          <View style={styles.goldContainer}>
            <View style={styles.goldPile} />
            <View style={[styles.goldCoin, { left: 15, top: 5 }]} />
            <View style={[styles.goldCoin, { left: 25, top: 3 }]} />
            <View style={[styles.goldCoin, { left: 35, top: 7 }]} />
          </View>
        )}

        {/* Level stars */}
        {level > 0 && (
          <View style={styles.levelStars}>
            {[...Array(Math.min(level, 5))].map((_, i) => (
              <View key={i} style={styles.star} />
            ))}
          </View>
        )}
      </View>

      {/* Wheels */}
      <Animated.View
        style={[
          styles.wheel,
          styles.leftWheel,
          {
            backgroundColor: colors.wheels,
            transform: [{ rotate: wheelRotationDeg }],
          },
        ]}
      >
        <View style={styles.wheelSpoke} />
        <View style={[styles.wheelSpoke, { transform: [{ rotate: '90deg' }] }]} />
        <View style={styles.wheelCenter} />
      </Animated.View>

      <Animated.View
        style={[
          styles.wheel,
          styles.rightWheel,
          {
            backgroundColor: colors.wheels,
            transform: [{ rotate: wheelRotationDeg }],
          },
        ]}
      >
        <View style={styles.wheelSpoke} />
        <View style={[styles.wheelSpoke, { transform: [{ rotate: '90deg' }] }]} />
        <View style={styles.wheelCenter} />
      </Animated.View>

      {/* Rail track connectors */}
      <View style={styles.railConnector} />

      {/* Turbo flames */}
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
          <Animated.View
            style={[
              styles.flame,
              styles.flameRight,
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
    width: 100,
    height: 80,
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
      web: {
        boxShadow: '0 0 40px rgba(255, 215, 0, 0.8)',
      },
    }),
  },
  cartBody: {
    width: 80,
    height: 50,
    borderRadius: 5,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      },
    }),
    // Trapezoidal shape for mining cart
    transform: [{ perspective: 100 }, { rotateX: '-5deg' }],
  },
  cartRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  cartFront: {
    position: 'absolute',
    left: -5,
    top: 5,
    bottom: 5,
    width: 8,
    backgroundColor: '#654321',
    transform: [{ skewY: '10deg' }],
  },
  cartBack: {
    position: 'absolute',
    right: -5,
    top: 5,
    bottom: 5,
    width: 8,
    backgroundColor: '#654321',
    transform: [{ skewY: '-10deg' }],
  },
  metalBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#4A4A4A',
  },
  metalBandTop: {
    top: 12,
  },
  metalBandBottom: {
    bottom: 12,
  },
  goldContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    height: 20,
  },
  goldPile: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 15,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    opacity: 0.8,
  },
  goldCoin: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
    borderWidth: 1,
    borderColor: '#B8860B',
  },
  levelStars: {
    position: 'absolute',
    top: -15,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  star: {
    width: 8,
    height: 8,
    backgroundColor: '#FFD700',
    marginHorizontal: 2,
    transform: [{ rotate: '45deg' }],
  },
  wheel: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    bottom: -5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1C1C1C',
  },
  leftWheel: {
    left: 15,
  },
  rightWheel: {
    right: 15,
  },
  wheelSpoke: {
    position: 'absolute',
    width: 2,
    height: 16,
    backgroundColor: '#888888',
  },
  wheelCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4A4A4A',
  },
  railConnector: {
    position: 'absolute',
    bottom: -3,
    left: 10,
    right: 10,
    height: 4,
    backgroundColor: '#2C2C2C',
  },
  turboFlames: {
    position: 'absolute',
    bottom: -15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flame: {
    width: 12,
    height: 20,
    backgroundColor: '#FF4500',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginHorizontal: 2,
  },
  flameRight: {
    backgroundColor: '#FFD700',
  },
});