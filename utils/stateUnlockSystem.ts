export interface StateUnlock {
  id: string;
  stateName: string;
  stateAbbr: string;
  unlockType: 'flagSkin' | 'shapeSkin' | 'particleTrail' | 'voiceLine' | 'specialItem';
  description: string;
  requirement: {
    type: 'score' | 'coins' | 'combo' | 'time' | 'items';
    value: number;
  };
  isUnlocked: boolean;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  visualElements: {
    flagPattern?: string;
    shapeOutline?: string;
    particleEffect?: string;
    specialItem?: string;
  };
}

export const STATE_UNLOCKS: StateUnlock[] = [
  // Northeastern States
  {
    id: 'maine_lobster',
    stateName: 'Maine',
    stateAbbr: 'ME',
    unlockType: 'specialItem',
    description: 'Lobster falling item',
    requirement: { type: 'score', value: 1000 },
    isUnlocked: false,
    theme: {
      primaryColor: '#1B4F72',
      secondaryColor: '#85C1E9',
      accentColor: '#F8C471',
    },
    visualElements: {
      specialItem: 'lobster',
    },
  },
  {
    id: 'new_hampshire_old_man',
    stateName: 'New Hampshire',
    stateAbbr: 'NH',
    unlockType: 'shapeSkin',
    description: 'Old Man of the Mountain silhouette',
    requirement: { type: 'score', value: 2000 },
    isUnlocked: false,
    theme: {
      primaryColor: '#2E86AB',
      secondaryColor: '#A23B72',
      accentColor: '#F18F01',
    },
    visualElements: {
      shapeOutline: 'mountain',
    },
  },
  {
    id: 'vermont_maple',
    stateName: 'Vermont',
    stateAbbr: 'VT',
    unlockType: 'particleTrail',
    description: 'Maple leaf particle trail',
    requirement: { type: 'score', value: 1500 },
    isUnlocked: false,
    theme: {
      primaryColor: '#2E8B57',
      secondaryColor: '#8B4513',
      accentColor: '#FFD700',
    },
    visualElements: {
      particleEffect: 'maple_leaves',
    },
  },
  {
    id: 'massachusetts_bay',
    stateName: 'Massachusetts',
    stateAbbr: 'MA',
    unlockType: 'flagSkin',
    description: 'Bay State flag pattern',
    requirement: { type: 'score', value: 2500 },
    isUnlocked: false,
    theme: {
      primaryColor: '#1E3A8A',
      secondaryColor: '#F59E0B',
      accentColor: '#EF4444',
    },
    visualElements: {
      flagPattern: 'bay_state',
    },
  },
  {
    id: 'rhode_island_anchor',
    stateName: 'Rhode Island',
    stateAbbr: 'RI',
    unlockType: 'shapeSkin',
    description: 'Anchor silhouette',
    requirement: { type: 'score', value: 1200 },
    isUnlocked: false,
    theme: {
      primaryColor: '#1E40AF',
      secondaryColor: '#F59E0B',
      accentColor: '#EF4444',
    },
    visualElements: {
      shapeOutline: 'anchor',
    },
  },
  {
    id: 'connecticut_oak',
    stateName: 'Connecticut',
    stateAbbr: 'CT',
    unlockType: 'specialItem',
    description: 'Oak leaf falling item',
    requirement: { type: 'score', value: 1800 },
    isUnlocked: false,
    theme: {
      primaryColor: '#1E3A8A',
      secondaryColor: '#059669',
      accentColor: '#F59E0B',
    },
    visualElements: {
      specialItem: 'oak_leaf',
    },
  },

  // Mid-Atlantic States
  {
    id: 'new_york_empire',
    stateName: 'New York',
    stateAbbr: 'NY',
    unlockType: 'flagSkin',
    description: 'Empire State flag pattern',
    requirement: { type: 'score', value: 5000 },
    isUnlocked: false,
    theme: {
      primaryColor: '#1E3A8A',
      secondaryColor: '#F59E0B',
      accentColor: '#EF4444',
    },
    visualElements: {
      flagPattern: 'empire_state',
    },
  },
  {
    id: 'new_jersey_garden',
    stateName: 'New Jersey',
    stateAbbr: 'NJ',
    unlockType: 'particleTrail',
    description: 'Garden flower particle trail',
    requirement: { type: 'score', value: 3000 },
    isUnlocked: false,
    theme: {
      primaryColor: '#1E3A8A',
      secondaryColor: '#F59E0B',
      accentColor: '#EF4444',
    },
    visualElements: {
      particleEffect: 'garden_flowers',
    },
  },
  {
    id: 'pennsylvania_keystone',
    stateName: 'Pennsylvania',
    stateAbbr: 'PA',
    unlockType: 'shapeSkin',
    description: 'Keystone shape silhouette',
    requirement: { type: 'score', value: 3500 },
    isUnlocked: false,
    theme: {
      primaryColor: '#1E3A8A',
      secondaryColor: '#F59E0B',
      accentColor: '#EF4444',
    },
    visualElements: {
      shapeOutline: 'keystone',
    },
  },
  {
    id: 'delaware_blue_hen',
    stateName: 'Delaware',
    stateAbbr: 'DE',
    unlockType: 'specialItem',
    description: 'Blue Hen falling item',
    requirement: { type: 'score', value: 2200 },
    isUnlocked: false,
    theme: {
      primaryColor: '#1E3A8A',
      secondaryColor: '#F59E0B',
      accentColor: '#EF4444',
    },
    visualElements: {
      specialItem: 'blue_hen',
    },
  },
  {
    id: 'maryland_old_line',
    stateName: 'Maryland',
    stateAbbr: 'MD',
    unlockType: 'flagSkin',
    description: 'Old Line State flag pattern',
    requirement: { type: 'score', value: 4000 },
    isUnlocked: false,
    theme: {
      primaryColor: '#1E3A8A',
      secondaryColor: '#F59E0B',
      accentColor: '#EF4444',
    },
    visualElements: {
      flagPattern: 'old_line_state',
    },
  },

  // Southern States
  {
    id: 'virginia_old_dominion',
    stateName: 'Virginia',
    stateAbbr: 'VA',
    unlockType: 'flagSkin',
    description: 'Old Dominion flag pattern',
    requirement: { type: 'score', value: 4500 },
    isUnlocked: false,
    theme: {
      primaryColor: '#1E3A8A',
      secondaryColor: '#F59E0B',
      accentColor: '#EF4444',
    },
    visualElements: {
      flagPattern: 'old_dominion',
    },
  },
  {
    id: 'north_carolina_tar_heel',
    stateName: 'North Carolina',
    stateAbbr: 'NC',
    unlockType: 'particleTrail',
    description: 'Pine needle particle trail',
    requirement: { type: 'score', value: 3800 },
    isUnlocked: false,
    theme: {
      primaryColor: '#1E3A8A',
      secondaryColor: '#059669',
      accentColor: '#F59E0B',
    },
    visualElements: {
      particleEffect: 'pine_needles',
    },
  },
  {
    id: 'south_carolina_palmetto',
    stateName: 'South Carolina',
    stateAbbr: 'SC',
    unlockType: 'shapeSkin',
    description: 'Palmetto tree silhouette',
    requirement: { type: 'score', value: 4200 },
    isUnlocked: false,
    theme: {
      primaryColor: '#1E3A8A',
      secondaryColor: '#059669',
      accentColor: '#F59E0B',
    },
    visualElements: {
      shapeOutline: 'palmetto',
    },
  },
  {
    id: 'georgia_peach',
    stateName: 'Georgia',
    stateAbbr: 'GA',
    unlockType: 'specialItem',
    description: 'Peach falling item',
    requirement: { type: 'score', value: 2800 },
    isUnlocked: false,
    theme: {
      primaryColor: '#1E3A8A',
      secondaryColor: '#F59E0B',
      accentColor: '#EF4444',
    },
    visualElements: {
      specialItem: 'peach',
    },
  },
  {
    id: 'florida_sunshine',
    stateName: 'Florida',
    stateAbbr: 'FL',
    unlockType: 'flagSkin',
    description: 'Sunshine State flag pattern',
    requirement: { type: 'score', value: 6000 },
    isUnlocked: false,
    theme: {
      primaryColor: '#1E3A8A',
      secondaryColor: '#F59E0B',
      accentColor: '#EF4444',
    },
    visualElements: {
      flagPattern: 'sunshine_state',
    },
  },

  // More states can be added here...
];

export class StateUnlockSystem {
  private unlockedStates: Set<string> = new Set();
  private currentState: string | null = null;

  constructor() {
    this.loadUnlockedStates();
  }

  /**
   * Check if a state unlock requirement is met
   */
  checkUnlockRequirement(unlock: StateUnlock, gameStats: any): boolean {
    switch (unlock.requirement.type) {
      case 'score':
        return gameStats.score >= unlock.requirement.value;
      case 'coins':
        return gameStats.coins >= unlock.requirement.value;
      case 'combo':
        return gameStats.combo >= unlock.requirement.value;
      case 'time':
        return gameStats.timeSurvived >= unlock.requirement.value;
      case 'items':
        return gameStats.itemsCollected >= unlock.requirement.value;
      default:
        return false;
    }
  }

  /**
   * Unlock a state
   */
  unlockState(stateId: string): void {
    this.unlockedStates.add(stateId);
    this.saveUnlockedStates();
  }

  /**
   * Check for new unlocks based on game stats
   */
  checkForNewUnlocks(gameStats: any): StateUnlock[] {
    const newUnlocks: StateUnlock[] = [];
    
    STATE_UNLOCKS.forEach(unlock => {
      if (!this.unlockedStates.has(unlock.id) && this.checkUnlockRequirement(unlock, gameStats)) {
        this.unlockState(unlock.id);
        newUnlocks.push(unlock);
      }
    });

    return newUnlocks;
  }

  /**
   * Get all unlocked states
   */
  getUnlockedStates(): StateUnlock[] {
    return STATE_UNLOCKS.filter(unlock => this.unlockedStates.has(unlock.id));
  }

  /**
   * Get available states for unlocking
   */
  getAvailableUnlocks(): StateUnlock[] {
    return STATE_UNLOCKS.filter(unlock => !this.unlockedStates.has(unlock.id));
  }

  /**
   * Set current state theme
   */
  setCurrentState(stateId: string): void {
    this.currentState = stateId;
  }

  /**
   * Get current state theme
   */
  getCurrentStateTheme(): StateUnlock | null {
    if (!this.currentState) return null;
    return STATE_UNLOCKS.find(unlock => unlock.id === this.currentState) || null;
  }

  /**
   * Get special items for unlocked states
   */
  getSpecialItems(): string[] {
    return this.getUnlockedStates()
      .filter(unlock => unlock.unlockType === 'specialItem')
      .map(unlock => unlock.visualElements.specialItem!)
      .filter(Boolean);
  }

  /**
   * Load unlocked states from storage
   */
  private loadUnlockedStates(): void {
    // In a real app, load from AsyncStorage or similar
    // For now, start with empty set
  }

  /**
   * Save unlocked states to storage
   */
  private saveUnlockedStates(): void {
    // In a real app, save to AsyncStorage or similar
    console.log('Unlocked states:', Array.from(this.unlockedStates));
  }
} 