import adminApi from './api';

export const marketingService = {
  // Banners
  getBanners: async () => {
    const res = await adminApi.get('/admin/banners');
    return res.data || [];
  },
  createBanner: async (data) => {
    const res = await adminApi.post('/admin/banners', data);
    return res.data;
  },
  updateBanner: async (id, data) => {
    const res = await adminApi.patch(`/admin/banners/${id}`, data);
    return res.data;
  },
  deleteBanner: async (id) => {
    const res = await adminApi.delete(`/admin/banners/${id}`);
    return res.data;
  },

  // Offers
  getOffers: async () => {
    const res = await adminApi.get('/admin/offers');
    return res.data || [];
  },
  createOffer: async (data) => {
    const res = await adminApi.post('/admin/offers', data);
    return res.data;
  },
  updateOffer: async (id, data) => {
    const res = await adminApi.patch(`/admin/offers/${id}`, data);
    return res.data;
  },
  deleteOffer: async (id) => {
    const res = await adminApi.delete(`/admin/offers/${id}`);
    return res.data;
  },

  // Coupons
  getCoupons: async (params) => {
    const res = await adminApi.get('/admin/coupons', { params });
    return res.data || [];
  },
  createCoupon: async (data) => {
    const res = await adminApi.post('/admin/coupons', data);
    return res.data;
  },
  updateCoupon: async (id, data) => {
    const res = await adminApi.patch(`/admin/coupons/${id}`, data);
    return res.data;
  },
  deleteCoupon: async (id) => {
    const res = await adminApi.delete(`/admin/coupons/${id}`);
    return res.data;
  },
};
