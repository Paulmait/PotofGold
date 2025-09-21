import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { responsive, gameResponsive, deviceAdjustments } from '../utils/responsiveSystem';

interface ResponsiveGameWrapperProps {
  children: React.ReactNode;
  forcePortrait?: boolean;
}

const ResponsiveGameWrapper: React.FC<ResponsiveGameWrapperProps> = ({ children, forcePortrait = true }) => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  const [isReady, setIsReady] = useState(false);

  // Lock orientation on mobile devices
  useEffect(() => {
    const setupOrientation = async () => {
      if (Platform.OS !== 'web' && forcePortrait) {
        try {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP
          );
        } catch (error) {
          console.error('Failed to lock orientation:', error);
        }
      }
      setIsReady(true);
    };

    setupOrientation();

    return () => {
      if (Platform.OS !== 'web' && forcePortrait) {
        ScreenOrientation.unlockAsync().catch(console.error);
      }
    };
  }, [forcePortrait]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // Determine device type and optimal sizing
  const getGameDimensions = () => {
    const { width, height } = dimensions;
    const isWeb = Platform.OS === 'web';
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    // Use responsive system for consistent sizing
    const cartSize = gameResponsive.cartSize();
    const itemSize = gameResponsive.itemSize();

    // Portrait-optimized dimensions
    const MAX_GAME_WIDTH = 414;  // iPhone 11 Pro Max width
    const MAX_GAME_HEIGHT = 896; // iPhone 11 Pro Max height
    const aspectRatio = 9 / 19.5; // Standard mobile aspect ratio

    if (isWeb) {
      // Web: Simulate mobile viewport
      const webWidth = Math.min(width * 0.4, MAX_GAME_WIDTH);
      const webHeight = webWidth / aspectRatio;
      return {
        gameWidth: webWidth,
        gameHeight: Math.min(webHeight, MAX_GAME_HEIGHT),
        scale: 1,
        containerStyle: styles.webContainer,
      };
    }

    // Mobile and tablet: Use full screen with safe areas
    const safeTop = deviceAdjustments.getSafeAreaTop();
    const safeBottom = deviceAdjustments.getSafeAreaBottom();

    return {
      gameWidth: width,
      gameHeight: height - safeTop - safeBottom,
      scale: 1,
      containerStyle: isMobile ? styles.mobileContainer : styles.tabletContainer,
    };
  };

  const { gameWidth, gameHeight, containerStyle } = getGameDimensions();

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIndicator} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.wrapper, containerStyle]}>
      <View
        style={[
          styles.gameContainer,
          {
            width: gameWidth,
            height: gameHeight,
            maxWidth: 414, // Consistent max width
            alignSelf: 'center',
          }
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFD700',
  },
  gameContainer: {
    backgroundColor: '#87CEEB',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        transform: [{ translateZ: 0 }] as any,
        willChange: 'transform',
        boxShadow: '0 10px 40px rgba(0,0,0,0.8)' as any,
      },
      default: {},
    }),
  },
  mobileContainer: {
    padding: 0,
  },
  tabletContainer: {
    padding: 20,
  },
  desktopContainer: {
    padding: 30,
  },
  webContainer: {
    padding: 20,
  },
});

export default ResponsiveGameWrapper;