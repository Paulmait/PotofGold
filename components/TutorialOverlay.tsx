import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  showArrow?: boolean;
  arrowDirection?: 'up' | 'down' | 'left' | 'right';
}

interface TutorialOverlayProps {
  visible: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ visible, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = new Animated.Value(0);
  const pulseAnim = new Animated.Value(1);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 0,
      title: 'Welcome to Pot of Gold!',
      description: 'Tap anywhere on the screen to move your cart',
      highlightArea: { x: 0, y: height - 200, width: width, height: 150 },
      showArrow: true,
      arrowDirection: 'down',
    },
    {
      id: 1,
      title: 'Collect Falling Items',
      description: 'Move your cart to catch coins, gems, and power-ups',
      highlightArea: { x: width / 2 - 50, y: 100, width: 100, height: 100 },
      showArrow: true,
      arrowDirection: 'up',
    },
    {
      id: 2,
      title: 'Avoid Bombs!',
      description: 'Missing items creates blockages. Too many blockages and game over!',
      highlightArea: { x: 0, y: height - 150, width: width, height: 50 },
      showArrow: true,
      arrowDirection: 'down',
    },
    {
      id: 3,
      title: 'Build Combos',
      description: 'Collect items continuously to build combo multipliers',
      highlightArea: { x: width / 2 - 75, y: 100, width: 150, height: 50 },
    },
    {
      id: 4,
      title: 'Ready to Play!',
      description: 'Good luck collecting your fortune!',
    },
  ];

  useEffect(() => {
    if (visible) {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Pulse animation for highlight
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
    }
  }, [visible]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  if (!visible) return null;

  const step = tutorialSteps[currentStep];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Overlay with cutout for highlight area */}
      <View style={styles.overlay}>
        {step.highlightArea && (
          <Animated.View
            style={[
              styles.highlight,
              {
                left: step.highlightArea.x,
                top: step.highlightArea.y,
                width: step.highlightArea.width,
                height: step.highlightArea.height,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        )}
      </View>

      {/* Tutorial content */}
      <View style={styles.content}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>

        {/* Arrow indicator */}
        {step.showArrow && step.arrowDirection && (
          <View style={[styles.arrow, styles[`arrow${step.arrowDirection}`]]}>
            <Text style={styles.arrowText}>
              {step.arrowDirection === 'up' && '↑'}
              {step.arrowDirection === 'down' && '↓'}
              {step.arrowDirection === 'left' && '←'}
              {step.arrowDirection === 'right' && '→'}
            </Text>
          </View>
        )}

        {/* Step indicators */}
        <View style={styles.stepIndicators}>
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={[styles.stepDot, index === currentStep && styles.stepDotActive]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip Tutorial</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>
              {currentStep === tutorialSteps.length - 1 ? 'Start Game' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#FFD700',
    borderRadius: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  content: {
    position: 'absolute',
    top: height / 3,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  arrow: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowup: {
    top: -50,
    left: '50%',
    marginLeft: -20,
  },
  arrowdown: {
    bottom: -50,
    left: '50%',
    marginLeft: -20,
  },
  arrowleft: {
    left: -50,
    top: '50%',
    marginTop: -20,
  },
  arrowright: {
    right: -50,
    top: '50%',
    marginTop: -20,
  },
  arrowText: {
    fontSize: 30,
    color: '#FFD700',
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  stepDotActive: {
    backgroundColor: '#FFD700',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  nextButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  nextText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TutorialOverlay;
