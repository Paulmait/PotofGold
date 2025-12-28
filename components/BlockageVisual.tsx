import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface BlockageVisualProps {
  blockageCount: number;
  maxBlockages: number;
  onClearPress?: () => void;
  canAffordClear?: boolean;
  clearCost?: number;
}

const BlockageVisual: React.FC<BlockageVisualProps> = memo(
  ({ blockageCount, maxBlockages, onClearPress, canAffordClear = false, clearCost = 50 }) => {
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Shake animation when near max blockages
    useEffect(() => {
      if (blockageCount >= maxBlockages - 1) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(shakeAnim, {
              toValue: 10,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: -10,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else {
        shakeAnim.setValue(0);
      }
    }, [blockageCount, maxBlockages]);

    // Pulse animation for critical state
    useEffect(() => {
      if (blockageCount >= maxBlockages) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }, [blockageCount, maxBlockages]);

    if (blockageCount === 0) return null;

    const blockagePercentage = (blockageCount / maxBlockages) * 100;
    const isWarning = blockageCount >= maxBlockages * 0.6;
    const isCritical = blockageCount >= maxBlockages * 0.8;
    const isFull = blockageCount >= maxBlockages;

    const getBlockageColor = () => {
      if (isFull) return ['#FF0000', '#CC0000'];
      if (isCritical) return ['#FF6B6B', '#FF4444'];
      if (isWarning) return ['#FFA500', '#FF8C00'];
      return ['#FFD700', '#FFA500'];
    };

    const getMissedItems = () => {
      const items = [];
      for (let i = 0; i < blockageCount; i++) {
        const itemTypes = ['💎', '🪙', '💰', '⭐', '🏆'];
        const randomItem = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        items.push(
          <View
            key={i}
            style={[
              styles.missedItem,
              {
                left: Math.random() * (width - 40),
                bottom: Math.random() * 30 + i * 10,
                transform: [{ rotate: `${Math.random() * 30 - 15}deg` }],
              },
            ]}
          >
            <Text style={styles.missedItemEmoji}>{randomItem}</Text>
          </View>
        );
      }
      return items;
    };

    return (
      <View style={styles.container} pointerEvents="box-none">
        {/* Missed items visual */}
        <View style={styles.missedItemsContainer}>{getMissedItems()}</View>

        {/* Blockage bar */}
        <Animated.View
          style={[
            styles.blockageBar,
            {
              transform: [{ translateX: shakeAnim }, { scale: pulseAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={getBlockageColor()}
            style={[styles.blockageFill, { height: `${blockagePercentage}%` }]}
          />

          {/* Warning text */}
          {isWarning && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                {isFull ? '⚠️ PATH BLOCKED!' : isCritical ? '⚠️ DANGER!' : '⚠️ WARNING'}
              </Text>
              <Text style={styles.blockageStatus}>
                {blockageCount}/{maxBlockages} Blockages
              </Text>
            </View>
          )}

          {/* Clear button */}
          {blockageCount > 0 && onClearPress && (
            <TouchableOpacity
              style={[styles.clearButton, !canAffordClear && styles.clearButtonDisabled]}
              onPress={canAffordClear ? onClearPress : undefined}
              activeOpacity={canAffordClear ? 0.7 : 1}
            >
              <LinearGradient
                colors={canAffordClear ? ['#4CAF50', '#45a049'] : ['#666', '#444']}
                style={styles.clearButtonGradient}
              >
                <Text style={styles.clearButtonText}>Clear Path</Text>
                <View style={styles.costBadge}>
                  <Text style={styles.costEmoji}>🪙</Text>
                  <Text style={styles.costText}>{clearCost}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Visual debris effect at bottom */}
        <View style={[styles.debrisLayer, { opacity: blockagePercentage / 100 }]}>
          <LinearGradient
            colors={['transparent', 'rgba(139, 69, 19, 0.3)', 'rgba(139, 69, 19, 0.6)']}
            style={styles.debrisGradient}
          />
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Above the bottom bar
    left: 0,
    right: 0,
    height: 120,
  },
  missedItemsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  missedItem: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  missedItemEmoji: {
    fontSize: 20,
  },
  blockageBar: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    overflow: 'hidden',
  },
  blockageFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 8,
  },
  warningContainer: {
    position: 'absolute',
    top: -40,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 5,
    borderRadius: 5,
    minWidth: 120,
  },
  warningText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  blockageStatus: {
    color: '#FFF',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  clearButton: {
    position: 'absolute',
    top: -70,
    right: 70,
    borderRadius: 20,
    overflow: 'hidden',
  },
  clearButtonDisabled: {
    opacity: 0.5,
  },
  clearButtonGradient: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 5,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
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
  debrisLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  debrisGradient: {
    flex: 1,
  },
});

export default BlockageVisual;
