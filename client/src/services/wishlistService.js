import api from './api';

export const wishlistService = {
  /**
   * Fetches the user's wishlist populated with product details
   */
  async getWishlist() {
    const res = await api.get('/wishlist');
    return res.data;
  },

  /**
   * Toggles product in user's wishlist
   */
  async toggleWishlist(productId) {
    const res = await api.post('/wishlist/toggle', { productId });
    return res.data;
  },

  /**
   * Removes product from wishlist
   */
  async removeFromWishlist(productId) {
    const res = await api.delete(`/wishlist/${productId}`);
    return res.data;
  },

  /**
   * Moves product from wishlist to shopping bag
   */
  async moveToCart({ productId, sku, size, color, quantity = 1 }) {
    const res = await api.post('/wishlist/move-to-cart', {
      productId,
      sku,
      size,
      color,
      quantity,
    });
    return res.data;
  },

  /**
   * Synchronizes guest wishlist IDs into user account
   */
  async syncWishlist(productIds) {
    const res = await api.post('/wishlist/sync', { productIds });
    return res.data;
  },
};
