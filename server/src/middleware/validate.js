import validator from 'validator';
import { ApiResponse } from '../utils/apiResponse.js';

export const validateRegistration = (req, res, next) => {
  const { name, email, phone, password } = req.body || {};
  const errors = {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters long.';
  }

  if (!email || typeof email !== 'string' || !validator.isEmail(email)) {
    errors.email = 'A valid email address is required.';
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
    errors.phone = 'A valid contact phone number is required.';
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Password must contain both letters and at least one number.';
  }

  if (Object.keys(errors).length > 0) {
    return ApiResponse.error(res, 'Validation failed: Please verify required fields.', 422, errors);
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = {};

  if (!email || !validator.isEmail(email)) {
    errors.email = 'A valid email address is required.';
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    return ApiResponse.error(res, 'Validation failed: Missing or invalid credentials.', 422, errors);
  }

  next();
};

export const validateForgotPassword = (req, res, next) => {
  const { email } = req.body || {};
  if (!email || !validator.isEmail(email)) {
    return ApiResponse.error(res, 'A valid email address is required.', 422, {
      email: 'A valid email address is required.',
    });
  }
  next();
};

export const validateResetPassword = (req, res, next) => {
  const { token, newPassword } = req.body || {};
  const errors = {};

  if (!token || typeof token !== 'string') {
    errors.token = 'Reset token is required.';
  }

  if (!newPassword || typeof newPassword !== 'string') {
    errors.newPassword = 'New password is required.';
  } else if (newPassword.length < 8) {
    errors.newPassword = 'New password must be at least 8 characters long.';
  } else if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    errors.newPassword = 'New password must contain both letters and at least one number.';
  }

  if (Object.keys(errors).length > 0) {
    return ApiResponse.error(res, 'Validation failed: Invalid reset payload.', 422, errors);
  }

  next();
};
