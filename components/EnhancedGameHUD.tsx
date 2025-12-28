import React, { memo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { useResponsive, scaleFont, scaleSpacing } from '../utils/responsiveScaling';
import { DailyStreakSystem } from '../utils/dailyStreakSystem';
import { SeasonPassSystem } from '../utils/seasonPassSystem';

interface EnhancedGameHUDProps {
  score: number;
  coins: number;
  gems?: number;
  lives: number;
  level: number;
  blockages?: number;
  activePowerUps?: Map<string, number>;
  fps?: number;
  userId?: string;
  isPro?: boolean;
  onStreakClick?: () => void;
  onSeasonPassClick?: () => void;
}

const EnhancedGameHUD: React.FC<EnhancedGameHUDProps> = memo(
  ({
    score,
    coins,
    gems = 0,
    lives,
    level,
    blockages = 0,
    activePowerUps = new Map(),
    fps,
    userId = 'guest',
    isPro = false,
    onStreakClick,
    onSeasonPassClick,
  }) => {
    const { scaleFont: sf, scaleSpacing: ss } = useResponsive();
    const [dailyStreak, setDailyStreak] = useState(0);
    const [seasonPassTier, setSeasonPassTier] = useState(1);
    const [seasonPassProgress, setSeasonPassProgress] = useState(0);
    const pulseAnim = new Animated.Value(1);

    // Load streak and season pass data
    useEffect(() => {
      loadUserProgress();

      // Pulse animation for important elements
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, [userId]);

    const loadUserProgress = async () => {
      try {
        // Load daily streak
        const streakSystem = DailyStreakSystem.getInstance();
        const streakData = await streakSystem.initializeStreak(userId);
        setDailyStreak(streakData.currentStreak);

        // Load season pass
        const seasonSystem = SeasonPassSystem.getInstance();
        const seasonData = await seasonSystem.initializeSeasonPass(userId);
        if (seasonData.currentSeason) {
          setSeasonPassTier(seasonData.currentSeason.currentTier);
          const progress =
            (seasonData.currentSeason.experience / seasonData.currentSeason.experienceToNext) * 100;
          setSeasonPassProgress(Math.min(100, progress));
        }
      } catch (error) {
        console.log('Error loading user progress:', error);
      }
    };

    return (
      <View style={[styles.container, { padding: ss(6) }]}>
        {/* Top Row - Score and Resources */}
        <View style={styles.topRow}>
          <View style={styles.scoreSection}>
            <Text style={[styles.scoreLabel, { fontSize: sf(8) }]}>SCORE</Text>
            <Text style={[styles.scoreText, { fontSize: sf(14) }]}>{score.toLocaleString()}</Text>
          </View>

          <View style={styles.resourcesSection}>
            <View style={styles.resourceItem}>
              <Text style={[styles.resourceEmoji, { fontSize: sf(14) }]}>🪙</Text>
              <Text style={[styles.resourceText, { fontSize: sf(12) }]}>
                {coins.toLocaleString()}
              </Text>
            </View>

            <View style={styles.resourceItem}>
              <Text style={[styles.resourceEmoji, { fontSize: sf(14) }]}>💎</Text>
              <Text style={[styles.resourceText, { fontSize: sf(12) }]}>
                {gems.toLocaleString()}
              </Text>
            </View>

            <View style={styles.resourceItem}>
              <Text style={[styles.livesEmoji, { fontSize: sf(12) }]}>
                {'❤️'.repeat(Math.max(0, lives))}
              </Text>
            </View>
          </View>

          {/* Pro Badge */}
          {isPro && (
            <Animated.View style={[styles.proBadge, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={[styles.proText, { fontSize: sf(10) }]}>PRO</Text>
            </Animated.View>
          )}
        </View>

        {/* Middle Row - Progress Systems */}
        <View style={styles.middleRow}>
          {/* Daily Streak */}
          <TouchableOpacity
            style={styles.streakContainer}
            onPress={onStreakClick}
            activeOpacity={0.7}
          >
            <Text style={[styles.streakEmoji, { fontSize: sf(14) }]}>🔥</Text>
            <View style={styles.streakInfo}>
              <Text style={[styles.streakLabel, { fontSize: sf(9) }]}>STREAK</Text>
              <Text style={[styles.streakNumber, { fontSize: sf(12) }]}>{dailyStreak} DAYS</Text>
            </View>
          </TouchableOpacity>

          {/* Level */}
          <View style={styles.levelContainer}>
            <Text style={[styles.levelLabel, { fontSize: sf(9) }]}>LEVEL</Text>
            <Text style={[styles.levelNumber, { fontSize: sf(16) }]}>{level}</Text>
          </View>

          {/* Season Pass */}
          <TouchableOpacity
            style={styles.seasonPassContainer}
            onPress={onSeasonPassClick}
            activeOpacity={0.7}
          >
            <Text style={[styles.seasonEmoji, { fontSize: sf(14) }]}>⭐</Text>
            <View style={styles.seasonInfo}>
              <Text style={[styles.seasonLabel, { fontSize: sf(9) }]}>TIER {seasonPassTier}</Text>
              <View style={styles.seasonProgressBar}>
                <View style={[styles.seasonProgressFill, { width: `${seasonPassProgress}%` }]} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Row - Active Effects */}
        <View style={styles.bottomRow}>
          {/* Blockages Warning */}
          {blockages > 0 && (
            <View style={styles.blockageWarning}>
              <Text style={[styles.blockageText, { fontSize: sf(11) }]}>
                ⚠️ Blockages: {blockages}/5
              </Text>
            </View>
          )}

          {/* Active Power-ups */}
          {activePowerUps.size > 0 && (
            <View style={styles.powerUpRow}>
              {Array.from(activePowerUps.keys()).map((powerUp) => (
                <View key={powerUp} style={styles.powerUpBadge}>
                  <Text style={[styles.powerUpIcon, { fontSize: sf(12) }]}>
                    {powerUp === 'magnet' && '🧲'}
                    {powerUp === 'shield' && '🛡️'}
                    {powerUp === 'doublePoints' && '⚡x2'}
                    {powerUp === 'timeBonus' && '⏰'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* FPS Counter (Dev Only) */}
          {__DEV__ && fps && <Text style={[styles.fpsText, { fontSize: sf(9) }]}>FPS: {fps}</Text>}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.select({ ios: 40, android: 25, web: 5 }),
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)', // More transparent
    borderRadius: 12,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    maxHeight: 120, // Limit height to not obstruct gameplay
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  scoreSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  scoreLabel: {
    color: '#888',
    fontWeight: 'bold',
  },
  scoreText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  resourcesSection: {
    flexDirection: 'row',
    gap: 15,
    flex: 2,
    justifyContent: 'center',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resourceEmoji: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  resourceText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  livesEmoji: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  proText: {
    color: '#000',
    fontWeight: 'bold',
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 69, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 0, 0.5)',
  },
  streakEmoji: {
    marginRight: 4,
  },
  streakInfo: {
    alignItems: 'center',
  },
  streakLabel: {
    color: '#888',
    fontWeight: 'bold',
  },
  streakNumber: {
    color: '#FF4500',
    fontWeight: 'bold',
  },
  levelContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  levelLabel: {
    color: '#888',
    fontWeight: 'bold',
  },
  levelNumber: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  seasonPassContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.5)',
  },
  seasonEmoji: {
    marginRight: 4,
  },
  seasonInfo: {
    flex: 1,
  },
  seasonLabel: {
    color: '#DDA0DD',
    fontWeight: 'bold',
  },
  seasonProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginTop: 2,
    width: 50,
  },
  seasonProgressFill: {
    height: '100%',
    backgroundColor: '#8A2BE2',
    borderRadius: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockageWarning: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.5)',
  },
  blockageText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  powerUpRow: {
    flexDirection: 'row',
    gap: 5,
  },
  powerUpBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  powerUpIcon: {
    fontWeight: 'bold',
  },
  fpsText: {
    color: '#0F0',
    position: 'absolute',
    bottom: 2,
    right: 5,
  },
});

export default EnhancedGameHUD;
