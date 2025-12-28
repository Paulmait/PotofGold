import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface GameBottomBarProps {
  coins: number;
  streakDays: number;
  seasonTier: number;
  blockages?: number;
  maxBlockages?: number;
  onStreakPress?: () => void;
  onSeasonPassPress?: () => void;
  onShopPress?: () => void;
  onSkinsPress?: () => void;
  onVacuumPress?: () => void;
  onClearAllPress?: () => void;
  vacuumCost?: number;
  clearAllCost?: number;
  hasNewStreak?: boolean;
  hasNewTier?: boolean;
}

const GameBottomBar: React.FC<GameBottomBarProps> = memo(
  ({
    coins,
    streakDays,
    seasonTier,
    blockages = 0,
    maxBlockages = 5,
    onStreakPress,
    onSeasonPassPress,
    onShopPress,
    onSkinsPress,
    onVacuumPress,
    onClearAllPress,
    vacuumCost = 25,
    clearAllCost = 50,
    hasNewStreak = false,
    hasNewTier = false,
  }) => {
    const canAffordVacuum = coins >= vacuumCost;
    const canAffordClearAll = coins >= clearAllCost;

    return (
      <View style={styles.container}>
        {/* Quick Stats Section */}
        <View style={styles.statsSection}>
          <TouchableOpacity style={styles.statButton} onPress={onStreakPress} activeOpacity={0.7}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statText}>{streakDays}</Text>
            {hasNewStreak && <View style={styles.notificationDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statButton}
            onPress={onSeasonPassPress}
            activeOpacity={0.7}
          >
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statText}>T{seasonTier}</Text>
            {hasNewTier && <View style={styles.notificationDot} />}
          </TouchableOpacity>

          {/* Blockage indicator */}
          {blockages > 0 && (
            <View
              style={[styles.statButton, blockages >= maxBlockages * 0.8 && styles.criticalStat]}
            >
              <Text style={styles.statEmoji}>🚫</Text>
              <Text
                style={[styles.statText, blockages >= maxBlockages * 0.8 && styles.criticalText]}
              >
                {blockages}/{maxBlockages}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons Section */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={onShopPress} activeOpacity={0.7}>
            <Ionicons name="cart" size={20} color="#FFD700" />
            <Text style={styles.actionText}>Shop</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onSkinsPress} activeOpacity={0.7}>
            <Text style={styles.actionEmoji}>🎨</Text>
            <Text style={styles.actionText}>Skins</Text>
          </TouchableOpacity>

          {/* Power Actions with Costs */}
          <TouchableOpacity
            style={[styles.powerButton, !canAffordVacuum && styles.disabledButton]}
            onPress={canAffordVacuum ? onVacuumPress : undefined}
            activeOpacity={canAffordVacuum ? 0.7 : 1}
          >
            <LinearGradient
              colors={canAffordVacuum ? ['#4CAF50', '#45a049'] : ['#555', '#333']}
              style={styles.powerButtonGradient}
            >
              <Text style={styles.powerEmoji}>🌪️</Text>
              <Text style={styles.powerText}>Vacuum</Text>
              <View style={styles.costBadge}>
                <Text style={styles.costEmoji}>🪙</Text>
                <Text style={[styles.costText, !canAffordVacuum && styles.costTextDisabled]}>
                  {vacuumCost}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.powerButton, !canAffordClearAll && styles.disabledButton]}
            onPress={canAffordClearAll ? onClearAllPress : undefined}
            activeOpacity={canAffordClearAll ? 0.7 : 1}
          >
            <LinearGradient
              colors={canAffordClearAll ? ['#FF6B6B', '#ee5a52'] : ['#555', '#333']}
              style={styles.powerButtonGradient}
            >
              <Text style={styles.powerEmoji}>💥</Text>
              <Text style={styles.powerText}>Clear</Text>
              <View style={styles.costBadge}>
                <Text style={styles.costEmoji}>🪙</Text>
                <Text style={[styles.costText, !canAffordClearAll && styles.costTextDisabled]}>
                  {clearAllCost}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    // Safe area for iPhone notch
    paddingBottom: Platform.select({
      ios: 20,
      default: 8,
    }),
  },
  statsSection: {
    flexDirection: 'row',
    gap: 10,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    position: 'relative',
  },
  statEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  statText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: '#FF0000',
    borderRadius: 4,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  actionEmoji: {
    fontSize: 20,
  },
  actionText: {
    color: '#FFF',
    fontSize: 10,
    marginTop: 2,
  },
  powerButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  powerButtonGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  powerEmoji: {
    fontSize: 18,
  },
  powerText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 2,
  },
  costEmoji: {
    fontSize: 10,
    marginRight: 2,
  },
  costText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
  },
  costTextDisabled: {
    color: '#888',
  },
  disabledButton: {
    opacity: 0.5,
  },
  criticalStat: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderColor: '#FF0000',
    borderWidth: 1,
  },
  criticalText: {
    color: '#FF6B6B',
  },
});

export default GameBottomBar;
