import { AuthService } from '../services/auth.service.js';
import { TokenService } from '../services/token.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class AuthController {
  /**
   * POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const { name, email, phone, password } = req.body;
      const result = await AuthService.register({ name, email, phone, password });

      // Set HTTP-only refresh cookie
      res.cookie(
        'refreshToken',
        result.refreshToken,
        TokenService.getRefreshTokenCookieOptions()
      );

      return ApiResponse.success(
        res,
        'Atelier membership registered. A verification notice has been sent to your email.',
        {
          user: result.user,
          accessToken: result.accessToken,
          ...(result.devVerificationToken
            ? { devVerificationToken: result.devVerificationToken }
            : {}),
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });

      // Set HTTP-only refresh cookie
      res.cookie(
        'refreshToken',
        result.refreshToken,
        TokenService.getRefreshTokenCookieOptions()
      );

      return ApiResponse.success(res, 'Authentication successful.', {
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  static async refresh(req, res, next) {
    try {
      const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

      const result = await AuthService.refreshTokens(incomingRefreshToken);

      // Rotate HTTP-only cookie
      res.cookie(
        'refreshToken',
        result.refreshToken,
        TokenService.getRefreshTokenCookieOptions()
      );

      return ApiResponse.success(res, 'Session token refreshed.', {
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(req, res, next) {
    try {
      const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

      await AuthService.logout(incomingRefreshToken);

      // Clear refresh cookie
      res.clearCookie('refreshToken', TokenService.getRefreshTokenCookieOptions());

      return ApiResponse.success(res, 'Successfully signed out of session.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET / POST /api/auth/verify-email
   */
  static async verifyEmail(req, res, next) {
    try {
      const token = req.query?.token || req.body?.token;
      const result = await AuthService.verifyEmail(token);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      return ApiResponse.success(res, result.message, {
        ...(result.devResetToken ? { devResetToken: result.devResetToken } : {}),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await AuthService.resetPassword({ token, newPassword });
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}
