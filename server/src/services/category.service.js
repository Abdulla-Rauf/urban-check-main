import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { RedisService, CACHE_KEYS, CACHE_TTL } from './redis.service.js';
import { localStore } from '../utils/localStore.js';

export class CategoryService {
  /**
   * Retrieves all categories with Redis caching (1 hour TTL)
   */
  static async getAllCategories() {
    const cacheKey = CACHE_KEYS.categoriesAll();
    const cached = await RedisService.get(cacheKey);
    if (cached) return cached;

    let categories = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        categories = await Category.find({ status: 'active' })
          .sort({ order: 1, name: 1 })
          .populate('parent', 'name slug')
          .lean();
      } catch (err) {
        console.warn('Category query fallback:', err.message);
        categories = localStore.getCollection('categories').filter((c) => c.status === 'active' || c.status === 'Active');
      }
    } else {
      categories = localStore.getCollection('categories').filter((c) => c.status === 'active' || c.status === 'Active');
    }

    await RedisService.set(cacheKey, categories, CACHE_TTL.CATEGORIES);
    return categories;
  }

  /**
   * Builds nested category tree (Root categories with children array, 1 hour TTL)
   */
  static async getCategoryTree() {
    const cacheKey = CACHE_KEYS.categoriesTree();
    const cached = await RedisService.get(cacheKey);
    if (cached) return cached;

    const categories = await this.getAllCategories();
    const rootCategories = categories.filter((c) => !c.parent);
    const subCategories = categories.filter((c) => c.parent);

    const tree = rootCategories.map((root) => ({
      ...root,
      children: subCategories.filter(
        (sub) => sub.parent?.toString() === root._id?.toString() || sub.parent?.toString() === root.id?.toString()
      ),
    }));

    await RedisService.set(cacheKey, tree, CACHE_TTL.CATEGORIES);
    return tree;
  }

  /**
   * Admin: Create category
   */
  static async createCategory(data) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const categoryDoc = {
      ...data,
      slug,
      status: data.status || 'active',
      order: data.order !== undefined ? Number(data.order) : 0,
    };

    let result = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const category = new Category(categoryDoc);
        await category.save();
        result = category.toObject();
      } catch (err) {
        console.warn('MongoDB category save fallback:', err.message);
      }
    }

    // Persist locally
    result = localStore.saveItem('categories', result || categoryDoc);

    await RedisService.invalidateCategoryCache();
    return result;
  }

  /**
   * Admin: Update category
   */
  static async updateCategory(id, data) {
    let result = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        result = await Category.findByIdAndUpdate(id, data, {
          new: true,
          runValidators: true,
        }).lean();
      } catch (err) {
        console.warn('MongoDB category update fallback:', err.message);
      }
    }

    result = localStore.saveItem('categories', { ...data, id, _id: id });
    await RedisService.invalidateCategoryCache();
    return result;
  }

  /**
   * Admin: Delete category
   */
  static async deleteCategory(id) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Category.findByIdAndDelete(id);
      } catch (err) {
        console.warn('MongoDB category delete fallback:', err.message);
      }
    }

    localStore.deleteItem('categories', id);
    await RedisService.invalidateCategoryCache();
    return { success: true, message: 'Category removed' };
  }
}
