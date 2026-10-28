import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { CartService } from './cart.service.js';
import { InventoryService } from './inventory.service.js';
import { PaymentService } from './payment.service.js';
import { CouponService } from './coupon.service.js';
import { User } from '../models/User.js';
import { Shipment } from '../models/Shipment.js';
import { shippingService } from './shipping/shipping.service.js';

export class OrderService {
  /**
   * Generates a unique, prestigious human-readable order number (e.g. UC-718293)
   */
  static async generateOrderNumber() {
    let orderNumber = '';
    let isUnique = false;

    while (!isUnique) {
      const randomSix = Math.floor(100000 + Math.random() * 900000);
      orderNumber = `UC-${randomSix}`;
      const existing = await Order.findOne({ orderNumber }).select('_id');
      if (!existing) {
        isUnique = true;
      }
    }

    return orderNumber;
  }

  /**
   * Places an order with atomic inventory reservation and price snapshots
   */
  static async createOrder(userId, payload = {}) {
    const {
      shippingAddress,
      billingAddress,
      paymentMethod = 'COD',
      items: rawItems,
      customerInfo,
      couponCode,
    } = payload;

    if (!shippingAddress) {
      throw new Error('Shipping destination address is required');
    }

    // 1. Fetch user context
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Customer account not found');
    }

    const customerSnapshot = {
      name: customerInfo?.name || shippingAddress.name || user.name,
      email: customerInfo?.email || user.email,
      phone: customerInfo?.phone || shippingAddress.phone || user.phone,
    };

    // 2. Resolve items to purchase (from cart or provided array)
    let itemsToProcess = rawItems;
    if (!itemsToProcess || itemsToProcess.length === 0) {
      const cart = await CartService.getCart(userId);
      itemsToProcess = cart.items;
    }

    if (!itemsToProcess || itemsToProcess.length === 0) {
      throw new Error('Your shopping bag is empty. Please add garments before checking out.');
    }

    // 3. Recalculate prices and validate live stock and coupon authority on server
    const { items: validatedItems, totals } = await CartService.recalculateCartItems(
      itemsToProcess,
      couponCode,
      userId
    );

    if (totals.hasUnavailableItems) {
      const unavailable = validatedItems.filter((i) => !i.isAvailable);
      const names = unavailable.map((i) => i.product.name).join(', ');
      throw new Error(
        `Unable to place order: The following atelier piece(s) are currently unavailable: ${names}. Please adjust your bag.`
      );
    }

    if (validatedItems.length === 0) {
      throw new Error('No valid garments found to create an order.');
    }

    // Explicit check: ensure requested quantity does not exceed available stock
    for (let i = 0; i < itemsToProcess.length; i++) {
      const origQty = Math.max(1, parseInt(itemsToProcess[i].quantity, 10) || 1);
      const validatedItem = validatedItems[i];
      if (!validatedItem || !validatedItem.isAvailable) {
        throw new Error(`Garment is unavailable for purchase.`);
      }
      if (origQty > validatedItem.availableStock) {
        throw new Error(
          `Insufficient inventory for "${validatedItem.product.name}" (${validatedItem.variant.size} / ${validatedItem.variant.color}). Requested: ${origQty}, Available: ${validatedItem.availableStock}`
        );
      }
    }

    // 4. Generate Order Number
    const orderNumber = await this.generateOrderNumber();

    // 5. Atomically validate and reserve inventory
    // If any item is out of stock, this will throw and automatically rollback.
    await InventoryService.validateAndReserveStock(validatedItems, orderNumber);

    try {
      // 6. Initialize Payment
      const paymentSnapshot = await PaymentService.initializePayment({
        orderNumber,
        amount: totals.grandTotal,
        method: paymentMethod,
        customer: customerSnapshot,
      });

      // 7. Initialize Courier Shipment via Shipping Abstraction Layer
      const defaultCourier = 'DTDC';
      const provider = shippingService.getProvider(defaultCourier);
      const shipmentData = await provider.createShipment({
        orderNumber,
        destination: shippingAddress,
        customer: customerSnapshot,
        items: validatedItems,
        weightKg: 0.8,
        originHub: 'Urban Check Atelier Mumbai Dispatch',
      });

      const shipmentSnapshot = {
        courier: shipmentData.courier,
        carrier: shipmentData.carrierName,
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

      // 8. Prepare immutable Item Snapshots
      const itemSnapshots = validatedItems.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        brand: typeof item.product.brand === 'object' ? item.product.brand?.name : item.product.brand || 'Urban Check',
        thumbnail: item.product.thumbnail || item.product.images?.[0] || '',
        variant: {
          sku: item.variant.sku,
          size: item.variant.size,
          color: item.variant.color,
        },
        price: item.unitPrice,
        originalPrice: item.originalPrice,
        quantity: item.quantity,
        subtotal: item.itemSubtotal,
      }));

      // 9. Create Order Document
      const order = await Order.create({
        orderNumber,
        user: userId,
        customer: customerSnapshot,
        items: itemSnapshots,
        shippingAddress: {
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          address: shippingAddress.address,
          apartment: shippingAddress.apartment || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country || 'India',
          postalCode: shippingAddress.postalCode,
          landmark: shippingAddress.landmark || '',
        },
        billingAddress: billingAddress || shippingAddress,
        pricing: {
          subtotal: totals.subtotal,
          discount: totals.discount,
          couponCode: totals.couponCode || '',
          couponDiscount: totals.couponDiscount || 0,
          shipping: totals.shipping,
          tax: totals.tax,
          grandTotal: totals.grandTotal,
        },
        orderStatus: paymentMethod === 'Razorpay' ? 'Pending' : 'Confirmed',
        payment: paymentSnapshot,
        shipment: shipmentSnapshot,
        statusHistory: [
          {
            status: paymentMethod === 'Razorpay' ? 'Pending' : 'Confirmed',
            timestamp: new Date(),
            note:
              paymentMethod === 'Razorpay'
                ? 'Order initiated and awaiting server-side payment verification'
                : 'Order confirmed and awaiting atelier preparation',
          },
        ],
      });

      // 9.5 Create dedicated Shipment record in logistics collection
      try {
        await Shipment.create({
          shipmentId: shipmentData.shipmentId,
          order: order._id,
          orderNumber: order.orderNumber,
          courier: shipmentData.courier,
          carrierName: shipmentData.carrierName,
          awb: shipmentData.awb,
          trackingUrl: shipmentData.trackingUrl,
          status: shipmentData.status,
          estimatedDelivery: shipmentData.estimatedDelivery,
          pickupDate: shipmentData.pickupDate,
          deliveryDate: shipmentData.deliveryDate,
          origin: {
            hub: 'Urban Check Atelier Mumbai Dispatch',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
            country: 'India',
          },
          destination: {
            name: shippingAddress.name,
            phone: shippingAddress.phone,
            address: shippingAddress.address,
            apartment: shippingAddress.apartment || '',
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country || 'India',
          },
          packageDetails: {
            weightKg: 0.8,
            itemCount: validatedItems.length,
          },
          trackingEvents: shipmentData.trackingEvents,
        });
      } catch (shipmentErr) {
        console.warn('Dedicated shipment record creation warning:', shipmentErr.message);
      }

      // 10. Record Coupon usage if applied
      if (totals.couponCode && totals.couponDiscount > 0) {
        await CouponService.recordCouponUsage(totals.couponCode, userId);
      }

      // 11. Clear Customer Cart upon successful confirmation
      await CartService.clearCart(userId);

      return this.sanitizeOrder(order);
    } catch (creationError) {
      // Release reserved stock on any unexpected order creation failure
      await InventoryService.releaseReservedStock(validatedItems);
      throw creationError;
    }
  }

  /**
   * Retrieves all orders for authenticated customer
   */
  static async getUserOrders(userId) {
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();

    return orders.map((order) => ({
      id: order.orderNumber,
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString().split('T')[0],
      createdAt: order.createdAt,
      status: order.orderStatus,
      total: order.pricing.grandTotal,
      pricing: order.pricing,
      itemsCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
      previewItem: order.items[0]?.name ? `${order.items[0].name} (${order.items[0].variant.size} / ${order.items[0].variant.color})` : 'Atelier Garment',
      thumbnail: order.items[0]?.thumbnail || '',
      paymentMethod: order.payment.method,
      paymentStatus: order.payment.status,
    }));
  }

  /**
   * Retrieves single order by human-readable orderNumber or ID
   */
  static async getOrderByNumberOrId(userId, identifier) {
    let query = { user: userId };

    if (identifier.startsWith('UC-') || identifier.startsWith('ord_')) {
      query.orderNumber = identifier.startsWith('ord_') ? identifier.replace('ord_', 'UC-') : identifier;
    } else if (mongoose.Types.ObjectId.isValid(identifier)) {
      query.$or = [{ _id: identifier }, { orderNumber: identifier }];
    } else {
      query.orderNumber = identifier;
    }

    const order = await Order.findOne(query);
    if (!order) {
      throw new Error(`Order ${identifier} not found`);
    }

    return this.sanitizeOrder(order);
  }

  /**
   * Cancels order if eligible (allowed in Pending, Confirmed, Processing)
   */
  static async cancelOrder(userId, identifier, reason = 'Customer request') {
    const order = await this.getOrderByNumberOrId(userId, identifier);
    const orderDoc = await Order.findOne({ orderNumber: order.orderNumber, user: userId });

    const nonCancellable = ['Packed', 'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'];

    if (nonCancellable.includes(orderDoc.orderStatus)) {
      throw new Error(
        `Order ${orderDoc.orderNumber} cannot be cancelled as it is already ${orderDoc.orderStatus.toLowerCase()}. Please contact concierge.`
      );
    }

    // 1. Restore inventory
    await InventoryService.releaseReservedStock(
      orderDoc.items,
      orderDoc.orderNumber,
      'Customer',
      reason
    );

    // 2. Update status & history
    orderDoc.orderStatus = 'Cancelled';
    orderDoc.cancellation = {
      reason,
      cancelledAt: new Date(),
      cancelledBy: 'Customer',
    };
    orderDoc.statusHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      note: `Order cancelled by customer. Reason: ${reason}`,
    });

    // 3. Process payment status update if applicable
    if (orderDoc.payment.status === 'Paid') {
      orderDoc.payment.status = 'Refunded';
    } else {
      orderDoc.payment.status = 'Failed';
    }

    await orderDoc.save();
    return this.sanitizeOrder(orderDoc);
  }

  /**
   * Verifies online payment signature server-side and confirms order
   * NEVER trusts frontend payment claims.
   */
  static async verifyPayment(userId, identifier, paymentData = {}) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    const order = await this.getOrderByNumberOrId(userId, identifier);
    const orderDoc = await Order.findOne({ orderNumber: order.orderNumber, user: userId });

    if (!orderDoc) {
      const error = new Error(`Order ${identifier} not found or unauthorized access.`);
      error.statusCode = 404;
      throw error;
    }

    // Idempotent: If already paid, return sanitized order
    if (orderDoc.payment.status === 'Paid') {
      return this.sanitizeOrder(orderDoc);
    }

    const verification = await PaymentService.verifyOnlinePayment({
      orderId: razorpay_order_id || orderDoc.payment.gatewayOrderId,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!verification.verified) {
      orderDoc.payment.status = 'Failed';
      orderDoc.statusHistory.push({
        status: 'Pending',
        timestamp: new Date(),
        note: `Online payment verification failed: ${verification.reason || 'Invalid cryptographic signature'}`,
      });
      await orderDoc.save();

      const error = new Error('Payment verification failed. Invalid gateway signature.');
      error.statusCode = 400;
      throw error;
    }

    orderDoc.payment.status = 'Paid';
    orderDoc.payment.transactionId = verification.transactionId || razorpay_payment_id;
    orderDoc.payment.paidAt = verification.paidAt || new Date();
    orderDoc.orderStatus = 'Confirmed';
    orderDoc.statusHistory.push({
      status: 'Confirmed',
      timestamp: new Date(),
      note: 'Online payment cryptographically verified via Razorpay gateway',
    });

    await orderDoc.save();
    return this.sanitizeOrder(orderDoc);
  }

  /**
   * Sanitizes order document to ensure clean human-readable output
   * and avoid exposing raw database internals to customer
   */
  static sanitizeOrder(orderDoc) {
    const obj = orderDoc.toObject ? orderDoc.toObject() : orderDoc;

    return {
      id: obj.orderNumber,
      orderNumber: obj.orderNumber,
      customer: obj.customer,
      items: obj.items,
      shippingAddress: obj.shippingAddress,
      billingAddress: obj.billingAddress,
      pricing: obj.pricing,
      orderStatus: obj.orderStatus,
      payment: obj.payment,
      shipment: obj.shipment,
      statusHistory: obj.statusHistory,
      cancellation: obj.cancellation,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }
}
