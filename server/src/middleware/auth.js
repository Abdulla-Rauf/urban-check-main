import { ApiResponse } from '../utils/apiResponse.js';
import { TokenService } from '../services/token.service.js';
import { User } from '../models/User.js';
import { Admin } from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

/**
 * Customer authentication middleware
 * Validates Bearer access token and loads authenticated user context
 */
export const requireCustomerAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.error(res, 'Authentication required: Missing access token.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return ApiResponse.error(res, 'Invalid authorization format.', 401);
    }

    const decoded = TokenService.verifyAccessToken(token);
    if (!decoded || !decoded.id) {
      return ApiResponse.error(res, 'Session expired or invalid token. Please refresh or sign in.', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return ApiResponse.error(res, 'User account no longer exists.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Authentication verification failed.', 401);
  }
};

/**
 * Optional customer authentication
 * Allows guest users to proceed, but identifies them if a valid token is provided
 */
export const optionalCustomerAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = TokenService.verifyAccessToken(token);
      if (decoded?.id) {
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
        }
      }
    }
  } catch {
    // Proceed silently as guest
  }
  next();
};

/**
 * Admin authentication middleware
 */
export const requireAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.error(res, 'Administrator credentials required.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.adminSecret);

    if (!decoded || !decoded.id) {
      return ApiResponse.error(res, 'Invalid administrator token.', 401);
    }

    const admin = await Admin.findById(decoded.id).populate('roles permissions');
    if (!admin || !admin.isActive) {
      return ApiResponse.error(res, 'Administrator access disabled or not found.', 403);
    }

    req.admin = admin;
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Administrator authentication failed.', 401);
  }
};
