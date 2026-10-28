import { ApiResponse } from '../utils/apiResponse.js';

export class UserController {
  /**
   * GET /api/users/me
   */
  static async getMe(req, res) {
    return ApiResponse.success(res, 'Current user profile retrieved.', {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        isVerified: req.user.isVerified,
        createdAt: req.user.createdAt,
      },
    });
  }

  /**
   * PUT /api/users/me
   */
  static async updateMe(req, res, next) {
    try {
      const { name, phone } = req.body;
      const user = req.user;

      if (name && typeof name === 'string' && name.trim().length >= 2) {
        user.name = name.trim();
      }

      if (phone && typeof phone === 'string' && phone.trim().length >= 7) {
        user.phone = phone.trim();
      }

      await user.save();

      return ApiResponse.success(res, 'Profile updated successfully.', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
