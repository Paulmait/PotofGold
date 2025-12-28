import * as Haptics from 'expo-haptics';

export class HapticFeedback {
  /**
   * Light impact for general interactions
   */
  static light(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * Medium impact for item collection
   */
  static medium(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  /**
   * Heavy impact for important events
   */
  static heavy(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  /**
   * Success notification for achievements
   */
  static success(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  /**
   * Warning notification for low lives
   */
  static warning(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  /**
   * Error notification for game over
   */
  static error(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  /**
   * Selection feedback for UI interactions
   */
  static selection(): void {
    Haptics.selectionAsync();
  }

  /**
   * Custom haptic pattern for special events
   */
  static specialEvent(): void {
    // Custom pattern: light -> medium -> heavy
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 0);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
  }

  /**
   * Combo haptic feedback
   */
  static combo(comboCount: number): void {
    if (comboCount >= 10) {
      this.heavy();
    } else if (comboCount >= 5) {
      this.medium();
    } else {
      this.light();
    }
  }

  /**
   * State unlock haptic feedback
   */
  static stateUnlock(): void {
    this.success();
    setTimeout(() => this.medium(), 150);
  }

  /**
   * Achievement unlock haptic feedback
   */
  static achievementUnlock(): void {
    this.specialEvent();
  }

  /**
   * Power-up activation haptic feedback
   */
  static powerUpActivation(): void {
    this.medium();
    setTimeout(() => this.light(), 100);
  }

  /**
   * Game over haptic feedback
   */
  static gameOver(): void {
    this.error();
    setTimeout(() => this.heavy(), 200);
  }
}
