import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';

const router = Router();

const mockAuditLogs = [
  { id: 'LOG-901', action: 'STATUS_UPDATE', entity: 'Order ORD-9820', actor: 'Aarav Desai (Order Manager)', ip: '103.21.54.12', timestamp: '2026-09-23 09:30:15' },
  { id: 'LOG-900', action: 'STOCK_ADJUSTMENT', entity: 'SKU UC-TRS-002 (+50)', actor: 'System / Inward PO-2026-88', ip: '10.0.4.12', timestamp: '2026-09-22 14:30:00' },
  { id: 'LOG-899', action: 'PRICE_UPDATE', entity: 'Product UC-JKT-001 (₹8990)', actor: 'Kabir Singhania (Product Manager)', ip: '49.36.12.8', timestamp: '2026-09-22 11:15:20' },
];

router.get('/', (req, res) => {
  return ApiResponse.success(res, 'Audit logs retrieved', mockAuditLogs);
});

export default router;
