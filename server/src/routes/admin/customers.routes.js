import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { AdminCustomerService } from '../../services/adminCustomer.service.js';

const router = Router();

// GET /api/admin/customers - List patrons with orders count and lifetime spend
router.get('/', async (req, res, next) => {
  try {
    const result = await AdminCustomerService.getCustomers(req.query);
    return ApiResponse.success(res, 'Customers list retrieved', result);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/customers/:id - Single customer profile & orders
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await AdminCustomerService.getCustomerById(req.params.id);
    return ApiResponse.success(res, 'Customer profile details', customer);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/customers/:id/status - Update active/blocked status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const updated = await AdminCustomerService.updateCustomerStatus(req.params.id, req.body);
    return ApiResponse.success(res, 'Customer status updated', updated);
  } catch (err) {
    next(err);
  }
});

export default router;
