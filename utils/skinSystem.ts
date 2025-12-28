import { offlineManager } from './offlineManager';

export interface Skin {
  id: string;
  name: string;
  region?: string;
  theme: 'State' | 'Zodiac' | 'Historical' | 'Nature' | 'Symbolic' | 'Flag';
  unlockLevel?: number;
  unlockChallenge?: string;
  cost: number;
  currency: 'coins' | 'gems' | 'real_money';
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'secret';
  description: string;
  visualEffects: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  unlocked: boolean;
  equipped: boolean;
  source: 'public_domain' | 'purchase' | 'achievement' | 'seasonal';
}

export interface SkinCollection {
  userId: string;
  ownedSkins: string[];
  equippedSkin: string;
  totalSkins: number;
  collectionProgress: number;
  lastUpdated: Date;
}

export class SkinSystem {
  private static instance: SkinSystem;
  private collection: SkinCollection | null = null;
  private skins: Skin[] = [];

  static getInstance(): SkinSystem {
    if (!SkinSystem.instance) {
      SkinSystem.instance = new SkinSystem();
    }
    return SkinSystem.instance;
  }

  constructor() {
    this.initializeSkins();
  }

  // Initialize all skins with public domain content
  private initializeSkins(): void {
    this.skins = [
      // State Skins (Public Domain - U.S. Government)
      {
        id: 'florida',
        name: 'Florida Pot',
        region: 'South',
        theme: 'State',
        unlockLevel: 1,
        cost: 0,
        currency: 'coins',
        image: 'florida.png',
        rarity: 'common',
        description: 'The Sunshine State pot with orange and palm tree vibes',
        visualEffects: ['orange_glow', 'palm_shadow'],
        colors: { primary: '#FF6B35', secondary: '#4A90E2', accent: '#FFD700' },
        unlocked: true,
        equipped: false,
        source: 'public_domain',
      },
      {
        id: 'texas',
        name: 'Texas Pot',
        region: 'South',
        theme: 'State',
        unlockLevel: 5,
        cost: 1000,
        currency: 'coins',
        image: 'texas.png',
        rarity: 'rare',
        description: 'Lone Star State pot with star effects',
        visualEffects: ['star_sparkle', 'red_white_blue'],
        colors: { primary: '#BF0A30', secondary: '#FFFFFF', accent: '#002868' },
        unlocked: false,
        equipped: false,
        source: 'public_domain',
      },
      {
        id: 'california',
        name: 'California Glow',
        region: 'West',
        theme: 'State',
        unlockChallenge: 'Complete Gold Rush 3x',
        cost: 500,
        currency: 'coins',
        image: 'california.png',
        rarity: 'rare',
        description: 'Golden State pot with sunset gradient effects',
        visualEffects: ['sunset_gradient', 'golden_trail'],
        colors: { primary: '#FF6B6B', secondary: '#4ECDC4', accent: '#FFE66D' },
        unlocked: false,
        equipped: false,
        source: 'public_domain',
      },
      {
        id: 'newyork',
        name: 'New York Neon',
        region: 'Northeast',
        theme: 'State',
        cost: 0.99,
        currency: 'real_money',
        image: 'newyork.png',
        rarity: 'epic',
        description: 'Empire State pot with neon city lights',
        visualEffects: ['neon_glow', 'city_lights'],
        colors: { primary: '#FF6B9D', secondary: '#4ECDC4', accent: '#45B7D1' },
        unlocked: false,
        equipped: false,
        source: 'purchase',
      },

      // Zodiac Skins (Public Domain - Open Cultural)
      {
        id: 'libra',
        name: 'Libra Pot',
        theme: 'Zodiac',
        unlockChallenge: 'Score 300 without missing',
        cost: 500,
        currency: 'coins',
        image: 'libra.png',
        rarity: 'rare',
        description: 'Balanced scales of justice pot',
        visualEffects: ['balance_glow', 'scale_sparkle'],
        colors: { primary: '#9B59B6', secondary: '#E74C3C', accent: '#F1C40F' },
        unlocked: false,
        equipped: false,
        source: 'public_domain',
      },
      {
        id: 'aries',
        name: 'Aries Pot',
        theme: 'Zodiac',
        unlockChallenge: 'Survive 5 minutes',
        cost: 750,
        currency: 'coins',
        image: 'aries.png',
        rarity: 'epic',
        description: 'Ram horn power pot',
        visualEffects: ['horn_glow', 'fire_trail'],
        colors: { primary: '#E74C3C', secondary: '#F39C12', accent: '#F1C40F' },
        unlocked: false,
        equipped: false,
        source: 'public_domain',
      },
      {
        id: 'taurus',
        name: 'Taurus Pot',
        theme: 'Zodiac',
        unlockChallenge: 'Collect 50 coins in one game',
        cost: 1000,
        currency: 'coins',
        image: 'taurus.png',
        rarity: 'epic',
        description: 'Bull strength pot',
        visualEffects: ['earth_glow', 'strength_aura'],
        colors: { primary: '#8B4513', secondary: '#DAA520', accent: '#CD853F' },
        unlocked: false,
        equipped: false,
        source: 'public_domain',
      },

      // Historical Skins (Public Domain - Wikipedia PD)
      {
        id: 'zeus_pot',
        name: 'Zeus Pot',
        theme: 'Historical',
        unlockChallenge: 'Achieve lightning combo',
        cost: 1500,
        currency: 'coins',
        image: 'zeus.png',
        rarity: 'legendary',
        description: 'King of the gods pot with lightning effects',
        visualEffects: ['lightning_bolt', 'thunder_clap'],
        colors: { primary: '#FFD700', secondary: '#87CEEB', accent: '#FFFFFF' },
        unlocked: false,
        equipped: false,
        source: 'public_domain',
      },
      {
        id: 'athena_pot',
        name: 'Athena Pot',
        theme: 'Historical',
        unlockChallenge: 'Complete wisdom challenge',
        cost: 1200,
        currency: 'coins',
        image: 'athena.png',
        rarity: 'epic',
        description: 'Goddess of wisdom pot',
        visualEffects: ['owl_wisdom', 'olive_branch'],
        colors: { primary: '#4A90E2', secondary: '#7B68EE', accent: '#87CEEB' },
        unlocked: false,
        equipped: false,
        source: 'public_domain',
      },
      {
        id: 'roman_eagle',
        name: 'Roman Eagle Pot',
        theme: 'Historical',
        unlockChallenge: 'Conquer 10 levels',
        cost: 2000,
        currency: 'coins',
        image: 'roman_eagle.png',
        rarity: 'legendary',
        description: 'Imperial Roman eagle pot',
        visualEffects: ['eagle_wings', 'imperial_gold'],
        colors: { primary: '#FFD700', secondary: '#8B4513', accent: '#CD853F' },
        unlocked: false,
        equipped: false,
        source: 'public_domain',
      },

      // Nature Skins (Public Domain - NPS.gov)
      {
        id: 'yosemite',
        name: 'Yosemite Pot',
        theme: 'Nature',
        unlockChallenge: 'Survive in nature mode',
        cost: 800,
        currency: 'coins',
        image: 'yosemite.png',
        rarity: 'rare',
        description: 'National park inspired pot',
        visualEffects: ['mountain_glow', 'forest_trail'],
        colors: { primary: '#228B22', secondary: '#8B4513', accent: '#87CEEB' },
        unlocked: false,
        equipped: false,
        source: 'public_domain',
      },
      {
        id: 'yellowstone',
        name: 'Yellowstone Pot',
        theme: 'Nature',
        unlockChallenge: 'Collect geothermal gems',
        cost: 1200,
        currency: 'coins',
        image: 'yellowstone.png',
        rarity: 'epic',
        description: 'Geyser and hot spring pot',
        visualEffects: ['steam_cloud', 'geyser_eruption'],
        colors: { primary: '#FF4500', secondary: '#FFD700', accent: '#FF6347' },
        unlocked: false,
        equipped: false,
        source: 'public_domain',
      },

      // Symbolic Skins (Public Domain - Open Cultural)
      {
        id: 'alchemy_fire',
        name: 'Alchemy Fire Pot',
        theme: 'Symbolic',
        unlockChallenge: 'Transmute 100 coins',
        cost: 1000,
        currency: 'coins',
        image: 'alchemy_fire.png',
        rarity: 'epic',
        description: 'Fire element alchemical pot',
        visualEffects: ['fire_transmutation', 'philosopher_stone'],
        colors: { primary: '#FF4500', secondary: '#FF6347', accent: '#FFD700' },
        unlocked: false,
        equipped: false,
        source: 'public_domain',
      },
      {
        id: 'alchemy_water',
        name: 'Alchemy Water Pot',
        theme: 'Symbolic',
        unlockChallenge: 'Flow through water levels',
        cost: 1000,
        currency: 'coins',
        image: 'alchemy_water.png',
        rarity: 'epic',
        description: 'Water element alchemical pot',
        visualEffects: ['water_flow', 'liquid_mercury'],
        colors: { primary: '#00CED1', secondary: '#4ECDC4', accent: '#87CEEB' },
        unlocked: false,
        equipped: false,
        source: 'public_domain',
      },

      // Flag Skins (Public Domain - Wikimedia Commons)
      {
        id: 'usa_flag',
        name: 'USA Flag Pot',
        theme: 'Flag',
        unlockChallenge: 'Patriotic collection',
        cost: 1500,
        currency: 'coins',
        image: 'usa_flag.png',
        rarity: 'legendary',
        description: 'Stars and stripes pot',
        visualEffects: ['flag_wave', 'star_sparkle'],
        colors: { primary: '#BF0A30', secondary: '#FFFFFF', accent: '#002868' },
        unlocked: false,
        equipped: false,
        source: 'public_domain',
      },
      {
        id: 'uk_flag',
        name: 'UK Flag Pot',
        theme: 'Flag',
        unlockChallenge: 'British collection',
        cost: 1200,
        currency: 'coins',
        image: 'uk_flag.png',
        rarity: 'epic',
        description: 'Union Jack pot',
        visualEffects: ['union_cross', 'royal_blue'],
        colors: { primary: '#012169', secondary: '#FFFFFF', accent: '#C8102E' },
        unlocked: false,
        equipped: false,
        source: 'public_domain',
      },
    ];
  }

  // Initialize skin collection
  async initializeCollection(userId: string): Promise<SkinCollection> {
    try {
      const offlineData = await offlineManager.getOfflineData(userId);

      if (offlineData.skinCollection) {
        this.collection = offlineData.skinCollection;
        return this.collection;
      }
    } catch (error) {
      console.log('Error loading skin collection data:', error);
    }

    // Create default collection
    this.collection = {
      userId,
      ownedSkins: ['florida'], // Start with Florida
      equippedSkin: 'florida',
      totalSkins: this.skins.length,
      collectionProgress: 1,
      lastUpdated: new Date(),
    };

    await this.saveCollection();
    return this.collection;
  }

  // Unlock a skin
  async unlockSkin(skinId: string): Promise<{
    success: boolean;
    skin: Skin | null;
    message: string;
  }> {
    if (!this.collection) {
      return { success: false, skin: null, message: 'No collection available' };
    }

    const skin = this.skins.find((s) => s.id === skinId);
    if (!skin) {
      return { success: false, skin: null, message: 'Skin not found' };
    }

    if (this.collection.ownedSkins.includes(skinId)) {
      return { success: false, skin: null, message: 'Skin already owned' };
    }

    // Add to owned skins
    this.collection.ownedSkins.push(skinId);
    this.collection.collectionProgress =
      (this.collection.ownedSkins.length / this.collection.totalSkins) * 100;

    await this.saveCollection();

    return {
      success: true,
      skin,
      message: `Unlocked ${skin.name}!`,
    };
  }

  // Equip a skin
  async equipSkin(skinId: string): Promise<{
    success: boolean;
    skin: Skin | null;
    message: string;
  }> {
    if (!this.collection) {
      return { success: false, skin: null, message: 'No collection available' };
    }

    const skin = this.skins.find((s) => s.id === skinId);
    if (!skin || !this.collection.ownedSkins.includes(skinId)) {
      return { success: false, skin: null, message: 'Skin not owned' };
    }

    this.collection.equippedSkin = skinId;
    await this.saveCollection();

    return {
      success: true,
      skin,
      message: `Equipped ${skin.name}!`,
    };
  }

  // Get all skins
  getAllSkins(): Skin[] {
    return this.skins;
  }

  // Get owned skins
  getOwnedSkins(): Skin[] {
    if (!this.collection) return [];
    return this.skins.filter((skin) => this.collection!.ownedSkins.includes(skin.id));
  }

  // Get available skins (not owned)
  getAvailableSkins(): Skin[] {
    if (!this.collection) return this.skins;
    return this.skins.filter((skin) => !this.collection!.ownedSkins.includes(skin.id));
  }

  // Get skins by theme
  getSkinsByTheme(theme: string): Skin[] {
    return this.skins.filter((skin) => skin.theme === theme);
  }

  // Get skins by rarity
  getSkinsByRarity(rarity: string): Skin[] {
    return this.skins.filter((skin) => skin.rarity === rarity);
  }

  // Get equipped skin
  getEquippedSkin(): Skin | null {
    if (!this.collection) return null;
    return this.skins.find((skin) => skin.id === this.collection!.equippedSkin) || null;
  }

  // Get collection statistics
  getCollectionStats(): {
    totalSkins: number;
    ownedSkins: number;
    collectionProgress: number;
    equippedSkin: string;
  } {
    if (!this.collection) {
      return {
        totalSkins: this.skins.length,
        ownedSkins: 0,
        collectionProgress: 0,
        equippedSkin: '',
      };
    }

    return {
      totalSkins: this.collection.totalSkins,
      ownedSkins: this.collection.ownedSkins.length,
      collectionProgress: this.collection.collectionProgress,
      equippedSkin: this.collection.equippedSkin,
    };
  }

  // Get rarity color
  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common':
        return '#ccc';
      case 'rare':
        return '#4CAF50';
      case 'epic':
        return '#9C27B0';
      case 'legendary':
        return '#FFD700';
      case 'secret':
        return '#FF6B6B';
      default:
        return '#ccc';
    }
  }

  // Save collection
  private async saveCollection(): Promise<void> {
    if (!this.collection) return;

    try {
      await offlineManager.saveOfflineData(this.collection.userId, {
        skinCollection: this.collection,
      });

      await offlineManager.addPendingAction(this.collection.userId, {
        type: 'skin_collection_update',
        data: this.collection,
      });
    } catch (error) {
      console.log('Error saving skin collection:', error);
    }
  }
}

export const skinSystem = SkinSystem.getInstance();
