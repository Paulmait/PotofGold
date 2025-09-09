import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface GameLoadingSplashProps {
  onComplete?: () => void;
  duration?: number;
}

export default function GameLoadingSplash({ 
  onComplete, 
  duration = 2500 
}: GameLoadingSplashProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Scale up
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      // Rotate pot
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
      // Progress bar
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: duration - 500,
        useNativeDriver: false,
      }),
      // Shimmer effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Complete after duration
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onComplete?.();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerInterpolate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated background particles */}
      <View style={styles.particlesContainer}>
        {[...Array(20)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                opacity: shimmerAnim,
                transform: [
                  {
                    translateY: Animated.multiply(
                      shimmerAnim,
                      Math.random() * 100 - 50
                    ),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      {/* Main content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Pot of Gold Logo */}
        <View style={styles.logoContainer}>
          <Animated.Image
            source={require('../assets/images/pot_of_gold_logo.png')}
            style={[
              styles.logo,
              {
                transform: [
                  { rotate: rotateInterpolate },
                  { scale: scaleAnim },
                ],
              },
            ]}
            resizeMode="contain"
          />
          
          {/* Shimmer overlay */}
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerInterpolate }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255, 215, 0, 0.3)', 'transparent']}
              style={styles.shimmerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>

        {/* Game Title */}
        <Animated.View style={styles.titleContainer}>
          <Text style={styles.title}>POT OF GOLD</Text>
          <Text style={styles.subtitle}>Catch the Fortune!</Text>
        </Animated.View>

        {/* Loading Progress */}
        <View style={styles.loadingContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FFD700']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
          
          <Animated.Text
            style={[
              styles.loadingText,
              {
                opacity: Animated.multiply(
                  fadeAnim,
                  shimmerAnim
                ),
              },
            ]}
          >
            Loading Game Assets...
          </Animated.Text>
        </View>

        {/* Tips */}
        <Animated.View
          style={[
            styles.tipsContainer,
            {
              opacity: shimmerAnim,
            },
          ]}
        >
          <Text style={styles.tipText}>
            💡 Tip: Swipe left and right to move your cart!
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Version info */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    zIndex: 9999,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 180,
    height: 180,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
  },
  shimmerGradient: {
    flex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFA500',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingContainer: {
    width: width * 0.7,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 14,
    marginTop: 8,
  },
  tipsContainer: {
    marginTop: 40,
    paddingHorizontal: 40,
  },
  tipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
  },
});