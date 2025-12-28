/**
 * Sound Generator - Creates procedural audio for the game
 * Uses Web Audio API to generate sounds dynamically
 */

class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 0.7;
  private sounds: Map<string, AudioBuffer> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new window.AudioContext();
      this.generateAllSounds();
    }
  }

  private generateAllSounds() {
    // Generate each sound type
    this.sounds.set('coin', this.generateCoinSound());
    this.sounds.set('gem', this.generateGemSound());
    this.sounds.set('diamond', this.generateDiamondSound());
    this.sounds.set('explosion', this.generateExplosionSound());
    this.sounds.set('powerup', this.generatePowerUpSound());
    this.sounds.set('levelup', this.generateLevelUpSound());
    this.sounds.set('combo', this.generateComboSound());
    this.sounds.set('gameover', this.generateGameOverSound());
    this.sounds.set('tap', this.generateTapSound());
    this.sounds.set('pause', this.generatePauseSound());
    this.sounds.set('swoosh', this.generateSwooshSound());
    this.sounds.set('success', this.generateSuccessSound());
  }

  // Coin collection - bright, short ding
  private generateCoinSound(): AudioBuffer {
    const duration = 0.15;
    const sampleRate = this.audioContext!.sampleRate;
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Two harmonics for richness
      data[i] =
        (Math.sin(2 * Math.PI * 1046.5 * t) * 0.3 + // C6
          Math.sin(2 * Math.PI * 1568 * t) * 0.2) * // G6
        Math.exp(-t * 10); // Quick decay
    }

    return buffer;
  }

  // Gem collection - crystalline sound
  private generateGemSound(): AudioBuffer {
    const duration = 0.3;
    const sampleRate = this.audioContext!.sampleRate;
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      data[i] =
        (Math.sin(2 * Math.PI * 2093 * t) * 0.2 + // C7
          Math.sin(2 * Math.PI * 2637 * t) * 0.15 + // E7
          Math.sin(2 * Math.PI * 3136 * t) * 0.1) * // G7
        Math.exp(-t * 5);
    }

    return buffer;
  }

  // Diamond - longer, more magical
  private generateDiamondSound(): AudioBuffer {
    const duration = 0.5;
    const sampleRate = this.audioContext!.sampleRate;
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Ascending arpeggio effect
      const freq = 1046.5 * (1 + t * 2);
      data[i] =
        (Math.sin(2 * Math.PI * freq * t) * 0.3 + Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.2) *
        Math.exp(-t * 3);
    }

    return buffer;
  }

  // Explosion - noise burst
  private generateExplosionSound(): AudioBuffer {
    const duration = 0.4;
    const sampleRate = this.audioContext!.sampleRate;
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // White noise with low-pass filter simulation
      data[i] =
        (Math.random() * 2 - 1) * Math.exp(-t * 8) * (Math.sin(2 * Math.PI * 50 * t) * 0.5 + 0.5);
    }

    return buffer;
  }

  // Power-up - ascending sweep
  private generatePowerUpSound(): AudioBuffer {
    const duration = 0.6;
    const sampleRate = this.audioContext!.sampleRate;
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 400 * Math.exp(t * 3); // Exponential sweep up
      data[i] = Math.sin(2 * Math.PI * freq * t) * 0.3 * Math.exp(-t * 2);
    }

    return buffer;
  }

  // Level up - triumphant fanfare
  private generateLevelUpSound(): AudioBuffer {
    const duration = 0.8;
    const sampleRate = this.audioContext!.sampleRate;
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Major chord arpeggio
      const note = Math.floor(t * 8) % 3;
      const freqs = [523.25, 659.25, 783.99]; // C, E, G
      data[i] = Math.sin(2 * Math.PI * freqs[note] * t) * 0.3 * Math.exp(-t * 1.5);
    }

    return buffer;
  }

  // Combo - quick ascending notes
  private generateComboSound(): AudioBuffer {
    const duration = 0.3;
    const sampleRate = this.audioContext!.sampleRate;
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 800 + t * 800; // Rising pitch
      data[i] = Math.sin(2 * Math.PI * freq * t) * 0.25 * Math.exp(-t * 4);
    }

    return buffer;
  }

  // Game over - descending sad sound
  private generateGameOverSound(): AudioBuffer {
    const duration = 1.0;
    const sampleRate = this.audioContext!.sampleRate;
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 440 * Math.exp(-t * 0.5); // Descending pitch
      data[i] = Math.sin(2 * Math.PI * freq * t) * 0.3 * Math.exp(-t * 0.8);
    }

    return buffer;
  }

  // Tap - subtle click
  private generateTapSound(): AudioBuffer {
    const duration = 0.05;
    const sampleRate = this.audioContext!.sampleRate;
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      data[i] = Math.sin(2 * Math.PI * 1000 * t) * 0.1 * Math.exp(-t * 100);
    }

    return buffer;
  }

  // Pause - two-tone beep
  private generatePauseSound(): AudioBuffer {
    const duration = 0.2;
    const sampleRate = this.audioContext!.sampleRate;
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = t < 0.1 ? 800 : 600;
      data[i] = Math.sin(2 * Math.PI * freq * t) * 0.2 * Math.exp(-t * 5);
    }

    return buffer;
  }

  // Swoosh - for movements
  private generateSwooshSound(): AudioBuffer {
    const duration = 0.2;
    const sampleRate = this.audioContext!.sampleRate;
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Filtered noise sweep
      const noise = Math.random() * 2 - 1;
      const filter = Math.sin(2 * Math.PI * (200 + t * 1000) * t);
      data[i] = noise * filter * 0.1 * Math.exp(-t * 10);
    }

    return buffer;
  }

  // Success - cheerful chime
  private generateSuccessSound(): AudioBuffer {
    const duration = 0.4;
    const sampleRate = this.audioContext!.sampleRate;
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Two quick ascending notes
      const freq = t < 0.2 ? 880 : 1318.5; // A5 to E6
      data[i] = Math.sin(2 * Math.PI * freq * t) * 0.3 * Math.exp(-t * 4);
    }

    return buffer;
  }

  // Play a generated sound
  public playSound(soundName: string, volume: number = 1.0) {
    if (!this.audioContext || !this.sounds.has(soundName)) return;

    const buffer = this.sounds.get(soundName)!;
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume * this.masterVolume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start(0);
  }

  // Generate background music (simple looping melody)
  public createBackgroundMusic(): AudioBufferSourceNode | null {
    if (!this.audioContext) return null;

    const duration = 8; // 8 second loop
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(2, duration * sampleRate, sampleRate);

    // Simple melody pattern
    const melody = [261.63, 293.66, 329.63, 349.23, 392, 349.23, 329.63, 293.66]; // C D E F G F E D
    const bassline = [130.81, 146.83, 164.81, 174.61]; // C D E F (bass)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const beat = Math.floor(t * 2); // 2 beats per second

        // Melody
        const melodyNote = melody[beat % melody.length];
        const melodySound = Math.sin(2 * Math.PI * melodyNote * t) * 0.1;

        // Bass
        const bassNote = bassline[Math.floor(beat / 2) % bassline.length];
        const bassSound = Math.sin(2 * Math.PI * bassNote * t) * 0.15;

        // Drums (simple beat)
        const kick = beat % 4 === 0 ? Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t * 10) * 0.3 : 0;
        const hihat = beat % 2 === 1 ? (Math.random() - 0.5) * Math.exp(-(t % 0.5) * 20) * 0.05 : 0;

        data[i] = melodySound + bassSound + kick + hihat;
      }
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    source.loop = true;
    gainNode.gain.value = 0.3; // Background music quieter

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    return source;
  }

  public setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
}

export const soundGenerator = new SoundGenerator();
