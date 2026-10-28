import { BrandService } from '../services/brand.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class BrandController {
  /**
   * GET /api/brands
   */
  static async getBrands(req, res, next) {
    try {
      const brands = await BrandService.getAllBrands();
      return ApiResponse.success(res, 'Brands retrieved', brands);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/brands/:slug
   */
  static async getBrandBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const brand = await BrandService.getBrandBySlug(slug);
      if (!brand) {
        return ApiResponse.error(res, 'Brand label not found.', 404);
      }
      return ApiResponse.success(res, 'Brand details retrieved', brand);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/brands (Admin only)
   */
  static async createBrand(req, res, next) {
    try {
      const brand = await BrandService.createBrand(req.body);
      return ApiResponse.success(res, 'Brand created successfully', brand, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/brands/:id (Admin only)
   */
  static async updateBrand(req, res, next) {
    try {
      const { id } = req.params;
      const brand = await BrandService.updateBrand(id, req.body);
      return ApiResponse.success(res, 'Brand updated successfully', brand);
    } catch (error) {
      next(error);
    }
  }
}
