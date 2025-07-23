import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'coin' | 'bonus' | 'powerup';
  powerUpType?: 'magnet' | 'slowMotion' | 'doublePoints' | 'goldRush';
  value: number;
  speed: number;
}

export interface Pot {
  x: number;
  y: number;
  width: number;
  height: number;
  magnetActive: boolean;
  magnetRadius: number;
}

export class GamePhysics {
  private static instance: GamePhysics;
  
  static getInstance(): GamePhysics {
    if (!GamePhysics.instance) {
      GamePhysics.instance = new GamePhysics();
    }
    return GamePhysics.instance;
  }

  // Check collision between two objects
  checkCollision(obj1: GameObject, obj2: GameObject): boolean {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }

  // Check collision between game object and pot
  checkPotCollision(obj: GameObject, pot: Pot): boolean {
    // Basic collision detection
    const basicCollision = (
      obj.x < pot.x + pot.width &&
      obj.x + obj.width > pot.x &&
      obj.y < pot.y + pot.height &&
      obj.y + obj.height > pot.y
    );

    if (basicCollision) return true;

    // Magnet effect collision detection
    if (pot.magnetActive) {
      const objCenterX = obj.x + obj.width / 2;
      const objCenterY = obj.y + obj.height / 2;
      const potCenterX = pot.x + pot.width / 2;
      const potCenterY = pot.y + pot.height / 2;

      const distance = Math.sqrt(
        Math.pow(objCenterX - potCenterX, 2) + 
        Math.pow(objCenterY - potCenterY, 2)
      );

      return distance <= pot.magnetRadius;
    }

    return false;
  }

  // Calculate magnet attraction force
  calculateMagnetForce(obj: GameObject, pot: Pot): { x: number; y: number } {
    if (!pot.magnetActive) return { x: 0, y: 0 };

    const objCenterX = obj.x + obj.width / 2;
    const objCenterY = obj.y + obj.height / 2;
    const potCenterX = pot.x + pot.width / 2;
    const potCenterY = pot.y + pot.height / 2;

    const distance = Math.sqrt(
      Math.pow(objCenterX - potCenterX, 2) + 
      Math.pow(objCenterY - potCenterY, 2)
    );

    if (distance > pot.magnetRadius) return { x: 0, y: 0 };

    const force = Math.max(0, (pot.magnetRadius - distance) / pot.magnetRadius);
    const angle = Math.atan2(potCenterY - objCenterY, potCenterX - objCenterX);

    return {
      x: Math.cos(angle) * force * 2,
      y: Math.sin(angle) * force * 2
    };
  }

  // Update object position based on physics
  updateObjectPosition(obj: GameObject, pot: Pot, deltaTime: number): GameObject {
    let newX = obj.x;
    let newY = obj.y + obj.speed * deltaTime;

    // Apply magnet force if active
    if (pot.magnetActive) {
      const magnetForce = this.calculateMagnetForce(obj, pot);
      newX += magnetForce.x * deltaTime;
      newY += magnetForce.y * deltaTime;
    }

    // Keep object within screen bounds
    newX = Math.max(0, Math.min(width - obj.width, newX));

    return {
      ...obj,
      x: newX,
      y: newY
    };
  }

  // Generate random spawn position
  generateSpawnPosition(): { x: number; y: number } {
    return {
      x: Math.random() * (width - 40),
      y: -50
    };
  }

  // Calculate score based on object type and value
  calculateScore(obj: GameObject, multiplier: number = 1): number {
    let baseScore = obj.value;
    
    if (obj.type === 'bonus') {
      baseScore *= 2;
    }
    
    return Math.floor(baseScore * multiplier);
  }

  // Calculate game speed based on level and time
  calculateGameSpeed(level: number, gameTime: number): number {
    const baseSpeed = 1;
    const levelMultiplier = 1 + (level - 1) * 0.1;
    const timeMultiplier = 1 + (gameTime / 60000) * 0.5; // Increase speed every minute
    
    return Math.min(baseSpeed * levelMultiplier * timeMultiplier, 3);
  }

  // Check if object is off screen
  isOffScreen(obj: GameObject): boolean {
    return obj.y > height + 50;
  }

  // Calculate pot movement based on touch input
  calculatePotMovement(
    currentX: number, 
    targetX: number, 
    speed: number, 
    deltaTime: number
  ): number {
    const distance = targetX - currentX;
    const maxDistance = speed * deltaTime;
    
    if (Math.abs(distance) <= maxDistance) {
      return targetX;
    }
    
    return currentX + Math.sign(distance) * maxDistance;
  }

  // Generate power-up with weighted probability
  generatePowerUp(): GameObject['powerUpType'] | null {
    const powerUps: Array<{ type: GameObject['powerUpType']; weight: number }> = [
      { type: 'magnet', weight: 0.3 },
      { type: 'slowMotion', weight: 0.25 },
      { type: 'doublePoints', weight: 0.25 },
      { type: 'goldRush', weight: 0.2 }
    ];

    const totalWeight = powerUps.reduce((sum, powerUp) => sum + powerUp.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const powerUp of powerUps) {
      currentWeight += powerUp.weight;
      if (random <= currentWeight) {
        return powerUp.type;
      }
    }
    
    return null;
  }

  // Calculate coin value based on rarity
  calculateCoinValue(): number {
    const random = Math.random();
    
    if (random < 0.6) return 1;      // 60% chance - regular coin
    if (random < 0.85) return 5;     // 25% chance - silver coin
    if (random < 0.95) return 10;    // 10% chance - gold coin
    if (random < 0.98) return 25;    // 3% chance - diamond coin
    return 50;                        // 2% chance - rainbow coin
  }
}

export default GamePhysics.getInstance(); 