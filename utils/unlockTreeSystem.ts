import { offlineManager } from './offlineManager';

export interface UnlockNode {
  id: string;
  level: number;
  name: string;
  description: string;
  type: 'upgrade' | 'feature' | 'skin' | 'powerup' | 'theme';
  requirements: {
    level: number;
    coins: number;
    achievements: string[];
    items: string[];
  };
  rewards: {
    coins: number;
    experience: number;
    items: string[];
    features: string[];
  };
  unlocked: boolean;
  claimed: boolean;
  children: string[]; // IDs of child nodes
  parent?: string; // ID of parent node
  position: {
    x: number;
    y: number;
  };
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UnlockTree {
  userId: string;
  nodes: UnlockNode[];
  currentLevel: number;
  totalExperience: number;
  unlockedNodes: string[];
  claimedNodes: string[];
  treeProgress: number;
  lastUpdated: Date;
}

export class UnlockTreeSystem {
  private static instance: UnlockTreeSystem;
  private tree: UnlockTree | null = null;

  static getInstance(): UnlockTreeSystem {
    if (!UnlockTreeSystem.instance) {
      UnlockTreeSystem.instance = new UnlockTreeSystem();
    }
    return UnlockTreeSystem.instance;
  }

  // Initialize unlock tree
  async initializeTree(userId: string): Promise<UnlockTree> {
    try {
      const offlineData = await offlineManager.getOfflineData(userId);
      
      if (offlineData.unlockTree) {
        this.tree = offlineData.unlockTree;
        return this.tree;
      }
    } catch (error) {
      console.log('Error loading unlock tree data:', error);
    }

    // Create default unlock tree
    this.tree = {
      userId,
      nodes: this.generateUnlockNodes(),
      currentLevel: 1,
      totalExperience: 0,
      unlockedNodes: ['pot_speed_1'],
      claimedNodes: [],
      treeProgress: 0,
      lastUpdated: new Date(),
    };

    await this.saveTree();
    return this.tree;
  }

  // Generate unlock nodes
  private generateUnlockNodes(): UnlockNode[] {
    const nodes: UnlockNode[] = [
      // Level 1 - Basic Upgrades
      {
        id: 'pot_speed_1',
        level: 1,
        name: 'Pot Speed Upgrade',
        description: 'Increase pot movement speed by 20%',
        type: 'upgrade',
        requirements: {
          level: 1,
          coins: 0,
          achievements: [],
          items: [],
        },
        rewards: {
          coins: 50,
          experience: 20,
          items: ['speed_boost_1'],
          features: ['pot_speed_boost'],
        },
        unlocked: true,
        claimed: false,
        children: ['bonus_multiplier_1', 'skin_shop_1'],
        position: { x: 0, y: 0 },
        icon: 'speed_icon',
        rarity: 'common',
      },
      {
        id: 'bonus_multiplier_1',
        level: 2,
        name: 'Bonus Coin Multiplier',
        description: 'Earn 1.5x coins from bonus coins',
        type: 'upgrade',
        requirements: {
          level: 2,
          coins: 100,
          achievements: ['first_combo'],
          items: [],
        },
        rewards: {
          coins: 75,
          experience: 30,
          items: ['coin_multiplier_1'],
          features: ['bonus_coin_multiplier'],
        },
        unlocked: false,
        claimed: false,
        children: ['gold_magnet_1'],
        parent: 'pot_speed_1',
        position: { x: -1, y: 1 },
        icon: 'multiplier_icon',
        rarity: 'rare',
      },
      {
        id: 'skin_shop_1',
        level: 3,
        name: 'Skin Shop',
        description: 'Unlock the skin shop to customize your pot',
        type: 'feature',
        requirements: {
          level: 3,
          coins: 200,
          achievements: [],
          items: ['pot_speed_1'],
        },
        rewards: {
          coins: 100,
          experience: 50,
          items: ['skin_shop_access'],
          features: ['skin_shop'],
        },
        unlocked: false,
        claimed: false,
        children: ['new_cave_theme_1'],
        parent: 'pot_speed_1',
        position: { x: 1, y: 1 },
        icon: 'shop_icon',
        rarity: 'epic',
      },
      {
        id: 'gold_magnet_1',
        level: 4,
        name: 'Gold Magnet Powerup',
        description: 'Automatically attract nearby coins',
        type: 'powerup',
        requirements: {
          level: 4,
          coins: 300,
          achievements: ['combo_master'],
          items: ['bonus_multiplier_1'],
        },
        rewards: {
          coins: 150,
          experience: 75,
          items: ['magnet_powerup'],
          features: ['magnet_effect'],
        },
        unlocked: false,
        claimed: false,
        children: ['double_points_1'],
        parent: 'bonus_multiplier_1',
        position: { x: -2, y: 2 },
        icon: 'magnet_icon',
        rarity: 'epic',
      },
      {
        id: 'new_cave_theme_1',
        level: 5,
        name: 'New Cave Theme',
        description: 'Unlock the Volcano Cave theme',
        type: 'theme',
        requirements: {
          level: 5,
          coins: 500,
          achievements: ['obstacle_avoider'],
          items: ['skin_shop_1'],
        },
        rewards: {
          coins: 200,
          experience: 100,
          items: ['volcano_theme'],
          features: ['volcano_background'],
        },
        unlocked: false,
        claimed: false,
        children: ['rainbow_realm_1'],
        parent: 'skin_shop_1',
        position: { x: 2, y: 2 },
        icon: 'theme_icon',
        rarity: 'legendary',
      },
      {
        id: 'double_points_1',
        level: 6,
        name: 'Double Points Powerup',
        description: 'Double all points earned for 10 seconds',
        type: 'powerup',
        requirements: {
          level: 6,
          coins: 750,
          achievements: ['speed_demon'],
          items: ['gold_magnet_1'],
        },
        rewards: {
          coins: 300,
          experience: 150,
          items: ['double_points_powerup'],
          features: ['double_points_effect'],
        },
        unlocked: false,
        claimed: false,
        children: ['ultimate_powerup_1'],
        parent: 'gold_magnet_1',
        position: { x: -3, y: 3 },
        icon: 'double_icon',
        rarity: 'legendary',
      },
      {
        id: 'rainbow_realm_1',
        level: 7,
        name: 'Rainbow Realm Theme',
        description: 'Unlock the magical Rainbow Realm',
        type: 'theme',
        requirements: {
          level: 7,
          coins: 1000,
          achievements: ['accuracy_expert'],
          items: ['new_cave_theme_1'],
        },
        rewards: {
          coins: 500,
          experience: 250,
          items: ['rainbow_theme'],
          features: ['rainbow_background'],
        },
        unlocked: false,
        claimed: false,
        children: ['cosmic_void_1'],
        parent: 'new_cave_theme_1',
        position: { x: 3, y: 3 },
        icon: 'rainbow_icon',
        rarity: 'legendary',
      },
      {
        id: 'ultimate_powerup_1',
        level: 8,
        name: 'Ultimate Powerup',
        description: 'Combine all power-ups for ultimate effect',
        type: 'powerup',
        requirements: {
          level: 8,
          coins: 2000,
          achievements: ['reflex_legend'],
          items: ['double_points_1', 'rainbow_realm_1'],
        },
        rewards: {
          coins: 1000,
          experience: 500,
          items: ['ultimate_powerup'],
          features: ['ultimate_effect'],
        },
        unlocked: false,
        claimed: false,
        children: [],
        parent: 'double_points_1',
        position: { x: 0, y: 4 },
        icon: 'ultimate_icon',
        rarity: 'legendary',
      },
      {
        id: 'cosmic_void_1',
        level: 9,
        name: 'Cosmic Void Theme',
        description: 'Unlock the infinite Cosmic Void',
        type: 'theme',
        requirements: {
          level: 9,
          coins: 3000,
          achievements: ['endurance_champion'],
          items: ['rainbow_realm_1'],
        },
        rewards: {
          coins: 1500,
          experience: 750,
          items: ['cosmic_theme'],
          features: ['cosmic_background'],
        },
        unlocked: false,
        claimed: false,
        children: ['ultimate_powerup_1'],
        parent: 'rainbow_realm_1',
        position: { x: 4, y: 4 },
        icon: 'cosmic_icon',
        rarity: 'legendary',
      },
    ];

    return nodes;
  }

  // Check if node can be unlocked
  canUnlockNode(nodeId: string): {
    canUnlock: boolean;
    missingRequirements: string[];
  } {
    if (!this.tree) {
      return { canUnlock: false, missingRequirements: [] };
    }

    const node = this.tree.nodes.find(n => n.id === nodeId);
    if (!node || node.unlocked) {
      return { canUnlock: false, missingRequirements: [] };
    }

    const missingRequirements: string[] = [];

    // Check level requirement
    if (this.tree.currentLevel < node.requirements.level) {
      missingRequirements.push(`Level ${node.requirements.level} required`);
    }

    // Check parent requirement
    if (node.parent && !this.tree.unlockedNodes.includes(node.parent)) {
      missingRequirements.push(`Parent node must be unlocked`);
    }

    // Check achievements (this would come from achievement system)
    // For now, we'll assume all achievements are met

    return {
      canUnlock: missingRequirements.length === 0,
      missingRequirements,
    };
  }

  // Unlock node
  async unlockNode(nodeId: string): Promise<{
    success: boolean;
    node: UnlockNode | null;
    rewards: any;
  }> {
    if (!this.tree) {
      return { success: false, node: null, rewards: {} };
    }

    const canUnlock = this.canUnlockNode(nodeId);
    if (!canUnlock.canUnlock) {
      return { success: false, node: null, rewards: {} };
    }

    const node = this.tree.nodes.find(n => n.id === nodeId);
    if (!node) {
      return { success: false, node: null, rewards: {} };
    }

    node.unlocked = true;
    this.tree.unlockedNodes.push(nodeId);
    this.updateTreeProgress();

    await this.saveTree();

    return {
      success: true,
      node,
      rewards: node.rewards,
    };
  }

  // Claim node rewards
  async claimNodeRewards(nodeId: string): Promise<{
    success: boolean;
    rewards: any;
  }> {
    if (!this.tree) {
      return { success: false, rewards: {} };
    }

    const node = this.tree.nodes.find(n => n.id === nodeId);
    if (!node || !node.unlocked || node.claimed) {
      return { success: false, rewards: {} };
    }

    node.claimed = true;
    this.tree.claimedNodes.push(nodeId);

    await this.saveTree();

    return {
      success: true,
      rewards: node.rewards,
    };
  }

  // Add experience to tree
  async addExperience(amount: number): Promise<{
    levelUp: boolean;
    newLevel: number;
    unlockedNodes: UnlockNode[];
  }> {
    if (!this.tree) {
      return { levelUp: false, newLevel: 0, unlockedNodes: [] };
    }

    this.tree.totalExperience += amount;
    const newLevel = Math.floor(this.tree.totalExperience / 100) + 1;
    
    let levelUp = false;
    if (newLevel > this.tree.currentLevel) {
      levelUp = true;
      this.tree.currentLevel = newLevel;
    }

    // Check for new node unlocks
    const unlockedNodes: UnlockNode[] = [];
    this.tree.nodes.forEach(node => {
      if (!node.unlocked && this.canUnlockNode(node.id).canUnlock) {
        node.unlocked = true;
        this.tree!.unlockedNodes.push(node.id);
        unlockedNodes.push(node);
      }
    });

    if (levelUp || unlockedNodes.length > 0) {
      this.updateTreeProgress();
      await this.saveTree();
    }

    return {
      levelUp,
      newLevel,
      unlockedNodes,
    };
  }

  // Update tree progress
  private updateTreeProgress(): void {
    if (!this.tree) return;

    const totalNodes = this.tree.nodes.length;
    const unlockedCount = this.tree.unlockedNodes.length;
    this.tree.treeProgress = (unlockedCount / totalNodes) * 100;
  }

  // Get available nodes
  getAvailableNodes(): UnlockNode[] {
    if (!this.tree) return [];
    return this.tree.nodes.filter(node => 
      node.unlocked && !node.claimed
    );
  }

  // Get unlockable nodes
  getUnlockableNodes(): UnlockNode[] {
    if (!this.tree) return [];
    return this.tree.nodes.filter(node => 
      !node.unlocked && this.canUnlockNode(node.id).canUnlock
    );
  }

  // Get tree statistics
  getTreeStats(): {
    totalNodes: number;
    unlockedNodes: number;
    claimedNodes: number;
    progressPercentage: number;
    currentLevel: number;
    totalExperience: number;
  } {
    if (!this.tree) {
      return {
        totalNodes: 0,
        unlockedNodes: 0,
        claimedNodes: 0,
        progressPercentage: 0,
        currentLevel: 0,
        totalExperience: 0,
      };
    }

    return {
      totalNodes: this.tree.nodes.length,
      unlockedNodes: this.tree.unlockedNodes.length,
      claimedNodes: this.tree.claimedNodes.length,
      progressPercentage: this.tree.treeProgress,
      currentLevel: this.tree.currentLevel,
      totalExperience: this.tree.totalExperience,
    };
  }

  // Get node by ID
  getNodeById(nodeId: string): UnlockNode | null {
    if (!this.tree) return null;
    return this.tree.nodes.find(n => n.id === nodeId) || null;
  }

  // Get tree structure
  getTreeStructure(): UnlockNode[] {
    if (!this.tree) return [];
    return this.tree.nodes;
  }

  // Save tree
  private async saveTree(): Promise<void> {
    if (!this.tree) return;

    try {
      await offlineManager.saveOfflineData(this.tree.userId, {
        unlockTree: this.tree,
      });

      await offlineManager.addPendingAction(this.tree.userId, {
        type: 'unlock_tree_update',
        data: this.tree,
      });
    } catch (error) {
      console.log('Error saving unlock tree data:', error);
    }
  }
}

export const unlockTreeSystem = UnlockTreeSystem.getInstance(); 