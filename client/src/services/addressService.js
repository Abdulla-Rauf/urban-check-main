import api from './api';

export const addressService = {
  /**
   * Retrieves all dispatch locations for customer
   */
  async getAddresses() {
    const res = await api.get('/addresses');
    return res.data;
  },

  /**
   * Creates a new address
   */
  async createAddress(addressData) {
    const res = await api.post('/addresses', addressData);
    return res.data;
  },

  /**
   * Updates an address
   */
  async updateAddress(addressId, addressData) {
    const res = await api.put(`/addresses/${addressId}`, addressData);
    return res.data;
  },

  /**
   * Deletes an address
   */
  async deleteAddress(addressId) {
    const res = await api.delete(`/addresses/${addressId}`);
    return res.data;
  },

  /**
   * Sets address as default primary
   */
  async setDefault(addressId) {
    const res = await api.patch(`/addresses/${addressId}/default`);
    return res.data;
  },
};
