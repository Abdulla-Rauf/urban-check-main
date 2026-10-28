import { create } from 'zustand';
import { cartService } from '../services/cartService';

const GUEST_CART_KEY = 'urban_guest_cart';

const loadGuestCart = () => {
  try {
    const saved = localStorage.getItem(GUEST_CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveGuestCart = (items) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save guest cart to localStorage:', err);
  }
};

export const useCartStore = create((set, get) => ({
  items: [],
  totals: {
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    grandTotal: 0,
    totalItems: 0,
    hasUnavailableItems: false,
  },
  isDrawerOpen: false,
  isLoading: false,
  error: null,

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  /**
   * Initializes or refreshes cart from backend (or validates guest local cart)
   */
  fetchCart: async () => {
    const token = localStorage.getItem('urban_customer_token');
    try {
      set({ isLoading: true, error: null });

      if (token) {
        // Authenticated user: retrieve cart from MongoDB
        const res = await cartService.getCart();
        set({
          items: res.items || [],
          totals: res.totals || {
            subtotal: 0,
            discount: 0,
            shipping: 0,
            tax: 0,
            grandTotal: 0,
            totalItems: 0,
            hasUnavailableItems: false,
          },
          isLoading: false,
        });
      } else {
        // Guest user: load from localStorage and calculate verified server prices
        const guestItems = loadGuestCart();
        if (guestItems.length === 0) {
          set({
            items: [],
            totals: {
              subtotal: 0,
              discount: 0,
              shipping: 0,
              tax: 0,
              grandTotal: 0,
              totalItems: 0,
              hasUnavailableItems: false,
            },
            isLoading: false,
          });
          return;
        }

        try {
          const calcRes = await cartService.calculateGuestCart(guestItems);
          set({
            items: calcRes.items || [],
            totals: calcRes.totals || {
              subtotal: 0,
              discount: 0,
              shipping: 0,
              tax: 0,
              grandTotal: 0,
              totalItems: 0,
              hasUnavailableItems: false,
            },
            isLoading: false,
          });
        } catch (calcErr) {
          // Fallback offline calculation if server is temporarily unreachable
          console.warn('Guest cart recalculation fallback:', calcErr);
          const subtotal = guestItems.reduce(
            (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
            0
          );
          const shipping = subtotal >= 2500 || subtotal === 0 ? 0 : 250;
          set({
            items: guestItems,
            totals: {
              subtotal,
              discount: 0,
              shipping,
              tax: Math.round(subtotal * 0.05),
              grandTotal: subtotal + shipping,
              totalItems: guestItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0),
              hasUnavailableItems: false,
            },
            isLoading: false,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      set({ isLoading: false, error: err.message });
    }
  },

  /**
   * Adds an item to the shopping bag with server recalculation
   */
  addItem: async (product, size = 'M', color = 'Standard', quantity = 1, sku = null) => {
    const token = localStorage.getItem('urban_customer_token');
    const productId = product.id || product._id;

    // Locate matching variant from product document if available
    const matchedVariant =
      product.variants?.find((v) => (sku ? v.sku === sku : v.size === size && v.color === color)) ||
      product.variants?.[0];

    const variantSku = sku || matchedVariant?.sku || 'DEFAULT-SKU';
    const variantColor = color || matchedVariant?.color || 'Standard';
    const variantSize = size || matchedVariant?.size || 'M';

    if (token) {
      // Authenticated: Add to MongoDB
      try {
        set({ isLoading: true, isDrawerOpen: true });
        const res = await cartService.addItem({
          productId,
          sku: variantSku,
          size: variantSize,
          color: variantColor,
          quantity,
        });

        set({
          items: res.items || [],
          totals: res.totals,
          isLoading: false,
        });
      } catch (err) {
        console.error('Failed to add item to authenticated cart:', err);
        set({ isLoading: false, error: err.message });
      }
    } else {
      // Guest: Add to localStorage & recalculate
      const currentGuest = loadGuestCart();
      const existingIdx = currentGuest.findIndex(
        (i) =>
          (i.productId === productId || i.product === productId) &&
          (i.variant?.sku === variantSku ||
            (i.variant?.size === variantSize && i.variant?.color === variantColor))
      );

      if (existingIdx > -1) {
        currentGuest[existingIdx].quantity += quantity;
      } else {
        currentGuest.push({
          product: productId,
          productId,
          variant: {
            sku: variantSku,
            size: variantSize,
            color: variantColor,
          },
          quantity,
          name: product.name,
          slug: product.slug,
          brand: typeof product.brand === 'object' ? product.brand?.name : product.brand,
          thumbnail: product.thumbnail || product.images?.[0] || product.image,
          price: matchedVariant?.salePrice || matchedVariant?.price || product.price,
        });
      }

      saveGuestCart(currentGuest);
      set({ isDrawerOpen: true });
      await get().fetchCart();
    }
  },

  /**
   * Updates an item's quantity
   */
  updateQuantity: async (itemId, quantity) => {
    const token = localStorage.getItem('urban_customer_token');

    if (token) {
      try {
        const res = await cartService.updateQuantity(itemId, quantity);
        set({
          items: res.items || [],
          totals: res.totals,
        });
      } catch (err) {
        console.error('Failed to update quantity:', err);
      }
    } else {
      // Guest local update
      let currentGuest = loadGuestCart();
      if (quantity <= 0) {
        currentGuest = currentGuest.filter(
          (i, idx) => i._id !== itemId && String(idx) !== String(itemId)
        );
      } else {
        currentGuest = currentGuest.map((i, idx) => {
          if (i._id === itemId || String(idx) === String(itemId)) {
            return { ...i, quantity };
          }
          return i;
        });
      }
      saveGuestCart(currentGuest);
      await get().fetchCart();
    }
  },

  /**
   * Removes an item from the shopping bag
   */
  removeItem: async (itemId) => {
    const token = localStorage.getItem('urban_customer_token');

    if (token) {
      try {
        const res = await cartService.removeItem(itemId);
        set({
          items: res.items || [],
          totals: res.totals,
        });
      } catch (err) {
        console.error('Failed to remove item:', err);
      }
    } else {
      let currentGuest = loadGuestCart();
      currentGuest = currentGuest.filter(
        (i, idx) => i._id !== itemId && String(idx) !== String(itemId)
      );
      saveGuestCart(currentGuest);
      await get().fetchCart();
    }
  },

  /**
   * Clears entire shopping bag
   */
  clearCart: async () => {
    const token = localStorage.getItem('urban_customer_token');

    if (token) {
      try {
        const res = await cartService.clearCart();
        set({
          items: res.items || [],
          totals: res.totals,
        });
      } catch (err) {
        console.error('Failed to clear cart:', err);
      }
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
      set({
        items: [],
        totals: {
          subtotal: 0,
          discount: 0,
          shipping: 0,
          tax: 0,
          grandTotal: 0,
          totalItems: 0,
          hasUnavailableItems: false,
        },
      });
    }
  },

  /**
   * Synchronizes guest cart into authenticated user cart upon login
   */
  syncWithServer: async () => {
    const guestItems = loadGuestCart();
    try {
      set({ isLoading: true });
      const res = await cartService.syncCart(guestItems);
      // Once successfully merged into user's MongoDB cart, clear local guest store
      localStorage.removeItem(GUEST_CART_KEY);
      set({
        items: res.items || [],
        totals: res.totals,
        isLoading: false,
      });
    } catch (err) {
      console.error('Cart sync error:', err);
      set({ isLoading: false });
    }
  },

  /**
   * Quick getters
   */
  getTotalItems: () => {
    const totals = get().totals;
    if (totals?.totalItems != null && totals.totalItems > 0) return totals.totalItems;
    return get().items.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  },

  getSubtotal: () => {
    const totals = get().totals;
    if (totals?.subtotal != null) return totals.subtotal;
    return get().items.reduce(
      (acc, curr) => acc + (curr.unitPrice || curr.price || 0) * (curr.quantity || 1),
      0
    );
  },
}));
