import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import particleSystem, { ParticleType } from '../utils/particleSystem';

interface AnimatedScoreCounterProps {
  score: number;
  targetScore?: number;
  showCurrency?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: any;
  onMilestone?: (milestone: number) => void;
}

const AnimatedScoreCounter: React.FC<AnimatedScoreCounterProps> = ({
  score,
  targetScore,
  showCurrency = true,
  size = 'medium',
  style,
  onMilestone,
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [previousScore, setPreviousScore] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Track milestones
  const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000];

  useEffect(() => {
    const newScore = targetScore !== undefined ? targetScore : score;

    // Check for milestone achievements
    milestones.forEach((milestone) => {
      if (previousScore < milestone && newScore >= milestone) {
        triggerMilestoneAnimation(milestone);
        if (onMilestone) {
          onMilestone(milestone);
        }
      }
    });

    // Animate score change
    animatedValue.setValue(previousScore);

    const duration = Math.min(1500, Math.abs(newScore - previousScore) * 2);
    const isLargeIncrease = newScore - previousScore > 100;

    Animated.parallel([
      // Animate the score value
      Animated.timing(animatedValue, {
        toValue: newScore,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),

      // Scale animation for increases
      newScore > previousScore
        ? Animated.sequence([
            Animated.spring(scaleAnim, {
              toValue: 1.3,
              tension: 50,
              friction: 3,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 100,
              friction: 5,
              useNativeDriver: true,
            }),
          ])
        : Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),

      // Glow effect for large increases
      isLargeIncrease
        ? Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 700,
              useNativeDriver: true,
            }),
          ])
        : Animated.timing(glowAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),

      // Bounce effect for score increases
      newScore > previousScore
        ? Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -10,
              duration: 150,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.spring(bounceAnim, {
              toValue: 0,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
          ])
        : Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
    ]).start();

    // Update display score with animation
    const listener = animatedValue.addListener(({ value }) => {
      setDisplayScore(Math.floor(value));
    });

    setPreviousScore(newScore);

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [score, targetScore]);

  const triggerMilestoneAnimation = (milestone: number) => {
    // Create celebration particles
    particleSystem.createParticles(ParticleType.ACHIEVEMENT_STARS, { x: 200, y: 100 });

    // Epic rotation animation
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const formatScore = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const getScoreDiff = (): number => {
    return Math.max(0, displayScore - previousScore);
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 18;
      case 'medium':
        return 24;
      case 'large':
        return 32;
      case 'xlarge':
        return 48;
      default:
        return 24;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'medium':
        return 28;
      case 'large':
        return 36;
      case 'xlarge':
        return 52;
      default:
        return 28;
    }
  };

  const getScoreColor = () => {
    if (displayScore >= 100000) return ['#FF0000', '#FFD700'];
    if (displayScore >= 50000) return ['#9400D3', '#FF1493'];
    if (displayScore >= 10000) return ['#FFD700', '#FFA500'];
    if (displayScore >= 5000) return ['#00CED1', '#00BFFF'];
    if (displayScore >= 1000) return ['#32CD32', '#00FF00'];
    return ['#FFD700', '#FFA500'];
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.scoreContainer,
          {
            transform: [
              { scale: scaleAnim },
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
              { translateY: bounceAnim },
            ],
          },
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glowEffect,
            {
              opacity: glowAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[...getScoreColor(), 'transparent']}
            style={styles.glowGradient}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Score display */}
        <LinearGradient
          colors={getScoreColor()}
          style={styles.scoreBox}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.scoreContent}>
            {showCurrency && <Text style={[styles.coinIcon, { fontSize: getIconSize() }]}>🪙</Text>}
            <Text style={[styles.scoreText, { fontSize: getFontSize() }]}>
              {formatScore(displayScore)}
            </Text>
          </View>

          {/* Show score increase animation */}
          {getScoreDiff() > 0 && (
            <Animated.View
              style={[
                styles.scoreDiff,
                {
                  opacity: glowAnim,
                  transform: [
                    {
                      translateY: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -20],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.scoreDiffText}>+{formatScore(getScoreDiff())}</Text>
            </Animated.View>
          )}

          {/* Milestone indicator */}
          {milestones.includes(displayScore) && (
            <View style={styles.milestoneIndicator}>
              <Text style={styles.milestoneText}>MILESTONE!</Text>
              <Text style={styles.trophyIcon}>🏆</Text>
            </View>
          )}
        </LinearGradient>

        {/* Sparkle effects for high scores */}
        {displayScore >= 10000 && (
          <View style={styles.sparkleContainer}>
            <Text style={styles.sparkle}>✨</Text>
            <Text style={[styles.sparkle, styles.sparkle2]}>✨</Text>
            <Text style={[styles.sparkle, styles.sparkle3]}>✨</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreContainer: {
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    alignSelf: 'center',
    top: '-25%',
  },
  glowGradient: {
    flex: 1,
    borderRadius: 20,
  },
  scoreBox: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinIcon: {
    marginRight: 8,
  },
  scoreText: {
    color: '#FFF',
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scoreDiff: {
    position: 'absolute',
    top: -25,
    right: 10,
  },
  scoreDiffText: {
    color: '#00FF00',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  milestoneIndicator: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    alignItems: 'center',
  },
  milestoneText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  trophyIcon: {
    fontSize: 20,
  },
  sparkleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 16,
    animationName: 'sparkle',
    animationDuration: '2s',
    animationIterationCount: 'infinite',
  },
  sparkle2: {
    top: -10,
    right: -10,
    animationDelay: '0.5s',
  },
  sparkle3: {
    bottom: -10,
    left: -10,
    animationDelay: '1s',
  },
});

export default AnimatedScoreCounter;
