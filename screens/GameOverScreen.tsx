import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { soundSystem } from '../utils/soundSystem';
import { adRewardsSystem } from '../utils/adRewardsSystem';
import { metaGameSystem } from '../utils/metaGameSystem';

const { width, height } = Dimensions.get('window');

interface GameOverData {
  score: number;
  coins: number;
  timeSurvived: number;
  combo: number;
  obstaclesAvoided: number;
  powerUpsUsed: number;
  blockagePercentage: number;
  reason: 'blockage' | 'time_limit' | 'manual_exit';
}

interface GameOverScreenProps {
  visible: boolean;
  gameData: GameOverData;
  onRetry: () => void;
  onExit: () => void;
  onUpgrade: () => void;
}

export default function GameOverScreen({
  visible,
  gameData,
  onRetry,
  onExit,
  onUpgrade,
}: GameOverScreenProps) {
  const [showRewards, setShowRewards] = useState(false);
  const [adAvailable, setAdAvailable] = useState(false);
  const [upgradeSuggestions, setUpgradeSuggestions] = useState<any[]>([]);

  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(100));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [scoreAnim] = useState(new Animated.Value(0));
  const [coinAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      loadGameOverData();
      animateIn();
    } else {
      animateOut();
    }
  }, [visible]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate score counting
    Animated.timing(scoreAnim, {
      toValue: gameData.score,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Animate coin counting
    Animated.timing(coinAnim, {
      toValue: gameData.coins,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadGameOverData = async () => {
    try {
      // Check if ad reward is available
      const adStatus = await adRewardsSystem.checkAdAvailability();
      setAdAvailable(adStatus.available);

      // Get upgrade suggestions based on performance
      const suggestions = await getUpgradeSuggestions();
      setUpgradeSuggestions(suggestions);

      // Play game over sound
      await soundSystem.playSound('game_over');
    } catch (error) {
      console.log('Error loading game over data:', error);
    }
  };

  const getUpgradeSuggestions = async (): Promise<any[]> => {
    const suggestions = [];

    // Analyze performance and suggest upgrades
    if (gameData.blockagePercentage >= 100) {
      suggestions.push({
        type: 'pot_upgrade',
        title: 'Upgrade Your Pot',
        description: 'A larger pot can catch more coins!',
        cost: 100,
        icon: '🔼',
      });
    }

    if (gameData.timeSurvived < 60) {
      suggestions.push({
        type: 'speed_upgrade',
        title: 'Increase Speed',
        description: 'Move faster to avoid obstacles!',
        cost: 150,
        icon: '⚡',
      });
    }

    if (gameData.combo < 5) {
      suggestions.push({
        type: 'combo_upgrade',
        title: 'Combo Multiplier',
        description: 'Build longer combos for bonus points!',
        cost: 200,
        icon: '🔥',
      });
    }

    return suggestions;
  };

  const handleRetry = async () => {
    // Play UI sound
    await soundSystem.playSound('ui_tap');
    onRetry();
  };

  const handleAdReward = async () => {
    try {
      const result = await adRewardsSystem.showRewardedAd();
      if (result.success) {
        // Play bonus sound
        await soundSystem.playSound('bonus_collected');

        Alert.alert('Bonus Earned!', `You earned ${result.reward} coins!`);
        setShowRewards(true);
      } else {
        Alert.alert('Ad Failed', 'Could not load ad. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to show ad');
    }
  };

  const handleUpgrade = async (suggestion: any) => {
    try {
      const result = await metaGameSystem.purchaseUpgrade(suggestion.type);
      if (result.success) {
        // Play upgrade sound
        await soundSystem.playSound('upgrade_success');

        Alert.alert('Upgrade Successful!', suggestion.title);
        onUpgrade();
      } else {
        Alert.alert('Upgrade Failed', 'Not enough coins');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to purchase upgrade');
    }
  };

  const getGameOverReason = () => {
    switch (gameData.reason) {
      case 'blockage':
        return 'Your pot was blocked by coins!';
      case 'time_limit':
        return 'Time ran out!';
      case 'manual_exit':
        return 'Game ended';
      default:
        return 'Game Over!';
    }
  };

  const getPerformanceRating = () => {
    const score = gameData.score;
    const time = gameData.timeSurvived;
    const combo = gameData.combo;

    if (score > 1000 && time > 120 && combo > 10) return 'S';
    if (score > 500 && time > 60 && combo > 5) return 'A';
    if (score > 200 && time > 30 && combo > 3) return 'B';
    if (score > 100 && time > 15) return 'C';
    return 'D';
  };

  const renderStatItem = (label: string, value: any, icon: string) => (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderUpgradeSuggestion = (suggestion: any) => (
    <TouchableOpacity
      key={suggestion.type}
      style={styles.suggestionCard}
      onPress={() => handleUpgrade(suggestion)}
    >
      <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
      <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
      <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
      <Text style={styles.suggestionCost}>{suggestion.cost} coins</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.gameOverTitle}>Game Over</Text>
        <Text style={styles.gameOverReason}>{getGameOverReason()}</Text>
        <View style={styles.performanceRating}>
          <Text style={styles.ratingText}>Performance: {getPerformanceRating()}</Text>
        </View>
      </View>

      {/* Stats */}
      <ScrollView style={styles.statsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {renderStatItem('Score', Math.floor(scoreAnim), '🏆')}
          {renderStatItem('Coins', Math.floor(coinAnim), '💰')}
          {renderStatItem('Time', `${gameData.timeSurvived}s`, '⏱️')}
          {renderStatItem('Combo', gameData.combo, '🔥')}
          {renderStatItem('Obstacles', gameData.obstaclesAvoided, '🚫')}
          {renderStatItem('Power-ups', gameData.powerUpsUsed, '⚡')}
        </View>
      </ScrollView>

      {/* Upgrade Suggestions */}
      {upgradeSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Upgrade Suggestions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {upgradeSuggestions.map(renderUpgradeSuggestion)}
          </ScrollView>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {adAvailable && (
          <TouchableOpacity style={styles.adButton} onPress={handleAdReward}>
            <Text style={styles.adButtonText}>🎬 Watch Ad for Bonus</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>🔄 Retry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitButtonText}>❌ Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Rewards Modal */}
      {showRewards && (
        <View style={styles.rewardsOverlay}>
          <View style={styles.rewardsModal}>
            <Text style={styles.rewardsTitle}>🎉 Bonus Earned!</Text>
            <Text style={styles.rewardsText}>You earned extra coins!</Text>
            <TouchableOpacity style={styles.rewardsButton} onPress={() => setShowRewards(false)}>
              <Text style={styles.rewardsButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  gameOverReason: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  performanceRating: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ratingText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    maxHeight: 200,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    margin: 5,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#444',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 5,
  },
  statValue: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  suggestionCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  suggestionIcon: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 5,
  },
  suggestionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  suggestionDescription: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  suggestionCost: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  adButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  adButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exitButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rewardsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardsModal: {
    backgroundColor: '#2a2a2a',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  rewardsTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rewardsText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  rewardsButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  rewardsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
