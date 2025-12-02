import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

export interface ExportData {
  version: string;
  exportedAt: string;
  tenantId: string;
  data: Record<string, unknown>;
}

export interface BackupMetadata {
  id: string;
  createdAt: string;
  tenantId: string;
  dataSize: number;
  version: string;
}

const BACKUP_KEY_PREFIX = '@backup/';
const BACKUP_METADATA_KEY = '@backup/metadata';
const MAX_BACKUPS = 10;

export class DataExport {
  static async exportAllData(tenantId: string): Promise<string> {
    try {
      console.log('[EXPORT] Starting data export for tenant:', tenantId);
      
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter(key => key.startsWith('@app/'));
      
      const data: Record<string, unknown> = {};
      
      for (const key of appKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      }
      
      const exportData: ExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        tenantId,
        data,
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      console.log(`[EXPORT] Export completed. Size: ${jsonString.length} bytes`);
      
      return jsonString;
    } catch (error) {
      console.error('[EXPORT] Failed to export data:', error);
      throw new Error('Failed to export data');
    }
  }

  static async exportToFile(tenantId: string, tenantName: string): Promise<void> {
    try {
      console.log('[EXPORT] Exporting to file...');
      
      const jsonString = await this.exportAllData(tenantId);
      const fileName = `rental_management_backup_${tenantName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        console.log('[EXPORT] File downloaded on web');
      } else {
        const file = new File(Paths.document, fileName);
        file.create();
        file.write(jsonString);
        
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(file.uri);
          console.log('[EXPORT] File shared successfully');
        } else {
          Alert.alert('Success', `Backup saved to: ${file.uri}`);
        }
      }
    } catch (error) {
      console.error('[EXPORT] Failed to export to file:', error);
      throw new Error('Failed to export data to file');
    }
  }

  static async createBackup(tenantId: string): Promise<BackupMetadata> {
    try {
      console.log('[BACKUP] Creating backup...');
      
      const jsonString = await this.exportAllData(tenantId);
      const backupId = `backup-${Date.now()}`;
      const backupKey = `${BACKUP_KEY_PREFIX}${backupId}`;
      
      await AsyncStorage.setItem(backupKey, jsonString);
      
      const metadata: BackupMetadata = {
        id: backupId,
        createdAt: new Date().toISOString(),
        tenantId,
        dataSize: jsonString.length,
        version: '1.0',
      };
      
      const existingMetadata = await this.getBackupMetadata();
      existingMetadata.unshift(metadata);
      
      if (existingMetadata.length > MAX_BACKUPS) {
        const removedBackups = existingMetadata.slice(MAX_BACKUPS);
        for (const backup of removedBackups) {
          await AsyncStorage.removeItem(`${BACKUP_KEY_PREFIX}${backup.id}`);
        }
        existingMetadata.splice(MAX_BACKUPS);
      }
      
      await AsyncStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(existingMetadata));
      
      console.log(`[BACKUP] Backup created: ${backupId}`);
      return metadata;
    } catch (error) {
      console.error('[BACKUP] Failed to create backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  static async getBackupMetadata(): Promise<BackupMetadata[]> {
    try {
      const metadata = await AsyncStorage.getItem(BACKUP_METADATA_KEY);
      return metadata ? JSON.parse(metadata) : [];
    } catch (error) {
      console.error('[BACKUP] Failed to get backup metadata:', error);
      return [];
    }
  }

  static async restoreFromBackup(backupId: string): Promise<void> {
    try {
      console.log(`[RESTORE] Restoring from backup: ${backupId}`);
      
      const backupKey = `${BACKUP_KEY_PREFIX}${backupId}`;
      const backupData = await AsyncStorage.getItem(backupKey);
      
      if (!backupData) {
        throw new Error('Backup not found');
      }
      
      const exportData: ExportData = JSON.parse(backupData);
      
      for (const [key, value] of Object.entries(exportData.data)) {
        await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
      
      console.log('[RESTORE] Restore completed successfully');
    } catch (error) {
      console.error('[RESTORE] Failed to restore backup:', error);
      throw new Error('Failed to restore from backup');
    }
  }

  static async deleteBackup(backupId: string): Promise<void> {
    try {
      console.log(`[BACKUP] Deleting backup: ${backupId}`);
      
      const backupKey = `${BACKUP_KEY_PREFIX}${backupId}`;
      await AsyncStorage.removeItem(backupKey);
      
      const metadata = await this.getBackupMetadata();
      const updatedMetadata = metadata.filter(b => b.id !== backupId);
      await AsyncStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(updatedMetadata));
      
      console.log(`[BACKUP] Backup deleted: ${backupId}`);
    } catch (error) {
      console.error('[BACKUP] Failed to delete backup:', error);
      throw new Error('Failed to delete backup');
    }
  }

  static async importFromFile(fileContent: string): Promise<void> {
    try {
      console.log('[IMPORT] Starting data import...');
      
      const exportData: ExportData = JSON.parse(fileContent);
      
      if (!exportData.version || !exportData.data || !exportData.tenantId) {
        throw new Error('Invalid backup file format');
      }
      
      for (const [key, value] of Object.entries(exportData.data)) {
        if (key.startsWith('@app/')) {
          await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      }
      
      console.log('[IMPORT] Import completed successfully');
    } catch (error) {
      console.error('[IMPORT] Failed to import data:', error);
      throw new Error('Failed to import data');
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
