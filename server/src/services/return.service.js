import mongoose from 'mongoose';
import { ReturnRequest } from '../models/ReturnRequest.js';
import { Order } from '../models/Order.js';
import { ProductVariant } from '../models/ProductVariant.js';
import { RefundService } from './refund.service.js';

export class ReturnService {
  /**
   * Generates unique prestigious return reference (e.g. RET-718293)
   */
  static async generateReturnNumber() {
    let returnNumber = '';
    let isUnique = false;
    while (!isUnique) {
      const randomSix = Math.floor(100000 + Math.random() * 900000);
      returnNumber = `RET-${randomSix}`;
      const existing = await ReturnRequest.findOne({ returnNumber }).select('_id');
      if (!existing) isUnique = true;
    }
    return returnNumber;
  }

  /**
   * Validates size availability for an exchange
   */
  static async validateExchangeAvailability(productId, newSize) {
    if (!productId || !newSize) {
      throw new Error('Product and requested new size are required for exchange validation.');
    }

    const variant = await ProductVariant.findOne({
      product: productId,
      size: newSize.trim(),
    });

    if (!variant) {
      return {
        isAvailable: false,
        stock: 0,
        message: `Size "${newSize}" is not manufactured for this bespoke piece.`,
      };
    }

    if (variant.stock <= 0) {
      return {
        isAvailable: false,
        stock: 0,
        sku: variant.sku,
        message: `Size "${newSize}" is currently out of stock at the atelier.`,
      };
    }

    return {
      isAvailable: true,
      stock: variant.stock,
      sku: variant.sku,
      variantId: variant._id,
      message: `Size "${newSize}" is reserved and ready for exchange allocation.`,
    };
  }

  /**
   * Customer: Submit Return or Exchange
   * Flow: Order -> Select Product -> Select Reason -> Description -> Submit Return
   */
  static async submitReturnRequest(
    userId,
    { orderNumber, items = [], type = 'Return', pickupAddress = null }
  ) {
    if (!orderNumber || !items || items.length === 0) {
      throw new Error('Order number and at least one garment item are required for return.');
    }

    // 1. Locate Order
    const isObjectId = String(orderNumber).match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: orderNumber, user: userId } : { orderNumber, user: userId };
    const orderDoc = await Order.findOne(query);

    if (!orderDoc) {
      throw new Error(`Order #${orderNumber} not found or unauthorized.`);
    }

    // 2. Validate Items & Exchange availability
    const validatedItems = [];
    let totalRefundAmount = 0;

    for (const itemReq of items) {
      // Find matching item in order
      const matchedOrderItem = orderDoc.items.find(
        (it) =>
          String(it.product) === String(itemReq.productId || itemReq.product) ||
          it.variant?.sku === itemReq.variant?.sku ||
          String(it._id) === String(itemReq.orderItemId)
      );

      if (!matchedOrderItem) {
        throw new Error(`Item ${itemReq.name || 'requested'} was not part of order #${orderDoc.orderNumber}.`);
      }

      const returnReason = itemReq.reason || 'Other';
      const validReasons = [
        'Wrong size',
        'Damaged',
        'Wrong product',
        'Defective',
        'Not as described',
        'Other',
      ];
      if (!validReasons.includes(returnReason)) {
        throw new Error(`Invalid return reason "${returnReason}".`);
      }

      const exchangeData = {
        currentSize: matchedOrderItem.variant?.size || '',
        newSize: itemReq.newSize || '',
        newVariantSku: '',
        isAvailable: false,
      };

      if (type === 'Exchange') {
        if (!itemReq.newSize) {
          throw new Error('Please select a new size for exchange.');
        }

        const avail = await this.validateExchangeAvailability(
          matchedOrderItem.product,
          itemReq.newSize
        );

        if (!avail.isAvailable) {
          throw new Error(avail.message);
        }

        exchangeData.newSize = itemReq.newSize;
        exchangeData.newVariantSku = avail.sku;
        exchangeData.isAvailable = true;
      }

      const qty = Math.min(Number(itemReq.quantity) || 1, matchedOrderItem.quantity);
      const itemRefund = matchedOrderItem.price * qty;
      totalRefundAmount += itemRefund;

      validatedItems.push({
        product: matchedOrderItem.product,
        name: matchedOrderItem.name,
        thumbnail: matchedOrderItem.thumbnail,
        variant: {
          sku: matchedOrderItem.variant.sku,
          size: matchedOrderItem.variant.size,
          color: matchedOrderItem.variant.color,
        },
        price: matchedOrderItem.price,
        quantity: qty,
        reason: returnReason,
        description: itemReq.description || '',
        images: Array.isArray(itemReq.images) ? itemReq.images : [],
        exchangeDetails: exchangeData,
      });
    }

    // 3. Resolve Pickup Address
    const address = pickupAddress || orderDoc.shippingAddress;

    // 4. Generate unique return reference
    const returnNumber = await this.generateReturnNumber();

    // 5. Create Return Request
    const returnDoc = await ReturnRequest.create({
      returnNumber,
      order: orderDoc._id,
      orderNumber: orderDoc.orderNumber,
      user: userId,
      customer: {
        name: orderDoc.customer.name,
        email: orderDoc.customer.email,
        phone: orderDoc.customer.phone,
      },
      type: type === 'Exchange' ? 'Exchange' : 'Return',
      items: validatedItems,
      totalRefundAmount,
      status: 'Requested',
      pickupDetails: {
        address: {
          address: address.address,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
        },
        scheduledDate: null,
        courierName: 'DTDC Reverse Cargo',
        pickupAwb: '',
      },
      history: [
        {
          status: 'Requested',
          timestamp: new Date(),
          note: `${type} request initiated by customer for ${validatedItems.length} garment(s).`,
          updatedBy: orderDoc.customer.name,
        },
      ],
    });

    return returnDoc;
  }

  /**
   * Customer: List my returns & exchanges
   */
  static async getCustomerReturns(userId) {
    return ReturnRequest.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Single return details
   */
  static async getReturnById(identifier, userId = null) {
    const isObjectId = String(identifier).match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: identifier } : { returnNumber: identifier };
    if (userId) query.user = userId;

    const returnDoc = await ReturnRequest.findOne(query).lean();
    if (!returnDoc) throw new Error('Return request not found.');
    return returnDoc;
  }

  /**
   * Admin: List returns with multi-attribute filtering & pagination
   */
  static async getAdminReturns({ page = 1, limit = 15, status = 'all', type = 'all', search = '' }) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.max(1, parseInt(limit, 10));

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { returnNumber: regex },
        { orderNumber: regex },
        { 'customer.name': regex },
        { 'customer.email': regex },
        { 'items.name': regex },
      ];
    }

    const [returns, total] = await Promise.all([
      ReturnRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(take).lean(),
      ReturnRequest.countDocuments(query),
    ]);

    return {
      returns: returns.map((r) => ({
        id: r.returnNumber,
        mongoId: r._id,
        orderId: r.orderNumber,
        customer: r.customer?.name,
        customerEmail: r.customer?.email,
        type: r.type,
        itemCount: r.items?.length || 0,
        items: r.items,
        totalRefundAmount: r.totalRefundAmount,
        reason: r.items?.[0]?.reason || 'Return request',
        status: r.status,
        pickupDetails: r.pickupDetails,
        qualityCheck: r.qualityCheck,
        createdAt: r.createdAt,
        historyCount: r.history?.length || 0,
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
   * Admin: Transition return status through the 9 lifecycle stages:
   * Requested -> UnderReview -> Approved -> Rejected -> PickupScheduled -> Received -> QualityCheck -> RefundApproved -> Refunded
   */
  static async updateReturnStatus(
    identifier,
    {
      status,
      note = '',
      adminName = 'Atelier Reverse Concierge',
      scheduledDate = null,
      courierName = 'DTDC Reverse Logistics',
      pickupAwb = '',
      qualityCheckPassed = null,
      qualityCheckNotes = '',
      rejectionReason = '',
    }
  ) {
    const validStatuses = [
      'Requested',
      'UnderReview',
      'Approved',
      'Rejected',
      'PickupScheduled',
      'Received',
      'QualityCheck',
      'RefundApproved',
      'Refunded',
    ];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`);
    }

    const isObjectId = String(identifier).match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: identifier } : { returnNumber: identifier };
    const returnDoc = await ReturnRequest.findOne(query);

    if (!returnDoc) throw new Error(`Return request #${identifier} not found.`);

    const prevStatus = returnDoc.status;
    returnDoc.status = status;

    // Handle pickup schedule
    if (status === 'PickupScheduled') {
      if (scheduledDate) returnDoc.pickupDetails.scheduledDate = new Date(scheduledDate);
      if (courierName) returnDoc.pickupDetails.courierName = courierName;
      if (pickupAwb) returnDoc.pickupDetails.pickupAwb = pickupAwb;
      else if (!returnDoc.pickupDetails.pickupAwb) {
        returnDoc.pickupDetails.pickupAwb = `REV-${Math.floor(10000000 + Math.random() * 90000000)}`;
      }
    }

    // Handle Quality Check
    if (status === 'QualityCheck' || qualityCheckPassed !== null) {
      returnDoc.qualityCheck = {
        passed: qualityCheckPassed !== null ? qualityCheckPassed : true,
        inspectedAt: new Date(),
        inspectedBy: adminName,
        notes: qualityCheckNotes || 'Fabric, seams, and brand security tags fully intact.',
      };
    }

    // Handle Rejection
    if (status === 'Rejected' && rejectionReason) {
      returnDoc.rejectionReason = rejectionReason;
    }

    // Append to status history
    returnDoc.history.push({
      status,
      timestamp: new Date(),
      note: note || `Status transitioned from ${prevStatus} to ${status} by ${adminName}`,
      updatedBy: adminName,
    });

    // Auto-create or trigger Refund when status moves to RefundApproved or Refunded
    if (status === 'RefundApproved' && returnDoc.type === 'Return') {
      try {
        const existingRefund = await RefundService.findRefundByReturn(returnDoc.returnNumber);
        if (!existingRefund) {
          const refund = await RefundService.createRefund({
            orderNumber: returnDoc.orderNumber,
            returnNumber: returnDoc.returnNumber,
            amount: returnDoc.totalRefundAmount,
            method: 'OriginalPaymentMethod',
            reason: `Return #${returnDoc.returnNumber} inspection approved`,
            adminName,
          });
          returnDoc.refund = refund._id;
        }
      } catch (refundErr) {
        console.warn('Auto refund creation warning:', refundErr.message);
      }
    }

    if (status === 'Refunded') {
      try {
        await RefundService.completeRefundByReturn(returnDoc.returnNumber, adminName);
      } catch (refundErr) {
        console.warn('Auto refund completion warning:', refundErr.message);
      }
    }

    await returnDoc.save();
    return returnDoc;
  }
}
