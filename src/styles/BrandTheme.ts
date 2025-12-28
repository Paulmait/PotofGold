import { Platform, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device size detection
const isSmallDevice = screenWidth < 375;
const isMediumDevice = screenWidth >= 375 && screenWidth < 768;
const isLargeDevice = screenWidth >= 768 && screenWidth < 1024;
const isExtraLargeDevice = screenWidth >= 1024;

// Responsive scaling function
const scale = (size: number): number => {
  const baseWidth = 375; // iPhone SE width as base
  const scaleFactor = screenWidth / baseWidth;
  const maxScale = 1.5; // Don't scale too much on large screens
  const minScale = 0.85; // Don't scale too small

  const finalScale = Math.min(maxScale, Math.max(minScale, scaleFactor));
  return Math.round(size * finalScale);
};

export const BrandTheme = {
  // Brand Colors - Consistent across all platforms
  colors: {
    primary: '#FFD700', // Gold
    secondary: '#FFA500', // Orange
    accent: '#4CAF50', // Green for success
    background: '#1a1a2e', // Dark blue background
    surface: '#16213e', // Slightly lighter surface
    error: '#ff4444',
    warning: '#ff9800',
    success: '#4CAF50',
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
      disabled: '#666666',
    },
    gradient: {
      gold: ['#FFD700', '#FFA500'],
      rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'],
      dark: ['#1a1a2e', '#0f1419'],
      success: ['#4CAF50', '#45a049'],
    },
  },

  // Typography - Responsive sizing
  typography: {
    h1: {
      fontSize: scale(32),
      fontWeight: 'bold' as const,
      color: '#FFD700',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 5,
    },
    h2: {
      fontSize: scale(24),
      fontWeight: 'bold' as const,
      color: '#FFFFFF',
    },
    h3: {
      fontSize: scale(20),
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    body: {
      fontSize: scale(16),
      color: '#FFFFFF',
      lineHeight: scale(22),
    },
    caption: {
      fontSize: scale(12),
      color: '#B0B0B0',
    },
    button: {
      fontSize: scale(16),
      fontWeight: 'bold' as const,
      color: '#FFFFFF',
      textTransform: 'uppercase' as const,
    },
    score: {
      fontSize: scale(28),
      fontWeight: 'bold' as const,
      color: '#FFD700',
      fontFamily: Platform.select({
        ios: 'Helvetica Neue',
        android: 'Roboto',
        web: 'system-ui, -apple-system, sans-serif',
      }),
    },
  },

  // Spacing - Responsive
  spacing: {
    xs: scale(4),
    sm: scale(8),
    md: scale(16),
    lg: scale(24),
    xl: scale(32),
    xxl: scale(48),
  },

  // Border Radius - Consistent across platforms
  borderRadius: {
    sm: scale(4),
    md: scale(8),
    lg: scale(16),
    xl: scale(24),
    round: 9999,
  },

  // Shadows - Platform-specific
  shadows: {
    sm: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      },
    }),
    md: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
      },
    }),
    lg: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
      },
    }),
  },

  // Responsive breakpoints
  breakpoints: {
    small: 375,
    medium: 768,
    large: 1024,
    xlarge: 1440,
  },

  // Device-specific configurations
  device: {
    isSmall: isSmallDevice,
    isMedium: isMediumDevice,
    isLarge: isLargeDevice,
    isExtraLarge: isExtraLargeDevice,
    isTablet: screenWidth >= 768,
    isPhone: screenWidth < 768,
    isWeb: Platform.OS === 'web',
    isMobile: Platform.OS !== 'web',
  },

  // Game-specific sizing
  game: {
    // Cart dimensions - responsive
    cart: {
      width: scale(60),
      height: scale(40),
    },
    // Falling item sizes - responsive
    items: {
      small: scale(20),
      medium: scale(30),
      large: scale(40),
    },
    // Game area constraints
    playArea: {
      maxWidth: Math.min(screenWidth, 600),
      maxHeight: Math.min(screenHeight, 900),
      padding: scale(20),
    },
    // HUD sizing
    hud: {
      scoreHeight: scale(60),
      buttonSize: scale(44),
      iconSize: scale(24),
    },
  },

  // Animations - Consistent timing
  animations: {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 1000,
  },

  // Platform-specific adjustments
  platform: {
    statusBarHeight: Platform.select({
      ios: 44,
      android: 24,
      web: 0,
    }),
    navBarHeight: Platform.select({
      ios: 44,
      android: 56,
      web: 60,
    }),
    tabBarHeight: Platform.select({
      ios: 49,
      android: 56,
      web: 56,
    }),
  },
};

// Helper functions for responsive design
export const ResponsiveUtils = {
  // Get responsive font size
  fontSize: (size: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'button' | 'score') => {
    return BrandTheme.typography[size].fontSize;
  },

  // Get responsive spacing
  spacing: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl') => {
    return BrandTheme.spacing[size];
  },

  // Check if device is portrait
  isPortrait: () => {
    const { width, height } = Dimensions.get('window');
    return height > width;
  },

  // Get safe area for game content
  getSafeGameArea: () => {
    const { width, height } = Dimensions.get('window');
    const isWeb = Platform.OS === 'web';

    return {
      width: Math.min(width * (isWeb ? 0.9 : 1), 600),
      height: Math.min(height * (isWeb ? 0.85 : 0.9), 900),
    };
  },

  // Get responsive image size
  getImageSize: (baseSize: number) => {
    return scale(baseSize);
  },

  // Platform-specific styles
  platformStyles: (styles: any) => {
    return Platform.select(styles) || styles.default || {};
  },
};

export default BrandTheme;
