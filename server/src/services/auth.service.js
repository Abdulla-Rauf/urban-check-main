import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { TokenService } from './token.service.js';
import { EmailService } from './email.service.js';
import { config } from '../config/index.js';

export class AuthService {
  /**
   * Register a new client user
   */
  static async register({ name, email, phone, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const error = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }

    // Default customer role
    const customerRole = await Role.findOne({ name: 'customer' });

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role: 'customer',
      roleRef: customerRole?._id,
      isVerified: false,
    });

    // Generate email verification token
    const verificationToken = user.createVerificationToken();

    // Generate tokens
    const accessToken = TokenService.generateAccessToken(user);
    const refreshToken = TokenService.generateRefreshToken(user);

    user.refreshTokens = [
      {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ];

    await user.save();

    // Send verification email in background
    EmailService.sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verificationToken,
    }).catch((err) => console.error('Email dispatch error:', err));

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
      ...(config.nodeEnv !== 'production' ? { devVerificationToken: verificationToken } : {}),
    };
  }

  /**
   * Authenticate customer with email and password
   */
  static async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password +refreshTokens'
    );

    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // Generate token pair
    const accessToken = TokenService.generateAccessToken(user);
    const refreshToken = TokenService.generateRefreshToken(user);

    // Prune expired refresh tokens and add new one (limit to 5 devices)
    const validTokens = (user.refreshTokens || []).filter(
      (t) => t.expiresAt > new Date()
    );
    validTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    user.refreshTokens = validTokens.slice(-5);
    await user.save();

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Rotate and refresh access token using valid refresh token
   */
  static async refreshTokens(incomingRefreshToken) {
    if (!incomingRefreshToken) {
      const error = new Error('Refresh token is required.');
      error.statusCode = 401;
      throw error;
    }

    const decoded = TokenService.verifyRefreshToken(incomingRefreshToken);
    if (!decoded || !decoded.id) {
      const error = new Error('Invalid or expired refresh token.');
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) {
      const error = new Error('Account not found.');
      error.statusCode = 401;
      throw error;
    }

    // Check if refresh token exists in user's active tokens list
    const tokenExists = user.refreshTokens.some(
      (t) => t.token === incomingRefreshToken && t.expiresAt > new Date()
    );

    if (!tokenExists) {
      // Possible token reuse attack: clear all refresh tokens
      user.refreshTokens = [];
      await user.save();
      const error = new Error('Invalid session. Please sign in again.');
      error.statusCode = 401;
      throw error;
    }

    // Issue new token pair (rotation)
    const newAccessToken = TokenService.generateAccessToken(user);
    const newRefreshToken = TokenService.generateRefreshToken(user);

    // Replace the used token with the newly minted one
    user.refreshTokens = user.refreshTokens
      .filter((t) => t.token !== incomingRefreshToken && t.expiresAt > new Date())
      .concat({
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Log out user and revoke refresh token
   */
  static async logout(refreshToken) {
    if (!refreshToken) return;
    await User.updateOne(
      { 'refreshTokens.token': refreshToken },
      { $pull: { refreshTokens: { token: refreshToken } } }
    );
  }

  /**
   * Verify email address using token
   */
  static async verifyEmail(rawToken) {
    if (!rawToken) {
      const error = new Error('Verification token is required.');
      error.statusCode = 400;
      throw error;
    }

    const hashedToken = TokenService.hashToken(rawToken);

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: new Date() },
    }).select('+verificationToken +verificationTokenExpires');

    if (!user) {
      const error = new Error('Invalid or expired verification token.');
      error.statusCode = 400;
      throw error;
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return {
      message: 'Email verified successfully. Your atelier account is now fully active.',
    };
  }

  /**
   * Initiate forgot password flow
   */
  static async forgotPassword(email) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+resetPasswordToken +resetPasswordExpires'
    );

    // Always return success message to prevent user enumeration
    if (!user) {
      return {
        message: 'If an account exists with this email address, a password reset link has been dispatched.',
      };
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    EmailService.sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token: resetToken,
    }).catch((err) => console.error('Password reset dispatch error:', err));

    return {
      message: 'If an account exists with this email address, a password reset link has been dispatched.',
      ...(config.nodeEnv !== 'production' ? { devResetToken: resetToken } : {}),
    };
  }

  /**
   * Reset password using token
   */
  static async resetPassword({ token, newPassword }) {
    if (!token || !newPassword) {
      const error = new Error('Reset token and new password are required.');
      error.statusCode = 400;
      throw error;
    }

    const hashedToken = TokenService.hashToken(token);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+password +resetPasswordToken +resetPasswordExpires +refreshTokens');

    if (!user) {
      const error = new Error('Password reset token is invalid or has expired.');
      error.statusCode = 400;
      throw error;
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    // Invalidate existing sessions for security
    user.refreshTokens = [];
    await user.save();

    return {
      message: 'Your password has been securely reset. Please sign in with your new credentials.',
    };
  }
}
