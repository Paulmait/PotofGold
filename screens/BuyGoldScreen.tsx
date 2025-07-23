import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameContext } from '../context/GameContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  coins: number;
  popular?: boolean;
  bestValue?: boolean;
}

const BuyGoldScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { gameState, addCoins } = useGameContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    initializeRevenueCat();
    loadProducts();
    animateEntrance();
  }, []);

  const initializeRevenueCat = async () => {
    try {
      // Initialize RevenueCat with your API key
      await Purchases.configure({
        apiKey: 'your-revenuecat-api-key', // Replace with your actual API key
        appUserID: gameState.userId || 'anonymous',
      });

      // Get customer info
      const customerInfo = await Purchases.getCustomerInfo();
      setUserInfo(customerInfo);
    } catch (error) {
      console.log('Error initializing RevenueCat:', error);
    }
  };

  const loadProducts = async () => {
    try {
      // Mock products - in real app, these would come from RevenueCat
      const mockProducts: Product[] = [
        {
          id: 'coins_100',
          title: '💰 100 Coins',
          description: 'Perfect for getting started',
          price: '$0.99',
          coins: 100,
        },
        {
          id: 'coins_500',
          title: '💰 500 Coins',
          description: 'Great value for regular players',
          price: '$3.99',
          coins: 500,
          popular: true,
        },
        {
          id: 'coins_1000',
          title: '💰 1,000 Coins',
          description: 'Best value for serious players',
          price: '$6.99',
          coins: 1000,
          bestValue: true,
        },
        {
          id: 'coins_2500',
          title: '💰 2,500 Coins',
          description: 'Ultimate coin package',
          price: '$14.99',
          coins: 2500,
        },
        {
          id: 'remove_ads',
          title: '🚫 Remove Ads',
          description: 'Enjoy ad-free gaming forever',
          price: '$1.99',
          coins: 0,
        },
        {
          id: 'premium_powerups',
          title: '⚡ Premium Power-ups',
          description: 'Unlock all power-ups for 30 days',
          price: '$2.99',
          coins: 0,
        },
      ];

      setProducts(mockProducts);
      setLoading(false);
    } catch (error) {
      console.log('Error loading products:', error);
      setLoading(false);
    }
  };

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePurchase = async (product: Product) => {
    try {
      setPurchasing(product.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Simulate RevenueCat purchase
      // In real app, you would use:
      // const offerings = await Purchases.getOfferings();
      // const package = offerings.current?.availablePackages.find(p => p.identifier === product.id);
      // if (package) {
      //   const { customerInfo } = await Purchases.purchasePackage(package);
      //   handlePurchaseSuccess(product, customerInfo);
      // }

      // Simulate purchase delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful purchase
      await handlePurchaseSuccess(product);

    } catch (error) {
      console.log('Purchase error:', error);
      Alert.alert('Purchase Failed', 'There was an error processing your purchase. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const handlePurchaseSuccess = async (product: Product) => {
    try {
      // Update local coins if it's a coin product
      if (product.coins > 0) {
        addCoins(product.coins);
      }

      // Update Firebase user data
      if (gameState.userId) {
        const userRef = doc(db, 'users', gameState.userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentCoins = userData.coins || 0;
          
          await updateDoc(userRef, {
            coins: currentCoins + product.coins,
            purchases: [...(userData.purchases || []), {
              productId: product.id,
              productName: product.title,
              coins: product.coins,
              price: product.price,
              purchasedAt: new Date(),
            }],
            lastPurchaseAt: new Date(),
          });
        }
      }

      // Show success message
      Alert.alert(
        'Purchase Successful!',
        product.coins > 0 
          ? `You've received ${product.coins} coins!`
          : product.id === 'remove_ads'
          ? 'Ads have been removed from your game!'
          : 'Premium power-ups unlocked for 30 days!',
        [{ text: 'Great!' }]
      );

      // Navigate back to previous screen
      navigation.goBack();

    } catch (error) {
      console.log('Error updating user data:', error);
      Alert.alert('Error', 'Purchase successful but there was an error updating your data. Please contact support.');
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      
      // In real app, you would use:
      // const customerInfo = await Purchases.restorePurchases();
      // handleRestoredPurchases(customerInfo);

      // Simulate restore
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert('Restore Complete', 'Your purchases have been restored successfully!');
    } catch (error) {
      console.log('Restore error:', error);
      Alert.alert('Restore Failed', 'There was an error restoring your purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = (product: Product) => {
    const isPurchasing = purchasing === product.id;

    return (
      <TouchableOpacity
        key={product.id}
        style={[
          styles.productCard,
          product.popular && styles.popularCard,
          product.bestValue && styles.bestValueCard,
        ]}
        onPress={() => handlePurchase(product)}
        disabled={isPurchasing}
        activeOpacity={0.8}
      >
        {product.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>POPULAR</Text>
          </View>
        )}
        
        {product.bestValue && (
          <View style={styles.bestValueBadge}>
            <Text style={styles.bestValueText}>BEST VALUE</Text>
          </View>
        )}

        <View style={styles.productHeader}>
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.productPrice}>{product.price}</Text>
        </View>

        <Text style={styles.productDescription}>{product.description}</Text>

        {product.coins > 0 && (
          <View style={styles.coinDisplay}>
            <Ionicons name="coin" size={20} color="#FFD700" />
            <Text style={styles.coinText}>+{product.coins.toLocaleString()}</Text>
          </View>
        )}

        {isPurchasing ? (
          <View style={styles.purchasingContainer}>
            <ActivityIndicator color="#FFD700" />
            <Text style={styles.purchasingText}>Processing...</Text>
          </View>
        ) : (
          <View style={styles.purchaseButton}>
            <Text style={styles.purchaseButtonText}>Buy Now</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FFD700', '#FFA500', '#FF8C00']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Buy Gold</Text>
        
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Current Balance */}
      <View style={styles.balanceContainer}>
        <Ionicons name="wallet" size={32} color="#FFD700" />
        <Text style={styles.balanceText}>{gameState.coins.toLocaleString()} Coins</Text>
      </View>

      {/* Products */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.productsGrid}>
            {products.map(renderProduct)}
          </View>

          {/* Terms and Privacy */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By making a purchase, you agree to our Terms of Service and Privacy Policy.
              All purchases are final and non-refundable.
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    marginTop: 16,
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
  restoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  balanceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  productsGrid: {
    gap: 16,
  },
  productCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  popularCard: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  bestValueCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'black',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  productDescription: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    marginBottom: 12,
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coinText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 8,
  },
  purchasingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  purchasingText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  termsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: 'white',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default BuyGoldScreen; 