import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface VIPBadgeProps {
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  showText?: boolean;
  style?: ViewStyle;
}

const VIPBadge: React.FC<VIPBadgeProps> = ({
  size = 'small',
  animated = true,
  showText = false,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Subtle rotation animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated]);

  const getSize = () => {
    switch (size) {
      case 'large':
        return { width: 48, height: 48, iconSize: 24 };
      case 'medium':
        return { width: 32, height: 32, iconSize: 18 };
      case 'small':
      default:
        return { width: 24, height: 24, iconSize: 14 };
    }
  };

  const dimensions = getSize();
  
  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        animated && {
          transform: [
            { scale: pulseAnim },
            { rotate: rotation },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FFD700']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            width: dimensions.width,
            height: dimensions.height,
          },
        ]}
      >
        <Ionicons
          name="shield-checkmark"
          size={dimensions.iconSize}
          color="white"
        />
      </LinearGradient>
      
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.text, size === 'small' && styles.textSmall]}>
            VIP
          </Text>
        </View>
      )}
      
      {/* Glow effect */}
      {animated && (
        <Animated.View
          style={[
            styles.glow,
            {
              width: dimensions.width * 1.5,
              height: dimensions.height * 1.5,
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.1],
                outputRange: [0.3, 0.1],
              }),
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
  badge: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  textContainer: {
    position: 'absolute',
    bottom: -12,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  textSmall: {
    fontSize: 8,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFD700',
    zIndex: -1,
  },
});

export default VIPBadge;

// Hook to conditionally render VIP badge
export const useVIPBadge = (isSubscriber: boolean) => {
  if (!isSubscriber) return null;
  
  return <VIPBadge />;
};