import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Calendar, CheckCircle2, Clock, X } from 'lucide-react';
import { marketingService } from '../services/marketingService';

export const OffersAdminPage = () => {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: 15,
    discountType: 'percentage',
    offerPrice: '',
    badgeText: '15% OFF',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: 'active',
  });

  const loadOffers = async () => {
    setIsLoading(true);
    try {
      const data = await marketingService.getOffers();
      setOffers(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load offers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingOffer(null);
    setFormData({
      title: '',
      description: '',
      discount: 15,
      discountType: 'percentage',
      offerPrice: '',
      badgeText: '15% OFF',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description || '',
      discount: offer.discount || 0,
      discountType: offer.discountType || 'percentage',
      offerPrice: offer.offerPrice != null ? offer.offerPrice : '',
      badgeText: offer.badgeText || '',
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : '',
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '',
      status: offer.status || 'active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Offer title is required');
      return;
    }
    if (!formData.endDate) {
      setFormError('Offer end date is required');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        ...formData,
        discount: Number(formData.discount) || 0,
        offerPrice: formData.offerPrice !== '' ? Number(formData.offerPrice) : null,
      };

      if (editingOffer) {
        await marketingService.updateOffer(editingOffer._id, payload);
      } else {
        await marketingService.createOffer(payload);
      }

      setIsModalOpen(false);
      await loadOffers();
    } catch (err) {
      setFormError(err.message || 'Failed to save offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete offer "${title}"?`)) {
      try {
        await marketingService.deleteOffer(id);
        await loadOffers();
      } catch (err) {
        alert(err.message || 'Failed to delete offer');
      }
    }
  };

  const isLive = (offer) => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);
    return offer.status === 'active' && now >= start && now <= end;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Product Offers & Campaigns
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated seasonal offers, promotional badges, and server-validated discount prices.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium shadow-sm transition-colors"
        >
          <Plus size={15} />
          <span>Create Offer</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
          {error}
        </div>
      )}

      {/* Offers Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Tag size={16} className="text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Promotions Registry ({offers.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Evaluated Server-Side by Live Timestamp
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Loading promotional offers...
          </div>
        ) : offers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No promotional offers configured. Click "Create Offer" to launch a campaign.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Campaign Title</th>
                  <th className="py-3 px-4">Badge</th>
                  <th className="py-3 px-4">Discount / Value</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Server Evaluation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offers.map((offer) => {
                  const currentlyLive = isLive(offer);
                  return (
                    <tr key={offer._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900">{offer.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">{offer.description || '—'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 rounded font-semibold text-[10px] uppercase tracking-wider">
                          {offer.badgeText || 'SPECIAL OFFER'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {offer.offerPrice != null ? (
                          <span>Fixed ₹{offer.offerPrice.toLocaleString('en-IN')}</span>
                        ) : (
                          <span>
                            {offer.discount}
                            {offer.discountType === 'percentage' ? '%' : ' OFF'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{new Date(offer.startDate).toLocaleDateString('en-IN')}</span>
                          <span className="text-slate-400">→</span>
                          <span>{new Date(offer.endDate).toLocaleDateString('en-IN')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {currentlyLive ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                            <CheckCircle2 size={12} />
                            <span>Live Now</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                            <Clock size={12} />
                            <span>Inactive / Expired</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            offer.status === 'active'
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {offer.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(offer)}
                            className="p-1 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Edit offer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(offer._id, offer.title)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete offer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingOffer ? 'Edit Product Offer' : 'Configure New Promotional Offer'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Mid-Season Atelier Privilege"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 15% reduction across signature virgin wool tailoring"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 bg-white"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Fixed Amount Discount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.discount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        discount: val,
                        badgeText: val ? `${val}% OFF` : formData.badgeText,
                      });
                    }}
                    placeholder="e.g. 15"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Offer Price (Optional Override)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.offerPrice}
                    onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                    placeholder="Leave empty for percentage discount"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Promotional Badge Text
                  </label>
                  <input
                    type="text"
                    value={formData.badgeText}
                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                    placeholder="e.g. 15% OFF or SPECIAL OFFER"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingOffer ? 'Save Changes' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
