import { Router } from 'express';
import { CartController } from '../../controllers/cart.controller.js';
import { requireCustomerAuth } from '../../middleware/auth.js';

const router = Router();

// Public calculation endpoint for guest shopping bags
router.post('/calculate', CartController.calculateGuest);

// Authenticated patron routes
router.get('/', requireCustomerAuth, CartController.getCart);
router.post('/add', requireCustomerAuth, CartController.addItem);
router.put('/items/:itemId', requireCustomerAuth, CartController.updateQuantity);
router.delete('/items/:itemId', requireCustomerAuth, CartController.removeItem);
router.delete('/', requireCustomerAuth, CartController.clearCart);
router.post('/sync', requireCustomerAuth, CartController.syncCart);

export default router;
