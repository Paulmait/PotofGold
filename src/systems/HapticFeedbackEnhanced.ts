/**
 * Enhanced Haptic Feedback System
 * Creates satisfying tactile responses that trigger dopamine release
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticPattern = {
  type: 'success' | 'reward' | 'achievement' | 'combo' | 'nearMiss' | 'special';
  intensity: number;
  duration: number;
  pattern?: number[];
};

class HapticFeedbackEnhanced {
  private isEnabled: boolean = true;
  private comboCount: number = 0;

  // Satisfying collection feedback - gets stronger with combos
  async coinCollected(value: number, combo: number = 1) {
    if (!this.isEnabled || Platform.OS === 'web') return;

    if (combo > 10) {
      // Epic combo - strong pattern
      await this.playPattern([50, 30, 50, 30, 100]);
    } else if (combo > 5) {
      // Good combo - medium pattern
      await this.playPattern([30, 20, 50]);
    } else if (value >= 100) {
      // High value coin
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      // Normal coin
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  // Near miss - creates tension
  async nearMiss(intensity: number = 0.5) {
    if (!this.isEnabled || Platform.OS === 'web') return;

    // Quick sharp taps that feel like "almost got it"
    await this.playPattern([20, 10, 20, 10, 20]);
  }

  // Big win celebration
  async bigWin() {
    if (!this.isEnabled || Platform.OS === 'web') return;

    // Escalating celebration pattern
    await this.playPattern([30, 50, 40, 60, 50, 80, 100, 150]);
  }

  // Level up / Achievement
  async achievement() {
    if (!this.isEnabled || Platform.OS === 'web') return;

    // Triumphant pattern
    await this.playPattern([100, 100, 100, 200]);
  }

  // Power-up activation
  async powerUpActivated(type: string) {
    if (!this.isEnabled || Platform.OS === 'web') return;

    const patterns: Record<string, number[]> = {
      magnet: [50, 30, 50, 30, 100], // Magnetic pull feeling
      multiplier: [30, 30, 60, 60, 120], // Building intensity
      shield: [100, 50, 100], // Strong protective feeling
      slowmo: [150, 300], // Long slow pulse
      goldrush: [20, 20, 20, 20, 50, 50, 100, 200], // Excitement building
    };

    await this.playPattern(patterns[type] || [50, 100]);
  }

  // Countdown timer haptics
  async countdown(secondsLeft: number) {
    if (!this.isEnabled || Platform.OS === 'web') return;

    if (secondsLeft <= 3 && secondsLeft > 0) {
      // Final countdown - increasing intensity
      const intensity =
        secondsLeft === 1
          ? Haptics.ImpactFeedbackStyle.Heavy
          : secondsLeft === 2
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light;

      await Haptics.impactAsync(intensity);
    }
  }

  // Mystery box opening
  async mysteryReveal(rarity: 'common' | 'rare' | 'epic' | 'legendary') {
    if (!this.isEnabled || Platform.OS === 'web') return;

    const patterns = {
      common: [30, 50],
      rare: [30, 30, 60, 80],
      epic: [20, 20, 30, 30, 50, 50, 100],
      legendary: [10, 10, 20, 20, 30, 30, 50, 50, 80, 80, 120, 150, 200],
    };

    await this.playPattern(patterns[rarity]);
  }

  // Daily reward claim
  async dailyReward(streakDays: number) {
    if (!this.isEnabled || Platform.OS === 'web') return;

    // More taps for longer streaks
    const taps = Math.min(streakDays, 7);
    const pattern = Array(taps)
      .fill(50)
      .map((v, i) => v + i * 10);
    await this.playPattern(pattern);
  }

  // Button press feedback
  async buttonPress(importance: 'low' | 'medium' | 'high' = 'medium') {
    if (!this.isEnabled || Platform.OS === 'web') return;

    const styles = {
      low: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      high: Haptics.ImpactFeedbackStyle.Heavy,
    };

    await Haptics.impactAsync(styles[importance]);
  }

  // Scroll feedback for menus
  async scrollTick() {
    if (!this.isEnabled || Platform.OS === 'web') return;

    await Haptics.selectionAsync();
  }

  // Error / Invalid action
  async error() {
    if (!this.isEnabled || Platform.OS === 'web') return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  // Warning feedback
  async warning() {
    if (!this.isEnabled || Platform.OS === 'web') return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  // Success feedback
  async success() {
    if (!this.isEnabled || Platform.OS === 'web') return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // Custom pattern player
  private async playPattern(pattern: number[]) {
    for (let i = 0; i < pattern.length; i++) {
      if (i % 2 === 0) {
        await Haptics.impactAsync(
          pattern[i] > 100
            ? Haptics.ImpactFeedbackStyle.Heavy
            : pattern[i] > 50
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Light
        );
      }

      if (i < pattern.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, pattern[i]));
      }
    }
  }

  // Settings
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  isHapticEnabled(): boolean {
    return this.isEnabled && Platform.OS !== 'web';
  }
}

export default new HapticFeedbackEnhanced();
