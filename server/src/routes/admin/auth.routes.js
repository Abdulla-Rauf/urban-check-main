import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { requireAdminAuth } from '../../middleware/adminGuard.js';
import { AdminAuthService } from '../../services/adminAuth.service.js';

const router = Router();

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password, role } = req.body || {};
    const result = await AdminAuthService.login({
      email,
      password,
      requestedRole: role,
    });
    return ApiResponse.success(res, 'Admin authentication successful', result);
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAdminAuth, (req, res) => {
  return ApiResponse.success(res, 'Current admin user session', req.admin);
});

router.post('/logout', requireAdminAuth, (req, res) => {
  return ApiResponse.success(res, 'Admin session terminated');
});

export default router;
