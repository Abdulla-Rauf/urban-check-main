import { shippingService } from '../services/shipping/shipping.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class ShippingController {
  /**
   * GET /api/admin/shipping/couriers
   * List supported courier providers & live configuration status
   */
  static async getCouriers(req, res, next) {
    try {
      const couriers = shippingService.getAvailableCouriers();
      return ApiResponse.success(res, 'Available couriers retrieved', couriers);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/shipping
   * Paginated list of shipments with multi-courier filters
   */
  static async getShipments(req, res, next) {
    try {
      const { page, limit, courier, status, search } = req.query;
      const result = await shippingService.getAllShipments({
        page,
        limit,
        courier,
        status,
        search,
      });
      return ApiResponse.success(res, 'Shipments retrieved successfully', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/shipping/pending-orders
   * List orders ready for dispatch / AWB generation
   */
  static async getPendingOrders(req, res, next) {
    try {
      const orders = await shippingService.getPendingOrders();
      return ApiResponse.success(res, 'Pending orders for dispatch retrieved', orders);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/shipping/create
   * Create shipment, select courier, generate AWB
   */
  static async createShipment(req, res, next) {
    try {
      const { orderNumber, courier, weightKg, originHub, notes } = req.body;
      if (!orderNumber) {
        return ApiResponse.error(res, 'orderNumber is required to book a shipment', 400);
      }

      const shipment = await shippingService.createShipment({
        orderNumber,
        courier,
        weightKg,
        originHub,
        notes,
      });

      return ApiResponse.success(res, `Shipment and AWB generated via ${shipment.courier}`, shipment, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/shipping/update-tracking
   * Update shipment milestone event, date, time, location and description
   */
  static async updateTracking(req, res, next) {
    try {
      const { identifier, status, location, description, date, time } = req.body;
      if (!identifier || !status) {
        return ApiResponse.error(res, 'identifier (shipmentId/AWB) and status are required', 400);
      }

      const updated = await shippingService.updateTracking(identifier, {
        status,
        location,
        description,
        date,
        time,
      });

      return ApiResponse.success(res, `Tracking status updated to ${status}`, updated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/shipping/cancel
   * Cancel courier shipment
   */
  static async cancelShipment(req, res, next) {
    try {
      const { identifier, reason } = req.body;
      if (!identifier) {
        return ApiResponse.error(res, 'identifier (shipmentId/AWB) is required', 400);
      }

      const cancelled = await shippingService.cancelShipment(identifier, reason);
      return ApiResponse.success(res, 'Shipment cancelled successfully', cancelled);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/shipping/:identifier/tracking
   * GET /api/orders/:identifier/tracking
   * Get complete tracking history for customer or admin
   */
  static async getTracking(req, res, next) {
    try {
      const { identifier } = req.params;
      const tracking = await shippingService.getTrackingHistory(identifier);
      return ApiResponse.success(res, 'Tracking history retrieved', tracking);
    } catch (err) {
      next(err);
    }
  }
}
