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
import { metaGameSystem } from '../utils/metaGameSystem';
import { masterGameManager } from '../utils/masterGameManager';

const { width, height } = Dimensions.get('window');

interface ShopScreenProps {
  navigation: any;
}

export default function ShopScreen({ navigation }: ShopScreenProps) {
  const [shopProgress, setShopProgress] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('pots');
  const [currentCurrency, setCurrentCurrency] = useState({ coins: 0, gems: 0 });

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    try {
      const progress = metaGameSystem.getProgress();
      if (progress) {
        setShopProgress(progress);
        setCurrentCurrency({
          coins: progress.currency.coins,
          gems: progress.currency.gems,
        });
      }
    } catch (error) {
      console.log('Error loading shop data:', error);
    }
  };

  const purchaseItem = async (itemId: string) => {
    try {
      const result = await metaGameSystem.purchaseShopItem(itemId);
      if (result.success) {
        Alert.alert(
          'Purchase Successful!',
          `You bought ${result.item?.name}`,
          [{ text: 'OK', onPress: loadShopData }]
        );
      } else {
        Alert.alert('Purchase Failed', 'Not enough currency or item unavailable');
      }
    } catch (error) {
      console.log('Error purchasing item:', error);
    }
  };

  const equipPot = async (potId: string) => {
    try {
      const success = await metaGameSystem.equipPot(potId);
      if (success) {
        Alert.alert('Pot Equipped!', 'Your new pot is now active');
        loadShopData();
      } else {
        Alert.alert('Equip Failed', 'Could not equip this pot');
      }
    } catch (error) {
      console.log('Error equipping pot:', error);
    }
  };

  const equipSkin = async (skinId: string) => {
    try {
      const success = await metaGameSystem.equipSkin(skinId);
      if (success) {
        Alert.alert('Skin Equipped!', 'Your new skin is now active');
        loadShopData();
      } else {
        Alert.alert('Equip Failed', 'Could not equip this skin');
      }
    } catch (error) {
      console.log('Error equipping skin:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#ccc';
      case 'rare': return '#4CAF50';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FFD700';
      default: return '#ccc';
    }
  };

  if (!shopProgress) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading Shop...</Text>
      </View>
    );
  }

  const availableItems = metaGameSystem.getAvailableShopItems();
  const ownedPots = metaGameSystem.getOwnedPots();
  const ownedSkins = metaGameSystem.getOwnedSkins();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Shop</Text>
        <Text style={styles.headerSubtitle}>Upgrade your pot and collection</Text>
      </View>

      {/* Currency Display */}
      <View style={styles.currencyContainer}>
        <View style={styles.currencyItem}>
          <Text style={styles.currencyLabel}>Coins</Text>
          <Text style={styles.currencyAmount}>{currentCurrency.coins}</Text>
        </View>
        <View style={styles.currencyItem}>
          <Text style={styles.currencyLabel}>Gems</Text>
          <Text style={styles.currencyAmount}>{currentCurrency.gems}</Text>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[styles.categoryTab, selectedCategory === 'pots' && styles.categoryTabActive]}
          onPress={() => setSelectedCategory('pots')}
        >
          <Text style={[styles.categoryText, selectedCategory === 'pots' && styles.categoryTextActive]}>
            Pots
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryTab, selectedCategory === 'skins' && styles.categoryTabActive]}
          onPress={() => setSelectedCategory('skins')}
        >
          <Text style={[styles.categoryText, selectedCategory === 'skins' && styles.categoryTextActive]}>
            Skins
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryTab, selectedCategory === 'powerups' && styles.categoryTabActive]}
          onPress={() => setSelectedCategory('powerups')}
        >
          <Text style={[styles.categoryText, selectedCategory === 'powerups' && styles.categoryTextActive]}>
            Power-ups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <ScrollView style={styles.itemsContainer}>
        {selectedCategory === 'pots' && (
          <>
            <Text style={styles.sectionTitle}>Available for Purchase</Text>
            {availableItems
              .filter(item => item.category === 'pot')
              .map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                    <Text style={[styles.itemRarity, { color: getRarityColor(item.rarity) }]}>
                      {item.rarity.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.itemPrice}>
                    <Text style={styles.priceText}>{item.price} {item.currency}</Text>
                    <TouchableOpacity
                      style={styles.buyButton}
                      onPress={() => purchaseItem(item.id)}
                    >
                      <Text style={styles.buyButtonText}>Buy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

            <Text style={styles.sectionTitle}>Your Collection</Text>
            {ownedPots.map((pot) => (
              <View key={pot.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{pot.name}</Text>
                  <Text style={styles.itemDescription}>{pot.description}</Text>
                  <Text style={styles.itemLevel}>Level {pot.level}/{pot.maxLevel}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.equipButton}
                    onPress={() => equipPot(pot.id)}
                  >
                    <Text style={styles.equipButtonText}>Equip</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {selectedCategory === 'skins' && (
          <>
            <Text style={styles.sectionTitle}>Available for Purchase</Text>
            {availableItems
              .filter(item => item.category === 'skin')
              .map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                    <Text style={[styles.itemRarity, { color: getRarityColor(item.rarity) }]}>
                      {item.rarity.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.itemPrice}>
                    <Text style={styles.priceText}>{item.price} {item.currency}</Text>
                    <TouchableOpacity
                      style={styles.buyButton}
                      onPress={() => purchaseItem(item.id)}
                    >
                      <Text style={styles.buyButtonText}>Buy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

            <Text style={styles.sectionTitle}>Your Collection</Text>
            {ownedSkins.map((skin) => (
              <View key={skin.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{skin.name}</Text>
                  <Text style={styles.itemDescription}>{skin.description}</Text>
                  <Text style={[styles.itemRarity, { color: getRarityColor(skin.rarity) }]}>
                    {skin.rarity.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.equipButton}
                    onPress={() => equipSkin(skin.id)}
                  >
                    <Text style={styles.equipButtonText}>Equip</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {selectedCategory === 'powerups' && (
          <>
            <Text style={styles.sectionTitle}>Available for Purchase</Text>
            {availableItems
              .filter(item => item.category === 'powerup')
              .map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                    <Text style={[styles.itemRarity, { color: getRarityColor(item.rarity) }]}>
                      {item.rarity.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.itemPrice}>
                    <Text style={styles.priceText}>{item.price} {item.currency}</Text>
                    <TouchableOpacity
                      style={styles.buyButton}
                      onPress={() => purchaseItem(item.id)}
                    >
                      <Text style={styles.buyButtonText}>Buy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Camp')}>
          <Text style={styles.navButtonText}>Camp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Game')}>
          <Text style={styles.navButtonText}>Play Game</Text>
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
  currencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#2a2a2a',
    marginBottom: 10,
  },
  currencyItem: {
    alignItems: 'center',
  },
  currencyLabel: {
    fontSize: 14,
    color: '#ccc',
  },
  currencyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  categoryContainer: {
    flexDirection: 'row',
    backgroundColor: '#333',
    padding: 5,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  categoryTab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  categoryTabActive: {
    backgroundColor: '#FFD700',
  },
  categoryText: {
    color: '#ccc',
    fontWeight: 'bold',
  },
  categoryTextActive: {
    color: '#1a1a1a',
  },
  itemsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
    marginTop: 20,
  },
  itemCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  itemDescription: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 5,
  },
  itemRarity: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 5,
  },
  itemLevel: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  itemPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 5,
  },
  buyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  buyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  itemActions: {
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