import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { productService } from '../services/productService';

export const WishlistPage = () => {
  const { products, itemIds, fetchWishlist, removeFromWishlist, moveToCart, isLoading } =
    useWishlistStore();

  const [resolvedProducts, setResolvedProducts] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Resolve product objects if itemIds have IDs not yet hydrated in products
  useEffect(() => {
    let isMounted = true;

    async function hydrateItems() {
      if (products.length > 0) {
        setResolvedProducts(products);
        return;
      }

      if (itemIds.length === 0) {
        setResolvedProducts([]);
        return;
      }

      // Fetch matching items from catalog API
      try {
        const res = await productService.getProducts({ limit: 50 });
        if (res?.products && isMounted) {
          const matched = res.products.filter((p) => {
            const id = (p.id || p._id || '').toString();
            return itemIds.includes(id) || itemIds.includes(p.slug);
          });
          setResolvedProducts(matched);
        }
      } catch (err) {
        console.warn('Failed to hydrate wishlist products:', err);
      }
    }

    hydrateItems();
    return () => {
      isMounted = false;
    };
  }, [products, itemIds]);

  const handleVariantChange = (productId, key, value) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [key]: value,
      },
    }));
  };

  const handleMoveToCart = async (product) => {
    const pId = product.id || product._id;
    const variants = product.variants || [];
    const size = selectedVariants[pId]?.size || variants[0]?.size || 'M';
    const color = selectedVariants[pId]?.color || variants[0]?.color || 'Standard';

    await moveToCart(product, size, color);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="border-b border-urban-border pb-8 mb-10 flex justify-between items-end">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-urban-teal font-semibold">
            Saved Curation
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-urban-black font-light mt-1">
            Your Wishlist ({resolvedProducts.length || itemIds.length})
          </h1>
          <p className="text-xs text-urban-warm-grey mt-2">
            Pieces saved for future acquisition. Move directly to your shopping bag when ready.
          </p>
        </div>
      </div>

      {resolvedProducts.length === 0 ? (
        <div className="text-center py-20 bg-urban-light-grey border border-urban-border">
          <Heart size={44} strokeWidth={1} className="mx-auto text-urban-warm-grey mb-3" />
          <p className="font-serif text-lg text-urban-black">Your wishlist is currently empty</p>
          <p className="text-xs text-urban-warm-grey mt-1 mb-6">
            Tap the heart icon on any piece to save it to your personal atelier curation.
          </p>
          <Link
            to="/shop"
            className="px-8 py-3 bg-urban-black hover:bg-urban-teal text-white text-xs uppercase tracking-editorial transition-colors"
          >
            Explore Wardrobe
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {resolvedProducts.map((product) => {
            const pId = product.id || product._id;
            const variants = product.variants || [];
            const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));
            const colors = Array.from(
              new Map(variants.filter((v) => v.color).map((v) => [v.color, v.colorHex || '#111'])).entries()
            );

            const chosenSize = selectedVariants[pId]?.size || sizes[0] || 'M';
            const chosenColor = selectedVariants[pId]?.color || colors[0]?.[0] || 'Standard';

            const primaryPrice =
              product.price ?? product.priceRange?.min ?? variants[0]?.salePrice ?? variants[0]?.price ?? 0;
            const originalPrice =
              product.originalPrice ?? (variants[0]?.salePrice ? variants[0]?.price : null);
            const brandName =
              typeof product.brand === 'object' ? product.brand?.name : product.brand || 'Urban Check';
            const thumbnail =
              product.thumbnail || product.images?.[0] || product.image;

            return (
              <div
                key={pId}
                className="group border border-urban-border bg-white flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                {/* Image Frame */}
                <div className="relative aspect-[3/4] bg-urban-light-grey overflow-hidden">
                  <Link to={`/product/${product.slug}`} className="block w-full h-full">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <span className="font-serif text-xs text-center text-urban-black">
                          {product.name}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Remove button */}
                  <button
                    onClick={() => removeFromWishlist(pId)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md rounded-full text-urban-black hover:text-red-500 transition-colors shadow-sm"
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-urban-warm-grey">
                      {brandName}
                    </span>
                    <Link
                      to={`/product/${product.slug}`}
                      className="font-serif text-sm font-medium text-urban-black hover:text-urban-teal block mt-0.5 line-clamp-1"
                    >
                      {product.name}
                    </Link>

                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-sm font-semibold text-urban-black">
                        ₹{primaryPrice.toLocaleString('en-IN')}
                      </span>
                      {originalPrice && originalPrice > primaryPrice && (
                        <span className="text-xs text-urban-warm-grey line-through">
                          ₹{originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Variant selector dropdowns if available */}
                    {sizes.length > 0 && (
                      <div className="mt-3 flex items-center space-x-2 text-[11px]">
                        <span className="text-urban-warm-grey">Size:</span>
                        <select
                          value={chosenSize}
                          onChange={(e) => handleVariantChange(pId, 'size', e.target.value)}
                          className="bg-white border border-urban-border px-2 py-0.5 text-xs text-urban-black focus:outline-none"
                        >
                          {sizes.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Move to Bag Action */}
                  <button
                    onClick={() => handleMoveToCart(product)}
                    className="mt-4 w-full py-2.5 bg-urban-black hover:bg-urban-teal text-white text-xs uppercase tracking-editorial font-medium flex items-center justify-center space-x-2 transition-colors"
                  >
                    <ShoppingBag size={14} />
                    <span>Move to Bag</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
