import { Platform, Dimensions, PixelRatio } from 'react-native';
import * as Device from 'expo-device';
import { eventBus } from '../core/EventBus';

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  deviceType: 'phone' | 'tablet' | 'desktop' | 'tv';
  screenSize: { width: number; height: number };
  pixelDensity: number;
  isLowEnd: boolean;
  hasNotch: boolean;
  orientation: 'portrait' | 'landscape';
  networkType: string;
  batteryLevel: number;
  memoryAvailable: number;
}

export interface PerformanceProfile {
  targetFPS: number;
  particleLimit: number;
  shadowsEnabled: boolean;
  postProcessingEnabled: boolean;
  textureQuality: 'low' | 'medium' | 'high';
  soundQuality: 'low' | 'medium' | 'high';
  maxConcurrentSounds: number;
  renderScale: number;
  asyncLoading: boolean;
}

export class DeviceCompatibility {
  private static instance: DeviceCompatibility;
  private deviceInfo: DeviceInfo;
  private performanceProfile: PerformanceProfile;
  private orientationListeners: Set<Function> = new Set();
  private memoryWarningLevel = 0;
  private frameDropThreshold = 3;
  private consecutiveFrameDrops = 0;

  private constructor() {
    this.deviceInfo = this.detectDevice();
    this.performanceProfile = this.calculatePerformanceProfile();
    this.setupListeners();
  }

  static getInstance(): DeviceCompatibility {
    if (!DeviceCompatibility.instance) {
      DeviceCompatibility.instance = new DeviceCompatibility();
    }
    return DeviceCompatibility.instance;
  }

  private detectDevice(): DeviceInfo {
    const { width, height } = Dimensions.get('window');
    const pixelDensity = PixelRatio.get();
    
    return {
      platform: Platform.OS as any,
      deviceType: this.getDeviceType(),
      screenSize: { width, height },
      pixelDensity,
      isLowEnd: this.isLowEndDevice(),
      hasNotch: this.hasNotch(),
      orientation: width > height ? 'landscape' : 'portrait',
      networkType: 'unknown',
      batteryLevel: 100,
      memoryAvailable: this.getAvailableMemory(),
    };
  }

  private getDeviceType(): 'phone' | 'tablet' | 'desktop' | 'tv' {
    if (Platform.OS === 'web') {
      const { width } = Dimensions.get('window');
      return width > 1024 ? 'desktop' : 'phone';
    }

    if (Platform.isTV) return 'tv';

    // For testing, check screen size to determine tablet
    const { width } = Dimensions.get('window');
    if (width >= 768) return 'tablet';
    
    return 'phone';
  }

  private isLowEndDevice(): boolean {
    // Check various indicators of low-end device
    const indicators = {
      lowMemory: this.getAvailableMemory() < 2048, // Less than 2GB
      oldOS: this.isOldOS(),
      lowPixelRatio: PixelRatio.get() < 2,
      smallScreen: Dimensions.get('window').width < 360,
    };

    // If 2 or more indicators are true, consider it low-end
    const lowEndCount = Object.values(indicators).filter(v => v).length;
    return lowEndCount >= 2;
  }

  private isOldOS(): boolean {
    if (Platform.OS === 'ios') {
      const version = Platform.Version ? Platform.Version.toString() : '14';
      return parseInt(version, 10) < 13;
    } else if (Platform.OS === 'android') {
      const version = Platform.Version || 28;
      return version < 26; // Android 8.0
    }
    return false;
  }

  private hasNotch(): boolean {
    if (Platform.OS === 'ios') {
      const { height } = Dimensions.get('window');
      // iPhone X and later have specific heights
      return [812, 844, 896, 926, 852, 932].includes(height);
    }
    return false;
  }

  private getAvailableMemory(): number {
    // This would use actual device APIs
    // For now, return a simulated value
    if (Platform.OS === 'web') {
      // @ts-ignore
      return (navigator.deviceMemory || 4) * 1024; // Convert GB to MB
    }
    return 4096; // Default 4GB
  }

  private calculatePerformanceProfile(): PerformanceProfile {
    const isLowEnd = this.deviceInfo.isLowEnd;
    const isTablet = this.deviceInfo.deviceType === 'tablet';
    const isDesktop = this.deviceInfo.deviceType === 'desktop';

    if (isLowEnd) {
      return {
        targetFPS: 30,
        particleLimit: 50,
        shadowsEnabled: false,
        postProcessingEnabled: false,
        textureQuality: 'low',
        soundQuality: 'low',
        maxConcurrentSounds: 3,
        renderScale: 0.75,
        asyncLoading: true,
      };
    }

    if (isDesktop) {
      return {
        targetFPS: 60,
        particleLimit: 500,
        shadowsEnabled: true,
        postProcessingEnabled: true,
        textureQuality: 'high',
        soundQuality: 'high',
        maxConcurrentSounds: 20,
        renderScale: 1.0,
        asyncLoading: false,
      };
    }

    if (isTablet) {
      return {
        targetFPS: 60,
        particleLimit: 200,
        shadowsEnabled: true,
        postProcessingEnabled: false,
        textureQuality: 'medium',
        soundQuality: 'medium',
        maxConcurrentSounds: 10,
        renderScale: 1.0,
        asyncLoading: false,
      };
    }

    // Default phone profile
    return {
      targetFPS: 60,
      particleLimit: 100,
      shadowsEnabled: false,
      postProcessingEnabled: false,
      textureQuality: 'medium',
      soundQuality: 'medium',
      maxConcurrentSounds: 5,
      renderScale: 1.0,
      asyncLoading: true,
    };
  }

  private setupListeners() {
    // Orientation change listener
    Dimensions.addEventListener('change', ({ window }) => {
      const orientation = window.width > window.height ? 'landscape' : 'portrait';
      if (orientation !== this.deviceInfo.orientation) {
        this.deviceInfo.orientation = orientation;
        this.handleOrientationChange(orientation);
      }
    });

    // Memory warning listener
    if (Platform.OS !== 'web') {
      eventBus.on('memory:warning', (data: { level: string }) => {
        this.handleMemoryWarning(data.level);
      });
    }

    // Performance monitoring
    this.startPerformanceMonitoring();
  }

  private handleOrientationChange(orientation: 'portrait' | 'landscape') {
    eventBus.emit('device:orientation:changed', { orientation });
    
    // Notify all listeners
    this.orientationListeners.forEach(listener => listener(orientation));

    // Adjust performance profile if needed
    if (orientation === 'landscape' && this.deviceInfo.isLowEnd) {
      // Reduce quality in landscape on low-end devices
      this.performanceProfile.renderScale = 0.6;
      this.performanceProfile.particleLimit = 30;
    }
  }

  private handleMemoryWarning(level: string) {
    this.memoryWarningLevel++;

    if (level === 'critical' || this.memoryWarningLevel > 2) {
      // Aggressively reduce memory usage
      this.performanceProfile.particleLimit = Math.floor(this.performanceProfile.particleLimit / 2);
      this.performanceProfile.textureQuality = 'low';
      this.performanceProfile.maxConcurrentSounds = 2;
      
      eventBus.emit('device:memory:critical', {
        action: 'reduce_quality',
        profile: this.performanceProfile,
      });
    }
  }

  private startPerformanceMonitoring() {
    let lastFrameTime = performance.now();
    
    const monitor = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastFrameTime;
      
      // Check for frame drops (more than 33ms for 30fps, 16ms for 60fps)
      const targetFrameTime = 1000 / this.performanceProfile.targetFPS;
      if (deltaTime > targetFrameTime * 1.5) {
        this.consecutiveFrameDrops++;
        
        if (this.consecutiveFrameDrops >= this.frameDropThreshold) {
          this.adjustPerformanceProfile();
          this.consecutiveFrameDrops = 0;
        }
      } else {
        this.consecutiveFrameDrops = 0;
      }
      
      lastFrameTime = currentTime;
      requestAnimationFrame(monitor);
    };
    
    if (Platform.OS === 'web' || Platform.OS === 'ios' || Platform.OS === 'android') {
      requestAnimationFrame(monitor);
    }
  }

  private adjustPerformanceProfile() {
    console.log('Performance drop detected, adjusting profile...');
    
    // Progressively reduce quality
    if (this.performanceProfile.particleLimit > 20) {
      this.performanceProfile.particleLimit = Math.floor(this.performanceProfile.particleLimit * 0.7);
    }
    
    if (this.performanceProfile.shadowsEnabled) {
      this.performanceProfile.shadowsEnabled = false;
    }
    
    if (this.performanceProfile.postProcessingEnabled) {
      this.performanceProfile.postProcessingEnabled = false;
    }
    
    if (this.performanceProfile.renderScale > 0.5) {
      this.performanceProfile.renderScale -= 0.1;
    }
    
    eventBus.emit('device:performance:adjusted', {
      profile: this.performanceProfile,
    });
  }

  // Platform-specific implementations
  getPlatformSpecificFeatures() {
    const features: any = {
      hapticFeedback: false,
      notifications: false,
      biometrics: false,
      nfc: false,
      ar: false,
      gamepad: false,
    };

    switch (this.deviceInfo.platform) {
      case 'ios':
        features.hapticFeedback = true;
        features.notifications = true;
        features.biometrics = true;
        const iosVersion = Platform.Version ? Platform.Version.toString() : '14';
        features.ar = parseInt(iosVersion, 10) >= 11;
        break;
      
      case 'android':
        features.hapticFeedback = true;
        features.notifications = true;
        const androidVersion = Platform.Version || 28;
        features.biometrics = androidVersion >= 23;
        features.nfc = true;
        break;
      
      case 'web':
        features.notifications = 'Notification' in window;
        features.gamepad = 'getGamepads' in navigator;
        break;
    }

    return features;
  }

  getOptimalImageSize(baseSize: number): number {
    const pixelRatio = this.deviceInfo.pixelDensity;
    const renderScale = this.performanceProfile.renderScale;
    
    // Adjust based on device capabilities
    if (this.deviceInfo.isLowEnd) {
      return Math.floor(baseSize * 0.75 * renderScale);
    }
    
    return Math.floor(baseSize * pixelRatio * renderScale);
  }

  getOptimalFontSize(baseSize: number): number {
    const { width } = this.deviceInfo.screenSize;
    const scale = PixelRatio.getFontScale();
    
    // Scale based on screen width
    const widthScale = width / 375; // iPhone 11 Pro as baseline
    
    // Apply limits
    const scaledSize = baseSize * scale * Math.min(Math.max(widthScale, 0.85), 1.15);
    
    return Math.round(scaledSize);
  }

  shouldUseAnimation(): boolean {
    return !this.deviceInfo.isLowEnd && this.performanceProfile.targetFPS >= 30;
  }

  shouldPreloadAssets(): boolean {
    // Preload on WiFi or high-end devices
    return !this.deviceInfo.isLowEnd || this.deviceInfo.networkType === 'wifi';
  }

  getSafeAreaInsets() {
    const insets = { top: 0, bottom: 0, left: 0, right: 0 };
    
    if (this.deviceInfo.hasNotch) {
      insets.top = 44;
      insets.bottom = 34;
    } else if (this.deviceInfo.platform === 'ios') {
      insets.top = 20;
    } else if (this.deviceInfo.platform === 'android') {
      insets.top = 24;
    }
    
    return insets;
  }

  // Storage helpers
  getStorageLimit(): number {
    // Return storage limit in MB based on device
    if (this.deviceInfo.isLowEnd) {
      return 50; // 50MB for low-end
    }
    
    if (this.deviceInfo.deviceType === 'desktop') {
      return 500; // 500MB for desktop
    }
    
    return 200; // 200MB default
  }

  // Network helpers
  getOptimalBatchSize(): number {
    // Determine optimal batch size for network requests
    if (this.deviceInfo.networkType === '2g' || this.deviceInfo.networkType === '3g') {
      return 5;
    }
    
    if (this.deviceInfo.isLowEnd) {
      return 10;
    }
    
    return 20;
  }

  // Public API
  getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  getPerformanceProfile(): PerformanceProfile {
    return this.performanceProfile;
  }

  onOrientationChange(callback: (orientation: 'portrait' | 'landscape') => void) {
    this.orientationListeners.add(callback);
    return () => this.orientationListeners.delete(callback);
  }

  updatePerformanceProfile(updates: Partial<PerformanceProfile>) {
    this.performanceProfile = { ...this.performanceProfile, ...updates };
    eventBus.emit('device:profile:updated', { profile: this.performanceProfile });
  }

  // Platform checks
  isIOS(): boolean {
    return this.deviceInfo.platform === 'ios';
  }

  isAndroid(): boolean {
    return this.deviceInfo.platform === 'android';
  }

  isWeb(): boolean {
    return this.deviceInfo.platform === 'web';
  }

  isPhone(): boolean {
    return this.deviceInfo.deviceType === 'phone';
  }

  isTablet(): boolean {
    return this.deviceInfo.deviceType === 'tablet';
  }

  isDesktop(): boolean {
    return this.deviceInfo.deviceType === 'desktop';
  }
}

export const deviceCompatibility = DeviceCompatibility.getInstance();