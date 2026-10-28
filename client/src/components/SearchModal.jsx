import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { POPULAR_SEARCHES } from '../constants';
import { useBrowseStore } from '../store/browseStore';
import { productService } from '../services/productService';

export const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } =
    useBrowseStore();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Live search debounce with Redis-cached suggestions endpoint
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await productService.getSearchSuggestions(query.trim(), 4);
        if (Array.isArray(results) && results.length > 0) {
          setSuggestions(results);
        } else {
          // Fallback to product search if suggestions return empty
          const res = await productService.getProducts({
            search: query.trim(),
            limit: 4,
          });
          if (res?.products) {
            setSuggestions(res.products);
          }
        }
      } catch (err) {
        console.error('Search suggestions error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleExecuteSearch = (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return;
    addRecentSearch(searchTerm);
    onClose();
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleExecuteSearch(query);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-start items-center">
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-urban-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-white border-b border-urban-border shadow-2xl mt-12 sm:mt-20 mx-4 z-10 animate-fadeIn">
        {/* Search Header Bar */}
        <form onSubmit={handleSubmit} className="relative flex items-center border-b border-urban-border px-6 py-4">
          <Search size={20} className="text-urban-warm-grey mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tailored blazers, cashmere knits, trousers..."
            className="w-full text-base sm:text-lg bg-transparent text-urban-black placeholder:text-urban-warm-grey focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-urban-warm-grey hover:text-urban-black mr-2"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-urban-warm-grey hover:text-urban-black border border-urban-border rounded-none text-xs uppercase tracking-widest px-3"
          >
            Esc
          </button>
        </form>

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto space-y-8 text-xs">
          {/* Real-time Matching Product Suggestions */}
          {query.trim() && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.2em] text-urban-teal font-semibold block">
                  Matching Pieces ({suggestions.length})
                </span>
                {isSearching && (
                  <span className="text-[10px] text-urban-warm-grey animate-pulse">Searching...</span>
                )}
              </div>
              {suggestions.length === 0 && !isSearching ? (
                <div className="py-6 text-center text-urban-warm-grey">
                  No direct products found for "{query}". Press enter to view full search catalog.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map((item) => (
                    <Link
                      key={item.id || item._id}
                      to={`/product/${item.slug}`}
                      onClick={() => {
                        addRecentSearch(query);
                        onClose();
                      }}
                      className="flex items-center space-x-3 p-2.5 border border-urban-border hover:border-urban-teal bg-urban-light-grey/30 transition-all group"
                    >
                      <img
                        src={item.variants?.[0]?.images?.[0] || item.images?.[0] || item.image}
                        alt={item.name}
                        className="w-12 h-14 object-cover object-center flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] uppercase tracking-wider text-urban-warm-grey block">
                          {item.brandName || item.brand?.name || 'Urban Check'}
                        </span>
                        <h4 className="font-serif text-sm font-medium text-urban-black group-hover:text-urban-teal truncate">
                          {item.name}
                        </h4>
                        <span className="text-xs font-semibold text-urban-black">
                          ₹{item.price?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-urban-warm-grey group-hover:text-urban-teal flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Searches */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-urban-warm-grey font-semibold flex items-center space-x-1.5">
                <Clock size={12} />
                <span>Recent Searches</span>
              </span>
              {recentSearches.length > 0 && (
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="text-[10px] uppercase tracking-wider text-urban-teal hover:underline font-medium"
                >
                  Clear History
                </button>
              )}
            </div>

            {recentSearches.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <span
                    key={term}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-urban-light-grey border border-urban-border text-urban-black group cursor-pointer hover:border-urban-black"
                  >
                    <button
                      type="button"
                      onClick={() => handleExecuteSearch(term)}
                      className="hover:text-urban-teal"
                    >
                      {term}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecentSearch(term)}
                      className="text-urban-warm-grey hover:text-urban-black p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-urban-warm-grey text-[11px] italic">No recent search history.</p>
            )}
          </div>

          {/* Popular Curations */}
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-urban-warm-grey font-semibold block mb-3 flex items-center space-x-1.5">
              <TrendingUp size={12} />
              <span>Trending Searches</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleExecuteSearch(tag)}
                  className="px-3 py-1.5 border border-urban-border/70 text-urban-black hover:border-urban-black hover:bg-urban-black hover:text-white transition-all text-xs"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-urban-light-grey/40 border-t border-urban-border flex items-center justify-between text-[11px] text-urban-warm-grey">
          <span>Press [Enter] to submit search inquiry</span>
          <span>Urban Check Global Atelier Catalog</span>
        </div>
      </div>
    </div>
  );
};
