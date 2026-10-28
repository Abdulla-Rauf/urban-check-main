import { WishlistService } from '../services/wishlist.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class WishlistController {
  /**
   * GET /api/wishlist
   * Retrieves active user wishlist
   */
  static async getWishlist(req, res, next) {
    try {
      const wishlist = await WishlistService.getWishlist(req.user.id);
      return ApiResponse.success(res, 'Wishlist retrieved', wishlist);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/wishlist/toggle
   * Toggles garment in user's personal curation
   */
  static async toggleWishlist(req, res, next) {
    try {
      const productId = req.body.productId || req.body.id || req.body._id;
      const result = await WishlistService.toggleWishlist(req.user.id, productId);
      return ApiResponse.success(res, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/wishlist/:productId
   * Removes garment from wishlist
   */
  static async removeFromWishlist(req, res, next) {
    try {
      const { productId } = req.params;
      const wishlist = await WishlistService.removeFromWishlist(req.user.id, productId);
      return ApiResponse.success(res, 'Garment removed from wishlist', wishlist);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/wishlist/move-to-cart
   * Moves garment from wishlist into shopping bag
   */
  static async moveToCart(req, res, next) {
    try {
      const productId = req.body.productId || req.body.id || req.body._id;
      const { sku, size, color, quantity } = req.body;
      const result = await WishlistService.moveToCart(req.user.id, {
        productId,
        sku,
        size,
        color,
        quantity,
      });
      return ApiResponse.success(res, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/wishlist/sync
   * Merges guest wishlist into user account upon login
   */
  static async syncWishlist(req, res, next) {
    try {
      const { productIds } = req.body;
      const wishlist = await WishlistService.syncGuestWishlist(req.user.id, productIds);
      return ApiResponse.success(res, 'Wishlist synchronized', wishlist);
    } catch (err) {
      next(err);
    }
  }
}
