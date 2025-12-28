import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface EncouragementDisplayProps {
  message: {
    text: string;
    emoji: string;
    color: string;
  } | null;
  onComplete?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EncouragementDisplay: React.FC<EncouragementDisplayProps> = ({ message, onComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (message) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      translateYAnim.setValue(50);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Animate out after delay
      const timeout = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: -50,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onComplete) {
            onComplete();
          }
        });
      }, 2500);

      return () => clearTimeout(timeout);
    }
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
            {
              rotate: rotateAnim.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: ['-10deg', '0deg', '10deg'],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={[message.color, `${message.color}CC`, `${message.color}99`]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <Text style={styles.emoji}>{message.emoji}</Text>
          <Text style={styles.text}>{message.text}</Text>
        </View>

        {/* Sparkle decorations */}
        <View style={styles.sparkles}>
          <Text style={styles.sparkle}>✨</Text>
          <Text style={[styles.sparkle, styles.sparkle2]}>✨</Text>
          <Text style={[styles.sparkle, styles.sparkle3]}>✨</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    zIndex: 1001,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  gradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 32,
    marginRight: 10,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sparkles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 16,
    opacity: 0.8,
  },
  sparkle2: {
    top: -10,
    right: -10,
  },
  sparkle3: {
    bottom: -10,
    left: -10,
  },
});

export default EncouragementDisplay;
