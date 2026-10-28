import api from './api';

export const productService = {
  /**
   * Fetches products with server-side filtering, sorting, and pagination
   */
  async getProducts(params = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            searchParams.append(key, value.join(','));
          }
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    const res = await api.get(endpoint);
    return res.data;
  },

  /**
   * Fetches full product details by slug
   */
  async getProductBySlug(slug) {
    if (!slug) return null;
    const res = await api.get(`/products/${encodeURIComponent(slug)}`);
    return res.data;
  },

  /**
   * Fetches all categories
   */
  async getCategories(tree = false) {
    const endpoint = tree ? '/categories?tree=true' : '/categories';
    const res = await api.get(endpoint);
    return res.data;
  },

  /**
   * Fetches all brands
   */
  async getBrands() {
    const res = await api.get('/brands');
    return res.data;
  },

  /**
   * Fetches fast cached search suggestions
   */
  async getSearchSuggestions(query, limit = 5) {
    if (!query || !query.trim()) return [];
    const res = await api.get(`/products/search/suggestions?q=${encodeURIComponent(query.trim())}&limit=${limit}`);
    return res.data?.data?.suggestions || res.data?.suggestions || [];
  },

  /**
   * Fetches popular products
   */
  async getPopularProducts(limit = 8) {
    const res = await api.get(`/products/popular?limit=${limit}`);
    return res.data?.data?.products || res.data?.products || [];
  },

  /**
   * Fetches trending products
   */
  async getTrendingProducts(limit = 8) {
    const res = await api.get(`/products/trending?limit=${limit}`);
    return res.data?.data?.products || res.data?.products || [];
  },

  /**
   * Fetches aggregated cached homepage payload
   */
  async getHomepageData() {
    const res = await api.get('/products/homepage');
    return res.data?.data || res.data;
  },
};
