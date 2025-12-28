import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CoinProps {
  value: number;
  isBonus?: boolean;
}

const Coin: React.FC<CoinProps> = ({ value, isBonus = false }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous spinning animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Pulsing glow for bonus coins
    if (isBonus) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isBonus]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const getCoinColor = () => {
    if (isBonus) return '#FFD700'; // Gold for bonus
    if (value >= 50) return '#FF6B35'; // Orange for high value
    if (value >= 10) return '#FFD700'; // Gold for medium value
    return '#C0C0C0'; // Silver for regular coins
  };

  const getCoinSize = () => {
    if (isBonus) return 35;
    if (value >= 50) return 32;
    if (value >= 10) return 28;
    return 24;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ rotate: spin }, { scale: scaleAnim }],
          opacity: isBonus ? glowOpacity : 1,
        },
      ]}
    >
      <View
        style={[
          styles.coin,
          {
            backgroundColor: getCoinColor(),
            width: getCoinSize(),
            height: getCoinSize(),
            borderRadius: getCoinSize() / 2,
          },
        ]}
      >
        <Ionicons
          name="logo-bitcoin"
          size={getCoinSize() * 0.6}
          color={isBonus ? '#FFA500' : '#FFF'}
        />
      </View>
      {isBonus && (
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowAnim,
              width: getCoinSize() + 10,
              height: getCoinSize() + 10,
              borderRadius: (getCoinSize() + 10) / 2,
            },
          ]}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coin: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  glow: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    opacity: 0.3,
  },
});

export default Coin;
