import { Platform, Dimensions } from 'react-native';
import * as Device from 'expo-device';

interface PerformanceSettings {
  particleEffects: boolean;
  shadowsEnabled: boolean;
  maxParticles: number;
  maxFallingItems: number;
  itemSpawnRate: number;
  animationQuality: 'low' | 'medium' | 'high' | 'ultra';
  renderDistance: number;
  physicsUpdateRate: number;
  backgroundEffects: boolean;
  trailEffects: boolean;
  screenShake: boolean;
  complexAnimations: boolean;
  autoOptimize: boolean;
  targetFPS: number;
  minFPS: number;
}

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  cpuUsage: number;
  gpuUsage: number;
  droppedFrames: number;
  averageFPS: number;
}

class PerformanceManager {
  private settings: PerformanceSettings;
  private metrics: PerformanceMetrics;
  private frameTimeHistory: number[] = [];
  private lastFrameTime: number = 0;
  private autoOptimizeEnabled: boolean = true;
  private deviceTier: 'low' | 'medium' | 'high' | 'ultra';
  private screenScale: number = 1;

  constructor() {
    this.deviceTier = this.detectDeviceTier();
    this.settings = this.getDefaultSettings(this.deviceTier);
    this.metrics = this.getDefaultMetrics();
    this.initializePerformanceMonitoring();
  }

  private detectDeviceTier(): 'low' | 'medium' | 'high' | 'ultra' {
    if (Platform.OS === 'web') {
      // Web performance detection
      const cores = navigator.hardwareConcurrency || 2;
      const memory = (navigator as any).deviceMemory || 2;

      if (cores >= 8 && memory >= 8) return 'ultra';
      if (cores >= 4 && memory >= 4) return 'high';
      if (cores >= 2 && memory >= 2) return 'medium';
      return 'low';
    }

    // Mobile device detection
    const totalMemory = Device.totalMemory || 2 * 1024 * 1024 * 1024;
    const memoryGB = totalMemory / (1024 * 1024 * 1024);
    const deviceYear = Device.deviceYearClass || 2018;

    // Get screen dimensions for additional context
    const { width, height } = Dimensions.get('window');
    const screenPixels = width * height;

    // Ultra tier: Latest high-end devices
    if (memoryGB >= 6 && deviceYear >= 2022 && screenPixels > 2000000) {
      return 'ultra';
    }

    // High tier: Recent flagship devices
    if (memoryGB >= 4 && deviceYear >= 2020 && screenPixels > 1500000) {
      return 'high';
    }

    // Medium tier: Mid-range devices
    if (memoryGB >= 2 && deviceYear >= 2018) {
      return 'medium';
    }

    // Low tier: Older or budget devices
    return 'low';
  }

  private getDefaultSettings(tier: 'low' | 'medium' | 'high' | 'ultra'): PerformanceSettings {
    const settings: { [key: string]: PerformanceSettings } = {
      low: {
        particleEffects: false,
        shadowsEnabled: false,
        maxParticles: 10,
        maxFallingItems: 5,
        itemSpawnRate: 2.0,
        animationQuality: 'low',
        renderDistance: 100,
        physicsUpdateRate: 30,
        backgroundEffects: false,
        trailEffects: false,
        screenShake: false,
        complexAnimations: false,
        autoOptimize: true,
        targetFPS: 30,
        minFPS: 20,
      },
      medium: {
        particleEffects: true,
        shadowsEnabled: false,
        maxParticles: 25,
        maxFallingItems: 8,
        itemSpawnRate: 1.5,
        animationQuality: 'medium',
        renderDistance: 150,
        physicsUpdateRate: 45,
        backgroundEffects: true,
        trailEffects: false,
        screenShake: true,
        complexAnimations: false,
        autoOptimize: true,
        targetFPS: 45,
        minFPS: 30,
      },
      high: {
        particleEffects: true,
        shadowsEnabled: true,
        maxParticles: 50,
        maxFallingItems: 12,
        itemSpawnRate: 1.2,
        animationQuality: 'high',
        renderDistance: 200,
        physicsUpdateRate: 60,
        backgroundEffects: true,
        trailEffects: true,
        screenShake: true,
        complexAnimations: true,
        autoOptimize: false,
        targetFPS: 60,
        minFPS: 45,
      },
      ultra: {
        particleEffects: true,
        shadowsEnabled: true,
        maxParticles: 100,
        maxFallingItems: 15,
        itemSpawnRate: 1.0,
        animationQuality: 'ultra',
        renderDistance: 300,
        physicsUpdateRate: 120,
        backgroundEffects: true,
        trailEffects: true,
        screenShake: true,
        complexAnimations: true,
        autoOptimize: false,
        targetFPS: 120,
        minFPS: 60,
      },
    };

    return settings[tier];
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      cpuUsage: 0,
      gpuUsage: 0,
      droppedFrames: 0,
      averageFPS: 60,
    };
  }

  private initializePerformanceMonitoring() {
    if (Platform.OS === 'web') {
      // Use requestAnimationFrame for FPS monitoring
      let lastTime = performance.now();
      const measureFPS = () => {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        this.updateFrameMetrics(deltaTime);

        if (this.autoOptimizeEnabled) {
          this.checkAndOptimize();
        }

        requestAnimationFrame(measureFPS);
      };
      requestAnimationFrame(measureFPS);
    } else {
      // Mobile performance monitoring
      setInterval(() => {
        if (this.autoOptimizeEnabled) {
          this.checkAndOptimize();
        }
      }, 1000);
    }
  }

  private updateFrameMetrics(deltaTime: number) {
    const fps = 1000 / deltaTime;
    this.frameTimeHistory.push(deltaTime);

    // Keep only last 60 frames
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }

    // Update metrics
    this.metrics.fps = fps;
    this.metrics.frameTime = deltaTime;
    this.metrics.averageFPS =
      1000 / (this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length);

    // Count dropped frames (> 33ms for 30fps target)
    if (deltaTime > 33) {
      this.metrics.droppedFrames++;
    }
  }

  private checkAndOptimize() {
    if (!this.settings.autoOptimize) return;

    const avgFPS = this.metrics.averageFPS;
    const targetFPS = this.settings.targetFPS;
    const minFPS = this.settings.minFPS;

    // Performance is too low, reduce quality
    if (avgFPS < minFPS) {
      this.reduceQuality();
    }
    // Performance is good, can increase quality
    else if (avgFPS > targetFPS * 1.2 && this.metrics.droppedFrames < 5) {
      this.increaseQuality();
    }

    // Reset dropped frames counter
    this.metrics.droppedFrames = 0;
  }

  private reduceQuality() {
    // Reduce settings progressively
    if (this.settings.complexAnimations) {
      this.settings.complexAnimations = false;
      return;
    }
    if (this.settings.trailEffects) {
      this.settings.trailEffects = false;
      return;
    }
    if (this.settings.screenShake) {
      this.settings.screenShake = false;
      return;
    }
    if (this.settings.shadowsEnabled) {
      this.settings.shadowsEnabled = false;
      return;
    }
    if (this.settings.maxParticles > 10) {
      this.settings.maxParticles = Math.max(10, Math.floor(this.settings.maxParticles * 0.75));
      return;
    }
    if (this.settings.maxFallingItems > 5) {
      this.settings.maxFallingItems = Math.max(5, this.settings.maxFallingItems - 1);
      return;
    }
    if (this.settings.particleEffects) {
      this.settings.particleEffects = false;
      return;
    }
    if (this.settings.backgroundEffects) {
      this.settings.backgroundEffects = false;
      return;
    }

    // Last resort: reduce physics update rate
    if (this.settings.physicsUpdateRate > 30) {
      this.settings.physicsUpdateRate = Math.max(30, this.settings.physicsUpdateRate - 15);
    }
  }

  private increaseQuality() {
    // Only increase if we've been stable for a while
    if (this.frameTimeHistory.length < 60) return;

    // Increase settings progressively (reverse of reduce)
    if (this.settings.physicsUpdateRate < 60) {
      this.settings.physicsUpdateRate = Math.min(60, this.settings.physicsUpdateRate + 15);
      return;
    }
    if (!this.settings.backgroundEffects && this.deviceTier !== 'low') {
      this.settings.backgroundEffects = true;
      return;
    }
    if (!this.settings.particleEffects && this.deviceTier !== 'low') {
      this.settings.particleEffects = true;
      return;
    }
    if (this.settings.maxFallingItems < 12 && this.deviceTier !== 'low') {
      this.settings.maxFallingItems = Math.min(12, this.settings.maxFallingItems + 1);
      return;
    }
    if (this.settings.maxParticles < 50 && this.deviceTier !== 'low') {
      this.settings.maxParticles = Math.min(50, Math.floor(this.settings.maxParticles * 1.25));
      return;
    }
    if (
      !this.settings.shadowsEnabled &&
      (this.deviceTier === 'high' || this.deviceTier === 'ultra')
    ) {
      this.settings.shadowsEnabled = true;
      return;
    }
    if (!this.settings.screenShake && this.deviceTier !== 'low') {
      this.settings.screenShake = true;
      return;
    }
    if (
      !this.settings.trailEffects &&
      (this.deviceTier === 'high' || this.deviceTier === 'ultra')
    ) {
      this.settings.trailEffects = true;
      return;
    }
    if (
      !this.settings.complexAnimations &&
      (this.deviceTier === 'high' || this.deviceTier === 'ultra')
    ) {
      this.settings.complexAnimations = true;
      return;
    }
  }

  // Public methods
  public getSettings(): PerformanceSettings {
    return { ...this.settings };
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public setQuality(quality: 'low' | 'medium' | 'high' | 'ultra' | 'auto') {
    if (quality === 'auto') {
      this.settings = this.getDefaultSettings(this.deviceTier);
      this.settings.autoOptimize = true;
    } else {
      this.settings = this.getDefaultSettings(quality);
      this.settings.autoOptimize = false;
    }
  }

  public setAutoOptimize(enabled: boolean) {
    this.settings.autoOptimize = enabled;
    this.autoOptimizeEnabled = enabled;
  }

  public shouldRenderParticle(): boolean {
    return this.settings.particleEffects && Math.random() < this.settings.maxParticles / 100;
  }

  public shouldRenderShadow(): boolean {
    return this.settings.shadowsEnabled;
  }

  public shouldRenderTrail(): boolean {
    return this.settings.trailEffects;
  }

  public shouldRenderBackground(): boolean {
    return this.settings.backgroundEffects;
  }

  public shouldUseScreenShake(): boolean {
    return this.settings.screenShake;
  }

  public shouldUseComplexAnimation(): boolean {
    return this.settings.complexAnimations;
  }

  public getMaxFallingItems(): number {
    return this.settings.maxFallingItems;
  }

  public getItemSpawnRate(): number {
    return this.settings.itemSpawnRate;
  }

  public getPhysicsUpdateRate(): number {
    return this.settings.physicsUpdateRate;
  }

  public getAnimationConfig() {
    const configs = {
      low: {
        duration: 500,
        useNativeDriver: true,
        fps: 30,
      },
      medium: {
        duration: 400,
        useNativeDriver: true,
        fps: 45,
      },
      high: {
        duration: 300,
        useNativeDriver: true,
        fps: 60,
      },
      ultra: {
        duration: 250,
        useNativeDriver: true,
        fps: 120,
      },
    };

    return configs[this.settings.animationQuality];
  }

  public getDeviceTier(): string {
    return this.deviceTier;
  }

  public getPerformanceReport(): string {
    return `
Performance Report:
Device Tier: ${this.deviceTier}
Current FPS: ${this.metrics.fps.toFixed(1)}
Average FPS: ${this.metrics.averageFPS.toFixed(1)}
Dropped Frames: ${this.metrics.droppedFrames}
Quality: ${this.settings.animationQuality}
Auto-Optimize: ${this.settings.autoOptimize ? 'Enabled' : 'Disabled'}
Particles: ${this.settings.particleEffects ? 'On' : 'Off'}
Shadows: ${this.settings.shadowsEnabled ? 'On' : 'Off'}
Max Items: ${this.settings.maxFallingItems}
    `.trim();
  }

  // Memory management
  public requestGarbageCollection() {
    if (Platform.OS === 'web' && (window as any).gc) {
      (window as any).gc();
    }
  }

  public clearCache() {
    this.frameTimeHistory = [];
    this.metrics.droppedFrames = 0;
  }

  // Adaptive resolution scaling for web
  public getResolutionScale(): number {
    if (Platform.OS !== 'web') return 1;

    // Scale resolution based on performance
    if (this.metrics.averageFPS < this.settings.minFPS) {
      return Math.max(0.5, this.screenScale - 0.1);
    } else if (this.metrics.averageFPS > this.settings.targetFPS * 1.2) {
      return Math.min(1, this.screenScale + 0.05);
    }

    return this.screenScale;
  }

  public updateResolutionScale(scale: number) {
    this.screenScale = Math.max(0.5, Math.min(1, scale));
  }
}

export const performanceManager = new PerformanceManager();
