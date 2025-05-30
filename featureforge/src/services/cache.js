/**
 * Simple in-memory cache for API responses
 * Helps reduce redundant API calls and improve performance
 */
class CacheService {
  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate cache key from URL and params
   */
  generateKey(url, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${url}${paramString ? '?' + paramString : ''}`;
  }

  /**
   * Set item in cache with TTL
   */
  set(key, data, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now()
    });
  }

  /**
   * Get item from cache if not expired
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Check if item exists and is valid
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Remove item from cache
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Clear expired items
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: valid / (valid + expired) || 0
    };
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Auto cleanup every 10 minutes
setInterval(() => {
  cacheService.cleanup();
}, 10 * 60 * 1000);

/**
 * Cache wrapper for API calls
 */
export const withCache = (apiCall, cacheKey, ttl) => {
  return async (...args) => {
    const key = typeof cacheKey === 'function' ? cacheKey(...args) : cacheKey;
    
    // Try to get from cache first
    const cached = cacheService.get(key);
    if (cached) {
      return cached;
    }

    // If not in cache, make API call
    try {
      const result = await apiCall(...args);
      cacheService.set(key, result, ttl);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  };
};

/**
 * Cache tags for easy invalidation
 */
export const CacheTags = {
  TEAMS: 'teams',
  FEATURES: 'features',
  USER: 'user',
  MEMBERS: 'members'
};

export default cacheService; 