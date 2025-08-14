import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { metaGameSystem } from '../utils/metaGameSystem';
import { masterGameManager } from '../utils/masterGameManager';
import { OptimizedArt, preloadDropAssets } from '../src/components/OptimizedArt';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { telemetrySystem, trackEvent, EventType } from '../src/systems/TelemetrySystem';
import { hapticEngine, HapticPattern } from '../src/systems/HapticEngine';
import { crashReporting, setCurrentScreen } from '../src/systems/CrashReporting';
import { SHOP_PRICING, formatPrice, getCurrencyEmoji } from '../src/constants/pricing';
import { SCREEN_TITLES, ACTION_NAMES, getRarityInfo, formatItemName } from '../src/constants/naming';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

interface ShopScreenProps {
  navigation: any;
}

export default function ShopScreen({ navigation }: ShopScreenProps) {
  const [shopProgress, setShopProgress] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('carts');
  const [currentCurrency, setCurrentCurrency] = useState({ coins: 0, gems: 0 });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    // Set current screen for crash reporting
    setCurrentScreen('Shop');
    
    // Track screen view
    telemetrySystem.trackScreenView('Shop');
    
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
      // Track purchase initiation
      trackEvent(EventType.PURCHASE_INITIATED, {
        itemId,
        itemType: 'shop_item',
        screen: 'Shop'
      });
      
      const result = await metaGameSystem.purchaseShopItem(itemId);
      if (result.success) {
        // Track successful purchase
        trackEvent(EventType.PURCHASE_COMPLETED, {
          itemId,
          itemName: result.item?.name,
          currency: result.item?.currency || 'coins',
          amount: result.item?.price || 0
        });
        
        // Play success haptic
        hapticEngine.play(HapticPattern.PURCHASE_SUCCESS);
        
        Alert.alert(
          'Purchase Successful!',
          `You bought ${result.item?.name}`,
          [{ text: 'OK', onPress: loadShopData }]
        );
      } else {
        // Track failed purchase
        trackEvent(EventType.PURCHASE_FAILED, {
          itemId,
          reason: 'insufficient_currency'
        });
        
        Alert.alert('Purchase Failed', 'Not enough currency or item unavailable');
      }
    } catch (error) {
      console.log('Error purchasing item:', error);
      crashReporting.handleError(error as Error, 'network_error' as any, {
        action: 'purchase_item',
        itemId
      });
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
    const rarityInfo = getRarityInfo(rarity.toUpperCase() as any);
    return rarityInfo.COLOR;
  };

  const getRarityGradient = (rarity: string): [string, string] => {
    const baseColor = getRarityColor(rarity);
    // Create gradient variations based on base color
    switch (rarity) {
      case 'legendary': return ['#FFD700', '#FFA500'];
      case 'epic': return ['#9C27B0', '#E91E63'];
      case 'rare': return ['#2196F3', '#00BCD4'];
      case 'uncommon': return ['#4CAF50', '#8BC34A'];
      case 'seasonal': return ['#FF6B6B', '#FF8E53'];
      default: return [baseColor, baseColor];
    }
  };

  const handleItemPress = (item: any) => {
    // Track item interaction
    trackEvent(EventType.BUTTON_CLICK, {
      action: 'view_item',
      itemId: item.id,
      itemType: item.type,
      screen: 'Shop'
    });
    
    setSelectedItem(item);
    setPreviewMode(true);
    hapticEngine.play(HapticPattern.BUTTON_TAP);
  };

  const handlePurchase = async (item: any) => {
    setIsLoading(true);
    
    try {
      await purchaseItem(item.id);
      setPreviewMode(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderShopItems = () => {
    const categoryMap: Record<string, string> = {
      'carts': 'cart',
      'trails': 'trail',
      'badges': 'badge',
      'frames': 'frame'
    };

    const currentType = categoryMap[selectedCategory] || 'cart';
    
    // Get shop items from pricing constants
    const categoryPricing = SHOP_PRICING[currentType.toUpperCase() as keyof typeof SHOP_PRICING] || {};
    const shopItems = Object.entries(categoryPricing).map(([itemId, config]) => ({
      id: itemId,
      type: currentType,
      name: formatItemName(itemId),
      price: config.price,
      currency: config.currency,
      rarity: config.rarity,
      owned: false // Would come from user data in production
    }));

    return (
      <View style={styles.shopGrid}>
        {shopItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.shopItem, item.owned && styles.shopItemOwned]}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={getRarityGradient(item.rarity)}
              style={styles.rarityBorder}
            >
              <View style={styles.shopItemInner}>
                {/* Item Preview */}
                <View style={styles.itemPreview}>
                  <OptimizedArt
                    skinId={item.id}
                    type={item.type as any}
                    variant="thumbnail"
                    containerStyle={styles.itemThumbnail}
                    showPlaceholder={true}
                  />
                  {item.owned && (
                    <View style={styles.ownedBadge}>
                      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
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

                {/* Price */}
                {!item.owned && (
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceAmount}>{item.price.toLocaleString()}</Text>
                    <Text style={styles.priceCurrency}>
                      {getCurrencyEmoji(item.currency)}
                    </Text>
                  </View>
                )}
                {item.owned && (
                  <TouchableOpacity style={styles.equipButton}>
                    <Text style={styles.equipButtonText}>{ACTION_NAMES.EQUIP}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPreviewModal = () => {
    if (!selectedItem || !previewMode) return null;

    return (
      <View style={styles.previewModal}>
        <TouchableOpacity 
          style={styles.previewBackdrop}
          onPress={() => setPreviewMode(false)}
          activeOpacity={1}
        >
          <View style={styles.previewContainer}>
            <LinearGradient
              colors={['#2a2a2a', '#1a1a1a']}
              style={styles.previewContent}
            >
              {/* Close button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setPreviewMode(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>

              {/* Large Preview */}
              <OptimizedArt
                skinId={selectedItem.id}
                type={selectedItem.type}
                variant="preview"
                containerStyle={styles.largePreview}
                showPlaceholder={true}
              />

              {/* Item Details */}
              <Text style={styles.previewTitle}>{selectedItem.name}</Text>
              <Text style={[styles.previewRarity, { color: getRarityColor(selectedItem.rarity) }]}>
                {selectedItem.rarity.toUpperCase()} {selectedItem.type.toUpperCase()}
              </Text>

              {/* Stats/Description */}
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>✨ Special effects included</Text>
                <Text style={styles.statsText}>🎯 Exclusive design</Text>
                <Text style={styles.statsText}>🏆 Show off in leaderboards</Text>
              </View>

              {/* Purchase Button */}
              {!selectedItem.owned && (
                <TouchableOpacity
                  style={styles.purchaseButton}
                  onPress={() => handlePurchase(selectedItem)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#1a1a1a" />
                  ) : (
                    <>
                      <Text style={styles.purchaseButtonText}>
                        BUY FOR {selectedItem.price} {selectedItem.currency === 'gems' ? '💎' : '🪙'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {selectedItem.owned && (
                <TouchableOpacity style={styles.equipLargeButton}>
                  <Text style={styles.equipLargeButtonText}>EQUIP NOW</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </View>
    );
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
        <Text style={styles.headerTitle}>🛒 {SCREEN_TITLES.SHOP}</Text>
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
          style={[styles.categoryTab, selectedCategory === 'carts' && styles.categoryTabActive]}
          onPress={() => setSelectedCategory('carts')}
        >
          <Text style={[styles.categoryText, selectedCategory === 'carts' && styles.categoryTextActive]}>
            Carts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryTab, selectedCategory === 'trails' && styles.categoryTabActive]}
          onPress={() => setSelectedCategory('trails')}
        >
          <Text style={[styles.categoryText, selectedCategory === 'trails' && styles.categoryTextActive]}>
            Trails
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryTab, selectedCategory === 'badges' && styles.categoryTabActive]}
          onPress={() => setSelectedCategory('badges')}
        >
          <Text style={[styles.categoryText, selectedCategory === 'badges' && styles.categoryTextActive]}>
            Badges
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryTab, selectedCategory === 'frames' && styles.categoryTabActive]}
          onPress={() => setSelectedCategory('frames')}
        >
          <Text style={[styles.categoryText, selectedCategory === 'frames' && styles.categoryTextActive]}>
            Frames
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
        {renderShopItems()}
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
      
      {/* Preview Modal */}
      {renderPreviewModal()}
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
  // New visual shop styles
  shopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  shopItem: {
    width: isTablet ? '23%' : '48%',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  shopItemOwned: {
    opacity: 0.8,
  },
  rarityBorder: {
    padding: 2,
    borderRadius: 12,
  },
  shopItemInner: {
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
  ownedBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  priceAmount: {
    color: '#FFD700',
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
  },
  priceCurrency: {
    fontSize: isTablet ? 14 : 12,
    marginLeft: 4,
  },
  equipLargeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
  },
  equipLargeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Preview Modal styles
  previewModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    width: isTablet ? '60%' : '90%',
    maxWidth: 500,
    borderRadius: 20,
    overflow: 'hidden',
  },
  previewContent: {
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
    zIndex: 1,
  },
  largePreview: {
    width: isTablet ? 300 : 200,
    height: isTablet ? 300 : 200,
    marginVertical: 20,
    borderRadius: 16,
    elevation: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  previewTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  previewRarity: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    marginBottom: 15,
  },
  statsContainer: {
    width: '100%',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    marginBottom: 20,
  },
  statsText: {
    color: '#ccc',
    fontSize: isTablet ? 14 : 12,
    marginVertical: 3,
  },
  purchaseButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 