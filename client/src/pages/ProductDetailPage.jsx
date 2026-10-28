import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Zap,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  Star,
  ChevronRight,
  MapPin,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { productService } from '../services/productService';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useBrowseStore } from '../store/browseStore';
import { ProductCard } from '../components/ProductCard';
import { ProductGallery } from '../components/product/ProductGallery';
import { SizeGuideModal } from '../components/product/SizeGuideModal';
import { ReviewSection } from '../components/product/ReviewSection';

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Server state
  const [product, setProduct] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Variant & Purchasing State
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);

  // Modals & UI States
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  // Pincode Delivery Checker State
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);
  const [pincodeError, setPincodeError] = useState('');

  // Stores
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const isWishlisted = useWishlistStore((state) => (product ? state.isInWishlist(product.id || product._id) : false));
  const addRecentlyViewed = useBrowseStore((state) => state.addRecentlyViewed);

  // Fetch product by slug
  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productService.getProductBySlug(slug);

        if (!data) {
          setError('Garment not found in atelier catalog.');
          return;
        }

        if (isMounted) {
          setProduct(data);

          // Set default color variant
          const initialColor =
            data.variants?.[0]?.color || data.colors?.[0]?.name || data.color || 'Default';
          setSelectedColor(initialColor);

          // Add to recently viewed
          if (data.slug) {
            addRecentlyViewed(data.slug);
          }

          // Fetch related recommendations
          const recQuery = {
            limit: 4,
            gender: data.gender,
          };
          productService
            .getProducts(recQuery)
            .then((res) => {
              if (res?.products) {
                setRecommended(
                  res.products.filter((p) => (p.id || p._id) !== (data.id || data._id)).slice(0, 4)
                );
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load product details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slug, addRecentlyViewed]);

  // Active Variant based on selectedColor
  const activeVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    return (
      product.variants.find((v) => v.color.toLowerCase() === selectedColor.toLowerCase()) ||
      product.variants[0]
    );
  }, [product, selectedColor]);

  // Gallery images from active variant or product
  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (activeVariant?.images && activeVariant.images.length > 0) {
      return activeVariant.images;
    }
    const imgs = product.images && product.images.length > 0 ? [...product.images] : [product.image];
    if (product.secondaryImage && !imgs.includes(product.secondaryImage)) {
      imgs.push(product.secondaryImage);
    }
    return imgs.filter(Boolean);
  }, [product, activeVariant]);

  // Available sizes for the active variant
  const availableSizes = useMemo(() => {
    if (!product) return [];
    if (activeVariant?.sizes && activeVariant.sizes.length > 0) {
      return activeVariant.sizes;
    }
    // If embedded variant has single size
    const sizesForColor = (product.variants || [])
      .filter((v) => v.color.toLowerCase() === selectedColor.toLowerCase())
      .map((v) => ({
        size: v.size,
        stock: v.stock ?? 10,
        sku: v.sku,
      }));

    if (sizesForColor.length > 0) return sizesForColor;

    return (product.sizes || ['S', 'M', 'L']).map((s) => ({
      size: typeof s === 'string' ? s : s.size,
      stock: s.stock ?? 10,
      sku: `${product.id || product._id}-${typeof s === 'string' ? s : s.size}`,
    }));
  }, [product, activeVariant, selectedColor]);

  // Reset or adjust selected size when available sizes change
  useEffect(() => {
    if (availableSizes.length > 0) {
      const match = availableSizes.find((s) => s.size === selectedSize && s.stock > 0);
      if (!match) {
        const firstInStock = availableSizes.find((s) => s.stock > 0);
        setSelectedSize(firstInStock ? firstInStock.size : availableSizes[0].size);
      }
    }
  }, [availableSizes, selectedSize]);

  // Size stock check
  const currentSizeObj = availableSizes.find((s) => s.size === selectedSize);
  const currentSizeStock = currentSizeObj?.stock ?? 10;
  const isSelectedSizeOutOfStock = currentSizeStock <= 0;

  // Handlers
  const handleAddToBag = () => {
    if (isSelectedSizeOutOfStock || !product) return;
    const selectedVariantObj = availableSizes.find((s) => s.size === selectedSize);
    const skuToPass = selectedVariantObj?.sku || activeVariant?.sku || null;
    addItem(product, selectedSize, selectedColor, quantity, skuToPass);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isSelectedSizeOutOfStock || !product) return;
    const selectedVariantObj = availableSizes.find((s) => s.size === selectedSize);
    const skuToPass = selectedVariantObj?.sku || activeVariant?.sku || null;
    addItem(product, selectedSize, selectedColor, quantity, skuToPass);
    navigate('/checkout');
  };

  const handlePincodeCheck = (e) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6 || !/^\d+$/.test(pincode)) {
      setPincodeError('Please enter a valid 6-digit Indian PIN code.');
      setPincodeResult(null);
      return;
    }
    setPincodeError('');
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    const dateFormatted = deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    setPincodeResult({
      pincode,
      estimatedDate: dateFormatted,
      express: true,
      codAvailable: true,
    });
  };

  // Loading State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 animate-pulse">
        <div className="h-4 bg-urban-light-grey w-1/4 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 aspect-[3/4] bg-urban-light-grey border border-urban-border/60" />
          <div className="lg:col-span-5 space-y-6">
            <div className="h-4 bg-urban-light-grey w-1/3" />
            <div className="h-8 bg-urban-light-grey w-3/4" />
            <div className="h-6 bg-urban-light-grey w-1/4" />
            <div className="h-20 bg-urban-light-grey w-full" />
            <div className="h-12 bg-urban-light-grey w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Not Found / Error State
  if (error || !product) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <AlertCircle size={40} className="mx-auto text-urban-warm-grey mb-4" />
        <h2 className="font-serif text-2xl font-light text-urban-black">Piece Not Found</h2>
        <p className="text-xs text-urban-warm-grey mt-2 mb-6">
          {error || 'The requested garment is not currently available in our atelier catalog.'}
        </p>
        <Link
          to="/shop"
          className="inline-block px-6 py-2.5 bg-urban-black text-white text-xs uppercase tracking-widest font-semibold hover:bg-urban-teal transition-colors"
        >
          Explore Complete Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Editorial Breadcrumbs */}
      <div className="border-b border-urban-border bg-urban-light-grey/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center space-x-1.5 text-xs text-urban-warm-grey overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-urban-black transition-colors">
              Home
            </Link>
            <ChevronRight size={11} />
            <Link to="/shop" className="hover:text-urban-black transition-colors">
              Catalog
            </Link>
            <ChevronRight size={11} />
            <Link
              to={`/categories/${product.category?.slug || product.categorySlug || 'shop'}`}
              className="hover:text-urban-black transition-colors"
            >
              {product.category?.name || product.categoryName || product.category}
            </Link>
            <ChevronRight size={11} />
            <span className="text-urban-black font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main PDP Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left Column: Product Gallery */}
          <div className="lg:col-span-7">
            <ProductGallery images={galleryImages} productName={product.name} />
          </div>

          {/* Right Column: Purchasing & Specifications */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            {/* Brand & Title */}
            <div className="border-b border-urban-border pb-5">
              <span className="text-[11px] uppercase tracking-[0.25em] text-urban-teal font-semibold block">
                {product.brandName || product.brand?.name || 'Urban Check'}
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-urban-black font-light mt-1.5 leading-snug">
                {product.name}
              </h1>

              {/* Price, Original Price, Discount & Rating */}
              <div className="mt-4 flex items-baseline justify-between flex-wrap gap-2">
                <div className="flex items-baseline space-x-3">
                  <span className="text-2xl sm:text-3xl font-semibold text-urban-black">
                    ₹{(product.activeOffer?.offerPrice || product.price)?.toLocaleString('en-IN')}
                  </span>
                  {((product.activeOffer?.originalPrice || product.originalPrice) > (product.activeOffer?.offerPrice || product.price)) && (
                    <span className="text-sm text-urban-warm-grey line-through">
                      ₹{(product.activeOffer?.originalPrice || product.originalPrice).toLocaleString('en-IN')}
                    </span>
                  )}
                  {product.activeOffer?.badgeText ? (
                    <span className="bg-urban-teal text-white text-[10px] uppercase tracking-widest px-2.5 py-0.5 font-bold shadow-sm">
                      {product.activeOffer.badgeText}
                    </span>
                  ) : product.discountPercent > 0 ? (
                    <span className="bg-urban-black text-urban-biscuit text-[10px] uppercase tracking-widest px-2 py-0.5 font-bold">
                      {product.discountPercent}% OFF
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center space-x-1.5 text-xs text-urban-warm-grey hover:text-urban-black transition-colors cursor-pointer"
                >
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={13}
                        className={
                          s <= Math.round(product.rating || 5)
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-urban-border'
                        }
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-urban-black">{product.rating || 5.0}</span>
                  <span>({product.reviewCount ?? product.reviewsCount ?? 0} appraisals)</span>
                </button>
              </div>
              <p className="text-[11px] text-urban-warm-grey mt-1">
                Inclusive of all custom duties and complimentary courier courtesy.
              </p>
            </div>

            {/* Color Variant Selector */}
            <div className="py-5 border-b border-urban-border">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs uppercase tracking-editorial text-urban-warm-grey">
                  Atelier Palette: <strong className="text-urban-black">{selectedColor}</strong>
                </span>
                <span className="text-[11px] text-urban-warm-grey">
                  {product.colors?.length || 1} available shades
                </span>
              </div>
              <div className="flex items-center space-x-3">
                {(product.colors || [{ name: 'Default', hex: '#111111' }]).map((c) => {
                  const isSelected = selectedColor.toLowerCase() === c.name.toLowerCase();
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`group relative p-1 rounded-full border-2 transition-all ${
                        isSelected
                          ? 'border-urban-black ring-1 ring-urban-black scale-105'
                          : 'border-transparent hover:border-urban-border hover:scale-105'
                      }`}
                      title={c.name}
                    >
                      <span
                        className="block w-6 h-6 rounded-full border border-black/20"
                        style={{ backgroundColor: c.hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selector with Stock Status */}
            <div className="py-5 border-b border-urban-border">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs uppercase tracking-editorial text-urban-warm-grey">
                  Select Size: <strong className="text-urban-black">{selectedSize}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs uppercase tracking-wider text-urban-teal hover:underline font-semibold"
                >
                  Size Guide
                </button>
              </div>

              {/* Sizes Grid */}
              <div className="grid grid-cols-5 gap-2">
                {availableSizes.map((s) => {
                  const isSelected = selectedSize === s.size;
                  const isOutOfStock = s.stock <= 0;
                  return (
                    <button
                      key={s.size}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => {
                        setSelectedSize(s.size);
                        setQuantity(1);
                      }}
                      className={`relative py-3 text-center font-mono text-xs uppercase tracking-wider border transition-all ${
                        isOutOfStock
                          ? 'bg-urban-light-grey/50 border-urban-border/60 text-urban-warm-grey cursor-not-allowed line-through'
                          : isSelected
                          ? 'border-urban-black bg-urban-black text-white font-semibold'
                          : 'border-urban-border bg-white text-urban-black hover:border-urban-black'
                      }`}
                    >
                      <span>{s.size}</span>
                      {s.stock > 0 && s.stock <= 3 && !isSelected && (
                        <span className="absolute -top-1.5 -right-1 w-2 h-2 rounded-full bg-amber-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Size Stock Notice */}
              <div className="mt-2.5 text-[11px]">
                {isSelectedSizeOutOfStock ? (
                  <span className="text-red-700 font-semibold">
                    Selected size ({selectedSize}) is currently archived or sold out.
                  </span>
                ) : currentSizeStock <= 3 ? (
                  <span className="text-amber-800 font-semibold flex items-center space-x-1">
                    <Sparkles size={12} />
                    <span>Hurry, only {currentSizeStock} piece{currentSizeStock > 1 ? 's' : ''} remaining in size {selectedSize}</span>
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">
                    In stock — ready for priority atelier packaging
                  </span>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            {!isSelectedSizeOutOfStock && (
              <div className="py-4 border-b border-urban-border flex items-center justify-between">
                <span className="text-xs uppercase tracking-editorial text-urban-warm-grey">
                  Quantity
                </span>
                <div className="flex items-center border border-urban-border">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center text-urban-black hover:bg-urban-light-grey disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    –
                  </button>
                  <span className="w-10 text-center font-mono text-xs font-semibold text-urban-black">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(currentSizeStock, quantity + 1))}
                    disabled={quantity >= currentSizeStock}
                    className="w-8 h-8 flex items-center justify-center text-urban-black hover:bg-urban-light-grey disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Main Action Buttons: Add to Bag, Buy Now, Wishlist */}
            <div className="py-6 border-b border-urban-border space-y-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToBag}
                  disabled={isSelectedSizeOutOfStock}
                  className={`flex-1 py-4 text-xs uppercase tracking-editorial font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm ${
                    isSelectedSizeOutOfStock
                      ? 'bg-urban-warm-grey/30 text-urban-warm-grey cursor-not-allowed'
                      : added
                      ? 'bg-urban-black text-white'
                      : 'bg-urban-teal hover:bg-urban-teal-dark text-white'
                  }`}
                >
                  {added ? (
                    <>
                      <Check size={18} />
                      <span>Added to Shopping Bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} strokeWidth={1.5} />
                      <span>
                        {isSelectedSizeOutOfStock ? 'Sold Out' : 'Add to Shopping Bag'}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id || product._id)}
                  className={`p-4 border transition-colors ${
                    isWishlisted
                      ? 'border-urban-teal text-urban-teal bg-urban-teal/5'
                      : 'border-urban-border text-urban-black hover:border-urban-black'
                  }`}
                  title={isWishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
                >
                  <Heart
                    size={20}
                    strokeWidth={1.5}
                    className={isWishlisted ? 'fill-urban-teal' : ''}
                  />
                </button>
              </div>

              {!isSelectedSizeOutOfStock && (
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3.5 bg-urban-black hover:bg-black text-white text-xs uppercase tracking-editorial font-semibold flex items-center justify-center space-x-2 transition-colors border border-urban-black"
                >
                  <Zap size={16} />
                  <span>Instant Purchase (Buy Now)</span>
                </button>
              )}
            </div>

            {/* Pincode Delivery Checker */}
            <div className="py-5 border-b border-urban-border">
              <div className="flex items-center space-x-2 text-xs font-semibold text-urban-black uppercase tracking-wider mb-2">
                <MapPin size={14} className="text-urban-teal" />
                <span>Estimate Delivery & Availability</span>
              </div>
              <form onSubmit={handlePincodeCheck} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.trim())}
                  placeholder="Enter 6-digit PIN code"
                  className="flex-1 px-3 py-2 text-xs border border-urban-border focus:border-urban-black focus:outline-none bg-white font-mono"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-urban-black text-white text-xs uppercase tracking-wider font-semibold hover:bg-urban-teal transition-colors"
                >
                  Check
                </button>
              </form>

              {pincodeError && (
                <p className="text-[11px] text-red-600 mt-2">{pincodeError}</p>
              )}

              {pincodeResult && (
                <div className="mt-3 p-3 bg-urban-light-grey/80 border border-urban-border text-xs space-y-1">
                  <div className="flex items-center text-urban-teal font-semibold">
                    <Truck size={14} className="mr-1.5" />
                    <span>Deliver to {pincodeResult.pincode}</span>
                  </div>
                  <p className="text-urban-black">
                    Expected Delivery by{' '}
                    <strong className="underline decoration-urban-teal">
                      {pincodeResult.estimatedDate}
                    </strong>
                  </p>
                  <p className="text-[11px] text-urban-warm-grey">
                    Free Priority Air Express Dispatch • Cash on Delivery Eligible
                  </p>
                </div>
              )}
            </div>

            {/* Value Highlights */}
            <div className="pt-5 space-y-2.5 text-xs text-urban-warm-grey">
              <div className="flex items-center space-x-2.5">
                <Truck size={15} className="text-urban-teal flex-shrink-0" />
                <span>Complimentary priority dispatch on all atelier orders</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <RotateCcw size={15} className="text-urban-teal flex-shrink-0" />
                <span>14-day door inspection & hassle-free return courtesy</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <ShieldCheck size={15} className="text-urban-teal flex-shrink-0" />
                <span>100% Certified Authentic fabric provenance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Product Dossier */}
        <div className="mt-16 pt-10 border-t border-urban-border">
          <div className="flex border-b border-urban-border space-x-8 overflow-x-auto whitespace-nowrap">
            {[
              { id: 'description', label: 'Description' },
              { id: 'details', label: 'Garment Details' },
              { id: 'material', label: 'Material & Care' },
              { id: 'shipping', label: 'Shipping & Returns' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-xs uppercase tracking-editorial font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-urban-teal text-urban-teal'
                    : 'text-urban-warm-grey hover:text-urban-black'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-8 text-xs text-urban-warm-grey leading-relaxed max-w-3xl">
            {activeTab === 'description' && (
              <div className="space-y-4">
                <p className="text-sm text-urban-black font-serif leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {activeTab === 'details' && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.details?.map((detail, index) => (
                  <li key={index} className="flex items-start space-x-2 text-urban-black">
                    <span className="w-1.5 h-1.5 bg-urban-teal rounded-full mt-1.5 flex-shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'material' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-urban-black uppercase tracking-wider text-[11px] mb-1">
                    Composition
                  </h4>
                  <p>{product.material || '90% Italian Virgin Wool, 10% Mulberry Silk.'}</p>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-urban-black uppercase tracking-wider text-[11px] mb-1">
                    Dispatch & Shipping
                  </h4>
                  <p>Complimentary priority dispatch within 24 hours. Delivered in 3-5 business days across India.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews Section */}
        <ReviewSection product={product} />

        {/* Recommended Products */}
        {recommended.length > 0 && (
          <div className="pt-16 border-t border-urban-border">
            <div className="flex items-center justify-between pb-6 mb-8 border-b border-urban-border">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-urban-teal font-semibold">
                  Complementary Wardrobe
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-urban-black font-light mt-1">
                  You May Also Like
                </h3>
              </div>
              <Link
                to="/shop"
                className="text-xs uppercase tracking-wider text-urban-warm-grey hover:text-urban-black font-medium transition-colors hidden sm:block"
              >
                View Full Collection →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recommended.map((item) => (
                <ProductCard key={item.id || item._id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sizing Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={product.category?.name || product.categoryName || 'tops'}
      />
    </div>
  );
};
