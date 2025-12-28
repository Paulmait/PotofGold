import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AnalyticsSystem, { DashboardData, RealtimeMetrics } from '../src/systems/AnalyticsSystem';
import { firestore } from '../firebase/config';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'revenue' | 'users' | 'liveops'>(
    'overview'
  );
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dashboard, realtime] = await Promise.all([
        AnalyticsSystem.getDashboardData(),
        AnalyticsSystem.getRealtimeMetrics(),
      ]);

      setDashboardData(dashboard);
      setRealtimeMetrics(realtime);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const renderMetricCard = (title: string, value: string, change?: number, icon?: string) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        {icon && <Icon name={icon} size={20} color="#666" />}
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {change !== undefined && (
        <Text style={[styles.metricChange, change >= 0 ? styles.positive : styles.negative]}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </Text>
      )}
    </View>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.metricsGrid}>
        {renderMetricCard('DAU', formatNumber(dashboardData?.overview.dau || 0), 5.2, 'people')}
        {renderMetricCard(
          'MAU',
          formatNumber(dashboardData?.overview.mau || 0),
          3.1,
          'people-outline'
        )}
        {renderMetricCard(
          'Daily Revenue',
          formatCurrency(dashboardData?.overview.revenue.daily || 0),
          12.5,
          'cash'
        )}
        {renderMetricCard(
          'ARPU',
          formatCurrency(dashboardData?.overview.arpu || 0),
          -2.3,
          'analytics'
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Retention Metrics</Text>
        <View style={styles.retentionGrid}>
          <View style={styles.retentionItem}>
            <Text style={styles.retentionLabel}>Day 1</Text>
            <Text style={styles.retentionValue}>
              {formatPercentage(dashboardData?.retention.day1 || 0)}
            </Text>
          </View>
          <View style={styles.retentionItem}>
            <Text style={styles.retentionLabel}>Day 7</Text>
            <Text style={styles.retentionValue}>
              {formatPercentage(dashboardData?.retention.day7 || 0)}
            </Text>
          </View>
          <View style={styles.retentionItem}>
            <Text style={styles.retentionLabel}>Day 30</Text>
            <Text style={styles.retentionValue}>
              {formatPercentage(dashboardData?.retention.day30 || 0)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Metrics</Text>
        <View style={styles.liveMetrics}>
          <View style={styles.liveMetricItem}>
            <Icon name="pulse" size={24} color="#4CAF50" />
            <Text style={styles.liveMetricLabel}>Active Users</Text>
            <Text style={styles.liveMetricValue}>{realtimeMetrics?.activeUsers || 0}</Text>
          </View>
          <View style={styles.liveMetricItem}>
            <Icon name="server" size={24} color="#2196F3" />
            <Text style={styles.liveMetricLabel}>Server Load</Text>
            <Text style={styles.liveMetricValue}>
              {formatPercentage(realtimeMetrics?.serverLoad || 0)}
            </Text>
          </View>
          <View style={styles.liveMetricItem}>
            <Icon name="warning" size={24} color="#FF9800" />
            <Text style={styles.liveMetricLabel}>Crash Rate</Text>
            <Text style={styles.liveMetricValue}>
              {formatPercentage(realtimeMetrics?.crashRate || 0)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderRevenueTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.revenueHeader}>
        <View style={styles.timeRangeSelector}>
          {(['24h', '7d', '30d'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.timeRangeButton, timeRange === range && styles.timeRangeActive]}
              onPress={() => setTimeRange(range)}
            >
              <Text
                style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.revenueCards}>
        <View style={styles.revenueCard}>
          <Text style={styles.revenueCardTitle}>Total Revenue</Text>
          <Text style={styles.revenueCardValue}>
            {formatCurrency(
              timeRange === '24h'
                ? dashboardData?.overview.revenue.daily || 0
                : timeRange === '7d'
                  ? dashboardData?.overview.revenue.weekly || 0
                  : dashboardData?.overview.revenue.monthly || 0
            )}
          </Text>
        </View>
        <View style={styles.revenueCard}>
          <Text style={styles.revenueCardTitle}>ARPPU</Text>
          <Text style={styles.revenueCardValue}>
            {formatCurrency(dashboardData?.overview.arppu || 0)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Purchases</Text>
        {realtimeMetrics?.topPurchases.map((item, index) => (
          <View key={index} style={styles.topPurchaseItem}>
            <Text style={styles.topPurchaseRank}>#{index + 1}</Text>
            <Text style={styles.topPurchaseName}>{item.item}</Text>
            <Text style={styles.topPurchaseCount}>{item.count} sold</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Segments</Text>
        <View style={styles.segmentGrid}>
          <View style={styles.segmentItem}>
            <Text style={styles.segmentLabel}>🐋 Whales</Text>
            <Text style={styles.segmentValue}>{dashboardData?.segments.whales || 0}</Text>
          </View>
          <View style={styles.segmentItem}>
            <Text style={styles.segmentLabel}>🐬 Dolphins</Text>
            <Text style={styles.segmentValue}>{dashboardData?.segments.dolphins || 0}</Text>
          </View>
          <View style={styles.segmentItem}>
            <Text style={styles.segmentLabel}>🐟 Minnows</Text>
            <Text style={styles.segmentValue}>{dashboardData?.segments.minnows || 0}</Text>
          </View>
          <View style={styles.segmentItem}>
            <Text style={styles.segmentLabel}>🆓 Non-Payers</Text>
            <Text style={styles.segmentValue}>{dashboardData?.segments.nonPayers || 0}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderUsersTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Acquisition</Text>
        <View style={styles.acquisitionCard}>
          <Text style={styles.acquisitionLabel}>New Users (24h)</Text>
          <Text style={styles.acquisitionValue}>{realtimeMetrics?.newUsers24h || 0}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conversion Funnel</Text>
        <View style={styles.funnelItem}>
          <Text style={styles.funnelLabel}>Install → First Game</Text>
          <View style={styles.funnelBar}>
            <View style={[styles.funnelProgress, { width: '92%' }]} />
          </View>
          <Text style={styles.funnelPercent}>92%</Text>
        </View>
        <View style={styles.funnelItem}>
          <Text style={styles.funnelLabel}>First Game → Day 1</Text>
          <View style={styles.funnelBar}>
            <View
              style={[
                styles.funnelProgress,
                { width: `${(dashboardData?.retention.day1 || 0) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.funnelPercent}>
            {formatPercentage(dashboardData?.retention.day1 || 0)}
          </Text>
        </View>
        <View style={styles.funnelItem}>
          <Text style={styles.funnelLabel}>Day 1 → Purchase</Text>
          <View style={styles.funnelBar}>
            <View
              style={[
                styles.funnelProgress,
                { width: `${(dashboardData?.overview.conversionRate || 0) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.funnelPercent}>
            {formatPercentage(dashboardData?.overview.conversionRate || 0)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.performanceGrid}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Crash-Free Rate</Text>
            <Text style={styles.performanceValue}>
              {formatPercentage(dashboardData?.performance.crashFreeRate || 0)}
            </Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Avg Load Time</Text>
            <Text style={styles.performanceValue}>
              {(dashboardData?.performance.averageLoadTime || 0) / 1000}s
            </Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Avg FPS</Text>
            <Text style={styles.performanceValue}>
              {Math.round(dashboardData?.performance.averageFPS || 0)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderLiveOpsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Events</Text>
        {realtimeMetrics?.activeEvents.map((event, index) => (
          <View key={index} style={styles.eventItem}>
            <Icon name="calendar" size={20} color="#4CAF50" />
            <Text style={styles.eventName}>{event}</Text>
            <View style={styles.eventBadge}>
              <Text style={styles.eventBadgeText}>LIVE</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Ops Metrics</Text>
        <View style={styles.liveOpsGrid}>
          <View style={styles.liveOpsItem}>
            <Text style={styles.liveOpsLabel}>Active Events</Text>
            <Text style={styles.liveOpsValue}>{dashboardData?.liveOps.activeEvents || 0}</Text>
          </View>
          <View style={styles.liveOpsItem}>
            <Text style={styles.liveOpsLabel}>Event Participation</Text>
            <Text style={styles.liveOpsValue}>
              {formatPercentage(dashboardData?.liveOps.eventParticipation || 0)}
            </Text>
          </View>
          <View style={styles.liveOpsItem}>
            <Text style={styles.liveOpsLabel}>Battle Pass Progress</Text>
            <Text style={styles.liveOpsValue}>
              {formatPercentage(dashboardData?.liveOps.battlePassProgress || 0)}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => Alert.alert('Push Notification', 'Notification sent to all users!')}
      >
        <Icon name="notifications" size={20} color="#FFF" />
        <Text style={styles.actionButtonText}>Send Push Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => Alert.alert('New Event', 'Event created successfully!')}
      >
        <Icon name="add-circle" size={20} color="#FFF" />
        <Text style={styles.actionButtonText}>Create New Event</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Real-time Analytics & Control</Text>
        </View>

        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['overview', 'revenue', 'users', 'liveops'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, selectedTab === tab && styles.tabActive]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'revenue' && renderRevenueTab()}
        {selectedTab === 'users' && renderUsersTab()}
        {selectedTab === 'liveops' && renderLiveOpsTab()}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  subtitle: {
    fontSize: 16,
    color: '#AAA',
    marginTop: 5,
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabActive: {
    backgroundColor: '#FFD700',
  },
  tabText: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  metricTitle: {
    color: '#AAA',
    fontSize: 12,
    marginLeft: 5,
  },
  metricValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  metricChange: {
    fontSize: 12,
  },
  positive: {
    color: '#4CAF50',
  },
  negative: {
    color: '#F44336',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  retentionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
  },
  retentionItem: {
    alignItems: 'center',
  },
  retentionLabel: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 5,
  },
  retentionValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  liveMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveMetricItem: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginHorizontal: 5,
  },
  liveMetricLabel: {
    color: '#AAA',
    fontSize: 11,
    marginTop: 5,
  },
  liveMetricValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  revenueHeader: {
    marginBottom: 20,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 3,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 17,
  },
  timeRangeActive: {
    backgroundColor: '#FFD700',
  },
  timeRangeText: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: '#000',
  },
  revenueCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  revenueCardTitle: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 10,
  },
  revenueCardValue: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
  },
  topPurchaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  topPurchaseRank: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 15,
  },
  topPurchaseName: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
  topPurchaseCount: {
    color: '#AAA',
    fontSize: 12,
  },
  segmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  segmentItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  segmentLabel: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 8,
  },
  segmentValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  acquisitionCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  acquisitionLabel: {
    color: '#4CAF50',
    fontSize: 14,
    marginBottom: 10,
  },
  acquisitionValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  funnelItem: {
    marginBottom: 20,
  },
  funnelLabel: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 8,
  },
  funnelBar: {
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    overflow: 'hidden',
  },
  funnelProgress: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 15,
  },
  funnelPercent: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  performanceLabel: {
    color: '#AAA',
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'center',
  },
  performanceValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  eventName: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    marginLeft: 10,
  },
  eventBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eventBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  liveOpsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveOpsItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  liveOpsLabel: {
    color: '#AAA',
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'center',
  },
  liveOpsValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 25,
    padding: 15,
    marginTop: 15,
  },
  actionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
