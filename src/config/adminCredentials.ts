/**
 * Admin Credentials Configuration
 * IMPORTANT: Change these in production and use environment variables
 */

import * as CryptoJS from 'crypto-js';

// Development Admin Credentials
// CHANGE THESE IN PRODUCTION!
export const ADMIN_CREDENTIALS = {
  development: {
    username: 'admin@potofgold',
    password: 'PotG0ld@dm1n2024!',
    pin: '7531',
    recoveryEmail: 'recovery@potofgold.app'
  },
  production: {
    // Use environment variables in production
    username: process.env.ADMIN_USERNAME || 'admin_prod@potofgold',
    password: process.env.ADMIN_PASSWORD || 'GenerateSecurePasswordHere',
    pin: process.env.ADMIN_PIN || '0000',
    recoveryEmail: process.env.ADMIN_RECOVERY_EMAIL || 'admin@yourcompany.com'
  }
};

// Admin API Keys - Replace with your actual keys
export const API_KEYS = {
  // RevenueCat
  REVENUECAT_PUBLIC_KEY_IOS: 'appl_YourIOSPublicKeyHere',
  REVENUECAT_PUBLIC_KEY_ANDROID: 'goog_YourAndroidPublicKeyHere',
  
  // Firebase
  FIREBASE_API_KEY: 'AIzaSyYourFirebaseKeyHere',
  FIREBASE_AUTH_DOMAIN: 'potofgold-app.firebaseapp.com',
  FIREBASE_PROJECT_ID: 'potofgold-app',
  FIREBASE_STORAGE_BUCKET: 'potofgold-app.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: '123456789',
  FIREBASE_APP_ID: '1:123456789:web:abc123def456',
  
  // Analytics
  GOOGLE_ANALYTICS_ID: 'G-XXXXXXXXXX',
  MIXPANEL_TOKEN: 'your_mixpanel_token_here',
  
  // App Store Connect
  APP_STORE_CONNECT_API_KEY: 'your_app_store_connect_key',
  APP_STORE_CONNECT_ISSUER_ID: 'your_issuer_id',
  APP_STORE_CONNECT_KEY_ID: 'your_key_id',
  
  // Google Play Console
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: 'path/to/service-account.json',
  
  // Push Notifications
  EXPO_PUSH_TOKEN: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  
  // Social Media (for sharing features)
  FACEBOOK_APP_ID: 'your_facebook_app_id',
  TWITTER_API_KEY: 'your_twitter_api_key',
  
  // Support & Analytics
  ZENDESK_API_KEY: 'your_zendesk_key',
  SENTRY_DSN: 'https://your_sentry_dsn@sentry.io/project_id'
};

// Admin Role Configuration
export const ADMIN_ROLES = {
  SUPER_ADMIN: {
    username: ADMIN_CREDENTIALS.development.username,
    permissions: ['all'],
    accessLevel: 10
  },
  MODERATOR: {
    username: 'moderator@potofgold',
    password: 'Mod3rat0r2024!',
    permissions: ['view_users', 'ban_users', 'view_analytics'],
    accessLevel: 5
  },
  SUPPORT: {
    username: 'support@potofgold',
    password: 'Supp0rt2024!',
    permissions: ['view_users', 'help_users'],
    accessLevel: 3
  }
};

// Secure password hashing for production
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password + 'potofgold_salt_2024').toString();
}

// Validate admin credentials
export function validateAdminCredentials(username: string, password: string): boolean {
  const env = __DEV__ ? 'development' : 'production';
  const credentials = ADMIN_CREDENTIALS[env];
  
  // In production, compare hashed passwords
  if (!__DEV__) {
    return username === credentials.username && 
           hashPassword(password) === hashPassword(credentials.password);
  }
  
  // Simple comparison for development
  return username === credentials.username && password === credentials.password;
}

// Generate secure admin password for production
export function generateSecureAdminPassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*()_+-='[Math.floor(Math.random() * 14)]; // Special
  
  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Admin session management
export class AdminSession {
  private static instance: AdminSession;
  private isAuthenticated: boolean = false;
  private sessionToken: string | null = null;
  private sessionExpiry: number = 0;
  
  static getInstance(): AdminSession {
    if (!AdminSession.instance) {
      AdminSession.instance = new AdminSession();
    }
    return AdminSession.instance;
  }
  
  login(username: string, password: string): boolean {
    if (validateAdminCredentials(username, password)) {
      this.isAuthenticated = true;
      this.sessionToken = CryptoJS.lib.WordArray.random(32).toString();
      this.sessionExpiry = Date.now() + (30 * 60 * 1000); // 30 minutes
      return true;
    }
    return false;
  }
  
  logout(): void {
    this.isAuthenticated = false;
    this.sessionToken = null;
    this.sessionExpiry = 0;
  }
  
  isValid(): boolean {
    return this.isAuthenticated && Date.now() < this.sessionExpiry;
  }
  
  getToken(): string | null {
    return this.isValid() ? this.sessionToken : null;
  }
}

// Export admin session instance
export const adminSession = AdminSession.getInstance();

// Development Admin Credentials Display
if (__DEV__) {
  console.log('🔐 Development Admin Credentials:');
  console.log('Username:', ADMIN_CREDENTIALS.development.username);
  console.log('Password:', ADMIN_CREDENTIALS.development.password);
  console.log('PIN:', ADMIN_CREDENTIALS.development.pin);
  console.log('⚠️  Remember to change these in production!');
}