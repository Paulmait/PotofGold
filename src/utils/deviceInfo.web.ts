import { Platform, Dimensions, PixelRatio } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Web-compatible version of deviceInfo without native-only APIs

export interface DeviceProfile {
  deviceId: string;
  deviceName: string;
  deviceType: 'phone' | 'tablet' | 'tv' | 'desktop' | 'unknown';
  brand: string | null;
  manufacturer: string | null;
  modelName: string | null;
  modelId: string | null;
  deviceYearClass: number | null;
  platform: 'ios' | 'android' | 'web';
  osVersion: string | null;
  systemVersion: string;
  apiLevel: number | null;
  screenWidth: number;
  screenHeight: number;
  screenScale: number;
  pixelDensity: number;
  screenResolution: string;
  aspectRatio: string;
  orientation: 'portrait' | 'landscape';
  isTablet: boolean;
  hasNotch: boolean;
  hasDynamicIsland: boolean;
  totalMemory: number | null;
  supportedCPUArchitectures: string[] | null;
  performanceTier: 'low' | 'medium' | 'high' | 'ultra';
  graphicsCapability: 'basic' | 'standard' | 'advanced';
  networkType: string | null;
  isConnected: boolean;
  isWifi: boolean;
  isCellular: boolean;
  cellularGeneration: string | null;
  networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
  batteryLevel: number | null;
  batteryState: string | null;
  isLowPowerMode: boolean;
  hasHaptics: boolean;
  hasAudioSupport: boolean;
  supportsWebP: boolean;
  supportsHEIC: boolean;
  supportsP3ColorSpace: boolean;
  supportsHDR: boolean;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  textScaleFactor: number;
  appVersion: string;
  buildNumber: string | number;
  isExpoGo: boolean;
  isStandalone: boolean;
}

export interface AssetQualitySettings {
  imageQuality: 'low' | 'medium' | 'high' | 'ultra';
  maxTextureSize: number;
  enableBlurHash: boolean;
  enableProgressive: boolean;
  cacheStrategy: 'aggressive' | 'balanced' | 'minimal';
  preloadStrategy: 'none' | 'next' | 'all';
  compressionLevel: number;
}

class DeviceInfoManager {
  private static instance: DeviceInfoManager;
  private deviceProfile: DeviceProfile | null = null;
  private qualitySettings: AssetQualitySettings | null = null;
  private listeners: Set<(profile: DeviceProfile) => void> = new Set();

  private constructor() {
    this.initializeDeviceProfile();
    this.setupListeners();
  }

  static getInstance(): DeviceInfoManager {
    if (!DeviceInfoManager.instance) {
      DeviceInfoManager.instance = new DeviceInfoManager();
    }
    return DeviceInfoManager.instance;
  }

  private async initializeDeviceProfile(): Promise<void> {
    try {
      const { width, height } = Dimensions.get('window');
      const screenScale = PixelRatio.get();
      const pixelDensity = PixelRatio.getFontScale();

      // Web defaults
      const deviceType = width >= 768 ? 'tablet' : 'phone';
      const isTablet = deviceType === 'tablet';

      this.deviceProfile = {
        deviceId: Constants.sessionId,
        deviceName: 'Web Browser',
        deviceType: width > 1024 ? 'desktop' : deviceType,
        brand: null,
        manufacturer: null,
        modelName: null,
        modelId: null,
        deviceYearClass: null,
        platform: 'web',
        osVersion: null,
        systemVersion: 'web',
        apiLevel: null,
        screenWidth: width,
        screenHeight: height,
        screenScale,
        pixelDensity,
        screenResolution: `${Math.round(width * screenScale)}x${Math.round(height * screenScale)}`,
        aspectRatio: this.calculateAspectRatio(width, height),
        orientation: width > height ? 'landscape' : 'portrait',
        isTablet,
        hasNotch: false,
        hasDynamicIsland: false,
        totalMemory: null,
        supportedCPUArchitectures: null,
        performanceTier: 'high',
        graphicsCapability: 'advanced',
        networkType: 'unknown',
        isConnected: true,
        isWifi: false,
        isCellular: false,
        cellularGeneration: null,
        networkQuality: 'good',
        batteryLevel: null,
        batteryState: null,
        isLowPowerMode: false,
        hasHaptics: false,
        hasAudioSupport: true,
        supportsWebP: true,
        supportsHEIC: false,
        supportsP3ColorSpace: false,
        supportsHDR: false,
        prefersReducedMotion: false,
        prefersHighContrast: false,
        textScaleFactor: PixelRatio.getFontScale(),
        appVersion: Constants.expoConfig?.version || '1.0.0',
        buildNumber: '1',
        isExpoGo: false,
        isStandalone: true,
      };

      this.qualitySettings = this.calculateQualitySettings(this.deviceProfile);
      await this.saveDeviceProfile();
      this.notifyListeners();
    } catch (error) {
      console.error('Error initializing device profile:', error);
      this.deviceProfile = this.getFallbackProfile();
    }
  }

  private calculateAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  }

  private calculateQualitySettings(profile: DeviceProfile): AssetQualitySettings {
    // Web defaults to high quality
    return {
      imageQuality: 'high',
      maxTextureSize: 2048,
      enableBlurHash: true,
      enableProgressive: true,
      cacheStrategy: 'aggressive',
      preloadStrategy: 'next',
      compressionLevel: 90,
    };
  }

  private getFallbackProfile(): DeviceProfile {
    const { width, height } = Dimensions.get('window');
    const isTablet = width >= 768;

    return {
      deviceId: 'unknown',
      deviceName: 'Unknown Device',
      deviceType: isTablet ? 'tablet' : 'phone',
      brand: null,
      manufacturer: null,
      modelName: null,
      modelId: null,
      deviceYearClass: null,
      platform: 'web',
      osVersion: null,
      systemVersion: 'web',
      apiLevel: null,
      screenWidth: width,
      screenHeight: height,
      screenScale: PixelRatio.get(),
      pixelDensity: PixelRatio.getFontScale(),
      screenResolution: `${width}x${height}`,
      aspectRatio: '16:9',
      orientation: width > height ? 'landscape' : 'portrait',
      isTablet,
      hasNotch: false,
      hasDynamicIsland: false,
      totalMemory: null,
      supportedCPUArchitectures: null,
      performanceTier: 'medium',
      graphicsCapability: 'standard',
      networkType: null,
      isConnected: true,
      isWifi: false,
      isCellular: false,
      cellularGeneration: null,
      networkQuality: 'good',
      batteryLevel: null,
      batteryState: null,
      isLowPowerMode: false,
      hasHaptics: false,
      hasAudioSupport: true,
      supportsWebP: true,
      supportsHEIC: false,
      supportsP3ColorSpace: false,
      supportsHDR: false,
      prefersReducedMotion: false,
      prefersHighContrast: false,
      textScaleFactor: 1,
      appVersion: '1.0.0',
      buildNumber: '1',
      isExpoGo: false,
      isStandalone: true,
    };
  }

  private setupListeners(): void {
    // Listen for orientation changes
    Dimensions.addEventListener('change', ({ window }) => {
      if (this.deviceProfile) {
        this.deviceProfile.screenWidth = window.width;
        this.deviceProfile.screenHeight = window.height;
        this.deviceProfile.orientation = window.width > window.height ? 'landscape' : 'portrait';
        this.notifyListeners();
      }
    });
  }

  private notifyListeners(): void {
    if (this.deviceProfile) {
      this.listeners.forEach((listener) => listener(this.deviceProfile!));
    }
  }

  private async saveDeviceProfile(): Promise<void> {
    if (this.deviceProfile) {
      try {
        await AsyncStorage.setItem('@device_profile', JSON.stringify(this.deviceProfile));
        await AsyncStorage.setItem('@quality_settings', JSON.stringify(this.qualitySettings));
      } catch (error) {
        console.error('Error saving device profile:', error);
      }
    }
  }

  async loadDeviceProfile(): Promise<DeviceProfile | null> {
    try {
      const stored = await AsyncStorage.getItem('@device_profile');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading device profile:', error);
    }
    return null;
  }

  // Public API
  getDeviceProfile(): DeviceProfile {
    return this.deviceProfile || this.getFallbackProfile();
  }

  getQualitySettings(): AssetQualitySettings {
    return (
      this.qualitySettings || {
        imageQuality: 'medium',
        maxTextureSize: 2048,
        enableBlurHash: true,
        enableProgressive: true,
        cacheStrategy: 'balanced',
        preloadStrategy: 'next',
        compressionLevel: 85,
      }
    );
  }

  isHighEndDevice(): boolean {
    return true; // Web assumed high-end
  }

  isLowEndDevice(): boolean {
    return false;
  }

  shouldReduceQuality(): boolean {
    return false;
  }

  getOptimalImageResolution(): '@1x' | '@2x' | '@3x' {
    const profile = this.getDeviceProfile();
    if (profile.screenScale >= 3) return '@3x';
    if (profile.screenScale >= 2) return '@2x';
    return '@1x';
  }

  getRecommendedCachePolicy(): 'none' | 'disk' | 'memory' | 'memory-disk' {
    return 'memory-disk';
  }

  subscribe(listener: (profile: DeviceProfile) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async refresh(): Promise<void> {
    await this.initializeDeviceProfile();
  }
}

// Export singleton instance
export const deviceInfoManager = DeviceInfoManager.getInstance();

// Export convenience functions
export function getDeviceProfile(): DeviceProfile {
  return deviceInfoManager.getDeviceProfile();
}

export function getQualitySettings(): AssetQualitySettings {
  return deviceInfoManager.getQualitySettings();
}

export function isTablet(): boolean {
  return deviceInfoManager.getDeviceProfile().isTablet;
}

export function isHighEndDevice(): boolean {
  return deviceInfoManager.isHighEndDevice();
}

export function shouldReduceQuality(): boolean {
  return deviceInfoManager.shouldReduceQuality();
}

export function getOptimalResolution(): '@1x' | '@2x' | '@3x' {
  return deviceInfoManager.getOptimalImageResolution();
}
