import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export interface LegendaryStatus {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legendary';
  title: string;
  level: number;
  prestige: number;
  badges: string[];
  effects: {
    aura: boolean;
    particles: boolean;
    crown: boolean;
    trail: string;
  };
}

interface LegendaryStatusDisplayProps {
  status: LegendaryStatus;
  playerName: string;
  isOwner: boolean;
  onPress?: () => void;
}

export default function LegendaryStatusDisplay({
  status,
  playerName,
  isOwner,
  onPress,
}: LegendaryStatusDisplayProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array(20)
      .fill(0)
      .map(() => ({
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        opacity: new Animated.Value(0),
      }))
  ).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse effect for legendary tier
    if (status.tier === 'legendary') {
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
    }

    // Shimmer effect
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Particle effects for high tiers
    if (status.effects.particles) {
      startParticleAnimation();
    }

    // Haptic feedback for owner
    if (isOwner) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [status.tier]);

  const startParticleAnimation = () => {
    particleAnims.forEach((anim, index) => {
      const delay = index * 100;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.x, {
              toValue: (Math.random() - 0.5) * 200,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: -height,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 500,
                delay: 2000,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.parallel([
            Animated.timing(anim.x, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });
  };

  const getTierConfig = () => {
    const configs = {
      bronze: {
        colors: ['#CD7F32', '#8B4513'],
        icon: '🥉',
        glow: '#CD7F32',
        textColor: '#FFF',
      },
      silver: {
        colors: ['#C0C0C0', '#808080'],
        icon: '🥈',
        glow: '#C0C0C0',
        textColor: '#FFF',
      },
      gold: {
        colors: ['#FFD700', '#FFA500'],
        icon: '🥇',
        glow: '#FFD700',
        textColor: '#000',
      },
      platinum: {
        colors: ['#E5E4E2', '#BFC1C2'],
        icon: '💎',
        glow: '#E5E4E2',
        textColor: '#000',
      },
      diamond: {
        colors: ['#B9F2FF', '#00D4FF'],
        icon: '💠',
        glow: '#00D4FF',
        textColor: '#FFF',
      },
      legendary: {
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
        icon: '👑',
        glow: '#FFD700',
        textColor: '#FFF',
      },
    };

    return configs[status.tier];
  };

  const config = getTierConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    >
      {/* Glow effect */}
      {status.effects.aura && (
        <Animated.View
          style={[
            styles.aura,
            {
              opacity: shimmerAnim,
              shadowColor: config.glow,
              shadowRadius: 30,
              shadowOpacity: 0.8,
            },
          ]}
        />
      )}

      {/* Main display */}
      <LinearGradient
        colors={status.tier === 'legendary' ? config.colors : config.colors}
        style={[styles.mainDisplay]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          {/* Crown/Icon */}
          {status.effects.crown && (
            <View style={styles.crownContainer}>
              <Text style={styles.crown}>{config.icon}</Text>
            </View>
          )}

          {/* Tier Badge */}
          <View style={styles.tierBadge}>
            <Text style={[styles.tierText, { color: config.textColor }]}>
              {status.tier.toUpperCase()}
            </Text>
            {status.prestige > 0 && (
              <View style={styles.prestigeStars}>
                {Array(Math.min(status.prestige, 5))
                  .fill(0)
                  .map((_, i) => (
                    <Text key={i} style={styles.prestigeStar}>
                      ⭐
                    </Text>
                  ))}
              </View>
            )}
          </View>

          {/* Player Name */}
          <Text style={[styles.playerName, { color: config.textColor }]}>{playerName}</Text>

          {/* Title */}
          <Text style={[styles.title, { color: config.textColor }]}>{status.title}</Text>

          {/* Level */}
          <View style={styles.levelContainer}>
            <Text style={[styles.levelText, { color: config.textColor }]}>
              LEVEL {status.level}
            </Text>
          </View>

          {/* Badges */}
          {status.badges.length > 0 && (
            <View style={styles.badgesContainer}>
              {status.badges.slice(0, 5).map((badge, index) => (
                <View key={index} style={styles.badge}>
                  <Text style={styles.badgeEmoji}>{badge}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Special Effects Text */}
          {status.tier === 'legendary' && (
            <Animated.Text
              style={[
                styles.legendaryText,
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1, 0.5],
                  }),
                },
              ]}
            >
              ✨ LEGENDARY PLAYER ✨
            </Animated.Text>
          )}
        </Animated.View>
      </LinearGradient>

      {/* Particle effects */}
      {status.effects.particles && (
        <View style={styles.particlesContainer}>
          {particleAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  transform: [{ translateX: anim.x }, { translateY: anim.y }],
                  opacity: anim.opacity,
                },
              ]}
            >
              <Text style={styles.particleEmoji}>{['✨', '⭐', '💫', '🌟'][index % 4]}</Text>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Comparison text for non-owners */}
      {!isOwner && (
        <View style={styles.comparisonContainer}>
          <Text style={styles.comparisonText}>Tap to see how to achieve this status!</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: height * 0.1,
    left: width * 0.05,
    right: width * 0.05,
    zIndex: 9999,
    elevation: 10,
  },
  aura: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 20,
  },
  mainDisplay: {
    borderRadius: 20,
    padding: 20,
    minHeight: 250,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    alignItems: 'center',
  },
  crownContainer: {
    position: 'absolute',
    top: -40,
    zIndex: 1,
  },
  crown: {
    fontSize: 50,
  },
  tierBadge: {
    marginTop: 10,
    marginBottom: 10,
  },
  tierText: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  prestigeStars: {
    flexDirection: 'row',
    marginTop: 5,
  },
  prestigeStar: {
    fontSize: 16,
    marginHorizontal: 2,
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  levelContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  badgesContainer: {
    flexDirection: 'row',
    marginTop: 15,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    margin: 5,
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  legendaryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
  },
  particleEmoji: {
    fontSize: 20,
  },
  comparisonContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
  },
  comparisonText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
  },
});
