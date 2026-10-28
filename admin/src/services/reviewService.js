import { adminApi } from './api.js';

export const reviewService = {
  async getReviews(params = {}) {
    const res = await adminApi.get('/admin/reviews', { params });
    return res.data || { reviews: [], pagination: { total: 0 } };
  },

  async updateStatus(id, { status, adminReply }) {
    const res = await adminApi.patch(`/admin/reviews/${id}/status`, { status, adminReply });
    return res.data;
  },

  async deleteReview(id) {
    const res = await adminApi.delete(`/admin/reviews/${id}`);
    return res.data;
  },
};
