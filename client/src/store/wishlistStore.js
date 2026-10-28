import { create } from 'zustand';
import { wishlistService } from '../services/wishlistService';
import { useCartStore } from './cartStore';

const GUEST_WISHLIST_KEY = 'urban_guest_wishlist';

const loadGuestWishlist = () => {
  try {
    const saved = localStorage.getItem(GUEST_WISHLIST_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveGuestWishlist = (items) => {
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save guest wishlist:', err);
  }
};

export const useWishlistStore = create((set, get) => ({
  // Array of populated product objects or ID strings
  products: [],
  // Fast ID set for heart toggle state
  itemIds: loadGuestWishlist(),
  isLoading: false,

  /**
   * Initializes or fetches wishlist
   */
  fetchWishlist: async () => {
    const token = localStorage.getItem('urban_customer_token');
    if (token) {
      try {
        set({ isLoading: true });
        const res = await wishlistService.getWishlist();
        const prods = res.products || [];
        const ids = prods.map((p) => (p._id || p.id).toString());
        set({
          products: prods,
          itemIds: ids,
          isLoading: false,
        });
      } catch (err) {
        console.error('Failed to load authenticated wishlist:', err);
        set({ isLoading: false });
      }
    } else {
      const ids = loadGuestWishlist();
      set({ itemIds: ids });
    }
  },

  /**
   * Toggles product in wishlist
   */
  toggleWishlist: async (productOrId) => {
    const token = localStorage.getItem('urban_customer_token');
    const productId = typeof productOrId === 'object' ? (productOrId._id || productOrId.id) : productOrId;
    if (!productId) return;

    const idStr = productId.toString();
    const { itemIds, products } = get();
    const isCurrentlySaved = itemIds.includes(idStr);

    if (token) {
      try {
        // Optimistic UI update
        const nextIds = isCurrentlySaved
          ? itemIds.filter((id) => id !== idStr)
          : [...itemIds, idStr];
        set({ itemIds: nextIds });

        const res = await wishlistService.toggleWishlist(idStr);
        const prods = res.products || [];
        set({
          products: prods,
          itemIds: prods.map((p) => (p._id || p.id).toString()),
        });
      } catch (err) {
        console.error('Wishlist toggle error:', err);
        // Rollback
        get().fetchWishlist();
      }
    } else {
      // Guest local toggle
      let nextIds;
      let nextProducts = [...products];

      if (isCurrentlySaved) {
        nextIds = itemIds.filter((id) => id !== idStr);
        nextProducts = nextProducts.filter((p) => (p._id || p.id).toString() !== idStr);
      } else {
        nextIds = [...itemIds, idStr];
        if (typeof productOrId === 'object') {
          nextProducts.push(productOrId);
        }
      }

      saveGuestWishlist(nextIds);
      set({ itemIds: nextIds, products: nextProducts });
    }
  },

  /**
   * Removes product from wishlist
   */
  removeFromWishlist: async (productId) => {
    const token = localStorage.getItem('urban_customer_token');
    const idStr = productId.toString();

    if (token) {
      try {
        const res = await wishlistService.removeFromWishlist(idStr);
        const prods = res.products || [];
        set({
          products: prods,
          itemIds: prods.map((p) => (p._id || p.id).toString()),
        });
      } catch (err) {
        console.error('Failed to remove from wishlist:', err);
      }
    } else {
      const nextIds = get().itemIds.filter((id) => id !== idStr);
      const nextProducts = get().products.filter((p) => (p._id || p.id).toString() !== idStr);
      saveGuestWishlist(nextIds);
      set({ itemIds: nextIds, products: nextProducts });
    }
  },

  /**
   * Moves a wishlisted garment into the shopping bag
   */
  moveToCart: async (product, size = 'M', color = 'Standard') => {
    const token = localStorage.getItem('urban_customer_token');
    const productId = product.id || product._id;

    if (token) {
      try {
        set({ isLoading: true });
        const res = await wishlistService.moveToCart({
          productId,
          size,
          color,
          quantity: 1,
        });

        // Update cart store with returned cart
        useCartStore.setState({
          items: res.cart.items || [],
          totals: res.cart.totals,
          isDrawerOpen: true,
        });

        // Update wishlist store
        const prods = res.wishlist.products || [];
        set({
          products: prods,
          itemIds: prods.map((p) => (p._id || p.id).toString()),
          isLoading: false,
        });
      } catch (err) {
        console.error('Move to cart error:', err);
        set({ isLoading: false });
      }
    } else {
      // Guest: Add to Cart and Remove from Wishlist
      await useCartStore.getState().addItem(product, size, color, 1);
      get().removeFromWishlist(productId);
    }
  },

  /**
   * Synchronizes guest wishlist IDs into user account upon login
   */
  syncWithServer: async () => {
    const guestIds = loadGuestWishlist();
    if (guestIds.length === 0) {
      await get().fetchWishlist();
      return;
    }

    try {
      set({ isLoading: true });
      const res = await wishlistService.syncWishlist(guestIds);
      localStorage.removeItem(GUEST_WISHLIST_KEY);
      const prods = res.products || [];
      set({
        products: prods,
        itemIds: prods.map((p) => (p._id || p.id).toString()),
        isLoading: false,
      });
    } catch (err) {
      console.error('Wishlist sync error:', err);
      set({ isLoading: false });
    }
  },

  isInWishlist: (productId) => {
    if (!productId) return false;
    return get().itemIds.includes(productId.toString());
  },

  getCount: () => get().itemIds.length,
}));
