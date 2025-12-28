import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameContext } from '../context/GameContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'upgrade' | 'skin' | 'powerup';
  icon: string;
  color: string;
  owned?: boolean;
}

const StoreScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { gameState, updateGameState, addCoins } = useGameContext();
  const [selectedCategory, setSelectedCategory] = useState<'upgrades' | 'skins' | 'powerups'>(
    'upgrades'
  );

  const storeItems: StoreItem[] = [
    // Upgrades
    {
      id: 'pot_size_1',
      name: 'Bigger Pot',
      description: 'Increase pot size by 20%',
      price: 100,
      type: 'upgrade',
      icon: 'resize',
      color: '#4CAF50',
    },
    {
      id: 'pot_speed_1',
      name: 'Faster Movement',
      description: 'Increase pot movement speed',
      price: 150,
      type: 'upgrade',
      icon: 'speedometer',
      color: '#2196F3',
    },
    {
      id: 'magnet_upgrade',
      name: 'Magnet Power',
      description: 'Attract coins from further away',
      price: 200,
      type: 'upgrade',
      icon: 'magnet',
      color: '#FFD700',
    },
    // Skins
    {
      id: 'golden_pot',
      name: 'Golden Pot',
      description: 'Shiny golden pot skin',
      price: 500,
      type: 'skin',
      icon: 'star',
      color: '#FFD700',
    },
    {
      id: 'silver_pot',
      name: 'Silver Pot',
      description: 'Elegant silver pot skin',
      price: 300,
      type: 'skin',
      icon: 'diamond',
      color: '#C0C0C0',
    },
    {
      id: 'rainbow_pot',
      name: 'Rainbow Pot',
      description: 'Colorful rainbow pot skin',
      price: 800,
      type: 'skin',
      icon: 'rainbow',
      color: '#FF6B6B',
    },
    // Power-ups
    {
      id: 'magnet_powerup',
      name: 'Magnet Power-up',
      description: 'Attract coins for 10 seconds',
      price: 50,
      type: 'powerup',
      icon: 'magnet',
      color: '#FFD700',
    },
    {
      id: 'double_points',
      name: 'Double Points',
      description: 'Double points for 10 seconds',
      price: 75,
      type: 'powerup',
      icon: 'flash',
      color: '#FF6B6B',
    },
    {
      id: 'slow_motion',
      name: 'Slow Motion',
      description: 'Slow down falling objects',
      price: 60,
      type: 'powerup',
      icon: 'time',
      color: '#4ECDC4',
    },
  ];

  const handlePurchase = (item: StoreItem) => {
    if (gameState.coins < item.price) {
      Alert.alert('Insufficient Coins', 'You need more coins to purchase this item!');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Deduct coins
    updateGameState({ coins: gameState.coins - item.price });

    // Apply purchase effects
    switch (item.type) {
      case 'upgrade':
        if (item.id === 'pot_size_1') {
          updateGameState({ potSize: gameState.potSize + 0.2 });
        } else if (item.id === 'pot_speed_1') {
          updateGameState({ potSpeed: gameState.potSpeed + 0.3 });
        } else if (item.id === 'magnet_upgrade') {
          // Magnet upgrade logic would go here
        }
        break;
      case 'skin':
        updateGameState({
          ownedSkins: [...gameState.ownedSkins, item.id],
          currentSkin: item.id,
        });
        break;
      case 'powerup':
        // Power-up purchase logic would go here
        break;
    }

    Alert.alert('Purchase Successful!', `You bought ${item.name}!`);
  };

  const getFilteredItems = () => {
    return storeItems.filter((item) => {
      if (selectedCategory === 'upgrades') return item.type === 'upgrade';
      if (selectedCategory === 'skins') return item.type === 'skin';
      if (selectedCategory === 'powerups') return item.type === 'powerup';
      return false;
    });
  };

  const renderStoreItem = (item: StoreItem) => {
    const canAfford = gameState.coins >= item.price;
    const isOwned = item.type === 'skin' && gameState.ownedSkins.includes(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.storeItem, { opacity: canAfford ? 1 : 0.6 }]}
        onPress={() => canAfford && !isOwned && handlePurchase(item)}
        disabled={!canAfford || isOwned}
      >
        <LinearGradient colors={[item.color, item.color + '80']} style={styles.itemIcon}>
          <Ionicons name={item.icon as any} size={24} color="white" />
        </LinearGradient>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
          <View style={styles.itemPrice}>
            <Ionicons name="coin" size={16} color="#FFD700" />
            <Text style={styles.priceText}>{item.price}</Text>
          </View>
        </View>

        {isOwned && (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedText}>OWNED</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#FFD700', '#FFA500', '#FF8C00']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.title}>Store</Text>

        <View style={styles.coinsContainer}>
          <Ionicons name="coin" size={20} color="#FFD700" />
          <Text style={styles.coinsText}>{gameState.coins.toLocaleString()}</Text>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        {[
          { key: 'upgrades', label: 'Upgrades', icon: 'trending-up' },
          { key: 'skins', label: 'Skins', icon: 'color-palette' },
          { key: 'powerups', label: 'Power-ups', icon: 'flash' },
        ].map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryTab,
              selectedCategory === category.key && styles.activeCategoryTab,
            ]}
            onPress={() => setSelectedCategory(category.key as any)}
          >
            <Ionicons
              name={category.icon as any}
              size={20}
              color={selectedCategory === category.key ? 'white' : '#FFD700'}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.key && styles.activeCategoryText,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Store Items */}
      <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
        {getFilteredItems().map(renderStoreItem)}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  coinsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 12,
    marginHorizontal: 5,
  },
  activeCategoryTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 6,
  },
  activeCategoryText: {
    color: 'white',
  },
  itemsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  itemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    marginBottom: 8,
  },
  itemPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 4,
  },
  ownedBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ownedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default StoreScreen;
