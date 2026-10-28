import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { AdminProductService } from '../../services/adminProduct.service.js';
import { requireAdminPermission } from '../../middleware/adminGuard.js';

const router = Router();

// GET /api/admin/products - List products with search & filters
router.get('/', async (req, res, next) => {
  try {
    const result = await AdminProductService.getProducts(req.query);
    return ApiResponse.success(res, 'Admin products list', result);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products - Create new master product with variants & SEO
router.post('/', requireAdminPermission('products:write'), async (req, res, next) => {
  try {
    const created = await AdminProductService.createProduct(
      req.body,
      req.admin?.name || 'Super Admin'
    );
    return ApiResponse.success(res, 'Product created successfully', created, 201);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/products/:id - Single product detail
router.get('/:id', async (req, res, next) => {
  try {
    const product = await AdminProductService.getProductById(req.params.id);
    return ApiResponse.success(res, 'Product detail retrieved', product);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/products/:id - Update product
router.put('/:id', requireAdminPermission('products:write'), async (req, res, next) => {
  try {
    const updated = await AdminProductService.updateProduct(
      req.params.id,
      req.body,
      req.admin?.name || 'Super Admin'
    );
    return ApiResponse.success(res, `Product ${req.params.id} updated successfully`, updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/products/:id/status - Toggle status (active, draft, archived)
router.patch('/:id/status', requireAdminPermission('products:write'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await AdminProductService.toggleProductStatus(req.params.id, status);
    return ApiResponse.success(res, `Product status updated to ${status}`, updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/products/:id - Archive product
router.delete('/:id', requireAdminPermission('products:delete'), async (req, res, next) => {
  try {
    const archived = await AdminProductService.archiveProduct(req.params.id);
    return ApiResponse.success(res, `Product ${req.params.id} archived`, archived);
  } catch (err) {
    next(err);
  }
});

export default router;
