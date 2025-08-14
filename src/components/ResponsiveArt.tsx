import React, { useMemo } from 'react';
import {
  View,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Dimensions,
  ViewStyle,
  ImageStyle,
  Platform,
  PixelRatio,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const pixelDensity = PixelRatio.get();

interface ResponsiveArtProps {
  // Asset paths (without @2x/@3x suffix - RN handles that)
  phoneAsset?: string | ImageSourcePropType;
  tabletAsset?: string | ImageSourcePropType;
  fallbackAsset: string | ImageSourcePropType;
  
  // Display options
  aspectRatio?: number;
  fit?: 'contain' | 'cover' | 'stretch' | 'center';
  backgroundColor?: string;
  
  // Styles
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  
  // Loading states
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: React.ReactNode;
  
  // Performance
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  priority?: 'low' | 'normal' | 'high';
}

/**
 * ResponsiveArt - Automatically selects and displays the right artwork for the device
 * 
 * Features:
 * - Automatic phone/tablet detection
 * - React Native's @1x/@2x/@3x resolution handling
 * - Aspect ratio preservation
 * - Loading states
 * - Performance optimization
 */
export const ResponsiveArt: React.FC<ResponsiveArtProps> = ({
  phoneAsset,
  tabletAsset,
  fallbackAsset,
  aspectRatio = 16/9,
  fit = 'contain',
  backgroundColor = 'transparent',
  containerStyle,
  imageStyle,
  onLoad,
  onError,
  placeholder,
  resizeMode,
  priority = 'normal',
}) => {
  // Select the appropriate asset based on device type
  const selectedAsset = useMemo(() => {
    if (isTablet && tabletAsset) {
      return tabletAsset;
    } else if (!isTablet && phoneAsset) {
      return phoneAsset;
    }
    return fallbackAsset;
  }, [phoneAsset, tabletAsset, fallbackAsset]);

  // Convert string path to require if needed
  const imageSource = useMemo(() => {
    if (typeof selectedAsset === 'string') {
      // For dynamic paths, we need to handle them differently
      // In production, these would be bundled assets
      try {
        // Check if it's a local asset path
        if (selectedAsset.startsWith('assets/')) {
          return { uri: selectedAsset };
        }
        // Check if it's a require path
        return { uri: selectedAsset };
      } catch {
        return { uri: selectedAsset };
      }
    }
    return selectedAsset as ImageSourcePropType;
  }, [selectedAsset]);

  // Calculate optimal dimensions
  const dimensions = useMemo(() => {
    const containerWidth = isTablet ? Math.min(screenWidth * 0.8, 600) : screenWidth - 40;
    const containerHeight = containerWidth / aspectRatio;
    
    return {
      width: containerWidth,
      height: containerHeight,
    };
  }, [aspectRatio]);

  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  return (
    <View 
      style={[
        styles.container,
        { 
          backgroundColor,
          ...dimensions,
        },
        containerStyle,
      ]}
    >
      {isLoading && placeholder && (
        <View style={styles.placeholderContainer}>
          {placeholder}
        </View>
      )}
      
      {!hasError && (
        <Image
          source={imageSource}
          style={[
            styles.image,
            dimensions,
            { resizeMode: resizeMode || fit },
            imageStyle,
          ]}
          onLoad={handleLoad}
          onError={handleError}
          // Performance optimizations
          {...(Platform.OS === 'ios' && priority === 'high' && { priority: 'high' })}
        />
      )}
      
      {hasError && (
        <View style={[styles.errorContainer, dimensions]}>
          <Image
            source={typeof fallbackAsset === 'string' ? { uri: fallbackAsset } : fallbackAsset}
            style={[
              styles.image,
              dimensions,
              { resizeMode: resizeMode || fit },
              imageStyle,
            ]}
          />
        </View>
      )}
    </View>
  );
};

/**
 * Helper function to build asset paths with proper structure
 */
export function buildAssetPath(
  skinId: string,
  type: 'hero' | 'raster' | 'thumbnail' | 'preview',
  variant?: 'phone' | 'tablet' | 'tile' | 'banner'
): string {
  const basePath = `assets/skins/${skinId}`;
  
  switch (type) {
    case 'hero':
      if (variant === 'phone') {
        return `${basePath}/previews/hero_phone_1080x1920.png`;
      } else if (variant === 'tablet') {
        return `${basePath}/previews/hero_tablet_1536x2048.png`;
      }
      return `${basePath}/previews/tile_1024.png`;
      
    case 'raster':
      // React Native will automatically add @2x/@3x
      return `${basePath}/raster/${skinId}.png`;
      
    case 'thumbnail':
      return `${basePath}/thumbnails/thumb.png`;
      
    case 'preview':
      if (variant === 'banner') {
        return `${basePath}/previews/banner_1600x900.png`;
      }
      return `${basePath}/previews/tile_1024.png`;
      
    default:
      return `${basePath}/raster/${skinId}.png`;
  }
}

/**
 * Preload images for better performance
 */
export async function preloadArtwork(paths: string[]): Promise<void> {
  const promises = paths.map(path => {
    return Image.prefetch(path);
  });
  
  try {
    await Promise.all(promises);
  } catch (error) {
    console.warn('Some images failed to preload:', error);
  }
}

/**
 * Get device-appropriate asset variant
 */
export function getDeviceVariant(): 'phone' | 'tablet' {
  return isTablet ? 'tablet' : 'phone';
}

/**
 * Calculate optimal image dimensions for current device
 */
export function getOptimalDimensions(
  aspectRatio: number = 16/9,
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number } {
  let width = isTablet ? screenWidth * 0.7 : screenWidth * 0.9;
  let height = width / aspectRatio;
  
  if (maxWidth && width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  if (maxHeight && height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return { width, height };
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 12,
    alignSelf: 'center',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
});

export default ResponsiveArt;