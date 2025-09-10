import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

interface MineCartEnhancedProps {
  position: Animated.Value;
  collectedCoins: number;
}

const MineCartEnhanced: React.FC<MineCartEnhancedProps> = ({
  position,
  collectedCoins,
}) => {
  // Calculate gold pile height based on collected coins
  const goldPileHeight = Math.min(collectedCoins / 10, 20);
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: position }],
        },
      ]}
    >
      {/* Gold coins on top (visible when collected) */}
      {collectedCoins > 0 && (
        <View style={styles.goldContainer}>
          <View style={[styles.goldPile, { height: goldPileHeight + 10 }]}>
            {/* Multiple coin layers for depth */}
            {[...Array(Math.min(5, Math.floor(collectedCoins / 20)))].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.goldCoin,
                  {
                    bottom: i * 3,
                    left: (i % 2) * 10 - 5,
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.coinGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <FontAwesome5 name="coins" size={12} color="#FFF" />
                </LinearGradient>
              </View>
            ))}
          </View>
          
          {/* Star indicators above cart when doing well */}
          {collectedCoins > 50 && (
            <View style={styles.starContainer}>
              {[...Array(Math.min(5, Math.floor(collectedCoins / 100)))].map((_, i) => (
                <FontAwesome5
                  key={i}
                  name="star"
                  size={12}
                  color="#FFD700"
                  style={[styles.star, { left: i * 12 }]}
                />
              ))}
            </View>
          )}
        </View>
      )}
      
      {/* Main cart body */}
      <View style={styles.cart}>
        <LinearGradient
          colors={['#8B4513', '#654321']}
          style={styles.cartBody}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Cart details */}
          <View style={styles.cartRim} />
          <View style={styles.cartInner}>
            {/* Gold inside cart */}
            {collectedCoins > 0 && (
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={[styles.innerGold, { opacity: Math.min(collectedCoins / 50, 1) }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            )}
          </View>
        </LinearGradient>
        
        {/* Cart front panel */}
        <View style={styles.cartFront}>
          <View style={styles.cartBolt} />
          <View style={[styles.cartBolt, styles.cartBoltRight]} />
        </View>
      </View>
      
      {/* Wheels */}
      <View style={styles.wheelsContainer}>
        <View style={styles.wheel}>
          <View style={styles.wheelInner} />
          <View style={styles.wheelSpoke1} />
          <View style={styles.wheelSpoke2} />
        </View>
        <View style={styles.wheel}>
          <View style={styles.wheelInner} />
          <View style={styles.wheelSpoke1} />
          <View style={styles.wheelSpoke2} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    width: 80,
    height: 70,
    zIndex: 500,
  },
  
  goldContainer: {
    position: 'absolute',
    top: -30,
    left: 10,
    right: 10,
    height: 40,
    zIndex: 10,
  },
  
  goldPile: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  
  goldCoin: {
    position: 'absolute',
    width: 30,
    height: 30,
    left: '50%',
    marginLeft: -15,
  },
  
  coinGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  starContainer: {
    position: 'absolute',
    top: -20,
    left: 10,
    flexDirection: 'row',
  },
  
  star: {
    position: 'absolute',
    top: 0,
  },
  
  cart: {
    width: 80,
    height: 55,
    position: 'relative',
  },
  
  cartBody: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    borderWidth: 3,
    borderColor: '#4A2F18',
  },
  
  cartRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#5C3A1E',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  
  cartInner: {
    position: 'absolute',
    top: 8,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  
  innerGold: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  
  cartFront: {
    position: 'absolute',
    bottom: 5,
    left: 3,
    right: 3,
    height: 15,
    backgroundColor: '#4A2F18',
    borderRadius: 2,
  },
  
  cartBolt: {
    position: 'absolute',
    top: 5,
    left: 8,
    width: 6,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
  },
  
  cartBoltRight: {
    left: undefined,
    right: 8,
  },
  
  wheelsContainer: {
    position: 'absolute',
    bottom: -8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  wheel: {
    width: 24,
    height: 24,
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  wheelInner: {
    width: 8,
    height: 8,
    backgroundColor: '#666',
    borderRadius: 4,
    position: 'absolute',
  },
  
  wheelSpoke1: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: '#444',
  },
  
  wheelSpoke2: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: '#444',
  },
});

export default MineCartEnhanced;