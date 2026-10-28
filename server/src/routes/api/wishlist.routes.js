import { Router } from 'express';
import { WishlistController } from '../../controllers/wishlist.controller.js';
import { requireCustomerAuth } from '../../middleware/auth.js';

const router = Router();

router.use(requireCustomerAuth);

router.get('/', WishlistController.getWishlist);
router.post('/toggle', WishlistController.toggleWishlist);
router.delete('/:productId', WishlistController.removeFromWishlist);
router.post('/move-to-cart', WishlistController.moveToCart);
router.post('/sync', WishlistController.syncWishlist);

export default router;
