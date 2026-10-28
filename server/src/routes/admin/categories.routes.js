import { Router } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../../utils/apiResponse.js';
import { CategoryService } from '../../services/category.service.js';
import { Category } from '../../models/Category.js';
import { Product } from '../../models/Product.js';
import { localStore } from '../../utils/localStore.js';

const router = Router();

// GET /api/admin/categories - List all categories with product counts
router.get('/', async (req, res, next) => {
  try {
    let categories = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        categories = await Category.find().sort({ order: 1, name: 1 }).lean();
      } catch (err) {
        console.warn('MongoDB admin categories query fallback:', err.message);
      }
    }

    if (!categories) {
      categories = localStore.getCollection('categories');
    }
    
    // Enrich with actual product count per category
    const localProducts = localStore.getCollection('products');
    const enriched = await Promise.all(
      categories.map(async (cat) => {
        let count = 0;
        const catId = (cat._id || cat.id || '').toString();

        if (mongoose.connection && mongoose.connection.readyState === 1) {
          try {
            count = await Product.countDocuments({
              $or: [{ category: cat._id }, { categories: cat._id }],
              status: { $ne: 'archived' },
            });
          } catch {
            count = localProducts.filter((p) => p.category === catId || p.categoryId === catId).length;
          }
        } else {
          count = localProducts.filter((p) => p.category === catId || p.categoryId === catId).length;
        }

        return {
          id: catId,
          _id: catId,
          name: cat.name,
          slug: cat.slug,
          productsCount: count,
          order: cat.order || 0,
          status: (cat.status === 'active' || cat.status === 'Active') ? 'Active' : 'Inactive',
        };
      })
    );

    return ApiResponse.success(res, 'Admin categories retrieved', enriched);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/categories - Create category and invalidate cache
router.post('/', async (req, res, next) => {
  try {
    const category = await CategoryService.createCategory(req.body);
    return ApiResponse.success(res, 'Category created successfully', category, 201);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/categories/:id - Update category and invalidate cache
router.put('/:id', async (req, res, next) => {
  try {
    const category = await CategoryService.updateCategory(req.params.id, req.body);
    return ApiResponse.success(res, 'Category updated successfully', category);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/categories/:id - Update category and invalidate cache
router.patch('/:id', async (req, res, next) => {
  try {
    const category = await CategoryService.updateCategory(req.params.id, req.body);
    return ApiResponse.success(res, 'Category updated successfully', category);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/categories/:id - Delete category and invalidate cache
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await CategoryService.deleteCategory(req.params.id);
    return ApiResponse.success(res, result.message);
  } catch (err) {
    next(err);
  }
});

export default router;

