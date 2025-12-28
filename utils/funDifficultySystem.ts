import AsyncStorage from '@react-native-async-storage/async-storage';
import audioManager from './audioManager';
import particleSystem, { ParticleType } from './particleSystem';

export interface DifficultySettings {
  mode: 'zen' | 'casual' | 'adventure' | 'party';
  fallSpeed: number;
  spawnRate: number;
  coinValue: number;
  powerUpChance: number;
  encouragementLevel: number;
  mistakeTolerance: number;
  autoHelp: boolean;
}

export interface EncouragementMessage {
  text: string;
  emoji: string;
  color: string;
  soundEffect?: string;
}

class FunDifficultySystem {
  private static instance: FunDifficultySystem;
  private currentMode: string = 'casual';
  private streakCounter: number = 0;
  private encouragementTimer: NodeJS.Timeout | null = null;
  private helpfulHintsEnabled: boolean = true;
  private lastEncouragement: number = 0;

  static getInstance(): FunDifficultySystem {
    if (!FunDifficultySystem.instance) {
      FunDifficultySystem.instance = new FunDifficultySystem();
    }
    return FunDifficultySystem.instance;
  }

  private constructor() {
    this.loadSettings();
  }

  private async loadSettings() {
    try {
      const mode = await AsyncStorage.getItem('difficultyMode');
      if (mode) {
        this.currentMode = mode;
      }
    } catch (error) {
      console.error('Failed to load difficulty settings:', error);
    }
  }

  getDifficultySettings(mode?: string): DifficultySettings {
    const selectedMode = mode || this.currentMode;

    const modes: { [key: string]: DifficultySettings } = {
      zen: {
        mode: 'zen',
        fallSpeed: 1.5, // Very slow and relaxing
        spawnRate: 3000, // Items spawn slowly
        coinValue: 20, // High value per coin
        powerUpChance: 0.25, // Lots of power-ups!
        encouragementLevel: 10, // Maximum encouragement
        mistakeTolerance: 100, // No pressure at all
        autoHelp: true, // Game helps you catch items
      },
      casual: {
        mode: 'casual',
        fallSpeed: 2.5, // Comfortable speed
        spawnRate: 2000, // Regular spawning
        coinValue: 10, // Standard value
        powerUpChance: 0.15, // Good amount of power-ups
        encouragementLevel: 7, // Regular encouragement
        mistakeTolerance: 50, // Very forgiving
        autoHelp: false,
      },
      adventure: {
        mode: 'adventure',
        fallSpeed: 3.5, // A bit more exciting
        spawnRate: 1500, // More items to catch
        coinValue: 15, // Bonus for adventure mode
        powerUpChance: 0.2, // More power-ups for fun
        encouragementLevel: 8, // Lots of cheering
        mistakeTolerance: 40, // Still very forgiving
        autoHelp: false,
      },
      party: {
        mode: 'party',
        fallSpeed: 2.0, // Variable speeds for fun
        spawnRate: 1000, // Lots of items!
        coinValue: 25, // Party bonus!
        powerUpChance: 0.35, // Power-ups everywhere!
        encouragementLevel: 10, // Maximum celebration
        mistakeTolerance: 75, // Just have fun!
        autoHelp: true, // Party assists!
      },
    };

    return modes[selectedMode] || modes.casual;
  }

  async setMode(mode: string) {
    this.currentMode = mode;
    await AsyncStorage.setItem('difficultyMode', mode);

    // Play celebration sound
    audioManager.playSound('levelUp');

    // Show mode change particles
    particleSystem.createParticles(ParticleType.LEVEL_UP_CONFETTI, { x: 200, y: 100 });

    return this.getModeAnnouncement(mode);
  }

  private getModeAnnouncement(mode: string): EncouragementMessage {
    const announcements: { [key: string]: EncouragementMessage } = {
      zen: {
        text: 'Zen Mode - Relax and Enjoy!',
        emoji: '🧘‍♀️',
        color: '#87CEEB',
        soundEffect: 'peaceful',
      },
      casual: {
        text: 'Casual Fun - Perfect Balance!',
        emoji: '😊',
        color: '#90EE90',
        soundEffect: 'happy',
      },
      adventure: {
        text: 'Adventure Time - Exciting!',
        emoji: '🚀',
        color: '#FFD700',
        soundEffect: 'adventure',
      },
      party: {
        text: "Party Mode - Let's Celebrate!",
        emoji: '🎉',
        color: '#FF69B4',
        soundEffect: 'party',
      },
    };

    return announcements[mode] || announcements.casual;
  }

  getEncouragement(score: number, combo: number, missed: number): EncouragementMessage | null {
    const now = Date.now();

    // Don't spam encouragement
    if (now - this.lastEncouragement < 3000) {
      return null;
    }

    const settings = this.getDifficultySettings();
    if (Math.random() * 10 > settings.encouragementLevel) {
      return null;
    }

    this.lastEncouragement = now;

    // Different types of encouragement
    const encouragements: EncouragementMessage[] = [];

    // Score-based encouragement
    if (score > 0 && score % 100 === 0) {
      encouragements.push({
        text: `Amazing! ${score} points!`,
        emoji: '🌟',
        color: '#FFD700',
      });
    }

    // Combo encouragement
    if (combo > 5) {
      encouragements.push({
        text: `Combo Master!`,
        emoji: '🔥',
        color: '#FF4500',
      });
    } else if (combo === 3) {
      encouragements.push({
        text: 'Nice combo!',
        emoji: '✨',
        color: '#FFA500',
      });
    }

    // Friendly encouragement for misses
    if (missed > 0 && missed % 5 === 0) {
      encouragements.push({
        text: 'No worries, keep going!',
        emoji: '💪',
        color: '#87CEEB',
      });
    }

    // Random positive messages
    const randomMessages: EncouragementMessage[] = [
      { text: "You're doing great!", emoji: '😄', color: '#90EE90' },
      { text: 'Awesome job!', emoji: '👏', color: '#FFD700' },
      { text: 'Keep it up!', emoji: '🎯', color: '#00CED1' },
      { text: 'Fantastic!', emoji: '⭐', color: '#FF69B4' },
      { text: "You're a star!", emoji: '🌟', color: '#FFD700' },
      { text: 'So much fun!', emoji: '🎮', color: '#9370DB' },
      { text: 'Wonderful!', emoji: '🌈', color: '#FF1493' },
      { text: 'You got this!', emoji: '💖', color: '#FF69B4' },
      { text: 'Super player!', emoji: '🦸', color: '#4169E1' },
      { text: 'Brilliant!', emoji: '💎', color: '#00FFFF' },
    ];

    // Add random encouragement
    if (Math.random() < 0.3) {
      encouragements.push(randomMessages[Math.floor(Math.random() * randomMessages.length)]);
    }

    return encouragements.length > 0
      ? encouragements[Math.floor(Math.random() * encouragements.length)]
      : null;
  }

  getHelpfulHint(gameState: any): string | null {
    if (!this.helpfulHintsEnabled) return null;

    const hints: string[] = [];

    // Context-based hints
    if (gameState.missedItems > 10) {
      hints.push('💡 Try focusing on the center coins first!');
      hints.push("💡 Don't worry about catching everything!");
    }

    if (gameState.combo === 0 && gameState.score > 50) {
      hints.push('💡 Catch items quickly for combo bonuses!');
    }

    if (gameState.powerUpsActive === 0) {
      hints.push('💡 Power-ups make the game more fun!');
    }

    if (gameState.timeSurvived > 30 && gameState.score < 100) {
      hints.push('💡 Try moving your cart more actively!');
    }

    // Random fun tips
    const funTips = [
      '💡 Did you know? Rainbows give extra points!',
      '💡 Secret: Triple combos unlock surprise effects!',
      '💡 Fun fact: The cart gets happier with more coins!',
      '💡 Tip: Power-ups stack for mega effects!',
      '💡 Remember: This game is all about having fun!',
    ];

    if (Math.random() < 0.1) {
      hints.push(funTips[Math.floor(Math.random() * funTips.length)]);
    }

    return hints.length > 0 ? hints[Math.floor(Math.random() * hints.length)] : null;
  }

  adjustDynamicDifficulty(gameState: any): DifficultySettings {
    const settings = this.getDifficultySettings();

    // Make the game easier if player is struggling
    if (gameState.missedItems > settings.mistakeTolerance * 0.7) {
      settings.fallSpeed *= 0.9; // Slow down a bit
      settings.powerUpChance *= 1.2; // More power-ups to help
    }

    // Add some fun variation in party mode
    if (settings.mode === 'party') {
      // Random speed bursts and bonuses
      if (Math.random() < 0.1) {
        settings.fallSpeed = 1.0; // Super slow moment
        settings.coinValue *= 2; // Double points!
      } else if (Math.random() < 0.1) {
        settings.spawnRate = 500; // Item shower!
      }
    }

    // Zen mode auto-adjustment
    if (settings.mode === 'zen' && settings.autoHelp) {
      // Help catch items that are about to be missed
      if (gameState.itemsNearMiss > 0) {
        settings.fallSpeed *= 0.5; // Give more time
      }
    }

    return settings;
  }

  getCelebrationLevel(score: number): {
    level: number;
    message: string;
    effect: string;
  } {
    const celebrations = [
      { threshold: 50, level: 1, message: 'Nice Start!', effect: 'small_sparkle' },
      { threshold: 100, level: 2, message: 'Great Job!', effect: 'medium_burst' },
      { threshold: 250, level: 3, message: 'Fantastic!', effect: 'rainbow_shower' },
      { threshold: 500, level: 4, message: 'Incredible!', effect: 'fireworks' },
      { threshold: 1000, level: 5, message: 'Legendary!', effect: 'mega_celebration' },
      { threshold: 2000, level: 6, message: 'Champion!', effect: 'ultimate_party' },
    ];

    const celebration = celebrations.reverse().find((c) => score >= c.threshold) || {
      level: 0,
      message: 'Keep Going!',
      effect: 'none',
    };

    return celebration;
  }

  getEndGameMessage(
    score: number,
    timeSurvived: number
  ): {
    title: string;
    subtitle: string;
    emoji: string;
    encouragement: string;
  } {
    // Always positive and encouraging!
    const messages = [
      {
        title: 'Awesome Game!',
        subtitle: `You scored ${score} points!`,
        emoji: '🎉',
        encouragement: 'That was fantastic! Ready for another round?',
      },
      {
        title: 'Great Job!',
        subtitle: `${timeSurvived} seconds of pure fun!`,
        emoji: '⭐',
        encouragement: "You're getting better every time!",
      },
      {
        title: 'Well Played!',
        subtitle: `Score: ${score}`,
        emoji: '🏆',
        encouragement: "You're a natural at this!",
      },
      {
        title: 'Fun Times!',
        subtitle: `What a ride!`,
        emoji: '🎮',
        encouragement: 'That was entertaining! Play again?',
      },
      {
        title: 'Nice Run!',
        subtitle: `${score} points of happiness!`,
        emoji: '😊',
        encouragement: 'You bring joy to the game!',
      },
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  async toggleHints(enabled: boolean) {
    this.helpfulHintsEnabled = enabled;
    await AsyncStorage.setItem('helpfulHints', enabled.toString());
  }
}

export default FunDifficultySystem.getInstance();
