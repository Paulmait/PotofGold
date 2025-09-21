import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import particleSystem, { ParticleType } from '../utils/particleSystem';
import audioManager from '../utils/audioManager';
import funDifficultySystem from '../utils/funDifficultySystem';

interface FunGameOverModalProps {
  visible: boolean;
  score: number;
  coins: number;
  timeSurvived: number;
  bestCombo: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FunGameOverModal: React.FC<FunGameOverModalProps> = ({
  visible,
  score,
  coins,
  timeSurvived,
  bestCombo,
  onPlayAgain,
  onGoHome,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const starRotateAnim = useRef(new Animated.Value(0)).current;
  const coinBounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Play celebration sound
      audioManager.playSound('gameOver');

      // Create celebration particles
      setTimeout(() => {
        particleSystem.createLevelUpEffect(SCREEN_WIDTH, SCREEN_HEIGHT);
      }, 300);

      // Animate modal appearance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -10,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.timing(starRotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(coinBounceAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(coinBounceAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      bounceAnim.setValue(0);
      starRotateAnim.setValue(0);
      coinBounceAnim.setValue(0);
    }
  }, [visible]);

  const gameMessage = funDifficultySystem.getEndGameMessage(score, timeSurvived);
  const celebration = funDifficultySystem.getCelebrationLevel(score);

  const getRandomCompliment = () => {
    const compliments = [
      'You\'re Amazing! 🌟',
      'Fantastic Player! 🎮',
      'Pure Talent! ✨',
      'Gold Star Performance! ⭐',
      'Incredible Skills! 🏆',
      'You Rock! 🎸',
      'Superstar! 🌠',
      'Brilliant! 💎',
    ];
    return compliments[Math.floor(Math.random() * compliments.length)];
  };

  const getFunFact = () => {
    const facts = [
      `You caught ${Math.floor(score / 10)} items!`,
      `Your cart traveled ${Math.floor(timeSurvived * 5)} meters!`,
      `You created ${bestCombo * 10} sparkles!`,
      `You earned ${coins} shiny coins!`,
      `You had ${Math.floor(timeSurvived / 10)} awesome moments!`,
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onPlayAgain}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.contentContainer,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: bounceAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF8C00']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Animated Stars */}
            <Animated.Text
              style={[
                styles.decorativeStar,
                styles.starTopLeft,
                {
                  transform: [
                    {
                      rotate: starRotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              ⭐
            </Animated.Text>
            <Animated.Text
              style={[
                styles.decorativeStar,
                styles.starTopRight,
                {
                  transform: [
                    {
                      rotate: starRotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '-360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              ⭐
            </Animated.Text>

            {/* Title */}
            <Text style={styles.title}>{gameMessage.title}</Text>
            <Text style={styles.emoji}>{gameMessage.emoji}</Text>
            <Text style={styles.subtitle}>{gameMessage.subtitle}</Text>

            {/* Compliment */}
            <View style={styles.complimentBox}>
              <Text style={styles.compliment}>{getRandomCompliment()}</Text>
            </View>

            {/* Score Display */}
            <View style={styles.scoreSection}>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreIcon}>🏆</Text>
                <Text style={styles.scoreValue}>{score}</Text>
                <Text style={styles.scoreLabel}>Points</Text>
              </View>

              <View style={styles.scoreRow}>
                <Animated.Text
                  style={[
                    styles.scoreIcon,
                    {
                      transform: [
                        {
                          translateY: coinBounceAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -5],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  🪙
                </Animated.Text>
                <Text style={styles.scoreValue}>{coins}</Text>
                <Text style={styles.scoreLabel}>Coins</Text>
              </View>

              {bestCombo > 5 && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreIcon}>🔥</Text>
                  <Text style={styles.scoreValue}>{bestCombo}</Text>
                  <Text style={styles.scoreLabel}>Best Combo</Text>
                </View>
              )}
            </View>

            {/* Fun Fact */}
            <View style={styles.funFactBox}>
              <Text style={styles.funFactLabel}>Fun Fact:</Text>
              <Text style={styles.funFactText}>{getFunFact()}</Text>
            </View>

            {/* Encouragement */}
            <Text style={styles.encouragement}>{gameMessage.encouragement}</Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.playAgainButton}
                onPress={onPlayAgain}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#00FF00', '#00CC00']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.playAgainText}>Play Again! 🎮</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.homeButton}
                onPress={onGoHome}
                activeOpacity={0.8}
              >
                <View style={styles.homeButtonInner}>
                  <Text style={styles.homeButtonText}>Home 🏠</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Celebration Badge */}
            {celebration.level >= 3 && (
              <View style={styles.celebrationBadge}>
                <Text style={styles.celebrationText}>
                  {celebration.message}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  gradient: {
    padding: 30,
    alignItems: 'center',
  },
  decorativeStar: {
    position: 'absolute',
    fontSize: 40,
  },
  starTopLeft: {
    top: 10,
    left: 10,
  },
  starTopRight: {
    top: 10,
    right: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    marginBottom: 10,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 15,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  complimentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  compliment: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  scoreRow: {
    alignItems: 'center',
  },
  scoreIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
  },
  funFactBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    width: '100%',
  },
  funFactLabel: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  funFactText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
  },
  encouragement: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  playAgainButton: {
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  playAgainText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  homeButton: {
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
  },
  homeButtonInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    borderRadius: 25,
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  celebrationBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FF1493',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    transform: [{ rotate: '15deg' }],
  },
  celebrationText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default FunGameOverModal;