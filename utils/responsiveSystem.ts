import { Dimensions, Platform } from 'react-native';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

// Base design dimensions (iPhone 11 Pro)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Calculate scale factors
const widthScale = windowWidth / BASE_WIDTH;
const heightScale = windowHeight / BASE_HEIGHT;

// Use minimum scale to maintain aspect ratio
const scale = Math.min(widthScale, heightScale);

// Device detection
const isTablet = Math.min(windowWidth, windowHeight) >= 600;
const isSmallDevice = windowWidth < 375;
const isWeb = Platform.OS === 'web';

// Responsive scaling functions
export const responsive = {
  // Scale a value based on screen size
  scale: (size: number): number => {
    return Math.round(size * scale);
  },

  // Scale width specifically
  widthScale: (size: number): number => {
    return Math.round(size * widthScale);
  },

  // Scale height specifically
  heightScale: (size: number): number => {
    return Math.round(size * heightScale);
  },

  // Font scaling with min/max limits
  fontSize: (size: number, options?: { min?: number; max?: number }): number => {
    const scaled = size * scale;
    const min = options?.min || size * 0.8;
    const max = options?.max || size * 1.2;
    return Math.round(Math.max(min, Math.min(max, scaled)));
  },

  // Responsive padding/margin
  spacing: (size: number): number => {
    if (isTablet) return Math.round(size * 1.2);
    if (isSmallDevice) return Math.round(size * 0.9);
    return Math.round(size * scale);
  },

  // Get percentage of screen width
  widthPercent: (percent: number): number => {
    return Math.round((windowWidth * percent) / 100);
  },

  // Get percentage of screen height
  heightPercent: (percent: number): number => {
    return Math.round((windowHeight * percent) / 100);
  },
};

// Game-specific responsive values
export const gameResponsive = {
  // Cart dimensions
  cartSize: (): number => {
    if (isTablet) return 100;
    if (isSmallDevice) return 60;
    return responsive.scale(80);
  },

  // Item dimensions
  itemSize: (): number => {
    if (isTablet) return 50;
    if (isSmallDevice) return 30;
    return responsive.scale(40);
  },

  // Game area dimensions
  gameAreaHeight: (): number => {
    // Reserve 30% for UI controls
    return responsive.heightPercent(70);
  },

  // UI area dimensions
  uiAreaHeight: (): number => {
    return responsive.heightPercent(30);
  },

  // Button sizes
  buttonSize: (size: 'small' | 'medium' | 'large' = 'medium'): number => {
    const sizes = {
      small: isTablet ? 45 : 35,
      medium: isTablet ? 60 : 45,
      large: isTablet ? 75 : 55,
    };
    return responsive.scale(sizes[size]);
  },

  // Score/stats display
  scoreTextSize: (): number => {
    if (isTablet) return 28;
    if (isSmallDevice) return 18;
    return responsive.fontSize(22);
  },

  // HUD element sizes
  hudIconSize: (): number => {
    if (isTablet) return 35;
    if (isSmallDevice) return 25;
    return responsive.scale(30);
  },

  // Movement sensitivity (for touch controls)
  movementSensitivity: (): number => {
    if (isTablet) return 1.2;
    if (isSmallDevice) return 0.9;
    return 1.0;
  },

  // Fall speed adjustments
  fallSpeedMultiplier: (): number => {
    // Adjust fall speed based on screen height
    if (windowHeight < 700) return 0.85;
    if (windowHeight > 900) return 1.15;
    return 1.0;
  },
};

// Layout configurations for different screen sizes
export const layouts = {
  portrait: {
    // Main game area
    gameContainer: {
      flex: 1,
      backgroundColor: '#87CEEB',
    },

    // Playing field where items fall
    playArea: {
      height: gameResponsive.gameAreaHeight(),
      width: '100%',
      position: 'relative' as const,
    },

    // Bottom UI controls
    controlsArea: {
      height: gameResponsive.uiAreaHeight(),
      width: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: responsive.spacing(10),
    },

    // HUD (score, coins, etc.)
    hud: {
      position: 'absolute' as const,
      top: responsive.spacing(40),
      left: 0,
      right: 0,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: responsive.spacing(20),
      zIndex: 100,
    },

    // Individual HUD items
    hudItem: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingVertical: responsive.spacing(8),
      paddingHorizontal: responsive.spacing(12),
      borderRadius: responsive.scale(20),
      minWidth: responsive.widthPercent(25),
      alignItems: 'center' as const,
    },

    // Text styles
    hudText: {
      color: '#FFFFFF',
      fontSize: gameResponsive.scoreTextSize(),
      fontWeight: 'bold' as const,
    },

    // Cart/pot position
    cartContainer: {
      position: 'absolute' as const,
      bottom: responsive.heightPercent(5),
      width: gameResponsive.cartSize(),
      height: gameResponsive.cartSize(),
    },

    // Falling items
    fallingItem: {
      position: 'absolute' as const,
      width: gameResponsive.itemSize(),
      height: gameResponsive.itemSize(),
    },

    // Control buttons
    controlButton: {
      width: gameResponsive.buttonSize('medium'),
      height: gameResponsive.buttonSize('medium'),
      borderRadius: gameResponsive.buttonSize('medium') / 2,
      backgroundColor: '#FFD700',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },

    // Pause button
    pauseButton: {
      position: 'absolute' as const,
      top: responsive.spacing(40),
      right: responsive.spacing(20),
      width: gameResponsive.buttonSize('small'),
      height: gameResponsive.buttonSize('small'),
      zIndex: 101,
    },
  },
};

// Device-specific adjustments
export const deviceAdjustments = {
  // iOS notch handling
  getSafeAreaTop: (): number => {
    if (Platform.OS === 'ios') {
      // iPhone X and newer
      if (windowHeight >= 812) return 44;
      // Older iPhones
      return 20;
    }
    // Android
    return 0;
  },

  // Bottom safe area (for gesture navigation)
  getSafeAreaBottom: (): number => {
    if (Platform.OS === 'ios' && windowHeight >= 812) {
      return 34;
    }
    return 0;
  },
};

// Export dimensions for use in components
export const dimensions = {
  window: {
    width: windowWidth,
    height: windowHeight,
  },
  screen: Dimensions.get('screen'),
  isTablet,
  isSmallDevice,
  isWeb,
  scale,
  widthScale,
  heightScale,
};

// Update dimensions on change
Dimensions.addEventListener('change', ({ window }) => {
  dimensions.window.width = window.width;
  dimensions.window.height = window.height;
});
