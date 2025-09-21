import { Animated, Easing } from 'react-native';

export interface Particle {
  id: string;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  color: string;
  type: ParticleType;
}

export enum ParticleType {
  COIN_SPARKLE = 'coin_sparkle',
  GOLD_BURST = 'gold_burst',
  STAR_EXPLOSION = 'star_explosion',
  COMBO_TRAIL = 'combo_trail',
  POWER_UP_AURA = 'power_up_aura',
  LEVEL_UP_CONFETTI = 'level_up_confetti',
  ACHIEVEMENT_STARS = 'achievement_stars',
  COLLISION_SPARK = 'collision_spark',
}

interface ParticleConfig {
  count: number;
  duration: number;
  colors: string[];
  startPosition: { x: number; y: number };
  spread: number;
  gravity: number;
  fadeOut: boolean;
  scale: { min: number; max: number };
  velocity: { min: number; max: number };
}

class ParticleSystem {
  private static instance: ParticleSystem;
  private particles: Map<string, Particle[]> = new Map();
  private animationCallbacks: Map<string, () => void> = new Map();

  static getInstance(): ParticleSystem {
    if (!ParticleSystem.instance) {
      ParticleSystem.instance = new ParticleSystem();
    }
    return ParticleSystem.instance;
  }

  private getParticleConfig(type: ParticleType): ParticleConfig {
    const configs: Record<ParticleType, ParticleConfig> = {
      [ParticleType.COIN_SPARKLE]: {
        count: 8,
        duration: 800,
        colors: ['#FFD700', '#FFA500', '#FFFF00'],
        startPosition: { x: 0, y: 0 },
        spread: 50,
        gravity: 0.2,
        fadeOut: true,
        scale: { min: 0.3, max: 0.8 },
        velocity: { min: 2, max: 5 },
      },
      [ParticleType.GOLD_BURST]: {
        count: 15,
        duration: 1200,
        colors: ['#FFD700', '#FF8C00', '#FFA500', '#FFFF00'],
        startPosition: { x: 0, y: 0 },
        spread: 100,
        gravity: 0.3,
        fadeOut: true,
        scale: { min: 0.5, max: 1.2 },
        velocity: { min: 3, max: 8 },
      },
      [ParticleType.STAR_EXPLOSION]: {
        count: 20,
        duration: 1500,
        colors: ['#FFFFFF', '#FFFACD', '#F0E68C'],
        startPosition: { x: 0, y: 0 },
        spread: 150,
        gravity: 0.1,
        fadeOut: true,
        scale: { min: 0.4, max: 1.0 },
        velocity: { min: 4, max: 10 },
      },
      [ParticleType.COMBO_TRAIL]: {
        count: 5,
        duration: 600,
        colors: ['#FF69B4', '#FF1493', '#FF00FF'],
        startPosition: { x: 0, y: 0 },
        spread: 30,
        gravity: 0,
        fadeOut: true,
        scale: { min: 0.2, max: 0.5 },
        velocity: { min: 1, max: 3 },
      },
      [ParticleType.POWER_UP_AURA]: {
        count: 12,
        duration: 2000,
        colors: ['#00FFFF', '#00CED1', '#40E0D0', '#48D1CC'],
        startPosition: { x: 0, y: 0 },
        spread: 80,
        gravity: -0.1,
        fadeOut: true,
        scale: { min: 0.6, max: 1.5 },
        velocity: { min: 1, max: 4 },
      },
      [ParticleType.LEVEL_UP_CONFETTI]: {
        count: 30,
        duration: 2500,
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
        startPosition: { x: 0, y: 0 },
        spread: 200,
        gravity: 0.4,
        fadeOut: true,
        scale: { min: 0.3, max: 0.8 },
        velocity: { min: 5, max: 12 },
      },
      [ParticleType.ACHIEVEMENT_STARS]: {
        count: 25,
        duration: 2000,
        colors: ['#FFD700', '#FFFFFF', '#C0C0C0'],
        startPosition: { x: 0, y: 0 },
        spread: 120,
        gravity: 0.15,
        fadeOut: true,
        scale: { min: 0.5, max: 1.3 },
        velocity: { min: 3, max: 9 },
      },
      [ParticleType.COLLISION_SPARK]: {
        count: 6,
        duration: 400,
        colors: ['#FFFFFF', '#FFFF00', '#FFA500'],
        startPosition: { x: 0, y: 0 },
        spread: 40,
        gravity: 0.5,
        fadeOut: true,
        scale: { min: 0.2, max: 0.4 },
        velocity: { min: 2, max: 6 },
      },
    };

    return configs[type];
  }

  createParticles(
    type: ParticleType,
    position: { x: number; y: number },
    customConfig?: Partial<ParticleConfig>
  ): Particle[] {
    const config = { ...this.getParticleConfig(type), ...customConfig };
    const particles: Particle[] = [];
    const groupId = `${type}_${Date.now()}`;

    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count + Math.random() * 0.5;
      const velocity = config.velocity.min + Math.random() * (config.velocity.max - config.velocity.min);
      const scale = config.scale.min + Math.random() * (config.scale.max - config.scale.min);
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];

      const particle: Particle = {
        id: `${groupId}_${i}`,
        x: new Animated.Value(position.x),
        y: new Animated.Value(position.y),
        scale: new Animated.Value(scale),
        opacity: new Animated.Value(1),
        rotation: new Animated.Value(0),
        color,
        type,
      };

      // Calculate end position
      const endX = position.x + Math.cos(angle) * config.spread * velocity;
      const endY = position.y + Math.sin(angle) * config.spread * velocity + (config.gravity * config.duration);

      // Animate particle
      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: endX,
          duration: config.duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: endY,
          duration: config.duration,
          easing: config.gravity > 0 ? Easing.quad : Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        config.fadeOut
          ? Animated.timing(particle.opacity, {
              toValue: 0,
              duration: config.duration,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            })
          : Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
        Animated.timing(particle.rotation, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: config.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(particle.scale, {
            toValue: scale * 1.2,
            duration: config.duration * 0.3,
            easing: Easing.out(Easing.back),
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: scale * 0.8,
            duration: config.duration * 0.7,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Cleanup after animation
        this.removeParticleGroup(groupId);
      });

      particles.push(particle);
    }

    this.particles.set(groupId, particles);
    return particles;
  }

  createComboEffect(comboLevel: number, position: { x: number; y: number }): Particle[] {
    const baseConfig = this.getParticleConfig(ParticleType.COMBO_TRAIL);
    const enhancedConfig: Partial<ParticleConfig> = {
      count: Math.min(20, 5 + comboLevel * 2),
      colors: this.getComboColors(comboLevel),
      scale: {
        min: 0.3 + comboLevel * 0.05,
        max: 0.8 + comboLevel * 0.1,
      },
      spread: 50 + comboLevel * 10,
    };

    return this.createParticles(ParticleType.COMBO_TRAIL, position, enhancedConfig);
  }

  private getComboColors(comboLevel: number): string[] {
    if (comboLevel <= 5) {
      return ['#FFD700', '#FFA500'];
    } else if (comboLevel <= 10) {
      return ['#FF69B4', '#FF1493', '#FFD700'];
    } else if (comboLevel <= 20) {
      return ['#00FFFF', '#FF00FF', '#FFD700'];
    } else {
      return ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
    }
  }

  createPowerUpEffect(powerUpType: string, position: { x: number; y: number }): Particle[] {
    const colors = this.getPowerUpColors(powerUpType);
    return this.createParticles(ParticleType.POWER_UP_AURA, position, { colors });
  }

  private getPowerUpColors(powerUpType: string): string[] {
    const colorMap: Record<string, string[]> = {
      magnet: ['#B22222', '#DC143C', '#FF0000'],
      shield: ['#4169E1', '#1E90FF', '#00BFFF'],
      multiplier: ['#FFD700', '#FFA500', '#FF8C00'],
      slowTime: ['#9370DB', '#8A2BE2', '#9932CC'],
      bomb: ['#FF4500', '#FF6347', '#FFA500'],
    };

    return colorMap[powerUpType] || ['#FFFFFF', '#C0C0C0'];
  }

  createCoinCollectEffect(position: { x: number; y: number }, value: number): Particle[] {
    const particleCount = Math.min(15, 5 + Math.floor(value / 10));
    return this.createParticles(ParticleType.COIN_SPARKLE, position, { count: particleCount });
  }

  createLevelUpEffect(screenWidth: number, screenHeight: number): Particle[] {
    const particles: Particle[] = [];

    // Create confetti from multiple points
    const positions = [
      { x: screenWidth * 0.2, y: screenHeight * 0.8 },
      { x: screenWidth * 0.5, y: screenHeight * 0.8 },
      { x: screenWidth * 0.8, y: screenHeight * 0.8 },
    ];

    positions.forEach(pos => {
      particles.push(...this.createParticles(ParticleType.LEVEL_UP_CONFETTI, pos));
    });

    return particles;
  }

  removeParticleGroup(groupId: string) {
    this.particles.delete(groupId);
    const callback = this.animationCallbacks.get(groupId);
    if (callback) {
      callback();
      this.animationCallbacks.delete(groupId);
    }
  }

  clearAllParticles() {
    this.particles.clear();
    this.animationCallbacks.clear();
  }

  getActiveParticles(): Particle[] {
    const allParticles: Particle[] = [];
    this.particles.forEach(group => {
      allParticles.push(...group);
    });
    return allParticles;
  }
}

export default ParticleSystem.getInstance();