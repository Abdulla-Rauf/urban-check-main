import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { MarketingService } from '../../services/marketing.service.js';

const router = Router();

// GET /api/admin/offers - List all promotional offers
router.get('/', async (req, res, next) => {
  try {
    const offers = await MarketingService.getAllOffers();
    return ApiResponse.success(res, 'Admin promotional offers retrieved', offers);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/offers - Create new offer
router.post('/', async (req, res, next) => {
  try {
    const offer = await MarketingService.createOffer(req.body);
    return ApiResponse.success(res, 'Promotional offer created', offer, 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/offers/:id - Update offer
router.patch('/:id', async (req, res, next) => {
  try {
    const offer = await MarketingService.updateOffer(req.params.id, req.body);
    return ApiResponse.success(res, 'Promotional offer updated', offer);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/offers/:id - Delete offer
router.delete('/:id', async (req, res, next) => {
  try {
    await MarketingService.deleteOffer(req.params.id);
    return ApiResponse.success(res, 'Promotional offer deleted');
  } catch (err) {
    next(err);
  }
});

export default router;
