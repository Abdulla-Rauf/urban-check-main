import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { MarketingService } from '../../services/marketing.service.js';

const router = Router();

// GET /api/admin/banners - List all banners
router.get('/', async (req, res, next) => {
  try {
    const banners = await MarketingService.getAllBanners();
    return ApiResponse.success(res, 'Marketing banners retrieved', banners);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/banners - Create new banner
router.post('/', async (req, res, next) => {
  try {
    const banner = await MarketingService.createBanner(req.body);
    return ApiResponse.success(res, 'Marketing banner created', banner, 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/banners/:id - Update banner
router.patch('/:id', async (req, res, next) => {
  try {
    const banner = await MarketingService.updateBanner(req.params.id, req.body);
    return ApiResponse.success(res, 'Marketing banner updated', banner);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/banners/:id - Delete banner
router.delete('/:id', async (req, res, next) => {
  try {
    await MarketingService.deleteBanner(req.params.id);
    return ApiResponse.success(res, 'Marketing banner deleted');
  } catch (err) {
    next(err);
  }
});

export default router;
