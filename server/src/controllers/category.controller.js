import { CategoryService } from '../services/category.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class CategoryController {
  /**
   * GET /api/categories
   */
  static async getCategories(req, res, next) {
    try {
      const { tree } = req.query;
      const categories = tree === 'true'
        ? await CategoryService.getCategoryTree()
        : await CategoryService.getAllCategories();

      return ApiResponse.success(res, 'Categories retrieved', categories);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/categories (Admin only)
   */
  static async createCategory(req, res, next) {
    try {
      const category = await CategoryService.createCategory(req.body);
      return ApiResponse.success(res, 'Category created successfully', category, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/categories/:id (Admin only)
   */
  static async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const category = await CategoryService.updateCategory(id, req.body);
      return ApiResponse.success(res, 'Category updated successfully', category);
    } catch (error) {
      next(error);
    }
  }
}
