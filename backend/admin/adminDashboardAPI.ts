/**
 * Admin Dashboard API
 * Complete database management with security and audit trails
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { 
  db, 
  sanitizeInput, 
  encryptData, 
  decryptData,
  performanceMonitor 
} from '../firebaseConfig';
import { 
  validateAdminSession, 
  hasPermission, 
  logAdminAction,
  AdminRole 
} from './adminAuth';

// ========== USER MANAGEMENT ==========

/**
 * Get users with filtering and pagination
 * Users can ONLY see their own data, admins see all
 */
export const getUsers = functions.https.onCall(async (data, context) => {
  const timer = performanceMonitor.startTimer('admin_getUsers');
  
  try {
    // Validate admin session
    const token = context.auth?.token?.admin_token;
    const session = await validateAdminSession(token);
    
    if (!session || !hasPermission(session, 'users.read')) {
      throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
    }
    
    const { 
      limit = 50, 
      offset = 0, 
      filter = {},
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = sanitizeInput(data);
    
    // Build query
    let query = db.collection('users').orderBy(sortBy, sortOrder as any);
    
    // Apply filters
    if (filter.vipLevel) {
      query = query.where('vipLevel', '==', filter.vipLevel);
    }
    if (filter.country) {
      query = query.where('profile.country', '==', filter.country);
    }
    if (filter.banned) {
      query = query.where('security.banned', '==', true);
    }
    
    // Execute query with pagination
    const snapshot = await query.limit(limit).offset(offset).get();
    
    // Process users - remove sensitive data
    const users = snapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        id: doc.id,
        profile: {
          username: userData.profile?.username,
          email: userData.profile?.email ? maskEmail(userData.profile.email) : null,
          country: userData.profile?.country,
          avatar: userData.profile?.avatar,
        },
        stats: userData.stats,
        vipLevel: userData.vipLevel,
        createdAt: userData.createdAt,
        lastActive: userData.lastActive,
        banned: userData.security?.banned || false,
        violations: userData.security?.violations || 0,
      };
    });
    
    // Get total count
    const totalSnapshot = await db.collection('users').count().get();
    const total = totalSnapshot.data().count;
    
    // Log admin action
    await logAdminAction(session.adminId, 'view_users', {
      filter,
      limit,
      offset,
      resultsCount: users.length,
    });
    
    timer();
    
    return {
      users,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
    
  } catch (error) {
    timer();
    console.error('Get users error:', error);
    throw error;
  }
});

/**
 * Get specific user details
 * Regular users can ONLY access their own data
 */
export const getUserDetails = functions.https.onCall(async (data, context) => {
  const { userId } = sanitizeInput(data);
  
  // Check if regular user trying to access their own data
  if (context.auth && context.auth.uid === userId) {
    // User accessing their own data
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }
    
    const userData = userDoc.data()!;
    
    // Return only user's own data with privacy filters
    return {
      id: userId,
      profile: {
        username: userData.profile?.username,
        email: userData.profile?.email,
        avatar: userData.profile?.avatar,
        country: userData.profile?.country,
      },
      stats: userData.stats,
      inventory: userData.inventory,
      achievements: userData.achievements,
      vipLevel: userData.vipLevel,
      // Don't include sensitive security data
    };
  }
  
  // Admin accessing user data
  const token = context.auth?.token?.admin_token;
  const session = await validateAdminSession(token);
  
  if (!session || !hasPermission(session, 'users.read')) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot access other users data');
  }
  
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }
  
  const userData = userDoc.data()!;
  
  // Get additional admin-only data
  const gamesCount = await db.collection('games')
    .where('userId', '==', userId)
    .count()
    .get();
  
  const transactionsCount = await db.collection('transactions')
    .where('userId', '==', userId)
    .count()
    .get();
  
  // Log admin action
  await logAdminAction(session.adminId, 'view_user_details', {
    userId,
    reason: data.reason || 'inspection',
  });
  
  return {
    id: userId,
    profile: userData.profile,
    stats: userData.stats,
    inventory: userData.inventory,
    security: userData.security,
    vipLevel: userData.vipLevel,
    testAccess: userData.testAccess,
    createdAt: userData.createdAt,
    lastActive: userData.lastActive,
    gamesPlayed: gamesCount.data().count,
    transactions: transactionsCount.data().count,
    deviceInfo: userData.deviceInfo, // Last known device
  };
});

/**
 * Modify user data (admin only)
 */
export const modifyUser = functions.https.onCall(async (data, context) => {
  const token = context.auth?.token?.admin_token;
  const session = await validateAdminSession(token);
  
  if (!session || !hasPermission(session, 'users.write')) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }
  
  const { userId, updates, reason } = sanitizeInput(data);
  
  // Validate updates
  const allowedFields = [
    'stats.coins', 'stats.gems', 'stats.level',
    'vipLevel', 'security.banned', 'testAccess'
  ];
  
  const filteredUpdates: any = {};
  for (const key of Object.keys(updates)) {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  }
  
  // Apply updates
  await db.collection('users').doc(userId).update(filteredUpdates);
  
  // Log admin action with full audit trail
  await logAdminAction(session.adminId, 'modify_user', {
    userId,
    updates: filteredUpdates,
    reason,
    timestamp: Date.now(),
  });
  
  // Send notification to user if banned/unbanned
  if ('security.banned' in filteredUpdates) {
    await notifyUserOfAccountChange(userId, filteredUpdates['security.banned']);
  }
  
  return { success: true, modified: Object.keys(filteredUpdates) };
});

/**
 * Ban/unban user
 */
export const banUser = functions.https.onCall(async (data, context) => {
  const token = context.auth?.token?.admin_token;
  const session = await validateAdminSession(token);
  
  if (!session || !hasPermission(session, 'users.write')) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }
  
  const { userId, ban, duration, reason } = sanitizeInput(data);
  
  const updates: any = {
    'security.banned': ban,
    'security.banReason': reason,
  };
  
  if (ban && duration) {
    updates['security.banUntil'] = admin.firestore.Timestamp.fromMillis(
      Date.now() + duration
    );
  }
  
  await db.collection('users').doc(userId).update(updates);
  
  // Revoke user's auth tokens
  if (ban) {
    await admin.auth().revokeRefreshTokens(userId);
  }
  
  // Log action
  await logAdminAction(session.adminId, ban ? 'ban_user' : 'unban_user', {
    userId,
    duration,
    reason,
  });
  
  return { success: true, banned: ban };
});

// ========== GAME DATA MANAGEMENT ==========

/**
 * Get game sessions
 */
export const getGameSessions = functions.https.onCall(async (data, context) => {
  const token = context.auth?.token?.admin_token;
  const session = await validateAdminSession(token);
  
  if (!session || !hasPermission(session, 'games.read')) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }
  
  const { userId, limit = 50, offset = 0 } = sanitizeInput(data);
  
  let query = db.collection('games').orderBy('startTime', 'desc');
  
  if (userId) {
    query = query.where('userId', '==', userId);
  }
  
  const snapshot = await query.limit(limit).offset(offset).get();
  
  const games = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // Remove sensitive server seeds
    serverSeed: undefined,
  }));
  
  await logAdminAction(session.adminId, 'view_games', {
    userId,
    count: games.length,
  });
  
  return { games };
});

/**
 * Invalidate suspicious game session
 */
export const invalidateGameSession = functions.https.onCall(async (data, context) => {
  const token = context.auth?.token?.admin_token;
  const session = await validateAdminSession(token);
  
  if (!session || !hasPermission(session, 'games.write')) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }
  
  const { gameId, reason } = sanitizeInput(data);
  
  await db.collection('games').doc(gameId).update({
    invalidated: true,
    invalidatedBy: session.adminId,
    invalidationReason: reason,
    invalidatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Remove from leaderboards
  // Implementation here
  
  await logAdminAction(session.adminId, 'invalidate_game', {
    gameId,
    reason,
  });
  
  return { success: true };
});

// ========== TRANSACTION MANAGEMENT ==========

/**
 * Get transactions with filtering
 */
export const getTransactions = functions.https.onCall(async (data, context) => {
  const token = context.auth?.token?.admin_token;
  const session = await validateAdminSession(token);
  
  if (!session || !hasPermission(session, 'transactions.read')) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }
  
  const { 
    userId, 
    type, 
    startDate, 
    endDate, 
    limit = 50 
  } = sanitizeInput(data);
  
  let query = db.collection('transactions').orderBy('timestamp', 'desc');
  
  if (userId) {
    query = query.where('userId', '==', userId);
  }
  if (type) {
    query = query.where('type', '==', type);
  }
  if (startDate) {
    query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromMillis(startDate));
  }
  if (endDate) {
    query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromMillis(endDate));
  }
  
  const snapshot = await query.limit(limit).get();
  
  const transactions = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      timestamp: data.timestamp,
      // Decrypt sensitive data only for super admins
      details: session.role === AdminRole.SUPER_ADMIN && data.encrypted 
        ? decryptData(data.encrypted) 
        : null,
    };
  });
  
  await logAdminAction(session.adminId, 'view_transactions', {
    filters: { userId, type, startDate, endDate },
    count: transactions.length,
  });
  
  return { transactions };
});

/**
 * Refund transaction
 */
export const refundTransaction = functions.https.onCall(async (data, context) => {
  const token = context.auth?.token?.admin_token;
  const session = await validateAdminSession(token);
  
  if (!session || !hasPermission(session, 'transactions.write')) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }
  
  const { transactionId, reason } = sanitizeInput(data);
  
  // Get transaction
  const transactionDoc = await db.collection('transactions').doc(transactionId).get();
  
  if (!transactionDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Transaction not found');
  }
  
  const transaction = transactionDoc.data()!;
  
  // Process refund
  await db.runTransaction(async (t) => {
    // Update user balance
    const userRef = db.collection('users').doc(transaction.userId);
    const userDoc = await t.get(userRef);
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    // Reverse the transaction
    if (transaction.type === 'purchase') {
      t.update(userRef, {
        'inventory.gems': admin.firestore.FieldValue.increment(transaction.amount.gems || 0),
      });
    }
    
    // Mark transaction as refunded
    t.update(db.collection('transactions').doc(transactionId), {
      refunded: true,
      refundedBy: session.adminId,
      refundReason: reason,
      refundedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Create refund record
    t.set(db.collection('refunds').doc(), {
      originalTransactionId: transactionId,
      userId: transaction.userId,
      amount: transaction.amount,
      reason,
      processedBy: session.adminId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  
  await logAdminAction(session.adminId, 'refund_transaction', {
    transactionId,
    userId: transaction.userId,
    amount: transaction.amount,
    reason,
  });
  
  return { success: true };
});

// ========== ANALYTICS & MONITORING ==========

/**
 * Get real-time analytics
 */
export const getAnalytics = functions.https.onCall(async (data, context) => {
  const token = context.auth?.token?.admin_token;
  const session = await validateAdminSession(token);
  
  if (!session || !hasPermission(session, 'analytics.read')) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }
  
  const { period = 'day' } = sanitizeInput(data);
  
  const now = Date.now();
  const periodMs = period === 'day' ? 86400000 : period === 'week' ? 604800000 : 2592000000;
  const startTime = admin.firestore.Timestamp.fromMillis(now - periodMs);
  
  // Get various metrics
  const [
    activeUsers,
    newUsers,
    revenue,
    gamesPlayed,
    avgSessionLength,
  ] = await Promise.all([
    getActiveUsers(startTime),
    getNewUsers(startTime),
    getRevenue(startTime),
    getGamesPlayed(startTime),
    getAvgSessionLength(startTime),
  ]);
  
  await logAdminAction(session.adminId, 'view_analytics', { period });
  
  return {
    activeUsers,
    newUsers,
    revenue,
    gamesPlayed,
    avgSessionLength,
    timestamp: now,
  };
});

/**
 * Get system health metrics
 */
export const getSystemHealth = functions.https.onCall(async (data, context) => {
  const token = context.auth?.token?.admin_token;
  const session = await validateAdminSession(token);
  
  if (!session || session.role !== AdminRole.SUPER_ADMIN) {
    throw new functions.https.HttpsError('permission-denied', 'Super admin only');
  }
  
  return {
    api: {
      responseTime: performanceMonitor.getStats('*'),
      errorRate: await getErrorRate(),
      uptime: process.uptime(),
    },
    database: {
      reads: await getDbReads(),
      writes: await getDbWrites(),
      size: await getDbSize(),
    },
    security: {
      failedLogins: await getFailedLogins(),
      suspiciousActivity: await getSuspiciousActivity(),
      activeThreats: await getActiveThreats(),
    },
  };
});

// ========== CONTENT MANAGEMENT ==========

/**
 * Manage game events
 */
export const manageEvent = functions.https.onCall(async (data, context) => {
  const token = context.auth?.token?.admin_token;
  const session = await validateAdminSession(token);
  
  if (!session || !hasPermission(session, 'events.write')) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }
  
  const { action, eventId, eventData } = sanitizeInput(data);
  
  switch (action) {
    case 'create':
      const newEvent = await db.collection('events').add({
        ...eventData,
        createdBy: session.adminId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      await logAdminAction(session.adminId, 'create_event', {
        eventId: newEvent.id,
        eventData,
      });
      
      return { success: true, eventId: newEvent.id };
      
    case 'update':
      await db.collection('events').doc(eventId).update(eventData);
      
      await logAdminAction(session.adminId, 'update_event', {
        eventId,
        updates: eventData,
      });
      
      return { success: true };
      
    case 'delete':
      await db.collection('events').doc(eventId).delete();
      
      await logAdminAction(session.adminId, 'delete_event', { eventId });
      
      return { success: true };
      
    default:
      throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
  }
});

// ========== SUPPORT FUNCTIONS ==========

/**
 * Respond to user feedback
 */
export const respondToFeedback = functions.https.onCall(async (data, context) => {
  const token = context.auth?.token?.admin_token;
  const session = await validateAdminSession(token);
  
  if (!session || !hasPermission(session, 'support.respond')) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }
  
  const { feedbackId, response, status } = sanitizeInput(data);
  
  await db.collection('feedback').doc(feedbackId).update({
    response,
    status,
    respondedBy: session.adminId,
    respondedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Notify user
  const feedbackDoc = await db.collection('feedback').doc(feedbackId).get();
  const feedback = feedbackDoc.data()!;
  await notifyUserOfFeedbackResponse(feedback.userId, feedbackId, response);
  
  await logAdminAction(session.adminId, 'respond_feedback', {
    feedbackId,
    status,
  });
  
  return { success: true };
});

// ========== HELPER FUNCTIONS ==========

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const masked = local.substring(0, 2) + '***';
  return `${masked}@${domain}`;
}

async function notifyUserOfAccountChange(userId: string, banned: boolean): Promise<void> {
  // Send push notification or email
  console.log(`User ${userId} account ${banned ? 'banned' : 'unbanned'}`);
}

async function notifyUserOfFeedbackResponse(
  userId: string, 
  feedbackId: string, 
  response: string
): Promise<void> {
  // Send notification
  console.log(`Feedback ${feedbackId} responded for user ${userId}`);
}

async function getActiveUsers(since: any): Promise<number> {
  const snapshot = await db.collection('users')
    .where('lastActive', '>=', since)
    .count()
    .get();
  return snapshot.data().count;
}

async function getNewUsers(since: any): Promise<number> {
  const snapshot = await db.collection('users')
    .where('createdAt', '>=', since)
    .count()
    .get();
  return snapshot.data().count;
}

async function getRevenue(since: any): Promise<number> {
  const snapshot = await db.collection('transactions')
    .where('type', '==', 'purchase')
    .where('timestamp', '>=', since)
    .get();
  
  return snapshot.docs.reduce((total, doc) => {
    const amount = doc.data().amount;
    return total + (amount.usd || 0);
  }, 0);
}

async function getGamesPlayed(since: any): Promise<number> {
  const snapshot = await db.collection('games')
    .where('startTime', '>=', since)
    .count()
    .get();
  return snapshot.data().count;
}

async function getAvgSessionLength(since: any): Promise<number> {
  const snapshot = await db.collection('games')
    .where('startTime', '>=', since)
    .where('status', '==', 'completed')
    .limit(100)
    .get();
  
  if (snapshot.empty) return 0;
  
  const totalLength = snapshot.docs.reduce((total, doc) => {
    const data = doc.data();
    if (data.endTime && data.startTime) {
      return total + (data.endTime.toMillis() - data.startTime.toMillis());
    }
    return total;
  }, 0);
  
  return Math.round(totalLength / snapshot.size / 1000); // In seconds
}

async function getErrorRate(): Promise<number> {
  // Implementation to get error rate from logs
  return 0.01; // 1% error rate
}

async function getDbReads(): Promise<number> {
  // Get from Firebase usage API
  return 1000000;
}

async function getDbWrites(): Promise<number> {
  // Get from Firebase usage API
  return 500000;
}

async function getDbSize(): Promise<string> {
  // Get from Firebase usage API
  return '2.5 GB';
}

async function getFailedLogins(): Promise<number> {
  const since = admin.firestore.Timestamp.fromMillis(Date.now() - 86400000);
  const snapshot = await db.collection('admin_login_attempts')
    .where('success', '==', false)
    .where('timestamp', '>=', since)
    .count()
    .get();
  return snapshot.data().count;
}

async function getSuspiciousActivity(): Promise<number> {
  const since = admin.firestore.Timestamp.fromMillis(Date.now() - 86400000);
  const snapshot = await db.collection('suspicious_activity')
    .where('timestamp', '>=', since)
    .where('reviewed', '==', false)
    .count()
    .get();
  return snapshot.data().count;
}

async function getActiveThreats(): Promise<number> {
  const snapshot = await db.collection('security_threats')
    .where('active', '==', true)
    .count()
    .get();
  return snapshot.data().count;
}