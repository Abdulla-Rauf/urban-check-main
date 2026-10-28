import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Tag,
  AlertCircle,
  Heart,
  RotateCcw,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';

export const CartPage = () => {
  const { items, totals, removeItem, updateQuantity, clearCart, isLoading } = useCartStore();
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);

  // Totals from backend recalculation engine
  const subtotal = totals.subtotal || 0;
  const shippingFee = totals.shipping ?? (subtotal >= 2500 || subtotal === 0 ? 0 : 250);
  const tax = totals.tax || Math.round(subtotal * 0.05);
  const promoDiscount = discountApplied ? Math.round(subtotal * 0.1) : 0;
  const grandTotal = Math.max(0, (totals.grandTotal || subtotal + shippingFee) - promoDiscount);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'URBANFIRST') {
      setDiscountApplied(true);
    }
  };

  const handleMoveToWishlist = (item) => {
    const pId = item.product?._id || item.product?.id || item.productId || item.id;
    if (pId) {
      toggleWishlist(pId);
      const itemId = item._id || item.id;
      removeItem(itemId);
    }
  };

  const hasUnavailableItems =
    totals.hasUnavailableItems || items.some((i) => i.isAvailable === false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="border-b border-urban-border pb-6 mb-10 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-urban-teal font-semibold">
            Order Preparation
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-urban-black font-light mt-1">
            Shopping Bag ({items.length})
          </h1>
        </div>

        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-urban-warm-grey hover:text-urban-black underline transition-colors w-fit"
          >
            Clear Entire Bag
          </button>
        )}
      </div>

      {/* Stock warning banner if any item unavailable */}
      {hasUnavailableItems && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-3">
          <AlertCircle size={20} className="flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs">
            <strong className="font-semibold block mb-0.5">
              Attention: Atelier inventory adjustments
            </strong>
            <span>
              One or more pieces in your shopping bag are sold out or exceed current atelier allocation. Please remove or adjust them before proceeding to checkout.
            </span>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20 bg-urban-light-grey border border-urban-border">
          <ShoppingBag size={48} strokeWidth={1} className="mx-auto text-urban-warm-grey mb-3" />
          <p className="font-serif text-xl text-urban-black">Your shopping bag is currently empty</p>
          <p className="text-xs text-urban-warm-grey mt-1 mb-6">
            Discover tailored outerwear, pleated trousers, and knitwear.
          </p>
          <Link
            to="/shop"
            className="px-8 py-3 bg-urban-black text-white text-xs uppercase tracking-editorial hover:bg-urban-teal transition-colors"
          >
            Explore The Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Cart Table */}
          <div className="lg:col-span-8 space-y-6">
            <div className="hidden sm:grid grid-cols-12 text-[11px] uppercase tracking-widest text-urban-warm-grey pb-3 border-b border-urban-border">
              <span className="col-span-6">Item Description</span>
              <span className="col-span-2 text-center">Size / Color</span>
              <span className="col-span-2 text-center">Quantity</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            {items.map((item, idx) => {
              const itemId = item._id || item.id || idx;
              const product = item.product || item;
              const variant = item.variant || {};
              const unitPrice = item.unitPrice ?? item.priceSnapshot ?? item.price ?? 0;
              const originalPrice = item.originalPrice ?? item.price ?? unitPrice;
              const itemTotal = item.itemSubtotal ?? unitPrice * item.quantity;
              const brandName =
                typeof product.brand === 'object' ? product.brand?.name : product.brand || 'Urban Check';
              const thumbnail =
                product.thumbnail || product.images?.[0] || item.image || item.thumbnail;
              const isUnavailable = item.isAvailable === false;

              return (
                <div
                  key={`${itemId}-${variant.size}-${variant.color}`}
                  className={`grid grid-cols-1 sm:grid-cols-12 items-center gap-4 py-6 border-b border-urban-border transition-opacity ${
                    isUnavailable ? 'opacity-60 bg-red-50/20 px-3' : ''
                  }`}
                >
                  {/* Item Details */}
                  <div className="sm:col-span-6 flex items-center space-x-4">
                    <div className="w-16 h-20 bg-urban-light-grey border border-urban-border overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-serif text-[10px] text-center text-urban-black font-medium line-clamp-2 px-1">
                          {product.name}
                        </span>
                      )}
                      {isUnavailable && (
                        <span className="absolute inset-0 bg-red-900/40 flex items-center justify-center text-[9px] uppercase tracking-widest text-white font-bold text-center px-1">
                          Unavailable
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-urban-warm-grey">
                        {brandName}
                      </span>
                      <Link
                        to={`/product/${product.slug}`}
                        className="font-serif text-sm font-medium text-urban-black hover:text-urban-teal block"
                      >
                        {product.name}
                      </Link>

                      <div className="flex items-baseline space-x-2 mt-0.5">
                        <span className="text-xs font-semibold text-urban-black">
                          ₹{unitPrice.toLocaleString('en-IN')}
                        </span>
                        {originalPrice > unitPrice && (
                          <span className="text-[11px] text-urban-warm-grey line-through">
                            ₹{originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {item.reason && (
                        <span className="text-[10px] text-amber-700 font-medium block mt-1">
                          {item.reason}
                        </span>
                      )}

                      {/* Move to Wishlist shortcut */}
                      <button
                        onClick={() => handleMoveToWishlist(item)}
                        className="inline-flex items-center text-[10px] uppercase tracking-widest text-urban-warm-grey hover:text-urban-teal mt-2 transition-colors space-x-1"
                      >
                        <Heart size={11} />
                        <span>Save to Wishlist</span>
                      </button>
                    </div>
                  </div>

                  {/* Size / Color */}
                  <div className="sm:col-span-2 text-center text-xs text-urban-warm-grey">
                    <span className="font-medium text-urban-black">{variant.size || item.size || 'M'}</span>
                    <span className="block text-[11px] text-urban-warm-grey">
                      {variant.color || item.color || 'Standard'}
                    </span>
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2 flex items-center justify-center">
                    <div className="flex items-center border border-urban-border">
                      <button
                        disabled={isUnavailable}
                        onClick={() => updateQuantity(itemId, item.quantity - 1)}
                        className="px-2.5 py-1 text-xs hover:bg-urban-light-grey text-urban-black disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-xs font-medium text-urban-black">
                        {item.quantity}
                      </span>
                      <button
                        disabled={isUnavailable}
                        onClick={() => updateQuantity(itemId, item.quantity + 1)}
                        className="px-2.5 py-1 text-xs hover:bg-urban-light-grey text-urban-black disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Item Total & Remove */}
                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-end space-x-4">
                    <span className="text-sm font-medium text-urban-black">
                      ₹{itemTotal.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => removeItem(itemId)}
                      className="text-urban-warm-grey hover:text-red-500 transition-colors p-1"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-4">
            <div className="bg-urban-light-grey p-6 border border-urban-border space-y-6">
              <h3 className="font-serif text-lg font-semibold text-urban-black border-b border-urban-border pb-3">
                Order Summary
              </h3>

              {/* Promo Code Form */}
              <form onSubmit={handleApplyPromo} className="space-y-2">
                <label className="text-xs uppercase tracking-editorial text-urban-warm-grey block">
                  Privilege Code
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="e.g. URBANFIRST"
                    className="flex-1 bg-white border border-urban-border px-3 py-2 text-xs uppercase focus:outline-none focus:border-urban-teal"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-urban-black text-white text-xs uppercase tracking-widest hover:bg-urban-teal transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {discountApplied && (
                  <span className="text-xs text-urban-teal font-medium flex items-center space-x-1 mt-1">
                    <Tag size={12} />
                    <span>10% First Atelier Order Courtesy Applied</span>
                  </span>
                )}
              </form>

              <div className="space-y-3 text-xs text-urban-warm-grey pt-4 border-t border-urban-border">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-urban-black font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-urban-teal">
                    <span>Atelier Seasonal Benefit</span>
                    <span>-₹{totals.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {discountApplied && (
                  <div className="flex justify-between text-urban-teal">
                    <span>Courtesy Privilege</span>
                    <span>-₹{promoDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Express Courier</span>
                  <span className="text-urban-teal font-medium">
                    {shippingFee === 0 ? 'Complimentary' : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (5% GST Incl.)</span>
                  <span className="text-urban-warm-grey">₹{tax.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-base font-serif font-bold text-urban-black pt-4 border-t border-urban-border">
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {hasUnavailableItems ? (
                <button
                  disabled
                  className="w-full py-4 bg-urban-warm-grey/50 text-white text-xs uppercase tracking-editorial font-medium cursor-not-allowed text-center"
                >
                  Adjust Items to Checkout
                </button>
              ) : (
                <Link
                  to="/checkout"
                  className="w-full flex items-center justify-center space-x-2 py-4 bg-urban-teal hover:bg-urban-teal-dark text-white text-xs uppercase tracking-editorial font-medium transition-colors"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} />
                </Link>
              )}

              <div className="pt-2 text-[11px] text-urban-warm-grey flex items-center justify-center space-x-2">
                <ShieldCheck size={16} className="text-urban-teal" />
                <span>Encrypted 256-bit Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
