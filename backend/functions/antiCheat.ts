/**
 * Anti-Cheat System
 * Detects and prevents cheating, botting, and exploitation
 */

import * as admin from 'firebase-admin';
import { db } from '../firebaseConfig';
import * as crypto from 'crypto';

interface GameSession {
  sessionId: string;
  userId: string;
  startTime: any;
  score: number;
  coins: number;
  level: number;
  checkpoints: any[];
  serverSeed: string;
}

interface ValidationResult {
  isValid: boolean;
  reason?: string;
  confidence: number;
  flags: string[];
}

// ========== CHEAT DETECTION ALGORITHMS ==========

/**
 * Main cheat detection function
 */
export async function detectCheating(
  userId: string,
  sessionId: string,
  data: any
): Promise<boolean> {
  const detectionResults = await Promise.all([
    detectSpeedHack(userId, sessionId, data),
    detectMemoryManipulation(data),
    detectPatternAnomaly(userId, data),
    detectImpossibleScores(data),
    detectBotBehavior(userId, sessionId),
    detectMultipleDevices(userId),
    detectTimeTravelCheat(data),
  ]);
  
  // If any detection triggers with high confidence, flag as cheating
  const cheatingDetected = detectionResults.some(result => 
    result.confidence > 0.8 && !result.isValid
  );
  
  if (cheatingDetected) {
    await logCheatDetection(userId, sessionId, detectionResults);
  }
  
  return cheatingDetected;
}

/**
 * Validate final game score
 */
export async function validateGameScore(
  session: GameSession,
  finalScore: number,
  stats: any
): Promise<boolean> {
  const validation = await performScoreValidation(session, finalScore, stats);
  
  if (!validation.isValid) {
    await logInvalidScore(session.userId, session.sessionId, validation);
  }
  
  return validation.isValid;
}

// ========== DETECTION METHODS ==========

/**
 * Detect speed hacking (modified game speed)
 */
async function detectSpeedHack(
  userId: string,
  sessionId: string,
  data: any
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    confidence: 0,
    flags: [],
  };
  
  // Get previous checkpoints
  const sessionDoc = await db.collection('games').doc(sessionId).get();
  if (!sessionDoc.exists) {
    return result;
  }
  
  const session = sessionDoc.data() as GameSession;
  const checkpoints = session.checkpoints || [];
  
  if (checkpoints.length < 2) {
    return result;
  }
  
  // Analyze time between checkpoints
  const timeDeltas: number[] = [];
  for (let i = 1; i < checkpoints.length; i++) {
    const delta = checkpoints[i].timestamp - checkpoints[i-1].timestamp;
    timeDeltas.push(delta);
  }
  
  // Check for impossible time acceleration
  const avgDelta = timeDeltas.reduce((a, b) => a + b, 0) / timeDeltas.length;
  const currentDelta = data.timestamp - checkpoints[checkpoints.length - 1].timestamp;
  
  if (currentDelta < avgDelta * 0.5) {
    result.isValid = false;
    result.reason = 'Time acceleration detected';
    result.confidence = 0.9;
    result.flags.push('SPEED_HACK');
  }
  
  // Check for consistent superhuman reaction times
  const reactionTimes = data.reactionTimes || [];
  const superhumanReactions = reactionTimes.filter((rt: number) => rt < 100).length;
  
  if (superhumanReactions > reactionTimes.length * 0.5) {
    result.isValid = false;
    result.reason = 'Superhuman reaction times';
    result.confidence = 0.85;
    result.flags.push('BOT_REACTION');
  }
  
  return result;
}

/**
 * Detect memory manipulation
 */
async function detectMemoryManipulation(data: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    confidence: 0,
    flags: [],
  };
  
  // Check for impossible value jumps
  if (data.coins && data.previousCoins) {
    const coinDiff = data.coins - data.previousCoins;
    
    // Maximum possible coins per checkpoint
    const maxPossibleCoins = 100;
    
    if (coinDiff > maxPossibleCoins) {
      result.isValid = false;
      result.reason = 'Impossible coin increase';
      result.confidence = 0.95;
      result.flags.push('MEMORY_EDIT');
    }
  }
  
  // Check for negative values (common in memory editing)
  if (data.score < 0 || data.coins < 0 || data.gems < 0) {
    result.isValid = false;
    result.reason = 'Negative values detected';
    result.confidence = 1.0;
    result.flags.push('MEMORY_CORRUPTION');
  }
  
  // Check for overflow values
  const MAX_SAFE_VALUE = 999999999;
  if (data.score > MAX_SAFE_VALUE || data.coins > MAX_SAFE_VALUE) {
    result.isValid = false;
    result.reason = 'Overflow values detected';
    result.confidence = 1.0;
    result.flags.push('VALUE_OVERFLOW');
  }
  
  return result;
}

/**
 * Detect pattern anomalies using ML-like heuristics
 */
async function detectPatternAnomaly(
  userId: string,
  data: any
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    confidence: 0,
    flags: [],
  };
  
  // Get user's historical data
  const userStats = await getUserGameStats(userId);
  
  if (userStats.games < 10) {
    // Not enough data for pattern analysis
    return result;
  }
  
  // Check for sudden skill improvement
  const currentScore = data.score;
  const avgScore = userStats.avgScore;
  const stdDev = userStats.stdDev;
  
  // Z-score calculation
  const zScore = (currentScore - avgScore) / stdDev;
  
  if (zScore > 5) {
    // Score is 5+ standard deviations above average
    result.isValid = false;
    result.reason = 'Anomalous score pattern';
    result.confidence = Math.min(0.6 + (zScore - 5) * 0.1, 0.95);
    result.flags.push('PATTERN_ANOMALY');
  }
  
  // Check for perfect patterns (bot behavior)
  const itemCollections = data.itemCollections || [];
  if (itemCollections.length > 50) {
    const perfectRate = itemCollections.filter((item: any) => item.perfect).length / itemCollections.length;
    
    if (perfectRate > 0.95) {
      result.isValid = false;
      result.reason = 'Perfect collection pattern';
      result.confidence = 0.85;
      result.flags.push('BOT_PATTERN');
    }
  }
  
  return result;
}

/**
 * Detect impossible scores
 */
async function detectImpossibleScores(data: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    confidence: 0,
    flags: [],
  };
  
  const { score, level, timeElapsed, itemsCollected } = data;
  
  // Calculate theoretical maximum score
  const maxScorePerSecond = 100; // Maximum possible score gain per second
  const maxPossibleScore = timeElapsed * maxScorePerSecond;
  
  if (score > maxPossibleScore) {
    result.isValid = false;
    result.reason = 'Score exceeds theoretical maximum';
    result.confidence = 1.0;
    result.flags.push('IMPOSSIBLE_SCORE');
  }
  
  // Check score vs items collected ratio
  const minScorePerItem = 1;
  const maxScorePerItem = 1000;
  
  if (itemsCollected > 0) {
    const scorePerItem = score / itemsCollected;
    
    if (scorePerItem > maxScorePerItem || scorePerItem < minScorePerItem) {
      result.isValid = false;
      result.reason = 'Invalid score to item ratio';
      result.confidence = 0.9;
      result.flags.push('INVALID_RATIO');
    }
  }
  
  // Check level progression
  const expectedLevel = Math.floor(score / 1000) + 1;
  if (Math.abs(level - expectedLevel) > 2) {
    result.isValid = false;
    result.reason = 'Invalid level progression';
    result.confidence = 0.8;
    result.flags.push('LEVEL_MISMATCH');
  }
  
  return result;
}

/**
 * Detect bot behavior patterns
 */
async function detectBotBehavior(
  userId: string,
  sessionId: string
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    confidence: 0,
    flags: [],
  };
  
  // Get session input data
  const inputEvents = await getSessionInputEvents(sessionId);
  
  if (inputEvents.length < 10) {
    return result;
  }
  
  // Analyze input patterns
  const timings = inputEvents.map(e => e.timestamp);
  const intervals: number[] = [];
  
  for (let i = 1; i < timings.length; i++) {
    intervals.push(timings[i] - timings[i-1]);
  }
  
  // Check for perfectly regular intervals (bot signature)
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => {
    return sum + Math.pow(interval - avgInterval, 2);
  }, 0) / intervals.length;
  
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / avgInterval;
  
  if (coefficientOfVariation < 0.1) {
    // Very low variation suggests bot
    result.isValid = false;
    result.reason = 'Robotic input pattern detected';
    result.confidence = 0.85;
    result.flags.push('BOT_INPUTS');
  }
  
  // Check for inhuman precision
  const positions = inputEvents.map(e => e.position);
  const precisionMoves = positions.filter((pos: any) => {
    // Check if positions are too precise (e.g., exact pixels)
    return pos.x % 10 === 0 && pos.y % 10 === 0;
  }).length;
  
  if (precisionMoves > positions.length * 0.8) {
    result.isValid = false;
    result.reason = 'Inhuman precision in movements';
    result.confidence = 0.75;
    result.flags.push('BOT_PRECISION');
  }
  
  return result;
}

/**
 * Detect multiple device usage
 */
async function detectMultipleDevices(userId: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    confidence: 0,
    flags: [],
  };
  
  // Get recent sessions
  const recentSessions = await db
    .collection('games')
    .where('userId', '==', userId)
    .where('startTime', '>', admin.firestore.Timestamp.fromMillis(Date.now() - 3600000))
    .get();
  
  const deviceFingerprints = new Set<string>();
  const ipAddresses = new Set<string>();
  
  recentSessions.forEach(doc => {
    const data = doc.data();
    if (data.clientInfo) {
      deviceFingerprints.add(data.clientInfo.userAgent);
      ipAddresses.add(data.clientInfo.ip);
    }
  });
  
  // Check for multiple devices in short time
  if (deviceFingerprints.size > 3) {
    result.isValid = false;
    result.reason = 'Multiple devices detected';
    result.confidence = 0.7;
    result.flags.push('MULTI_DEVICE');
  }
  
  // Check for suspicious IP patterns
  if (ipAddresses.size > 5) {
    result.isValid = false;
    result.reason = 'Suspicious IP pattern';
    result.confidence = 0.6;
    result.flags.push('IP_HOPPING');
  }
  
  return result;
}

/**
 * Detect time travel cheats
 */
async function detectTimeTravelCheat(data: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    confidence: 0,
    flags: [],
  };
  
  const clientTime = data.timestamp;
  const serverTime = Date.now();
  const timeDiff = Math.abs(serverTime - clientTime);
  
  // Allow 5 minutes of clock drift
  const MAX_CLOCK_DRIFT = 5 * 60 * 1000;
  
  if (timeDiff > MAX_CLOCK_DRIFT) {
    result.isValid = false;
    result.reason = 'Clock manipulation detected';
    result.confidence = 0.9;
    result.flags.push('TIME_TRAVEL');
  }
  
  // Check for future timestamps
  if (clientTime > serverTime + 60000) {
    result.isValid = false;
    result.reason = 'Future timestamp detected';
    result.confidence = 1.0;
    result.flags.push('FUTURE_TIME');
  }
  
  return result;
}

// ========== VALIDATION FUNCTIONS ==========

/**
 * Comprehensive score validation
 */
async function performScoreValidation(
  session: GameSession,
  finalScore: number,
  stats: any
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    confidence: 0,
    flags: [],
  };
  
  // Check score progression
  if (session.checkpoints.length > 0) {
    const lastCheckpoint = session.checkpoints[session.checkpoints.length - 1];
    
    if (finalScore < lastCheckpoint.score) {
      result.isValid = false;
      result.reason = 'Score decreased from checkpoint';
      result.confidence = 1.0;
      result.flags.push('SCORE_DECREASE');
      return result;
    }
  }
  
  // Validate score components
  const calculatedScore = calculateExpectedScore(stats);
  const tolerance = 0.1; // 10% tolerance
  
  if (Math.abs(finalScore - calculatedScore) > calculatedScore * tolerance) {
    result.isValid = false;
    result.reason = 'Score calculation mismatch';
    result.confidence = 0.85;
    result.flags.push('SCORE_MISMATCH');
  }
  
  // Check game duration
  const gameDuration = (Date.now() - session.startTime.toMillis()) / 1000;
  const scorePerSecond = finalScore / gameDuration;
  
  if (scorePerSecond > 200) {
    result.isValid = false;
    result.reason = 'Impossible score rate';
    result.confidence = 0.95;
    result.flags.push('HIGH_SCORE_RATE');
  }
  
  return result;
}

/**
 * Calculate expected score from stats
 */
function calculateExpectedScore(stats: any): number {
  const baseScore = stats.itemsCollected * 10;
  const comboBonus = stats.maxCombo * 5;
  const levelBonus = stats.level * 100;
  const timeBonus = Math.floor(stats.timeElapsed / 10) * 2;
  
  return baseScore + comboBonus + levelBonus + timeBonus;
}

// ========== HELPER FUNCTIONS ==========

/**
 * Get user's historical game statistics
 */
async function getUserGameStats(userId: string): Promise<any> {
  const games = await db
    .collection('games')
    .where('userId', '==', userId)
    .where('status', '==', 'completed')
    .orderBy('endTime', 'desc')
    .limit(100)
    .get();
  
  const scores = games.docs.map(doc => doc.data().finalScore || 0);
  
  if (scores.length === 0) {
    return { games: 0, avgScore: 0, stdDev: 0 };
  }
  
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => {
    return sum + Math.pow(score - avgScore, 2);
  }, 0) / scores.length;
  
  return {
    games: scores.length,
    avgScore,
    stdDev: Math.sqrt(variance),
    maxScore: Math.max(...scores),
    minScore: Math.min(...scores),
  };
}

/**
 * Get session input events for analysis
 */
async function getSessionInputEvents(sessionId: string): Promise<any[]> {
  // In production, you would track and store input events
  // For now, return empty array
  return [];
}

/**
 * Log cheat detection for review
 */
async function logCheatDetection(
  userId: string,
  sessionId: string,
  results: ValidationResult[]
): Promise<void> {
  const flags = results.flatMap(r => r.flags);
  const maxConfidence = Math.max(...results.map(r => r.confidence));
  
  await db.collection('cheat_detections').add({
    userId,
    sessionId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    flags,
    confidence: maxConfidence,
    results,
    reviewed: false,
    action: maxConfidence > 0.9 ? 'auto_ban' : 'review',
  });
  
  // Auto-ban for high confidence cheating
  if (maxConfidence > 0.9) {
    await banUser(userId, 'Automated cheat detection', 24 * 60 * 60 * 1000); // 24 hour ban
  }
}

/**
 * Log invalid score for review
 */
async function logInvalidScore(
  userId: string,
  sessionId: string,
  validation: ValidationResult
): Promise<void> {
  await db.collection('invalid_scores').add({
    userId,
    sessionId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    validation,
    reviewed: false,
  });
}

/**
 * Ban user for specified duration
 */
async function banUser(userId: string, reason: string, duration: number): Promise<void> {
  const banUntil = admin.firestore.Timestamp.fromMillis(Date.now() + duration);
  
  await db.collection('users').doc(userId).update({
    'security.banned': true,
    'security.banReason': reason,
    'security.banUntil': banUntil,
  });
  
  // Revoke auth tokens
  await admin.auth().revokeRefreshTokens(userId);
  
  // Log ban
  await db.collection('ban_log').add({
    userId,
    reason,
    duration,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    bannedUntil: banUntil,
  });
}