import { Platform } from 'react-native';
import { deviceCompatibility } from '../utils/DeviceCompatibility';

export interface OptimizationConfig {
  animations: {
    enabled: boolean;
    duration: number;
    useNativeDriver: boolean;
  };
  rendering: {
    fps: number;
    renderScale: number;
    shadowsEnabled: boolean;
    blurEnabled: boolean;
  };
  assets: {
    imageQuality: 'low' | 'medium' | 'high';
    preloadLimit: number;
    cacheSize: number;
  };
  gameplay: {
    particleLimit: number;
    maxConcurrentSounds: number;
    physicsSteps: number;
  };
  network: {
    batchSize: number;
    syncInterval: number;
    compressionEnabled: boolean;
  };
}

class DeviceOptimizationManager {
  private static instance: DeviceOptimizationManager;
  private optimizations: OptimizationConfig;

  private constructor() {
    this.optimizations = this.generateOptimizations();
  }

  static getInstance(): DeviceOptimizationManager {
    if (!DeviceOptimizationManager.instance) {
      DeviceOptimizationManager.instance = new DeviceOptimizationManager();
    }
    return DeviceOptimizationManager.instance;
  }

  private generateOptimizations(): OptimizationConfig {
    const deviceInfo = deviceCompatibility.getDeviceInfo();
    const performanceProfile = deviceCompatibility.getPerformanceProfile();

    // iOS-specific optimizations
    if (Platform.OS === 'ios') {
      return this.getiOSOptimizations(deviceInfo, performanceProfile);
    }

    // Android-specific optimizations
    if (Platform.OS === 'android') {
      return this.getAndroidOptimizations(deviceInfo, performanceProfile);
    }

    // Web-specific optimizations
    if (Platform.OS === 'web') {
      return this.getWebOptimizations(deviceInfo, performanceProfile);
    }

    // Default optimizations
    return this.getDefaultOptimizations(performanceProfile);
  }

  private getiOSOptimizations(deviceInfo: any, profile: any): OptimizationConfig {
    const isIPad = deviceInfo.deviceType === 'tablet';
    const hasNotch = deviceInfo.hasNotch;

    return {
      animations: {
        enabled: !deviceInfo.isLowEnd,
        duration: deviceInfo.isLowEnd ? 150 : 300,
        useNativeDriver: true, // Always use native driver on iOS
      },
      rendering: {
        fps: profile.targetFPS,
        renderScale: isIPad ? 1.0 : profile.renderScale,
        shadowsEnabled: !deviceInfo.isLowEnd && isIPad,
        blurEnabled: !deviceInfo.isLowEnd,
      },
      assets: {
        imageQuality: profile.textureQuality,
        preloadLimit: isIPad ? 50 : 20,
        cacheSize: isIPad ? 200 : 100, // MB
      },
      gameplay: {
        particleLimit: profile.particleLimit,
        maxConcurrentSounds: profile.maxConcurrentSounds,
        physicsSteps: deviceInfo.isLowEnd ? 30 : 60,
      },
      network: {
        batchSize: 20,
        syncInterval: 5000,
        compressionEnabled: true,
      },
    };
  }

  private getAndroidOptimizations(deviceInfo: any, profile: any): OptimizationConfig {
    const androidVersion = Platform.Version || 28;
    const isModern = androidVersion >= 28; // Android 9.0+

    return {
      animations: {
        enabled: !deviceInfo.isLowEnd && isModern,
        duration: deviceInfo.isLowEnd ? 200 : 250,
        useNativeDriver: isModern, // Only on modern Android
      },
      rendering: {
        fps: profile.targetFPS,
        renderScale: profile.renderScale,
        shadowsEnabled: false, // Shadows are expensive on Android
        blurEnabled: isModern && !deviceInfo.isLowEnd,
      },
      assets: {
        imageQuality: profile.textureQuality,
        preloadLimit: deviceInfo.isLowEnd ? 10 : 30,
        cacheSize: deviceInfo.isLowEnd ? 50 : 150, // MB
      },
      gameplay: {
        particleLimit: Math.floor(profile.particleLimit * 0.8), // Reduce for Android
        maxConcurrentSounds: Math.min(profile.maxConcurrentSounds, 8),
        physicsSteps: deviceInfo.isLowEnd ? 30 : 45,
      },
      network: {
        batchSize: deviceInfo.isLowEnd ? 10 : 15,
        syncInterval: deviceInfo.isLowEnd ? 10000 : 5000,
        compressionEnabled: true,
      },
    };
  }

  private getWebOptimizations(deviceInfo: any, profile: any): OptimizationConfig {
    const isDesktop = deviceInfo.deviceType === 'desktop';
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    return {
      animations: {
        enabled: true,
        duration: 300,
        useNativeDriver: false, // Not available on web
      },
      rendering: {
        fps: isDesktop ? 60 : profile.targetFPS,
        renderScale: 1.0,
        shadowsEnabled: isDesktop,
        blurEnabled: !isSafari, // Safari has performance issues with blur
      },
      assets: {
        imageQuality: isDesktop ? 'high' : profile.textureQuality,
        preloadLimit: isDesktop ? 100 : 30,
        cacheSize: isDesktop ? 500 : 200, // MB
      },
      gameplay: {
        particleLimit: isDesktop ? 500 : profile.particleLimit,
        maxConcurrentSounds: isDesktop ? 20 : 10,
        physicsSteps: 60,
      },
      network: {
        batchSize: 30,
        syncInterval: 3000,
        compressionEnabled: true,
      },
    };
  }

  private getDefaultOptimizations(profile: any): OptimizationConfig {
    return {
      animations: {
        enabled: profile.targetFPS >= 30,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      },
      rendering: {
        fps: profile.targetFPS,
        renderScale: profile.renderScale,
        shadowsEnabled: profile.shadowsEnabled,
        blurEnabled: false,
      },
      assets: {
        imageQuality: profile.textureQuality,
        preloadLimit: 20,
        cacheSize: 100,
      },
      gameplay: {
        particleLimit: profile.particleLimit,
        maxConcurrentSounds: profile.maxConcurrentSounds,
        physicsSteps: 45,
      },
      network: {
        batchSize: 15,
        syncInterval: 5000,
        compressionEnabled: true,
      },
    };
  }

  // Dynamic adjustment methods
  adjustForMemoryPressure() {
    this.optimizations.gameplay.particleLimit = Math.floor(
      this.optimizations.gameplay.particleLimit * 0.5
    );
    this.optimizations.assets.preloadLimit = Math.floor(
      this.optimizations.assets.preloadLimit * 0.5
    );
    this.optimizations.rendering.shadowsEnabled = false;
    this.optimizations.rendering.blurEnabled = false;
  }

  adjustForBatteryLevel(level: number) {
    if (level < 20) {
      // Low battery mode
      this.optimizations.rendering.fps = 30;
      this.optimizations.animations.enabled = false;
      this.optimizations.network.syncInterval = 15000; // Sync less frequently
    }
  }

  adjustForNetworkType(type: string) {
    switch (type) {
      case '2g':
      case '3g':
        this.optimizations.network.batchSize = 5;
        this.optimizations.network.compressionEnabled = true;
        this.optimizations.assets.imageQuality = 'low';
        break;
      case '4g':
      case 'lte':
        this.optimizations.network.batchSize = 15;
        break;
      case 'wifi':
      case '5g':
        this.optimizations.network.batchSize = 30;
        this.optimizations.assets.imageQuality = 'high';
        break;
    }
  }

  // Public API
  getOptimizations(): OptimizationConfig {
    return this.optimizations;
  }

  applyOptimizations(overrides?: Partial<OptimizationConfig>) {
    if (overrides) {
      this.optimizations = {
        ...this.optimizations,
        ...overrides,
      };
    }
    return this.optimizations;
  }

  // Specific optimization queries
  shouldUseAnimation(): boolean {
    return this.optimizations.animations.enabled;
  }

  getAnimationDuration(): number {
    return this.optimizations.animations.duration;
  }

  shouldRenderShadows(): boolean {
    return this.optimizations.rendering.shadowsEnabled;
  }

  getMaxParticles(): number {
    return this.optimizations.gameplay.particleLimit;
  }

  getImageQuality(): 'low' | 'medium' | 'high' {
    return this.optimizations.assets.imageQuality;
  }

  getBatchSize(): number {
    return this.optimizations.network.batchSize;
  }

  getTargetFPS(): number {
    return this.optimizations.rendering.fps;
  }

  // Platform-specific helpers
  getIOSSpecificOptimizations() {
    return {
      useHapticFeedback: !deviceCompatibility.getDeviceInfo().isLowEnd,
      useSafeAreaInsets: deviceCompatibility.getDeviceInfo().hasNotch,
      useMetalRenderer: true,
      supportProMotion: deviceCompatibility.getDeviceInfo().deviceType === 'tablet',
    };
  }

  getAndroidSpecificOptimizations() {
    const androidVersion = Platform.Version || 28;
    return {
      useHardwareAcceleration: androidVersion >= 26,
      useVulkanRenderer: androidVersion >= 29,
      supportHighRefreshRate: androidVersion >= 30,
      useAdaptiveIcons: androidVersion >= 26,
    };
  }

  getWebSpecificOptimizations() {
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);

    return {
      useWebGL2: true,
      useOffscreenCanvas: 'OffscreenCanvas' in window,
      useWebWorkers: 'Worker' in window,
      useWebAssembly: 'WebAssembly' in window,
      supportWebGPU: 'gpu' in navigator,
      preferredRenderer: isChrome ? 'webgl2' : 'webgl',
    };
  }
}

export const deviceOptimizations = DeviceOptimizationManager.getInstance();
