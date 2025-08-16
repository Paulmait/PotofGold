import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { authSystem } from '../utils/authSystem';
import { skinSystem } from '../utils/skinSystem';
import { masterGameManager } from '../utils/masterGameManager';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  navigation: any;
  route?: {
    params?: {
      onComplete?: () => void;
    };
  };
}

export default function OnboardingScreen({ navigation, route }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onboardingSteps = [
    {
      title: '🎉 Welcome to Pot of Gold!',
      subtitle: 'Your gold-collecting adventure begins here',
      description: 'We\'ve set up your account with everything you need to start your journey.',
      icon: '🏆',
    },
    {
      title: '💰 Starting Bonus',
      subtitle: '100 coins to get you started',
      description: 'Use these coins to buy your first upgrades and unlock new content.',
      icon: '💎',
    },
    {
      title: '🎨 Your First Skin',
      subtitle: 'Florida Pot - The Sunshine State',
      description: 'A beautiful pot with orange and palm tree vibes. More skins await!',
      icon: '🌴',
    },
    {
      title: '📱 Cloud Sync Ready',
      subtitle: 'Play anywhere, anytime',
      description: 'Your progress syncs across all devices. Never lose your gold!',
      icon: '☁️',
    },
    {
      title: '🎯 Ready to Play!',
      subtitle: 'Your adventure awaits',
      description: 'Start collecting gold and building your empire!',
      icon: '🚀',
    },
  ];

  const handleSignUp = async () => {
    setIsLoading(true);
    
    try {
      // Simulate sign up process
      const result = await authSystem.signUp('demo@example.com', 'password123', 'Demo User');
      
      if (result.success) {
        // Initialize skin collection
        await skinSystem.initializeCollection(result.user!.userId);
        
        // Initialize game manager
        await masterGameManager.initializeGame(result.user!.userId);
        
        setUserData({
          coins: 100,
          potLevel: 1,
          ownedSkins: ['florida'],
          currentSkin: 'florida',
          gems: 10,
          experience: 0,
          level: 1,
        });

        setCurrentStep(1);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      if (route?.params?.onComplete) {
        route.params.onComplete();
      } else {
        navigation.replace('Game');
      }
    }
  };

  const handleSkipOnboarding = () => {
    if (route?.params?.onComplete) {
      route.params.onComplete();
    } else {
      navigation.replace('Game');
    }
  };

  const renderStep = () => {
    const step = onboardingSteps[currentStep];
    
    return (
      <Animated.View 
        style={[
          styles.stepContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.stepIcon}>{step.icon}</Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
        <Text style={styles.stepDescription}>{step.description}</Text>
        
        {currentStep === 1 && userData && (
          <View style={styles.bonusContainer}>
            <View style={styles.bonusItem}>
              <Text style={styles.bonusIcon}>💰</Text>
              <Text style={styles.bonusText}>{userData.coins} Coins</Text>
            </View>
            <View style={styles.bonusItem}>
              <Text style={styles.bonusIcon}>💎</Text>
              <Text style={styles.bonusText}>{userData.gems} Gems</Text>
            </View>
            <View style={styles.bonusItem}>
              <Text style={styles.bonusIcon}>🎨</Text>
              <Text style={styles.bonusText}>Florida Pot Skin</Text>
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderProgressDots = () => {
    return (
      <View style={styles.progressContainer}>
        {onboardingSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentStep && styles.progressDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  if (currentStep === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>🏆</Text>
          <Text style={styles.title}>Pot of Gold</Text>
          <Text style={styles.subtitle}>Collect gold, build your empire!</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.welcomeText}>
            Welcome to your gold-collecting adventure! We've prepared everything you need to start your journey.
          </Text>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💰</Text>
              <Text style={styles.featureText}>100 Starting Coins</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎨</Text>
              <Text style={styles.featureText}>Free Florida Pot Skin</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>☁️</Text>
              <Text style={styles.featureText}>Cloud Sync Enabled</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📱</Text>
              <Text style={styles.featureText}>Play Anywhere</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Setting up...' : 'Start Your Adventure'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleSkipOnboarding}>
            <Text style={styles.secondaryButtonText}>Skip Setup</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderStep()}
      </ScrollView>

      {renderProgressDots()}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNextStep}>
          <Text style={styles.primaryButtonText}>
            {currentStep === onboardingSteps.length - 1 ? 'Start Playing!' : 'Next'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSkipOnboarding}>
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  stepIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  stepDescription: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  bonusContainer: {
    width: '100%',
    marginTop: 20,
  },
  bonusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  bonusIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  bonusText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#444',
    marginHorizontal: 5,
  },
  progressDotActive: {
    backgroundColor: '#FFD700',
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ccc',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
}); 