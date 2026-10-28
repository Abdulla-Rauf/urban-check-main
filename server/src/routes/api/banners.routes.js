import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { MarketingService } from '../../services/marketing.service.js';

const router = Router();

// GET /api/banners and /api/banners/active - Public dynamic active banners for customer homepage
router.get('/', async (req, res, next) => {
  try {
    const banners = await MarketingService.getActiveBanners();
    return ApiResponse.success(res, 'Active marketing banners retrieved', banners);
  } catch (err) {
    next(err);
  }
});

router.get('/active', async (req, res, next) => {
  try {
    const banners = await MarketingService.getActiveBanners();
    return ApiResponse.success(res, 'Active marketing banners retrieved', banners);
  } catch (err) {
    next(err);
  }
});

export default router;
