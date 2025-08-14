import { Platform, Dimensions, PixelRatio } from 'react-native';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import * as Battery from 'expo-battery';
import * as Cellular from 'expo-cellular';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/**
 * Comprehensive Device Information System
 * Detects and manages device capabilities for optimal asset loading
 */

export interface DeviceProfile {
  // Device Identification
  deviceId: string;
  deviceName: string;
  deviceType: 'phone' | 'tablet' | 'tv' | 'desktop' | 'unknown';
  brand: string | null;
  manufacturer: string | null;
  modelName: string | null;
  modelId: string | null;
  deviceYearClass: number | null;
  
  // Platform Info
  platform: 'ios' | 'android' | 'web';
  osVersion: string | null;
  systemVersion: string;
  apiLevel: number | null;
  
  // Display Characteristics
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
  
  // Performance Capabilities
  totalMemory: number | null;
  supportedCPUArchitectures: string[] | null;
  performanceTier: 'low' | 'medium' | 'high' | 'ultra';
  graphicsCapability: 'basic' | 'standard' | 'advanced';
  
  // Network Information
  networkType: string | null;
  isConnected: boolean;
  isWifi: boolean;
  isCellular: boolean;
  cellularGeneration: string | null;
  networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
  
  // Battery Status
  batteryLevel: number | null;
  batteryState: string | null;
  isLowPowerMode: boolean;
  
  // Feature Support
  hasHaptics: boolean;
  hasAudioSupport: boolean;
  supportsWebP: boolean;
  supportsHEIC: boolean;
  supportsP3ColorSpace: boolean;
  supportsHDR: boolean;
  
  // User Preferences
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  textScaleFactor: number;
  
  // App-Specific
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
      // Get screen dimensions
      const { width, height } = Dimensions.get('window');
      const screenScale = PixelRatio.get();
      const pixelDensity = PixelRatio.getFontScale();
      
      // Get device info
      const deviceType = await this.detectDeviceType();
      const isTablet = deviceType === 'tablet';
      
      // Get network info
      const networkState = await Network.getNetworkStateAsync();
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();
      const powerState = await Battery.getPowerStateAsync();
      
      // Get cellular info (Android only)
      let cellularGeneration: string | null = null;
      if (Platform.OS === 'android') {
        try {
          cellularGeneration = await Cellular.getCellularGenerationAsync();
        } catch (e) {
          // Not available on all devices
        }
      }

      // Calculate performance tier
      const performanceTier = this.calculatePerformanceTier();
      
      // Build device profile
      this.deviceProfile = {
        // Device Identification
        deviceId: this.getDeviceId(),
        deviceName: Device.deviceName || 'Unknown Device',
        deviceType,
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        modelName: Device.modelName,
        modelId: Device.modelId,
        deviceYearClass: Device.deviceYearClass,
        
        // Platform Info
        platform: Platform.OS as 'ios' | 'android' | 'web',
        osVersion: Device.osVersion,
        systemVersion: Platform.Version.toString(),
        apiLevel: Platform.OS === 'android' ? Platform.Version : null,
        
        // Display Characteristics
        screenWidth: width,
        screenHeight: height,
        screenScale,
        pixelDensity,
        screenResolution: `${Math.round(width * screenScale)}x${Math.round(height * screenScale)}`,
        aspectRatio: this.calculateAspectRatio(width, height),
        orientation: width > height ? 'landscape' : 'portrait',
        isTablet,
        hasNotch: this.detectNotch(),
        hasDynamicIsland: this.detectDynamicIsland(),
        
        // Performance Capabilities
        totalMemory: Device.totalMemory,
        supportedCPUArchitectures: Device.supportedCpuArchitectures,
        performanceTier,
        graphicsCapability: this.detectGraphicsCapability(),
        
        // Network Information
        networkType: networkState.type,
        isConnected: networkState.isConnected || false,
        isWifi: networkState.type === Network.NetworkStateType.WIFI,
        isCellular: networkState.type === Network.NetworkStateType.CELLULAR,
        cellularGeneration,
        networkQuality: this.calculateNetworkQuality(networkState),
        
        // Battery Status
        batteryLevel,
        batteryState: this.getBatteryStateString(batteryState),
        isLowPowerMode: powerState.lowPowerMode || false,
        
        // Feature Support
        hasHaptics: this.detectHapticSupport(),
        hasAudioSupport: true,
        supportsWebP: this.detectWebPSupport(),
        supportsHEIC: this.detectHEICSupport(),
        supportsP3ColorSpace: this.detectP3Support(),
        supportsHDR: this.detectHDRSupport(),
        
        // User Preferences
        prefersReducedMotion: false, // Would need to implement accessibility check
        prefersHighContrast: false,
        textScaleFactor: PixelRatio.getFontScale(),
        
        // App-Specific
        appVersion: Constants.expoConfig?.version || '1.0.0',
        buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1',
        isExpoGo: Constants.appOwnership === 'expo',
        isStandalone: Constants.appOwnership === 'standalone',
      };

      // Calculate quality settings based on device profile
      this.qualitySettings = this.calculateQualitySettings(this.deviceProfile);
      
      // Save to storage for offline access
      await this.saveDeviceProfile();
      
      // Notify listeners
      this.notifyListeners();
    } catch (error) {
      console.error('Error initializing device profile:', error);
      // Fallback to basic profile
      this.deviceProfile = this.getFallbackProfile();
    }
  }

  private getDeviceId(): string {
    // Generate a unique device ID
    if (Platform.OS === 'ios') {
      return Constants.deviceId || Constants.sessionId;
    } else if (Platform.OS === 'android') {
      return Constants.deviceId || Constants.installationId;
    }
    return Constants.sessionId;
  }

  private async detectDeviceType(): Promise<'phone' | 'tablet' | 'tv' | 'desktop' | 'unknown'> {
    const deviceType = await Device.getDeviceTypeAsync();
    
    switch (deviceType) {
      case Device.DeviceType.PHONE:
        return 'phone';
      case Device.DeviceType.TABLET:
        return 'tablet';
      case Device.DeviceType.TV:
        return 'tv';
      case Device.DeviceType.DESKTOP:
        return 'desktop';
      default:
        // Fallback detection based on screen size
        const { width } = Dimensions.get('window');
        return width >= 768 ? 'tablet' : 'phone';
    }
  }

  private calculateAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  }

  private detectNotch(): boolean {
    if (Platform.OS !== 'ios') return false;
    
    const model = Device.modelName?.toLowerCase() || '';
    const notchModels = [
      'iphone x', 'iphone xs', 'iphone xr', 'iphone 11',
      'iphone 12', 'iphone 13', 'iphone 14', 'iphone 15'
    ];
    
    return notchModels.some(m => model.includes(m));
  }

  private detectDynamicIsland(): boolean {
    if (Platform.OS !== 'ios') return false;
    
    const model = Device.modelName?.toLowerCase() || '';
    return model.includes('iphone 14 pro') || 
           model.includes('iphone 15 pro') ||
           model.includes('iphone 16');
  }

  private calculatePerformanceTier(): 'low' | 'medium' | 'high' | 'ultra' {
    const yearClass = Device.deviceYearClass;
    const memory = Device.totalMemory;
    
    if (!yearClass || !memory) return 'medium';
    
    // RAM-based tiers
    const memoryGB = memory / (1024 * 1024 * 1024);
    
    if (memoryGB >= 8 && yearClass >= 2022) return 'ultra';
    if (memoryGB >= 6 && yearClass >= 2020) return 'high';
    if (memoryGB >= 4 && yearClass >= 2018) return 'medium';
    return 'low';
  }

  private detectGraphicsCapability(): 'basic' | 'standard' | 'advanced' {
    const tier = this.calculatePerformanceTier();
    
    switch (tier) {
      case 'ultra':
      case 'high':
        return 'advanced';
      case 'medium':
        return 'standard';
      default:
        return 'basic';
    }
  }

  private calculateNetworkQuality(networkState: Network.NetworkState): 'poor' | 'fair' | 'good' | 'excellent' {
    if (!networkState.isConnected) return 'poor';
    
    if (networkState.type === Network.NetworkStateType.WIFI) {
      return 'excellent';
    }
    
    if (networkState.type === Network.NetworkStateType.CELLULAR) {
      // Would need actual speed test for accurate quality
      return 'good';
    }
    
    return 'fair';
  }

  private getBatteryStateString(state: Battery.BatteryState): string {
    switch (state) {
      case Battery.BatteryState.CHARGING:
        return 'charging';
      case Battery.BatteryState.FULL:
        return 'full';
      case Battery.BatteryState.UNPLUGGED:
        return 'unplugged';
      default:
        return 'unknown';
    }
  }

  private detectHapticSupport(): boolean {
    if (Platform.OS === 'ios') return true;
    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version;
      return apiLevel >= 26; // Android O and above
    }
    return false;
  }

  private detectWebPSupport(): boolean {
    if (Platform.OS === 'ios') {
      const version = parseInt(Platform.Version.toString(), 10);
      return version >= 14;
    }
    if (Platform.OS === 'android') {
      return Platform.Version >= 18;
    }
    return true; // Web supports WebP
  }

  private detectHEICSupport(): boolean {
    if (Platform.OS === 'ios') {
      const version = parseInt(Platform.Version.toString(), 10);
      return version >= 11;
    }
    return false;
  }

  private detectP3Support(): boolean {
    if (Platform.OS === 'ios') {
      const model = Device.modelName?.toLowerCase() || '';
      // iPhone 7 and later support P3
      return !model.includes('iphone 6') && !model.includes('iphone se');
    }
    return false;
  }

  private detectHDRSupport(): boolean {
    if (Platform.OS === 'ios') {
      const model = Device.modelName?.toLowerCase() || '';
      return model.includes('pro') || model.includes('iphone 12') || model.includes('iphone 13');
    }
    return false;
  }

  private calculateQualitySettings(profile: DeviceProfile): AssetQualitySettings {
    const { performanceTier, networkQuality, batteryLevel, isLowPowerMode } = profile;
    
    // Adjust quality based on device capabilities
    let imageQuality: 'low' | 'medium' | 'high' | 'ultra' = 'medium';
    let maxTextureSize = 2048;
    let compressionLevel = 85;
    let cacheStrategy: 'aggressive' | 'balanced' | 'minimal' = 'balanced';
    let preloadStrategy: 'none' | 'next' | 'all' = 'next';
    
    // Performance tier adjustments
    switch (performanceTier) {
      case 'ultra':
        imageQuality = 'ultra';
        maxTextureSize = 4096;
        compressionLevel = 95;
        cacheStrategy = 'aggressive';
        preloadStrategy = 'all';
        break;
      case 'high':
        imageQuality = 'high';
        maxTextureSize = 2048;
        compressionLevel = 90;
        cacheStrategy = 'aggressive';
        preloadStrategy = 'next';
        break;
      case 'medium':
        imageQuality = 'medium';
        maxTextureSize = 1536;
        compressionLevel = 85;
        cacheStrategy = 'balanced';
        preloadStrategy = 'next';
        break;
      case 'low':
        imageQuality = 'low';
        maxTextureSize = 1024;
        compressionLevel = 80;
        cacheStrategy = 'minimal';
        preloadStrategy = 'none';
        break;
    }
    
    // Network quality adjustments
    if (networkQuality === 'poor' || networkQuality === 'fair') {
      imageQuality = imageQuality === 'ultra' ? 'high' : 
                     imageQuality === 'high' ? 'medium' : 'low';
      preloadStrategy = 'none';
    }
    
    // Battery adjustments
    if (isLowPowerMode || (batteryLevel && batteryLevel < 0.2)) {
      imageQuality = imageQuality === 'ultra' ? 'high' : 
                     imageQuality === 'high' ? 'medium' : 'low';
      cacheStrategy = 'minimal';
      preloadStrategy = 'none';
    }
    
    return {
      imageQuality,
      maxTextureSize,
      enableBlurHash: performanceTier !== 'low',
      enableProgressive: networkQuality !== 'poor',
      cacheStrategy,
      preloadStrategy,
      compressionLevel,
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
      platform: Platform.OS as any,
      osVersion: null,
      systemVersion: Platform.Version.toString(),
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
      hasHaptics: true,
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

    // Listen for network changes
    Network.addNetworkStateListener((state) => {
      if (this.deviceProfile) {
        this.deviceProfile.networkType = state.type;
        this.deviceProfile.isConnected = state.isConnected || false;
        this.deviceProfile.isWifi = state.type === Network.NetworkStateType.WIFI;
        this.deviceProfile.isCellular = state.type === Network.NetworkStateType.CELLULAR;
        this.deviceProfile.networkQuality = this.calculateNetworkQuality(state);
        
        // Recalculate quality settings
        this.qualitySettings = this.calculateQualitySettings(this.deviceProfile);
        this.notifyListeners();
      }
    });

    // Listen for battery changes
    Battery.addBatteryLevelListener(({ batteryLevel }) => {
      if (this.deviceProfile) {
        this.deviceProfile.batteryLevel = batteryLevel;
        
        // Recalculate quality settings if battery is low
        if (batteryLevel < 0.2) {
          this.qualitySettings = this.calculateQualitySettings(this.deviceProfile);
        }
        
        this.notifyListeners();
      }
    });

    Battery.addBatteryStateListener(({ batteryState }) => {
      if (this.deviceProfile) {
        this.deviceProfile.batteryState = this.getBatteryStateString(batteryState);
        this.notifyListeners();
      }
    });

    Battery.addPowerModeListener(({ lowPowerMode }) => {
      if (this.deviceProfile) {
        this.deviceProfile.isLowPowerMode = lowPowerMode;
        
        // Recalculate quality settings
        this.qualitySettings = this.calculateQualitySettings(this.deviceProfile);
        this.notifyListeners();
      }
    });
  }

  private notifyListeners(): void {
    if (this.deviceProfile) {
      this.listeners.forEach(listener => listener(this.deviceProfile!));
    }
  }

  private async saveDeviceProfile(): Promise<void> {
    if (this.deviceProfile) {
      try {
        await AsyncStorage.setItem(
          '@device_profile',
          JSON.stringify(this.deviceProfile)
        );
        await AsyncStorage.setItem(
          '@quality_settings',
          JSON.stringify(this.qualitySettings)
        );
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
    return this.qualitySettings || {
      imageQuality: 'medium',
      maxTextureSize: 2048,
      enableBlurHash: true,
      enableProgressive: true,
      cacheStrategy: 'balanced',
      preloadStrategy: 'next',
      compressionLevel: 85,
    };
  }

  isHighEndDevice(): boolean {
    const profile = this.getDeviceProfile();
    return profile.performanceTier === 'high' || profile.performanceTier === 'ultra';
  }

  isLowEndDevice(): boolean {
    const profile = this.getDeviceProfile();
    return profile.performanceTier === 'low';
  }

  shouldReduceQuality(): boolean {
    const profile = this.getDeviceProfile();
    return profile.isLowPowerMode || 
           profile.networkQuality === 'poor' ||
           (profile.batteryLevel !== null && profile.batteryLevel < 0.2) ||
           profile.performanceTier === 'low';
  }

  getOptimalImageResolution(): '@1x' | '@2x' | '@3x' {
    const profile = this.getDeviceProfile();
    const settings = this.getQualitySettings();
    
    if (settings.imageQuality === 'low') return '@1x';
    if (settings.imageQuality === 'ultra') return '@3x';
    
    // Use pixel density for decision
    if (profile.screenScale >= 3) return '@3x';
    if (profile.screenScale >= 2) return '@2x';
    return '@1x';
  }

  getRecommendedCachePolicy(): 'none' | 'disk' | 'memory' | 'memory-disk' {
    const settings = this.getQualitySettings();
    
    switch (settings.cacheStrategy) {
      case 'aggressive':
        return 'memory-disk';
      case 'balanced':
        return 'disk';
      case 'minimal':
        return 'memory';
      default:
        return 'disk';
    }
  }

  subscribe(listener: (profile: DeviceProfile) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
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