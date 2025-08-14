import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MonthlyDrop {
  month: string;
  displayName: string;
  theme: string;
  drops: {
    cartSkin?: {
      id: string;
      name: string;
      description: string;
      rarity: string;
      imageUrl: string;
      unlockCondition: string;
    };
    trail?: {
      id: string;
      name: string;
      description: string;
      rarity: string;
      imageUrl: string;
      particleConfig?: any;
    };
    badge?: {
      id: string;
      name: string;
      description: string;
      rarity: string;
      imageUrl: string;
      animated?: boolean;
      glowEffect?: boolean;
    };
    bonusCoins?: number;
    bonusXpMultiplier?: number;
    specialItem?: {
      id: string;
      name: string;
      description: string;
      type: string;
      effect?: any;
    };
  };
  availability: {
    startDate: string;
    endDate: string;
    requiresSubscription: boolean;
    autoGrant: boolean;
  };
}

class MonthlyDropsService {
  private static instance: MonthlyDropsService;
  private currentDrops: Map<string, MonthlyDrop> = new Map();
  private claimedDrops: Set<string> = new Set();
  private readonly CLAIMED_KEY = 'monthly_drops_claimed';

  static getInstance(): MonthlyDropsService {
    if (!MonthlyDropsService.instance) {
      MonthlyDropsService.instance = new MonthlyDropsService();
    }
    return MonthlyDropsService.instance;
  }

  async initialize(): Promise<void> {
    await this.loadClaimedDrops();
    await this.loadAllDrops();
  }

  private async loadClaimedDrops(): Promise<void> {
    try {
      const claimed = await AsyncStorage.getItem(this.CLAIMED_KEY);
      if (claimed) {
        this.claimedDrops = new Set(JSON.parse(claimed));
      }
    } catch (error) {
      console.error('Error loading claimed drops:', error);
    }
  }

  private async saveClaimedDrops(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.CLAIMED_KEY,
        JSON.stringify(Array.from(this.claimedDrops))
      );
    } catch (error) {
      console.error('Error saving claimed drops:', error);
    }
  }

  private async loadAllDrops(): Promise<void> {
    // In production, this would load from a remote server
    // For now, we'll hardcode the available drops
    const drops = [
      require('../../../assets/drops/month_2024_01.json'),
      require('../../../assets/drops/month_2024_02.json'),
      require('../../../assets/drops/month_2024_03.json'),
    ];

    drops.forEach(drop => {
      this.currentDrops.set(drop.month, drop);
    });
  }

  getCurrentMonthDrop(): MonthlyDrop | null {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
    return this.currentDrops.get(currentMonth) || null;
  }

  getAvailableDrops(): MonthlyDrop[] {
    const now = new Date();
    return Array.from(this.currentDrops.values()).filter(drop => {
      const start = new Date(drop.availability.startDate);
      const end = new Date(drop.availability.endDate);
      return now >= start && now <= end;
    });
  }

  async claimDrop(monthId: string): Promise<boolean> {
    if (this.claimedDrops.has(monthId)) {
      return false; // Already claimed
    }

    const drop = this.currentDrops.get(monthId);
    if (!drop) {
      return false; // Drop doesn't exist
    }

    // Check if drop is available
    const now = new Date();
    const start = new Date(drop.availability.startDate);
    const end = new Date(drop.availability.endDate);
    
    if (now < start || now > end) {
      return false; // Drop not available
    }

    // Add to claimed
    this.claimedDrops.add(monthId);
    await this.saveClaimedDrops();

    // Grant rewards (this would integrate with the game's reward system)
    await this.grantDropRewards(drop);

    return true;
  }

  private async grantDropRewards(drop: MonthlyDrop): Promise<void> {
    // Grant cart skin
    if (drop.drops.cartSkin) {
      // Add to user's unlocked skins
      console.log(`Granting cart skin: ${drop.drops.cartSkin.name}`);
    }

    // Grant trail
    if (drop.drops.trail) {
      console.log(`Granting trail: ${drop.drops.trail.name}`);
    }

    // Grant badge
    if (drop.drops.badge) {
      console.log(`Granting badge: ${drop.drops.badge.name}`);
    }

    // Grant bonus coins
    if (drop.drops.bonusCoins) {
      console.log(`Granting ${drop.drops.bonusCoins} bonus coins`);
    }

    // Apply XP multiplier
    if (drop.drops.bonusXpMultiplier) {
      console.log(`Applying ${drop.drops.bonusXpMultiplier}x XP multiplier`);
    }

    // Grant special item
    if (drop.drops.specialItem) {
      console.log(`Granting special item: ${drop.drops.specialItem.name}`);
    }
  }

  isDropClaimed(monthId: string): boolean {
    return this.claimedDrops.has(monthId);
  }

  getUpcomingDrops(): MonthlyDrop[] {
    const now = new Date();
    return Array.from(this.currentDrops.values()).filter(drop => {
      const start = new Date(drop.availability.startDate);
      return now < start;
    });
  }

  getPastDrops(): MonthlyDrop[] {
    const now = new Date();
    return Array.from(this.currentDrops.values()).filter(drop => {
      const end = new Date(drop.availability.endDate);
      return now > end;
    });
  }

  // Get drop preview for non-subscribers
  getDropPreview(monthId: string): Partial<MonthlyDrop> | null {
    const drop = this.currentDrops.get(monthId);
    if (!drop) return null;

    // Return limited info for preview
    return {
      month: drop.month,
      displayName: drop.displayName,
      theme: drop.theme,
      drops: {
        cartSkin: drop.drops.cartSkin ? {
          ...drop.drops.cartSkin,
          imageUrl: drop.drops.cartSkin.imageUrl + '?blur=true' // Blurred preview
        } : undefined,
        bonusCoins: drop.drops.bonusCoins,
      }
    };
  }
}

export const monthlyDropsService = MonthlyDropsService.getInstance();