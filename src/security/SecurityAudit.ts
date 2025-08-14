/**
 * Security Audit & Vulnerability Protection
 * Comprehensive security measures for production deployment
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as CryptoJS from 'crypto-js';

export interface SecurityIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: SecurityCategory;
  description: string;
  recommendation: string;
  cveReference?: string;
  affectedComponents: string[];
  exploitability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

export enum SecurityCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_PROTECTION = 'data_protection',
  INPUT_VALIDATION = 'input_validation',
  CRYPTOGRAPHY = 'cryptography',
  NETWORK_SECURITY = 'network_security',
  STORAGE_SECURITY = 'storage_security',
  CODE_INJECTION = 'code_injection',
  PRIVACY = 'privacy',
  COMPLIANCE = 'compliance'
}

export interface SecurityConfig {
  enableEncryption: boolean;
  enableInputValidation: boolean;
  enableNetworkValidation: boolean;
  enableStorageProtection: boolean;
  maxRetryAttempts: number;
  sessionTimeout: number;
  enforceHTTPS: boolean;
  enableCSP: boolean;
}

class SecurityAuditor {
  private static instance: SecurityAuditor;
  private issues: SecurityIssue[] = [];
  private config: SecurityConfig;
  private encryptionKey: string;
  
  private constructor() {
    this.config = {
      enableEncryption: true,
      enableInputValidation: true,
      enableNetworkValidation: true,
      enableStorageProtection: true,
      maxRetryAttempts: 3,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      enforceHTTPS: true,
      enableCSP: true
    };
    
    this.encryptionKey = this.generateEncryptionKey();
  }
  
  static getInstance(): SecurityAuditor {
    if (!SecurityAuditor.instance) {
      SecurityAuditor.instance = new SecurityAuditor();
    }
    return SecurityAuditor.instance;
  }
  
  private generateEncryptionKey(): string {
    // In production, this should be derived from a secure source
    return CryptoJS.lib.WordArray.random(32).toString();
  }
  
  // Input Validation & Sanitization
  sanitizeInput(input: string, context: 'username' | 'email' | 'score' | 'general'): string {
    if (!this.config.enableInputValidation) return input;
    
    let sanitized = input.trim();
    
    switch (context) {
      case 'username':
        // Remove potential script tags and dangerous characters
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/[<>\"'%;()&+]/g, '');
        sanitized = sanitized.substring(0, 50); // Max length
        break;
        
      case 'email':
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitized)) {
          throw new Error('Invalid email format');
        }
        break;
        
      case 'score':
        // Ensure score is numeric and within reasonable bounds
        const score = parseInt(sanitized, 10);
        if (isNaN(score) || score < 0 || score > 10000000) {
          throw new Error('Invalid score value');
        }
        sanitized = score.toString();
        break;
        
      case 'general':
        // Remove potential XSS vectors
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        break;
    }
    
    return sanitized;
  }
  
  validateNumericInput(value: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
    const num = Number(value);
    
    if (isNaN(num)) {
      throw new Error('Invalid numeric value');
    }
    
    if (num < min || num > max) {
      throw new Error(`Value must be between ${min} and ${max}`);
    }
    
    return num;
  }
  
  // Secure Storage
  async secureStore(key: string, value: any): Promise<void> {
    if (!this.config.enableStorageProtection) {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return;
    }
    
    try {
      const serialized = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(serialized, this.encryptionKey).toString();
      const hmac = CryptoJS.HmacSHA256(encrypted, this.encryptionKey).toString();
      
      const secureData = {
        data: encrypted,
        hmac: hmac,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(`secure_${key}`, JSON.stringify(secureData));
    } catch (error) {
      console.error('Secure storage failed:', error);
      throw new Error('Failed to store data securely');
    }
  }
  
  async secureRetrieve(key: string): Promise<any> {
    if (!this.config.enableStorageProtection) {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
    
    try {
      const storedData = await AsyncStorage.getItem(`secure_${key}`);
      if (!storedData) return null;
      
      const secureData = JSON.parse(storedData);
      
      // Verify HMAC
      const expectedHmac = CryptoJS.HmacSHA256(secureData.data, this.encryptionKey).toString();
      if (expectedHmac !== secureData.hmac) {
        throw new Error('Data integrity check failed');
      }
      
      // Check timestamp (optional expiration)
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (Date.now() - secureData.timestamp > maxAge) {
        await AsyncStorage.removeItem(`secure_${key}`);
        return null;
      }
      
      // Decrypt data
      const decrypted = CryptoJS.AES.decrypt(secureData.data, this.encryptionKey).toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
      
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      // Remove corrupted data
      await AsyncStorage.removeItem(`secure_${key}`);
      return null;
    }
  }
  
  // Network Security
  validateURL(url: string): boolean {
    if (!this.config.enableNetworkValidation) return true;
    
    try {
      const urlObj = new URL(url);
      
      // Enforce HTTPS in production
      if (this.config.enforceHTTPS && urlObj.protocol !== 'https:') {
        this.addIssue({
          id: 'insecure_http',
          severity: 'medium',
          category: SecurityCategory.NETWORK_SECURITY,
          description: `Insecure HTTP connection detected: ${url}`,
          recommendation: 'Use HTTPS for all network communications',
          affectedComponents: ['NetworkLayer'],
          exploitability: 'medium',
          impact: 'medium'
        });
        return false;
      }
      
      // Block local/private network access
      const hostname = urlObj.hostname;
      if (this.isPrivateIP(hostname)) {
        this.addIssue({
          id: 'private_network_access',
          severity: 'high',
          category: SecurityCategory.NETWORK_SECURITY,
          description: `Attempt to access private network: ${hostname}`,
          recommendation: 'Block access to private network ranges',
          affectedComponents: ['NetworkLayer'],
          exploitability: 'high',
          impact: 'high'
        });
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  private isPrivateIP(hostname: string): boolean {
    // Check for localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }
    
    // Check for private IP ranges
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./ // Link-local
    ];
    
    return privateRanges.some(range => range.test(hostname));
  }
  
  // Authentication Security
  validatePassword(password: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (password.length < 8) {
      issues.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      issues.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      issues.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      issues.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      issues.push('Password must contain at least one special character');
    }
    
    // Check against common passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'letmein',
      'welcome', 'monkey', '1234567890', 'qwerty', 'abc123'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      issues.push('Password is too common');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
  
  // Session Management
  generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  validateSession(sessionData: any): boolean {
    if (!sessionData || !sessionData.token || !sessionData.timestamp) {
      return false;
    }
    
    // Check session timeout
    if (Date.now() - sessionData.timestamp > this.config.sessionTimeout) {
      return false;
    }
    
    // Validate token format
    if (typeof sessionData.token !== 'string' || sessionData.token.length !== 64) {
      return false;
    }
    
    return true;
  }
  
  // Security Audit Functions
  async runComprehensiveAudit(): Promise<SecurityIssue[]> {
    this.issues = [];
    
    // Audit different security aspects
    await this.auditStorageSecurity();
    await this.auditNetworkSecurity();
    await this.auditInputValidation();
    await this.auditCryptography();
    await this.auditPrivacy();
    await this.auditCompliance();
    
    // Sort by severity
    this.issues.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
    
    return this.issues;
  }
  
  private async auditStorageSecurity(): Promise<void> {
    // Check for unencrypted sensitive data
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sensitiveKeys = keys.filter(key => 
        key.includes('password') ||
        key.includes('token') ||
        key.includes('credit') ||
        key.includes('payment') ||
        key.includes('personal')
      );
      
      for (const key of sensitiveKeys) {
        if (!key.startsWith('secure_')) {
          this.addIssue({
            id: `unencrypted_storage_${key}`,
            severity: 'high',
            category: SecurityCategory.STORAGE_SECURITY,
            description: `Sensitive data stored unencrypted: ${key}`,
            recommendation: 'Use secure storage for sensitive data',
            affectedComponents: ['AsyncStorage'],
            exploitability: 'medium',
            impact: 'high'
          });
        }
      }
    } catch (error) {
      console.error('Storage audit failed:', error);
    }
  }
  
  private async auditNetworkSecurity(): Promise<void> {
    // Check network configuration
    if (!this.config.enforceHTTPS) {
      this.addIssue({
        id: 'https_not_enforced',
        severity: 'medium',
        category: SecurityCategory.NETWORK_SECURITY,
        description: 'HTTPS is not enforced for network communications',
        recommendation: 'Enable HTTPS enforcement in security config',
        affectedComponents: ['NetworkLayer'],
        exploitability: 'medium',
        impact: 'medium'
      });
    }
  }
  
  private async auditInputValidation(): Promise<void> {
    if (!this.config.enableInputValidation) {
      this.addIssue({
        id: 'input_validation_disabled',
        severity: 'high',
        category: SecurityCategory.INPUT_VALIDATION,
        description: 'Input validation is disabled',
        recommendation: 'Enable input validation to prevent injection attacks',
        affectedComponents: ['InputHandlers', 'FormComponents'],
        exploitability: 'high',
        impact: 'high'
      });
    }
  }
  
  private async auditCryptography(): Promise<void> {
    // Check encryption key strength
    if (this.encryptionKey.length < 32) {
      this.addIssue({
        id: 'weak_encryption_key',
        severity: 'critical',
        category: SecurityCategory.CRYPTOGRAPHY,
        description: 'Encryption key is too short',
        recommendation: 'Use at least 256-bit encryption keys',
        affectedComponents: ['SecurityAuditor'],
        exploitability: 'high',
        impact: 'high'
      });
    }
  }
  
  private async auditPrivacy(): Promise<void> {
    // Check for PII collection
    try {
      const keys = await AsyncStorage.getAllKeys();
      const piiKeys = keys.filter(key => 
        key.includes('email') ||
        key.includes('phone') ||
        key.includes('address') ||
        key.includes('name') ||
        key.includes('birthday')
      );
      
      if (piiKeys.length > 0) {
        this.addIssue({
          id: 'pii_collection_detected',
          severity: 'medium',
          category: SecurityCategory.PRIVACY,
          description: 'Personal information collection detected',
          recommendation: 'Ensure proper consent and data protection measures',
          affectedComponents: ['DataCollection'],
          exploitability: 'low',
          impact: 'medium'
        });
      }
    } catch (error) {
      console.error('Privacy audit failed:', error);
    }
  }
  
  private async auditCompliance(): Promise<void> {
    // Check for GDPR compliance requirements
    const hasPrivacyPolicy = await AsyncStorage.getItem('privacy_policy_accepted');
    if (!hasPrivacyPolicy) {
      this.addIssue({
        id: 'missing_privacy_consent',
        severity: 'high',
        category: SecurityCategory.COMPLIANCE,
        description: 'No privacy policy consent tracking',
        recommendation: 'Implement privacy policy acceptance tracking',
        affectedComponents: ['LegalCompliance'],
        exploitability: 'low',
        impact: 'high'
      });
    }
  }
  
  private addIssue(issue: SecurityIssue): void {
    this.issues.push(issue);
  }
  
  // Security Utilities
  hashSensitiveData(data: string): string {
    return CryptoJS.SHA256(data + this.encryptionKey).toString();
  }
  
  generateNonce(): string {
    return CryptoJS.lib.WordArray.random(16).toString();
  }
  
  rateLimitCheck(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    // Implement rate limiting logic
    const key = `rate_limit_${identifier}`;
    const now = Date.now();
    
    // This would typically use Redis or similar in production
    // For now, we'll use memory storage
    const requests = this.getRateLimitData(key, now, windowMs);
    
    if (requests >= maxRequests) {
      this.addIssue({
        id: `rate_limit_exceeded_${identifier}`,
        severity: 'medium',
        category: SecurityCategory.AUTHORIZATION,
        description: `Rate limit exceeded for ${identifier}`,
        recommendation: 'Implement proper rate limiting',
        affectedComponents: ['RateLimiter'],
        exploitability: 'medium',
        impact: 'low'
      });
      return false;
    }
    
    return true;
  }
  
  private rateLimitStore = new Map<string, number[]>();
  
  private getRateLimitData(key: string, now: number, windowMs: number): number {
    const requests = this.rateLimitStore.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    // Add current request
    validRequests.push(now);
    
    // Store updated requests
    this.rateLimitStore.set(key, validRequests);
    
    return validRequests.length;
  }
  
  // Secure random number generation
  secureRandom(min: number = 0, max: number = 1): number {
    const range = max - min;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return min + (array[0] / (0xFFFFFFFF + 1)) * range;
  }
  
  // Content Security Policy
  generateCSPHeader(): string {
    if (!this.config.enableCSP) return '';
    
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https:",
      "font-src 'self'",
      "object-src 'none'",
      "media-src 'self'",
      "frame-src 'none'"
    ].join('; ');
  }
  
  // Get security report
  getSecurityReport(): {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    categories: Record<SecurityCategory, number>;
    overallRating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  } {
    const totalIssues = this.issues.length;
    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
    const highIssues = this.issues.filter(i => i.severity === 'high').length;
    const mediumIssues = this.issues.filter(i => i.severity === 'medium').length;
    const lowIssues = this.issues.filter(i => i.severity === 'low').length;
    
    const categories = Object.values(SecurityCategory).reduce((acc, category) => {
      acc[category] = this.issues.filter(i => i.category === category).length;
      return acc;
    }, {} as Record<SecurityCategory, number>);
    
    let overallRating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' = 'excellent';
    
    if (criticalIssues > 0) {
      overallRating = 'critical';
    } else if (highIssues > 2) {
      overallRating = 'poor';
    } else if (highIssues > 0 || mediumIssues > 5) {
      overallRating = 'fair';
    } else if (mediumIssues > 0 || lowIssues > 10) {
      overallRating = 'good';
    }
    
    return {
      totalIssues,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      categories,
      overallRating
    };
  }
}

// Export singleton instance
export const securityAuditor = SecurityAuditor.getInstance();

// Convenience functions
export function sanitizeInput(input: string, context: 'username' | 'email' | 'score' | 'general' = 'general'): string {
  return securityAuditor.sanitizeInput(input, context);
}

export function validateNumericInput(value: any, min?: number, max?: number): number {
  return securityAuditor.validateNumericInput(value, min, max);
}

export function secureStore(key: string, value: any): Promise<void> {
  return securityAuditor.secureStore(key, value);
}

export function secureRetrieve(key: string): Promise<any> {
  return securityAuditor.secureRetrieve(key);
}

export function validatePassword(password: string): { isValid: boolean; issues: string[] } {
  return securityAuditor.validatePassword(password);
}

export function runSecurityAudit(): Promise<SecurityIssue[]> {
  return securityAuditor.runComprehensiveAudit();
}