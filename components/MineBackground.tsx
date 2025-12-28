import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, ImageBackground } from 'react-native';
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface MineBackgroundProps {
  speed?: number;
  isPaused?: boolean;
  level?: number;
}

export default function MineBackground({
  speed = 1,
  isPaused = false,
  level = 1,
}: MineBackgroundProps) {
  // Parallax layers animations
  const bgLayer1 = useRef(new Animated.Value(0)).current;
  const bgLayer2 = useRef(new Animated.Value(0)).current;
  const bgLayer3 = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  // Parallax scrolling animation
  useEffect(() => {
    if (!isPaused) {
      // Far background (slowest)
      Animated.loop(
        Animated.timing(bgLayer1, {
          toValue: -width,
          duration: 30000 / speed,
          useNativeDriver: true,
        })
      ).start();

      // Mid background
      Animated.loop(
        Animated.timing(bgLayer2, {
          toValue: -width,
          duration: 20000 / speed,
          useNativeDriver: true,
        })
      ).start();

      // Near background (fastest)
      Animated.loop(
        Animated.timing(bgLayer3, {
          toValue: -width,
          duration: 10000 / speed,
          useNativeDriver: true,
        })
      ).start();

      // Sparkle animation for gold veins
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
  }, [isPaused, speed]);

  const getBackgroundColor = () => {
    // Change background based on level/depth
    if (level < 5) return ['#1a1a2e', '#16213e', '#0f3460'];
    if (level < 10) return ['#2C1810', '#1F1105', '#0D0600'];
    if (level < 15) return ['#1C0B1F', '#2D1B3D', '#3E2C5A'];
    return ['#0A0A0A', '#1A1A1A', '#2A2A2A'];
  };

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <View style={styles.gradientContainer}>
        <LinearGradient colors={getBackgroundColor()} style={StyleSheet.absoluteFillObject} />
      </View>

      {/* Layer 1: Far background - Cave walls */}
      <Animated.View
        style={[
          styles.layer,
          {
            transform: [{ translateX: bgLayer1 }],
          },
        ]}
      >
        <Svg width={width * 2} height={height} style={styles.svg}>
          <Defs>
            <LinearGradient id="rockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#3E3E3E" />
              <Stop offset="100%" stopColor="#1A1A1A" />
            </LinearGradient>
          </Defs>

          {/* Cave ceiling */}
          <Path
            d={`M 0 0 L ${width * 2} 0 L ${width * 2} 100 Q ${width * 1.5} 120, ${width} 100 Q ${width * 0.5} 80, 0 100 Z`}
            fill="url(#rockGrad)"
          />

          {/* Stalactites */}
          {[...Array(8)].map((_, i) => (
            <Polygon
              key={`stal-${i}`}
              points={`${i * 250 + 100},100 ${i * 250 + 90},150 ${i * 250 + 110},150`}
              fill="#2A2A2A"
            />
          ))}

          {/* Cave floor */}
          <Path
            d={`M 0 ${height - 150} Q ${width * 0.5} ${height - 170}, ${width} ${height - 150} Q ${width * 1.5} ${height - 130}, ${width * 2} ${height - 150} L ${width * 2} ${height} L 0 ${height} Z`}
            fill="url(#rockGrad)"
          />

          {/* Stalagmites */}
          {[...Array(6)].map((_, i) => (
            <Polygon
              key={`stag-${i}`}
              points={`${i * 300 + 150},${height - 150} ${i * 300 + 140},${height - 100} ${i * 300 + 160},${height - 100}`}
              fill="#2A2A2A"
            />
          ))}
        </Svg>
      </Animated.View>

      {/* Layer 2: Mid background - Support beams and tracks */}
      <Animated.View
        style={[
          styles.layer,
          {
            transform: [{ translateX: bgLayer2 }],
          },
        ]}
      >
        <Svg width={width * 2} height={height} style={styles.svg}>
          <Defs>
            <LinearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#8B4513" />
              <Stop offset="50%" stopColor="#654321" />
              <Stop offset="100%" stopColor="#8B4513" />
            </LinearGradient>
          </Defs>

          {/* Wooden support beams */}
          {[...Array(10)].map((_, i) => (
            <G key={`beam-${i}`}>
              {/* Vertical beam */}
              <Rect
                x={i * 200 + 50}
                y={100}
                width={20}
                height={height - 250}
                fill="url(#woodGrad)"
              />
              {/* Horizontal beam */}
              <Rect x={i * 200 + 30} y={150} width={60} height={15} fill="url(#woodGrad)" />
              {/* Diagonal support */}
              <Path
                d={`M ${i * 200 + 70} 165 L ${i * 200 + 90} 200 L ${i * 200 + 85} 205 L ${i * 200 + 65} 170 Z`}
                fill="#654321"
              />
            </G>
          ))}

          {/* Mining equipment */}
          {[...Array(4)].map((_, i) => (
            <G key={`equip-${i}`}>
              {/* Lantern */}
              <Circle cx={i * 500 + 200} cy={180} r={8} fill="#FFD700" opacity="0.6" />
              <Rect x={i * 500 + 195} y={170} width={10} height={15} fill="#8B4513" />
            </G>
          ))}
        </Svg>
      </Animated.View>

      {/* Layer 3: Near background - Gold veins and crystals */}
      <Animated.View
        style={[
          styles.layer,
          {
            transform: [{ translateX: bgLayer3 }],
          },
        ]}
      >
        <Svg width={width * 2} height={height} style={styles.svg}>
          <Defs>
            <LinearGradient id="goldVein" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFD700" />
              <Stop offset="100%" stopColor="#B8860B" />
            </LinearGradient>
            <LinearGradient id="crystal" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#B19EFF" />
              <Stop offset="100%" stopColor="#6B5FD6" />
            </LinearGradient>
          </Defs>

          {/* Gold veins in rock */}
          {[...Array(6)].map((_, i) => (
            <G key={`gold-${i}`}>
              <Path
                d={`M ${i * 300 + 100} ${200 + i * 50} Q ${i * 300 + 150} ${220 + i * 50}, ${i * 300 + 200} ${210 + i * 50}`}
                fill="none"
                stroke="url(#goldVein)"
                strokeWidth="3"
                opacity="0.7"
              />
              {/* Gold sparkles */}
              <Animated.Circle
                cx={i * 300 + 150}
                cy={215 + i * 50}
                r="2"
                fill="#FFFF00"
                opacity={sparkleAnim}
              />
            </G>
          ))}

          {/* Crystals */}
          {[...Array(4)].map((_, i) => (
            <G key={`crystal-${i}`}>
              <Polygon
                points={`${i * 400 + 300},${height - 200} ${i * 400 + 295},${height - 170} ${i * 400 + 305},${height - 170}`}
                fill="url(#crystal)"
                opacity="0.8"
              />
              <Polygon
                points={`${i * 400 + 310},${height - 195} ${i * 400 + 307},${height - 175} ${i * 400 + 313},${height - 175}`}
                fill="#9B88FF"
                opacity="0.6"
              />
            </G>
          ))}

          {/* Scattered gems */}
          {[...Array(8)].map((_, i) => (
            <Circle
              key={`gem-${i}`}
              cx={i * 250 + Math.random() * 100}
              cy={height - 180 + Math.random() * 50}
              r="3"
              fill={i % 2 === 0 ? '#50C878' : '#E0115F'}
              opacity="0.6"
            />
          ))}
        </Svg>
      </Animated.View>

      {/* Fog/dust overlay */}
      <View style={styles.fogOverlay} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.05)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Dynamic lighting based on level */}
      {level > 5 && (
        <View style={styles.dynamicLighting} pointerEvents="none">
          <LinearGradient
            colors={[
              'transparent',
              `rgba(255, ${Math.max(0, 255 - level * 10)}, 0, 0.1)`,
              'transparent',
            ]}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a2e',
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  layer: {
    position: 'absolute',
    width: width * 2,
    height: height,
  },
  svg: {
    position: 'absolute',
  },
  fogOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  dynamicLighting: {
    ...StyleSheet.absoluteFillObject,
  },
});
