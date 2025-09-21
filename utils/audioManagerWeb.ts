// Web-compatible audio manager (no expo-av dependency)
type SoundEffects = {
  coinCollect: HTMLAudioElement | null;
  bonusCollect: HTMLAudioElement | null;
  powerUpActivate: HTMLAudioElement | null;
  explosion: HTMLAudioElement | null;
  levelUp: HTMLAudioElement | null;
  gameOver: HTMLAudioElement | null;
  backgroundMusic: HTMLAudioElement | null;
  comboSound: HTMLAudioElement | null;
  encouragement: HTMLAudioElement | null;
  purchase: HTMLAudioElement | null;
  upgrade: HTMLAudioElement | null;
};

class AudioManagerWeb {
  private sounds: SoundEffects = {
    coinCollect: null,
    bonusCollect: null,
    powerUpActivate: null,
    explosion: null,
    levelUp: null,
    gameOver: null,
    backgroundMusic: null,
    comboSound: null,
    encouragement: null,
    purchase: null,
    upgrade: null,
  };

  private isEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private volume: number = 0.7;

  async initialize() {
    // Web audio doesn't need initialization
    console.log('Web Audio Manager initialized');
  }

  async loadSounds() {
    // In web, we'll create audio elements on demand
    console.log('Web sounds ready');
  }

  private createAudio(url: string): HTMLAudioElement {
    const audio = new Audio(url);
    audio.volume = this.volume;
    return audio;
  }

  async playSound(
    soundName: keyof SoundEffects,
    options?: { volume?: number; pitch?: number }
  ) {
    if (!this.isEnabled) return;

    try {
      // Create simple sound effects using Web Audio API or just console log for now
      const audio = new Audio();
      audio.volume = options?.volume || this.volume;

      // For web, we'll use simple tone generation or skip for now
      console.log(`Playing sound: ${soundName}`);

      // Create a simple beep sound for web
      if (typeof AudioContext !== 'undefined') {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Different frequencies for different sounds
        const frequencies: Record<keyof SoundEffects, number> = {
          coinCollect: 800,
          bonusCollect: 1000,
          powerUpActivate: 600,
          explosion: 200,
          levelUp: 1200,
          gameOver: 300,
          backgroundMusic: 440,
          comboSound: 900,
          encouragement: 700,
          purchase: 1100,
          upgrade: 850,
        };

        oscillator.frequency.value = frequencies[soundName];
        gainNode.gain.value = (options?.volume || this.volume) * 0.1;

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    } catch (error) {
      console.log('Web audio not available');
    }
  }

  async playBackgroundMusic() {
    if (!this.musicEnabled || !this.isEnabled) return;
    console.log('Playing background music (web)');
  }

  async stopBackgroundMusic() {
    console.log('Stopping background music (web)');
  }

  async playEncouragement(type: 'great' | 'awesome' | 'amazing' | 'incredible') {
    await this.playSound('encouragement');
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    }
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    } else if (this.isEnabled) {
      this.playBackgroundMusic();
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  getVolume(): number {
    return this.volume;
  }

  async vibrate(pattern?: number | number[]) {
    // Use browser vibration API if available
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern || 50);
    }
  }

  async cleanup() {
    await this.stopBackgroundMusic();
  }
}

const audioManagerWeb = new AudioManagerWeb();
export default audioManagerWeb;