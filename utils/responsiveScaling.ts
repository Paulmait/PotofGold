import React from 'react';
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Device detection
const pixelDensity = PixelRatio.get();
const aspectRatio = screenHeight / screenWidth;
const isTablet = screenWidth >= 768 || (aspectRatio < 1.6 && screenWidth > 500);
const isSmallDevice = screenWidth < 375;
const isLandscape = screenWidth > screenHeight;

export class ResponsiveScaling {
  private static instance: ResponsiveScaling;
  private scaleFactor: number;
  private fontScaleFactor: number;
  private spacingScaleFactor: number;
  private listeners: Set<(dimensions: any) => void> = new Set();

  private constructor() {
    this.scaleFactor = this.calculateScaleFactor();
    this.fontScaleFactor = this.calculateFontScaleFactor();
    this.spacingScaleFactor = this.calculateSpacingScaleFactor();

    // Listen for dimension changes
    Dimensions.addEventListener('change', this.handleDimensionChange);
  }

  static getInstance(): ResponsiveScaling {
    if (!ResponsiveScaling.instance) {
      ResponsiveScaling.instance = new ResponsiveScaling();
    }
    return ResponsiveScaling.instance;
  }

  private calculateScaleFactor(): number {
    const widthScale = screenWidth / BASE_WIDTH;
    const heightScale = screenHeight / BASE_HEIGHT;

    // Use minimum scale to ensure content fits
    let scale = Math.min(widthScale, heightScale);

    // Apply device-specific adjustments
    if (isTablet) {
      scale = Math.min(scale, 1.5); // Cap tablet scaling
    } else if (isSmallDevice) {
      scale = Math.max(scale, 0.85); // Minimum scale for small devices
    }

    // Platform-specific adjustments
    if (Platform.OS === 'web') {
      scale = Math.min(scale, 1.2); // More conservative scaling on web
    }

    return scale;
  }

  private calculateFontScaleFactor(): number {
    let fontScale = this.scaleFactor;

    // Adjust for pixel density
    if (pixelDensity > 3) {
      fontScale *= 0.95; // Slightly smaller on high DPI
    } else if (pixelDensity < 2) {
      fontScale *= 1.05; // Slightly larger on low DPI
    }

    // Device-specific adjustments
    if (isTablet) {
      fontScale *= 1.1; // Larger fonts on tablets
    } else if (isSmallDevice) {
      fontScale *= 0.95; // Smaller fonts on small devices
    }

    // Accessibility: Respect system font scale
    const systemFontScale = PixelRatio.getFontScale();
    if (systemFontScale > 1.2) {
      fontScale *= systemFontScale / 1.2; // Apply user preference
    }

    return Math.max(0.8, Math.min(1.5, fontScale));
  }

  private calculateSpacingScaleFactor(): number {
    let spacingScale = this.scaleFactor;

    // More aggressive scaling for spacing
    if (isTablet) {
      spacingScale *= 1.3;
    } else if (isSmallDevice) {
      spacingScale *= 0.8;
    }

    if (isLandscape) {
      spacingScale *= 0.9; // Reduce spacing in landscape
    }

    return spacingScale;
  }

  private handleDimensionChange = ({ window }: any) => {
    const { width, height } = window;

    // Recalculate scale factors
    this.scaleFactor = this.calculateScaleFactor();
    this.fontScaleFactor = this.calculateFontScaleFactor();
    this.spacingScaleFactor = this.calculateSpacingScaleFactor();

    // Notify listeners
    this.listeners.forEach((listener) => {
      listener({ width, height, scale: this.scaleFactor });
    });
  };

  // Public methods

  /**
   * Scale a dimension value
   */
  scale(value: number): number {
    return Math.round(value * this.scaleFactor);
  }

  /**
   * Scale horizontal dimension
   */
  scaleWidth(value: number): number {
    const widthScale = screenWidth / BASE_WIDTH;
    return Math.round(value * widthScale);
  }

  /**
   * Scale vertical dimension
   */
  scaleHeight(value: number): number {
    const heightScale = screenHeight / BASE_HEIGHT;
    return Math.round(value * heightScale);
  }

  /**
   * Scale font size
   */
  scaleFont(size: number): number {
    return Math.round(size * this.fontScaleFactor);
  }

  /**
   * Scale spacing (padding, margin)
   */
  scaleSpacing(value: number): number {
    return Math.round(value * this.spacingScaleFactor);
  }

  /**
   * Get responsive value based on device type
   */
  select<T>(options: { phone?: T; tablet?: T; small?: T; default: T }): T {
    if (isTablet && options.tablet !== undefined) {
      return options.tablet;
    }
    if (isSmallDevice && options.small !== undefined) {
      return options.small;
    }
    if (!isTablet && options.phone !== undefined) {
      return options.phone;
    }
    return options.default;
  }

  /**
   * Get adaptive game dimensions
   */
  getGameDimensions() {
    const safeAreaInsets = this.getSafeAreaInsets();

    return {
      width: screenWidth,
      height: screenHeight,
      gameAreaWidth: screenWidth - safeAreaInsets.left - safeAreaInsets.right,
      gameAreaHeight: screenHeight - safeAreaInsets.top - safeAreaInsets.bottom - this.scale(100), // Reserve space for UI
      cartSize: this.select({
        tablet: 100,
        phone: 80,
        small: 60,
        default: 80,
      }),
      itemSize: this.select({
        tablet: 40,
        phone: 30,
        small: 25,
        default: 30,
      }),
      uiButtonSize: this.select({
        tablet: 60,
        phone: 50,
        small: 40,
        default: 50,
      }),
    };
  }

  /**
   * Get safe area insets
   */
  private getSafeAreaInsets() {
    // Platform-specific safe areas
    if (Platform.OS === 'ios') {
      const hasNotch = screenHeight >= 812; // iPhone X and newer
      return {
        top: hasNotch ? 44 : 20,
        bottom: hasNotch ? 34 : 0,
        left: 0,
        right: 0,
      };
    } else if (Platform.OS === 'android') {
      return {
        top: 24, // Status bar
        bottom: 0,
        left: 0,
        right: 0,
      };
    } else {
      // Web
      return {
        top: 0,
        bottom: 0,
        left: Math.max(0, (screenWidth - 600) / 2), // Center content on wide screens
        right: Math.max(0, (screenWidth - 600) / 2),
      };
    }
  }

  /**
   * Subscribe to dimension changes
   */
  addListener(listener: (dimensions: any) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      screenWidth,
      screenHeight,
      baseWidth: BASE_WIDTH,
      baseHeight: BASE_HEIGHT,
      scaleFactor: this.scaleFactor,
      fontScaleFactor: this.fontScaleFactor,
      spacingScaleFactor: this.spacingScaleFactor,
      pixelDensity,
      aspectRatio,
      isTablet,
      isSmallDevice,
      isLandscape,
      platform: Platform.OS,
    };
  }
}

// Singleton instance
const responsive = ResponsiveScaling.getInstance();

// Export convenience functions
export const scale = (value: number) => responsive.scale(value);
export const scaleWidth = (value: number) => responsive.scaleWidth(value);
export const scaleHeight = (value: number) => responsive.scaleHeight(value);
export const scaleFont = (value: number) => responsive.scaleFont(value);
export const scaleSpacing = (value: number) => responsive.scaleSpacing(value);
export const select = <T>(options: Parameters<typeof responsive.select>[0]) =>
  responsive.select(options);
export const getGameDimensions = () => responsive.getGameDimensions();
export const getMetrics = () => responsive.getMetrics();

// Hook for React components
export function useResponsive() {
  const [dimensions, setDimensions] = React.useState(getGameDimensions());

  React.useEffect(() => {
    const unsubscribe = responsive.addListener((newDimensions) => {
      setDimensions(getGameDimensions());
    });

    return unsubscribe;
  }, []);

  return {
    dimensions,
    scale,
    scaleWidth,
    scaleHeight,
    scaleFont,
    scaleSpacing,
    select,
    metrics: getMetrics(),
  };
}
