import { BaseShippingProvider } from './base.provider.js';

/**
 * Generic Courier / Local Fleet Provider
 * Used as a reliable built-in fallback and for local direct fleet dispatches.
 */
export class GenericCourierProvider extends BaseShippingProvider {
  constructor() {
    super('GenericCourier', 'Generic Courier (Boutique Delivery)', {});
  }

  isConfigured() {
    return true; // Always operational without external API keys
  }

  /**
   * Generates a generic Waybill / AWB Number
   * Format: UC- + 8 numeric digits
   */
  generateAwb() {
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    return `UC${randomDigits}`;
  }

  /**
   * Generates tracking URL
   */
  getTrackingUrl(awb) {
    return `https://urbancheck.com/track?awb=${awb}`;
  }

  /**
   * Create shipment with Generic Courier
   */
  async createShipment({
    orderNumber,
    destination,
    customer,
    items = [],
    weightKg = 0.8,
    originHub = 'Urban Check Atelier Mumbai Dispatch',
  }) {
    const awb = this.generateAwb();
    const cleanOrderNum = String(orderNumber).replace(/[^A-Za-z0-9]/g, '');
    const shipmentId = `SHP-GEN-${cleanOrderNum}`;
    const trackingUrl = this.getTrackingUrl(awb);

    const now = new Date();
    const estimatedDelivery = new Date(now);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 4);

    const trackingEvents = [
      {
        status: 'Order Placed',
        date: this.formatDate(now),
        time: this.formatTime(now),
        location: 'Urban Check Online Concierge',
        description: `Order #${orderNumber} registered and order payment confirmed.`,
        timestamp: now,
      },
      {
        status: 'Confirmed',
        date: this.formatDate(now),
        time: this.formatTime(now),
        location: originHub,
        description: `Dispatch scheduled with Generic Courier partner. Waybill #${awb} created.`,
        timestamp: now,
      },
    ];

    return {
      courier: this.name,
      carrierName: this.displayName,
      awb,
      shipmentId,
      trackingUrl,
      status: 'Confirmed',
      estimatedDelivery,
      pickupDate: null,
      deliveryDate: null,
      trackingEvents,
      packageDetails: {
        weightKg: Number(weightKg) || 0.8,
        itemCount: items.length || 1,
      },
    };
  }

  /**
   * Track shipment
   */
  async trackShipment(awb) {
    return {
      courier: this.name,
      carrierName: this.displayName,
      awb,
      trackingUrl: this.getTrackingUrl(awb),
    };
  }

  /**
   * Update tracking status and append new milestone event
   */
  async updateTracking(awb, { status, location, description, date, time }) {
    const now = new Date();
    const eventDate = date || this.formatDate(now);
    const eventTime = time || this.formatTime(now);

    const defaultLocations = {
      Packed: 'Urban Check Atelier Fulfillment Center, Mumbai',
      Shipped: 'Urban Check Central Dispatch Terminal, Mumbai',
      'Out for Delivery': location || 'Local Delivery Agent',
      Delivered: location || 'Patron Receiving Address',
      Cancelled: 'Urban Check Concierge Operations',
    };

    const defaultDescriptions = {
      Packed: 'Garments steamed, verified against order, and packed in luxury packaging.',
      Shipped: 'Parcel dispatched from central fulfillment facility with courier driver.',
      'Out for Delivery': 'Parcel is with local courier associate for delivery today.',
      Delivered: 'Parcel handed over to recipient. Delivery confirmed.',
      Cancelled: 'Shipment cancelled by atelier.',
    };

    const newEvent = {
      status,
      date: eventDate,
      time: eventTime,
      location: location || defaultLocations[status] || 'Regional Logistics Hub',
      description: description || defaultDescriptions[status] || `Status updated to ${status}.`,
      timestamp: now,
    };

    return {
      status,
      event: newEvent,
      pickupDate: status === 'Shipped' ? now : undefined,
      deliveryDate: status === 'Delivered' ? now : undefined,
    };
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(awb, reason = 'Administrative cancellation') {
    const now = new Date();
    return {
      success: true,
      status: 'Cancelled',
      cancelledAt: now,
      message: `Consignment #${awb} cancelled successfully. Reason: ${reason}`,
      event: {
        status: 'Cancelled',
        date: this.formatDate(now),
        time: this.formatTime(now),
        location: 'Urban Check Concierge Operations',
        description: `Shipment cancelled. ${reason}`,
        timestamp: now,
      },
    };
  }
}
