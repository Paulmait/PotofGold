import { offlineManager } from './offlineManager';

export interface PotSkin {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  effects: string[];
  visualEffects: string[];
  unlocked: boolean;
  image: string;
}

export interface PotUpgrade {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: number;
  effects: {
    size: number;
    magnetRange: number;
    coinMultiplier: number;
    specialEffects: string[];
  };
}

export interface CampBuilding {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: number;
  effects: {
    coinGeneration: number;
    experienceBonus: number;
    powerUpChance: number;
    specialBonuses: string[];
  };
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'pot' | 'skin' | 'powerup' | 'boost';
  price: number;
  currency: 'coins' | 'gems' | 'real_money';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effects: string[];
  image: string;
  available: boolean;
}

export interface MetaGameProgress {
  userId: string;
  camp: {
    level: number;
    buildings: CampBuilding[];
    totalCoinGeneration: number;
    totalExperienceBonus: number;
  };
  shop: {
    level: number;
    availableItems: ShopItem[];
    purchasedItems: string[];
  };
  pots: {
    currentPot: PotUpgrade;
    ownedPots: PotUpgrade[];
    currentSkin: PotSkin;
    ownedSkins: PotSkin[];
  };
  currency: {
    coins: number;
    gems: number;
    premiumCurrency: number;
  };
  achievements: string[];
  lastUpdated: Date;
}

export class MetaGameSystem {
  private static instance: MetaGameSystem;
  private progress: MetaGameProgress | null = null;

  static getInstance(): MetaGameSystem {
    if (!MetaGameSystem.instance) {
      MetaGameSystem.instance = new MetaGameSystem();
    }
    return MetaGameSystem.instance;
  }

  // Initialize meta game progress
  async initializeMetaGame(userId: string): Promise<MetaGameProgress> {
    try {
      const offlineData = await offlineManager.getOfflineData(userId);
      
      if (offlineData.metaGame) {
        this.progress = offlineData.metaGame;
        return this.progress;
      }
    } catch (error) {
      console.log('Error loading meta game data:', error);
    }

    // Create default meta game progress
    this.progress = {
      userId,
      camp: {
        level: 1,
        buildings: this.getDefaultBuildings(),
        totalCoinGeneration: 0,
        totalExperienceBonus: 0,
      },
      shop: {
        level: 1,
        availableItems: this.getDefaultShopItems(),
        purchasedItems: [],
      },
      pots: {
        currentPot: this.getDefaultPot(),
        ownedPots: [this.getDefaultPot()],
        currentSkin: this.getDefaultSkin(),
        ownedSkins: [this.getDefaultSkin()],
      },
      currency: {
        coins: 100,
        gems: 10,
        premiumCurrency: 0,
      },
      achievements: [],
      lastUpdated: new Date(),
    };

    await this.saveMetaGameProgress();
    return this.progress;
  }

  // Get default buildings
  private getDefaultBuildings(): CampBuilding[] {
    return [
      {
        id: 'gold_mine',
        name: 'Gold Mine',
        description: 'Generates coins over time',
        level: 1,
        maxLevel: 10,
        cost: 50,
        effects: {
          coinGeneration: 1,
          experienceBonus: 0,
          powerUpChance: 0,
          specialBonuses: [],
        },
      },
      {
        id: 'experience_fountain',
        name: 'Experience Fountain',
        description: 'Provides experience bonuses',
        level: 1,
        maxLevel: 10,
        cost: 100,
        effects: {
          coinGeneration: 0,
          experienceBonus: 5,
          powerUpChance: 0,
          specialBonuses: [],
        },
      },
      {
        id: 'power_up_lab',
        name: 'Power-up Laboratory',
        description: 'Increases power-up spawn chance',
        level: 1,
        maxLevel: 10,
        cost: 200,
        effects: {
          coinGeneration: 0,
          experienceBonus: 0,
          powerUpChance: 2,
          specialBonuses: [],
        },
      },
    ];
  }

  // Get default pot
  private getDefaultPot(): PotUpgrade {
    return {
      id: 'basic_pot',
      name: 'Basic Pot',
      description: 'A simple pot for catching coins',
      level: 1,
      maxLevel: 5,
      cost: 0,
      effects: {
        size: 1,
        magnetRange: 0,
        coinMultiplier: 1,
        specialEffects: [],
      },
    };
  }

  // Get default skin
  private getDefaultSkin(): PotSkin {
    return {
      id: 'default_skin',
      name: 'Default Skin',
      description: 'The classic pot appearance',
      rarity: 'common',
      price: 0,
      effects: [],
      visualEffects: [],
      unlocked: true,
      image: 'default_pot',
    };
  }

  // Get default shop items
  private getDefaultShopItems(): ShopItem[] {
    return [
      {
        id: 'magnet_pot',
        name: 'Magnet Pot',
        description: 'Automatically attracts nearby coins',
        category: 'pot',
        price: 500,
        currency: 'coins',
        rarity: 'rare',
        effects: ['magnet_effect'],
        image: 'magnet_pot',
        available: true,
      },
      {
        id: 'turbo_pot',
        name: 'Turbo Pot',
        description: 'Moves faster and catches more coins',
        category: 'pot',
        price: 1000,
        currency: 'coins',
        rarity: 'epic',
        effects: ['speed_boost', 'catch_bonus'],
        image: 'turbo_pot',
        available: true,
      },
      {
        id: 'flame_pot',
        name: 'Flame Pot',
        description: 'Burns through obstacles and fake coins',
        category: 'pot',
        price: 2000,
        currency: 'coins',
        rarity: 'legendary',
        effects: ['obstacle_destruction', 'fake_coin_detection'],
        image: 'flame_pot',
        available: true,
      },
      {
        id: 'golden_skin',
        name: 'Golden Skin',
        description: 'Shiny golden pot with sparkle effects',
        category: 'skin',
        price: 300,
        currency: 'coins',
        rarity: 'rare',
        effects: ['visual_sparkles'],
        image: 'golden_skin',
        available: true,
      },
      {
        id: 'rainbow_skin',
        name: 'Rainbow Skin',
        description: 'Colorful rainbow pot with trail effects',
        category: 'skin',
        price: 800,
        currency: 'coins',
        rarity: 'epic',
        effects: ['rainbow_trail', 'color_changing'],
        image: 'rainbow_skin',
        available: true,
      },
      {
        id: 'cosmic_skin',
        name: 'Cosmic Skin',
        description: 'Space-themed pot with particle effects',
        category: 'skin',
        price: 1500,
        currency: 'coins',
        rarity: 'legendary',
        effects: ['particle_effects', 'cosmic_trail'],
        image: 'cosmic_skin',
        available: true,
      },
    ];
  }

  // Upgrade camp building
  async upgradeBuilding(buildingId: string): Promise<{
    success: boolean;
    newLevel: number;
    cost: number;
    effects: any;
  }> {
    if (!this.progress) return { success: false, newLevel: 0, cost: 0, effects: {} };

    const building = this.progress.camp.buildings.find(b => b.id === buildingId);
    if (!building || building.level >= building.maxLevel) {
      return { success: false, newLevel: building?.level || 0, cost: 0, effects: {} };
    }

    const upgradeCost = building.cost * Math.pow(1.5, building.level - 1);
    
    if (this.progress.currency.coins < upgradeCost) {
      return { success: false, newLevel: building.level, cost: upgradeCost, effects: {} };
    }

    // Perform upgrade
    building.level++;
    this.progress.currency.coins -= upgradeCost;

    // Update building effects
    building.effects.coinGeneration *= 1.2;
    building.effects.experienceBonus *= 1.15;
    building.effects.powerUpChance *= 1.1;

    // Recalculate camp totals
    this.updateCampTotals();

    await this.saveMetaGameProgress();

    return {
      success: true,
      newLevel: building.level,
      cost: upgradeCost,
      effects: building.effects,
    };
  }

  // Purchase shop item
  async purchaseShopItem(itemId: string): Promise<{
    success: boolean;
    item: ShopItem | null;
    remainingCurrency: number;
  }> {
    if (!this.progress) return { success: false, item: null, remainingCurrency: 0 };

    const item = this.progress.shop.availableItems.find(i => i.id === itemId);
    if (!item || !item.available) {
      return { success: false, item: null, remainingCurrency: this.progress.currency.coins };
    }

    const currencyKey = item.currency === 'coins' ? 'coins' : 
                       item.currency === 'gems' ? 'gems' : 'premiumCurrency';
    
    if (this.progress.currency[currencyKey] < item.price) {
      return { success: false, item: null, remainingCurrency: this.progress.currency[currencyKey] };
    }

    // Process purchase
    this.progress.currency[currencyKey] -= item.price;
    this.progress.shop.purchasedItems.push(itemId);

    // Apply item effects based on category
    if (item.category === 'pot') {
      await this.addPotToCollection(item);
    } else if (item.category === 'skin') {
      await this.addSkinToCollection(item);
    }

    await this.saveMetaGameProgress();

    return {
      success: true,
      item,
      remainingCurrency: this.progress.currency[currencyKey],
    };
  }

  // Add pot to collection
  private async addPotToCollection(item: ShopItem): Promise<void> {
    if (!this.progress) return;

    const newPot: PotUpgrade = {
      id: item.id,
      name: item.name,
      description: item.description,
      level: 1,
      maxLevel: 5,
      cost: item.price,
      effects: this.getPotEffects(item),
    };

    this.progress.pots.ownedPots.push(newPot);
  }

  // Add skin to collection
  private async addSkinToCollection(item: ShopItem): Promise<void> {
    if (!this.progress) return;

    const newSkin: PotSkin = {
      id: item.id,
      name: item.name,
      description: item.description,
      rarity: item.rarity as any,
      price: item.price,
      effects: item.effects,
      visualEffects: item.effects.filter(e => e.includes('visual') || e.includes('trail')),
      unlocked: true,
      image: item.image,
    };

    this.progress.pots.ownedSkins.push(newSkin);
  }

  // Get pot effects from shop item
  private getPotEffects(item: ShopItem): PotUpgrade['effects'] {
    const baseEffects = {
      size: 1,
      magnetRange: 0,
      coinMultiplier: 1,
      specialEffects: [],
    };

    if (item.effects.includes('magnet_effect')) {
      baseEffects.magnetRange = 50;
    }
    if (item.effects.includes('speed_boost')) {
      baseEffects.specialEffects.push('speed_boost');
    }
    if (item.effects.includes('catch_bonus')) {
      baseEffects.coinMultiplier = 1.5;
    }
    if (item.effects.includes('obstacle_destruction')) {
      baseEffects.specialEffects.push('obstacle_destruction');
    }

    return baseEffects;
  }

  // Equip pot skin
  async equipSkin(skinId: string): Promise<boolean> {
    if (!this.progress) return false;

    const skin = this.progress.pots.ownedSkins.find(s => s.id === skinId);
    if (!skin) return false;

    this.progress.pots.currentSkin = skin;
    await this.saveMetaGameProgress();
    return true;
  }

  // Equip pot
  async equipPot(potId: string): Promise<boolean> {
    if (!this.progress) return false;

    const pot = this.progress.pots.ownedPots.find(p => p.id === potId);
    if (!pot) return false;

    this.progress.pots.currentPot = pot;
    await this.saveMetaGameProgress();
    return true;
  }

  // Update camp totals
  private updateCampTotals(): void {
    if (!this.progress) return;

    this.progress.camp.totalCoinGeneration = this.progress.camp.buildings.reduce(
      (total, building) => total + building.effects.coinGeneration, 0
    );

    this.progress.camp.totalExperienceBonus = this.progress.camp.buildings.reduce(
      (total, building) => total + building.effects.experienceBonus, 0
    );
  }

  // Generate passive income
  async generatePassiveIncome(): Promise<{
    coins: number;
    experience: number;
    powerUps: string[];
  }> {
    if (!this.progress) return { coins: 0, experience: 0, powerUps: [] };

    const timeSinceLastUpdate = Date.now() - this.progress.lastUpdated.getTime();
    const hoursPassed = timeSinceLastUpdate / (1000 * 60 * 60);

    const passiveCoins = Math.floor(this.progress.camp.totalCoinGeneration * hoursPassed);
    const passiveExperience = Math.floor(this.progress.camp.totalExperienceBonus * hoursPassed);

    // Add passive income
    this.progress.currency.coins += passiveCoins;
    this.progress.lastUpdated = new Date();

    await this.saveMetaGameProgress();

    return {
      coins: passiveCoins,
      experience: passiveExperience,
      powerUps: [],
    };
  }

  // Save meta game progress
  private async saveMetaGameProgress(): Promise<void> {
    if (!this.progress) return;

    try {
      await offlineManager.saveOfflineData(this.progress.userId, {
        metaGame: this.progress,
      });

      await offlineManager.addPendingAction(this.progress.userId, {
        type: 'meta_game_update',
        data: this.progress,
      });
    } catch (error) {
      console.log('Error saving meta game progress:', error);
    }
  }

  // Get current progress
  getProgress(): MetaGameProgress | null {
    return this.progress;
  }

  // Get available shop items
  getAvailableShopItems(): ShopItem[] {
    if (!this.progress) return [];
    return this.progress.shop.availableItems.filter(item => item.available);
  }

  // Get owned skins
  getOwnedSkins(): PotSkin[] {
    if (!this.progress) return [];
    return this.progress.pots.ownedSkins;
  }

  // Get owned pots
  getOwnedPots(): PotUpgrade[] {
    if (!this.progress) return [];
    return this.progress.pots.ownedPots;
  }

  // Get current pot effects
  getCurrentPotEffects(): PotUpgrade['effects'] {
    if (!this.progress) return this.getDefaultPot().effects;
    return this.progress.pots.currentPot.effects;
  }

  // Get current skin effects
  getCurrentSkinEffects(): PotSkin['visualEffects'] {
    if (!this.progress) return [];
    return this.progress.pots.currentSkin.visualEffects;
  }
}

export const metaGameSystem = MetaGameSystem.getInstance(); 