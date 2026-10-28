import { adminApi } from './api.js';

export const shippingService = {
  /**
   * List available courier providers and their credential status
   */
  async getCouriers() {
    const res = await adminApi.get('/admin/shipping/couriers');
    return res.data || [];
  },

  /**
   * Paginated list of shipments with multi-courier filter & search
   */
  async getShipments(params = {}) {
    const res = await adminApi.get('/admin/shipping', { params });
    return res.data || { shipments: [], pagination: { total: 0 } };
  },

  /**
   * List orders eligible for booking a courier shipment
   */
  async getPendingOrders() {
    const res = await adminApi.get('/admin/shipping/pending-orders');
    return res.data || [];
  },

  /**
   * Create shipment, select courier, generate AWB
   */
  async createShipment(data) {
    const res = await adminApi.post('/admin/shipping/create', data);
    return res.data;
  },

  /**
   * Update tracking milestone, date, time, location and description
   */
  async updateTracking(data) {
    const res = await adminApi.post('/admin/shipping/update-tracking', data);
    return res.data;
  },

  /**
   * Cancel courier shipment
   */
  async cancelShipment(identifier, reason = '') {
    const res = await adminApi.post('/admin/shipping/cancel', { identifier, reason });
    return res.data;
  },

  /**
   * Fetch full tracking history for a shipment
   */
  async getTrackingHistory(identifier) {
    const res = await adminApi.get(`/admin/shipping/${identifier}/tracking`);
    return res.data;
  },
};
