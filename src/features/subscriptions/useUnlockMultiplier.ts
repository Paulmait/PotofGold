import { useMemo } from 'react';
import { useGoldVaultSubscription } from './useEntitlements';

const SUBSCRIBER_MULTIPLIER = 2;
const DEFAULT_MULTIPLIER = 1;

export interface UnlockMultiplierState {
  multiplier: number;
  isActive: boolean;
  description: string;
}

export const useUnlockMultiplier = (userId?: string): UnlockMultiplierState => {
  const { isGoldVaultMember } = useGoldVaultSubscription(userId);

  const state = useMemo<UnlockMultiplierState>(() => {
    if (isGoldVaultMember) {
      return {
        multiplier: SUBSCRIBER_MULTIPLIER,
        isActive: true,
        description: `${SUBSCRIBER_MULTIPLIER}x unlock speed (Gold Vault member)`,
      };
    }

    return {
      multiplier: DEFAULT_MULTIPLIER,
      isActive: false,
      description: 'Normal unlock speed',
    };
  }, [isGoldVaultMember]);

  return state;
};

// Helper function to apply multiplier to XP/progression values
export const applyUnlockMultiplier = (baseValue: number, multiplier: number): number => {
  return Math.floor(baseValue * multiplier);
};

// Hook for specific unlock types
export const useStateUnlockSpeed = (userId?: string) => {
  const { multiplier, isActive } = useUnlockMultiplier(userId);

  return {
    stateXpMultiplier: multiplier,
    isBoostActive: isActive,
    applyToStateXp: (xp: number) => applyUnlockMultiplier(xp, multiplier),
  };
};

export const useSkinUnlockSpeed = (userId?: string) => {
  const { multiplier, isActive } = useUnlockMultiplier(userId);

  return {
    skinProgressMultiplier: multiplier,
    isBoostActive: isActive,
    applyToSkinProgress: (progress: number) => applyUnlockMultiplier(progress, multiplier),
  };
};

// Combined hook for all unlock speeds
export const useAllUnlockSpeeds = (userId?: string) => {
  const base = useUnlockMultiplier(userId);
  const state = useStateUnlockSpeed(userId);
  const skin = useSkinUnlockSpeed(userId);

  return {
    baseMultiplier: base.multiplier,
    isGoldVaultActive: base.isActive,
    state,
    skin,
    // Additional unlock types can be added here
    achievement: {
      progressMultiplier: base.multiplier,
      applyToProgress: (progress: number) => applyUnlockMultiplier(progress, base.multiplier),
    },
    level: {
      xpMultiplier: base.multiplier,
      applyToXp: (xp: number) => applyUnlockMultiplier(xp, base.multiplier),
    },
  };
};
