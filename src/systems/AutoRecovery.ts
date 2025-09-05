import AsyncStorage from '@react-native-async-storage/async-storage';
import { eventBus } from '../core/EventBus';

interface RecoveryPoint {
  id: string;
  timestamp: number;
  gameState: any;
  userProgress: any;
  criticalData: any;
}

interface RecoveryConfig {
  autoSaveInterval: number; // milliseconds
  maxRecoveryPoints: number;
  enableCloudBackup: boolean;
}

export class AutoRecoverySystem {
  private static instance: AutoRecoverySystem;
  private config: RecoveryConfig;
  private recoveryPoints: RecoveryPoint[] = [];
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private isRecovering: boolean = false;
  private lastSaveTime: number = 0;

  private constructor() {
    this.config = {
      autoSaveInterval: 30000, // Save every 30 seconds
      maxRecoveryPoints: 5,
      enableCloudBackup: true,
    };

    this.initialize();
  }

  static getInstance(): AutoRecoverySystem {
    if (!AutoRecoverySystem.instance) {
      AutoRecoverySystem.instance = new AutoRecoverySystem();
    }
    return AutoRecoverySystem.instance;
  }

  private async initialize(): Promise<void> {
    // Load existing recovery points
    await this.loadRecoveryPoints();
    
    // Start auto-save
    this.startAutoSave();
    
    // Listen for critical events
    this.setupEventListeners();
    
    // Check for crash recovery on startup
    await this.checkCrashRecovery();
  }

  private setupEventListeners(): void {
    // Save on critical game events
    eventBus.on('game:levelComplete', () => this.createRecoveryPoint('level_complete'));
    eventBus.on('purchase:completed', () => this.createRecoveryPoint('purchase'));
    eventBus.on('achievement:unlocked', () => this.createRecoveryPoint('achievement'));
    eventBus.on('app:background', () => this.createRecoveryPoint('background'));
    eventBus.on('error:critical', () => this.createRecoveryPoint('error'));
  }

  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      this.createRecoveryPoint('auto');
    }, this.config.autoSaveInterval);
  }

  async createRecoveryPoint(trigger: string = 'manual'): Promise<void> {
    try {
      // Throttle saves (minimum 5 seconds between saves)
      const now = Date.now();
      if (now - this.lastSaveTime < 5000 && trigger === 'auto') {
        return;
      }
      
      this.lastSaveTime = now;

      const gameState = await this.captureGameState();
      const userProgress = await this.captureUserProgress();
      const criticalData = await this.captureCriticalData();

      const recoveryPoint: RecoveryPoint = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        gameState,
        userProgress,
        criticalData,
      };

      // Add to recovery points
      this.recoveryPoints.unshift(recoveryPoint);
      
      // Keep only the latest N recovery points
      if (this.recoveryPoints.length > this.config.maxRecoveryPoints) {
        this.recoveryPoints = this.recoveryPoints.slice(0, this.config.maxRecoveryPoints);
      }

      // Save locally
      await this.saveRecoveryPoints();
      
      // Cloud backup if enabled
      if (this.config.enableCloudBackup) {
        await this.cloudBackup(recoveryPoint);
      }

      eventBus.emit('recovery:saved', {
        trigger,
        timestamp: now,
        pointId: recoveryPoint.id,
      });

    } catch (error) {
      console.error('Failed to create recovery point:', error);
      eventBus.emit('recovery:failed', error);
    }
  }

  private async captureGameState(): Promise<any> {
    // Capture current game state
    try {
      const gameState = await AsyncStorage.getItem('game_state');
      return gameState ? JSON.parse(gameState) : {};
    } catch {
      return {};
    }
  }

  private async captureUserProgress(): Promise<any> {
    // Capture user progress
    try {
      const progress = await AsyncStorage.getItem('user_progress');
      return progress ? JSON.parse(progress) : {};
    } catch {
      return {};
    }
  }

  private async captureCriticalData(): Promise<any> {
    // Capture critical data that must not be lost
    const critical = {
      coins: await AsyncStorage.getItem('user_coins'),
      level: await AsyncStorage.getItem('user_level'),
      purchases: await AsyncStorage.getItem('user_purchases'),
      achievements: await AsyncStorage.getItem('user_achievements'),
      timestamp: Date.now(),
    };
    
    return critical;
  }

  async recover(pointId?: string): Promise<boolean> {
    if (this.isRecovering) {
      console.warn('Recovery already in progress');
      return false;
    }

    this.isRecovering = true;
    eventBus.emit('recovery:started');

    try {
      let recoveryPoint: RecoveryPoint | undefined;
      
      if (pointId) {
        // Recover specific point
        recoveryPoint = this.recoveryPoints.find(p => p.id === pointId);
      } else {
        // Recover latest point
        recoveryPoint = this.recoveryPoints[0];
      }

      if (!recoveryPoint) {
        throw new Error('No recovery point found');
      }

      // Restore game state
      await this.restoreGameState(recoveryPoint.gameState);
      
      // Restore user progress
      await this.restoreUserProgress(recoveryPoint.userProgress);
      
      // Restore critical data
      await this.restoreCriticalData(recoveryPoint.criticalData);

      eventBus.emit('recovery:completed', {
        pointId: recoveryPoint.id,
        timestamp: recoveryPoint.timestamp,
      });

      return true;

    } catch (error) {
      console.error('Recovery failed:', error);
      eventBus.emit('recovery:failed', error);
      return false;
    } finally {
      this.isRecovering = false;
    }
  }

  private async restoreGameState(state: any): Promise<void> {
    if (state) {
      await AsyncStorage.setItem('game_state', JSON.stringify(state));
    }
  }

  private async restoreUserProgress(progress: any): Promise<void> {
    if (progress) {
      await AsyncStorage.setItem('user_progress', JSON.stringify(progress));
    }
  }

  private async restoreCriticalData(critical: any): Promise<void> {
    if (critical) {
      if (critical.coins) await AsyncStorage.setItem('user_coins', critical.coins);
      if (critical.level) await AsyncStorage.setItem('user_level', critical.level);
      if (critical.purchases) await AsyncStorage.setItem('user_purchases', critical.purchases);
      if (critical.achievements) await AsyncStorage.setItem('user_achievements', critical.achievements);
    }
  }

  private async checkCrashRecovery(): Promise<void> {
    try {
      // Check if app crashed last time
      const lastSession = await AsyncStorage.getItem('last_session');
      const crashDetected = await AsyncStorage.getItem('crash_detected');
      
      if (crashDetected === 'true') {
        // Auto-recover from latest point
        const recovered = await this.recover();
        
        if (recovered) {
          eventBus.emit('crash:recovered', {
            timestamp: Date.now(),
            lastSession,
          });
        }
        
        // Clear crash flag
        await AsyncStorage.removeItem('crash_detected');
      }
      
      // Set new session
      await AsyncStorage.setItem('last_session', Date.now().toString());
      
    } catch (error) {
      console.error('Crash recovery check failed:', error);
    }
  }

  private async cloudBackup(point: RecoveryPoint): Promise<void> {
    // Backup to Firebase
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebase/firebase');
      const { auth } = await import('../../firebase/auth');
      
      if (auth.currentUser) {
        await setDoc(
          doc(db, 'recovery_points', auth.currentUser.uid),
          {
            latest: point,
            timestamp: Date.now(),
          }
        );
      }
    } catch (error) {
      console.warn('Cloud backup failed:', error);
    }
  }

  private async loadRecoveryPoints(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('recovery_points');
      if (saved) {
        this.recoveryPoints = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load recovery points:', error);
    }
  }

  private async saveRecoveryPoints(): Promise<void> {
    try {
      await AsyncStorage.setItem('recovery_points', JSON.stringify(this.recoveryPoints));
    } catch (error) {
      console.error('Failed to save recovery points:', error);
    }
  }

  // Public API
  getRecoveryPoints(): RecoveryPoint[] {
    return [...this.recoveryPoints];
  }

  clearRecoveryPoints(): void {
    this.recoveryPoints = [];
    this.saveRecoveryPoints();
  }

  setAutoSaveInterval(interval: number): void {
    this.config.autoSaveInterval = interval;
    
    // Restart auto-save with new interval
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.startAutoSave();
    }
  }

  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
  }
}

export const autoRecoverySystem = AutoRecoverySystem.getInstance();