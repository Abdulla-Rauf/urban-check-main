import { ReturnService } from '../services/return.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class ReturnController {
  /**
   * POST /api/returns/request
   * Customer initiates return or exchange
   */
  static async submitReturn(req, res, next) {
    try {
      const returnDoc = await ReturnService.submitReturnRequest(req.user.id, req.body);
      return ApiResponse.success(res, 'Return request registered successfully', returnDoc, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/returns/validate-exchange
   * Check if requested size is available for exchange
   */
  static async validateExchange(req, res, next) {
    try {
      const { productId, size } = req.query;
      const result = await ReturnService.validateExchangeAvailability(productId, size);
      return ApiResponse.success(res, 'Exchange size availability evaluated', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/returns
   * List customer's returns & exchanges
   */
  static async getMyReturns(req, res, next) {
    try {
      const returns = await ReturnService.getCustomerReturns(req.user.id);
      return ApiResponse.success(res, 'Customer returns retrieved', returns);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/returns/:id
   * Single return details
   */
  static async getReturnDetails(req, res, next) {
    try {
      const returnDoc = await ReturnService.getReturnById(req.params.id, req.user?.id);
      return ApiResponse.success(res, 'Return details retrieved', returnDoc);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/returns
   * Admin paginated returns listing with status filters
   */
  static async getAdminReturns(req, res, next) {
    try {
      const data = await ReturnService.getAdminReturns(req.query);
      return ApiResponse.success(res, 'Admin returns retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/returns/:id/status
   * Transition return through 9 stages (Requested -> ... -> Refunded)
   */
  static async updateReturnStatus(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await ReturnService.updateReturnStatus(id, {
        ...req.body,
        adminName: req.admin?.name || 'Atelier Reverse Concierge',
      });
      return ApiResponse.success(res, `Return status updated to ${updated.status}`, updated);
    } catch (err) {
      next(err);
    }
  }
}
