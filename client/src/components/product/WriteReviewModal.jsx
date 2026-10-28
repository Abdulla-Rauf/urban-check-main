import React, { useState } from 'react';
import { X, Star, CheckCircle2, AlertCircle, Plus, Trash2, Camera } from 'lucide-react';
import { reviewService } from '../../services/reviewService';

export const WriteReviewModal = ({
  isOpen,
  onClose,
  productId,
  productName,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddImage = () => {
    if (imageUrl.trim() && !images.includes(imageUrl.trim())) {
      setImages([...images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !comment.trim()) {
      setErrorMsg('Please provide both an appraisal headline and detailed commentary.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await reviewService.submitReview({
        productId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        images,
      });

      setIsSuccess(true);
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
        err.message ||
        'Only clients with a verified order of this piece are eligible to post an appraisal.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl border border-urban-border z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-urban-border">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-urban-teal font-semibold block">
              Verified Purchaser Appraisal
            </span>
            <h3 className="font-serif text-lg font-semibold text-urban-black">
              Review Atelier Piece
            </h3>
            <p className="text-xs text-urban-warm-grey truncate max-w-xs">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-urban-warm-grey hover:text-urban-black transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-10 text-center flex flex-col items-center">
            <CheckCircle2 size={44} className="text-emerald-600 mb-3 animate-bounce" />
            <h4 className="font-serif text-xl font-semibold text-urban-black">Appraisal Recorded</h4>
            <p className="text-xs text-urban-warm-grey mt-2 max-w-xs leading-relaxed">
              Your verified review and rating have been confirmed and published to the product dossier.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 flex items-start space-x-2 text-red-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* Rating Stars Picker */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-urban-black mb-1.5">
                Garment Rating
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-125"
                  >
                    <Star
                      size={22}
                      className={
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-urban-border'
                      }
                    />
                  </button>
                ))}
                <span className="ml-2 font-mono text-xs font-semibold text-urban-black">
                  {hoverRating || rating}.0 / 5.0
                </span>
              </div>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-urban-black mb-1.5">
                Headline / Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Impeccable tailoring and luxurious hand-feel"
                className="w-full px-3 py-2 border border-urban-border focus:border-urban-black focus:outline-none bg-white text-xs text-urban-black"
              />
            </div>

            {/* Review Commentary */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-urban-black mb-1.5">
                Your Appraisal Commentary *
              </label>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts on silhouette drape, textile quality, fit fidelity, and artisanal finish..."
                className="w-full px-3 py-2 border border-urban-border focus:border-urban-black focus:outline-none bg-white text-xs text-urban-black resize-none"
              />
            </div>

            {/* Images upload/URLs */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-urban-black mb-1.5 flex items-center justify-between">
                <span>Garment Photography (Optional)</span>
                <span className="text-[10px] text-urban-warm-grey font-normal font-sans">
                  {images.length}/3 photos
                </span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-2 border border-urban-border focus:border-urban-black focus:outline-none bg-white text-xs text-urban-black"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  disabled={!imageUrl.trim() || images.length >= 3}
                  className="px-3 py-2 bg-urban-light-grey border border-urban-border hover:bg-urban-border text-urban-black transition-colors disabled:opacity-40 flex items-center space-x-1"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>

              {images.length > 0 && (
                <div className="flex items-center space-x-3 mt-2.5">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-14 h-14 border border-urban-border bg-urban-light-grey overflow-hidden group"
                    >
                      <img src={img} alt="review" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Atelier Purchase Verification Notice */}
            <div className="p-3 bg-urban-light-grey/40 border border-urban-border/60 text-[11px] text-urban-warm-grey flex items-center space-x-2">
              <Camera size={14} className="text-urban-teal flex-shrink-0" />
              <span>
                Verified Buyer validation is automatically linked with your authenticated order invoice.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-urban-border flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 border border-urban-border text-xs uppercase tracking-wider font-semibold text-urban-black hover:border-urban-black transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-urban-black text-white text-xs uppercase tracking-wider font-semibold hover:bg-urban-teal transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting Appraisal...' : 'Submit Appraisal'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
