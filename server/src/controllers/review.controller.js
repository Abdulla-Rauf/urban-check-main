import { ReviewService } from '../services/review.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class ReviewController {
  /**
   * POST /api/reviews
   * Verified customer review submission
   */
  static async submitReview(req, res, next) {
    try {
      const review = await ReviewService.createReview(req.user.id, req.body);
      return ApiResponse.success(res, 'Appraisal submitted successfully', review, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/reviews/product/:idOrSlug
   * Public list of approved reviews for product
   */
  static async getProductReviews(req, res, next) {
    try {
      const { idOrSlug } = req.params;
      const { page, limit } = req.query;
      const data = await ReviewService.getProductReviews(idOrSlug, { page, limit });
      return ApiResponse.success(res, 'Product appraisals retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/reviews/can-review/:productId
   * Verified purchase eligibility check
   */
  static async checkCanReview(req, res, next) {
    try {
      const { productId } = req.params;
      const result = await ReviewService.canUserReview(req.user.id, productId);
      return ApiResponse.success(res, 'Review eligibility evaluated', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/reviews/my-reviews
   * Customer's submitted reviews
   */
  static async getMyReviews(req, res, next) {
    try {
      const reviews = await ReviewService.getCustomerReviews(req.user.id);
      return ApiResponse.success(res, 'Customer appraisals retrieved', reviews);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/reviews
   * Admin paginated moderation queue
   */
  static async getAdminReviews(req, res, next) {
    try {
      const data = await ReviewService.getAdminReviews(req.query);
      return ApiResponse.success(res, 'Admin reviews retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/reviews/:id/status
   * Approve or Hide review
   */
  static async updateReviewStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, adminReply } = req.body;
      const updated = await ReviewService.updateReviewStatus(id, {
        status,
        adminReply,
        adminName: req.admin?.name || 'Concierge Moderator',
      });
      return ApiResponse.success(res, `Review status updated to ${updated.status}`, updated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/admin/reviews/:id
   * Admin delete review
   */
  static async deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      const result = await ReviewService.deleteReview(id);
      return ApiResponse.success(res, result.message, null);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/reviews/:id/helpful
   * Public: Upvote review helpfulness
   */
  static async voteHelpful(req, res, next) {
    try {
      const { id } = req.params;
      const result = await ReviewService.voteHelpful(id);
      return ApiResponse.success(res, 'Helpful vote registered', result);
    } catch (err) {
      next(err);
    }
  }
}

