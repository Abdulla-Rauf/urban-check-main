import { Router } from 'express';
import { RefundController } from '../../controllers/refund.controller.js';

const router = Router();

// GET /api/admin/refunds - Paginated refunds listing with status filter
router.get('/', RefundController.getRefunds);

// POST /api/admin/refunds/create - Create refund record
router.post('/create', RefundController.createRefund);

// POST /api/admin/refunds/process - Generic process route
router.post('/process', RefundController.processRefund);

// POST & PATCH /api/admin/refunds/:id/status - Update refund status & trigger Razorpay gateway
router.post('/:id/process', RefundController.processRefund);
router.patch('/:id/status', RefundController.processRefund);

export default router;
