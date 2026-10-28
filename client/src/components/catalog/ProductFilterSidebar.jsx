import React, { useState, useEffect } from 'react';
import { Star, Check } from 'lucide-react';
import { productService } from '../../services/productService';

export const PRICE_RANGES = [
  { id: 'p1', label: 'Under ₹3,000', min: 0, max: 3000 },
  { id: 'p2', label: '₹3,000 – ₹6,000', min: 3000, max: 6000 },
  { id: 'p3', label: '₹6,000 – ₹10,000', min: 6000, max: 10000 },
  { id: 'p4', label: 'Above ₹10,000', min: 10000, max: 999999 },
];

export const SIZES_LIST = ['XS', 'S', 'M', 'L', 'XL', '26', '28', '30', '32', '34', '40', '41', '42', '43'];

export const COLORS_LIST = [
  { name: 'Teal Green', hex: '#2F6F68' },
  { name: 'Black', hex: '#111111' },
  { name: 'Warm Grey', hex: '#6B6B65' },
  { name: 'Biscuit', hex: '#D8C7AD' },
  { name: 'White', hex: '#FFFFFF' },
];

export const GENDERS_LIST = ['Men', 'Women', 'Kids', 'Unisex'];

export const RATINGS_LIST = [
  { value: 4.8, label: '4.8 ★ & above' },
  { value: 4.5, label: '4.5 ★ & above' },
  { value: 4.0, label: '4.0 ★ & above' },
];

export const ProductFilterSidebar = ({ filters, setFilters, onReset }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    let isMounted = true;
    productService.getCategories().then((res) => {
      const list = res?.data || res;
      if (isMounted && Array.isArray(list)) setCategories(list);
    }).catch(() => {});

    productService.getBrands().then((res) => {
      const list = res?.data || res;
      if (isMounted && Array.isArray(list)) setBrands(list);
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleArrayItem = (key, item) => {
    const current = filters[key] || [];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    setFilters({ ...filters, [key]: updated });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.priceRanges.length > 0 ||
    filters.genders.length > 0 ||
    filters.inStockOnly ||
    filters.minRating > 0;

  return (
    <aside className="w-64 flex-shrink-0 space-y-8 text-xs select-none">
      {/* Sidebar Header & Clear */}
      <div className="flex items-center justify-between pb-4 border-b border-urban-border">
        <span className="font-serif text-base font-semibold text-urban-black tracking-wide">
          Refine Wardrobe
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] uppercase tracking-widest text-urban-teal hover:underline font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* 1. Category */}
      {categories.length > 0 && (
        <div>
          <h4 className="font-semibold text-urban-black uppercase tracking-editorial text-[10px] mb-3">
            Category
          </h4>
          <div className="space-y-2">
            {categories.map((cat) => {
              const catName = cat.name;
              const isChecked = filters.categories.includes(catName);
              return (
                <label
                  key={cat.id || cat._id || cat.slug}
                  className="flex items-center space-x-2.5 cursor-pointer group text-urban-warm-grey hover:text-urban-black"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleArrayItem('categories', catName)}
                    className="rounded-none border-urban-border text-urban-teal focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className={isChecked ? 'text-urban-black font-medium' : ''}>
                    {catName}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Brand */}
      {brands.length > 0 && (
        <div className="pt-6 border-t border-urban-border/60">
          <h4 className="font-semibold text-urban-black uppercase tracking-editorial text-[10px] mb-3">
            Brand Label
          </h4>
          <div className="space-y-2">
            {brands.map((brand) => {
              const brandName = brand.name;
              const isChecked = filters.brands.includes(brandName);
              return (
                <label
                  key={brand.id || brand._id || brand.slug}
                  className="flex items-center space-x-2.5 cursor-pointer group text-urban-warm-grey hover:text-urban-black"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleArrayItem('brands', brandName)}
                    className="rounded-none border-urban-border text-urban-teal focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className={isChecked ? 'text-urban-black font-medium' : ''}>
                    {brandName}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Gender */}
      <div className="pt-6 border-t border-urban-border/60">
        <h4 className="font-semibold text-urban-black uppercase tracking-editorial text-[10px] mb-3">
          Gender
        </h4>
        <div className="space-y-2">
          {GENDERS_LIST.map((g) => {
            const isChecked = filters.genders.includes(g);
            return (
              <label
                key={g}
                className="flex items-center space-x-2.5 cursor-pointer group text-urban-warm-grey hover:text-urban-black"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleArrayItem('genders', g)}
                  className="rounded-none border-urban-border text-urban-teal focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span className={isChecked ? 'text-urban-black font-medium' : ''}>{g}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Size */}
      <div className="pt-6 border-t border-urban-border/60">
        <h4 className="font-semibold text-urban-black uppercase tracking-editorial text-[10px] mb-3">
          Size
        </h4>
        <div className="grid grid-cols-4 gap-1.5">
          {SIZES_LIST.map((size) => {
            const isSelected = filters.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleArrayItem('sizes', size)}
                className={`py-1.5 text-center font-mono text-[11px] border transition-colors ${
                  isSelected
                    ? 'border-urban-black bg-urban-black text-white font-semibold'
                    : 'border-urban-border bg-white text-urban-black hover:border-urban-black'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Color */}
      <div className="pt-6 border-t border-urban-border/60">
        <h4 className="font-semibold text-urban-black uppercase tracking-editorial text-[10px] mb-3">
          Color
        </h4>
        <div className="space-y-2">
          {COLORS_LIST.map((c) => {
            const isSelected = filters.colors.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => toggleArrayItem('colors', c.name)}
                className="w-full flex items-center justify-between text-left group"
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`w-3.5 h-3.5 rounded-full border border-black/20 inline-block ${
                      isSelected ? 'ring-1 ring-offset-1 ring-urban-black' : ''
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                  <span
                    className={
                      isSelected
                        ? 'text-urban-black font-semibold'
                        : 'text-urban-warm-grey group-hover:text-urban-black'
                    }
                  >
                    {c.name}
                  </span>
                </div>
                {isSelected && <Check size={13} className="text-urban-teal" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Price */}
      <div className="pt-6 border-t border-urban-border/60">
        <h4 className="font-semibold text-urban-black uppercase tracking-editorial text-[10px] mb-3">
          Price Bracket
        </h4>
        <div className="space-y-2">
          {PRICE_RANGES.map((pr) => {
            const isChecked = filters.priceRanges.includes(pr.id);
            return (
              <label
                key={pr.id}
                className="flex items-center space-x-2.5 cursor-pointer text-urban-warm-grey hover:text-urban-black"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleArrayItem('priceRanges', pr.id)}
                  className="rounded-none border-urban-border text-urban-teal focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span className={isChecked ? 'text-urban-black font-medium' : ''}>
                  {pr.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 7. Availability */}
      <div className="pt-6 border-t border-urban-border/60">
        <h4 className="font-semibold text-urban-black uppercase tracking-editorial text-[10px] mb-3">
          Availability
        </h4>
        <label className="flex items-center space-x-2.5 cursor-pointer text-urban-warm-grey hover:text-urban-black">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => setFilters({ ...filters, inStockOnly: e.target.checked })}
            className="rounded-none border-urban-border text-urban-teal focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
          />
          <span className={filters.inStockOnly ? 'text-urban-black font-medium' : ''}>
            In Stock Pieces Only
          </span>
        </label>
      </div>

      {/* 8. Rating */}
      <div className="pt-6 border-t border-urban-border/60">
        <h4 className="font-semibold text-urban-black uppercase tracking-editorial text-[10px] mb-3">
          Customer Rating
        </h4>
        <div className="space-y-2">
          {RATINGS_LIST.map((r) => {
            const isSelected = filters.minRating === r.value;
            return (
              <label
                key={r.value}
                className="flex items-center space-x-2.5 cursor-pointer text-urban-warm-grey hover:text-urban-black"
              >
                <input
                  type="radio"
                  name="ratingFilter"
                  checked={isSelected}
                  onChange={() =>
                    setFilters({ ...filters, minRating: isSelected ? 0 : r.value })
                  }
                  className="border-urban-border text-urban-teal focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                />
                <div className="flex items-center space-x-1">
                  <Star size={12} className="fill-urban-biscuit text-urban-biscuit" />
                  <span className={isSelected ? 'text-urban-black font-semibold' : ''}>
                    {r.label}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
