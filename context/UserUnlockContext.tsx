import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { auth } from '../firebase/auth';
import { UnlockManager } from '../utils/unlockManager';
import { isWithinEventPeriod, getCurrentSeasonalEvents } from '../config/seasonalEvents';

export interface UserUnlocks {
  unlockedSkins: string[];
  selectedCartSkin: string | null;
  lastUpdated: Date;
}

interface UserUnlockContextType {
  userUnlocks: UserUnlocks;
  isLoading: boolean;
  isSkinUnlocked: (skinId: string) => boolean;
  getSelectedCartSkin: () => string | null;
  unlockSkin: (skinId: string) => Promise<boolean>;
  selectCartSkin: (skinId: string) => Promise<boolean>;
  refreshUnlocks: () => Promise<void>;
  isSeasonalSkinAvailable: (skinId: string) => boolean;
}

const UserUnlockContext = createContext<UserUnlockContextType | undefined>(undefined);

interface UserUnlockProviderProps {
  children: ReactNode;
}

export function UserUnlockProvider({ children }: UserUnlockProviderProps) {
  const [userUnlocks, setUserUnlocks] = useState<UserUnlocks>({
    unlockedSkins: [],
    selectedCartSkin: null,
    lastUpdated: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load user unlocks from Firestore on mount and auth state change
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await loadUserUnlocks(user.uid);
      } else {
        // Reset to default state when user logs out
        setUserUnlocks({
          unlockedSkins: [],
          selectedCartSkin: null,
          lastUpdated: new Date(),
        });
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserUnlocks = async (uid: string) => {
    try {
      setIsLoading(true);
      
      // Fetch user document
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Get unlocked skins
        const unlockedSkins = userData.unlocks || [];
        
        // Get selected cart skin
        const selectedCartSkin = userData.profile?.skin || null;
        
        setUserUnlocks({
          unlockedSkins,
          selectedCartSkin,
          lastUpdated: new Date(),
        });
      } else {
        // Initialize new user with empty unlocks
        setUserUnlocks({
          unlockedSkins: [],
          selectedCartSkin: null,
          lastUpdated: new Date(),
        });
      }
    } catch (error) {
      console.error('Error loading user unlocks:', error);
      // Fallback to empty state
      setUserUnlocks({
        unlockedSkins: [],
        selectedCartSkin: null,
        lastUpdated: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSkinUnlocked = (skinId: string): boolean => {
    return userUnlocks.unlockedSkins.includes(skinId);
  };

  const getSelectedCartSkin = (): string | null => {
    return userUnlocks.selectedCartSkin;
  };

  const unlockSkin = async (skinId: string): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      // Check if already unlocked
      if (isSkinUnlocked(skinId)) {
        console.log(`Skin ${skinId} is already unlocked`);
        return true;
      }

      // Add to Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        unlocks: arrayUnion(skinId),
        lastUpdated: new Date(),
      });

      // Update local state
      setUserUnlocks(prev => ({
        ...prev,
        unlockedSkins: [...prev.unlockedSkins, skinId],
        lastUpdated: new Date(),
      }));

      console.log(`Successfully unlocked skin: ${skinId}`);
      return true;
    } catch (error) {
      console.error('Error unlocking skin:', error);
      return false;
    }
  };

  const selectCartSkin = async (skinId: string): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      // Check if skin is unlocked
      if (!isSkinUnlocked(skinId)) {
        console.error(`Cannot select locked skin: ${skinId}`);
        return false;
      }

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        'profile.skin': skinId,
        lastUpdated: new Date(),
      });

      // Update local state
      setUserUnlocks(prev => ({
        ...prev,
        selectedCartSkin: skinId,
        lastUpdated: new Date(),
      }));

      console.log(`Successfully selected skin: ${skinId}`);
      return true;
    } catch (error) {
      console.error('Error selecting cart skin:', error);
      return false;
    }
  };

  const refreshUnlocks = async (): Promise<void> => {
    const user = auth.currentUser;
    if (user) {
      await loadUserUnlocks(user.uid);
    }
  };

  const isSeasonalSkinAvailable = (skinId: string): boolean => {
    try {
      // Load skin data to check if it's seasonal
      const skinData = loadSkinData(skinId);
      if (!skinData || skinData.rarity !== 'seasonal' || !skinData.season) {
        return false;
      }

      // Check if the seasonal event is currently active
      return isWithinEventPeriod(skinData.season as any);
    } catch (error) {
      console.error('Error checking seasonal skin availability:', error);
      return false;
    }
  };

  // Helper function to load skin data (simplified version)
  const loadSkinData = (skinId: string) => {
    // In a real app, this would load from the config file
    const skinDataMap: { [key: string]: any } = {
      georgia_bhm: {
        rarity: 'seasonal',
        season: 'black_history_month'
      },
      texas_hispanic: {
        rarity: 'seasonal',
        season: 'hispanic_heritage'
      },
      california_hispanic: {
        rarity: 'seasonal',
        season: 'hispanic_heritage'
      },
      // Add more seasonal skins as needed
    };
    
    return skinDataMap[skinId];
  };

  const value: UserUnlockContextType = {
    userUnlocks,
    isLoading,
    isSkinUnlocked,
    getSelectedCartSkin,
    unlockSkin,
    selectCartSkin,
    refreshUnlocks,
    isSeasonalSkinAvailable,
  };

  return (
    <UserUnlockContext.Provider value={value}>
      {children}
    </UserUnlockContext.Provider>
  );
}

export function useUserUnlocks(): UserUnlockContextType {
  const context = useContext(UserUnlockContext);
  if (context === undefined) {
    throw new Error('useUserUnlocks must be used within a UserUnlockProvider');
  }
  return context;
} 