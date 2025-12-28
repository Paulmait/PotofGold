import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Only import Sentry for native platforms
let Sentry: any = null;
if (Platform.OS === 'web') {
  // Use mock for web
  Sentry = require('../src/utils/sentryMock').default;
} else {
  try {
    Sentry = require('@sentry/react-native');
  } catch (error) {
    console.log('Sentry not available');
    Sentry = require('../src/utils/sentryMock').default;
  }
}

// Sentry DSN should be set via environment variable
// To configure: Set EXPO_PUBLIC_SENTRY_DSN in your .env file or EAS secrets
// Get your DSN from: https://sentry.io -> Project Settings -> Client Keys (DSN)
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

class CrashReportingService {
  private initialized = false;

  initialize() {
    // Skip initialization for web platform
    if (this.initialized || Platform.OS === 'web' || !Sentry) {
      console.log('Crash reporting disabled for web platform');
      return;
    }

    // Check if DSN is configured
    if (!SENTRY_DSN) {
      console.warn('Sentry DSN not configured. Crash reporting disabled.');
      console.warn('To enable: Set EXPO_PUBLIC_SENTRY_DSN environment variable');
      return;
    }

    try {
      Sentry.init({
        dsn: SENTRY_DSN,
        debug: __DEV__, // Enable debug in development
        environment: __DEV__ ? 'development' : 'production',
        tracesSampleRate: __DEV__ ? 1.0 : 0.2, // Adjust for production
        attachStacktrace: true,
        attachScreenshot: true,
        attachViewHierarchy: true,
        beforeSend: (event: any, hint: any) => {
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
            tracingOrigins: ['localhost', /^\//],
            routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
          }),
        ],
      });

      this.initialized = true;
      console.log('Crash reporting initialized successfully');
    } catch (error) {
      console.error('Failed to initialize crash reporting:', error);
    }
  }

  logEvent(message: string, level: string = 'info', extra?: any) {
    if (!this.initialized || !Sentry) return;

    Sentry.captureMessage(message, level);
    if (extra) {
      Sentry.setContext('extra_data', extra);
    }
  }

  logException(error: Error, context?: Record<string, any>) {
    if (!this.initialized || !Sentry) {
      // For web, just log to console
      console.error('Error:', error, context);
      return;
    }

    if (context) {
      Sentry.setContext('error_context', context);
    }
    Sentry.captureException(error);
  }

  setUser(user: { id: string; email?: string; username?: string } | null) {
    if (!this.initialized || !Sentry) return;

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

  addBreadcrumb(message: string, category?: string, data?: any) {
    if (!this.initialized || !Sentry) return;

    Sentry.addBreadcrumb({
      message,
      category: category || 'default',
      level: 'info',
      timestamp: Date.now() / 1000,
      data,
    });
  }

  startTransaction(name: string, op: string = 'navigation') {
    if (!this.initialized || !Sentry) return null;

    return Sentry.startTransaction({
      name,
      op,
    });
  }

  trackAppPerformance() {
    // Track app launch time
    const appStartTime = (global as any).appStartTime;
    if (appStartTime) {
      const launchTime = Date.now() - appStartTime;
      this.logEvent('app_launch', 'info', {
        launch_time_ms: launchTime,
        platform: Platform.OS,
        version: Constants.manifest?.version,
      });
    }
  }

  setCurrentScreen(screenName: string) {
    this.addBreadcrumb(`Navigated to ${screenName}`, 'navigation', {
      screen: screenName,
    });
  }
}

const crashReporting = new CrashReportingService();

// Auto-initialize on app start (will be skipped for web)
if (!__DEV__ || Constants.manifest?.extra?.enableCrashReporting) {
  crashReporting.initialize();
}

export default crashReporting;
export const logException = (error: Error, context?: Record<string, any>) =>
  crashReporting.logException(error, context);
export const setCurrentScreen = (screenName: string) => crashReporting.setCurrentScreen(screenName);
