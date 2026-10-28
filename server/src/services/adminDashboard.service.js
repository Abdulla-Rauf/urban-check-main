import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';

export class AdminDashboardService {
  /**
   * Retrieves the 8 primary operational KPI metrics from MongoDB
   */
  static async getMetrics() {
    // 1. Total Revenue & Orders
    const validOrdersMatch = { orderStatus: { $nin: ['Cancelled'] } };
    const [revenueAgg] = await Order.aggregate([
      { $match: validOrdersMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.grandTotal' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenueAgg?.totalRevenue || 0;
    const totalOrdersCount = await Order.countDocuments({});

    // 2. Customers Count
    const totalCustomersCount = await User.countDocuments({ role: 'customer' });

    // 3. Products Count
    const totalProductsCount = await Product.countDocuments({ status: { $ne: 'archived' } });

    // 4. Pending Orders (Pending, Confirmed, Processing)
    const pendingOrdersCount = await Order.countDocuments({
      orderStatus: { $in: ['Pending', 'Confirmed', 'Processing'] },
    });

    // 5. Low Stock Count (variants with stock <= 5 and stock > 0)
    const products = await Product.find({ status: { $ne: 'archived' } }).select('variants');
    let lowStockCount = 0;
    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        if ((v.stock ?? 0) > 0 && (v.stock ?? 0) <= 5) {
          lowStockCount += 1;
        }
      });
    });

    // 6. Returns Count
    const returnsCount = await Order.countDocuments({
      orderStatus: 'Returned',
    });

    // 7. Refunds Count
    const refundsCount = await Order.countDocuments({
      'payment.status': { $in: ['Refunded', 'PartiallyRefunded'] },
    });

    return {
      totalRevenue: {
        raw: totalRevenue,
        formatted: '₹' + totalRevenue.toLocaleString('en-IN'),
        label: 'Lifetime gross revenue',
      },
      orders: {
        raw: totalOrdersCount,
        formatted: totalOrdersCount.toLocaleString('en-IN'),
        label: 'Total orders placed',
      },
      customers: {
        raw: totalCustomersCount,
        formatted: totalCustomersCount.toLocaleString('en-IN'),
        label: 'Registered client patrons',
      },
      products: {
        raw: totalProductsCount,
        formatted: totalProductsCount.toLocaleString('en-IN'),
        label: 'Active catalog garments',
      },
      pendingOrders: {
        raw: pendingOrdersCount,
        formatted: pendingOrdersCount.toLocaleString('en-IN'),
        label: 'Awaiting dispatch pickup',
        isWarning: pendingOrdersCount > 0,
      },
      lowStock: {
        raw: lowStockCount,
        formatted: lowStockCount.toLocaleString('en-IN'),
        label: 'SKUs below threshold (≤5)',
        isAlert: lowStockCount > 0,
      },
      returns: {
        raw: returnsCount,
        formatted: returnsCount.toLocaleString('en-IN'),
        label: 'Door return inspections',
      },
      refunds: {
        raw: refundsCount,
        formatted: refundsCount.toLocaleString('en-IN'),
        label: 'Reversed payment transactions',
      },
    };
  }

  /**
   * Aggregates revenue for Daily, Weekly, Monthly, and Yearly charts with date filtering
   */
  static async getRevenueAnalytics({ period = 'monthly', startDate, endDate } = {}) {
    const match = { orderStatus: { $nin: ['Cancelled'] } };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    let datePattern;
    switch (period) {
      case 'daily':
        datePattern = '%Y-%m-%d';
        break;
      case 'weekly':
        datePattern = '%Y-W%V';
        break;
      case 'yearly':
        datePattern = '%Y';
        break;
      case 'monthly':
      default:
        datePattern = '%Y-%m';
        break;
    }

    const points = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: datePattern, date: '$createdAt' } },
          revenue: { $sum: '$pricing.grandTotal' },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format human-friendly labels
    const data = points.map((p) => {
      let label = p._id;
      if (period === 'monthly') {
        const [year, month] = p._id.split('-');
        const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        label = dateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      } else if (period === 'daily') {
        const [year, month, day] = p._id.split('-');
        const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        label = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      }

      return {
        key: p._id,
        label,
        revenue: p.revenue,
        formattedRevenue: '₹' + p.revenue.toLocaleString('en-IN'),
        ordersCount: p.ordersCount,
        avgOrderValue: p.ordersCount > 0 ? Math.round(p.revenue / p.ordersCount) : 0,
      };
    });

    const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalOrders = data.reduce((acc, curr) => acc + curr.ordersCount, 0);

    return {
      period,
      startDate: startDate || null,
      endDate: endDate || null,
      data,
      summary: {
        totalRevenue,
        formattedTotalRevenue: '₹' + totalRevenue.toLocaleString('en-IN'),
        totalOrders,
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      },
    };
  }

  /**
   * Retrieves recent orders for the operational dashboard stream
   */
  static async getRecentOrders(limit = 5) {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('orderNumber customer items pricing orderStatus payment shipment createdAt')
      .lean();

    return orders.map((o) => ({
      id: o.orderNumber,
      customer: o.customer?.name || 'Guest Patron',
      email: o.customer?.email || '',
      itemsCount: (o.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0),
      total: o.pricing?.grandTotal || 0,
      formattedTotal: '₹' + (o.pricing?.grandTotal || 0).toLocaleString('en-IN'),
      paymentMethod: o.payment?.method || 'COD',
      paymentStatus: o.payment?.status || 'Pending',
      status: o.orderStatus,
      courier: o.shipment?.carrier || 'DTDC Express',
      trackingNumber: o.shipment?.trackingNumber || 'Pending',
      date: new Date(o.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      createdAt: o.createdAt,
    }));
  }
}
