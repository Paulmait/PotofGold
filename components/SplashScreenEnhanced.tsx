import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Text,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export default function SplashScreenEnhanced({ onComplete, duration = 3500 }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const coinFall = useRef(new Animated.Value(-100)).current;
  const [loadingText, setLoadingText] = useState('Loading amazing gameplay');
  const [dots, setDots] = useState('');

  // Loading text messages
  const loadingMessages = [
    'Loading amazing gameplay',
    'Preparing golden treasures',
    'Polishing the coins',
    'Setting up the mine cart',
    'Almost ready to play',
  ];

  useEffect(() => {
    // Hide status bar during splash
    StatusBar.setHidden(true);
    StatusBar.setBarStyle('light-content');

    // Cycle through loading messages
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingText(loadingMessages[messageIndex]);
    }, 700);

    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 300);

    // Start all animations
    Animated.parallel([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Logo entrance
      Animated.sequence([
        Animated.spring(logoScale, {
          toValue: 1.2,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      // Logo subtle rotation
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoRotate, {
            toValue: 5,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(logoRotate, {
            toValue: -5,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
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
      // Progress bar
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: duration - 500,
        useNativeDriver: false,
      }),
      // Falling coins
      Animated.loop(
        Animated.timing(coinFall, {
          toValue: height + 100,
          duration: 3000,
          useNativeDriver: true,
        })
      ),
    ]).start();

    // Complete splash after duration
    const timer = setTimeout(() => {
      clearInterval(messageInterval);
      clearInterval(dotsInterval);
      
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        StatusBar.setHidden(false);
        onComplete();
      });
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(messageInterval);
      clearInterval(dotsInterval);
      StatusBar.setHidden(false);
    };
  }, [fadeAnim, logoScale, logoRotate, shimmerAnim, progressAnim, coinFall, duration, onComplete]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* Background decoration */}
        <View style={styles.backgroundDecoration}>
          {/* Falling coins animation */}
          {[0, 1, 2, 3, 4].map((index) => (
            <Animated.Text
              key={index}
              style={[
                styles.fallingCoin,
                {
                  left: 50 + (index * 70),
                  transform: [
                    {
                      translateY: Animated.add(
                        coinFall,
                        index * -200
                      ),
                    },
                  ],
                  opacity: shimmerAnim,
                },
              ]}
            >
              🪙
            </Animated.Text>
          ))}
        </View>

        {/* Main content container */}
        <View style={styles.contentContainer}>
          {/* Logo container with glow effect */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [
                  { scale: logoScale },
                  {
                    rotate: logoRotate.interpolate({
                      inputRange: [-5, 5],
                      outputRange: ['-5deg', '5deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Glow effect */}
            <Animated.View
              style={[
                styles.glowEffect,
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.8],
                  }),
                },
              ]}
            />
            
            {/* Main splash image */}
            <Image
              source={require('../assets/images/pot_of_gold_splash.png')}
              style={styles.splashImage}
              resizeMode="contain"
            />
            
            {/* Sparkle overlay */}
            <Animated.View
              style={[
                styles.sparkleOverlay,
                {
                  opacity: shimmerAnim,
                },
              ]}
            >
              <Text style={styles.sparkle}>✨</Text>
              <Text style={[styles.sparkle, styles.sparkle2]}>✨</Text>
              <Text style={[styles.sparkle, styles.sparkle3]}>✨</Text>
            </Animated.View>
          </Animated.View>

          {/* Title with gradient text effect */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.title}>POT OF GOLD</Text>
            <Text style={styles.subtitle}>Catch the Fortune!</Text>
          </Animated.View>
        </View>

        {/* Bottom section with loading */}
        <View style={styles.bottomSection}>
          {/* Loading bar */}
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBar}>
              <Animated.View
                style={[
                  styles.loadingProgress,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.loadingShine,
                    {
                      opacity: shimmerAnim,
                      transform: [
                        {
                          translateX: shimmerAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-50, 50],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </Animated.View>
            </View>
            <Text style={styles.loadingText}>
              {loadingText}{dots}
            </Text>
          </View>

          {/* Company branding */}
          <View style={styles.brandingContainer}>
            <Text style={styles.brandingText}>Powered by Cien Rios LLC</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fallingCoin: {
    position: 'absolute',
    fontSize: 30,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  glowEffect: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 10,
  },
  splashImage: {
    width: 250,
    height: 250,
    zIndex: 1,
  },
  sparkleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 24,
    top: 20,
    left: 40,
  },
  sparkle2: {
    top: 50,
    right: 30,
    left: undefined,
  },
  sparkle3: {
    bottom: 40,
    left: 50,
    top: undefined,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 10,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFA500',
    marginTop: 8,
    fontStyle: 'italic',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingBar: {
    width: width * 0.7,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 6,
    overflow: 'hidden',
  },
  loadingShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  loadingText: {
    color: '#FFA500',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  brandingContainer: {
    opacity: 0.7,
  },
  brandingText: {
    color: '#888',
    fontSize: 12,
  },
});