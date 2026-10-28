import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../../utils/apiResponse.js';
import { CouponService } from '../../services/coupon.service.js';
import { config } from '../../config/index.js';

const router = Router();

// Helper to optionally resolve user if bearer token is present
const resolveOptionalUserId = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret || 'urbanch_jwt_secret_dev_2026');
      return decoded.id || decoded.userId || null;
    }
  } catch {
    // Ignore invalid/expired token for optional resolution
  }
  return null;
};

// POST /api/coupons/validate - Validates coupon against cart items and server rules
router.post('/validate', async (req, res) => {
  try {
    const { couponCode, cartItems = [], subtotal = 0 } = req.body;
    const userId = resolveOptionalUserId(req);

    const result = await CouponService.validateCoupon({
      couponCode,
      cartItems,
      subtotal: Number(subtotal) || 0,
      userId,
    });

    return ApiResponse.success(res, result.message, result);
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
});

export default router;
