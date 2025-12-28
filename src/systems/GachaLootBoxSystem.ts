/**
 * Gacha & Loot Box System
 * Randomized reward mechanics with pity systems and collection features
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';

// ========== GACHA CORE ==========

export interface LootBox {
  id: string;
  name: string;
  tier: BoxTier;
  cost: BoxCost;
  guaranteedRarity?: ItemRarity;
  pool: LootPool;
  animation: BoxAnimation;
  pitySystem?: PitySystem;
  displayOdds: boolean; // For compliance
}

export type BoxTier = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'special';

interface BoxCost {
  currency: 'coins' | 'gems' | 'keys' | 'tickets';
  amount: number;
}

interface LootPool {
  items: LootItem[];
  guarantees: Guarantee[];
  weights: RarityWeights;
}

interface LootItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  weight: number; // Drop weight within rarity
  exclusive: boolean;
  limited?: boolean; // Time-limited item
  new?: boolean;
  duplicateAction?: DuplicateAction;
}

export type ItemType =
  | 'skin'
  | 'trail'
  | 'frame'
  | 'emote'
  | 'badge'
  | 'currency'
  | 'booster'
  | 'material';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface Guarantee {
  condition: string;
  reward: ItemRarity;
  count: number;
}

interface RarityWeights {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  mythic: number;
}

interface BoxAnimation {
  type: 'shake' | 'glow' | 'explode' | 'cosmic' | 'rainbow';
  duration: number;
  suspenseDelay: number;
}

interface PitySystem {
  enabled: boolean;
  counter: number;
  threshold: number; // Guaranteed rare+ after X pulls
  type: 'soft' | 'hard'; // Soft increases odds, hard guarantees
}

interface DuplicateAction {
  type: 'convert' | 'shard' | 'currency';
  value: number;
  currency?: string;
}

export class GachaSystem {
  private lootBoxes: Map<string, LootBox> = new Map();
  private pullHistory: PullRecord[] = [];
  private collection: CollectedItem[] = [];
  private pityCounters: Map<string, number> = new Map();
  private animations: Map<string, Animated.Value> = new Map();

  constructor() {
    this.initializeLootBoxes();
    this.loadPullHistory();
  }

  private initializeLootBoxes() {
    // Common Box
    this.lootBoxes.set('common_box', {
      id: 'common_box',
      name: 'Common Crate',
      tier: 'common',
      cost: { currency: 'coins', amount: 1000 },
      pool: {
        items: this.generateItemPool('common'),
        guarantees: [],
        weights: {
          common: 70,
          rare: 25,
          epic: 4,
          legendary: 0.9,
          mythic: 0.1,
        },
      },
      animation: {
        type: 'shake',
        duration: 1000,
        suspenseDelay: 500,
      },
      displayOdds: true,
    });

    // Rare Box
    this.lootBoxes.set('rare_box', {
      id: 'rare_box',
      name: 'Rare Crate',
      tier: 'rare',
      cost: { currency: 'gems', amount: 50 },
      guaranteedRarity: 'rare',
      pool: {
        items: this.generateItemPool('rare'),
        guarantees: [{ condition: 'always', reward: 'rare', count: 1 }],
        weights: {
          common: 0,
          rare: 60,
          epic: 30,
          legendary: 8,
          mythic: 2,
        },
      },
      animation: {
        type: 'glow',
        duration: 1500,
        suspenseDelay: 750,
      },
      pitySystem: {
        enabled: true,
        counter: 0,
        threshold: 10,
        type: 'soft',
      },
      displayOdds: true,
    });

    // Epic Box
    this.lootBoxes.set('epic_box', {
      id: 'epic_box',
      name: 'Epic Chest',
      tier: 'epic',
      cost: { currency: 'gems', amount: 150 },
      guaranteedRarity: 'epic',
      pool: {
        items: this.generateItemPool('epic'),
        guarantees: [{ condition: 'always', reward: 'epic', count: 1 }],
        weights: {
          common: 0,
          rare: 0,
          epic: 70,
          legendary: 25,
          mythic: 5,
        },
      },
      animation: {
        type: 'explode',
        duration: 2000,
        suspenseDelay: 1000,
      },
      pitySystem: {
        enabled: true,
        counter: 0,
        threshold: 20,
        type: 'hard',
      },
      displayOdds: true,
    });

    // Legendary Box
    this.lootBoxes.set('legendary_box', {
      id: 'legendary_box',
      name: 'Legendary Vault',
      tier: 'legendary',
      cost: { currency: 'gems', amount: 500 },
      guaranteedRarity: 'legendary',
      pool: {
        items: this.generateItemPool('legendary'),
        guarantees: [
          { condition: 'always', reward: 'legendary', count: 1 },
          { condition: '10_pull', reward: 'epic', count: 2 },
        ],
        weights: {
          common: 0,
          rare: 0,
          epic: 0,
          legendary: 85,
          mythic: 15,
        },
      },
      animation: {
        type: 'cosmic',
        duration: 3000,
        suspenseDelay: 1500,
      },
      pitySystem: {
        enabled: true,
        counter: 0,
        threshold: 50,
        type: 'hard',
      },
      displayOdds: true,
    });

    // Special Event Box
    this.lootBoxes.set('event_box', {
      id: 'event_box',
      name: 'Event Mystery Box',
      tier: 'special',
      cost: { currency: 'tickets', amount: 100 },
      pool: {
        items: this.generateEventItems(),
        guarantees: [{ condition: 'first_pull', reward: 'epic', count: 1 }],
        weights: {
          common: 40,
          rare: 35,
          epic: 20,
          legendary: 4,
          mythic: 1,
        },
      },
      animation: {
        type: 'rainbow',
        duration: 2500,
        suspenseDelay: 1250,
      },
      displayOdds: true,
    });

    // 10-Pull Mega Box
    this.lootBoxes.set('mega_box_10', {
      id: 'mega_box_10',
      name: '10x Mega Pull',
      tier: 'special',
      cost: { currency: 'gems', amount: 450 }, // Discount for bulk
      guaranteedRarity: 'epic',
      pool: {
        items: this.generateItemPool('all'),
        guarantees: [
          { condition: 'always', reward: 'epic', count: 1 },
          { condition: 'always', reward: 'rare', count: 3 },
        ],
        weights: {
          common: 50,
          rare: 30,
          epic: 15,
          legendary: 4,
          mythic: 1,
        },
      },
      animation: {
        type: 'cosmic',
        duration: 5000,
        suspenseDelay: 2000,
      },
      pitySystem: {
        enabled: true,
        counter: 0,
        threshold: 100,
        type: 'hard',
      },
      displayOdds: true,
    });
  }

  private generateItemPool(tier: string): LootItem[] {
    const items: LootItem[] = [];

    // Generate skins
    const skinRarities: ItemRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];
    skinRarities.forEach((rarity) => {
      for (let i = 0; i < 5; i++) {
        items.push({
          id: `skin_${rarity}_${i}`,
          name: `${this.getRarityName(rarity)} Skin ${i + 1}`,
          type: 'skin',
          rarity,
          weight: 100,
          exclusive: rarity === 'mythic',
          duplicateAction: {
            type: 'shard',
            value: this.getShardValue(rarity),
          },
        });
      }
    });

    // Generate trails
    ['rare', 'epic', 'legendary'].forEach((rarity) => {
      for (let i = 0; i < 3; i++) {
        items.push({
          id: `trail_${rarity}_${i}`,
          name: `${this.getRarityName(rarity)} Trail ${i + 1}`,
          type: 'trail',
          rarity: rarity as ItemRarity,
          weight: 80,
          exclusive: false,
          duplicateAction: {
            type: 'shard',
            value: this.getShardValue(rarity as ItemRarity),
          },
        });
      }
    });

    // Generate currencies as rewards
    items.push(
      {
        id: 'coins_small',
        name: 'Coin Bundle',
        type: 'currency',
        rarity: 'common',
        weight: 200,
        exclusive: false,
        duplicateAction: {
          type: 'currency',
          value: 500,
          currency: 'coins',
        },
      },
      {
        id: 'coins_medium',
        name: 'Coin Chest',
        type: 'currency',
        rarity: 'rare',
        weight: 150,
        exclusive: false,
        duplicateAction: {
          type: 'currency',
          value: 2000,
          currency: 'coins',
        },
      },
      {
        id: 'gems_small',
        name: 'Gem Pouch',
        type: 'currency',
        rarity: 'rare',
        weight: 100,
        exclusive: false,
        duplicateAction: {
          type: 'currency',
          value: 10,
          currency: 'gems',
        },
      },
      {
        id: 'gems_medium',
        name: 'Gem Bundle',
        type: 'currency',
        rarity: 'epic',
        weight: 50,
        exclusive: false,
        duplicateAction: {
          type: 'currency',
          value: 50,
          currency: 'gems',
        },
      }
    );

    // Filter by tier if specified
    if (tier !== 'all') {
      return items.filter((item) => {
        if (tier === 'common') return item.rarity === 'common' || item.rarity === 'rare';
        if (tier === 'rare') return item.rarity !== 'common';
        if (tier === 'epic') return item.rarity !== 'common' && item.rarity !== 'rare';
        if (tier === 'legendary') return item.rarity === 'legendary' || item.rarity === 'mythic';
        return true;
      });
    }

    return items;
  }

  private generateEventItems(): LootItem[] {
    return [
      {
        id: 'event_skin_halloween',
        name: 'Spooky Cart',
        type: 'skin',
        rarity: 'legendary',
        weight: 10,
        exclusive: true,
        limited: true,
        new: true,
      },
      {
        id: 'event_trail_halloween',
        name: 'Ghost Trail',
        type: 'trail',
        rarity: 'epic',
        weight: 30,
        exclusive: true,
        limited: true,
        new: true,
      },
      {
        id: 'event_frame_halloween',
        name: 'Pumpkin Frame',
        type: 'frame',
        rarity: 'rare',
        weight: 50,
        exclusive: false,
        limited: true,
      },
    ];
  }

  async openLootBox(boxId: string, count: number = 1): Promise<OpenBoxResult> {
    const box = this.lootBoxes.get(boxId);
    if (!box) {
      return { success: false, error: 'Box not found' };
    }

    const results: PullResult[] = [];
    const animations: OpenAnimation[] = [];

    for (let i = 0; i < count; i++) {
      // Check pity system
      const pityBonus = this.checkPity(box);

      // Roll for items
      const rolled = this.rollItems(box, pityBonus);

      // Update pity counter
      this.updatePity(box, rolled);

      // Check for duplicates and convert
      const processed = await this.processDuplicates(rolled);

      // Create pull result
      results.push({
        items: processed.items,
        duplicates: processed.duplicates,
        conversions: processed.conversions,
        isNew: processed.items.some((item) => this.isNewItem(item.id)),
        rarity: this.getHighestRarity(processed.items),
      });

      // Create animation
      animations.push(this.createOpenAnimation(box, processed.items));
    }

    // Record pull history
    await this.recordPull(boxId, results);

    // Update collection
    await this.updateCollection(results);

    return {
      success: true,
      results,
      animations,
      celebration: this.determineCelebration(results),
    };
  }

  private rollItems(box: LootBox, pityBonus: number = 0): LootItem[] {
    const items: LootItem[] = [];
    const itemCount = box.id === 'mega_box_10' ? 10 : 3; // Most boxes give 3 items

    for (let i = 0; i < itemCount; i++) {
      // Roll rarity
      const rarity = this.rollRarity(box.pool.weights, pityBonus);

      // Get items of that rarity
      const rarityItems = box.pool.items.filter((item) => item.rarity === rarity);

      if (rarityItems.length === 0) {
        // Fallback to common if no items of rolled rarity
        const commonItems = box.pool.items.filter((item) => item.rarity === 'common');
        items.push(this.selectWeightedItem(commonItems));
      } else {
        // Select item based on weight
        items.push(this.selectWeightedItem(rarityItems));
      }
    }

    // Apply guarantees
    box.pool.guarantees.forEach((guarantee) => {
      if (this.checkGuaranteeCondition(guarantee.condition)) {
        // Ensure we have the guaranteed rarity
        const hasGuaranteed = items.some(
          (item) => this.compareRarity(item.rarity, guarantee.reward) >= 0
        );

        if (!hasGuaranteed) {
          // Replace lowest rarity item with guaranteed
          const lowestIndex = this.findLowestRarityIndex(items);
          const guaranteedItems = box.pool.items.filter((item) => item.rarity === guarantee.reward);

          if (guaranteedItems.length > 0) {
            items[lowestIndex] = this.selectWeightedItem(guaranteedItems);
          }
        }
      }
    });

    return items;
  }

  private rollRarity(weights: RarityWeights, pityBonus: number = 0): ItemRarity {
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let roll = Math.random() * total;

    // Apply pity bonus to higher rarities
    if (pityBonus > 0) {
      weights.legendary += pityBonus * 2;
      weights.mythic += pityBonus;
    }

    for (const [rarity, weight] of Object.entries(weights)) {
      roll -= weight;
      if (roll <= 0) {
        return rarity as ItemRarity;
      }
    }

    return 'common';
  }

  private selectWeightedItem(items: LootItem[]): LootItem {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const item of items) {
      roll -= item.weight;
      if (roll <= 0) {
        return item;
      }
    }

    return items[0];
  }

  private checkPity(box: LootBox): number {
    if (!box.pitySystem?.enabled) return 0;

    const counter = this.pityCounters.get(box.id) || 0;
    const { threshold, type } = box.pitySystem;

    if (type === 'hard' && counter >= threshold) {
      return 100; // Guarantee high rarity
    } else if (type === 'soft') {
      // Gradually increase odds
      return Math.min((counter / threshold) * 10, 10);
    }

    return 0;
  }

  private updatePity(box: LootBox, items: LootItem[]) {
    if (!box.pitySystem?.enabled) return;

    const hasHighRarity = items.some(
      (item) => item.rarity === 'legendary' || item.rarity === 'mythic'
    );

    if (hasHighRarity) {
      // Reset pity counter
      this.pityCounters.set(box.id, 0);
    } else {
      // Increment pity counter
      const current = this.pityCounters.get(box.id) || 0;
      this.pityCounters.set(box.id, current + 1);
    }
  }

  private async processDuplicates(items: LootItem[]): Promise<ProcessedItems> {
    const processed: ProcessedItems = {
      items: [],
      duplicates: [],
      conversions: [],
    };

    for (const item of items) {
      const isDuplicate = await this.checkDuplicate(item.id);

      if (isDuplicate && item.duplicateAction) {
        // Handle duplicate
        processed.duplicates.push(item);

        switch (item.duplicateAction.type) {
          case 'shard':
            processed.conversions.push({
              from: item.name,
              to: `${item.duplicateAction.value} shards`,
              type: 'shard',
            });
            await this.addShards(item.duplicateAction.value);
            break;

          case 'currency':
            processed.conversions.push({
              from: item.name,
              to: `${item.duplicateAction.value} ${item.duplicateAction.currency}`,
              type: 'currency',
            });
            await this.addCurrency(item.duplicateAction.currency!, item.duplicateAction.value);
            break;

          case 'convert':
            // Convert to random item of same rarity
            const converted = await this.convertDuplicate(item);
            processed.items.push(converted);
            processed.conversions.push({
              from: item.name,
              to: converted.name,
              type: 'reroll',
            });
            break;
        }
      } else {
        processed.items.push(item);
      }
    }

    return processed;
  }

  private createOpenAnimation(box: LootBox, items: LootItem[]): OpenAnimation {
    const animValue = new Animated.Value(0);
    const highestRarity = this.getHighestRarity(items);

    // Store animation for later use
    this.animations.set(`${box.id}_${Date.now()}`, animValue);

    return {
      type: box.animation.type,
      duration: box.animation.duration,
      suspenseDelay: box.animation.suspenseDelay,
      value: animValue,
      rarity: highestRarity,
      sequence: this.createAnimationSequence(box.animation, highestRarity),
    };
  }

  private createAnimationSequence(
    animation: BoxAnimation,
    rarity: ItemRarity
  ): Animated.CompositeAnimation {
    const sequences: Animated.CompositeAnimation[] = [];

    // Build up suspense
    sequences.push(
      Animated.timing(this.animations.get('suspense')!, {
        toValue: 1,
        duration: animation.suspenseDelay,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      })
    );

    // Haptic feedback based on rarity
    const hapticIntensity = this.getHapticIntensity(rarity);
    Haptics.impactAsync(hapticIntensity);

    // Main animation
    switch (animation.type) {
      case 'shake':
        sequences.push(this.createShakeAnimation(animation.duration));
        break;
      case 'glow':
        sequences.push(this.createGlowAnimation(animation.duration, rarity));
        break;
      case 'explode':
        sequences.push(this.createExplodeAnimation(animation.duration));
        break;
      case 'cosmic':
        sequences.push(this.createCosmicAnimation(animation.duration));
        break;
      case 'rainbow':
        sequences.push(this.createRainbowAnimation(animation.duration));
        break;
    }

    return Animated.sequence(sequences);
  }

  private createShakeAnimation(duration: number): Animated.CompositeAnimation {
    const shake = new Animated.Value(0);

    return Animated.loop(
      Animated.sequence([
        Animated.timing(shake, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
      ]),
      { iterations: duration / 100 }
    );
  }

  private createGlowAnimation(duration: number, rarity: ItemRarity): Animated.CompositeAnimation {
    const glow = new Animated.Value(0);
    const intensity = this.getRarityGlowIntensity(rarity);

    return Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: intensity,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
  }

  private createExplodeAnimation(duration: number): Animated.CompositeAnimation {
    const scale = new Animated.Value(1);
    const opacity = new Animated.Value(1);

    return Animated.parallel([
      Animated.timing(scale, {
        toValue: 3,
        duration,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
  }

  private createCosmicAnimation(duration: number): Animated.CompositeAnimation {
    const rotation = new Animated.Value(0);
    const scale = new Animated.Value(0);

    return Animated.parallel([
      Animated.timing(rotation, {
        toValue: 720,
        duration,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]);
  }

  private createRainbowAnimation(duration: number): Animated.CompositeAnimation {
    const hue = new Animated.Value(0);

    return Animated.loop(
      Animated.timing(hue, {
        toValue: 360,
        duration,
        easing: Easing.linear,
        useNativeDriver: false, // Color animations can't use native driver
      })
    );
  }

  private determineCelebration(results: PullResult[]): CelebrationConfig {
    const allRarities = results.flatMap((r) => r.items.map((i) => i.rarity));
    const highestRarity = this.getHighestRarityFromList(allRarities);
    const hasNew = results.some((r) => r.isNew);

    if (highestRarity === 'mythic') {
      return {
        type: 'mythic_celebration',
        duration: 5000,
        effects: ['fireworks', 'confetti', 'rainbow', 'screen_flash'],
        sound: 'mythic_fanfare',
        message: '🌟 MYTHIC ITEM UNLOCKED! 🌟',
      };
    } else if (highestRarity === 'legendary') {
      return {
        type: 'legendary_celebration',
        duration: 3000,
        effects: ['fireworks', 'golden_sparkles'],
        sound: 'legendary_chime',
        message: '⭐ LEGENDARY! ⭐',
      };
    } else if (highestRarity === 'epic') {
      return {
        type: 'epic_celebration',
        duration: 2000,
        effects: ['sparkles', 'glow'],
        sound: 'epic_reveal',
        message: 'Epic Item!',
      };
    } else if (hasNew) {
      return {
        type: 'new_item',
        duration: 1500,
        effects: ['sparkles'],
        sound: 'new_unlock',
        message: 'New Item!',
      };
    } else {
      return {
        type: 'standard',
        duration: 1000,
        effects: ['simple_sparkle'],
        sound: 'box_open',
        message: '',
      };
    }
  }

  // Helper methods
  private getRarityName(rarity: ItemRarity): string {
    const names: Record<ItemRarity, string> = {
      common: 'Common',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary',
      mythic: 'Mythic',
    };
    return names[rarity];
  }

  private getShardValue(rarity: ItemRarity): number {
    const values: Record<ItemRarity, number> = {
      common: 10,
      rare: 25,
      epic: 50,
      legendary: 100,
      mythic: 500,
    };
    return values[rarity];
  }

  private compareRarity(a: ItemRarity, b: ItemRarity): number {
    const order: ItemRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];
    return order.indexOf(a) - order.indexOf(b);
  }

  private findLowestRarityIndex(items: LootItem[]): number {
    let lowestIndex = 0;
    let lowestRarity = items[0].rarity;

    for (let i = 1; i < items.length; i++) {
      if (this.compareRarity(items[i].rarity, lowestRarity) < 0) {
        lowestIndex = i;
        lowestRarity = items[i].rarity;
      }
    }

    return lowestIndex;
  }

  private getHighestRarity(items: LootItem[]): ItemRarity {
    return this.getHighestRarityFromList(items.map((i) => i.rarity));
  }

  private getHighestRarityFromList(rarities: ItemRarity[]): ItemRarity {
    const order: ItemRarity[] = ['mythic', 'legendary', 'epic', 'rare', 'common'];
    for (const rarity of order) {
      if (rarities.includes(rarity)) {
        return rarity;
      }
    }
    return 'common';
  }

  private checkGuaranteeCondition(condition: string): boolean {
    switch (condition) {
      case 'always':
        return true;
      case 'first_pull':
        return this.pullHistory.length === 0;
      case '10_pull':
        return this.pullHistory.length % 10 === 0;
      default:
        return false;
    }
  }

  private async checkDuplicate(itemId: string): Promise<boolean> {
    return this.collection.some((item) => item.id === itemId);
  }

  private isNewItem(itemId: string): boolean {
    return !this.collection.some((item) => item.id === itemId);
  }

  private async convertDuplicate(item: LootItem): Promise<LootItem> {
    // Get items of same rarity that aren't owned
    const sameRarityItems = this.lootBoxes
      .get('common_box')!
      .pool.items.filter(
        (i) => i.rarity === item.rarity && i.id !== item.id && this.isNewItem(i.id)
      );

    if (sameRarityItems.length > 0) {
      return sameRarityItems[Math.floor(Math.random() * sameRarityItems.length)];
    }

    // If all items of this rarity are owned, return currency
    return {
      id: 'duplicate_conversion',
      name: 'Duplicate Conversion',
      type: 'currency',
      rarity: item.rarity,
      weight: 100,
      exclusive: false,
      duplicateAction: {
        type: 'currency',
        value: this.getShardValue(item.rarity) * 10,
        currency: 'coins',
      },
    };
  }

  private getHapticIntensity(rarity: ItemRarity): Haptics.ImpactFeedbackStyle {
    switch (rarity) {
      case 'mythic':
      case 'legendary':
        return Haptics.ImpactFeedbackStyle.Heavy;
      case 'epic':
        return Haptics.ImpactFeedbackStyle.Medium;
      default:
        return Haptics.ImpactFeedbackStyle.Light;
    }
  }

  private getRarityGlowIntensity(rarity: ItemRarity): number {
    const intensities: Record<ItemRarity, number> = {
      common: 0.3,
      rare: 0.5,
      epic: 0.7,
      legendary: 0.9,
      mythic: 1.0,
    };
    return intensities[rarity];
  }

  private async recordPull(boxId: string, results: PullResult[]) {
    const record: PullRecord = {
      boxId,
      timestamp: Date.now(),
      results,
      totalValue: this.calculatePullValue(results),
    };

    this.pullHistory.push(record);
    await this.savePullHistory();
  }

  private calculatePullValue(results: PullResult[]): number {
    return results.reduce((total, result) => {
      return (
        total +
        result.items.reduce((sum, item) => {
          return sum + this.getShardValue(item.rarity);
        }, 0)
      );
    }, 0);
  }

  private async updateCollection(results: PullResult[]) {
    for (const result of results) {
      for (const item of result.items) {
        if (this.isNewItem(item.id)) {
          this.collection.push({
            id: item.id,
            obtainedAt: Date.now(),
            source: 'loot_box',
          });
        }
      }
    }

    await this.saveCollection();
  }

  private async loadPullHistory() {
    try {
      const saved = await AsyncStorage.getItem('pull_history');
      if (saved) {
        this.pullHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading pull history:', error);
    }
  }

  private async savePullHistory() {
    try {
      await AsyncStorage.setItem('pull_history', JSON.stringify(this.pullHistory));
    } catch (error) {
      console.error('Error saving pull history:', error);
    }
  }

  private async saveCollection() {
    try {
      await AsyncStorage.setItem('collection', JSON.stringify(this.collection));
    } catch (error) {
      console.error('Error saving collection:', error);
    }
  }

  private async addShards(amount: number) {
    // Implement shard addition
  }

  private async addCurrency(currency: string, amount: number) {
    // Implement currency addition
  }

  // Public methods for UI
  getBoxOdds(boxId: string): OddsDisplay | null {
    const box = this.lootBoxes.get(boxId);
    if (!box || !box.displayOdds) return null;

    return {
      rarities: Object.entries(box.pool.weights).map(([rarity, weight]) => ({
        rarity: rarity as ItemRarity,
        percentage: (weight / Object.values(box.pool.weights).reduce((a, b) => a + b, 0)) * 100,
      })),
      featuredItems: box.pool.items.filter((i) => i.exclusive || i.limited).slice(0, 5),
      guarantees: box.pool.guarantees,
    };
  }

  getPityProgress(boxId: string): PityProgress | null {
    const box = this.lootBoxes.get(boxId);
    if (!box?.pitySystem?.enabled) return null;

    const current = this.pityCounters.get(boxId) || 0;

    return {
      current,
      threshold: box.pitySystem.threshold,
      percentage: (current / box.pitySystem.threshold) * 100,
      type: box.pitySystem.type,
    };
  }

  getCollectionProgress(): CollectionProgress {
    const totalItems = this.getAllPossibleItems().length;
    const collected = this.collection.length;

    return {
      collected,
      total: totalItems,
      percentage: (collected / totalItems) * 100,
      byRarity: this.getCollectionByRarity(),
      recentUnlocks: this.getRecentUnlocks(5),
    };
  }

  private getAllPossibleItems(): LootItem[] {
    const items: LootItem[] = [];
    this.lootBoxes.forEach((box) => {
      items.push(...box.pool.items);
    });
    // Remove duplicates
    return items.filter((item, index, self) => index === self.findIndex((i) => i.id === item.id));
  }

  private getCollectionByRarity(): Record<ItemRarity, number> {
    const byRarity: Record<ItemRarity, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
    };

    // Implementation to count collected items by rarity

    return byRarity;
  }

  private getRecentUnlocks(count: number): CollectedItem[] {
    return this.collection.sort((a, b) => b.obtainedAt - a.obtainedAt).slice(0, count);
  }
}

// ========== TYPE DEFINITIONS ==========

interface PullRecord {
  boxId: string;
  timestamp: number;
  results: PullResult[];
  totalValue: number;
}

interface PullResult {
  items: LootItem[];
  duplicates: LootItem[];
  conversions: Conversion[];
  isNew: boolean;
  rarity: ItemRarity;
}

interface ProcessedItems {
  items: LootItem[];
  duplicates: LootItem[];
  conversions: Conversion[];
}

interface Conversion {
  from: string;
  to: string;
  type: 'shard' | 'currency' | 'reroll';
}

interface CollectedItem {
  id: string;
  obtainedAt: number;
  source: string;
}

interface OpenBoxResult {
  success: boolean;
  error?: string;
  results?: PullResult[];
  animations?: OpenAnimation[];
  celebration?: CelebrationConfig;
}

interface OpenAnimation {
  type: string;
  duration: number;
  suspenseDelay: number;
  value: Animated.Value;
  rarity: ItemRarity;
  sequence: Animated.CompositeAnimation;
}

interface CelebrationConfig {
  type: string;
  duration: number;
  effects: string[];
  sound: string;
  message: string;
}

interface OddsDisplay {
  rarities: Array<{ rarity: ItemRarity; percentage: number }>;
  featuredItems: LootItem[];
  guarantees: Guarantee[];
}

interface PityProgress {
  current: number;
  threshold: number;
  percentage: number;
  type: 'soft' | 'hard';
}

interface CollectionProgress {
  collected: number;
  total: number;
  percentage: number;
  byRarity: Record<ItemRarity, number>;
  recentUnlocks: CollectedItem[];
}

export default GachaSystem;
