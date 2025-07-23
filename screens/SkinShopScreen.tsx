import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Animated,
  FlatList,
} from 'react-native';
import { skinSystem } from '../utils/skinSystem';
import { soundSystem } from '../utils/soundSystem';

const { width, height } = Dimensions.get('window');

interface Skin {
  id: string;
  name: string;
  description: string;
  region: string;
  unlockMethod: 'cost' | 'challenge' | 'achievement' | 'season_pass';
  cost?: number;
  challenge?: string;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  owned: boolean;
  equipped: boolean;
}

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

export default function SkinShopScreen({ navigation }: { navigation: any }) {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [filteredSkins, setFilteredSkins] = useState<Skin[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedUnlockMethod, setSelectedUnlockMethod] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [userCoins, setUserCoins] = useState(0);

  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const regions: FilterOption[] = [
    { id: 'all', label: 'All Regions', value: 'all' },
    { id: 'south', label: 'South', value: 'south' },
    { id: 'northeast', label: 'Northeast', value: 'northeast' },
    { id: 'midwest', label: 'Midwest', value: 'midwest' },
    { id: 'west', label: 'West', value: 'west' },
  ];

  const unlockMethods: FilterOption[] = [
    { id: 'all', label: 'All Methods', value: 'all' },
    { id: 'cost', label: 'Purchase', value: 'cost' },
    { id: 'challenge', label: 'Challenge', value: 'challenge' },
    { id: 'achievement', label: 'Achievement', value: 'achievement' },
    { id: 'season_pass', label: 'Season Pass', value: 'season_pass' },
  ];

  const rarities: FilterOption[] = [
    { id: 'all', label: 'All Rarities', value: 'all' },
    { id: 'common', label: 'Common', value: 'common' },
    { id: 'rare', label: 'Rare', value: 'rare' },
    { id: 'epic', label: 'Epic', value: 'epic' },
    { id: 'legendary', label: 'Legendary', value: 'legendary' },
  ];

  useEffect(() => {
    loadSkins();
    animateIn();
  }, []);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadSkins = async () => {
    try {
      setIsLoading(true);
      
      // Load skins from state_skins.json
      const skinsData = await skinSystem.getAllSkins();
      const userProgress = await skinSystem.getUserProgress();
      
      // Merge with user progress
      const enrichedSkins = skinsData.map((skin: any) => ({
        ...skin,
        owned: userProgress.ownedSkins.includes(skin.id),
        equipped: userProgress.currentSkin === skin.id,
      }));
      
      setSkins(enrichedSkins);
      setFilteredSkins(enrichedSkins);
      
      // Get user coins
      const userData = await skinSystem.getUserData();
      setUserCoins(userData.coins || 0);
      
    } catch (error) {
      console.log('Error loading skins:', error);
      Alert.alert('Error', 'Failed to load skins');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = skins;

    // Filter by region
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(skin => skin.region === selectedRegion);
    }

    // Filter by unlock method
    if (selectedUnlockMethod !== 'all') {
      filtered = filtered.filter(skin => skin.unlockMethod === selectedUnlockMethod);
    }

    // Filter by rarity
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(skin => skin.rarity === selectedRarity);
    }

    setFilteredSkins(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedRegion, selectedUnlockMethod, selectedRarity, skins]);

  const purchaseSkin = async (skin: Skin) => {
    if (userCoins < (skin.cost || 0)) {
      Alert.alert('Insufficient Coins', `You need ${skin.cost} coins to purchase this skin.`);
      return;
    }

    try {
      const result = await skinSystem.purchaseSkin(skin.id);
      if (result.success) {
        // Play purchase sound
        await soundSystem.playSound('upgrade_success');
        
        Alert.alert('Success!', `Purchased ${skin.name}!`);
        
        // Reload skins to update owned status
        await loadSkins();
      } else {
        Alert.alert('Purchase Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to purchase skin');
    }
  };

  const equipSkin = async (skin: Skin) => {
    try {
      const result = await skinSystem.equipSkin(skin.id);
      if (result.success) {
        // Play skin change sound
        await soundSystem.playSound('skin_change');
        
        Alert.alert('Success!', `Equipped ${skin.name}!`);
        
        // Reload skins to update equipped status
        await loadSkins();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to equip skin');
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9E9E9E';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FFD700';
      default: return '#9E9E9E';
    }
  };

  const getUnlockMethodIcon = (method: string) => {
    switch (method) {
      case 'cost': return '💰';
      case 'challenge': return '🏆';
      case 'achievement': return '⭐';
      case 'season_pass': return '🎫';
      default: return '❓';
    }
  };

  const renderSkinCard = ({ item: skin }: { item: Skin }) => (
    <Animated.View
      style={[
        styles.skinCard,
        {
          borderColor: getRarityColor(skin.rarity),
          opacity: skin.owned ? 1 : 0.7,
        },
      ]}
    >
      <View style={styles.skinImageContainer}>
        <Text style={styles.skinImage}>🎨</Text>
        {skin.equipped && (
          <View style={styles.equippedBadge}>
            <Text style={styles.equippedText}>✓</Text>
          </View>
        )}
      </View>
      
      <View style={styles.skinInfo}>
        <Text style={styles.skinName}>{skin.name}</Text>
        <Text style={styles.skinDescription}>{skin.description}</Text>
        
        <View style={styles.skinMeta}>
          <Text style={styles.skinRegion}>{skin.region}</Text>
          <Text style={[styles.skinRarity, { color: getRarityColor(skin.rarity) }]}>
            {skin.rarity.toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.unlockInfo}>
          <Text style={styles.unlockIcon}>{getUnlockMethodIcon(skin.unlockMethod)}</Text>
          <Text style={styles.unlockText}>
            {skin.unlockMethod === 'cost' 
              ? `${skin.cost} coins`
              : skin.challenge || skin.unlockMethod
            }
          </Text>
        </View>
      </View>
      
      <View style={styles.skinActions}>
        {skin.owned ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              skin.equipped && styles.equippedButton,
            ]}
            onPress={() => equipSkin(skin)}
            disabled={skin.equipped}
          >
            <Text style={styles.actionButtonText}>
              {skin.equipped ? 'Equipped' : 'Equip'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.purchaseButton,
              userCoins < (skin.cost || 0) && styles.disabledButton,
            ]}
            onPress={() => purchaseSkin(skin)}
            disabled={userCoins < (skin.cost || 0)}
          >
            <Text style={styles.actionButtonText}>
              {userCoins < (skin.cost || 0) ? 'Need Coins' : `Buy ${skin.cost}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  const renderFilterButton = (option: FilterOption, selected: string, onPress: () => void) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.filterButton,
        selected === option.value && styles.filterButtonActive,
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.filterButtonText,
        selected === option.value && styles.filterButtonTextActive,
      ]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading skins...</Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Skin Shop</Text>
        <View style={styles.coinDisplay}>
          <Text style={styles.coinIcon}>💰</Text>
          <Text style={styles.coinText}>{userCoins}</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text style={styles.filterLabel}>Region:</Text>
          {regions.map(option => 
            renderFilterButton(
              option,
              selectedRegion,
              () => setSelectedRegion(option.value)
            )
          )}
        </ScrollView>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text style={styles.filterLabel}>Method:</Text>
          {unlockMethods.map(option => 
            renderFilterButton(
              option,
              selectedUnlockMethod,
              () => setSelectedUnlockMethod(option.value)
            )
          )}
        </ScrollView>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text style={styles.filterLabel}>Rarity:</Text>
          {rarities.map(option => 
            renderFilterButton(
              option,
              selectedRarity,
              () => setSelectedRarity(option.value)
            )
          )}
        </ScrollView>
      </View>

      {/* Skins Grid */}
      <FlatList
        data={filteredSkins}
        renderItem={renderSkinCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.skinsGrid}
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#FFD700',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    fontSize: 20,
    marginRight: 5,
  },
  coinText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filtersContainer: {
    padding: 15,
    backgroundColor: '#2a2a2a',
  },
  filterLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
    alignSelf: 'center',
  },
  filterButton: {
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#FFD700',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  filterButtonTextActive: {
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  skinsGrid: {
    padding: 10,
  },
  skinCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 15,
    margin: 5,
    flex: 1,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  skinImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  skinImage: {
    fontSize: 40,
  },
  equippedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equippedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  skinInfo: {
    flex: 1,
  },
  skinName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  skinDescription: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 10,
  },
  skinMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  skinRegion: {
    color: '#999',
    fontSize: 10,
  },
  skinRarity: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  unlockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  unlockIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  unlockText: {
    color: '#ccc',
    fontSize: 12,
  },
  skinActions: {
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchaseButton: {
    backgroundColor: '#FF6B6B',
  },
  equippedButton: {
    backgroundColor: '#666',
  },
  disabledButton: {
    backgroundColor: '#444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 