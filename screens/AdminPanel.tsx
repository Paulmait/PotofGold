import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import authService, { UserProfile } from '../services/authService';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import * as Haptics from 'expo-haptics';

interface UserStats {
  totalUsers: number;
  activeToday: number;
  premiumUsers: number;
  totalRevenue: number;
}

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeToday: 0,
    premiumUsers: 0,
    totalRevenue: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const isAdminUser = await authService.checkAdminStatus();
      setIsAdmin(isAdminUser);
      if (isAdminUser) {
        await loadDashboardData();
      } else {
        Alert.alert('Access Denied', 'You do not have admin privileges');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify admin access');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      
      // Load users
      const allUsers = await authService.getAllUsers(100);
      setUsers(allUsers);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activeToday = allUsers.filter(user => {
        const lastLogin = user.lastLogin?.toDate ? user.lastLogin.toDate() : new Date(0);
        return lastLogin >= today;
      }).length;

      const premiumUsers = allUsers.filter(user => 
        user.subscription?.isActive && user.subscription?.type !== 'free'
      ).length;

      setStats({
        totalUsers: allUsers.length,
        activeToday,
        premiumUsers,
        totalRevenue: premiumUsers * 9.99, // Estimated
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleUserSearch = (text: string) => {
    setSearchQuery(text);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleResetUserProgress = async (userId: string) => {
    Alert.alert(
      'Reset User Progress',
      'Are you sure you want to reset this user\'s game progress?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.resetUserAccount(userId);
              Alert.alert('Success', 'User progress has been reset');
              await loadDashboardData();
              setShowUserModal(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to reset user progress');
            }
          },
        },
      ]
    );
  };

  const handleGrantPremium = async (userId: string) => {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      await updateDoc(doc(db, 'users', userId), {
        subscription: {
          isActive: true,
          type: 'premium',
          expiresAt: thirtyDaysFromNow,
        },
      });

      Alert.alert('Success', 'Premium access granted for 30 days');
      await loadDashboardData();
    } catch (error) {
      Alert.alert('Error', 'Failed to grant premium access');
    }
  };

  const handleAddCoins = async (userId: string, amount: number) => {
    try {
      const userDoc = doc(db, 'users', userId);
      const currentUser = users.find(u => u.uid === userId);
      if (!currentUser) return;

      await updateDoc(userDoc, {
        'gameProgress.coins': currentUser.gameProgress.coins + amount,
      });

      Alert.alert('Success', `Added ${amount} coins to user account`);
      await loadDashboardData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add coins');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', userId));
              Alert.alert('Success', 'User account deleted');
              await loadDashboardData();
              setShowUserModal(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user account');
            }
          },
        },
      ]
    );
  };

  const renderUserModal = () => {
    if (!selectedUser) return null;

    return (
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowUserModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>User Details</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.userInfo}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{selectedUser.displayName}</Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{selectedUser.email}</Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.infoLabel}>Level:</Text>
                <Text style={styles.infoValue}>{selectedUser.gameProgress.level}</Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.infoLabel}>Coins:</Text>
                <Text style={styles.infoValue}>{selectedUser.gameProgress.coins}</Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.infoLabel}>High Score:</Text>
                <Text style={styles.infoValue}>{selectedUser.gameProgress.highScore}</Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.infoLabel}>Subscription:</Text>
                <Text style={styles.infoValue}>
                  {selectedUser.subscription.isActive ? selectedUser.subscription.type : 'Free'}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => handleAddCoins(selectedUser.uid, 1000)}
                >
                  <Text style={styles.actionButtonText}>Add 1000 Coins</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
                  onPress={() => handleGrantPremium(selectedUser.uid)}
                >
                  <Text style={styles.actionButtonText}>Grant Premium</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                  onPress={() => handleResetUserProgress(selectedUser.uid)}
                >
                  <Text style={styles.actionButtonText}>Reset Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                  onPress={() => handleDeleteUser(selectedUser.uid)}
                >
                  <Text style={styles.actionButtonText}>Delete Account</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(item);
        setShowUserModal(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <View style={styles.userCardHeader}>
        <Text style={styles.userName}>{item.displayName}</Text>
        {item.subscription.isActive && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        )}
      </View>
      <Text style={styles.userEmail}>{item.email}</Text>
      <View style={styles.userStats}>
        <Text style={styles.userStat}>Level {item.gameProgress.level}</Text>
        <Text style={styles.userStat}>💰 {item.gameProgress.coins}</Text>
        <Text style={styles.userStat}>🏆 {item.gameProgress.highScore}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access Denied</Text>
        <Text style={styles.errorSubtext}>Admin privileges required</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadDashboardData}
            tintColor="#FFD700"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Admin Dashboard</Text>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={30} color="#FFD700" />
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={30} color="#4CAF50" />
            <Text style={styles.statValue}>{stats.activeToday}</Text>
            <Text style={styles.statLabel}>Active Today</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="star" size={30} color="#9C27B0" />
            <Text style={styles.statValue}>{stats.premiumUsers}</Text>
            <Text style={styles.statLabel}>Premium Users</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="cash" size={30} color="#00BCD4" />
            <Text style={styles.statValue}>${stats.totalRevenue.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Est. Revenue</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by email or name..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleUserSearch}
          />
        </View>

        {/* Users List */}
        <Text style={styles.sectionTitle}>Users</Text>
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.uid}
          scrollEnabled={false}
          contentContainerStyle={styles.usersList}
        />
      </ScrollView>

      {renderUserModal()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '45%',
    marginVertical: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: 'white',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 20,
    marginBottom: 10,
  },
  usersList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  userStat: {
    fontSize: 12,
    color: '#FFD700',
  },
  premiumBadge: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  premiumText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  actionButtons: {
    marginTop: 20,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 5,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});