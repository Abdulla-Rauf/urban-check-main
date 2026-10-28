import { Router } from 'express';
import { CategoryController } from '../../controllers/category.controller.js';
import { requireCustomerAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

// Public Categories
router.get('/', CategoryController.getCategories);

// Admin-Protected CRUD
router.post(
  '/',
  requireCustomerAuth,
  requireRole('admin', 'super_admin'),
  CategoryController.createCategory
);

router.patch(
  '/:id',
  requireCustomerAuth,
  requireRole('admin', 'super_admin'),
  CategoryController.updateCategory
);

export default router;
