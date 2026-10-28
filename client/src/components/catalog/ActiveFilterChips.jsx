import React from 'react';
import { X } from 'lucide-react';
import { PRICE_RANGES } from './ProductFilterSidebar';

export const ActiveFilterChips = ({ filters, setFilters, onReset }) => {
  const removeCategory = (cat) => {
    setFilters({ ...filters, categories: filters.categories.filter((c) => c !== cat) });
  };

  const removeBrand = (brand) => {
    setFilters({ ...filters, brands: filters.brands.filter((b) => b !== brand) });
  };

  const removeGender = (gender) => {
    setFilters({ ...filters, genders: filters.genders.filter((g) => g !== gender) });
  };

  const removeSize = (size) => {
    setFilters({ ...filters, sizes: filters.sizes.filter((s) => s !== size) });
  };

  const removeColor = (color) => {
    setFilters({ ...filters, colors: filters.colors.filter((c) => c !== color) });
  };

  const removePriceRange = (rangeId) => {
    setFilters({ ...filters, priceRanges: filters.priceRanges.filter((r) => r !== rangeId) });
  };

  const removeInStock = () => {
    setFilters({ ...filters, inStockOnly: false });
  };

  const removeRating = () => {
    setFilters({ ...filters, minRating: 0 });
  };

  const chips = [];

  filters.categories.forEach((cat) => {
    chips.push({ id: `cat-${cat}`, label: `Category: ${cat}`, onRemove: () => removeCategory(cat) });
  });

  filters.brands.forEach((brand) => {
    chips.push({ id: `brand-${brand}`, label: `Brand: ${brand}`, onRemove: () => removeBrand(brand) });
  });

  filters.genders.forEach((gender) => {
    chips.push({ id: `gender-${gender}`, label: `Gender: ${gender}`, onRemove: () => removeGender(gender) });
  });

  filters.sizes.forEach((size) => {
    chips.push({ id: `size-${size}`, label: `Size: ${size}`, onRemove: () => removeSize(size) });
  });

  filters.colors.forEach((color) => {
    chips.push({ id: `color-${color}`, label: `Color: ${color}`, onRemove: () => removeColor(color) });
  });

  filters.priceRanges.forEach((rangeId) => {
    const range = PRICE_RANGES.find((p) => p.id === rangeId);
    if (range) {
      chips.push({
        id: `price-${rangeId}`,
        label: `Price: ${range.label}`,
        onRemove: () => removePriceRange(rangeId),
      });
    }
  });

  if (filters.inStockOnly) {
    chips.push({ id: 'in-stock', label: 'In Stock Only', onRemove: removeInStock });
  }

  if (filters.minRating > 0) {
    chips.push({ id: 'rating', label: `Rating: ${filters.minRating}★+`, onRemove: removeRating });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 pb-4">
      <span className="text-[11px] uppercase tracking-wider text-urban-warm-grey font-medium mr-1">
        Active Filters:
      </span>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs bg-urban-light-grey border border-urban-border text-urban-black font-medium transition-colors hover:border-urban-warm-grey"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="text-urban-warm-grey hover:text-urban-black p-0.5 rounded focus:outline-none"
            title={`Remove ${chip.label}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="text-[11px] uppercase tracking-wider text-urban-teal hover:underline font-semibold ml-2"
      >
        Clear All
      </button>
    </div>
  );
};
