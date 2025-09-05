/**
 * Central Application Configuration
 * All domain and URL references should use these values
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isPreview = process.env.VERCEL_ENV === 'preview';

export const AppConfig = {
  // Primary domain configuration
  domain: {
    production: 'pofgold.com',
    preview: 'potofgold.vercel.app',
    development: 'localhost:3000'
  },
  
  // Get current domain based on environment
  get currentDomain() {
    if (isDevelopment) return this.domain.development;
    if (isPreview) return this.domain.preview;
    return this.domain.production;
  },
  
  // Full URLs
  get appUrl() {
    const protocol = isDevelopment ? 'http' : 'https';
    return `${protocol}://${this.currentDomain}`;
  },
  
  // API Endpoints
  api: {
    get analytics() {
      return process.env.ANALYTICS_ENDPOINT || `${AppConfig.appUrl}/api/analytics`;
    },
    get liveops() {
      return process.env.LIVEOPS_SERVER_URL || `${AppConfig.appUrl}/api/liveops`;
    },
    get multiplayer() {
      return process.env.MULTIPLAYER_SERVER_URL || `wss://multiplayer.${AppConfig.domain.production}`;
    },
    get admin() {
      return process.env.ADMIN_API_ENDPOINT || `${AppConfig.appUrl}/api/admin`;
    }
  },
  
  // Legal and Support URLs
  legal: {
    privacyPolicy: `https://${AppConfig.domain.production}/privacy`,
    termsOfService: `https://${AppConfig.domain.production}/terms`,
    eula: `https://${AppConfig.domain.production}/eula`,
    supportEmail: 'support@pofgold.com',
    privacyEmail: 'privacy@pofgold.com',
    legalEmail: 'legal@pofgold.com'
  },
  
  // Company Information
  company: {
    name: 'Cien Rios LLC',
    dba: 'Pot of Gold',
    website: `https://${AppConfig.domain.production}`,
    address: 'Miami, FL 33101, USA'
  },
  
  // App Store Configuration
  appStore: {
    ios: {
      appId: '1234567890', // Replace with actual App Store ID
      bundleId: 'com.cienrios.potofgold',
      testFlightCode: process.env.TESTFLIGHT_CODE || ''
    },
    android: {
      packageName: 'com.cienrios.potofgold',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.cienrios.potofgold'
    }
  },
  
  // Firebase Configuration (keep existing)
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBJSp7vX2-SOWCpjbgTEAPj_T9QQL72JX4",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "potofgold-production.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "potofgold-production",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "potofgold-production.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "511446280789",
    appId: process.env.FIREBASE_APP_ID || "1:511446280789:web:f52cfd9a863631ad0b82dc",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-GFP64LBLZ3"
  },
  
  // Feature Flags
  features: {
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    enableCrashReporting: process.env.ENABLE_CRASH_REPORTING === 'true',
    requireMFA: process.env.REQUIRE_MFA === 'true',
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
  },
  
  // Version Information
  version: {
    app: process.env.APP_VERSION || '1.0.0',
    build: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    environment: process.env.NODE_ENV || 'development'
  }
};

export default AppConfig;