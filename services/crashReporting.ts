import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = 'YOUR_SENTRY_DSN_HERE'; // Replace with your actual Sentry DSN

class CrashReportingService {
  private initialized = false;

  initialize() {
    if (this.initialized) return;

    try {
      Sentry.init({
        dsn: SENTRY_DSN,
        debug: __DEV__, // Enable debug in development
        environment: __DEV__ ? 'development' : 'production',
        tracesSampleRate: __DEV__ ? 1.0 : 0.2, // Adjust for production
        attachStacktrace: true,
        attachScreenshot: true,
        attachViewHierarchy: true,
        beforeSend: (event, hint) => {
          // Filter out sensitive information
          if (event.user) {
            delete event.user.ip_address;
          }
          
          // Don't send events in development unless explicitly enabled
          if (__DEV__ && !Constants.manifest?.extra?.enableCrashReporting) {
            return null;
          }
          
          return event;
        },
        integrations: [
          new Sentry.ReactNativeTracing({
            tracingOrigins: ['localhost', /^\//, /^https:\/\//],
            routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
          }),
        ],
      });

      this.initialized = true;
      console.log('Crash reporting initialized');
    } catch (error) {
      console.error('Failed to initialize crash reporting:', error);
    }
  }

  // Log custom events
  logEvent(message: string, level: Sentry.SeverityLevel = 'info', extra?: any) {
    if (!this.initialized) return;

    Sentry.captureMessage(message, level);
    if (extra) {
      Sentry.setContext('extra_data', extra);
    }
  }

  // Log exceptions
  logException(error: Error, context?: any) {
    if (!this.initialized) return;

    if (context) {
      Sentry.setContext('error_context', context);
    }
    Sentry.captureException(error);
  }

  // Set user context
  setUser(user: { id: string; email?: string; username?: string } | null) {
    if (!this.initialized) return;

    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    } else {
      Sentry.setUser(null);
    }
  }

  // Add breadcrumb for debugging
  addBreadcrumb(message: string, category: string, data?: any) {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      data,
      timestamp: Date.now(),
    });
  }

  // Track performance
  startTransaction(name: string, op: string = 'navigation') {
    if (!this.initialized) return null;

    return Sentry.startTransaction({
      name,
      op,
    });
  }

  // Custom crash test (for testing only)
  testCrash() {
    if (__DEV__) {
      throw new Error('Test crash - This is a test crash for development');
    }
  }

  // Log game-specific events
  logGameEvent(eventType: string, data: any) {
    const gameEvents = [
      'game_started',
      'game_ended',
      'level_completed',
      'purchase_made',
      'achievement_unlocked',
      'error_occurred',
    ];

    if (gameEvents.includes(eventType)) {
      this.addBreadcrumb(eventType, 'game', data);
      
      // Log important events as messages
      if (['purchase_made', 'error_occurred'].includes(eventType)) {
        this.logEvent(`Game Event: ${eventType}`, 'info', data);
      }
    }
  }

  // Monitor app performance
  trackAppPerformance() {
    if (!this.initialized) return;

    // Track app launch time
    const appLaunchTime = Date.now() - (global as any).appStartTime || 0;
    this.logEvent(`App launched in ${appLaunchTime}ms`, 'info', { launchTime: appLaunchTime });

    // Track memory usage (React Native specific)
    if (Platform.OS === 'android') {
      // Android-specific memory tracking
      const memoryInfo = (global as any).performance?.memory;
      if (memoryInfo) {
        this.addBreadcrumb('Memory usage', 'performance', {
          usedJSHeapSize: memoryInfo.usedJSHeapSize,
          totalJSHeapSize: memoryInfo.totalJSHeapSize,
        });
      }
    }
  }

  // Handle network errors
  logNetworkError(url: string, error: any, requestData?: any) {
    if (!this.initialized) return;

    this.logException(new Error(`Network request failed: ${url}`), {
      url,
      error: error.message || error,
      requestData,
      timestamp: new Date().toISOString(),
    });
  }

  // Track user actions for better debugging
  trackUserAction(action: string, details?: any) {
    if (!this.initialized) return;

    this.addBreadcrumb(`User Action: ${action}`, 'user', details);
  }

  // Monitor game performance metrics
  trackGameMetrics(metrics: {
    fps?: number;
    memoryUsage?: number;
    loadTime?: number;
    frameDrops?: number;
  }) {
    if (!this.initialized) return;

    // Log performance issues
    if (metrics.fps && metrics.fps < 30) {
      this.logEvent('Low FPS detected', 'warning', { fps: metrics.fps });
    }

    if (metrics.frameDrops && metrics.frameDrops > 10) {
      this.logEvent('Frame drops detected', 'warning', { frameDrops: metrics.frameDrops });
    }

    if (metrics.memoryUsage && metrics.memoryUsage > 100) {
      this.logEvent('High memory usage', 'warning', { memoryUsage: metrics.memoryUsage });
    }

    // Add as breadcrumb for context
    this.addBreadcrumb('Game metrics', 'performance', metrics);
  }
}

export default new CrashReportingService();