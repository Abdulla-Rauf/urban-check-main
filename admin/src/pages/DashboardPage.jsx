import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { DataTable } from '../components/DataTable';
import { RevenueChart } from '../components/RevenueChart';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  Clock,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  Plus,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export const DashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.get('/admin/dashboard');
      const payload = res.data || res;
      setMetrics(payload.metrics || null);
      setRecentOrders(payload.recentOrders || []);
    } catch (err) {
      setError(err.message || 'Failed to load telemetry from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const orderColumns = [
    {
      header: 'Order Reference',
      accessor: 'id',
      render: (row) => (
        <Link
          to={`/orders/${row.id}`}
          className="font-mono font-medium text-admin-accent hover:underline"
        >
          {row.id}
        </Link>
      ),
    },
    { header: 'Client Patron', accessor: 'customer', className: 'font-medium text-slate-900' },
    { header: 'Garments', accessor: 'itemsCount', className: 'font-mono' },
    {
      header: 'Amount',
      accessor: 'formattedTotal',
      className: 'font-semibold text-slate-900 font-mono',
    },
    {
      header: 'Payment',
      accessor: 'paymentStatus',
      render: (row) => (
        <span
          className={`admin-badge ${
            row.paymentStatus === 'Paid'
              ? 'admin-badge-success'
              : row.paymentStatus === 'Refunded'
              ? 'admin-badge-danger'
              : 'admin-badge-warning'
          }`}
        >
          {row.paymentMethod} • {row.paymentStatus}
        </span>
      ),
    },
    {
      header: 'Fulfillment',
      accessor: 'status',
      render: (row) => {
        const badgeMap = {
          Pending: 'admin-badge-warning',
          Confirmed: 'admin-badge-info',
          Processing: 'admin-badge-warning',
          Packed: 'admin-badge-info',
          Shipped: 'admin-badge-info',
          OutForDelivery: 'admin-badge-info',
          Delivered: 'admin-badge-success',
          Cancelled: 'admin-badge-danger',
          Returned: 'admin-badge-danger',
        };
        return (
          <span className={`admin-badge ${badgeMap[row.status] || 'admin-badge-info'}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      header: 'Courier Tracking',
      accessor: 'trackingNumber',
      render: (row) => (
        <span className="font-mono text-slate-500">
          {row.courier} ({row.trackingNumber})
        </span>
      ),
    },
    { header: 'Date', accessor: 'date', className: 'text-slate-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Operations Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry on revenue, fulfillment throughput, and warehouse stock levels.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md transition-colors shadow-xs"
            title="Reload telemetry"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <Link
            to="/products/new"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-admin-accent hover:bg-admin-accent-hover text-white rounded-md text-xs font-medium shadow-xs transition-colors"
          >
            <Plus size={15} />
            <span>Create New Product</span>
          </Link>
          <Link
            to="/inventory"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium shadow-xs transition-colors"
          >
            <Package size={15} />
            <span>Adjust Inventory</span>
          </Link>
        </div>
      </div>

      {/* 8 Real KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={metrics ? metrics.totalRevenue.formatted : '...'}
          timeframe="Lifetime Gross Sales"
          icon={TrendingUp}
          isPositive={true}
          change="+18.4%"
        />
        <MetricCard
          title="Orders"
          value={metrics ? metrics.orders.formatted : '...'}
          timeframe="Total Acquisitions"
          icon={ShoppingBag}
          isPositive={true}
          change="+12.1%"
        />
        <MetricCard
          title="Customers"
          value={metrics ? metrics.customers.formatted : '...'}
          timeframe="Registered Patrons"
          icon={Users}
          isPositive={true}
          change="+8.3%"
        />
        <MetricCard
          title="Products"
          value={metrics ? metrics.products.formatted : '...'}
          timeframe="Active Atelier Garments"
          icon={Package}
          isPositive={true}
          change="Catalog"
        />

        <MetricCard
          title="Pending Orders"
          value={metrics ? metrics.pendingOrders.formatted : '...'}
          timeframe="Awaiting Dispatch"
          icon={Clock}
          isAlert={metrics?.pendingOrders?.raw > 0}
          change={metrics?.pendingOrders?.raw > 0 ? 'Urgent' : 'Clear'}
        />
        <MetricCard
          title="Low Stock"
          value={metrics ? metrics.lowStock.formatted : '...'}
          timeframe="SKUs Below Threshold"
          icon={AlertTriangle}
          isAlert={metrics?.lowStock?.raw > 0}
          change={metrics?.lowStock?.raw > 0 ? 'Action Req' : 'Optimal'}
        />
        <MetricCard
          title="Returns"
          value={metrics ? metrics.returns.formatted : '...'}
          timeframe="Reverse Inspections"
          icon={RotateCcw}
          isPositive={true}
          change="0.8% rate"
        />
        <MetricCard
          title="Refunds"
          value={metrics ? metrics.refunds.formatted : '...'}
          timeframe="Reversed Transactions"
          icon={CreditCard}
          isPositive={true}
          change="Settled"
        />
      </div>

      {/* Revenue Velocity Analytics Chart with Daily/Weekly/Monthly/Yearly + Date Filter */}
      <RevenueChart />

      {/* Recent Orders Section */}
      <DataTable
        title="Live Order Stream"
        description="Latest customer acquisitions awaiting packaging and courier pickup."
        columns={orderColumns}
        data={recentOrders}
        loading={loading}
        actionButton={
          <Link
            to="/orders"
            className="text-xs text-admin-accent hover:underline font-medium inline-flex items-center"
          >
            <span>View All Orders</span>
            <ArrowRight size={13} className="ml-1" />
          </Link>
        }
      />
    </div>
  );
};
