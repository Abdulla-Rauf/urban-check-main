import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Truck,
  Search,
  Check,
  MapPin,
  ExternalLink,
  Copy,
  Clock,
  ShieldCheck,
  AlertCircle,
  Package,
  ArrowRight,
} from 'lucide-react';
import { orderService } from '../services/orderService';

const MILESTONES = [
  'Order Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

export const OrderTrackingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('id') || searchParams.get('awb') || searchParams.get('query') || '';

  const [inputVal, setInputVal] = useState(queryParam);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedAwb, setCopiedAwb] = useState(false);

  useEffect(() => {
    if (queryParam) {
      handleLookup(queryParam);
    }
  }, [queryParam]);

  const handleLookup = async (identifier) => {
    const cleanId = String(identifier || '').trim();
    if (!cleanId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getTracking(cleanId);
      setTrackingData(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        `No consignment found matching "${cleanId}". Please verify your Order Number or AWB.`
      );
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchParams({ query: inputVal.trim() });
      handleLookup(inputVal.trim());
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  // Determine current milestone index
  const getMilestoneIndex = (status) => {
    if (!status) return 0;
    const lower = status.toLowerCase();
    if (lower.includes('delivered')) return 5;
    if (lower.includes('out for delivery') || lower.includes('outfordelivery')) return 4;
    if (lower.includes('shipped')) return 3;
    if (lower.includes('packed')) return 2;
    if (lower.includes('confirmed')) return 1;
    return 0; // Order Placed
  };

  const currentMilestoneIndex = trackingData ? getMilestoneIndex(trackingData.status) : 0;
  const isCancelled = trackingData?.status?.toLowerCase() === 'cancelled';

  return (
    <div className="min-h-screen bg-urban-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-urban-light-grey border border-urban-border text-[11px] uppercase tracking-widest text-urban-teal font-semibold">
            <Truck size={14} />
            <span>Consignment Logistics Radar</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-urban-black font-light">
            Track Atelier Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-urban-warm-grey max-w-lg mx-auto leading-relaxed">
            Trace your garment’s passage from our Mumbai artisan workshop directly to your residence via our certified multi-courier network.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-urban-border p-3 sm:p-4 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-urban-warm-grey"
              />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter Order Number (e.g. ORD-123456) or Waybill / AWB (e.g. D84920194)..."
                className="w-full pl-10 pr-4 py-2.5 bg-urban-light-grey/50 border border-urban-border text-xs text-urban-black focus:outline-none focus:border-urban-black font-mono transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputVal.trim()}
              className="px-6 py-2.5 bg-urban-black text-white hover:bg-urban-teal text-xs uppercase tracking-widest font-semibold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 flex-shrink-0"
            >
              <Truck size={14} />
              <span>{loading ? 'Locating...' : 'Locate Consignment'}</span>
            </button>
          </form>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 animate-in fade-in">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="font-semibold block">Consignment Not Located</strong>
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center space-y-4 bg-white border border-urban-border animate-pulse">
            <div className="w-10 h-10 border-2 border-urban-teal border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-widest text-urban-warm-grey font-semibold">
              Querying live courier telemetry...
            </p>
          </div>
        )}

        {/* Tracking Details View */}
        {trackingData && !loading && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Overview Card */}
            <div className="bg-white border border-urban-border p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-urban-border gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase tracking-widest text-urban-teal font-semibold">
                      Order #{trackingData.orderNumber}
                    </span>
                    <span className="text-urban-warm-grey text-xs">•</span>
                    <span className="text-xs font-semibold text-urban-black">
                      {trackingData.carrierName || trackingData.courier}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl text-urban-black mt-1">
                    AWB: {trackingData.awb}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(trackingData.awb)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-urban-border hover:border-urban-black text-xs font-medium text-urban-black transition-colors"
                  >
                    <Copy size={13} />
                    <span>{copiedAwb ? 'Copied' : 'Copy AWB'}</span>
                  </button>

                  {trackingData.trackingUrl && (
                    <a
                      href={trackingData.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-urban-black text-white hover:bg-urban-teal text-xs uppercase tracking-wider font-semibold transition-colors"
                    >
                      <span>Carrier Portal</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              {/* Status & Estimated Delivery Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-urban-light-grey/40 border border-urban-border/60">
                  <span className="text-[10px] uppercase tracking-widest text-urban-warm-grey block mb-1">
                    Current Milestone
                  </span>
                  <span className={`font-semibold text-sm ${isCancelled ? 'text-red-700' : 'text-urban-black'}`}>
                    {trackingData.status}
                  </span>
                </div>

                <div className="p-4 bg-urban-light-grey/40 border border-urban-border/60">
                  <span className="text-[10px] uppercase tracking-widest text-urban-warm-grey block mb-1">
                    Estimated Doorstep Delivery
                  </span>
                  <span className="font-semibold text-sm text-urban-black">
                    {trackingData.estimatedDelivery
                      ? new Date(trackingData.estimatedDelivery).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '3-5 Business Days'}
                  </span>
                </div>

                <div className="p-4 bg-urban-light-grey/40 border border-urban-border/60">
                  <span className="text-[10px] uppercase tracking-widest text-urban-warm-grey block mb-1">
                    Destination Hub
                  </span>
                  <span className="font-semibold text-sm text-urban-black truncate block">
                    {trackingData.destination
                      ? `${trackingData.destination.city}, ${trackingData.destination.state}`
                      : 'Pan-India Priority Air'}
                  </span>
                </div>
              </div>

              {/* 6-Stage Milestone Progress Bar */}
              {!isCancelled ? (
                <div className="pt-4">
                  <span className="text-[10px] uppercase tracking-widest text-urban-warm-grey font-semibold block mb-4">
                    Transit Progress Sequence
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px] uppercase tracking-wider">
                    {MILESTONES.map((step, idx) => {
                      const isPast = idx <= currentMilestoneIndex;
                      const isCurrent = idx === currentMilestoneIndex;

                      return (
                        <div key={step} className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] mb-2 transition-all ${
                              isCurrent
                                ? 'bg-urban-teal text-white ring-4 ring-urban-teal/20 scale-105'
                                : isPast
                                ? 'bg-urban-black text-white'
                                : 'bg-urban-light-grey text-urban-warm-grey border border-urban-border'
                            }`}
                          >
                            {isPast ? <Check size={13} /> : idx + 1}
                          </div>
                          <span
                            className={`font-medium ${
                              isCurrent
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
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
                  <AlertCircle size={16} />
                  <span>This consignment booking was cancelled.</span>
                </div>
              )}
            </div>

            {/* Tracking Events Timeline */}
            <div className="bg-white border border-urban-border p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-urban-border">
                <span className="text-xs uppercase tracking-widest text-urban-teal font-semibold flex items-center space-x-1.5">
                  <Clock size={14} />
                  <span>Telemetry Audit Trail</span>
                </span>
                <span className="text-[11px] text-urban-warm-grey font-mono">
                  {trackingData.trackingEvents?.length || 0} recorded carrier events
                </span>
              </div>

              {trackingData.trackingEvents && trackingData.trackingEvents.length > 0 ? (
                <div className="relative border-l-2 border-urban-teal pl-6 space-y-6 text-xs">
                  {trackingData.trackingEvents.map((evt, idx) => (
                    <div key={idx} className="relative group">
                      {/* Pulse marker */}
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-urban-teal ring-4 ring-urban-light-grey group-hover:scale-125 transition-transform" />

                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <span className="font-semibold text-urban-black text-sm uppercase tracking-wide">
                          {evt.status}
                        </span>
                        <span className="text-[11px] text-urban-warm-grey font-mono">
                          {evt.date} • {evt.time}
                        </span>
                      </div>

                      {evt.location && (
                        <div className="flex items-center space-x-1 text-urban-warm-grey text-[11px] mt-0.5">
                          <MapPin size={12} className="text-urban-teal flex-shrink-0" />
                          <span>{evt.location}</span>
                        </div>
                      )}

                      <p className="text-urban-black/80 text-xs mt-1.5 leading-relaxed max-w-2xl bg-urban-light-grey/30 p-2 border border-urban-border/40">
                        {evt.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-urban-warm-grey">
                  Awaiting first carrier hub scan event.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State / Quick Help */}
        {!trackingData && !loading && !error && (
          <div className="bg-white border border-urban-border p-8 text-center space-y-4 shadow-sm">
            <Package size={36} className="text-urban-warm-grey mx-auto" />
            <h3 className="font-serif text-lg font-medium text-urban-black">
              Check Any Urban Check Consignment
            </h3>
            <p className="text-xs text-urban-warm-grey max-w-md mx-auto leading-relaxed">
              Input the order confirmation code sent to your email or SMS, or the Waybill tracking number provided upon dispatch.
            </p>
            <div className="pt-2 flex justify-center space-x-4">
              <Link
                to="/account/orders"
                className="text-xs uppercase tracking-wider text-urban-teal hover:underline font-semibold"
              >
                View My Account Orders →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
