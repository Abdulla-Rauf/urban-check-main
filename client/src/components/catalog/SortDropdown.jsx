import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Customer Rating' },
];

export const SortDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = SORT_OPTIONS.find((opt) => opt.value === value) || SORT_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-xs uppercase tracking-wider text-urban-black hover:text-urban-teal transition-colors py-2 px-3 border border-urban-border bg-white"
        aria-expanded={isOpen}
      >
        <span className="text-urban-warm-grey">Sort by:</span>
        <span className="font-semibold">{selectedOption.label}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 text-urban-warm-grey ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-52 bg-white border border-urban-border shadow-lg z-30 py-1 divide-y divide-urban-border/40">
          {SORT_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-colors ${
                  isSelected
                    ? 'bg-urban-light-grey text-urban-black font-semibold'
                    : 'text-urban-warm-grey hover:bg-urban-light-grey/60 hover:text-urban-black'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={13} className="text-urban-teal" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
