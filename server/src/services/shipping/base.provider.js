/**
 * Base Shipping Provider Interface
 * All courier providers (DTDC, Delhivery, GenericCourier) implement this contract.
 */
export class BaseShippingProvider {
  constructor(name, displayName, config = {}) {
    this._name = name;
    this._displayName = displayName;
    this.config = config;
  }

  get name() {
    return this._name;
  }

  get displayName() {
    return this._displayName;
  }

  /**
   * Check whether live courier credentials are configured in environment variables
   */
  isConfigured() {
    return false;
  }

  /**
   * Formats Date into readable standard string, e.g. "24 Sep 2026"
   */
  formatDate(date = new Date()) {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Formats Date into 12-hour time string, e.g. "11:51 AM"
   */
  formatTime(date = new Date()) {
    const d = new Date(date);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Generates initial tracking events for an order/consignment
   */
  createInitialEvents(orderNumber, originLocation = 'Urban Check Atelier Dispatch') {
    const now = new Date();
    return [
      {
        status: 'Order Placed',
        date: this.formatDate(now),
        time: this.formatTime(now),
        location: 'Urban Check Online Concierge',
        description: `Order #${orderNumber} placed and payment authorization recorded.`,
        timestamp: now,
      },
      {
        status: 'Confirmed',
        date: this.formatDate(now),
        time: this.formatTime(now),
        location: originLocation,
        description: `Order confirmed and manifest registered with ${this.displayName}.`,
        timestamp: now,
      },
    ];
  }

  /**
   * Abstract Methods
   */
  async createShipment(/* { orderNumber, destination, customer, items, weight, pickupDate } */) {
    throw new Error(`createShipment() must be implemented by ${this.constructor.name}`);
  }

  async trackShipment(/* awbOrShipmentId */) {
    throw new Error(`trackShipment() must be implemented by ${this.constructor.name}`);
  }

  async updateTracking(/* awbOrShipmentId, { status, location, description, date, time } */) {
    throw new Error(`updateTracking() must be implemented by ${this.constructor.name}`);
  }

  async cancelShipment(/* awbOrShipmentId, reason */) {
    throw new Error(`cancelShipment() must be implemented by ${this.constructor.name}`);
  }
}
