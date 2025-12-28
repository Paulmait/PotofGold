import { offlineManager } from './offlineManager';

export interface MissedCoin {
  id: string;
  x: number;
  y: number;
  timestamp: number;
  value: number;
}

export interface BlockageZone {
  id: string;
  x: number;
  width: number;
  height: number;
  coinCount: number;
  blockageLevel: number; // 0-1, how blocked the area is
}

export interface BlockageState {
  userId: string;
  missedCoins: MissedCoin[];
  blockageZones: BlockageZone[];
  totalBlockage: number; // 0-1, overall blockage level
  warningShown: boolean;
  gameOverThreshold: number;
  lastUpdated: Date;
}

export class BlockageSystem {
  private static instance: BlockageSystem;
  private state: BlockageState | null = null;
  private readonly SCREEN_WIDTH = 400; // Adjust based on your game
  private readonly ZONE_WIDTH = 50; // Width of each blockage zone
  private readonly WARNING_THRESHOLD = 0.25; // 25% blockage warning
  private readonly GAME_OVER_THRESHOLD = 0.75; // 75% blockage = game over

  static getInstance(): BlockageSystem {
    if (!BlockageSystem.instance) {
      BlockageSystem.instance = new BlockageSystem();
    }
    return BlockageSystem.instance;
  }

  // Initialize blockage system
  async initializeBlockage(userId: string): Promise<BlockageState> {
    try {
      const offlineData = await offlineManager.getOfflineData(userId);

      if (offlineData.blockageState) {
        this.state = offlineData.blockageState;
        return this.state;
      }
    } catch (error) {
      console.log('Error loading blockage data:', error);
    }

    // Create default blockage state
    this.state = {
      userId,
      missedCoins: [],
      blockageZones: this.initializeBlockageZones(),
      totalBlockage: 0,
      warningShown: false,
      gameOverThreshold: this.GAME_OVER_THRESHOLD,
      lastUpdated: new Date(),
    };

    await this.saveBlockageState();
    return this.state;
  }

  // Initialize blockage zones
  private initializeBlockageZones(): BlockageZone[] {
    const zones: BlockageZone[] = [];
    const zoneCount = Math.floor(this.SCREEN_WIDTH / this.ZONE_WIDTH);

    for (let i = 0; i < zoneCount; i++) {
      zones.push({
        id: `zone_${i}`,
        x: i * this.ZONE_WIDTH,
        width: this.ZONE_WIDTH,
        height: 100, // Height of blockage area
        coinCount: 0,
        blockageLevel: 0,
      });
    }

    return zones;
  }

  // Add a missed coin
  async addMissedCoin(
    x: number,
    y: number,
    value: number = 1
  ): Promise<{
    success: boolean;
    warningTriggered: boolean;
    gameOverTriggered: boolean;
  }> {
    if (!this.state) {
      return { success: false, warningTriggered: false, gameOverTriggered: false };
    }

    const missedCoin: MissedCoin = {
      id: `coin_${Date.now()}_${Math.random()}`,
      x,
      y,
      timestamp: Date.now(),
      value,
    };

    this.state.missedCoins.push(missedCoin);

    // Update blockage zones
    this.updateBlockageZones();

    // Check for warnings and game over
    const warningTriggered = this.checkWarningThreshold();
    const gameOverTriggered = this.checkGameOverThreshold();

    await this.saveBlockageState();

    return {
      success: true,
      warningTriggered,
      gameOverTriggered,
    };
  }

  // Update blockage zones based on missed coins
  private updateBlockageZones(): void {
    if (!this.state) return;

    // Reset zone counts
    this.state.blockageZones.forEach((zone) => {
      zone.coinCount = 0;
      zone.blockageLevel = 0;
    });

    // Count coins in each zone
    this.state.missedCoins.forEach((coin) => {
      const zoneIndex = Math.floor(coin.x / this.ZONE_WIDTH);
      if (zoneIndex >= 0 && zoneIndex < this.state!.blockageZones.length) {
        this.state!.blockageZones[zoneIndex].coinCount++;
      }
    });

    // Calculate blockage levels
    this.state.blockageZones.forEach((zone) => {
      // Each coin adds 0.1 to blockage level, max 1.0
      zone.blockageLevel = Math.min(zone.coinCount * 0.1, 1.0);
    });

    // Calculate total blockage
    const totalBlockage =
      this.state.blockageZones.reduce((sum, zone) => {
        return sum + zone.blockageLevel;
      }, 0) / this.state.blockageZones.length;

    this.state.totalBlockage = totalBlockage;
  }

  // Check if warning should be shown
  private checkWarningThreshold(): boolean {
    if (!this.state || this.state.warningShown) return false;

    if (this.state.totalBlockage >= this.WARNING_THRESHOLD) {
      this.state.warningShown = true;
      return true;
    }

    return false;
  }

  // Check if game over should be triggered
  private checkGameOverThreshold(): boolean {
    if (!this.state) return false;

    return this.state.totalBlockage >= this.state.gameOverThreshold;
  }

  // Clear all missed coins (bonus power-up)
  async clearAllMissedCoins(): Promise<{
    success: boolean;
    coinsCleared: number;
  }> {
    if (!this.state) {
      return { success: false, coinsCleared: 0 };
    }

    const coinsCleared = this.state.missedCoins.length;
    this.state.missedCoins = [];
    this.state.warningShown = false;

    // Reset blockage zones
    this.updateBlockageZones();

    await this.saveBlockageState();

    return {
      success: true,
      coinsCleared,
    };
  }

  // Vacuum power-up: suck up missed coins in range
  async vacuumCoinsInRange(
    centerX: number,
    range: number
  ): Promise<{
    success: boolean;
    coinsVacuumed: number;
    totalValue: number;
  }> {
    if (!this.state) {
      return { success: false, coinsVacuumed: 0, totalValue: 0 };
    }

    const coinsInRange = this.state.missedCoins.filter((coin) => {
      const distance = Math.abs(coin.x - centerX);
      return distance <= range;
    });

    const totalValue = coinsInRange.reduce((sum, coin) => sum + coin.value, 0);

    // Remove vacuumed coins
    this.state.missedCoins = this.state.missedCoins.filter((coin) => {
      const distance = Math.abs(coin.x - centerX);
      return distance > range;
    });

    // Update blockage zones
    this.updateBlockageZones();

    await this.saveBlockageState();

    return {
      success: true,
      coinsVacuumed: coinsInRange.length,
      totalValue,
    };
  }

  // Get blockage statistics
  getBlockageStats(): {
    totalMissedCoins: number;
    totalBlockage: number;
    warningThreshold: number;
    gameOverThreshold: number;
    zonesBlocked: number;
  } {
    if (!this.state) {
      return {
        totalMissedCoins: 0,
        totalBlockage: 0,
        warningThreshold: this.WARNING_THRESHOLD,
        gameOverThreshold: this.GAME_OVER_THRESHOLD,
        zonesBlocked: 0,
      };
    }

    const zonesBlocked = this.state.blockageZones.filter((zone) => zone.blockageLevel > 0).length;

    return {
      totalMissedCoins: this.state.missedCoins.length,
      totalBlockage: this.state.totalBlockage,
      warningThreshold: this.WARNING_THRESHOLD,
      gameOverThreshold: this.state.gameOverThreshold,
      zonesBlocked,
    };
  }

  // Get missed coins for rendering
  getMissedCoins(): MissedCoin[] {
    if (!this.state) return [];
    return this.state.missedCoins;
  }

  // Get blockage zones for rendering
  getBlockageZones(): BlockageZone[] {
    if (!this.state) return [];
    return this.state.blockageZones;
  }

  // Check if pot can move to position
  canPotMoveTo(x: number): boolean {
    if (!this.state) return true;

    const zoneIndex = Math.floor(x / this.ZONE_WIDTH);
    if (zoneIndex >= 0 && zoneIndex < this.state.blockageZones.length) {
      const zone = this.state.blockageZones[zoneIndex];
      // Pot can't move if zone is more than 80% blocked
      return zone.blockageLevel < 0.8;
    }

    return true;
  }

  // Reset blockage for new level
  async resetBlockage(): Promise<void> {
    if (!this.state) return;

    this.state.missedCoins = [];
    this.state.warningShown = false;
    this.updateBlockageZones();

    await this.saveBlockageState();
  }

  // Save blockage state
  private async saveBlockageState(): Promise<void> {
    if (!this.state) return;

    try {
      await offlineManager.saveOfflineData(this.state.userId, {
        blockageState: this.state,
      });

      await offlineManager.addPendingAction(this.state.userId, {
        type: 'blockage_update',
        data: this.state,
      });
    } catch (error) {
      console.log('Error saving blockage state:', error);
    }
  }
}

export const blockageSystem = BlockageSystem.getInstance();
