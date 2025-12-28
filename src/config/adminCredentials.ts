// Admin credentials configuration
// All sensitive data should be stored in environment variables

export interface AdminCredentials {
  username: string;
  password: string;
  pin: string;
  recoveryEmail: string;
  isFirstLogin: boolean;
  lastPasswordChange: Date;
  requirePasswordChange: boolean;
}

export const getAdminCredentials = (): AdminCredentials | null => {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    console.warn('Admin credentials not configured in environment variables');
    return null;
  }

  return {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    pin: process.env.ADMIN_PIN || (() => { console.warn('ADMIN_PIN not configured - admin panel disabled'); return ''; })(),
    recoveryEmail: process.env.ADMIN_RECOVERY_EMAIL || process.env.ADMIN_USERNAME,
    isFirstLogin: true, // Will be set to false after first successful login
    lastPasswordChange: new Date(),
    requirePasswordChange: true // Forces password change on first login
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
  requireMFA: process.env.REQUIRE_MFA === 'true',
  passwordMinLength: 8,
  passwordRequireSpecial: true,
  passwordRequireNumbers: true,
  passwordRequireUppercase: true
};

// Admin session management
export class AdminSessionManager {
  private static instance: AdminSessionManager;
  private loginAttempts: Map<string, number> = new Map();
  private sessions: Map<string, { userId: string; expiresAt: Date }> = new Map();

  static getInstance(): AdminSessionManager {
    if (!AdminSessionManager.instance) {
      AdminSessionManager.instance = new AdminSessionManager();
    }
    return AdminSessionManager.instance;
  }

  recordLoginAttempt(username: string): boolean {
    const attempts = this.loginAttempts.get(username) || 0;
    const newAttempts = attempts + 1;
    this.loginAttempts.set(username, newAttempts);
    
    if (newAttempts >= SECURITY_CONFIG.maxLoginAttempts) {
      // Lock account for 15 minutes
      setTimeout(() => {
        this.loginAttempts.delete(username);
      }, 15 * 60 * 1000);
      return false;
    }
    return true;
  }

  createSession(username: string, userId: string): string {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + SECURITY_CONFIG.sessionTimeout);
    
    this.sessions.set(sessionId, { userId, expiresAt });
    
    // Clean up expired sessions
    this.cleanupExpiredSessions();
    
    return sessionId;
  }

  validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return false;
    }
    
    return true;
  }

  invalidateSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private generateSessionId(): string {
    // Use cryptographically secure random values
    const array = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto (should not happen in modern RN)
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('') + Date.now().toString(36);
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < SECURITY_CONFIG.passwordMinLength) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.passwordMinLength} characters long`);
  }
  
  if (SECURITY_CONFIG.passwordRequireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  if (SECURITY_CONFIG.passwordRequireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (SECURITY_CONFIG.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export the session manager instance
export const adminSessionManager = AdminSessionManager.getInstance();