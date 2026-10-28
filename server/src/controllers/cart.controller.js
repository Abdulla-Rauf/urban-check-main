import { CartService } from '../services/cart.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class CartController {
  /**
   * GET /api/cart
   * Retrieves active shopping bag with live recalculated totals
   */
  static async getCart(req, res, next) {
    try {
      const couponCode = req.query.couponCode || req.query.coupon || null;
      const cart = await CartService.getCart(req.user.id, couponCode);
      return ApiResponse.success(res, 'Shopping bag retrieved', cart);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/cart/add
   * Adds an item to the shopping bag with price recalculation
   */
  static async addItem(req, res, next) {
    try {
      const productId = req.body.productId || req.body.id || req.body._id;
      const { sku, size, color, quantity } = req.body;
      const cart = await CartService.addItem(req.user.id, {
        productId,
        sku,
        size,
        color,
        quantity,
      });
      return ApiResponse.success(res, 'Garment added to shopping bag', cart);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/cart/items/:itemId
   * Updates an item's quantity in the shopping bag
   */
  static async updateQuantity(req, res, next) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      const cart = await CartService.updateQuantity(req.user.id, itemId, quantity);
      return ApiResponse.success(res, 'Shopping bag updated', cart);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/cart/items/:itemId
   * Removes an item from the shopping bag
   */
  static async removeItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const cart = await CartService.removeItem(req.user.id, itemId);
      return ApiResponse.success(res, 'Garment removed from shopping bag', cart);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/cart
   * Clears the active shopping bag
   */
  static async clearCart(req, res, next) {
    try {
      const cart = await CartService.clearCart(req.user.id);
      return ApiResponse.success(res, 'Shopping bag cleared', cart);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/cart/sync
   * Merges guest items into authenticated user cart
   */
  static async syncCart(req, res, next) {
    try {
      const { items } = req.body;
      const cart = await CartService.syncGuestCart(req.user.id, items);
      return ApiResponse.success(res, 'Shopping bag synchronized', cart);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/cart/calculate
   * Public endpoint to calculate/verify prices and totals for guest browsing
   */
  static async calculateGuest(req, res, next) {
    try {
      const { items, couponCode } = req.body;
      const result = await CartService.calculateGuestCart(items, couponCode);
      return ApiResponse.success(res, 'Bag totals calculated', result);
    } catch (err) {
      next(err);
    }
  }
}
