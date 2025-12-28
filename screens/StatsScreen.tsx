import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameContext } from '../context/GameContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const StatsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { gameState } = useGameContext();

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getAverageScore = () => {
    if (gameState.gamesPlayed === 0) return 0;
    return Math.round(gameState.totalCoins / gameState.gamesPlayed);
  };

  const getCoinEfficiency = () => {
    if (gameState.coinsCollected === 0) return 0;
    return Math.round((gameState.coinsCollected / gameState.totalCoins) * 100);
  };

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="white" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </View>
  );

  const renderAchievement = (
    title: string,
    description: string,
    achieved: boolean,
    icon: string
  ) => (
    <View style={[styles.achievementItem, { opacity: achieved ? 1 : 0.5 }]}>
      <View style={[styles.achievementIcon, { backgroundColor: achieved ? '#4CAF50' : '#666' }]}>
        <Ionicons name={icon as any} size={20} color="white" />
      </View>
      <View style={styles.achievementInfo}>
        <Text style={[styles.achievementTitle, { color: achieved ? 'white' : '#999' }]}>
          {title}
        </Text>
        <Text
          style={[
            styles.achievementDescription,
            { color: achieved ? 'rgba(255,255,255,0.8)' : '#666' },
          ]}
        >
          {description}
        </Text>
      </View>
      {achieved && (
        <View style={styles.achievementBadge}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
      )}
    </View>
  );

  return (
    <LinearGradient colors={['#FFD700', '#FFA500', '#FF8C00']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Statistics</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'High Score',
              gameState.highScore.toLocaleString(),
              'trophy',
              '#FFD700'
            )}
            {renderStatCard(
              'Total Coins',
              gameState.totalCoins.toLocaleString(),
              'coin',
              '#FFD700'
            )}
            {renderStatCard('Games Played', gameState.gamesPlayed, 'game-controller', '#4CAF50')}
            {renderStatCard('Power-ups Used', gameState.powerUpsUsed, 'flash', '#FF6B6B')}
          </View>
        </View>

        {/* Performance Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.performanceContainer}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Average Score</Text>
              <Text style={styles.performanceValue}>{getAverageScore().toLocaleString()}</Text>
            </View>

            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Coin Efficiency</Text>
              <Text style={styles.performanceValue}>{getCoinEfficiency()}%</Text>
            </View>

            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Total Play Time</Text>
              <Text style={styles.performanceValue}>{formatTime(gameState.totalPlayTime)}</Text>
            </View>

            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Current Level</Text>
              <Text style={styles.performanceValue}>{gameState.level}</Text>
            </View>
          </View>
        </View>

        {/* Upgrades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upgrades</Text>
          <View style={styles.upgradesContainer}>
            <View style={styles.upgradeItem}>
              <Ionicons name="resize" size={20} color="#FFD700" />
              <Text style={styles.upgradeLabel}>Pot Size</Text>
              <Text style={styles.upgradeValue}>Level {Math.floor(gameState.potSize * 5)}</Text>
            </View>

            <View style={styles.upgradeItem}>
              <Ionicons name="speedometer" size={20} color="#FFD700" />
              <Text style={styles.upgradeLabel}>Movement Speed</Text>
              <Text style={styles.upgradeValue}>Level {Math.floor(gameState.potSpeed * 3)}</Text>
            </View>

            <View style={styles.upgradeItem}>
              <Ionicons name="magnet" size={20} color="#FFD700" />
              <Text style={styles.upgradeLabel}>Magnet Power</Text>
              <Text style={styles.upgradeValue}>Level {Math.floor(gameState.potLevel)}</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>

          {renderAchievement(
            'First Steps',
            'Play your first game',
            gameState.gamesPlayed > 0,
            'footsteps'
          )}

          {renderAchievement(
            'Coin Collector',
            'Collect 1000 coins',
            gameState.totalCoins >= 1000,
            'coin'
          )}

          {renderAchievement(
            'High Roller',
            'Score 10,000 points',
            gameState.highScore >= 10000,
            'trophy'
          )}

          {renderAchievement(
            'Power Player',
            'Use 50 power-ups',
            gameState.powerUpsUsed >= 50,
            'flash'
          )}

          {renderAchievement(
            'Dedicated Player',
            'Play 100 games',
            gameState.gamesPlayed >= 100,
            'game-controller'
          )}

          {renderAchievement(
            'Millionaire',
            'Collect 1,000,000 coins',
            gameState.totalCoins >= 1000000,
            'diamond'
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <Ionicons name="time" size={16} color="#FFD700" />
              <Text style={styles.activityText}>
                Last game: {gameState.gamesPlayed > 0 ? 'Today' : 'Never played'}
              </Text>
            </View>

            <View style={styles.activityItem}>
              <Ionicons name="trending-up" size={16} color="#4CAF50" />
              <Text style={styles.activityText}>
                Best streak: {Math.floor(gameState.highScore / 1000)}k points
              </Text>
            </View>

            <View style={styles.activityItem}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.activityText}>
                Achievements: {gameState.achievements.length}/6 unlocked
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    textAlign: 'center',
  },
  performanceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  performanceLabel: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  upgradesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
  },
  upgradeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  upgradeLabel: {
    fontSize: 14,
    color: 'white',
    flex: 1,
    marginLeft: 12,
  },
  upgradeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  achievementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
  },
  achievementBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 4,
  },
  activityContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
  },
});

export default StatsScreen;
