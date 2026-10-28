import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';

// Helper for code-splitting named exports
const lazyNamed = (importer, name) =>
  lazy(() => importer().then((mod) => ({ default: mod[name] })));

const AdminLoginPage = lazyNamed(() => import('../pages/AdminLoginPage'), 'AdminLoginPage');
const DashboardPage = lazyNamed(() => import('../pages/DashboardPage'), 'DashboardPage');

const ProductsPage = lazyNamed(() => import('../pages/ProductsPage'), 'ProductsPage');
const ProductCreatePage = lazyNamed(() => import('../pages/ProductCreatePage'), 'ProductCreatePage');
const ProductEditPage = lazyNamed(() => import('../pages/ProductEditPage'), 'ProductEditPage');

const CategoriesAdminPage = lazyNamed(() => import('../pages/CategoriesAdminPage'), 'CategoriesAdminPage');
const BrandsAdminPage = lazyNamed(() => import('../pages/BrandsAdminPage'), 'BrandsAdminPage');

const OrdersAdminPage = lazyNamed(() => import('../pages/OrdersAdminPage'), 'OrdersAdminPage');
const OrderDetailAdminPage = lazyNamed(() => import('../pages/OrderDetailAdminPage'), 'OrderDetailAdminPage');

const InventoryPage = lazyNamed(() => import('../pages/InventoryPage'), 'InventoryPage');
const InventoryLedgerPage = lazyNamed(() => import('../pages/InventoryLedgerPage'), 'InventoryLedgerPage');

const CustomersAdminPage = lazyNamed(() => import('../pages/CustomersAdminPage'), 'CustomersAdminPage');
const CustomerDetailAdminPage = lazyNamed(() => import('../pages/CustomerDetailAdminPage'), 'CustomerDetailAdminPage');

const BannersAdminPage = lazyNamed(() => import('../pages/BannersAdminPage'), 'BannersAdminPage');
const OffersAdminPage = lazyNamed(() => import('../pages/OffersAdminPage'), 'OffersAdminPage');
const CouponsAdminPage = lazyNamed(() => import('../pages/CouponsAdminPage'), 'CouponsAdminPage');

const ReturnsAdminPage = lazyNamed(() => import('../pages/ReturnsAdminPage'), 'ReturnsAdminPage');
const RefundsAdminPage = lazyNamed(() => import('../pages/RefundsAdminPage'), 'RefundsAdminPage');

const ShipmentsAdminPage = lazyNamed(() => import('../pages/ShipmentsAdminPage'), 'ShipmentsAdminPage');
const ReviewsAdminPage = lazyNamed(() => import('../pages/ReviewsAdminPage'), 'ReviewsAdminPage');

const AnalyticsPage = lazyNamed(() => import('../pages/AnalyticsPage'), 'AnalyticsPage');

const FinanceOverviewPage = lazyNamed(() => import('../pages/FinanceOverviewPage'), 'FinanceOverviewPage');
const FinanceTransactionsPage = lazyNamed(() => import('../pages/FinanceTransactionsPage'), 'FinanceTransactionsPage');
const FinanceLedgerPage = lazyNamed(() => import('../pages/FinanceLedgerPage'), 'FinanceLedgerPage');

const AdminUsersPage = lazyNamed(() => import('../pages/AdminUsersPage'), 'AdminUsersPage');
const RolesAdminPage = lazyNamed(() => import('../pages/RolesAdminPage'), 'RolesAdminPage');

const AuditLogsPage = lazyNamed(() => import('../pages/AuditLogsPage'), 'AuditLogsPage');
const SettingsAdminPage = lazyNamed(() => import('../pages/SettingsAdminPage'), 'SettingsAdminPage');

const AdminLoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-urban-teal/20 border-t-urban-teal rounded-full animate-spin" />
  </div>
);

export const AdminRoutes = () => {
  return (
    <Suspense fallback={<AdminLoadingFallback />}>
    <Routes>
      {/* Isolated Admin Authentication Screen */}
      <Route path="/login" element={<AdminLoginPage />} />

      {/* Protected Admin Console Routes with AdminLayout */}
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Catalog */}
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductCreatePage />} />
        <Route path="products/:id/edit" element={<ProductEditPage />} />
        <Route path="categories" element={<CategoriesAdminPage />} />
        <Route path="brands" element={<BrandsAdminPage />} />

        {/* Fulfillment & Orders */}
        <Route path="orders" element={<OrdersAdminPage />} />
        <Route path="orders/:id" element={<OrderDetailAdminPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/ledger" element={<InventoryLedgerPage />} />
        <Route path="shipments" element={<ShipmentsAdminPage />} />
        <Route path="returns" element={<ReturnsAdminPage />} />
        <Route path="refunds" element={<RefundsAdminPage />} />

        {/* CRM & Community */}
        <Route path="customers" element={<CustomersAdminPage />} />
        <Route path="customers/:id" element={<CustomerDetailAdminPage />} />
        <Route path="reviews" element={<ReviewsAdminPage />} />

        {/* Marketing */}
        <Route path="banners" element={<BannersAdminPage />} />
        <Route path="offers" element={<OffersAdminPage />} />
        <Route path="coupons" element={<CouponsAdminPage />} />

        {/* Analytics & Finance */}
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="finance" element={<FinanceOverviewPage />} />
        <Route path="finance/transactions" element={<FinanceTransactionsPage />} />
        <Route path="finance/ledger" element={<FinanceLedgerPage />} />

        {/* Security & Administration */}
        <Route path="admin-users" element={<AdminUsersPage />} />
        <Route path="roles" element={<RolesAdminPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SettingsAdminPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </Suspense>
  );
};
