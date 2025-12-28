import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { auth } from '../firebase/auth';

export interface UnlockData {
  id: string;
  unlockedAt: Date;
  type: 'flag' | 'shape' | 'trail';
  name: string;
}

export interface UserUnlocks {
  [skinId: string]: UnlockData;
}

export class FirebaseUnlockSystem {
  /**
   * Save an unlocked skin to Firebase
   */
  static async saveUnlock(skinId: string, skinData: any): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        return false;
      }

      const unlockData: UnlockData = {
        id: skinId,
        unlockedAt: new Date(),
        type: skinData.type,
        name: skinData.name,
      };

      // Save to /users/{uid}/unlocks/{skinId}
      await setDoc(doc(db, 'users', user.uid, 'unlocks', skinId), unlockData);

      // Also update the main user document for quick access
      await updateDoc(doc(db, 'users', user.uid), {
        [`unlocks.${skinId}`]: unlockData,
        lastUpdated: new Date(),
      });

      console.log(`Unlocked skin ${skinId} saved to Firebase`);
      return true;
    } catch (error) {
      console.error('Error saving unlock to Firebase:', error);
      return false;
    }
  }

  /**
   * Get all unlocked skins for the current user
   */
  static async getUnlocks(): Promise<UserUnlocks> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        return {};
      }

      // Try to get from main user document first (faster)
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData?.unlocks) {
          return userData.unlocks;
        }
      }

      // Fallback to subcollection
      const unlocksQuery = query(collection(db, 'users', user.uid, 'unlocks'));
      const unlocksSnapshot = await getDocs(unlocksQuery);

      const unlocks: UserUnlocks = {};
      unlocksSnapshot.forEach((doc) => {
        const data = doc.data() as UnlockData;
        unlocks[doc.id] = data;
      });

      return unlocks;
    } catch (error) {
      console.error('Error getting unlocks from Firebase:', error);
      return {};
    }
  }

  /**
   * Check if a specific skin is unlocked
   */
  static async isSkinUnlocked(skinId: string): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      const unlockDoc = await getDoc(doc(db, 'users', user.uid, 'unlocks', skinId));
      return unlockDoc.exists();
    } catch (error) {
      console.error('Error checking if skin is unlocked:', error);
      return false;
    }
  }

  /**
   * Save the currently selected skin to Firebase
   */
  static async saveSelectedSkin(skinId: string): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        return false;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        'profile.skin.id': skinId,
        'profile.skin.selectedAt': new Date(),
        lastUpdated: new Date(),
      });

      console.log(`Selected skin ${skinId} saved to Firebase`);
      return true;
    } catch (error) {
      console.error('Error saving selected skin to Firebase:', error);
      return false;
    }
  }

  /**
   * Get the currently selected skin from Firebase
   */
  static async getSelectedSkin(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData?.profile?.skin?.id || null;
      }

      return null;
    } catch (error) {
      console.error('Error getting selected skin from Firebase:', error);
      return null;
    }
  }

  /**
   * Unlock a skin and save to Firebase
   */
  static async unlockSkin(skinId: string, skinData: any): Promise<boolean> {
    try {
      // First check if already unlocked
      const isUnlocked = await this.isSkinUnlocked(skinId);
      if (isUnlocked) {
        console.log(`Skin ${skinId} is already unlocked`);
        return true;
      }

      // Save the unlock
      const success = await this.saveUnlock(skinId, skinData);
      if (success) {
        console.log(`Successfully unlocked skin ${skinId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unlocking skin:', error);
      return false;
    }
  }

  /**
   * Get unlock progress for a specific skin type
   */
  static async getUnlockProgress(skinType: 'flag' | 'shape' | 'trail'): Promise<{
    unlocked: number;
    total: number;
    percentage: number;
  }> {
    try {
      const unlocks = await this.getUnlocks();
      const unlockedOfType = Object.values(unlocks).filter(
        (unlock) => unlock.type === skinType
      ).length;

      // In a real app, you'd get the total from state_skins.json
      const totalByType: { [key: string]: number } = {
        flag: 5,
        shape: 5,
        trail: 5,
      };

      const total = totalByType[skinType] || 0;
      const percentage = total > 0 ? (unlockedOfType / total) * 100 : 0;

      return {
        unlocked: unlockedOfType,
        total,
        percentage,
      };
    } catch (error) {
      console.error('Error getting unlock progress:', error);
      return { unlocked: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * Sync local unlocks with Firebase
   */
  static async syncUnlocks(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      // Get unlocks from Firebase
      const firebaseUnlocks = await this.getUnlocks();

      // Get local unlocks (if any)
      const localUnlocks = await this.getLocalUnlocks();

      // Merge and sync
      const allUnlocks = { ...localUnlocks, ...firebaseUnlocks };

      // Save merged unlocks back to Firebase
      await updateDoc(doc(db, 'users', user.uid), {
        unlocks: allUnlocks,
        lastSynced: new Date(),
      });

      return true;
    } catch (error) {
      console.error('Error syncing unlocks:', error);
      return false;
    }
  }

  /**
   * Get local unlocks (for offline support)
   */
  static async getLocalUnlocks(): Promise<UserUnlocks> {
    try {
      // In a real app, this would load from AsyncStorage
      return {};
    } catch (error) {
      console.error('Error getting local unlocks:', error);
      return {};
    }
  }
}
