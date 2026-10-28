import { adminApi } from './api.js';

export const returnService = {
  async getReturns(params = {}) {
    const res = await adminApi.get('/admin/returns', { params });
    return res.data || { returns: [], pagination: { total: 0 } };
  },

  async updateStatus(id, data) {
    const res = await adminApi.patch(`/admin/returns/${id}/status`, data);
    return res.data;
  },

  async validateExchange(productId, size) {
    const res = await adminApi.get('/admin/returns/validate-exchange', {
      params: { productId, size },
    });
    return res.data;
  },
};
