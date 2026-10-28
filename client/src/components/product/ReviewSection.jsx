import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, ThumbsUp, MessageSquarePlus, ShieldCheck, Image as ImageIcon, CornerDownRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WriteReviewModal } from './WriteReviewModal';
import { reviewService } from '../../services/reviewService';
import { useAuthStore } from '../../store/authStore';

export const ReviewSection = ({ product }) => {
  const { isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 5,
    total: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [canReviewState, setCanReviewState] = useState({ canReview: false });
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [helpfulMap, setHelpfulMap] = useState({});
  const [filterRating, setFilterRating] = useState(0); // 0 = all

  const productId = product?._id || product?.id;

  const loadProductReviews = async () => {
    if (!productId && !product?.slug) return;
    try {
      setLoading(true);
      const res = await reviewService.getProductReviews(product?.slug || productId);
      if (res) {
        setReviews(res.reviews || []);
        setStats({
          averageRating: res.averageRating || product?.rating || 5,
          total: res.total !== undefined ? res.total : (res.reviews?.length || 0),
          breakdown: res.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        });
      }
    } catch (err) {
      console.warn('Could not load product reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    if (isAuthenticated && productId) {
      try {
        const res = await reviewService.checkCanReview(productId);
        setCanReviewState(res || { canReview: false });
      } catch {
        setCanReviewState({ canReview: false });
      }
    } else {
      setCanReviewState({ canReview: false });
    }
  };

  useEffect(() => {
    loadProductReviews();
    checkEligibility();
  }, [productId, product?.slug, isAuthenticated]);

  const handleVoteHelpful = async (reviewId) => {
    if (helpfulMap[reviewId]) return;
    setHelpfulMap((prev) => ({ ...prev, [reviewId]: true }));
    try {
      const res = await reviewService.voteHelpful(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId ? { ...r, helpfulVotes: res?.helpfulVotes || (r.helpfulVotes || 0) + 1 } : r
        )
      );
    } catch {
      // optimistic state kept for UI responsiveness
    }
  };

  // Filter reviews by rating if selected
  const filteredReviews = filterRating === 0
    ? reviews
    : reviews.filter((r) => Math.round(r.rating) === filterRating);

  return (
    <div id="reviews-section" className="py-14 border-t border-urban-border">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-urban-border">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-urban-teal font-semibold flex items-center space-x-1.5">
            <ShieldCheck size={14} />
            <span>Verified Client Appraisals</span>
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-urban-black font-light mt-1">
            Customer Reviews & Authenticity
          </h2>
        </div>

        {/* Appraisal Call to Action */}
        <div>
          {isAuthenticated ? (
            canReviewState.canReview ? (
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(true)}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-urban-black text-white hover:bg-urban-teal text-xs uppercase tracking-widest font-semibold transition-colors shadow-sm"
              >
                <MessageSquarePlus size={15} />
                <span>Write an Appraisal</span>
              </button>
            ) : canReviewState.hasReviewed ? (
              <div className="text-[11px] text-urban-teal bg-urban-teal/10 px-3 py-1.5 border border-urban-teal/20 font-medium">
                ✓ Appraisal submitted for this garment
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-[11px] text-urban-warm-grey bg-urban-light-grey/60 px-3 py-1.5 border border-urban-border">
                <Lock size={12} className="text-urban-warm-grey" />
                <span>Verified Purchaser Exclusive</span>
              </div>
            )
          ) : (
            <Link
              to="/account/login"
              className="inline-flex items-center space-x-1.5 px-4 py-2 border border-urban-border text-xs uppercase tracking-wider text-urban-black hover:border-urban-black transition-colors"
            >
              <span>Sign In to Appraise</span>
            </Link>
          )}
        </div>
      </div>

      {/* Ratings Aggregate & Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-8 border-b border-urban-border">
        {/* Left: Overall Score Card */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-urban-light-grey/50 border border-urban-border text-center">
          <span className="font-serif text-5xl font-light text-urban-black">
            {Number(stats.averageRating).toFixed(1)}
          </span>
          <div className="flex items-center space-x-1 my-2.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={18}
                className={
                  s <= Math.round(stats.averageRating)
                    ? 'fill-amber-400 text-amber-500'
                    : 'text-urban-border'
                }
              />
            ))}
          </div>
          <span className="text-xs text-urban-warm-grey font-mono">
            {stats.total} verified {stats.total === 1 ? 'appraisal' : 'appraisals'}
          </span>
          <span className="text-[11px] text-urban-teal font-medium mt-1">
            100% Verified Buyer Provenance
          </span>
        </div>

        {/* Right: Distribution Bars & Filter */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2.5">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-urban-warm-grey pb-1">
            <span>Rating Breakdown</span>
            {filterRating > 0 && (
              <button
                type="button"
                onClick={() => setFilterRating(0)}
                className="text-urban-teal hover:underline text-[11px]"
              >
                Clear filter ({filterRating} stars)
              </button>
            )}
          </div>

          {[5, 4, 3, 2, 1].map((stars) => {
            const count = stats.breakdown?.[stars] || 0;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            const isSelected = filterRating === stars;

            return (
              <button
                key={stars}
                type="button"
                onClick={() => setFilterRating(filterRating === stars ? 0 : stars)}
                className={`flex items-center space-x-3 text-xs w-full text-left py-0.5 px-1 rounded transition-colors ${
                  isSelected ? 'bg-urban-teal/10 font-medium' : 'hover:bg-urban-light-grey/40'
                }`}
              >
                <span className="w-14 text-urban-black flex items-center space-x-1">
                  <span>{stars}</span>
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-urban-light-grey rounded-full overflow-hidden border border-urban-border/40">
                  <div
                    className="h-full bg-urban-teal transition-all duration-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-urban-warm-grey font-mono text-[11px]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="divide-y divide-urban-border/70">
        {loading ? (
          <div className="py-12 space-y-4">
            <div className="h-4 bg-urban-light-grey w-1/3 animate-pulse" />
            <div className="h-16 bg-urban-light-grey animate-pulse" />
          </div>
        ) : filteredReviews.length > 0 ? (
          filteredReviews.map((rev) => {
            const isVoted = helpfulMap[rev._id];
            const currentHelpful = (rev.helpfulVotes || 0);

            return (
              <div key={rev._id} className="py-7 space-y-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {/* Stars */}
                    <div className="flex items-center space-x-1 mb-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={
                            s <= rev.rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-urban-border'
                          }
                        />
                      ))}
                    </div>
                    {/* Review Title */}
                    <h4 className="font-serif text-base font-medium text-urban-black">
                      {rev.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-urban-warm-grey font-mono">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Review Commentary */}
                <p className="text-xs text-urban-warm-grey leading-relaxed max-w-3xl">
                  {rev.comment}
                </p>

                {/* Optional Attached Photos */}
                {rev.images && rev.images.length > 0 && (
                  <div className="flex items-center space-x-3 pt-1">
                    {rev.images.map((img, i) => (
                      <a
                        key={i}
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="w-16 h-16 border border-urban-border bg-urban-light-grey overflow-hidden rounded-sm hover:opacity-90 transition-opacity"
                      >
                        <img src={img} alt="review media" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Concierge / Admin Reply */}
                {rev.adminReply?.comment && (
                  <div className="ml-4 pl-4 border-l-2 border-urban-teal bg-urban-light-grey/40 p-3 space-y-1 text-xs">
                    <div className="flex items-center space-x-1.5 text-urban-teal font-semibold text-[10px] uppercase tracking-wider">
                      <CornerDownRight size={12} />
                      <span>Atelier Concierge Response</span>
                    </div>
                    <p className="text-urban-black text-xs leading-relaxed">
                      {rev.adminReply.comment}
                    </p>
                  </div>
                )}

                {/* Review Footer: Author, Verified Badge & Helpful Action */}
                <div className="flex items-center justify-between pt-2 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-medium text-urban-black">
                      {rev.authorName || 'Verified Collector'}
                    </span>
                    {rev.isVerifiedPurchase && (
                      <span className="inline-flex items-center space-x-1 text-[10px] text-urban-teal font-medium uppercase tracking-wider bg-urban-teal/10 px-2 py-0.5 rounded-sm">
                        <CheckCircle size={10} />
                        <span>Verified Buyer</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVoteHelpful(rev._id)}
                    className={`flex items-center space-x-1.5 text-xs transition-colors py-1 px-2.5 border ${
                      isVoted
                        ? 'border-urban-teal bg-urban-teal/10 text-urban-teal font-medium'
                        : 'border-urban-border text-urban-warm-grey hover:text-urban-black hover:border-urban-black'
                    }`}
                  >
                    <ThumbsUp size={12} className={isVoted ? 'fill-urban-teal' : ''} />
                    <span>Helpful ({currentHelpful})</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-14 text-center space-y-2">
            <p className="font-serif text-lg text-urban-black">No Appraisals Found</p>
            <p className="text-xs text-urban-warm-grey">
              {filterRating > 0
                ? `No ${filterRating}-star reviews yet.`
                : 'Be the inaugural client to appraise this atelier garment.'}
            </p>
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        productId={productId}
        productName={product?.name || 'Garment'}
        onReviewSubmitted={loadProductReviews}
      />
    </div>
  );
};
