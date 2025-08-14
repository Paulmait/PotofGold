import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { OptimizedArt } from '../src/components/OptimizedArt';
import { metaGameSystem } from '../utils/metaGameSystem';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

interface LockerScreenProps {
  navigation: any;
}

export default function LockerScreen({ navigation }: LockerScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState('carts');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [equippedItems, setEquippedItems] = useState<any>({
    cart: null,
    trail: null,
    badge: null,
    frame: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [collection, setCollection] = useState<any[]>([]);

  useEffect(() => {
    loadLockerData();
  }, []);

  const loadLockerData = async () => {
    setIsLoading(true);
    try {
      // Load user's collection
      const ownedSkins = metaGameSystem.getOwnedSkins();
      const equippedData = metaGameSystem.getEquippedItems();
      
      // Mock collection data with real skins
      const mockCollection = [
        { id: 'cart_aurora_gold_v1', type: 'cart', name: 'Aurora Gold Cart', rarity: 'legendary', equipped: false, unlockDate: '2025-08-01' },
        { id: 'cart_harvest_brass_v1', type: 'cart', name: 'Harvest Brass Cart', rarity: 'epic', equipped: true, unlockDate: '2025-09-01' },
        { id: 'cart_starlight_chrome_v1', type: 'cart', name: 'Starlight Chrome', rarity: 'rare', equipped: false, unlockDate: '2025-12-01' },
        { id: 'trail_sunflare_v1', type: 'trail', name: 'Sunflare Trail', rarity: 'rare', equipped: true, unlockDate: '2025-08-01' },
        { id: 'trail_crystal_snow_v1', type: 'trail', name: 'Crystal Snow', rarity: 'seasonal', equipped: false, unlockDate: '2025-12-01' },
        { id: 'badge_founders_vault_v1', type: 'badge', name: 'Founders Badge', rarity: 'epic', equipped: true, unlockDate: '2025-08-01' },
        { id: 'badge_solstice_star_v1', type: 'badge', name: 'Solstice Star', rarity: 'legendary', equipped: false, unlockDate: '2025-12-01' },
        { id: 'frame_aurum_ribbon_v1', type: 'frame', name: 'Aurum Ribbon', rarity: 'uncommon', equipped: false, unlockDate: '2025-08-01' },
        { id: 'frame_northern_arc_v1', type: 'frame', name: 'Northern Arc', rarity: 'rare', equipped: true, unlockDate: '2025-12-01' },
      ];
      
      setCollection(mockCollection);
      
      // Set equipped items
      const equipped = {
        cart: mockCollection.find(i => i.type === 'cart' && i.equipped)?.id || null,
        trail: mockCollection.find(i => i.type === 'trail' && i.equipped)?.id || null,
        badge: mockCollection.find(i => i.type === 'badge' && i.equipped)?.id || null,
        frame: mockCollection.find(i => i.type === 'frame' && i.equipped)?.id || null,
      };
      setEquippedItems(equipped);
    } catch (error) {
      console.error('Error loading locker data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEquip = async (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Unequip current item of same type
    const updatedCollection = collection.map(i => ({
      ...i,
      equipped: i.type === item.type ? i.id === item.id : i.equipped
    }));
    
    setCollection(updatedCollection);
    setEquippedItems({
      ...equippedItems,
      [item.type]: item.id
    });
    
    Alert.alert(
      'Equipped!',
      `${item.name} is now equipped`,
      [{ text: 'OK' }]
    );
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#ccc';
      case 'uncommon': return '#4CAF50';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FFD700';
      case 'seasonal': return '#FF6B6B';
      default: return '#ccc';
    }
  };

  const getRarityGradient = (rarity: string): [string, string] => {
    switch (rarity) {
      case 'legendary': return ['#FFD700', '#FFA500'];
      case 'epic': return ['#9C27B0', '#E91E63'];
      case 'rare': return ['#2196F3', '#00BCD4'];
      case 'uncommon': return ['#4CAF50', '#8BC34A'];
      case 'seasonal': return ['#FF6B6B', '#FF8E53'];
      default: return ['#757575', '#9E9E9E'];
    }
  };

  const categoryMap: Record<string, string> = {
    'carts': 'cart',
    'trails': 'trail',
    'badges': 'badge',
    'frames': 'frame'
  };

  const currentType = categoryMap[selectedCategory] || 'cart';
  const filteredCollection = collection.filter(item => item.type === currentType);

  const renderLockerItem = (item: any) => {
    const isEquipped = equippedItems[item.type] === item.id;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.lockerItem, isEquipped && styles.equippedItem]}
        onPress={() => setSelectedItem(item)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={getRarityGradient(item.rarity)}
          style={styles.rarityBorder}
        >
          <View style={styles.itemInner}>
            {/* Item Preview */}
            <View style={styles.itemPreview}>
              <OptimizedArt
                skinId={item.id}
                type={item.type}
                variant="thumbnail"
                containerStyle={styles.itemThumbnail}
                showPlaceholder={true}
              />
              {isEquipped && (
                <View style={styles.equippedBadge}>
                  <Text style={styles.equippedText}>EQUIPPED</Text>
                </View>
              )}
            </View>

            {/* Item Info */}
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.itemRarity, { color: getRarityColor(item.rarity) }]}>
              {item.rarity.toUpperCase()}
            </Text>
            
            {/* Unlock Date */}
            <Text style={styles.unlockDate}>
              Unlocked: {new Date(item.unlockDate).toLocaleDateString()}
            </Text>

            {/* Equip Button */}
            {!isEquipped && (
              <TouchableOpacity
                style={styles.equipButton}
                onPress={() => handleEquip(item)}
              >
                <Text style={styles.equipButtonText}>EQUIP</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderPreview = () => {
    if (!selectedItem) return null;

    const isEquipped = equippedItems[selectedItem.type] === selectedItem.id;

    return (
      <View style={styles.previewSection}>
        <LinearGradient
          colors={['#2a2a2a', '#1a1a1a']}
          style={styles.previewContainer}
        >
          <Text style={styles.previewTitle}>PREVIEW</Text>
          
          <OptimizedArt
            skinId={selectedItem.id}
            type={selectedItem.type}
            variant="preview"
            containerStyle={styles.largePreview}
            showPlaceholder={true}
          />

          <Text style={styles.previewName}>{selectedItem.name}</Text>
          <Text style={[styles.previewRarity, { color: getRarityColor(selectedItem.rarity) }]}>
            {selectedItem.rarity.toUpperCase()} {selectedItem.type.toUpperCase()}
          </Text>

          {!isEquipped && (
            <TouchableOpacity
              style={styles.equipLargeButton}
              onPress={() => handleEquip(selectedItem)}
            >
              <Text style={styles.equipLargeButtonText}>EQUIP NOW</Text>
            </TouchableOpacity>
          )}

          {isEquipped && (
            <View style={styles.equippedLargeBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.equippedLargeText}>CURRENTLY EQUIPPED</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.closePreview}
            onPress={() => setSelectedItem(null)}
          >
            <Ionicons name="close-circle" size={30} color="#666" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  const renderLoadout = () => {
    return (
      <View style={styles.loadoutSection}>
        <Text style={styles.loadoutTitle}>CURRENT LOADOUT</Text>
        <View style={styles.loadoutGrid}>
          {Object.entries(equippedItems).map(([type, id]) => (
            <View key={type} style={styles.loadoutItem}>
              <Text style={styles.loadoutType}>{type.toUpperCase()}</Text>
              {id ? (
                <OptimizedArt
                  skinId={id}
                  type={type as any}
                  variant="thumbnail"
                  containerStyle={styles.loadoutThumbnail}
                  showPlaceholder={true}
                />
              ) : (
                <View style={[styles.loadoutThumbnail, styles.emptySlot]}>
                  <Ionicons name="add-circle-outline" size={30} color="#666" />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading your collection...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#2a2a2a', '#1a1a1a']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🏆 MY LOCKER</Text>
        <Text style={styles.headerSubtitle}>
          {collection.length} items collected
        </Text>
      </LinearGradient>

      {/* Current Loadout */}
      {renderLoadout()}

      {/* Category Tabs */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        {['carts', 'trails', 'badges', 'frames'].map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.categoryTabActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category.toUpperCase()}
            </Text>
            <Text style={styles.categoryCount}>
              {collection.filter(i => i.type === categoryMap[category]).length}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Collection Grid */}
      <ScrollView style={styles.collectionContainer}>
        <View style={styles.collectionGrid}>
          {filteredCollection.map(renderLockerItem)}
          
          {filteredCollection.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="lock-closed" size={50} color="#666" />
              <Text style={styles.emptyText}>No {selectedCategory} unlocked yet</Text>
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => navigation.navigate('Shop')}
              >
                <Text style={styles.shopButtonText}>Visit Shop</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Preview Modal */}
      {renderPreview()}

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Shop')}
        >
          <Ionicons name="cart" size={24} color="#fff" />
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  headerSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: '#999',
    marginTop: 5,
  },
  loadoutSection: {
    padding: 15,
    backgroundColor: '#2a2a2a',
    marginVertical: 10,
  },
  loadoutTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  loadoutGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  loadoutItem: {
    alignItems: 'center',
  },
  loadoutType: {
    fontSize: isTablet ? 12 : 10,
    color: '#999',
    marginBottom: 5,
  },
  loadoutThumbnail: {
    width: isTablet ? 70 : 60,
    height: isTablet ? 70 : 60,
    borderRadius: 10,
    overflow: 'hidden',
  },
  emptySlot: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
  },
  categoryScroll: {
    maxHeight: 60,
    backgroundColor: '#2a2a2a',
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  categoryTabActive: {
    borderBottomColor: '#FFD700',
  },
  categoryText: {
    fontSize: isTablet ? 14 : 12,
    color: '#999',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFD700',
  },
  categoryCount: {
    fontSize: isTablet ? 10 : 8,
    color: '#666',
    marginTop: 2,
  },
  collectionContainer: {
    flex: 1,
  },
  collectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  lockerItem: {
    width: isTablet ? '23%' : '48%',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  equippedItem: {
    transform: [{ scale: 0.95 }],
  },
  rarityBorder: {
    padding: 2,
    borderRadius: 12,
  },
  itemInner: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  itemPreview: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
    position: 'relative',
  },
  itemThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  equippedBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  equippedText: {
    color: '#fff',
    fontSize: isTablet ? 10 : 8,
    fontWeight: 'bold',
  },
  itemName: {
    fontSize: isTablet ? 14 : 12,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 2,
  },
  itemRarity: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: '600',
    marginBottom: 5,
  },
  unlockDate: {
    fontSize: isTablet ? 10 : 8,
    color: '#666',
    marginBottom: 8,
  },
  equipButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  equipButtonText: {
    color: '#fff',
    fontSize: isTablet ? 12 : 10,
    fontWeight: 'bold',
  },
  previewSection: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  previewContainer: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  previewTitle: {
    fontSize: isTablet ? 14 : 12,
    color: '#999',
    marginBottom: 10,
  },
  largePreview: {
    width: isTablet ? 200 : 150,
    height: isTablet ? 200 : 150,
    borderRadius: 16,
    marginBottom: 15,
  },
  previewName: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  previewRarity: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    marginBottom: 15,
  },
  equipLargeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  equipLargeButtonText: {
    color: '#fff',
    fontSize: isTablet ? 14 : 12,
    fontWeight: 'bold',
  },
  equippedLargeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  equippedLargeText: {
    color: '#4CAF50',
    fontSize: isTablet ? 14 : 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closePreview: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  emptyState: {
    flex: 1,
    width: '100%',
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: isTablet ? 16 : 14,
    marginTop: 10,
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  shopButtonText: {
    color: '#1a1a1a',
    fontSize: isTablet ? 14 : 12,
    fontWeight: 'bold',
  },
  navigation: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#2a2a2a',
    justifyContent: 'space-around',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  navButtonText: {
    color: '#fff',
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingText: {
    color: '#999',
    fontSize: isTablet ? 16 : 14,
    marginTop: 20,
  },
});