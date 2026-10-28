import {
  LayoutDashboard,
  Shirt,
  Tags,
  Layers,
  ShoppingBag,
  Package,
  BookOpen,
  Truck,
  RotateCcw,
  Receipt,
  Users,
  Star,
  Image,
  Percent,
  Ticket,
  BarChart3,
  DollarSign,
  ArrowRightLeft,
  ScrollText,
  UserCheck,
  ShieldCheck,
  History,
  Settings,
} from 'lucide-react';

export const ADMIN_NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Catalog Management',
    items: [
      { label: 'Products', path: '/products', icon: Shirt },
      { label: 'Categories', path: '/categories', icon: Tags },
      { label: 'Brands', path: '/brands', icon: Layers },
    ],
  },
  {
    title: 'Sales & Inventory',
    items: [
      { label: 'Orders', path: '/orders', icon: ShoppingBag },
      { label: 'Inventory Control', path: '/inventory', icon: Package },
      { label: 'Inventory Ledger', path: '/inventory/ledger', icon: BookOpen },
      { label: 'Shipments', path: '/shipments', icon: Truck },
      { label: 'Returns', path: '/returns', icon: RotateCcw },
      { label: 'Refunds', path: '/refunds', icon: Receipt },
    ],
  },
  {
    title: 'CRM & Community',
    items: [
      { label: 'Customers', path: '/customers', icon: Users },
      { label: 'Reviews', path: '/reviews', icon: Star },
    ],
  },
  {
    title: 'Marketing & Promos',
    items: [
      { label: 'Banners', path: '/banners', icon: Image },
      { label: 'Offers', path: '/offers', icon: Percent },
      { label: 'Coupons', path: '/coupons', icon: Ticket },
    ],
  },
  {
    title: 'Intelligence & Finance',
    items: [
      { label: 'Analytics', path: '/analytics', icon: BarChart3 },
      { label: 'Finance Overview', path: '/finance', icon: DollarSign },
      { label: 'Transactions', path: '/finance/transactions', icon: ArrowRightLeft },
      { label: 'Financial Ledger', path: '/finance/ledger', icon: ScrollText },
    ],
  },
  {
    title: 'System & Security',
    items: [
      { label: 'Admin Users', path: '/admin-users', icon: UserCheck },
      { label: 'Roles & Permissions', path: '/roles', icon: ShieldCheck },
      { label: 'Audit Logs', path: '/audit-logs', icon: History },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

export const MOCK_ADMIN_DASHBOARD = {
  kpis: [
    {
      title: 'Gross Revenue',
      value: '₹14,82,500',
      change: '+18.4%',
      isPositive: true,
      timeframe: 'vs. last month',
    },
    {
      title: 'Orders Processed',
      value: '1,248',
      change: '+12.1%',
      isPositive: true,
      timeframe: '14 today',
    },
    {
      title: 'Average Order Value',
      value: '₹7,650',
      change: '+4.2%',
      isPositive: true,
      timeframe: 'vs. last month',
    },
    {
      title: 'Critical Stock SKUs',
      value: '7',
      change: 'Urgent',
      isAlert: true,
      timeframe: 'Below reorder point',
    },
  ],
};
