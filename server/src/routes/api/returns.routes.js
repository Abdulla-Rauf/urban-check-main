import { Router } from 'express';
import { ReturnController } from '../../controllers/return.controller.js';
import { requireCustomerAuth } from '../../middleware/auth.js';

const router = Router();

// Validate exchange size availability
router.get('/validate-exchange', ReturnController.validateExchange);

// Customer-protected return operations
router.use(requireCustomerAuth);

router.get('/', ReturnController.getMyReturns);
router.post('/request', ReturnController.submitReturn);
router.get('/:id', ReturnController.getReturnDetails);

export default router;
