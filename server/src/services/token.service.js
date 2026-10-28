import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';

export class TokenService {
  /**
   * Generates a short-lived access token for customer users
   */
  static generateAccessToken(user) {
    const payload = {
      id: user._id || user.id,
      email: user.email,
      role: user.role || 'customer',
      type: 'access',
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn || '15m',
    });
  }

  /**
   * Generates a long-lived refresh token for customer users
   */
  static generateRefreshToken(user) {
    const payload = {
      id: user._id || user.id,
      type: 'refresh',
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn || '7d',
    });
  }

  /**
   * Generates an access token for admin users
   */
  static generateAdminToken(admin) {
    const payload = {
      id: admin._id || admin.id,
      email: admin.email,
      role: 'admin',
      type: 'admin_access',
    };

    return jwt.sign(payload, config.jwt.adminSecret, {
      expiresIn: config.jwt.adminExpiresIn || '1d',
    });
  }

  /**
   * Verifies customer access token
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch {
      return null;
    }
  }

  /**
   * Verifies customer refresh token
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwt.refreshSecret);
    } catch {
      return null;
    }
  }

  /**
   * SHA-256 hash for raw verification or reset tokens
   */
  static hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Cookie options for storing refresh token securely
   */
  static getRefreshTokenCookieOptions() {
    const isProduction = config.nodeEnv === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    };
  }
}
