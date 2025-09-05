import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import { BrandTheme, ResponsiveUtils } from '../src/styles/BrandTheme';

interface ResponsiveGameLayoutProps {
  children: React.ReactNode;
  showHUD?: boolean;
  backgroundColor?: string;
}

const ResponsiveGameLayout: React.FC<ResponsiveGameLayoutProps> = ({
  children,
  showHUD = true,
  backgroundColor = BrandTheme.colors.background,
}) => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  const [orientation, setOrientation] = useState(() => 
    ResponsiveUtils.isPortrait() ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    const updateDimensions = ({ window }: { window: { width: number; height: number } }) => {
      setDimensions({ width: window.width, height: window.height });
      setOrientation(window.height > window.width ? 'portrait' : 'landscape');
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);

    return () => {
      subscription?.remove();
    };
  }, []);

  const getGameAreaStyle = () => {
    const safeArea = ResponsiveUtils.getSafeGameArea();
    const isWeb = Platform.OS === 'web';
    const isTablet = BrandTheme.device.isTablet;

    // Calculate scale to fit screen
    const scale = Math.min(
      dimensions.width / safeArea.width,
      dimensions.height / safeArea.height,
      isWeb ? 1.5 : 1 // Limit scale on web
    );

    return {
      width: safeArea.width,
      height: safeArea.height,
      transform: isWeb && scale !== 1 ? [{ scale }] : [],
      // Center the game area
      alignSelf: 'center' as const,
      justifyContent: 'center' as const,
    };
  };

  const getContainerPadding = () => {
    if (Platform.OS === 'web') {
      // More padding on web for better presentation
      return {
        paddingTop: BrandTheme.spacing.lg,
        paddingHorizontal: BrandTheme.spacing.md,
      };
    }
    
    if (BrandTheme.device.isTablet) {
      // Tablet padding
      return {
        paddingTop: BrandTheme.platform.statusBarHeight,
        paddingHorizontal: BrandTheme.spacing.xl,
      };
    }

    // Phone padding
    return {
      paddingTop: BrandTheme.platform.statusBarHeight,
      paddingHorizontal: 0,
    };
  };

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <Container 
      style={[
        styles.container,
        {
          backgroundColor,
          ...getContainerPadding(),
        },
      ]}
    >
      <View style={[styles.gameArea, getGameAreaStyle()]}>
        {/* Background gradient overlay */}
        <View style={styles.backgroundOverlay} />
        
        {/* Main game content */}
        <View style={styles.contentWrapper}>
          {children}
        </View>

        {/* Platform-specific decorations */}
        {Platform.OS === 'web' && BrandTheme.device.isExtraLarge && (
          <View style={styles.webDecoration}>
            {/* Add decorative elements for large screens */}
            <View style={styles.cornerGlow} />
          </View>
        )}
      </View>

      {/* Orientation indicator for development */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <View style={[styles.debugBadge, { backgroundColor: '#4CAF50' }]}>
            <View style={styles.debugText}>
              {dimensions.width}x{dimensions.height} | {orientation} | {Platform.OS}
            </View>
          </View>
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandTheme.colors.background,
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: Platform.OS === 'web' ? BrandTheme.borderRadius.lg : 0,
    ...BrandTheme.shadows.lg,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
    backgroundColor: BrandTheme.colors.primary,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  webDecoration: {
    position: 'absolute',
    pointerEvents: 'none',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cornerGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: BrandTheme.colors.primary,
    opacity: 0.1,
    transform: [{ scale: 2 }],
  },
  debugInfo: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    opacity: 0.7,
  },
  debugBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  debugText: {
    color: '#fff',
    fontSize: 10,
  },
});

export default ResponsiveGameLayout;