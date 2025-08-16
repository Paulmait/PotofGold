import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  DocumentData,
  Unsubscribe
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for different unlock categories
export interface CartSkin {
  id: string;
  name: string;
  state: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  equipped: boolean;
}

export interface Trail {
  id: string;
  name: string;
  effect: string;
  color: string;
  particleType: string;
  unlockedAt: Date;
  equipped: boolean;
}

export interface StateFlag {
  id: string;
  stateName: string;
  abbreviation: string;
  capitalCity: string;
  unlockedAt: Date;
  progress: number; // 0-100 percentage
  rewards: {
    coins: number;
    gems: number;
    specialItem?: string;
  };
}

export interface PowerUp {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  effect: string;
  duration: number;
  unlockedAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  reward: {
    type: 'coins' | 'gems' | 'skin' | 'trail';
    value: number | string;
  };
}

export interface UserUnlocks {
  uid: string;
  cartSkins: CartSkin[];
  trails: Trail[];
  stateFlags: StateFlag[];
  powerUps: PowerUp[];
  achievements: Achievement[];
  statistics: {
    totalUnlocks: number;
    totalStatesUnlocked: number;
    totalSkinsUnlocked: number;
    totalTrailsUnlocked: number;
    favoriteState?: string;
    lastUnlock?: Date;
  };
}

interface UnlocksContextType {
  unlocks: UserUnlocks | null;
  loading: boolean;
  error: string | null;
  
  // Cart skins methods
  unlockCartSkin: (skinId: string) => Promise<void>;
  equipCartSkin: (skinId: string) => Promise<void>;
  getEquippedCartSkin: () => CartSkin | undefined;
  
  // Trails methods
  unlockTrail: (trailId: string) => Promise<void>;
  equipTrail: (trailId: string) => Promise<void>;
  getEquippedTrail: () => Trail | undefined;
  
  // State flags methods
  unlockStateFlag: (stateId: string) => Promise<void>;
  updateStateProgress: (stateId: string, progress: number) => Promise<void>;
  getStateFlag: (stateId: string) => StateFlag | undefined;
  
  // Power-ups methods
  unlockPowerUp: (powerUpId: string) => Promise<void>;
  upgradePowerUp: (powerUpId: string) => Promise<void>;
  
  // Achievements methods
  unlockAchievement: (achievementId: string, reward: Achievement['reward']) => Promise<void>;
  
  // Utility methods
  syncUnlocks: () => Promise<void>;
  resetUnlocks: () => Promise<void>;
  getTotalUnlocksCount: () => number;
}

const UnlocksContext = createContext<UnlocksContextType | undefined>(undefined);

export const useUnlocks = () => {
  const context = useContext(UnlocksContext);
  if (!context) {
    throw new Error('useUnlocks must be used within UnlocksProvider');
  }
  return context;
};

interface UnlocksProviderProps {
  children: ReactNode;
}

export const UnlocksProvider: React.FC<UnlocksProviderProps> = ({ children }) => {
  const [unlocks, setUnlocks] = useState<UserUnlocks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<Unsubscribe | null>(null);

  // Initialize auth listener
  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await loadUserUnlocks(user.uid);
        subscribeToUnlocksUpdates(user.uid);
      } else {
        // Clear unlocks when user logs out
        setUnlocks(null);
        if (unsubscribe) {
          unsubscribe();
        }
      }
      
      setLoading(false);
    });

    return () => {
      authUnsubscribe();
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Load user unlocks from Firestore
  const loadUserUnlocks = async (uid: string) => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from cache first
      const cachedUnlocks = await AsyncStorage.getItem(`unlocks_${uid}`);
      if (cachedUnlocks) {
        setUnlocks(JSON.parse(cachedUnlocks));
      }

      // Then fetch from Firestore
      const unlocksRef = doc(db, 'users', uid, 'unlocks', 'data');
      const unlocksDoc = await new Promise<DocumentData | undefined>((resolve) => {
        const unsub = onSnapshot(unlocksRef, 
          (doc) => resolve(doc.exists() ? doc.data() : undefined),
          (error) => {
            console.error('Error loading unlocks:', error);
            setError('Failed to load unlocks');
            resolve(undefined);
          }
        );
        setUnsubscribe(() => unsub);
      });

      if (unlocksDoc) {
        const userUnlocks = convertFirestoreToUnlocks(uid, unlocksDoc);
        setUnlocks(userUnlocks);
        
        // Cache the unlocks
        await AsyncStorage.setItem(`unlocks_${uid}`, JSON.stringify(userUnlocks));
      } else {
        // Initialize default unlocks for new user
        await initializeDefaultUnlocks(uid);
      }
    } catch (err) {
      console.error('Error in loadUserUnlocks:', err);
      setError('Failed to load user unlocks');
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates
  const subscribeToUnlocksUpdates = (uid: string) => {
    const unlocksRef = doc(db, 'users', uid, 'unlocks', 'data');
    
    const unsub = onSnapshot(unlocksRef, async (snapshot) => {
      if (snapshot.exists()) {
        const userUnlocks = convertFirestoreToUnlocks(uid, snapshot.data());
        setUnlocks(userUnlocks);
        
        // Update cache
        await AsyncStorage.setItem(`unlocks_${uid}`, JSON.stringify(userUnlocks));
      }
    }, (error) => {
      console.error('Error in unlocks subscription:', error);
      setError('Failed to sync unlocks');
    });

    setUnsubscribe(() => unsub);
  };

  // Initialize default unlocks for new users
  const initializeDefaultUnlocks = async (uid: string) => {
    const defaultUnlocks: UserUnlocks = {
      uid,
      cartSkins: [
        {
          id: 'default',
          name: 'Classic Cart',
          state: 'default',
          rarity: 'common',
          unlockedAt: new Date(),
          equipped: true,
        },
      ],
      trails: [
        {
          id: 'sparkle',
          name: 'Sparkle Trail',
          effect: 'sparkle',
          color: '#FFD700',
          particleType: 'star',
          unlockedAt: new Date(),
          equipped: true,
        },
      ],
      stateFlags: [],
      powerUps: [
        {
          id: 'magnet',
          name: 'Coin Magnet',
          level: 1,
          maxLevel: 5,
          effect: 'attract_coins',
          duration: 5000,
          unlockedAt: new Date(),
        },
      ],
      achievements: [],
      statistics: {
        totalUnlocks: 3,
        totalStatesUnlocked: 0,
        totalSkinsUnlocked: 1,
        totalTrailsUnlocked: 1,
        lastUnlock: new Date(),
      },
    };

    try {
      const unlocksRef = doc(db, 'users', uid, 'unlocks', 'data');
      await setDoc(unlocksRef, {
        ...defaultUnlocks,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      setUnlocks(defaultUnlocks);
      await AsyncStorage.setItem(`unlocks_${uid}`, JSON.stringify(defaultUnlocks));
    } catch (err) {
      console.error('Error initializing default unlocks:', err);
      setError('Failed to initialize unlocks');
    }
  };

  // Convert Firestore data to typed unlocks
  const convertFirestoreToUnlocks = (uid: string, data: DocumentData): UserUnlocks => {
    return {
      uid,
      cartSkins: data.cartSkins || [],
      trails: data.trails || [],
      stateFlags: data.stateFlags || [],
      powerUps: data.powerUps || [],
      achievements: data.achievements || [],
      statistics: data.statistics || {
        totalUnlocks: 0,
        totalStatesUnlocked: 0,
        totalSkinsUnlocked: 0,
        totalTrailsUnlocked: 0,
      },
    };
  };

  // Cart skin methods
  const unlockCartSkin = async (skinId: string) => {
    if (!currentUser || !unlocks) return;

    const newSkin: CartSkin = {
      id: skinId,
      name: getCartSkinName(skinId),
      state: getStateFromSkinId(skinId),
      rarity: getCartSkinRarity(skinId),
      unlockedAt: new Date(),
      equipped: false,
    };

    const updatedUnlocks = {
      ...unlocks,
      cartSkins: [...unlocks.cartSkins, newSkin],
      statistics: {
        ...unlocks.statistics,
        totalSkinsUnlocked: unlocks.statistics.totalSkinsUnlocked + 1,
        totalUnlocks: unlocks.statistics.totalUnlocks + 1,
        lastUnlock: new Date(),
      },
    };

    await updateUnlocksInFirestore(updatedUnlocks);
  };

  const equipCartSkin = async (skinId: string) => {
    if (!currentUser || !unlocks) return;

    const updatedSkins = unlocks.cartSkins.map(skin => ({
      ...skin,
      equipped: skin.id === skinId,
    }));

    const updatedUnlocks = {
      ...unlocks,
      cartSkins: updatedSkins,
    };

    await updateUnlocksInFirestore(updatedUnlocks);
  };

  const getEquippedCartSkin = () => {
    return unlocks?.cartSkins.find(skin => skin.equipped);
  };

  // Trail methods
  const unlockTrail = async (trailId: string) => {
    if (!currentUser || !unlocks) return;

    const newTrail: Trail = {
      id: trailId,
      name: getTrailName(trailId),
      effect: getTrailEffect(trailId),
      color: getTrailColor(trailId),
      particleType: getTrailParticleType(trailId),
      unlockedAt: new Date(),
      equipped: false,
    };

    const updatedUnlocks = {
      ...unlocks,
      trails: [...unlocks.trails, newTrail],
      statistics: {
        ...unlocks.statistics,
        totalTrailsUnlocked: unlocks.statistics.totalTrailsUnlocked + 1,
        totalUnlocks: unlocks.statistics.totalUnlocks + 1,
        lastUnlock: new Date(),
      },
    };

    await updateUnlocksInFirestore(updatedUnlocks);
  };

  const equipTrail = async (trailId: string) => {
    if (!currentUser || !unlocks) return;

    const updatedTrails = unlocks.trails.map(trail => ({
      ...trail,
      equipped: trail.id === trailId,
    }));

    const updatedUnlocks = {
      ...unlocks,
      trails: updatedTrails,
    };

    await updateUnlocksInFirestore(updatedUnlocks);
  };

  const getEquippedTrail = () => {
    return unlocks?.trails.find(trail => trail.equipped);
  };

  // State flag methods
  const unlockStateFlag = async (stateId: string) => {
    if (!currentUser || !unlocks) return;

    const newState: StateFlag = {
      id: stateId,
      stateName: getStateName(stateId),
      abbreviation: getStateAbbreviation(stateId),
      capitalCity: getStateCapital(stateId),
      unlockedAt: new Date(),
      progress: 0,
      rewards: getStateRewards(stateId),
    };

    const updatedUnlocks = {
      ...unlocks,
      stateFlags: [...unlocks.stateFlags, newState],
      statistics: {
        ...unlocks.statistics,
        totalStatesUnlocked: unlocks.statistics.totalStatesUnlocked + 1,
        totalUnlocks: unlocks.statistics.totalUnlocks + 1,
        lastUnlock: new Date(),
      },
    };

    await updateUnlocksInFirestore(updatedUnlocks);
  };

  const updateStateProgress = async (stateId: string, progress: number) => {
    if (!currentUser || !unlocks) return;

    const updatedStates = unlocks.stateFlags.map(state => 
      state.id === stateId 
        ? { ...state, progress: Math.min(100, Math.max(0, progress)) }
        : state
    );

    const updatedUnlocks = {
      ...unlocks,
      stateFlags: updatedStates,
    };

    await updateUnlocksInFirestore(updatedUnlocks);
  };

  const getStateFlag = (stateId: string) => {
    return unlocks?.stateFlags.find(state => state.id === stateId);
  };

  // Power-up methods
  const unlockPowerUp = async (powerUpId: string) => {
    if (!currentUser || !unlocks) return;

    const newPowerUp: PowerUp = {
      id: powerUpId,
      name: getPowerUpName(powerUpId),
      level: 1,
      maxLevel: 5,
      effect: getPowerUpEffect(powerUpId),
      duration: getPowerUpDuration(powerUpId),
      unlockedAt: new Date(),
    };

    const updatedUnlocks = {
      ...unlocks,
      powerUps: [...unlocks.powerUps, newPowerUp],
      statistics: {
        ...unlocks.statistics,
        totalUnlocks: unlocks.statistics.totalUnlocks + 1,
        lastUnlock: new Date(),
      },
    };

    await updateUnlocksInFirestore(updatedUnlocks);
  };

  const upgradePowerUp = async (powerUpId: string) => {
    if (!currentUser || !unlocks) return;

    const updatedPowerUps = unlocks.powerUps.map(powerUp => 
      powerUp.id === powerUpId && powerUp.level < powerUp.maxLevel
        ? { ...powerUp, level: powerUp.level + 1 }
        : powerUp
    );

    const updatedUnlocks = {
      ...unlocks,
      powerUps: updatedPowerUps,
    };

    await updateUnlocksInFirestore(updatedUnlocks);
  };

  // Achievement methods
  const unlockAchievement = async (achievementId: string, reward: Achievement['reward']) => {
    if (!currentUser || !unlocks) return;

    const newAchievement: Achievement = {
      id: achievementId,
      name: getAchievementName(achievementId),
      description: getAchievementDescription(achievementId),
      icon: getAchievementIcon(achievementId),
      unlockedAt: new Date(),
      reward,
    };

    const updatedUnlocks = {
      ...unlocks,
      achievements: [...unlocks.achievements, newAchievement],
      statistics: {
        ...unlocks.statistics,
        totalUnlocks: unlocks.statistics.totalUnlocks + 1,
        lastUnlock: new Date(),
      },
    };

    await updateUnlocksInFirestore(updatedUnlocks);
  };

  // Update Firestore
  const updateUnlocksInFirestore = async (updatedUnlocks: UserUnlocks) => {
    if (!currentUser) return;

    try {
      const unlocksRef = doc(db, 'users', currentUser.uid, 'unlocks', 'data');
      await updateDoc(unlocksRef, {
        ...updatedUnlocks,
        updatedAt: serverTimestamp(),
      });
      
      setUnlocks(updatedUnlocks);
      await AsyncStorage.setItem(`unlocks_${currentUser.uid}`, JSON.stringify(updatedUnlocks));
    } catch (err) {
      console.error('Error updating unlocks:', err);
      setError('Failed to update unlocks');
    }
  };

  // Utility methods
  const syncUnlocks = async () => {
    if (currentUser) {
      await loadUserUnlocks(currentUser.uid);
    }
  };

  const resetUnlocks = async () => {
    if (currentUser) {
      await initializeDefaultUnlocks(currentUser.uid);
    }
  };

  const getTotalUnlocksCount = () => {
    return unlocks?.statistics.totalUnlocks || 0;
  };

  // Helper functions for getting item details
  const getCartSkinName = (id: string) => {
    const names: Record<string, string> = {
      texas: 'Texas Ranger',
      california: 'Golden State',
      florida: 'Sunshine Express',
      newyork: 'Empire Cart',
      arizona: 'Desert Runner',
    };
    return names[id] || 'Mystery Cart';
  };

  const getStateFromSkinId = (id: string) => {
    return id; // Assuming skin ID matches state
  };

  const getCartSkinRarity = (id: string): CartSkin['rarity'] => {
    const rarities: Record<string, CartSkin['rarity']> = {
      default: 'common',
      texas: 'rare',
      california: 'epic',
      florida: 'rare',
      newyork: 'epic',
      arizona: 'rare',
    };
    return rarities[id] || 'common';
  };

  const getTrailName = (id: string) => {
    const names: Record<string, string> = {
      sparkle: 'Sparkle Trail',
      rainbow: 'Rainbow Trail',
      fire: 'Fire Trail',
      ice: 'Ice Trail',
      golden: 'Golden Trail',
    };
    return names[id] || 'Mystery Trail';
  };

  const getTrailEffect = (id: string) => {
    return id;
  };

  const getTrailColor = (id: string) => {
    const colors: Record<string, string> = {
      sparkle: '#FFD700',
      rainbow: '#FF69B4',
      fire: '#FF4500',
      ice: '#00BFFF',
      golden: '#FFD700',
    };
    return colors[id] || '#FFFFFF';
  };

  const getTrailParticleType = (id: string) => {
    const types: Record<string, string> = {
      sparkle: 'star',
      rainbow: 'rainbow',
      fire: 'flame',
      ice: 'snowflake',
      golden: 'coin',
    };
    return types[id] || 'star';
  };

  const getStateName = (id: string) => {
    const states: Record<string, string> = {
      texas: 'Texas',
      california: 'California',
      florida: 'Florida',
      newyork: 'New York',
      arizona: 'Arizona',
      // Add all 50 states...
    };
    return states[id] || 'Unknown State';
  };

  const getStateAbbreviation = (id: string) => {
    const abbr: Record<string, string> = {
      texas: 'TX',
      california: 'CA',
      florida: 'FL',
      newyork: 'NY',
      arizona: 'AZ',
    };
    return abbr[id] || 'XX';
  };

  const getStateCapital = (id: string) => {
    const capitals: Record<string, string> = {
      texas: 'Austin',
      california: 'Sacramento',
      florida: 'Tallahassee',
      newyork: 'Albany',
      arizona: 'Phoenix',
    };
    return capitals[id] || 'Unknown';
  };

  const getStateRewards = (id: string) => {
    return {
      coins: 1000,
      gems: 50,
      specialItem: `${id}_special`,
    };
  };

  const getPowerUpName = (id: string) => {
    const names: Record<string, string> = {
      magnet: 'Coin Magnet',
      shield: 'Golden Shield',
      multiplier: 'Score Multiplier',
      slowtime: 'Time Slower',
    };
    return names[id] || 'Mystery Power';
  };

  const getPowerUpEffect = (id: string) => {
    return `${id}_effect`;
  };

  const getPowerUpDuration = (id: string) => {
    return 10000; // 10 seconds default
  };

  const getAchievementName = (id: string) => {
    return `Achievement: ${id}`;
  };

  const getAchievementDescription = (id: string) => {
    return `Complete ${id} to unlock rewards`;
  };

  const getAchievementIcon = (id: string) => {
    return '🏆';
  };

  const value: UnlocksContextType = {
    unlocks,
    loading,
    error,
    unlockCartSkin,
    equipCartSkin,
    getEquippedCartSkin,
    unlockTrail,
    equipTrail,
    getEquippedTrail,
    unlockStateFlag,
    updateStateProgress,
    getStateFlag,
    unlockPowerUp,
    upgradePowerUp,
    unlockAchievement,
    syncUnlocks,
    resetUnlocks,
    getTotalUnlocksCount,
  };

  return (
    <UnlocksContext.Provider value={value}>
      {children}
    </UnlocksContext.Provider>
  );
};

export default UnlocksContext;