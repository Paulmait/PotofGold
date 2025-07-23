import { offlineManager } from './offlineManager';

export interface StateSkin {
  id: string;
  name: string;
  stateName: string;
  abbreviation: string;
  theme: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  unlockMethod: 'free' | 'coins' | 'achievement' | 'purchase' | 'streak' | 'special';
  unlockRequirement: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'secret';
  description: string;
  visualEffects: string[];
  unlocked: boolean;
  equipped: boolean;
  price?: number;
  currency?: 'coins' | 'gems' | 'real_money';
}

export interface SpecialItem {
  id: string;
  name: string;
  emoji: string;
  effect: string;
  duration: number; // seconds
  rarity: number; // 0-1, chance to spawn
  unlockType: 'shop' | 'booster' | 'lore' | 'skin';
  unlockData: any;
}

export interface StateCollectionProgress {
  userId: string;
  unlockedStates: string[];
  equippedState: string;
  totalStates: number;
  collectionProgress: number;
  specialItemsCaught: string[];
  lastUpdated: Date;
}

export class StateCollectionSystem {
  private static instance: StateCollectionSystem;
  private progress: StateCollectionProgress | null = null;
  private states: StateSkin[] = [];
  private specialItems: SpecialItem[] = [];

  static getInstance(): StateCollectionSystem {
    if (!StateCollectionSystem.instance) {
      StateCollectionSystem.instance = new StateCollectionSystem();
    }
    return StateCollectionSystem.instance;
  }

  constructor() {
    this.initializeStates();
    this.initializeSpecialItems();
  }

  // Initialize all 50 US states
  private initializeStates(): void {
    this.states = [
      // Free States (Common)
      {
        id: 'florida_pot',
        name: 'Florida Pot',
        stateName: 'Florida',
        abbreviation: 'FL',
        theme: 'Orange + Palm',
        colors: { primary: '#FF6B35', secondary: '#4A90E2', accent: '#FFD700' },
        unlockMethod: 'free',
        unlockRequirement: 0,
        rarity: 'common',
        description: 'The Sunshine State pot with orange and palm tree vibes',
        visualEffects: ['orange_glow', 'palm_shadow'],
        unlocked: true,
        equipped: false,
      },
      {
        id: 'california_pot',
        name: 'California Glow',
        stateName: 'California',
        abbreviation: 'CA',
        theme: 'Sunset vibes',
        colors: { primary: '#FF6B6B', secondary: '#4ECDC4', accent: '#FFE66D' },
        unlockMethod: 'achievement',
        unlockRequirement: 3, // Complete Gold Rush 3x
        rarity: 'rare',
        description: 'Golden State pot with sunset gradient effects',
        visualEffects: ['sunset_gradient', 'golden_trail'],
        unlocked: false,
        equipped: false,
      },
      {
        id: 'texas_pot',
        name: 'Texas Pot',
        stateName: 'Texas',
        abbreviation: 'TX',
        theme: 'Lone Star',
        colors: { primary: '#BF0A30', secondary: '#FFFFFF', accent: '#002868' },
        unlockMethod: 'coins',
        unlockRequirement: 1000,
        rarity: 'rare',
        description: 'Lone Star State pot with star effects',
        visualEffects: ['star_sparkle', 'red_white_blue'],
        unlocked: false,
        equipped: false,
      },
      {
        id: 'newyork_pot',
        name: 'New York Neon',
        stateName: 'New York',
        abbreviation: 'NY',
        theme: 'Statue + Metro',
        colors: { primary: '#FF6B9D', secondary: '#4ECDC4', accent: '#45B7D1' },
        unlockMethod: 'purchase',
        unlockRequirement: 0,
        rarity: 'epic',
        description: 'Empire State pot with neon city lights',
        visualEffects: ['neon_glow', 'city_lights'],
        unlocked: false,
        equipped: false,
        price: 0.99,
        currency: 'real_money',
      },
      {
        id: 'mystery_state',
        name: 'Mystery State',
        stateName: '???',
        abbreviation: '??',
        theme: 'Secret shape',
        colors: { primary: '#9B59B6', secondary: '#E74C3C', accent: '#F1C40F' },
        unlockMethod: 'streak',
        unlockRequirement: 7, // 7-day login streak
        rarity: 'secret',
        description: 'A mysterious state pot with unknown effects',
        visualEffects: ['mystery_glow', 'shape_shift'],
        unlocked: false,
        equipped: false,
      },
      // Add more states here...
      {
        id: 'alaska_pot',
        name: 'Alaska Aurora',
        stateName: 'Alaska',
        abbreviation: 'AK',
        theme: 'Northern Lights',
        colors: { primary: '#00CED1', secondary: '#7B68EE', accent: '#32CD32' },
        unlockMethod: 'achievement',
        unlockRequirement: 10, // Survive 10 minutes total
        rarity: 'epic',
        description: 'Last Frontier pot with aurora borealis effects',
        visualEffects: ['aurora_glow', 'ice_sparkle'],
        unlocked: false,
        equipped: false,
      },
      {
        id: 'hawaii_pot',
        name: 'Hawaii Paradise',
        stateName: 'Hawaii',
        abbreviation: 'HI',
        theme: 'Tropical Paradise',
        colors: { primary: '#FF6B35', secondary: '#4ECDC4', accent: '#FFE66D' },
        unlockMethod: 'coins',
        unlockRequirement: 2500,
        rarity: 'epic',
        description: 'Aloha State pot with tropical flower effects',
        visualEffects: ['flower_petals', 'ocean_waves'],
        unlocked: false,
        equipped: false,
      },
      {
        id: 'nevada_pot',
        name: 'Nevada Vegas',
        stateName: 'Nevada',
        abbreviation: 'NV',
        theme: 'Las Vegas Lights',
        colors: { primary: '#FF1493', secondary: '#00CED1', accent: '#FFD700' },
        unlockMethod: 'achievement',
        unlockRequirement: 50, // Catch 50 coins in one game
        rarity: 'legendary',
        description: 'Silver State pot with casino lights',
        visualEffects: ['casino_lights', 'slot_machine'],
        unlocked: false,
        equipped: false,
      },
    ];
  }

  // Initialize special falling items
  private initializeSpecialItems(): void {
    this.specialItems = [
      {
        id: 'ruby_gem',
        name: 'Ruby Gem',
        emoji: '💎',
        effect: 'Unlocks premium skin shop',
        duration: 300, // 5 minutes
        rarity: 0.05, // 5% chance
        unlockType: 'shop',
        unlockData: {
          type: 'premium_shop',
          message: 'Ruby Gem found! Premium skins available for 5 minutes!',
          items: ['newyork_pot', 'nevada_pot', 'hawaii_pot'],
        },
      },
      {
        id: 'elixir_potion',
        name: 'Elixir Potion',
        emoji: '🧪',
        effect: 'Opens temporary booster shop',
        duration: 180, // 3 minutes
        rarity: 0.08, // 8% chance
        unlockType: 'booster',
        unlockData: {
          type: 'booster_shop',
          message: 'Elixir found! Special boosters available!',
          boosters: [
            { name: '2x Gold Booster', duration: 5, price: 100 },
            { name: 'Speed Boost', duration: 3, price: 75 },
            { name: 'Magnet Boost', duration: 4, price: 150 },
          ],
        },
      },
      {
        id: 'ancient_scroll',
        name: 'Ancient Scroll',
        emoji: '📜',
        effect: 'Unlocks lore skin',
        duration: 600, // 10 minutes
        rarity: 0.03, // 3% chance
        unlockType: 'lore',
        unlockData: {
          type: 'lore_skin',
          message: 'Ancient Scroll found! Unlock a historical skin!',
          skins: ['greek_zeus_pot', 'roman_eagle_pot', 'mayan_glyph_pot'],
        },
      },
      {
        id: 'golden_coin',
        name: 'Golden Coin',
        emoji: '🪙',
        effect: 'Bonus coins and experience',
        duration: 0, // Instant
        rarity: 0.12, // 12% chance
        unlockType: 'skin',
        unlockData: {
          type: 'bonus_reward',
          message: 'Golden Coin found! +50 coins and +25 XP!',
          rewards: { coins: 50, experience: 25 },
        },
      },
    ];
  }

  // Initialize collection progress
  async initializeCollection(userId: string): Promise<StateCollectionProgress> {
    try {
      const offlineData = await offlineManager.getOfflineData(userId);
      
      if (offlineData.stateCollection) {
        this.progress = offlineData.stateCollection;
        return this.progress;
      }
    } catch (error) {
      console.log('Error loading state collection data:', error);
    }

    // Create default progress
    this.progress = {
      userId,
      unlockedStates: ['florida_pot'], // Start with Florida
      equippedState: 'florida_pot',
      totalStates: this.states.length,
      collectionProgress: 1,
      specialItemsCaught: [],
      lastUpdated: new Date(),
    };

    await this.saveCollection();
    return this.progress;
  }

  // Catch a special item
  async catchSpecialItem(itemId: string): Promise<{
    success: boolean;
    item: SpecialItem | null;
    effect: any;
  }> {
    if (!this.progress) {
      return { success: false, item: null, effect: null };
    }

    const item = this.specialItems.find(i => i.id === itemId);
    if (!item) {
      return { success: false, item: null, effect: null };
    }

    // Add to caught items
    if (!this.progress.specialItemsCaught.includes(itemId)) {
      this.progress.specialItemsCaught.push(itemId);
    }

    await this.saveCollection();

    return {
      success: true,
      item,
      effect: item.unlockData,
    };
  }

  // Unlock a state
  async unlockState(stateId: string): Promise<{
    success: boolean;
    state: StateSkin | null;
    message: string;
  }> {
    if (!this.progress) {
      return { success: false, state: null, message: '' };
    }

    const state = this.states.find(s => s.id === stateId);
    if (!state || this.progress.unlockedStates.includes(stateId)) {
      return { success: false, state: null, message: 'State already unlocked or invalid' };
    }

    // Check unlock requirements
    const canUnlock = await this.checkUnlockRequirements(state);
    if (!canUnlock.success) {
      return { success: false, state: null, message: canUnlock.message };
    }

    // Unlock the state
    this.progress.unlockedStates.push(stateId);
    this.progress.collectionProgress = (this.progress.unlockedStates.length / this.progress.totalStates) * 100;

    await this.saveCollection();

    return {
      success: true,
      state,
      message: `Unlocked ${state.stateName} pot!`,
    };
  }

  // Check unlock requirements
  private async checkUnlockRequirements(state: StateSkin): Promise<{
    success: boolean;
    message: string;
  }> {
    // This would integrate with other systems to check requirements
    // For now, return success for demonstration
    return { success: true, message: 'Requirements met' };
  }

  // Equip a state
  async equipState(stateId: string): Promise<boolean> {
    if (!this.progress) return false;

    const state = this.states.find(s => s.id === stateId);
    if (!state || !this.progress.unlockedStates.includes(stateId)) {
      return false;
    }

    this.progress.equippedState = stateId;
    await this.saveCollection();
    return true;
  }

  // Get available states
  getAvailableStates(): StateSkin[] {
    if (!this.progress) return [];
    return this.states.filter(state => 
      this.progress!.unlockedStates.includes(state.id)
    );
  }

  // Get unlockable states
  getUnlockableStates(): StateSkin[] {
    if (!this.progress) return [];
    return this.states.filter(state => 
      !this.progress!.unlockedStates.includes(state.id)
    );
  }

  // Get special items
  getSpecialItems(): SpecialItem[] {
    return this.specialItems;
  }

  // Get collection statistics
  getCollectionStats(): {
    unlocked: number;
    total: number;
    progress: number;
    equipped: string;
  } {
    if (!this.progress) {
      return { unlocked: 0, total: 0, progress: 0, equipped: '' };
    }

    return {
      unlocked: this.progress.unlockedStates.length,
      total: this.progress.totalStates,
      progress: this.progress.collectionProgress,
      equipped: this.progress.equippedState,
    };
  }

  // Get current equipped state
  getEquippedState(): StateSkin | null {
    if (!this.progress) return null;
    return this.states.find(s => s.id === this.progress!.equippedState) || null;
  }

  // Save collection
  private async saveCollection(): Promise<void> {
    if (!this.progress) return;

    try {
      await offlineManager.saveOfflineData(this.progress.userId, {
        stateCollection: this.progress,
      });

      await offlineManager.addPendingAction(this.progress.userId, {
        type: 'state_collection_update',
        data: this.progress,
      });
    } catch (error) {
      console.log('Error saving state collection:', error);
    }
  }
}

export const stateCollectionSystem = StateCollectionSystem.getInstance(); 