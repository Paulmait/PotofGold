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
    
    // CONTAINED VIEWPORT for better gameplay (based on working reference)
    const MAX_GAME_WIDTH = 450;  // Optimal width for gameplay
    const MAX_GAME_HEIGHT = 700; // Optimal height for gameplay
    const MIN_WIDTH = 320; // Minimum for small phones
    
    // Mobile phones (width < 768px)
    if (width < 768) {
      // Use full screen on mobile, but respect max dimensions
      return {
        gameWidth: Math.min(width, MAX_GAME_WIDTH),
        gameHeight: Math.min(height, MAX_GAME_HEIGHT),
        scale: 1,
        containerStyle: styles.mobileContainer,
      };
    }
    
    // Tablets (768px <= width < 1024px)
    if (width < 1024) {
      // Contained viewport centered on screen
      return {
        gameWidth: MAX_GAME_WIDTH,
        gameHeight: Math.min(height * 0.9, MAX_GAME_HEIGHT),
        scale: 1,
        containerStyle: styles.tabletContainer,
      };
    }
    
    // Desktop/Laptop (width >= 1024px) - CONTAINED VIEWPORT
    // Use optimal fixed size for best gameplay experience
    return {
      gameWidth: MAX_GAME_WIDTH,
      gameHeight: MAX_GAME_HEIGHT,
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
    backgroundColor: '#0a0a0a', // Dark background for contrast
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameContainer: {
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 20, // Rounded corners for contained viewport
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    // Enable GPU acceleration on web
    ...Platform.select({
      web: {
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
});

export default ResponsiveGameWrapper;