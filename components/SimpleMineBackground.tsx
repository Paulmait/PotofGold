import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SimpleMineBackgroundProps {
  speed?: number;
  isPaused?: boolean;
  level?: number;
}

export default function SimpleMineBackground({
  speed = 1,
  isPaused = false,
  level = 1,
}: SimpleMineBackgroundProps) {
  // Parallax layers animations
  const bgLayer1 = useRef(new Animated.Value(0)).current;
  const bgLayer2 = useRef(new Animated.Value(0)).current;
  const bgLayer3 = useRef(new Animated.Value(0)).current;

  // Parallax scrolling animation
  useEffect(() => {
    if (!isPaused) {
      // Far background (slowest) - cave walls
      Animated.loop(
        Animated.timing(bgLayer1, {
          toValue: -width,
          duration: 30000 / speed,
          useNativeDriver: true,
        })
      ).start();

      // Mid background - support beams
      Animated.loop(
        Animated.timing(bgLayer2, {
          toValue: -width,
          duration: 20000 / speed,
          useNativeDriver: true,
        })
      ).start();

      // Near background (fastest) - track details
      Animated.loop(
        Animated.timing(bgLayer3, {
          toValue: -width,
          duration: 10000 / speed,
          useNativeDriver: true,
        })
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
      <LinearGradient colors={getBackgroundColor()} style={StyleSheet.absoluteFillObject} />

      {/* Layer 1: Cave walls */}
      <Animated.View
        style={[
          styles.layer,
          {
            transform: [{ translateX: bgLayer1 }],
          },
        ]}
      >
        {/* Cave ceiling */}
        <View style={styles.caveCeiling}>
          {[...Array(8)].map((_, i) => (
            <View
              key={`stalactite-${i}`}
              style={[
                styles.stalactite,
                {
                  left: i * 250 + 100,
                  height: 50 + Math.random() * 30,
                },
              ]}
            />
          ))}
        </View>

        {/* Cave floor */}
        <View style={styles.caveFloor}>
          {[...Array(6)].map((_, i) => (
            <View
              key={`stalagmite-${i}`}
              style={[
                styles.stalagmite,
                {
                  left: i * 300 + 150,
                  height: 40 + Math.random() * 20,
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>

      {/* Layer 2: Support beams and lanterns */}
      <Animated.View
        style={[
          styles.layer,
          {
            transform: [{ translateX: bgLayer2 }],
          },
        ]}
      >
        {[...Array(10)].map((_, i) => (
          <View key={`beam-${i}`} style={[styles.supportBeam, { left: i * 200 + 50 }]}>
            {/* Vertical beam */}
            <View style={styles.verticalBeam} />
            {/* Horizontal beam */}
            <View style={styles.horizontalBeam} />
            {/* Lantern */}
            {i % 2 === 0 && (
              <View style={styles.lantern}>
                <View style={styles.lanternLight} />
              </View>
            )}
          </View>
        ))}
      </Animated.View>

      {/* Layer 3: Rails and gold veins */}
      <Animated.View
        style={[
          styles.layer,
          {
            transform: [{ translateX: bgLayer3 }],
          },
        ]}
      >
        {/* Rail tracks */}
        <View style={styles.railTrack} />
        <View style={[styles.railTrack, styles.railTrackRight]} />

        {/* Gold veins */}
        {[...Array(6)].map((_, i) => (
          <View
            key={`gold-${i}`}
            style={[
              styles.goldVein,
              {
                left: i * 300 + 100,
                top: 200 + i * 50,
              },
            ]}
          />
        ))}

        {/* Crystals */}
        {[...Array(4)].map((_, i) => (
          <View
            key={`crystal-${i}`}
            style={[
              styles.crystal,
              {
                left: i * 400 + 300,
                bottom: 150 + Math.random() * 50,
                backgroundColor: i % 2 === 0 ? '#B19EFF' : '#50C878',
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Fog overlay for depth */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)', 'transparent']}
        style={styles.fogOverlay}
        pointerEvents="none"
      />

      {/* Depth lighting effect */}
      {level > 5 && (
        <LinearGradient
          colors={[
            'transparent',
            `rgba(255, ${Math.max(0, 255 - level * 10)}, 0, 0.05)`,
            'transparent',
          ]}
          style={styles.depthLighting}
          pointerEvents="none"
        />
      )}

      {/* Rails at bottom (static) */}
      <View style={styles.bottomRails}>
        <View style={styles.rail} />
        <View style={[styles.rail, styles.railRight]} />
        {/* Rail ties */}
        {[...Array(20)].map((_, i) => (
          <View
            key={`tie-${i}`}
            style={[
              styles.railTie,
              {
                left: i * 50,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a2e',
  },
  layer: {
    position: 'absolute',
    width: width * 2,
    height: height,
  },
  caveCeiling: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: '#2A2A2A',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  stalactite: {
    position: 'absolute',
    width: 20,
    backgroundColor: '#3E3E3E',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  caveFloor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  stalagmite: {
    position: 'absolute',
    bottom: 0,
    width: 25,
    backgroundColor: '#3E3E3E',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  supportBeam: {
    position: 'absolute',
    top: 100,
    width: 20,
    height: height - 250,
  },
  verticalBeam: {
    width: 20,
    height: '100%',
    backgroundColor: '#8B4513',
    borderRadius: 2,
  },
  horizontalBeam: {
    position: 'absolute',
    top: 50,
    left: -20,
    width: 60,
    height: 15,
    backgroundColor: '#654321',
    borderRadius: 2,
  },
  lantern: {
    position: 'absolute',
    top: 80,
    left: 5,
    width: 10,
    height: 15,
    backgroundColor: '#8B4513',
    borderRadius: 2,
  },
  lanternLight: {
    position: 'absolute',
    top: -5,
    left: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  railTrack: {
    position: 'absolute',
    bottom: 95,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#4A4A4A',
  },
  railTrackRight: {
    bottom: 75,
  },
  goldVein: {
    position: 'absolute',
    width: 100,
    height: 3,
    backgroundColor: '#FFD700',
    opacity: 0.6,
    transform: [{ rotate: '-15deg' }],
  },
  crystal: {
    position: 'absolute',
    width: 15,
    height: 30,
    opacity: 0.7,
    transform: [{ rotate: '45deg' }],
  },
  fogOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  depthLighting: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomRails: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    height: 60,
  },
  rail: {
    position: 'absolute',
    bottom: 35,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#696969',
  },
  railRight: {
    bottom: 15,
  },
  railTie: {
    position: 'absolute',
    bottom: 10,
    width: 8,
    height: 50,
    backgroundColor: '#654321',
  },
});
