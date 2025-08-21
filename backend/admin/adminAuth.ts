/**
 * Admin Authentication System with MFA
 * Multi-layer security for admin access
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { db, encryptData, decryptData, hashData } from '../firebaseConfig';
import * as geoip from 'geoip-lite';
import * as crypto from 'crypto';

// Admin roles hierarchy
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',     // Full access
  ADMIN = 'admin',                  // Most access
  MODERATOR = 'moderator',          // User management
  SUPPORT = 'support',              // Read-only + support actions
  ANALYST = 'analyst',              // Read-only analytics
}

// Admin permissions
export const ADMIN_PERMISSIONS = {
  [AdminRole.SUPER_ADMIN]: ['*'], // All permissions
  [AdminRole.ADMIN]: [
    'users.read', 'users.write', 'users.delete',
    'games.read', 'games.write',
    'transactions.read', 'transactions.write',
    'events.read', 'events.write',
    'analytics.read',
    'support.all',
  ],
  [AdminRole.MODERATOR]: [
    'users.read', 'users.write',
    'games.read',
    'support.respond',
    'analytics.read',
  ],
  [AdminRole.SUPPORT]: [
    'users.read',
    'games.read',
    'transactions.read',
    'support.respond',
  ],
  [AdminRole.ANALYST]: [
    'analytics.read',
    'users.read',
    'games.read',
  ],
};

interface AdminSession {
  adminId: string;
  role: AdminRole;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  mfaVerified: boolean;
  permissions: string[];
  expiresAt: number;
  lastActivity: number;
}

// ========== MFA SETUP ==========

/**
 * Enable MFA for admin account
 */
export const setupAdminMFA = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const adminId = context.auth.uid;
  
  // Verify admin status
  if (!await isAdmin(adminId)) {
    throw new functions.https.HttpsError('permission-denied', 'Not an admin');
  }
  
  // Generate secret for TOTP
  const secret = speakeasy.generateSecret({
    name: `PotOfGold Admin (${context.auth.token.email})`,
    issuer: 'Pot of Gold Admin Panel',
    length: 32,
  });
  
  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
  
  // Store encrypted secret
  await db.collection('admin_mfa').doc(adminId).set({
    secret: encryptData(secret.base32),
    backup_codes: generateBackupCodes(),
    enabled: false, // Will be enabled after first verification
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Log MFA setup attempt
  await logAdminAction(adminId, 'mfa_setup_initiated', {
    ip: context.rawRequest.ip,
  });
  
  return {
    qrCode: qrCodeUrl,
    secret: secret.base32,
    backupCodes: generateBackupCodes(),
  };
});

/**
 * Verify MFA token
 */
export const verifyAdminMFA = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const { token, isSetup = false } = data;
  const adminId = context.auth.uid;
  
  // Get MFA secret
  const mfaDoc = await db.collection('admin_mfa').doc(adminId).get();
  
  if (!mfaDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'MFA not configured');
  }
  
  const mfaData = mfaDoc.data()!;
  const secret = decryptData(mfaData.secret);
  
  // Verify token
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time windows for clock drift
  });
  
  if (!verified) {
    // Check backup codes
    const backupCodes = mfaData.backup_codes || [];
    const codeIndex = backupCodes.indexOf(token);
    
    if (codeIndex === -1) {
      await logAdminAction(adminId, 'mfa_failed', {
        ip: context.rawRequest.ip,
      });
      throw new functions.https.HttpsError('invalid-argument', 'Invalid MFA token');
    }
    
    // Remove used backup code
    backupCodes.splice(codeIndex, 1);
    await db.collection('admin_mfa').doc(adminId).update({
      backup_codes: backupCodes,
    });
  }
  
  // Enable MFA if this is setup verification
  if (isSetup) {
    await db.collection('admin_mfa').doc(adminId).update({
      enabled: true,
      verified_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  
  // Create admin session
  const session = await createAdminSession(adminId, context);
  
  return {
    success: true,
    sessionToken: session.token,
    expiresIn: 3600, // 1 hour
  };
});

// ========== ADMIN AUTHENTICATION ==========

/**
 * Admin login with enhanced security
 */
export const adminLogin = functions.https.onCall(async (data, context) => {
  const { email, password } = data;
  const ipAddress = context.rawRequest.ip;
  const userAgent = context.rawRequest.headers['user-agent'] || '';
  
  // Rate limiting
  if (!await checkLoginRateLimit(ipAddress)) {
    throw new functions.https.HttpsError('resource-exhausted', 'Too many login attempts');
  }
  
  try {
    // Authenticate with Firebase
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Verify admin status
    const adminDoc = await db.collection('admins').doc(userRecord.uid).get();
    
    if (!adminDoc.exists) {
      await logSuspiciousActivity('admin_login_attempt', {
        email,
        ip: ipAddress,
        reason: 'not_admin',
      });
      throw new functions.https.HttpsError('permission-denied', 'Invalid credentials');
    }
    
    const adminData = adminDoc.data()!;
    
    // Check if account is locked
    if (adminData.locked) {
      throw new functions.https.HttpsError('permission-denied', 'Account locked');
    }
    
    // Verify password (additional check)
    const passwordHash = adminData.password_hash;
    if (passwordHash && !await bcrypt.compare(password, passwordHash)) {
      await logFailedLogin(userRecord.uid, ipAddress);
      throw new functions.https.HttpsError('permission-denied', 'Invalid credentials');
    }
    
    // Check IP whitelist
    if (adminData.ip_whitelist && adminData.ip_whitelist.length > 0) {
      if (!adminData.ip_whitelist.includes(ipAddress)) {
        await logSuspiciousActivity('ip_not_whitelisted', {
          adminId: userRecord.uid,
          ip: ipAddress,
        });
        throw new functions.https.HttpsError('permission-denied', 'Access denied from this location');
      }
    }
    
    // Check for unusual location
    const location = geoip.lookup(ipAddress);
    if (location && adminData.usual_locations) {
      const isUnusualLocation = !adminData.usual_locations.includes(location.country);
      if (isUnusualLocation) {
        await alertAdminUnusualLogin(userRecord.uid, location, ipAddress);
      }
    }
    
    // Check MFA requirement
    const mfaDoc = await db.collection('admin_mfa').doc(userRecord.uid).get();
    const mfaRequired = mfaDoc.exists && mfaDoc.data()?.enabled;
    
    if (mfaRequired) {
      // Return partial session, require MFA
      return {
        requiresMFA: true,
        tempToken: generateTempToken(userRecord.uid),
      };
    }
    
    // Create full session
    const session = await createAdminSession(userRecord.uid, context);
    
    // Log successful login
    await logAdminAction(userRecord.uid, 'login_success', {
      ip: ipAddress,
      location: location?.country,
    });
    
    return {
      success: true,
      sessionToken: session.token,
      role: adminData.role,
      permissions: session.permissions,
      expiresIn: 3600,
    };
    
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
});

/**
 * Create secure admin session
 */
async function createAdminSession(adminId: string, context: any): Promise<any> {
  const adminDoc = await db.collection('admins').doc(adminId).get();
  const adminData = adminDoc.data()!;
  
  const sessionId = crypto.randomBytes(32).toString('hex');
  const ipAddress = context.rawRequest.ip;
  const userAgent = context.rawRequest.headers['user-agent'] || '';
  const location = geoip.lookup(ipAddress);
  
  const session: AdminSession = {
    adminId,
    role: adminData.role,
    sessionId,
    ipAddress,
    userAgent,
    location: location?.country,
    mfaVerified: true,
    permissions: ADMIN_PERMISSIONS[adminData.role] || [],
    expiresAt: Date.now() + 3600000, // 1 hour
    lastActivity: Date.now(),
  };
  
  // Store session
  await db.collection('admin_sessions').doc(sessionId).set(session);
  
  // Generate JWT
  const token = jwt.sign(
    {
      adminId,
      sessionId,
      role: adminData.role,
      permissions: session.permissions,
    },
    process.env.ADMIN_JWT_SECRET!,
    {
      expiresIn: '1h',
      issuer: 'potofgold-admin',
    }
  );
  
  return {
    token,
    sessionId,
    permissions: session.permissions,
  };
}

// ========== SESSION MANAGEMENT ==========

/**
 * Validate admin session
 */
export async function validateAdminSession(token: string): Promise<AdminSession | null> {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET!) as any;
    
    // Get session from database
    const sessionDoc = await db.collection('admin_sessions').doc(decoded.sessionId).get();
    
    if (!sessionDoc.exists) {
      return null;
    }
    
    const session = sessionDoc.data() as AdminSession;
    
    // Check expiration
    if (session.expiresAt < Date.now()) {
      await db.collection('admin_sessions').doc(decoded.sessionId).delete();
      return null;
    }
    
    // Check for session hijacking
    // Additional checks can be added here (IP, user agent, etc.)
    
    // Update last activity
    await db.collection('admin_sessions').doc(decoded.sessionId).update({
      lastActivity: Date.now(),
    });
    
    return session;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Revoke admin session
 */
export const revokeAdminSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const { sessionId } = data;
  
  await db.collection('admin_sessions').doc(sessionId).delete();
  
  await logAdminAction(context.auth.uid, 'session_revoked', { sessionId });
  
  return { success: true };
});

// ========== SECURITY FUNCTIONS ==========

/**
 * Check login rate limit
 */
async function checkLoginRateLimit(ipAddress: string): Promise<boolean> {
  const key = `login_attempts:${ipAddress}`;
  const attempts = await getLoginAttempts(key);
  
  if (attempts > 5) {
    return false; // Max 5 attempts per 15 minutes
  }
  
  await incrementLoginAttempts(key);
  return true;
}

/**
 * Log failed login attempt
 */
async function logFailedLogin(adminId: string, ipAddress: string): Promise<void> {
  await db.collection('admin_login_attempts').add({
    adminId,
    ipAddress,
    success: false,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Lock account after 5 failed attempts
  const recentAttempts = await db.collection('admin_login_attempts')
    .where('adminId', '==', adminId)
    .where('success', '==', false)
    .where('timestamp', '>', admin.firestore.Timestamp.fromMillis(Date.now() - 900000))
    .get();
  
  if (recentAttempts.size >= 5) {
    await db.collection('admins').doc(adminId).update({
      locked: true,
      locked_until: admin.firestore.Timestamp.fromMillis(Date.now() + 3600000),
    });
    
    await alertAdminAccountLocked(adminId);
  }
}

/**
 * Log suspicious activity
 */
async function logSuspiciousActivity(type: string, data: any): Promise<void> {
  await db.collection('admin_security_logs').add({
    type,
    data,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    reviewed: false,
  });
}

/**
 * Log admin actions for audit trail
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  data: any
): Promise<void> {
  await db.collection('admin_audit_log').add({
    adminId,
    action,
    data,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ip: data.ip || 'unknown',
  });
}

/**
 * Alert for unusual login
 */
async function alertAdminUnusualLogin(
  adminId: string,
  location: any,
  ipAddress: string
): Promise<void> {
  // Send email/SMS alert
  console.log(`ALERT: Unusual login for admin ${adminId} from ${location.country} (${ipAddress})`);
  
  // Could integrate with SendGrid, Twilio, etc.
}

/**
 * Alert for locked account
 */
async function alertAdminAccountLocked(adminId: string): Promise<void> {
  console.log(`ALERT: Admin account ${adminId} has been locked due to failed login attempts`);
}

// ========== HELPER FUNCTIONS ==========

/**
 * Check if user is admin
 */
async function isAdmin(userId: string): Promise<boolean> {
  const adminDoc = await db.collection('admins').doc(userId).get();
  return adminDoc.exists;
}

/**
 * Generate backup codes for MFA
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

/**
 * Generate temporary token for MFA flow
 */
function generateTempToken(adminId: string): string {
  return jwt.sign(
    { adminId, temp: true },
    process.env.ADMIN_JWT_SECRET!,
    { expiresIn: '5m' }
  );
}

/**
 * Get login attempts from cache
 */
async function getLoginAttempts(key: string): Promise<number> {
  // Implementation would use Redis or similar
  // For now, use Firestore
  const doc = await db.collection('rate_limits').doc(key).get();
  if (!doc.exists) return 0;
  
  const data = doc.data()!;
  if (data.expires_at.toMillis() < Date.now()) {
    await db.collection('rate_limits').doc(key).delete();
    return 0;
  }
  
  return data.attempts || 0;
}

/**
 * Increment login attempts
 */
async function incrementLoginAttempts(key: string): Promise<void> {
  const doc = await db.collection('rate_limits').doc(key).get();
  
  if (!doc.exists) {
    await db.collection('rate_limits').doc(key).set({
      attempts: 1,
      expires_at: admin.firestore.Timestamp.fromMillis(Date.now() + 900000), // 15 minutes
    });
  } else {
    await db.collection('rate_limits').doc(key).update({
      attempts: admin.firestore.FieldValue.increment(1),
    });
  }
}

// ========== PERMISSION CHECKING ==========

/**
 * Check if admin has specific permission
 */
export function hasPermission(
  session: AdminSession,
  permission: string
): boolean {
  if (session.role === AdminRole.SUPER_ADMIN) {
    return true; // Super admin has all permissions
  }
  
  return session.permissions.includes(permission) || 
         session.permissions.includes('*');
}

/**
 * Middleware for permission checking
 */
export function requirePermission(permission: string) {
  return async (data: any, context: any) => {
    const token = context.auth?.token?.admin_token;
    
    if (!token) {
      throw new functions.https.HttpsError('unauthenticated', 'Admin token required');
    }
    
    const session = await validateAdminSession(token);
    
    if (!session) {
      throw new functions.https.HttpsError('unauthenticated', 'Invalid session');
    }
    
    if (!hasPermission(session, permission)) {
      await logAdminAction(session.adminId, 'permission_denied', {
        permission,
        attempted_action: data,
      });
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }
    
    return { session, data, context };
  };
}