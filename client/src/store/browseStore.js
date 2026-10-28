import { create } from 'zustand';
import { RECENT_SEARCHES_DEFAULT } from '../constants';
import { recentlyViewedService } from '../services/recentlyViewedService';

const GUEST_RECENTLY_VIEWED_KEY = 'urban_recently_viewed';

export const useBrowseStore = create((set, get) => ({
  recentSearches: (() => {
    try {
      const saved = localStorage.getItem('urban_recent_searches');
      return saved ? JSON.parse(saved) : RECENT_SEARCHES_DEFAULT;
    } catch {
      return RECENT_SEARCHES_DEFAULT;
    }
  })(),

  recentlyViewed: (() => {
    try {
      const saved = localStorage.getItem(GUEST_RECENTLY_VIEWED_KEY);
      return saved ? JSON.parse(saved) : ['tailored-structured-blazer', 'pleated-wool-wide-leg-trousers'];
    } catch {
      return ['tailored-structured-blazer', 'pleated-wool-wide-leg-trousers'];
    }
  })(),

  // Array of hydrated recently viewed product documents
  recentlyViewedProducts: [],
  isLoadingRecent: false,

  addRecentSearch: (query) => {
    if (!query || !query.trim()) return;
    const clean = query.trim().toLowerCase();
    const current = get().recentSearches.filter((item) => item.toLowerCase() !== clean);
    const updated = [clean, ...current].slice(0, 8);
    localStorage.setItem('urban_recent_searches', JSON.stringify(updated));
    set({ recentSearches: updated });
  },

  removeRecentSearch: (query) => {
    const updated = get().recentSearches.filter((item) => item.toLowerCase() !== query.toLowerCase());
    localStorage.setItem('urban_recent_searches', JSON.stringify(updated));
    set({ recentSearches: updated });
  },

  clearRecentSearches: () => {
    localStorage.removeItem('urban_recent_searches');
    set({ recentSearches: [] });
  },

  /**
   * Records a product view (localStorage for guest, MongoDB for authenticated)
   */
  addRecentlyViewed: async (productIdOrSlug) => {
    if (!productIdOrSlug) return;
    const token = localStorage.getItem('urban_customer_token');

    // Update local guest list (capped at 15 items)
    const current = get().recentlyViewed.filter((s) => s !== productIdOrSlug);
    const updated = [productIdOrSlug, ...current].slice(0, 15);
    localStorage.setItem(GUEST_RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    set({ recentlyViewed: updated });

    if (token) {
      try {
        await recentlyViewedService.recordView(productIdOrSlug, productIdOrSlug);
      } catch (err) {
        console.warn('Failed to record recently viewed on server:', err.message);
      }
    }
  },

  /**
   * Fetches recently viewed products
   */
  fetchRecentlyViewed: async () => {
    const token = localStorage.getItem('urban_customer_token');
    if (token) {
      try {
        set({ isLoadingRecent: true });
        const items = await recentlyViewedService.getRecentlyViewed(15);
        set({ recentlyViewedProducts: items || [], isLoadingRecent: false });
      } catch (err) {
        console.warn('Failed to fetch server recently viewed:', err.message);
        set({ isLoadingRecent: false });
      }
    }
  },

  /**
   * Synchronizes guest recently viewed items into user account upon login
   */
  syncWithServer: async () => {
    const guestItems = get().recentlyViewed;
    if (guestItems.length === 0) return;

    try {
      const items = await recentlyViewedService.syncRecentlyViewed(guestItems);
      if (items && items.length > 0) {
        set({ recentlyViewedProducts: items });
      }
    } catch (err) {
      console.warn('Recently viewed sync notice:', err.message);
    }
  },
}));
