import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  Building2,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { refundService } from '../services/refundService';

export const RefundsAdminPage = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modals
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Form state
  const [processForm, setProcessForm] = useState({
    status: 'Approved',
    speed: 'normal',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRefunds();
  }, [statusFilter, page]);

  const loadRefunds = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await refundService.getRefunds({
        page,
        limit: 12,
        status: statusFilter,
        search: searchQuery,
      });
      setRefunds(data.refunds || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load refunds ledgers.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadRefunds();
  };

  const openProcessModal = (ref) => {
    setSelectedRefund(ref);
    const nextStatus =
      ref.status === 'Pending'
        ? 'Approved'
        : ref.status === 'Approved'
        ? 'Processing'
        : ref.status === 'Processing'
        ? 'Completed'
        : 'Completed';

    setProcessForm({
      status: nextStatus,
      speed: 'normal',
      note: 'Finance authorization for gateway charge reversal',
    });
    setShowProcessModal(true);
  };

  const openHistoryModal = (ref) => {
    setSelectedRefund(ref);
    setShowHistoryModal(true);
  };

  const submitProcessRefund = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await refundService.processRefund(selectedRefund.id, processForm);
      setShowProcessModal(false);
      setSuccessMessage(`Refund #${selectedRefund.id} successfully updated to "${processForm.status}"`);
      setTimeout(() => setSuccessMessage(''), 4500);
      loadRefunds();
    } catch (err) {
      alert(err.message || 'Failed to process refund');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Processing':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Approved':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Failed':
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
            Refunds & Payment Gateway Charge Reversals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage refund status changes (Pending $\rightarrow$ Approved $\rightarrow$ Processing $\rightarrow$ Completed), trace ARN audit logs, and trigger automated Razorpay reversals.
          </p>
        </div>

        <button
          onClick={loadRefunds}
          className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Gateway Architecture Notice Card */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-amber-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Automated Razorpay Gateway Settlement Architecture</h4>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              Equipped with end-to-end API gateway refund pipelines. Transitions to "Completed" automatically invoke Razorpay payout protocols, record Acquirer Reference Numbers (ARN), and update customer payment states.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-[11px] font-semibold bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 flex-shrink-0">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Razorpay Webhook & API Ready</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search refund #, return #, order #, ARN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </form>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Refund Statuses</option>
              <option value="Pending">Pending Authorization</option>
              <option value="Approved">Approved for Payout</option>
              <option value="Processing">Processing in Gateway</option>
              <option value="Completed">Completed & Settled</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw size={24} className="animate-spin mx-auto text-slate-400" />
            <p className="text-xs">Loading refund ledgers...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 space-y-2">
            <AlertCircle size={24} className="mx-auto" />
            <p className="text-xs">{error}</p>
          </div>
        ) : refunds.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <CreditCard size={32} className="mx-auto text-slate-400" />
            <p className="text-sm font-medium">No refund ledgers found</p>
            <p className="text-xs text-slate-400">
              When returns or order cancellations are approved, refunds appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Refund Ref</th>
                  <th className="px-4 py-3">Return / Order Ref</th>
                  <th className="px-4 py-3">Patron</th>
                  <th className="px-4 py-3">Amount Refunded</th>
                  <th className="px-4 py-3">Gateway Method</th>
                  <th className="px-4 py-3">Gateway ARN</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Settlement Time</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {refunds.map((ref) => {
                  const isCompleted = ref.status === 'Completed';

                  return (
                    <tr key={ref.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-900">
                        {ref.id}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-600">
                        <div>#{ref.orderId}</div>
                        <div className="text-[10px] text-slate-400">{ref.returnId}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{ref.customer}</div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[120px]">
                          {ref.customerEmail}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        ₹{ref.amount?.toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center space-x-1 font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          <CreditCard size={11} className="text-slate-500" />
                          <span>{ref.gateway} ({ref.method})</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        {ref.arn ? (
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                            {ref.arn}
                          </span>
                        ) : ref.gatewayRefundId ? (
                          <span className="text-slate-600">{ref.gatewayRefundId}</span>
                        ) : (
                          <span className="text-slate-400 italic">Pending Gateway</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${getStatusBadge(
                            ref.status
                          )}`}
                        >
                          {ref.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                        {ref.processedAt}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openHistoryModal(ref)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 font-medium text-[11px]"
                        >
                          Audit Trail ({ref.history?.length || 0})
                        </button>

                        {!isCompleted && (
                          <button
                            onClick={() => openProcessModal(ref)}
                            className="px-2.5 py-1 text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-[11px]"
                          >
                            Process
                          </button>
                        )}
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
              Page {page} of {pagination.totalPages} ({pagination.total} total refund records)
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

      {/* MODAL 1: Process Refund Status Change */}
      {showProcessModal && selectedRefund && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Process Refund #{selectedRefund.id}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Amount: <strong className="text-slate-900">₹{selectedRefund.amount?.toLocaleString('en-IN')}</strong> • Order #{selectedRefund.orderId}
                </p>
              </div>
              <button
                onClick={() => setShowProcessModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitProcessRefund} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Update Refund Status *
                </label>
                <select
                  value={processForm.status}
                  onChange={(e) => setProcessForm({ ...processForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                >
                  <option value="Approved">Approved (Authorized by Finance)</option>
                  <option value="Processing">Processing (Dispatched to Razorpay Gateway)</option>
                  <option value="Completed">Completed (Settled with Bank / Card Reversal)</option>
                  <option value="Failed">Failed (Gateway Error / Invalid Account)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Reversal Payout Speed
                </label>
                <select
                  value={processForm.speed}
                  onChange={(e) => setProcessForm({ ...processForm, speed: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                >
                  <option value="normal">Normal Banking SLA (5-7 business days)</option>
                  <option value="optimum">Optimum Instant Reversal (Immediate)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Finance Audit Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Return inspection approved. Initiated Razorpay gateway reversal."
                  value={processForm.note}
                  onChange={(e) => setProcessForm({ ...processForm, note: e.target.value })}
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
                  {submitting ? 'Processing Gateway...' : 'Update & Reconcile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Refund History & Gateway Details */}
      {showHistoryModal && selectedRefund && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Refund Dossier #{selectedRefund.id}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order #{selectedRefund.orderId} • Return #{selectedRefund.returnId}
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* Gateway Ledger Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Reversal Gateway:</span>
                  <strong className="text-slate-900">{selectedRefund.gateway}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Gateway Refund ID:</span>
                  <span className="font-mono text-slate-800">
                    {selectedRefund.gatewayRefundId || 'Generated upon completion'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Bank Acquirer Reference (ARN):</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {selectedRefund.arn || 'Pending Bank Settlement'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Total Credit Value:</span>
                  <strong className="text-slate-900 text-sm">
                    ₹{selectedRefund.amount?.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* History Audit Trail */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-900 mb-3 text-xs">
                  Full Reversal Audit Log
                </h4>
                {selectedRefund.history?.length > 0 ? (
                  <div className="relative border-l-2 border-slate-300 ml-3 space-y-4 pl-5">
                    {selectedRefund.history.map((h, idx) => (
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
                          By: {h.adminName}
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
                onClick={() => setShowHistoryModal(false)}
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
