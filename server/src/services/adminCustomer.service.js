import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Address } from '../models/Address.js';

export class AdminCustomerService {
  /**
   * Retrieves paginated customer list with lifetime metrics. Never exposes password.
   */
  static async getCustomers({
    page = 1,
    limit = 15,
    search = '',
    status = 'all',
    sort = '-createdAt',
  } = {}) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.max(1, parseInt(limit, 10));

    const query = { role: 'customer' };

    if (status === 'active') {
      query.isBlocked = { $ne: true };
    } else if (status === 'inactive') {
      query.isBlocked = true;
    } else if (status === 'verified') {
      query.isVerified = true;
    } else if (status === 'unverified') {
      query.isVerified = false;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -passwordResetToken -passwordResetExpires -verificationToken')
        .sort(sort)
        .skip(skip)
        .limit(take)
        .lean(),
      User.countDocuments(query),
    ]);

    // Aggregate orders and spend for each customer
    const userIds = users.map((u) => u._id);
    const orders = await Order.find({ user: { $in: userIds } })
      .select('user pricing orderStatus createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const formattedCustomers = users.map((u) => {
      const customerOrders = orders.filter((o) => o.user.toString() === u._id.toString());
      const validOrders = customerOrders.filter((o) => o.orderStatus !== 'Cancelled');

      const totalSpent = validOrders.reduce((sum, o) => sum + (o.pricing?.grandTotal || 0), 0);
      const lastOrder = customerOrders.length > 0 ? customerOrders[0].createdAt : null;

      let customerStatus = 'Active';
      if (u.isBlocked === true || u.isActive === false) customerStatus = 'Blocked';
      else if (!u.isVerified) customerStatus = 'Unverified';

      return {
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone || '—',
        ordersCount: customerOrders.length,
        totalSpent,
        formattedTotalSpent: '₹' + totalSpent.toLocaleString('en-IN'),
        lastOrderDate: lastOrder
          ? new Date(lastOrder).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'No orders yet',
        lastOrder,
        status: customerStatus,
        isEmailVerified: u.isEmailVerified,
        createdAt: u.createdAt,
        joinedDate: new Date(u.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      };
    });

    return {
      items: formattedCustomers,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / take) || 1,
      limit: take,
    };
  }

  /**
   * Retrieves full profile for a single customer
   */
  static async getCustomerById(id) {
    const user = await User.findOne({ _id: id, role: 'customer' })
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .lean();

    if (!user) {
      throw new Error(`Customer ${id} not found.`);
    }

    const [addresses, orders] = await Promise.all([
      Address.find({ user: user._id }).lean(),
      Order.find({ user: user._id }).sort({ createdAt: -1 }).lean(),
    ]);

    const validOrders = orders.filter((o) => o.orderStatus !== 'Cancelled');
    const totalSpent = validOrders.reduce((sum, o) => sum + (o.pricing?.grandTotal || 0), 0);

    return {
      ...user,
      addresses,
      orders: orders.map((o) => ({
        orderNumber: o.orderNumber,
        itemsCount: (o.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0),
        total: o.pricing?.grandTotal,
        formattedTotal: '₹' + (o.pricing?.grandTotal || 0).toLocaleString('en-IN'),
        status: o.orderStatus,
        paymentStatus: o.payment?.status,
        date: new Date(o.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        createdAt: o.createdAt,
      })),
      totalSpent,
      formattedTotalSpent: '₹' + totalSpent.toLocaleString('en-IN'),
      ordersCount: orders.length,
    };
  }

  /**
   * Updates customer status (e.g. block/unblock)
   */
  static async updateCustomerStatus(id, { isActive, isEmailVerified }) {
    const update = {};
    if (isActive !== undefined) update.isActive = isActive;
    if (isEmailVerified !== undefined) update.isEmailVerified = isEmailVerified;

    const user = await User.findByIdAndUpdate(id, update, { new: true })
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .lean();

    if (!user) throw new Error(`Customer ${id} not found.`);
    return user;
  }
}
