import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device size categories
export const DeviceTypes = {
  SMALL_PHONE: screenWidth < 360,
  PHONE: screenWidth >= 360 && screenWidth < 414,
  LARGE_PHONE: screenWidth >= 414 && screenWidth < 768,
  TABLET: screenWidth >= 768 && screenWidth < 1024,
  LARGE_TABLET: screenWidth >= 1024,
  WEB: Platform.OS === 'web',
} as const;

// Get current device type
export const getDeviceType = () => {
  if (DeviceTypes.SMALL_PHONE) return 'small_phone';
  if (DeviceTypes.PHONE) return 'phone';
  if (DeviceTypes.LARGE_PHONE) return 'large_phone';
  if (DeviceTypes.TABLET) return 'tablet';
  if (DeviceTypes.LARGE_TABLET) return 'large_tablet';
  return 'phone';
};

// Base dimensions (designed for iPhone 11 Pro - 414x896)
const BASE_WIDTH = 414;
const BASE_HEIGHT = 896;

// Scale functions
export const scale = (size: number): number => {
  const ratio = screenWidth / BASE_WIDTH;
  const newSize = size * ratio;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const verticalScale = (size: number): number => {
  const ratio = screenHeight / BASE_HEIGHT;
  const newSize = size * ratio;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// Font scaling with limits
export const fontScale = (size: number): number => {
  const scaled = moderateScale(size, 0.3);
  const minSize = size * 0.8;
  const maxSize = size * 1.2;
  return Math.min(Math.max(scaled, minSize), maxSize);
};

// Responsive dimensions
export const responsiveDimensions = {
  screenWidth,
  screenHeight,
  isSmallDevice: screenWidth < 375,
  isMediumDevice: screenWidth >= 375 && screenWidth < 414,
  isLargeDevice: screenWidth >= 414,
  isTablet: screenWidth >= 768,

  // Safe area considerations
  safeAreaTop: Platform.OS === 'ios' ? (screenHeight >= 812 ? 44 : 20) : 0,
  safeAreaBottom: Platform.OS === 'ios' ? (screenHeight >= 812 ? 34 : 0) : 0,

  // Game specific dimensions
  gameAreaHeight: screenHeight - (Platform.OS === 'ios' ? (screenHeight >= 812 ? 78 : 20) : 0),
  cartSize: {
    width: scale(80),
    height: verticalScale(60),
  },
  itemSize: {
    width: scale(40),
    height: scale(40),
  },
  buttonSize: {
    small: scale(40),
    medium: scale(50),
    large: scale(60),
  },
};

// Responsive game settings based on screen size
export const getGameSettings = () => {
  const baseSettings = {
    cartSpeed: 8,
    itemFallSpeed: 3,
    maxItems: 5,
    spawnRate: 2000,
  };

  if (screenWidth < 360) {
    // Small phones
    return {
      ...baseSettings,
      cartSpeed: 6,
      itemFallSpeed: 2.5,
      maxItems: 4,
      spawnRate: 2500,
      fontSize: {
        small: fontScale(12),
        medium: fontScale(14),
        large: fontScale(18),
        xlarge: fontScale(24),
      },
    };
  } else if (screenWidth < 414) {
    // Regular phones
    return {
      ...baseSettings,
      fontSize: {
        small: fontScale(14),
        medium: fontScale(16),
        large: fontScale(20),
        xlarge: fontScale(28),
      },
    };
  } else if (screenWidth < 768) {
    // Large phones
    return {
      ...baseSettings,
      cartSpeed: 10,
      itemFallSpeed: 3.5,
      maxItems: 6,
      fontSize: {
        small: fontScale(14),
        medium: fontScale(16),
        large: fontScale(22),
        xlarge: fontScale(30),
      },
    };
  } else {
    // Tablets
    return {
      ...baseSettings,
      cartSpeed: 12,
      itemFallSpeed: 4,
      maxItems: 8,
      spawnRate: 1500,
      fontSize: {
        small: fontScale(16),
        medium: fontScale(18),
        large: fontScale(24),
        xlarge: fontScale(32),
      },
    };
  }
};

// Layout helpers
export const getResponsiveLayout = () => {
  const isLandscape = screenWidth > screenHeight;

  return {
    isLandscape,
    isPortrait: !isLandscape,

    // Padding and margins
    padding: {
      small: scale(8),
      medium: scale(16),
      large: scale(24),
      xlarge: scale(32),
    },

    // Border radius
    borderRadius: {
      small: scale(4),
      medium: scale(8),
      large: scale(12),
      xlarge: scale(16),
      round: scale(999),
    },

    // Icon sizes
    iconSize: {
      small: scale(16),
      medium: scale(24),
      large: scale(32),
      xlarge: scale(40),
    },

    // Game UI specific
    headerHeight: verticalScale(60),
    bottomBarHeight: verticalScale(80),
    modalWidth: Math.min(screenWidth * 0.9, 400),
    modalMaxHeight: screenHeight * 0.8,
  };
};

// Orientation change handler
export const handleOrientationChange = (callback: (dimensions: any) => void) => {
  const subscription = Dimensions.addEventListener('change', ({ window }) => {
    callback({
      width: window.width,
      height: window.height,
      isLandscape: window.width > window.height,
    });
  });

  return () => subscription?.remove();
};

// Platform-specific adjustments
export const getPlatformSpecific = () => {
  return {
    shadowStyle: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
      },
      default: {},
    }),

    hitSlop: Platform.select({
      web: undefined,
      default: {
        top: scale(10),
        bottom: scale(10),
        left: scale(10),
        right: scale(10),
      },
    }),
  };
};

// Export all utilities
export default {
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  responsiveDimensions,
  getGameSettings,
  getResponsiveLayout,
  handleOrientationChange,
  getPlatformSpecific,
  getDeviceType,
};
