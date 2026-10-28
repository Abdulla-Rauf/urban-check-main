import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { AdminOrderService } from '../../services/adminOrder.service.js';
import { requireAdminPermission } from '../../middleware/adminGuard.js';

const router = Router();

// GET /api/admin/orders - Paginated order listing with filters
router.get('/', async (req, res, next) => {
  try {
    const result = await AdminOrderService.getOrders(req.query);
    return ApiResponse.success(res, 'Admin orders retrieved', result);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders/:id - Single order details
router.get('/:id', async (req, res, next) => {
  try {
    const order = await AdminOrderService.getOrderById(req.params.id);
    return ApiResponse.success(res, 'Order details retrieved', order);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/orders/:id/status - Update order fulfillment, courier or payment status
router.patch('/:id/status', requireAdminPermission('orders:manage'), async (req, res, next) => {
  try {
    const updated = await AdminOrderService.updateOrderStatus(req.params.id, {
      ...req.body,
      adminName: req.admin?.name || 'Super Admin',
    });
    return ApiResponse.success(res, `Order ${req.params.id} updated successfully`, updated);
  } catch (err) {
    next(err);
  }
});

export default router;
