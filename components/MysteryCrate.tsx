import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface MysteryCrateProps {
  visible: boolean;
  crate: {
    type: 'skin' | 'coins' | 'powerup';
    value: string | number;
    rarity: string;
  } | null;
  onClose: () => void;
  onClaim: () => void;
}

export default function MysteryCrate({ visible, crate, onClose, onClaim }: MysteryCrateProps) {
  const [scaleAnimation] = useState(new Animated.Value(0));
  const [rotationAnimation] = useState(new Animated.Value(0));
  const [glowAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && crate) {
      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnimation, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotationAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnimation, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnimation, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: false,
            }),
          ])
        ),
      ]).start();

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      scaleAnimation.setValue(0);
      rotationAnimation.setValue(0);
      glowAnimation.setValue(0);
    }
  }, [visible, crate]);

  if (!visible || !crate) return null;

  const rotation = rotationAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const getCrateIcon = () => {
    switch (crate.type) {
      case 'skin':
        return '🎨';
      case 'coins':
        return '🪙';
      case 'powerup':
        return '⚡';
      default:
        return '🎁';
    }
  };

  const getCrateColor = () => {
    const colors = {
      common: '#CCCCCC',
      uncommon: '#4ADE80',
      rare: '#60A5FA',
      epic: '#A78BFA',
      legendary: '#FBBF24',
    };
    return colors[crate.rarity as keyof typeof colors] || '#CCCCCC';
  };

  const getCrateMessage = () => {
    switch (crate.type) {
      case 'skin':
        return `New Skin: ${crate.value}`;
      case 'coins':
        return `+${crate.value} Coins`;
      case 'powerup':
        return `${crate.value} Powerup`;
      default:
        return 'Mystery Reward';
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.crateContainer,
            {
              transform: [{ scale: scaleAnimation }, { rotate: rotation }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.glowEffect,
              {
                backgroundColor: getCrateColor(),
                opacity: glowOpacity,
              },
            ]}
          />

          <View style={[styles.crate, { borderColor: getCrateColor() }]}>
            <Text style={styles.crateIcon}>{getCrateIcon()}</Text>
            <Text style={styles.crateText}>MYSTERY</Text>
            <Text style={styles.crateText}>CRATE</Text>
          </View>
        </Animated.View>

        <View style={styles.content}>
          <Text style={styles.title}>🎉 Congratulations!</Text>
          <Text style={styles.message}>{getCrateMessage()}</Text>
          <Text style={[styles.rarity, { color: getCrateColor() }]}>
            {crate.rarity.toUpperCase()}
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.claimButton]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onClaim();
            }}
          >
            <Text style={styles.buttonText}>CLAIM REWARD</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.closeButton]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    maxWidth: width * 0.9,
  },
  crateContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 60,
    opacity: 0.3,
  },
  crate: {
    width: 100,
    height: 100,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crateIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  crateText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  message: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  rarity: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttons: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  claimButton: {
    backgroundColor: '#FFD700',
  },
  closeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666666',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
