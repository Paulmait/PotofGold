import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { stateCollectionSystem } from '../utils/stateCollectionSystem';
import { masterGameManager } from '../utils/masterGameManager';

const { width, height } = Dimensions.get('window');

interface StateCollectionScreenProps {
  navigation: any;
}

export default function StateCollectionScreen({ navigation }: StateCollectionScreenProps) {
  const [collectionProgress, setCollectionProgress] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('unlocked');
  const [showSpecialShop, setShowSpecialShop] = useState(false);
  const [specialShopData, setSpecialShopData] = useState<any>(null);

  useEffect(() => {
    loadCollectionData();
  }, []);

  const loadCollectionData = async () => {
    try {
      const userId = 'player_1'; // In real app, get from auth
      const progress = await stateCollectionSystem.initializeCollection(userId);
      setCollectionProgress(progress);
    } catch (error) {
      console.log('Error loading collection data:', error);
    }
  };

  const equipState = async (stateId: string) => {
    try {
      const success = await stateCollectionSystem.equipState(stateId);
      if (success) {
        Alert.alert('State Equipped!', 'Your new state pot is now active');
        loadCollectionData();
      } else {
        Alert.alert('Equip Failed', 'Could not equip this state');
      }
    } catch (error) {
      console.log('Error equipping state:', error);
    }
  };

  const unlockState = async (stateId: string) => {
    try {
      const result = await stateCollectionSystem.unlockState(stateId);
      if (result.success) {
        Alert.alert('State Unlocked!', result.message);
        loadCollectionData();
      } else {
        Alert.alert('Unlock Failed', result.message);
      }
    } catch (error) {
      console.log('Error unlocking state:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return '#ccc';
      case 'rare':
        return '#4CAF50';
      case 'epic':
        return '#9C27B0';
      case 'legendary':
        return '#FFD700';
      case 'secret':
        return '#FF6B6B';
      default:
        return '#ccc';
    }
  };

  const getUnlockMethodText = (method: string, requirement: number) => {
    switch (method) {
      case 'free':
        return 'Free';
      case 'coins':
        return `${requirement} coins`;
      case 'achievement':
        return `Achievement (${requirement})`;
      case 'purchase':
        return '$0.99';
      case 'streak':
        return `${requirement}-day streak`;
      case 'special':
        return 'Special event';
      default:
        return 'Unknown';
    }
  };

  const showSpecialItemEffect = (item: any) => {
    setSpecialShopData(item);
    setShowSpecialShop(true);
  };

  if (!collectionProgress) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading State Collection...</Text>
      </View>
    );
  }

  const stats = stateCollectionSystem.getCollectionStats();
  const availableStates = stateCollectionSystem.getAvailableStates();
  const unlockableStates = stateCollectionSystem.getUnlockableStates();
  const specialItems = stateCollectionSystem.getSpecialItems();
  const equippedState = stateCollectionSystem.getEquippedState();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ State Collection</Text>
        <Text style={styles.headerSubtitle}>Collect all 50 US states!</Text>
      </View>

      {/* Progress Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Unlocked</Text>
          <Text style={styles.statValue}>
            {stats.unlocked}/{stats.total}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Progress</Text>
          <Text style={styles.statValue}>{Math.round(stats.progress)}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Equipped</Text>
          <Text style={styles.statValue}>{equippedState?.stateName || 'None'}</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'unlocked' && styles.tabActive]}
          onPress={() => setSelectedTab('unlocked')}
        >
          <Text style={[styles.tabText, selectedTab === 'unlocked' && styles.tabTextActive]}>
            Unlocked ({availableStates.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'unlockable' && styles.tabActive]}
          onPress={() => setSelectedTab('unlockable')}
        >
          <Text style={[styles.tabText, selectedTab === 'unlockable' && styles.tabTextActive]}>
            Available ({unlockableStates.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'special' && styles.tabActive]}
          onPress={() => setSelectedTab('special')}
        >
          <Text style={[styles.tabText, selectedTab === 'special' && styles.tabTextActive]}>
            Special Items
          </Text>
        </TouchableOpacity>
      </View>

      {/* States List */}
      <ScrollView style={styles.statesContainer}>
        {selectedTab === 'unlocked' && (
          <>
            <Text style={styles.sectionTitle}>Your Collection</Text>
            {availableStates.map((state) => (
              <View key={state.id} style={styles.stateCard}>
                <View style={styles.stateInfo}>
                  <View style={styles.stateHeader}>
                    <Text style={styles.stateName}>{state.name}</Text>
                    <View
                      style={[
                        styles.rarityBadge,
                        { backgroundColor: getRarityColor(state.rarity) },
                      ]}
                    >
                      <Text style={styles.rarityText}>{state.rarity.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.stateDescription}>{state.description}</Text>
                  <Text style={styles.stateTheme}>Theme: {state.theme}</Text>
                  {state.equipped && (
                    <View style={styles.equippedBadge}>
                      <Text style={styles.equippedText}>EQUIPPED</Text>
                    </View>
                  )}
                </View>
                <View style={styles.stateActions}>
                  {!state.equipped && (
                    <TouchableOpacity
                      style={styles.equipButton}
                      onPress={() => equipState(state.id)}
                    >
                      <Text style={styles.equipButtonText}>Equip</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {selectedTab === 'unlockable' && (
          <>
            <Text style={styles.sectionTitle}>Available to Unlock</Text>
            {unlockableStates.map((state) => (
              <View key={state.id} style={styles.stateCard}>
                <View style={styles.stateInfo}>
                  <View style={styles.stateHeader}>
                    <Text style={styles.stateName}>{state.name}</Text>
                    <View
                      style={[
                        styles.rarityBadge,
                        { backgroundColor: getRarityColor(state.rarity) },
                      ]}
                    >
                      <Text style={styles.rarityText}>{state.rarity.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.stateDescription}>{state.description}</Text>
                  <Text style={styles.stateTheme}>Theme: {state.theme}</Text>
                  <Text style={styles.unlockMethod}>
                    Unlock: {getUnlockMethodText(state.unlockMethod, state.unlockRequirement)}
                  </Text>
                </View>
                <View style={styles.stateActions}>
                  <TouchableOpacity
                    style={styles.unlockButton}
                    onPress={() => unlockState(state.id)}
                  >
                    <Text style={styles.unlockButtonText}>Unlock</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {selectedTab === 'special' && (
          <>
            <Text style={styles.sectionTitle}>Special Falling Items</Text>
            {specialItems.map((item) => (
              <View key={item.id} style={styles.specialItemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <Text style={styles.itemEffect}>{item.effect}</Text>
                <Text style={styles.itemRarity}>Rarity: {Math.round(item.rarity * 100)}%</Text>
                <TouchableOpacity
                  style={styles.itemButton}
                  onPress={() => showSpecialItemEffect(item)}
                >
                  <Text style={styles.itemButtonText}>View Effect</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Special Shop Modal */}
      {showSpecialShop && specialShopData && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{specialShopData.name}</Text>
            <Text style={styles.modalEmoji}>{specialShopData.emoji}</Text>
            <Text style={styles.modalEffect}>{specialShopData.effect}</Text>
            <Text style={styles.modalMessage}>{specialShopData.unlockData.message}</Text>

            {specialShopData.unlockType === 'shop' && (
              <View style={styles.shopItems}>
                <Text style={styles.shopTitle}>Available Items:</Text>
                {specialShopData.unlockData.items.map((itemId: string) => (
                  <Text key={itemId} style={styles.shopItem}>
                    {itemId}
                  </Text>
                ))}
              </View>
            )}

            {specialShopData.unlockType === 'booster' && (
              <View style={styles.boosterItems}>
                <Text style={styles.boosterTitle}>Available Boosters:</Text>
                {specialShopData.unlockData.boosters.map((booster: any) => (
                  <Text key={booster.name} style={styles.boosterItem}>
                    {booster.name} - {booster.duration} rounds - {booster.price} coins
                  </Text>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowSpecialShop(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Game')}>
          <Text style={styles.navButtonText}>Play Game</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Shop')}>
          <Text style={styles.navButtonText}>Shop</Text>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#2a2a2a',
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#333',
    padding: 5,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FFD700',
  },
  tabText: {
    color: '#ccc',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tabTextActive: {
    color: '#1a1a1a',
  },
  statesContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  stateCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stateInfo: {
    flex: 1,
  },
  stateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  stateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    flex: 1,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  stateDescription: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 5,
  },
  stateTheme: {
    fontSize: 11,
    color: '#888',
    marginBottom: 5,
  },
  unlockMethod: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  equippedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  equippedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  stateActions: {
    alignItems: 'flex-end',
  },
  equipButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  equipButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  unlockButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  unlockButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  specialItemCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  itemEffect: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
  itemRarity: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  itemButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  itemButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
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
  modalContent: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 15,
    margin: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  modalEffect: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
  },
  shopItems: {
    marginBottom: 15,
  },
  shopTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 5,
  },
  shopItem: {
    fontSize: 12,
    color: '#ccc',
    marginVertical: 2,
  },
  boosterItems: {
    marginBottom: 15,
  },
  boosterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 5,
  },
  boosterItem: {
    fontSize: 12,
    color: '#ccc',
    marginVertical: 2,
  },
  modalButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#333',
  },
  navButton: {
    flex: 1,
    backgroundColor: '#555',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 50,
  },
});
