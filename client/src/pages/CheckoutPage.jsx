import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Lock,
  ShieldCheck,
  ArrowRight,
  Truck,
  CreditCard,
  Banknote,
  MapPin,
  AlertCircle,
  Plus,
  Check,
  ChevronRight,
  Tag,
  X,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { orderService } from '../services/orderService';
import { addressService } from '../services/addressService';
import { marketingService } from '../services/marketingService';

export const CheckoutPage = () => {
  const { items, totals, clearCart, isLoading: cartLoading } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Multi-step checkout states: 1 = Address/Customer, 2 = Shipping & Payment, 3 = Confirmation
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Saved Addresses for authenticated user
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  const [saveToAddressBook, setSaveToAddressBook] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    landmark: '',
    paymentMethod: 'COD',
  });

  // Load saved addresses if customer is authenticated
  useEffect(() => {
    let isMounted = true;
    async function loadAddresses() {
      if (isAuthenticated) {
        try {
          const addrs = await addressService.getAddresses();
          if (isMounted && addrs && addrs.length > 0) {
            setSavedAddresses(addrs);
            const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
            setSelectedAddressId(defaultAddr._id);
            setFormData((prev) => ({
              ...prev,
              name: defaultAddr.name || prev.name,
              phone: defaultAddr.phone || prev.phone,
              address: defaultAddr.address,
              apartment: defaultAddr.apartment || '',
              city: defaultAddr.city,
              state: defaultAddr.state,
              country: defaultAddr.country || 'India',
              postalCode: defaultAddr.postalCode,
              landmark: defaultAddr.landmark || '',
            }));
          }
        } catch (err) {
          console.warn('Failed to load saved addresses:', err);
        }
      }
    }

    loadAddresses();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setFormData((prev) => ({
      ...prev,
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      apartment: addr.apartment || '',
      city: addr.city,
      state: addr.state,
      country: addr.country || 'India',
      postalCode: addr.postalCode,
      landmark: addr.landmark || '',
    }));
  };

  const handleUseNewAddress = () => {
    setSelectedAddressId('new');
    setFormData((prev) => ({
      ...prev,
      address: '',
      apartment: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
      landmark: '',
    }));
  };

  // Coupon Handlers
  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    if (!couponCodeInput.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError('');

    try {
      const code = couponCodeInput.trim().toUpperCase();
      const res = await marketingService.validateCoupon({
        couponCode: code,
        cartItems: items,
        subtotal: totals.subtotal || 0,
      });

      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        setCouponCodeInput('');
      } else {
        setCouponError(res.message || 'Invalid coupon code');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError(err.message || 'Unable to apply promo coupon');
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  // Pricing values from backend cart authority
  const subtotal = totals.subtotal || 0;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const shipping = totals.shipping ?? (subtotal >= 2500 || subtotal === 0 ? 0 : 250);
  const tax = Math.round(Math.max(0, subtotal - couponDiscount) * 0.05);
  const grandTotal = Math.max(0, subtotal - couponDiscount + shipping);
  const hasUnavailableItems =
    totals.hasUnavailableItems || items.some((i) => i.isAvailable === false);

  // Order Placement
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (items.length === 0) {
      setErrorMessage('Your shopping bag is empty.');
      return;
    }

    if (hasUnavailableItems) {
      setErrorMessage(
        'Some pieces in your bag are currently unavailable. Please adjust your bag before placing your order.'
      );
      return;
    }

    if (!formData.name || !formData.phone || !formData.address || !formData.city || !formData.postalCode) {
      setErrorMessage('Please complete all required delivery destination fields.');
      return;
    }

    try {
      setIsSubmitting(true);

      // If user selected to save address to address book and entered a new address
      if (isAuthenticated && selectedAddressId === 'new' && saveToAddressBook) {
        try {
          await addressService.createAddress({
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            apartment: formData.apartment,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            postalCode: formData.postalCode,
            landmark: formData.landmark,
            isDefault: savedAddresses.length === 0,
          });
        } catch (addrErr) {
          console.warn('Address auto-save notice:', addrErr);
        }
      }

      // Execute order creation via OrderService
      const orderPayload = {
        shippingAddress: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          apartment: formData.apartment,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode,
          landmark: formData.landmark,
        },
        paymentMethod: formData.paymentMethod,
        customerInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        couponCode: appliedCoupon?.couponCode || '',
      };

      const orderResult = await orderService.checkout(orderPayload);
      setConfirmedOrder(orderResult);
      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMessage(err.message || 'Unable to confirm order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ========================================================
     ORDER CONFIRMATION VIEW (Premium Success Screen)
  ======================================================== */
  if (confirmedOrder) {
    const formattedOrderNumber = confirmedOrder.orderNumber || confirmedOrder.id;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        {/* Luxury Monogram / Success Emblem */}
        <div className="w-20 h-20 bg-urban-teal/10 rounded-full flex items-center justify-center mx-auto mb-6 text-urban-teal">
          <CheckCircle2 size={44} strokeWidth={1.5} />
        </div>

        <span className="text-[11px] uppercase tracking-[0.3em] text-urban-teal font-semibold block mb-2">
          Order Confirmed
        </span>

        <h1 className="font-serif text-3xl sm:text-5xl text-urban-black font-normal tracking-tight mb-3">
          Order #{formattedOrderNumber}
        </h1>

        <p className="font-serif text-lg sm:text-xl text-urban-warm-grey italic mb-6">
          Thank you for shopping with Urban Check.
        </p>

        <p className="text-xs sm:text-sm text-urban-warm-grey max-w-lg mx-auto leading-relaxed mb-8">
          Your tailored order has been registered with our atelier dispatch division.
          A confirmation brief has been dispatched to <strong>{confirmedOrder.customer?.email || formData.email}</strong>.
        </p>

        {/* Dispatch Summary Card */}
        <div className="bg-urban-light-grey border border-urban-border p-6 text-left max-w-lg mx-auto mb-10 text-xs space-y-3">
          <div className="flex justify-between border-b border-urban-border/60 pb-3">
            <span className="text-urban-warm-grey uppercase tracking-widest text-[10px]">Destination</span>
            <span className="font-medium text-urban-black text-right">
              {confirmedOrder.shippingAddress?.address}, {confirmedOrder.shippingAddress?.city} - {confirmedOrder.shippingAddress?.postalCode}
            </span>
          </div>

          <div className="flex justify-between border-b border-urban-border/60 pb-3">
            <span className="text-urban-warm-grey uppercase tracking-widest text-[10px]">Payment Method</span>
            <span className="font-medium text-urban-black">
              {confirmedOrder.payment?.method === 'COD' ? 'Cash on Delivery (Pay upon arrival)' : 'Prepaid Online'}
            </span>
          </div>

          <div className="flex justify-between border-b border-urban-border/60 pb-3">
            <span className="text-urban-warm-grey uppercase tracking-widest text-[10px]">Courier Service</span>
            <span className="font-medium text-urban-teal">
              {confirmedOrder.shipment?.carrier || 'DTDC Express'} ({confirmedOrder.shipment?.trackingNumber || 'AWB Generated'})
            </span>
          </div>

          <div className="flex justify-between pt-1 font-serif text-sm font-bold text-urban-black">
            <span>Total Payable</span>
            <span>₹{confirmedOrder.pricing?.grandTotal?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={`/account/orders/${formattedOrderNumber}`}
            className="w-full sm:w-auto px-8 py-3.5 bg-urban-teal hover:bg-urban-teal-dark text-white text-xs uppercase tracking-editorial font-medium transition-colors shadow-sm"
          >
            Track Order
          </Link>
          <Link
            to="/shop"
            className="w-full sm:w-auto px-8 py-3.5 border border-urban-black text-urban-black text-xs uppercase tracking-editorial font-medium hover:bg-urban-black hover:text-white transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  /* ========================================================
     CHECKOUT FLOW VIEW
  ======================================================== */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Checkout Header & Breadcrumbs */}
      <div className="border-b border-urban-border pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          {/* Breadcrumb Steps */}
          <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-urban-warm-grey mb-2">
            <Link to="/cart" className="hover:text-urban-black">
              Cart
            </Link>
            <ChevronRight size={12} />
            <span className={currentStep === 1 ? 'text-urban-teal font-bold' : ''}>Customer & Address</span>
            <ChevronRight size={12} />
            <span className={currentStep === 2 ? 'text-urban-teal font-bold' : ''}>Shipping & Payment</span>
            <ChevronRight size={12} />
            <span className="text-urban-warm-grey/60">Confirmation</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-urban-black font-light">
            Bespoke Checkout
          </h1>
        </div>

        <div className="flex items-center space-x-2 text-xs text-urban-warm-grey">
          <Lock size={15} className="text-urban-teal" />
          <span>SSL 256-Bit Atelier Encrypted</span>
        </div>
      </div>

      {/* Error Message Notice */}
      {errorMessage && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-900 text-xs flex items-center space-x-3">
          <AlertCircle size={18} className="flex-shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Stock warning */}
      {hasUnavailableItems && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-3">
          <AlertCircle size={18} className="flex-shrink-0 text-amber-600" />
          <span>
            Some pieces in your shopping bag are out of stock. Please return to your{' '}
            <Link to="/cart" className="underline font-semibold">
              Shopping Bag
            </Link>{' '}
            to remove them before proceeding.
          </span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Multi-step checkout details */}
        <div className="lg:col-span-8 space-y-8">
          {/* STEP 1: Customer Contact Information */}
          <div className="p-6 bg-urban-light-grey/40 border border-urban-border">
            <h3 className="font-serif text-lg font-semibold text-urban-black mb-4 flex items-center justify-between">
              <span>1. Customer Contact</span>
              {isAuthenticated ? (
                <span className="text-[10px] font-sans uppercase tracking-widest text-urban-teal font-medium">
                  Signed in as {user?.name}
                </span>
              ) : (
                <Link
                  to="/login?redirect=/checkout"
                  className="text-xs text-urban-teal underline font-normal font-sans"
                >
                  Log in for faster checkout
                </Link>
              )}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@domain.com"
                  className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                />
              </div>

              <div>
                <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: Delivery Destination */}
          <div className="p-6 bg-urban-light-grey/40 border border-urban-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-semibold text-urban-black">
                2. Delivery Destination
              </h3>
              {isAuthenticated && savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={handleUseNewAddress}
                  className="text-xs text-urban-teal hover:underline flex items-center space-x-1"
                >
                  <Plus size={13} />
                  <span>Enter New Location</span>
                </button>
              )}
            </div>

            {/* Saved Address Cards for quick selection */}
            {isAuthenticated && savedAddresses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {savedAddresses.map((addr) => {
                  const isSelected = selectedAddressId === addr._id;
                  return (
                    <div
                      key={addr._id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`p-3.5 border cursor-pointer transition-all text-xs relative ${
                        isSelected
                          ? 'border-urban-teal bg-white shadow-sm ring-1 ring-urban-teal'
                          : 'border-urban-border bg-white hover:border-urban-black'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-serif font-semibold text-urban-black">
                          {addr.name}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[9px] uppercase tracking-wider text-urban-teal font-semibold">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-urban-warm-grey text-[11px] leading-relaxed">
                        {addr.address}
                        {addr.apartment ? `, ${addr.apartment}` : ''}
                        <br />
                        {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Address Input Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="First & Last Name"
                  className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House number, building name, street"
                  className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                />
              </div>

              <div>
                <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                  Apartment, Suite, Unit
                </label>
                <input
                  type="text"
                  value={formData.apartment}
                  onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                  placeholder="Floor, suite, or flat number"
                  className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                />
              </div>

              <div>
                <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                  Landmark
                </label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  placeholder="Near prominent location"
                  className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                />
              </div>

              <div>
                <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                />
              </div>

              <div>
                <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                />
              </div>

              <div>
                <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                  PIN / Postal Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="6-digit PIN code"
                  className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                />
              </div>

              <div>
                <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                  Country
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.country}
                  className="w-full bg-urban-light-grey/80 border border-urban-border px-3 py-2 text-xs text-urban-warm-grey cursor-not-allowed"
                />
              </div>

              {isAuthenticated && selectedAddressId === 'new' && (
                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center space-x-2 text-xs text-urban-black cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveToAddressBook}
                      onChange={(e) => setSaveToAddressBook(e.target.checked)}
                      className="accent-urban-teal"
                    />
                    <span>Save this address to my personal address book</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: Shipping Method */}
          <div className="p-6 bg-urban-light-grey/40 border border-urban-border">
            <h3 className="font-serif text-lg font-semibold text-urban-black mb-4">
              3. Courier Dispatch Method
            </h3>
            <div className="p-4 bg-white border border-urban-teal flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <Truck size={20} className="text-urban-teal" />
                <div>
                  <span className="font-semibold text-urban-black block">
                    Express Atelier Courier (DTDC Express Priority)
                  </span>
                  <span className="text-urban-warm-grey text-[11px]">
                    Delivered in 3–5 business days in signature protective packaging
                  </span>
                </div>
              </div>
              <span className="font-medium text-urban-teal">
                {shipping === 0 ? 'Complimentary' : `₹${shipping}`}
              </span>
            </div>
          </div>

          {/* STEP 4: Payment Method */}
          <div className="p-6 bg-urban-light-grey/40 border border-urban-border">
            <h3 className="font-serif text-lg font-semibold text-urban-black mb-4">
              4. Payment Selection
            </h3>

            <div className="space-y-3">
              {/* Cash on Delivery */}
              <label
                className={`p-4 border flex items-center justify-between cursor-pointer transition-all ${
                  formData.paymentMethod === 'COD'
                    ? 'border-urban-teal bg-white ring-1 ring-urban-teal'
                    : 'border-urban-border bg-white hover:border-urban-black'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'COD' })}
                    className="accent-urban-teal"
                  />
                  <div className="flex items-center space-x-2">
                    <Banknote size={18} className="text-urban-teal" />
                    <div>
                      <span className="text-xs font-semibold text-urban-black block">
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-[11px] text-urban-warm-grey">
                        Pay upon arrival via cash or courier UPI QR scan
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-urban-teal font-semibold">
                  Zero Surcharge
                </span>
              </label>

              {/* Online Payment (Razorpay Ready) */}
              <label
                className={`p-4 border flex items-center justify-between cursor-pointer transition-all ${
                  formData.paymentMethod === 'Razorpay'
                    ? 'border-urban-teal bg-white ring-1 ring-urban-teal'
                    : 'border-urban-border bg-white hover:border-urban-black'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    value="Razorpay"
                    checked={formData.paymentMethod === 'Razorpay'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'Razorpay' })}
                    className="accent-urban-teal"
                  />
                  <div className="flex items-center space-x-2">
                    <CreditCard size={18} className="text-urban-warm-grey" />
                    <div>
                      <span className="text-xs font-semibold text-urban-black block">
                        Online Payment (Cards, UPI, NetBanking)
                      </span>
                      <span className="text-[11px] text-urban-warm-grey">
                        Powered by Razorpay Secure Gateway
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-urban-warm-grey font-medium">
                  Instant Dispatch
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Placement CTA */}
        <div className="lg:col-span-4">
          <div className="bg-urban-light-grey p-6 border border-urban-border space-y-6 sticky top-28">
            <h3 className="font-serif text-lg font-semibold text-urban-black border-b border-urban-border pb-3">
              Order Review ({items.length})
            </h3>

            {/* Garments Preview List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-urban-border/60">
              {items.map((item, idx) => {
                const product = item.product || item;
                const variant = item.variant || {};
                const unitPrice = item.unitPrice ?? item.priceSnapshot ?? item.price ?? 0;
                const thumbnail =
                  product.thumbnail || product.images?.[0] || item.image;

                return (
                  <div key={idx} className="pt-2 first:pt-0 flex items-center space-x-3 text-xs">
                    <div className="w-12 h-16 bg-white border border-urban-border overflow-hidden flex-shrink-0">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-1 text-[8px] text-center">
                          {product.name}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-serif font-medium text-urban-black truncate block">
                        {product.name}
                      </span>
                      <span className="text-[10px] text-urban-warm-grey">
                        Qty: {item.quantity} • {variant.size || item.size || 'M'} / {variant.color || item.color || 'Standard'}
                      </span>
                      <span className="text-xs font-semibold text-urban-black block mt-0.5">
                        ₹{(unitPrice * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Promotional Voucher Input */}
            <div className="pt-4 border-t border-urban-border space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-serif font-semibold text-urban-black">
                <Tag size={13} className="text-urban-teal" />
                <span>Privilege Code</span>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-urban-teal/10 border border-urban-teal/40 text-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 size={14} className="text-urban-teal flex-shrink-0" />
                    <div>
                      <span className="font-mono font-bold text-urban-teal uppercase">
                        {appliedCoupon.couponCode}
                      </span>
                      <span className="text-[11px] text-urban-black/80 ml-2">
                        (-₹{appliedCoupon.discountAmount.toLocaleString('en-IN')})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-urban-warm-grey hover:text-red-700 transition-colors p-1"
                    title="Remove coupon"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => {
                        setCouponCodeInput(e.target.value.toUpperCase());
                        if (couponError) setCouponError('');
                      }}
                      placeholder="e.g. URBANFIRST"
                      className="flex-1 bg-white border border-urban-border px-3 py-2 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-urban-teal"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponCodeInput.trim()}
                      className="px-4 py-2 bg-urban-black hover:bg-urban-teal disabled:bg-urban-warm-grey/30 text-white text-[11px] uppercase tracking-wider font-medium transition-colors"
                    >
                      {isValidatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>

                  {couponError && (
                    <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 p-2 rounded-sm flex items-start space-x-1.5">
                      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                      <span>{couponError}</span>
                    </div>
                  )}

                  <div className="text-[10px] text-urban-warm-grey leading-tight">
                    Seasonal drop voucher? Try <button type="button" onClick={() => setCouponCodeInput('URBANFIRST')} className="font-mono font-semibold text-urban-black underline">URBANFIRST</button> (10% off &gt; ₹3k) or <button type="button" onClick={() => setCouponCodeInput('ATELIER15')} className="font-mono font-semibold text-urban-black underline">ATELIER15</button> (15% off &gt; ₹10k).
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Totals Breakdown */}
            <div className="space-y-2.5 text-xs text-urban-warm-grey pt-4 border-t border-urban-border">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-urban-black font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-urban-teal">
                  <span>Atelier Privilege Savings</span>
                  <span>-₹{totals.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-urban-teal font-semibold">
                  <span>Privilege Code ({appliedCoupon?.couponCode})</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Express Courier</span>
                <span className="text-urban-teal font-medium">
                  {shipping === 0 ? 'Complimentary' : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (5% GST Incl.)</span>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-serif font-bold text-urban-black pt-3 border-t border-urban-border">
                <span>Grand Total</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={isSubmitting || hasUnavailableItems || items.length === 0}
              className="w-full py-4 bg-urban-teal hover:bg-urban-teal-dark disabled:bg-urban-warm-grey/40 disabled:cursor-not-allowed text-white text-xs uppercase tracking-editorial font-medium flex items-center justify-center space-x-2 transition-colors shadow-sm"
            >
              {isSubmitting ? (
                <span>Confirming Order...</span>
              ) : (
                <>
                  <span>Confirm Acquisition</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="text-[11px] text-urban-warm-grey text-center space-y-1">
              <div className="flex items-center justify-center space-x-1.5 text-urban-teal">
                <ShieldCheck size={14} />
                <span>Protected by Atelier Order Assurance</span>
              </div>
              <p>Complimentary exchanges within 14 days of delivery.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
