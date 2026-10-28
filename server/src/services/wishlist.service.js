import mongoose from 'mongoose';
import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { CartService } from './cart.service.js';

export class WishlistService {
  /**
   * Retrieves user wishlist populated with product details
   */
  static async getWishlist(userId) {
    let wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: 'products',
      match: { status: 'active' },
      populate: [
        { path: 'brand', select: 'name slug' },
        { path: 'category', select: 'name slug' },
      ],
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    return {
      _id: wishlist._id,
      user: userId,
      products: wishlist.products || [],
      count: wishlist.products?.length || 0,
    };
  }

  /**
   * Toggles product in user wishlist
   */
  static async toggleWishlist(userId, productId) {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('Valid Product ID is required');
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    const index = wishlist.products.findIndex(
      (p) => p.toString() === productId.toString()
    );

    let isSaved = false;
    if (index > -1) {
      wishlist.products.splice(index, 1);
      isSaved = false;
    } else {
      wishlist.products.push(productId);
      isSaved = true;
    }

    await wishlist.save();
    const updated = await this.getWishlist(userId);

    return {
      ...updated,
      isSaved,
      message: isSaved
        ? 'Garment saved to personal atelier curation'
        : 'Garment removed from personal atelier curation',
    };
  }

  /**
   * Removes product from user wishlist
   */
  static async removeFromWishlist(userId, productId) {
    let wishlist = await Wishlist.findOne({ user: userId });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        (p) => p.toString() !== productId.toString()
      );
      await wishlist.save();
    }
    return this.getWishlist(userId);
  }

  /**
   * Moves product from wishlist to shopping bag
   */
  static async moveToCart(userId, { productId, sku, size = 'M', color = 'Standard', quantity = 1 }) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    // 1. Add to Cart via CartService
    const cart = await CartService.addItem(userId, {
      productId,
      sku,
      size,
      color,
      quantity,
    });

    // 2. Remove from Wishlist
    const wishlist = await this.removeFromWishlist(userId, productId);

    return {
      cart,
      wishlist,
      message: 'Garment moved from curation to shopping bag',
    };
  }

  /**
   * Synchronizes guest wishlist IDs into user's MongoDB wishlist upon login
   */
  static async syncGuestWishlist(userId, guestProductIds = []) {
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    if (!Array.isArray(guestProductIds) || guestProductIds.length === 0) {
      return this.getWishlist(userId);
    }

    const validIds = guestProductIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const currentStrings = new Set(wishlist.products.map((p) => p.toString()));

    validIds.forEach((id) => {
      if (!currentStrings.has(id.toString())) {
        wishlist.products.push(id);
        currentStrings.add(id.toString());
      }
    });

    await wishlist.save();
    return this.getWishlist(userId);
  }
}
