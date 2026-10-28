import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { CouponService } from '../../services/coupon.service.js';

const router = Router();

// GET /api/admin/coupons - List all coupons
router.get('/', async (req, res, next) => {
  try {
    const coupons = await CouponService.getCoupons(req.query);
    return ApiResponse.success(res, 'Admin coupons retrieved', coupons);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/coupons - Create new coupon
router.post('/', async (req, res, next) => {
  try {
    const coupon = await CouponService.createCoupon(req.body);
    return ApiResponse.success(res, 'Coupon created successfully', coupon, 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/coupons/:id - Update coupon
router.patch('/:id', async (req, res, next) => {
  try {
    const coupon = await CouponService.updateCoupon(req.params.id, req.body);
    return ApiResponse.success(res, 'Coupon updated successfully', coupon);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/coupons/:id - Delete coupon
router.delete('/:id', async (req, res, next) => {
  try {
    await CouponService.deleteCoupon(req.params.id);
    return ApiResponse.success(res, 'Coupon deleted successfully');
  } catch (err) {
    next(err);
  }
});

export default router;
