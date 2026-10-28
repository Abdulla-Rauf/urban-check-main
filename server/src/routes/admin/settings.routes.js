import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';

const router = Router();

const mockSettings = {
  storeName: 'Urban Check',
  supportEmail: 'concierge@urbancheck.com',
  currency: 'INR',
  currencySymbol: '₹',
  taxRate: 12, // 12% GST standard apparel
  freeShippingThreshold: 2500,
  defaultCourier: 'DTDC',
  maintenanceMode: false,
  domains: {
    client: 'https://urbancheck.com',
    admin: 'https://admin.urbancheck.com',
    api: 'https://api.urbancheck.com',
  },
};

router.get('/', (req, res) => {
  return ApiResponse.success(res, 'Store settings retrieved', mockSettings);
});

router.put('/', (req, res) => {
  return ApiResponse.success(res, 'Settings updated successfully', req.body);
});

export default router;
