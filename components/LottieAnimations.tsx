import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

interface LottieAnimationProps {
  source: any;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  style?: any;
  onAnimationFinish?: (() => void) | undefined;
}

interface SparkleEffectProps {
  x: number;
  y: number;
  size?: number;
  duration?: number;
  onComplete?: () => void;
}

interface CoinCollectEffectProps {
  x: number;
  y: number;
  value: number;
  onComplete?: () => void;
}

interface PowerUpEffectProps {
  x: number;
  y: number;
  type: 'magnet' | 'slowMotion' | 'doublePoints' | 'goldRush';
  onComplete?: () => void;
}

// Base Lottie Animation Component
export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  source,
  autoPlay = true,
  loop = false,
  speed = 1,
  style,
  onAnimationFinish,
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (autoPlay && animationRef.current) {
      animationRef.current.play();
    }
  }, [autoPlay]);

  return (
    <LottieView
      ref={animationRef}
      source={source}
      autoPlay={autoPlay}
      loop={loop}
      speed={speed}
      style={style}
      onAnimationFinish={onAnimationFinish}
    />
  );
};

// Sparkle Effect for Coin Collection
export const SparkleEffect: React.FC<SparkleEffectProps> = ({
  x,
  y,
  size = 60,
  duration = 1000,
  onComplete,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: duration * 0.3,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: duration * 0.7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete?.();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.sparkleContainer,
        {
          left: x - size / 2,
          top: y - size / 2,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <LottieAnimation
        source={require('../assets/animations/sparkle.json')}
        autoPlay={true}
        loop={false}
        style={{ width: size, height: size }}
      />
    </Animated.View>
  );
};

// Coin Collect Effect
export const CoinCollectEffect: React.FC<CoinCollectEffectProps> = ({
  x,
  y,
  value,
  onComplete,
}) => {
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateYAnim, {
        toValue: -100,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete?.();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.coinCollectContainer,
        {
          left: x,
          top: y,
          transform: [{ translateY: translateYAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <LottieAnimation
        source={require('../assets/animations/coin-collect.json')}
        autoPlay={true}
        loop={false}
        style={{ width: 80, height: 40 }}
      />
    </Animated.View>
  );
};

// Power-Up Effect
export const PowerUpEffect: React.FC<PowerUpEffectProps> = ({
  x,
  y,
  type,
  onComplete,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const getAnimationSource = () => {
    switch (type) {
      case 'magnet':
        return require('../assets/animations/magnet-effect.json');
      case 'slowMotion':
        return require('../assets/animations/slow-motion-effect.json');
      case 'doublePoints':
        return require('../assets/animations/double-points-effect.json');
      case 'goldRush':
        return require('../assets/animations/gold-rush-effect.json');
      default:
        return require('../assets/animations/power-up-effect.json');
    }
  };

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete?.();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.powerUpContainer,
        {
          left: x - 50,
          top: y - 50,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <LottieAnimation
        source={getAnimationSource()}
        autoPlay={true}
        loop={false}
        style={{ width: 100, height: 100 }}
      />
    </Animated.View>
  );
};

// Background Animation
export const BackgroundAnimation: React.FC = () => {
  return (
    <View style={styles.backgroundContainer}>
      <LottieAnimation
        source={require('../assets/animations/background-particles.json')}
        autoPlay={true}
        loop={true}
        speed={0.5}
        style={styles.backgroundAnimation}
      />
    </View>
  );
};

// Loading Animation
export const LoadingAnimation: React.FC<{ size?: number }> = ({ size = 100 }) => {
  return (
    <LottieAnimation
      source={require('../assets/animations/loading.json')}
      autoPlay={true}
      loop={true}
      style={{ width: size, height: size }}
    />
  );
};

// Success Animation
export const SuccessAnimation: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  return (
    <LottieAnimation
      source={require('../assets/animations/success.json')}
      autoPlay={true}
      loop={false}
      style={{ width: 200, height: 200 }}
      onAnimationFinish={onComplete}
    />
  );
};

// Confetti Animation
export const ConfettiAnimation: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  return (
    <LottieAnimation
      source={require('../assets/animations/confetti.json')}
      autoPlay={true}
      loop={false}
      style={styles.confettiAnimation}
      onAnimationFinish={onComplete}
    />
  );
};

// Achievement Unlock Animation
export const AchievementAnimation: React.FC<{ 
  achievement: string; 
  onComplete?: () => void 
}> = ({ achievement, onComplete }) => {
  return (
    <View style={styles.achievementContainer}>
      <LottieAnimation
        source={require('../assets/animations/achievement-unlock.json')}
        autoPlay={true}
        loop={false}
        style={styles.achievementAnimation}
        onAnimationFinish={onComplete}
      />
    </View>
  );
};

// Level Up Animation
export const LevelUpAnimation: React.FC<{ 
  level: number; 
  onComplete?: () => void 
}> = ({ level, onComplete }) => {
  return (
    <View style={styles.levelUpContainer}>
      <LottieAnimation
        source={require('../assets/animations/level-up.json')}
        autoPlay={true}
        loop={false}
        style={styles.levelUpAnimation}
        onAnimationFinish={onComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sparkleContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  coinCollectContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  powerUpContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  backgroundAnimation: {
    width: '100%',
    height: '100%',
  },
  confettiAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
  },
  achievementContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    zIndex: 2000,
  },
  achievementAnimation: {
    width: 200,
    height: 200,
  },
  levelUpContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    zIndex: 2000,
  },
  levelUpAnimation: {
    width: 200,
    height: 200,
  },
});

export default {
  LottieAnimation,
  SparkleEffect,
  CoinCollectEffect,
  PowerUpEffect,
  BackgroundAnimation,
  LoadingAnimation,
  SuccessAnimation,
  ConfettiAnimation,
  AchievementAnimation,
  LevelUpAnimation,
}; 