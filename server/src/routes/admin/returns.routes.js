import { Router } from 'express';
import { ReturnController } from '../../controllers/return.controller.js';

const router = Router();

// GET /api/admin/returns - Paginated returns listing with status filter
router.get('/', ReturnController.getAdminReturns);

// GET /api/admin/returns/validate-exchange - Check exchange size availability
router.get('/validate-exchange', ReturnController.validateExchange);

// PATCH /api/admin/returns/:id/status - Transition return lifecycle status
router.patch('/:id/status', ReturnController.updateReturnStatus);

export default router;
