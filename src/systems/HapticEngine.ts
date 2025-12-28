import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { deviceInfoManager } from '../utils/deviceInfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Advanced Haptic Feedback Engine
 * Provides nuanced, context-aware haptic feedback for enhanced game feel
 */

export enum HapticPattern {
  // Coin Collection
  COIN_COLLECT_SMALL = 'coin_collect_small',
  COIN_COLLECT_MEDIUM = 'coin_collect_medium',
  COIN_COLLECT_LARGE = 'coin_collect_large',
  COIN_COLLECT_MEGA = 'coin_collect_mega',

  // Power-ups
  POWERUP_ACTIVATE = 'powerup_activate',
  POWERUP_EXPIRE = 'powerup_expire',
  MAGNET_PULL = 'magnet_pull',
  SHIELD_HIT = 'shield_hit',
  SPEED_BOOST = 'speed_boost',

  // Game Events
  LEVEL_UP = 'level_up',
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  NEW_HIGH_SCORE = 'new_high_score',
  COMBO_BUILD = 'combo_build',
  COMBO_BREAK = 'combo_break',

  // UI Interactions
  BUTTON_TAP = 'button_tap',
  BUTTON_HOLD = 'button_hold',
  SWIPE_ACTION = 'swipe_action',
  TOGGLE_SWITCH = 'toggle_switch',
  SLIDER_CHANGE = 'slider_change',

  // Purchase/Rewards
  PURCHASE_SUCCESS = 'purchase_success',
  PURCHASE_FAIL = 'purchase_fail',
  REWARD_CLAIM = 'reward_claim',
  CHEST_OPEN = 'chest_open',
  ITEM_UNLOCK = 'item_unlock',

  // Game State
  GAME_START = 'game_start',
  GAME_OVER = 'game_over',
  DANGER_WARNING = 'danger_warning',
  COLLISION = 'collision',
  NEAR_MISS = 'near_miss',

  // Special Effects
  RAINBOW_TRAIL = 'rainbow_trail',
  GOLDEN_POT = 'golden_pot',
  MYSTERY_BOX = 'mystery_box',
  JACKPOT = 'jackpot',
  EPIC_WIN = 'epic_win',
}

interface HapticSequence {
  pattern: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType;
  delay: number;
  duration?: number;
}

interface HapticDefinition {
  ios: HapticSequence[];
  android: HapticSequence[];
  intensity: 'light' | 'medium' | 'heavy';
  priority: 'low' | 'normal' | 'high';
  interruptible: boolean;
}

class HapticEngine {
  private static instance: HapticEngine;
  private enabled: boolean = true;
  private intensity: number = 1.0; // 0.0 to 1.0
  private patterns: Map<HapticPattern, HapticDefinition>;
  private isPlaying: boolean = false;
  private currentPattern: HapticPattern | null = null;
  private hapticQueue: Array<{ pattern: HapticPattern; timestamp: number }> = [];
  private lastHapticTime: number = 0;
  private minInterval: number = 50; // Minimum ms between haptics
  private deviceSupportsHaptics: boolean = false;

  private constructor() {
    this.patterns = this.initializePatterns();
    this.checkHapticSupport();
    this.loadSettings();
  }

  static getInstance(): HapticEngine {
    if (!HapticEngine.instance) {
      HapticEngine.instance = new HapticEngine();
    }
    return HapticEngine.instance;
  }

  private initializePatterns(): Map<HapticPattern, HapticDefinition> {
    const patterns = new Map<HapticPattern, HapticDefinition>();

    // Coin Collection Patterns
    patterns.set(HapticPattern.COIN_COLLECT_SMALL, {
      ios: [{ pattern: Haptics.ImpactFeedbackStyle.Light, delay: 0 }],
      android: [{ pattern: Haptics.ImpactFeedbackStyle.Light, delay: 0 }],
      intensity: 'light',
      priority: 'normal',
      interruptible: true,
    });

    patterns.set(HapticPattern.COIN_COLLECT_MEGA, {
      ios: [
        { pattern: Haptics.ImpactFeedbackStyle.Heavy, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Medium, delay: 100 },
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 200 },
      ],
      android: [
        { pattern: Haptics.ImpactFeedbackStyle.Heavy, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Medium, delay: 150 },
      ],
      intensity: 'heavy',
      priority: 'high',
      interruptible: false,
    });

    // Power-up Patterns
    patterns.set(HapticPattern.POWERUP_ACTIVATE, {
      ios: [
        { pattern: Haptics.NotificationFeedbackType.Success, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Medium, delay: 150 },
      ],
      android: [{ pattern: Haptics.NotificationFeedbackType.Success, delay: 0 }],
      intensity: 'medium',
      priority: 'high',
      interruptible: false,
    });

    patterns.set(HapticPattern.MAGNET_PULL, {
      ios: [
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 50 },
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 100 },
      ],
      android: [
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 100 },
      ],
      intensity: 'light',
      priority: 'low',
      interruptible: true,
    });

    // Achievement Patterns
    patterns.set(HapticPattern.ACHIEVEMENT_UNLOCK, {
      ios: [
        { pattern: Haptics.NotificationFeedbackType.Success, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Heavy, delay: 200 },
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 400 },
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 500 },
      ],
      android: [
        { pattern: Haptics.NotificationFeedbackType.Success, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Heavy, delay: 300 },
      ],
      intensity: 'heavy',
      priority: 'high',
      interruptible: false,
    });

    patterns.set(HapticPattern.LEVEL_UP, {
      ios: [
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Medium, delay: 100 },
        { pattern: Haptics.ImpactFeedbackStyle.Heavy, delay: 200 },
        { pattern: Haptics.NotificationFeedbackType.Success, delay: 400 },
      ],
      android: [
        { pattern: Haptics.ImpactFeedbackStyle.Medium, delay: 0 },
        { pattern: Haptics.NotificationFeedbackType.Success, delay: 200 },
      ],
      intensity: 'heavy',
      priority: 'high',
      interruptible: false,
    });

    // UI Interaction Patterns
    patterns.set(HapticPattern.BUTTON_TAP, {
      ios: [{ pattern: Haptics.ImpactFeedbackStyle.Light, delay: 0 }],
      android: [{ pattern: Haptics.ImpactFeedbackStyle.Light, delay: 0 }],
      intensity: 'light',
      priority: 'normal',
      interruptible: true,
    });

    patterns.set(HapticPattern.TOGGLE_SWITCH, {
      ios: [{ pattern: Haptics.ImpactFeedbackStyle.Medium, delay: 0 }],
      android: [{ pattern: Haptics.ImpactFeedbackStyle.Medium, delay: 0 }],
      intensity: 'medium',
      priority: 'normal',
      interruptible: true,
    });

    // Purchase/Reward Patterns
    patterns.set(HapticPattern.PURCHASE_SUCCESS, {
      ios: [
        { pattern: Haptics.NotificationFeedbackType.Success, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 300 },
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 400 },
      ],
      android: [{ pattern: Haptics.NotificationFeedbackType.Success, delay: 0 }],
      intensity: 'medium',
      priority: 'high',
      interruptible: false,
    });

    patterns.set(HapticPattern.CHEST_OPEN, {
      ios: [
        { pattern: Haptics.ImpactFeedbackStyle.Heavy, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 200 },
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 300 },
        { pattern: Haptics.ImpactFeedbackStyle.Medium, delay: 400 },
        { pattern: Haptics.NotificationFeedbackType.Success, delay: 600 },
      ],
      android: [
        { pattern: Haptics.ImpactFeedbackStyle.Heavy, delay: 0 },
        { pattern: Haptics.NotificationFeedbackType.Success, delay: 400 },
      ],
      intensity: 'heavy',
      priority: 'high',
      interruptible: false,
    });

    // Game State Patterns
    patterns.set(HapticPattern.GAME_OVER, {
      ios: [
        { pattern: Haptics.NotificationFeedbackType.Error, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Heavy, delay: 200 },
        { pattern: Haptics.ImpactFeedbackStyle.Medium, delay: 400 },
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 600 },
      ],
      android: [
        { pattern: Haptics.NotificationFeedbackType.Error, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Heavy, delay: 300 },
      ],
      intensity: 'heavy',
      priority: 'high',
      interruptible: false,
    });

    patterns.set(HapticPattern.DANGER_WARNING, {
      ios: [
        { pattern: Haptics.NotificationFeedbackType.Warning, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Medium, delay: 200 },
        { pattern: Haptics.NotificationFeedbackType.Warning, delay: 400 },
      ],
      android: [
        { pattern: Haptics.NotificationFeedbackType.Warning, delay: 0 },
        { pattern: Haptics.NotificationFeedbackType.Warning, delay: 400 },
      ],
      intensity: 'medium',
      priority: 'high',
      interruptible: true,
    });

    // Special Effects
    patterns.set(HapticPattern.JACKPOT, {
      ios: [
        { pattern: Haptics.ImpactFeedbackStyle.Heavy, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Heavy, delay: 100 },
        { pattern: Haptics.ImpactFeedbackStyle.Heavy, delay: 200 },
        { pattern: Haptics.NotificationFeedbackType.Success, delay: 400 },
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 600 },
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 700 },
        { pattern: Haptics.ImpactFeedbackStyle.Light, delay: 800 },
      ],
      android: [
        { pattern: Haptics.ImpactFeedbackStyle.Heavy, delay: 0 },
        { pattern: Haptics.ImpactFeedbackStyle.Heavy, delay: 200 },
        { pattern: Haptics.NotificationFeedbackType.Success, delay: 400 },
      ],
      intensity: 'heavy',
      priority: 'high',
      interruptible: false,
    });

    return patterns;
  }

  private async checkHapticSupport(): Promise<void> {
    const deviceProfile = deviceInfoManager.getDeviceProfile();
    this.deviceSupportsHaptics = deviceProfile.hasHaptics;

    // Additional platform-specific checks
    if (Platform.OS === 'ios') {
      // iOS 10+ supports haptics
      const version = parseInt(deviceProfile.osVersion?.split('.')[0] || '0', 10);
      this.deviceSupportsHaptics = version >= 10;
    } else if (Platform.OS === 'android') {
      // Android API 26+ has better haptic support
      this.deviceSupportsHaptics = (deviceProfile.apiLevel || 0) >= 26;
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const settings = await AsyncStorage.getItem('@haptic_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.enabled = parsed.enabled ?? true;
        this.intensity = parsed.intensity ?? 1.0;
      }
    } catch (error) {
      console.error('Failed to load haptic settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        '@haptic_settings',
        JSON.stringify({
          enabled: this.enabled,
          intensity: this.intensity,
        })
      );
    } catch (error) {
      console.error('Failed to save haptic settings:', error);
    }
  }

  // Public API

  async play(
    pattern: HapticPattern,
    options?: { delay?: number; override?: boolean }
  ): Promise<void> {
    if (!this.enabled || !this.deviceSupportsHaptics) return;

    const now = Date.now();

    // Throttle haptics to prevent overwhelming the device
    if (now - this.lastHapticTime < this.minInterval && !options?.override) {
      // Queue the haptic for later
      this.hapticQueue.push({ pattern, timestamp: now });
      this.processQueue();
      return;
    }

    const definition = this.patterns.get(pattern);
    if (!definition) {
      console.warn(`Unknown haptic pattern: ${pattern}`);
      return;
    }

    // Check if current pattern can be interrupted
    if (this.isPlaying && this.currentPattern) {
      const currentDef = this.patterns.get(this.currentPattern);
      if (currentDef && !currentDef.interruptible && definition.priority !== 'high') {
        return;
      }
    }

    this.isPlaying = true;
    this.currentPattern = pattern;
    this.lastHapticTime = now;

    const sequences = Platform.OS === 'ios' ? definition.ios : definition.android;

    // Apply intensity scaling
    const scaledSequences = this.applyIntensityScaling(sequences, definition.intensity);

    // Execute haptic sequence
    if (options?.delay) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }

    for (const sequence of scaledSequences) {
      if (sequence.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, sequence.delay));
      }

      try {
        if (this.isNotificationFeedback(sequence.pattern)) {
          await Haptics.notificationAsync(sequence.pattern as Haptics.NotificationFeedbackType);
        } else {
          await Haptics.impactAsync(sequence.pattern as Haptics.ImpactFeedbackStyle);
        }
      } catch (error) {
        console.error('Haptic playback error:', error);
      }
    }

    this.isPlaying = false;
    this.currentPattern = null;
  }

  private applyIntensityScaling(
    sequences: HapticSequence[],
    baseIntensity: 'light' | 'medium' | 'heavy'
  ): HapticSequence[] {
    if (this.intensity === 1.0) return sequences;

    // Scale down intensity based on user preference
    return sequences.map((seq) => {
      if (this.intensity < 0.5) {
        // Convert all to light
        if (seq.pattern === Haptics.ImpactFeedbackStyle.Heavy) {
          return { ...seq, pattern: Haptics.ImpactFeedbackStyle.Light };
        }
        if (seq.pattern === Haptics.ImpactFeedbackStyle.Medium) {
          return { ...seq, pattern: Haptics.ImpactFeedbackStyle.Light };
        }
      } else if (this.intensity < 0.8) {
        // Convert heavy to medium
        if (seq.pattern === Haptics.ImpactFeedbackStyle.Heavy) {
          return { ...seq, pattern: Haptics.ImpactFeedbackStyle.Medium };
        }
      }
      return seq;
    });
  }

  private isNotificationFeedback(pattern: any): boolean {
    return (
      pattern === Haptics.NotificationFeedbackType.Success ||
      pattern === Haptics.NotificationFeedbackType.Warning ||
      pattern === Haptics.NotificationFeedbackType.Error
    );
  }

  private async processQueue(): Promise<void> {
    if (this.hapticQueue.length === 0) return;

    const now = Date.now();
    const next = this.hapticQueue[0];

    if (now - this.lastHapticTime >= this.minInterval) {
      this.hapticQueue.shift();
      await this.play(next.pattern);
    } else {
      // Schedule next attempt
      setTimeout(() => this.processQueue(), this.minInterval);
    }
  }

  // Combo system for dynamic haptics
  async playCombo(count: number): Promise<void> {
    if (count <= 5) {
      await this.play(HapticPattern.COIN_COLLECT_SMALL);
    } else if (count <= 10) {
      await this.play(HapticPattern.COIN_COLLECT_MEDIUM);
    } else if (count <= 20) {
      await this.play(HapticPattern.COIN_COLLECT_LARGE);
    } else {
      await this.play(HapticPattern.COIN_COLLECT_MEGA);
    }
  }

  // Adaptive haptics based on game context
  async playAdaptive(eventType: string, context: any): Promise<void> {
    // Analyze context and choose appropriate pattern
    if (eventType === 'coin_collect') {
      const value = context.value || 1;
      if (value >= 100) {
        await this.play(HapticPattern.COIN_COLLECT_MEGA);
      } else if (value >= 50) {
        await this.play(HapticPattern.COIN_COLLECT_LARGE);
      } else if (value >= 10) {
        await this.play(HapticPattern.COIN_COLLECT_MEDIUM);
      } else {
        await this.play(HapticPattern.COIN_COLLECT_SMALL);
      }
    }
  }

  // Settings management
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.saveSettings();
  }

  setIntensity(intensity: number): void {
    this.intensity = Math.max(0, Math.min(1, intensity));
    this.saveSettings();
  }

  isEnabled(): boolean {
    return this.enabled && this.deviceSupportsHaptics;
  }

  getIntensity(): number {
    return this.intensity;
  }

  // Preset configurations
  applyPreset(preset: 'subtle' | 'normal' | 'intense'): void {
    switch (preset) {
      case 'subtle':
        this.intensity = 0.3;
        break;
      case 'normal':
        this.intensity = 0.7;
        break;
      case 'intense':
        this.intensity = 1.0;
        break;
    }
    this.saveSettings();
  }
}

// Export singleton instance
export const hapticEngine = HapticEngine.getInstance();

// Convenience functions
export function playHaptic(pattern: HapticPattern): Promise<void> {
  return hapticEngine.play(pattern);
}

export function playButtonTap(): Promise<void> {
  return hapticEngine.play(HapticPattern.BUTTON_TAP);
}

export function playSuccess(): Promise<void> {
  return hapticEngine.play(HapticPattern.PURCHASE_SUCCESS);
}

export function playError(): Promise<void> {
  return hapticEngine.play(HapticPattern.PURCHASE_FAIL);
}

export function playGameOver(): Promise<void> {
  return hapticEngine.play(HapticPattern.GAME_OVER);
}
