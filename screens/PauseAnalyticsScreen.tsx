import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { pauseTriggerSystem } from '../utils/pauseTriggerSystem';

const { width, height } = Dimensions.get('window');

interface PauseAnalyticsScreenProps {
  navigation: any;
}

export default function PauseAnalyticsScreen({ navigation }: PauseAnalyticsScreenProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<string>('all');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    // Mock analytics data - in real app, this would come from Firestore
    const mockAnalytics = {
      totalPauseAttempts: 1250,
      successfulPauses: 980,
      blockedPauses: 270,
      triggers: {
        level_fail: {
          count: 450,
          conversionRate: 0.78,
          revenue: 1250,
          avgSpend: 2.78,
        },
        manual_pause: {
          count: 320,
          conversionRate: 0.45,
          revenue: 890,
          avgSpend: 2.78,
        },
        low_lives_blocked: {
          count: 280,
          conversionRate: 0.82,
          revenue: 1560,
          avgSpend: 6.78,
        },
        gold_rush_active: {
          count: 270,
          conversionRate: 0.0,
          revenue: 0,
          avgSpend: 0,
        },
        high_score_opportunity: {
          count: 150,
          conversionRate: 0.65,
          revenue: 420,
          avgSpend: 2.80,
        },
        first_time_player: {
          count: 100,
          conversionRate: 0.92,
          revenue: 280,
          avgSpend: 3.04,
        },
      },
      topMonetizationOpportunities: [
        {
          trigger: 'low_lives_blocked',
          type: 'powerup',
          urgency: 'high',
          conversionRate: 0.82,
          avgRevenue: 6.78,
        },
        {
          trigger: 'first_time_player',
          type: 'powerup',
          urgency: 'high',
          conversionRate: 0.92,
          avgRevenue: 3.04,
        },
        {
          trigger: 'level_fail',
          type: 'revive',
          urgency: 'high',
          conversionRate: 0.78,
          avgRevenue: 2.78,
        },
      ],
      strategicInsights: [
        'Low lives/blocked triggers have highest conversion rate (82%)',
        'First-time players are most likely to purchase (92%)',
        'Gold Rush blocking maintains game intensity effectively',
        'Manual pauses have lower conversion but higher volume',
        'High score opportunities drive revive purchases',
      ],
    };

    setAnalytics(mockAnalytics);
  };

  const getTriggerColor = (triggerId: string): string => {
    const colors: { [key: string]: string } = {
      level_fail: '#FF6B6B',
      manual_pause: '#4ECDC4',
      low_lives_blocked: '#FFD93D',
      gold_rush_active: '#6C5CE7',
      high_score_opportunity: '#A8E6CF',
      first_time_player: '#FF8B94',
    };
    return colors[triggerId] || '#95A5A6';
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFA726';
      case 'low': return '#66BB6A';
      default: return '#95A5A6';
    }
  };

  const renderTriggerCard = (triggerId: string, data: any) => (
    <View key={triggerId} style={styles.triggerCard}>
      <View style={styles.triggerHeader}>
        <View style={[styles.triggerIcon, { backgroundColor: getTriggerColor(triggerId) }]}>
          <Text style={styles.triggerIconText}>
            {triggerId === 'level_fail' ? '💀' :
             triggerId === 'manual_pause' ? '⏸️' :
             triggerId === 'low_lives_blocked' ? '⚠️' :
             triggerId === 'gold_rush_active' ? '💰' :
             triggerId === 'high_score_opportunity' ? '🏆' :
             triggerId === 'first_time_player' ? '👋' : '❓'}
          </Text>
        </View>
        <View style={styles.triggerInfo}>
          <Text style={styles.triggerName}>
            {triggerId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
          <Text style={styles.triggerCount}>{data.count} triggers</Text>
        </View>
      </View>

      <View style={styles.triggerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Conversion</Text>
          <Text style={styles.statValue}>{(data.conversionRate * 100).toFixed(1)}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Revenue</Text>
          <Text style={styles.statValue}>${data.revenue}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avg Spend</Text>
          <Text style={styles.statValue}>${data.avgSpend}</Text>
        </View>
      </View>
    </View>
  );

  const renderMonetizationOpportunity = (opportunity: any, index: number) => (
    <View key={index} style={styles.opportunityCard}>
      <View style={styles.opportunityHeader}>
        <Text style={styles.opportunityTitle}>
          {opportunity.trigger.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Text>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(opportunity.urgency) }]}>
          <Text style={styles.urgencyText}>{opportunity.urgency.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.opportunityStats}>
        <View style={styles.opportunityStat}>
          <Text style={styles.opportunityLabel}>Type</Text>
          <Text style={styles.opportunityValue}>{opportunity.type}</Text>
        </View>
        <View style={styles.opportunityStat}>
          <Text style={styles.opportunityLabel}>Conversion</Text>
          <Text style={styles.opportunityValue}>{(opportunity.conversionRate * 100).toFixed(1)}%</Text>
        </View>
        <View style={styles.opportunityStat}>
          <Text style={styles.opportunityLabel}>Avg Revenue</Text>
          <Text style={styles.opportunityValue}>${opportunity.avgRevenue}</Text>
        </View>
      </View>
    </View>
  );

  if (!analytics) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Pause Analytics</Text>
        <Text style={styles.headerSubtitle}>Strategic insights for monetization</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Overview Stats */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewValue}>{analytics.totalPauseAttempts}</Text>
              <Text style={styles.overviewLabel}>Total Pause Attempts</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewValue}>{analytics.successfulPauses}</Text>
              <Text style={styles.overviewLabel}>Successful Pauses</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewValue}>{analytics.blockedPauses}</Text>
              <Text style={styles.overviewLabel}>Blocked Pauses</Text>
            </View>
          </View>
        </View>

        {/* Trigger Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trigger Performance</Text>
          {Object.entries(analytics.triggers).map(([triggerId, data]: [string, any]) =>
            renderTriggerCard(triggerId, data)
          )}
        </View>

        {/* Top Monetization Opportunities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Monetization Opportunities</Text>
          {analytics.topMonetizationOpportunities.map((opportunity: any, index: number) =>
            renderMonetizationOpportunity(opportunity, index)
          )}
        </View>

        {/* Strategic Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strategic Insights</Text>
          {analytics.strategicInsights.map((insight: string, index: number) => (
            <View key={index} style={styles.insightItem}>
              <Text style={styles.insightBullet}>•</Text>
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>🎯 Optimize Low Lives/Blocked</Text>
            <Text style={styles.recommendationText}>
              This trigger has the highest conversion rate (82%). Consider increasing its frequency
              and optimizing the power-up offerings.
            </Text>
          </View>
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>👋 Enhance First-Time Player Experience</Text>
            <Text style={styles.recommendationText}>
              New players are most likely to purchase (92%). Improve onboarding and offer
              more guidance during their first few games.
            </Text>
          </View>
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>💰 Maintain Gold Rush Intensity</Text>
            <Text style={styles.recommendationText}>
              Blocking pauses during Gold Rush effectively maintains game intensity.
              Consider expanding this to other high-intensity moments.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
          <Text style={styles.navButtonText}>Back</Text>
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
  content: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 50,
  },
  overviewSection: {
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewStat: {
    alignItems: 'center',
    flex: 1,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 5,
  },
  triggerCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  triggerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  triggerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  triggerIconText: {
    fontSize: 20,
  },
  triggerInfo: {
    flex: 1,
  },
  triggerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  triggerCount: {
    fontSize: 12,
    color: '#ccc',
  },
  triggerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#ccc',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  opportunityCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  urgencyText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  opportunityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  opportunityStat: {
    alignItems: 'center',
    flex: 1,
  },
  opportunityLabel: {
    fontSize: 10,
    color: '#ccc',
    marginBottom: 5,
  },
  opportunityValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  insightBullet: {
    fontSize: 16,
    color: '#FFD700',
    marginRight: 10,
    marginTop: 2,
  },
  insightText: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
    lineHeight: 20,
  },
  recommendationCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  recommendationText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  navigationContainer: {
    padding: 20,
    backgroundColor: '#333',
  },
  navButton: {
    backgroundColor: '#555',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 