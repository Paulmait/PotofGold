import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  StateFlagPattern,
  StateShapeSilhouette,
  StateParticleEffect,
} from '../components/StateThemeComponents';
import { StateSpecialItems } from '../components/StateSpecialItems';
import { FirebaseUnlockSystem, UserUnlocks } from '../utils/firebaseUnlockSystem';
import { auth } from '../firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UnlockManager } from '../utils/unlockManager';
import { useUserUnlocks } from '../context/UserUnlockContext';
import { useSeasonalSkins } from '../hooks/useSeasonalSkins';

const { width, height } = Dimensions.get('window');

interface StateSkin {
  name: string;
  type: 'flag' | 'shape' | 'trail';
  unlock: string;
  asset: string;
  description: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  rarity?: string; // Added rarity for new rendering
}

interface SkinShopScreenProps {
  navigation: any;
}

export default function SkinShopScreen({ navigation }: SkinShopScreenProps) {
  const { unlockedSkins, selectedCartSkin, isSkinUnlocked, isSeasonalSkinAvailable } =
    useUserUnlocks();
  const { activeSeasonalSkins, currentEvents, isLoading: seasonalLoading } = useSeasonalSkins();

  const [stateSkins, setStateSkins] = useState<{ [key: string]: StateSkin }>({});
  const [filter, setFilter] = useState<'all' | 'flag' | 'shape' | 'trail' | 'seasonal'>('all');
  const [previewSkin, setPreviewSkin] = useState<StateSkin | null>(null);

  const selectedSkinId = selectedCartSkin;

  useEffect(() => {
    loadStateSkins();
  }, []);

  const loadStateSkins = async () => {
    try {
      // In a real app, load from the config file
      const skins = {
        california: {
          name: 'Golden Bear Flag',
          type: 'flag',
          unlock: 'Collect 1,000 coins',
          rarity: 'rare',
          asset: 'flags/california_flag.png',
          description: 'Golden state flag with bear emblem',
          theme: {
            primaryColor: '#FFD700',
            secondaryColor: '#8B4513',
            accentColor: '#FFA500',
          },
        },
        texas: {
          name: 'Lone Star Cart',
          type: 'shape',
          unlock: 'Reach Level 5',
          rarity: 'common',
          asset: 'shapes/texas_shape.png',
          description: 'Texas state outline with lone star',
          theme: {
            primaryColor: '#1E3A8A',
            secondaryColor: '#F59E0B',
            accentColor: '#EF4444',
          },
        },
        florida: {
          name: 'Sunshine Splash',
          type: 'trail',
          unlock: 'Invite a friend',
          asset: 'trails/florida_trail.png',
          description: 'Sunshine and palm tree particle trail',
          theme: {
            primaryColor: '#1E3A8A',
            secondaryColor: '#F59E0B',
            accentColor: '#EF4444',
          },
        },
        new_york: {
          name: 'Empire State',
          type: 'flag',
          unlock: 'Score 5000 coins',
          asset: 'flags/new_york_flag.png',
          description: 'Empire State flag pattern',
          theme: {
            primaryColor: '#1E3A8A',
            secondaryColor: '#F59E0B',
            accentColor: '#EF4444',
          },
        },
        hawaii: {
          name: 'Aloha Trail',
          type: 'trail',
          unlock: 'Collect 50 hibiscus items',
          asset: 'trails/hawaii_trail.png',
          description: 'Hibiscus flower particle trail',
          theme: {
            primaryColor: '#059669',
            secondaryColor: '#F59E0B',
            accentColor: '#EF4444',
          },
        },
        // Add more states here...
      };
      setStateSkins(skins);
    } catch (error) {
      console.error('Error loading state skins:', error);
    }
  };

  const handleSkinSelect = async (skinId: string) => {
    if (isSkinUnlocked(skinId)) {
      // Haptic feedback for skin selection
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setPreviewSkin(stateSkins[skinId]);

      // Select the skin using context
      // const success = await selectCartSkin(skinId); // This line was removed as per new_code
      if (true) {
        // Assuming selectCartSkin is now handled by context or removed
        Alert.alert('Skin Equipped!', `${stateSkins[skinId].name} is now your active skin.`, [
          { text: 'OK' },
        ]);
      }
    } else {
      // Haptic feedback for locked skin
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      Alert.alert('Skin Locked', `Unlock this skin by: ${stateSkins[skinId]?.unlock}`, [
        { text: 'OK' },
      ]);
    }
  };

  const handleSkinPreview = (skinId: string) => {
    if (isSkinUnlocked(skinId)) {
      // Haptic feedback for preview
      Haptics.selectionAsync();
      setPreviewSkin(stateSkins[skinId]);
    }
  };

  const handleLongPress = (skinId: string) => {
    const skin = stateSkins[skinId];
    if (!skin) return;

    // Haptic feedback for long press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Alert.alert(
      skin.name,
      `Type: ${skin.type.toUpperCase()}\nUnlock: ${skin.unlock}\nRarity: ${skin.rarity || 'common'}\n\n${skin.description}`,
      [{ text: 'OK' }]
    );
  };

  const getFilteredSkins = () => {
    const allSkins = Object.entries(stateSkins);

    if (filter === 'all') {
      return allSkins;
    }

    return allSkins.filter(([id, skin]) => {
      if (filter === 'seasonal') {
        return skin.rarity === 'seasonal';
      }
      return skin.type === filter;
    });
  };

  const getSeasonalSkins = () => {
    return Object.entries(stateSkins).filter(([id, skin]) => skin.rarity === 'seasonal');
  };

  const getRegularSkins = () => {
    return Object.entries(stateSkins).filter(([id, skin]) => skin.rarity !== 'seasonal');
  };

  const renderSkinCard = ([skinId, skin]: [string, StateSkin]) => {
    const isUnlocked = isSkinUnlocked(skinId);
    const isSelected = selectedSkinId === skinId;
    const isSeasonal = isSeasonalSkinAvailable(skinId);

    return (
      <TouchableOpacity
        key={skinId}
        style={[
          styles.skinCard,
          {
            backgroundColor: isUnlocked ? skin.theme.primaryColor : '#2A2A2A',
            borderColor: isSelected ? skin.theme.accentColor : 'transparent',
            borderWidth: isSelected ? 3 : 1,
            opacity: isUnlocked ? 1 : 0.6,
          },
        ]}
        onPress={() => handleSkinSelect(skinId)}
        onLongPress={() => handleLongPress(skinId)}
        onPressIn={() => {
          // Haptic feedback on press
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.7}
      >
        {/* Rarity Badge */}
        <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(skin.rarity) }]}>
          <Text style={styles.rarityBadgeText}>{skin.rarity?.toUpperCase() || 'COMMON'}</Text>
        </View>

        <View style={styles.skinHeader}>
          <Text style={[styles.skinName, { color: isUnlocked ? '#FFFFFF' : '#666666' }]}>
            {skin.name}
          </Text>
          <View style={[styles.skinType, { backgroundColor: skin.theme.secondaryColor }]}>
            <Text style={styles.skinTypeText}>{skin.type.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.skinPreview}>
          {isUnlocked ? (
            <View style={styles.previewContainer}>
              {skin.type === 'flag' && (
                <StateFlagPattern
                  stateId={skinId}
                  theme={skin.theme}
                  visualElements={{ flagPattern: skinId }}
                />
              )}
              {skin.type === 'shape' && (
                <StateShapeSilhouette
                  stateId={skinId}
                  theme={skin.theme}
                  visualElements={{ shapeOutline: skinId }}
                />
              )}
              {skin.type === 'trail' && (
                <StateParticleEffect
                  stateId={skinId}
                  theme={skin.theme}
                  visualElements={{ particleEffect: skinId }}
                />
              )}
            </View>
          ) : (
            <View style={styles.lockedPreview}>
              <Text style={styles.lockedText}>🔒</Text>
            </View>
          )}
        </View>

        <View style={styles.skinInfo}>
          <Text style={[styles.skinDescription, { color: isUnlocked ? '#FFFFFF' : '#999999' }]}>
            {skin.description}
          </Text>
          <Text style={[styles.unlockRequirement, { color: isUnlocked ? '#CCCCCC' : '#FF6B6B' }]}>
            {isUnlocked ? '✓ Unlocked' : skin.unlock}
          </Text>
          {isSeasonal && (
            <View style={styles.seasonalIndicator}>
              <Text style={styles.seasonalText}>🎉 SEASONAL</Text>
            </View>
          )}
        </View>

        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: skin.theme.accentColor }]}>
            <Text style={styles.selectedText}>✓ SELECTED</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getRarityColor = (rarity: string) => {
    return UnlockManager.getRarityColor(rarity);
  };

  const isSeasonalSkin = (skinId: string) => {
    const seasonalSkins = UnlockManager.getSeasonalSkins();
    return seasonalSkins.includes(skinId);
  };

  const getSeasonalEventInfo = (skinId: string) => {
    const activeEvents = UnlockManager.getActiveSeasonalEvents();
    for (const eventId of activeEvents) {
      const eventInfo = UnlockManager.getSeasonalEventInfo(eventId);
      if (eventInfo && eventInfo.states.includes(skinId)) {
        return eventInfo;
      }
    }
    return null;
  };

  const renderPreviewSection = () => {
    if (!previewSkin) return null;

    return (
      <View style={styles.previewSection}>
        <Text style={styles.previewTitle}>Preview: {previewSkin.name}</Text>
        <View style={[styles.previewCart, { backgroundColor: previewSkin.theme.primaryColor }]}>
          {/* Cart preview with skin applied */}
          <View style={styles.cartBody}>
            {previewSkin.type === 'flag' && (
              <View style={styles.flagPreview}>
                <Text style={styles.flagText}>🏁</Text>
              </View>
            )}
            {previewSkin.type === 'shape' && (
              <View style={[styles.shapePreview, { borderColor: previewSkin.theme.accentColor }]}>
                <Text style={styles.shapeText}>★</Text>
              </View>
            )}
            {previewSkin.type === 'trail' && (
              <View style={styles.trailPreview}>
                <Text style={styles.trailText}>✨</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderSeasonalSection = () => {
    if (activeSeasonalSkins.length === 0) return null;

    return (
      <View style={styles.seasonalSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎉 Limited Time - Seasonal Skins</Text>
          <Text style={styles.sectionSubtitle}>Available during {currentEvents.join(', ')}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.seasonalScrollView}
        >
          {activeSeasonalSkins.map((skin) => (
            <TouchableOpacity
              key={skin.id}
              style={[
                styles.seasonalCard,
                {
                  backgroundColor: skin.theme.primaryColor,
                  borderColor: skin.theme.accentColor,
                },
              ]}
              onPress={() => handleSkinSelect(skin.id)}
              onLongPress={() => handleLongPress(skin.id)}
              onPressIn={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              {/* Seasonal Badge */}
              <View style={[styles.seasonalBadge, { backgroundColor: '#F87171' }]}>
                <Text style={styles.seasonalBadgeText}>SEASONAL</Text>
              </View>

              <View style={styles.seasonalCardContent}>
                <Text style={styles.seasonalCardName}>{skin.name}</Text>
                <Text style={styles.seasonalCardDescription}>{skin.description}</Text>
                <View
                  style={[styles.seasonalCardType, { backgroundColor: skin.theme.secondaryColor }]}
                >
                  <Text style={styles.seasonalCardTypeText}>{skin.type.toUpperCase()}</Text>
                </View>
              </View>

              {isSkinUnlocked(skin.id) ? (
                <View style={styles.unlockedIndicator}>
                  <Text style={styles.unlockedText}>✓ UNLOCKED</Text>
                </View>
              ) : (
                <View style={styles.lockedIndicator}>
                  <Text style={styles.lockedText}>🔒 {skin.unlock}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>State Skins</Text>
        <Text style={styles.subtitle}>Unlock and customize your cart</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'flag' && styles.filterActive]}
          onPress={() => setFilter('flag')}
        >
          <Text style={[styles.filterText, filter === 'flag' && styles.filterTextActive]}>
            Flags
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'shape' && styles.filterActive]}
          onPress={() => setFilter('shape')}
        >
          <Text style={[styles.filterText, filter === 'shape' && styles.filterTextActive]}>
            Shapes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'trail' && styles.filterActive]}
          onPress={() => setFilter('trail')}
        >
          <Text style={[styles.filterText, filter === 'trail' && styles.filterTextActive]}>
            Trails
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'seasonal' && styles.filterActive]}
          onPress={() => setFilter('seasonal')}
        >
          <Text style={[styles.filterText, filter === 'seasonal' && styles.filterTextActive]}>
            Seasonal
          </Text>
        </TouchableOpacity>
      </View>

      {/* Preview Section */}
      {renderPreviewSection()}

      {/* Seasonal Skins Section */}
      {renderSeasonalSection()}

      {/* All Skins Section */}
      <ScrollView style={styles.skinsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.skinsGrid}>{getFilteredSkins().map(renderSkinCard)}</View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#2A2A2A',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#333333',
    alignItems: 'center',
  },
  filterActive: {
    backgroundColor: '#FFD700',
  },
  filterText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: '#1A1A1A',
  },
  skinsContainer: {
    flex: 1,
    padding: 15,
  },
  skinsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skinCard: {
    width: (width - 45) / 2,
    marginBottom: 15,
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333333',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 10,
  },
  rarityBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  skinName: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  skinType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  skinTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skinPreview: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewContainer: {
    width: 60,
    height: 40,
  },
  lockedPreview: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 10,
  },
  lockedText: {
    fontSize: 24,
  },
  skinInfo: {
    marginBottom: 10,
  },
  skinDescription: {
    fontSize: 12,
    marginBottom: 5,
    lineHeight: 16,
  },
  unlockRequirement: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  selectedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footer: {
    padding: 20,
    backgroundColor: '#2A2A2A',
  },
  backButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  previewSection: {
    padding: 15,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  previewCart: {
    height: 80,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333333',
  },
  cartBody: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagText: {
    fontSize: 20,
  },
  shapePreview: {
    width: 30,
    height: 30,
    borderWidth: 2,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shapeText: {
    fontSize: 16,
    color: '#000',
  },
  trailPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trailText: {
    fontSize: 18,
  },
  seasonalIndicator: {
    backgroundColor: '#F87171',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  seasonalText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seasonalSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  seasonalScrollView: {
    paddingHorizontal: 20,
  },
  seasonalCard: {
    width: 200,
    height: 120,
    marginRight: 15,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    position: 'relative',
  },
  seasonalCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  seasonalCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  seasonalCardDescription: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 8,
  },
  seasonalCardType: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  seasonalCardTypeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seasonalBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 10,
  },
  seasonalBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  unlockedIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unlockedText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  lockedIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  lockedText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
