import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import addressesRoutes from './addresses.routes.js';
import productsRoutes from './products.routes.js';
import categoriesRoutes from './categories.routes.js';
import brandsRoutes from './brands.routes.js';
import cartRoutes from './cart.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import ordersRoutes from './orders.routes.js';
import reviewsRoutes from './reviews.routes.js';
import returnsRoutes from './returns.routes.js';
import bannersRoutes from './banners.routes.js';
import offersRoutes from './offers.routes.js';
import couponsRoutes from './coupons.routes.js';
import { ProductController } from '../../controllers/product.controller.js';

const router = Router();

router.get('/homepage', ProductController.getHomepageData);
router.get('/search/suggestions', ProductController.getSearchSuggestions);

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/addresses', addressesRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/brands', brandsRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', ordersRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/returns', returnsRoutes);
router.use('/banners', bannersRoutes);
router.use('/offers', offersRoutes);
router.use('/coupons', couponsRoutes);

export default router;
