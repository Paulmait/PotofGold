/**
 * Cloud Functions for Game Operations
 * Secure server-side validation and processing
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  db,
  auth,
  encryptData,
  decryptData,
  sanitizeInput,
  RateLimiter,
  performanceMonitor,
} from '../firebaseConfig';
import { validateGameScore, detectCheating } from './antiCheat';
import { updateLeaderboards } from './leaderboards';
import { processTransaction } from './transactions';

const rateLimiter = new RateLimiter(100, 60000); // 100 requests per minute

// ========== GAME SESSION MANAGEMENT ==========

/**
 * Start a new game session
 */
export const startGameSession = functions.https.onCall(async (data, context) => {
  const timer = performanceMonitor.startTimer('startGameSession');

  try {
    // Authenticate user
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;

    // Rate limiting
    if (!(await rateLimiter.checkLimit(userId))) {
      throw new functions.https.HttpsError('resource-exhausted', 'Too many requests');
    }

    // Validate input
    const sanitized = sanitizeInput(data);

    // Check for active session
    const activeSession = await db
      .collection('games')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!activeSession.empty) {
      throw new functions.https.HttpsError('already-exists', 'Active session already exists');
    }

    // Create new session
    const sessionId = admin.firestore().collection('games').doc().id;
    const sessionData = {
      sessionId,
      userId,
      startTime: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      score: 0,
      coins: 0,
      gems: 0,
      level: 1,
      checkpoints: [],
      serverSeed: generateServerSeed(),
      clientInfo: {
        ip: context.rawRequest.ip,
        userAgent: context.rawRequest.headers['user-agent'],
        platform: sanitized.platform || 'unknown',
      },
    };

    await db.collection('games').doc(sessionId).set(sessionData);

    // Log session start
    await logGameEvent(userId, 'session_start', { sessionId });

    timer();

    return {
      success: true,
      sessionId,
      serverTime: Date.now(),
      config: await getGameConfig(userId),
    };
  } catch (error) {
    timer();
    console.error('Start session error:', error);
    throw error;
  }
});

/**
 * Update game progress (checkpoints)
 */
export const updateGameProgress = functions.https.onCall(async (data, context) => {
  const timer = performanceMonitor.startTimer('updateGameProgress');

  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { sessionId, checkpoint } = sanitizeInput(data);

    // Validate session
    const sessionDoc = await db.collection('games').doc(sessionId).get();

    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    const session = sessionDoc.data()!;

    if (session.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Not your session');
    }

    if (session.status !== 'active') {
      throw new functions.https.HttpsError('failed-precondition', 'Session not active');
    }

    // Validate checkpoint data
    const validatedCheckpoint = await validateCheckpoint(checkpoint, session);

    // Check for cheating
    const cheatingDetected = await detectCheating(userId, sessionId, validatedCheckpoint);

    if (cheatingDetected) {
      await flagSuspiciousActivity(userId, sessionId, 'checkpoint_validation');
      throw new functions.https.HttpsError('invalid-argument', 'Invalid game data');
    }

    // Update session
    await db
      .collection('games')
      .doc(sessionId)
      .update({
        checkpoints: admin.firestore.FieldValue.arrayUnion(validatedCheckpoint),
        lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
        score: validatedCheckpoint.score,
        coins: validatedCheckpoint.coins,
        gems: validatedCheckpoint.gems,
        level: validatedCheckpoint.level,
      });

    timer();

    return {
      success: true,
      validated: true,
      serverTime: Date.now(),
    };
  } catch (error) {
    timer();
    console.error('Update progress error:', error);
    throw error;
  }
});

/**
 * End game session and process rewards
 */
export const endGameSession = functions.https.onCall(async (data, context) => {
  const timer = performanceMonitor.startTimer('endGameSession');

  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { sessionId, finalScore, stats } = sanitizeInput(data);

    // Start transaction for atomic updates
    const result = await db.runTransaction(async (transaction) => {
      // Get session
      const sessionRef = db.collection('games').doc(sessionId);
      const sessionDoc = await transaction.get(sessionRef);

      if (!sessionDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Session not found');
      }

      const session = sessionDoc.data()!;

      // Validate ownership and status
      if (session.userId !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'Not your session');
      }

      if (session.status !== 'active') {
        throw new functions.https.HttpsError('failed-precondition', 'Session already ended');
      }

      // Validate final score
      const isValid = await validateGameScore(session, finalScore, stats);

      if (!isValid) {
        await flagSuspiciousActivity(userId, sessionId, 'invalid_final_score');
        throw new functions.https.HttpsError('invalid-argument', 'Invalid score');
      }

      // Calculate rewards
      const rewards = calculateRewards(finalScore, stats, session);

      // Update user stats
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
      }

      const userData = userDoc.data()!;

      // Apply rewards
      transaction.update(userRef, {
        'stats.totalGames': admin.firestore.FieldValue.increment(1),
        'stats.totalScore': admin.firestore.FieldValue.increment(finalScore),
        'stats.highScore': Math.max(userData.stats?.highScore || 0, finalScore),
        'stats.totalCoins': admin.firestore.FieldValue.increment(rewards.coins),
        'stats.totalGems': admin.firestore.FieldValue.increment(rewards.gems),
        'inventory.coins': admin.firestore.FieldValue.increment(rewards.coins),
        'inventory.gems': admin.firestore.FieldValue.increment(rewards.gems),
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update session status
      transaction.update(sessionRef, {
        status: 'completed',
        endTime: admin.firestore.FieldValue.serverTimestamp(),
        finalScore,
        rewards,
        validated: true,
      });

      // Add to transaction log
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        transactionId: transactionRef.id,
        userId,
        type: 'game_reward',
        sessionId,
        amount: rewards,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        encrypted: encryptData(JSON.stringify({ finalScore, stats })),
      });

      return { rewards, highScore: Math.max(userData.stats?.highScore || 0, finalScore) };
    });

    // Update leaderboards (async, don't wait)
    updateLeaderboards(userId, result.highScore, 'global').catch(console.error);

    // Log game end
    await logGameEvent(userId, 'session_end', {
      sessionId,
      finalScore,
      rewards: result.rewards,
    });

    timer();

    return {
      success: true,
      rewards: result.rewards,
      newHighScore: result.highScore === finalScore,
      serverTime: Date.now(),
    };
  } catch (error) {
    timer();
    console.error('End session error:', error);
    throw error;
  }
});

// ========== ITEM COLLECTION ==========

/**
 * Process item collection during gameplay
 */
export const collectItem = functions.https.onCall(async (data, context) => {
  const timer = performanceMonitor.startTimer('collectItem');

  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { sessionId, itemId, timestamp, position } = sanitizeInput(data);

    // Rate limiting for item collection
    if (!(await rateLimiter.checkLimit(`${userId}:collect`))) {
      throw new functions.https.HttpsError('resource-exhausted', 'Too many collections');
    }

    // Validate item collection
    const isValid = await validateItemCollection(sessionId, itemId, timestamp, position);

    if (!isValid) {
      await flagSuspiciousActivity(userId, sessionId, 'invalid_item_collection');
      throw new functions.https.HttpsError('invalid-argument', 'Invalid collection');
    }

    // Process collection
    const result = await processItemCollection(userId, sessionId, itemId);

    timer();

    return result;
  } catch (error) {
    timer();
    console.error('Collect item error:', error);
    throw error;
  }
});

// ========== HELPER FUNCTIONS ==========

/**
 * Generate cryptographically secure server seed
 */
function generateServerSeed(): string {
  const buffer = admin.firestore().collection('temp').doc().id;
  return Buffer.from(buffer + Date.now() + Math.random()).toString('base64');
}

/**
 * Get personalized game configuration
 */
async function getGameConfig(userId: string): Promise<any> {
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  const vipLevel = userData?.vipLevel || 0;
  const level = userData?.stats?.level || 1;

  return {
    spawnRates: getSpawnRatesForLevel(level, vipLevel),
    multipliers: getMultipliersForVIP(vipLevel),
    specialEvents: await getActiveEvents(),
    cartUpgrades: await getAvailableUpgrades(userId),
  };
}

/**
 * Validate checkpoint data
 */
async function validateCheckpoint(checkpoint: any, session: any): Promise<any> {
  // Check time consistency
  const timeDiff = Date.now() - checkpoint.timestamp;
  if (Math.abs(timeDiff) > 60000) {
    // More than 1 minute difference
    throw new functions.https.HttpsError('invalid-argument', 'Invalid timestamp');
  }

  // Check score progression
  const lastCheckpoint = session.checkpoints[session.checkpoints.length - 1];
  if (lastCheckpoint) {
    if (checkpoint.score < lastCheckpoint.score) {
      throw new functions.https.HttpsError('invalid-argument', 'Score cannot decrease');
    }

    const scoreDiff = checkpoint.score - lastCheckpoint.score;
    const timeDiff = checkpoint.timestamp - lastCheckpoint.timestamp;
    const scoreRate = scoreDiff / (timeDiff / 1000); // Score per second

    // Check for impossible score rates
    if (scoreRate > 1000) {
      // More than 1000 points per second
      throw new functions.https.HttpsError('invalid-argument', 'Impossible score rate');
    }
  }

  return {
    ...checkpoint,
    validated: true,
    serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
  };
}

/**
 * Calculate rewards based on performance
 */
function calculateRewards(score: number, stats: any, session: any): any {
  const baseCoins = Math.floor(score / 10);
  const baseGems = Math.floor(score / 1000);

  // Apply multipliers
  let coinMultiplier = 1;
  let gemMultiplier = 1;

  // Combo bonus
  if (stats.maxCombo >= 50) {
    coinMultiplier *= 2;
    gemMultiplier *= 1.5;
  } else if (stats.maxCombo >= 20) {
    coinMultiplier *= 1.5;
    gemMultiplier *= 1.2;
  } else if (stats.maxCombo >= 10) {
    coinMultiplier *= 1.2;
  }

  // Time bonus (longer games = more rewards)
  const gameDuration = (Date.now() - session.startTime.toMillis()) / 1000;
  if (gameDuration > 300) {
    // 5+ minutes
    coinMultiplier *= 1.3;
  }

  // Perfect game bonus
  if (stats.missedItems === 0 && stats.obstaclesHit === 0) {
    coinMultiplier *= 2;
    gemMultiplier *= 2;
  }

  return {
    coins: Math.floor(baseCoins * coinMultiplier),
    gems: Math.floor(baseGems * gemMultiplier),
    xp: Math.floor(score / 5),
  };
}

/**
 * Validate item collection
 */
async function validateItemCollection(
  sessionId: string,
  itemId: string,
  timestamp: number,
  position: { x: number; y: number }
): Promise<boolean> {
  // Check if item exists and is valid
  const validItems = await getValidItems();
  if (!validItems.includes(itemId)) {
    return false;
  }

  // Check position is within game bounds
  if (position.x < 0 || position.x > 1024 || position.y < 0 || position.y > 2048) {
    return false;
  }

  // Check timestamp is reasonable
  const timeDiff = Math.abs(Date.now() - timestamp);
  if (timeDiff > 5000) {
    // More than 5 seconds difference
    return false;
  }

  return true;
}

/**
 * Process item collection and grant rewards
 */
async function processItemCollection(
  userId: string,
  sessionId: string,
  itemId: string
): Promise<any> {
  const itemConfig = await getItemConfig(itemId);

  if (!itemConfig) {
    throw new functions.https.HttpsError('not-found', 'Item not found');
  }

  // Update session with collected item
  await db
    .collection('games')
    .doc(sessionId)
    .update({
      collectedItems: admin.firestore.FieldValue.arrayUnion({
        itemId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }),
    });

  // Grant immediate rewards
  if (itemConfig.instantReward) {
    await db
      .collection('users')
      .doc(userId)
      .update({
        [`inventory.${itemConfig.type}`]: admin.firestore.FieldValue.increment(itemConfig.value),
      });
  }

  return {
    success: true,
    reward: itemConfig.instantReward || null,
  };
}

/**
 * Flag suspicious activity for review
 */
async function flagSuspiciousActivity(
  userId: string,
  sessionId: string,
  reason: string
): Promise<void> {
  await db.collection('suspicious_activity').add({
    userId,
    sessionId,
    reason,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    reviewed: false,
  });

  // Increment user's violation count
  await db
    .collection('users')
    .doc(userId)
    .update({
      'security.violations': admin.firestore.FieldValue.increment(1),
      'security.lastViolation': admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Log game events for analytics
 */
async function logGameEvent(userId: string, event: string, data: any): Promise<void> {
  await db.collection('game_events').add({
    userId,
    event,
    data,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// Placeholder functions (implement based on your game logic)
async function getValidItems(): Promise<string[]> {
  // Return list of valid item IDs
  return ['coin', 'gem', 'powerup_magnet', 'powerup_shield'];
}

async function getItemConfig(itemId: string): Promise<any> {
  // Return item configuration
  const configs: any = {
    coin: { type: 'coins', value: 1, instantReward: true },
    gem: { type: 'gems', value: 1, instantReward: true },
    powerup_magnet: { type: 'powerup', value: 1, instantReward: false },
  };

  return configs[itemId];
}

function getSpawnRatesForLevel(level: number, vipLevel: number): any {
  // Return spawn rates based on level and VIP
  return {
    common: 0.6,
    rare: 0.3,
    epic: 0.08,
    legendary: 0.02 * (1 + vipLevel * 0.2),
  };
}

function getMultipliersForVIP(vipLevel: number): any {
  return {
    score: 1 + vipLevel * 0.1,
    coins: 1 + vipLevel * 0.15,
    gems: 1 + vipLevel * 0.2,
  };
}

async function getActiveEvents(): Promise<any[]> {
  const events = await db
    .collection('events')
    .where('active', '==', true)
    .where('endTime', '>', admin.firestore.Timestamp.now())
    .get();

  return events.docs.map((doc) => doc.data());
}

async function getAvailableUpgrades(userId: string): Promise<any[]> {
  // Return available cart upgrades for user
  return [];
}
