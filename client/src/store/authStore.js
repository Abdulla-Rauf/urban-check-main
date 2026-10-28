import { create } from 'zustand';
import { authService } from '../services/authService';
import { useCartStore } from './cartStore';
import { useWishlistStore } from './wishlistStore';
import { useBrowseStore } from './browseStore';

const syncCustomerData = () => {
  try {
    useCartStore.getState().syncWithServer();
    useWishlistStore.getState().syncWithServer();
    useBrowseStore.getState().syncWithServer();
  } catch (err) {
    console.warn('Customer data synchronization notice:', err);
  }
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('urban_customer_token') || null,
  isAuthenticated: !!localStorage.getItem('urban_customer_token'),
  isLoading: false,
  error: null,

  /**
   * Initializes user session from stored token or refresh cookie
   */
  initializeAuth: async () => {
    const token = localStorage.getItem('urban_customer_token');
    if (!token) {
      useCartStore.getState().fetchCart();
      useWishlistStore.getState().fetchWishlist();
      return;
    }

    try {
      set({ isLoading: true });
      const user = await authService.getMe();
      if (user) {
        set({ user, isAuthenticated: true, isLoading: false, error: null });
        syncCustomerData();
      }
    } catch (err) {
      localStorage.removeItem('urban_customer_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      useCartStore.getState().fetchCart();
      useWishlistStore.getState().fetchWishlist();
    }
  },

  /**
   * Log in user with email and password
   */
  login: async ({ email, password }) => {
    try {
      set({ isLoading: true, error: null });
      const data = await authService.login({ email, password });
      const { user, accessToken } = data;

      if (accessToken) {
        localStorage.setItem('urban_customer_token', accessToken);
      }

      set({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Synchronize guest cart, wishlist, and browsing history into user account
      syncCustomerData();

      return { success: true, user };
    } catch (err) {
      const message = err.message || 'Authentication failed. Please verify credentials.';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  /**
   * Register a new client user
   */
  register: async ({ name, email, phone, password }) => {
    try {
      set({ isLoading: true, error: null });
      const data = await authService.register({ name, email, phone, password });
      const { user, accessToken } = data;

      if (accessToken) {
        localStorage.setItem('urban_customer_token', accessToken);
      }

      set({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Synchronize guest cart, wishlist, and browsing history
      syncCustomerData();

      return { success: true, user, devVerificationToken: data.devVerificationToken };
    } catch (err) {
      const message = err.message || 'Registration failed. Please check inputs.';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  /**
   * Log out current user
   */
  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout();
    } catch (err) {
      console.warn('Logout notice:', err.message);
    } finally {
      localStorage.removeItem('urban_customer_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      useCartStore.getState().fetchCart();
      useWishlistStore.getState().fetchWishlist();
    }
  },

  clearError: () => set({ error: null }),
}));
