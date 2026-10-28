import { Router } from 'express';
import { requireAdminAuth } from '../../middleware/adminGuard.js';

import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import productsRoutes from './products.routes.js';
import categoriesRoutes from './categories.routes.js';
import brandsRoutes from './brands.routes.js';
import ordersRoutes from './orders.routes.js';
import inventoryRoutes from './inventory.routes.js';
import customersRoutes from './customers.routes.js';
import bannersRoutes from './banners.routes.js';
import offersRoutes from './offers.routes.js';
import couponsRoutes from './coupons.routes.js';
import returnsRoutes from './returns.routes.js';
import refundsRoutes from './refunds.routes.js';
import shippingRoutes from './shipping.routes.js';
import reviewsRoutes from './reviews.routes.js';
import analyticsRoutes from './analytics.routes.js';
import financeRoutes from './finance.routes.js';
import usersRoutes from './users.routes.js';
import rolesRoutes from './roles.routes.js';
import auditLogsRoutes from './auditLogs.routes.js';
import settingsRoutes from './settings.routes.js';

const router = Router();

// Public admin authentication endpoint (login)
router.use('/auth', authRoutes);

// Protected Admin Route Groups — Verifies: Authentication + Role + Permission
router.use('/dashboard', requireAdminAuth('dashboard:read'), dashboardRoutes);
router.use('/products', requireAdminAuth('products:read'), productsRoutes);
router.use('/categories', requireAdminAuth('categories:manage'), categoriesRoutes);
router.use('/brands', requireAdminAuth('brands:manage'), brandsRoutes);
router.use('/orders', requireAdminAuth('orders:read'), ordersRoutes);
router.use('/inventory', requireAdminAuth('inventory:manage'), inventoryRoutes);
router.use('/customers', requireAdminAuth('users:read'), customersRoutes);
router.use('/banners', requireAdminAuth('marketing:manage'), bannersRoutes);
router.use('/offers', requireAdminAuth('marketing:manage'), offersRoutes);
router.use('/coupons', requireAdminAuth('marketing:manage'), couponsRoutes);
router.use('/returns', requireAdminAuth('returns:manage'), returnsRoutes);
router.use('/refunds', requireAdminAuth('finance:manage'), refundsRoutes);
router.use('/shipping', requireAdminAuth('shipping:manage'), shippingRoutes);
router.use('/reviews', requireAdminAuth('reviews:manage'), reviewsRoutes);
router.use('/analytics', requireAdminAuth('analytics:read'), analyticsRoutes);
router.use('/finance', requireAdminAuth('finance:read'), financeRoutes);
router.use('/users', requireAdminAuth('users:manage'), usersRoutes);
router.use('/roles', requireAdminAuth('roles:manage'), rolesRoutes);
router.use('/audit-logs', requireAdminAuth('audit:read'), auditLogsRoutes);
router.use('/settings', requireAdminAuth('settings:manage'), settingsRoutes);

export default router;
