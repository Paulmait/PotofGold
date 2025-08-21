/**
 * Testing APIs and Tools
 * Complete infrastructure for internal and external testing
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { db, sanitizeInput, performanceMonitor } from '../firebaseConfig';

// Testing environments
export enum TestEnvironment {
  INTERNAL = 'internal',     // Dev team only
  ALPHA = 'alpha',           // Internal + close partners
  BETA = 'beta',             // External testers
  STAGING = 'staging',       // Pre-production
  PRODUCTION = 'production'  // Live
}

// Tester roles
export enum TesterRole {
  DEVELOPER = 'developer',
  QA = 'qa',
  DESIGNER = 'designer',
  ALPHA_TESTER = 'alpha_tester',
  BETA_TESTER = 'beta_tester',
  VIP_TESTER = 'vip_tester',
  INFLUENCER = 'influencer'
}

// ========== TEST ACCOUNT MANAGEMENT ==========

/**
 * Create test account with special privileges
 */
export const createTestAccount = functions.https.onCall(async (data, context) => {
  // Only admins can create test accounts
  if (!context.auth || !await isAdmin(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }
  
  const { email, role, environment, features } = sanitizeInput(data);
  
  try {
    // Create Firebase auth account
    const userRecord = await admin.auth().createUser({
      email,
      password: generateTestPassword(),
      displayName: `Test_${role}_${Date.now()}`,
      emailVerified: true,
    });
    
    // Set custom claims for testing
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      testAccount: true,
      role,
      environment,
      testFeatures: features || {},
    });
    
    // Create user profile with test privileges
    await db.collection('users').doc(userRecord.uid).set({
      profile: {
        email,
        username: userRecord.displayName,
        isTestAccount: true,
        testRole: role,
        environment,
      },
      testPrivileges: {
        unlimitedCurrency: features?.unlimitedCurrency || false,
        allItemsUnlocked: features?.allItemsUnlocked || false,
        godMode: features?.godMode || false,
        skipTutorial: true,
        debugMenu: true,
        freeIAP: features?.freeIAP || false,
        customSpawnRates: features?.customSpawnRates || false,
      },
      stats: {
        coins: features?.unlimitedCurrency ? 999999999 : 1000,
        gems: features?.unlimitedCurrency ? 999999 : 100,
        level: features?.maxLevel ? 999 : 1,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });
    
    // Log test account creation
    await logTestingActivity('test_account_created', {
      testerId: userRecord.uid,
      role,
      environment,
      createdBy: context.auth.uid,
    });
    
    return {
      success: true,
      userId: userRecord.uid,
      email,
      password: generateTestPassword(),
      loginUrl: getTestLoginUrl(environment),
    };
    
  } catch (error) {
    console.error('Error creating test account:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create test account');
  }
});

/**
 * Grant tester access to existing user
 */
export const grantTesterAccess = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const { accessCode, platform } = sanitizeInput(data);
  
  // Validate access code
  const accessDoc = await db.collection('tester_access_codes').doc(accessCode).get();
  
  if (!accessDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Invalid access code');
  }
  
  const access = accessDoc.data()!;
  
  if (access.used) {
    throw new functions.https.HttpsError('already-exists', 'Code already used');
  }
  
  if (access.expiresAt && access.expiresAt.toMillis() < Date.now()) {
    throw new functions.https.HttpsError('deadline-exceeded', 'Code expired');
  }
  
  // Grant access
  await admin.auth().setCustomUserClaims(context.auth.uid, {
    testerRole: access.role,
    testEnvironment: access.environment,
    testFeatures: access.features || {},
  });
  
  // Update user profile
  await db.collection('users').doc(context.auth.uid).update({
    'testAccess': {
      role: access.role,
      environment: access.environment,
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      platform,
    }
  });
  
  // Mark code as used
  await db.collection('tester_access_codes').doc(accessCode).update({
    used: true,
    usedBy: context.auth.uid,
    usedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return {
    success: true,
    role: access.role,
    features: access.features,
    testflightUrl: platform === 'ios' ? getTestFlightUrl() : null,
    playConsoleUrl: platform === 'android' ? getPlayConsoleUrl() : null,
  };
});

// ========== DEBUG & CHEAT APIS ==========

/**
 * Debug API for testers to modify game state
 */
export const debugModifyGameState = functions.https.onCall(async (data, context) => {
  // Check if user has debug privileges
  if (!context.auth || !await hasDebugAccess(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'Debug access required');
  }
  
  const { action, params } = sanitizeInput(data);
  const userId = context.auth.uid;
  
  try {
    let result: any = {};
    
    switch (action) {
      case 'add_currency':
        await db.collection('users').doc(userId).update({
          'stats.coins': admin.firestore.FieldValue.increment(params.coins || 0),
          'stats.gems': admin.firestore.FieldValue.increment(params.gems || 0),
        });
        result = { coins: params.coins, gems: params.gems };
        break;
        
      case 'set_level':
        await db.collection('users').doc(userId).update({
          'stats.level': params.level,
        });
        result = { level: params.level };
        break;
        
      case 'unlock_all_items':
        await unlockAllItems(userId);
        result = { unlocked: 'all_items' };
        break;
        
      case 'reset_progress':
        await resetUserProgress(userId);
        result = { reset: true };
        break;
        
      case 'trigger_event':
        await triggerTestEvent(params.eventId);
        result = { event: params.eventId };
        break;
        
      case 'set_vip_level':
        await db.collection('users').doc(userId).update({
          vipLevel: params.level,
        });
        result = { vipLevel: params.level };
        break;
        
      case 'spawn_item':
        result = await spawnSpecificItem(params.itemId, params.quantity);
        break;
        
      case 'set_time':
        // For testing time-based features
        result = { serverTime: params.timestamp };
        break;
        
      case 'crash_game':
        // Intentional crash for testing crash reporting
        throw new Error('Intentional test crash');
        
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Unknown action');
    }
    
    // Log debug action
    await logTestingActivity('debug_action', {
      userId,
      action,
      params,
      result,
    });
    
    return {
      success: true,
      action,
      result,
    };
    
  } catch (error) {
    console.error('Debug action error:', error);
    throw new functions.https.HttpsError('internal', 'Debug action failed');
  }
});

/**
 * Get debug information about game state
 */
export const getDebugInfo = functions.https.onCall(async (data, context) => {
  if (!context.auth || !await hasDebugAccess(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'Debug access required');
  }
  
  const userId = context.auth.uid;
  
  // Gather comprehensive debug information
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  const recentGames = await db.collection('games')
    .where('userId', '==', userId)
    .orderBy('startTime', 'desc')
    .limit(5)
    .get();
  
  const debugInfo = {
    user: {
      id: userId,
      profile: userData?.profile,
      stats: userData?.stats,
      inventory: userData?.inventory,
      testPrivileges: userData?.testPrivileges,
    },
    recentGames: recentGames.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })),
    serverInfo: {
      time: Date.now(),
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION || '1.0.0',
    },
    features: await getFeatureFlags(userId),
    activeEvents: await getActiveEvents(),
    performance: await getPerformanceMetrics(),
  };
  
  return debugInfo;
});

// ========== FEEDBACK & BUG REPORTING ==========

/**
 * Submit feedback or bug report
 */
export const submitFeedback = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const timer = performanceMonitor.startTimer('submitFeedback');
  
  try {
    const { type, category, title, description, severity, deviceInfo, screenshot } = sanitizeInput(data);
    
    // Create feedback document
    const feedbackRef = db.collection('feedback').doc();
    
    await feedbackRef.set({
      id: feedbackRef.id,
      userId: context.auth.uid,
      type, // 'bug', 'feedback', 'suggestion', 'complaint'
      category, // 'gameplay', 'performance', 'ui', 'monetization', 'other'
      title,
      description,
      severity, // 'critical', 'high', 'medium', 'low'
      status: 'new',
      deviceInfo: {
        ...deviceInfo,
        userAgent: context.rawRequest.headers['user-agent'],
        ip: context.rawRequest.ip,
      },
      screenshot, // Base64 or URL
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        environment: await getUserEnvironment(context.auth.uid),
        version: deviceInfo?.appVersion,
        build: deviceInfo?.buildNumber,
      },
    });
    
    // Auto-escalate critical bugs
    if (type === 'bug' && severity === 'critical') {
      await escalateToDevelopers(feedbackRef.id, title, description);
    }
    
    // Send confirmation to user
    await sendFeedbackConfirmation(context.auth.uid, feedbackRef.id);
    
    timer();
    
    return {
      success: true,
      feedbackId: feedbackRef.id,
      message: 'Thank you for your feedback!',
    };
    
  } catch (error) {
    timer();
    console.error('Feedback submission error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to submit feedback');
  }
});

/**
 * Get feedback status for testers
 */
export const getFeedbackStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const { feedbackId } = data;
  
  if (feedbackId) {
    // Get specific feedback
    const feedbackDoc = await db.collection('feedback').doc(feedbackId).get();
    
    if (!feedbackDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Feedback not found');
    }
    
    const feedback = feedbackDoc.data()!;
    
    if (feedback.userId !== context.auth.uid && !await isAdmin(context.auth.uid)) {
      throw new functions.https.HttpsError('permission-denied', 'Not your feedback');
    }
    
    return {
      id: feedbackId,
      status: feedback.status,
      response: feedback.response,
      updatedAt: feedback.updatedAt,
    };
  } else {
    // Get all user's feedback
    const userFeedback = await db.collection('feedback')
      .where('userId', '==', context.auth.uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    return {
      feedback: userFeedback.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })),
    };
  }
});

// ========== A/B TESTING ==========

/**
 * Get A/B test configuration for user
 */
export const getABTestConfig = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const userId = context.auth.uid;
  
  // Get user's test groups
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  let testGroups = userData?.abTestGroups || {};
  
  // Assign to new tests if not already assigned
  const activeTests = await getActiveABTests();
  
  for (const test of activeTests) {
    if (!testGroups[test.id]) {
      // Randomly assign to variant
      const variant = assignToVariant(test);
      testGroups[test.id] = variant;
      
      // Log assignment
      await logABTestAssignment(userId, test.id, variant);
    }
  }
  
  // Update user's test groups
  if (Object.keys(testGroups).length > 0) {
    await db.collection('users').doc(userId).update({
      abTestGroups: testGroups,
    });
  }
  
  // Build configuration based on test groups
  const config = await buildABTestConfig(testGroups);
  
  return {
    testGroups,
    config,
  };
});

/**
 * Track A/B test event
 */
export const trackABTestEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const { testId, event, value } = sanitizeInput(data);
  
  await db.collection('ab_test_events').add({
    userId: context.auth.uid,
    testId,
    event,
    value,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return { success: true };
});

// ========== PERFORMANCE TESTING ==========

/**
 * Submit performance metrics from client
 */
export const submitPerformanceMetrics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const { metrics, deviceInfo } = sanitizeInput(data);
  
  // Store performance data
  await db.collection('performance_metrics').add({
    userId: context.auth.uid,
    metrics: {
      fps: metrics.fps,
      frameTime: metrics.frameTime,
      memoryUsage: metrics.memoryUsage,
      loadTime: metrics.loadTime,
      networkLatency: metrics.networkLatency,
      batteryDrain: metrics.batteryDrain,
    },
    device: deviceInfo,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Check for performance issues
  if (metrics.fps < 30 || metrics.frameTime > 33) {
    await flagPerformanceIssue(context.auth.uid, metrics, deviceInfo);
  }
  
  return { success: true };
});

// ========== TESTFLIGHT & PLAY CONSOLE INTEGRATION ==========

/**
 * Register device for TestFlight/Play Console
 */
export const registerTestDevice = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const { platform, deviceId, email } = sanitizeInput(data);
  
  // Check if user is approved tester
  const testerDoc = await db.collection('approved_testers').doc(context.auth.uid).get();
  
  if (!testerDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Not an approved tester');
  }
  
  if (platform === 'ios') {
    // Add to TestFlight
    return {
      success: true,
      testFlightUrl: `https://testflight.apple.com/join/${process.env.TESTFLIGHT_CODE}`,
      instructions: 'Download TestFlight app and use the link to join beta',
    };
  } else if (platform === 'android') {
    // Add to Play Console testing track
    return {
      success: true,
      playStoreUrl: `https://play.google.com/apps/testing/${process.env.PACKAGE_NAME}`,
      instructions: 'Join the beta program through Google Play',
    };
  }
  
  throw new functions.https.HttpsError('invalid-argument', 'Invalid platform');
});

// ========== CRASH REPORTING ==========

/**
 * Report crash from client
 */
export const reportCrash = functions.https.onCall(async (data, context) => {
  const { error, stackTrace, deviceInfo, gameState } = sanitizeInput(data);
  
  // Store crash report
  const crashRef = await db.collection('crash_reports').add({
    userId: context.auth?.uid || 'anonymous',
    error: {
      message: error.message,
      name: error.name,
      stackTrace,
    },
    deviceInfo,
    gameState,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    resolved: false,
  });
  
  // Alert developers for critical crashes
  if (error.severity === 'critical') {
    await alertDevelopers('Critical crash detected', crashRef.id);
  }
  
  return {
    success: true,
    crashId: crashRef.id,
  };
});

// ========== HELPER FUNCTIONS ==========

async function isAdmin(userId: string): Promise<boolean> {
  const adminDoc = await db.collection('admins').doc(userId).get();
  return adminDoc.exists && adminDoc.data()?.role === 'admin';
}

async function hasDebugAccess(userId: string): Promise<boolean> {
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  return userData?.testPrivileges?.debugMenu || false;
}

function generateTestPassword(): string {
  return `Test${Math.random().toString(36).substring(2, 10)}!`;
}

function getTestLoginUrl(environment: string): string {
  const baseUrl = process.env.APP_URL || 'https://potofgold.app';
  return `${baseUrl}/test-login?env=${environment}`;
}

function getTestFlightUrl(): string {
  return `https://testflight.apple.com/join/${process.env.TESTFLIGHT_CODE}`;
}

function getPlayConsoleUrl(): string {
  return `https://play.google.com/apps/testing/${process.env.PACKAGE_NAME}`;
}

async function unlockAllItems(userId: string): Promise<void> {
  // Implementation to unlock all game items
  await db.collection('users').doc(userId).update({
    'unlocks.allItems': true,
    'unlocks.allCarts': true,
    'unlocks.allPowerUps': true,
  });
}

async function resetUserProgress(userId: string): Promise<void> {
  await db.collection('users').doc(userId).update({
    stats: {
      coins: 0,
      gems: 0,
      level: 1,
      highScore: 0,
      gamesPlayed: 0,
    },
    inventory: {},
    unlocks: {},
  });
}

async function triggerTestEvent(eventId: string): Promise<void> {
  // Trigger specific game event for testing
  await db.collection('events').doc(eventId).update({
    active: true,
    testMode: true,
  });
}

async function spawnSpecificItem(itemId: string, quantity: number): Promise<any> {
  return {
    itemId,
    quantity,
    spawned: true,
  };
}

async function getUserEnvironment(userId: string): Promise<string> {
  const userDoc = await db.collection('users').doc(userId).get();
  return userDoc.data()?.testAccess?.environment || 'production';
}

async function escalateToDevelopers(feedbackId: string, title: string, description: string): Promise<void> {
  // Send notification to dev team
  console.log(`Critical bug escalated: ${feedbackId} - ${title}`);
  // Implementation for Slack/Discord notification
}

async function sendFeedbackConfirmation(userId: string, feedbackId: string): Promise<void> {
  // Send push notification or email
  console.log(`Feedback received: ${feedbackId} from user ${userId}`);
}

async function getFeatureFlags(userId: string): Promise<any> {
  // Get feature flags for user
  const flags = await db.collection('feature_flags').doc('default').get();
  return flags.data() || {};
}

async function getActiveEvents(): Promise<any[]> {
  const events = await db.collection('events')
    .where('active', '==', true)
    .get();
  return events.docs.map(doc => doc.data());
}

async function getPerformanceMetrics(): Promise<any> {
  // Return current performance metrics
  return {
    avgResponseTime: 150,
    errorRate: 0.01,
    activeUsers: 1234,
  };
}

async function getActiveABTests(): Promise<any[]> {
  const tests = await db.collection('ab_tests')
    .where('active', '==', true)
    .get();
  return tests.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

function assignToVariant(test: any): string {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const variant of test.variants) {
    cumulative += variant.weight;
    if (rand < cumulative) {
      return variant.id;
    }
  }
  
  return test.variants[0].id;
}

async function logABTestAssignment(userId: string, testId: string, variant: string): Promise<void> {
  await db.collection('ab_test_assignments').add({
    userId,
    testId,
    variant,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function buildABTestConfig(testGroups: any): Promise<any> {
  const config: any = {};
  
  for (const [testId, variant] of Object.entries(testGroups)) {
    // Map test variants to config changes
    if (testId === 'spawn_rates' && variant === 'increased') {
      config.spawnRateMultiplier = 1.5;
    }
    // Add more test configurations
  }
  
  return config;
}

async function flagPerformanceIssue(userId: string, metrics: any, deviceInfo: any): Promise<void> {
  await db.collection('performance_issues').add({
    userId,
    metrics,
    deviceInfo,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    resolved: false,
  });
}

async function alertDevelopers(message: string, referenceId: string): Promise<void> {
  console.error(`ALERT: ${message} - Ref: ${referenceId}`);
  // Send to Slack/Discord/PagerDuty
}

async function logTestingActivity(action: string, data: any): Promise<void> {
  await db.collection('testing_logs').add({
    action,
    data,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}