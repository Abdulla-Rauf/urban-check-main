import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  ExternalLink,
  Copy,
  MapPin,
  Calendar,
  AlertCircle,
  RefreshCw,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { shippingService } from '../services/shippingService';

export const ShipmentsAdminPage = () => {
  const [shipments, setShipments] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filters & Pagination
  const [courierFilter, setCourierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    orderNumber: '',
    courier: 'DTDC',
    weightKg: '0.8',
    originHub: 'Urban Check Atelier Mumbai Dispatch',
    notes: '',
  });

  const [updateForm, setUpdateForm] = useState({
    status: 'Packed',
    location: '',
    description: '',
  });

  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(null);

  useEffect(() => {
    loadCouriers();
  }, []);

  useEffect(() => {
    loadShipments();
  }, [courierFilter, statusFilter, page]);

  const loadCouriers = async () => {
    try {
      const data = await shippingService.getCouriers();
      setCouriers(data);
    } catch (err) {
      console.warn('Failed to load couriers:', err.message);
    }
  };

  const loadPendingOrders = async () => {
    try {
      const orders = await shippingService.getPendingOrders();
      setPendingOrders(orders);
      if (orders.length > 0 && !createForm.orderNumber) {
        setCreateForm((prev) => ({ ...prev, orderNumber: orders[0].orderNumber }));
      }
    } catch (err) {
      console.warn('Failed to load pending orders:', err.message);
    }
  };

  const loadShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shippingService.getShipments({
        page,
        limit: 10,
        courier: courierFilter,
        status: statusFilter,
        search: searchQuery,
      });
      setShipments(data.shipments || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to load shipments.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadShipments();
  };

  const handleCopyAwb = (awb) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwb(awb);
    setTimeout(() => setCopiedAwb(null), 2000);
  };

  // Open Create Shipment modal
  const openCreateModal = () => {
    loadPendingOrders();
    setShowCreateModal(true);
  };

  // Open Update Tracking modal
  const openUpdateModal = (shipment) => {
    setSelectedShipment(shipment);
    const nextStatus =
      shipment.status === 'Confirmed'
        ? 'Packed'
        : shipment.status === 'Packed'
        ? 'Shipped'
        : shipment.status === 'Shipped'
        ? 'Out for Delivery'
        : shipment.status === 'Out for Delivery'
        ? 'Delivered'
        : 'Delivered';

    const defaultLocations = {
      Packed: 'Urban Check Atelier Packaging Hub, Mumbai',
      Shipped: `${shipment.courier} Central Airport Gateway, Mumbai`,
      'Out for Delivery': `${shipment.courier} Direct Last-Mile Hub, ${shipment.destination?.split(',')?.[0] || 'Local'}`,
      Delivered: shipment.destination || 'Patron Receiving Address',
    };

    const defaultDescriptions = {
      Packed: 'Garments quality-inspected, folded in tissue and sealed in luxury boutique packaging.',
      Shipped: `Package dispatched from Mumbai Gateway via ${shipment.courier} express transit.`,
      'Out for Delivery': `Consignment assigned to ${shipment.courier} delivery courier associate.`,
      Delivered: 'Consignment successfully delivered to patron with digital signature recorded.',
    };

    setUpdateForm({
      status: nextStatus,
      location: defaultLocations[nextStatus] || '',
      description: defaultDescriptions[nextStatus] || '',
    });
    setShowUpdateModal(true);
  };

  // Open Tracking History modal
  const openHistoryModal = async (shipment) => {
    setSelectedShipment(shipment);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const data = await shippingService.getTrackingHistory(shipment.awb || shipment.id);
      setTrackingHistory(data);
    } catch (err) {
      setError(err.message || 'Failed to load tracking history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Open Cancel modal
  const openCancelModal = (shipment) => {
    setSelectedShipment(shipment);
    setCancelReason('Customer address change request');
    setShowCancelModal(true);
  };

  // Submit Create Shipment
  const handleCreateShipment = async (e) => {
    e.preventDefault();
    if (!createForm.orderNumber) {
      alert('Please select an order for shipment generation');
      return;
    }
    setSubmitting(true);
    try {
      const created = await shippingService.createShipment(createForm);
      setShowCreateModal(false);
      setSuccessMessage(`AWB #${created.awb} successfully generated via ${created.courier}!`);
      setTimeout(() => setSuccessMessage(''), 4500);
      loadShipments();
    } catch (err) {
      alert(err.message || 'Failed to create shipment');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Update Tracking
  const handleUpdateTracking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await shippingService.updateTracking({
        identifier: selectedShipment.id || selectedShipment.awb,
        status: updateForm.status,
        location: updateForm.location,
        description: updateForm.description,
      });
      setShowUpdateModal(false);
      setSuccessMessage(`Tracking updated to "${updateForm.status}" for AWB #${selectedShipment.awb}`);
      setTimeout(() => setSuccessMessage(''), 4500);
      loadShipments();
    } catch (err) {
      alert(err.message || 'Failed to update tracking');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Cancel Shipment
  const handleCancelShipment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await shippingService.cancelShipment(selectedShipment.id || selectedShipment.awb, cancelReason);
      setShowCancelModal(false);
      setSuccessMessage(`Shipment #${selectedShipment.id} successfully cancelled.`);
      setTimeout(() => setSuccessMessage(''), 4500);
      loadShipments();
    } catch (err) {
      alert(err.message || 'Failed to cancel shipment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Out for Delivery':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Packed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Confirmed':
      case 'Order Placed':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCourierBadge = (courier) => {
    if (courier === 'Delhivery') {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        name: 'Delhivery',
        tag: 'Surface & Express',
      };
    }
    if (courier === 'GenericCourier') {
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        name: 'Generic Courier',
        tag: 'White-Glove',
      };
    }
    return {
      bg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      name: 'DTDC Express',
      tag: 'Air Cargo',
    };
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
            Logistics & Courier Abstraction Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pluggable multi-carrier logistics hub (DTDC, Delhivery, GenericCourier). Generate AWBs, track milestones, and manage manifests.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadShipments}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all"
          >
            <Plus size={15} />
            <span>Create Shipment / Generate AWB</span>
          </button>
        </div>
      </div>

      {/* Courier Providers Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {couriers.map((c) => (
          <div
            key={c.id}
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Truck size={17} className="text-slate-700" />
                  <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                </div>
                <span className="inline-block mt-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {c.badge}
                </span>
              </div>

              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  c.isConfigured
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {c.isConfigured ? 'Live Credentials' : 'Mock Mode Active'}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2.5 line-clamp-2">{c.description}</p>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search AWB, Order #, City..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Courier Filter */}
            <select
              value={courierFilter}
              onChange={(e) => {
                setCourierFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Logistics Partners</option>
              <option value="DTDC">DTDC Express</option>
              <option value="Delhivery">Delhivery</option>
              <option value="GenericCourier">Generic Courier</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Tracking Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Packed">Packed</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw size={24} className="animate-spin mx-auto text-slate-400" />
            <p className="text-xs">Loading logistics dispatches...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 space-y-2">
            <AlertCircle size={24} className="mx-auto" />
            <p className="text-xs">{error}</p>
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Package size={32} className="mx-auto text-slate-400" />
            <p className="text-sm font-medium">No shipments found</p>
            <p className="text-xs text-slate-400">
              Create a new shipment above or try adjusting your filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Shipment Ref</th>
                  <th className="px-4 py-3">Order Ref</th>
                  <th className="px-4 py-3">Courier Partner</th>
                  <th className="px-4 py-3">AWB / Waybill</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Est. Delivery</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {shipments.map((s) => {
                  const courierMeta = getCourierBadge(s.courier);
                  const isCancelled = s.status === 'Cancelled';
                  const isDelivered = s.status === 'Delivered';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-slate-500 font-medium">
                        {s.id}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono font-semibold text-slate-900">
                          #{s.orderId}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded border text-[11px] font-semibold ${courierMeta.bg}`}
                        >
                          <Truck size={12} />
                          <span>{courierMeta.name}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono">
                        <div className="flex items-center space-x-1.5">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-medium">
                            {s.awb}
                          </span>
                          <button
                            onClick={() => handleCopyAwb(s.awb)}
                            title="Copy AWB Number"
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <Copy size={13} />
                          </button>
                          {copiedAwb === s.awb && (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              Copied!
                            </span>
                          )}
                          {s.trackingUrl && (
                            <a
                              href={s.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Track with Courier directly"
                              className="text-slate-400 hover:text-blue-600"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="flex items-center space-x-1">
                          <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[140px]">{s.destination}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${getStatusBadge(
                            s.status
                          )}`}
                        >
                          {s.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500">
                        {s.estimatedDelivery
                          ? new Date(s.estimatedDelivery).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : '—'}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openHistoryModal(s)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 font-medium text-[11px]"
                        >
                          History ({s.eventCount || 0})
                        </button>

                        {!isCancelled && !isDelivered && (
                          <button
                            onClick={() => openUpdateModal(s)}
                            className="px-2 py-1 text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-medium text-[11px]"
                          >
                            Update
                          </button>
                        )}

                        {!isCancelled && !isDelivered && (
                          <button
                            onClick={() => openCancelModal(s)}
                            className="px-2 py-1 text-red-600 hover:text-red-800 rounded font-medium text-[11px]"
                          >
                            Cancel
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
              Showing Page {page} of {pagination.totalPages} ({pagination.total} total shipments)
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

      {/* MODAL 1: Create Shipment / Select Courier / Generate AWB */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Dispatch Shipment & Generate AWB
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select courier provider to assign waybill and dispatch order.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="p-5 space-y-4 text-xs">
              {/* Select Order */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Order to Dispatch *
                </label>
                {pendingOrders.length > 0 ? (
                  <select
                    value={createForm.orderNumber}
                    onChange={(e) => setCreateForm({ ...createForm, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                    required
                  >
                    {pendingOrders.map((o) => (
                      <option key={o.orderNumber} value={o.orderNumber}>
                        #{o.orderNumber} — {o.customerName} ({o.city}, ₹{o.grandTotal?.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. UC-981290"
                    value={createForm.orderNumber}
                    onChange={(e) => setCreateForm({ ...createForm, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                )}
              </div>

              {/* Courier Provider Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Select Courier Provider *
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'DTDC', name: 'DTDC Express', sub: 'Air Cargo' },
                    { id: 'Delhivery', name: 'Delhivery', sub: 'Surface & Express' },
                    { id: 'GenericCourier', name: 'Generic Courier', sub: 'White-Glove' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, courier: c.id })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        createForm.courier === c.id
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Truck
                        size={15}
                        className={createForm.courier === c.id ? 'text-white' : 'text-slate-500'}
                      />
                      <div className="font-bold text-xs mt-1.5">{c.name}</div>
                      <div
                        className={`text-[10px] ${
                          createForm.courier === c.id ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {c.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Package Weight & Hub */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Package Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={createForm.weightKg}
                    onChange={(e) => setCreateForm({ ...createForm, weightKg: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Origin Hub</label>
                  <input
                    type="text"
                    value={createForm.originHub}
                    onChange={(e) => setCreateForm({ ...createForm, originHub: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Generating Waybill...' : 'Generate AWB & Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Update Tracking */}
      {showUpdateModal && selectedShipment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Update Tracking Milestone</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shipment: <strong className="font-mono text-slate-700">{selectedShipment.id}</strong> (AWB: {selectedShipment.awb})
                </p>
              </div>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateTracking} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">New Status *</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => {
                    const st = e.target.value;
                    setUpdateForm({
                      ...updateForm,
                      status: st,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                >
                  <option value="Packed">Packed (Ready at Atelier)</option>
                  <option value="Shipped">Shipped (Handed Over to Courier)</option>
                  <option value="Out for Delivery">Out for Delivery (On Route to Doorstep)</option>
                  <option value="Delivered">Delivered (Handed Over & Verified)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Current Location</label>
                <input
                  type="text"
                  placeholder="e.g. DTDC Gateway Hub, Mumbai"
                  value={updateForm.location}
                  onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Milestone Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Package arrived at distribution hub and scanned for delivery."
                  value={updateForm.description}
                  onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Tracking History Drawer / Modal */}
      {showHistoryModal && selectedShipment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Consignment Journey
                </span>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2 mt-0.5">
                  <span>Shipment {selectedShipment.id}</span>
                  <span className="text-slate-400 font-normal">|</span>
                  <span className="font-mono text-slate-600">AWB: {selectedShipment.awb}</span>
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Consignment Overview Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    Partner
                  </span>
                  <strong className="text-slate-800">{selectedShipment.carrierName || selectedShipment.courier}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    Status
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 mt-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(
                      selectedShipment.status
                    )}`}
                  >
                    {selectedShipment.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    Est. Delivery
                  </span>
                  <strong className="text-slate-800">
                    {selectedShipment.estimatedDelivery
                      ? new Date(selectedShipment.estimatedDelivery).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    Destination
                  </span>
                  <strong className="text-slate-800 truncate block">
                    {selectedShipment.destination}
                  </strong>
                </div>
              </div>

              {/* Event Chain */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
                  Full Milestone Audit Trail
                </h4>

                {historyLoading ? (
                  <div className="p-8 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto text-slate-400" />
                    <p className="text-xs mt-2">Loading event audit log...</p>
                  </div>
                ) : trackingHistory?.trackingEvents?.length > 0 ? (
                  <div className="relative border-l-2 border-slate-300 ml-3 space-y-6 pl-5">
                    {trackingHistory.trackingEvents.map((ev, idx) => (
                      <div key={idx} className="relative">
                        {/* Dot icon */}
                        <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-900 ring-4 ring-white" />
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <span className="font-bold text-xs text-slate-900">{ev.status}</span>
                          <span className="text-[11px] text-slate-400">
                            {ev.date} at {ev.time}
                          </span>
                        </div>
                        {ev.location && (
                          <div className="flex items-center space-x-1 text-slate-500 text-[11px] mt-0.5">
                            <MapPin size={11} className="text-slate-400" />
                            <span>{ev.location}</span>
                          </div>
                        )}
                        <p className="text-xs text-slate-600 mt-1">{ev.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No tracking events recorded yet.</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {selectedShipment.trackingUrl ? (
                <a
                  href={selectedShipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-700 hover:text-blue-600"
                >
                  <ExternalLink size={13} />
                  <span>Open Courier Tracking Portal</span>
                </a>
              ) : (
                <span />
              )}
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

      {/* MODAL 4: Cancel Shipment */}
      {showCancelModal && selectedShipment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-red-600 text-base flex items-center space-x-2">
                <AlertCircle size={18} />
                <span>Cancel Shipment</span>
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCancelShipment} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Are you sure you want to cancel consignment{' '}
                <strong className="font-mono text-slate-900">{selectedShipment.id}</strong> (AWB:{' '}
                {selectedShipment.awb})?
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Cancellation Reason
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Keep Shipment
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
