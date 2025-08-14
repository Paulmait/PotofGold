import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { deviceInfoManager } from '../utils/deviceInfo';
import { performanceMonitor } from '../utils/performanceMonitor';
import { telemetrySystem, EventType } from './TelemetrySystem';
import { crashReporting } from './CrashReporting';

/**
 * Advanced Anti-Cheat System
 * Comprehensive protection against various cheating methods
 */

export interface CheatDetection {
  id: string;
  timestamp: number;
  type: CheatType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  evidence: CheatEvidence;
  playerProfile: {
    userId: string;
    sessionId: string;
    gameState: any;
    deviceInfo: any;
  };
  actionTaken: CheatAction;
}

export interface CheatEvidence {
  description: string;
  metrics: Record<string, number>;
  timeline: Array<{
    timestamp: number;
    event: string;
    value: any;
  }>;
  comparison: {
    expected: any;
    actual: any;
    deviation: number;
  };
  context: Record<string, any>;
}

export enum CheatType {
  // Speed/Time Cheats
  SPEED_HACK = 'speed_hack',
  TIME_MANIPULATION = 'time_manipulation',
  FRAME_SKIP = 'frame_skip',
  
  // Score/Currency Cheats
  SCORE_MANIPULATION = 'score_manipulation',
  CURRENCY_INJECTION = 'currency_injection',
  IMPOSSIBLE_SCORE = 'impossible_score',
  
  // Memory/State Cheats
  MEMORY_MODIFICATION = 'memory_modification',
  STATE_TAMPERING = 'state_tampering',
  SAVE_INJECTION = 'save_injection',
  
  // Input Cheats
  AUTO_CLICK = 'auto_click',
  MACRO_USAGE = 'macro_usage',
  INPUT_INJECTION = 'input_injection',
  IMPOSSIBLE_INPUT = 'impossible_input',
  
  // Network Cheats
  PACKET_MANIPULATION = 'packet_manipulation',
  REQUEST_REPLAY = 'request_replay',
  MAN_IN_MIDDLE = 'man_in_middle',
  
  // Device/Environment Cheats
  EMULATOR_USAGE = 'emulator_usage',
  ROOT_JAILBREAK = 'root_jailbreak',
  DEBUGGING_TOOLS = 'debugging_tools',
  MODIFIED_APK = 'modified_apk',
  
  // Statistical Anomalies
  STATISTICAL_OUTLIER = 'statistical_outlier',
  PATTERN_ANOMALY = 'pattern_anomaly',
  BEHAVIORAL_ANOMALY = 'behavioral_anomaly'
}

export enum CheatAction {
  LOG_ONLY = 'log_only',
  WARNING = 'warning',
  SCORE_RESET = 'score_reset',
  TEMPORARY_BAN = 'temporary_ban',
  PERMANENT_BAN = 'permanent_ban',
  RATE_LIMIT = 'rate_limit',
  CAPTCHA_CHALLENGE = 'captcha_challenge',
  HUMAN_VERIFICATION = 'human_verification'
}

interface GameSessionMetrics {
  startTime: number;
  endTime?: number;
  totalScore: number;
  highestScore: number;
  averageScore: number;
  scoreProgression: number[];
  inputEvents: InputEvent[];
  performanceMetrics: {
    fps: number[];
    memoryUsage: number[];
    cpuUsage: number[];
  };
  gameEvents: Array<{
    timestamp: number;
    type: string;
    data: any;
  }>;
}

interface InputEvent {
  timestamp: number;
  type: 'tap' | 'swipe' | 'hold' | 'release';
  coordinates: { x: number; y: number };
  duration?: number;
  pressure?: number;
  velocity?: number;
}

interface PlayerBehaviorProfile {
  userId: string;
  sessions: number;
  averageSessionLength: number;
  skillProgression: number[];
  consistencyScore: number;
  reactionTimes: number[];
  inputPatterns: Map<string, number>;
  anomalyHistory: CheatDetection[];
  trustScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityValidation {
  deviceIntegrity: boolean;
  appIntegrity: boolean;
  networkSecurity: boolean;
  environmentSecurity: boolean;
  dataIntegrity: boolean;
}

class AntiCheatSystem {
  private static instance: AntiCheatSystem;
  
  private currentSession: GameSessionMetrics | null = null;
  private playerProfile: PlayerBehaviorProfile | null = null;
  private detections: CheatDetection[] = [];
  private isMonitoring: boolean = false;
  
  // Monitoring intervals
  private validationTimer: NodeJS.Timeout | null = null;
  private statisticsTimer: NodeJS.Timeout | null = null;
  private behaviorTimer: NodeJS.Timeout | null = null;
  
  // Thresholds and limits
  private readonly SCORE_VARIANCE_THRESHOLD = 3.0; // Standard deviations
  private readonly INPUT_SPEED_THRESHOLD = 50; // Max clicks per second
  private readonly REACTION_TIME_MIN = 100; // Minimum human reaction time (ms)
  private readonly CONSISTENCY_THRESHOLD = 0.95; // Suspiciously high consistency
  private readonly TRUST_SCORE_THRESHOLD = 30; // Below this is suspicious
  
  // Storage keys
  private readonly STORAGE_KEY = '@anticheat_data';
  private readonly PROFILE_KEY = '@behavior_profile';
  private readonly DETECTIONS_KEY = '@cheat_detections';
  
  // Security state
  private securityValidation: SecurityValidation;
  private lastValidationTime: number = 0;
  private suspiciousActivityLevel: number = 0;
  
  private constructor() {
    this.securityValidation = {
      deviceIntegrity: true,
      appIntegrity: true,
      networkSecurity: true,
      environmentSecurity: true,
      dataIntegrity: true
    };
  }
  
  static getInstance(): AntiCheatSystem {
    if (!AntiCheatSystem.instance) {
      AntiCheatSystem.instance = new AntiCheatSystem();
    }
    return AntiCheatSystem.instance;
  }
  
  async initialize(): Promise<void> {
    try {
      await this.loadStoredData();
      await this.performSecurityValidation();
      await this.initializeBehaviorProfile();
      this.startMonitoring();
      
      console.log('Anti-cheat system initialized');
    } catch (error) {
      console.error('Failed to initialize anti-cheat system:', error);
      crashReporting.handleError(error as Error, 'storage_error' as any);
    }
  }
  
  private async loadStoredData(): Promise<void> {
    try {
      const [profileData, detectionsData] = await Promise.all([
        AsyncStorage.getItem(this.PROFILE_KEY),
        AsyncStorage.getItem(this.DETECTIONS_KEY)
      ]);
      
      if (profileData) {
        this.playerProfile = JSON.parse(profileData);
      }
      
      if (detectionsData) {
        this.detections = JSON.parse(detectionsData);
      }
    } catch (error) {
      console.error('Failed to load anti-cheat data:', error);
    }
  }
  
  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(this.PROFILE_KEY, JSON.stringify(this.playerProfile)),
        AsyncStorage.setItem(this.DETECTIONS_KEY, JSON.stringify(this.detections.slice(-50))) // Keep last 50
      ]);
    } catch (error) {
      console.error('Failed to save anti-cheat data:', error);
    }
  }
  
  private async performSecurityValidation(): Promise<SecurityValidation> {
    const deviceProfile = deviceInfoManager.getDeviceProfile();
    
    // Device integrity check
    this.securityValidation.deviceIntegrity = await this.checkDeviceIntegrity();
    
    // App integrity check
    this.securityValidation.appIntegrity = await this.checkAppIntegrity();
    
    // Network security check
    this.securityValidation.networkSecurity = await this.checkNetworkSecurity();
    
    // Environment security check
    this.securityValidation.environmentSecurity = await this.checkEnvironmentSecurity();
    
    // Data integrity check
    this.securityValidation.dataIntegrity = await this.checkDataIntegrity();
    
    this.lastValidationTime = Date.now();
    
    // Report security issues
    const issues = Object.entries(this.securityValidation)
      .filter(([_, isValid]) => !isValid)
      .map(([check]) => check);
    
    if (issues.length > 0) {
      this.reportCheatDetection(CheatType.MODIFIED_APK, 'high', 85, {
        description: `Security validation failed: ${issues.join(', ')}`,
        metrics: { failedChecks: issues.length },
        timeline: [{ timestamp: Date.now(), event: 'security_validation', value: issues }],
        comparison: { expected: 'all_valid', actual: issues, deviation: issues.length },
        context: { deviceProfile }
      });
    }
    
    return this.securityValidation;
  }
  
  private async checkDeviceIntegrity(): Promise<boolean> {
    const deviceProfile = deviceInfoManager.getDeviceProfile();
    
    // Check for emulator indicators
    if (this.isEmulator(deviceProfile)) {
      this.reportCheatDetection(CheatType.EMULATOR_USAGE, 'medium', 70, {
        description: 'Emulator detected',
        metrics: { emulatorIndicators: 1 },
        timeline: [{ timestamp: Date.now(), event: 'emulator_check', value: true }],
        comparison: { expected: false, actual: true, deviation: 1 },
        context: { deviceProfile }
      });
      return false;
    }
    
    // Check for root/jailbreak
    if (this.isRootedOrJailbroken(deviceProfile)) {
      this.reportCheatDetection(CheatType.ROOT_JAILBREAK, 'high', 80, {
        description: 'Rooted/Jailbroken device detected',
        metrics: { rootIndicators: 1 },
        timeline: [{ timestamp: Date.now(), event: 'root_check', value: true }],
        comparison: { expected: false, actual: true, deviation: 1 },
        context: { deviceProfile }
      });
      return false;
    }
    
    return true;
  }
  
  private isEmulator(deviceProfile: any): boolean {
    // Check for common emulator indicators
    const emulatorIndicators = [
      'generic', 'unknown', 'emulator', 'simulator',
      'genymotion', 'bluestacks', 'andy', 'nox'
    ];
    
    const deviceName = (deviceProfile.deviceName || '').toLowerCase();
    const brand = (deviceProfile.brand || '').toLowerCase();
    const model = (deviceProfile.modelName || '').toLowerCase();
    
    return emulatorIndicators.some(indicator =>
      deviceName.includes(indicator) ||
      brand.includes(indicator) ||
      model.includes(indicator)
    );
  }
  
  private isRootedOrJailbroken(deviceProfile: any): boolean {
    // This would require platform-specific native modules for accurate detection
    // For now, return false - implement with native modules in production
    return false;
  }
  
  private async checkAppIntegrity(): Promise<boolean> {
    // Check for debugging tools
    if (this.hasDebuggingTools()) {
      this.reportCheatDetection(CheatType.DEBUGGING_TOOLS, 'medium', 60, {
        description: 'Debugging tools detected',
        metrics: { debuggingTools: 1 },
        timeline: [{ timestamp: Date.now(), event: 'debug_check', value: true }],
        comparison: { expected: false, actual: true, deviation: 1 },
        context: {}
      });
      return false;
    }
    
    return true;
  }
  
  private hasDebuggingTools(): boolean {
    // Check for React DevTools, Flipper, etc.
    return __DEV__ && (
      (global as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
      (global as any).__flipperActivated
    );
  }
  
  private async checkNetworkSecurity(): Promise<boolean> {
    // Placeholder for network security checks
    // Would implement SSL pinning validation, proxy detection, etc.
    return true;
  }
  
  private async checkEnvironmentSecurity(): Promise<boolean> {
    // Check for suspicious environment modifications
    return true;
  }
  
  private async checkDataIntegrity(): Promise<boolean> {
    // Validate stored game data integrity
    try {
      const gameData = await AsyncStorage.getItem('@game_data');
      if (gameData) {
        const parsed = JSON.parse(gameData);
        // Perform checksums, signature validation, etc.
        return this.validateDataSignature(parsed);
      }
    } catch (error) {
      return false;
    }
    return true;
  }
  
  private validateDataSignature(data: any): boolean {
    // Implement data signature validation
    // For now, just check for obviously tampered values
    if (data.currency && typeof data.currency === 'object') {
      for (const [currency, amount] of Object.entries(data.currency)) {
        if (typeof amount === 'number' && amount > 1000000) {
          this.reportCheatDetection(CheatType.CURRENCY_INJECTION, 'critical', 95, {
            description: `Suspicious ${currency} amount: ${amount}`,
            metrics: { suspiciousAmount: amount as number },
            timeline: [{ timestamp: Date.now(), event: 'currency_check', value: amount }],
            comparison: { expected: '<1000000', actual: amount, deviation: (amount as number) / 1000000 },
            context: { currency, data }
          });
          return false;
        }
      }
    }
    return true;
  }
  
  private async initializeBehaviorProfile(): Promise<void> {
    const userId = telemetrySystem.getPlayerProfile()?.userId || 'anonymous';
    
    if (!this.playerProfile) {
      this.playerProfile = {
        userId,
        sessions: 0,
        averageSessionLength: 0,
        skillProgression: [],
        consistencyScore: 0,
        reactionTimes: [],
        inputPatterns: new Map(),
        anomalyHistory: [],
        trustScore: 100,
        riskLevel: 'low'
      };
    }
  }
  
  private startMonitoring(): void {
    this.isMonitoring = true;
    
    // Security validation every 5 minutes
    this.validationTimer = setInterval(() => {
      this.performSecurityValidation();
    }, 5 * 60 * 1000);
    
    // Statistics analysis every 30 seconds
    this.statisticsTimer = setInterval(() => {
      this.analyzeSessionStatistics();
    }, 30 * 1000);
    
    // Behavior analysis every minute
    this.behaviorTimer = setInterval(() => {
      this.analyzeBehaviorPatterns();
    }, 60 * 1000);
  }
  
  private analyzeSessionStatistics(): void {
    if (!this.currentSession) return;
    
    // Analyze score progression
    this.analyzeScoreProgression();
    
    // Analyze input patterns
    this.analyzeInputPatterns();
    
    // Analyze performance metrics
    this.analyzePerformanceMetrics();
  }
  
  private analyzeScoreProgression(): void {
    if (!this.currentSession || this.currentSession.scoreProgression.length < 10) return;
    
    const scores = this.currentSession.scoreProgression;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Check for impossibly high scores
    const maxScore = Math.max(...scores);
    const expectedMaxScore = mean + (stdDev * 3);
    
    if (maxScore > expectedMaxScore * 2) {
      this.reportCheatDetection(CheatType.IMPOSSIBLE_SCORE, 'high', 85, {
        description: `Score ${maxScore} significantly exceeds expected maximum ${expectedMaxScore.toFixed(0)}`,
        metrics: { score: maxScore, expectedMax: expectedMaxScore, deviation: maxScore / expectedMaxScore },
        timeline: scores.map((score, i) => ({ timestamp: Date.now() - (scores.length - i) * 1000, event: 'score', value: score })),
        comparison: { expected: expectedMaxScore, actual: maxScore, deviation: maxScore / expectedMaxScore - 1 },
        context: { mean, variance, stdDev }
      });
    }
    
    // Check for unnatural score consistency
    const coefficient = stdDev / mean;
    if (coefficient < 0.05 && scores.length > 20) { // Too consistent
      this.reportCheatDetection(CheatType.PATTERN_ANOMALY, 'medium', 70, {
        description: `Score progression too consistent: coefficient ${coefficient.toFixed(3)}`,
        metrics: { coefficient, consistency: 1 - coefficient },
        timeline: scores.map((score, i) => ({ timestamp: Date.now() - (scores.length - i) * 1000, event: 'score', value: score })),
        comparison: { expected: '>0.05', actual: coefficient, deviation: 0.05 - coefficient },
        context: { mean, stdDev, scores: scores.length }
      });
    }
  }
  
  private analyzeInputPatterns(): void {
    if (!this.currentSession || this.currentSession.inputEvents.length < 50) return;
    
    const inputs = this.currentSession.inputEvents;
    const now = Date.now();
    const recentInputs = inputs.filter(input => now - input.timestamp < 30000); // Last 30 seconds
    
    // Check input frequency
    if (recentInputs.length > this.INPUT_SPEED_THRESHOLD * 30) {
      this.reportCheatDetection(CheatType.AUTO_CLICK, 'high', 90, {
        description: `Excessive input frequency: ${recentInputs.length} inputs in 30 seconds`,
        metrics: { inputsPerSecond: recentInputs.length / 30, threshold: this.INPUT_SPEED_THRESHOLD },
        timeline: recentInputs.map(input => ({ timestamp: input.timestamp, event: 'input', value: input.type })),
        comparison: { expected: `<${this.INPUT_SPEED_THRESHOLD}/s`, actual: recentInputs.length / 30, deviation: (recentInputs.length / 30) / this.INPUT_SPEED_THRESHOLD - 1 },
        context: { totalInputs: inputs.length, windowSize: 30000 }
      });
    }
    
    // Check for perfect timing patterns (macros)
    const intervals = [];
    for (let i = 1; i < recentInputs.length; i++) {
      intervals.push(recentInputs[i].timestamp - recentInputs[i - 1].timestamp);
    }
    
    if (intervals.length > 10) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intervalVariance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
      const intervalStdDev = Math.sqrt(intervalVariance);
      const intervalCoefficient = intervalStdDev / avgInterval;
      
      if (intervalCoefficient < 0.02) { // Too regular
        this.reportCheatDetection(CheatType.MACRO_USAGE, 'medium', 75, {
          description: `Input timing too regular: coefficient ${intervalCoefficient.toFixed(4)}`,
          metrics: { avgInterval, coefficient: intervalCoefficient, variance: intervalVariance },
          timeline: intervals.map((interval, i) => ({ timestamp: recentInputs[i].timestamp, event: 'interval', value: interval })),
          comparison: { expected: '>0.02', actual: intervalCoefficient, deviation: 0.02 - intervalCoefficient },
          context: { inputCount: intervals.length }
        });
      }
    }
    
    // Check for impossible reaction times
    const gameEvents = this.currentSession.gameEvents.filter(event => event.type === 'obstacle_appear');
    const reactions = [];
    
    for (const event of gameEvents) {
      const responseInput = inputs.find(input => 
        input.timestamp > event.timestamp && 
        input.timestamp < event.timestamp + 1000
      );
      
      if (responseInput) {
        const reactionTime = responseInput.timestamp - event.timestamp;
        reactions.push(reactionTime);
        
        if (reactionTime < this.REACTION_TIME_MIN) {
          this.reportCheatDetection(CheatType.IMPOSSIBLE_INPUT, 'high', 85, {
            description: `Impossible reaction time: ${reactionTime}ms`,
            metrics: { reactionTime, threshold: this.REACTION_TIME_MIN },
            timeline: [
              { timestamp: event.timestamp, event: 'obstacle_appear', value: event.data },
              { timestamp: responseInput.timestamp, event: 'input_response', value: responseInput.type }
            ],
            comparison: { expected: `>${this.REACTION_TIME_MIN}ms`, actual: reactionTime, deviation: (this.REACTION_TIME_MIN - reactionTime) / this.REACTION_TIME_MIN },
            context: { eventType: event.type, inputType: responseInput.type }
          });
        }
      }
    }
    
    // Update player profile
    if (this.playerProfile && reactions.length > 0) {
      this.playerProfile.reactionTimes.push(...reactions);
      if (this.playerProfile.reactionTimes.length > 100) {
        this.playerProfile.reactionTimes = this.playerProfile.reactionTimes.slice(-100);
      }
    }
  }
  
  private analyzePerformanceMetrics(): void {
    if (!this.currentSession) return;
    
    const perfMetrics = this.currentSession.performanceMetrics;
    
    // Check for performance anomalies that might indicate cheating
    const avgFPS = perfMetrics.fps.reduce((a, b) => a + b, 0) / perfMetrics.fps.length;
    const deviceProfile = deviceInfoManager.getDeviceProfile();
    
    // Suspiciously high FPS on low-end device
    if (avgFPS > 120 && deviceProfile.performanceTier === 'low') {
      this.reportCheatDetection(CheatType.FRAME_SKIP, 'medium', 65, {
        description: `Unusually high FPS (${avgFPS.toFixed(1)}) on low-end device`,
        metrics: { avgFPS, deviceTier: deviceProfile.performanceTier },
        timeline: perfMetrics.fps.map((fps, i) => ({ timestamp: Date.now() - (perfMetrics.fps.length - i) * 1000, event: 'fps', value: fps })),
        comparison: { expected: 60, actual: avgFPS, deviation: avgFPS / 60 - 1 },
        context: { deviceProfile }
      });
    }
  }
  
  private analyzeBehaviorPatterns(): void {
    if (!this.playerProfile) return;
    
    // Update trust score based on recent activity
    this.updateTrustScore();
    
    // Check for statistical outliers
    this.checkStatisticalOutliers();
  }
  
  private updateTrustScore(): void {
    if (!this.playerProfile) return;
    
    let score = this.playerProfile.trustScore;
    
    // Decrease score for each detection
    const recentDetections = this.detections.filter(d => 
      Date.now() - d.timestamp < 24 * 60 * 60 * 1000 && // Last 24 hours
      d.playerProfile.userId === this.playerProfile.userId
    );
    
    for (const detection of recentDetections) {
      switch (detection.severity) {
        case 'low': score -= 5; break;
        case 'medium': score -= 15; break;
        case 'high': score -= 30; break;
        case 'critical': score -= 50; break;
      }
    }
    
    // Increase score over time for good behavior
    const timeSinceLastDetection = this.playerProfile.anomalyHistory.length > 0 
      ? Date.now() - this.playerProfile.anomalyHistory[this.playerProfile.anomalyHistory.length - 1].timestamp
      : 24 * 60 * 60 * 1000;
    
    if (timeSinceLastDetection > 24 * 60 * 60 * 1000) { // 24 hours of good behavior
      score += 2;
    }
    
    this.playerProfile.trustScore = Math.max(0, Math.min(100, score));
    
    // Update risk level
    if (this.playerProfile.trustScore < 20) {
      this.playerProfile.riskLevel = 'critical';
    } else if (this.playerProfile.trustScore < 40) {
      this.playerProfile.riskLevel = 'high';
    } else if (this.playerProfile.trustScore < 70) {
      this.playerProfile.riskLevel = 'medium';
    } else {
      this.playerProfile.riskLevel = 'low';
    }
  }
  
  private checkStatisticalOutliers(): void {
    if (!this.playerProfile || !this.currentSession) return;
    
    // Compare current session performance to historical data
    const currentScore = this.currentSession.totalScore;
    const historicalScores = this.playerProfile.skillProgression;
    
    if (historicalScores.length > 10) {
      const mean = historicalScores.reduce((a, b) => a + b, 0) / historicalScores.length;
      const variance = historicalScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / historicalScores.length;
      const stdDev = Math.sqrt(variance);
      
      const zScore = Math.abs((currentScore - mean) / stdDev);
      
      if (zScore > this.SCORE_VARIANCE_THRESHOLD) {
        this.reportCheatDetection(CheatType.STATISTICAL_OUTLIER, 'medium', 60 + (zScore * 5), {
          description: `Score ${currentScore} is ${zScore.toFixed(2)} standard deviations from historical average`,
          metrics: { currentScore, historicalMean: mean, zScore, stdDev },
          timeline: historicalScores.map((score, i) => ({ timestamp: Date.now() - (historicalScores.length - i) * 24 * 60 * 60 * 1000, event: 'session_score', value: score })),
          comparison: { expected: mean, actual: currentScore, deviation: zScore },
          context: { sessionsAnalyzed: historicalScores.length }
        });
      }
    }
  }
  
  private reportCheatDetection(
    type: CheatType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    confidence: number,
    evidence: CheatEvidence
  ): void {
    const detection: CheatDetection = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      severity,
      confidence,
      evidence,
      playerProfile: {
        userId: this.playerProfile?.userId || 'unknown',
        sessionId: this.currentSession?.startTime.toString() || 'unknown',
        gameState: this.currentSession,
        deviceInfo: deviceInfoManager.getDeviceProfile()
      },
      actionTaken: this.determineAction(type, severity, confidence)
    };
    
    this.detections.push(detection);
    
    // Add to player profile
    if (this.playerProfile) {
      this.playerProfile.anomalyHistory.push(detection);
      if (this.playerProfile.anomalyHistory.length > 20) {
        this.playerProfile.anomalyHistory = this.playerProfile.anomalyHistory.slice(-20);
      }
    }
    
    // Execute action
    this.executeAction(detection);
    
    // Report to telemetry
    telemetrySystem.track(EventType.CRASH_DETECTED, {
      cheatType: type,
      severity,
      confidence,
      actionTaken: detection.actionTaken,
      evidence: evidence.description
    });
    
    // Log for debugging
    console.warn('Cheat detection:', {
      type,
      severity,
      confidence,
      action: detection.actionTaken,
      evidence: evidence.description
    });
    
    this.saveData();
  }
  
  private determineAction(type: CheatType, severity: 'low' | 'medium' | 'high' | 'critical', confidence: number): CheatAction {
    // Critical cheats with high confidence
    if (severity === 'critical' && confidence > 90) {
      return CheatAction.PERMANENT_BAN;
    }
    
    // High severity cheats
    if (severity === 'high' && confidence > 80) {
      return CheatAction.TEMPORARY_BAN;
    }
    
    // Medium severity or repeated offenses
    if (severity === 'medium' && confidence > 70) {
      const recentDetections = this.detections.filter(d => 
        Date.now() - d.timestamp < 60 * 60 * 1000 // Last hour
      ).length;
      
      if (recentDetections > 3) {
        return CheatAction.RATE_LIMIT;
      }
      return CheatAction.WARNING;
    }
    
    // Low confidence or severity
    if (confidence > 60) {
      return CheatAction.CAPTCHA_CHALLENGE;
    }
    
    return CheatAction.LOG_ONLY;
  }
  
  private executeAction(detection: CheatDetection): void {
    switch (detection.actionTaken) {
      case CheatAction.WARNING:
        this.showWarning(detection);
        break;
      case CheatAction.SCORE_RESET:
        this.resetScore();
        break;
      case CheatAction.TEMPORARY_BAN:
        this.applyTemporaryBan(24 * 60 * 60 * 1000); // 24 hours
        break;
      case CheatAction.PERMANENT_BAN:
        this.applyPermanentBan();
        break;
      case CheatAction.RATE_LIMIT:
        this.applyRateLimit();
        break;
      case CheatAction.CAPTCHA_CHALLENGE:
        this.showCaptchaChallenge();
        break;
      case CheatAction.HUMAN_VERIFICATION:
        this.requestHumanVerification();
        break;
      case CheatAction.LOG_ONLY:
      default:
        // Just log, no user-facing action
        break;
    }
  }
  
  private showWarning(detection: CheatDetection): void {
    // Show user a warning about suspicious activity
    console.warn('Anti-cheat warning shown to user');
  }
  
  private resetScore(): void {
    // Reset current session score
    if (this.currentSession) {
      this.currentSession.totalScore = 0;
      this.currentSession.scoreProgression = [];
    }
  }
  
  private applyTemporaryBan(duration: number): void {
    // Apply temporary ban
    const banUntil = Date.now() + duration;
    AsyncStorage.setItem('@ban_until', banUntil.toString());
    console.warn('Temporary ban applied until:', new Date(banUntil));
  }
  
  private applyPermanentBan(): void {
    // Apply permanent ban
    AsyncStorage.setItem('@permanent_ban', 'true');
    console.warn('Permanent ban applied');
  }
  
  private applyRateLimit(): void {
    // Apply rate limiting
    console.warn('Rate limiting applied');
  }
  
  private showCaptchaChallenge(): void {
    // Show CAPTCHA challenge
    console.warn('CAPTCHA challenge triggered');
  }
  
  private requestHumanVerification(): void {
    // Request human verification
    console.warn('Human verification requested');
  }
  
  // Public API
  
  startGameSession(): void {
    this.currentSession = {
      startTime: Date.now(),
      totalScore: 0,
      highestScore: 0,
      averageScore: 0,
      scoreProgression: [],
      inputEvents: [],
      performanceMetrics: {
        fps: [],
        memoryUsage: [],
        cpuUsage: []
      },
      gameEvents: []
    };
    
    if (this.playerProfile) {
      this.playerProfile.sessions++;
    }
  }
  
  endGameSession(): void {
    if (!this.currentSession) return;
    
    this.currentSession.endTime = Date.now();
    
    // Update player profile
    if (this.playerProfile) {
      const sessionLength = this.currentSession.endTime - this.currentSession.startTime;
      this.playerProfile.averageSessionLength = 
        (this.playerProfile.averageSessionLength * (this.playerProfile.sessions - 1) + sessionLength) / 
        this.playerProfile.sessions;
      
      this.playerProfile.skillProgression.push(this.currentSession.totalScore);
      if (this.playerProfile.skillProgression.length > 50) {
        this.playerProfile.skillProgression = this.playerProfile.skillProgression.slice(-50);
      }
    }
    
    // Final analysis
    this.analyzeSessionStatistics();
    
    this.saveData();
    this.currentSession = null;
  }
  
  recordScore(score: number): void {
    if (!this.currentSession) return;
    
    this.currentSession.totalScore = score;
    this.currentSession.scoreProgression.push(score);
    this.currentSession.highestScore = Math.max(this.currentSession.highestScore, score);
    this.currentSession.averageScore = 
      this.currentSession.scoreProgression.reduce((a, b) => a + b, 0) / 
      this.currentSession.scoreProgression.length;
  }
  
  recordInput(type: 'tap' | 'swipe' | 'hold' | 'release', x: number, y: number, duration?: number): void {
    if (!this.currentSession) return;
    
    const inputEvent: InputEvent = {
      timestamp: Date.now(),
      type,
      coordinates: { x, y },
      duration
    };
    
    this.currentSession.inputEvents.push(inputEvent);
    
    // Keep only recent inputs to prevent memory issues
    if (this.currentSession.inputEvents.length > 1000) {
      this.currentSession.inputEvents = this.currentSession.inputEvents.slice(-500);
    }
  }
  
  recordGameEvent(type: string, data: any): void {
    if (!this.currentSession) return;
    
    this.currentSession.gameEvents.push({
      timestamp: Date.now(),
      type,
      data
    });
    
    // Keep only recent events
    if (this.currentSession.gameEvents.length > 500) {
      this.currentSession.gameEvents = this.currentSession.gameEvents.slice(-250);
    }
  }
  
  recordPerformanceMetrics(): void {
    if (!this.currentSession) return;
    
    const metrics = performanceMonitor.getPerformanceData();
    this.currentSession.performanceMetrics.fps.push(metrics.fps);
    this.currentSession.performanceMetrics.memoryUsage.push(metrics.memoryUsage);
    this.currentSession.performanceMetrics.cpuUsage.push(0); // Would need native module for CPU
    
    // Keep only recent metrics
    const maxMetrics = 300; // 5 minutes at 1 sample per second
    if (this.currentSession.performanceMetrics.fps.length > maxMetrics) {
      this.currentSession.performanceMetrics.fps = this.currentSession.performanceMetrics.fps.slice(-maxMetrics);
      this.currentSession.performanceMetrics.memoryUsage = this.currentSession.performanceMetrics.memoryUsage.slice(-maxMetrics);
      this.currentSession.performanceMetrics.cpuUsage = this.currentSession.performanceMetrics.cpuUsage.slice(-maxMetrics);
    }
  }
  
  // Getters
  getSecurityValidation(): SecurityValidation {
    return { ...this.securityValidation };
  }
  
  getPlayerProfile(): PlayerBehaviorProfile | null {
    return this.playerProfile ? { ...this.playerProfile } : null;
  }
  
  getDetections(): CheatDetection[] {
    return [...this.detections];
  }
  
  getTrustScore(): number {
    return this.playerProfile?.trustScore || 100;
  }
  
  getRiskLevel(): 'low' | 'medium' | 'high' | 'critical' {
    return this.playerProfile?.riskLevel || 'low';
  }
  
  async isBanned(): Promise<boolean> {
    const [tempBan, permBan] = await Promise.all([
      AsyncStorage.getItem('@ban_until'),
      AsyncStorage.getItem('@permanent_ban')
    ]);
    
    if (permBan === 'true') return true;
    if (tempBan && parseInt(tempBan, 10) > Date.now()) return true;
    
    return false;
  }
  
  // Cleanup
  destroy(): void {
    this.isMonitoring = false;
    
    if (this.validationTimer) clearInterval(this.validationTimer);
    if (this.statisticsTimer) clearInterval(this.statisticsTimer);
    if (this.behaviorTimer) clearInterval(this.behaviorTimer);
    
    this.saveData();
  }
}

// Export singleton instance
export const antiCheatSystem = AntiCheatSystem.getInstance();

// Convenience functions
export function startGameSession(): void {
  antiCheatSystem.startGameSession();
}

export function endGameSession(): void {
  antiCheatSystem.endGameSession();
}

export function recordScore(score: number): void {
  antiCheatSystem.recordScore(score);
}

export function recordInput(type: 'tap' | 'swipe' | 'hold' | 'release', x: number, y: number, duration?: number): void {
  antiCheatSystem.recordInput(type, x, y, duration);
}

export function getTrustScore(): number {
  return antiCheatSystem.getTrustScore();
}