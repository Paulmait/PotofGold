import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export interface GameSession {
  id: string;
  userId: string;
  startTime: Date;
  lastSaveTime: Date;
  pauseTime?: Date;
  resumeTime?: Date;
  state: {
    score: number;
    coins: number;
    level: number;
    combo: number;
    multiplier: number;
    timePlayed: number;
    cartPosition: number;
    fallingItems: any[];
    blockedItems: any[];
    powerUps: any[];
    achievements: string[];
  };
  statistics: {
    totalCoinsCollected: number;
    highestCombo: number;
    itemsCollected: number;
    powerUpsUsed: number;
    obstaclesCleared: number;
    distanceTraveled: number;
  };
  isActive: boolean;
  isPaused: boolean;
  deviceInfo: {
    platform: string;
    screenSize: { width: number; height: number };
    touchCapabilities: boolean;
  };
}

export class GameSessionManager {
  private currentSession: GameSession | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds
  private readonly SESSION_KEY = 'current_game_session';

  constructor() {
    this.initializeAutoSave();
  }

  // Start a new game session
  async startNewSession(userId: string, deviceInfo: any): Promise<GameSession> {
    const sessionId = `session_${userId}_${Date.now()}`;

    const newSession: GameSession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      lastSaveTime: new Date(),
      state: {
        score: 0,
        coins: 0,
        level: 1,
        combo: 0,
        multiplier: 1,
        timePlayed: 0,
        cartPosition: deviceInfo.screenSize.width / 2,
        fallingItems: [],
        blockedItems: [],
        powerUps: [],
        achievements: [],
      },
      statistics: {
        totalCoinsCollected: 0,
        highestCombo: 0,
        itemsCollected: 0,
        powerUpsUsed: 0,
        obstaclesCleared: 0,
        distanceTraveled: 0,
      },
      isActive: true,
      isPaused: false,
      deviceInfo,
    };

    this.currentSession = newSession;
    await this.saveSession();

    // Also save to Firebase for cloud backup
    await this.saveToCloud();

    return newSession;
  }

  // Resume existing session
  async resumeSession(): Promise<GameSession | null> {
    try {
      // First try local storage
      const localSession = await this.loadLocalSession();

      if (localSession && this.isSessionValid(localSession)) {
        this.currentSession = localSession;
        this.currentSession.resumeTime = new Date();
        this.currentSession.isPaused = false;
        this.currentSession.isActive = true;

        await this.saveSession();
        return this.currentSession;
      }

      // Try cloud backup if local not found
      const cloudSession = await this.loadCloudSession();
      if (cloudSession && this.isSessionValid(cloudSession)) {
        this.currentSession = cloudSession;
        this.currentSession.resumeTime = new Date();
        this.currentSession.isPaused = false;
        this.currentSession.isActive = true;

        await this.saveSession();
        return this.currentSession;
      }

      return null;
    } catch (error) {
      console.error('Error resuming session:', error);
      return null;
    }
  }

  // Pause current session
  async pauseSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.isPaused = true;
    this.currentSession.pauseTime = new Date();
    this.currentSession.isActive = false;

    await this.saveSession();
    await this.saveToCloud();
  }

  // Update game state
  async updateGameState(updates: Partial<GameSession['state']>): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.state = {
      ...this.currentSession.state,
      ...updates,
    };

    this.currentSession.lastSaveTime = new Date();

    // Don't await to avoid blocking game loop
    this.saveSession();
  }

  // Update statistics
  async updateStatistics(updates: Partial<GameSession['statistics']>): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.statistics = {
      ...this.currentSession.statistics,
      ...updates,
    };
  }

  // Save session to local storage
  private async saveSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
    } catch (error) {
      console.error('Error saving session locally:', error);
    }
  }

  // Load session from local storage
  private async loadLocalSession(): Promise<GameSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(this.SESSION_KEY);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
    } catch (error) {
      console.error('Error loading local session:', error);
    }
    return null;
  }

  // Save to Firebase for cloud backup
  private async saveToCloud(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const sessionRef = doc(
        db,
        'users',
        this.currentSession.userId,
        'sessions',
        this.currentSession.id
      );

      await setDoc(sessionRef, {
        ...this.currentSession,
        updatedAt: serverTimestamp(),
      });

      // Also update user's last session reference
      const userRef = doc(db, 'users', this.currentSession.userId);
      await updateDoc(userRef, {
        lastSessionId: this.currentSession.id,
        lastPlayTime: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving session to cloud:', error);
    }
  }

  // Load from Firebase
  private async loadCloudSession(): Promise<GameSession | null> {
    if (!this.currentSession?.userId) return null;

    try {
      // Get user's last session ID
      const userRef = doc(db, 'users', this.currentSession.userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const lastSessionId = userDoc.data().lastSessionId;

        if (lastSessionId) {
          const sessionRef = doc(
            db,
            'users',
            this.currentSession.userId,
            'sessions',
            lastSessionId
          );
          const sessionDoc = await getDoc(sessionRef);

          if (sessionDoc.exists()) {
            return sessionDoc.data() as GameSession;
          }
        }
      }
    } catch (error) {
      console.error('Error loading cloud session:', error);
    }
    return null;
  }

  // Check if session is still valid (not too old)
  private isSessionValid(session: GameSession): boolean {
    const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
    const sessionAge = Date.now() - new Date(session.lastSaveTime).getTime();

    return sessionAge < MAX_SESSION_AGE && !session.isActive;
  }

  // Initialize auto-save
  private initializeAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      if (this.currentSession && this.currentSession.isActive) {
        this.saveSession();
      }
    }, this.AUTO_SAVE_INTERVAL);
  }

  // End session
  async endSession(finalScore: number): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.isActive = false;
    this.currentSession.state.score = finalScore;

    await this.saveSession();
    await this.saveToCloud();

    // Clear local session
    await AsyncStorage.removeItem(this.SESSION_KEY);

    this.currentSession = null;
  }

  // Get current session
  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }

  // Calculate session duration
  getSessionDuration(): number {
    if (!this.currentSession) return 0;

    const start = new Date(this.currentSession.startTime).getTime();
    const now = Date.now();

    return Math.floor((now - start) / 1000); // Return in seconds
  }

  // Cleanup
  cleanup(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }
}

export const gameSessionManager = new GameSessionManager();
