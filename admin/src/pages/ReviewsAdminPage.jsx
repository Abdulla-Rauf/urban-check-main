import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  EyeOff,
  Trash2,
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  X,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { reviewService } from '../services/reviewService';

export const ReviewsAdminPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Moderate / Reply modal
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModerateModal, setShowModerateModal] = useState(false);
  const [modStatus, setModStatus] = useState('Approved');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [statusFilter, ratingFilter, page]);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewService.getReviews({
        page,
        limit: 12,
        status: statusFilter,
        rating: ratingFilter,
        search: searchQuery,
      });
      setReviews(data.reviews || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadReviews();
  };

  const handleQuickStatusChange = async (id, status) => {
    try {
      await reviewService.updateStatus(id, { status });
      setSuccessMessage(`Review status updated to "${status}"`);
      setTimeout(() => setSuccessMessage(''), 3500);
      loadReviews();
    } catch (err) {
      alert(err.message || 'Failed to update review status');
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this customer review?')) return;
    try {
      await reviewService.deleteReview(id);
      setSuccessMessage('Review deleted successfully.');
      setTimeout(() => setSuccessMessage(''), 3500);
      loadReviews();
    } catch (err) {
      alert(err.message || 'Failed to delete review');
    }
  };

  const openModerateModal = (rev) => {
    setSelectedReview(rev);
    setModStatus(rev.status);
    setAdminReplyText(rev.adminReply?.comment || '');
    setShowModerateModal(true);
  };

  const submitModeration = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewService.updateStatus(selectedReview.id, {
        status: modStatus,
        adminReply: adminReplyText,
      });
      setShowModerateModal(false);
      setSuccessMessage('Review moderation & concierge reply saved.');
      setTimeout(() => setSuccessMessage(''), 3500);
      loadReviews();
    } catch (err) {
      alert(err.message || 'Failed to update review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm flex items-center justify-between shadow-sm transition-all">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Appraisals & Reviews Moderation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enforce verified-purchaser integrity, approve authentic patron feedback, and manage concierge responses.
          </p>
        </div>

        <button
          onClick={loadReviews}
          className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patron, garment, comment, order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Moderation Statuses</option>
              <option value="Approved">Approved (Public)</option>
              <option value="Hidden">Hidden</option>
              <option value="Pending">Pending Review</option>
            </select>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars ★★★★★</option>
              <option value="4">4 Stars ★★★★☆</option>
              <option value="3">3 Stars ★★★☆☆</option>
              <option value="2">2 Stars ★★☆☆☆</option>
              <option value="1">1 Star ★☆☆☆☆</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw size={24} className="animate-spin mx-auto text-slate-400" />
            <p className="text-xs">Loading customer appraisals...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 space-y-2">
            <AlertCircle size={24} className="mx-auto" />
            <p className="text-xs">{error}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <MessageSquare size={32} className="mx-auto text-slate-400" />
            <p className="text-sm font-medium">No reviews match your filter</p>
            <p className="text-xs text-slate-400">
              Try adjusting your rating or status filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Garment Item</th>
                  <th className="px-4 py-3">Patron & Order</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Appraisal & Comment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-900 block max-w-xs truncate">
                        {rev.product}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800">{rev.customer}</div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck size={11} className="mr-0.5" />
                            Verified Buyer
                          </span>
                        )}
                        <span className="font-mono text-slate-400 text-[10px]">
                          #{rev.orderNumber}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                          />
                        ))}
                        <span className="text-[11px] font-bold text-slate-700 ml-1">
                          {rev.rating}.0
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 max-w-sm">
                      <strong className="text-slate-900 block font-semibold text-xs mb-0.5">
                        {rev.title}
                      </strong>
                      <p className="text-slate-500 line-clamp-2 leading-relaxed">{rev.comment}</p>
                      {rev.adminReply?.comment && (
                        <div className="mt-1.5 p-2 bg-slate-50 border-l-2 border-slate-700 text-[11px] text-slate-600 italic">
                          <strong className="not-italic text-slate-800 block text-[10px] uppercase font-semibold">
                            Concierge Response:
                          </strong>
                          {rev.adminReply.comment}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                          rev.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : rev.status === 'Hidden'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {rev.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                      {rev.date}
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2">
                      {rev.status !== 'Approved' ? (
                        <button
                          onClick={() => handleQuickStatusChange(rev.id, 'Approved')}
                          className="px-2 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold text-[11px]"
                          title="Approve Review"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleQuickStatusChange(rev.id, 'Hidden')}
                          className="px-2 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded font-semibold text-[11px]"
                          title="Hide Review"
                        >
                          Hide
                        </button>
                      )}

                      <button
                        onClick={() => openModerateModal(rev)}
                        className="px-2 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium text-[11px]"
                      >
                        Moderate
                      </button>

                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1 text-red-500 hover:text-red-700 rounded"
                        title="Delete Review"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page {page} of {pagination.totalPages} ({pagination.total} total reviews)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-slate-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Moderate & Reply */}
      {showModerateModal && selectedReview && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Moderate Customer Appraisal</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Garment: <strong className="text-slate-800">{selectedReview.product}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowModerateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitModeration} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg text-slate-700 space-y-1">
                <div className="flex items-center space-x-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < selectedReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                    />
                  ))}
                  <strong className="text-slate-900 font-bold ml-1.5">{selectedReview.title}</strong>
                </div>
                <p className="text-slate-600 italic">"{selectedReview.comment}"</p>
                <span className="text-[10px] text-slate-400 block pt-1">
                  By {selectedReview.customer} • Order #{selectedReview.orderNumber}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Visibility Status</label>
                <select
                  value={modStatus}
                  onChange={(e) => setModStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                >
                  <option value="Approved">Approved (Visible on product page)</option>
                  <option value="Hidden">Hidden (Concealed from storefront)</option>
                  <option value="Pending">Pending Evaluation</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Atelier Concierge Response (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Thank you for your review. We are delighted that you appreciated the tailored silhouette..."
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModerateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Moderation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
