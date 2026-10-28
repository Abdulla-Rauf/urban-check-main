import api from './api';

export const authService = {
  /**
   * Register a new client account
   */
  async register({ name, email, phone, password }) {
    const res = await api.post('/auth/register', { name, email, phone, password });
    return res.data;
  },

  /**
   * Authenticate client credentials
   */
  async login({ email, password }) {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  /**
   * Sign out and revoke active session
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('urban_customer_token');
    }
  },

  /**
   * Fetch currently authenticated profile
   */
  async getMe() {
    const res = await api.get('/users/me');
    return res.data?.user;
  },

  /**
   * Dispatch password reset link
   */
  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email });
    return res;
  },

  /**
   * Reset password with token
   */
  async resetPassword({ token, newPassword }) {
    const res = await api.post('/auth/reset-password', { token, newPassword });
    return res;
  },

  /**
   * Verify email address with token
   */
  async verifyEmail(token) {
    const res = await api.get(`/auth/verify-email?token=${token}`);
    return res;
  },
};
