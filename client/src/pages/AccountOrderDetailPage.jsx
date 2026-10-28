import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  CheckCircle2,
  Check,
  Clock,
  ShieldCheck,
  AlertCircle,
  XCircle,
  Package,
  ExternalLink,
  Copy,
  MapPin,
  Star,
  RotateCcw,
  ArrowRightLeft,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { returnService } from '../services/returnService';
import { reviewService } from '../services/reviewService';

export const AccountOrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of styling preference');
  const [cancelling, setCancelling] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Return & Exchange state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItem, setReturnItem] = useState(null);
  const [returnType, setReturnType] = useState('Return');
  const [returnReason, setReturnReason] = useState('Wrong size');
  const [returnDescription, setReturnDescription] = useState('');
  const [newSize, setNewSize] = useState('L');
  const [exchangeAvail, setExchangeAvail] = useState(null);
  const [validatingExchange, setValidatingExchange] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');

  // Review Appraisal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getOrder(id);
      setOrder(data);
    } catch (err) {
      setError(err.message || 'Unable to retrieve order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    setCancelError('');
    try {
      setCancelling(true);
      const updated = await orderService.cancelOrder(order.orderNumber, cancelReason);
      setOrder(updated);
      setShowCancelModal(false);
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  // Eligibility check for self-cancellation
  const isCancellable =
    order &&
    ['Pending', 'Confirmed', 'Processing'].includes(order.orderStatus);

  // 6-Stage Customer Milestones requested: Order Placed -> Confirmed -> Packed -> Shipped -> Out for Delivery -> Delivered
  const MILESTONES = [
    'Order Placed',
    'Confirmed',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
  ];

  const statusToMilestoneMap = {
    'order placed': 0,
    pending: 0,
    confirmed: 1,
    processing: 1,
    packed: 2,
    shipped: 3,
    outfordelivery: 4,
    'out for delivery': 4,
    delivered: 5,
  };

  const currentStatusKey = String(
    order?.shipment?.status || order?.orderStatus || 'Confirmed'
  )
    .toLowerCase()
    .trim();

  const currentMilestoneIndex =
    statusToMilestoneMap[currentStatusKey] !== undefined
      ? statusToMilestoneMap[currentStatusKey]
      : 1;

  const isDelivered = order && (order.orderStatus === 'Delivered' || order.shipment?.status === 'Delivered');

  const openReturnModal = (item) => {
    setReturnItem(item);
    setReturnType('Return');
    setReturnReason('Wrong size');
    setReturnDescription('');
    setNewSize('L');
    setExchangeAvail(null);
    setShowReturnModal(true);
  };

  const handleSizeChange = async (size) => {
    setNewSize(size);
    if (!returnItem) return;
    setValidatingExchange(true);
    try {
      const avail = await returnService.validateExchange(returnItem.product, size);
      setExchangeAvail(avail);
    } catch {
      setExchangeAvail({ isAvailable: false, message: 'Stock unavailable for this size.' });
    } finally {
      setValidatingExchange(false);
    }
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!returnItem) return;
    setSubmittingReturn(true);
    try {
      const res = await returnService.submitReturn({
        orderNumber: order.orderNumber,
        type: returnType,
        items: [
          {
            productId: returnItem.product,
            orderItemId: returnItem._id,
            reason: returnReason,
            description: returnDescription,
            newSize: returnType === 'Exchange' ? newSize : undefined,
          },
        ],
      });
      setShowReturnModal(false);
      setReturnSuccessMsg(`Return request #${res.returnNumber} submitted successfully!`);
      setTimeout(() => setReturnSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to submit return request.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const openReviewModal = (item) => {
    setReviewItem(item);
    setReviewRating(5);
    setReviewTitle('');
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewItem || !reviewTitle || !reviewComment) {
      alert('Please fill out all review fields.');
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewService.submitReview({
        productId: reviewItem.product,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      setShowReviewModal(false);
      setReviewSuccessMsg('Your verified customer review was published to the atelier catalog!');
      setTimeout(() => setReviewSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to submit appraisal.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-urban-light-grey w-1/4" />
        <div className="h-40 bg-urban-light-grey border border-urban-border" />
        <div className="h-64 bg-urban-light-grey border border-urban-border" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 text-red-900 text-xs text-center space-y-4">
        <AlertCircle size={32} className="mx-auto text-red-600" />
        <p className="font-semibold">{error || 'Order record not found.'}</p>
        <Link
          to="/account/orders"
          className="inline-block px-4 py-2 bg-urban-black text-white uppercase tracking-widest text-[11px]"
        >
          Return to Orders
        </Link>
      </div>
    );
  }

  const isCancelled = order.orderStatus === 'Cancelled';

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        to="/account/orders"
        className="inline-flex items-center text-xs uppercase tracking-editorial text-urban-warm-grey hover:text-urban-black transition-colors"
      >
        <ArrowLeft size={14} className="mr-1.5" />
        <span>Return to Order History</span>
      </Link>

      {/* Order Header */}
      <div className="border-b border-urban-border pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-urban-teal font-semibold">
            Order Reference
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-urban-black mt-0.5">
            #{order.orderNumber}
          </h2>
          <p className="text-xs text-urban-warm-grey mt-1">
            Registered on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`text-xs uppercase tracking-widest px-3 py-1 font-semibold border ${isCancelled
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-urban-teal/10 text-urban-teal border-urban-teal/20'
              }`}
          >
            {order.orderStatus}
          </span>

          {isCancellable && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-xs text-red-600 hover:text-red-800 underline uppercase tracking-widest font-medium"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Cancellation Notice Banner */}
      {isCancelled && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 text-xs flex items-start space-x-3">
          <XCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">This order has been cancelled</strong>
            <span className="text-red-800">
              Reason: {order.cancellation?.reason || 'Customer request'} • Inventory reserved has been restored to the atelier.
            </span>
          </div>
        </div>
      )}

      {/* Visual Shipment Tracker */}
      {!isCancelled && (
        <div className="p-6 bg-urban-light-grey/60 border border-urban-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-urban-border/60 pb-4">
            <div>
              <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-urban-teal font-semibold">
                <Truck size={17} />
                <span>
                  {order.shipment?.carrier || (order.shipment?.courier ? `${order.shipment.courier} Express` : 'DTDC Express Air')}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1.5 font-mono text-xs text-urban-black">
                <span>
                  AWB Waybill:{' '}
                  <strong>{order.shipment?.awb || order.shipment?.trackingNumber || 'PENDING'}</strong>
                </span>
                {(order.shipment?.awb || order.shipment?.trackingNumber) && (
                  <button
                    onClick={() =>
                      handleCopyAwb(order.shipment?.awb || order.shipment?.trackingNumber)
                    }
                    title="Copy AWB Number"
                    className="text-urban-warm-grey hover:text-urban-black transition-colors"
                  >
                    <Copy size={13} />
                  </button>
                )}
                {copiedAwb && (
                  <span className="text-[10px] text-urban-teal font-semibold">Copied!</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {order.shipment?.estimatedDelivery && (
                <div className="text-xs text-urban-warm-grey">
                  Estimated Delivery:{' '}
                  <strong className="text-urban-black">
                    {new Date(order.shipment.estimatedDelivery).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </strong>
                </div>
              )}
              {order.shipment?.trackingUrl && (
                <a
                  href={order.shipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-urban-border text-[11px] uppercase tracking-wider font-medium text-urban-black hover:border-urban-black transition-colors"
                >
                  <span>Carrier Tracking</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          {/* Stepper Progress Bar (6 Milestones) */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px] uppercase tracking-wider pt-2">
            {MILESTONES.map((step, idx) => {
              const isPast = idx <= currentMilestoneIndex;
              const isCurrent = idx === currentMilestoneIndex;

              return (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] mb-1.5 transition-colors ${isCurrent
                        ? 'bg-urban-teal text-white ring-2 ring-urban-teal ring-offset-2'
                        : isPast
                          ? 'bg-urban-black text-white'
                          : 'bg-white text-urban-warm-grey border border-urban-border'
                      }`}
                  >
                    {isPast ? <Check size={12} /> : idx + 1}
                  </div>
                  <span
                    className={`font-medium ${isCurrent
                        ? 'text-urban-teal font-bold'
                        : isPast
                          ? 'text-urban-black'
                          : 'text-urban-warm-grey/60'
                      }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Detailed Tracking Events Log */}
          <div className="pt-4 border-t border-urban-border/60 space-y-4">
            <span className="text-[10px] uppercase tracking-widest text-urban-warm-grey font-semibold block">
              Consignment Event History
            </span>

            {order.shipment?.trackingEvents && order.shipment.trackingEvents.length > 0 ? (
              <div className="relative border-l-2 border-urban-teal pl-4 space-y-5 text-xs">
                {order.shipment.trackingEvents.map((event, idx) => (
                  <div key={idx} className="relative">
                    {/* Bullet marker */}
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-urban-teal ring-4 ring-urban-light-grey" />

                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <span className="font-semibold text-urban-black text-xs uppercase tracking-wide">
                        {event.status}
                      </span>
                      <span className="text-[11px] text-urban-warm-grey font-mono">
                        {event.date} • {event.time}
                      </span>
                    </div>

                    {event.location && (
                      <div className="flex items-center space-x-1 text-urban-warm-grey text-[11px] mt-0.5">
                        <MapPin size={11} className="text-urban-teal flex-shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    <p className="text-urban-black/80 text-xs mt-1 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : order.shipment?.timeline && order.shipment.timeline.length > 0 ? (
              <div className="relative border-l-2 border-urban-teal pl-4 space-y-4 text-xs">
                {order.shipment.timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-urban-teal ring-4 ring-urban-light-grey" />
                    <span className="font-semibold text-urban-black block">{event.label}</span>
                    <span className="text-urban-warm-grey text-[11px]">
                      {event.location} • {new Date(event.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-urban-warm-grey italic">
                Awaiting first carrier scan event.
              </div>
            )}
          </div>
        </div>
      )}


      {/* Garments in Order (Snapshots) */}
      <div className="space-y-4">
        <h3 className="font-serif text-lg font-semibold text-urban-black">Garments in Order</h3>
        <div className="border border-urban-border divide-y divide-urban-border bg-white">
          {order.items.map((item, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between text-xs gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-18 bg-urban-light-grey border border-urban-border overflow-hidden flex-shrink-0">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-1 text-[8px] text-center">
                      {item.name}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-widest text-urban-warm-grey block">
                    {item.brand}
                  </span>
                  <span className="font-serif font-medium text-sm text-urban-black block">
                    {item.name}
                  </span>
                  <span className="text-urban-warm-grey text-[11px] mt-0.5 block">
                    Size: {item.variant?.size} | Color: {item.variant?.color} | SKU: {item.variant?.sku} | Qty: {item.quantity}
                  </span>
                </div>
              </div>

              <div className="text-right space-y-2">
                <div>
                  <span className="font-semibold text-sm text-urban-black block">
                    ₹{item.subtotal.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-urban-warm-grey">
                    ₹{item.price.toLocaleString('en-IN')} each
                  </span>
                </div>

                {/* Post-Purchase Actions on Delivered Pieces */}
                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    onClick={() => openReturnModal(item)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold border border-urban-border hover:border-urban-black bg-urban-light-grey/40 text-urban-black transition-colors"
                  >
                    <RotateCcw size={11} />
                    <span>Return / Exchange</span>
                  </button>

                  <button
                    onClick={() => openReviewModal(item)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold border border-amber-300 bg-amber-50/60 text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    <Star size={11} className="fill-amber-400 text-amber-500" />
                    <span>Appraisal</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Context Details (Destination, Payment, Financials) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Shipping Destination Snapshot */}
        <div className="p-5 border border-urban-border bg-white space-y-2 text-xs">
          <span className="text-[10px] uppercase tracking-widest text-urban-teal font-semibold block mb-1">
            Delivery Destination
          </span>
          <p className="font-serif font-semibold text-sm text-urban-black">
            {order.shippingAddress?.name}
          </p>
          <p className="text-urban-warm-grey leading-relaxed">
            {order.shippingAddress?.address}
            {order.shippingAddress?.apartment ? `, ${order.shippingAddress.apartment}` : ''}
            <br />
            {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
            <br />
            {order.shippingAddress?.country}
            <br />
            Phone: {order.shippingAddress?.phone}
          </p>
        </div>

        {/* Financial Breakdown & Payment Snapshot */}
        <div className="p-5 border border-urban-border bg-urban-light-grey/40 space-y-3 text-xs">
          <span className="text-[10px] uppercase tracking-widest text-urban-teal font-semibold block mb-1">
            Payment & Financial Summary
          </span>

          <div className="flex justify-between text-urban-warm-grey">
            <span>Payment Method</span>
            <span className="font-semibold text-urban-black">
              {order.payment?.method === 'COD' ? 'Cash on Delivery' : 'Prepaid Online (Razorpay)'}
            </span>
          </div>

          <div className="flex justify-between text-urban-warm-grey">
            <span>Payment Status</span>
            <span className="font-semibold text-urban-black">{order.payment?.status}</span>
          </div>

          <div className="border-t border-urban-border pt-3 space-y-2">
            <div className="flex justify-between text-urban-warm-grey">
              <span>Subtotal</span>
              <span className="text-urban-black">₹{order.pricing?.subtotal?.toLocaleString('en-IN')}</span>
            </div>
            {order.pricing?.discount > 0 && (
              <div className="flex justify-between text-urban-teal">
                <span>Atelier Benefit</span>
                <span>-₹{order.pricing.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-urban-warm-grey">
              <span>Express Courier</span>
              <span className="text-urban-teal">
                {order.pricing?.shipping === 0 ? 'Complimentary' : `₹${order.pricing?.shipping}`}
              </span>
            </div>
            <div className="flex justify-between text-urban-warm-grey">
              <span>Estimated Tax (5% GST)</span>
              <span>₹{order.pricing?.tax?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-base font-serif font-bold text-urban-black pt-2 border-t border-urban-border">
              <span>Grand Total</span>
              <span>₹{order.pricing?.grandTotal?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-urban-border max-w-md w-full p-6 space-y-4">
            <h3 className="font-serif text-lg font-semibold text-urban-black">
              Cancel Order #{order.orderNumber}
            </h3>

            {cancelError && (
              <div className="p-3 bg-red-50 text-red-800 text-xs">
                {cancelError}
              </div>
            )}

            <p className="text-xs text-urban-warm-grey leading-relaxed">
              Are you sure you wish to cancel this acquisition? The reserved pieces will immediately be returned to our atelier inventory.
            </p>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-urban-warm-grey mb-1">
                Reason for cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-white border border-urban-border px-3 py-2 text-xs text-urban-black focus:outline-none"
              >
                <option value="Change of styling preference">Change of styling preference</option>
                <option value="Ordered incorrect size or color">Ordered incorrect size or color</option>
                <option value="Need to modify delivery address">Need to modify delivery address</option>
                <option value="Found alternative piece">Found alternative piece</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-urban-border text-xs uppercase tracking-widest text-urban-black hover:bg-urban-light-grey"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs uppercase tracking-widest font-semibold"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 2: Return & Exchange Request */}
      {showReturnModal && returnItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-urban-border max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start border-b border-urban-border pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-urban-teal font-semibold">
                  Atelier Reverse Logistics
                </span>
                <h3 className="font-serif text-lg text-urban-black mt-0.5">
                  Request Return or Exchange
                </h3>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-urban-warm-grey hover:text-urban-black"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs">
              <div className="p-3 bg-urban-light-grey/60 border border-urban-border flex items-center space-x-3">
                {returnItem.thumbnail && (
                  <img src={returnItem.thumbnail} alt="" className="w-10 h-12 object-cover" />
                )}
                <div>
                  <strong className="text-urban-black block font-serif">{returnItem.name}</strong>
                  <span className="text-[11px] text-urban-warm-grey">
                    Current Size: {returnItem.variant?.size} • ₹{returnItem.price?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Type: Return vs Exchange */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-urban-warm-grey mb-1.5 font-semibold">
                  Select Action
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnType('Return')}
                    className={`py-2 px-3 text-center border font-semibold tracking-wider text-[11px] uppercase transition-colors ${returnType === 'Return'
                        ? 'border-urban-black bg-urban-black text-white'
                        : 'border-urban-border bg-white text-urban-black hover:bg-urban-light-grey'
                      }`}
                  >
                    Return for Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnType('Exchange');
                      handleSizeChange(newSize);
                    }}
                    className={`py-2 px-3 text-center border font-semibold tracking-wider text-[11px] uppercase transition-colors ${returnType === 'Exchange'
                        ? 'border-urban-teal bg-urban-teal text-white'
                        : 'border-urban-border bg-white text-urban-black hover:bg-urban-light-grey'
                      }`}
                  >
                    Size Exchange
                  </button>
                </div>
              </div>

              {/* If Exchange: Select New Size with Validation */}
              {returnType === 'Exchange' && (
                <div className="p-3 bg-urban-teal/5 border border-urban-teal/20 space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-urban-teal font-semibold">
                    Select Replacement Size
                  </label>
                  <div className="flex space-x-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleSizeChange(sz)}
                        className={`w-9 h-9 border text-xs font-semibold ${newSize === sz
                            ? 'border-urban-teal bg-urban-teal text-white'
                            : 'border-urban-border bg-white text-urban-black hover:border-urban-black'
                          }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                  {validatingExchange ? (
                    <span className="text-[11px] text-urban-warm-grey">Checking atelier stock...</span>
                  ) : exchangeAvail ? (
                    <div
                      className={`text-[11px] font-medium ${exchangeAvail.isAvailable ? 'text-emerald-700' : 'text-red-700'
                        }`}
                    >
                      {exchangeAvail.message}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Reason Selector */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-urban-warm-grey mb-1 font-semibold">
                  Reason for Return *
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-white border border-urban-border px-3 py-2 text-xs text-urban-black focus:outline-none"
                  required
                >
                  <option value="Wrong size">Wrong size</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Wrong product">Wrong product</option>
                  <option value="Defective">Defective</option>
                  <option value="Not as described">Not as described</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-urban-warm-grey mb-1 font-semibold">
                  Details / Fit Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Please describe how the garment fitted or details regarding the condition..."
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  className="w-full bg-white border border-urban-border px-3 py-2 text-xs text-urban-black focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-urban-border">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 border border-urban-border text-xs uppercase tracking-widest text-urban-black hover:bg-urban-light-grey"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn || (returnType === 'Exchange' && exchangeAvail && !exchangeAvail.isAvailable)}
                  className="px-4 py-2 bg-urban-black hover:bg-urban-black/80 text-white text-xs uppercase tracking-widest font-semibold disabled:opacity-50"
                >
                  {submittingReturn ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Verified Customer Review Appraisal */}
      {showReviewModal && reviewItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-urban-border max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start border-b border-urban-border pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-urban-teal font-semibold">
                  Verified Purchaser Appraisal
                </span>
                <h3 className="font-serif text-lg text-urban-black mt-0.5">
                  Appraise Your Garment
                </h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-urban-warm-grey hover:text-urban-black"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div className="p-3 bg-urban-light-grey/60 border border-urban-border">
                <strong className="text-urban-black block font-serif">{reviewItem.name}</strong>
                <span className="text-[11px] text-urban-warm-grey">
                  Order #{order.orderNumber} • Size: {reviewItem.variant?.size}
                </span>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-urban-warm-grey mb-1.5 font-semibold">
                  Rating
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={22}
                        className={star <= reviewRating ? 'fill-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-urban-black ml-2 text-sm">{reviewRating}.0</span>
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-urban-warm-grey mb-1 font-semibold">
                  Review Headline *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Masterful silhouette and impeccable drape"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full bg-white border border-urban-border px-3 py-2 text-xs text-urban-black focus:outline-none"
                  required
                />
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-urban-warm-grey mb-1 font-semibold">
                  Written Appraisal *
                </label>
                <textarea
                  rows={3}
                  placeholder="Share details on garment cut, tactile finish, tailoring, and styling versatility..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-white border border-urban-border px-3 py-2 text-xs text-urban-black focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-urban-border">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-urban-border text-xs uppercase tracking-widest text-urban-black hover:bg-urban-light-grey"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 bg-urban-black hover:bg-urban-black/80 text-white text-xs uppercase tracking-widest font-semibold disabled:opacity-50"
                >
                  {submittingReview ? 'Publishing...' : 'Publish Appraisal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
