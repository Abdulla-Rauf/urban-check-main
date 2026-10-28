import { Router } from 'express';
import { BrandController } from '../../controllers/brand.controller.js';
import { requireCustomerAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

// Public Brands
router.get('/', BrandController.getBrands);
router.get('/:slug', BrandController.getBrandBySlug);

// Admin-Protected CRUD
router.post(
  '/',
  requireCustomerAuth,
  requireRole('admin', 'super_admin'),
  BrandController.createBrand
);

router.patch(
  '/:id',
  requireCustomerAuth,
  requireRole('admin', 'super_admin'),
  BrandController.updateBrand
);

export default router;
