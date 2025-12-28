import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Path,
  Rect,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Polygon,
  Ellipse,
} from 'react-native-svg';

interface ItemProps {
  type: 'coin' | 'gem' | 'diamond' | 'nugget' | 'bomb' | 'powerup' | 'mystery';
  size?: number;
  isAnimated?: boolean;
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export function GoldCoin({ size = 40, isAnimated = true }: Omit<ItemProps, 'type'>) {
  const rotation = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnimated) {
      // Rotation animation
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();

      // Shine animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(shine, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shine, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isAnimated]);

  const rotationDeg = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [{ rotateY: rotationDeg }],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Defs>
          <RadialGradient id="goldCoin" cx="50%" cy="40%">
            <Stop offset="0%" stopColor="#FFEF94" />
            <Stop offset="50%" stopColor="#FFD700" />
            <Stop offset="100%" stopColor="#B8860B" />
          </RadialGradient>
          <LinearGradient id="goldShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Coin base */}
        <Circle cx="20" cy="20" r="18" fill="url(#goldCoin)" />
        <Circle cx="20" cy="20" r="18" fill="none" stroke="#B8860B" strokeWidth="1" />
        <Circle cx="20" cy="20" r="15" fill="none" stroke="#DAA520" strokeWidth="0.5" />

        {/* Dollar sign */}
        <Path
          d="M 20 10 L 20 30 M 15 15 Q 15 13, 20 13 Q 25 13, 25 17 Q 25 20, 20 20 Q 15 20, 15 23 Q 15 27, 20 27 Q 25 27, 25 25"
          fill="none"
          stroke="#8B6914"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Shine effect */}
        <Animated.Ellipse cx="15" cy="15" rx="8" ry="4" fill="url(#goldShine)" opacity={shine} />
      </Svg>
    </Animated.View>
  );
}

export function Diamond({ size = 40, isAnimated = true }: Omit<ItemProps, 'type'>) {
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnimated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkle, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(sparkle, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isAnimated]);

  return (
    <View>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Defs>
          <LinearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#E6F3FF" />
            <Stop offset="50%" stopColor="#87CEEB" />
            <Stop offset="100%" stopColor="#4169E1" />
          </LinearGradient>
        </Defs>

        {/* Diamond shape */}
        <Path
          d="M 20 5 L 30 15 L 20 35 L 10 15 Z"
          fill="url(#diamondGrad)"
          stroke="#1E90FF"
          strokeWidth="1"
        />

        {/* Facets */}
        <Path d="M 20 5 L 15 15 L 20 35" fill="none" stroke="#B0E0E6" strokeWidth="0.5" />
        <Path d="M 20 5 L 25 15 L 20 35" fill="none" stroke="#B0E0E6" strokeWidth="0.5" />
        <Path d="M 10 15 L 30 15" fill="none" stroke="#B0E0E6" strokeWidth="0.5" />

        {/* Sparkle */}
        <Animated.G opacity={sparkle}>
          <Circle cx="18" cy="12" r="1.5" fill="#FFFFFF" />
          <Circle cx="25" cy="18" r="1" fill="#FFFFFF" />
          <Circle cx="15" cy="20" r="0.8" fill="#FFFFFF" />
        </Animated.G>
      </Svg>
    </View>
  );
}

export function GoldNugget({ size = 40, isAnimated = true }: Omit<ItemProps, 'type'>) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnimated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(float, {
            toValue: -3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(float, {
            toValue: 3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isAnimated]);

  return (
    <Animated.View
      style={{
        transform: [{ translateY: float }],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Defs>
          <RadialGradient id="nuggetGrad" cx="40%" cy="40%">
            <Stop offset="0%" stopColor="#FFEF94" />
            <Stop offset="60%" stopColor="#FFD700" />
            <Stop offset="100%" stopColor="#B8860B" />
          </RadialGradient>
        </Defs>

        {/* Irregular nugget shape */}
        <Path
          d="M 15 12 Q 10 15, 12 20 Q 14 25, 20 27 Q 26 28, 30 25 Q 32 20, 28 15 Q 24 10, 18 11 Q 15 11, 15 12"
          fill="url(#nuggetGrad)"
          stroke="#B8860B"
          strokeWidth="1"
        />

        {/* Texture spots */}
        <Circle cx="18" cy="18" r="2" fill="#DAA520" opacity="0.6" />
        <Circle cx="25" cy="20" r="1.5" fill="#DAA520" opacity="0.5" />
        <Circle cx="22" cy="23" r="1" fill="#FFA500" opacity="0.4" />

        {/* Shine */}
        <Ellipse cx="20" cy="16" rx="4" ry="2" fill="#FFFFFF" opacity="0.4" />
      </Svg>
    </Animated.View>
  );
}

export function Emerald({ size = 40, isAnimated = true }: Omit<ItemProps, 'type'>) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isAnimated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isAnimated]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: pulse }],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Defs>
          <LinearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#90EE90" />
            <Stop offset="50%" stopColor="#50C878" />
            <Stop offset="100%" stopColor="#228B22" />
          </LinearGradient>
        </Defs>

        {/* Emerald cut shape */}
        <Rect x="10" y="12" width="20" height="16" rx="2" fill="url(#emeraldGrad)" />
        <Path
          d="M 10 14 L 12 10 L 28 10 L 30 14 M 10 26 L 12 30 L 28 30 L 30 26"
          fill="#50C878"
          stroke="#228B22"
          strokeWidth="0.5"
        />

        {/* Facet lines */}
        <Path d="M 15 12 L 15 28" stroke="#90EE90" strokeWidth="0.5" opacity="0.6" />
        <Path d="M 20 12 L 20 28" stroke="#90EE90" strokeWidth="0.5" opacity="0.6" />
        <Path d="M 25 12 L 25 28" stroke="#90EE90" strokeWidth="0.5" opacity="0.6" />

        {/* Glow */}
        <Ellipse cx="20" cy="15" rx="6" ry="3" fill="#FFFFFF" opacity="0.3" />
      </Svg>
    </Animated.View>
  );
}

export function Bomb({ size = 40, isAnimated = true }: Omit<ItemProps, 'type'>) {
  const fuse = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnimated) {
      // Fuse spark
      Animated.loop(
        Animated.sequence([
          Animated.timing(fuse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(fuse, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Bomb shake
      Animated.loop(
        Animated.sequence([
          Animated.timing(shake, {
            toValue: -2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shake, {
            toValue: 2,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isAnimated]);

  return (
    <Animated.View
      style={{
        transform: [{ translateX: shake }],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Defs>
          <RadialGradient id="bombGrad" cx="40%" cy="40%">
            <Stop offset="0%" stopColor="#4A4A4A" />
            <Stop offset="100%" stopColor="#1C1C1C" />
          </RadialGradient>
        </Defs>

        {/* Bomb body */}
        <Circle cx="20" cy="22" r="12" fill="url(#bombGrad)" />
        <Circle cx="20" cy="22" r="12" fill="none" stroke="#000000" strokeWidth="1" />

        {/* Skull symbol */}
        <Circle cx="20" cy="20" r="3" fill="#FFFFFF" />
        <Rect x="18" y="23" width="4" height="4" fill="#FFFFFF" />
        <Circle cx="17" cy="20" r="1" fill="#000000" />
        <Circle cx="23" cy="20" r="1" fill="#000000" />

        {/* Fuse */}
        <Path
          d="M 25 15 Q 28 10, 30 8"
          fill="none"
          stroke="#8B4513"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Spark */}
        <Animated.G opacity={fuse}>
          <Circle cx="30" cy="8" r="2" fill="#FF4500" />
          <Circle cx="30" cy="8" r="3" fill="#FFFF00" opacity="0.5" />
        </Animated.G>
      </Svg>
    </Animated.View>
  );
}

export function PowerUp({
  size = 40,
  isAnimated = true,
  powerType = 'magnet',
}: Omit<ItemProps, 'type'> & { powerType?: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnimated) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulse, {
              toValue: 1.2,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulse, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isAnimated]);

  const rotateDeg = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [{ scale: pulse }, { rotate: rotateDeg }],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Defs>
          <RadialGradient id="powerGrad" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#FFD700" />
            <Stop offset="50%" stopColor="#FFA500" />
            <Stop offset="100%" stopColor="#FF6347" />
          </RadialGradient>
        </Defs>

        {/* Star shape */}
        <Polygon
          points="20,5 24,16 35,16 26,24 30,35 20,27 10,35 14,24 5,16 16,16"
          fill="url(#powerGrad)"
          stroke="#FF4500"
          strokeWidth="1"
        />

        {/* Center glow */}
        <Circle cx="20" cy="20" r="5" fill="#FFFFFF" opacity="0.6" />

        {/* Power symbol */}
        <Path
          d="M 20 17 L 20 23 M 17 19 L 23 19"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}

export function MysteryBox({ size = 40, isAnimated = true }: Omit<ItemProps, 'type'>) {
  const bounce = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (isAnimated) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(bounce, {
              toValue: -5,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(bounce, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(glow, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(glow, {
              toValue: 0.5,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }
  }, [isAnimated]);

  return (
    <Animated.View
      style={{
        transform: [{ translateY: bounce }],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Defs>
          <LinearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#9B59B6" />
            <Stop offset="100%" stopColor="#8E44AD" />
          </LinearGradient>
        </Defs>

        {/* Box body */}
        <Rect x="8" y="15" width="24" height="20" fill="url(#boxGrad)" />
        <Rect x="8" y="15" width="24" height="20" fill="none" stroke="#6C3483" strokeWidth="1" />

        {/* Box lid */}
        <Path d="M 8 15 L 12 10 L 28 10 L 32 15" fill="#8E44AD" stroke="#6C3483" strokeWidth="1" />

        {/* Question mark */}
        <Animated.Text
          x="20"
          y="28"
          fontSize="14"
          fontWeight="bold"
          fill="#FFFFFF"
          textAnchor="middle"
          opacity={glow}
        >
          ?
        </Animated.Text>

        {/* Sparkles */}
        <Animated.G opacity={glow}>
          <Circle cx="10" cy="12" r="1" fill="#FFFF00" />
          <Circle cx="30" cy="13" r="1" fill="#FFFF00" />
          <Circle cx="35" cy="20" r="0.8" fill="#FFFFFF" />
          <Circle cx="5" cy="25" r="0.8" fill="#FFFFFF" />
        </Animated.G>
      </Svg>
    </Animated.View>
  );
}

// Main component to render items
export default function GoldRushItem({ type, size = 40, isAnimated = true }: ItemProps) {
  switch (type) {
    case 'coin':
      return <GoldCoin size={size} isAnimated={isAnimated} />;
    case 'diamond':
      return <Diamond size={size} isAnimated={isAnimated} />;
    case 'gem':
      return <Emerald size={size} isAnimated={isAnimated} />;
    case 'nugget':
      return <GoldNugget size={size} isAnimated={isAnimated} />;
    case 'bomb':
      return <Bomb size={size} isAnimated={isAnimated} />;
    case 'powerup':
      return <PowerUp size={size} isAnimated={isAnimated} />;
    case 'mystery':
      return <MysteryBox size={size} isAnimated={isAnimated} />;
    default:
      return <GoldCoin size={size} isAnimated={isAnimated} />;
  }
}
