import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  collection,
  runTransaction,
  serverTimestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { auth } from '../../../firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MonthlyDrop, UserDropClaim, UserInventory } from '../../types/drops';
import { dropCatalog } from './dropCatalog';
import { revenueCatService } from '../../lib/revenuecat';

const OFFLINE_CACHE_KEY = 'drops_current_drop_id';
const INVENTORY_CACHE_KEY = 'user_inventory';

/**
 * Drop Service - manages drop claiming and persistence
 */
class DropService {
  private static instance: DropService;
  private currentDropId: string | null = null;
  private currentDropListener: Unsubscribe | null = null;

  static getInstance(): DropService {
    if (!DropService.instance) {
      DropService.instance = new DropService();
    }
    return DropService.instance;
  }

  /**
   * Initialize the service and start listening to current drop
   */
  async initialize(): Promise<void> {
    // Load from offline cache first
    await this.loadOfflineCache();
    
    // Start listening to Firestore
    this.startListeningToCurrentDrop();
  }

  /**
   * Clean up listeners
   */
  destroy(): void {
    if (this.currentDropListener) {
      this.currentDropListener();
      this.currentDropListener = null;
    }
  }

  /**
   * Start listening to the current drop ID from Firestore
   */
  private startListeningToCurrentDrop(): void {
    const configRef = doc(db, 'config', 'current');
    
    this.currentDropListener = onSnapshot(
      configRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          this.currentDropId = data.currentDropId || null;
          
          // Cache offline
          if (this.currentDropId) {
            await AsyncStorage.setItem(OFFLINE_CACHE_KEY, this.currentDropId);
          }
        }
      },
      (error) => {
        console.error('Error listening to current drop:', error);
      }
    );
  }

  /**
   * Load offline cache
   */
  private async loadOfflineCache(): Promise<void> {
    try {
      const cachedDropId = await AsyncStorage.getItem(OFFLINE_CACHE_KEY);
      if (cachedDropId) {
        this.currentDropId = cachedDropId;
      }
    } catch (error) {
      console.error('Error loading offline cache:', error);
    }
  }

  /**
   * Get the current drop ID from Firestore
   */
  async getCurrentDropId(): Promise<string | null> {
    // Return cached value if available
    if (this.currentDropId) {
      return this.currentDropId;
    }

    try {
      const configRef = doc(db, 'config', 'current');
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        const data = configSnap.data();
        this.currentDropId = data.currentDropId || null;
        
        // Cache offline
        if (this.currentDropId) {
          await AsyncStorage.setItem(OFFLINE_CACHE_KEY, this.currentDropId);
        }
        
        return this.currentDropId;
      }
    } catch (error) {
      console.error('Error getting current drop ID:', error);
    }

    // Fallback to current month if no config
    const now = new Date();
    const fallbackId = `drop_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
    return fallbackId;
  }

  /**
   * Get a drop by ID from the catalog
   */
  getDropById(dropId: string): MonthlyDrop | null {
    return dropCatalog.getDropById(dropId);
  }

  /**
   * List upcoming drops
   */
  listUpcoming(n?: number): MonthlyDrop[] {
    return dropCatalog.getUpcomingDrops(n);
  }

  /**
   * Check if user has claimed a specific drop
   */
  async hasUserClaimedDrop(userId: string, dropId: string): Promise<boolean> {
    try {
      const claimRef = doc(db, 'claims', userId, 'drops', dropId);
      const claimSnap = await getDoc(claimRef);
      return claimSnap.exists();
    } catch (error) {
      console.error('Error checking claim status:', error);
      return false;
    }
  }

  /**
   * Claim the current month's drop
   */
  async claimCurrentDrop(): Promise<{
    success: boolean;
    grantedItems?: {
      cartSkin: string;
      trail: string;
      badge: string;
      frame: string;
      bonusCoins: number;
    };
    error?: string;
  }> {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check subscription status
    const customerInfo = await revenueCatService.getCustomerInfo();
    const isSubscribed = customerInfo?.entitlements.active['gold_vault']?.isActive || false;
    
    if (!isSubscribed) {
      return { success: false, error: 'Subscription required' };
    }

    // Get current drop
    const currentDropId = await this.getCurrentDropId();
    if (!currentDropId) {
      return { success: false, error: 'No current drop available' };
    }

    const drop = this.getDropById(currentDropId);
    if (!drop) {
      return { success: false, error: 'Drop not found' };
    }

    // Check if drop is claimable
    if (!dropCatalog.isDropClaimable(currentDropId)) {
      return { success: false, error: 'Drop claim window has expired' };
    }

    // Check if already claimed
    const alreadyClaimed = await this.hasUserClaimedDrop(user.uid, currentDropId);
    if (alreadyClaimed) {
      return { success: false, error: 'Drop already claimed' };
    }

    try {
      // Run transaction to claim drop and update inventory
      const result = await runTransaction(db, async (transaction) => {
        // Create claim record
        const claimRef = doc(db, 'claims', user.uid, 'drops', currentDropId);
        const claim: UserDropClaim = {
          userId: user.uid,
          dropId: currentDropId,
          claimedAt: Date.now(),
          granularity: 'monthly'
        };
        transaction.set(claimRef, claim);

        // Update user inventory
        const inventoryRef = doc(db, 'users', user.uid, 'inventory', 'items');
        const inventorySnap = await transaction.get(inventoryRef);
        
        let inventory: UserInventory = {
          skins: [],
          trails: [],
          badges: [],
          frames: [],
          coins: 0,
          lastUpdated: Date.now()
        };

        if (inventorySnap.exists()) {
          inventory = inventorySnap.data() as UserInventory;
        }

        // Add items to inventory
        if (!inventory.skins.includes(drop.cartSkinId)) {
          inventory.skins.push(drop.cartSkinId);
        }
        if (!inventory.trails.includes(drop.trailId)) {
          inventory.trails.push(drop.trailId);
        }
        if (!inventory.badges.includes(drop.badgeId)) {
          inventory.badges.push(drop.badgeId);
        }
        if (!inventory.frames.includes(drop.frameId)) {
          inventory.frames.push(drop.frameId);
        }
        inventory.coins += drop.bonusCoins;
        inventory.lastUpdated = Date.now();

        transaction.set(inventoryRef, inventory, { merge: true });

        // Update user's coin balance
        const userRef = doc(db, 'users', user.uid);
        transaction.update(userRef, {
          coins: inventory.coins,
          lastUpdated: serverTimestamp()
        });

        return {
          cartSkin: drop.cartSkinId,
          trail: drop.trailId,
          badge: drop.badgeId,
          frame: drop.frameId,
          bonusCoins: drop.bonusCoins
        };
      });

      // Cache inventory locally
      await this.cacheUserInventory(user.uid);

      return {
        success: true,
        grantedItems: result
      };
    } catch (error) {
      console.error('Error claiming drop:', error);
      return { 
        success: false, 
        error: 'Failed to claim drop. Please try again.' 
      };
    }
  }

  /**
   * Get user's inventory
   */
  async getUserInventory(userId: string): Promise<UserInventory | null> {
    try {
      // Try cache first
      const cached = await AsyncStorage.getItem(`${INVENTORY_CACHE_KEY}_${userId}`);
      if (cached) {
        return JSON.parse(cached) as UserInventory;
      }

      // Fetch from Firestore
      const inventoryRef = doc(db, 'users', userId, 'inventory', 'items');
      const inventorySnap = await getDoc(inventoryRef);
      
      if (inventorySnap.exists()) {
        const inventory = inventorySnap.data() as UserInventory;
        
        // Cache locally
        await AsyncStorage.setItem(
          `${INVENTORY_CACHE_KEY}_${userId}`,
          JSON.stringify(inventory)
        );
        
        return inventory;
      }
    } catch (error) {
      console.error('Error getting user inventory:', error);
    }

    return null;
  }

  /**
   * Cache user inventory locally
   */
  private async cacheUserInventory(userId: string): Promise<void> {
    try {
      const inventory = await this.getUserInventory(userId);
      if (inventory) {
        await AsyncStorage.setItem(
          `${INVENTORY_CACHE_KEY}_${userId}`,
          JSON.stringify(inventory)
        );
      }
    } catch (error) {
      console.error('Error caching inventory:', error);
    }
  }

  /**
   * Check if user owns a specific item
   */
  async userOwnsItem(userId: string, itemId: string, itemType: 'skin' | 'trail' | 'badge' | 'frame'): Promise<boolean> {
    const inventory = await this.getUserInventory(userId);
    if (!inventory) return false;

    switch (itemType) {
      case 'skin':
        return inventory.skins.includes(itemId);
      case 'trail':
        return inventory.trails.includes(itemId);
      case 'badge':
        return inventory.badges.includes(itemId);
      case 'frame':
        return inventory.frames.includes(itemId);
      default:
        return false;
    }
  }

  /**
   * Get all owned items for display in shop/locker
   */
  async getOwnedItems(userId: string): Promise<Set<string>> {
    const inventory = await this.getUserInventory(userId);
    if (!inventory) return new Set();

    const owned = new Set<string>();
    inventory.skins.forEach(id => owned.add(id));
    inventory.trails.forEach(id => owned.add(id));
    inventory.badges.forEach(id => owned.add(id));
    inventory.frames.forEach(id => owned.add(id));

    return owned;
  }
}

export const dropService = DropService.getInstance();