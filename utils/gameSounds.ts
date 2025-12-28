import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

interface SoundEffect {
  sound: Audio.Sound | null;
  isLoaded: boolean;
}

class GameSoundManager {
  private sounds: Map<string, SoundEffect> = new Map();
  private musicTrack: Audio.Sound | null = null;
  private isMusicPlaying: boolean = false;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private volume: number = 0.7;

  // Sound effect mappings for different game events
  private soundEffects = {
    // Coin collection sounds
    goldCoin: 'coin-collect-high',
    silverCoin: 'coin-collect-medium',
    bronzeCoin: 'coin-collect-low',

    // Lucky item sounds
    horseshoe: 'lucky-charm',
    fourLeafClover: 'magic-sparkle',
    shamrock: 'irish-luck',

    // Mystery crate sounds
    mysteryCrateOrange: 'crate-open-1',
    mysteryCrateBrown: 'crate-open-2',
    mysteryCratePurple: 'crate-open-epic',

    // Gift box sounds
    giftBoxRed: 'gift-unwrap',
    giftBoxOrange: 'gift-surprise',

    // Power-up sounds
    stopwatch: 'time-slow',
    magnet: 'magnet-activate',
    multiplier: 'multiplier-activate',

    // Mine cart sounds
    cartCollect: 'cart-pickup',
    cartRoll: 'cart-rolling',

    // UI sounds
    buttonTap: 'button-tap',
    menuOpen: 'menu-swoosh',
    menuClose: 'menu-close',

    // Game state sounds
    gameStart: 'game-start-fanfare',
    gameOver: 'game-over',
    levelUp: 'level-up',
    achievement: 'achievement-unlock',
    highScore: 'new-highscore',

    // Special effects
    starBurst: 'star-burst',
    sparkle: 'sparkle-effect',
    explosion: 'explosion-small',

    // Combo sounds
    combo2x: 'combo-2x',
    combo3x: 'combo-3x',
    combo5x: 'combo-5x',
    combo10x: 'combo-epic',
  };

  constructor() {
    this.initialize();
  }

  async initialize() {
    try {
      // Set up audio mode for game
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Preload essential sounds
      await this.preloadEssentialSounds();
    } catch (error) {
      console.log('Error initializing audio:', error);
    }
  }

  private async preloadEssentialSounds() {
    const essentialSounds = ['goldCoin', 'buttonTap', 'gameStart', 'gameOver'];

    for (const soundKey of essentialSounds) {
      await this.loadSound(soundKey);
    }
  }

  private async loadSound(soundKey: string): Promise<void> {
    if (this.sounds.has(soundKey)) return;

    try {
      // Create placeholder for actual sound files
      // In production, these would load from actual audio files
      const { sound } = await Audio.Sound.createAsync(
        {
          uri: `assets/sounds/${this.soundEffects[soundKey as keyof typeof this.soundEffects]}.mp3`,
        },
        { shouldPlay: false, volume: this.volume }
      );

      this.sounds.set(soundKey, { sound, isLoaded: true });
    } catch (error) {
      // Fallback to system sounds or silent operation
      this.sounds.set(soundKey, { sound: null, isLoaded: false });
    }
  }

  async playSound(soundKey: string, options?: { volume?: number; pitch?: number }) {
    if (!this.soundEnabled) return;

    try {
      // Load sound if not already loaded
      if (!this.sounds.has(soundKey)) {
        await this.loadSound(soundKey);
      }

      const soundEffect = this.sounds.get(soundKey);
      if (soundEffect?.sound && soundEffect.isLoaded) {
        // Set volume and pitch if provided
        if (options?.volume !== undefined) {
          await soundEffect.sound.setVolumeAsync(options.volume * this.volume);
        }
        if (options?.pitch !== undefined) {
          await soundEffect.sound.setRateAsync(options.pitch, true);
        }

        // Play the sound
        await soundEffect.sound.replayAsync();
      } else {
        // Fallback to haptic feedback if sound not available
        this.playHapticFeedback(soundKey);
      }
    } catch (error) {
      console.log(`Error playing sound ${soundKey}:`, error);
    }
  }

  private playHapticFeedback(soundKey: string) {
    // Map sound types to haptic feedback
    if (soundKey.includes('coin') || soundKey.includes('collect')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (soundKey.includes('crate') || soundKey.includes('gift')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (soundKey.includes('achievement') || soundKey.includes('levelUp')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (soundKey.includes('game')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  async playItemCollectionSound(itemType: string, combo: number = 1) {
    // Play base item sound
    await this.playSound(itemType);

    // Add combo sound for multiple collections
    if (combo >= 10) {
      await this.playSound('combo10x', { volume: 1.0, pitch: 1.2 });
    } else if (combo >= 5) {
      await this.playSound('combo5x', { volume: 0.9, pitch: 1.1 });
    } else if (combo >= 3) {
      await this.playSound('combo3x', { volume: 0.8, pitch: 1.05 });
    } else if (combo >= 2) {
      await this.playSound('combo2x', { volume: 0.7, pitch: 1.0 });
    }
  }

  async playBackgroundMusic(trackName: string = 'main-theme') {
    if (!this.musicEnabled) return;

    try {
      // Stop current music if playing
      if (this.musicTrack) {
        await this.musicTrack.stopAsync();
        await this.musicTrack.unloadAsync();
      }

      // Load and play new track
      const { sound } = await Audio.Sound.createAsync(
        { uri: `assets/music/${trackName}.mp3` },
        {
          shouldPlay: true,
          isLooping: true,
          volume: this.volume * 0.5, // Background music quieter
        }
      );

      this.musicTrack = sound;
      this.isMusicPlaying = true;
    } catch (error) {
      console.log('Error playing background music:', error);
    }
  }

  async stopBackgroundMusic() {
    if (this.musicTrack && this.isMusicPlaying) {
      await this.musicTrack.stopAsync();
      this.isMusicPlaying = false;
    }
  }

  async pauseBackgroundMusic() {
    if (this.musicTrack && this.isMusicPlaying) {
      await this.musicTrack.pauseAsync();
      this.isMusicPlaying = false;
    }
  }

  async resumeBackgroundMusic() {
    if (this.musicTrack && !this.isMusicPlaying) {
      await this.musicTrack.playAsync();
      this.isMusicPlaying = true;
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));

    // Update volume for background music if playing
    if (this.musicTrack) {
      this.musicTrack.setVolumeAsync(this.volume * 0.5);
    }
  }

  async cleanup() {
    // Stop background music
    await this.stopBackgroundMusic();

    // Unload all sounds
    for (const [_, soundEffect] of this.sounds) {
      if (soundEffect.sound) {
        await soundEffect.sound.unloadAsync();
      }
    }

    this.sounds.clear();
  }

  // Special sound sequences for game events
  async playVictorySequence() {
    await this.playSound('achievement');
    setTimeout(() => this.playSound('levelUp'), 500);
    setTimeout(() => this.playSound('starBurst'), 1000);
  }

  async playGameOverSequence(isHighScore: boolean = false) {
    if (isHighScore) {
      await this.playSound('highScore');
      setTimeout(() => this.playSound('achievement'), 1000);
    } else {
      await this.playSound('gameOver');
    }
  }

  async playPowerUpSequence(powerUpType: string) {
    await this.playSound(powerUpType);
    await this.playSound('sparkle', { volume: 0.5 });
  }
}

// Export singleton instance
export const gameSounds = new GameSoundManager();

// Export sound types for TypeScript
export const SoundTypes = {
  // Collections
  COIN_GOLD: 'goldCoin',
  COIN_SILVER: 'silverCoin',
  COIN_BRONZE: 'bronzeCoin',

  // Lucky items
  HORSESHOE: 'horseshoe',
  CLOVER: 'fourLeafClover',
  SHAMROCK: 'shamrock',

  // Crates
  CRATE_ORANGE: 'mysteryCrateOrange',
  CRATE_BROWN: 'mysteryCrateBrown',
  CRATE_PURPLE: 'mysteryCratePurple',

  // Gifts
  GIFT_RED: 'giftBoxRed',
  GIFT_ORANGE: 'giftBoxOrange',

  // Power-ups
  STOPWATCH: 'stopwatch',
  MAGNET: 'magnet',
  MULTIPLIER: 'multiplier',

  // UI
  BUTTON: 'buttonTap',
  MENU_OPEN: 'menuOpen',
  MENU_CLOSE: 'menuClose',

  // Game states
  GAME_START: 'gameStart',
  GAME_OVER: 'gameOver',
  LEVEL_UP: 'levelUp',
  ACHIEVEMENT: 'achievement',
  HIGH_SCORE: 'highScore',

  // Effects
  STAR_BURST: 'starBurst',
  SPARKLE: 'sparkle',
  EXPLOSION: 'explosion',

  // Combos
  COMBO_2X: 'combo2x',
  COMBO_3X: 'combo3x',
  COMBO_5X: 'combo5x',
  COMBO_10X: 'combo10x',
} as const;
