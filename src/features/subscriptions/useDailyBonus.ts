import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGoldVaultSubscription } from './useEntitlements';
import { useGameContext } from '../../../context/GameContext';
import * as Haptics from 'expo-haptics';

const DAILY_BONUS_KEY = 'gold_vault_daily_bonus';
const BONUS_AMOUNT = 500; // Configurable daily bonus coins
const BONUS_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface DailyBonusState {
  canClaim: boolean;
  lastClaimedAt: number | null;
  hoursUntilNextClaim: number | null;
  bonusAmount: number;
}

export const useDailyBonus = (userId?: string) => {
  const { isGoldVaultMember, isLoading: entitlementLoading } = useGoldVaultSubscription(userId);
  const { addCoins } = useGameContext();

  const [state, setState] = useState<DailyBonusState>({
    canClaim: false,
    lastClaimedAt: null,
    hoursUntilNextClaim: null,
    bonusAmount: BONUS_AMOUNT,
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Load last claimed timestamp
  const loadLastClaimed = useCallback(async () => {
    try {
      const key = userId ? `${DAILY_BONUS_KEY}_${userId}` : DAILY_BONUS_KEY;
      const stored = await AsyncStorage.getItem(key);

      if (stored) {
        const lastClaimedAt = parseInt(stored, 10);
        const now = Date.now();
        const timeSinceLastClaim = now - lastClaimedAt;
        const canClaim = timeSinceLastClaim >= BONUS_COOLDOWN;
        const hoursUntilNextClaim = canClaim
          ? 0
          : Math.ceil((BONUS_COOLDOWN - timeSinceLastClaim) / (1000 * 60 * 60));

        setState({
          canClaim: canClaim && isGoldVaultMember,
          lastClaimedAt,
          hoursUntilNextClaim,
          bonusAmount: BONUS_AMOUNT,
        });
      } else {
        // Never claimed before
        setState({
          canClaim: isGoldVaultMember,
          lastClaimedAt: null,
          hoursUntilNextClaim: 0,
          bonusAmount: BONUS_AMOUNT,
        });
      }
    } catch (error) {
      console.error('Error loading daily bonus state:', error);
    }
  }, [userId, isGoldVaultMember]);

  // Claim the daily bonus
  const claim = useCallback(async (): Promise<boolean> => {
    if (!state.canClaim || isProcessing || !isGoldVaultMember) {
      return false;
    }

    setIsProcessing(true);

    try {
      const now = Date.now();
      const key = userId ? `${DAILY_BONUS_KEY}_${userId}` : DAILY_BONUS_KEY;

      // Save claim timestamp
      await AsyncStorage.setItem(key, now.toString());

      // Add coins to user balance
      addCoins(state.bonusAmount);

      // Haptic feedback for successful claim
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Update state
      setState({
        canClaim: false,
        lastClaimedAt: now,
        hoursUntilNextClaim: 24,
        bonusAmount: BONUS_AMOUNT,
      });

      // Log analytics event
      if (window.analyticsSystem) {
        window.analyticsSystem.track('daily_bonus_claimed', {
          amount: state.bonusAmount,
          userId,
          timestamp: now,
        });
      }

      return true;
    } catch (error) {
      console.error('Error claiming daily bonus:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [state.canClaim, state.bonusAmount, isProcessing, isGoldVaultMember, userId, addCoins]);

  // Get formatted time until next claim
  const getTimeUntilNextClaim = useCallback((): string => {
    if (!state.lastClaimedAt || state.canClaim) {
      return 'Available now!';
    }

    const now = Date.now();
    const timeSinceLastClaim = now - state.lastClaimedAt;
    const timeRemaining = BONUS_COOLDOWN - timeSinceLastClaim;

    if (timeRemaining <= 0) {
      return 'Available now!';
    }

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [state.lastClaimedAt, state.canClaim]);

  // Check if bonus has ever been claimed
  const hasClaimedBefore = useCallback((): boolean => {
    return state.lastClaimedAt !== null;
  }, [state.lastClaimedAt]);

  // Get streak information (for future enhancement)
  const getStreakInfo = useCallback(async (): Promise<{
    currentStreak: number;
    bestStreak: number;
  }> => {
    try {
      const streakKey = userId
        ? `${DAILY_BONUS_KEY}_streak_${userId}`
        : `${DAILY_BONUS_KEY}_streak`;
      const streakData = await AsyncStorage.getItem(streakKey);

      if (streakData) {
        return JSON.parse(streakData);
      }

      return { currentStreak: 0, bestStreak: 0 };
    } catch (error) {
      console.error('Error getting streak info:', error);
      return { currentStreak: 0, bestStreak: 0 };
    }
  }, [userId]);

  // Reset bonus (for testing)
  const resetBonus = useCallback(async () => {
    if (__DEV__) {
      const key = userId ? `${DAILY_BONUS_KEY}_${userId}` : DAILY_BONUS_KEY;
      await AsyncStorage.removeItem(key);
      await loadLastClaimed();
    }
  }, [userId, loadLastClaimed]);

  // Load state on mount and when subscription status changes
  useEffect(() => {
    if (!entitlementLoading) {
      loadLastClaimed();
    }
  }, [loadLastClaimed, entitlementLoading, isGoldVaultMember]);

  // Set up timer to auto-update when bonus becomes available
  useEffect(() => {
    if (!state.canClaim && state.lastClaimedAt) {
      const timeUntilAvailable = state.lastClaimedAt + BONUS_COOLDOWN - Date.now();

      if (timeUntilAvailable > 0) {
        const timer = setTimeout(() => {
          loadLastClaimed();
        }, timeUntilAvailable);

        return () => clearTimeout(timer);
      }
    }
  }, [state.canClaim, state.lastClaimedAt, loadLastClaimed]);

  return {
    canClaim: state.canClaim,
    lastClaimedAt: state.lastClaimedAt,
    hoursUntilNextClaim: state.hoursUntilNextClaim,
    bonusAmount: state.bonusAmount,
    claim,
    isProcessing,
    getTimeUntilNextClaim,
    hasClaimedBefore,
    getStreakInfo,
    resetBonus,
    isSubscriber: isGoldVaultMember,
  };
};
