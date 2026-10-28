import api from './api';

export const cartService = {
  /**
   * Fetches the user's active shopping bag with server-recalculated totals
   */
  async getCart() {
    const res = await api.get('/cart');
    return res.data;
  },

  /**
   * Adds an item to the user's shopping bag
   */
  async addItem({ productId, sku, size, color, quantity = 1 }) {
    const res = await api.post('/cart/add', {
      productId,
      sku,
      size,
      color,
      quantity,
    });
    return res.data;
  },

  /**
   * Updates an item's quantity in the shopping bag
   */
  async updateQuantity(itemId, quantity) {
    const res = await api.put(`/cart/items/${itemId}`, { quantity });
    return res.data;
  },

  /**
   * Removes an item from the shopping bag
   */
  async removeItem(itemId) {
    const res = await api.delete(`/cart/items/${itemId}`);
    return res.data;
  },

  /**
   * Clears the shopping bag
   */
  async clearCart() {
    const res = await api.delete('/cart');
    return res.data;
  },

  /**
   * Synchronizes guest items into the user's account upon login
   */
  async syncCart(guestItems) {
    const res = await api.post('/cart/sync', { items: guestItems });
    return res.data;
  },

  /**
   * Recalculates guest cart items against live catalog prices and stock
   */
  async calculateGuestCart(guestItems) {
    const res = await api.post('/cart/calculate', { items: guestItems });
    return res.data;
  },
};
