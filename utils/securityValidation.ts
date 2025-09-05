/**
 * Security validation utilities for Pot of Gold game
 * Provides input validation, sanitization, and security checks
 */

import CryptoJS from 'crypto-js';

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

/**
 * Validate password strength
 * Requirements: 8+ chars, uppercase, lowercase, number, special char
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[@$!%*?&#]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .slice(0, 1000); // Limit length
};

/**
 * Validate username format
 */
export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Rate limiter implementation
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Filter out old attempts
    const recentAttempts = attempts.filter(
      time => now - time < this.windowMs
    );
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    return true;
  }

  getRemainingAttempts(identifier: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    const recentAttempts = attempts.filter(
      time => now - time < this.windowMs
    );
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

/**
 * Validate game score to prevent tampering
 */
export const validateGameScore = (score: number, playtime: number): boolean => {
  // Maximum possible score per second of gameplay
  const maxScorePerSecond = 100;
  const maxPossibleScore = playtime * maxScorePerSecond;
  
  return score >= 0 && score <= maxPossibleScore;
};

/**
 * Validate coin transaction
 */
export const validateCoinTransaction = (amount: number, currentBalance: number): boolean => {
  return (
    Number.isInteger(amount) &&
    amount > 0 &&
    amount <= 1000000 && // Max transaction limit
    currentBalance + amount >= 0 // No negative balance
  );
};

/**
 * Generate secure session token
 */
export const generateSessionToken = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const data = `${timestamp}-${random}`;
  return CryptoJS.SHA256(data).toString();
};

/**
 * Validate Firebase configuration
 */
export const validateFirebaseConfig = (): boolean => {
  const requiredVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  ];

  for (const envVar of requiredVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      return false;
    }
  }
  
  return true;
};

/**
 * Sanitize display name
 */
export const sanitizeDisplayName = (name: string): string => {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, '') // Only alphanumeric, space, underscore, hyphen
    .slice(0, 30); // Max length
};

/**
 * Validate purchase data
 */
export const validatePurchase = (productId: string, price: number): boolean => {
  const validProducts = [
    'coin_pack_small',
    'coin_pack_medium',
    'coin_pack_large',
    'premium_subscription',
    'vip_subscription',
    'remove_ads',
  ];
  
  return validProducts.includes(productId) && price > 0 && price < 1000;
};

/**
 * Check for suspicious activity patterns
 */
export const detectSuspiciousActivity = (
  actions: { type: string; timestamp: number }[]
): boolean => {
  // Check for rapid-fire actions (potential bot)
  const recentActions = actions.filter(
    a => Date.now() - a.timestamp < 1000 // Last second
  );
  
  if (recentActions.length > 10) {
    return true; // Too many actions in 1 second
  }
  
  // Check for impossible game patterns
  const scores = actions
    .filter(a => a.type === 'score_update')
    .map(a => (a as any).score);
    
  for (let i = 1; i < scores.length; i++) {
    const increase = scores[i] - scores[i - 1];
    if (increase > 10000) {
      return true; // Impossible score jump
    }
  }
  
  return false;
};

// Rate limiters for different operations
export const authRateLimiter = new RateLimiter(5, 60000); // 5 attempts per minute
export const gameRateLimiter = new RateLimiter(100, 60000); // 100 actions per minute
export const purchaseRateLimiter = new RateLimiter(10, 300000); // 10 purchases per 5 minutes

export default {
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateUsername,
  validateGameScore,
  validateCoinTransaction,
  generateSessionToken,
  validateFirebaseConfig,
  sanitizeDisplayName,
  validatePurchase,
  detectSuspiciousActivity,
  RateLimiter,
  authRateLimiter,
  gameRateLimiter,
  purchaseRateLimiter,
};