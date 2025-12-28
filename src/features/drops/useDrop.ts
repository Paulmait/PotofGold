import { useState, useEffect, useCallback } from 'react';
import { MonthlyDrop } from '../../types/drops';
import { dropService } from './dropService';
import { dropCatalog } from './dropCatalog';
import { auth } from '../../../firebase/auth';
import { useEntitlements } from '../subscriptions/useEntitlements';

interface UseDropResult {
  currentDrop: MonthlyDrop | null;
  isClaimed: boolean;
  isClaimable: boolean;
  daysRemaining: number;
  loading: boolean;
  claiming: boolean;
  error: string | null;
  claim: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing monthly drops
 */
export function useDrop(): UseDropResult {
  const [currentDrop, setCurrentDrop] = useState<MonthlyDrop | null>(null);
  const [isClaimed, setIsClaimed] = useState(false);
  const [isClaimable, setIsClaimable] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isSubscribed } = useEntitlements();
  const user = auth.currentUser;

  // Load current drop and claim status
  const loadDropData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current drop ID from Firestore
      const currentDropId = await dropService.getCurrentDropId();

      if (currentDropId) {
        // Get drop details from catalog
        const drop = dropCatalog.getDropById(currentDropId);
        setCurrentDrop(drop);

        if (drop) {
          // Check if claimable
          const claimable = dropCatalog.isDropClaimable(currentDropId);
          setIsClaimable(claimable && isSubscribed);

          // Get days remaining
          const days = dropCatalog.getDaysRemainingInClaimWindow(currentDropId);
          setDaysRemaining(days);

          // Check if already claimed
          const claimed = await dropService.hasUserClaimedDrop(user.uid, currentDropId);
          setIsClaimed(claimed);
        }
      }
    } catch (err) {
      console.error('Error loading drop data:', err);
      setError('Failed to load drop data');
    } finally {
      setLoading(false);
    }
  }, [user, isSubscribed]);

  // Claim the current drop
  const claim = useCallback(async (): Promise<boolean> => {
    if (!user || !currentDrop || isClaimed || !isClaimable) {
      return false;
    }

    setClaiming(true);
    setError(null);

    try {
      const result = await dropService.claimCurrentDrop();

      if (result.success) {
        setIsClaimed(true);

        // Show success feedback
        if (result.grantedItems) {
          console.log('Drop claimed successfully!', result.grantedItems);
        }

        return true;
      } else {
        setError(result.error || 'Failed to claim drop');
        return false;
      }
    } catch (err) {
      console.error('Error claiming drop:', err);
      setError('An error occurred while claiming the drop');
      return false;
    } finally {
      setClaiming(false);
    }
  }, [user, currentDrop, isClaimed, isClaimable]);

  // Refresh data
  const refresh = useCallback(async () => {
    await loadDropData();
  }, [loadDropData]);

  // Initialize service and load data
  useEffect(() => {
    dropService.initialize();
    loadDropData();

    // Cleanup on unmount
    return () => {
      dropService.destroy();
    };
  }, [loadDropData]);

  // Refresh when subscription status changes
  useEffect(() => {
    if (!loading) {
      loadDropData();
    }
  }, [isSubscribed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update countdown daily
  useEffect(() => {
    if (!currentDrop) return;

    const interval = setInterval(
      () => {
        const days = dropCatalog.getDaysRemainingInClaimWindow(currentDrop.id);
        setDaysRemaining(days);

        // Refresh claimability if window expired
        if (days === 0 && isClaimable) {
          setIsClaimable(false);
        }
      },
      60 * 60 * 1000
    ); // Check every hour

    return () => clearInterval(interval);
  }, [currentDrop, isClaimable]);

  return {
    currentDrop,
    isClaimed,
    isClaimable,
    daysRemaining,
    loading,
    claiming,
    error,
    claim,
    refresh,
  };
}
