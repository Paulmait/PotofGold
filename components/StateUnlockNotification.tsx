import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface StateUnlockNotificationProps {
  unlock: {
    stateName: string;
    description: string;
    theme: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
    };
  };
  visible: boolean;
  onHide: () => void;
}

export const StateUnlockNotification: React.FC<StateUnlockNotificationProps> = ({
  unlock,
  visible,
  onHide,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Show notification
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Hide after 3 seconds
      const timer = setTimeout(() => {
        hideNotification();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.notification, { backgroundColor: unlock.theme.primaryColor }]}>
        <View style={styles.iconContainer}>
          <Text style={[styles.icon, { color: unlock.theme.accentColor }]}>🏆</Text>
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: unlock.theme.accentColor }]}>
            State Unlocked!
          </Text>
          <Text style={[styles.stateName, { color: unlock.theme.accentColor }]}>
            {unlock.stateName}
          </Text>
          <Text style={[styles.description, { color: unlock.theme.secondaryColor }]}>
            {unlock.description}
          </Text>
        </View>
        <View style={styles.flagPreview}>
          <View style={[styles.flagStrip, { backgroundColor: unlock.theme.secondaryColor }]} />
          <View style={[styles.flagStrip, { backgroundColor: unlock.theme.accentColor }]} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  notification: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  stateName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    opacity: 0.9,
  },
  flagPreview: {
    width: 30,
    height: 20,
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 10,
  },
  flagStrip: {
    height: '50%',
    width: '100%',
  },
}); 