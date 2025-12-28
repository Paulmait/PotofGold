import { Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export interface BlockedItem {
  id: string;
  type: 'rock' | 'ice' | 'wood' | 'metal' | 'crystal';
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  requiresPowerUp?: string;
  dropsReward: boolean;
}

export interface ClearingPowerUp {
  id: string;
  type: 'shovel' | 'pickaxe' | 'hammer' | 'dynamite' | 'magnet' | 'laser';
  level: number;
  damage: number;
  range: number;
  cooldown: number;
  lastUsed: number;
  cost: {
    coins?: number;
    gems?: number;
    energy?: number;
  };
}

export class BlockingMechanicsSystem {
  private blockedItems: BlockedItem[] = [];
  private powerUps: Map<string, ClearingPowerUp> = new Map();
  private pathWidth: number = width;
  private blockThreshold: number = 0.7; // 70% blocked = game over
  private difficultyLevel: number = 1;
  private autoSpawnEnabled: boolean = true;

  constructor() {
    this.initializePowerUps();
  }

  private initializePowerUps() {
    // Default power-ups available
    const defaultPowerUps: ClearingPowerUp[] = [
      {
        id: 'basic_shovel',
        type: 'shovel',
        level: 1,
        damage: 1,
        range: 50,
        cooldown: 1000,
        lastUsed: 0,
        cost: { energy: 1 },
      },
      {
        id: 'coin_magnet',
        type: 'magnet',
        level: 1,
        damage: 0,
        range: 100,
        cooldown: 5000,
        lastUsed: 0,
        cost: { energy: 2 },
      },
    ];

    defaultPowerUps.forEach((powerUp) => {
      this.powerUps.set(powerUp.id, powerUp);
    });
  }

  // Spawn blocking items based on difficulty
  spawnBlockingItem(currentLevel: number): BlockedItem | null {
    if (!this.autoSpawnEnabled) return null;

    const spawnChance = this.calculateSpawnChance(currentLevel);
    if (Math.random() > spawnChance) return null;

    const blockType = this.selectBlockType(currentLevel);
    const position = this.calculateSpawnPosition();

    const blockConfig = this.getBlockConfig(blockType);

    const newBlock: BlockedItem = {
      id: `block_${Date.now()}_${Math.random()}`,
      type: blockType,
      x: position.x,
      y: -100, // Start above screen
      width: blockConfig.width,
      height: blockConfig.height,
      health: blockConfig.health,
      maxHealth: blockConfig.health,
      requiresPowerUp: blockConfig.requiresPowerUp,
      dropsReward: Math.random() < 0.3, // 30% chance to drop reward
    };

    this.blockedItems.push(newBlock);
    return newBlock;
  }

  private calculateSpawnChance(level: number): number {
    // Increase spawn chance with level
    const baseChance = 0.1;
    const levelMultiplier = level * 0.02;
    return Math.min(baseChance + levelMultiplier, 0.5); // Max 50% chance
  }

  private selectBlockType(level: number): BlockedItem['type'] {
    const types: Array<{ type: BlockedItem['type']; minLevel: number; weight: number }> = [
      { type: 'wood', minLevel: 1, weight: 40 },
      { type: 'rock', minLevel: 3, weight: 30 },
      { type: 'ice', minLevel: 5, weight: 20 },
      { type: 'metal', minLevel: 8, weight: 15 },
      { type: 'crystal', minLevel: 12, weight: 10 },
    ];

    const availableTypes = types.filter((t) => level >= t.minLevel);
    const totalWeight = availableTypes.reduce((sum, t) => sum + t.weight, 0);

    let random = Math.random() * totalWeight;
    for (const typeConfig of availableTypes) {
      random -= typeConfig.weight;
      if (random <= 0) {
        return typeConfig.type;
      }
    }

    return 'wood'; // Fallback
  }

  private calculateSpawnPosition(): { x: number; y: number } {
    // Spawn in lanes to create strategic placement
    const lanes = 5;
    const laneWidth = this.pathWidth / lanes;
    const lane = Math.floor(Math.random() * lanes);

    return {
      x: lane * laneWidth + laneWidth / 2 - 25, // Center in lane
      y: -100,
    };
  }

  private getBlockConfig(type: BlockedItem['type']) {
    const configs = {
      wood: {
        width: 50,
        height: 50,
        health: 2,
        requiresPowerUp: undefined,
      },
      rock: {
        width: 60,
        height: 60,
        health: 3,
        requiresPowerUp: 'pickaxe',
      },
      ice: {
        width: 55,
        height: 55,
        health: 2,
        requiresPowerUp: 'hammer',
      },
      metal: {
        width: 65,
        height: 65,
        health: 5,
        requiresPowerUp: 'laser',
      },
      crystal: {
        width: 70,
        height: 70,
        health: 4,
        requiresPowerUp: 'dynamite',
      },
    };

    return configs[type];
  }

  // Update blocking items positions
  updateBlockingItems(deltaTime: number, fallSpeed: number): void {
    this.blockedItems = this.blockedItems
      .map((block) => ({
        ...block,
        y: block.y + fallSpeed * deltaTime,
      }))
      .filter((block) => block.y < height + 100); // Remove off-screen blocks
  }

  // Check if path is blocked
  isPathBlocked(cartX: number, cartWidth: number): boolean {
    const blockingItemsInPath = this.blockedItems.filter((block) => {
      const isInVerticalRange = block.y > height - 200 && block.y < height - 50;
      const isInHorizontalRange = block.x < cartX + cartWidth && block.x + block.width > cartX;

      return isInVerticalRange && isInHorizontalRange;
    });

    const blockedWidth = blockingItemsInPath.reduce((total, block) => total + block.width, 0);

    const blockPercentage = blockedWidth / this.pathWidth;
    return blockPercentage >= this.blockThreshold;
  }

  // Get blocking items in cart's path
  getBlockingItemsInPath(cartX: number, cartWidth: number): BlockedItem[] {
    return this.blockedItems.filter((block) => {
      const isInVerticalRange = block.y > height - 250 && block.y < height;
      const isInHorizontalRange = block.x < cartX + cartWidth && block.x + block.width > cartX;

      return isInVerticalRange && isInHorizontalRange;
    });
  }

  // Use power-up to clear blocks
  usePowerUp(
    powerUpId: string,
    targetX: number,
    targetY: number
  ): {
    cleared: BlockedItem[];
    rewards: any[];
    energyUsed: number;
  } {
    const powerUp = this.powerUps.get(powerUpId);
    if (!powerUp) {
      return { cleared: [], rewards: [], energyUsed: 0 };
    }

    // Check cooldown
    const now = Date.now();
    if (now - powerUp.lastUsed < powerUp.cooldown) {
      return { cleared: [], rewards: [], energyUsed: 0 };
    }

    // Find blocks in range
    const blocksInRange = this.blockedItems.filter((block) => {
      const distance = Math.sqrt(Math.pow(block.x - targetX, 2) + Math.pow(block.y - targetY, 2));
      return distance <= powerUp.range;
    });

    const clearedBlocks: BlockedItem[] = [];
    const rewards: any[] = [];

    // Apply damage to blocks
    blocksInRange.forEach((block) => {
      // Check if power-up can damage this block type
      if (block.requiresPowerUp && block.requiresPowerUp !== powerUp.type) {
        return; // Can't damage this block with this power-up
      }

      block.health -= powerUp.damage;

      if (block.health <= 0) {
        clearedBlocks.push(block);

        // Generate rewards
        if (block.dropsReward) {
          rewards.push(this.generateBlockReward(block));
        }

        // Remove from active blocks
        this.blockedItems = this.blockedItems.filter((b) => b.id !== block.id);
      }
    });

    // Update power-up cooldown
    powerUp.lastUsed = now;

    // Haptic feedback
    if (clearedBlocks.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    return {
      cleared: clearedBlocks,
      rewards,
      energyUsed: powerUp.cost.energy || 0,
    };
  }

  private generateBlockReward(block: BlockedItem): any {
    const rewardTypes = {
      wood: { coins: 5, exp: 10 },
      rock: { coins: 10, gems: 1, exp: 20 },
      ice: { coins: 15, powerUpCharge: 1, exp: 25 },
      metal: { coins: 25, gems: 2, exp: 40 },
      crystal: { coins: 50, gems: 5, rareItem: true, exp: 60 },
    };

    return {
      ...rewardTypes[block.type],
      position: { x: block.x, y: block.y },
    };
  }

  // Upgrade power-up
  upgradePowerUp(powerUpId: string): boolean {
    const powerUp = this.powerUps.get(powerUpId);
    if (!powerUp) return false;

    powerUp.level++;
    powerUp.damage = Math.floor(powerUp.damage * 1.5);
    powerUp.range = Math.floor(powerUp.range * 1.2);
    powerUp.cooldown = Math.max(500, powerUp.cooldown * 0.9);

    return true;
  }

  // Get available power-ups for UI
  getAvailablePowerUps(): ClearingPowerUp[] {
    return Array.from(this.powerUps.values()).filter((powerUp) => {
      const now = Date.now();
      return now - powerUp.lastUsed >= powerUp.cooldown;
    });
  }

  // Calculate block density for difficulty scaling
  getBlockDensity(): number {
    const screenArea = width * height;
    const blockArea = this.blockedItems.reduce(
      (total, block) => total + block.width * block.height,
      0
    );

    return blockArea / screenArea;
  }

  // Clear all blocks (for power-up or special event)
  clearAllBlocks(): BlockedItem[] {
    const cleared = [...this.blockedItems];
    this.blockedItems = [];
    return cleared;
  }

  // Check if specific power-up is needed
  isPowerUpRequired(): string | null {
    const requiredPowerUps = new Set<string>();

    this.blockedItems.forEach((block) => {
      if (block.requiresPowerUp) {
        requiredPowerUps.add(block.requiresPowerUp);
      }
    });

    if (requiredPowerUps.size > 0) {
      return Array.from(requiredPowerUps)[0];
    }

    return null;
  }

  // Save/Load for game persistence
  saveState(): string {
    return JSON.stringify({
      blockedItems: this.blockedItems,
      powerUps: Array.from(this.powerUps.entries()),
      difficultyLevel: this.difficultyLevel,
    });
  }

  loadState(state: string): void {
    try {
      const data = JSON.parse(state);
      this.blockedItems = data.blockedItems || [];
      this.powerUps = new Map(data.powerUps || []);
      this.difficultyLevel = data.difficultyLevel || 1;
    } catch (error) {
      console.error('Failed to load blocking mechanics state:', error);
    }
  }

  // Cleanup
  reset(): void {
    this.blockedItems = [];
    this.initializePowerUps();
    this.difficultyLevel = 1;
  }
}

export const blockingMechanics = new BlockingMechanicsSystem();
