import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { AdminDashboardService } from '../../services/adminDashboard.service.js';

const router = Router();

// GET /api/admin/dashboard - Combined telemetry or primary metrics
router.get('/', async (req, res, next) => {
  try {
    const [metrics, revenueAnalytics, recentOrders] = await Promise.all([
      AdminDashboardService.getMetrics(),
      AdminDashboardService.getRevenueAnalytics({ period: req.query.period || 'monthly' }),
      AdminDashboardService.getRecentOrders(5),
    ]);

    return ApiResponse.success(res, 'Admin dashboard metrics retrieved', {
      metrics,
      revenueAnalytics,
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/dashboard/metrics - 8 Real KPI Cards
router.get('/metrics', async (req, res, next) => {
  try {
    const metrics = await AdminDashboardService.getMetrics();
    return ApiResponse.success(res, 'KPI metrics retrieved', metrics);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/dashboard/revenue - Daily, Weekly, Monthly, Yearly revenue charts with date filter
router.get('/revenue', async (req, res, next) => {
  try {
    const { period, startDate, endDate } = req.query;
    const analytics = await AdminDashboardService.getRevenueAnalytics({
      period,
      startDate,
      endDate,
    });
    return ApiResponse.success(res, 'Revenue analytics retrieved', analytics);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/dashboard/recent-orders
router.get('/recent-orders', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const orders = await AdminDashboardService.getRecentOrders(limit);
    return ApiResponse.success(res, 'Recent orders retrieved', orders);
  } catch (err) {
    next(err);
  }
});

export default router;
