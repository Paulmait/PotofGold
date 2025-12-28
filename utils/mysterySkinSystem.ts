import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { auth } from '../firebase/auth';
import { HapticFeedback } from './hapticFeedback';

export interface MysteryCrate {
  id: string;
  reward: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlock_condition: string;
  asset: string;
  name: string;
  description: string;
}

export class MysterySkinSystem {
  private static cratePool: MysteryCrate[] = [
    {
      id: 'crate_001',
      reward: 'hawaii',
      rarity: 'legendary',
      unlock_condition: 'Drop from Mystery Crate',
      asset: 'trails/hawaii_trail.png',
      name: 'Hawaii Mystery Trail',
      description: 'Rare Hawaii trail from mystery crate',
    },
    {
      id: 'crate_002',
      reward: 'alaska',
      rarity: 'epic',
      unlock_condition: 'Drop from Mystery Crate',
      asset: 'flags/alaska_flag.png',
      name: 'Alaska Mystery Flag',
      description: 'Epic Alaska flag from mystery crate',
    },
    {
      id: 'crate_003',
      reward: 'vermont',
      rarity: 'rare',
      unlock_condition: 'Drop from Mystery Crate',
      asset: 'trails/vermont_trail.png',
      name: 'Vermont Mystery Trail',
      description: 'Rare Vermont trail from mystery crate',
    },
    {
      id: 'crate_004',
      reward: 'colorado',
      rarity: 'rare',
      unlock_condition: 'Drop from Mystery Crate',
      asset: 'shapes/colorado_shape.png',
      name: 'Colorado Mystery Crystal',
      description: 'Rare Colorado crystal from mystery crate',
    },
    {
      id: 'crate_005',
      reward: 'montana',
      rarity: 'epic',
      unlock_condition: 'Drop from Mystery Crate',
      asset: 'trails/montana_trail.png',
      name: 'Montana Mystery Trail',
      description: 'Epic Montana trail from mystery crate',
    },
    {
      id: 'crate_006',
      reward: 'oregon',
      rarity: 'uncommon',
      unlock_condition: 'Drop from Mystery Crate',
      asset: 'shapes/oregon_shape.png',
      name: 'Oregon Mystery Cart',
      description: 'Uncommon Oregon cart from mystery crate',
    },
  ];

  /**
   * Check if mystery skin should be unlocked after game completion
   */
  static shouldUnlockMysterySkin(): boolean {
    const randomNumber = Math.random() * 100;
    return randomNumber <= 10; // 10% chance
  }

  /**
   * Unlock a random mystery skin
   */
  static async unlockMysterySkin(): Promise<MysteryCrate | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        return null;
      }

      // Pick random crate from pool
      const randomCrate = this.cratePool[Math.floor(Math.random() * this.cratePool.length)];

      if (!randomCrate) {
        console.error('No mystery crates available');
        return null;
      }

      // Save to Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        unlocks: arrayUnion(randomCrate.reward),
        lastUpdated: new Date(),
      });

      // Haptic feedback for mystery unlock
      HapticFeedback.achievementUnlock();

      console.log(`Mystery skin unlocked: ${randomCrate.reward}`);
      return randomCrate;
    } catch (error) {
      console.error('Error unlocking mystery skin:', error);
      return null;
    }
  }

  /**
   * Get all available mystery crates
   */
  static getMysteryCrates(): MysteryCrate[] {
    return this.cratePool;
  }

  /**
   * Get mystery crate by ID
   */
  static getMysteryCrate(crateId: string): MysteryCrate | null {
    return this.cratePool.find((crate) => crate.id === crateId) || null;
  }

  /**
   * Get mystery crates by rarity
   */
  static getMysteryCratesByRarity(rarity: string): MysteryCrate[] {
    return this.cratePool.filter((crate) => crate.rarity === rarity);
  }

  /**
   * Add new mystery crate to pool
   */
  static addMysteryCrate(crate: MysteryCrate): void {
    this.cratePool.push(crate);
  }

  /**
   * Remove mystery crate from pool
   */
  static removeMysteryCrate(crateId: string): void {
    this.cratePool = this.cratePool.filter((crate) => crate.id !== crateId);
  }

  /**
   * Get rarity color for mystery crate
   */
  static getRarityColor(rarity: string): string {
    const colors = {
      common: '#CCCCCC',
      uncommon: '#4ADE80',
      rare: '#60A5FA',
      epic: '#A78BFA',
      legendary: '#FBBF24',
    };
    return colors[rarity as keyof typeof colors] || '#CCCCCC';
  }

  /**
   * Get mystery crate emoji based on rarity
   */
  static getRarityEmoji(rarity: string): string {
    const emojis = {
      common: '📦',
      uncommon: '🎁',
      rare: '💎',
      epic: '🌟',
      legendary: '👑',
    };
    return emojis[rarity as keyof typeof emojis] || '📦';
  }
}
