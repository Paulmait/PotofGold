import { useState, useEffect, useCallback } from 'react';
import { revenueCatService } from '../../lib/revenuecat';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ENTITLEMENT_CACHE_KEY = 'gold_vault_entitlement';
const GOLD_VAULT_ID = 'gold_vault';

export interface EntitlementState {
  isSubscriber: boolean;
  entitlements: string[];
  isLoading: boolean;
  error: Error | null;
  expiresAt?: number;
  willRenew?: boolean;
}

export const useEntitlements = (userId?: string) => {
  const [state, setState] = useState<EntitlementState>({
    isSubscriber: false,
    entitlements: [],
    isLoading: true,
    error: null,
  });

  // Load cached entitlement for immediate UI update
  const loadCachedEntitlement = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(ENTITLEMENT_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid (within expiry or 7 days for offline)
        if (parsed.expiresAt > now || now - parsed.cachedAt < 7 * 24 * 60 * 60 * 1000) {
          setState((prev) => ({
            ...prev,
            isSubscriber: true,
            entitlements: parsed.entitlements || [GOLD_VAULT_ID],
            expiresAt: parsed.expiresAt,
            willRenew: parsed.willRenew,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading cached entitlement:', error);
    }
  }, []);

  // Fetch fresh entitlement data from RevenueCat
  const fetchEntitlements = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Initialize RevenueCat if needed
      await revenueCatService.initialize(userId);

      // Get customer info
      const customerInfo = await revenueCatService.getCustomerInfo();

      if (!customerInfo) {
        setState((prev) => ({
          ...prev,
          isSubscriber: false,
          entitlements: [],
          isLoading: false,
        }));
        return;
      }

      // Check Gold Vault entitlement
      const goldVault = customerInfo.entitlements.active[GOLD_VAULT_ID];
      const isSubscriber = goldVault?.isActive === true;

      // Get all active entitlements
      const activeEntitlements = Object.keys(customerInfo.entitlements.active).filter(
        (key) => customerInfo.entitlements.active[key].isActive
      );

      // Parse expiration date
      let expiresAt: number | undefined;
      if (goldVault?.expirationDate) {
        expiresAt = new Date(goldVault.expirationDate).getTime();
      }

      // Update state
      setState({
        isSubscriber,
        entitlements: activeEntitlements,
        isLoading: false,
        error: null,
        expiresAt,
        willRenew: goldVault?.willRenew,
      });

      // Cache the entitlement
      if (isSubscriber) {
        await AsyncStorage.setItem(
          ENTITLEMENT_CACHE_KEY,
          JSON.stringify({
            entitlements: activeEntitlements,
            expiresAt,
            willRenew: goldVault?.willRenew,
            cachedAt: Date.now(),
          })
        );
      } else {
        // Clear cache if not subscriber
        await AsyncStorage.removeItem(ENTITLEMENT_CACHE_KEY);
      }

      // Sync to Firebase if user is signed in
      if (userId && db) {
        await syncToFirebase(userId, {
          active: isSubscriber,
          expiresAt,
          entitlementIds: activeEntitlements,
        });
      }
    } catch (error) {
      console.error('Error fetching entitlements:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));

      // Fall back to cached data on error
      await loadCachedEntitlement();
    }
  }, [userId, loadCachedEntitlement]);

  // Sync entitlement to Firebase
  const syncToFirebase = async (
    uid: string,
    subscription: { active: boolean; expiresAt?: number; entitlementIds: string[] }
  ) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        await updateDoc(userRef, {
          subscription,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error syncing to Firebase:', error);
      // Don't throw - this is a best-effort sync
    }
  };

  // Refresh entitlements
  const refresh = useCallback(async () => {
    await fetchEntitlements();
  }, [fetchEntitlements]);

  // Check if user has specific entitlement
  const hasEntitlement = useCallback(
    (entitlementId: string): boolean => {
      return state.entitlements.includes(entitlementId);
    },
    [state.entitlements]
  );

  // Check if subscription is expired
  const isExpired = useCallback((): boolean => {
    if (!state.expiresAt) return false;
    return Date.now() > state.expiresAt;
  }, [state.expiresAt]);

  // Get days until expiration
  const getDaysUntilExpiration = useCallback((): number | null => {
    if (!state.expiresAt) return null;
    const msUntilExpiration = state.expiresAt - Date.now();
    if (msUntilExpiration < 0) return 0;
    return Math.ceil(msUntilExpiration / (1000 * 60 * 60 * 24));
  }, [state.expiresAt]);

  // Initial load
  useEffect(() => {
    // Load cached data first for immediate UI
    loadCachedEntitlement().then(() => {
      // Then fetch fresh data
      fetchEntitlements();
    });
  }, [userId]); // Re-run when userId changes

  // Set up listener for customer info updates
  useEffect(() => {
    const listener = (info: any) => {
      // Update state when customer info changes (e.g., after purchase)
      fetchEntitlements();
    };

    // This would be set up in the RevenueCat service
    // For now, we'll rely on manual refresh after purchase

    return () => {
      // Cleanup listener if implemented
    };
  }, [fetchEntitlements]);

  return {
    isSubscriber: state.isSubscriber,
    entitlements: state.entitlements,
    isLoading: state.isLoading,
    error: state.error,
    expiresAt: state.expiresAt,
    willRenew: state.willRenew,
    refresh,
    hasEntitlement,
    isExpired,
    getDaysUntilExpiration,
  };
};

// Helper hook for Gold Vault specific checks
export const useGoldVaultSubscription = (userId?: string) => {
  const entitlements = useEntitlements(userId);

  return {
    ...entitlements,
    isGoldVaultMember: entitlements.isSubscriber && entitlements.hasEntitlement(GOLD_VAULT_ID),
  };
};
