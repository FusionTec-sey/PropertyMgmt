import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useRef } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from '@/lib/trpc';
import { useQueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface PendingChange {
  id: string;
  entity: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

const STORAGE_KEYS = {
  PENDING_CHANGES: '@sync/pending_changes',
  LAST_SYNC_TIME: '@sync/last_sync_time',
  SYNC_ENABLED: '@sync/sync_enabled',
};

export const [SyncContext, useSync] = createContextHook(() => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [syncEnabled, setSyncEnabledState] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  
  const syncInProgress = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadSyncData = async () => {
      try {
        const [savedPendingChanges, savedLastSyncTime, savedSyncEnabled] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PENDING_CHANGES),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME),
          AsyncStorage.getItem(STORAGE_KEYS.SYNC_ENABLED),
        ]);
        
        if (savedPendingChanges) {
          setPendingChanges(JSON.parse(savedPendingChanges));
        }
        if (savedLastSyncTime) {
          setLastSyncTime(savedLastSyncTime);
        }
        if (savedSyncEnabled !== null) {
          setSyncEnabledState(savedSyncEnabled === 'true');
        }
      } catch (error) {
        console.error('[SYNC] Error loading sync data:', error);
      }
    };

    loadSyncData();
  }, []);

  const syncNowRef = useRef<((tenantId: string) => Promise<void>) | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      console.log(`[SYNC] Network status changed: ${online ? 'ONLINE' : 'OFFLINE'}`);
      setIsOnline(online);
      
      if (online && syncEnabled && pendingChanges.length > 0 && currentTenantId && syncNowRef.current) {
        console.log(`[SYNC] Back online with ${pendingChanges.length} pending changes, triggering sync`);
        syncNowRef.current(currentTenantId);
      }
    });

    return () => unsubscribe();
  }, [pendingChanges, syncEnabled, currentTenantId]);

  const savePendingChanges = useCallback(async (changes: PendingChange[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CHANGES, JSON.stringify(changes));
      setPendingChanges(changes);
      console.log(`[SYNC] Saved ${changes.length} pending changes`);
    } catch (error) {
      console.error('[SYNC] Error saving pending changes:', error);
    }
  }, []);

  const addPendingChange = useCallback(async (
    entity: string,
    action: 'create' | 'update' | 'delete',
    data: any
  ) => {
    if (!syncEnabled) {
      console.log('[SYNC] Sync disabled, not queuing change');
      return;
    }

    const change: PendingChange = {
      id: `${Date.now()}-${Math.random()}`,
      entity,
      action,
      data: { ...data, version: (data.version || 0) + 1 },
      timestamp: new Date().toISOString(),
    };

    const newPendingChanges = [...pendingChanges, change];
    await savePendingChanges(newPendingChanges);
    
    console.log(`[SYNC] Queued ${action} ${entity}: ${data.id}`);

    if (isOnline && currentTenantId && syncNowRef.current) {
      syncNowRef.current(currentTenantId);
    }
  }, [pendingChanges, savePendingChanges, syncEnabled, isOnline, currentTenantId]);

  const getAllDataQuery = trpc.data.sync.getAllData.useQuery(
    { tenantId: currentTenantId || '' },
    { 
      enabled: false,
      retry: false,
    }
  );

  const pushChangesMutation = trpc.data.sync.pushChanges.useMutation();

  const syncNow = useCallback(async (tenantId: string) => {
    if (!syncEnabled) {
      console.log('[SYNC] Sync is disabled');
      return;
    }

    if (!isOnline) {
      console.log('[SYNC] Cannot sync while offline');
      setSyncStatus('offline');
      return;
    }

    if (syncInProgress.current) {
      console.log('[SYNC] Sync already in progress, skipping');
      return;
    }

    console.log(`[SYNC] Starting sync for tenant ${tenantId}`);
    syncInProgress.current = true;
    setSyncStatus('syncing');
    setErrorMessage(null);

    try {
      if (pendingChanges.length > 0) {
        console.log(`[SYNC] Pushing ${pendingChanges.length} pending changes to server`);
        
        const changesByEntity: Record<string, any[]> = {};
        
        for (const change of pendingChanges) {
          if (!changesByEntity[change.entity]) {
            changesByEntity[change.entity] = [];
          }
          changesByEntity[change.entity].push(change.data);
        }

        await pushChangesMutation.mutateAsync({
          tenantId,
          changes: changesByEntity,
        });

        await savePendingChanges([]);
        console.log('[SYNC] Successfully pushed all changes');
      }

      console.log('[SYNC] Pulling latest data from server');
      const serverData = await getAllDataQuery.refetch();
      
      if (serverData.data) {
        console.log('[SYNC] Received server data, updating local cache');
        
        const syncTime = new Date().toISOString();
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, syncTime);
        setLastSyncTime(syncTime);

        queryClient.setQueryData(['serverData', tenantId], serverData.data);
        
        setSyncStatus('success');
        console.log(`[SYNC] Sync completed successfully at ${syncTime}`);
        
        setTimeout(() => {
          if (syncStatus === 'success') {
            setSyncStatus('idle');
          }
        }, 3000);
      }
    } catch (error: any) {
      console.error('[SYNC] Sync error:', error);
      setSyncStatus('error');
      setErrorMessage(error.message || 'Sync failed');
    } finally {
      syncInProgress.current = false;
    }
  }, [
    syncEnabled,
    isOnline,
    pendingChanges,
    pushChangesMutation,
    getAllDataQuery,
    savePendingChanges,
    queryClient,
    syncStatus,
  ]);

  const pullFromServer = useCallback(async (tenantId: string) => {
    console.log(`[SYNC] Pulling data from server for tenant ${tenantId}`);
    setSyncStatus('syncing');
    setErrorMessage(null);

    try {
      const result = await getAllDataQuery.refetch();
      
      if (result.data) {
        const syncTime = new Date().toISOString();
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, syncTime);
        setLastSyncTime(syncTime);
        
        queryClient.setQueryData(['serverData', tenantId], result.data);
        
        setSyncStatus('success');
        console.log('[SYNC] Pull completed successfully');
        
        setTimeout(() => {
          if (syncStatus === 'success') {
            setSyncStatus('idle');
          }
        }, 3000);
        
        return result.data;
      }
    } catch (error: any) {
      console.error('[SYNC] Pull error:', error);
      setSyncStatus('error');
      setErrorMessage(error.message || 'Pull failed');
      throw error;
    }
  }, [getAllDataQuery, queryClient, syncStatus]);

  const setSyncEnabled = useCallback(async (enabled: boolean) => {
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_ENABLED, enabled.toString());
    setSyncEnabledState(enabled);
    console.log(`[SYNC] Sync ${enabled ? 'enabled' : 'disabled'}`);
    
    if (enabled && isOnline && currentTenantId && pendingChanges.length > 0) {
      syncNow(currentTenantId);
    }
  }, [isOnline, currentTenantId, pendingChanges, syncNow]);

  const clearPendingChanges = useCallback(async () => {
    await savePendingChanges([]);
    console.log('[SYNC] Cleared all pending changes');
  }, [savePendingChanges]);

  const setTenantId = useCallback((tenantId: string | null) => {
    setCurrentTenantId(tenantId);
    if (tenantId && syncEnabled && isOnline && syncNowRef.current) {
      syncNowRef.current(tenantId);
    }
  }, [syncEnabled, isOnline]);

  syncNowRef.current = syncNow;

  return {
    syncStatus,
    isOnline,
    lastSyncTime,
    pendingChanges,
    pendingChangesCount: pendingChanges.length,
    syncEnabled,
    errorMessage,
    currentTenantId,
    
    addPendingChange,
    syncNow,
    pullFromServer,
    setSyncEnabled,
    clearPendingChanges,
    setTenantId,
  };
});
