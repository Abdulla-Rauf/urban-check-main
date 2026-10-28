import api from './api.js';

export const returnService = {
  /**
   * Submit return or exchange request
   */
  async submitReturn(data) {
    const res = await api.post('/returns/request', data);
    return res.data;
  },

  /**
   * Validate if requested size is available for exchange
   */
  async validateExchange(productId, size) {
    const res = await api.get('/returns/validate-exchange', {
      params: { productId, size },
    });
    return res.data;
  },

  /**
   * Get all returns and exchanges for the authenticated customer
   */
  async getMyReturns() {
    const res = await api.get('/returns');
    return res.data || [];
  },

  /**
   * Get details of a single return request
   */
  async getReturnDetails(id) {
    const res = await api.get(`/returns/${id}`);
    return res.data;
  },
};
