import React, { useEffect, useRef } from 'react';
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

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export default function SplashScreen({ onComplete, duration = 3000 }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const coinRotation = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide status bar during splash
    StatusBar.setHidden(true);

    // Start animations
    Animated.parallel([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Scale up pot
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      // Rotate coins
      Animated.loop(
        Animated.timing(coinRotation, {
          toValue: 360,
          duration: 3000,
          useNativeDriver: true,
        })
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
      // Float animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -10,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 10,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Complete splash after duration
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        StatusBar.setHidden(false);
        onComplete();
      });
    }, duration);

    return () => {
      clearTimeout(timer);
      StatusBar.setHidden(false);
    };
  }, [fadeAnim, scaleAnim, coinRotation, shimmerAnim, floatAnim, duration, onComplete]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#FF8C00', '#FFA500', '#FFD700']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Sparkle effect */}
        <Animated.View
          style={[
            styles.sparkle,
            {
              opacity: shimmerAnim,
              transform: [{ scale: shimmerAnim }],
            },
          ]}
        >
          <Text style={styles.sparkleText}>✨</Text>
        </Animated.View>

        {/* Main pot container */}
        <Animated.View
          style={[
            styles.potContainer,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: floatAnim },
              ],
            },
          ]}
        >
          {/* Pot of Gold Image */}
          <View style={styles.pot}>
            {/* Use the actual image if available */}
            <Image
              source={require('../assets/images/pot_of_gold_logo.png')}
              style={styles.potImage}
              resizeMode="contain"
            />
            
            {/* Fallback: Styled pot representation */}
            <View style={styles.potFallback}>
              <View style={styles.potBody}>
                <LinearGradient
                  colors={['#D2691E', '#8B4513', '#654321']}
                  style={styles.potGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
                <View style={styles.potRim} />
                <View style={styles.potHandle} />
              </View>
              
              {/* Coins in pot */}
              <View style={styles.coinsContainer}>
                {[...Array(12)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.coin,
                      {
                        left: 20 + (i % 4) * 25,
                        top: -10 - Math.floor(i / 4) * 15,
                        transform: [
                          {
                            rotate: coinRotation.interpolate({
                              inputRange: [0, 360],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FFA500', '#FF8C00']}
                      style={styles.coinGradient}
                    />
                  </Animated.View>
                ))}
              </View>
            </View>
          </View>

          {/* Floating coins */}
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={`float-${index}`}
              style={[
                styles.floatingCoin,
                {
                  left: 50 + index * 80,
                  top: -50 - index * 20,
                  transform: [
                    {
                      rotate: coinRotation.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                    {
                      translateY: Animated.multiply(floatAnim, index % 2 === 0 ? 1 : -1),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.floatingCoinGradient}
              />
            </Animated.View>
          ))}
        </Animated.View>

        {/* App Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.title}>POT OF GOLD</Text>
          <Text style={styles.subtitle}>Catch the Fortune!</Text>
        </Animated.View>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <Animated.View
              style={[
                styles.loadingProgress,
                {
                  width: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Loading amazing gameplay...</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: 100,
    left: width / 2 - 20,
  },
  sparkleText: {
    fontSize: 40,
  },
  potContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  pot: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  potImage: {
    width: '100%',
    height: '100%',
  },
  potFallback: {
    width: 180,
    height: 150,
    position: 'relative',
  },
  potBody: {
    width: 180,
    height: 120,
    borderRadius: 90,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  potGradient: {
    flex: 1,
  },
  potRim: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    height: 30,
    backgroundColor: '#8B4513',
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#654321',
  },
  potHandle: {
    position: 'absolute',
    left: -25,
    top: 40,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 5,
    borderColor: '#8B4513',
    backgroundColor: 'transparent',
  },
  coinsContainer: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
  },
  coin: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  coinGradient: {
    flex: 1,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  floatingCoin: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
  },
  floatingCoinGradient: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#8B4513',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 20,
    color: '#FFFACD',
    marginTop: 10,
    fontStyle: 'italic',
    textShadowColor: '#8B4513',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  loadingBar: {
    width: width * 0.6,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 5,
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 14,
  },
});