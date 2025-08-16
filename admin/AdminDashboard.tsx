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
  Dimensions,
  Switch,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { analyticsSystem } from '../utils/analyticsSystem';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardMetrics {
  activeUsers: number;
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
  engagement: {
    avgSessionLength: number;
    sessionsPerUser: number;
    crashRate: number;
  };
  topPlayers: Array<{
    userId: string;
    username: string;
    score: number;
    revenue: number;
  }>;
}

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'revenue' | 'config'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [remoteConfig, setRemoteConfig] = useState({
    doubleCoinsEnabled: false,
    specialEventActive: false,
    maintenanceMode: false,
    abTestVariant: 'A',
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // In production, fetch from your backend
      const mockMetrics: DashboardMetrics = {
        activeUsers: 1247,
        revenue: {
          today: 487.32,
          week: 3421.18,
          month: 12847.92,
        },
        retention: {
          day1: 45.2,
          day7: 28.7,
          day30: 15.3,
        },
        engagement: {
          avgSessionLength: 7.4,
          sessionsPerUser: 3.2,
          crashRate: 0.12,
        },
        topPlayers: [
          { userId: '1', username: 'CoinMaster99', score: 128470, revenue: 49.99 },
          { userId: '2', username: 'GoldDigger', score: 98234, revenue: 29.99 },
          { userId: '3', username: 'TreasureHunter', score: 87123, revenue: 19.99 },
        ],
      };
      
      setMetrics(mockMetrics);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const renderOverviewTab = () => {
    if (!metrics) return null;

    return (
      <ScrollView style={styles.tabContent}>
        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          <View style={[styles.kpiCard, styles.kpiCardSuccess]}>
            <Text style={styles.kpiValue}>{metrics.activeUsers}</Text>
            <Text style={styles.kpiLabel}>Active Users</Text>
            <Text style={styles.kpiChange}>↑ 12.5%</Text>
          </View>
          
          <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
            <Text style={styles.kpiValue}>${metrics.revenue.today.toFixed(2)}</Text>
            <Text style={styles.kpiLabel}>Today's Revenue</Text>
            <Text style={styles.kpiChange}>↑ 8.3%</Text>
          </View>
          
          <View style={[styles.kpiCard, styles.kpiCardWarning]}>
            <Text style={styles.kpiValue}>{metrics.retention.day1}%</Text>
            <Text style={styles.kpiLabel}>D1 Retention</Text>
            <Text style={styles.kpiChange}>↓ 2.1%</Text>
          </View>
          
          <View style={[styles.kpiCard, styles.kpiCardDanger]}>
            <Text style={styles.kpiValue}>{metrics.engagement.crashRate}%</Text>
            <Text style={styles.kpiLabel}>Crash Rate</Text>
            <Text style={styles.kpiChange}>↓ 0.03%</Text>
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Revenue Trend (Last 7 Days)</Text>
          <LineChart
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{
                data: [412, 487, 523, 498, 512, 487, 487]
              }]
            }}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              style: {
                borderRadius: 16
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* User Activity Heatmap */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>User Activity by Hour</Text>
          <BarChart
            data={{
              labels: ['12am', '6am', '12pm', '6pm', '11pm'],
              datasets: [{
                data: [20, 45, 128, 187, 93]
              }]
            }}
            width={screenWidth - 40}
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            }}
            style={styles.chart}
          />
        </View>

        {/* Top Players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Players Today</Text>
          {metrics.topPlayers.map((player, index) => (
            <View key={player.userId} style={styles.playerRow}>
              <Text style={styles.playerRank}>#{index + 1}</Text>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.username}</Text>
                <Text style={styles.playerScore}>{player.score.toLocaleString()} pts</Text>
              </View>
              <Text style={styles.playerRevenue}>${player.revenue}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderUsersTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username or user ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* User Management Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleUserAction('reset_password')}>
            <Ionicons name="key" size={20} color="white" />
            <Text style={styles.actionButtonText}>Reset Password</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => handleUserAction('ban_user')}>
            <Ionicons name="ban" size={20} color="white" />
            <Text style={styles.actionButtonText}>Ban User</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => handleUserAction('gift_coins')}>
            <Ionicons name="gift" size={20} color="white" />
            <Text style={styles.actionButtonText}>Gift Coins</Text>
          </TouchableOpacity>
        </View>

        {/* User List */}
        <View style={styles.userList}>
          <UserRow username="TestUser123" userId="usr_123" status="active" lastSeen="2 min ago" />
          <UserRow username="CoinCollector" userId="usr_456" status="active" lastSeen="15 min ago" />
          <UserRow username="ProGamer2024" userId="usr_789" status="inactive" lastSeen="2 hours ago" />
          <UserRow username="Banned_User" userId="usr_000" status="banned" lastSeen="3 days ago" />
        </View>
      </ScrollView>
    );
  };

  const renderRevenueTab = () => {
    if (!metrics) return null;

    return (
      <ScrollView style={styles.tabContent}>
        {/* Revenue Summary */}
        <View style={styles.revenueSummary}>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Today</Text>
            <Text style={styles.revenueValue}>${metrics.revenue.today.toFixed(2)}</Text>
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>This Week</Text>
            <Text style={styles.revenueValue}>${metrics.revenue.week.toFixed(2)}</Text>
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>This Month</Text>
            <Text style={styles.revenueValue}>${metrics.revenue.month.toFixed(2)}</Text>
          </View>
        </View>

        {/* Revenue Breakdown */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Revenue Sources</Text>
          <PieChart
            data={[
              {
                name: 'IAP',
                population: 65,
                color: '#4CAF50',
                legendFontColor: '#333',
                legendFontSize: 12,
              },
              {
                name: 'Ads',
                population: 30,
                color: '#2196F3',
                legendFontColor: '#333',
                legendFontSize: 12,
              },
              {
                name: 'Subscriptions',
                population: 5,
                color: '#FF9800',
                legendFontColor: '#333',
                legendFontSize: 12,
              },
            ]}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>

        {/* Top Purchases */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Purchases</Text>
          <PurchaseRow product="Remove Ads" price="$1.99" user="User123" time="5 min ago" />
          <PurchaseRow product="1000 Coins" price="$4.99" user="ProPlayer" time="12 min ago" />
          <PurchaseRow product="VIP Pass" price="$9.99" user="GoldMember" time="1 hour ago" />
        </View>
      </ScrollView>
    );
  };

  const renderConfigTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Remote Configuration</Text>
        
        <View style={styles.configItem}>
          <View style={styles.configInfo}>
            <Text style={styles.configLabel}>Double Coins Event</Text>
            <Text style={styles.configDescription}>Enable 2x coins for all players</Text>
          </View>
          <Switch
            value={remoteConfig.doubleCoinsEnabled}
            onValueChange={(value) => updateRemoteConfig('doubleCoinsEnabled', value)}
          />
        </View>

        <View style={styles.configItem}>
          <View style={styles.configInfo}>
            <Text style={styles.configLabel}>Special Event</Text>
            <Text style={styles.configDescription}>Activate seasonal event</Text>
          </View>
          <Switch
            value={remoteConfig.specialEventActive}
            onValueChange={(value) => updateRemoteConfig('specialEventActive', value)}
          />
        </View>

        <View style={styles.configItem}>
          <View style={styles.configInfo}>
            <Text style={styles.configLabel}>Maintenance Mode</Text>
            <Text style={styles.configDescription}>Disable game access</Text>
          </View>
          <Switch
            value={remoteConfig.maintenanceMode}
            onValueChange={(value) => updateRemoteConfig('maintenanceMode', value)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>A/B Testing</Text>
          <View style={styles.abTestContainer}>
            <TouchableOpacity
              style={[styles.abTestButton, remoteConfig.abTestVariant === 'A' && styles.abTestActive]}
              onPress={() => updateRemoteConfig('abTestVariant', 'A')}
            >
              <Text style={styles.abTestText}>Variant A (50%)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.abTestButton, remoteConfig.abTestVariant === 'B' && styles.abTestActive]}
              onPress={() => updateRemoteConfig('abTestVariant', 'B')}
            >
              <Text style={styles.abTestText}>Variant B (50%)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.pushButton} onPress={sendPushNotification}>
          <Ionicons name="notifications" size={20} color="white" />
          <Text style={styles.pushButtonText}>Send Push Notification</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const handleUserAction = (action: string) => {
    Alert.alert(
      'User Action',
      `Perform ${action} for user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => console.log(`${action} executed`) }
      ]
    );
  };

  const updateRemoteConfig = (key: string, value: any) => {
    setRemoteConfig(prev => ({ ...prev, [key]: value }));
    // In production, update backend
    Alert.alert('Config Updated', `${key} set to ${value}`);
  };

  const sendPushNotification = () => {
    Alert.prompt(
      'Send Push Notification',
      'Enter notification message:',
      (message) => {
        if (message) {
          console.log('Sending push:', message);
          Alert.alert('Success', 'Push notification sent to all users');
        }
      }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pot of Gold Admin</Text>
        <TouchableOpacity onPress={loadDashboardData}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'users' && styles.tabActive]}
          onPress={() => setSelectedTab('users')}
        >
          <Text style={[styles.tabText, selectedTab === 'users' && styles.tabTextActive]}>
            Users
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'revenue' && styles.tabActive]}
          onPress={() => setSelectedTab('revenue')}
        >
          <Text style={[styles.tabText, selectedTab === 'revenue' && styles.tabTextActive]}>
            Revenue
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'config' && styles.tabActive]}
          onPress={() => setSelectedTab('config')}
        >
          <Text style={[styles.tabText, selectedTab === 'config' && styles.tabTextActive]}>
            Config
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {selectedTab === 'overview' && renderOverviewTab()}
      {selectedTab === 'users' && renderUsersTab()}
      {selectedTab === 'revenue' && renderRevenueTab()}
      {selectedTab === 'config' && renderConfigTab()}
    </View>
  );
};

// Helper Components
const UserRow: React.FC<{
  username: string;
  userId: string;
  status: string;
  lastSeen: string;
}> = ({ username, userId, status, lastSeen }) => (
  <View style={styles.userRow}>
    <View style={styles.userInfo}>
      <Text style={styles.username}>{username}</Text>
      <Text style={styles.userId}>{userId}</Text>
    </View>
    <View style={styles.userStatus}>
      <View style={[styles.statusDot, status === 'active' ? styles.statusActive : status === 'banned' ? styles.statusBanned : styles.statusInactive]} />
      <Text style={styles.lastSeen}>{lastSeen}</Text>
    </View>
  </View>
);

const PurchaseRow: React.FC<{
  product: string;
  price: string;
  user: string;
  time: string;
}> = ({ product, price, user, time }) => (
  <View style={styles.purchaseRow}>
    <View style={styles.purchaseInfo}>
      <Text style={styles.purchaseProduct}>{product}</Text>
      <Text style={styles.purchaseUser}>{user}</Text>
    </View>
    <View style={styles.purchaseDetails}>
      <Text style={styles.purchasePrice}>{price}</Text>
      <Text style={styles.purchaseTime}>{time}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  kpiCard: {
    width: '48%',
    padding: 15,
    margin: '1%',
    borderRadius: 10,
    alignItems: 'center',
  },
  kpiCardSuccess: {
    backgroundColor: '#4CAF50',
  },
  kpiCardPrimary: {
    backgroundColor: '#2196F3',
  },
  kpiCardWarning: {
    backgroundColor: '#FF9800',
  },
  kpiCardDanger: {
    backgroundColor: '#F44336',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  kpiLabel: {
    fontSize: 12,
    color: 'white',
    marginTop: 5,
  },
  kpiChange: {
    fontSize: 10,
    color: 'white',
    marginTop: 3,
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  playerRank: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 40,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerScore: {
    fontSize: 12,
    color: '#666',
  },
  playerRevenue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 10,
    padding: 10,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 12,
  },
  userList: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  userId: {
    fontSize: 12,
    color: '#666',
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#FFC107',
  },
  statusBanned: {
    backgroundColor: '#F44336',
  },
  lastSeen: {
    fontSize: 12,
    color: '#999',
  },
  revenueSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  revenueCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    margin: 5,
  },
  revenueLabel: {
    fontSize: 12,
    color: '#666',
  },
  revenueValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 5,
  },
  purchaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseProduct: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  purchaseUser: {
    fontSize: 12,
    color: '#666',
  },
  purchaseDetails: {
    alignItems: 'flex-end',
  },
  purchasePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  purchaseTime: {
    fontSize: 10,
    color: '#999',
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  configInfo: {
    flex: 1,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  configDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  abTestContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  abTestButton: {
    flex: 1,
    padding: 15,
    margin: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  abTestActive: {
    backgroundColor: '#4CAF50',
  },
  abTestText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pushButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    margin: 20,
    padding: 15,
    borderRadius: 10,
  },
  pushButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default AdminDashboard;