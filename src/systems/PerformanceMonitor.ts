import { Platform } from 'react-native';
import { eventBus } from '../core/EventBus';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  networkLatency: number;
  errorRate: number;
  sessionDuration: number;
}

interface PerformanceThresholds {
  minFPS: number;
  maxMemoryMB: number;
  maxRenderTimeMs: number;
  maxNetworkLatencyMs: number;
  maxErrorRate: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private thresholds: PerformanceThresholds;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private sessionStartTime: number;
  private errorCount: number = 0;
  private warningCount: number = 0;
  private isMonitoring: boolean = false;
  private performanceObserver: PerformanceObserver | null = null;

  private constructor() {
    this.sessionStartTime = Date.now();

    this.metrics = {
      fps: 60,
      memoryUsage: 0,
      renderTime: 0,
      networkLatency: 0,
      errorRate: 0,
      sessionDuration: 0,
    };

    this.thresholds = {
      minFPS: 30,
      maxMemoryMB: 200,
      maxRenderTimeMs: 16.67, // 60 FPS target
      maxNetworkLatencyMs: 1000,
      maxErrorRate: 0.05, // 5% error rate
    };

    this.setupPerformanceObserver();
    this.startMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private setupPerformanceObserver(): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              this.metrics.renderTime = entry.duration;
            }
          }
        });

        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitorFPS();
    this.monitorMemory();
    this.monitorNetwork();

    // Send metrics every 5 seconds
    setInterval(() => {
      this.reportMetrics();
    }, 5000);
  }

  private monitorFPS(): void {
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      if (!this.isMonitoring) return;

      frames++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;

        // Adjust quality if FPS is low
        if (this.metrics.fps < this.thresholds.minFPS) {
          this.optimizePerformance();
        }
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  private monitorMemory(): void {
    if (Platform.OS === 'web' && (performance as any).memory) {
      setInterval(() => {
        const memoryInfo = (performance as any).memory;
        this.metrics.memoryUsage = Math.round(memoryInfo.usedJSHeapSize / 1048576); // Convert to MB

        if (this.metrics.memoryUsage > this.thresholds.maxMemoryMB) {
          this.handleMemoryPressure();
        }
      }, 2000);
    }
  }

  private monitorNetwork(): void {
    // Monitor network requests
    if (Platform.OS === 'web') {
      const originalFetch = window.fetch;

      window.fetch = async (...args) => {
        const startTime = performance.now();

        try {
          const response = await originalFetch(...args);
          const endTime = performance.now();
          this.metrics.networkLatency = Math.round(endTime - startTime);
          return response;
        } catch (error) {
          this.errorCount++;
          throw error;
        }
      };
    }
  }

  private optimizePerformance(): void {
    // Emit event to reduce quality settings
    eventBus.emit('performance:low', {
      fps: this.metrics.fps,
      suggestion: 'reduce_quality',
    });

    // Specific optimizations
    if (Platform.OS === 'web') {
      // Reduce particle effects
      eventBus.emit('settings:update', {
        particleEffects: false,
        shadows: false,
        animations: 'reduced',
      });
    }
  }

  private handleMemoryPressure(): void {
    // Clear caches and unused resources
    eventBus.emit('memory:pressure', {
      usage: this.metrics.memoryUsage,
      threshold: this.thresholds.maxMemoryMB,
    });

    // Force garbage collection if available
    if (typeof (global as any).gc === 'function') {
      (global as any).gc();
    }
  }

  private reportMetrics(): void {
    this.metrics.sessionDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);
    this.metrics.errorRate = (this.errorCount / Math.max(1, this.frameCount)) * 100;

    // Emit metrics for analytics
    eventBus.emit('performance:metrics', this.metrics);

    // Log to console in development
    if (__DEV__) {
      console.log('Performance Metrics:', {
        FPS: this.metrics.fps,
        Memory: `${this.metrics.memoryUsage}MB`,
        RenderTime: `${this.metrics.renderTime.toFixed(2)}ms`,
        Network: `${this.metrics.networkLatency}ms`,
        ErrorRate: `${this.metrics.errorRate.toFixed(2)}%`,
        Session: `${this.metrics.sessionDuration}s`,
      });
    }
  }

  // Public API
  recordError(error: Error): void {
    this.errorCount++;

    eventBus.emit('error:recorded', {
      error: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    });
  }

  recordWarning(message: string): void {
    this.warningCount++;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  isPerformanceGood(): boolean {
    return (
      this.metrics.fps >= this.thresholds.minFPS &&
      this.metrics.memoryUsage <= this.thresholds.maxMemoryMB &&
      this.metrics.renderTime <= this.thresholds.maxRenderTimeMs &&
      this.metrics.networkLatency <= this.thresholds.maxNetworkLatencyMs &&
      this.metrics.errorRate <= this.thresholds.maxErrorRate
    );
  }

  getPerformanceScore(): number {
    // Calculate performance score from 0 to 100
    let score = 100;

    // FPS impact (40% weight)
    const fpsScore = Math.min(100, (this.metrics.fps / 60) * 100);
    score = score * 0.6 + fpsScore * 0.4;

    // Memory impact (20% weight)
    const memoryScore = Math.max(
      0,
      100 - (this.metrics.memoryUsage / this.thresholds.maxMemoryMB) * 100
    );
    score = score * 0.8 + memoryScore * 0.2;

    // Network impact (20% weight)
    const networkScore = Math.max(
      0,
      100 - (this.metrics.networkLatency / this.thresholds.maxNetworkLatencyMs) * 100
    );
    score = score * 0.8 + networkScore * 0.2;

    // Error rate impact (20% weight)
    const errorScore = Math.max(0, 100 - this.metrics.errorRate * 20);
    score = score * 0.8 + errorScore * 0.2;

    return Math.round(score);
  }

  destroy(): void {
    this.isMonitoring = false;

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
