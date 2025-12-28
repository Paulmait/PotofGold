import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Blockage } from '../utils/blockageManager';

const { width } = Dimensions.get('window');

interface BlockageDisplayProps {
  blockages: Blockage[];
  warningLevel: 'safe' | 'warning' | 'danger' | 'critical';
  onBlockageHit?: (blockageId: string) => void;
}

const BlockageDisplay: React.FC<BlockageDisplayProps> = ({
  blockages,
  warningLevel,
  onBlockageHit,
}) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const warningPulse = useRef(new Animated.Value(1)).current;

  // Warning animation based on level
  useEffect(() => {
    if (warningLevel === 'danger' || warningLevel === 'critical') {
      // Pulse animation for danger
      Animated.loop(
        Animated.sequence([
          Animated.timing(warningPulse, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(warningPulse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      warningPulse.setValue(1);
    }
  }, [warningLevel]);

  const getBlockageColor = (blockage: Blockage) => {
    const healthPercent = blockage.health / blockage.maxHealth;

    if (blockage.isBreaking) {
      return '#FF6B6B'; // Red when breaking
    }

    if (healthPercent > 0.66) {
      return '#8B4513'; // Brown for strong
    } else if (healthPercent > 0.33) {
      return '#CD853F'; // Light brown for medium
    } else {
      return '#DEB887'; // Beige for weak
    }
  };

  const getWarningColor = () => {
    switch (warningLevel) {
      case 'safe':
        return 'transparent';
      case 'warning':
        return 'rgba(255, 255, 0, 0.2)';
      case 'danger':
        return 'rgba(255, 165, 0, 0.3)';
      case 'critical':
        return 'rgba(255, 0, 0, 0.4)';
    }
  };

  return (
    <View style={styles.container}>
      {/* Warning overlay */}
      {warningLevel !== 'safe' && (
        <Animated.View
          style={[
            styles.warningOverlay,
            {
              backgroundColor: getWarningColor(),
              transform: [{ scale: warningPulse }],
            },
          ]}
        />
      )}

      {/* Blockage indicator bar */}
      {blockages.length > 0 && (
        <View style={styles.indicatorBar}>
          <Text style={styles.indicatorText}>
            Blockage: {Math.round((blockages.length / 25) * 100)}%
          </Text>
          <View style={styles.indicatorFill}>
            <View
              style={[
                styles.indicatorProgress,
                {
                  width: `${(blockages.length / 25) * 100}%`,
                  backgroundColor: warningLevel === 'critical' ? '#FF0000' : '#FFA500',
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Render individual blockages */}
      {blockages.map((blockage) => (
        <BlockageItem
          key={blockage.id}
          blockage={blockage}
          color={getBlockageColor(blockage)}
          onHit={() => onBlockageHit?.(blockage.id)}
        />
      ))}

      {/* Critical warning message */}
      {warningLevel === 'critical' && (
        <View style={styles.criticalWarning}>
          <Text style={styles.criticalText}>⚠️ DANGER! Clear blockages!</Text>
        </View>
      )}
    </View>
  );
};

const BlockageItem: React.FC<{
  blockage: Blockage;
  color: string;
  onHit: () => void;
}> = ({ blockage, color, onHit }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const crackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (blockage.isBreaking) {
      // Crack animation when breaking
      Animated.sequence([
        Animated.timing(crackAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(crackAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [blockage.isBreaking]);

  const healthPercent = blockage.health / blockage.maxHealth;

  return (
    <Animated.View
      style={[
        styles.blockage,
        {
          left: blockage.x,
          top: blockage.y,
          width: blockage.width,
          height: blockage.height,
          backgroundColor: color,
          opacity: fadeAnim,
          transform: [
            {
              rotate: crackAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '2deg'],
              }),
            },
          ],
        },
      ]}
    >
      {/* Show cracks based on damage */}
      {healthPercent < 0.66 && (
        <View style={styles.crack}>
          <Text style={styles.crackEmoji}>💥</Text>
        </View>
      )}

      {/* Item type indicator */}
      <Text style={styles.blockageEmoji}>{blockage.type === 'bomb' ? '💣' : '📦'}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  warningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  indicatorBar: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 5,
  },
  indicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  indicatorFill: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  indicatorProgress: {
    height: '100%',
    borderRadius: 4,
  },
  blockage: {
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  blockageEmoji: {
    fontSize: 12,
    opacity: 0.7,
  },
  crack: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  crackEmoji: {
    fontSize: 10,
  },
  criticalWarning: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    padding: 10,
    borderRadius: 10,
  },
  criticalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default BlockageDisplay;
