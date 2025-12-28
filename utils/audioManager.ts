import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface SoundConfig {
  file: any;
  volume: number;
  shouldLoop?: boolean;
}

interface SoundEffects {
  coinCollect: Audio.Sound | null;
  bonusCollect: Audio.Sound | null;
  powerUpActivate: Audio.Sound | null;
  comboIncrease: Audio.Sound | null;
  gameOver: Audio.Sound | null;
  levelUp: Audio.Sound | null;
  achievement: Audio.Sound | null;
  buttonTap: Audio.Sound | null;
  cartMove: Audio.Sound | null;
  explosion: Audio.Sound | null;
}

interface MusicTracks {
  mainTheme: Audio.Sound | null;
  gameplayLoop: Audio.Sound | null;
  bonusMode: Audio.Sound | null;
}

class AudioManager {
  private static instance: AudioManager;
  private sounds: SoundEffects = {
    coinCollect: null,
    bonusCollect: null,
    powerUpActivate: null,
    comboIncrease: null,
    gameOver: null,
    levelUp: null,
    achievement: null,
    buttonTap: null,
    cartMove: null,
    explosion: null,
  };

  private music: MusicTracks = {
    mainTheme: null,
    gameplayLoop: null,
    bonusMode: null,
  };

  private currentMusic: Audio.Sound | null = null;
  private isSoundEnabled: boolean = true;
  private isMusicEnabled: boolean = true;
  private isVibrationEnabled: boolean = true;
  private masterVolume: number = 1.0;
  private soundVolume: number = 0.7;
  private musicVolume: number = 0.5;

  private constructor() {
    this.initializeAudio();
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private async initializeAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      await this.loadPreferences();
      await this.loadSounds();
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  private async loadPreferences() {
    try {
      const soundEnabled = await AsyncStorage.getItem('soundEnabled');
      const musicEnabled = await AsyncStorage.getItem('musicEnabled');
      const vibrationEnabled = await AsyncStorage.getItem('vibrationEnabled');
      const masterVol = await AsyncStorage.getItem('masterVolume');

      this.isSoundEnabled = soundEnabled !== 'false';
      this.isMusicEnabled = musicEnabled !== 'false';
      this.isVibrationEnabled = vibrationEnabled !== 'false';
      this.masterVolume = masterVol ? parseFloat(masterVol) : 1.0;
    } catch (error) {
      console.error('Failed to load audio preferences:', error);
    }
  }

  private async loadSounds() {
    const soundConfigs: { [key in keyof SoundEffects]: SoundConfig } = {
      coinCollect: {
        file: require('../assets/sounds/coin-collect.mp3'),
        volume: 0.6,
      },
      bonusCollect: {
        file: require('../assets/sounds/bonus-collect.mp3'),
        volume: 0.7,
      },
      powerUpActivate: {
        file: require('../assets/sounds/powerup.mp3'),
        volume: 0.8,
      },
      comboIncrease: {
        file: require('../assets/sounds/combo.mp3'),
        volume: 0.5,
      },
      gameOver: {
        file: require('../assets/sounds/game-over.mp3'),
        volume: 0.6,
      },
      levelUp: {
        file: require('../assets/sounds/level-up.mp3'),
        volume: 0.8,
      },
      achievement: {
        file: require('../assets/sounds/achievement.mp3'),
        volume: 0.7,
      },
      buttonTap: {
        file: require('../assets/sounds/button-tap.mp3'),
        volume: 0.3,
      },
      cartMove: {
        file: require('../assets/sounds/cart-move.mp3'),
        volume: 0.4,
      },
      explosion: {
        file: require('../assets/sounds/explosion.mp3'),
        volume: 0.9,
      },
    };

    const musicConfigs: { [key in keyof MusicTracks]: SoundConfig } = {
      mainTheme: {
        file: require('../assets/music/main-theme.mp3'),
        volume: 0.5,
        shouldLoop: true,
      },
      gameplayLoop: {
        file: require('../assets/music/gameplay-loop.mp3'),
        volume: 0.4,
        shouldLoop: true,
      },
      bonusMode: {
        file: require('../assets/music/bonus-mode.mp3'),
        volume: 0.6,
        shouldLoop: true,
      },
    };

    // Load sound effects
    for (const [key, config] of Object.entries(soundConfigs)) {
      try {
        const { sound } = await Audio.Sound.createAsync(config.file, {
          shouldPlay: false,
          volume: config.volume * this.soundVolume * this.masterVolume,
        });
        this.sounds[key as keyof SoundEffects] = sound;
      } catch (error) {
        console.warn(`Failed to load sound ${key}:`, error);
      }
    }

    // Load music tracks
    for (const [key, config] of Object.entries(musicConfigs)) {
      try {
        const { sound } = await Audio.Sound.createAsync(config.file, {
          shouldPlay: false,
          isLooping: config.shouldLoop || false,
          volume: config.volume * this.musicVolume * this.masterVolume,
        });
        this.music[key as keyof MusicTracks] = sound;
      } catch (error) {
        console.warn(`Failed to load music ${key}:`, error);
      }
    }
  }

  async playSound(soundName: keyof SoundEffects, options?: { volume?: number; pitch?: number }) {
    if (!this.isSoundEnabled) return;

    const sound = this.sounds[soundName];
    if (!sound) {
      console.warn(`Sound ${soundName} not loaded`);
      return;
    }

    try {
      await sound.setPositionAsync(0);

      if (options?.volume !== undefined) {
        await sound.setVolumeAsync(options.volume * this.soundVolume * this.masterVolume);
      }

      if (options?.pitch !== undefined) {
        await sound.setRateAsync(options.pitch, true);
      }

      await sound.playAsync();

      // Add haptic feedback for certain sounds
      if (this.isVibrationEnabled) {
        switch (soundName) {
          case 'coinCollect':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'bonusCollect':
          case 'powerUpActivate':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'gameOver':
          case 'explosion':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'achievement':
          case 'levelUp':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
        }
      }
    } catch (error) {
      console.error(`Failed to play sound ${soundName}:`, error);
    }
  }

  async playMusic(trackName: keyof MusicTracks) {
    if (!this.isMusicEnabled) return;

    const track = this.music[trackName];
    if (!track) {
      console.warn(`Music track ${trackName} not loaded`);
      return;
    }

    try {
      // Stop current music if playing
      if (this.currentMusic) {
        await this.currentMusic.stopAsync();
      }

      this.currentMusic = track;
      await track.setPositionAsync(0);
      await track.playAsync();
    } catch (error) {
      console.error(`Failed to play music ${trackName}:`, error);
    }
  }

  async stopMusic() {
    if (this.currentMusic) {
      try {
        await this.currentMusic.stopAsync();
        this.currentMusic = null;
      } catch (error) {
        console.error('Failed to stop music:', error);
      }
    }
  }

  async pauseMusic() {
    if (this.currentMusic) {
      try {
        await this.currentMusic.pauseAsync();
      } catch (error) {
        console.error('Failed to pause music:', error);
      }
    }
  }

  async resumeMusic() {
    if (this.currentMusic && this.isMusicEnabled) {
      try {
        await this.currentMusic.playAsync();
      } catch (error) {
        console.error('Failed to resume music:', error);
      }
    }
  }

  async setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
    await AsyncStorage.setItem('soundEnabled', enabled.toString());
  }

  async setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    await AsyncStorage.setItem('musicEnabled', enabled.toString());

    if (!enabled) {
      await this.stopMusic();
    }
  }

  async setVibrationEnabled(enabled: boolean) {
    this.isVibrationEnabled = enabled;
    await AsyncStorage.setItem('vibrationEnabled', enabled.toString());
  }

  async setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    await AsyncStorage.setItem('masterVolume', this.masterVolume.toString());
    await this.updateAllVolumes();
  }

  private async updateAllVolumes() {
    // Update sound effects volume
    for (const sound of Object.values(this.sounds)) {
      if (sound) {
        await sound.setVolumeAsync(this.soundVolume * this.masterVolume);
      }
    }

    // Update music volume
    for (const track of Object.values(this.music)) {
      if (track) {
        await track.setVolumeAsync(this.musicVolume * this.masterVolume);
      }
    }
  }

  async cleanup() {
    try {
      // Unload all sounds
      for (const sound of Object.values(this.sounds)) {
        if (sound) {
          await sound.unloadAsync();
        }
      }

      // Unload all music
      for (const track of Object.values(this.music)) {
        if (track) {
          await track.unloadAsync();
        }
      }
    } catch (error) {
      console.error('Failed to cleanup audio:', error);
    }
  }

  // Special effect methods
  async playComboSound(comboCount: number) {
    const pitch = Math.min(1.5, 1 + comboCount * 0.1);
    await this.playSound('comboIncrease', { pitch, volume: Math.min(1, 0.5 + comboCount * 0.05) });
  }

  async playCollectSequence() {
    await this.playSound('coinCollect');
    setTimeout(() => this.playSound('coinCollect', { pitch: 1.2 }), 100);
    setTimeout(() => this.playSound('coinCollect', { pitch: 1.4 }), 200);
  }

  async playVictorySequence() {
    await this.playSound('levelUp');
    setTimeout(() => this.playSound('achievement'), 500);
  }
}

export default AudioManager.getInstance();
