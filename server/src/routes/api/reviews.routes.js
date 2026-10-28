import { Router } from 'express';
import { ReviewController } from '../../controllers/review.controller.js';
import { requireCustomerAuth } from '../../middleware/auth.js';

const router = Router();

// Public: Get approved reviews for a product
router.get('/product/:idOrSlug', ReviewController.getProductReviews);
router.post('/:id/helpful', ReviewController.voteHelpful);

// Customer-protected endpoints
router.get('/can-review/:productId', requireCustomerAuth, ReviewController.checkCanReview);
router.get('/my-reviews', requireCustomerAuth, ReviewController.getMyReviews);
router.post('/', requireCustomerAuth, ReviewController.submitReview);

export default router;
