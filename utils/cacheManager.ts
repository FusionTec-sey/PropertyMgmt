import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = '@cache/';
const CACHE_METADATA_KEY = '@cache/metadata';

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt?: number;
  metadata?: Record<string, unknown>;
}

export interface CacheMetadata {
  key: string;
  size: number;
  timestamp: number;
  expiresAt?: number;
  hits: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  expiredEntries: number;
}

export interface CacheOptions {
  ttl?: number;
  metadata?: Record<string, unknown>;
}

export class CacheManager {
  private static metadata: Map<string, CacheMetadata> = new Map();
  private static hits = 0;
  private static misses = 0;
  private static initialized = false;

  static async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const savedMetadata = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      if (savedMetadata) {
        const metadataArray: CacheMetadata[] = JSON.parse(savedMetadata);
        this.metadata = new Map(metadataArray.map(m => [m.key, m]));
      }
      
      await this.cleanExpiredEntries();
      
      this.initialized = true;
      console.log('[CACHE] Initialized successfully');
    } catch (error) {
      console.error('[CACHE] Failed to initialize:', error);
    }
  }

  static async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
      const timestamp = Date.now();
      const expiresAt = options?.ttl ? timestamp + options.ttl : undefined;

      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp,
        expiresAt,
        metadata: options?.metadata,
      };

      const jsonString = JSON.stringify(entry);
      await AsyncStorage.setItem(cacheKey, jsonString);

      const metadata: CacheMetadata = {
        key,
        size: jsonString.length,
        timestamp,
        expiresAt,
        hits: 0,
        lastAccessed: timestamp,
      };

      this.metadata.set(key, metadata);
      await this.saveMetadata();

      console.log(`[CACHE] Cached: ${key} (${metadata.size} bytes, TTL: ${options?.ttl || 'none'})`);
    } catch (error) {
      console.error(`[CACHE] Failed to set cache for ${key}:`, error);
      throw error;
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) {
        this.misses++;
        console.log(`[CACHE] Miss: ${key}`);
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);

      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        console.log(`[CACHE] Expired: ${key}`);
        await this.delete(key);
        this.misses++;
        return null;
      }

      const metadata = this.metadata.get(key);
      if (metadata) {
        metadata.hits++;
        metadata.lastAccessed = Date.now();
        this.metadata.set(key, metadata);
        await this.saveMetadata();
      }

      this.hits++;
      console.log(`[CACHE] Hit: ${key}`);
      return entry.value;
    } catch (error) {
      console.error(`[CACHE] Failed to get cache for ${key}:`, error);
      this.misses++;
      return null;
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
      await AsyncStorage.removeItem(cacheKey);
      this.metadata.delete(key);
      await this.saveMetadata();
      console.log(`[CACHE] Deleted: ${key}`);
    } catch (error) {
      console.error(`[CACHE] Failed to delete cache for ${key}:`, error);
    }
  }

  static async has(key: string): Promise<boolean> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return false;

      const entry: CacheEntry<unknown> = JSON.parse(cached);
      
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.delete(key);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  static async clear(): Promise<void> {
    try {
      const keys = Array.from(this.metadata.keys());
      
      for (const key of keys) {
        await this.delete(key);
      }

      this.hits = 0;
      this.misses = 0;
      
      console.log('[CACHE] Cleared all cache entries');
    } catch (error) {
      console.error('[CACHE] Failed to clear cache:', error);
    }
  }

  static async cleanExpiredEntries(): Promise<number> {
    try {
      const now = Date.now();
      let cleaned = 0;

      const keys = Array.from(this.metadata.keys());
      
      for (const key of keys) {
        const metadata = this.metadata.get(key);
        if (metadata?.expiresAt && now > metadata.expiresAt) {
          await this.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[CACHE] Cleaned ${cleaned} expired entries`);
      }

      return cleaned;
    } catch (error) {
      console.error('[CACHE] Failed to clean expired entries:', error);
      return 0;
    }
  }

  static getStats(): CacheStats {
    let totalSize = 0;
    let expiredEntries = 0;
    const now = Date.now();

    for (const metadata of this.metadata.values()) {
      totalSize += metadata.size;
      if (metadata.expiresAt && now > metadata.expiresAt) {
        expiredEntries++;
      }
    }

    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    return {
      totalEntries: this.metadata.size,
      totalSize,
      hitRate,
      totalHits: this.hits,
      totalMisses: this.misses,
      expiredEntries,
    };
  }

  static logStats(): void {
    const stats = this.getStats();
    
    console.log('[CACHE] ===== Cache Stats =====');
    console.log(`Total entries: ${stats.totalEntries}`);
    console.log(`Total size: ${this.formatSize(stats.totalSize)}`);
    console.log(`Hit rate: ${stats.hitRate.toFixed(2)}%`);
    console.log(`Total hits: ${stats.totalHits}`);
    console.log(`Total misses: ${stats.totalMisses}`);
    console.log(`Expired entries: ${stats.expiredEntries}`);
  }

  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, options);
    
    return value;
  }

  private static async saveMetadata(): Promise<void> {
    try {
      const metadataArray = Array.from(this.metadata.values());
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadataArray));
    } catch (error) {
      console.error('[CACHE] Failed to save metadata:', error);
    }
  }

  private static formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  static async memoize<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    keyGenerator: (...args: T) => string,
    options?: CacheOptions
  ): Promise<(...args: T) => Promise<R>> {
    return async (...args: T): Promise<R> => {
      const key = keyGenerator(...args);
      return this.getOrSet(key, () => fn(...args), options);
    };
  }
}

export const cache = {
  set: <T>(key: string, value: T, options?: CacheOptions) => CacheManager.set(key, value, options),
  get: <T>(key: string) => CacheManager.get<T>(key),
  delete: (key: string) => CacheManager.delete(key),
  has: (key: string) => CacheManager.has(key),
  clear: () => CacheManager.clear(),
  getOrSet: <T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions) => 
    CacheManager.getOrSet(key, fetcher, options),
};
