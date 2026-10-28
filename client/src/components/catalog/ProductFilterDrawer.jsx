import React, { useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { ProductFilterSidebar } from './ProductFilterSidebar';

export const ProductFilterDrawer = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  onReset,
  totalResults,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-urban-border">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal size={16} className="text-urban-teal" />
            <h3 className="font-serif text-lg font-semibold text-urban-black">Filters</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-urban-warm-grey hover:text-urban-black transition-colors"
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Filters Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <ProductFilterSidebar
            filters={filters}
            setFilters={setFilters}
            onReset={onReset}
          />
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-urban-border bg-white flex items-center space-x-3">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-3 border border-urban-border text-xs uppercase tracking-widest text-urban-black font-semibold hover:border-urban-black transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-[2] py-3 bg-urban-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-urban-teal transition-colors"
          >
            Apply ({totalResults} pieces)
          </button>
        </div>
      </div>
    </div>
  );
};
