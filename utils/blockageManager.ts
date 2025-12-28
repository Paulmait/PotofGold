import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export interface Blockage {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  health: number;
  maxHealth: number;
  isBreaking: boolean;
}

export interface BlockageLayer {
  level: number;
  blockages: Blockage[];
  totalHeight: number;
}

class BlockageManager {
  private blockageLayers: BlockageLayer[] = [];
  private maxLayers: number = 5;
  private blockageHeight: number = 20;
  private blockageSpacing: number = 2;
  private dangerThreshold: number = 0.7; // 70% of screen height

  constructor() {
    this.reset();
  }

  reset() {
    this.blockageLayers = [];
  }

  // Add a missed item as blockage
  addMissedItem(item: { x: number; type: string; size?: number }) {
    const blockageWidth = item.size || 40;

    // Find the lowest layer that doesn't have a blockage at this position
    let targetLayer = this.findTargetLayer(item.x, blockageWidth);

    if (targetLayer === -1) {
      // Create new layer if needed and not at max
      if (this.blockageLayers.length < this.maxLayers) {
        targetLayer = this.blockageLayers.length;
        this.blockageLayers.push({
          level: targetLayer,
          blockages: [],
          totalHeight: 0,
        });
      } else {
        // Max layers reached - game should probably end
        return { gameOver: true, reason: 'Maximum blockage reached' };
      }
    }

    const layer = this.blockageLayers[targetLayer];
    const blockage: Blockage = {
      id: `blockage_${Date.now()}_${Math.random()}`,
      x: item.x - blockageWidth / 2,
      y: height - 120 - targetLayer * (this.blockageHeight + this.blockageSpacing), // Position on rail track level
      width: blockageWidth,
      height: this.blockageHeight,
      type: item.type,
      health: this.getBlockageHealth(item.type),
      maxHealth: this.getBlockageHealth(item.type),
      isBreaking: false,
    };

    layer.blockages.push(blockage);
    layer.totalHeight = (targetLayer + 1) * (this.blockageHeight + this.blockageSpacing);

    // Check if blockage is getting dangerous
    const blockagePercentage = this.getBlockagePercentage();

    return {
      gameOver: false,
      blockage,
      isDangerous: blockagePercentage > this.dangerThreshold,
      blockagePercentage,
    };
  }

  // Find which layer to add blockage to
  private findTargetLayer(x: number, width: number): number {
    for (let i = 0; i < this.blockageLayers.length; i++) {
      const layer = this.blockageLayers[i];
      const hasCollision = layer.blockages.some((b) => this.checkOverlap(x, width, b.x, b.width));

      if (!hasCollision) {
        return i;
      }
    }

    return -1; // Need new layer
  }

  // Check if two horizontal ranges overlap
  private checkOverlap(x1: number, w1: number, x2: number, w2: number): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2;
  }

  // Get blockage health based on item type
  private getBlockageHealth(type: string): number {
    switch (type) {
      case 'bomb':
        return 3; // Bombs create stronger blockages
      case 'diamond':
      case 'gem':
        return 2;
      default:
        return 1;
    }
  }

  // Check if cart can pass through
  checkCartPassage(
    cartX: number,
    cartWidth: number
  ): {
    canPass: boolean;
    collidingBlockages: Blockage[];
  } {
    const collidingBlockages: Blockage[] = [];

    for (const layer of this.blockageLayers) {
      for (const blockage of layer.blockages) {
        if (this.checkOverlap(cartX, cartWidth, blockage.x, blockage.width)) {
          collidingBlockages.push(blockage);
        }
      }
    }

    return {
      canPass: collidingBlockages.length === 0,
      collidingBlockages,
    };
  }

  // Damage blockage (when using power-ups or special abilities)
  damageBlockage(
    blockageId: string,
    damage: number = 1
  ): {
    destroyed: boolean;
    blockage: Blockage | null;
  } {
    for (const layer of this.blockageLayers) {
      const blockageIndex = layer.blockages.findIndex((b) => b.id === blockageId);

      if (blockageIndex !== -1) {
        const blockage = layer.blockages[blockageIndex];
        blockage.health -= damage;

        if (blockage.health <= 0) {
          // Remove destroyed blockage
          layer.blockages.splice(blockageIndex, 1);

          // Clean up empty layers
          if (layer.blockages.length === 0) {
            const layerIndex = this.blockageLayers.indexOf(layer);
            this.blockageLayers.splice(layerIndex, 1);

            // Shift remaining layers down
            this.reorganizeLayers();
          }

          return { destroyed: true, blockage };
        } else {
          blockage.isBreaking = true;
          return { destroyed: false, blockage };
        }
      }
    }

    return { destroyed: false, blockage: null };
  }

  // Clear blockages with power-up
  clearBlockages(percentage: number = 1): number {
    const totalBlockages = this.getAllBlockages().length;
    const toClear = Math.ceil(totalBlockages * percentage);
    let cleared = 0;

    // Clear from top layers first
    for (let i = this.blockageLayers.length - 1; i >= 0 && cleared < toClear; i--) {
      const layer = this.blockageLayers[i];
      const toRemove = Math.min(layer.blockages.length, toClear - cleared);

      layer.blockages.splice(0, toRemove);
      cleared += toRemove;

      if (layer.blockages.length === 0) {
        this.blockageLayers.splice(i, 1);
      }
    }

    this.reorganizeLayers();
    return cleared;
  }

  // Reorganize layers after removal
  private reorganizeLayers() {
    this.blockageLayers.forEach((layer, index) => {
      layer.level = index;
      layer.blockages.forEach((blockage) => {
        blockage.y = height - 100 - index * (this.blockageHeight + this.blockageSpacing);
      });
    });
  }

  // Get all blockages for rendering
  getAllBlockages(): Blockage[] {
    return this.blockageLayers.flatMap((layer) => layer.blockages);
  }

  // Get blockage fill percentage (for UI display)
  getBlockagePercentage(): number {
    const totalPossibleHeight = this.maxLayers * (this.blockageHeight + this.blockageSpacing);
    const currentHeight = this.blockageLayers.length * (this.blockageHeight + this.blockageSpacing);
    return currentHeight / totalPossibleHeight;
  }

  // Check if game should end due to blockage
  isGameOver(): boolean {
    return this.blockageLayers.length >= this.maxLayers;
  }

  // Get visual warning level
  getWarningLevel(): 'safe' | 'warning' | 'danger' | 'critical' {
    const percentage = this.getBlockagePercentage();

    if (percentage < 0.3) return 'safe';
    if (percentage < 0.5) return 'warning';
    if (percentage < 0.7) return 'danger';
    return 'critical';
  }
}

export const blockageManager = new BlockageManager();
