import { eventBus } from '../core/EventBus';
import { GameEventType, gameEvents } from '../core/GameEvents';

export interface PrestigeLevel {
  level: number;
  name: string;
  icon: string;
  color: string;
  multipliers: PrestigeMultipliers;
  requirements: PrestigeRequirements;
  rewards: PrestigeRewards;
  perks: PrestigePerk[];
  unlocks: string[];
  achieved: boolean;
  achievedAt?: number;
}

export interface PrestigeMultipliers {
  gold: number;
  xp: number;
  score: number;
  itemDropRate: number;
  rarityChance: number;
  speed: number;
  powerupDuration: number;
  offlineEarnings: number;
}

export interface PrestigeRequirements {
  previousPrestige: number;
  level: number;
  totalGold: number;
  achievements: string[];
  items: string[];
  playtime: number; // in seconds
  customRequirements?: CustomRequirement[];
}

export interface CustomRequirement {
  id: string;
  description: string;
  check: () => boolean;
  progress: () => number;
  target: number;
}

export interface PrestigeRewards {
  immediate: {
    gems: number;
    prestigePoints: number;
    exclusiveItems: string[];
    titles: string[];
  };
  permanent: {
    skillPoints: number;
    inventorySlots: number;
    friendSlots: number;
    bankCapacity: number;
  };
}

export interface PrestigePerk {
  id: string;
  name: string;
  description: string;
  type: PerkType;
  value: number;
  stackable: boolean;
  maxStacks: number;
  currentStacks: number;
}

export enum PerkType {
  STARTING_GOLD = 'starting_gold',
  STARTING_ITEMS = 'starting_items',
  AUTO_COLLECT = 'auto_collect',
  DOUBLE_REWARDS = 'double_rewards',
  INSTANT_POWERUPS = 'instant_powerups',
  LUCKY_DROPS = 'lucky_drops',
  COMBO_KEEPER = 'combo_keeper',
  SHIELD = 'shield',
  MAGNET = 'magnet',
  TIME_WARP = 'time_warp',
}

export interface PrestigeSkillTree {
  id: string;
  name: string;
  branches: SkillBranch[];
  totalPoints: number;
  spentPoints: number;
  resetCost: number;
}

export interface SkillBranch {
  id: string;
  name: string;
  icon: string;
  skills: Skill[];
  requirement?: number; // Prestige level required
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  currentLevel: number;
  cost: number[];
  effects: SkillEffect[];
  prerequisites: string[];
  unlocked: boolean;
}

export interface SkillEffect {
  type: string;
  value: number;
  scaling: number; // per level
  isPercentage: boolean;
}

export interface PrestigeStats {
  currentPrestige: number;
  totalPrestiges: number;
  prestigePoints: number;
  lifetimeEarnings: number;
  fastestPrestige: number; // in seconds
  currentRunTime: number;
  currentRunEarnings: number;
  multiplierTotal: number;
}

export interface PrestigeLeaderboard {
  entries: PrestigeEntry[];
  lastUpdated: number;
  season: number;
}

export interface PrestigeEntry {
  playerId: string;
  playerName: string;
  prestigeLevel: number;
  prestigePoints: number;
  achievedAt: number;
  rank: number;
}

export class PrestigeSystem {
  private static instance: PrestigeSystem;
  private prestigeLevels: PrestigeLevel[] = [];
  private currentPrestige = 0;
  private stats: PrestigeStats;
  private skillTree: PrestigeSkillTree;
  private activePerks: Map<string, PrestigePerk> = new Map();
  private currentMultipliers: PrestigeMultipliers;
  private runStartTime = 0;
  private isPrestiging = false;
  private prestigeHistory: Array<{
    level: number;
    timestamp: number;
    duration: number;
    earnings: number;
  }> = [];
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.stats = this.getDefaultStats();
    this.currentMultipliers = this.getBaseMultipliers();
    this.skillTree = this.initializeSkillTree();
    this.initializePrestigeLevels();
    this.setupEventListeners();
    this.startUpdateLoop();
    this.runStartTime = Date.now();
  }

  static getInstance(): PrestigeSystem {
    if (!PrestigeSystem.instance) {
      PrestigeSystem.instance = new PrestigeSystem();
    }
    return PrestigeSystem.instance;
  }

  private initializePrestigeLevels() {
    const prestigeConfigs = [
      {
        level: 0,
        name: 'Novice',
        icon: '🌟',
        color: '#808080',
        multipliers: { gold: 1, xp: 1, score: 1, itemDropRate: 1, rarityChance: 1, speed: 1, powerupDuration: 1, offlineEarnings: 1 },
      },
      {
        level: 1,
        name: 'Bronze',
        icon: '🥉',
        color: '#CD7F32',
        multipliers: { gold: 1.5, xp: 1.5, score: 1.2, itemDropRate: 1.1, rarityChance: 1.05, speed: 1.05, powerupDuration: 1.1, offlineEarnings: 1.2 },
      },
      {
        level: 2,
        name: 'Silver',
        icon: '🥈',
        color: '#C0C0C0',
        multipliers: { gold: 2, xp: 2, score: 1.5, itemDropRate: 1.2, rarityChance: 1.1, speed: 1.1, powerupDuration: 1.2, offlineEarnings: 1.5 },
      },
      {
        level: 3,
        name: 'Gold',
        icon: '🥇',
        color: '#FFD700',
        multipliers: { gold: 3, xp: 3, score: 2, itemDropRate: 1.3, rarityChance: 1.15, speed: 1.15, powerupDuration: 1.3, offlineEarnings: 2 },
      },
      {
        level: 4,
        name: 'Platinum',
        icon: '💎',
        color: '#E5E4E2',
        multipliers: { gold: 4, xp: 4, score: 2.5, itemDropRate: 1.5, rarityChance: 1.2, speed: 1.2, powerupDuration: 1.5, offlineEarnings: 2.5 },
      },
      {
        level: 5,
        name: 'Diamond',
        icon: '💠',
        color: '#B9F2FF',
        multipliers: { gold: 5, xp: 5, score: 3, itemDropRate: 1.7, rarityChance: 1.3, speed: 1.25, powerupDuration: 1.7, offlineEarnings: 3 },
      },
      {
        level: 10,
        name: 'Master',
        icon: '👑',
        color: '#FFD700',
        multipliers: { gold: 10, xp: 10, score: 5, itemDropRate: 2, rarityChance: 1.5, speed: 1.5, powerupDuration: 2, offlineEarnings: 5 },
      },
      {
        level: 20,
        name: 'Grandmaster',
        icon: '🌟',
        color: '#FF6B6B',
        multipliers: { gold: 20, xp: 20, score: 10, itemDropRate: 3, rarityChance: 2, speed: 2, powerupDuration: 3, offlineEarnings: 10 },
      },
      {
        level: 50,
        name: 'Legend',
        icon: '🔥',
        color: '#FF0000',
        multipliers: { gold: 50, xp: 50, score: 25, itemDropRate: 5, rarityChance: 3, speed: 3, powerupDuration: 5, offlineEarnings: 25 },
      },
      {
        level: 100,
        name: 'Mythic',
        icon: '⚡',
        color: '#9400D3',
        multipliers: { gold: 100, xp: 100, score: 50, itemDropRate: 10, rarityChance: 5, speed: 5, powerupDuration: 10, offlineEarnings: 50 },
      },
    ];

    prestigeConfigs.forEach(config => {
      this.prestigeLevels.push({
        level: config.level,
        name: config.name,
        icon: config.icon,
        color: config.color,
        multipliers: config.multipliers,
        requirements: this.generateRequirements(config.level),
        rewards: this.generateRewards(config.level),
        perks: this.generatePerks(config.level),
        unlocks: this.generateUnlocks(config.level),
        achieved: false,
      });
    });
  }

  private generateRequirements(level: number): PrestigeRequirements {
    const base = {
      previousPrestige: Math.max(0, level - 1),
      level: 50 + level * 10,
      totalGold: Math.pow(10, 6 + level), // 1M, 10M, 100M, etc.
      achievements: [],
      items: [],
      playtime: 3600 * Math.pow(2, level), // 1h, 2h, 4h, etc.
    };

    // Add custom requirements for higher prestiges
    if (level >= 5) {
      base.achievements.push('master_collector', 'speed_demon', 'combo_king');
    }
    if (level >= 10) {
      base.items.push('legendary_item_1', 'legendary_item_2');
    }

    return base;
  }

  private generateRewards(level: number): PrestigeRewards {
    return {
      immediate: {
        gems: 100 * Math.pow(2, level),
        prestigePoints: 10 * (level + 1),
        exclusiveItems: level >= 5 ? [`prestige_${level}_skin`] : [],
        titles: level >= 10 ? [`${this.prestigeLevels[level]?.name || 'Prestige'} Player`] : [],
      },
      permanent: {
        skillPoints: 3 + Math.floor(level / 2),
        inventorySlots: level >= 3 ? 5 * level : 0,
        friendSlots: level >= 5 ? 2 * level : 0,
        bankCapacity: 100000 * Math.pow(10, level),
      },
    };
  }

  private generatePerks(level: number): PrestigePerk[] {
    const perks: PrestigePerk[] = [];

    if (level >= 1) {
      perks.push({
        id: 'starting_boost',
        name: 'Starting Boost',
        description: 'Start each run with bonus gold',
        type: PerkType.STARTING_GOLD,
        value: 1000 * level,
        stackable: true,
        maxStacks: 10,
        currentStacks: 1,
      });
    }

    if (level >= 3) {
      perks.push({
        id: 'auto_collector',
        name: 'Auto Collector',
        description: 'Automatically collect nearby items',
        type: PerkType.AUTO_COLLECT,
        value: 5 + level,
        stackable: false,
        maxStacks: 1,
        currentStacks: 1,
      });
    }

    if (level >= 5) {
      perks.push({
        id: 'combo_protection',
        name: 'Combo Protection',
        description: 'Keep combo on miss',
        type: PerkType.COMBO_KEEPER,
        value: 0.1 * level, // 10% chance per level
        stackable: true,
        maxStacks: 5,
        currentStacks: 1,
      });
    }

    if (level >= 10) {
      perks.push({
        id: 'time_warp',
        name: 'Time Warp',
        description: 'Slow down time when in danger',
        type: PerkType.TIME_WARP,
        value: 2, // 2x slower
        stackable: false,
        maxStacks: 1,
        currentStacks: 1,
      });
    }

    return perks;
  }

  private generateUnlocks(level: number): string[] {
    const unlocks: string[] = [];

    if (level >= 1) unlocks.push('prestige_shop');
    if (level >= 3) unlocks.push('skill_tree');
    if (level >= 5) unlocks.push('prestige_challenges');
    if (level >= 10) unlocks.push('ascension_mode');
    if (level >= 20) unlocks.push('infinite_mode');
    if (level >= 50) unlocks.push('god_mode');

    return unlocks;
  }

  private initializeSkillTree(): PrestigeSkillTree {
    return {
      id: 'main_tree',
      name: 'Prestige Skills',
      branches: [
        {
          id: 'wealth',
          name: 'Wealth',
          icon: '💰',
          skills: this.createWealthSkills(),
        },
        {
          id: 'power',
          name: 'Power',
          icon: '⚡',
          skills: this.createPowerSkills(),
        },
        {
          id: 'luck',
          name: 'Luck',
          icon: '🍀',
          skills: this.createLuckSkills(),
        },
        {
          id: 'mastery',
          name: 'Mastery',
          icon: '🎯',
          skills: this.createMasterySkills(),
          requirement: 5,
        },
      ],
      totalPoints: 0,
      spentPoints: 0,
      resetCost: 100,
    };
  }

  private createWealthSkills(): Skill[] {
    return [
      {
        id: 'golden_touch',
        name: 'Golden Touch',
        description: 'Increase gold earned',
        maxLevel: 20,
        currentLevel: 0,
        cost: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10],
        effects: [{
          type: 'gold_multiplier',
          value: 5,
          scaling: 5,
          isPercentage: true,
        }],
        prerequisites: [],
        unlocked: true,
      },
      {
        id: 'treasure_hunter',
        name: 'Treasure Hunter',
        description: 'Find more valuable items',
        maxLevel: 10,
        currentLevel: 0,
        cost: [2, 2, 3, 3, 4, 4, 5, 5, 6, 6],
        effects: [{
          type: 'item_value',
          value: 10,
          scaling: 10,
          isPercentage: true,
        }],
        prerequisites: ['golden_touch'],
        unlocked: false,
      },
      {
        id: 'midas_blessing',
        name: 'Midas Blessing',
        description: 'Everything you touch turns to gold',
        maxLevel: 5,
        currentLevel: 0,
        cost: [5, 10, 15, 20, 25],
        effects: [{
          type: 'gold_conversion',
          value: 1,
          scaling: 1,
          isPercentage: true,
        }],
        prerequisites: ['treasure_hunter'],
        unlocked: false,
      },
    ];
  }

  private createPowerSkills(): Skill[] {
    return [
      {
        id: 'power_surge',
        name: 'Power Surge',
        description: 'Increase powerup duration',
        maxLevel: 15,
        currentLevel: 0,
        cost: Array(15).fill(0).map((_, i) => i + 1),
        effects: [{
          type: 'powerup_duration',
          value: 5,
          scaling: 5,
          isPercentage: true,
        }],
        prerequisites: [],
        unlocked: true,
      },
      {
        id: 'double_trouble',
        name: 'Double Trouble',
        description: 'Chance to get double powerups',
        maxLevel: 10,
        currentLevel: 0,
        cost: Array(10).fill(0).map((_, i) => (i + 1) * 2),
        effects: [{
          type: 'double_powerup_chance',
          value: 2,
          scaling: 2,
          isPercentage: true,
        }],
        prerequisites: ['power_surge'],
        unlocked: false,
      },
    ];
  }

  private createLuckSkills(): Skill[] {
    return [
      {
        id: 'fortunate_one',
        name: 'Fortunate One',
        description: 'Increase rare item chance',
        maxLevel: 20,
        currentLevel: 0,
        cost: Array(20).fill(0).map((_, i) => Math.floor((i + 1) * 1.5)),
        effects: [{
          type: 'rare_item_chance',
          value: 2,
          scaling: 2,
          isPercentage: true,
        }],
        prerequisites: [],
        unlocked: true,
      },
      {
        id: 'critical_fortune',
        name: 'Critical Fortune',
        description: 'Chance for critical rewards',
        maxLevel: 10,
        currentLevel: 0,
        cost: Array(10).fill(0).map((_, i) => (i + 1) * 3),
        effects: [{
          type: 'critical_chance',
          value: 1,
          scaling: 1,
          isPercentage: true,
        }],
        prerequisites: ['fortunate_one'],
        unlocked: false,
      },
    ];
  }

  private createMasterySkills(): Skill[] {
    return [
      {
        id: 'prestige_mastery',
        name: 'Prestige Mastery',
        description: 'Reduce prestige requirements',
        maxLevel: 10,
        currentLevel: 0,
        cost: Array(10).fill(0).map((_, i) => (i + 1) * 5),
        effects: [{
          type: 'prestige_requirement_reduction',
          value: 2,
          scaling: 2,
          isPercentage: true,
        }],
        prerequisites: [],
        unlocked: true,
      },
      {
        id: 'eternal_progress',
        name: 'Eternal Progress',
        description: 'Keep some progress on prestige',
        maxLevel: 5,
        currentLevel: 0,
        cost: [10, 20, 30, 40, 50],
        effects: [{
          type: 'progress_retention',
          value: 5,
          scaling: 5,
          isPercentage: true,
        }],
        prerequisites: ['prestige_mastery'],
        unlocked: false,
      },
    ];
  }

  private setupEventListeners() {
    eventBus.on('prestige:attempt', () => {
      this.attemptPrestige();
    });

    eventBus.on('skill:upgrade', (data: { skillId: string }) => {
      this.upgradeSkill(data.skillId);
    });

    eventBus.on('skill:reset', () => {
      this.resetSkillTree();
    });

    eventBus.on('game:currency:earned', (data: any) => {
      if (data.type === 'gold') {
        this.stats.currentRunEarnings += data.amount;
        this.stats.lifetimeEarnings += data.amount;
      }
    });
  }

  private startUpdateLoop() {
    this.updateInterval = setInterval(() => {
      this.updateRunTime();
      this.checkPrestigeAvailability();
      this.updateMultipliers();
    }, 1000);
  }

  canPrestige(): boolean {
    if (this.isPrestiging) return false;

    const nextLevel = this.getNextPrestigeLevel();
    if (!nextLevel) return false;

    return this.checkRequirements(nextLevel.requirements);
  }

  private checkRequirements(requirements: PrestigeRequirements): boolean {
    // Check previous prestige
    if (this.currentPrestige < requirements.previousPrestige) return false;

    // Check level requirement
    const playerLevel = this.getPlayerLevel();
    if (playerLevel < requirements.level) return false;

    // Check gold requirement
    if (this.stats.currentRunEarnings < requirements.totalGold) return false;

    // Check playtime
    const currentRunTime = (Date.now() - this.runStartTime) / 1000;
    if (currentRunTime < requirements.playtime) return false;

    // Check custom requirements
    if (requirements.customRequirements) {
      for (const req of requirements.customRequirements) {
        if (!req.check()) return false;
      }
    }

    return true;
  }

  async attemptPrestige(): Promise<boolean> {
    if (!this.canPrestige()) {
      eventBus.emit('notification:show', {
        message: 'Prestige requirements not met!',
        type: 'error',
      });
      return false;
    }

    this.isPrestiging = true;

    // Show confirmation dialog
    const confirmed = await this.confirmPrestige();
    if (!confirmed) {
      this.isPrestiging = false;
      return false;
    }

    // Perform prestige
    await this.performPrestige();

    this.isPrestiging = false;
    return true;
  }

  private async confirmPrestige(): Promise<boolean> {
    return new Promise((resolve) => {
      eventBus.emit('ui:modal:open', {
        type: 'prestige_confirm',
        data: {
          currentLevel: this.currentPrestige,
          nextLevel: this.currentPrestige + 1,
          rewards: this.getNextPrestigeLevel()?.rewards,
          callback: (confirmed: boolean) => resolve(confirmed),
        },
      });
    });
  }

  private async performPrestige() {
    const runDuration = (Date.now() - this.runStartTime) / 1000;
    const nextLevel = this.getNextPrestigeLevel();

    if (!nextLevel) return;

    // Record prestige history
    this.prestigeHistory.push({
      level: this.currentPrestige,
      timestamp: Date.now(),
      duration: runDuration,
      earnings: this.stats.currentRunEarnings,
    });

    // Update stats
    this.stats.totalPrestiges++;
    this.stats.currentPrestige++;
    this.currentPrestige++;

    if (runDuration < this.stats.fastestPrestige || this.stats.fastestPrestige === 0) {
      this.stats.fastestPrestige = runDuration;
    }

    // Mark level as achieved
    nextLevel.achieved = true;
    nextLevel.achievedAt = Date.now();

    // Grant rewards
    await this.grantPrestigeRewards(nextLevel.rewards);

    // Activate perks
    nextLevel.perks.forEach(perk => {
      this.activePerks.set(perk.id, perk);
    });

    // Update multipliers
    this.currentMultipliers = this.calculateTotalMultipliers();

    // Apply permanent upgrades
    this.applyPermanentUpgrades(nextLevel.rewards.permanent);

    // Reset current run
    await this.resetCurrentRun();

    // Emit prestige event
    gameEvents.emit(GameEventType.ACHIEVEMENT_UNLOCKED, {
      achievementId: `prestige_${this.currentPrestige}`,
      playerId: 'current',
      rewards: [nextLevel.rewards],
    });

    eventBus.emit('prestige:completed', {
      level: this.currentPrestige,
      multipliers: this.currentMultipliers,
      perks: Array.from(this.activePerks.values()),
    });
  }

  private async grantPrestigeRewards(rewards: PrestigeRewards) {
    // Grant gems
    gameEvents.emit(GameEventType.CURRENCY_EARNED, {
      type: 'gems',
      amount: rewards.immediate.gems,
      source: 'prestige',
    });

    // Grant prestige points
    this.stats.prestigePoints += rewards.immediate.prestigePoints;
    this.skillTree.totalPoints += rewards.immediate.prestigePoints;

    // Grant exclusive items
    rewards.immediate.exclusiveItems.forEach(item => {
      eventBus.emit('item:unlock:exclusive', { itemId: item });
    });

    // Grant titles
    rewards.immediate.titles.forEach(title => {
      eventBus.emit('title:grant', { title });
    });
  }

  private applyPermanentUpgrades(permanent: any) {
    eventBus.emit('inventory:expand', { slots: permanent.inventorySlots });
    eventBus.emit('friends:expand', { slots: permanent.friendSlots });
    eventBus.emit('bank:expand', { capacity: permanent.bankCapacity });
  }

  private async resetCurrentRun() {
    // Reset run-specific stats
    this.stats.currentRunEarnings = 0;
    this.stats.currentRunTime = 0;
    this.runStartTime = Date.now();

    // Apply starting perks
    this.applyStartingPerks();

    // Emit reset event
    eventBus.emit('game:reset:prestige', {
      prestigeLevel: this.currentPrestige,
      startingBonuses: this.getStartingBonuses(),
    });
  }

  private applyStartingPerks() {
    this.activePerks.forEach(perk => {
      switch (perk.type) {
        case PerkType.STARTING_GOLD:
          gameEvents.emit(GameEventType.CURRENCY_EARNED, {
            type: 'gold',
            amount: perk.value * perk.currentStacks,
            source: 'prestige_perk',
          });
          break;
        case PerkType.STARTING_ITEMS:
          // Grant starting items
          break;
        case PerkType.AUTO_COLLECT:
          eventBus.emit('auto_collect:enable', { range: perk.value });
          break;
      }
    });
  }

  upgradeSkill(skillId: string): boolean {
    const skill = this.findSkill(skillId);
    if (!skill) return false;

    if (skill.currentLevel >= skill.maxLevel) {
      eventBus.emit('notification:show', {
        message: 'Skill already at max level!',
        type: 'warning',
      });
      return false;
    }

    const cost = skill.cost[skill.currentLevel];
    if (this.skillTree.totalPoints - this.skillTree.spentPoints < cost) {
      eventBus.emit('notification:show', {
        message: 'Not enough skill points!',
        type: 'error',
      });
      return false;
    }

    // Check prerequisites
    if (!this.checkPrerequisites(skill)) {
      eventBus.emit('notification:show', {
        message: 'Prerequisites not met!',
        type: 'error',
      });
      return false;
    }

    // Upgrade skill
    skill.currentLevel++;
    this.skillTree.spentPoints += cost;

    // Apply skill effects
    this.applySkillEffects(skill);

    // Unlock dependent skills
    this.checkSkillUnlocks();

    eventBus.emit('skill:upgraded', {
      skillId,
      level: skill.currentLevel,
      effects: skill.effects,
    });

    return true;
  }

  private findSkill(skillId: string): Skill | null {
    for (const branch of this.skillTree.branches) {
      const skill = branch.skills.find(s => s.id === skillId);
      if (skill) return skill;
    }
    return null;
  }

  private checkPrerequisites(skill: Skill): boolean {
    for (const prereqId of skill.prerequisites) {
      const prereq = this.findSkill(prereqId);
      if (!prereq || prereq.currentLevel === 0) return false;
    }
    return true;
  }

  private applySkillEffects(skill: Skill) {
    skill.effects.forEach(effect => {
      const value = effect.value + (effect.scaling * (skill.currentLevel - 1));
      
      switch (effect.type) {
        case 'gold_multiplier':
          this.currentMultipliers.gold *= (1 + value / 100);
          break;
        case 'powerup_duration':
          this.currentMultipliers.powerupDuration *= (1 + value / 100);
          break;
        case 'rare_item_chance':
          this.currentMultipliers.rarityChance *= (1 + value / 100);
          break;
      }
    });

    this.updateMultipliers();
  }

  private checkSkillUnlocks() {
    this.skillTree.branches.forEach(branch => {
      branch.skills.forEach(skill => {
        if (!skill.unlocked) {
          skill.unlocked = this.checkPrerequisites(skill);
        }
      });
    });
  }

  resetSkillTree(): boolean {
    if (this.stats.prestigePoints < this.skillTree.resetCost) {
      eventBus.emit('notification:show', {
        message: 'Not enough prestige points to reset!',
        type: 'error',
      });
      return false;
    }

    // Refund all spent points
    this.skillTree.totalPoints += this.skillTree.spentPoints;
    this.skillTree.spentPoints = 0;

    // Reset all skills
    this.skillTree.branches.forEach(branch => {
      branch.skills.forEach(skill => {
        skill.currentLevel = 0;
      });
    });

    // Pay reset cost
    this.stats.prestigePoints -= this.skillTree.resetCost;
    
    // Increase reset cost
    this.skillTree.resetCost = Math.floor(this.skillTree.resetCost * 1.5);

    // Recalculate multipliers
    this.currentMultipliers = this.calculateTotalMultipliers();

    eventBus.emit('skill:tree:reset', {
      refundedPoints: this.skillTree.totalPoints,
      newResetCost: this.skillTree.resetCost,
    });

    return true;
  }

  private calculateTotalMultipliers(): PrestigeMultipliers {
    const base = this.getBaseMultipliers();
    const prestigeLevel = this.prestigeLevels[this.currentPrestige] || this.prestigeLevels[0];
    
    // Combine base, prestige level, and skill multipliers
    const combined: PrestigeMultipliers = {
      gold: base.gold * prestigeLevel.multipliers.gold,
      xp: base.xp * prestigeLevel.multipliers.xp,
      score: base.score * prestigeLevel.multipliers.score,
      itemDropRate: base.itemDropRate * prestigeLevel.multipliers.itemDropRate,
      rarityChance: base.rarityChance * prestigeLevel.multipliers.rarityChance,
      speed: base.speed * prestigeLevel.multipliers.speed,
      powerupDuration: base.powerupDuration * prestigeLevel.multipliers.powerupDuration,
      offlineEarnings: base.offlineEarnings * prestigeLevel.multipliers.offlineEarnings,
    };

    // Apply skill bonuses
    this.skillTree.branches.forEach(branch => {
      branch.skills.forEach(skill => {
        if (skill.currentLevel > 0) {
          skill.effects.forEach(effect => {
            const value = effect.value + (effect.scaling * (skill.currentLevel - 1));
            this.applyMultiplierBonus(combined, effect.type, value, effect.isPercentage);
          });
        }
      });
    });

    return combined;
  }

  private applyMultiplierBonus(
    multipliers: PrestigeMultipliers,
    type: string,
    value: number,
    isPercentage: boolean
  ) {
    const bonus = isPercentage ? (1 + value / 100) : value;
    
    switch (type) {
      case 'gold_multiplier':
        multipliers.gold *= bonus;
        break;
      case 'xp_multiplier':
        multipliers.xp *= bonus;
        break;
      case 'powerup_duration':
        multipliers.powerupDuration *= bonus;
        break;
      case 'rare_item_chance':
        multipliers.rarityChance *= bonus;
        break;
    }
  }

  private updateRunTime() {
    this.stats.currentRunTime = (Date.now() - this.runStartTime) / 1000;
  }

  private checkPrestigeAvailability() {
    const wasAvailable = this.canPrestige();
    const isAvailable = this.canPrestige();

    if (!wasAvailable && isAvailable) {
      eventBus.emit('prestige:available', {
        level: this.currentPrestige + 1,
      });
    }
  }

  private updateMultipliers() {
    this.stats.multiplierTotal = Object.values(this.currentMultipliers)
      .reduce((sum, mult) => sum + mult, 0);
  }

  private getPlayerLevel(): number {
    // This would get from actual player stats
    return 100;
  }

  private getNextPrestigeLevel(): PrestigeLevel | null {
    return this.prestigeLevels.find(p => p.level === this.currentPrestige + 1) || null;
  }

  private getStartingBonuses(): any {
    const bonuses: any = {
      gold: 0,
      items: [],
      powerups: [],
    };

    this.activePerks.forEach(perk => {
      if (perk.type === PerkType.STARTING_GOLD) {
        bonuses.gold += perk.value * perk.currentStacks;
      }
    });

    return bonuses;
  }

  private getBaseMultipliers(): PrestigeMultipliers {
    return {
      gold: 1,
      xp: 1,
      score: 1,
      itemDropRate: 1,
      rarityChance: 1,
      speed: 1,
      powerupDuration: 1,
      offlineEarnings: 1,
    };
  }

  private getDefaultStats(): PrestigeStats {
    return {
      currentPrestige: 0,
      totalPrestiges: 0,
      prestigePoints: 0,
      lifetimeEarnings: 0,
      fastestPrestige: 0,
      currentRunTime: 0,
      currentRunEarnings: 0,
      multiplierTotal: 8, // Sum of all base multipliers
    };
  }

  // Public methods
  getPrestigeLevel(): number {
    return this.currentPrestige;
  }

  getMultipliers(): PrestigeMultipliers {
    return this.currentMultipliers;
  }

  getStats(): PrestigeStats {
    return this.stats;
  }

  getSkillTree(): PrestigeSkillTree {
    return this.skillTree;
  }

  getActivePerks(): PrestigePerk[] {
    return Array.from(this.activePerks.values());
  }

  getPrestigeLevels(): PrestigeLevel[] {
    return this.prestigeLevels;
  }

  getRequirementsProgress(): any {
    const nextLevel = this.getNextPrestigeLevel();
    if (!nextLevel) return null;

    const req = nextLevel.requirements;
    const playerLevel = this.getPlayerLevel();
    const currentRunTime = (Date.now() - this.runStartTime) / 1000;

    return {
      level: { current: playerLevel, required: req.level },
      gold: { current: this.stats.currentRunEarnings, required: req.totalGold },
      playtime: { current: currentRunTime, required: req.playtime },
      achievements: { current: 0, required: req.achievements.length },
      items: { current: 0, required: req.items.length },
    };
  }

  applyMultiplier(type: keyof PrestigeMultipliers, value: number): number {
    return value * this.currentMultipliers[type];
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const prestigeSystem = PrestigeSystem.getInstance();