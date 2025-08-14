import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEntitlements } from '../src/features/subscriptions/useEntitlements';
import { useDailyBonus } from '../src/features/subscriptions/useDailyBonus';
import { useUnlockMultiplier } from '../src/features/subscriptions/useUnlockMultiplier';
import { useDrop } from '../src/features/drops/useDrop';
import PaywallModal from '../components/PaywallModal';
import OptimizedArt, { preloadDropAssets } from '../src/components/OptimizedArt';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const SubscriptionVaultScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    isSubscribed: isGoldVaultMember,
    isLoading: entitlementsLoading,
    refresh: refreshEntitlements,
  } = useEntitlements();
  
  const dailyBonus = useDailyBonus();
  const { getMultiplier } = useUnlockMultiplier();
  const multiplier = getMultiplier();
  
  const {
    currentDrop,
    isClaimed,
    isClaimable,
    daysRemaining,
    loading: dropLoading,
    claiming,
    error: dropError,
    claim: claimDrop,
    refresh: refreshDrop,
  } = useDrop();
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showClaimAnimation, setShowClaimAnimation] = useState(false);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Preload drop assets
    if (currentDrop) {
      preloadDropAssets(currentDrop.id).catch(console.warn);
    }
  }, [currentDrop]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshEntitlements(),
      refreshDrop(),
      dailyBonus.refresh(),
    ]);
    setRefreshing(false);
  };

  const handleClaimDailyBonus = async () => {
    if (dailyBonus.canClaim) {
      const success = await dailyBonus.claimBonus();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '🎉 Daily Bonus Claimed!',
          'You received 500 gold coins!',
          [{ text: 'Awesome!' }]
        );
      }
    }
  };

  const handleClaimMonthlyDrop = async () => {
    if (!isClaimable || isClaimed || claiming) return;

    const success = await claimDrop();
    
    if (success) {
      // Show celebration animation
      setShowClaimAnimation(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        '🎁 Monthly Drop Claimed!',
        `You received:\n• ${currentDrop?.cartSkinId}\n• ${currentDrop?.trailId}\n• ${currentDrop?.badgeId}\n• ${currentDrop?.frameId}\n• +${currentDrop?.bonusCoins} coins`,
        [{ text: 'Awesome!' }]
      );
      
      setTimeout(() => {
        setShowClaimAnimation(false);
      }, 3000);
    } else if (dropError) {
      Alert.alert('Claim Failed', dropError, [{ text: 'OK' }]);
    }
  };

  const handleUnlockVault = () => {
    setShowPaywall(true);
  };

  const handlePaywallSuccess = () => {
    setShowPaywall(false);
    refreshEntitlements();
  };

  const renderDropPreview = () => {
    if (!currentDrop) {
      return (
        <View style={styles.dropCard}>
          <Text style={styles.noDropText}>No drop available this month</Text>
        </View>
      );
    }

    return (
      <Animated.View 
        style={[
          styles.dropCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Header */}
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.dropHeader}
        >
          <Text style={styles.dropMonth}>{currentDrop.monthLabel}</Text>
          {daysRemaining > 0 && (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>{daysRemaining} days left</Text>
            </View>
          )}
        </LinearGradient>

        {/* 3D Preview Area */}
        <View style={styles.previewContainer}>
          <OptimizedArt
            skinId={currentDrop.cartSkinId}
            type="cart"
            variant="hero"
            aspectRatio={isTablet ? 1536/2048 : 1080/1920}
            containerStyle={styles.heroPreview}
            priority="high"
            showPlaceholder={true}
          />
          <View style={styles.previewGrid}>
            <View style={styles.previewItem}>
              <OptimizedArt
                skinId={currentDrop.trailId}
                type="trail"
                variant="thumbnail"
                containerStyle={styles.previewThumbnail}
              />
              <Text style={styles.previewItemLabel}>Trail</Text>
            </View>
            <View style={styles.previewItem}>
              <OptimizedArt
                skinId={currentDrop.badgeId}
                type="badge"
                variant="thumbnail"
                containerStyle={styles.previewThumbnail}
              />
              <Text style={styles.previewItemLabel}>Badge</Text>
            </View>
            <View style={styles.previewItem}>
              <OptimizedArt
                skinId={currentDrop.frameId}
                type="frame"
                variant="thumbnail"
                containerStyle={styles.previewThumbnail}
              />
              <Text style={styles.previewItemLabel}>Frame</Text>
            </View>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.itemsList}>
          <Text style={styles.itemsTitle}>This Month's Bundle Includes:</Text>
          <View style={styles.itemRow}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.itemText}>{currentDrop.cartSkinId.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
          <View style={styles.itemRow}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.itemText}>{currentDrop.trailId.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
          <View style={styles.itemRow}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.itemText}>{currentDrop.badgeId.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
          <View style={styles.itemRow}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.itemText}>{currentDrop.frameId.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
          <View style={styles.itemRow}>
            <Ionicons name="gift" size={20} color="#FFD700" />
            <Text style={[styles.itemText, styles.bonusText]}>+{currentDrop.bonusCoins} Bonus Coins</Text>
          </View>
        </View>

        {/* Claim Button */}
        {isGoldVaultMember ? (
          <TouchableOpacity
            style={[
              styles.claimButton,
              isClaimed && styles.claimedButton,
              claiming && styles.claimingButton,
            ]}
            onPress={handleClaimMonthlyDrop}
            disabled={!isClaimable || isClaimed || claiming}
          >
            {claiming ? (
              <ActivityIndicator color="#1a1a1a" />
            ) : isClaimed ? (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#1a1a1a" />
                <Text style={styles.claimButtonText}>Claimed!</Text>
              </>
            ) : (
              <Text style={styles.claimButtonText}>Claim Now</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.unlockButton}
            onPress={handleUnlockVault}
          >
            <Text style={styles.unlockButtonText}>🔒 Subscribe to Unlock</Text>
          </TouchableOpacity>
        )}

        {/* Legal Copy */}
        <Text style={styles.legalText}>
          Available to claim during {currentDrop.monthLabel}. Content is cosmetic.
          {'\n'}Subscription auto-renews; cancel anytime in store settings.
        </Text>
      </Animated.View>
    );
  };

  const renderPerk = (
    icon: string,
    title: string,
    description: string,
    isActive: boolean,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={[styles.perkCard, !isActive && styles.perkLocked]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.perkIcon}>{icon}</Text>
      <View style={styles.perkContent}>
        <Text style={styles.perkTitle}>{title}</Text>
        <Text style={styles.perkDescription}>{description}</Text>
      </View>
      {onPress && (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={isActive ? '#FFD700' : '#666'} 
        />
      )}
    </TouchableOpacity>
  );

  if (entitlementsLoading || dropLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading Gold Vault...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#FFD700"
        />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#2a2a2a', '#1a1a1a']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>⚜️ Gold Vault Club</Text>
          {isGoldVaultMember ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>✨ VIP MEMBER</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={handleUnlockVault}
            >
              <Text style={styles.joinButtonText}>Join Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Monthly Drop Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎁 Monthly Exclusive Drop</Text>
        {renderDropPreview()}
      </View>

      {/* Daily Bonus */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Daily Rewards</Text>
        {renderPerk(
          '🪙',
          '500 Daily Coins',
          dailyBonus.canClaim 
            ? 'Claim now!' 
            : `Next claim in ${dailyBonus.timeUntilNextClaim}`,
          isGoldVaultMember,
          isGoldVaultMember && dailyBonus.canClaim ? handleClaimDailyBonus : undefined
        )}
      </View>

      {/* Other Perks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⭐ Member Benefits</Text>
        {renderPerk(
          '⚡',
          '2x Unlock Speed',
          multiplier > 1 ? 'Active - Progress twice as fast!' : 'Unlock faster progression',
          isGoldVaultMember
        )}
        {renderPerk(
          '🏆',
          'VIP Badge',
          'Stand out on leaderboards',
          isGoldVaultMember
        )}
        {renderPerk(
          '🚫',
          'Ad-Free Experience',
          'No interruptions',
          isGoldVaultMember
        )}
        {renderPerk(
          '🎯',
          'Early Access',
          'Try new features first',
          isGoldVaultMember
        )}
      </View>

      {/* Subscribe CTA */}
      {!isGoldVaultMember && (
        <TouchableOpacity 
          style={styles.subscribeCTA}
          onPress={handleUnlockVault}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.subscribeGradient}
          >
            <Text style={styles.subscribeCTATitle}>Unlock Everything</Text>
            <Text style={styles.subscribeCTAPrice}>$4.99/month</Text>
            <Text style={styles.subscribeCTADescription}>
              Cancel anytime • Instant access
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={handlePaywallSuccess}
      />
    </ScrollView>
  );
};

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
    color: '#FFD700',
    fontSize: isTablet ? 18 : 16,
    marginTop: 10,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statusBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#1a1a1a',
    fontSize: isTablet ? 14 : 12,
    fontWeight: 'bold',
  },
  joinButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#1a1a1a',
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  dropCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  noDropText: {
    color: '#999',
    fontSize: isTablet ? 16 : 14,
    textAlign: 'center',
    padding: 40,
  },
  dropHeader: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropMonth: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  countdownBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  countdownText: {
    color: '#fff',
    fontSize: isTablet ? 14 : 12,
    fontWeight: 'bold',
  },
  previewContainer: {
    padding: 20,
  },
  heroPreview: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  previewThumbnail: {
    width: isTablet ? 80 : 60,
    height: isTablet ? 80 : 60,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  previewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewItem: {
    alignItems: 'center',
    padding: 10,
  },
  previewIcon: {
    fontSize: isTablet ? 30 : 24,
    marginBottom: 5,
  },
  previewItemLabel: {
    color: '#999',
    fontSize: isTablet ? 12 : 10,
  },
  itemsList: {
    padding: 20,
    paddingTop: 0,
  },
  itemsTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  itemText: {
    color: '#ccc',
    fontSize: isTablet ? 14 : 12,
    marginLeft: 10,
  },
  bonusText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  claimButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimedButton: {
    backgroundColor: '#666',
  },
  claimingButton: {
    backgroundColor: '#888',
  },
  claimButtonText: {
    color: '#1a1a1a',
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  unlockButton: {
    backgroundColor: '#FFD700',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  unlockButtonText: {
    color: '#1a1a1a',
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
  },
  legalText: {
    color: '#666',
    fontSize: isTablet ? 12 : 10,
    textAlign: 'center',
    padding: 20,
    paddingTop: 0,
  },
  perkCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  perkLocked: {
    opacity: 0.6,
  },
  perkIcon: {
    fontSize: isTablet ? 30 : 24,
    marginRight: 15,
  },
  perkContent: {
    flex: 1,
  },
  perkTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  perkDescription: {
    fontSize: isTablet ? 14 : 12,
    color: '#999',
  },
  subscribeCTA: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  subscribeGradient: {
    padding: 30,
    alignItems: 'center',
  },
  subscribeCTATitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  subscribeCTAPrice: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  subscribeCTADescription: {
    fontSize: isTablet ? 14 : 12,
    color: '#1a1a1a',
  },
});

export default SubscriptionVaultScreen;