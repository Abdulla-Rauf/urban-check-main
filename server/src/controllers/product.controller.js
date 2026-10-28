import { ProductService } from '../services/product.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class ProductController {
  /**
   * GET /api/products
   * Server-side filtering, sorting, multi-field search, pagination, and caching
   */
  static async getProducts(req, res, next) {
    try {
      const data = await ProductService.getProducts(req.query);
      return ApiResponse.success(res, 'Products catalog retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/popular
   */
  static async getPopularProducts(req, res, next) {
    try {
      const { limit } = req.query;
      const data = await ProductService.getPopularProducts(limit);
      return ApiResponse.success(res, 'Popular curated products retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/trending
   */
  static async getTrendingProducts(req, res, next) {
    try {
      const { limit } = req.query;
      const data = await ProductService.getTrendingProducts(limit);
      return ApiResponse.success(res, 'Trending products retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/search/suggestions
   */
  static async getSearchSuggestions(req, res, next) {
    try {
      const { q, limit } = req.query;
      const data = await ProductService.getSearchSuggestions(q, limit);
      return ApiResponse.success(res, 'Search suggestions retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/homepage
   */
  static async getHomepageData(req, res, next) {
    try {
      const data = await ProductService.getHomepageData();
      return ApiResponse.success(res, 'Homepage curated experience retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:slug
   */
  static async getProductBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const product = await ProductService.getProductBySlug(slug);

      if (!product) {
        return ApiResponse.error(res, 'Garment not found in atelier catalog.', 404);
      }

      return ApiResponse.success(res, 'Product details retrieved', product);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products (Admin only)
   */
  static async createProduct(req, res, next) {
    try {
      const product = await ProductService.createProduct(req.body);
      return ApiResponse.success(res, 'Product created successfully', product, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/products/:id (Admin only)
   */
  static async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await ProductService.updateProduct(id, req.body);
      return ApiResponse.success(res, 'Product updated successfully', product);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id (Admin only)
   */
  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const result = await ProductService.deleteProduct(id);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}
