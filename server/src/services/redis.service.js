import Redis from 'ioredis';
import { config } from '../config/index.js';

/**
 * Standard sensible Cache TTLs (in seconds)
 */
export const CACHE_TTL = {
  HOMEPAGE: 300,        // 5 minutes
  CATEGORIES: 3600,     // 1 hour
  BRANDS: 3600,         // 1 hour
  PRODUCT_LIST: 600,    // 10 minutes
  PRODUCT_DETAIL: 1800, // 30 minutes
  POPULAR: 900,         // 15 minutes
  TRENDING: 900,        // 15 minutes
  SEARCH: 600,          // 10 minutes
  BANNERS: 1800,        // 30 minutes
  OFFERS: 600,          // 10 minutes
};

export const REDIS_TTL = CACHE_TTL;

/**
 * Standard Cache Key Builders
 */
export const CACHE_KEYS = {
  homepage: () => 'uc:homepage',
  categoriesAll: () => 'uc:categories:all',
  categoriesTree: () => 'uc:categories:tree',
  brandsAll: () => 'uc:brands:all',
  brandSlug: (slug) => `uc:brands:slug:${String(slug).toLowerCase()}`,
  productList: (hash) => `uc:products:list:${hash}`,
  productDetail: (slugOrId) => `uc:products:detail:${String(slugOrId).toLowerCase()}`,
  popularProducts: (limit = 8) => `uc:products:popular:${limit}`,
  trendingProducts: (limit = 8) => `uc:products:trending:${limit}`,
  searchSuggestions: (query) => `uc:search:suggest:${String(query).trim().toLowerCase()}`,
  activeBanners: () => 'uc:banners:active',
  activeOffers: () => 'uc:offers:active',
};

/**
 * Resilient In-Memory Cache Fallback
 * Used when Redis is starting up, unreachable, or in development without a local Redis daemon.
 */
class MemoryCacheFallback {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlSeconds = 300) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key) {
    this.cache.delete(key);
  }

  delPattern(pattern) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Production Redis Cache Service
 * Orchestrates ioredis connections with fallback and security sanitization.
 */
export class RedisService {
  static client = null;
  static isConnected = false;
  static memoryFallback = new MemoryCacheFallback();
  static hasLoggedWarning = false;

  static init() {
    if (this.client) return;

    try {
      const redisUrl = config?.database?.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 2000,
        lazyConnect: false,
        retryStrategy: (times) => {
          if (times > 2) {
            if (!this.hasLoggedWarning) {
              console.log(
                'ℹ️  Redis server offline or unreachable. Seamlessly operating with high-speed in-memory cache.'
              );
              this.hasLoggedWarning = true;
            }
            return null; // Stop infinite reconnect attempts in dev
          }
          return Math.min(times * 1000, 2000);
        },
      });

      this.client.on('connect', () => {
        console.log('⚡ Redis cache connected and ready.');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        if (!this.hasLoggedWarning) {
          console.log(`ℹ️  Redis connection status: operating with memory cache fallback (${err.message})`);
          this.hasLoggedWarning = true;
        }
      });
    } catch {
      this.isConnected = false;
    }
  }

  /**
   * SECURITY FILTER ("DO NOT CACHE")
   * Prevents caching passwords, payment secrets, private customer profiles, or sensitive order secrets.
   */
  static isSensitive(key, value) {
    const sensitiveKeyPatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /session/i,
      /payment/i,
      /cvv/i,
      /card/i,
      /customer.*private/i,
      /^uc:user:/i,
      /^uc:auth:/i,
      /^uc:order:sensitive/i,
    ];

    if (sensitiveKeyPatterns.some((regex) => regex.test(key))) {
      return true;
    }

    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value).map((k) => k.toLowerCase());
      const hasSensitiveField = keys.some((k) =>
        k.includes('password') ||
        k.includes('secret') ||
        k.includes('token') ||
        k.includes('card') ||
        k.includes('cvv') ||
        k.includes('private')
      );
      if (hasSensitiveField) {
        return true;
      }
    }

    return false;
  }

  /**
   * Deterministic query hasher for product listing filters
   */
  static hashQuery(query = {}) {
    const sorted = Object.keys(query)
      .sort()
      .reduce((acc, key) => {
        if (query[key] !== undefined && query[key] !== '') {
          acc[key] = query[key];
        }
        return acc;
      }, {});
    return Buffer.from(JSON.stringify(sorted)).toString('base64');
  }

  /**
   * Retrieve cached item
   */
  static async get(key) {
    this.init();

    if (this.isConnected && this.client) {
      try {
        const raw = await this.client.get(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return this.memoryFallback.get(key);
      }
    }

    return this.memoryFallback.get(key);
  }

  /**
   * Set cache item with TTL
   */
  static async set(key, value, ttlSeconds = 300) {
    this.init();

    // Enforce security policy: Do not cache sensitive data
    if (this.isSensitive(key, value)) {
      console.warn(`[Security Alert] Caching prevented for sensitive item: ${key}`);
      return false;
    }

    // Always update fallback for instant availability
    this.memoryFallback.set(key, value, ttlSeconds);

    if (this.isConnected && this.client) {
      try {
        const serialized = JSON.stringify(value);
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } catch {
        // Fallback already updated
      }
    }

    return true;
  }

  /**
   * Delete a single cache key
   */
  static async del(key) {
    this.init();
    this.memoryFallback.del(key);

    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch {
        // Ignored
      }
    }
  }

  /**
   * Delete all keys matching pattern (e.g. 'uc:products:*')
   */
  static async invalidatePattern(pattern) {
    this.init();
    this.memoryFallback.delPattern(pattern);

    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys && keys.length > 0) {
          await this.client.del(...keys);
        }
      } catch {
        // Ignored
      }
    }
  }

  /* =========================================================================
   * HIGH-LEVEL DOMAIN CACHE INVALIDATORS
   * Triggered when Admin changes: Product, Category, Brand, Offer, Banner
   * ========================================================================= */

  /**
   * When a Product is created, updated, or deleted:
   * Invalidate product details, listings, popular/trending, suggestions, and homepage
   */
  static async invalidateProductCache(productId = '', slug = '') {
    await Promise.all([
      this.del(CACHE_KEYS.homepage()),
      this.invalidatePattern('uc:products:*'),
      this.invalidatePattern('products:*'),
      this.invalidatePattern('uc:search:*'),
      slug ? this.del(CACHE_KEYS.productDetail(slug)) : Promise.resolve(),
      productId ? this.del(CACHE_KEYS.productDetail(productId)) : Promise.resolve(),
    ]);
  }

  /**
   * When a Category is created, updated, or deleted:
   * Invalidate category listings, product listings, search suggestions, and homepage
   */
  static async invalidateCategoryCache() {
    await Promise.all([
      this.del(CACHE_KEYS.categoriesAll()),
      this.del(CACHE_KEYS.categoriesTree()),
      this.del(CACHE_KEYS.homepage()),
      this.invalidatePattern('uc:categories:*'),
      this.invalidatePattern('categories:*'),
      this.invalidatePattern('uc:products:*'),
      this.invalidatePattern('products:*'),
      this.invalidatePattern('uc:search:*'),
    ]);
  }

  /**
   * When a Brand is created, updated, or deleted:
   * Invalidate brand listings, product listings, search suggestions, and homepage
   */
  static async invalidateBrandCache() {
    await Promise.all([
      this.del(CACHE_KEYS.brandsAll()),
      this.del(CACHE_KEYS.homepage()),
      this.invalidatePattern('uc:brands:*'),
      this.invalidatePattern('brands:*'),
      this.invalidatePattern('uc:products:*'),
      this.invalidatePattern('products:*'),
      this.invalidatePattern('uc:search:*'),
    ]);
  }

  /**
   * When an Offer is created, updated, or deleted:
   * Invalidate active offers, decorated products, and homepage
   */
  static async invalidateOfferCache() {
    await Promise.all([
      this.del(CACHE_KEYS.activeOffers()),
      this.del(CACHE_KEYS.homepage()),
      this.invalidatePattern('uc:offers:*'),
      this.invalidatePattern('offers:*'),
      this.invalidatePattern('uc:products:*'),
      this.invalidatePattern('products:*'),
    ]);
  }

  /**
   * When a Banner is created, updated, or deleted:
   * Invalidate active banners and homepage
   */
  static async invalidateBannerCache() {
    await Promise.all([
      this.del(CACHE_KEYS.activeBanners()),
      this.del(CACHE_KEYS.homepage()),
      this.invalidatePattern('uc:banners:*'),
      this.invalidatePattern('banners:*'),
      this.invalidatePattern('uc:products:*'),
      this.invalidatePattern('products:*'),
    ]);
  }

  /**
   * Flush entire cache (used in testing or administrative resets)
   */
  static async flushAll() {
    this.memoryFallback.clear();
    if (this.isConnected && this.client) {
      try {
        await this.client.flushdb();
      } catch {
        // Ignored
      }
    }
  }
}
