import AsyncStorage from '@react-native-async-storage/async-storage';

const MIGRATION_VERSION_KEY = '@app/migration_version';
const CURRENT_VERSION = 1;

export interface MigrationResult {
  success: boolean;
  previousVersion: number;
  currentVersion: number;
  errors: string[];
}

const migrations: Record<number, (data: Record<string, string | null>) => Promise<Record<string, string | null>>> = {
  1: async (data: Record<string, string | null>) => {
    console.log('[MIGRATION] Running migration v1: Add default fields');
    
    const updatedData = { ...data };

    for (const key of Object.keys(updatedData)) {
      if (updatedData[key]) {
        try {
          const parsedData = JSON.parse(updatedData[key]!);
          
          if (Array.isArray(parsedData)) {
            const migratedArray = parsedData.map((item) => {
              if (!item.created_at) {
                item.created_at = new Date().toISOString();
              }
              if (!item.updated_at && key !== '@app/notifications' && key !== '@app/activity_logs') {
                item.updated_at = new Date().toISOString();
              }
              return item;
            });
            updatedData[key] = JSON.stringify(migratedArray);
          } else {
            if (!parsedData.created_at) {
              parsedData.created_at = new Date().toISOString();
            }
            updatedData[key] = JSON.stringify(parsedData);
          }
        } catch (error) {
          console.error(`[MIGRATION] Error migrating ${key}:`, error);
        }
      }
    }

    return updatedData;
  },
};

export const runMigrations = async (): Promise<MigrationResult> => {
  const errors: string[] = [];
  
  try {
    const versionString = await AsyncStorage.getItem(MIGRATION_VERSION_KEY);
    const currentStoredVersion = versionString ? parseInt(versionString, 10) : 0;

    console.log(`[MIGRATION] Current version: ${currentStoredVersion}, Target version: ${CURRENT_VERSION}`);

    if (currentStoredVersion >= CURRENT_VERSION) {
      console.log('[MIGRATION] No migrations needed');
      return {
        success: true,
        previousVersion: currentStoredVersion,
        currentVersion: CURRENT_VERSION,
        errors: [],
      };
    }

    const allKeys = await AsyncStorage.getAllKeys();
    const allData = await AsyncStorage.multiGet(allKeys);
    
    let data: Record<string, string | null> = {};
    allData.forEach(([key, value]) => {
      data[key] = value;
    });

    for (let version = currentStoredVersion + 1; version <= CURRENT_VERSION; version++) {
      if (migrations[version]) {
        console.log(`[MIGRATION] Running migration to version ${version}`);
        try {
          data = await migrations[version](data);
        } catch (error) {
          const errorMsg = `Failed to run migration v${version}: ${error}`;
          console.error(`[MIGRATION] ${errorMsg}`);
          errors.push(errorMsg);
          throw error;
        }
      }
    }

    const dataToSave: [string, string][] = Object.entries(data)
      .filter(([_, value]) => value !== null)
      .map(([key, value]) => [key, value as string]);
    
    if (dataToSave.length > 0) {
      await AsyncStorage.multiSet(dataToSave);
    }

    await AsyncStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_VERSION.toString());

    console.log(`[MIGRATION] Successfully migrated from v${currentStoredVersion} to v${CURRENT_VERSION}`);

    return {
      success: true,
      previousVersion: currentStoredVersion,
      currentVersion: CURRENT_VERSION,
      errors,
    };
  } catch (error) {
    console.error('[MIGRATION] Migration failed:', error);
    errors.push(`Migration failed: ${error}`);
    return {
      success: false,
      previousVersion: 0,
      currentVersion: CURRENT_VERSION,
      errors,
    };
  }
};

export const resetMigrationVersion = async (): Promise<void> => {
  await AsyncStorage.removeItem(MIGRATION_VERSION_KEY);
  console.log('[MIGRATION] Reset migration version');
};

export const getCurrentMigrationVersion = async (): Promise<number> => {
  const versionString = await AsyncStorage.getItem(MIGRATION_VERSION_KEY);
  return versionString ? parseInt(versionString, 10) : 0;
};
