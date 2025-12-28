import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameContext } from '../context/GameContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { gameState } = useGameContext();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePlayPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Game');
  };

  const handleStorePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Shop');
  };

  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Settings');
  };

  const handleStatsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Stats');
  };

  const handleUpgradePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Shop'); // Upgrades are in the shop
  };

  const handleBuyGoldPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Shop'); // Coin packages are in the shop
  };

  const handleChallengePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Leaderboard'); // Social features via leaderboard
  };

  const handleLeaderboardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Leaderboard');
  };

  return (
    <LinearGradient colors={['#FFD700', '#FFA500', '#FF8C00']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Pot of Gold</Text>
          <Text style={styles.subtitle}>Catch the falling treasure!</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{gameState.highScore.toLocaleString()}</Text>
            <Text style={styles.statLabel}>High Score</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="coin" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{gameState.coins.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Coins</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{gameState.level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.playButton, styles.mainButton]}
            onPress={handlePlayPress}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#4CAF50', '#45A049']} style={styles.buttonGradient}>
              <Ionicons name="play" size={32} color="white" />
              <Text style={styles.playButtonText}>PLAY</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.storeButton]}
              onPress={handleStorePress}
              activeOpacity={0.8}
            >
              <Ionicons name="storefront" size={24} color="white" />
              <Text style={styles.secondaryButtonText}>Store</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, styles.upgradeButton]}
              onPress={handleUpgradePress}
              activeOpacity={0.8}
            >
              <Ionicons name="trending-up" size={24} color="white" />
              <Text style={styles.secondaryButtonText}>Upgrade</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, styles.buyGoldButton]}
              onPress={handleBuyGoldPress}
              activeOpacity={0.8}
            >
              <Ionicons name="card" size={24} color="white" />
              <Text style={styles.secondaryButtonText}>Buy Gold</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tertiaryButtons}>
            <TouchableOpacity
              style={[styles.tertiaryButton, styles.challengeButton]}
              onPress={handleChallengePress}
              activeOpacity={0.8}
            >
              <Ionicons name="game-controller" size={20} color="white" />
              <Text style={styles.tertiaryButtonText}>Challenge</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tertiaryButton, styles.leaderboardButton]}
              onPress={handleLeaderboardPress}
              activeOpacity={0.8}
            >
              <Ionicons name="trophy" size={20} color="white" />
              <Text style={styles.tertiaryButtonText}>Leaderboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tertiaryButton, styles.statsButton]}
              onPress={handleStatsPress}
              activeOpacity={0.8}
            >
              <Ionicons name="stats-chart" size={20} color="white" />
              <Text style={styles.tertiaryButtonText}>Stats</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Button */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettingsPress}
          activeOpacity={0.8}
        >
          <Ionicons name="settings" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    opacity: 0.9,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    backdropFilter: 'blur(10px)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    marginTop: 2,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  mainButton: {
    marginBottom: 30,
  },
  playButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  playButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 20,
    minWidth: 120,
  },
  storeButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
  },
  upgradeButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  buyGoldButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
  },
  tertiaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  tertiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  challengeButton: {
    backgroundColor: 'rgba(255, 87, 34, 0.9)',
  },
  leaderboardButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
  },
  statsButton: {
    backgroundColor: 'rgba(155, 89, 182, 0.9)',
  },
  howToPlayButton: {
    backgroundColor: 'rgba(0, 188, 212, 0.9)',
  },
  tertiaryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 6,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 12,
    backdropFilter: 'blur(10px)',
  },
});

export default HomeScreen;
