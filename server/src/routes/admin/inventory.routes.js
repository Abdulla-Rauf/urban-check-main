import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { AdminInventoryService } from '../../services/adminInventory.service.js';

const router = Router();

// GET /api/admin/inventory/summary - KPI Cards (Total Stock, Low Stock, Out of Stock, Reserved, Sold, Returned)
router.get('/summary', async (req, res, next) => {
  try {
    const summary = await AdminInventoryService.getSummary();
    return ApiResponse.success(res, 'Inventory summary retrieved', summary);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/inventory - SKU Variant inventory items listing
router.get('/', async (req, res, next) => {
  try {
    const [itemsResult, summary] = await Promise.all([
      AdminInventoryService.getInventoryItems(req.query),
      AdminInventoryService.getSummary(),
    ]);

    return ApiResponse.success(res, 'Inventory items retrieved', {
      ...itemsResult,
      summary,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/inventory/ledger - Movement audit ledger
router.get('/ledger', async (req, res, next) => {
  try {
    const ledger = await AdminInventoryService.getLedger(req.query);
    return ApiResponse.success(res, 'Inventory movement ledger retrieved', ledger);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/inventory/adjust - Manual stock adjustment
router.post('/adjust', async (req, res, next) => {
  try {
    const result = await AdminInventoryService.adjustStock({
      ...req.body,
      adminName: req.admin?.name || 'Super Admin',
    });
    return ApiResponse.success(res, 'Inventory adjusted successfully', result);
  } catch (err) {
    next(err);
  }
});

export default router;
