import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { MarketingService } from '../../services/marketing.service.js';

const router = Router();

// GET /api/offers and /api/offers/active - Public dynamic active offers
router.get('/', async (req, res, next) => {
  try {
    const offers = await MarketingService.getActiveOffers();
    return ApiResponse.success(res, 'Active promotional offers retrieved', offers);
  } catch (err) {
    next(err);
  }
});

router.get('/active', async (req, res, next) => {
  try {
    const offers = await MarketingService.getActiveOffers();
    return ApiResponse.success(res, 'Active promotional offers retrieved', offers);
  } catch (err) {
    next(err);
  }
});

export default router;
