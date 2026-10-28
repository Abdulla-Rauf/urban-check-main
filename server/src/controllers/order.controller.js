import { OrderService } from '../services/order.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class OrderController {
  /**
   * POST /api/orders/checkout
   * Places order with atomic inventory reservation and snapshots
   */
  static async checkout(req, res, next) {
    try {
      const order = await OrderService.createOrder(req.user.id, req.body);
      return ApiResponse.success(res, 'Order placed successfully', order, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/orders
   * Retrieves all orders for the authenticated customer
   */
  static async getOrders(req, res, next) {
    try {
      const orders = await OrderService.getUserOrders(req.user.id);
      return ApiResponse.success(res, 'Customer orders retrieved', orders);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/orders/:identifier
   * Retrieves details for a specific order (by orderNumber or id)
   */
  static async getOrder(req, res, next) {
    try {
      const { identifier } = req.params;
      const order = await OrderService.getOrderByNumberOrId(req.user.id, identifier);
      return ApiResponse.success(res, 'Order details retrieved', order);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/orders/:identifier/cancel
   * Cancels an order and releases reserved inventory
   */
  static async cancelOrder(req, res, next) {
    try {
      const { identifier } = req.params;
      const { reason } = req.body;
      const order = await OrderService.cancelOrder(req.user.id, identifier, reason);
      return ApiResponse.success(res, 'Order cancelled successfully', order);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/orders/:identifier/verify-payment
   * Verifies online payment gateway signature server-side
   */
  static async verifyPayment(req, res, next) {
    try {
      const { identifier } = req.params;
      const verifiedOrder = await OrderService.verifyPayment(req.user.id, identifier, req.body);
      return ApiResponse.success(res, 'Payment verified successfully and order confirmed', verifiedOrder);
    } catch (err) {
      next(err);
    }
  }
}
