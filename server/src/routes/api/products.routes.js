import { Router } from 'express';
import { ProductController } from '../../controllers/product.controller.js';
import { requireCustomerAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

// Public Catalog Endpoints
router.get('/', ProductController.getProducts);
router.get('/popular', ProductController.getPopularProducts);
router.get('/trending', ProductController.getTrendingProducts);
router.get('/search/suggestions', ProductController.getSearchSuggestions);
router.get('/homepage', ProductController.getHomepageData);
router.get('/:slug', ProductController.getProductBySlug);

// Admin-Protected CRUD Endpoints
router.post(
  '/',
  requireCustomerAuth,
  requireRole('admin', 'super_admin'),
  ProductController.createProduct
);

router.patch(
  '/:id',
  requireCustomerAuth,
  requireRole('admin', 'super_admin'),
  ProductController.updateProduct
);

router.delete(
  '/:id',
  requireCustomerAuth,
  requireRole('admin', 'super_admin'),
  ProductController.deleteProduct
);

export default router;
