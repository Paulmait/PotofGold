import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export interface FallingObject {
  id: string;
  x: number;
  y: number;
  speed: number;
  direction: number; // radians
  wobble: number;
  wobbleSpeed: number;
  wobbleOffset: number;
  type: 'coin' | 'bonus' | 'powerup';
  value: number;
  powerUpType?: 'magnet' | 'slowMotion' | 'doublePoints' | 'goldRush';
}

export interface PhysicsConfig {
  baseSpeed: number;
  speedVariation: number;
  directionVariation: number;
  wobbleIntensity: number;
  windEffect: number;
  gravity: number;
}

export class DynamicPhysics {
  private static instance: DynamicPhysics;
  private config: PhysicsConfig;
  private windDirection: number = 0;
  private windChangeTimer: number = 0;

  static getInstance(): DynamicPhysics {
    if (!DynamicPhysics.instance) {
      DynamicPhysics.instance = new DynamicPhysics();
    }
    return DynamicPhysics.instance;
  }

  constructor() {
    this.config = {
      baseSpeed: 2,
      speedVariation: 0.5,
      directionVariation: 0.3,
      wobbleIntensity: 0.1,
      windEffect: 0.05,
      gravity: 0.1,
    };
  }

  // Update physics based on game level
  updatePhysicsForLevel(level: number): void {
    const difficultyMultiplier = Math.min(1 + (level - 1) * 0.1, 3);

    this.config = {
      baseSpeed: 2 * difficultyMultiplier,
      speedVariation: 0.5 * difficultyMultiplier,
      directionVariation: 0.3 * difficultyMultiplier,
      wobbleIntensity: 0.1 * difficultyMultiplier,
      windEffect: 0.05 * difficultyMultiplier,
      gravity: 0.1 * difficultyMultiplier,
    };
  }

  // Generate dynamic falling object
  generateFallingObject(level: number): FallingObject {
    const baseSpeed = this.config.baseSpeed;
    const speedVariation = this.config.speedVariation;
    const directionVariation = this.config.directionVariation;

    // Vary speed based on level
    const speed = baseSpeed + (Math.random() - 0.5) * speedVariation;

    // Vary direction (mostly downward with some variation)
    const baseDirection = Math.PI / 2; // Downward
    const direction = baseDirection + (Math.random() - 0.5) * directionVariation;

    // Add wobble effect
    const wobble = Math.random() * this.config.wobbleIntensity;
    const wobbleSpeed = 0.02 + Math.random() * 0.03;
    const wobbleOffset = Math.random() * Math.PI * 2;

    // Determine object type based on level and probability
    const type = this.determineObjectType(level);
    const value = this.calculateObjectValue(type, level);

    return {
      id: `obj_${Date.now()}_${Math.random()}`,
      x: Math.random() * (width - 40),
      y: -50,
      speed,
      direction,
      wobble,
      wobbleSpeed,
      wobbleOffset,
      type,
      value,
      powerUpType: type === 'powerup' ? this.getRandomPowerUp() : undefined,
    };
  }

  // Update object position with dynamic physics
  updateObjectPosition(obj: FallingObject, deltaTime: number): void {
    // Apply wind effect
    this.updateWind(deltaTime);
    const windInfluence = Math.sin(this.windDirection) * this.config.windEffect;

    // Calculate new position with wobble
    const wobbleX = Math.sin(obj.wobbleOffset + obj.wobbleSpeed * deltaTime) * obj.wobble;

    // Update position
    obj.x += Math.cos(obj.direction) * obj.speed * deltaTime + windInfluence + wobbleX;
    obj.y += Math.sin(obj.direction) * obj.speed * deltaTime + this.config.gravity * deltaTime;

    // Keep object within bounds
    obj.x = Math.max(0, Math.min(width - 40, obj.x));
  }

  // Determine object type based on level
  private determineObjectType(level: number): 'coin' | 'bonus' | 'powerup' {
    const rand = Math.random();

    // Power-up probability increases with level
    const powerUpChance = Math.min(0.05 + (level - 1) * 0.01, 0.15);

    if (rand < powerUpChance) {
      return 'powerup';
    } else if (rand < 0.3) {
      return 'bonus';
    } else {
      return 'coin';
    }
  }

  // Calculate object value based on type and level
  private calculateObjectValue(type: string, level: number): number {
    const levelMultiplier = 1 + (level - 1) * 0.2;

    switch (type) {
      case 'coin':
        return Math.floor((1 + Math.random() * 2) * levelMultiplier);
      case 'bonus':
        return Math.floor((5 + Math.random() * 10) * levelMultiplier);
      case 'powerup':
        return 0; // Power-ups don't have coin value
      default:
        return 1;
    }
  }

  // Get random power-up type
  private getRandomPowerUp(): 'magnet' | 'slowMotion' | 'doublePoints' | 'goldRush' {
    const powerUps = ['magnet', 'slowMotion', 'doublePoints', 'goldRush'];
    return powerUps[Math.floor(Math.random() * powerUps.length)] as any;
  }

  // Update wind direction over time
  private updateWind(deltaTime: number): void {
    this.windChangeTimer += deltaTime;
    if (this.windChangeTimer > 5000) {
      // Change wind every 5 seconds
      this.windDirection += (Math.random() - 0.5) * Math.PI;
      this.windChangeTimer = 0;
    }
  }

  // Get physics configuration for UI display
  getPhysicsConfig(): PhysicsConfig {
    return { ...this.config };
  }

  // Reset physics for new game
  resetPhysics(): void {
    this.windDirection = 0;
    this.windChangeTimer = 0;
  }
}

export const dynamicPhysics = DynamicPhysics.getInstance();
