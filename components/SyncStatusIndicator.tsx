import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSync } from '@/contexts/SyncContext';
import { WifiOff, CheckCircle, XCircle, RefreshCw, Cloud, CloudOff } from 'lucide-react-native';

export default function SyncStatusIndicator() {
  const {
    syncStatus,
    isOnline,
    lastSyncTime,
    pendingChangesCount,
    syncEnabled,
    errorMessage,
    currentTenantId,
    syncNow,
  } = useSync();

  const getStatusIcon = () => {
    if (!isOnline) {
      return <CloudOff size={20} color="#F59E0B" />;
    }

    switch (syncStatus) {
      case 'syncing':
        return <ActivityIndicator size="small" color="#3B82F6" />;
      case 'success':
        return <CheckCircle size={20} color="#10B981" />;
      case 'error':
        return <XCircle size={20} color="#EF4444" />;
      case 'offline':
        return <WifiOff size={20} color="#9CA3AF" />;
      default:
        return pendingChangesCount > 0 ? (
          <Cloud size={20} color="#F59E0B" />
        ) : (
          <Cloud size={20} color="#10B981" />
        );
    }
  };

  const getStatusText = () => {
    if (!syncEnabled) {
      return 'Sync disabled';
    }

    if (!isOnline) {
      return 'Offline mode';
    }

    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced';
      case 'error':
        return errorMessage || 'Sync failed';
      case 'offline':
        return 'Offline';
      default:
        return pendingChangesCount > 0
          ? `${pendingChangesCount} pending changes`
          : 'All changes synced';
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return '#F59E0B';

    switch (syncStatus) {
      case 'syncing':
        return '#3B82F6';
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'offline':
        return '#9CA3AF';
      default:
        return pendingChangesCount > 0 ? '#F59E0B' : '#10B981';
    }
  };

  const handleSync = () => {
    if (currentTenantId && isOnline && syncEnabled && syncStatus !== 'syncing') {
      syncNow(currentTenantId);
    }
  };

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Never';

    const date = new Date(lastSyncTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={styles.statusInfo}>
          {getStatusIcon()}
          <View style={styles.textContainer}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
            {lastSyncTime && (
              <Text style={styles.lastSyncText}>
                Last sync: {formatLastSyncTime()}
              </Text>
            )}
          </View>
        </View>
        
        {isOnline && syncEnabled && syncStatus !== 'syncing' && (
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSync}
            activeOpacity={0.7}
          >
            <RefreshCw size={18} color="#3B82F6" />
            <Text style={styles.syncButtonText}>Sync</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isOnline && (
        <View style={styles.warningBanner}>
          <WifiOff size={16} color="#F59E0B" />
          <Text style={styles.warningText}>
            {`You're offline. Changes will sync when connection is restored.`}
          </Text>
        </View>
      )}

      {pendingChangesCount > 0 && isOnline && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            {pendingChangesCount} change{pendingChangesCount > 1 ? 's' : ''} waiting to sync
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  lastSyncText: {
    fontSize: 13,
    color: '#6B7280',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3B82F6',
    marginLeft: 4,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  infoBanner: {
    backgroundColor: '#DBEAFE',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
  },
});
