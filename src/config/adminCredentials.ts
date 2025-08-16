// Admin credentials configuration
// All sensitive data should be stored in environment variables

export const getAdminCredentials = () => {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    console.warn('Admin credentials not configured in environment variables');
    return null;
  }

  return {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    pin: process.env.ADMIN_PIN || '',
    recoveryEmail: process.env.ADMIN_RECOVERY_EMAIL || ''
  };
};

// Admin API configuration
export const ADMIN_API_CONFIG = {
  endpoint: process.env.ADMIN_API_ENDPOINT || '',
  apiKey: process.env.ADMIN_API_KEY || '',
  secretKey: process.env.ADMIN_SECRET_KEY || ''
};

// Feature flags
export const ADMIN_FEATURES = {
  enableDebugMode: process.env.NODE_ENV === 'development',
  enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
  enableCrashReporting: process.env.ENABLE_CRASH_REPORTING === 'true'
};

// Security configuration
export const SECURITY_CONFIG = {
  maxLoginAttempts: 3,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  requireMFA: process.env.REQUIRE_MFA === 'true'
};