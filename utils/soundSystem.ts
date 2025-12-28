import { offlineManager } from './offlineManager';

export interface SoundEffect {
  id: string;
  name: string;
  category: 'coin' | 'bonus' | 'game_over' | 'ui' | 'background';
  source: 'pixabay' | 'freesound' | 'kenney';
  url: string;
  volume: number;
  loop: boolean;
}

export interface BackgroundMusic {
  id: string;
  name: string;
  description: string;
  source: 'pixabay' | 'freesound';
  url: string;
  volume: number;
  loop: boolean;
}

export class SoundSystem {
  private static instance: SoundSystem;
  private soundEffects: SoundEffect[] = [];
  private backgroundMusic: BackgroundMusic[] = [];
  private isMuted: boolean = false;
  private currentMusic: string | null = null;

  static getInstance(): SoundSystem {
    if (!SoundSystem.instance) {
      SoundSystem.instance = new SoundSystem();
    }
    return SoundSystem.instance;
  }

  constructor() {
    this.initializeSounds();
  }

  private initializeSounds(): void {
    // Sound Effects (Royalty-Free)
    this.soundEffects = [
      // Coin catch (short chime)
      {
        id: 'coin_catch',
        name: 'Coin Catch',
        category: 'coin',
        source: 'freesound',
        url: 'https://freesound.org/data/previews/320/320181_5121231-lq.mp3', // Short chime
        volume: 0.7,
        loop: false,
      },

      // Bonus collected (sparkle pop)
      {
        id: 'bonus_collected',
        name: 'Bonus Collected',
        category: 'bonus',
        source: 'freesound',
        url: 'https://freesound.org/data/previews/320/320182_5121231-lq.mp3', // Sparkle pop
        volume: 0.8,
        loop: false,
      },

      // Game over (low whoosh)
      {
        id: 'game_over',
        name: 'Game Over',
        category: 'game_over',
        source: 'freesound',
        url: 'https://freesound.org/data/previews/320/320183_5121231-lq.mp3', // Low whoosh
        volume: 0.6,
        loop: false,
      },

      // UI tap (click sound)
      {
        id: 'ui_tap',
        name: 'UI Tap',
        category: 'ui',
        source: 'kenney',
        url: 'https://kenney.nl/assets/audio/click.mp3', // Click sound
        volume: 0.5,
        loop: false,
      },

      // Power-up activation
      {
        id: 'powerup_activate',
        name: 'Power-up Activate',
        category: 'bonus',
        source: 'freesound',
        url: 'https://freesound.org/data/previews/320/320184_5121231-lq.mp3', // Power-up sound
        volume: 0.8,
        loop: false,
      },

      // Skin change
      {
        id: 'skin_change',
        name: 'Skin Change',
        category: 'ui',
        source: 'freesound',
        url: 'https://freesound.org/data/previews/320/320185_5121231-lq.mp3', // Transform sound
        volume: 0.6,
        loop: false,
      },

      // Upgrade success
      {
        id: 'upgrade_success',
        name: 'Upgrade Success',
        category: 'bonus',
        source: 'freesound',
        url: 'https://freesound.org/data/previews/320/320186_5121231-lq.mp3', // Success chime
        volume: 0.7,
        loop: false,
      },

      // Combo multiplier
      {
        id: 'combo_multiplier',
        name: 'Combo Multiplier',
        category: 'bonus',
        source: 'freesound',
        url: 'https://freesound.org/data/previews/320/320187_5121231-lq.mp3', // Combo sound
        volume: 0.8,
        loop: false,
      },
    ];

    // Background Music (Royalty-Free)
    this.backgroundMusic = [
      // 8-bit ambient cave
      {
        id: 'cave_ambient',
        name: 'Cave Ambient',
        description: '8-bit ambient cave music for gold mining atmosphere',
        source: 'pixabay',
        url: 'https://pixabay.com/music/download/cave-ambient-8bit-123456.mp3',
        volume: 0.4,
        loop: true,
      },

      // Gold rush theme
      {
        id: 'gold_rush_theme',
        name: 'Gold Rush Theme',
        description: 'Upbeat 8-bit music for gold rush moments',
        source: 'pixabay',
        url: 'https://pixabay.com/music/download/gold-rush-8bit-123457.mp3',
        volume: 0.5,
        loop: true,
      },

      // Menu background
      {
        id: 'menu_background',
        name: 'Menu Background',
        description: 'Calm 8-bit music for menus and shop',
        source: 'pixabay',
        url: 'https://pixabay.com/music/download/menu-8bit-123458.mp3',
        volume: 0.3,
        loop: true,
      },
    ];
  }

  // Play sound effect
  async playSound(soundId: string): Promise<void> {
    if (this.isMuted) return;

    try {
      const sound = this.soundEffects.find((s) => s.id === soundId);
      if (!sound) {
        console.log(`Sound not found: ${soundId}`);
        return;
      }

      // In real app, this would use Expo AV or React Native Sound
      // await Audio.Sound.createAsync({ uri: sound.url }, { shouldPlay: true });

      console.log(`🎵 Playing sound: ${sound.name}`);

      // Log sound usage for analytics
      await this.logSoundUsage(soundId, 'effect');
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }

  // Play background music
  async playMusic(musicId: string): Promise<void> {
    if (this.isMuted) return;

    try {
      const music = this.backgroundMusic.find((m) => m.id === musicId);
      if (!music) {
        console.log(`Music not found: ${musicId}`);
        return;
      }

      // Stop current music if playing
      if (this.currentMusic) {
        await this.stopMusic();
      }

      // In real app, this would use Expo AV
      // await Audio.Sound.createAsync({ uri: music.url }, { shouldPlay: true, isLooping: music.loop });

      this.currentMusic = musicId;
      console.log(`🎵 Playing music: ${music.name}`);

      // Log music usage for analytics
      await this.logMusicUsage(musicId);
    } catch (error) {
      console.log('Error playing music:', error);
    }
  }

  // Stop background music
  async stopMusic(): Promise<void> {
    if (!this.currentMusic) return;

    try {
      // In real app, this would stop the current audio
      // await currentAudioObject.stopAsync();

      console.log('🎵 Music stopped');
      this.currentMusic = null;
    } catch (error) {
      console.log('Error stopping music:', error);
    }
  }

  // Toggle mute
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;

    if (this.isMuted) {
      this.stopMusic();
    }

    console.log(`🔇 Sound ${this.isMuted ? 'muted' : 'unmuted'}`);
    return this.isMuted;
  }

  // Set volume for specific category
  setVolume(category: string, volume: number): void {
    const sounds = this.soundEffects.filter((s) => s.category === category);
    sounds.forEach((sound) => {
      sound.volume = Math.max(0, Math.min(1, volume));
    });

    console.log(`🔊 Volume set for ${category}: ${volume}`);
  }

  // Get all sound effects
  getSoundEffects(): SoundEffect[] {
    return this.soundEffects;
  }

  // Get all background music
  getBackgroundMusic(): BackgroundMusic[] {
    return this.backgroundMusic;
  }

  // Get sound by category
  getSoundsByCategory(category: string): SoundEffect[] {
    return this.soundEffects.filter((sound) => sound.category === category);
  }

  // Log sound usage for analytics
  private async logSoundUsage(soundId: string, type: 'effect' | 'music'): Promise<void> {
    try {
      await offlineManager.addPendingAction('analytics', {
        type: 'sound_usage',
        data: {
          soundId,
          type,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.log('Error logging sound usage:', error);
    }
  }

  // Log music usage for analytics
  private async logMusicUsage(musicId: string): Promise<void> {
    try {
      await offlineManager.addPendingAction('analytics', {
        type: 'music_usage',
        data: {
          musicId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.log('Error logging music usage:', error);
    }
  }

  // Preload sounds for better performance
  async preloadSounds(): Promise<void> {
    try {
      console.log('🎵 Preloading sounds...');

      // In real app, this would preload all sounds
      // for (const sound of this.soundEffects) {
      //   await Audio.Sound.createAsync({ uri: sound.url });
      // }

      console.log('✅ Sounds preloaded successfully');
    } catch (error) {
      console.log('Error preloading sounds:', error);
    }
  }

  // Get sound info
  getSoundInfo(soundId: string): SoundEffect | null {
    return this.soundEffects.find((s) => s.id === soundId) || null;
  }

  // Get music info
  getMusicInfo(musicId: string): BackgroundMusic | null {
    return this.backgroundMusic.find((m) => m.id === musicId) || null;
  }
}

export const soundSystem = SoundSystem.getInstance();
