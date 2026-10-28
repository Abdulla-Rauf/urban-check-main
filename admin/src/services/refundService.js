import { adminApi } from './api.js';

export const refundService = {
  async getRefunds(params = {}) {
    const res = await adminApi.get('/admin/refunds', { params });
    return res.data || { refunds: [], pagination: { total: 0 } };
  },

  async createRefund(data) {
    const res = await adminApi.post('/admin/refunds/create', data);
    return res.data;
  },

  async processRefund(id, data) {
    const res = await adminApi.post(`/admin/refunds/${id}/process`, data);
    return res.data;
  },
};
