import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';

interface ResponsiveGameWrapperProps {
  children: React.ReactNode;
}

const ResponsiveGameWrapper: React.FC<ResponsiveGameWrapperProps> = ({ children }) => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // Determine device type and optimal sizing
  const getGameDimensions = () => {
    const { width, height } = dimensions;
    
    // Constants
    const MAX_WIDTH = 900; // Maximum width as requested
    const MIN_WIDTH = 320; // Minimum for small phones
    
    // Mobile phones (width < 768px)
    if (width < 768) {
      return {
        gameWidth: width,
        gameHeight: height,
        scale: 1,
        containerStyle: styles.mobileContainer,
      };
    }
    
    // Tablets (768px <= width < 1024px)
    if (width < 1024) {
      const gameWidth = Math.min(width * 0.95, MAX_WIDTH);
      return {
        gameWidth,
        gameHeight: height * 0.95,
        scale: 1,
        containerStyle: styles.tabletContainer,
      };
    }
    
    // Desktop/Laptop (width >= 1024px) - USE FULL WIDTH
    const gameWidth = Math.min(width * 0.95, MAX_WIDTH);
    const gameHeight = height * 0.92; // Leave small margin for browser UI
    
    return {
      gameWidth,
      gameHeight,
      scale: 1,
      containerStyle: styles.desktopContainer,
    };
  };

  const { gameWidth, gameHeight, containerStyle } = getGameDimensions();

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View 
        style={[
          styles.gameContainer,
          {
            width: gameWidth,
            height: gameHeight,
            // Center the game if narrower than screen
            alignSelf: 'center',
          }
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameContainer: {
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
    // Enable GPU acceleration on web
    ...Platform.select({
      web: {
        transform: [{ translateZ: 0 }] as any,
        willChange: 'transform',
      },
      default: {},
    }),
  },
  mobileContainer: {
    padding: 0,
  },
  tabletContainer: {
    padding: 10,
  },
  desktopContainer: {
    padding: 20,
  },
});

export default ResponsiveGameWrapper;