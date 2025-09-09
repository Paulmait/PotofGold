import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { soundGenerator } from './soundGenerator';
import { Platform } from 'react-native';

interface SoundEffect {
  sound: Audio.Sound | null;
  isLoaded: boolean;
}

class GameSoundManager {
  private sounds: Map<string, SoundEffect> = new Map();
  private backgroundMusic: Audio.Sound | null = null;
  private backgroundMusicWeb: AudioBufferSourceNode | null = null;
  private isMuted: boolean = false;
  private soundVolume: number = 0.7;
  private musicVolume: number = 0.3;
  private useProceduralSounds: boolean = true; // Use generated sounds
  
  // Sound file mappings - using procedural generation
  private soundFiles: { [key: string]: any } = {};
  
  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    try {
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      
      // Preload critical sounds
      await this.preloadSound('coinCollect');
      await this.preloadSound('bombHit');
      await this.preloadSound('levelUp');
    } catch (error) {
      console.log('Error initializing audio:', error);
    }
  }
  
  private async preloadSound(soundName: string): Promise<void> {
    try {
      if (!this.soundFiles[soundName]) {
        // Create a simple beep sound as fallback
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQAAAAA=' },
          { shouldPlay: false }
        );
        this.sounds.set(soundName, { sound, isLoaded: true });
        return;
      }
      
      const { sound } = await Audio.Sound.createAsync(
        this.soundFiles[soundName],
        { shouldPlay: false, volume: this.soundVolume }
      );
      
      this.sounds.set(soundName, { sound, isLoaded: true });
    } catch (error) {
      console.log(`Error loading sound ${soundName}:`, error);
      // Create a fallback silent sound
      this.sounds.set(soundName, { sound: null, isLoaded: false });
    }
  }
  
  public async playSound(soundName: string, options?: { volume?: number; haptic?: boolean }) {
    if (this.isMuted) return;
    
    try {
      // Play haptic feedback if requested
      if (options?.haptic) {
        this.playHaptic(soundName);
      }
      
      // Use procedural sounds for web or if enabled
      if (this.useProceduralSounds || Platform.OS === 'web') {
        // Map sound names to procedural sound types
        const soundMap: { [key: string]: string } = {
          coinCollect: 'coin',
          gemCollect: 'gem',
          diamondCollect: 'diamond',
          bombHit: 'explosion',
          powerupCollect: 'powerup',
          levelUp: 'levelup',
          comboIncrease: 'combo',
          gameOver: 'gameover',
          buttonTap: 'tap',
          pause: 'pause',
        };
        
        const proceduralSound = soundMap[soundName] || soundName;
        soundGenerator.playSound(proceduralSound, options?.volume ?? this.soundVolume);
        return;
      }
      
      // Fallback to file-based sounds
      let soundEffect = this.sounds.get(soundName);
      
      if (!soundEffect || !soundEffect.isLoaded) {
        await this.preloadSound(soundName);
        soundEffect = this.sounds.get(soundName);
      }
      
      if (soundEffect?.sound) {
        await soundEffect.sound.setPositionAsync(0);
        await soundEffect.sound.setVolumeAsync(options?.volume ?? this.soundVolume);
        await soundEffect.sound.playAsync();
      }
    } catch (error) {
      console.log(`Error playing sound ${soundName}:`, error);
    }
  }
  
  private playHaptic(soundName: string) {
    // Map sounds to appropriate haptic feedback
    switch (soundName) {
      case 'coinCollect':
      case 'gemCollect':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'diamondCollect':
      case 'powerupCollect':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'bombHit':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'levelUp':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'gameOver':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        Haptics.selectionAsync();
    }
  }
  
  public async startBackgroundMusic() {
    if (this.isMuted) return;
    
    // Use procedural music for web
    if (this.useProceduralSounds || Platform.OS === 'web') {
      if (this.backgroundMusicWeb) return; // Already playing
      
      try {
        this.backgroundMusicWeb = soundGenerator.createBackgroundMusic();
        if (this.backgroundMusicWeb) {
          this.backgroundMusicWeb.start(0);
        }
      } catch (error) {
        console.log('Error starting procedural background music:', error);
      }
      return;
    }
    
    // File-based music for native
    if (this.backgroundMusic) return;
    
    try {
      const { sound } = await Audio.Sound.createAsync(
        this.soundFiles.bgMusic || { uri: '' },
        { 
          shouldPlay: true, 
          isLooping: true,
          volume: this.musicVolume 
        }
      );
      
      this.backgroundMusic = sound;
    } catch (error) {
      console.log('Error starting background music:', error);
    }
  }
  
  public async stopBackgroundMusic() {
    if (this.backgroundMusic) {
      try {
        await this.backgroundMusic.stopAsync();
        await this.backgroundMusic.unloadAsync();
        this.backgroundMusic = null;
      } catch (error) {
        console.log('Error stopping background music:', error);
      }
    }
  }
  
  public async pauseBackgroundMusic() {
    if (this.backgroundMusic) {
      try {
        await this.backgroundMusic.pauseAsync();
      } catch (error) {
        console.log('Error pausing background music:', error);
      }
    }
  }
  
  public async resumeBackgroundMusic() {
    if (this.backgroundMusic && !this.isMuted) {
      try {
        await this.backgroundMusic.playAsync();
      } catch (error) {
        console.log('Error resuming background music:', error);
      }
    }
  }
  
  public setMuted(muted: boolean) {
    this.isMuted = muted;
    
    if (muted) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }
  }
  
  public setSoundVolume(volume: number) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
  }
  
  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    if (this.backgroundMusic) {
      this.backgroundMusic.setVolumeAsync(this.musicVolume);
    }
  }
  
  public async cleanup() {
    // Stop background music
    await this.stopBackgroundMusic();
    
    // Unload all sounds
    for (const [_, soundEffect] of this.sounds) {
      if (soundEffect.sound) {
        try {
          await soundEffect.sound.unloadAsync();
        } catch (error) {
          console.log('Error unloading sound:', error);
        }
      }
    }
    
    this.sounds.clear();
  }
}

export const gameSoundManager = new GameSoundManager();