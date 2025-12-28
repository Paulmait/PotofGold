import { eventBus } from '../core/EventBus';
import { GameEventType, gameEvents } from '../core/GameEvents';

export interface Collection {
  id: string;
  name: string;
  description: string;
  category: CollectionCategory;
  items: CollectionItem[];
  progress: number;
  totalItems: number;
  completed: boolean;
  rewards: CollectionRewards;
  bonuses: CollectionBonus[];
  displayOrder: number;
  unlockedAt?: number;
  completedAt?: number;
}

export interface CollectionItem {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  category: string;
  subcategory?: string;
  obtained: boolean;
  count: number;
  firstObtained?: number;
  lastObtained?: number;
  source: string[];
  value: number;
  image?: string;
  effects?: ItemEffect[];
  lore?: string;
  setId?: string;
}

export interface ItemSet {
  id: string;
  name: string;
  items: string[];
  bonuses: SetBonus[];
  collected: number;
  total: number;
}

export interface SetBonus {
  itemsRequired: number;
  bonus: ItemEffect;
  active: boolean;
}

export interface ItemEffect {
  type: 'gold_bonus' | 'xp_bonus' | 'spawn_rate' | 'luck' | 'speed';
  value: number;
  isPercentage: boolean;
}

export enum CollectionCategory {
  COINS = 'coins',
  POWERUPS = 'powerups',
  SKINS = 'skins',
  ACHIEVEMENTS = 'achievements',
  SEASONAL = 'seasonal',
  LEGENDARY = 'legendary',
  MYSTERY = 'mystery',
}

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
}

export interface CollectionRewards {
  immediate: { gold: number; gems: number; items: string[] };
  milestones: CollectionMilestone[];
  completion: { gold: number; gems: number; items: string[]; title?: string };
}

export interface CollectionMilestone {
  percentage: number;
  reached: boolean;
  rewards: { gold: number; gems: number; items: string[] };
}

export interface CollectionBonus {
  type: 'permanent' | 'temporary';
  effect: ItemEffect;
  requirement: number; // Percentage of collection needed
  active: boolean;
}

export interface CollectionStats {
  totalItemsCollected: number;
  totalUniqueItems: number;
  totalCollectionsCompleted: number;
  favoriteItem?: string;
  rarestItem?: string;
  totalValue: number;
  completionPercentage: number;
}

export class CollectionBookSystem {
  private static instance: CollectionBookSystem;
  private collections: Map<string, Collection> = new Map();
  private playerItems: Map<string, CollectionItem> = new Map();
  private itemSets: Map<string, ItemSet> = new Map();
  private activeEffects: ItemEffect[] = [];
  private stats: CollectionStats = {
    totalItemsCollected: 0,
    totalUniqueItems: 0,
    totalCollectionsCompleted: 0,
    totalValue: 0,
    completionPercentage: 0,
  };
  private discoveryQueue: string[] = [];
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeCollections();
    this.initializeItemSets();
    this.setupEventListeners();
    this.startUpdateLoop();
  }

  static getInstance(): CollectionBookSystem {
    if (!CollectionBookSystem.instance) {
      CollectionBookSystem.instance = new CollectionBookSystem();
    }
    return CollectionBookSystem.instance;
  }

  private initializeCollections() {
    // Initialize default collections
    this.createCollection({
      id: 'basic_coins',
      name: 'Basic Coins',
      description: 'Collect all types of basic coins',
      category: CollectionCategory.COINS,
      items: this.generateCoinItems(),
      rewards: {
        immediate: { gold: 100, gems: 10, items: [] },
        milestones: [
          { percentage: 25, reached: false, rewards: { gold: 250, gems: 25, items: [] } },
          { percentage: 50, reached: false, rewards: { gold: 500, gems: 50, items: [] } },
          { percentage: 75, reached: false, rewards: { gold: 1000, gems: 100, items: [] } },
        ],
        completion: { gold: 5000, gems: 500, items: ['golden_collector_badge'] },
      },
      bonuses: [
        {
          type: 'permanent',
          effect: { type: 'gold_bonus', value: 5, isPercentage: true },
          requirement: 50,
          active: false,
        },
        {
          type: 'permanent',
          effect: { type: 'gold_bonus', value: 10, isPercentage: true },
          requirement: 100,
          active: false,
        },
      ],
      displayOrder: 1,
    });

    this.createCollection({
      id: 'legendary_items',
      name: 'Legendary Collection',
      description: 'The rarest items in the game',
      category: CollectionCategory.LEGENDARY,
      items: this.generateLegendaryItems(),
      rewards: {
        immediate: { gold: 1000, gems: 100, items: [] },
        milestones: [],
        completion: {
          gold: 50000,
          gems: 5000,
          items: ['mythic_collector_crown'],
          title: 'Legendary Collector',
        },
      },
      bonuses: [
        {
          type: 'permanent',
          effect: { type: 'luck', value: 50, isPercentage: true },
          requirement: 100,
          active: false,
        },
      ],
      displayOrder: 10,
    });
  }

  private initializeItemSets() {
    this.itemSets.set('golden_set', {
      id: 'golden_set',
      name: 'Golden Collection',
      items: ['gold_coin', 'gold_bar', 'gold_nugget', 'gold_crown'],
      bonuses: [
        {
          itemsRequired: 2,
          bonus: { type: 'gold_bonus', value: 5, isPercentage: true },
          active: false,
        },
        {
          itemsRequired: 4,
          bonus: { type: 'gold_bonus', value: 15, isPercentage: true },
          active: false,
        },
      ],
      collected: 0,
      total: 4,
    });
  }

  private setupEventListeners() {
    eventBus.on(GameEventType.ITEM_COLLECTED, (data: any) => {
      this.collectItem(data.itemType, data.itemId);
    });

    eventBus.on('collection:view', (data: any) => {
      this.viewCollection(data.collectionId);
    });

    eventBus.on('collection:claim', (data: any) => {
      this.claimRewards(data.collectionId, data.milestoneIndex);
    });
  }

  private startUpdateLoop() {
    this.updateInterval = setInterval(() => {
      this.updateStats();
      this.checkMilestones();
      this.processDiscoveryQueue();
    }, 5000);
  }

  createCollection(data: Partial<Collection>): Collection {
    const collection: Collection = {
      id: data.id || this.generateCollectionId(),
      name: data.name || 'New Collection',
      description: data.description || '',
      category: data.category || CollectionCategory.MYSTERY,
      items: data.items || [],
      progress: 0,
      totalItems: data.items?.length || 0,
      completed: false,
      rewards: data.rewards || this.getDefaultRewards(),
      bonuses: data.bonuses || [],
      displayOrder: data.displayOrder || 999,
    };

    this.collections.set(collection.id, collection);
    return collection;
  }

  collectItem(itemType: string, itemId?: string): boolean {
    const id = itemId || itemType;
    let item = this.playerItems.get(id);

    if (!item) {
      // First time collecting this item
      item = this.createItemFromTemplate(id);
      if (!item) return false;

      item.obtained = true;
      item.count = 1;
      item.firstObtained = Date.now();
      item.lastObtained = Date.now();

      this.playerItems.set(id, item);
      this.discoveryQueue.push(id);

      // Update stats
      this.stats.totalUniqueItems++;

      eventBus.emit('collection:new_item', {
        itemId: id,
        item: item,
      });

      // Check if this completes any sets
      this.checkItemSets(id);
    } else {
      // Already have this item
      item.count++;
      item.lastObtained = Date.now();
    }

    this.stats.totalItemsCollected++;
    this.stats.totalValue += item.value;

    // Update collections
    this.updateCollections(id);

    // Apply item effects if any
    if (item.effects) {
      this.applyItemEffects(item.effects);
    }

    gameEvents.emit(GameEventType.ACHIEVEMENT_PROGRESS, {
      type: 'collection',
      itemId: id,
      count: item.count,
    });

    return true;
  }

  private createItemFromTemplate(itemId: string): CollectionItem | null {
    // This would normally load from a database of all possible items
    const templates: Record<string, Partial<CollectionItem>> = {
      gold_coin: {
        name: 'Gold Coin',
        description: 'A shiny gold coin',
        rarity: ItemRarity.COMMON,
        category: 'coins',
        value: 10,
        source: ['gameplay', 'drops'],
      },
      diamond: {
        name: 'Diamond',
        description: 'A precious diamond',
        rarity: ItemRarity.LEGENDARY,
        category: 'gems',
        value: 1000,
        source: ['special_events', 'achievements'],
        effects: [{ type: 'luck', value: 10, isPercentage: true }],
      },
      mystery_box: {
        name: 'Mystery Box',
        description: 'What could be inside?',
        rarity: ItemRarity.EPIC,
        category: 'mystery',
        value: 500,
        source: ['purchase', 'gifts'],
      },
    };

    const template = templates[itemId];
    if (!template) return null;

    return {
      id: itemId,
      name: template.name || 'Unknown Item',
      description: template.description || '',
      rarity: template.rarity || ItemRarity.COMMON,
      category: template.category || 'misc',
      obtained: false,
      count: 0,
      source: template.source || [],
      value: template.value || 0,
      effects: template.effects,
      setId: template.setId,
    };
  }

  private updateCollections(itemId: string) {
    this.collections.forEach((collection) => {
      const collectionItem = collection.items.find((i) => i.id === itemId);
      if (collectionItem && !collectionItem.obtained) {
        collectionItem.obtained = true;
        collection.progress++;

        if (collection.progress === collection.totalItems && !collection.completed) {
          this.completeCollection(collection);
        } else {
          this.checkCollectionMilestones(collection);
        }

        // Check and activate bonuses
        this.checkCollectionBonuses(collection);
      }
    });
  }

  private completeCollection(collection: Collection) {
    collection.completed = true;
    collection.completedAt = Date.now();

    this.stats.totalCollectionsCompleted++;

    // Grant completion rewards
    const rewards = collection.rewards.completion;
    this.grantRewards(rewards);

    eventBus.emit('collection:completed', {
      collectionId: collection.id,
      name: collection.name,
      rewards: rewards,
    });

    gameEvents.emit(GameEventType.ACHIEVEMENT_UNLOCKED, {
      achievementId: `collection_${collection.id}`,
      playerId: 'current',
      rewards: [rewards],
    });
  }

  private checkCollectionMilestones(collection: Collection) {
    const percentage = (collection.progress / collection.totalItems) * 100;

    collection.rewards.milestones.forEach((milestone, index) => {
      if (!milestone.reached && percentage >= milestone.percentage) {
        milestone.reached = true;

        eventBus.emit('collection:milestone', {
          collectionId: collection.id,
          milestone: milestone.percentage,
          rewards: milestone.rewards,
        });
      }
    });
  }

  private checkCollectionBonuses(collection: Collection) {
    const percentage = (collection.progress / collection.totalItems) * 100;

    collection.bonuses.forEach((bonus) => {
      if (!bonus.active && percentage >= bonus.requirement) {
        bonus.active = true;
        this.activeEffects.push(bonus.effect);

        eventBus.emit('collection:bonus:activated', {
          collectionId: collection.id,
          effect: bonus.effect,
        });
      }
    });
  }

  private checkItemSets(itemId: string) {
    this.itemSets.forEach((set) => {
      if (set.items.includes(itemId)) {
        set.collected = set.items.filter((id) => this.playerItems.has(id)).length;

        set.bonuses.forEach((bonus) => {
          if (!bonus.active && set.collected >= bonus.itemsRequired) {
            bonus.active = true;
            this.activeEffects.push(bonus.bonus);

            eventBus.emit('set:bonus:activated', {
              setId: set.id,
              bonus: bonus.bonus,
            });
          }
        });

        if (set.collected === set.total) {
          eventBus.emit('set:completed', {
            setId: set.id,
            name: set.name,
          });
        }
      }
    });
  }

  claimRewards(collectionId: string, milestoneIndex?: number): boolean {
    const collection = this.collections.get(collectionId);
    if (!collection) return false;

    if (milestoneIndex !== undefined) {
      const milestone = collection.rewards.milestones[milestoneIndex];
      if (milestone && milestone.reached) {
        this.grantRewards(milestone.rewards);
        return true;
      }
    } else if (collection.completed) {
      this.grantRewards(collection.rewards.completion);
      return true;
    }

    return false;
  }

  private grantRewards(rewards: any) {
    if (rewards.gold) {
      gameEvents.emit(GameEventType.CURRENCY_EARNED, {
        type: 'gold',
        amount: rewards.gold,
        source: 'collection_reward',
      });
    }

    if (rewards.gems) {
      gameEvents.emit(GameEventType.CURRENCY_EARNED, {
        type: 'gems',
        amount: rewards.gems,
        source: 'collection_reward',
      });
    }

    if (rewards.items) {
      rewards.items.forEach((itemId: string) => {
        eventBus.emit('item:grant', { itemId });
      });
    }

    if (rewards.title) {
      eventBus.emit('title:grant', { title: rewards.title });
    }
  }

  private applyItemEffects(effects: ItemEffect[]) {
    effects.forEach((effect) => {
      this.activeEffects.push(effect);
      eventBus.emit('effect:apply', { effect });
    });
  }

  viewCollection(collectionId: string): Collection | null {
    return this.collections.get(collectionId) || null;
  }

  searchItems(query: string): CollectionItem[] {
    const results: CollectionItem[] = [];

    this.playerItems.forEach((item) => {
      if (
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      ) {
        results.push(item);
      }
    });

    return results;
  }

  getItemsByRarity(rarity: ItemRarity): CollectionItem[] {
    return Array.from(this.playerItems.values()).filter((item) => item.rarity === rarity);
  }

  getItemsByCategory(category: string): CollectionItem[] {
    return Array.from(this.playerItems.values()).filter((item) => item.category === category);
  }

  private updateStats() {
    let totalItems = 0;
    let totalPossibleItems = 0;

    this.collections.forEach((collection) => {
      totalItems += collection.progress;
      totalPossibleItems += collection.totalItems;
    });

    this.stats.completionPercentage =
      totalPossibleItems > 0 ? (totalItems / totalPossibleItems) * 100 : 0;

    // Find rarest item
    let rarestItem: CollectionItem | null = null;
    let rarestRarity = -1;

    this.playerItems.forEach((item) => {
      const rarityValue = Object.values(ItemRarity).indexOf(item.rarity);
      if (rarityValue > rarestRarity) {
        rarestRarity = rarityValue;
        rarestItem = item;
      }
    });

    if (rarestItem) {
      this.stats.rarestItem = rarestItem.id;
    }

    // Find favorite item (most collected)
    let favoriteItem: CollectionItem | null = null;
    let maxCount = 0;

    this.playerItems.forEach((item) => {
      if (item.count > maxCount) {
        maxCount = item.count;
        favoriteItem = item;
      }
    });

    if (favoriteItem) {
      this.stats.favoriteItem = favoriteItem.id;
    }
  }

  private checkMilestones() {
    // Global collection milestones
    const milestones = [
      { items: 10, reward: { gold: 100 } },
      { items: 50, reward: { gold: 500, gems: 50 } },
      { items: 100, reward: { gold: 1000, gems: 100 } },
      { items: 500, reward: { gold: 5000, gems: 500 } },
    ];

    milestones.forEach((milestone) => {
      if (this.stats.totalUniqueItems === milestone.items) {
        this.grantRewards(milestone.reward);

        eventBus.emit('collection:global:milestone', {
          items: milestone.items,
          reward: milestone.reward,
        });
      }
    });
  }

  private processDiscoveryQueue() {
    if (this.discoveryQueue.length === 0) return;

    const itemId = this.discoveryQueue.shift()!;
    const item = this.playerItems.get(itemId);

    if (item) {
      eventBus.emit('collection:discovery:animation', {
        itemId,
        item,
        rarity: item.rarity,
      });
    }
  }

  private generateCoinItems(): CollectionItem[] {
    const coins = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    return coins.map((type) => ({
      id: `${type}_coin`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Coin`,
      description: `A ${type} coin`,
      rarity: ItemRarity.COMMON,
      category: 'coins',
      obtained: false,
      count: 0,
      source: ['gameplay'],
      value: 10 * (coins.indexOf(type) + 1),
    }));
  }

  private generateLegendaryItems(): CollectionItem[] {
    return [
      {
        id: 'phoenix_feather',
        name: 'Phoenix Feather',
        description: 'A feather from the legendary phoenix',
        rarity: ItemRarity.LEGENDARY,
        category: 'legendary',
        obtained: false,
        count: 0,
        source: ['special_events'],
        value: 10000,
        effects: [{ type: 'xp_bonus', value: 50, isPercentage: true }],
        lore: 'Said to grant immortality to those who possess it',
      },
      {
        id: 'dragons_heart',
        name: "Dragon's Heart",
        description: 'The heart of an ancient dragon',
        rarity: ItemRarity.MYTHIC,
        category: 'legendary',
        obtained: false,
        count: 0,
        source: ['boss_defeat'],
        value: 50000,
        effects: [{ type: 'gold_bonus', value: 100, isPercentage: true }],
        lore: 'Contains the power of a thousand suns',
      },
    ];
  }

  private getDefaultRewards(): CollectionRewards {
    return {
      immediate: { gold: 50, gems: 5, items: [] },
      milestones: [],
      completion: { gold: 1000, gems: 100, items: [] },
    };
  }

  private generateCollectionId(): string {
    return `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods
  getCollections(): Collection[] {
    return Array.from(this.collections.values());
  }

  getPlayerItems(): CollectionItem[] {
    return Array.from(this.playerItems.values());
  }

  getStats(): CollectionStats {
    return this.stats;
  }

  getActiveEffects(): ItemEffect[] {
    return this.activeEffects;
  }

  getItemSets(): ItemSet[] {
    return Array.from(this.itemSets.values());
  }

  exportCollection(): any {
    return {
      collections: Array.from(this.collections.entries()),
      items: Array.from(this.playerItems.entries()),
      stats: this.stats,
    };
  }

  importCollection(data: any) {
    // Import saved collection data
    if (data.collections) {
      this.collections = new Map(data.collections);
    }
    if (data.items) {
      this.playerItems = new Map(data.items);
    }
    if (data.stats) {
      this.stats = data.stats;
    }
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const collectionBook = CollectionBookSystem.getInstance();
