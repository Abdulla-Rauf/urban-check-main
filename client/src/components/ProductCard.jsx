import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { optimizeImageUrl } from '../utils/imageOptimizer';

export const ProductCard = ({ product }) => {
  const productId = product.id || product._id;
  const brandName = typeof product.brand === 'object' ? product.brand?.name : (product.brand || 'URBAN CHECK');

  // Normalize variants, sizes, and colors
  const variants = product.variants || [];
  const sizes = product.sizes || Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));
  const colors = product.colors || Array.from(
    new Map(
      variants
        .filter((v) => v.color)
        .map((v) => [v.color, { name: v.color, hex: v.colorHex || '#222222' }])
    ).values()
  );

  const [isHovered, setIsHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(
    product.color || colors[0]?.name || variants[0]?.color || 'Default'
  );
  const [activeImageOverride, setActiveImageOverride] = useState(null);
  const [selectedSize, setSelectedSize] = useState(sizes[0] || 'M');
  const [added, setAdded] = useState(false);

  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isWishlisted = useWishlistStore((state) => state.isInWishlist(productId));
  const addItem = useCartStore((state) => state.addItem);

  // Compute pricing and active offers
  const activeOffer = product.activeOffer;
  const primaryPrice = activeOffer?.offerPrice ?? (product.price ?? product.priceRange?.min ?? variants[0]?.salePrice ?? variants[0]?.price ?? 0);
  const originalPrice = activeOffer?.originalPrice ?? (product.originalPrice ?? (variants[0]?.salePrice && variants[0]?.salePrice < variants[0]?.price ? variants[0]?.price : null));
  const discountPercent = activeOffer?.discount ?? (product.discountPercent ?? (originalPrice && originalPrice > primaryPrice ? Math.round(((originalPrice - primaryPrice) / originalPrice) * 100) : null));

  // Compute stock status
  const currentVariant = variants.find((v) => v.color === selectedColor) || variants[0];
  const totalStock = currentVariant?.stock ?? (currentVariant?.sizes?.reduce((sum, s) => sum + (s.stock || 0), 0) ?? product.stock ?? 10);
  const isOutOfStock = product.inStock === false || product.status === 'out_of_stock' || totalStock <= 0;
  const isLowStock = !isOutOfStock && totalStock <= 5;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addItem({ ...product, id: productId, price: primaryPrice }, selectedSize, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleColorChange = (colorName) => {
    setSelectedColor(colorName);
    const variant = variants.find((v) => v.color === colorName);
    if (variant?.images?.[0]) {
      setActiveImageOverride(variant.images[0]);
    }
  };

  const rawPrimary = activeImageOverride || product.image || product.thumbnail || product.images?.[0] || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1000';
  const rawSecondary = product.secondaryImage || product.images?.[1] || currentVariant?.images?.[1] || null;
  const displayPrimaryImage = optimizeImageUrl(rawPrimary, { width: 800, format: 'webp' });
  const displaySecondaryImage = rawSecondary ? optimizeImageUrl(rawSecondary, { width: 800, format: 'webp' }) : null;

  return (
    <div
      className="group relative flex flex-col transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Frame */}
      <div className="relative aspect-[3/4] bg-urban-light-grey overflow-hidden border border-urban-border/60">
        <Link to={`/product/${product.slug}`} className="block w-full h-full relative">
          {/* Primary Product Image */}
          <img
            src={displayPrimaryImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out ${
              isHovered && displaySecondaryImage
                ? 'opacity-0 scale-105'
                : 'opacity-100 scale-100 group-hover:scale-105'
            }`}
          />

          {/* Secondary Hover Product Image */}
          {displaySecondaryImage && (
            <img
              src={displaySecondaryImage}
              alt={`${product.name} alternate`}
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out ${
                isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              }`}
            />
          )}
        </Link>

        {/* Badges Stack: Offer Badge + Discount + Stock Status */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {activeOffer?.badgeText ? (
            <span className="bg-urban-teal text-white text-[10px] uppercase tracking-widest px-2.5 py-0.5 font-semibold shadow-sm w-fit">
              {activeOffer.badgeText}
            </span>
          ) : discountPercent ? (
            <span className="bg-urban-black text-urban-biscuit text-[10px] uppercase tracking-widest px-2.5 py-0.5 font-semibold shadow-sm w-fit">
              {discountPercent}% OFF
            </span>
          ) : null}

          {isOutOfStock ? (
            <span className="bg-red-900/90 text-white text-[9px] uppercase tracking-wider px-2 py-0.5 font-semibold shadow-sm w-fit">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-800/90 text-white text-[9px] uppercase tracking-wider px-2 py-0.5 font-semibold shadow-sm w-fit">
              Only {totalStock} Left
            </span>
          ) : null}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={() => toggleWishlist(product.id)}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md rounded-full text-urban-black hover:text-urban-teal transition-all z-10 shadow-sm hover:scale-110"
          aria-label="Save to Wishlist"
        >
          <Heart
            size={17}
            strokeWidth={1.5}
            className={isWishlisted ? 'fill-urban-teal text-urban-teal' : ''}
          />
        </button>

        {/* Quick Action Overlay (Sizes + Quick Add) */}
        {!isOutOfStock && (
          <div className="absolute inset-x-0 bottom-0 p-3 bg-white/95 backdrop-blur-md border-t border-urban-border translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10 flex items-center justify-between gap-2">
            {/* Sizes bar */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {product.sizes?.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`text-[10px] px-2 py-1 border transition-colors ${
                    selectedSize === size
                      ? 'border-urban-black bg-urban-black text-white font-medium'
                      : 'border-urban-border bg-white text-urban-black hover:border-urban-black'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Quick Add Button */}
            <button
              onClick={handleQuickAdd}
              className="flex items-center justify-center p-2 bg-urban-teal text-white hover:bg-urban-teal-dark transition-colors text-xs flex-shrink-0"
              title="Add to Shopping Bag"
            >
              {added ? <Check size={16} /> : <ShoppingBag size={16} strokeWidth={1.5} />}
            </button>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="pt-3.5 flex flex-col flex-1">
        {/* Brand */}
        <span className="text-[10px] uppercase tracking-[0.2em] text-urban-warm-grey font-medium">
          {brandName}
        </span>

        {/* Title */}
        <Link
          to={`/product/${product.slug}`}
          className="font-serif text-sm text-urban-black hover:text-urban-teal transition-colors mt-0.5 font-medium line-clamp-1"
        >
          {product.name}
        </Link>

        {/* Price & Discount */}
        <div className="mt-1 flex items-baseline space-x-2">
          <span className="text-sm font-semibold text-urban-black">
            ₹{primaryPrice.toLocaleString('en-IN')}
          </span>
          {originalPrice && originalPrice > primaryPrice && (
            <span className="text-xs text-urban-warm-grey line-through">
              ₹{originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Stock status indicator */}
        <div className="mt-1 flex items-center space-x-1.5 text-[10px]">
          {isOutOfStock ? (
            <span className="text-red-700 font-medium">Out of stock</span>
          ) : isLowStock ? (
            <span className="text-amber-700 font-medium">Low stock — only {totalStock} remaining</span>
          ) : (
            <span className="text-emerald-700 font-medium">In stock</span>
          )}
        </div>

        {/* Available Color Swatches */}
        {colors && colors.length > 0 && (
          <div className="flex items-center space-x-1.5 mt-2">
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => handleColorChange(c.name)}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  selectedColor === c.name
                    ? 'ring-1 ring-offset-1 ring-urban-black scale-110'
                    : 'border-black/20 hover:scale-110'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
