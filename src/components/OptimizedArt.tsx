import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ViewStyle,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { 
  deviceInfoManager, 
  getDeviceProfile, 
  getQualitySettings,
  getOptimalResolution,
  shouldReduceQuality 
} from '../utils/deviceInfo';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

// Blurhash placeholders for loading states (gold-themed)
const BLURHASH_PLACEHOLDERS = {
  cart: 'L6H2:g00~q00_3%M%M%M~q00%M%M',  // Gold gradient
  trail: 'L5H2EC=PM+%M~q%M~q%M%M%M~q%M',  // Purple gradient
  badge: 'L5H2QC00~q%M~q%M~q%M~q%M~q%M',  // Blue gradient
  frame: 'L5H2:g00~q00_3%M%M%M~q00%M%M',  // Green gradient
  default: 'L6PZfSxt~qt7%Mj[%Mj[~qt7%Mj[', // Dark gradient
};

interface OptimizedArtProps {
  // Asset configuration
  skinId: string;
  type: 'cart' | 'trail' | 'badge' | 'frame';
  variant?: 'hero' | 'raster' | 'thumbnail' | 'preview';
  
  // Display options
  aspectRatio?: number;
  contentFit?: ImageContentFit;
  backgroundColor?: string;
  
  // Styles
  containerStyle?: ViewStyle;
  imageStyle?: any;
  
  // Loading states
  onLoad?: () => void;
  onError?: (error: any) => void;
  showPlaceholder?: boolean;
  
  // Performance
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  transition?: number;
}

/**
 * OptimizedArt - High-performance image component using expo-image
 * 
 * Features:
 * - Automatic format selection (WebP when possible)
 * - Blurhash placeholders for smooth loading
 * - Memory and disk caching
 * - Progressive loading
 * - Automatic device optimization
 */
export const OptimizedArt: React.FC<OptimizedArtProps> = ({
  skinId,
  type,
  variant = 'raster',
  aspectRatio = 1,
  contentFit = 'contain',
  backgroundColor = 'transparent',
  containerStyle,
  imageStyle,
  onLoad,
  onError,
  showPlaceholder = true,
  priority = 'normal',
  cachePolicy,
  transition = 200,
}) => {
  // Get device info for optimal loading
  const [deviceProfile] = useState(() => getDeviceProfile());
  const [qualitySettings] = useState(() => getQualitySettings());
  const [isLoading, setIsLoading] = useState(true);
  
  // Subscribe to device changes
  useEffect(() => {
    const unsubscribe = deviceInfoManager.subscribe((profile) => {
      // Re-render if quality settings change significantly
      console.log('Device profile updated:', profile.performanceTier);
    });
    
    return unsubscribe;
  }, []);
  
  // Determine optimal cache policy based on device
  const effectiveCachePolicy = useMemo(() => {
    if (cachePolicy) return cachePolicy;
    return deviceInfoManager.getRecommendedCachePolicy();
  }, [cachePolicy]);
  
  // Adjust quality based on device capabilities
  const adjustedQuality = useMemo(() => {
    if (shouldReduceQuality()) {
      return {
        compressionLevel: 0.7,
        maxSize: qualitySettings.maxTextureSize,
        enableBlur: false,
      };
    }
    return {
      compressionLevel: qualitySettings.compressionLevel / 100,
      maxSize: qualitySettings.maxTextureSize,
      enableBlur: qualitySettings.enableBlurHash,
    };
  }, [qualitySettings]);
  // Build the image source URI with device-aware selection
  const imageSource = useMemo(() => {
    const basePath = `/assets/skins/${skinId}`;
    
    switch (variant) {
      case 'hero':
        // Use device profile for accurate detection
        const deviceType = deviceProfile.deviceType;
        const heroFile = deviceType === 'tablet' 
          ? 'hero_tablet_1536x2048.png'
          : 'hero_phone_1080x1920.png';
        return `${basePath}/previews/${heroFile}`;
        
      case 'thumbnail':
        // Select thumbnail based on screen density
        const thumbRes = getOptimalResolution();
        const thumbFile = thumbRes === '@3x' ? 'thumb@3x.png' :
                         thumbRes === '@2x' ? 'thumb@2x.png' : 'thumb.png';
        return `${basePath}/thumbnails/${thumbFile}`;
        
      case 'preview':
        // Adjust preview size based on device capabilities
        const previewSize = qualitySettings.maxTextureSize >= 2048 ? 'tile_1024.png' :
                           qualitySettings.maxTextureSize >= 1536 ? 'tile_768.png' :
                           'tile_512.png';
        return `${basePath}/previews/${previewSize}`;
        
      case 'raster':
      default:
        // Smart resolution selection based on device
        const resolution = getOptimalResolution();
        const suffix = resolution === '@3x' ? '@3x' :
                      resolution === '@2x' ? '@2x' : '';
        return `${basePath}/raster/${skinId}${suffix}.png`;
    }
  }, [skinId, variant, deviceProfile, qualitySettings]);

  // Calculate optimal dimensions based on device profile
  const dimensions = useMemo(() => {
    let width: number;
    let height: number;
    
    // Adjust base sizes based on device capabilities
    const scaleFactor = deviceProfile.performanceTier === 'ultra' ? 1.2 :
                       deviceProfile.performanceTier === 'high' ? 1.0 :
                       deviceProfile.performanceTier === 'medium' ? 0.9 :
                       0.75;

    switch (variant) {
      case 'hero':
        if (deviceProfile.deviceType === 'tablet') {
          width = Math.min(deviceProfile.screenWidth * 0.7, 768 * scaleFactor);
          height = width * (2048 / 1536);
        } else {
          width = (deviceProfile.screenWidth - 40) * scaleFactor;
          height = width * (1920 / 1080);
        }
        break;
        
      case 'thumbnail':
        const baseThumbSize = deviceProfile.isTablet ? 100 : 80;
        width = baseThumbSize * scaleFactor;
        height = width;
        break;
        
      case 'preview':
        const basePreviewSize = deviceProfile.isTablet ? 400 : 300;
        width = basePreviewSize * scaleFactor;
        height = width / aspectRatio;
        
        // Cap size based on texture limits
        const maxDimension = qualitySettings.maxTextureSize / 4;
        if (width > maxDimension) {
          width = maxDimension;
          height = width / aspectRatio;
        }
        break;
        
      case 'raster':
      default:
        const baseRasterSize = deviceProfile.isTablet ? 400 : 320;
        width = baseRasterSize * scaleFactor;
        height = width / aspectRatio;
        break;
    }

    return { 
      width: Math.round(width), 
      height: Math.round(height) 
    };
  }, [variant, aspectRatio, deviceProfile, qualitySettings]);

  // Select appropriate blurhash (disable for low-end devices)
  const blurhash = useMemo(() => {
    if (!adjustedQuality.enableBlur) return undefined;
    return BLURHASH_PLACEHOLDERS[type] || BLURHASH_PLACEHOLDERS.default;
  }, [type, adjustedQuality.enableBlur]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    console.warn(`Failed to load image: ${imageSource}`, error);
    onError?.(error);
  };

  return (
    <View 
      style={[
        styles.container,
        dimensions,
        { backgroundColor },
        containerStyle,
      ]}
    >
      <Image
        source={imageSource}
        placeholder={showPlaceholder ? blurhash : undefined}
        contentFit={contentFit}
        transition={adjustedQuality.enableBlur ? transition : 0}
        priority={priority}
        cachePolicy={effectiveCachePolicy}
        style={[
          styles.image,
          dimensions,
          imageStyle,
        ]}
        onLoad={handleLoad}
        onError={handleError}
        // Performance optimizations
        recyclingKey={`${skinId}-${variant}-${deviceProfile.performanceTier}`}
        allowDownscaling={true}
        autoplay={!deviceProfile.prefersReducedMotion}
        // Device-specific optimizations
        resizeMode={contentFit}
        responsivePolicy={deviceProfile.isTablet ? 'live' : 'initial'}
        accessible={true}
        accessibilityLabel={`${type} skin: ${skinId}`}
      />
      
      {isLoading && !showPlaceholder && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#FFD700" />
        </View>
      )}
    </View>
  );
};

/**
 * Batch preload images for better performance
 */
export async function preloadDropAssets(dropId: string): Promise<void> {
  const assets = [
    `cart_${dropId}`,
    `trail_${dropId}`,
    `badge_${dropId}`,
    `frame_${dropId}`,
  ];
  
  const urls = assets.flatMap(skinId => [
    `/assets/skins/${skinId}/raster/${skinId}.png`,
    `/assets/skins/${skinId}/thumbnails/thumb.png`,
  ]);
  
  try {
    await Image.prefetch(urls, 'memory-disk');
    console.log(`Preloaded assets for drop ${dropId}`);
  } catch (error) {
    console.warn('Failed to preload some assets:', error);
  }
}

/**
 * Clear image cache (useful for updates)
 */
export async function clearImageCache(): Promise<void> {
  try {
    await Image.clearDiskCache();
    await Image.clearMemoryCache();
    console.log('Image cache cleared');
  } catch (error) {
    console.warn('Failed to clear image cache:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 12,
    alignSelf: 'center',
  },
  image: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});

export default OptimizedArt;