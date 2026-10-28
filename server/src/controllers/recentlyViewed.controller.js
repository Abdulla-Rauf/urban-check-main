import { RecentlyViewedService } from '../services/recentlyViewed.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class RecentlyViewedController {
  /**
   * GET /api/users/recently-viewed
   * Retrieves browsing history for authenticated patron
   */
  static async getRecentlyViewed(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 15;
      const items = await RecentlyViewedService.getRecentlyViewed(req.user.id, limit);
      return ApiResponse.success(res, 'Recently viewed garments retrieved', items);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/users/recently-viewed
   * Records garment view in user history
   */
  static async recordView(req, res, next) {
    try {
      const { productId, slug } = req.body;
      const result = await RecentlyViewedService.recordView(req.user.id, productId || slug);
      return ApiResponse.success(res, 'View recorded', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/users/recently-viewed/sync
   * Merges guest browsing history into user account
   */
  static async syncRecentlyViewed(req, res, next) {
    try {
      const { items } = req.body;
      const history = await RecentlyViewedService.syncRecentlyViewed(req.user.id, items);
      return ApiResponse.success(res, 'Browsing history synchronized', history);
    } catch (err) {
      next(err);
    }
  }
}
