/**
 * Firebase Backend Configuration
 * Production-ready setup with security best practices
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import * as functions from 'firebase-functions';
import * as crypto from 'crypto';

// Environment configuration
const config = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }),
    databaseURL: config.databaseURL,
    storageBucket: config.storageBucket,
  });
}

export const db = getFirestore();
export const auth = getAuth();
export const realtimeDb = getDatabase();
export const storage = getStorage();

// Security settings
db.settings({
  ignoreUndefinedProperties: false,
  timestampsInSnapshots: true,
});

// ========== SECURITY UTILITIES ==========

/**
 * Encrypt sensitive data
 */
export function encryptData(data: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hash sensitive identifiers
 */
export function hashData(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data + process.env.HASH_SALT)
    .digest('hex');
}

/**
 * Validate and sanitize input
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential XSS
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim()
      .substring(0, 1000); // Limit length
  }

  if (typeof input === 'number') {
    // Validate number ranges
    if (isNaN(input) || !isFinite(input)) {
      throw new Error('Invalid number input');
    }
    return Math.min(Math.max(input, -999999999), 999999999);
  }

  if (Array.isArray(input)) {
    return input.slice(0, 100).map(sanitizeInput); // Limit array size
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    const keys = Object.keys(input).slice(0, 50); // Limit object keys

    for (const key of keys) {
      const sanitizedKey = sanitizeInput(key);
      sanitized[sanitizedKey] = sanitizeInput(input[key]);
    }

    return sanitized;
  }

  return input;
}

/**
 * Rate limiting implementation
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 100, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];

    // Remove old attempts outside window
    const validAttempts = attempts.filter((timestamp) => now - timestamp < this.windowMs);

    if (validAttempts.length >= this.maxAttempts) {
      return false; // Rate limit exceeded
    }

    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, attempts] of this.attempts.entries()) {
      const validAttempts = attempts.filter((timestamp) => now - timestamp < this.windowMs);

      if (validAttempts.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, validAttempts);
      }
    }
  }
}

// ========== FIRESTORE SECURITY RULES ==========

export const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }
    
    function hasValidVIP() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.vipLevel > 0;
    }
    
    function isValidScore(score) {
      return score is number && 
        score >= 0 && 
        score <= 999999999;
    }
    
    function isValidTransaction() {
      return request.resource.data.keys().hasAll(['amount', 'type', 'timestamp']) &&
        request.resource.data.amount is number &&
        request.resource.data.amount > 0 &&
        request.resource.data.type in ['coin', 'gem', 'purchase'];
    }
    
    // User documents
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId) && 
        request.resource.data.keys().hasAll(['profile', 'stats', 'createdAt']);
      allow update: if isOwner(userId) && 
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['profile', 'stats', 'lastActive']);
      allow delete: if false; // Never allow deletion
    }
    
    // Game sessions
    match /games/{gameId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid &&
        isValidScore(request.resource.data.score);
      allow update: if false; // Games are immutable
      allow delete: if false;
    }
    
    // Leaderboards (read-only for users)
    match /leaderboards/{document=**} {
      allow read: if isAuthenticated();
      allow write: if false; // Only server can write
    }
    
    // Transactions (audit log)
    match /transactions/{transactionId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid &&
        isValidTransaction();
      allow update: if false; // Immutable
      allow delete: if false; // Never delete transactions
    }
    
    // Inventory
    match /inventory/{userId} {
      allow read: if isOwner(userId);
      allow write: if false; // Only server can modify inventory
    }
    
    // Events
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only server can modify
    }
    
    // Admin panel
    match /admin/{document=**} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
  }
}
`;

// ========== REALTIME DATABASE RULES ==========

export const realtimeDbRules = {
  rules: {
    '.read': false,
    '.write': false,

    presence: {
      $uid: {
        '.read': 'auth != null',
        '.write': 'auth != null && auth.uid === $uid',
        '.validate': "newData.hasChildren(['status', 'lastSeen'])",
      },
    },

    activeGames: {
      $gameId: {
        '.read': 'auth != null',
        '.write': "auth != null && data.child('userId').val() === auth.uid",
        '.validate': "newData.hasChildren(['userId', 'score', 'timestamp'])",
      },
    },

    liveLeaderboard: {
      '.read': 'auth != null',
      '.write': false,
      '.indexOn': ['score', 'timestamp'],
    },

    chatRooms: {
      $roomId: {
        messages: {
          $messageId: {
            '.read': 'auth != null',
            '.write': "auth != null && (!data.exists() || data.child('userId').val() === auth.uid)",
            '.validate':
              "newData.hasChildren(['userId', 'text', 'timestamp']) && newData.child('text').isString() && newData.child('text').val().length <= 200",
          },
        },
      },
    },
  },
};

// ========== PERFORMANCE MONITORING ==========

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTimer(operation: string): () => void {
    const start = Date.now();

    return () => {
      const duration = Date.now() - start;
      this.recordMetric(operation, duration);
    };
  }

  recordMetric(operation: string, value: number) {
    const metrics = this.metrics.get(operation) || [];
    metrics.push(value);

    // Keep only last 1000 metrics
    if (metrics.length > 1000) {
      metrics.shift();
    }

    this.metrics.set(operation, metrics);
  }

  getStats(operation: string) {
    const metrics = this.metrics.get(operation) || [];

    if (metrics.length === 0) {
      return null;
    }

    const sorted = [...metrics].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  async reportToAnalytics() {
    const allStats: any = {};

    for (const [operation, _] of this.metrics) {
      allStats[operation] = this.getStats(operation);
    }

    // Send to analytics service
    await this.sendToAnalytics(allStats);
  }

  private async sendToAnalytics(stats: any) {
    // Implementation for sending to Google Analytics or custom service
    console.log('Performance stats:', stats);
  }
}

export const performanceMonitor = new PerformanceMonitor();
