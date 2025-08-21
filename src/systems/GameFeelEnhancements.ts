/**
 * Game Feel Enhancement System
 * Makes the game more satisfying, juicy, and fun to play
 */

import * as Haptics from 'expo-haptics';
import { Animated, Easing } from 'react-native';

// ========== JUICE & POLISH ==========

export class JuiceSystem {
  private activeEffects: Map<string, any> = new Map();
  
  // Screen shake for impacts
  screenShake(intensity: 'light' | 'medium' | 'heavy' = 'medium'): ScreenShakeEffect {
    const shakeConfigs = {
      light: { amplitude: 5, duration: 100, frequency: 2 },
      medium: { amplitude: 10, duration: 200, frequency: 4 },
      heavy: { amplitude: 20, duration: 300, frequency: 6 }
    };
    
    const config = shakeConfigs[intensity];
    const shakeAnimation = new Animated.Value(0);
    
    Animated.sequence([
      ...Array(config.frequency).fill(0).map((_, i) => 
        Animated.sequence([
          Animated.timing(shakeAnimation, {
            toValue: config.amplitude * (i % 2 === 0 ? 1 : -1),
            duration: config.duration / (config.frequency * 2),
            useNativeDriver: true,
            easing: Easing.bounce
          })
        ])
      ),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true
      })
    ]).start();
    
    return {
      animation: shakeAnimation,
      intensity,
      haptic: this.getHapticForIntensity(intensity)
    };
  }
  
  // Particle explosions for rewards
  particleBurst(type: ParticleType, position: Position): ParticleEffect {
    const particleConfigs = {
      coins: {
        count: 20,
        color: '#FFD700',
        size: 15,
        speed: 300,
        gravity: 0.5,
        lifetime: 1000,
        emoji: '🪙'
      },
      stars: {
        count: 30,
        color: '#FFFF00',
        size: 20,
        speed: 400,
        gravity: 0.2,
        lifetime: 1500,
        emoji: '⭐'
      },
      hearts: {
        count: 15,
        color: '#FF69B4',
        size: 25,
        speed: 250,
        gravity: 0.1,
        lifetime: 2000,
        emoji: '❤️'
      },
      rainbow: {
        count: 50,
        color: 'rainbow',
        size: 10,
        speed: 500,
        gravity: 0.3,
        lifetime: 1200,
        emoji: '🌈'
      },
      explosion: {
        count: 40,
        color: '#FF4500',
        size: 30,
        speed: 600,
        gravity: 0.4,
        lifetime: 800,
        emoji: '💥'
      }
    };
    
    const config = particleConfigs[type];
    const particles: Particle[] = [];
    
    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count + Math.random() * 0.2;
      const velocity = config.speed * (0.5 + Math.random() * 0.5);
      
      particles.push({
        id: `particle_${Date.now()}_${i}`,
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: config.size * (0.5 + Math.random() * 0.5),
        color: this.getParticleColor(config.color),
        lifetime: config.lifetime,
        emoji: config.emoji,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }
    
    return {
      particles,
      gravity: config.gravity,
      type
    };
  }
  
  // Combo text effects
  comboTextEffect(combo: number): ComboEffect {
    const effects = [
      { min: 2, text: 'COMBO!', color: '#00FF00', scale: 1.2 },
      { min: 5, text: 'SUPER!', color: '#00FFFF', scale: 1.4 },
      { min: 10, text: 'MEGA!', color: '#FFD700', scale: 1.6 },
      { min: 20, text: 'ULTRA!', color: '#FF00FF', scale: 1.8 },
      { min: 30, text: 'GODLIKE!', color: '#FF0000', scale: 2.0 },
      { min: 50, text: 'LEGENDARY!', color: '#FFD700', scale: 2.5, rainbow: true }
    ];
    
    const effect = effects.reverse().find(e => combo >= e.min) || effects[0];
    
    return {
      text: `${effect.text} x${combo}`,
      color: effect.color,
      scale: effect.scale,
      animation: this.createComboAnimation(effect.scale),
      rainbow: effect.rainbow || false,
      haptic: combo > 10 ? 'heavy' : 'medium'
    };
  }
  
  private createComboAnimation(scale: number): Animated.Value {
    const animation = new Animated.Value(0);
    
    Animated.sequence([
      Animated.timing(animation, {
        toValue: scale,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.elastic(1)
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
    
    return animation;
  }
  
  private getHapticForIntensity(intensity: string): Haptics.ImpactFeedbackStyle {
    switch(intensity) {
      case 'light': return Haptics.ImpactFeedbackStyle.Light;
      case 'medium': return Haptics.ImpactFeedbackStyle.Medium;
      case 'heavy': return Haptics.ImpactFeedbackStyle.Heavy;
      default: return Haptics.ImpactFeedbackStyle.Medium;
    }
  }
  
  private getParticleColor(color: string): string {
    if (color === 'rainbow') {
      const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
      return colors[Math.floor(Math.random() * colors.length)];
    }
    return color;
  }
}

// ========== SATISFYING FEEDBACK ==========

export class SatisfactionEngine {
  // Chain reaction system
  createChainReaction(origin: Position, type: string): ChainReaction {
    const reactions: ReactionNode[] = [];
    const delayBetweenReactions = 50; // ms
    const maxChainLength = 10;
    
    for (let i = 0; i < maxChainLength; i++) {
      const angle = (Math.PI * 2 * i) / maxChainLength;
      const distance = 50 + i * 30;
      
      reactions.push({
        id: `reaction_${i}`,
        x: origin.x + Math.cos(angle) * distance,
        y: origin.y + Math.sin(angle) * distance,
        delay: i * delayBetweenReactions,
        intensity: 1 - (i / maxChainLength) * 0.5,
        color: this.getChainColor(i, maxChainLength)
      });
    }
    
    return {
      origin,
      reactions,
      totalDuration: maxChainLength * delayBetweenReactions,
      type
    };
  }
  
  // Satisfying collection animations
  magneticCollection(items: any[], collector: Position): MagneticEffect {
    const magnetizedItems = items.map((item, index) => {
      const distance = Math.sqrt(
        Math.pow(item.x - collector.x, 2) + 
        Math.pow(item.y - collector.y, 2)
      );
      
      const duration = Math.min(300, 100 + distance * 0.5);
      const curve = Easing.bezier(0.25, 0.46, 0.45, 0.94); // Smooth ease-out
      
      return {
        item,
        animation: this.createMagneticAnimation(item, collector, duration, curve),
        delay: index * 20, // Stagger collections
        sparkle: distance > 200 // Add sparkle for distant items
      };
    });
    
    return {
      items: magnetizedItems,
      totalDuration: 500,
      hapticPattern: this.generateCollectionHaptics(items.length)
    };
  }
  
  private createMagneticAnimation(
    from: Position, 
    to: Position, 
    duration: number,
    easing: any
  ): any {
    const animX = new Animated.Value(from.x);
    const animY = new Animated.Value(from.y);
    const scale = new Animated.Value(1);
    const rotation = new Animated.Value(0);
    
    Animated.parallel([
      Animated.timing(animX, {
        toValue: to.x,
        duration,
        easing,
        useNativeDriver: true
      }),
      Animated.timing(animY, {
        toValue: to.y,
        duration,
        easing,
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: duration * 0.3,
          useNativeDriver: true
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: duration * 0.7,
          useNativeDriver: true
        })
      ]),
      Animated.timing(rotation, {
        toValue: 720,
        duration,
        useNativeDriver: true
      })
    ]).start();
    
    return { x: animX, y: animY, scale, rotation };
  }
  
  private generateCollectionHaptics(count: number): HapticPattern {
    const pattern: HapticPattern = {
      impacts: [],
      duration: 0
    };
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      pattern.impacts.push({
        delay: i * 30,
        style: i === count - 1 ? 'heavy' : 'light'
      });
    }
    
    pattern.duration = count * 30;
    return pattern;
  }
  
  private getChainColor(index: number, total: number): string {
    const hue = (index / total) * 360;
    return `hsl(${hue}, 100%, 50%)`;
  }
}

// ========== DYNAMIC ANIMATIONS ==========

export class DynamicAnimations {
  // Elastic bounce effects
  elasticBounce(value: Animated.Value, config?: BounceConfig): void {
    const defaultConfig = {
      friction: 4,
      tension: 40,
      amplitude: 1,
      overshoot: 1.5
    };
    
    const finalConfig = { ...defaultConfig, ...config };
    
    Animated.spring(value, {
      toValue: finalConfig.amplitude,
      friction: finalConfig.friction,
      tension: finalConfig.tension,
      useNativeDriver: true
    }).start(() => {
      Animated.spring(value, {
        toValue: 0,
        friction: finalConfig.friction * 2,
        tension: finalConfig.tension * 0.8,
        useNativeDriver: true
      }).start();
    });
  }
  
  // Pulsing glow effects
  pulsingGlow(intensity: number = 1): PulseEffect {
    const glowAnimation = new Animated.Value(0);
    const colorAnimation = new Animated.Value(0);
    
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: intensity,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    
    animation.start();
    
    return {
      glow: glowAnimation,
      color: colorAnimation,
      intensity,
      stop: () => animation.stop()
    };
  }
  
  // Trail effects for moving objects
  createTrail(path: Position[], config: TrailConfig): TrailEffect {
    const trail: TrailSegment[] = [];
    const segmentCount = config.length || 10;
    
    for (let i = 0; i < Math.min(path.length, segmentCount); i++) {
      const opacity = 1 - (i / segmentCount);
      const scale = 1 - (i / segmentCount) * 0.5;
      
      trail.push({
        position: path[path.length - 1 - i],
        opacity,
        scale,
        color: this.interpolateColor(config.startColor, config.endColor, i / segmentCount)
      });
    }
    
    return {
      segments: trail,
      config
    };
  }
  
  private interpolateColor(start: string, end: string, progress: number): string {
    // Simple color interpolation (would be more complex in production)
    return progress > 0.5 ? end : start;
  }
}

// ========== RESPONSIVE CONTROLS ==========

export class ResponsiveControls {
  private sensitivity: number = 1.0;
  private deadZone: number = 5;
  
  // Adaptive sensitivity based on player skill
  adaptSensitivity(playerStats: PlayerStats): void {
    if (playerStats.accuracy < 0.5) {
      this.sensitivity = 0.8; // Make controls more forgiving
    } else if (playerStats.accuracy > 0.8) {
      this.sensitivity = 1.2; // Allow for more precise control
    }
    
    if (playerStats.averageCombo < 5) {
      this.deadZone = 10; // Larger dead zone for beginners
    } else {
      this.deadZone = 3; // Smaller dead zone for experts
    }
  }
  
  // Smooth movement with acceleration
  calculateMovement(input: TouchInput, currentVelocity: Vector2): Vector2 {
    const targetVelocity = {
      x: input.deltaX * this.sensitivity,
      y: input.deltaY * this.sensitivity
    };
    
    // Apply dead zone
    if (Math.abs(targetVelocity.x) < this.deadZone) targetVelocity.x = 0;
    if (Math.abs(targetVelocity.y) < this.deadZone) targetVelocity.y = 0;
    
    // Smooth acceleration
    const acceleration = 0.2;
    const newVelocity = {
      x: currentVelocity.x + (targetVelocity.x - currentVelocity.x) * acceleration,
      y: currentVelocity.y + (targetVelocity.y - currentVelocity.y) * acceleration
    };
    
    // Apply max speed
    const maxSpeed = 20;
    const speed = Math.sqrt(newVelocity.x ** 2 + newVelocity.y ** 2);
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      newVelocity.x *= scale;
      newVelocity.y *= scale;
    }
    
    return newVelocity;
  }
  
  // Gesture predictions for smoother gameplay
  predictGesture(history: TouchInput[]): GesturePrediction {
    if (history.length < 3) {
      return { type: 'none', confidence: 0 };
    }
    
    const recent = history.slice(-5);
    const velocities = recent.map((input, i) => {
      if (i === 0) return { x: 0, y: 0 };
      const prev = recent[i - 1];
      return {
        x: input.x - prev.x,
        y: input.y - prev.y
      };
    });
    
    // Detect swipe
    const avgVelocity = velocities.reduce((acc, v) => ({
      x: acc.x + v.x / velocities.length,
      y: acc.y + v.y / velocities.length
    }), { x: 0, y: 0 });
    
    const speed = Math.sqrt(avgVelocity.x ** 2 + avgVelocity.y ** 2);
    
    if (speed > 10) {
      const angle = Math.atan2(avgVelocity.y, avgVelocity.x);
      const direction = this.angleToDirection(angle);
      return {
        type: 'swipe',
        direction,
        confidence: Math.min(speed / 20, 1)
      };
    }
    
    // Detect tap
    const movement = Math.sqrt(
      Math.pow(recent[recent.length - 1].x - recent[0].x, 2) +
      Math.pow(recent[recent.length - 1].y - recent[0].y, 2)
    );
    
    if (movement < 10) {
      return {
        type: 'tap',
        confidence: 0.9
      };
    }
    
    return { type: 'drag', confidence: 0.7 };
  }
  
  private angleToDirection(angle: number): string {
    const directions = ['right', 'down', 'left', 'up'];
    const index = Math.round(((angle + Math.PI) / (Math.PI * 2)) * 4) % 4;
    return directions[index];
  }
}

// ========== TYPE DEFINITIONS ==========

interface Position {
  x: number;
  y: number;
}

interface Vector2 {
  x: number;
  y: number;
}

interface ScreenShakeEffect {
  animation: Animated.Value;
  intensity: string;
  haptic: Haptics.ImpactFeedbackStyle;
}

type ParticleType = 'coins' | 'stars' | 'hearts' | 'rainbow' | 'explosion';

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  lifetime: number;
  emoji: string;
  rotation: number;
  rotationSpeed: number;
}

interface ParticleEffect {
  particles: Particle[];
  gravity: number;
  type: ParticleType;
}

interface ComboEffect {
  text: string;
  color: string;
  scale: number;
  animation: Animated.Value;
  rainbow: boolean;
  haptic: string;
}

interface ChainReaction {
  origin: Position;
  reactions: ReactionNode[];
  totalDuration: number;
  type: string;
}

interface ReactionNode {
  id: string;
  x: number;
  y: number;
  delay: number;
  intensity: number;
  color: string;
}

interface MagneticEffect {
  items: any[];
  totalDuration: number;
  hapticPattern: HapticPattern;
}

interface HapticPattern {
  impacts: Array<{ delay: number; style: string }>;
  duration: number;
}

interface BounceConfig {
  friction?: number;
  tension?: number;
  amplitude?: number;
  overshoot?: number;
}

interface PulseEffect {
  glow: Animated.Value;
  color: Animated.Value;
  intensity: number;
  stop: () => void;
}

interface TrailConfig {
  length?: number;
  startColor: string;
  endColor: string;
}

interface TrailSegment {
  position: Position;
  opacity: number;
  scale: number;
  color: string;
}

interface TrailEffect {
  segments: TrailSegment[];
  config: TrailConfig;
}

interface PlayerStats {
  accuracy: number;
  averageCombo: number;
  playTime: number;
}

interface TouchInput {
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  timestamp: number;
}

interface GesturePrediction {
  type: 'none' | 'tap' | 'swipe' | 'drag';
  direction?: string;
  confidence: number;
}

// ========== MAIN EXPORT ==========

export class GameFeelEnhancer {
  public juice = new JuiceSystem();
  public satisfaction = new SatisfactionEngine();
  public animations = new DynamicAnimations();
  public controls = new ResponsiveControls();
  
  // Master function to make any action feel amazing
  enhanceAction(action: string, context: any): EnhancedAction {
    const enhancements: any[] = [];
    
    switch(action) {
      case 'collect_coin':
        enhancements.push(
          this.juice.particleBurst('coins', context.position),
          this.satisfaction.magneticCollection([context.item], context.collector),
          this.animations.elasticBounce(context.scoreAnimation),
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        );
        break;
        
      case 'combo':
        enhancements.push(
          this.juice.comboTextEffect(context.comboCount),
          this.juice.screenShake('medium'),
          this.satisfaction.createChainReaction(context.position, 'combo'),
          this.animations.pulsingGlow(context.comboCount / 10)
        );
        break;
        
      case 'power_up':
        enhancements.push(
          this.juice.particleBurst('rainbow', context.position),
          this.juice.screenShake('heavy'),
          this.animations.pulsingGlow(2),
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        );
        break;
        
      case 'level_up':
        enhancements.push(
          this.juice.particleBurst('stars', { x: context.screenWidth / 2, y: context.screenHeight / 2 }),
          this.juice.screenShake('heavy'),
          this.satisfaction.createChainReaction(
            { x: context.screenWidth / 2, y: context.screenHeight / 2 },
            'level_up'
          ),
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        );
        break;
    }
    
    return {
      action,
      enhancements,
      duration: this.calculateTotalDuration(enhancements)
    };
  }
  
  private calculateTotalDuration(enhancements: any[]): number {
    // Calculate the longest running enhancement
    return Math.max(...enhancements.map(e => e.totalDuration || 500));
  }
}

interface EnhancedAction {
  action: string;
  enhancements: any[];
  duration: number;
}

export default GameFeelEnhancer;