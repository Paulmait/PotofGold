import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface UpgradePurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  coins: number;
  currentMaxMissed: number;
  onPurchase: (newMax: number) => void;
}

const UpgradePurchaseModal: React.FC<UpgradePurchaseModalProps> = ({
  visible,
  onClose,
  coins,
  currentMaxMissed,
  onPurchase,
}) => {
  const BASE_MISSED = 25;
  const [currentLevel, setCurrentLevel] = useState(
    Math.floor((currentMaxMissed - BASE_MISSED) / 5)
  );

  const upgrades = [
    {
      level: 1,
      missedBonus: 5,
      total: 30,
      cost: 500,
      description: '+5 Extra Chances',
      emoji: '🛡️',
    },
    {
      level: 2,
      missedBonus: 10,
      total: 35,
      cost: 1500,
      description: '+10 Safety Net',
      emoji: '🛡️🛡️',
    },
    {
      level: 3,
      missedBonus: 15,
      total: 40,
      cost: 3000,
      description: '+15 Guardian Angel',
      emoji: '👼',
    },
    {
      level: 4,
      missedBonus: 25,
      total: 50,
      cost: 5000,
      description: '+25 Super Shield',
      emoji: '💎',
    },
    {
      level: 5,
      missedBonus: 50,
      total: 75,
      cost: 10000,
      description: '+50 Legendary Protection',
      emoji: '👑',
    },
  ];

  const handlePurchase = async (upgrade: any) => {
    if (coins < upgrade.cost) {
      Alert.alert(
        'Not Enough Coins!',
        `You need ${upgrade.cost - coins} more coins for this upgrade.`,
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Get More Coins', onPress: () => {/* Navigate to shop */} },
        ]
      );
      return;
    }

    // Save upgrade
    try {
      await AsyncStorage.setItem('missedItemUpgrade', upgrade.level.toString());
      onPurchase(upgrade.total);
      setCurrentLevel(upgrade.level);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        '🎉 Upgrade Purchased!',
        `You now have ${upgrade.total} missed item chances!`,
        [{ text: 'Awesome!', onPress: onClose }]
      );
    } catch (error) {
      console.error('Failed to save upgrade:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.contentContainer}>
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF8C00']}
            style={styles.gradient}
          >
            <Text style={styles.title}>🛍️ Upgrade Shop 🛍️</Text>
            <Text style={styles.subtitle}>Get More Chances!</Text>

            <View style={styles.currentStatus}>
              <Text style={styles.statusText}>
                Current: {currentMaxMissed} chances
              </Text>
              <Text style={styles.coinsText}>
                Your Coins: 🪙 {coins}
              </Text>
            </View>

            <View style={styles.upgradesContainer}>
              {upgrades.map((upgrade) => {
                const isPurchased = currentLevel >= upgrade.level;
                const canAfford = coins >= upgrade.cost;

                return (
                  <TouchableOpacity
                    key={upgrade.level}
                    style={[
                      styles.upgradeCard,
                      isPurchased && styles.purchasedCard,
                      !canAfford && !isPurchased && styles.lockedCard,
                    ]}
                    onPress={() => !isPurchased && canAfford && handlePurchase(upgrade)}
                    disabled={isPurchased || !canAfford}
                  >
                    <View style={styles.upgradeHeader}>
                      <Text style={styles.upgradeEmoji}>{upgrade.emoji}</Text>
                      <Text style={styles.upgradeDescription}>
                        {upgrade.description}
                      </Text>
                    </View>

                    <View style={styles.upgradeDetails}>
                      <Text style={styles.upgradeTotal}>
                        Total: {upgrade.total} chances
                      </Text>
                      {isPurchased ? (
                        <Text style={styles.ownedText}>✅ Owned</Text>
                      ) : (
                        <View style={styles.costContainer}>
                          <Text style={[
                            styles.costText,
                            !canAfford && styles.costTextLocked
                          ]}>
                            🪙 {upgrade.cost}
                          </Text>
                          {!canAfford && (
                            <Text style={styles.needMoreText}>
                              Need {upgrade.cost - coins} more
                            </Text>
                          )}
                        </View>
                      )}
                    </View>

                    {isPurchased && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Tip: More chances = Longer gameplay!
              </Text>
              <Text style={styles.infoText}>
                Upgrades are permanent and apply to all future games.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
  },
  gradient: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  currentStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  coinsText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  upgradesContainer: {
    marginBottom: 20,
  },
  upgradeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  purchasedCard: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderColor: '#00FF00',
  },
  lockedCard: {
    opacity: 0.6,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  upgradeEmoji: {
    fontSize: 30,
    marginRight: 10,
  },
  upgradeDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  upgradeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upgradeTotal: {
    fontSize: 14,
    color: '#666',
  },
  costContainer: {
    alignItems: 'flex-end',
  },
  costText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  costTextLocked: {
    color: '#999',
  },
  needMoreText: {
    fontSize: 12,
    color: '#FF0000',
    marginTop: 2,
  },
  ownedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00FF00',
  },
  activeBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#00FF00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default UpgradePurchaseModal;