import api from './api';

export const recentlyViewedService = {
  /**
   * Fetches recently viewed products for authenticated user
   */
  async getRecentlyViewed(limit = 15) {
    const res = await api.get(`/users/recently-viewed?limit=${limit}`);
    return res.data;
  },

  /**
   * Records a product view for authenticated user
   */
  async recordView(productId, slug) {
    const res = await api.post('/users/recently-viewed', { productId, slug });
    return res.data;
  },

  /**
   * Synchronizes guest recently viewed items into user account
   */
  async syncRecentlyViewed(items) {
    const res = await api.post('/users/recently-viewed/sync', { items });
    return res.data;
  },
};
