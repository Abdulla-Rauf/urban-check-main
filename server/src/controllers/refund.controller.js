import { RefundService } from '../services/refund.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class RefundController {
  /**
   * GET /api/admin/refunds
   * Admin paginated refund ledgers with status filtering
   */
  static async getRefunds(req, res, next) {
    try {
      const data = await RefundService.getAdminRefunds(req.query);
      return ApiResponse.success(res, 'Refund ledgers retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/refunds/create
   * Create refund linked to order or return
   */
  static async createRefund(req, res, next) {
    try {
      const refund = await RefundService.createRefund({
        ...req.body,
        adminName: req.admin?.name || 'Financial Controller',
      });
      return ApiResponse.success(res, 'Refund record created', refund, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/refunds/:id/process
   * PATCH /api/admin/refunds/:id/status
   * Process refund status change with Razorpay gateway integration
   */
  static async processRefund(req, res, next) {
    try {
      const { id } = req.params;
      const { status, note, speed } = req.body;
      const updated = await RefundService.processRefund(id, {
        status,
        note,
        speed,
        adminName: req.admin?.name || 'Financial Controller',
      });
      return ApiResponse.success(res, `Refund marked as ${updated.status}`, updated);
    } catch (err) {
      next(err);
    }
  }
}
