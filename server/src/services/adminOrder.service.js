import { Order } from '../models/Order.js';
import { Shipment } from '../models/Shipment.js';
import { InventoryService } from './inventory.service.js';

export class AdminOrderService {
  /**
   * Retrieves paginated orders with multi-attribute filtering (Status, Payment, Date, Courier)
   */
  static async getOrders({
    page = 1,
    limit = 15,
    search = '',
    status = 'all',
    paymentStatus = 'all',
    paymentMethod = 'all',
    courier = 'all',
    startDate,
    endDate,
    sort = '-createdAt',
  } = {}) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.max(1, parseInt(limit, 10));

    const query = {};

    // 1. Status Filter
    if (status && status !== 'all') {
      query.orderStatus = status;
    }

    // 2. Payment Status Filter
    if (paymentStatus && paymentStatus !== 'all') {
      query['payment.status'] = paymentStatus;
    }

    // 3. Payment Method Filter
    if (paymentMethod && paymentMethod !== 'all') {
      query['payment.method'] = paymentMethod;
    }

    // 4. Courier Filter
    if (courier && courier !== 'all') {
      query['shipment.carrier'] = courier;
    }

    // 5. Date Range Filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // 6. Search (Order Number, Name, Email, Phone)
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderNumber: regex },
        { 'customer.name': regex },
        { 'customer.email': regex },
        { 'customer.phone': regex },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query).sort(sort).skip(skip).limit(take).lean(),
      Order.countDocuments(query),
    ]);

    const formattedOrders = orders.map((o) => ({
      id: o.orderNumber,
      mongoId: o._id,
      customer: o.customer?.name || 'Guest Patron',
      email: o.customer?.email || '',
      phone: o.customer?.phone || '',
      itemsCount: (o.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0),
      items: o.items || [],
      amount: o.pricing?.grandTotal || 0,
      formattedAmount: '₹' + (o.pricing?.grandTotal || 0).toLocaleString('en-IN'),
      paymentMethod: o.payment?.method || 'COD',
      paymentStatus: o.payment?.status || 'Pending',
      status: o.orderStatus,
      courier: o.shipment?.carrier || 'DTDC Express',
      trackingNumber: o.shipment?.trackingNumber || 'Pending',
      shippingAddress: o.shippingAddress,
      pricing: o.pricing,
      timeline: o.shipment?.timeline || [],
      createdAt: o.createdAt,
      formattedDate: new Date(o.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    }));

    return {
      items: formattedOrders,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / take) || 1,
      limit: take,
    };
  }

  /**
   * Retrieves single order by orderNumber or MongoDB _id
   */
  static async getOrderById(identifier) {
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: identifier } : { orderNumber: identifier };

    const order = await Order.findOne(query).lean();
    if (!order) {
      throw new Error(`Order ${identifier} not found in database.`);
    }

    return {
      id: order.orderNumber,
      mongoId: order._id,
      customer: order.customer,
      items: order.items,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      pricing: order.pricing,
      orderStatus: order.orderStatus,
      payment: order.payment,
      shipment: order.shipment,
      statusHistory: order.statusHistory || [],
      cancellation: order.cancellation,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Updates order fulfillment status, courier information, tracking number and timeline
   */
  static async updateOrderStatus(
    identifier,
    {
      orderStatus,
      paymentStatus,
      carrier,
      trackingNumber,
      location = 'Urban Check Fulfillment Hub',
      note = '',
      adminName = 'Super Admin',
    }
  ) {
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: identifier } : { orderNumber: identifier };

    const orderDoc = await Order.findOne(query);
    if (!orderDoc) {
      throw new Error(`Order ${identifier} not found.`);
    }

    const previousStatus = orderDoc.orderStatus;

    if (orderStatus && orderStatus !== previousStatus) {
      orderDoc.orderStatus = orderStatus;

      // Append to status history
      orderDoc.statusHistory.push({
        status: orderStatus,
        timestamp: new Date(),
        note: note || `Status updated from ${previousStatus} to ${orderStatus} by ${adminName}`,
      });

      // Append to shipment timeline if applicable
      const milestoneLabels = {
        Processing: 'Tailoring & Quality Verification',
        Packed: 'Inspected and Sealed in Atelier Gift Packaging',
        Shipped: 'Handed Over to Air Express Courier',
        OutForDelivery: 'Out for Final Delivery Attempt',
        Delivered: 'Consignment Successfully Delivered to Patron',
        Cancelled: 'Order Cancelled by Atelier Concierge',
        Returned: 'Consignment Received at Atelier for Return Audit',
      };

      if (milestoneLabels[orderStatus]) {
        if (!orderDoc.shipment) orderDoc.shipment = {};
        if (!orderDoc.shipment.timeline) orderDoc.shipment.timeline = [];

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const eventStatus = orderStatus === 'OutForDelivery' ? 'Out for Delivery' : orderStatus;

        if (!orderDoc.shipment.trackingEvents) orderDoc.shipment.trackingEvents = [];
        orderDoc.shipment.trackingEvents.push({
          status: eventStatus,
          date: dateStr,
          time: timeStr,
          location,
          description: milestoneLabels[orderStatus] || note || `Status updated to ${orderStatus}`,
          timestamp: now,
        });

        orderDoc.shipment.timeline.push({
          status: orderStatus,
          label: milestoneLabels[orderStatus],
          location,
          timestamp: now,
        });
        orderDoc.shipment.status = eventStatus;
      }

      // If transition to Cancelled or Returned from active order, restore inventory
      if (
        ['Cancelled', 'Returned'].includes(orderStatus) &&
        !['Cancelled', 'Returned', 'Refunded'].includes(previousStatus)
      ) {
        await InventoryService.releaseReservedStock(
          orderDoc.items,
          orderDoc.orderNumber,
          adminName,
          note || `Status changed to ${orderStatus} by ${adminName}`
        );
      }
    }

    if (paymentStatus) {
      orderDoc.payment.status = paymentStatus;
      if (paymentStatus === 'Paid' && !orderDoc.payment.paidAt) {
        orderDoc.payment.paidAt = new Date();
      }
    }

    if (carrier) {
      if (!orderDoc.shipment) orderDoc.shipment = {};
      orderDoc.shipment.carrier = carrier;
    }

    if (trackingNumber) {
      if (!orderDoc.shipment) orderDoc.shipment = {};
      orderDoc.shipment.trackingNumber = trackingNumber;
    }

    await orderDoc.save();

    // Synchronize dedicated Shipment collection
    try {
      const shipmentUpdate = {
        status: orderDoc.shipment?.status || 'Confirmed',
        trackingEvents: orderDoc.shipment?.trackingEvents || [],
      };
      if (carrier) {
        shipmentUpdate.carrierName = carrier;
        if (carrier.toLowerCase().includes('delhivery')) shipmentUpdate.courier = 'Delhivery';
        else if (carrier.toLowerCase().includes('generic')) shipmentUpdate.courier = 'GenericCourier';
        else shipmentUpdate.courier = 'DTDC';
      }
      if (trackingNumber) shipmentUpdate.awb = trackingNumber;
      if (orderDoc.shipment?.status === 'Shipped') shipmentUpdate.pickupDate = new Date();
      if (orderDoc.shipment?.status === 'Delivered') shipmentUpdate.deliveryDate = new Date();

      await Shipment.findOneAndUpdate(
        { orderNumber: orderDoc.orderNumber },
        { $set: shipmentUpdate }
      );
    } catch (err) {
      console.warn('Shipment sync warning:', err.message);
    }

    return this.getOrderById(orderDoc.orderNumber);
  }
}
