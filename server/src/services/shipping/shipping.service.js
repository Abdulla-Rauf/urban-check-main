import { DtdcProvider } from './dtdc.provider.js';
import { DelhiveryProvider } from './delhivery.provider.js';
import { GenericCourierProvider } from './generic.provider.js';
import { Shipment } from '../../models/Shipment.js';
import { Order } from '../../models/Order.js';

/**
 * Shipping Service
 * Unified abstraction layer for multi-courier logistics orchestration.
 * Decouples the application from specific courier providers (DTDC, Delhivery, GenericCourier).
 */
export class ShippingService {
  constructor() {
    this.providers = {
      DTDC: new DtdcProvider(),
      Delhivery: new DelhiveryProvider(),
      GenericCourier: new GenericCourierProvider(),
    };
  }

  /**
   * Retrieves list of available couriers and their configuration status
   */
  getAvailableCouriers() {
    return [
      {
        id: 'DTDC',
        name: this.providers.DTDC.displayName,
        badge: 'Express Air',
        description: 'Nationwide premium air cargo network covering 10,000+ pin codes across India.',
        isConfigured: this.providers.DTDC.isConfigured(),
        trackingUrlPattern: 'https://tracking.dtdc.com/...',
      },
      {
        id: 'Delhivery',
        name: this.providers.Delhivery.displayName,
        badge: 'Surface & Express',
        description: 'Automated sortation hubs, real-time GPS tracking & rapid last-mile delivery.',
        isConfigured: this.providers.Delhivery.isConfigured(),
        trackingUrlPattern: 'https://www.delhivery.com/track/package/...',
      },
      {
        id: 'GenericCourier',
        name: this.providers.GenericCourier.displayName,
        badge: 'Boutique Delivery',
        description: 'Dedicated white-glove fleet & local atelier concierge for bespoke dispatch.',
        isConfigured: true,
        trackingUrlPattern: 'https://urbancheck.com/track?awb=...',
      },
    ];
  }

  /**
   * Resolves the appropriate courier provider instance
   */
  getProvider(courierName = 'DTDC') {
    const normalized = String(courierName || '').trim().toLowerCase();

    if (normalized.includes('delhivery')) {
      return this.providers.Delhivery;
    }
    if (normalized.includes('generic') || normalized.includes('local') || normalized.includes('express')) {
      if (normalized.includes('dtdc')) return this.providers.DTDC;
      return this.providers.GenericCourier;
    }
    if (normalized.includes('dtdc')) {
      return this.providers.DTDC;
    }

    // Default fallback to DTDC or GenericCourier
    return this.providers[courierName] || this.providers.GenericCourier;
  }

  /**
   * Admin / Automated: Creates shipment, selects courier, generates AWB
   */
  async createShipment({
    orderNumber,
    courier = 'DTDC',
    weightKg = 0.8,
    originHub = 'Urban Check Atelier Mumbai Dispatch',
    notes = '',
  }) {
    // 1. Locate the Order
    const isObjectId = String(orderNumber).match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: orderNumber } : { orderNumber };
    const orderDoc = await Order.findOne(query);

    if (!orderDoc) {
      throw new Error(`Order #${orderNumber} not found.`);
    }

    // 2. Select Courier Provider
    const provider = this.getProvider(courier);

    // 3. Delegate shipment generation to the chosen provider
    const shipmentData = await provider.createShipment({
      orderNumber: orderDoc.orderNumber,
      destination: orderDoc.shippingAddress,
      customer: orderDoc.customer,
      items: orderDoc.items,
      weightKg: Number(weightKg) || 0.8,
      originHub,
    });

    // 4. Upsert dedicated Shipment document
    let shipmentDoc = await Shipment.findOne({ orderNumber: orderDoc.orderNumber });
    if (!shipmentDoc) {
      shipmentDoc = new Shipment({
        shipmentId: shipmentData.shipmentId,
        order: orderDoc._id,
        orderNumber: orderDoc.orderNumber,
        courier: provider.name,
        carrierName: provider.displayName,
        awb: shipmentData.awb,
        trackingUrl: shipmentData.trackingUrl,
        status: shipmentData.status,
        estimatedDelivery: shipmentData.estimatedDelivery,
        pickupDate: shipmentData.pickupDate,
        deliveryDate: shipmentData.deliveryDate,
        origin: {
          hub: originHub,
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
        },
        destination: {
          name: orderDoc.shippingAddress.name,
          phone: orderDoc.shippingAddress.phone,
          address: orderDoc.shippingAddress.address,
          apartment: orderDoc.shippingAddress.apartment || '',
          city: orderDoc.shippingAddress.city,
          state: orderDoc.shippingAddress.state,
          postalCode: orderDoc.shippingAddress.postalCode,
          country: orderDoc.shippingAddress.country || 'India',
        },
        packageDetails: {
          weightKg: shipmentData.packageDetails.weightKg,
          itemCount: shipmentData.packageDetails.itemCount,
        },
        trackingEvents: shipmentData.trackingEvents,
      });
    } else {
      shipmentDoc.courier = provider.name;
      shipmentDoc.carrierName = provider.displayName;
      shipmentDoc.awb = shipmentData.awb;
      shipmentDoc.trackingUrl = shipmentData.trackingUrl;
      shipmentDoc.status = shipmentData.status;
      shipmentDoc.estimatedDelivery = shipmentData.estimatedDelivery;
      shipmentDoc.packageDetails.weightKg = shipmentData.packageDetails.weightKg;
      // Prepend or merge events
      shipmentDoc.trackingEvents = shipmentData.trackingEvents;
    }

    await shipmentDoc.save();

    // 5. Synchronize Order Document's embedded shipment snapshot
    orderDoc.shipment = {
      courier: provider.name,
      carrier: provider.displayName,
      awb: shipmentData.awb,
      trackingNumber: shipmentData.awb,
      shipmentId: shipmentData.shipmentId,
      trackingUrl: shipmentData.trackingUrl,
      status: shipmentData.status,
      estimatedDelivery: shipmentData.estimatedDelivery,
      pickupDate: shipmentData.pickupDate,
      deliveryDate: shipmentData.deliveryDate,
      trackingEvents: shipmentData.trackingEvents,
      timeline: shipmentData.trackingEvents.map((e) => ({
        status: e.status,
        label: e.description,
        location: e.location,
        timestamp: e.timestamp,
      })),
    };

    if (orderDoc.orderStatus === 'Pending') {
      orderDoc.orderStatus = 'Confirmed';
    }

    await orderDoc.save();

    return shipmentDoc.toObject();
  }

  /**
   * Admin: Updates tracking milestone (Status, Date, Time, Location, Description)
   */
  static normalizeStatus(status) {
    const map = {
      'order placed': 'Order Placed',
      confirmed: 'Confirmed',
      packed: 'Packed',
      shipped: 'Shipped',
      outfordelivery: 'Out for Delivery',
      'out for delivery': 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return map[String(status).toLowerCase().trim()] || status;
  }

  async updateTracking(identifier, { status, location = '', description = '', date = '', time = '' }) {
    const normalizedStatus = ShippingService.normalizeStatus(status);

    // Locate shipment by shipmentId, awb, or orderNumber
    const shipmentDoc = await Shipment.findOne({
      $or: [{ shipmentId: identifier }, { awb: identifier }, { orderNumber: identifier }],
    });

    if (!shipmentDoc) {
      throw new Error(`Shipment with identifier ${identifier} not found.`);
    }

    const provider = this.getProvider(shipmentDoc.courier);
    const updateResult = await provider.updateTracking(shipmentDoc.awb, {
      status: normalizedStatus,
      location,
      description,
      date,
      time,
    });

    // Append event to Shipment
    shipmentDoc.status = normalizedStatus;
    shipmentDoc.trackingEvents.push(updateResult.event);
    if (updateResult.pickupDate) shipmentDoc.pickupDate = updateResult.pickupDate;
    if (updateResult.deliveryDate) shipmentDoc.deliveryDate = updateResult.deliveryDate;
    await shipmentDoc.save();

    // Synchronize Order
    const orderDoc = await Order.findOne({ orderNumber: shipmentDoc.orderNumber });
    if (orderDoc) {
      orderDoc.shipment.status = normalizedStatus;
      orderDoc.shipment.pickupDate = shipmentDoc.pickupDate;
      orderDoc.shipment.deliveryDate = shipmentDoc.deliveryDate;
      orderDoc.shipment.trackingEvents.push(updateResult.event);

      // Keep orderStatus in sync
      const orderStatusMapping = {
        'Order Placed': 'Confirmed',
        Confirmed: 'Confirmed',
        Packed: 'Packed',
        Shipped: 'Shipped',
        'Out for Delivery': 'OutForDelivery',
        Delivered: 'Delivered',
        Cancelled: 'Cancelled',
      };
      if (orderStatusMapping[normalizedStatus]) {
        orderDoc.orderStatus = orderStatusMapping[normalizedStatus];
      }

      orderDoc.statusHistory.push({
        status: normalizedStatus,
        timestamp: new Date(),
        note: description || `Consignment tracking updated to ${normalizedStatus}`,
      });

      // If Delivered, mark payment as paid if COD
      if (normalizedStatus === 'Delivered' && orderDoc.payment.status !== 'Paid') {
        orderDoc.payment.status = 'Paid';
        orderDoc.payment.paidAt = new Date();
      }

      await orderDoc.save();
    }

    return shipmentDoc.toObject();
  }

  /**
   * Admin: Cancels shipment with the courier
   */
  async cancelShipment(identifier, reason = 'Cancelled by administrator') {
    const shipmentDoc = await Shipment.findOne({
      $or: [{ shipmentId: identifier }, { awb: identifier }, { orderNumber: identifier }],
    });

    if (!shipmentDoc) {
      throw new Error(`Shipment with identifier ${identifier} not found.`);
    }

    const provider = this.getProvider(shipmentDoc.courier);
    const cancelResult = await provider.cancelShipment(shipmentDoc.awb, reason);

    shipmentDoc.status = 'Cancelled';
    shipmentDoc.cancellation = {
      cancelledAt: cancelResult.cancelledAt,
      reason,
    };
    if (cancelResult.event) {
      shipmentDoc.trackingEvents.push(cancelResult.event);
    }
    await shipmentDoc.save();

    // Synchronize Order
    const orderDoc = await Order.findOne({ orderNumber: shipmentDoc.orderNumber });
    if (orderDoc) {
      orderDoc.shipment.status = 'Cancelled';
      if (cancelResult.event) {
        orderDoc.shipment.trackingEvents.push(cancelResult.event);
      }
      orderDoc.statusHistory.push({
        status: 'Cancelled',
        timestamp: new Date(),
        note: `Consignment #${shipmentDoc.awb} cancelled: ${reason}`,
      });
      await orderDoc.save();
    }

    return shipmentDoc.toObject();
  }

  /**
   * Customer / Public: View full tracking history
   */
  async getTrackingHistory(identifier) {
    let shipmentDoc = await Shipment.findOne({
      $or: [{ shipmentId: identifier }, { awb: identifier }, { orderNumber: identifier }],
    }).lean();

    // If shipment collection didn't have it yet, check order document
    if (!shipmentDoc) {
      const orderDoc = await Order.findOne({
        $or: [{ orderNumber: identifier }, { 'shipment.awb': identifier }, { 'shipment.trackingNumber': identifier }],
      }).lean();

      if (!orderDoc) {
        throw new Error(`Tracking information for #${identifier} could not be located.`);
      }

      return {
        orderNumber: orderDoc.orderNumber,
        courier: orderDoc.shipment?.courier || 'DTDC',
        carrierName: orderDoc.shipment?.carrier || 'DTDC Express Air',
        awb: orderDoc.shipment?.awb || orderDoc.shipment?.trackingNumber || `AWB-${orderDoc.orderNumber}`,
        shipmentId: orderDoc.shipment?.shipmentId || `SHP-${orderDoc.orderNumber}`,
        trackingUrl: orderDoc.shipment?.trackingUrl || '',
        status: orderDoc.shipment?.status || orderDoc.orderStatus || 'Confirmed',
        estimatedDelivery: orderDoc.shipment?.estimatedDelivery,
        pickupDate: orderDoc.shipment?.pickupDate,
        deliveryDate: orderDoc.shipment?.deliveryDate,
        destination: orderDoc.shippingAddress,
        trackingEvents: orderDoc.shipment?.trackingEvents || [],
      };
    }

    return {
      orderNumber: shipmentDoc.orderNumber,
      courier: shipmentDoc.courier,
      carrierName: shipmentDoc.carrierName,
      awb: shipmentDoc.awb,
      shipmentId: shipmentDoc.shipmentId,
      trackingUrl: shipmentDoc.trackingUrl,
      status: shipmentDoc.status,
      estimatedDelivery: shipmentDoc.estimatedDelivery,
      pickupDate: shipmentDoc.pickupDate,
      deliveryDate: shipmentDoc.deliveryDate,
      destination: shipmentDoc.destination,
      trackingEvents: shipmentDoc.trackingEvents || [],
    };
  }

  /**
   * Admin: List all shipments with filtering & pagination
   */
  async getAllShipments({ page = 1, limit = 15, courier = 'all', status = 'all', search = '' }) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.max(1, parseInt(limit, 10));

    const query = {};
    if (courier && courier !== 'all') {
      query.courier = courier;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { awb: regex },
        { shipmentId: regex },
        { orderNumber: regex },
        { 'destination.name': regex },
        { 'destination.city': regex },
      ];
    }

    // Auto-sync: if Shipment collection is empty or has fewer items than existing orders with shipments,
    // backfill shipments from Order collection so the admin console is immediately fully populated!
    const shipmentCount = await Shipment.countDocuments({});
    if (shipmentCount === 0) {
      await this.backfillShipmentsFromOrders();
    }

    const [shipments, total] = await Promise.all([
      Shipment.find(query).sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
      Shipment.countDocuments(query),
    ]);

    return {
      shipments: shipments.map((s) => ({
        id: s.shipmentId,
        orderId: s.orderNumber,
        courier: s.courier,
        carrierName: s.carrierName,
        awb: s.awb,
        origin: s.origin?.city || 'Mumbai Hub',
        destination: `${s.destination?.city || 'Mumbai'}, ${s.destination?.state || 'MH'}`,
        status: s.status,
        trackingUrl: s.trackingUrl,
        estimatedDelivery: s.estimatedDelivery,
        pickupDate: s.pickupDate,
        deliveryDate: s.deliveryDate,
        eventCount: s.trackingEvents?.length || 0,
        createdAt: s.createdAt,
      })),
      pagination: {
        page: Math.max(1, parseInt(page, 10)),
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Helper to backfill shipments from any existing orders in MongoDB
   */
  async backfillShipmentsFromOrders() {
    try {
      const orders = await Order.find({ orderStatus: { $ne: 'Cancelled' } }).lean();
      for (const ord of orders) {
        const courier = ord.shipment?.courier || (ord.shipment?.carrier?.includes('Delhivery') ? 'Delhivery' : 'DTDC');
        const awb = ord.shipment?.awb || ord.shipment?.trackingNumber || `AWB-${ord.orderNumber.replace('-', '')}`;
        const cleanOrderNum = String(ord.orderNumber).replace(/[^A-Za-z0-9]/g, '');
        const shipmentId = ord.shipment?.shipmentId || `SHP-${courier.toUpperCase()}-${cleanOrderNum}`;
        const provider = this.getProvider(courier);

        const now = ord.createdAt || new Date();
        const dateStr = provider.formatDate(now);
        const timeStr = provider.formatTime(now);

        const events =
          ord.shipment?.trackingEvents?.length > 0
            ? ord.shipment.trackingEvents
            : [
                {
                  status: 'Order Placed',
                  date: dateStr,
                  time: timeStr,
                  location: 'Urban Check Online Concierge',
                  description: `Order #${ord.orderNumber} placed and recorded.`,
                  timestamp: now,
                },
                {
                  status: ord.orderStatus === 'Delivered' ? 'Delivered' : 'Confirmed',
                  date: dateStr,
                  time: timeStr,
                  location: 'Urban Check Atelier Dispatch',
                  description: `Consignment registered with ${provider.displayName}. Waybill #${awb}.`,
                  timestamp: now,
                },
              ];

        await Shipment.findOneAndUpdate(
          { orderNumber: ord.orderNumber },
          {
            $setOnInsert: {
              shipmentId,
              order: ord._id,
              orderNumber: ord.orderNumber,
              courier,
              carrierName: provider.displayName,
              awb,
              trackingUrl: provider.getTrackingUrl ? provider.getTrackingUrl(awb) : '',
              status: ord.orderStatus === 'Delivered' ? 'Delivered' : 'Confirmed',
              estimatedDelivery: ord.shipment?.estimatedDelivery || new Date(Date.now() + 3 * 86400000),
              origin: {
                hub: 'Urban Check Atelier Mumbai Dispatch',
                city: 'Mumbai',
                state: 'Maharashtra',
                postalCode: '400001',
              },
              destination: {
                name: ord.shippingAddress?.name || ord.customer?.name || 'Patron',
                phone: ord.shippingAddress?.phone || ord.customer?.phone || '',
                address: ord.shippingAddress?.address || 'Mumbai',
                city: ord.shippingAddress?.city || 'Mumbai',
                state: ord.shippingAddress?.state || 'Maharashtra',
                postalCode: ord.shippingAddress?.postalCode || '400001',
              },
              trackingEvents: events,
            },
          },
          { upsert: true }
        );
      }
    } catch (err) {
      console.warn('Shipment backfill warning:', err.message);
    }
  }

  /**
   * Admin: List pending orders eligible for new shipment creation
   */
  async getPendingOrders() {
    const orders = await Order.find({
      orderStatus: { $in: ['Pending', 'Confirmed', 'Processing', 'Packed'] },
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return orders.map((o) => ({
      orderNumber: o.orderNumber,
      customerName: o.customer?.name,
      customerEmail: o.customer?.email,
      customerPhone: o.customer?.phone,
      itemCount: o.items?.length || 0,
      grandTotal: o.pricing?.grandTotal,
      city: o.shippingAddress?.city,
      state: o.shippingAddress?.state,
      currentStatus: o.orderStatus,
      currentCourier: o.shipment?.courier || 'DTDC',
      createdAt: o.createdAt,
    }));
  }
}

// Export singleton instance
export const shippingService = new ShippingService();
