import api from './api.js';

export const reviewService = {
  /**
   * Submit a verified customer review
   */
  async submitReview(data) {
    const res = await api.post('/reviews', data);
    return res.data;
  },

  /**
   * Get approved reviews for a product with ratings breakdown
   */
  async getProductReviews(idOrSlug, params = {}) {
    const res = await api.get(`/reviews/product/${idOrSlug}`, { params });
    return res.data;
  },

  /**
   * Check if current customer has purchased this product and can review
   */
  async checkCanReview(productId) {
    try {
      const res = await api.get(`/reviews/can-review/${productId}`);
      return res.data;
    } catch {
      return { canReview: false };
    }
  },

  /**
   * Get all reviews submitted by the authenticated customer
   */
  async getMyReviews() {
    const res = await api.get('/reviews/my-reviews');
    return res.data || [];
  },

  /**
   * Vote a review as helpful
   */
  async voteHelpful(reviewId) {
    const res = await api.post(`/reviews/${reviewId}/helpful`);
    return res.data;
  },
};

