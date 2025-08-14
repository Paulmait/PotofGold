import AsyncStorage from '@react-native-async-storage/async-storage';
import { performanceMonitor } from '../utils/performanceMonitor';

/**
 * Dynamic Difficulty Adjustment System
 * Automatically adjusts game difficulty based on player skill and engagement
 */

export interface PlayerMetrics {
  // Performance metrics
  averageScore: number;
  highScore: number;
  averageSessionLength: number;
  deathRate: number;
  successRate: number;
  
  // Skill indicators
  reactionTime: number;
  accuracy: number;
  comboRate: number;
  powerUpEfficiency: number;
  
  // Engagement metrics
  sessionCount: number;
  totalPlayTime: number;
  lastPlayTime: number;
  churnRisk: number;
  
  // Progress metrics
  currentLevel: number;
  experiencePoints: number;
  unlockedContent: number;
  completionRate: number;
}

export interface DifficultyParameters {
  // Game speed
  baseSpeed: number;
  speedMultiplier: number;
  accelerationRate: number;
  maxSpeed: number;
  
  // Coin spawning
  coinSpawnRate: number;
  coinValue: number;
  specialCoinChance: number;
  coinPatternComplexity: number;
  
  // Obstacles
  obstacleFrequency: number;
  obstacleSpeed: number;
  obstacleComplexity: number;
  obstacleWarningTime: number;
  
  // Power-ups
  powerUpFrequency: number;
  powerUpDuration: number;
  powerUpEffectiveness: number;
  
  // Scoring
  scoreMultiplier: number;
  comboThreshold: number;
  bonusChance: number;
  
  // Assistance
  magnetRange: number;
  shieldStrength: number;
  slowMotionFactor: number;
  autoCollectRadius: number;
}

export enum DifficultyLevel {
  TUTORIAL = 0,
  BEGINNER = 1,
  EASY = 2,
  NORMAL = 3,
  HARD = 4,
  EXPERT = 5,
  MASTER = 6,
  LEGENDARY = 7
}

export enum PlayerSkillTier {
  NOVICE = 'novice',
  CASUAL = 'casual',
  REGULAR = 'regular',
  SKILLED = 'skilled',
  EXPERT = 'expert',
  MASTER = 'master'
}

interface DifficultyProfile {
  level: DifficultyLevel;
  parameters: DifficultyParameters;
  adaptiveModifiers: Map<string, number>;
}

interface FlowState {
  isInFlow: boolean;
  flowScore: number;
  lastFlowCheck: number;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
}

class DynamicDifficultySystem {
  private static instance: DynamicDifficultySystem;
  
  private currentDifficulty: DifficultyLevel = DifficultyLevel.NORMAL;
  private playerMetrics: PlayerMetrics;
  private difficultyProfile: DifficultyProfile;
  private flowState: FlowState;
  private sessionMetrics: Map<string, any> = new Map();
  
  // DDA Configuration
  private readonly ADJUSTMENT_INTERVAL = 60000; // Check every minute
  private readonly FLOW_THRESHOLD = 0.7;
  private readonly FRUSTRATION_THRESHOLD = 0.3;
  private readonly MAX_ADJUSTMENT_STEP = 0.2;
  
  // Difficulty presets
  private difficultyPresets: Map<DifficultyLevel, DifficultyParameters>;
  
  private constructor() {
    this.playerMetrics = this.getDefaultPlayerMetrics();
    this.flowState = this.getDefaultFlowState();
    this.difficultyPresets = this.initializeDifficultyPresets();
    this.difficultyProfile = this.createDifficultyProfile(DifficultyLevel.NORMAL);
    
    this.loadPlayerData();
    this.startMonitoring();
  }

  static getInstance(): DynamicDifficultySystem {
    if (!DynamicDifficultySystem.instance) {
      DynamicDifficultySystem.instance = new DynamicDifficultySystem();
    }
    return DynamicDifficultySystem.instance;
  }

  private getDefaultPlayerMetrics(): PlayerMetrics {
    return {
      averageScore: 0,
      highScore: 0,
      averageSessionLength: 0,
      deathRate: 0,
      successRate: 0.5,
      reactionTime: 500,
      accuracy: 0.5,
      comboRate: 0,
      powerUpEfficiency: 0.5,
      sessionCount: 0,
      totalPlayTime: 0,
      lastPlayTime: Date.now(),
      churnRisk: 0,
      currentLevel: 1,
      experiencePoints: 0,
      unlockedContent: 0,
      completionRate: 0
    };
  }

  private getDefaultFlowState(): FlowState {
    return {
      isInFlow: false,
      flowScore: 0.5,
      lastFlowCheck: Date.now(),
      consecutiveSuccesses: 0,
      consecutiveFailures: 0
    };
  }

  private initializeDifficultyPresets(): Map<DifficultyLevel, DifficultyParameters> {
    const presets = new Map<DifficultyLevel, DifficultyParameters>();

    // Tutorial - Very Easy
    presets.set(DifficultyLevel.TUTORIAL, {
      baseSpeed: 100,
      speedMultiplier: 0.5,
      accelerationRate: 0.001,
      maxSpeed: 200,
      coinSpawnRate: 2.0,
      coinValue: 2,
      specialCoinChance: 0.2,
      coinPatternComplexity: 0.1,
      obstacleFrequency: 0.1,
      obstacleSpeed: 50,
      obstacleComplexity: 0.1,
      obstacleWarningTime: 3000,
      powerUpFrequency: 0.3,
      powerUpDuration: 15000,
      powerUpEffectiveness: 1.5,
      scoreMultiplier: 0.5,
      comboThreshold: 3,
      bonusChance: 0.3,
      magnetRange: 200,
      shieldStrength: 3,
      slowMotionFactor: 0.3,
      autoCollectRadius: 150
    });

    // Beginner
    presets.set(DifficultyLevel.BEGINNER, {
      baseSpeed: 150,
      speedMultiplier: 0.7,
      accelerationRate: 0.002,
      maxSpeed: 300,
      coinSpawnRate: 1.8,
      coinValue: 1,
      specialCoinChance: 0.15,
      coinPatternComplexity: 0.2,
      obstacleFrequency: 0.2,
      obstacleSpeed: 75,
      obstacleComplexity: 0.2,
      obstacleWarningTime: 2500,
      powerUpFrequency: 0.25,
      powerUpDuration: 12000,
      powerUpEffectiveness: 1.3,
      scoreMultiplier: 0.7,
      comboThreshold: 5,
      bonusChance: 0.25,
      magnetRange: 150,
      shieldStrength: 2,
      slowMotionFactor: 0.4,
      autoCollectRadius: 100
    });

    // Normal
    presets.set(DifficultyLevel.NORMAL, {
      baseSpeed: 200,
      speedMultiplier: 1.0,
      accelerationRate: 0.003,
      maxSpeed: 400,
      coinSpawnRate: 1.5,
      coinValue: 1,
      specialCoinChance: 0.1,
      coinPatternComplexity: 0.4,
      obstacleFrequency: 0.3,
      obstacleSpeed: 100,
      obstacleComplexity: 0.4,
      obstacleWarningTime: 2000,
      powerUpFrequency: 0.2,
      powerUpDuration: 10000,
      powerUpEffectiveness: 1.0,
      scoreMultiplier: 1.0,
      comboThreshold: 7,
      bonusChance: 0.2,
      magnetRange: 100,
      shieldStrength: 1,
      slowMotionFactor: 0.5,
      autoCollectRadius: 75
    });

    // Hard
    presets.set(DifficultyLevel.HARD, {
      baseSpeed: 250,
      speedMultiplier: 1.3,
      accelerationRate: 0.004,
      maxSpeed: 500,
      coinSpawnRate: 1.2,
      coinValue: 1,
      specialCoinChance: 0.08,
      coinPatternComplexity: 0.6,
      obstacleFrequency: 0.45,
      obstacleSpeed: 150,
      obstacleComplexity: 0.6,
      obstacleWarningTime: 1500,
      powerUpFrequency: 0.15,
      powerUpDuration: 8000,
      powerUpEffectiveness: 0.9,
      scoreMultiplier: 1.5,
      comboThreshold: 10,
      bonusChance: 0.15,
      magnetRange: 75,
      shieldStrength: 1,
      slowMotionFactor: 0.6,
      autoCollectRadius: 50
    });

    // Expert
    presets.set(DifficultyLevel.EXPERT, {
      baseSpeed: 300,
      speedMultiplier: 1.5,
      accelerationRate: 0.005,
      maxSpeed: 600,
      coinSpawnRate: 1.0,
      coinValue: 2,
      specialCoinChance: 0.05,
      coinPatternComplexity: 0.8,
      obstacleFrequency: 0.6,
      obstacleSpeed: 200,
      obstacleComplexity: 0.8,
      obstacleWarningTime: 1000,
      powerUpFrequency: 0.1,
      powerUpDuration: 6000,
      powerUpEffectiveness: 0.8,
      scoreMultiplier: 2.0,
      comboThreshold: 15,
      bonusChance: 0.1,
      magnetRange: 50,
      shieldStrength: 0,
      slowMotionFactor: 0.7,
      autoCollectRadius: 25
    });

    // Master & Legendary have even more extreme parameters
    presets.set(DifficultyLevel.MASTER, this.createExtremeDifficulty(2.5));
    presets.set(DifficultyLevel.LEGENDARY, this.createExtremeDifficulty(3.0));

    return presets;
  }

  private createExtremeDifficulty(multiplier: number): DifficultyParameters {
    const expert = this.difficultyPresets?.get(DifficultyLevel.EXPERT) || this.initializeDifficultyPresets().get(DifficultyLevel.EXPERT)!;
    return {
      ...expert,
      baseSpeed: expert.baseSpeed * multiplier,
      obstacleFrequency: Math.min(expert.obstacleFrequency * multiplier, 0.9),
      obstacleComplexity: Math.min(expert.obstacleComplexity * multiplier, 1.0),
      scoreMultiplier: expert.scoreMultiplier * multiplier,
      powerUpFrequency: expert.powerUpFrequency / multiplier,
      powerUpDuration: expert.powerUpDuration / multiplier
    };
  }

  private createDifficultyProfile(level: DifficultyLevel): DifficultyProfile {
    return {
      level,
      parameters: this.difficultyPresets.get(level)!,
      adaptiveModifiers: new Map()
    };
  }

  private async loadPlayerData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('@player_metrics');
      if (data) {
        this.playerMetrics = JSON.parse(data);
      }
      
      const difficulty = await AsyncStorage.getItem('@current_difficulty');
      if (difficulty) {
        this.currentDifficulty = parseInt(difficulty, 10);
        this.difficultyProfile = this.createDifficultyProfile(this.currentDifficulty);
      }
    } catch (error) {
      console.error('Failed to load player data:', error);
    }
  }

  private async savePlayerData(): Promise<void> {
    try {
      await AsyncStorage.setItem('@player_metrics', JSON.stringify(this.playerMetrics));
      await AsyncStorage.setItem('@current_difficulty', this.currentDifficulty.toString());
    } catch (error) {
      console.error('Failed to save player data:', error);
    }
  }

  private startMonitoring(): void {
    // Regular difficulty adjustment check
    setInterval(() => {
      this.evaluateAndAdjust();
    }, this.ADJUSTMENT_INTERVAL);

    // Real-time flow state monitoring
    setInterval(() => {
      this.updateFlowState();
    }, 5000);
  }

  private updateFlowState(): void {
    const now = Date.now();
    const timeSinceLastCheck = now - this.flowState.lastFlowCheck;
    
    // Calculate flow score based on recent performance
    const successRatio = this.flowState.consecutiveSuccesses / 
                        Math.max(1, this.flowState.consecutiveSuccesses + this.flowState.consecutiveFailures);
    
    const performanceScore = performanceMonitor.getPerformanceScore() / 100;
    const engagementScore = this.calculateEngagementScore();
    
    // Weighted flow score
    this.flowState.flowScore = (
      successRatio * 0.4 +
      performanceScore * 0.3 +
      engagementScore * 0.3
    );
    
    // Determine if player is in flow
    this.flowState.isInFlow = this.flowState.flowScore > this.FLOW_THRESHOLD;
    this.flowState.lastFlowCheck = now;
  }

  private calculateEngagementScore(): number {
    const sessionLength = this.sessionMetrics.get('sessionLength') || 0;
    const targetSessionLength = 300000; // 5 minutes
    
    const lengthScore = Math.min(sessionLength / targetSessionLength, 1);
    const frequencyScore = Math.min(this.playerMetrics.sessionCount / 10, 1);
    
    return (lengthScore + frequencyScore) / 2;
  }

  private evaluateAndAdjust(): void {
    const skillTier = this.evaluatePlayerSkill();
    const optimalDifficulty = this.calculateOptimalDifficulty(skillTier);
    
    // Check if adjustment is needed
    if (Math.abs(optimalDifficulty - this.currentDifficulty) > 0.5) {
      this.adjustDifficulty(optimalDifficulty);
    }
    
    // Fine-tune parameters based on flow state
    this.applyFlowAdjustments();
  }

  private evaluatePlayerSkill(): PlayerSkillTier {
    const score = this.playerMetrics.averageScore;
    const accuracy = this.playerMetrics.accuracy;
    const deathRate = this.playerMetrics.deathRate;
    
    // Composite skill score
    const skillScore = (
      (score / 10000) * 0.3 +
      accuracy * 0.3 +
      (1 - deathRate) * 0.2 +
      (this.playerMetrics.comboRate / 100) * 0.2
    );
    
    if (skillScore < 0.2) return PlayerSkillTier.NOVICE;
    if (skillScore < 0.4) return PlayerSkillTier.CASUAL;
    if (skillScore < 0.6) return PlayerSkillTier.REGULAR;
    if (skillScore < 0.75) return PlayerSkillTier.SKILLED;
    if (skillScore < 0.9) return PlayerSkillTier.EXPERT;
    return PlayerSkillTier.MASTER;
  }

  private calculateOptimalDifficulty(skillTier: PlayerSkillTier): DifficultyLevel {
    // Map skill tier to difficulty level
    const tierToDifficulty: Record<PlayerSkillTier, DifficultyLevel> = {
      [PlayerSkillTier.NOVICE]: DifficultyLevel.BEGINNER,
      [PlayerSkillTier.CASUAL]: DifficultyLevel.EASY,
      [PlayerSkillTier.REGULAR]: DifficultyLevel.NORMAL,
      [PlayerSkillTier.SKILLED]: DifficultyLevel.HARD,
      [PlayerSkillTier.EXPERT]: DifficultyLevel.EXPERT,
      [PlayerSkillTier.MASTER]: DifficultyLevel.MASTER
    };
    
    let baseDifficulty = tierToDifficulty[skillTier];
    
    // Adjust based on flow state
    if (this.flowState.isInFlow) {
      // Player is engaged, can handle slightly higher difficulty
      baseDifficulty = Math.min(baseDifficulty + 0.5, DifficultyLevel.LEGENDARY);
    } else if (this.flowState.flowScore < this.FRUSTRATION_THRESHOLD) {
      // Player is frustrated, reduce difficulty
      baseDifficulty = Math.max(baseDifficulty - 0.5, DifficultyLevel.TUTORIAL);
    }
    
    return Math.round(baseDifficulty);
  }

  private adjustDifficulty(targetDifficulty: DifficultyLevel): void {
    // Smooth transition to avoid jarring changes
    const step = Math.sign(targetDifficulty - this.currentDifficulty) * this.MAX_ADJUSTMENT_STEP;
    this.currentDifficulty = Math.max(
      DifficultyLevel.TUTORIAL,
      Math.min(DifficultyLevel.LEGENDARY, this.currentDifficulty + step)
    );
    
    // Update difficulty profile
    this.difficultyProfile = this.createDifficultyProfile(Math.round(this.currentDifficulty));
    
    // Log adjustment
    console.log(`Difficulty adjusted to: ${DifficultyLevel[Math.round(this.currentDifficulty)]}`);
    
    this.savePlayerData();
  }

  private applyFlowAdjustments(): void {
    const params = this.difficultyProfile.parameters;
    
    if (this.flowState.isInFlow) {
      // Subtle increases to maintain flow
      this.difficultyProfile.adaptiveModifiers.set('speed', 0.05);
      this.difficultyProfile.adaptiveModifiers.set('complexity', 0.05);
    } else if (this.flowState.flowScore < this.FRUSTRATION_THRESHOLD) {
      // Reduce difficulty to prevent frustration
      this.difficultyProfile.adaptiveModifiers.set('speed', -0.1);
      this.difficultyProfile.adaptiveModifiers.set('obstacleFrequency', -0.15);
      this.difficultyProfile.adaptiveModifiers.set('powerUpFrequency', 0.2);
    } else {
      // Neutral adjustments
      this.difficultyProfile.adaptiveModifiers.clear();
    }
  }

  // Public API

  getCurrentDifficulty(): DifficultyParameters {
    const base = this.difficultyProfile.parameters;
    const modifiers = this.difficultyProfile.adaptiveModifiers;
    
    // Apply adaptive modifiers
    const adjusted: DifficultyParameters = { ...base };
    
    if (modifiers.has('speed')) {
      adjusted.baseSpeed *= (1 + modifiers.get('speed')!);
      adjusted.speedMultiplier *= (1 + modifiers.get('speed')!);
    }
    
    if (modifiers.has('complexity')) {
      adjusted.coinPatternComplexity *= (1 + modifiers.get('complexity')!);
      adjusted.obstacleComplexity *= (1 + modifiers.get('complexity')!);
    }
    
    if (modifiers.has('obstacleFrequency')) {
      adjusted.obstacleFrequency *= (1 + modifiers.get('obstacleFrequency')!);
    }
    
    if (modifiers.has('powerUpFrequency')) {
      adjusted.powerUpFrequency *= (1 + modifiers.get('powerUpFrequency')!);
    }
    
    return adjusted;
  }

  getDifficultyLevel(): DifficultyLevel {
    return Math.round(this.currentDifficulty);
  }

  getFlowState(): FlowState {
    return { ...this.flowState };
  }

  // Event tracking
  recordSuccess(type: string, value: number = 1): void {
    this.flowState.consecutiveSuccesses++;
    this.flowState.consecutiveFailures = 0;
    
    // Update metrics
    this.playerMetrics.successRate = (this.playerMetrics.successRate * 0.9) + (0.1);
    this.sessionMetrics.set(`success_${type}`, (this.sessionMetrics.get(`success_${type}`) || 0) + value);
  }

  recordFailure(type: string): void {
    this.flowState.consecutiveFailures++;
    this.flowState.consecutiveSuccesses = 0;
    
    // Update metrics
    this.playerMetrics.successRate = (this.playerMetrics.successRate * 0.9);
    this.playerMetrics.deathRate = (this.playerMetrics.deathRate * 0.9) + (0.1);
  }

  recordScore(score: number): void {
    this.playerMetrics.averageScore = (this.playerMetrics.averageScore * 0.9) + (score * 0.1);
    if (score > this.playerMetrics.highScore) {
      this.playerMetrics.highScore = score;
    }
  }

  recordReactionTime(time: number): void {
    this.playerMetrics.reactionTime = (this.playerMetrics.reactionTime * 0.9) + (time * 0.1);
  }

  recordCombo(length: number): void {
    this.playerMetrics.comboRate = Math.max(this.playerMetrics.comboRate, length);
  }

  // Session management
  startSession(): void {
    this.sessionMetrics.clear();
    this.sessionMetrics.set('startTime', Date.now());
    this.playerMetrics.sessionCount++;
  }

  endSession(): void {
    const duration = Date.now() - (this.sessionMetrics.get('startTime') || Date.now());
    this.playerMetrics.averageSessionLength = 
      (this.playerMetrics.averageSessionLength * 0.9) + (duration * 0.1);
    this.playerMetrics.totalPlayTime += duration;
    this.playerMetrics.lastPlayTime = Date.now();
    
    this.savePlayerData();
  }

  // Manual difficulty override
  setDifficulty(level: DifficultyLevel): void {
    this.currentDifficulty = level;
    this.difficultyProfile = this.createDifficultyProfile(level);
    this.savePlayerData();
  }

  // Get recommendation for player
  getDifficultyRecommendation(): DifficultyLevel {
    const skillTier = this.evaluatePlayerSkill();
    return this.calculateOptimalDifficulty(skillTier);
  }
}

// Export singleton instance
export const dynamicDifficulty = DynamicDifficultySystem.getInstance();

// Convenience functions
export function getDifficulty(): DifficultyParameters {
  return dynamicDifficulty.getCurrentDifficulty();
}

export function recordGameSuccess(): void {
  dynamicDifficulty.recordSuccess('game');
}

export function recordGameFailure(): void {
  dynamicDifficulty.recordFailure('game');
}

export function isPlayerInFlow(): boolean {
  return dynamicDifficulty.getFlowState().isInFlow;
}