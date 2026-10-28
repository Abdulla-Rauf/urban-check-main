import { Router } from 'express';
import { ApiResponse } from '../utils/apiResponse.js';
import apiRoutes from './api/index.js';
import adminRoutes from './admin/index.js';

const router = Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  return ApiResponse.success(res, 'Urban Check API service operational', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      server: 'online',
      database: 'ready',
      cache: 'ready',
    },
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount Customer APIs: /api/auth, /api/products, etc.
router.use('/', apiRoutes);

// Mount Admin APIs: /api/admin/dashboard, /api/admin/products, etc.
router.use('/admin', adminRoutes);

export default router;
