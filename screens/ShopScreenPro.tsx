import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// All 50 US State Flags for Cart Skins
const STATE_FLAGS = [
  { id: 'alabama', name: 'Alabama', price: 500, colors: ['#FF0000', '#FFFFFF'], icon: '🌟' },
  { id: 'alaska', name: 'Alaska', price: 500, colors: ['#002868', '#FFD700'], icon: '🐻' },
  { id: 'arizona', name: 'Arizona', price: 500, colors: ['#CE1126', '#FFC72C'], icon: '☀️' },
  {
    id: 'arkansas',
    name: 'Arkansas',
    price: 500,
    colors: ['#FF0000', '#FFFFFF', '#002868'],
    icon: '💎',
  },
  { id: 'california', name: 'California', price: 750, colors: ['#FFFFFF', '#FF0000'], icon: '🐻' },
  {
    id: 'colorado',
    name: 'Colorado',
    price: 500,
    colors: ['#002868', '#FFFFFF', '#FFD700'],
    icon: '⛰️',
  },
  {
    id: 'connecticut',
    name: 'Connecticut',
    price: 500,
    colors: ['#002868', '#FFFFFF'],
    icon: '🌳',
  },
  { id: 'delaware', name: 'Delaware', price: 500, colors: ['#00308F', '#FFD700'], icon: '💠' },
  { id: 'florida', name: 'Florida', price: 750, colors: ['#FF0000', '#FFFFFF'], icon: '☀️' },
  {
    id: 'georgia',
    name: 'Georgia',
    price: 500,
    colors: ['#FF0000', '#FFFFFF', '#002868'],
    icon: '🍑',
  },
  {
    id: 'hawaii',
    name: 'Hawaii',
    price: 750,
    colors: ['#FF0000', '#FFFFFF', '#002868'],
    icon: '🌺',
  },
  { id: 'idaho', name: 'Idaho', price: 500, colors: ['#FF0000', '#FFFFFF', '#002868'], icon: '🥔' },
  { id: 'illinois', name: 'Illinois', price: 500, colors: ['#FFFFFF', '#FF0000'], icon: '🌆' },
  { id: 'indiana', name: 'Indiana', price: 500, colors: ['#002868', '#FFD700'], icon: '🏁' },
  { id: 'iowa', name: 'Iowa', price: 500, colors: ['#FF0000', '#FFFFFF', '#002868'], icon: '🌽' },
  { id: 'kansas', name: 'Kansas', price: 500, colors: ['#002868', '#FFD700'], icon: '🌻' },
  { id: 'kentucky', name: 'Kentucky', price: 500, colors: ['#002868', '#FFFFFF'], icon: '🐎' },
  {
    id: 'louisiana',
    name: 'Louisiana',
    price: 500,
    colors: ['#002868', '#FFD700', '#FFFFFF'],
    icon: '⚜️',
  },
  { id: 'maine', name: 'Maine', price: 500, colors: ['#002868', '#FFFFFF'], icon: '🦞' },
  {
    id: 'maryland',
    name: 'Maryland',
    price: 500,
    colors: ['#FF0000', '#FFD700', '#000000'],
    icon: '🦀',
  },
  {
    id: 'massachusetts',
    name: 'Massachusetts',
    price: 500,
    colors: ['#FFFFFF', '#002868'],
    icon: '📚',
  },
  { id: 'michigan', name: 'Michigan', price: 500, colors: ['#002868', '#FFFFFF'], icon: '🚗' },
  { id: 'minnesota', name: 'Minnesota', price: 500, colors: ['#002868', '#FFFFFF'], icon: '❄️' },
  {
    id: 'mississippi',
    name: 'Mississippi',
    price: 500,
    colors: ['#FF0000', '#FFFFFF', '#002868'],
    icon: '🎺',
  },
  {
    id: 'missouri',
    name: 'Missouri',
    price: 500,
    colors: ['#FF0000', '#FFFFFF', '#002868'],
    icon: '🏛️',
  },
  { id: 'montana', name: 'Montana', price: 500, colors: ['#002868', '#FFD700'], icon: '🏔️' },
  { id: 'nebraska', name: 'Nebraska', price: 500, colors: ['#002868', '#FFD700'], icon: '🌾' },
  { id: 'nevada', name: 'Nevada', price: 750, colors: ['#002868', '#C0C0C0'], icon: '🎰' },
  {
    id: 'newhampshire',
    name: 'New Hampshire',
    price: 500,
    colors: ['#002868', '#FFFFFF'],
    icon: '🏔️',
  },
  { id: 'newjersey', name: 'New Jersey', price: 500, colors: ['#FFC72C', '#002868'], icon: '🌊' },
  { id: 'newmexico', name: 'New Mexico', price: 500, colors: ['#FFD700', '#FF0000'], icon: '☀️' },
  {
    id: 'newyork',
    name: 'New York',
    price: 1000,
    colors: ['#002868', '#FF6600', '#FFFFFF'],
    icon: '🗽',
  },
  {
    id: 'northcarolina',
    name: 'North Carolina',
    price: 500,
    colors: ['#FF0000', '#FFFFFF', '#002868'],
    icon: '✈️',
  },
  {
    id: 'northdakota',
    name: 'North Dakota',
    price: 500,
    colors: ['#002868', '#FFD700'],
    icon: '🌻',
  },
  { id: 'ohio', name: 'Ohio', price: 500, colors: ['#FF0000', '#FFFFFF', '#002868'], icon: '🌰' },
  { id: 'oklahoma', name: 'Oklahoma', price: 500, colors: ['#005CAB', '#FFFFFF'], icon: '🛢️' },
  { id: 'oregon', name: 'Oregon', price: 500, colors: ['#002868', '#FFD700'], icon: '🌲' },
  {
    id: 'pennsylvania',
    name: 'Pennsylvania',
    price: 500,
    colors: ['#002868', '#FFD700'],
    icon: '🔔',
  },
  {
    id: 'rhodeisland',
    name: 'Rhode Island',
    price: 500,
    colors: ['#FFFFFF', '#002868', '#FFD700'],
    icon: '⚓',
  },
  {
    id: 'southcarolina',
    name: 'South Carolina',
    price: 500,
    colors: ['#002868', '#FFFFFF'],
    icon: '🌴',
  },
  {
    id: 'southdakota',
    name: 'South Dakota',
    price: 500,
    colors: ['#002868', '#FFD700'],
    icon: '🗿',
  },
  {
    id: 'tennessee',
    name: 'Tennessee',
    price: 500,
    colors: ['#FF0000', '#FFFFFF', '#002868'],
    icon: '🎸',
  },
  {
    id: 'texas',
    name: 'Texas',
    price: 1000,
    colors: ['#002868', '#FFFFFF', '#FF0000'],
    icon: '⭐',
  },
  { id: 'utah', name: 'Utah', price: 500, colors: ['#002868', '#FFFFFF', '#FF0000'], icon: '🏔️' },
  {
    id: 'vermont',
    name: 'Vermont',
    price: 500,
    colors: ['#002868', '#FFFFFF', '#008000'],
    icon: '🍁',
  },
  { id: 'virginia', name: 'Virginia', price: 500, colors: ['#002868', '#FFFFFF'], icon: '🏛️' },
  { id: 'washington', name: 'Washington', price: 500, colors: ['#00A651', '#FFFFFF'], icon: '🌲' },
  {
    id: 'westvirginia',
    name: 'West Virginia',
    price: 500,
    colors: ['#002868', '#FFFFFF'],
    icon: '⛰️',
  },
  { id: 'wisconsin', name: 'Wisconsin', price: 500, colors: ['#002868', '#FFFFFF'], icon: '🧀' },
  {
    id: 'wyoming',
    name: 'Wyoming',
    price: 500,
    colors: ['#002868', '#FFFFFF', '#FF0000'],
    icon: '🦬',
  },
];

// Coin Packages for Purchase
const COIN_PACKAGES = [
  { id: 'starter', coins: 1000, price: 0.99, bonus: 0, popular: false },
  { id: 'value', coins: 5500, price: 4.99, bonus: 10, popular: true },
  { id: 'mega', coins: 12000, price: 9.99, bonus: 20, popular: false },
  { id: 'ultra', coins: 30000, price: 19.99, bonus: 25, popular: false },
  { id: 'whale', coins: 80000, price: 49.99, bonus: 30, popular: false },
  { id: 'ultimate', coins: 200000, price: 99.99, bonus: 50, popular: false },
];

// Power-ups for Purchase
const POWERUPS = [
  {
    id: 'magnet',
    name: 'Magnet',
    duration: '30 seconds',
    price: 100,
    icon: 'magnet',
    color: '#FFD700',
  },
  {
    id: 'shield',
    name: 'Shield',
    duration: '3 hits',
    price: 150,
    icon: 'shield',
    color: '#00BFFF',
  },
  {
    id: '2x',
    name: '2x Multiplier',
    duration: '60 seconds',
    price: 200,
    icon: 'flash',
    color: '#FF4500',
  },
  {
    id: 'bomb-clear',
    name: 'Bomb Clear',
    duration: 'Instant',
    price: 50,
    icon: 'nuclear',
    color: '#FF0000',
  },
  {
    id: 'continue',
    name: 'Continue Token',
    duration: '1 use',
    price: 500,
    icon: 'heart',
    color: '#FF69B4',
  },
  {
    id: 'mega-boost',
    name: 'Mega Boost',
    duration: '5 minutes',
    price: 1000,
    icon: 'rocket',
    color: '#9C27B0',
  },
];

// Cart Upgrades
const CART_UPGRADES = [
  {
    id: 'size-1',
    name: 'Bigger Cart I',
    description: '+10% collection area',
    price: 2500,
    level: 1,
  },
  {
    id: 'size-2',
    name: 'Bigger Cart II',
    description: '+20% collection area',
    price: 5000,
    level: 2,
  },
  {
    id: 'size-3',
    name: 'Bigger Cart III',
    description: '+30% collection area',
    price: 10000,
    level: 3,
  },
  {
    id: 'speed-1',
    name: 'Speed Boost I',
    description: '+15% movement speed',
    price: 3000,
    level: 1,
  },
  {
    id: 'speed-2',
    name: 'Speed Boost II',
    description: '+30% movement speed',
    price: 6000,
    level: 2,
  },
  { id: 'luck-1', name: 'Lucky Cart', description: '+10% rare item chance', price: 8000, level: 1 },
];

export default function ShopScreenPro({ navigation }: any) {
  const [coins, setCoins] = useState(0);
  const [selectedTab, setSelectedTab] = useState('flags');
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedCoins = await AsyncStorage.getItem('user_coins');
      const savedOwned = await AsyncStorage.getItem('owned_items');

      if (savedCoins) setCoins(parseInt(savedCoins, 10));
      if (savedOwned) setOwnedItems(JSON.parse(savedOwned));
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handlePurchase = async (item: any, type: string) => {
    if (type === 'coins') {
      // Handle real money purchase (IAP)
      Alert.alert(
        'Purchase Coins',
        `Buy ${item.coins.toLocaleString()} coins for $${item.price}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Buy',
            onPress: async () => {
              // Simulate IAP (implement real IAP for production)
              const newCoins = coins + item.coins;
              setCoins(newCoins);
              await AsyncStorage.setItem('user_coins', newCoins.toString());
              Alert.alert('Success!', `You received ${item.coins.toLocaleString()} coins!`);
            },
          },
        ]
      );
    } else {
      // Handle coin purchase
      if (coins >= item.price) {
        const newCoins = coins - item.price;
        setCoins(newCoins);

        const newOwned = [...ownedItems, item.id];
        setOwnedItems(newOwned);

        await AsyncStorage.setItem('user_coins', newCoins.toString());
        await AsyncStorage.setItem('owned_items', JSON.stringify(newOwned));

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success!', `You purchased ${item.name}!`);
        setShowPurchaseModal(false);
      } else {
        Alert.alert('Not Enough Coins', 'You need more coins to purchase this item.');
      }
    }
  };

  const renderStateFlagItem = (flag: any) => {
    const isOwned = ownedItems.includes(flag.id);

    return (
      <TouchableOpacity
        key={flag.id}
        style={[styles.flagItem, isOwned && styles.ownedItem]}
        onPress={() => {
          if (!isOwned) {
            setSelectedItem(flag);
            setShowPurchaseModal(true);
          }
        }}
        disabled={isOwned}
      >
        <LinearGradient colors={flag.colors} style={styles.flagGradient}>
          <Text style={styles.flagIcon}>{flag.icon}</Text>
        </LinearGradient>
        <Text style={styles.flagName}>{flag.name}</Text>
        {isOwned ? (
          <Text style={styles.ownedText}>OWNED</Text>
        ) : (
          <View style={styles.priceContainer}>
            <Ionicons name="logo-bitcoin" size={16} color="#FFD700" />
            <Text style={styles.priceText}>{flag.price}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCoinPackage = (pkg: any) => (
    <TouchableOpacity
      key={pkg.id}
      style={[styles.coinPackage, pkg.popular && styles.popularPackage]}
      onPress={() => handlePurchase(pkg, 'coins')}
    >
      {pkg.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>BEST VALUE</Text>
        </View>
      )}
      <Ionicons name="logo-bitcoin" size={40} color="#FFD700" />
      <Text style={styles.coinAmount}>{pkg.coins.toLocaleString()}</Text>
      {pkg.bonus > 0 && <Text style={styles.bonusText}>+{pkg.bonus}% BONUS</Text>}
      <TouchableOpacity style={styles.buyButton}>
        <Text style={styles.buyButtonText}>${pkg.price}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderPowerup = (powerup: any) => {
    const isOwned = ownedItems.includes(powerup.id);

    return (
      <TouchableOpacity
        key={powerup.id}
        style={[styles.powerupItem, isOwned && styles.ownedItem]}
        onPress={() => {
          if (!isOwned) {
            setSelectedItem(powerup);
            setShowPurchaseModal(true);
          }
        }}
      >
        <Ionicons name={powerup.icon as any} size={30} color={powerup.color} />
        <View style={styles.powerupInfo}>
          <Text style={styles.powerupName}>{powerup.name}</Text>
          <Text style={styles.powerupDuration}>{powerup.duration}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Ionicons name="logo-bitcoin" size={16} color="#FFD700" />
          <Text style={styles.priceText}>{powerup.price}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderUpgrade = (upgrade: any) => {
    const isOwned = ownedItems.includes(upgrade.id);

    return (
      <TouchableOpacity
        key={upgrade.id}
        style={[styles.upgradeItem, isOwned && styles.ownedItem]}
        onPress={() => {
          if (!isOwned) {
            setSelectedItem(upgrade);
            setShowPurchaseModal(true);
          }
        }}
        disabled={isOwned}
      >
        <View style={styles.upgradeIcon}>
          <Text style={styles.upgradeLevel}>Lv.{upgrade.level}</Text>
        </View>
        <View style={styles.upgradeInfo}>
          <Text style={styles.upgradeName}>{upgrade.name}</Text>
          <Text style={styles.upgradeDesc}>{upgrade.description}</Text>
        </View>
        {isOwned ? (
          <Text style={styles.ownedText}>ACTIVE</Text>
        ) : (
          <View style={styles.priceContainer}>
            <Ionicons name="logo-bitcoin" size={16} color="#FFD700" />
            <Text style={styles.priceText}>{upgrade.price}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.title}>Shop</Text>
        <View style={styles.coinDisplay}>
          <Ionicons name="logo-bitcoin" size={20} color="#FFD700" />
          <Text style={styles.coinText}>{coins.toLocaleString()}</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'flags' && styles.activeTab]}
          onPress={() => setSelectedTab('flags')}
        >
          <Text style={[styles.tabText, selectedTab === 'flags' && styles.activeTabText]}>
            State Flags
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'coins' && styles.activeTab]}
          onPress={() => setSelectedTab('coins')}
        >
          <Text style={[styles.tabText, selectedTab === 'coins' && styles.activeTabText]}>
            Coins
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'powerups' && styles.activeTab]}
          onPress={() => setSelectedTab('powerups')}
        >
          <Text style={[styles.tabText, selectedTab === 'powerups' && styles.activeTabText]}>
            Power-ups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'upgrades' && styles.activeTab]}
          onPress={() => setSelectedTab('upgrades')}
        >
          <Text style={[styles.tabText, selectedTab === 'upgrades' && styles.activeTabText]}>
            Upgrades
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'flags' && (
          <View style={styles.flagsGrid}>{STATE_FLAGS.map(renderStateFlagItem)}</View>
        )}

        {selectedTab === 'coins' && (
          <View style={styles.coinsGrid}>{COIN_PACKAGES.map(renderCoinPackage)}</View>
        )}

        {selectedTab === 'powerups' && (
          <View style={styles.powerupsList}>{POWERUPS.map(renderPowerup)}</View>
        )}

        {selectedTab === 'upgrades' && (
          <View style={styles.upgradesList}>{CART_UPGRADES.map(renderUpgrade)}</View>
        )}
      </ScrollView>

      {/* Purchase Modal */}
      <Modal visible={showPurchaseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Purchase</Text>
            <Text style={styles.modalItem}>{selectedItem?.name}</Text>
            <View style={styles.modalPrice}>
              <Ionicons name="logo-bitcoin" size={24} color="#FFD700" />
              <Text style={styles.modalPriceText}>{selectedItem?.price}</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPurchaseModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => handlePurchase(selectedItem, selectedTab)}
              >
                <Text style={styles.confirmButtonText}>Buy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    flex: 1,
    marginLeft: 10,
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  coinText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FFD700',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFD700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  flagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  flagItem: {
    width: (width - 60) / 3,
    marginBottom: 20,
    alignItems: 'center',
  },
  ownedItem: {
    opacity: 0.7,
  },
  flagGradient: {
    width: 80,
    height: 60,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  flagIcon: {
    fontSize: 24,
  },
  flagName: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  ownedText: {
    color: '#00FF00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  coinsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  coinPackage: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    position: 'relative',
  },
  popularPackage: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  coinAmount: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  bonusText: {
    color: '#00FF00',
    fontSize: 12,
    marginBottom: 10,
  },
  buyButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  buyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  powerupsList: {
    paddingBottom: 20,
  },
  powerupItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  powerupInfo: {
    flex: 1,
    marginLeft: 15,
  },
  powerupName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  powerupDuration: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 2,
  },
  upgradesList: {
    paddingBottom: 20,
  },
  upgradeItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  upgradeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeLevel: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  upgradeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  upgradeName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  upgradeDesc: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2C1810',
    borderRadius: 20,
    padding: 30,
    width: width - 60,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalItem: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 20,
  },
  modalPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalPriceText: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
