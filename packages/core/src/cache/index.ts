import { LRUCache } from 'lru-cache';
import { CacheEntry, CacheStats, DeepPartial } from '../types';

// Re-export types for convenience
export type { CacheEntry, CacheStats } from '../types';

export interface CacheOptions {
  maxSize?: number;
  ttl?: number;
  maxAge?: number;
  updateAgeOnGet?: boolean;
  updateAgeOnHas?: boolean;
  allowStale?: boolean;
  sizeCalculation?: (value: any, key: string) => number;
  dispose?: (value: any, key: string) => void;
  noDisposeOnSet?: boolean;
  disposeAfter?: (value: any, key: string, reason: string) => void;
}

export class EnhancedLRUCache<T = any> {
  private cache: LRUCache<string, CacheEntry<T>>;
  private stats: CacheStats;

  constructor(options: CacheOptions = {}) {
    const defaultOptions: Required<CacheOptions> = {
      maxSize: 1000,
      ttl: 1000 * 60 * 60, // 1 hour
      maxAge: 1000 * 60 * 60, // 1 hour
      updateAgeOnGet: true,
      updateAgeOnHas: false,
      allowStale: false,
      sizeCalculation: () => 1,
      dispose: () => {},
      noDisposeOnSet: false,
      disposeAfter: () => {},
      ...options
    };

    this.cache = new LRUCache({
      max: defaultOptions.maxSize,
      ttl: defaultOptions.ttl,
      updateAgeOnGet: defaultOptions.updateAgeOnGet,
      updateAgeOnHas: defaultOptions.updateAgeOnHas,
      allowStale: defaultOptions.allowStale
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      maxSize: defaultOptions.maxSize,
      hitRate: 0
    };
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (entry) {
      this.stats.hits++;
      this.updateStats();
      return entry.value;
    } else {
      this.stats.misses++;
      this.updateStats();
      return undefined;
    }
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T, options?: { ttl?: number; size?: number }): void {
    const size = options?.size ?? this.calculateSize(value);
    const ttl = options?.ttl ?? this.cache.ttl;

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      size
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.updateStats();
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateStats();
    }
    return deleted;
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      maxSize: this.stats.maxSize,
      hitRate: 0
    };
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get current cache size (number of items)
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get cache size information
   */
  getSizeInfo(): { size: number; maxSize: number; utilization: number } {
    const currentSize = this.cache.size;
    const maxSize = this.stats.maxSize;
    return {
      size: currentSize,
      maxSize,
      utilization: maxSize > 0 ? currentSize / maxSize : 0
    };
  }

  /**
   * Check if cache is at capacity
   */
  isAtCapacity(): boolean {
    return this.cache.size >= this.stats.maxSize;
  }

  /**
   * Get or set with atomic operation
   */
  getOrSet(key: string, factory: () => T, options?: { ttl?: number; size?: number }): T {
    let value = this.get(key);

    if (value === undefined) {
      value = factory();
      this.set(key, value, options);
    }

    return value;
  }

  /**
   * Batch get operation
   */
  getBatch(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();

    for (const key of keys) {
      const value = this.get(key);
      if (value !== undefined) {
        results.set(key, value);
      }
    }

    return results;
  }

  /**
   * Get multiple values by keys (alias for getBatch for compatibility)
   */
  getMany(keys: string[]): Map<string, T> {
    return this.getBatch(keys);
  }

  /**
   * Batch set operation
   */
  setBatch(entries: Array<{ key: string; value: T; ttl?: number; size?: number }>): void {
    for (const entry of entries) {
      this.set(entry.key, entry.value, { ttl: entry.ttl, size: entry.size });
    }
  }

  /**
   * Set multiple values (alias for setBatch for compatibility)
   */
  setMany(entries: Array<{ key: string; value: T; ttl?: number; size?: number }>): void {
    this.setBatch(entries);
  }

  /**
   * Delete multiple keys
   */
  deleteBatch(keys: string[]): number {
    let deletedCount = 0;

    for (const key of keys) {
      if (this.delete(key)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get cache dump for debugging
   */
  dump(): Array<{ key: string; value: T; timestamp: number; ttl: number; size: number }> {
    const entries: Array<{ key: string; value: T; timestamp: number; ttl: number; size: number }> = [];

    for (const [key, entry] of this.cache.entries()) {
      entries.push({
        key,
        value: entry.value,
        timestamp: entry.timestamp,
        ttl: entry.ttl,
        size: entry.size
      });
    }

    return entries;
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const initialSize = this.cache.size;
    // LRU cache automatically removes expired entries on access
    // This method forces cleanup of all expired entries
    const keys = Array.from(this.cache.keys());
    let removedCount = 0;

    for (const key of keys) {
      this.cache.get(key); // This will remove expired entries
    }

    removedCount = initialSize - this.cache.size;
    return removedCount;
  }

  private calculateSize(value: T): number {
    if (typeof value === 'string') {
      return value.length;
    } else if (typeof value === 'number') {
      return 8; // Size of number in bytes
    } else if (typeof value === 'boolean') {
      return 1; // Size of boolean in bytes
    } else if (value === null || value === undefined) {
      return 0;
    } else if (Array.isArray(value)) {
      return value.length * 8; // Rough estimate for array elements
    } else if (typeof value === 'object') {
      // Rough estimate for object size
      return Object.keys(value).length * 50;
    } else {
      return 16; // Default size for other types
    }
  }

  private updateStats(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
    this.stats.size = this.cache.size;
  }
}

// Global cache instances
export const defaultCache = new EnhancedLRUCache();
export const analysisCache = new EnhancedLRUCache({ maxSize: 5000, ttl: 1000 * 60 * 30 }); // 30 minutes
export const extractionCache = new EnhancedLRUCache({ maxSize: 2000, ttl: 1000 * 60 * 60 }); // 1 hour
export const generationCache = new EnhancedLRUCache({ maxSize: 1000, ttl: 1000 * 60 * 15 }); // 15 minutes
