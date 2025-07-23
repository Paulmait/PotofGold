import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { missionSystem } from '../utils/missionSystem';
import { masterGameManager } from '../utils/masterGameManager';

const { width, height } = Dimensions.get('window');

interface MissionsScreenProps {
  navigation: any;
}

export default function MissionsScreen({ navigation }: MissionsScreenProps) {
  const [missionProgress, setMissionProgress] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('daily');

  useEffect(() => {
    loadMissionData();
  }, []);

  const loadMissionData = async () => {
    try {
      const progress = missionSystem.getMissionProgress();
      if (progress) {
        setMissionProgress(progress);
      }
    } catch (error) {
      console.log('Error loading mission data:', error);
    }
  };

  const getMissionProgress = (mission: any) => {
    const progress = (mission.objective.current / mission.objective.target) * 100;
    return Math.min(progress, 100);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      case 'expert': return '#9C27B0';
      default: return '#4CAF50';
    }
  };

  const getRewardText = (rewards: any) => {
    const rewardParts = [];
    if (rewards.coins > 0) rewardParts.push(`${rewards.coins} coins`);
    if (rewards.experience > 0) rewardParts.push(`${rewards.experience} XP`);
    if (rewards.gems > 0) rewardParts.push(`${rewards.gems} gems`);
    if (rewards.powerUps.length > 0) rewardParts.push(`${rewards.powerUps.length} power-ups`);
    return rewardParts.join(', ');
  };

  if (!missionProgress) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading Missions...</Text>
      </View>
    );
  }

  const dailyMissions = missionSystem.getAvailableMissions();
  const dailyChallenges = missionSystem.getDailyChallenges();
  const weeklyChallenges = missionSystem.getWeeklyChallenges();
  const stats = missionSystem.getMissionStats();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Missions</Text>
        <Text style={styles.headerSubtitle}>Complete challenges for rewards</Text>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Completed</Text>
          <Text style={styles.statValue}>{stats.totalCompleted}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Daily Completed</Text>
          <Text style={styles.statValue}>{stats.dailyCompleted}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Weekly Completed</Text>
          <Text style={styles.statValue}>{stats.weeklyCompleted}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Streak Days</Text>
          <Text style={styles.statValue}>{stats.streakDays}</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'daily' && styles.tabActive]}
          onPress={() => setSelectedTab('daily')}
        >
          <Text style={[styles.tabText, selectedTab === 'daily' && styles.tabTextActive]}>
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'weekly' && styles.tabActive]}
          onPress={() => setSelectedTab('weekly')}
        >
          <Text style={[styles.tabText, selectedTab === 'weekly' && styles.tabTextActive]}>
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'challenges' && styles.tabActive]}
          onPress={() => setSelectedTab('challenges')}
        >
          <Text style={[styles.tabText, selectedTab === 'challenges' && styles.tabTextActive]}>
            Challenges
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mission Content */}
      <ScrollView style={styles.missionsContainer}>
        {selectedTab === 'daily' && (
          <>
            <Text style={styles.sectionTitle}>Daily Missions</Text>
            {dailyMissions.map((mission) => (
              <View key={mission.id} style={styles.missionCard}>
                <View style={styles.missionHeader}>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(mission.difficulty) }]}>
                    <Text style={styles.difficultyText}>{mission.difficulty.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.missionDescription}>{mission.description}</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${getMissionProgress(mission)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {mission.objective.current}/{mission.objective.target}
                  </Text>
                </View>
                <View style={styles.rewardsContainer}>
                  <Text style={styles.rewardsLabel}>Rewards:</Text>
                  <Text style={styles.rewardsText}>{getRewardText(mission.rewards)}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {selectedTab === 'weekly' && (
          <>
            <Text style={styles.sectionTitle}>Weekly Challenges</Text>
            {weeklyChallenges.map((challenge) => (
              <View key={challenge.id} style={styles.missionCard}>
                <View style={styles.missionHeader}>
                  <Text style={styles.missionTitle}>{challenge.title}</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(challenge.difficulty) }]}>
                    <Text style={styles.difficultyText}>{challenge.difficulty.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.missionDescription}>{challenge.description}</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${getMissionProgress(challenge)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {challenge.objective.current}/{challenge.objective.target}
                  </Text>
                </View>
                <View style={styles.rewardsContainer}>
                  <Text style={styles.rewardsLabel}>Rewards:</Text>
                  <Text style={styles.rewardsText}>{getRewardText(challenge.rewards)}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {selectedTab === 'challenges' && (
          <>
            <Text style={styles.sectionTitle}>Daily Challenges</Text>
            {dailyChallenges.map((challenge) => (
              <View key={challenge.id} style={styles.missionCard}>
                <View style={styles.missionHeader}>
                  <Text style={styles.missionTitle}>{challenge.title}</Text>
                  {challenge.completed && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>COMPLETED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.missionDescription}>{challenge.description}</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(challenge.progress / challenge.target) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {challenge.progress}/{challenge.target}
                  </Text>
                </View>
                <View style={styles.rewardsContainer}>
                  <Text style={styles.rewardsLabel}>Rewards:</Text>
                  <Text style={styles.rewardsText}>
                    {challenge.reward.coins} coins, {challenge.reward.experience} XP
                    {challenge.reward.specialReward && `, ${challenge.reward.specialReward}`}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Game')}>
          <Text style={styles.navButtonText}>Play Game</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Camp')}>
          <Text style={styles.navButtonText}>Camp</Text>
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
    padding: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#2a2a2a',
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#333',
    padding: 5,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FFD700',
  },
  tabText: {
    color: '#ccc',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#1a1a1a',
  },
  missionsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  missionCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  missionDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 15,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'right',
  },
  rewardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardsLabel: {
    fontSize: 12,
    color: '#ccc',
    marginRight: 5,
  },
  rewardsText: {
    fontSize: 12,
    color: '#FFD700',
    flex: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#333',
  },
  navButton: {
    flex: 1,
    backgroundColor: '#555',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 50,
  },
}); 