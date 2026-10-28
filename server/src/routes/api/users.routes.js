import { Router } from 'express';
import { UserController } from '../../controllers/user.controller.js';
import { RecentlyViewedController } from '../../controllers/recentlyViewed.controller.js';
import { requireCustomerAuth } from '../../middleware/auth.js';

const router = Router();

// /api/users/me
router.get('/me', requireCustomerAuth, UserController.getMe);
router.put('/me', requireCustomerAuth, UserController.updateMe);

// /api/users/recently-viewed
router.get('/recently-viewed', requireCustomerAuth, RecentlyViewedController.getRecentlyViewed);
router.post('/recently-viewed', requireCustomerAuth, RecentlyViewedController.recordView);
router.post('/recently-viewed/sync', requireCustomerAuth, RecentlyViewedController.syncRecentlyViewed);

export default router;
