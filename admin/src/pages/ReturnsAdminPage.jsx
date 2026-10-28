import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  ShieldAlert,
  ArrowRightLeft,
  X,
  AlertCircle,
  Calendar,
  FileText,
} from 'lucide-react';
import { returnService } from '../services/returnService';

export const ReturnsAdminPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modals
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Process Form state
  const [statusForm, setStatusForm] = useState({
    status: 'UnderReview',
    note: '',
    scheduledDate: '',
    courierName: 'DTDC Reverse Cargo',
    pickupAwb: '',
    qualityCheckPassed: true,
    qualityCheckNotes: 'Item in original condition with intact security tags.',
    rejectionReason: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReturns();
  }, [statusFilter, typeFilter, page]);

  const loadReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await returnService.getReturns({
        page,
        limit: 12,
        status: statusFilter,
        type: typeFilter,
        search: searchQuery,
      });
      setReturns(data.returns || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load returns queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadReturns();
  };

  const openProcessModal = (ret) => {
    setSelectedReturn(ret);
    const nextStatusMap = {
      Requested: 'UnderReview',
      UnderReview: 'Approved',
      Approved: 'PickupScheduled',
      PickupScheduled: 'Received',
      Received: 'QualityCheck',
      QualityCheck: 'RefundApproved',
      RefundApproved: 'Refunded',
    };

    setStatusForm({
      status: nextStatusMap[ret.status] || ret.status,
      note: '',
      scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      courierName: 'DTDC Reverse Cargo',
      pickupAwb: ret.pickupDetails?.pickupAwb || '',
      qualityCheckPassed: true,
      qualityCheckNotes: 'Fabric, seams, and brand security tags fully intact.',
      rejectionReason: '',
    });
    setShowProcessModal(true);
  };

  const openDetailsModal = (ret) => {
    setSelectedReturn(ret);
    setShowDetailsModal(true);
  };

  const submitStatusUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await returnService.updateStatus(selectedReturn.id, statusForm);
      setShowProcessModal(false);
      setSuccessMessage(`Return #${selectedReturn.id} updated to "${statusForm.status}"`);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadReturns();
    } catch (err) {
      alert(err.message || 'Failed to update return status');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Refunded':
      case 'RefundApproved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Approved':
      case 'PickupScheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Received':
      case 'QualityCheck':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'UnderReview':
      case 'Requested':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
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
            Returns, Exchanges & Reverse Logistics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage the 9-stage return lifecycle (Requested $\rightarrow$ QualityCheck $\rightarrow$ Refunded), validate size exchanges, and schedule reverse courier pickups.
          </p>
        </div>

        <button
          onClick={loadReturns}
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
              placeholder="Search return #, order #, customer..."
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
              <option value="all">All 9 Lifecycle Stages</option>
              <option value="Requested">1. Requested</option>
              <option value="UnderReview">2. UnderReview</option>
              <option value="Approved">3. Approved</option>
              <option value="PickupScheduled">4. PickupScheduled</option>
              <option value="Received">5. Received</option>
              <option value="QualityCheck">6. QualityCheck</option>
              <option value="RefundApproved">7. RefundApproved</option>
              <option value="Refunded">8. Refunded</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Types (Returns & Exchanges)</option>
              <option value="Return">Return for Refund</option>
              <option value="Exchange">Size Exchange</option>
            </select>
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw size={24} className="animate-spin mx-auto text-slate-400" />
            <p className="text-xs">Loading reverse logistics queue...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 space-y-2">
            <AlertCircle size={24} className="mx-auto" />
            <p className="text-xs">{error}</p>
          </div>
        ) : returns.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RotateCcw size={32} className="mx-auto text-slate-400" />
            <p className="text-sm font-medium">No returns or exchanges found</p>
            <p className="text-xs text-slate-400">
              When patrons initiate returns or exchanges, they will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Return ID</th>
                  <th className="px-4 py-3">Order Ref</th>
                  <th className="px-4 py-3">Patron</th>
                  <th className="px-4 py-3">Garment & Reason</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Refund Amount</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {returns.map((ret) => {
                  const firstItem = ret.items?.[0] || {};
                  const isExchange = ret.type === 'Exchange';

                  return (
                    <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-900">
                        {ret.id}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-600">
                        #{ret.orderId}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{ret.customer}</div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[120px]">
                          {ret.customerEmail}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">
                          {firstItem.name || 'Garment'}
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {firstItem.reason || ret.reason}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {isExchange ? (
                          <div className="inline-flex items-center space-x-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px] font-semibold">
                            <ArrowRightLeft size={11} />
                            <span>
                              Exchange ({firstItem.exchangeDetails?.currentSize} $\rightarrow$ {firstItem.exchangeDetails?.newSize})
                            </span>
                          </div>
                        ) : (
                          <span className="inline-block text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-semibold">
                            Return for Refund
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${getStatusBadge(
                            ret.status
                          )}`}
                        >
                          {ret.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {isExchange ? '—' : `₹${ret.totalRefundAmount?.toLocaleString('en-IN')}`}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openDetailsModal(ret)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 font-medium text-[11px]"
                        >
                          Details ({ret.historyCount})
                        </button>

                        <button
                          onClick={() => openProcessModal(ret)}
                          className="px-2.5 py-1 text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-[11px]"
                        >
                          Process
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page {page} of {pagination.totalPages} ({pagination.total} total returns)
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

      {/* MODAL 1: Process Return Status Lifecycle */}
      {showProcessModal && selectedReturn && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Process Return #{selectedReturn.id}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order: #{selectedReturn.orderId} • Current Status: <strong>{selectedReturn.status}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowProcessModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitStatusUpdate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Target Status *
                </label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                >
                  <option value="Requested">1. Requested (Customer Initial Submission)</option>
                  <option value="UnderReview">2. UnderReview (Concierge Verification)</option>
                  <option value="Approved">3. Approved (Reverse Dispatch Authorized)</option>
                  <option value="PickupScheduled">4. PickupScheduled (Reverse Courier Booked)</option>
                  <option value="Received">5. Received (Parcel Arrived at Depot)</option>
                  <option value="QualityCheck">6. QualityCheck (Atelier Fabric Inspection)</option>
                  <option value="RefundApproved">7. RefundApproved (Authorize Credit Reversal)</option>
                  <option value="Refunded">8. Refunded (Completed & Settled)</option>
                  <option value="Rejected">Rejected (Ineligible)</option>
                </select>
              </div>

              {/* Conditional Pickup Details */}
              {statusForm.status === 'PickupScheduled' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2.5">
                  <span className="font-semibold text-blue-900 block text-xs">
                    Reverse Courier Logistics Details
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-blue-800 mb-1">Pickup Date</label>
                      <input
                        type="date"
                        value={statusForm.scheduledDate}
                        onChange={(e) =>
                          setStatusForm({ ...statusForm, scheduledDate: e.target.value })
                        }
                        className="w-full px-2 py-1.5 border border-blue-300 rounded bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-blue-800 mb-1">Reverse Waybill / AWB</label>
                      <input
                        type="text"
                        placeholder="e.g. REV-DTDC-89102"
                        value={statusForm.pickupAwb}
                        onChange={(e) => setStatusForm({ ...statusForm, pickupAwb: e.target.value })}
                        className="w-full px-2 py-1.5 border border-blue-300 rounded bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Quality Check */}
              {statusForm.status === 'QualityCheck' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2.5">
                  <span className="font-semibold text-purple-900 block text-xs">
                    Atelier Quality Inspection Audit
                  </span>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-1.5 text-xs text-purple-900 font-medium">
                      <input
                        type="radio"
                        checked={statusForm.qualityCheckPassed === true}
                        onChange={() => setStatusForm({ ...statusForm, qualityCheckPassed: true })}
                      />
                      <span>Passed Inspection</span>
                    </label>
                    <label className="flex items-center space-x-1.5 text-xs text-red-700 font-medium">
                      <input
                        type="radio"
                        checked={statusForm.qualityCheckPassed === false}
                        onChange={() => setStatusForm({ ...statusForm, qualityCheckPassed: false })}
                      />
                      <span>Failed / Damaged by Patron</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Inspection findings (e.g. fabric pristine, tags attached)"
                    value={statusForm.qualityCheckNotes}
                    onChange={(e) =>
                      setStatusForm({ ...statusForm, qualityCheckNotes: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-purple-300 rounded bg-white text-xs"
                  />
                </div>
              )}

              {/* Conditional Rejection Reason */}
              {statusForm.status === 'Rejected' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1.5">
                  <span className="font-semibold text-red-900 block text-xs">
                    Rejection Explanation *
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Garment tags removed or beyond 14-day return window"
                    value={statusForm.rejectionReason}
                    onChange={(e) =>
                      setStatusForm({ ...statusForm, rejectionReason: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-red-300 rounded bg-white text-xs"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Internal Audit Log Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Package inspected and approved for gateway refund reversal."
                  value={statusForm.note}
                  onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save Return Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Details & Status History Audit Log */}
      {showDetailsModal && selectedReturn && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Return Dossier & Reverse Logistics
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-0.5 flex items-center space-x-2">
                  <span>Return #{selectedReturn.id}</span>
                  <span className="text-slate-400 font-normal">|</span>
                  <span className="font-mono text-slate-600">Order #{selectedReturn.orderId}</span>
                </h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Overview Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    Patron
                  </span>
                  <strong className="text-slate-800">{selectedReturn.customer}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    Current Status
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 mt-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(
                      selectedReturn.status
                    )}`}
                  >
                    {selectedReturn.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    Type
                  </span>
                  <strong className="text-slate-800">{selectedReturn.type}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    Refund Amount
                  </span>
                  <strong className="text-slate-900">
                    ₹{selectedReturn.totalRefundAmount?.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Items in Return */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-900 mb-3 text-xs">
                  Returned Pieces
                </h4>
                <div className="space-y-3">
                  {selectedReturn.items?.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 border border-slate-200 rounded-lg flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start space-x-3">
                        {it.thumbnail && (
                          <img
                            src={it.thumbnail}
                            alt=""
                            className="w-12 h-14 object-cover rounded bg-slate-100"
                          />
                        )}
                        <div>
                          <strong className="text-slate-900 font-semibold block">{it.name}</strong>
                          <span className="text-slate-500 text-[11px]">
                            Variant: {it.variant?.size} • {it.variant?.color} • SKU: {it.variant?.sku}
                          </span>
                          <div className="mt-1 text-[11px] text-slate-700">
                            <strong>Reason:</strong> {it.reason}
                            {it.description && <span> — "{it.description}"</span>}
                          </div>

                          {it.exchangeDetails?.newSize && (
                            <div className="mt-1.5 p-2 bg-purple-50 text-purple-900 border border-purple-200 rounded text-[11px] flex items-center space-x-1.5">
                              <ArrowRightLeft size={13} />
                              <span>
                                <strong>Requested Exchange:</strong> Size{' '}
                                {it.exchangeDetails.currentSize} $\rightarrow$ <strong>Size {it.exchangeDetails.newSize}</strong> (Verified In-Stock: {it.exchangeDetails.isAvailable ? 'Yes' : 'No'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <strong className="text-slate-900">
                        ₹{(it.price * it.quantity)?.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reverse Pickup Courier Info */}
              {selectedReturn.pickupDetails && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="font-bold text-slate-800 text-xs mb-1">Reverse Courier Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>
                      Carrier: <strong>{selectedReturn.pickupDetails.courierName || 'DTDC Reverse'}</strong>
                    </div>
                    <div>
                      AWB:{' '}
                      <strong className="font-mono">
                        {selectedReturn.pickupDetails.pickupAwb || 'Pending Booking'}
                      </strong>
                    </div>
                    <div className="col-span-2">
                      Pickup Address:{' '}
                      <span>
                        {selectedReturn.pickupDetails.address?.address},{' '}
                        {selectedReturn.pickupDetails.address?.city}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status History Audit Trail */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-900 mb-3 text-xs">
                  Full 9-Stage Audit Log
                </h4>
                {selectedReturn.history?.length > 0 ? (
                  <div className="relative border-l-2 border-slate-300 ml-3 space-y-4 pl-5">
                    {selectedReturn.history.map((h, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-900 ring-4 ring-white" />
                        <div className="flex items-baseline justify-between">
                          <span className="font-bold text-slate-900">{h.status}</span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(h.timestamp).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{h.note}</p>
                        <span className="text-[10px] text-slate-400 block">
                          Recorded by: {h.updatedBy}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No history records.</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
