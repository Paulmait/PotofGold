import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { revenueCatService, PurchasesPackage } from '../src/lib/revenuecat';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
}

const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userId,
}) => {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [price, setPrice] = useState<string>('$4.99');

  useEffect(() => {
    if (visible) {
      loadOfferings();
    }
  }, [visible]);

  const loadOfferings = async () => {
    setLoading(true);
    try {
      await revenueCatService.initialize(userId);
      const offerings = await revenueCatService.getOfferings();
      
      if (offerings?.current?.availablePackages) {
        // Find monthly package
        const monthly = offerings.current.availablePackages.find(
          pkg => pkg.packageType === 'MONTHLY' || pkg.identifier === 'monthly'
        );
        
        if (monthly) {
          setMonthlyPackage(monthly);
          // Use localized price from RevenueCat
          setPrice(monthly.product.priceString || '$4.99');
        }
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
      Alert.alert('Error', 'Unable to load subscription options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!monthlyPackage) {
      Alert.alert('Error', 'Subscription package not available');
      return;
    }

    setPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const customerInfo = await revenueCatService.purchasePackage(monthlyPackage);
      
      if (customerInfo?.entitlements.active['gold_vault']) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Success!',
          'Welcome to Gold Vault Club! Your exclusive perks are now active.',
          [{ text: 'Awesome!', onPress: onSuccess }]
        );
      }
    } catch (error: any) {
      if (error.userCancelled) {
        // User cancelled, no need to show error
      } else {
        Alert.alert('Purchase Failed', error.message || 'Please try again');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const customerInfo = await revenueCatService.restorePurchases();
      
      if (customerInfo?.entitlements.active['gold_vault']) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Restored!',
          'Your Gold Vault subscription has been restored.',
          [{ text: 'Great!', onPress: onSuccess }]
        );
      } else {
        Alert.alert('No Subscription Found', 'No active subscription to restore.');
      }
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'Please try again');
    } finally {
      setRestoring(false);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://cienrios.com/potofgold/privacy');
  };

  const openTerms = () => {
    Linking.openURL('https://cienrios.com/potofgold/terms');
  };

  const features = [
    { icon: 'gift', text: '500 Daily Gold Coins', highlight: true },
    { icon: 'speedometer', text: '2x Unlock Speed', highlight: true },
    { icon: 'sparkles', text: 'Exclusive Monthly Skins' },
    { icon: 'ribbon', text: 'VIP Leaderboard Badge' },
    { icon: 'rocket', text: 'Early Access to New Features' },
    { icon: 'eye-off', text: 'Ad-Free Experience' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.container}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={purchasing || restoring}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.crownContainer}>
                <Ionicons name="shield-checkmark" size={60} color="#FFD700" />
              </View>
              <Text style={styles.title}>Gold Vault Club</Text>
              <Text style={styles.subtitle}>Unlock Premium Benefits</Text>
            </View>

            {/* Features */}
            <View style={styles.featuresContainer}>
              {features.map((feature, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.featureRow,
                    feature.highlight && styles.featureHighlight
                  ]}
                >
                  <Ionicons 
                    name={feature.icon as any} 
                    size={24} 
                    color={feature.highlight ? '#FFD700' : '#4CAF50'} 
                  />
                  <Text style={[
                    styles.featureText,
                    feature.highlight && styles.featureTextHighlight
                  ]}>
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Only</Text>
              <Text style={styles.price}>{price}</Text>
              <Text style={styles.priceperiod}>per month</Text>
            </View>

            {/* Purchase Button */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.purchaseButton}
                  onPress={handlePurchase}
                  disabled={purchasing || restoring || !monthlyPackage}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.purchaseButtonGradient}
                  >
                    {purchasing ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Text style={styles.purchaseButtonText}>
                          Start Free Trial
                        </Text>
                        <Text style={styles.trialText}>
                          Then {price}/month
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Restore Button */}
                <TouchableOpacity
                  style={styles.restoreButton}
                  onPress={handleRestore}
                  disabled={purchasing || restoring}
                >
                  {restoring ? (
                    <ActivityIndicator size="small" color="#4CAF50" />
                  ) : (
                    <Text style={styles.restoreText}>Restore Purchase</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Legal */}
            <View style={styles.legalContainer}>
              <Text style={styles.legalText}>
                Payment will be charged to your account at confirmation of purchase.
                Subscription automatically renews unless auto-renew is turned off at 
                least 24-hours before the end of the current period. Cancel anytime 
                in your device settings.
              </Text>
              
              <View style={styles.legalLinks}>
                <TouchableOpacity onPress={openTerms}>
                  <Text style={styles.legalLink}>Terms</Text>
                </TouchableOpacity>
                <Text style={styles.legalSeparator}> • </Text>
                <TouchableOpacity onPress={openPrivacyPolicy}>
                  <Text style={styles.legalLink}>Privacy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Trust Badge */}
            <View style={styles.trustBadge}>
              <Ionicons name="lock-closed" size={16} color="#4CAF50" />
              <Text style={styles.trustText}>
                Secure payment via App Store
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  crownContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  featureHighlight: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  featureText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  featureTextHighlight: {
    fontWeight: 'bold',
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  priceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 5,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  priceperiod: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 5,
  },
  loadingContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseButton: {
    marginBottom: 15,
  },
  purchaseButtonGradient: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  trialText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  legalContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  legalText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  legalLink: {
    fontSize: 14,
    color: '#4CAF50',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  trustText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 8,
  },
});

export default PaywallModal;