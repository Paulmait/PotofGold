import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGameContext } from '../context/GameContext';
import { userManager, UserProfile } from '../utils/userManager';
import { offlineManager } from '../utils/offlineManager';
import { uiManager } from '../utils/uiManager';

interface LeaderboardEntry {
  rank: number;
  user: UserProfile;
  score: number;
  isCurrentUser: boolean;
}

const LeaderboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { gameState } = useGameContext();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [friendsData, setFriendsData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);

      // Check if we're online
      const isOnline = offlineManager.isConnected();
      setOfflineMode(!isOnline);

      if (isOnline) {
        // Load global leaderboard
        const globalUsers = await userManager.getLeaderboardUsers(100);
        const globalEntries = globalUsers.map((user, index) => ({
          rank: index + 1,
          user,
          score: user.highScore,
          isCurrentUser: user.uid === gameState.userId,
        }));
        setLeaderboardData(globalEntries);

        // Load friends leaderboard
        if (gameState.userId) {
          const friends = await userManager.getUserFriends(gameState.userId);
          const friendsEntries = friends.map((friend, index) => ({
            rank: index + 1,
            user: friend,
            score: friend.highScore,
            isCurrentUser: false,
          }));
          setFriendsData(friendsEntries);
        }
      } else {
        // Load offline data
        const offlineData = await offlineManager.getOfflineData(gameState.userId || 'anonymous');
        const offlineEntry: LeaderboardEntry = {
          rank: 1,
          user: {
            uid: gameState.userId || 'anonymous',
            username: 'You',
            displayName: 'You (Offline)',
            coins: offlineData.coins,
            highScore: offlineData.highScore,
            gamesPlayed: offlineData.gamesPlayed,
            achievements: offlineData.achievements,
            level: 1,
            createdAt: new Date(),
            lastSeen: new Date(),
            isOnline: false,
            friends: [],
            privacySettings: {
              showOnlineStatus: true,
              allowFriendRequests: true,
              showInLeaderboards: true,
            },
          },
          score: offlineData.highScore,
          isCurrentUser: true,
        };
        setLeaderboardData([offlineEntry]);
        setFriendsData([]);
      }
    } catch (error) {
      console.log('Error loading leaderboard data:', error);
      Alert.alert('Error', 'Unable to load leaderboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboardData();
    setRefreshing(false);
  };

  const handleTabChange = (tab: 'global' | 'friends') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isTopThree = item.rank <= 3;
    const isCurrentUser = item.isCurrentUser;

    return (
      <View
        style={[
          styles.leaderboardItem,
          isCurrentUser && styles.currentUserItem,
          isTopThree && styles.topThreeItem,
        ]}
      >
        {/* Rank */}
        <View style={[styles.rankContainer, isTopThree && styles.topThreeRank]}>
          {isTopThree ? (
            <Ionicons
              name={item.rank === 1 ? 'trophy' : item.rank === 2 ? 'medal' : 'ribbon'}
              size={24}
              color={item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : '#CD7F32'}
            />
          ) : (
            <Text style={[styles.rankText, isCurrentUser && styles.currentUserText]}>
              #{item.rank}
            </Text>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={[styles.username, isCurrentUser && styles.currentUserText]}>
            {item.user.displayName}
          </Text>
          <Text style={[styles.userStats, isCurrentUser && styles.currentUserText]}>
            Level {item.user.level} • {item.user.gamesPlayed} games
          </Text>
        </View>

        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, isCurrentUser && styles.currentUserText]}>
            {item.score.toLocaleString()}
          </Text>
          <Text style={[styles.scoreLabel, isCurrentUser && styles.currentUserText]}>points</Text>
        </View>

        {/* Current User Indicator */}
        {isCurrentUser && (
          <View style={styles.currentUserIndicator}>
            <Ionicons name="person" size={16} color="#FFD700" />
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trophy-outline" size={64} color="rgba(255, 255, 255, 0.5)" />
      <Text style={styles.emptyStateTitle}>
        {activeTab === 'global' ? 'No Global Scores' : 'No Friends Yet'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {activeTab === 'global'
          ? 'Be the first to set a high score!'
          : 'Add friends to see their scores here.'}
      </Text>
    </View>
  );

  const renderOfflineBanner = () => (
    <View style={styles.offlineBanner}>
      <Ionicons name="cloud-offline" size={20} color="white" />
      <Text style={styles.offlineText}>Offline Mode - Showing local scores only</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#FFD700', '#FFA500', '#FF8C00']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.title}>Leaderboard</Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Ionicons name={refreshing ? 'sync' : 'refresh'} size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Offline Banner */}
      {offlineMode && renderOfflineBanner()}

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'global' && styles.activeTab]}
          onPress={() => handleTabChange('global')}
        >
          <Ionicons name="globe" size={20} color={activeTab === 'global' ? '#FFD700' : 'white'} />
          <Text style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}>
            Global
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'friends' && styles.activeTab]}
          onPress={() => handleTabChange('friends')}
        >
          <Ionicons name="people" size={20} color={activeTab === 'friends' ? '#FFD700' : 'white'} />
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={activeTab === 'global' ? leaderboardData : friendsData}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.user.uid}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="white"
            colors={['white']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Current User Stats */}
      {!offlineMode && (
        <View style={styles.currentUserStats}>
          <Text style={styles.currentUserStatsTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{gameState.highScore.toLocaleString()}</Text>
              <Text style={styles.statLabel}>High Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{gameState.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{gameState.coins.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Coins</Text>
            </View>
          </View>
        </View>
      )}
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
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  offlineText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#FFD700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  currentUserItem: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  topThreeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  topThreeRank: {
    width: 50,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  userStats: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreLabel: {
    fontSize: 10,
    color: 'white',
    opacity: 0.8,
  },
  currentUserIndicator: {
    marginLeft: 8,
  },
  currentUserText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    textAlign: 'center',
  },
  currentUserStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
  },
  currentUserStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    marginTop: 2,
  },
});

export default LeaderboardScreen;
