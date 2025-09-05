import { Platform, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PlatformUtils = {
  // Platform detection
  isWeb: Platform.OS === 'web',
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isMobile: Platform.OS === 'ios' || Platform.OS === 'android',
  isTablet: () => {
    const aspectRatio = screenHeight / screenWidth;
    return (
      (PlatformUtils.isIOS && aspectRatio < 1.6) ||
      (PlatformUtils.isAndroid && Math.min(screenWidth, screenHeight) >= 600)
    );
  },
  isDesktop: () => PlatformUtils.isWeb && screenWidth >= 1024,

  // Responsive dimensions
  getResponsiveDimensions: () => {
    if (PlatformUtils.isWeb) {
      // Web-specific sizing
      const maxGameWidth = Math.min(screenWidth, 600);
      const maxGameHeight = Math.min(screenHeight, 900);
      return {
        width: maxGameWidth,
        height: maxGameHeight,
        scale: maxGameWidth / 375, // Base iPhone width
      };
    }
    return {
      width: screenWidth,
      height: screenHeight,
      scale: 1,
    };
  },

  // Haptic feedback (mobile only)
  hapticFeedback: async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    if (!PlatformUtils.isWeb) {
      try {
        switch (type) {
          case 'light':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'success':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'warning':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          case 'error':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
        }
      } catch (error) {
        // Silently fail on web or if haptics unavailable
      }
    }
  },

  // Sound playback (cross-platform)
  playSound: async (soundFile: string, volume: number = 1.0) => {
    try {
      if (PlatformUtils.isWeb) {
        // Use HTML5 Audio for web
        const audio = new window.Audio(soundFile);
        audio.volume = volume;
        await audio.play();
      } else {
        // Use Expo Audio for mobile
        const { sound } = await Audio.Sound.createAsync(
          { uri: soundFile },
          { shouldPlay: true, volume }
        );
        setTimeout(() => sound.unloadAsync(), 3000);
      }
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  },

  // Storage (cross-platform)
  storage: {
    setItem: async (key: string, value: string) => {
      if (PlatformUtils.isWeb) {
        localStorage.setItem(key, value);
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(key, value);
      }
    },
    getItem: async (key: string): Promise<string | null> => {
      if (PlatformUtils.isWeb) {
        return localStorage.getItem(key);
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        return await AsyncStorage.getItem(key);
      }
    },
    removeItem: async (key: string) => {
      if (PlatformUtils.isWeb) {
        localStorage.removeItem(key);
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem(key);
      }
    },
  },

  // Input handling
  getInputMethod: () => {
    if (PlatformUtils.isWeb) {
      // Check for touch support on web
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      return hasTouch ? 'touch' : 'mouse';
    }
    return 'touch';
  },

  // Performance optimizations
  getOptimalSettings: () => {
    const isLowEnd = PlatformUtils.isWeb 
      ? navigator.hardwareConcurrency <= 2 
      : false;

    return {
      particleEffects: !isLowEnd,
      shadows: !isLowEnd && !PlatformUtils.isWeb,
      animations: !isLowEnd,
      soundEffects: !isLowEnd,
      maxFPS: PlatformUtils.isWeb ? 60 : 60,
      renderScale: isLowEnd ? 0.75 : 1,
    };
  },

  // Web-specific features
  webFeatures: {
    isFullscreen: () => {
      if (!PlatformUtils.isWeb) return false;
      return !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
    },
    
    requestFullscreen: async () => {
      if (!PlatformUtils.isWeb) return;
      
      const element = document.documentElement;
      try {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        }
      } catch (error) {
        console.warn('Fullscreen request failed:', error);
      }
    },

    exitFullscreen: async () => {
      if (!PlatformUtils.isWeb) return;
      
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        }
      } catch (error) {
        console.warn('Exit fullscreen failed:', error);
      }
    },

    // PWA installation
    isPWA: () => {
      if (!PlatformUtils.isWeb) return false;
      return window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone === true;
    },

    canInstallPWA: () => {
      return PlatformUtils.isWeb && 'serviceWorker' in navigator;
    },
  },

  // Cross-platform navigation
  navigation: {
    canGoBack: () => {
      if (PlatformUtils.isWeb) {
        return window.history.length > 1;
      }
      return true; // Mobile navigation handles this
    },

    goBack: () => {
      if (PlatformUtils.isWeb) {
        window.history.back();
      }
    },
  },

  // Device capabilities
  capabilities: {
    hasVibration: () => PlatformUtils.isMobile,
    hasAccelerometer: () => PlatformUtils.isMobile,
    hasGyroscope: () => PlatformUtils.isMobile,
    hasNotifications: () => true,
    hasCamera: () => PlatformUtils.isMobile,
    hasLocation: () => true,
    hasOfflineSupport: () => true,
  },
};

export default PlatformUtils;