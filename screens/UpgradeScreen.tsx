import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameContext } from '../context/GameContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface UpgradeItem {
  id: string;
  name: string;
  description: string;
  currentLevel: number;
  maxLevel: number;
  basePrice: number;
  icon: string;
  color: string;
  effect: string;
}

const UpgradeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { gameState, updateGameState, addCoins } = useGameContext();
  const [selectedCategory, setSelectedCategory] = useState<'pot' | 'powerups' | 'bonuses'>('pot');

  const upgradeItems: UpgradeItem[] = [
    // Pot Upgrades
    {
      id: 'pot_size',
      name: 'Pot Size',
      description: 'Increase the size of your pot to catch more coins',
      currentLevel: Math.floor(gameState.potSize * 5),
      maxLevel: 10,
      basePrice: 100,
      icon: 'resize',
      color: '#4CAF50',
      effect: `Current: +${Math.floor((gameState.potSize - 1) * 100)}% size`
    },
    {
      id: 'pot_speed',
      name: 'Movement Speed',
      description: 'Move your pot faster for better control',
      currentLevel: Math.floor(gameState.potSpeed * 3),
      maxLevel: 8,
      basePrice: 150,
      icon: 'speedometer',
      color: '#2196F3',
      effect: `Current: +${Math.floor((gameState.potSpeed - 1) * 100)}% speed`
    },
    {
      id: 'magnet_power',
      name: 'Magnet Power',
      description: 'Attract coins from further away',
      currentLevel: gameState.potLevel,
      maxLevel: 5,
      basePrice: 200,
      icon: 'magnet',
      color: '#FFD700',
      effect: `Current: Level ${gameState.potLevel} magnet`
    },
    // Power-up Upgrades
    {
      id: 'magnet_duration',
      name: 'Magnet Duration',
      description: 'Magnet power-ups last longer',
      currentLevel: 1,
      maxLevel: 5,
      basePrice: 300,
      icon: 'time',
      color: '#FF6B6B',
      effect: 'Current: 10 seconds'
    },
    {
      id: 'double_points_duration',
      name: 'Double Points Duration',
      description: 'Double points power-ups last longer',
      currentLevel: 1,
      maxLevel: 5,
      basePrice: 400,
      icon: 'flash',
      color: '#FF8E53',
      effect: 'Current: 10 seconds'
    },
    {
      id: 'slow_motion_duration',
      name: 'Slow Motion Duration',
      description: 'Slow motion power-ups last longer',
      currentLevel: 1,
      maxLevel: 5,
      basePrice: 350,
      icon: 'time-outline',
      color: '#4ECDC4',
      effect: 'Current: 10 seconds'
    },
    // Bonus Upgrades
    {
      id: 'coin_multiplier',
      name: 'Coin Multiplier',
      description: 'Earn more coins from each collection',
      currentLevel: 1,
      maxLevel: 5,
      basePrice: 500,
      icon: 'coin',
      color: '#FFD700',
      effect: 'Current: 1x multiplier'
    },
    {
      id: 'bonus_coin_chance',
      name: 'Bonus Coin Chance',
      description: 'Increase chance of bonus coins spawning',
      currentLevel: 1,
      maxLevel: 5,
      basePrice: 600,
      icon: 'star',
      color: '#FF6B6B',
      effect: 'Current: 20% chance'
    }
  ];

  const getFilteredItems = () => {
    return upgradeItems.filter(item => {
      if (selectedCategory === 'pot') {
        return ['pot_size', 'pot_speed', 'magnet_power'].includes(item.id);
      } else if (selectedCategory === 'powerups') {
        return ['magnet_duration', 'double_points_duration', 'slow_motion_duration'].includes(item.id);
      } else if (selectedCategory === 'bonuses') {
        return ['coin_multiplier', 'bonus_coin_chance'].includes(item.id);
      }
      return false;
    });
  };

  const calculateUpgradePrice = (item: UpgradeItem): number => {
    return item.basePrice * Math.pow(1.5, item.currentLevel);
  };

  const handleUpgrade = (item: UpgradeItem) => {
    const price = calculateUpgradePrice(item);
    
    if (gameState.coins < price) {
      Alert.alert('Insufficient Coins', 'You need more coins to purchase this upgrade!');
      return;
    }

    if (item.currentLevel >= item.maxLevel) {
      Alert.alert('Max Level Reached', 'This upgrade is already at maximum level!');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Deduct coins
    updateGameState({ coins: gameState.coins - price });

    // Apply upgrade effects
    switch (item.id) {
      case 'pot_size':
        updateGameState({ potSize: gameState.potSize + 0.2 });
        break;
      case 'pot_speed':
        updateGameState({ potSpeed: gameState.potSpeed + 0.3 });
        break;
      case 'magnet_power':
        updateGameState({ potLevel: gameState.potLevel + 1 });
        break;
      // Add other upgrade effects as needed
    }

    Alert.alert('Upgrade Successful!', `You upgraded ${item.name}!`);
  };

  const renderUpgradeItem = (item: UpgradeItem) => {
    const price = calculateUpgradePrice(item);
    const canAfford = gameState.coins >= price;
    const isMaxLevel = item.currentLevel >= item.maxLevel;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.upgradeItem,
          { opacity: canAfford && !isMaxLevel ? 1 : 0.6 }
        ]}
        onPress={() => canAfford && !isMaxLevel && handleUpgrade(item)}
        disabled={!canAfford || isMaxLevel}
      >
        <LinearGradient
          colors={[item.color, item.color + '80']}
          style={styles.upgradeIcon}
        >
          <Ionicons name={item.icon as any} size={24} color="white" />
        </LinearGradient>
        
        <View style={styles.upgradeInfo}>
          <Text style={styles.upgradeName}>{item.name}</Text>
          <Text style={styles.upgradeDescription}>{item.description}</Text>
          <Text style={styles.upgradeEffect}>{item.effect}</Text>
          
          <View style={styles.upgradeLevel}>
            <Text style={styles.levelText}>
              Level {item.currentLevel}/{item.maxLevel}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(item.currentLevel / item.maxLevel) * 100}%`,
                    backgroundColor: item.color
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        <View style={styles.upgradePrice}>
          <Ionicons name="coin" size={16} color="#FFD700" />
          <Text style={styles.priceText}>{price.toLocaleString()}</Text>
        </View>

        {isMaxLevel && (
          <View style={styles.maxLevelBadge}>
            <Text style={styles.maxLevelText}>MAX</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={['#FFD700', '#FFA500', '#FF8C00']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Upgrades</Text>
        
        <View style={styles.coinsContainer}>
          <Ionicons name="coin" size={20} color="#FFD700" />
          <Text style={styles.coinsText}>{gameState.coins.toLocaleString()}</Text>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        {[
          { key: 'pot', label: 'Pot Upgrades', icon: 'resize' },
          { key: 'powerups', label: 'Power-ups', icon: 'flash' },
          { key: 'bonuses', label: 'Bonuses', icon: 'star' },
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

      {/* Upgrade Items */}
      <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
        {getFilteredItems().map(renderUpgradeItem)}
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
  upgradeItem: {
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
  upgradeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    marginBottom: 4,
  },
  upgradeEffect: {
    fontSize: 12,
    color: '#FFD700',
    marginBottom: 8,
  },
  upgradeLevel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 12,
    color: 'white',
    marginRight: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  upgradePrice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 4,
  },
  maxLevelBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  maxLevelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default UpgradeScreen; 