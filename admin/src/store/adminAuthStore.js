import { create } from 'zustand';

export const useAdminAuthStore = create((set) => ({
  admin: {
    id: 'adm_001',
    name: 'Elena Rostova',
    email: 'admin@urbancheck.com',
    role: 'Super Admin',
    permissions: ['*'],
  },
  token: localStorage.getItem('urban_admin_token') || 'mock_admin_jwt_token_secure_99999',
  isAuthenticated: true,

  login: (adminData, token) => {
    localStorage.setItem('urban_admin_token', token);
    set({ admin: adminData, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('urban_admin_token');
    set({ admin: null, token: null, isAuthenticated: false });
  },
}));
