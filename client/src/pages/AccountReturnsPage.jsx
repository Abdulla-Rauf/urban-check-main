import React, { useState, useEffect } from 'react';
import { RotateCcw, ArrowRightLeft, Clock, Truck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { returnService } from '../services/returnService';
import { Link } from 'react-router-dom';

export const AccountReturnsPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await returnService.getMyReturns();
      setReturns(data || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve your returns.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Refunded':
      case 'RefundApproved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Approved':
      case 'PickupScheduled':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Received':
      case 'QualityCheck':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'UnderReview':
      case 'Requested':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Rejected':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-urban-light-grey text-urban-black border-urban-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-urban-border pb-4 flex justify-between items-center">
        <div>
          <h2 className="font-serif text-2xl font-normal text-urban-black">Returns & Exchanges</h2>
          <p className="text-xs text-urban-warm-grey mt-1">
            Door pickup reverse logistics requests and size exchange tracking.
          </p>
        </div>

        <button
          onClick={loadReturns}
          className="inline-flex items-center space-x-1.5 text-xs text-urban-warm-grey hover:text-urban-black font-medium transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-urban-warm-grey space-y-2">
          <RefreshCw size={24} className="animate-spin mx-auto text-urban-teal" />
          <p className="text-xs">Loading reverse logistics requests...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-900 text-xs text-center space-y-2">
          <AlertCircle size={20} className="mx-auto text-red-600" />
          <p>{error}</p>
        </div>
      ) : returns.length === 0 ? (
        <div className="p-12 border border-urban-border bg-urban-light-grey/20 text-center space-y-3">
          <RotateCcw size={32} className="mx-auto text-urban-warm-grey/60" />
          <h3 className="font-serif text-base text-urban-black">No Active Returns or Exchanges</h3>
          <p className="text-xs text-urban-warm-grey max-w-sm mx-auto">
            If you wish to return a garment or request a size exchange, visit your Order History and select the delivered piece.
          </p>
          <Link
            to="/account/orders"
            className="inline-block px-4 py-2 bg-urban-black text-white text-[11px] uppercase tracking-widest font-semibold hover:bg-urban-black/80 transition-colors"
          >
            View Delivered Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => {
            const firstItem = ret.items?.[0] || {};
            const isExchange = ret.type === 'Exchange';

            return (
              <div
                key={ret._id}
                className="p-5 border border-urban-border bg-white shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-urban-border/60 pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-urban-teal font-semibold">
                      Request #{ret.returnNumber}
                    </span>
                    <h4 className="font-serif text-base font-semibold text-urban-black mt-0.5">
                      {firstItem.name || 'Garment Piece'}
                    </h4>
                    <span className="text-xs text-urban-warm-grey">
                      Order Reference: <strong className="text-urban-black font-mono">#{ret.orderNumber}</strong> • Registered on {new Date(ret.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isExchange ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] uppercase font-semibold rounded bg-purple-50 text-purple-800 border border-purple-200">
                        <ArrowRightLeft size={11} />
                        <span>Size Exchange</span>
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 text-[10px] uppercase font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
                        Return for Refund
                      </span>
                    )}

                    <span
                      className={`inline-block text-[10px] uppercase tracking-widest px-2.5 py-0.5 font-bold border ${getStatusBadge(
                        ret.status
                      )}`}
                    >
                      {ret.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-urban-warm-grey font-semibold block mb-1">
                      Reason & Feedback
                    </span>
                    <p className="text-urban-black">
                      <strong>Reason:</strong> {firstItem.reason}
                    </p>
                    {firstItem.description && (
                      <p className="text-urban-warm-grey mt-0.5 italic">"{firstItem.description}"</p>
                    )}

                    {isExchange && firstItem.exchangeDetails && (
                      <div className="mt-2 p-2.5 bg-purple-50/60 border border-purple-200 text-purple-900 rounded text-xs flex items-center space-x-2">
                        <ArrowRightLeft size={14} className="text-purple-700 flex-shrink-0" />
                        <span>
                          Current Size: <strong>{firstItem.exchangeDetails.currentSize}</strong> $\rightarrow$ Requested Replacement: <strong>Size {firstItem.exchangeDetails.newSize}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-urban-warm-grey font-semibold block mb-1">
                      Reverse Logistics Status
                    </span>
                    {ret.pickupDetails?.pickupAwb ? (
                      <div className="space-y-1 text-urban-black">
                        <div>Courier: <strong>{ret.pickupDetails.courierName || 'DTDC Reverse'}</strong></div>
                        <div className="font-mono text-[11px]">Reverse Waybill: <strong>{ret.pickupDetails.pickupAwb}</strong></div>
                        {ret.pickupDetails.scheduledDate && (
                          <div className="text-[11px] text-urban-warm-grey">
                            Scheduled Date: {new Date(ret.pickupDetails.scheduledDate).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-urban-warm-grey text-[11px]">
                        Atelier concierge will schedule door reverse pickup after initial request evaluation.
                      </p>
                    )}
                  </div>
                </div>

                {/* Audit History Log */}
                {ret.history && ret.history.length > 0 && (
                  <div className="pt-3 border-t border-urban-border/60">
                    <span className="text-[10px] uppercase tracking-widest text-urban-warm-grey font-semibold block mb-2">
                      Request Milestones
                    </span>
                    <div className="relative border-l-2 border-urban-teal pl-3 space-y-2 text-xs">
                      {ret.history.slice(-3).map((h, idx) => (
                        <div key={idx}>
                          <span className="font-semibold text-urban-black">{h.status}</span>
                          <span className="text-[11px] text-urban-warm-grey ml-2 font-mono">
                            {new Date(h.timestamp).toLocaleString('en-IN')}
                          </span>
                          <p className="text-[11px] text-urban-warm-grey mt-0.5">{h.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
