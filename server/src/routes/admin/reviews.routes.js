import { Router } from 'express';
import { ReviewController } from '../../controllers/review.controller.js';

const router = Router();

// GET /api/admin/reviews - Paginated review moderation queue
router.get('/', ReviewController.getAdminReviews);

// PATCH /api/admin/reviews/:id/status - Approve or Hide review
router.patch('/:id/status', ReviewController.updateReviewStatus);

// DELETE /api/admin/reviews/:id - Delete review
router.delete('/:id', ReviewController.deleteReview);

export default router;
