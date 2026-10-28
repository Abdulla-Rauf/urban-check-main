import { Router } from 'express';
import { OrderController } from '../../controllers/order.controller.js';
import { ShippingController } from '../../controllers/shipping.controller.js';
import { requireCustomerAuth } from '../../middleware/auth.js';
import { checkoutLimiter, paymentLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Public tracking lookup (e.g. for guest patrons or order number / AWB lookup)
router.get('/track/:identifier', ShippingController.getTracking);

// Customer-protected order management
router.use(requireCustomerAuth);

router.post('/checkout', checkoutLimiter, OrderController.checkout);
router.post('/:identifier/verify-payment', paymentLimiter, OrderController.verifyPayment);
router.get('/', OrderController.getOrders);
router.get('/:identifier', OrderController.getOrder);
router.get('/:identifier/tracking', ShippingController.getTracking);
router.post('/:identifier/cancel', OrderController.cancelOrder);

export default router;
