import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useAuthStore } from '../store/authStore';
import { productService } from '../services/productService';
import { marketingService } from '../services/marketingService';

export const HomePage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterJoined, setNewsletterJoined] = useState(false);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);

  // Live products state strictly from server/admin
  const [newArrivals, setNewArrivals] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [personalizedProducts, setPersonalizedProducts] = useState([]);

  // Deduplication helper to ensure no duplicate items in any list
  const dedupe = (list) => {
    if (!Array.isArray(list)) return [];
    return Array.from(new Map(list.map((item) => [item.id || item._id, item])).values());
  };

  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        // Load categories
        productService.getCategories().then((res) => {
          const list = res?.data || res;
          if (isMounted && Array.isArray(list)) {
            setCategories(list);
          }
        }).catch(() => {});

        // 1. First attempt to load aggregated Redis-cached homepage payload (5 min TTL)
        const cachedHome = await productService.getHomepageData().catch(() => null);
        if (isMounted && cachedHome && (cachedHome.newArrivals?.length || cachedHome.banners?.length)) {
          if (cachedHome.banners?.length > 0) setBanners(cachedHome.banners);
          if (cachedHome.newArrivals?.length > 0) setNewArrivals(dedupe(cachedHome.newArrivals));
          if (cachedHome.trendingProducts?.length > 0) setTrendingProducts(dedupe(cachedHome.trendingProducts));
          if (cachedHome.popularProducts?.length > 0) setPersonalizedProducts(dedupe(cachedHome.popularProducts));
          return;
        }

        // 2. Fallback to individual domain queries
        const [arrivalsRes, trendingRes, curatedRes, bannersRes] = await Promise.all([
          productService.getProducts({ newArrival: true, limit: 4 }).catch(() => null),
          productService.getProducts({ sort: 'popularity', limit: 4 }).catch(() => null),
          productService.getProducts({ featured: true, limit: 4 }).catch(() => null),
          marketingService.getActiveBanners().catch(() => []),
        ]);

        if (isMounted) {
          if (bannersRes && Array.isArray(bannersRes) && bannersRes.length > 0) {
            setBanners(bannersRes);
          }
          if (arrivalsRes?.products?.length > 0) {
            setNewArrivals(dedupe(arrivalsRes.products));
          }
          if (trendingRes?.products?.length > 0) {
            setTrendingProducts(dedupe(trendingRes.products));
          }
          if (curatedRes?.products?.length > 0) {
            setPersonalizedProducts(dedupe(curatedRes.products));
          }
        }
      } catch (err) {
        console.warn('Failed to load homepage live catalog:', err);
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterJoined(true);
      setNewsletterEmail('');
    }
  };

  const heroBanner = banners[0];
  const promoBanner = banners.find((b) => b.targetType === 'Offer' || b.displayOrder > 1) || (banners.length > 1 ? banners[1] : null);

  return (
    <div className="space-y-24 sm:space-y-32 pb-24">
      {/* ========================================================
          3. HERO SECTION (Dynamic Fashion Editorial Hero)
      ======================================================== */}
      <section className="relative w-full min-h-[85vh] sm:min-h-[92vh] flex items-center justify-center overflow-hidden bg-urban-black">
        {heroBanner?.image && (
          <img
            src={heroBanner.image}
            alt={heroBanner.title || "Urban Check Lookbook"}
            className="absolute inset-0 w-full h-full object-cover object-center scale-100 transition-transform duration-1000"
            loading="eager"
          />
        )}

        {/* Minimal Editorial Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        {/* Hero Editorial Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white py-24 sm:py-32">
          {/* Eyebrow & Offer Badge */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4 sm:mb-6">
            <span className="inline-block text-xs uppercase tracking-[0.35em] text-urban-biscuit font-medium">
              {heroBanner?.subtitle || "URBAN CHECK ATELIER"}
            </span>
            {heroBanner?.offerBadge && (
              <span className="inline-block text-[10px] uppercase tracking-widest bg-amber-500 text-urban-black font-bold px-2.5 py-0.5 shadow-sm">
                {heroBanner.offerBadge}
              </span>
            )}
          </div>

          {/* Heading */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-tight sm:leading-none mb-6 text-white drop-shadow-sm uppercase">
            {heroBanner?.title || "DEFINE YOUR EVERYDAY"}
          </h1>

          {/* Supporting Text */}
          <p className="max-w-xl mx-auto text-sm sm:text-base md:text-lg text-white/90 font-light leading-relaxed mb-10 tracking-wide">
            Architectural tailoring, luxury textiles, and relaxed proportions designed for modern distinction.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link
              to={heroBanner?.targetUrl || "/shop"}
              className="w-full sm:w-auto px-9 py-4 bg-white text-urban-black text-xs uppercase tracking-editorial font-medium hover:bg-urban-biscuit hover:text-urban-black transition-all duration-300 shadow-md"
            >
              {heroBanner?.cta || "SHOP COLLECTION"}
            </Link>
            <Link
              to="/shop?gender=women"
              className="w-full sm:w-auto px-9 py-4 bg-transparent border border-white text-white text-xs uppercase tracking-editorial font-medium hover:bg-white hover:text-urban-black transition-all duration-300 shadow-md backdrop-blur-sm"
            >
              SHOP WOMEN
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          3.5 BANNER CAMPAIGN & APPLICABLE OFFER PRODUCTS
      ======================================================== */}
      {heroBanner?.applicableProductItems && heroBanner.applicableProductItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-urban-border">
            <div>
              <div className="flex items-center space-x-2">
                <span className="inline-block text-[11px] uppercase tracking-[0.25em] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2.5 py-0.5">
                  {heroBanner.offerBadge || (heroBanner.discountPercentage ? `${heroBanner.discountPercentage}% OFF CAMPAIGN` : 'SPECIAL OFFER')}
                </span>
                {heroBanner.offerPriceRange && (
                  <span className="text-xs text-urban-teal font-medium">
                    {heroBanner.offerPriceRange}
                  </span>
                )}
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-urban-black mt-2 uppercase">
                {heroBanner.title} — APPLICABLE PRODUCTS
              </h2>
              <p className="text-xs text-urban-warm-grey mt-1">
                Curated designs eligible for this promotional campaign with verified original and offer pricing.
              </p>
            </div>
            <Link
              to={heroBanner.targetUrl || "/shop"}
              className="inline-flex items-center text-xs uppercase tracking-editorial text-urban-black hover:text-urban-teal transition-colors mt-3 md:mt-0 font-medium"
            >
              <span>{heroBanner.cta || "View All Campaign Offers"}</span>
              <ArrowRight size={14} className="ml-1.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {heroBanner.applicableProductItems.map((product) => (
              <ProductCard key={product.id || product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          4. CATEGORY SECTION (SHOP BY CATEGORY)
      ======================================================== */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-urban-border">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-urban-teal font-semibold">
                Curated Silhouettes
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-urban-black mt-1">
                SHOP BY CATEGORY
              </h2>
            </div>
            <Link
              to="/categories"
              className="inline-flex items-center text-xs uppercase tracking-editorial text-urban-black hover:text-urban-teal transition-colors mt-3 md:mt-0 font-medium"
            >
              <span>Explore All Taxonomy</span>
              <ArrowRight size={14} className="ml-1.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id || cat._id}
                className="group relative aspect-[3/4] bg-urban-light-grey overflow-hidden border border-urban-border/60"
              >
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop'}
                  alt={`Category ${cat.name}`}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity" />

                <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end text-white">
                  <span className="text-[10px] uppercase tracking-widest text-urban-biscuit mb-1">
                    {cat.productsCount !== undefined ? `${cat.productsCount} Designs` : 'Atelier Edit'}
                  </span>
                  <h3 className="font-serif text-2xl font-normal tracking-wide text-white mb-2">
                    {cat.name}
                  </h3>
                  <Link
                    to={`/categories/${cat.slug || cat.id || cat._id}`}
                    className="inline-flex items-center text-xs uppercase tracking-editorial font-medium text-white hover:text-urban-biscuit transition-colors group/btn"
                  >
                    <span>SHOP {cat.name.toUpperCase()}</span>
                    <ArrowRight size={13} className="ml-1.5 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          5. NEW ARRIVALS (Product Grid)
      ======================================================== */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-urban-border">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-urban-teal font-semibold">
                Seasonal Select
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-urban-black mt-1">
                NEW ARRIVALS
              </h2>
            </div>
            <Link
              to="/new-arrivals"
              className="inline-flex items-center text-xs uppercase tracking-editorial text-urban-black hover:text-urban-teal transition-colors mt-3 md:mt-0 font-medium"
            >
              <span>View All New Drops</span>
              <ArrowRight size={14} className="ml-1.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {newArrivals.map((product) => (
              <ProductCard key={product.id || product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          6. PROMOTIONAL BANNER
      ======================================================== */}
      {promoBanner && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative min-h-[440px] sm:min-h-[480px] bg-urban-black overflow-hidden border border-urban-border flex items-center">
            {promoBanner.image && (
              <img
                src={promoBanner.image}
                alt={promoBanner.title || "Promotional Edit"}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-100"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-urban-black via-urban-black/90 to-transparent" />

            <div className="relative z-10 p-8 sm:p-16 max-w-xl text-white">
              <span className="inline-block text-[11px] uppercase tracking-[0.3em] text-urban-biscuit font-semibold mb-3">
                {promoBanner.subtitle || "FEATURED PROMOTION"}
              </span>

              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light text-white tracking-tight leading-none mb-4 uppercase">
                {promoBanner.title}
              </h2>

              <p className="text-xs sm:text-sm text-urban-warm-grey-light leading-relaxed mb-8 max-w-md font-light">
                {promoBanner.subtitle || 'Explore selected styles across tailored coats, blazers, and trousers.'}
              </p>

              <Link
                to={promoBanner.targetUrl || "/offers"}
                className="inline-flex items-center space-x-2 px-8 py-3.5 bg-urban-teal hover:bg-urban-teal-dark text-white text-xs uppercase tracking-editorial font-medium transition-colors shadow-sm"
              >
                <span>{promoBanner.cta || "SHOP THE EDIT"}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {promoBanner.applicableProductItems && promoBanner.applicableProductItems.length > 0 && (
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-urban-black uppercase tracking-wider">
                  Featured In This Edit
                </span>
                <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 border border-amber-200">
                  {promoBanner.offerBadge || (promoBanner.discountPercentage ? `${promoBanner.discountPercentage}% OFF` : 'SPECIAL OFFER')}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {promoBanner.applicableProductItems.map((prod) => (
                  <ProductCard key={prod.id || prod._id} product={prod} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          7. TRENDING PRODUCTS
      ======================================================== */}
      {trendingProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-urban-border">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-urban-teal font-semibold">
                Most Coveted
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-urban-black mt-1">
                TRENDING NOW
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center text-xs uppercase tracking-editorial text-urban-black hover:text-urban-teal transition-colors mt-3 md:mt-0 font-medium"
            >
              <span>Shop Full Wardrobe</span>
              <ArrowRight size={14} className="ml-1.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id || product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          8. BRAND STORY (Editorial Manifesto)
      ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-urban-light-grey border border-urban-border overflow-hidden">
          <div className="lg:col-span-6 p-8 sm:p-14 lg:p-16 flex flex-col justify-center">
            <span className="text-[11px] uppercase tracking-[0.3em] text-urban-teal font-semibold mb-2">
              URBAN CHECK
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-urban-black leading-tight mb-6">
              Everyday fashion.<br />
              <span className="italic font-normal">Refined for modern life.</span>
            </h2>

            <p className="text-xs sm:text-sm text-urban-warm-grey leading-relaxed mb-4">
              Founded on the belief that enduring elegance lies in deliberate simplicity. We collaborate directly with generational weavers and master tailors to create pieces of exceptional weight, tactile grace, and architectural balance.
            </p>

            <p className="text-xs text-urban-warm-grey leading-relaxed mb-8">
              No superfluous ornamentation. Pure fabric integrity, sculpted lapels, and silhouettes designed to outlast transient fashion seasons.
            </p>

            <div>
              <Link
                to="/shop"
                className="inline-flex items-center text-xs uppercase tracking-editorial font-medium text-urban-black border-b border-urban-black pb-1 hover:text-urban-teal hover:border-urban-teal transition-colors"
              >
                <span>Discover Our Story</span>
                <ArrowRight size={13} className="ml-2" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative aspect-square lg:aspect-auto min-h-[360px] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&auto=format&fit=crop"
              alt="Urban Check Craftsmanship Workshop"
              loading="lazy"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-urban-black/10" />
          </div>
        </div>
      </section>

      {/* ========================================================
          9. PERSONALIZED SECTION
      ======================================================== */}
      {personalizedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-urban-border">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-urban-teal font-semibold">
                Curated Recommendation
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-urban-black mt-1">
                {isAuthenticated ? 'PICKED FOR YOU' : 'TRENDING FOR YOU'}
              </h2>
              <p className="text-xs text-urban-warm-grey mt-1">
                {isAuthenticated
                  ? `Hand-selected pieces tailored to ${user?.name || 'your'} aesthetic preferences.`
                  : 'Most favored atelier garments based on community acquisition patterns.'}
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center text-xs uppercase tracking-editorial text-urban-black hover:text-urban-teal transition-colors mt-3 md:mt-0 font-medium"
            >
              <span>Explore Curated Edit</span>
              <ArrowRight size={14} className="ml-1.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {personalizedProducts.map((product) => (
              <ProductCard key={product.id || product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          10. NEWSLETTER
      ======================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-8 sm:p-14 bg-urban-light-grey border border-urban-border">
          <span className="text-[10px] uppercase tracking-[0.3em] text-urban-teal font-semibold block mb-3">
            Maison Dispatch
          </span>

          <h2 className="font-serif text-3xl sm:text-4xl font-light text-urban-black mb-3">
            JOIN THE URBAN CHECK COMMUNITY
          </h2>

          <p className="text-xs sm:text-sm text-urban-warm-grey max-w-md mx-auto mb-8 font-light">
            Get early access to new drops, exclusive offers and updates.
          </p>

          {newsletterJoined ? (
            <div className="inline-flex items-center space-x-2 bg-urban-teal text-white text-xs px-6 py-3 rounded-none">
              <Check size={16} />
              <span>Thank you. You have been added to our private dispatch circle.</span>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row max-w-md mx-auto gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 bg-white border border-urban-border px-4 py-3 text-xs text-urban-black placeholder-urban-warm-grey focus:outline-none focus:border-urban-teal"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-urban-black hover:bg-urban-teal text-white text-xs uppercase tracking-editorial font-medium transition-colors"
              >
                JOIN
              </button>
            </form>
          )}

          <span className="block text-[10px] text-urban-warm-grey mt-4">
            Unsubscribe anytime. We respect your privacy and never share communication records.
          </span>
        </div>
      </section>
    </div>
  );
};
