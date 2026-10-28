import api from './api';

export const orderService = {
  /**
   * Places an order with verified inventory deduction and address snapshots
   */
  async checkout(orderPayload) {
    const res = await api.post('/orders/checkout', orderPayload);
    return res.data;
  },

  /**
   * Retrieves all orders for the authenticated customer
   */
  async getUserOrders() {
    const res = await api.get('/orders');
    return res.data;
  },

  /**
   * Retrieves single order by human-readable orderNumber or ID
   */
  async getOrder(identifier) {
    const res = await api.get(`/orders/${encodeURIComponent(identifier)}`);
    return res.data;
  },

  /**
   * Cancels an order if eligible (Pending, Confirmed, Processing)
   */
  async cancelOrder(identifier, reason = 'Customer request') {
    const res = await api.post(`/orders/${encodeURIComponent(identifier)}/cancel`, { reason });
    return res.data;
  },

  /**
   * Retrieves tracking history for an order number or carrier AWB
   */
  async getTracking(identifier) {
    const res = await api.get(`/orders/track/${encodeURIComponent(identifier)}`);
    return res.data;
  },

  /**
   * Verifies online payment gateway signature server-side
   */
  async verifyPayment(identifier, paymentData) {
    const res = await api.post(`/orders/${encodeURIComponent(identifier)}/verify-payment`, paymentData);
    return res.data;
  },
};

