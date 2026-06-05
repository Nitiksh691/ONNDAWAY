/**
 * MemCache — lightweight in-process TTL cache.
 * No external dependencies. Works in Node.js serverless environments.
 * Resets on cold start (by design — prevents stale data across deploys).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private _hits = 0;
  private _misses = 0;

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      this._misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this._misses++;
      return null;
    }
    this._hits++;
    return entry.value;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(pattern)) this.store.delete(key);
    }
  }

  stats() {
    const total = this._hits + this._misses;
    return {
      hits: this._hits,
      misses: this._misses,
      hitRate: total === 0 ? "0%" : `${Math.round((this._hits / total) * 100)}%`,
      keys: this.store.size,
    };
  }
}

// Singleton — shared across all requests in the same Node.js process
const globalCache = (global as any).__OTW_CACHE__ as MemCache | undefined;
export const appCache: MemCache = globalCache ?? (() => {
  const c = new MemCache();
  (global as any).__OTW_CACHE__ = c;
  return c;
})();

// Cache key constants — prevents typos
export const CACHE_KEYS = {
  MENU: "menu",
  SETTINGS: "settings",
  ANALYTICS: "analytics",
} as const;

// TTL constants in milliseconds
export const CACHE_TTL = {
  MENU: 60_000,       // 60 seconds — menu changes rarely
  SETTINGS: 30_000,   // 30 seconds — delivery fee etc.
  ANALYTICS: 120_000, // 2 minutes — analytics can be slightly stale
} as const;
