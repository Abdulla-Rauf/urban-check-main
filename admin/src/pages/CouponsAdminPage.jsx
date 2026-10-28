import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Ticket, Calendar, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { marketingService } from '../services/marketingService';

export const CouponsAdminPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    couponCode: '',
    discountType: 'percentage',
    discountValue: 10,
    minimumOrder: 3000,
    maximumDiscount: '',
    usageLimit: 1000,
    perUserLimit: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    status: 'active',
  });

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await marketingService.getCoupons();
      setCoupons(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      couponCode: '',
      discountType: 'percentage',
      discountValue: 10,
      minimumOrder: 3000,
      maximumDiscount: '',
      usageLimit: 1000,
      perUserLimit: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      status: 'active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      couponCode: coupon.couponCode,
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue ?? 10,
      minimumOrder: coupon.minimumOrder ?? 0,
      maximumDiscount: coupon.maximumDiscount ?? '',
      usageLimit: coupon.usageLimit ?? '',
      perUserLimit: coupon.perUserLimit ?? 1,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
      status: coupon.status || 'active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.couponCode.trim()) {
      setFormError('Coupon code is required');
      return;
    }
    if (!formData.endDate) {
      setFormError('Coupon expiration date is required');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        ...formData,
        couponCode: formData.couponCode.trim().toUpperCase(),
        discountValue: Number(formData.discountValue) || 0,
        minimumOrder: Number(formData.minimumOrder) || 0,
        maximumDiscount: formData.maximumDiscount ? Number(formData.maximumDiscount) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        perUserLimit: Number(formData.perUserLimit) || 1,
      };

      if (editingCoupon) {
        await marketingService.updateCoupon(editingCoupon._id, payload);
      } else {
        await marketingService.createCoupon(payload);
      }

      setIsModalOpen(false);
      await loadCoupons();
    } catch (err) {
      setFormError(err.message || 'Failed to save coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (window.confirm(`Are you sure you want to delete coupon "${code}"?`)) {
      try {
        await marketingService.deleteCoupon(id);
        await loadCoupons();
      } catch (err) {
        alert(err.message || 'Failed to delete coupon');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Coupons & Promo Codes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create percentage or fixed vouchers with order value thresholds, per-user limits, and fraud protection.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium shadow-sm transition-colors"
        >
          <Plus size={15} />
          <span>New Coupon</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
          {error}
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Ticket size={16} className="text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Active Promo Codes ({coupons.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Strict Server-Side Validation at Checkout
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Loading promotional coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No coupon vouchers registered. Click "New Coupon" to issue a promo code.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min Order & Cap</th>
                  <th className="py-3 px-4">Usage / Limits</th>
                  <th className="py-3 px-4">Validity Period</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((coupon) => {
                  const now = new Date();
                  const isExpired = new Date(coupon.endDate) < now;
                  const isOverused = coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit;

                  return (
                    <tr key={coupon._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200 tracking-wider">
                          {coupon.couponCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue.toLocaleString('en-IN')} OFF`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">
                          Min: ₹{coupon.minimumOrder.toLocaleString('en-IN')}
                        </div>
                        {coupon.maximumDiscount ? (
                          <div className="text-[10px] text-slate-500">
                            Cap: ₹{coupon.maximumDiscount.toLocaleString('en-IN')}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">No max cap</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-slate-800 font-medium">
                          {coupon.usedCount || 0} / {coupon.usageLimit ? coupon.usageLimit : '∞'} used
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans">
                          Max {coupon.perUserLimit || 1} per customer
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{new Date(coupon.startDate).toLocaleDateString('en-IN')}</span>
                          <span className="text-slate-400">→</span>
                          <span>{new Date(coupon.endDate).toLocaleDateString('en-IN')}</span>
                        </div>
                        {isExpired && (
                          <span className="text-[10px] font-semibold text-red-600 block mt-0.5">
                            Expired
                          </span>
                        )}
                        {isOverused && (
                          <span className="text-[10px] font-semibold text-amber-600 block mt-0.5">
                            Limit Reached
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            coupon.status === 'active' && !isExpired && !isOverused
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {coupon.status === 'active' ? (isExpired ? 'Expired' : isOverused ? 'Maxed' : 'Active') : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-1 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Edit coupon"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon._id, coupon.couponCode)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete coupon"
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
                {editingCoupon ? 'Edit Coupon Code' : 'Issue New Promo Coupon'}
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
                  Coupon Code (Uppercase) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.couponCode}
                  onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. ATELIER25"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 font-mono font-bold tracking-wider uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Discount Type *
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
                    min="1"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder="e.g. 15 or 500"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Minimum Order Requirement (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimumOrder}
                    onChange={(e) => setFormData({ ...formData, minimumOrder: e.target.value })}
                    placeholder="e.g. 3000"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Maximum Discount Cap (₹ Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maximumDiscount}
                    onChange={(e) => setFormData({ ...formData, maximumDiscount: e.target.value })}
                    placeholder="e.g. 2500"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Global Usage Limit (Total times)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="e.g. 1000 (Empty for unlimited)"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Per User Limit *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.perUserLimit}
                    onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 font-mono"
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
                  {isSubmitting ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Issue Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
