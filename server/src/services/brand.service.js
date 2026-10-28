import mongoose from 'mongoose';
import { Brand } from '../models/Brand.js';
import { RedisService, CACHE_KEYS, CACHE_TTL } from './redis.service.js';
import { localStore } from '../utils/localStore.js';

export class BrandService {
  /**
   * Retrieves all active brands with Redis caching (1 hour TTL)
   */
  static async getAllBrands() {
    const cacheKey = CACHE_KEYS.brandsAll();
    const cached = await RedisService.get(cacheKey);
    if (cached) return cached;

    let brands = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        brands = await Brand.find({ status: 'active' }).sort({ name: 1 }).lean();
      } catch (err) {
        console.warn('Brand query fallback:', err.message);
        brands = localStore.getCollection('brands').filter((b) => b.status === 'active' || b.status === 'Active');
      }
    } else {
      brands = localStore.getCollection('brands').filter((b) => b.status === 'active' || b.status === 'Active');
    }

    await RedisService.set(cacheKey, brands, CACHE_TTL.BRANDS);
    return brands;
  }

  /**
   * Retrieves single brand by slug with Redis caching (1 hour TTL)
   */
  static async getBrandBySlug(slug) {
    if (!slug) return null;
    const cacheKey = CACHE_KEYS.brandSlug(slug);
    const cached = await RedisService.get(cacheKey);
    if (cached) return cached;

    let brand = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        brand = await Brand.findOne({ slug: slug.toLowerCase(), status: 'active' }).lean();
      } catch (err) {
        console.warn('Brand slug query fallback:', err.message);
        brand = localStore.getCollection('brands').find((b) => b.slug === slug.toLowerCase());
      }
    } else {
      brand = localStore.getCollection('brands').find((b) => b.slug === slug.toLowerCase());
    }

    if (brand) {
      await RedisService.set(cacheKey, brand, CACHE_TTL.BRANDS);
    }
    return brand;
  }

  /**
   * Admin: Create brand
   */
  static async createBrand(data) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const logoUrl = data.logo || data.image || data.imageUrl || '';
    const brandDoc = {
      ...data,
      slug,
      logo: logoUrl,
      image: logoUrl,
      status: data.status || 'active',
    };

    let result = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const brand = new Brand(brandDoc);
        await brand.save();
        result = brand.toObject();
      } catch (err) {
        console.warn('MongoDB brand save fallback:', err.message);
      }
    }

    result = localStore.saveItem('brands', result || brandDoc);
    await RedisService.invalidateBrandCache();
    return result;
  }

  /**
   * Admin: Update brand
   */
  static async updateBrand(id, data) {
    let result = null;
    const logoUrl = data.logo || data.image || data.imageUrl;
    const cleanData = {
      ...data,
      ...(logoUrl !== undefined ? { logo: logoUrl, image: logoUrl } : {}),
    };
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        result = await Brand.findByIdAndUpdate(id, cleanData, {
          new: true,
          runValidators: true,
        }).lean();
      } catch (err) {
        console.warn('MongoDB brand update fallback:', err.message);
      }
    }

    const existing = localStore.getCollection('brands').find((b) => b.id === id || b._id === id);
    result = localStore.saveItem('brands', { ...(existing || {}), ...cleanData, id, _id: id });
    await RedisService.invalidateBrandCache();
    return result;
  }

  /**
   * Admin: Delete brand
   */
  static async deleteBrand(id) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Brand.findByIdAndDelete(id);
      } catch (err) {
        console.warn('MongoDB brand delete fallback:', err.message);
      }
    }

    localStore.deleteItem('brands', id);
    await RedisService.invalidateBrandCache();
    return { success: true, message: 'Brand removed' };
  }
}
