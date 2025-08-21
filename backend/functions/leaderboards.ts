/**
 * High-Performance Leaderboard System
 * Using Redis for real-time updates and caching
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Redis from 'ioredis';
import { db, performanceMonitor } from '../firebaseConfig';

// Redis configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

// Redis pipeline for batch operations
const pipeline = redis.pipeline();

// Leaderboard types
export enum LeaderboardType {
  GLOBAL = 'global',
  COUNTRY = 'country',
  FRIENDS = 'friends',
  WEEKLY = 'weekly',
  DAILY = 'daily',
  ALL_TIME = 'all_time',
  EVENT = 'event',
}

export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time',
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  avatar?: string;
  country?: string;
  vipLevel?: number;
  timestamp: number;
}

interface LeaderboardUpdate {
  userId: string;
  score: number;
  metadata: {
    username: string;
    avatar?: string;
    country?: string;
    vipLevel?: number;
  };
}

// ========== MAIN LEADERBOARD FUNCTIONS ==========

/**
 * Update player score on multiple leaderboards
 */
export async function updateLeaderboards(
  userId: string,
  score: number,
  type: string = 'global'
): Promise<void> {
  const timer = performanceMonitor.startTimer('updateLeaderboards');
  
  try {
    // Get user metadata
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    const metadata = {
      username: userData.profile?.username || 'Anonymous',
      avatar: userData.profile?.avatar,
      country: userData.profile?.country || 'XX',
      vipLevel: userData.vipLevel || 0,
    };
    
    // Update multiple leaderboards in parallel
    await Promise.all([
      updateDailyLeaderboard(userId, score, metadata),
      updateWeeklyLeaderboard(userId, score, metadata),
      updateMonthlyLeaderboard(userId, score, metadata),
      updateAllTimeLeaderboard(userId, score, metadata),
      updateCountryLeaderboard(userId, score, metadata),
    ]);
    
    // Check for achievements
    await checkLeaderboardAchievements(userId, score);
    
  } catch (error) {
    console.error('Error updating leaderboards:', error);
  } finally {
    timer();
  }
}

/**
 * Update daily leaderboard
 */
async function updateDailyLeaderboard(
  userId: string,
  score: number,
  metadata: any
): Promise<void> {
  const key = getLeaderboardKey(LeaderboardPeriod.DAILY);
  
  // Use Redis sorted set for O(log n) operations
  await redis.zadd(key, score, userId);
  
  // Store metadata separately
  await redis.hset(`${key}:meta`, userId, JSON.stringify({
    ...metadata,
    score,
    timestamp: Date.now(),
  }));
  
  // Set expiry for daily leaderboard (25 hours)
  await redis.expire(key, 90000);
  await redis.expire(`${key}:meta`, 90000);
}

/**
 * Update weekly leaderboard
 */
async function updateWeeklyLeaderboard(
  userId: string,
  score: number,
  metadata: any
): Promise<void> {
  const key = getLeaderboardKey(LeaderboardPeriod.WEEKLY);
  
  // Only update if score is higher
  const currentScore = await redis.zscore(key, userId);
  
  if (!currentScore || score > parseFloat(currentScore)) {
    await redis.zadd(key, score, userId);
    await redis.hset(`${key}:meta`, userId, JSON.stringify({
      ...metadata,
      score,
      timestamp: Date.now(),
    }));
  }
  
  // Set expiry for weekly leaderboard (8 days)
  await redis.expire(key, 691200);
  await redis.expire(`${key}:meta`, 691200);
}

/**
 * Update monthly leaderboard
 */
async function updateMonthlyLeaderboard(
  userId: string,
  score: number,
  metadata: any
): Promise<void> {
  const key = getLeaderboardKey(LeaderboardPeriod.MONTHLY);
  
  const currentScore = await redis.zscore(key, userId);
  
  if (!currentScore || score > parseFloat(currentScore)) {
    await redis.zadd(key, score, userId);
    await redis.hset(`${key}:meta`, userId, JSON.stringify({
      ...metadata,
      score,
      timestamp: Date.now(),
    }));
  }
  
  // Set expiry for monthly leaderboard (32 days)
  await redis.expire(key, 2764800);
  await redis.expire(`${key}:meta`, 2764800);
}

/**
 * Update all-time leaderboard
 */
async function updateAllTimeLeaderboard(
  userId: string,
  score: number,
  metadata: any
): Promise<void> {
  const key = getLeaderboardKey(LeaderboardPeriod.ALL_TIME);
  
  const currentScore = await redis.zscore(key, userId);
  
  if (!currentScore || score > parseFloat(currentScore)) {
    await redis.zadd(key, score, userId);
    await redis.hset(`${key}:meta`, userId, JSON.stringify({
      ...metadata,
      score,
      timestamp: Date.now(),
    }));
    
    // Also update Firestore for persistence
    await db.collection('leaderboards').doc('all_time').set({
      [userId]: {
        score,
        ...metadata,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }
    }, { merge: true });
  }
}

/**
 * Update country-specific leaderboard
 */
async function updateCountryLeaderboard(
  userId: string,
  score: number,
  metadata: any
): Promise<void> {
  const country = metadata.country || 'XX';
  const key = `leaderboard:country:${country}:${getWeekNumber()}`;
  
  await redis.zadd(key, score, userId);
  await redis.hset(`${key}:meta`, userId, JSON.stringify({
    ...metadata,
    score,
    timestamp: Date.now(),
  }));
  
  // Expire after 2 weeks
  await redis.expire(key, 1209600);
  await redis.expire(`${key}:meta`, 1209600);
}

// ========== RETRIEVAL FUNCTIONS ==========

/**
 * Get leaderboard entries
 */
export const getLeaderboard = functions.https.onCall(async (data, context) => {
  const timer = performanceMonitor.startTimer('getLeaderboard');
  
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const { type = 'global', period = 'daily', offset = 0, limit = 100 } = data;
    
    // Validate parameters
    if (limit > 100) {
      throw new functions.https.HttpsError('invalid-argument', 'Limit cannot exceed 100');
    }
    
    const key = getLeaderboardKey(period);
    
    // Get top scores with Redis ZREVRANGE
    const topScores = await redis.zrevrange(key, offset, offset + limit - 1, 'WITHSCORES');
    
    if (topScores.length === 0) {
      return { entries: [], userRank: null };
    }
    
    // Parse scores and get metadata
    const entries: LeaderboardEntry[] = [];
    const metaKeys = [];
    
    for (let i = 0; i < topScores.length; i += 2) {
      metaKeys.push(topScores[i]);
    }
    
    const metadata = await redis.hmget(`${key}:meta`, ...metaKeys);
    
    for (let i = 0; i < topScores.length; i += 2) {
      const userId = topScores[i];
      const score = parseFloat(topScores[i + 1]);
      const meta = metadata[i / 2] ? JSON.parse(metadata[i / 2]) : {};
      
      entries.push({
        userId,
        username: meta.username || 'Anonymous',
        score,
        rank: offset + (i / 2) + 1,
        avatar: meta.avatar,
        country: meta.country,
        vipLevel: meta.vipLevel,
        timestamp: meta.timestamp || Date.now(),
      });
    }
    
    // Get user's rank
    const userRank = await getUserRank(context.auth.uid, key);
    
    timer();
    
    return {
      entries,
      userRank,
      totalPlayers: await redis.zcard(key),
      period,
      type,
    };
    
  } catch (error) {
    timer();
    console.error('Error getting leaderboard:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get leaderboard');
  }
});

/**
 * Get user's rank on leaderboard
 */
async function getUserRank(userId: string, key: string): Promise<any> {
  const rank = await redis.zrevrank(key, userId);
  
  if (rank === null) {
    return null;
  }
  
  const score = await redis.zscore(key, userId);
  const metaData = await redis.hget(`${key}:meta`, userId);
  const meta = metaData ? JSON.parse(metaData) : {};
  
  return {
    rank: rank + 1,
    score: parseFloat(score || '0'),
    ...meta,
  };
}

/**
 * Get friends leaderboard
 */
export const getFriendsLeaderboard = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userId = context.auth.uid;
  const { period = 'weekly' } = data;
  
  // Get user's friends list
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  const friends = userData?.friends || [];
  
  if (friends.length === 0) {
    return { entries: [], userRank: 1 };
  }
  
  // Add user to friends list for comparison
  friends.push(userId);
  
  const key = getLeaderboardKey(period);
  const friendScores: LeaderboardEntry[] = [];
  
  // Get scores for all friends
  for (const friendId of friends) {
    const score = await redis.zscore(key, friendId);
    
    if (score) {
      const metaData = await redis.hget(`${key}:meta`, friendId);
      const meta = metaData ? JSON.parse(metaData) : {};
      
      friendScores.push({
        userId: friendId,
        username: meta.username || 'Friend',
        score: parseFloat(score),
        rank: 0,
        avatar: meta.avatar,
        country: meta.country,
        vipLevel: meta.vipLevel,
        timestamp: meta.timestamp || Date.now(),
      });
    }
  }
  
  // Sort by score
  friendScores.sort((a, b) => b.score - a.score);
  
  // Assign ranks
  friendScores.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  // Find user's rank among friends
  const userRank = friendScores.findIndex(e => e.userId === userId) + 1;
  
  return {
    entries: friendScores,
    userRank,
    totalPlayers: friendScores.length,
    period,
    type: 'friends',
  };
});

// ========== UTILITY FUNCTIONS ==========

/**
 * Generate leaderboard key based on period
 */
function getLeaderboardKey(period: LeaderboardPeriod): string {
  const now = new Date();
  
  switch (period) {
    case LeaderboardPeriod.DAILY:
      return `leaderboard:daily:${now.toISOString().split('T')[0]}`;
    
    case LeaderboardPeriod.WEEKLY:
      return `leaderboard:weekly:${getWeekNumber()}`;
    
    case LeaderboardPeriod.MONTHLY:
      return `leaderboard:monthly:${now.getFullYear()}-${now.getMonth() + 1}`;
    
    case LeaderboardPeriod.ALL_TIME:
      return 'leaderboard:all_time';
    
    default:
      return `leaderboard:${period}`;
  }
}

/**
 * Get week number of the year
 */
function getWeekNumber(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const week = Math.ceil(diff / (1000 * 60 * 60 * 24 * 7));
  return `${now.getFullYear()}-W${week}`;
}

/**
 * Check and grant leaderboard achievements
 */
async function checkLeaderboardAchievements(userId: string, score: number): Promise<void> {
  // Check for top ranks
  const dailyRank = await getUserRank(userId, getLeaderboardKey(LeaderboardPeriod.DAILY));
  
  if (dailyRank && dailyRank.rank === 1) {
    await grantAchievement(userId, 'daily_champion');
  }
  
  if (dailyRank && dailyRank.rank <= 10) {
    await grantAchievement(userId, 'top_10_daily');
  }
  
  if (dailyRank && dailyRank.rank <= 100) {
    await grantAchievement(userId, 'top_100_daily');
  }
  
  // Check for score milestones
  if (score >= 10000) {
    await grantAchievement(userId, 'score_10k');
  }
  
  if (score >= 100000) {
    await grantAchievement(userId, 'score_100k');
  }
  
  if (score >= 1000000) {
    await grantAchievement(userId, 'score_1m');
  }
}

/**
 * Grant achievement to user
 */
async function grantAchievement(userId: string, achievementId: string): Promise<void> {
  await db.collection('users').doc(userId).update({
    [`achievements.${achievementId}`]: {
      unlocked: true,
      unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
  });
}

/**
 * Reset leaderboards (scheduled function)
 */
export const resetDailyLeaderboards = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Resetting daily leaderboards');
    
    // Archive previous day's leaderboard
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `leaderboard:daily:${yesterday.toISOString().split('T')[0]}`;
    
    // Get top 100 for archiving
    const topScores = await redis.zrevrange(yesterdayKey, 0, 99, 'WITHSCORES');
    
    if (topScores.length > 0) {
      // Archive to Firestore
      const archive: any = {};
      
      for (let i = 0; i < topScores.length; i += 2) {
        const userId = topScores[i];
        const score = topScores[i + 1];
        const metaData = await redis.hget(`${yesterdayKey}:meta`, userId);
        
        archive[userId] = {
          score: parseFloat(score),
          rank: (i / 2) + 1,
          ...(metaData ? JSON.parse(metaData) : {}),
        };
      }
      
      await db.collection('leaderboard_archives').doc(yesterdayKey).set(archive);
    }
    
    // Clean up old Redis keys
    const keysToDelete = await redis.keys('leaderboard:daily:*');
    const oldKeys = keysToDelete.filter(key => {
      const date = key.split(':')[2];
      const keyDate = new Date(date);
      const daysDiff = (Date.now() - keyDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > 7; // Delete keys older than 7 days
    });
    
    if (oldKeys.length > 0) {
      await redis.del(...oldKeys);
    }
  });

/**
 * Get leaderboard statistics
 */
export const getLeaderboardStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const stats = {
    totalPlayers: {
      daily: await redis.zcard(getLeaderboardKey(LeaderboardPeriod.DAILY)),
      weekly: await redis.zcard(getLeaderboardKey(LeaderboardPeriod.WEEKLY)),
      monthly: await redis.zcard(getLeaderboardKey(LeaderboardPeriod.MONTHLY)),
      allTime: await redis.zcard(getLeaderboardKey(LeaderboardPeriod.ALL_TIME)),
    },
    topScore: {
      daily: await getTopScore(LeaderboardPeriod.DAILY),
      weekly: await getTopScore(LeaderboardPeriod.WEEKLY),
      monthly: await getTopScore(LeaderboardPeriod.MONTHLY),
      allTime: await getTopScore(LeaderboardPeriod.ALL_TIME),
    },
  };
  
  return stats;
});

/**
 * Get top score for a period
 */
async function getTopScore(period: LeaderboardPeriod): Promise<number> {
  const key = getLeaderboardKey(period);
  const topScore = await redis.zrevrange(key, 0, 0, 'WITHSCORES');
  
  if (topScore.length >= 2) {
    return parseFloat(topScore[1]);
  }
  
  return 0;
}