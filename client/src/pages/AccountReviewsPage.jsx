import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { reviewService } from '../services/reviewService';
import { Link } from 'react-router-dom';

export const AccountReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewService.getMyReviews();
      setReviews(data || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve your reviews.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-urban-border pb-4 flex justify-between items-center">
        <div>
          <h2 className="font-serif text-2xl font-normal text-urban-black">My Reviews & Appraisals</h2>
          <p className="text-xs text-urban-warm-grey mt-1">
            Verified appraisals submitted on your luxury acquisitions.
          </p>
        </div>

        <button
          onClick={loadReviews}
          className="inline-flex items-center space-x-1.5 text-xs text-urban-warm-grey hover:text-urban-black font-medium transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-urban-warm-grey space-y-2">
          <RefreshCw size={24} className="animate-spin mx-auto text-urban-teal" />
          <p className="text-xs">Loading your appraisals...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-900 text-xs text-center space-y-2">
          <AlertCircle size={20} className="mx-auto text-red-600" />
          <p>{error}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 border border-urban-border bg-urban-light-grey/20 text-center space-y-3">
          <MessageSquare size={32} className="mx-auto text-urban-warm-grey/60" />
          <h3 className="font-serif text-base text-urban-black">No Reviews Submitted Yet</h3>
          <p className="text-xs text-urban-warm-grey max-w-sm mx-auto">
            You can write a verified appraisal for any delivered piece in your Order History.
          </p>
          <Link
            to="/account/orders"
            className="inline-block px-4 py-2 bg-urban-black text-white text-[11px] uppercase tracking-widest font-semibold hover:bg-urban-black/80 transition-colors"
          >
            Go to Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 border border-urban-border bg-white shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <h4 className="font-serif text-base font-semibold text-urban-black">
                    {rev.product?.name || 'Garment Piece'}
                  </h4>
                  <div className="flex items-center space-x-2 text-[11px] text-urban-warm-grey mt-0.5">
                    <span>
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span className="font-mono">Order #{rev.orderNumber}</span>
                    <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold text-[10px]">
                      <ShieldCheck size={10} className="mr-0.5" />
                      Verified Purchase
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-urban-border'}
                    />
                  ))}
                  <span className="font-bold text-urban-black text-xs ml-1">{rev.rating}.0</span>
                </div>
              </div>

              <div>
                <strong className="text-urban-black text-xs block mb-1 font-serif">
                  {rev.title}
                </strong>
                <p className="text-xs text-urban-warm-grey italic leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>

              {rev.adminReply?.comment && (
                <div className="p-3 bg-urban-light-grey/60 border-l-2 border-urban-teal text-xs text-urban-black space-y-0.5">
                  <span className="text-[10px] uppercase tracking-widest text-urban-teal font-semibold block">
                    Atelier Concierge Response
                  </span>
                  <p className="text-[11px] text-urban-warm-grey italic">{rev.adminReply.comment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
