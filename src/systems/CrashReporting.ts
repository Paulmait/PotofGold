import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { telemetrySystem, EventType } from './TelemetrySystem';
import { deviceInfoManager } from '../utils/deviceInfo';
import { performanceMonitor } from '../utils/performanceMonitor';

/**
 * Advanced Crash Reporting & Recovery System
 * Comprehensive error tracking with automatic recovery mechanisms
 */

export interface CrashReport {
  id: string;
  timestamp: number;
  type: CrashType;
  error: {
    name: string;
    message: string;
    stack?: string;
    componentStack?: string;
  };
  context: {
    userId?: string;
    sessionId: string;
    screen: string;
    action: string;
    deviceInfo: any;
    performance: any;
    memory: {
      used: number;
      limit: number;
      available: number;
    };
    network: {
      online: boolean;
      type: string;
      quality: string;
    };
    gameState: {
      level: number;
      score: number;
      currency: Record<string, number>;
      difficulty: string;
    };
  };
  breadcrumbs: Breadcrumb[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recovered: boolean;
  recoveryAttempts: number;
  tags: Record<string, string>;
}

export interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

export enum CrashType {
  JAVASCRIPT_ERROR = 'javascript_error',
  UNHANDLED_PROMISE = 'unhandled_promise',
  NATIVE_CRASH = 'native_crash',
  ANR = 'anr', // Application Not Responding
  OOM = 'out_of_memory',
  NETWORK_ERROR = 'network_error',
  STORAGE_ERROR = 'storage_error',
  GRAPHICS_ERROR = 'graphics_error',
  AUDIO_ERROR = 'audio_error',
  PERMISSION_ERROR = 'permission_error'
}

interface RecoveryStrategy {
  type: CrashType;
  maxAttempts: number;
  strategy: (error: Error, context: any) => Promise<boolean>;
  fallback: () => void;
}

interface SessionHealth {
  crashCount: number;
  errorCount: number;
  warningCount: number;
  memoryLeaks: number;
  performanceIssues: number;
  networkFailures: number;
  healthScore: number; // 0-100
}

class CrashReportingSystem {
  private static instance: CrashReportingSystem;
  
  private crashes: CrashReport[] = [];
  private breadcrumbs: Breadcrumb[] = [];
  private sessionHealth: SessionHealth;
  private recoveryStrategies: Map<CrashType, RecoveryStrategy>;
  private isInitialized: boolean = false;
  
  // Configuration
  private readonly MAX_BREADCRUMBS = 50;
  private readonly MAX_STORED_CRASHES = 20;
  private readonly STORAGE_KEY = '@crash_reports';
  private readonly BREADCRUMBS_KEY = '@breadcrumbs';
  private readonly HEALTH_KEY = '@session_health';
  
  // State tracking
  private currentScreen: string = 'unknown';
  private currentAction: string = 'idle';
  private lastError: Error | null = null;
  private errorCount: number = 0;
  private isRecovering: boolean = false;
  
  // Performance monitoring
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private anrDetectionTimer: NodeJS.Timeout | null = null;
  private lastInteractionTime: number = Date.now();
  
  private constructor() {
    this.sessionHealth = this.getDefaultSessionHealth();
    this.recoveryStrategies = this.initializeRecoveryStrategies();
  }
  
  static getInstance(): CrashReportingSystem {
    if (!CrashReportingSystem.instance) {
      CrashReportingSystem.instance = new CrashReportingSystem();
    }
    return CrashReportingSystem.instance;
  }
  
  private getDefaultSessionHealth(): SessionHealth {
    return {
      crashCount: 0,
      errorCount: 0,
      warningCount: 0,
      memoryLeaks: 0,
      performanceIssues: 0,
      networkFailures: 0,
      healthScore: 100
    };
  }
  
  private initializeRecoveryStrategies(): Map<CrashType, RecoveryStrategy> {
    const strategies = new Map<CrashType, RecoveryStrategy>();
    
    // JavaScript Error Recovery
    strategies.set(CrashType.JAVASCRIPT_ERROR, {
      type: CrashType.JAVASCRIPT_ERROR,
      maxAttempts: 3,
      strategy: async (error: Error) => {
        try {
          // Clear corrupted state
          await this.clearCorruptedState();
          
          // Reload critical systems
          await this.reloadCriticalSystems();
          
          return true;
        } catch (recoveryError) {
          console.error('JS Error recovery failed:', recoveryError);
          return false;
        }
      },
      fallback: () => {
        this.showErrorBoundary('Application encountered an error. Please restart.');
      }
    });
    
    // Memory Error Recovery
    strategies.set(CrashType.OOM, {
      type: CrashType.OOM,
      maxAttempts: 2,
      strategy: async () => {
        try {
          // Clear caches
          await this.clearMemoryCaches();
          
          // Reduce quality settings
          await this.enableLowMemoryMode();
          
          // Force garbage collection
          if (global.gc) {
            global.gc();
          }
          
          return true;
        } catch (recoveryError) {
          console.error('OOM recovery failed:', recoveryError);
          return false;
        }
      },
      fallback: () => {
        this.showErrorBoundary('Memory issue detected. Optimizing performance...');
      }
    });
    
    // Network Error Recovery
    strategies.set(CrashType.NETWORK_ERROR, {
      type: CrashType.NETWORK_ERROR,
      maxAttempts: 5,
      strategy: async () => {
        try {
          // Enable offline mode
          await this.enableOfflineMode();
          
          // Retry with exponential backoff
          await this.retryNetworkOperations();
          
          return true;
        } catch (recoveryError) {
          console.error('Network recovery failed:', recoveryError);
          return false;
        }
      },
      fallback: () => {
        this.showErrorBoundary('Network issues detected. Working in offline mode.');
      }
    });
    
    // Storage Error Recovery
    strategies.set(CrashType.STORAGE_ERROR, {
      type: CrashType.STORAGE_ERROR,
      maxAttempts: 3,
      strategy: async () => {
        try {
          // Clear corrupted storage
          await this.repairStorage();
          
          // Restore from backup
          await this.restoreFromBackup();
          
          return true;
        } catch (recoveryError) {
          console.error('Storage recovery failed:', recoveryError);
          return false;
        }
      },
      fallback: () => {
        this.showErrorBoundary('Storage issue detected. Resetting to defaults...');
      }
    });
    
    return strategies;
  }
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load stored data
      await this.loadStoredData();
      
      // Set up error handlers
      this.setupErrorHandlers();
      
      // Start monitoring
      this.startMonitoring();
      
      // Report any stored crashes
      await this.reportStoredCrashes();
      
      this.isInitialized = true;
      
      this.addBreadcrumb('system', 'Crash reporting initialized', 'info');
      
    } catch (error) {
      console.error('Failed to initialize crash reporting:', error);
    }
  }
  
  private async loadStoredData(): Promise<void> {
    try {
      const [crashData, breadcrumbData, healthData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEY),
        AsyncStorage.getItem(this.BREADCRUMBS_KEY),
        AsyncStorage.getItem(this.HEALTH_KEY)
      ]);
      
      if (crashData) {
        this.crashes = JSON.parse(crashData);
      }
      
      if (breadcrumbData) {
        this.breadcrumbs = JSON.parse(breadcrumbData);
      }
      
      if (healthData) {
        this.sessionHealth = JSON.parse(healthData);
      }
    } catch (error) {
      console.error('Failed to load crash reporting data:', error);
    }
  }
  
  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.crashes.slice(-this.MAX_STORED_CRASHES))),
        AsyncStorage.setItem(this.BREADCRUMBS_KEY, JSON.stringify(this.breadcrumbs.slice(-this.MAX_BREADCRUMBS))),
        AsyncStorage.setItem(this.HEALTH_KEY, JSON.stringify(this.sessionHealth))
      ]);
    } catch (error) {
      console.error('Failed to save crash reporting data:', error);
    }
  }
  
  private setupErrorHandlers(): void {
    // JavaScript error handler
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.handleError(new Error(args.join(' ')), CrashType.JAVASCRIPT_ERROR);
      originalConsoleError.apply(console, args);
    };
    
    // Unhandled promise rejection handler
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(new Error(event.reason), CrashType.UNHANDLED_PROMISE);
      });
    }
    
    // React error boundary integration would go here
    // This requires setting up an ErrorBoundary component
  }
  
  private startMonitoring(): void {
    // Memory monitoring
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds
    
    // ANR detection
    this.anrDetectionTimer = setInterval(() => {
      this.checkForANR();
    }, 5000); // Check every 5 seconds
    
    // Performance monitoring
    setInterval(() => {
      this.checkPerformanceHealth();
    }, 60000); // Check every minute
  }
  
  private checkMemoryUsage(): void {
    const perfMetrics = performanceMonitor.getMetrics();
    const memoryUsage = perfMetrics.memoryUsage;
    
    // Check for memory leaks
    if (memoryUsage > 200) { // 200MB threshold
      this.sessionHealth.memoryLeaks++;
      this.addBreadcrumb('memory', `High memory usage: ${memoryUsage}MB`, 'warning');
      
      if (memoryUsage > 400) { // Critical threshold
        this.handleError(new Error(`Critical memory usage: ${memoryUsage}MB`), CrashType.OOM);
      }
    }
  }
  
  private checkForANR(): void {
    const timeSinceLastInteraction = Date.now() - this.lastInteractionTime;
    
    // If no interaction for 10 seconds and app should be responsive
    if (timeSinceLastInteraction > 10000 && this.currentAction !== 'idle') {
      this.handleError(new Error('Application not responding'), CrashType.ANR);
    }
  }
  
  private checkPerformanceHealth(): void {
    const perfMetrics = performanceMonitor.getMetrics();
    
    if (perfMetrics.fps < 20) {
      this.sessionHealth.performanceIssues++;
      this.addBreadcrumb('performance', `Low FPS: ${perfMetrics.fps}`, 'warning');
    }
    
    // Update health score
    this.updateHealthScore();
  }
  
  private updateHealthScore(): void {
    const { crashCount, errorCount, warningCount, memoryLeaks, performanceIssues, networkFailures } = this.sessionHealth;
    
    let score = 100;
    score -= crashCount * 20;
    score -= errorCount * 5;
    score -= warningCount * 2;
    score -= memoryLeaks * 10;
    score -= performanceIssues * 3;
    score -= networkFailures * 2;
    
    this.sessionHealth.healthScore = Math.max(0, score);
    
    // Track health degradation
    if (score < 50) {
      telemetrySystem.track(EventType.CRASH_DETECTED, {
        healthScore: score,
        issues: { crashCount, errorCount, warningCount, memoryLeaks, performanceIssues, networkFailures }
      });
    }
  }
  
  private async reportStoredCrashes(): Promise<void> {
    const unreportedCrashes = this.crashes.filter(crash => !crash.recovered);
    
    for (const crash of unreportedCrashes) {
      await this.sendCrashReport(crash);
    }
  }
  
  private async sendCrashReport(crash: CrashReport): Promise<void> {
    try {
      // Send to telemetry system
      telemetrySystem.track(EventType.CRASH_DETECTED, {
        crashId: crash.id,
        crashType: crash.type,
        severity: crash.severity,
        error: crash.error,
        context: crash.context,
        breadcrumbs: crash.breadcrumbs.slice(-10), // Last 10 breadcrumbs
        recovered: crash.recovered
      });
      
      // Send to external crash reporting service (e.g., Crashlytics, Sentry)
      // await this.sendToExternalService(crash);
      
    } catch (error) {
      console.error('Failed to send crash report:', error);
    }
  }
  
  // Public API
  
  async handleError(error: Error, type: CrashType = CrashType.JAVASCRIPT_ERROR, context?: any): Promise<void> {
    if (this.isRecovering) return; // Prevent recursive recovery
    
    this.errorCount++;
    this.sessionHealth.errorCount++;
    this.lastError = error;
    
    const severity = this.determineSeverity(error, type);
    
    // Create crash report
    const crashReport: CrashReport = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        componentStack: (error as any).componentStack
      },
      context: {
        userId: telemetrySystem.getPlayerProfile()?.userId,
        sessionId: telemetrySystem.getSessionMetrics()?.sessionId || 'unknown',
        screen: this.currentScreen,
        action: this.currentAction,
        deviceInfo: deviceInfoManager.getDeviceProfile(),
        performance: performanceMonitor.getMetrics(),
        memory: {
          used: performanceMonitor.getMetrics().memoryUsage,
          limit: 512, // MB - estimated
          available: 512 - performanceMonitor.getMetrics().memoryUsage
        },
        network: {
          online: true, // Would check actual network status
          type: deviceInfoManager.getDeviceProfile().networkType,
          quality: deviceInfoManager.getDeviceProfile().networkQuality
        },
        gameState: {
          level: 1, // Would get from game state
          score: 0, // Would get from game state
          currency: {}, // Would get from game state
          difficulty: 'normal' // Would get from game state
        },
        ...context
      },
      breadcrumbs: [...this.breadcrumbs],
      severity,
      recovered: false,
      recoveryAttempts: 0,
      tags: {
        platform: Platform.OS,
        version: '1.0.0',
        build: '100'
      }
    };
    
    // Store crash report
    this.crashes.push(crashReport);
    await this.saveData();
    
    // Add breadcrumb
    this.addBreadcrumb('error', `${type}: ${error.message}`, 'error', {
      errorName: error.name,
      severity
    });
    
    // Attempt recovery for non-critical errors
    if (severity !== 'critical') {
      const recovered = await this.attemptRecovery(crashReport);
      crashReport.recovered = recovered;
    }
    
    // Send crash report
    await this.sendCrashReport(crashReport);
    
    // Update session health
    if (severity === 'critical') {
      this.sessionHealth.crashCount++;
    }
    
    this.updateHealthScore();
  }
  
  private determineSeverity(error: Error, type: CrashType): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors that crash the app
    if (type === CrashType.NATIVE_CRASH || type === CrashType.OOM) {
      return 'critical';
    }
    
    // High severity for core functionality
    if (type === CrashType.ANR || type === CrashType.STORAGE_ERROR) {
      return 'high';
    }
    
    // Medium for recoverable errors
    if (type === CrashType.NETWORK_ERROR || type === CrashType.GRAPHICS_ERROR) {
      return 'medium';
    }
    
    // Check error message for severity indicators
    if (error.message.includes('Critical') || error.message.includes('Fatal')) {
      return 'critical';
    }
    
    return 'low';
  }
  
  private async attemptRecovery(crashReport: CrashReport): Promise<boolean> {
    this.isRecovering = true;
    
    try {
      const strategy = this.recoveryStrategies.get(crashReport.type);
      
      if (!strategy) {
        return false;
      }
      
      let attempts = 0;
      while (attempts < strategy.maxAttempts) {
        attempts++;
        crashReport.recoveryAttempts = attempts;
        
        try {
          const success = await strategy.strategy(new Error(crashReport.error.message), crashReport.context);
          
          if (success) {
            this.addBreadcrumb('recovery', `Successfully recovered from ${crashReport.type}`, 'info');
            return true;
          }
        } catch (recoveryError) {
          console.error(`Recovery attempt ${attempts} failed:`, recoveryError);
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
      
      // All recovery attempts failed, use fallback
      strategy.fallback();
      this.addBreadcrumb('recovery', `Recovery failed for ${crashReport.type}, using fallback`, 'warning');
      
      return false;
      
    } finally {
      this.isRecovering = false;
    }
  }
  
  private async clearCorruptedState(): Promise<void> {
    // Clear potentially corrupted application state
    // This would integrate with your state management system
  }
  
  private async reloadCriticalSystems(): Promise<void> {
    // Reload critical app systems
    // This would reinitialize key components
  }
  
  private async clearMemoryCaches(): Promise<void> {
    // Clear image and data caches
    // This would integrate with your caching system
  }
  
  private async enableLowMemoryMode(): Promise<void> {
    // Enable low memory optimizations
    // This would reduce quality settings, disable animations, etc.
  }
  
  private async enableOfflineMode(): Promise<void> {
    // Switch to offline mode
    // This would use cached data and queue operations
  }
  
  private async retryNetworkOperations(): Promise<void> {
    // Retry failed network operations
    // This would implement exponential backoff for retries
  }
  
  private async repairStorage(): Promise<void> {
    // Attempt to repair corrupted storage
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
  
  private async restoreFromBackup(): Promise<void> {
    // Restore from backup data
    // This would restore critical user data from backups
  }
  
  private showErrorBoundary(message: string): void {
    // Show user-friendly error message
    // This would integrate with your UI system
    console.log('Error Boundary:', message);
  }
  
  addBreadcrumb(category: string, message: string, level: 'debug' | 'info' | 'warning' | 'error', data?: Record<string, any>): void {
    const breadcrumb: Breadcrumb = {
      timestamp: Date.now(),
      category,
      message,
      level,
      data
    };
    
    this.breadcrumbs.push(breadcrumb);
    
    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.MAX_BREADCRUMBS) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.MAX_BREADCRUMBS);
    }
    
    // Auto-save breadcrumbs periodically
    if (this.breadcrumbs.length % 10 === 0) {
      this.saveData();
    }
  }
  
  setCurrentScreen(screen: string): void {
    this.currentScreen = screen;
    this.addBreadcrumb('navigation', `Navigated to ${screen}`, 'info');
  }
  
  setCurrentAction(action: string): void {
    this.currentAction = action;
    this.lastInteractionTime = Date.now();
  }
  
  // Get methods
  getCrashReports(): CrashReport[] {
    return [...this.crashes];
  }
  
  getSessionHealth(): SessionHealth {
    return { ...this.sessionHealth };
  }
  
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }
  
  getErrorCount(): number {
    return this.errorCount;
  }
  
  // Cleanup
  destroy(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    
    if (this.anrDetectionTimer) {
      clearInterval(this.anrDetectionTimer);
    }
    
    this.saveData();
  }
}

// Export singleton instance
export const crashReporting = CrashReportingSystem.getInstance();

// Convenience functions
export function reportError(error: Error, type: CrashType = CrashType.JAVASCRIPT_ERROR, context?: any): void {
  crashReporting.handleError(error, type, context);
}

export function addBreadcrumb(category: string, message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info'): void {
  crashReporting.addBreadcrumb(category, message, level);
}

export function setCurrentScreen(screen: string): void {
  crashReporting.setCurrentScreen(screen);
}

export function setCurrentAction(action: string): void {
  crashReporting.setCurrentAction(action);
}