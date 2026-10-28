import React from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, ArrowRight, ShoppingBag, AlertCircle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export const QuickCartDrawer = () => {
  const { isDrawerOpen, closeDrawer, items, totals, removeItem, updateQuantity } =
    useCartStore();

  if (!isDrawerOpen) return null;

  const subtotal = totals.subtotal || 0;
  const hasUnavailableItems =
    totals.hasUnavailableItems || items.some((i) => i.isAvailable === false);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-urban-black/40 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-urban-white border-l border-urban-border shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-6 border-b border-urban-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag size={20} className="text-urban-teal" />
              <h3 className="font-serif text-lg font-semibold tracking-wide text-urban-black">
                Shopping Bag ({items.length})
              </h3>
            </div>
            <button
              onClick={closeDrawer}
              className="p-1 text-urban-warm-grey hover:text-urban-black transition-colors"
              aria-label="Close Shopping Bag"
            >
              <X size={20} />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <ShoppingBag size={48} strokeWidth={1} className="text-urban-warm-grey mb-4" />
                <p className="font-serif text-lg text-urban-black">Your bag is empty</p>
                <p className="text-xs text-urban-warm-grey mt-1 mb-6">
                  Explore our tailored collections and contemporary drops.
                </p>
                <Link
                  to="/shop"
                  onClick={closeDrawer}
                  className="bg-urban-black text-white text-xs uppercase tracking-editorial px-6 py-3 hover:bg-urban-teal transition-colors"
                >
                  Explore The Collection
                </Link>
              </div>
            ) : (
              items.map((item, idx) => {
                const itemId = item._id || item.id || idx;
                const product = item.product || item;
                const variant = item.variant || {};
                const unitPrice = item.unitPrice ?? item.priceSnapshot ?? item.price ?? 0;
                const itemTotal = item.itemSubtotal ?? unitPrice * item.quantity;
                const thumbnail =
                  product.thumbnail || product.images?.[0] || item.image || item.thumbnail;
                const isUnavailable = item.isAvailable === false;

                return (
                  <div
                    key={`${itemId}-${variant.size}-${variant.color}`}
                    className={`flex space-x-4 border-b border-urban-border pb-6 ${
                      isUnavailable ? 'opacity-60 bg-red-50/20 p-2' : ''
                    }`}
                  >
                    <div className="w-20 h-24 bg-urban-light-grey border border-urban-border overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-serif text-[11px] text-center text-urban-black font-semibold line-clamp-2 px-1">
                          {product.name}
                        </span>
                      )}
                      {isUnavailable && (
                        <span className="absolute inset-0 bg-red-900/40 flex items-center justify-center text-[9px] uppercase tracking-widest text-white font-bold">
                          Sold Out
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <Link
                            to={`/product/${product.slug}`}
                            onClick={closeDrawer}
                            className="font-serif text-sm font-medium text-urban-black hover:text-urban-teal transition-colors line-clamp-1"
                          >
                            {product.name}
                          </Link>
                          <button
                            onClick={() => removeItem(itemId)}
                            className="text-urban-warm-grey hover:text-red-500 transition-colors p-1"
                            title="Remove"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <p className="text-[11px] text-urban-warm-grey mt-0.5">
                          Size: {variant.size || item.size || 'M'} | Color: {variant.color || item.color || 'Standard'}
                        </p>
                        {item.reason && (
                          <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
                            {item.reason}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Selector */}
                        <div className="flex items-center border border-urban-border">
                          <button
                            disabled={isUnavailable}
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs text-urban-black hover:bg-urban-light-grey disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="px-3 py-0.5 text-xs font-medium text-urban-black">
                            {item.quantity}
                          </span>
                          <button
                            disabled={isUnavailable}
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs text-urban-black hover:bg-urban-light-grey disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-sm font-medium text-urban-black">
                          ₹{itemTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-6 border-t border-urban-border bg-urban-light-grey/50 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-urban-warm-grey">Subtotal</span>
                <span className="font-semibold text-urban-black">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-urban-warm-grey">
                Taxes calculated at checkout. Complimentary courier included for orders above ₹2,500.
              </p>

              {hasUnavailableItems && (
                <div className="flex items-center space-x-1.5 text-[11px] text-amber-800">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>Some pieces are unavailable. View bag to adjust.</span>
                </div>
              )}

              <div className="space-y-2 pt-2">
                {hasUnavailableItems ? (
                  <Link
                    to="/cart"
                    onClick={closeDrawer}
                    className="w-full flex items-center justify-center space-x-2 bg-urban-warm-grey text-white py-3 px-4 text-xs uppercase tracking-editorial font-medium hover:bg-urban-black transition-colors"
                  >
                    <span>Adjust Bag to Checkout</span>
                  </Link>
                ) : (
                  <Link
                    to="/checkout"
                    onClick={closeDrawer}
                    className="w-full flex items-center justify-center space-x-2 bg-urban-teal text-white py-3 px-4 text-xs uppercase tracking-editorial font-medium hover:bg-urban-teal-dark transition-colors"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={16} />
                  </Link>
                )}
                <Link
                  to="/cart"
                  onClick={closeDrawer}
                  className="w-full block text-center border border-urban-black py-2.5 px-4 text-xs uppercase tracking-editorial text-urban-black hover:bg-urban-black hover:text-white transition-colors"
                >
                  View Full Bag
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
