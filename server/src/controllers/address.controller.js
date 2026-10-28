import { AddressService } from '../services/address.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class AddressController {
  /**
   * GET /api/addresses
   * Retrieves user's saved dispatch locations
   */
  static async getAddresses(req, res, next) {
    try {
      const addresses = await AddressService.getUserAddresses(req.user.id);
      return ApiResponse.success(res, 'Addresses retrieved', addresses);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/addresses
   * Adds new dispatch location
   */
  static async createAddress(req, res, next) {
    try {
      const address = await AddressService.createAddress(req.user.id, req.body);
      return ApiResponse.success(res, 'Address saved successfully', address, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/addresses/:id
   * Updates an existing address
   */
  static async updateAddress(req, res, next) {
    try {
      const address = await AddressService.updateAddress(req.user.id, req.params.id, req.body);
      return ApiResponse.success(res, 'Address updated successfully', address);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/addresses/:id
   * Removes an address
   */
  static async deleteAddress(req, res, next) {
    try {
      const result = await AddressService.deleteAddress(req.user.id, req.params.id);
      return ApiResponse.success(res, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/addresses/:id/default
   * Sets address as primary default
   */
  static async setDefault(req, res, next) {
    try {
      const address = await AddressService.setDefaultAddress(req.user.id, req.params.id);
      return ApiResponse.success(res, 'Default address updated', address);
    } catch (err) {
      next(err);
    }
  }
}
