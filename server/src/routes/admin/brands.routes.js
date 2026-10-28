import { Router } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../../utils/apiResponse.js';
import { BrandService } from '../../services/brand.service.js';
import { Brand } from '../../models/Brand.js';
import { Product } from '../../models/Product.js';
import { localStore } from '../../utils/localStore.js';

const router = Router();

// GET /api/admin/brands - List all brands with product counts
router.get('/', async (req, res, next) => {
  try {
    let brands = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        brands = await Brand.find().sort({ name: 1 }).lean();
      } catch (err) {
        console.warn('MongoDB admin brands query fallback:', err.message);
      }
    }

    if (!brands) {
      brands = localStore.getCollection('brands');
    }

    const localProducts = localStore.getCollection('products');
    const enriched = await Promise.all(
      brands.map(async (b) => {
        let count = 0;
        const brandId = (b._id || b.id || '').toString();

        if (mongoose.connection && mongoose.connection.readyState === 1) {
          try {
            count = await Product.countDocuments({
              brand: b._id,
              status: { $ne: 'archived' },
            });
          } catch {
            count = localProducts.filter((p) => p.brand === brandId || p.brandId === brandId).length;
          }
        } else {
          count = localProducts.filter((p) => p.brand === brandId || p.brandId === brandId).length;
        }

        return {
          id: brandId,
          _id: brandId,
          name: b.name,
          slug: b.slug,
          logo: b.logo || b.image || '',
          image: b.logo || b.image || '',
          description: b.description || '',
          origin: b.origin || 'Milan / India',
          productsCount: count,
          status: (b.status === 'active' || b.status === 'Active') ? 'Active' : 'Archived',
        };
      })
    );

    return ApiResponse.success(res, 'Admin brands retrieved', enriched);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/brands - Create brand and invalidate cache
router.post('/', async (req, res, next) => {
  try {
    const brand = await BrandService.createBrand(req.body);
    return ApiResponse.success(res, 'Brand created successfully', brand, 201);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/brands/:id - Update brand and invalidate cache
router.put('/:id', async (req, res, next) => {
  try {
    const brand = await BrandService.updateBrand(req.params.id, req.body);
    return ApiResponse.success(res, 'Brand updated successfully', brand);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/brands/:id - Update brand and invalidate cache
router.patch('/:id', async (req, res, next) => {
  try {
    const brand = await BrandService.updateBrand(req.params.id, req.body);
    return ApiResponse.success(res, 'Brand updated successfully', brand);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/brands/:id - Delete brand and invalidate cache
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await BrandService.deleteBrand(req.params.id);
    return ApiResponse.success(res, result.message);
  } catch (err) {
    next(err);
  }
});

export default router;
