import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { gameSoundManager } from '../utils/gameSoundManager';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  action?: 'swipe' | 'tap' | 'drag';
  demo?: React.ReactNode;
}

export default function OnboardingScreen({ route }: any) {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 0,
      title: 'Welcome to Pot of Gold!',
      description: 'Collect falling treasures and become the richest miner!',
      icon: 'trophy',
    },
    {
      id: 1,
      title: 'Move Your Cart',
      description: 'Tap anywhere on the screen to move your cart instantly',
      icon: 'finger-print',
      action: 'tap',
    },
    {
      id: 2,
      title: 'Collect Treasures',
      description: 'Catch coins, gems, and diamonds to earn points',
      icon: 'diamond',
    },
    {
      id: 3,
      title: 'Avoid Bombs',
      description: 'Watch out for bombs! They damage your cart',
      icon: 'warning',
    },
    {
      id: 4,
      title: 'Build Combos',
      description: 'Collect items consecutively for huge multipliers',
      icon: 'flame',
    },
    {
      id: 5,
      title: 'Use Power-Ups',
      description: 'Grab special power-ups for temporary advantages',
      icon: 'flash',
    },
    {
      id: 6,
      title: 'Clear Blockages',
      description: 'Missed items create blockages - clear them quickly!',
      icon: 'cube',
    },
    {
      id: 7,
      title: "Let's Play!",
      description: 'Start collecting treasures and climb the leaderboard!',
      icon: 'rocket',
    },
  ];

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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

    // Icon rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleNext = () => {
    console.log('Next button pressed, current step:', currentStep);
    try {
      gameSoundManager.playSound('buttonTap');
    } catch (e) {
      console.log('Sound error:', e);
    }
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      console.log('Haptics error:', e);
    }

    if (currentStep < onboardingSteps.length - 1) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1);
        slideAnim.setValue(width);
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      });
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    console.log('Previous button pressed, current step:', currentStep);
    if (currentStep > 0) {
      try {
        gameSoundManager.playSound('buttonTap');
      } catch (e) {
        console.log('Sound error:', e);
      }
      try {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (e) {
        console.log('Haptics error:', e);
      }
      
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep - 1);
        slideAnim.setValue(-width);
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleSkip = () => {
    console.log('Skip button pressed');
    try {
      gameSoundManager.playSound('buttonTap');
    } catch (e) {
      console.log('Sound error:', e);
    }
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (e) {
      console.log('Haptics error:', e);
    }
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      console.log('Completing onboarding...');
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      await AsyncStorage.setItem('onboarding_completed', 'true');
      await AsyncStorage.setItem('onboarding_date', new Date().toISOString());
      
      console.log('Onboarding data saved, calling callback...');
      
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (route?.params?.onComplete) {
          console.log('Calling onComplete callback from route params');
          route.params.onComplete();
        } else {
          console.log('No onComplete callback, navigating to Home');
          navigation.navigate('Home' as never);
        }
      });
      
      try {
        gameSoundManager.playSound('levelUp');
      } catch (soundError) {
        console.log('Sound error in complete:', soundError);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still try to proceed even if there's an error
      if (route?.params?.onComplete) {
        route.params.onComplete();
      } else {
        navigation.navigate('Home' as never);
      }
    }
  };

  const renderStep = (step: OnboardingStep) => {
    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        style={[
          styles.stepContainer,
          {
            transform: [
              { translateX: slideAnim },
              { scale: scaleAnim },
            ],
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            step.id === 0 && {
              transform: [{ rotate: spin }, { scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons
            name={step.icon as any}
            size={80}
            color="#FFD700"
          />
        </Animated.View>

        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>

        {/* Demos for specific steps */}
        {step.id === 1 && (
          <View style={styles.demoContainer}>
            <Animated.View
              style={[
                styles.demoCart,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Text style={styles.demoText}>👆 Tap to move here</Text>
          </View>
        )}

        {step.id === 2 && (
          <View style={styles.itemsDemo}>
            <View style={styles.demoItem}>
              <Text style={styles.itemEmoji}>🪙</Text>
              <Text style={styles.itemLabel}>Coin</Text>
              <Text style={styles.itemValue}>+10</Text>
            </View>
            <View style={styles.demoItem}>
              <Text style={styles.itemEmoji}>💎</Text>
              <Text style={styles.itemLabel}>Gem</Text>
              <Text style={styles.itemValue}>+25</Text>
            </View>
            <View style={styles.demoItem}>
              <Text style={styles.itemEmoji}>💠</Text>
              <Text style={styles.itemLabel}>Diamond</Text>
              <Text style={styles.itemValue}>+50</Text>
            </View>
          </View>
        )}

        {step.id === 5 && (
          <View style={styles.powerUpsDemo}>
            <View style={styles.powerUpItem}>
              <Text style={styles.powerUpEmoji}>🧲</Text>
              <Text style={styles.powerUpLabel}>Magnet</Text>
            </View>
            <View style={styles.powerUpItem}>
              <Text style={styles.powerUpEmoji}>🛡️</Text>
              <Text style={styles.powerUpLabel}>Shield</Text>
            </View>
            <View style={styles.powerUpItem}>
              <Text style={styles.powerUpEmoji}>⚡</Text>
              <Text style={styles.powerUpLabel}>2x Points</Text>
            </View>
            <View style={styles.powerUpItem}>
              <Text style={styles.powerUpEmoji}>⏰</Text>
              <Text style={styles.powerUpLabel}>Slow Time</Text>
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      {/* Progress dots */}
      <View style={styles.progressContainer}>
        {onboardingSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentStep && styles.progressDotActive,
              index < currentStep && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Skip button */}
      {currentStep < onboardingSteps.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep(onboardingSteps[currentStep])}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.navButton, styles.previousButton]}
            onPress={handlePrevious}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            currentStep === onboardingSteps.length - 1 && styles.startButton,
          ]}
          onPress={handleNext}
        >
          {currentStep === onboardingSteps.length - 1 ? (
            <>
              <Text style={styles.startButtonText}>Start Playing</Text>
              <Ionicons name="play" size={24} color="#FFFFFF" />
            </>
          ) : (
            <>
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={24} color="#000000" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#FFD700',
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 1,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  demoContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  demoCart: {
    width: 60,
    height: 40,
    backgroundColor: '#8B4513',
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#D2691E',
  },
  demoText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  itemsDemo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    width: '100%',
  },
  demoItem: {
    alignItems: 'center',
  },
  itemEmoji: {
    fontSize: 40,
    marginBottom: 5,
  },
  itemLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 2,
  },
  itemValue: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  powerUpsDemo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 30,
  },
  powerUpItem: {
    alignItems: 'center',
    margin: 10,
  },
  powerUpEmoji: {
    fontSize: 36,
    marginBottom: 5,
  },
  powerUpLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 100,
    justifyContent: 'center',
  },
  previousButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  nextButton: {
    backgroundColor: '#FFD700',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
});