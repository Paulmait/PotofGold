import { useState, useEffect, useRef, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineManager } from '../utils/offlineManager';
import { masterGameManager } from '../utils/masterGameManager';

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingActions: number;
  syncError: string | null;
}

export interface SyncResult {
  success: boolean;
  syncedActions: number;
  errors: string[];
}

export const useOfflineSync = () => {
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
    pendingActions: 0,
    syncError: null,
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check network connectivity
  const checkConnectivity = useCallback(async () => {
    try {
      const netInfo = await NetInfo.fetch();
      const wasOnline = syncState.isOnline;
      const isOnline = netInfo.isConnected && netInfo.isInternetReachable;

      if (wasOnline !== isOnline) {
        setSyncState((prev) => ({
          ...prev,
          isOnline,
          syncError: isOnline ? null : 'No internet connection',
        }));

        if (isOnline && !wasOnline) {
          // Just reconnected, trigger sync
          await syncPendingActions();
        }
      }
    } catch (error) {
      console.log('Error checking connectivity:', error);
    }
  }, [syncState.isOnline]);

  // Sync pending actions
  const syncPendingActions = useCallback(async (): Promise<SyncResult> => {
    if (!syncState.isOnline || syncState.isSyncing) {
      return { success: false, syncedActions: 0, errors: ['Offline or already syncing'] };
    }

    setSyncState((prev) => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      // Get pending actions from storage
      const pendingActionsData = await AsyncStorage.getItem('offline_actions');
      const pendingActions = pendingActionsData ? JSON.parse(pendingActionsData) : [];

      if (pendingActions.length === 0) {
        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncTime: new Date(),
          pendingActions: 0,
        }));
        return { success: true, syncedActions: 0, errors: [] };
      }

      const results = await Promise.allSettled(
        pendingActions.map(async (action) => {
          try {
            switch (action.type) {
              case 'game_session':
                return await masterGameManager.completeGameSession(action.data);

              case 'purchase':
                return await masterGameManager.processPurchase(action.data);

              case 'achievement':
                return await masterGameManager.unlockAchievement(action.data);

              case 'analytics':
                return await masterGameManager.logAnalytics(action.data);

              case 'user_progress':
                return await masterGameManager.updateUserProgress(action.data);

              default:
                throw new Error(`Unknown action type: ${action.type}`);
            }
          } catch (error) {
            throw new Error(`Failed to sync ${action.type}: ${error}`);
          }
        })
      );

      // Process results
      const successfulActions: string[] = [];
      const failedActions: string[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        const action = pendingActions[index];
        if (result.status === 'fulfilled') {
          successfulActions.push(action.id);
        } else {
          failedActions.push(action.id);
          errors.push(result.reason?.message || 'Unknown error');
        }
      });

      // Remove successful actions from pending
      if (successfulActions.length > 0) {
        await offlineManager.removePendingActions(successfulActions);
      }

      // Update sync state
      const remainingActions = await offlineManager.getPendingActions();
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
        pendingActions: remainingActions.length,
        syncError: errors.length > 0 ? errors.join(', ') : null,
      }));

      return {
        success: failedActions.length === 0,
        syncedActions: successfulActions.length,
        errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        syncError: errorMessage,
      }));
      return { success: false, syncedActions: 0, errors: [errorMessage] };
    }
  }, [syncState.isOnline, syncState.isSyncing]);

  // Reconcile local vs remote state
  const reconcileState = useCallback(async () => {
    if (!syncState.isOnline) return;

    try {
      // Get local state
      const localState = await offlineManager.getLocalState();

      // Get remote state
      const remoteState = await masterGameManager.getUserState();

      // Compare and resolve conflicts
      const conflicts = findConflicts(localState, remoteState);

      if (conflicts.length > 0) {
        console.log('Found state conflicts:', conflicts);

        // Resolve conflicts (prefer remote for critical data, local for recent actions)
        const resolvedState = await resolveConflicts(localState, remoteState, conflicts);

        // Update local state with resolved data
        await offlineManager.updateLocalState(resolvedState);

        // Sync any remaining pending actions
        await syncPendingActions();
      }
    } catch (error) {
      console.log('Error reconciling state:', error);
    }
  }, [syncState.isOnline, syncPendingActions]);

  // Find conflicts between local and remote state
  const findConflicts = (local: any, remote: any): string[] => {
    const conflicts: string[] = [];

    // Check for version conflicts
    if (local.version !== remote.version) {
      conflicts.push('version_mismatch');
    }

    // Check for data conflicts
    if (local.lastModified > remote.lastModified) {
      conflicts.push('local_newer');
    } else if (remote.lastModified > local.lastModified) {
      conflicts.push('remote_newer');
    }

    return conflicts;
  };

  // Resolve conflicts between local and remote state
  const resolveConflicts = async (local: any, remote: any, conflicts: string[]): Promise<any> => {
    const resolved = { ...local };

    for (const conflict of conflicts) {
      switch (conflict) {
        case 'version_mismatch':
          // Prefer remote version for critical data
          resolved.version = remote.version;
          break;

        case 'local_newer':
          // Keep local changes but merge with remote
          resolved.lastModified = Math.max(local.lastModified, remote.lastModified);
          resolved.data = { ...remote.data, ...local.data };
          break;

        case 'remote_newer':
          // Prefer remote data
          resolved.lastModified = remote.lastModified;
          resolved.data = remote.data;
          break;
      }
    }

    return resolved;
  };

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!syncState.isOnline) {
      setSyncState((prev) => ({ ...prev, syncError: 'Cannot sync while offline' }));
      return;
    }

    await syncPendingActions();
  }, [syncState.isOnline, syncPendingActions]);

  // Auto-sync on reconnect
  const handleReconnect = useCallback(async () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(async () => {
      await reconcileState();
      await syncPendingActions();
    }, 1000); // Wait 1 second after reconnection
  }, [reconcileState, syncPendingActions]);

  // Periodic sync check
  useEffect(() => {
    const checkInterval = setInterval(checkConnectivity, 5000); // Check every 5 seconds

    return () => {
      clearInterval(checkInterval);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [checkConnectivity]);

  // Auto-sync when online
  useEffect(() => {
    if (syncState.isOnline && syncState.pendingActions > 0) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(syncPendingActions, 2000); // Sync after 2 seconds
    }
  }, [syncState.isOnline, syncState.pendingActions, syncPendingActions]);

  // Handle reconnection
  useEffect(() => {
    if (syncState.isOnline) {
      handleReconnect();
    }
  }, [syncState.isOnline, handleReconnect]);

  // Update pending actions count
  useEffect(() => {
    const updatePendingCount = async () => {
      try {
        const pendingActions = await offlineManager.getPendingActions();
        setSyncState((prev) => ({ ...prev, pendingActions: pendingActions.length }));
      } catch (error) {
        console.log('Error updating pending count:', error);
      }
    };

    updatePendingCount();
  }, []);

  return {
    syncState,
    triggerSync,
    reconcileState,
    checkConnectivity,
  };
};
