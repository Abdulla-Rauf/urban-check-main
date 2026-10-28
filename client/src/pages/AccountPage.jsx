import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, Heart, Shield, ArrowRight, ShoppingBag, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { useBrowseStore } from '../store/browseStore';
import { productService } from '../services/productService';

export const AccountPage = () => {
  const user = useAuthStore((state) => state.user) || {
    name: 'Patron',
    email: 'patron@example.com',
  };
  const wishlistCount = useWishlistStore((state) => state.getCount());
  const cartItemCount = useCartStore((state) => state.getTotalItems());
  const { recentlyViewed, recentlyViewedProducts, fetchRecentlyViewed } = useBrowseStore();

  const [recentGarments, setRecentGarments] = useState([]);

  useEffect(() => {
    fetchRecentlyViewed();
  }, [fetchRecentlyViewed]);

  // If server recentlyViewedProducts is present, use it; otherwise resolve local slugs
  useEffect(() => {
    let isMounted = true;

    async function loadRecent() {
      if (recentlyViewedProducts && recentlyViewedProducts.length > 0) {
        setRecentGarments(recentlyViewedProducts.slice(0, 6));
        return;
      }

      if (recentlyViewed && recentlyViewed.length > 0) {
        try {
          const res = await productService.getProducts({ limit: 30 });
          if (res?.products && isMounted) {
            const matched = recentlyViewed
              .map((slugOrId) =>
                res.products.find((p) => p.slug === slugOrId || p._id === slugOrId || p.id === slugOrId)
              )
              .filter(Boolean)
              .slice(0, 6);
            setRecentGarments(matched);
          }
        } catch (err) {
          console.warn('Failed to load recent garments on account page:', err);
        }
      }
    }

    loadRecent();
    return () => {
      isMounted = false;
    };
  }, [recentlyViewed, recentlyViewedProducts]);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-serif text-2xl font-normal text-urban-black">Profile Overview</h2>
        <p className="text-xs text-urban-warm-grey mt-1">
          Personal atelier status, active privileges, and browsing history.
        </p>
      </div>

      {/* Member Card */}
      <div className="p-6 bg-urban-light-grey border border-urban-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-urban-teal font-semibold">
            Member Status: Gold Atelier Tier
          </span>
          <h3 className="font-serif text-xl font-medium text-urban-black mt-1">{user.name}</h3>
          <p className="text-xs text-urban-warm-grey">{user.email}</p>
        </div>
        <div className="flex items-center space-x-2 bg-urban-teal/10 px-3 py-1.5 border border-urban-teal/20 text-urban-teal text-xs font-medium">
          <Shield size={14} />
          <span>Priority Concierge Active</span>
        </div>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Link
          to="/cart"
          className="p-5 border border-urban-border hover:border-urban-teal transition-all group bg-white"
        >
          <ShoppingBag size={22} className="text-urban-warm-grey group-hover:text-urban-teal mb-3" />
          <h4 className="font-serif text-base font-medium text-urban-black">Shopping Bag</h4>
          <p className="text-xs text-urban-warm-grey mt-1">
            {cartItemCount > 0 ? `${cartItemCount} items active` : 'Bag empty'}
          </p>
          <span className="inline-flex items-center text-[11px] text-urban-teal font-medium mt-4 group-hover:translate-x-1 transition-transform">
            <span>View Bag</span>
            <ArrowRight size={12} className="ml-1" />
          </span>
        </Link>

        <Link
          to="/wishlist"
          className="p-5 border border-urban-border hover:border-urban-teal transition-all group bg-white"
        >
          <Heart size={22} className="text-urban-warm-grey group-hover:text-urban-teal mb-3" />
          <h4 className="font-serif text-base font-medium text-urban-black">Saved Wishlist</h4>
          <p className="text-xs text-urban-warm-grey mt-1">{wishlistCount} pieces saved</p>
          <span className="inline-flex items-center text-[11px] text-urban-teal font-medium mt-4 group-hover:translate-x-1 transition-transform">
            <span>View Curation</span>
            <ArrowRight size={12} className="ml-1" />
          </span>
        </Link>

        <Link
          to="/account/orders"
          className="p-5 border border-urban-border hover:border-urban-teal transition-all group bg-white"
        >
          <Package size={22} className="text-urban-warm-grey group-hover:text-urban-teal mb-3" />
          <h4 className="font-serif text-base font-medium text-urban-black">Recent Orders</h4>
          <p className="text-xs text-urban-warm-grey mt-1">1 active in transit</p>
          <span className="inline-flex items-center text-[11px] text-urban-teal font-medium mt-4 group-hover:translate-x-1 transition-transform">
            <span>View All</span>
            <ArrowRight size={12} className="ml-1" />
          </span>
        </Link>

        <Link
          to="/account/addresses"
          className="p-5 border border-urban-border hover:border-urban-teal transition-all group bg-white"
        >
          <MapPin size={22} className="text-urban-warm-grey group-hover:text-urban-teal mb-3" />
          <h4 className="font-serif text-base font-medium text-urban-black">Saved Addresses</h4>
          <p className="text-xs text-urban-warm-grey mt-1">1 primary address</p>
          <span className="inline-flex items-center text-[11px] text-urban-teal font-medium mt-4 group-hover:translate-x-1 transition-transform">
            <span>Manage</span>
            <ArrowRight size={12} className="ml-1" />
          </span>
        </Link>
      </div>

      {/* Recently Viewed Wardrobe Section */}
      <div className="pt-6 border-t border-urban-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-urban-teal" />
            <h3 className="font-serif text-lg font-medium text-urban-black">
              Recently Viewed Wardrobe
            </h3>
          </div>
          <Link
            to="/shop"
            className="text-xs text-urban-warm-grey hover:text-urban-teal uppercase tracking-widest transition-colors"
          >
            Explore Catalog
          </Link>
        </div>

        {recentGarments.length === 0 ? (
          <div className="p-8 bg-urban-light-grey text-center border border-urban-border">
            <p className="text-xs text-urban-warm-grey">
              No recently viewed garments yet. Explore our contemporary drops to build your history.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {recentGarments.map((garment) => {
              const pId = garment._id || garment.id;
              const thumbnail =
                garment.thumbnail || garment.images?.[0] || garment.image;
              const price =
                garment.price ?? garment.priceRange?.min ?? garment.variants?.[0]?.price ?? 0;

              return (
                <Link
                  key={pId}
                  to={`/product/${garment.slug}`}
                  className="group flex flex-col border border-urban-border bg-white hover:border-urban-teal transition-colors"
                >
                  <div className="aspect-[3/4] bg-urban-light-grey overflow-hidden relative">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={garment.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <span className="font-serif text-[10px] text-center">{garment.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <span className="font-serif text-xs font-medium text-urban-black group-hover:text-urban-teal transition-colors line-clamp-1 block">
                      {garment.name}
                    </span>
                    <span className="text-[11px] font-semibold text-urban-black mt-0.5 block">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
