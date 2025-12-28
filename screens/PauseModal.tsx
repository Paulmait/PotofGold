import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { skinSystem } from '../utils/skinSystem';
import { metaGameSystem } from '../utils/metaGameSystem';
import { soundSystem } from '../utils/soundSystem';

const { width, height } = Dimensions.get('window');

interface PauseModalProps {
  visible: boolean;
  onClose: () => void;
  onResume: () => void;
  onRetry: () => void;
  onExit: () => void;
  currentScore: number;
  currentCoins: number;
  potLevel: number;
  currentSkin: string;
  availablePowerUps: any[];
  pauseTrigger?: any;
  pauseActions?: any;
  pauseMonetization?: any;
  onStateUpdate?: (updates: any) => void; // Callback for immediate state updates
}

export default function PauseModal({
  visible,
  onClose,
  onResume,
  onRetry,
  onExit,
  currentScore,
  currentCoins,
  potLevel,
  currentSkin,
  availablePowerUps,
  pauseTrigger,
  pauseActions,
  pauseMonetization,
  onStateUpdate,
}: PauseModalProps) {
  const [ownedSkins, setOwnedSkins] = useState<any[]>([]);
  const [selectedSkin, setSelectedSkin] = useState(currentSkin);
  const [upgradeCost, setUpgradeCost] = useState(potLevel * 100);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isSkinChanging, setIsSkinChanging] = useState(false);

  // Enhanced animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [upgradeAnim] = useState(new Animated.Value(1));
  const [skinChangeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      loadUserData();
      animateIn();
    } else {
      animateOut();
    }
  }, [visible]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateUpgrade = () => {
    Animated.sequence([
      Animated.timing(upgradeAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(upgradeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateSkinChange = () => {
    Animated.sequence([
      Animated.timing(skinChangeAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(skinChangeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadUserData = async () => {
    try {
      const skins = skinSystem.getOwnedSkins();
      setOwnedSkins(skins);
      setUpgradeCost(potLevel * 100);
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const upgradePot = async () => {
    if (currentCoins < upgradeCost) {
      Alert.alert('Insufficient Coins', `You need ${upgradeCost} coins to upgrade your pot.`);
      return;
    }

    setIsUpgrading(true);
    animateUpgrade();

    try {
      const result = await metaGameSystem.upgradePot();
      if (result.success) {
        // Play upgrade success sound
        await soundSystem.playSound('upgrade_success');
        
        // Update local state
        setUpgradeCost(result.newLevel * 100);
        
        // Notify parent of state update
        onStateUpdate?.({
          potLevel: result.newLevel,
          coins: currentCoins - upgradeCost,
        });
        
        Alert.alert('Success!', `Pot upgraded to level ${result.newLevel}`);
        onResume(); // Resume game with updated pot
      } else {
        Alert.alert('Upgrade Failed', 'Not enough coins or pot at max level');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upgrade pot');
    } finally {
      setIsUpgrading(false);
    }
  };

  const switchSkin = async (skinId: string) => {
    setIsSkinChanging(true);
    animateSkinChange();

    try {
      const result = await skinSystem.equipSkin(skinId);
      if (result.success) {
        // Play skin change sound
        await soundSystem.playSound('skin_change');
        
        setSelectedSkin(skinId);
        
        // Notify parent of state update
        onStateUpdate?.({
          currentSkin: skinId,
        });
        
        Alert.alert('Success!', `Equipped ${result.skin?.name}`);
        onResume(); // Resume game with new skin
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to switch skin');
    } finally {
      setIsSkinChanging(false);
    }
  };

  const usePowerUp = async (powerUpId: string) => {
    try {
      // Play power-up sound
      await soundSystem.playSound('powerup_activate');
      
      Alert.alert('Power-up Activated!', 'Power-up will be active when you resume!');
      onResume();
    } catch (error) {
      Alert.alert('Error', 'Failed to use power-up');
    }
  };

  const renderSkinButton = (skin: any) => {
    const isSelected = selectedSkin === skin.id;
    const isEquipped = skin.id === currentSkin;
    
    return (
      <Animated.View
        key={skin.id}
        style={[
          styles.skinButton,
          isSelected && styles.selectedSkinButton,
          isEquipped && styles.equippedSkinButton,
          {
            transform: [{ scale: skinChangeAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.skinButtonTouchable}
          onPress={() => switchSkin(skin.id)}
          disabled={isSkinChanging}
        >
          <Text style={styles.skinIcon}>🎨</Text>
          <Text style={styles.skinName}>{skin.name}</Text>
          {isEquipped && <Text style={styles.equippedBadge}>✓</Text>}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>⏸ Game Paused</Text>
          </View>

          {/* Pot Level Display */}
          <View style={styles.potLevelSection}>
            <Text style={styles.potLevelText}>Pot Level: {potLevel}</Text>
            <Animated.View style={{ transform: [{ scale: upgradeAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.upgradeButton,
                  currentCoins < upgradeCost && styles.upgradeButtonDisabled,
                  isUpgrading && styles.upgradeButtonLoading,
                ]}
                onPress={upgradePot}
                disabled={currentCoins < upgradeCost || isUpgrading}
                accessibilityLabel={`Upgrade pot. Cost: ${upgradeCost} coins`}
                accessibilityHint={currentCoins < upgradeCost ? "Not enough coins" : "Upgrades your pot to catch more items"}
                accessibilityRole="button"
                accessibilityState={{ disabled: currentCoins < upgradeCost || isUpgrading }}
              >
                <Text style={styles.upgradeIcon}>🔼</Text>
                <Text style={styles.upgradeText}>
                  {isUpgrading ? 'Upgrading...' : `Upgrade Pot (Cost: ${upgradeCost})`}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Skin Selection */}
          <View style={styles.skinSection}>
            <Text style={styles.skinSectionTitle}>Switch Skin:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.skinScrollView}
            >
              {ownedSkins.map(renderSkinButton)}
            </ScrollView>
          </View>

          {/* Power-ups (Optional) */}
          {availablePowerUps.length > 0 && (
            <View style={styles.powerUpSection}>
              <Text style={styles.powerUpSectionTitle}>Power-ups:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.powerUpScrollView}
              >
                {availablePowerUps.map((powerUp: any) => (
                  <TouchableOpacity
                    key={powerUp.id}
                    style={styles.powerUpButton}
                    onPress={() => usePowerUp(powerUp.id)}
                  >
                    <Text style={styles.powerUpIcon}>⚡</Text>
                    <Text style={styles.powerUpName}>{powerUp.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {pauseActions?.showRetry && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onRetry}
                accessibilityLabel="Retry game"
                accessibilityHint="Restarts the current game"
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>🔄 Retry</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.resumeButton}
              onPress={onResume}
              accessibilityLabel="Resume game"
              accessibilityHint="Continues the paused game"
              accessibilityRole="button"
            >
              <Text style={styles.resumeButtonText}>▶️ Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exitButton}
              onPress={onExit}
              accessibilityLabel="Exit game"
              accessibilityHint="Returns to the home screen"
              accessibilityRole="button"
            >
              <Text style={styles.exitButtonText}>❌ Exit</Text>
            </TouchableOpacity>
          </View>

          {/* Monetization Message */}
          {pauseMonetization?.message && (
            <View style={styles.monetizationMessage}>
              <Text style={styles.monetizationText}>{pauseMonetization.message}</Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  potLevelSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  potLevelText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  upgradeButtonDisabled: {
    backgroundColor: '#666',
  },
  upgradeButtonLoading: {
    backgroundColor: '#FFA726',
  },
  upgradeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  upgradeText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  skinSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  skinSectionTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  skinScrollView: {
    flexDirection: 'row',
  },
  skinButton: {
    marginRight: 10,
    minWidth: 80,
  },
  skinButtonTouchable: {
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSkinButton: {
    borderColor: '#FFD700',
    backgroundColor: '#4a4a4a',
  },
  equippedSkinButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#4a4a4a',
  },
  skinIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  skinName: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  equippedBadge: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 2,
  },
  powerUpSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  powerUpSectionTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  powerUpScrollView: {
    flexDirection: 'row',
  },
  powerUpButton: {
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    minWidth: 80,
  },
  powerUpIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  powerUpName: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#666',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exitButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  monetizationMessage: {
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  monetizationText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 