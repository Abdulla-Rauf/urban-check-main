import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';

const router = Router();

const mockRoles = [
  { id: 'ROL-1', name: 'Super Admin', description: 'Unrestricted master access to all platform systems', usersCount: 1, permissions: ['*'] },
  { id: 'ROL-2', name: 'Product Manager', description: 'Catalog, category, brand, and stock management', usersCount: 2, permissions: ['products:write', 'categories:write', 'inventory:read'] },
  { id: 'ROL-3', name: 'Order Manager', description: 'Order fulfillment, returns, refunds, customer support', usersCount: 3, permissions: ['orders:write', 'shipments:write', 'returns:write'] },
  { id: 'ROL-4', name: 'Inventory Manager', description: 'Stock ledger, warehouse inwards, threshold alerts', usersCount: 1, permissions: ['inventory:write', 'ledger:read'] },
  { id: 'ROL-5', name: 'Finance Manager', description: 'Transactions, revenue reports, financial reconciliation', usersCount: 1, permissions: ['finance:read', 'finance:export'] },
  { id: 'ROL-6', name: 'Content Manager', description: 'Homepage banners, promotional campaigns, editorial offers', usersCount: 1, permissions: ['marketing:write', 'banners:write'] },
];

router.get('/', (req, res) => {
  return ApiResponse.success(res, 'Admin roles retrieved', mockRoles);
});

export default router;
