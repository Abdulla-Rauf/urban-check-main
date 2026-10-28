import mongoose from 'mongoose';
import { RecentlyViewed } from '../models/RecentlyViewed.js';
import { Product } from '../models/Product.js';

export class RecentlyViewedService {
  /**
   * Records a product view for an authenticated user
   */
  static async recordView(userId, productIdOrSlug) {
    if (!productIdOrSlug) return null;

    let productId = productIdOrSlug;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const p = await Product.findOne({ slug: productIdOrSlug }).select('_id');
      if (!p) return null;
      productId = p._id;
    }

    let history = await RecentlyViewed.findOne({ user: userId });
    if (!history) {
      history = await RecentlyViewed.create({ user: userId, items: [] });
    }

    // Remove if already present so it moves to front
    history.items = history.items.filter(
      (item) => item.product.toString() !== productId.toString()
    );

    // Add to beginning
    history.items.unshift({
      product: productId,
      viewedAt: new Date(),
    });

    // Cap at 20 items
    if (history.items.length > 20) {
      history.items = history.items.slice(0, 20);
    }

    await history.save();
    return history;
  }

  /**
   * Retrieves recently viewed products
   */
  static async getRecentlyViewed(userId, limit = 15) {
    const history = await RecentlyViewed.findOne({ user: userId }).populate({
      path: 'items.product',
      match: { status: 'active' },
      populate: [
        { path: 'brand', select: 'name slug' },
        { path: 'category', select: 'name slug' },
      ],
    });

    if (!history || !history.items) {
      return [];
    }

    return history.items
      .filter((item) => item.product != null)
      .slice(0, limit)
      .map((item) => ({
        ...item.product.toObject(),
        viewedAt: item.viewedAt,
      }));
  }

  /**
   * Synchronizes guest recently viewed items into user account upon login
   */
  static async syncRecentlyViewed(userId, productIdsOrSlugs = []) {
    if (!Array.isArray(productIdsOrSlugs) || productIdsOrSlugs.length === 0) {
      return this.getRecentlyViewed(userId);
    }

    // Resolve any slugs
    const resolvedIds = [];
    for (const item of productIdsOrSlugs) {
      if (mongoose.Types.ObjectId.isValid(item)) {
        resolvedIds.push(item);
      } else if (typeof item === 'string') {
        const p = await Product.findOne({ slug: item }).select('_id');
        if (p) resolvedIds.push(p._id);
      }
    }

    let history = await RecentlyViewed.findOne({ user: userId });
    if (!history) {
      history = await RecentlyViewed.create({ user: userId, items: [] });
    }

    for (const rId of resolvedIds.reverse()) {
      history.items = history.items.filter(
        (item) => item.product.toString() !== rId.toString()
      );
      history.items.unshift({
        product: rId,
        viewedAt: new Date(),
      });
    }

    if (history.items.length > 20) {
      history.items = history.items.slice(0, 20);
    }

    await history.save();
    return this.getRecentlyViewed(userId);
  }
}
