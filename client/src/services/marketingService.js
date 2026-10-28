import api from './api';

export const marketingService = {
  /**
   * Fetches active banners for homepage display
   */
  getActiveBanners: async () => {
    try {
      const res = await api.get('/banners/active');
      return res.data || [];
    } catch (err) {
      console.warn('Failed to load active marketing banners:', err);
      return [];
    }
  },

  /**
   * Fetches active promotional offers
   */
  getActiveOffers: async () => {
    try {
      const res = await api.get('/offers/active');
      return res.data || [];
    } catch (err) {
      console.warn('Failed to load active promotional offers:', err);
      return [];
    }
  },

  /**
   * Validates coupon code strictly on the server
   */
  validateCoupon: async ({ couponCode, cartItems = [], subtotal = 0 }) => {
    const res = await api.post('/coupons/validate', {
      couponCode,
      cartItems,
      subtotal,
    });
    return res.data;
  },
};
