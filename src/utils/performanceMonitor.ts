import { Platform, InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceInfoManager } from './deviceInfo';

/**
 * Performance Monitoring System
 * Tracks and optimizes app performance based on real-time metrics
 */

export interface PerformanceMetrics {
  fps: number;
  jsFrameRate: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  imageLoadTimes: Map<string, number>;
  screenTransitionTimes: Map<string, number>;
  averageRenderTime: number;
  droppedFrames: number;
  gcCount: number;
  timestamp: number;
}

export interface PerformanceReport {
  sessionId: string;
  deviceId: string;
  startTime: number;
  endTime: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  totalDroppedFrames: number;
  averageMemoryUsage: number;
  peakMemoryUsage: number;
  averageImageLoadTime: number;
  slowestImageLoad: { uri: string; time: number } | null;
  screenMetrics: Map<string, ScreenPerformance>;
  criticalIssues: string[];
  recommendations: string[];
}

export interface ScreenPerformance {
  screenName: string;
  averageRenderTime: number;
  visitCount: number;
  totalTime: number;
  errors: number;
}

interface ImageLoadMetric {
  uri: string;
  startTime: number;
  endTime?: number;
  size?: number;
  cached: boolean;
  failed?: boolean;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  private metrics: PerformanceMetrics;
  private historicalMetrics: PerformanceMetrics[] = [];
  private imageLoadMetrics: Map<string, ImageLoadMetric> = new Map();
  private screenMetrics: Map<string, ScreenPerformance> = new Map();
  private sessionStartTime: number = Date.now();
  private frameCallbackId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private isMonitoring: boolean = false;
  
  // Performance thresholds
  private readonly FPS_THRESHOLD_GOOD = 55;
  private readonly FPS_THRESHOLD_ACCEPTABLE = 30;
  private readonly MEMORY_THRESHOLD_WARNING = 0.8; // 80% of available memory
  private readonly IMAGE_LOAD_THRESHOLD = 1000; // 1 second
  private readonly RENDER_TIME_THRESHOLD = 16; // 16ms for 60fps
  
  private constructor() {
    this.metrics = this.createEmptyMetrics();
    this.startMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private createEmptyMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      jsFrameRate: 60,
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0,
      imageLoadTimes: new Map(),
      screenTransitionTimes: new Map(),
      averageRenderTime: 0,
      droppedFrames: 0,
      gcCount: 0,
      timestamp: Date.now(),
    };
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    
    // Start FPS monitoring
    this.monitorFPS();
    
    // Monitor memory if available
    this.monitorMemory();
    
    // Set up periodic metrics collection
    this.scheduleMetricsCollection();
  }

  private monitorFPS(): void {
    const measureFrame = () => {
      if (!this.isMonitoring) return;
      
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastFrameTime;
      
      if (deltaTime > 0) {
        const instantFPS = 1000 / deltaTime;
        
        // Update FPS with exponential moving average
        this.metrics.fps = this.metrics.fps * 0.9 + instantFPS * 0.1;
        
        // Track dropped frames (frame took longer than 16.67ms)
        if (deltaTime > this.RENDER_TIME_THRESHOLD) {
          this.metrics.droppedFrames++;
        }
        
        this.frameCount++;
      }
      
      this.lastFrameTime = currentTime;
      
      // Schedule next frame
      if (this.isMonitoring) {
        requestAnimationFrame(measureFrame);
      }
    };
    
    requestAnimationFrame(measureFrame);
  }

  private monitorMemory(): void {
    if (Platform.OS === 'web') {
      // Web memory monitoring
      if ('memory' in performance) {
        setInterval(() => {
          const memory = (performance as any).memory;
          if (memory) {
            this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
          }
        }, 1000);
      }
    } else {
      // React Native memory monitoring would require native module
      // For now, we'll estimate based on device profile
      const deviceProfile = deviceInfoManager.getDeviceProfile();
      if (deviceProfile.totalMemory) {
        // Estimate memory usage based on performance tier
        const baseUsage = deviceProfile.performanceTier === 'low' ? 0.6 : 0.3;
        this.metrics.memoryUsage = baseUsage + (Math.random() * 0.2);
      }
    }
  }

  private scheduleMetricsCollection(): void {
    setInterval(() => {
      this.collectMetrics();
    }, 5000); // Collect every 5 seconds
  }

  private collectMetrics(): void {
    const currentMetrics = { ...this.metrics, timestamp: Date.now() };
    this.historicalMetrics.push(currentMetrics);
    
    // Keep only last 100 metrics (about 8 minutes of data)
    if (this.historicalMetrics.length > 100) {
      this.historicalMetrics.shift();
    }
    
    // Check for performance issues
    this.detectPerformanceIssues();
    
    // Auto-adjust quality if needed
    this.autoAdjustQuality();
  }

  private detectPerformanceIssues(): void {
    const issues: string[] = [];
    
    // Check FPS
    if (this.metrics.fps < this.FPS_THRESHOLD_ACCEPTABLE) {
      issues.push(`Low FPS detected: ${this.metrics.fps.toFixed(1)}`);
    }
    
    // Check memory
    if (this.metrics.memoryUsage > this.MEMORY_THRESHOLD_WARNING) {
      issues.push(`High memory usage: ${(this.metrics.memoryUsage * 100).toFixed(1)}%`);
    }
    
    // Check dropped frames
    if (this.metrics.droppedFrames > 100) {
      issues.push(`Excessive frame drops: ${this.metrics.droppedFrames}`);
    }
    
    // Log issues
    if (issues.length > 0) {
      console.warn('Performance issues detected:', issues);
      this.triggerPerformanceOptimization();
    }
  }

  private triggerPerformanceOptimization(): void {
    // Notify the app to reduce quality settings
    const deviceProfile = deviceInfoManager.getDeviceProfile();
    
    if (this.metrics.fps < this.FPS_THRESHOLD_ACCEPTABLE) {
      // Critical performance issue - reduce quality immediately
      console.log('Triggering emergency quality reduction');
      
      // Clear image cache to free memory
      if (this.metrics.memoryUsage > this.MEMORY_THRESHOLD_WARNING) {
        this.clearImageCache();
      }
    }
  }

  private autoAdjustQuality(): void {
    const avgFPS = this.getAverageFPS();
    const deviceProfile = deviceInfoManager.getDeviceProfile();
    
    // Don't adjust if device is high-end and performing well
    if (deviceProfile.performanceTier === 'ultra' && avgFPS > this.FPS_THRESHOLD_GOOD) {
      return;
    }
    
    // Suggest quality adjustments based on performance
    if (avgFPS < this.FPS_THRESHOLD_ACCEPTABLE) {
      // Performance is poor, reduce quality
      this.saveQualityPreference('low');
    } else if (avgFPS < this.FPS_THRESHOLD_GOOD) {
      // Performance is acceptable but not great
      this.saveQualityPreference('medium');
    } else {
      // Performance is good, can increase quality
      const currentTier = deviceProfile.performanceTier;
      if (currentTier === 'high' || currentTier === 'ultra') {
        this.saveQualityPreference('high');
      }
    }
  }

  private async saveQualityPreference(quality: string): Promise<void> {
    try {
      await AsyncStorage.setItem('@performance_quality', quality);
    } catch (error) {
      console.error('Failed to save quality preference:', error);
    }
  }

  private async clearImageCache(): Promise<void> {
    try {
      // This would call the image cache clearing function
      console.log('Clearing image cache to free memory');
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  }

  // Public API

  startImageLoad(uri: string, cached: boolean = false): void {
    this.imageLoadMetrics.set(uri, {
      uri,
      startTime: performance.now(),
      cached,
    });
  }

  endImageLoad(uri: string, success: boolean = true): void {
    const metric = this.imageLoadMetrics.get(uri);
    if (metric) {
      metric.endTime = performance.now();
      metric.failed = !success;
      
      const loadTime = metric.endTime - metric.startTime;
      this.metrics.imageLoadTimes.set(uri, loadTime);
      
      // Warn if load time is too high
      if (loadTime > this.IMAGE_LOAD_THRESHOLD && !metric.cached) {
        console.warn(`Slow image load: ${uri} took ${loadTime.toFixed(0)}ms`);
      }
    }
  }

  trackScreenTransition(fromScreen: string, toScreen: string, duration: number): void {
    const key = `${fromScreen}->${toScreen}`;
    this.metrics.screenTransitionTimes.set(key, duration);
    
    // Update screen metrics
    if (!this.screenMetrics.has(toScreen)) {
      this.screenMetrics.set(toScreen, {
        screenName: toScreen,
        averageRenderTime: duration,
        visitCount: 1,
        totalTime: duration,
        errors: 0,
      });
    } else {
      const metric = this.screenMetrics.get(toScreen)!;
      metric.visitCount++;
      metric.totalTime += duration;
      metric.averageRenderTime = metric.totalTime / metric.visitCount;
    }
  }

  trackScreenError(screenName: string): void {
    const metric = this.screenMetrics.get(screenName);
    if (metric) {
      metric.errors++;
    }
  }

  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getAverageFPS(): number {
    if (this.historicalMetrics.length === 0) return this.metrics.fps;
    
    const sum = this.historicalMetrics.reduce((acc, m) => acc + m.fps, 0);
    return sum / this.historicalMetrics.length;
  }

  getPerformanceScore(): number {
    const fpsScore = Math.min(this.metrics.fps / 60, 1) * 40;
    const memoryScore = (1 - this.metrics.memoryUsage) * 30;
    const droppedFrameScore = Math.max(0, 1 - (this.metrics.droppedFrames / 1000)) * 30;
    
    return Math.round(fpsScore + memoryScore + droppedFrameScore);
  }

  generateReport(): PerformanceReport {
    const now = Date.now();
    const fpsSamples = this.historicalMetrics.map(m => m.fps);
    const memorySamples = this.historicalMetrics.map(m => m.memoryUsage);
    
    // Calculate image load statistics
    let totalImageLoadTime = 0;
    let slowestLoad: { uri: string; time: number } | null = null;
    
    this.metrics.imageLoadTimes.forEach((time, uri) => {
      totalImageLoadTime += time;
      if (!slowestLoad || time > slowestLoad.time) {
        slowestLoad = { uri, time };
      }
    });
    
    const avgImageLoadTime = this.metrics.imageLoadTimes.size > 0
      ? totalImageLoadTime / this.metrics.imageLoadTimes.size
      : 0;
    
    // Generate recommendations
    const recommendations = this.generateRecommendations();
    
    return {
      sessionId: `session_${this.sessionStartTime}`,
      deviceId: deviceInfoManager.getDeviceProfile().deviceId,
      startTime: this.sessionStartTime,
      endTime: now,
      averageFPS: this.getAverageFPS(),
      minFPS: Math.min(...fpsSamples),
      maxFPS: Math.max(...fpsSamples),
      totalDroppedFrames: this.metrics.droppedFrames,
      averageMemoryUsage: memorySamples.reduce((a, b) => a + b, 0) / memorySamples.length,
      peakMemoryUsage: Math.max(...memorySamples),
      averageImageLoadTime: avgImageLoadTime,
      slowestImageLoad: slowestLoad,
      screenMetrics: new Map(this.screenMetrics),
      criticalIssues: this.detectCriticalIssues(),
      recommendations,
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const avgFPS = this.getAverageFPS();
    const deviceProfile = deviceInfoManager.getDeviceProfile();
    
    if (avgFPS < this.FPS_THRESHOLD_ACCEPTABLE) {
      recommendations.push('Reduce image quality to improve performance');
      recommendations.push('Disable animations and transitions');
      recommendations.push('Clear app cache and restart');
    } else if (avgFPS < this.FPS_THRESHOLD_GOOD) {
      recommendations.push('Consider reducing visual effects');
      recommendations.push('Limit concurrent image loads');
    }
    
    if (this.metrics.memoryUsage > this.MEMORY_THRESHOLD_WARNING) {
      recommendations.push('Close other apps to free memory');
      recommendations.push('Reduce cache size in settings');
    }
    
    if (deviceProfile.batteryLevel && deviceProfile.batteryLevel < 0.2) {
      recommendations.push('Enable low power mode for better battery life');
    }
    
    if (deviceProfile.networkQuality === 'poor') {
      recommendations.push('Download assets on WiFi for better performance');
    }
    
    return recommendations;
  }

  private detectCriticalIssues(): string[] {
    const issues: string[] = [];
    
    if (this.metrics.fps < 20) {
      issues.push('Severe frame rate issues detected');
    }
    
    if (this.metrics.memoryUsage > 0.95) {
      issues.push('Critical memory pressure');
    }
    
    if (this.metrics.droppedFrames > 500) {
      issues.push('Excessive frame drops affecting gameplay');
    }
    
    const slowScreens = Array.from(this.screenMetrics.values())
      .filter(s => s.averageRenderTime > 1000);
    
    if (slowScreens.length > 0) {
      issues.push(`Slow screens: ${slowScreens.map(s => s.screenName).join(', ')}`);
    }
    
    return issues;
  }

  async saveReport(): Promise<void> {
    const report = this.generateReport();
    try {
      await AsyncStorage.setItem(
        `@performance_report_${Date.now()}`,
        JSON.stringify(report)
      );
    } catch (error) {
      console.error('Failed to save performance report:', error);
    }
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    this.saveReport();
  }

  reset(): void {
    this.metrics = this.createEmptyMetrics();
    this.historicalMetrics = [];
    this.imageLoadMetrics.clear();
    this.screenMetrics.clear();
    this.frameCount = 0;
    this.sessionStartTime = Date.now();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience hooks for React components
export function usePerformanceTracking(screenName: string) {
  const startTime = React.useRef(performance.now());
  
  React.useEffect(() => {
    const duration = performance.now() - startTime.current;
    performanceMonitor.trackScreenTransition('previous', screenName, duration);
    
    return () => {
      // Track when leaving screen
      const timeOnScreen = performance.now() - startTime.current;
      const metric = performanceMonitor.screenMetrics.get(screenName);
      if (metric) {
        metric.totalTime += timeOnScreen;
      }
    };
  }, [screenName]);
}

export function useImageLoadTracking(uri: string, cached: boolean = false) {
  React.useEffect(() => {
    performanceMonitor.startImageLoad(uri, cached);
    
    return () => {
      performanceMonitor.endImageLoad(uri);
    };
  }, [uri, cached]);
}