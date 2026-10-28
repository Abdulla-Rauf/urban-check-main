import React, { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, ChevronRight, ChevronLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import { ProductCard } from '../ProductCard';
import { ProductFilterSidebar, PRICE_RANGES } from './ProductFilterSidebar';
import { ProductFilterDrawer } from './ProductFilterDrawer';
import { SortDropdown } from './SortDropdown';
import { ActiveFilterChips } from './ActiveFilterChips';

const INITIAL_FILTERS = {
  categories: [],
  brands: [],
  sizes: [],
  colors: [],
  priceRanges: [],
  genders: [],
  inStockOnly: false,
  minRating: 0,
};

export const ProductListingView = ({
  title = 'All Collections',
  subtitle = 'Refined modern essentials tailored with timeless proportions.',
  breadcrumbs = [{ label: 'Home', path: '/' }, { label: 'Shop' }],
  preSelectedCategory = null,
  preSelectedBrand = null,
  preSelectedGender = null,
  isNewArrivalOnly = false,
  isOffersOnly = false,
  searchQuery = '',
}) => {
  const [searchParams] = useSearchParams();
  const urlGender = searchParams.get('gender');
  const urlCategory = searchParams.get('category');

  const [filters, setFilters] = useState(() => ({
    ...INITIAL_FILTERS,
    categories: preSelectedCategory ? [preSelectedCategory] : (urlCategory ? [urlCategory] : []),
    brands: preSelectedBrand ? [preSelectedBrand] : [],
    genders: preSelectedGender ? [preSelectedGender] : (urlGender ? [urlGender] : []),
  }));

  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(1);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Server data states
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync if URL query params change
  useEffect(() => {
    if (urlGender && !filters.genders.includes(urlGender)) {
      setFilters((prev) => ({ ...prev, genders: [urlGender] }));
    }
    if (urlCategory && !filters.categories.includes(urlCategory)) {
      setFilters((prev) => ({ ...prev, categories: [urlCategory] }));
    }
  }, [urlGender, urlCategory]);

  // Fetch products from server
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Parse price ranges
      let minPrice = undefined;
      let maxPrice = undefined;
      if (filters.priceRanges.length > 0) {
        const ranges = filters.priceRanges
          .map((id) => PRICE_RANGES.find((r) => r.id === id))
          .filter(Boolean);
        if (ranges.length > 0) {
          minPrice = Math.min(...ranges.map((r) => r.min));
          maxPrice = Math.max(...ranges.map((r) => r.max));
        }
      }

      const queryParams = {
        page,
        limit: 12,
        sort: sortBy,
        category: filters.categories.length > 0 ? filters.categories : undefined,
        brand: filters.brands.length > 0 ? filters.brands : undefined,
        gender: filters.genders.length > 0 ? filters.genders : undefined,
        size: filters.sizes.length > 0 ? filters.sizes : undefined,
        color: filters.colors.length > 0 ? filters.colors : undefined,
        minPrice,
        maxPrice,
        rating: filters.minRating > 0 ? filters.minRating : undefined,
        availability: filters.inStockOnly ? true : undefined,
        newArrival: isNewArrivalOnly ? true : undefined,
        isOffer: isOffersOnly ? true : undefined,
        search: searchQuery || undefined,
      };

      const res = await productService.getProducts(queryParams);

      if (res?.products) {
        setProducts(res.products);
        setPagination(
          res.pagination || {
            total: res.products.length,
            page: 1,
            limit: 12,
            totalPages: 1,
            hasPrev: false,
            hasNext: false,
          }
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to load garments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, page, isNewArrivalOnly, isOffersOnly, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 on filter or sort change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      ...INITIAL_FILTERS,
      categories: preSelectedCategory ? [preSelectedCategory] : [],
      brands: preSelectedBrand ? [preSelectedBrand] : [],
      genders: preSelectedGender ? [preSelectedGender] : [],
    });
    setPage(1);
  };

  // Active filter count for mobile badge
  const activeCount =
    filters.categories.length +
    filters.brands.length +
    filters.sizes.length +
    filters.colors.length +
    filters.priceRanges.length +
    filters.genders.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0);

  return (
    <div className="bg-white min-h-screen">
      {/* Editorial Header Section */}
      <div className="border-b border-urban-border bg-urban-light-grey/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Breadcrumb Trail */}
          <nav className="flex items-center space-x-1.5 text-xs text-urban-warm-grey mb-3">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {crumb.path ? (
                  <Link to={crumb.path} className="hover:text-urban-black transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-urban-black font-medium">{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && <ChevronRight size={12} />}
              </React.Fragment>
            ))}
          </nav>

          {/* Title & Editorial Subtitle */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl text-urban-black tracking-tight">
                {title}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-urban-warm-grey max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            </div>
            <div className="text-xs uppercase tracking-widest text-urban-warm-grey font-medium whitespace-nowrap">
              {pagination.total} {pagination.total === 1 ? 'piece' : 'pieces'} curated
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Control Bar: Mobile Filter Toggle + Results Count + Sort Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-urban-border">
          {/* Mobile Filter Button */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden flex items-center space-x-2 text-xs uppercase tracking-wider py-2 px-3 border border-urban-border hover:border-urban-black transition-colors"
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {activeCount > 0 && (
                <span className="w-4 h-4 bg-urban-teal text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {activeCount}
                </span>
              )}
            </button>
            <span className="text-xs text-urban-warm-grey hidden sm:inline">
              Showing {products.length} of {pagination.total} pieces
            </span>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center justify-end">
            <SortDropdown value={sortBy} onChange={handleSortChange} />
          </div>
        </div>

        {/* Active Filter Chips */}
        <ActiveFilterChips
          filters={filters}
          setFilters={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Catalog Body: Sidebar + Grid */}
        <div className="flex gap-8 lg:gap-12 mt-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block">
            <ProductFilterSidebar
              filters={filters}
              setFilters={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>

          {/* Product Grid Area */}
          <div className="flex-1">
            {/* Loading State: Luxury Skeleton Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-10 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="flex flex-col space-y-3">
                    <div className="aspect-[3/4] bg-urban-light-grey border border-urban-border/60" />
                    <div className="h-2.5 bg-urban-light-grey w-1/3" />
                    <div className="h-3.5 bg-urban-light-grey w-3/4" />
                    <div className="h-3 bg-urban-light-grey w-1/4" />
                  </div>
                ))}
              </div>
            ) : error ? (
              /* Error State */
              <div className="py-16 text-center flex flex-col items-center justify-center border border-red-200 bg-red-50/50 p-6">
                <AlertCircle size={32} className="text-red-600 mb-3" />
                <h3 className="font-serif text-lg text-urban-black font-medium">
                  Atelier Catalog Temporarily Unavailable
                </h3>
                <p className="text-xs text-urban-warm-grey mt-1 max-w-sm">{error}</p>
                <button
                  type="button"
                  onClick={fetchProducts}
                  className="mt-5 px-5 py-2 bg-urban-black text-white text-xs uppercase tracking-widest font-semibold flex items-center space-x-2 hover:bg-urban-teal transition-colors"
                >
                  <RefreshCw size={13} />
                  <span>Retry Request</span>
                </button>
              </div>
            ) : products.length > 0 ? (
              /* Success State: Products Grid */
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-10">
                  {products.map((product) => (
                    <ProductCard key={product.id || product._id} product={product} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="mt-14 pt-8 border-t border-urban-border flex items-center justify-between">
                    <button
                      type="button"
                      disabled={!pagination.hasPrev}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="flex items-center space-x-1.5 px-4 py-2 border border-urban-border text-xs uppercase tracking-widest font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:border-urban-black transition-colors"
                    >
                      <ChevronLeft size={14} />
                      <span>Previous</span>
                    </button>

                    <span className="text-xs text-urban-warm-grey font-mono">
                      Page <strong className="text-urban-black">{pagination.page}</strong> of{' '}
                      {pagination.totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={!pagination.hasNext}
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      className="flex items-center space-x-1.5 px-4 py-2 border border-urban-border text-xs uppercase tracking-widest font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:border-urban-black transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Empty State */
              <div className="py-20 text-center flex flex-col items-center justify-center border border-dashed border-urban-border/80 px-4">
                <div className="w-12 h-12 rounded-full bg-urban-light-grey flex items-center justify-center text-urban-warm-grey mb-4">
                  <SlidersHorizontal size={22} />
                </div>
                <h3 className="font-serif text-xl text-urban-black font-semibold">
                  No matching garments found
                </h3>
                <p className="mt-2 text-xs text-urban-warm-grey max-w-md">
                  We could not find any products matching your specific refinement criteria. Try
                  resetting filters or adjusting your selections.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-6 px-6 py-2.5 bg-urban-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-urban-teal transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <ProductFilterDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        filters={filters}
        setFilters={handleFilterChange}
        onReset={handleResetFilters}
        totalResults={pagination.total}
      />
    </div>
  );
};
