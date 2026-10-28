import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from '../../middleware/validate.js';

const router = Router();

// /api/auth/register
router.post('/register', authLimiter, validateRegistration, AuthController.register);

// /api/auth/login
router.post('/login', authLimiter, validateLogin, AuthController.login);

// /api/auth/logout
router.post('/logout', AuthController.logout);

// /api/auth/refresh
router.post('/refresh', AuthController.refresh);

// /api/auth/verify-email
router.get('/verify-email', AuthController.verifyEmail);
router.post('/verify-email', AuthController.verifyEmail);

// /api/auth/forgot-password
router.post(
  '/forgot-password',
  authLimiter,
  validateForgotPassword,
  AuthController.forgotPassword
);

// /api/auth/reset-password
router.post(
  '/reset-password',
  authLimiter,
  validateResetPassword,
  AuthController.resetPassword
);

export default router;
