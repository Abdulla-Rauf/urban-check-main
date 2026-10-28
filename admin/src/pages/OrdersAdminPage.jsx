import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Eye, Edit3, Filter, RefreshCw, Truck } from 'lucide-react';

export const OrdersAdminPage = () => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [courierFilter, setCourierFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // Status Update Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState('');
  const [modalPayment, setModalPayment] = useState('');
  const [modalCarrier, setModalCarrier] = useState('');
  const [modalTracking, setModalTracking] = useState('');
  const [modalNote, setModalNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (paymentFilter !== 'all') params.append('paymentStatus', paymentFilter);
      if (courierFilter !== 'all') params.append('courier', courierFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (search.trim()) params.append('search', search.trim());

      const res = await adminApi.get(`/admin/orders?${params.toString()}`);
      const payload = res.data || res;
      setOrders(payload.items || []);
      setTotal(payload.total || 0);
      setPages(payload.pages || 1);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, paymentFilter, courierFilter, startDate, endDate]);

  const handleSearchSubmit = (val) => {
    setSearch(val);
    setPage(1);
  };

  const openUpdateModal = (order) => {
    setSelectedOrder(order);
    setModalStatus(order.status);
    setModalPayment(order.paymentStatus);
    setModalCarrier(order.courier || 'DTDC Express');
    setModalTracking(order.trackingNumber || '');
    setModalNote('');
    setIsModalOpen(true);
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      await adminApi.patch(`/admin/orders/${selectedOrder.id}/status`, {
        orderStatus: modalStatus,
        paymentStatus: modalPayment,
        carrier: modalCarrier,
        trackingNumber: modalTracking,
        note: modalNote,
      });

      setIsModalOpen(false);
      fetchOrders();
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      header: 'Order ID',
      accessor: 'id',
      render: (row) => (
        <Link
          to={`/orders/${row.id}`}
          className="font-mono font-medium text-admin-accent hover:underline text-xs"
        >
          {row.id}
        </Link>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.customer}</span>
          <span className="text-[11px] text-slate-400">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'formattedDate',
      render: (row) => (
        <span className="text-slate-500 font-mono text-[11px]">{row.formattedDate}</span>
      ),
    },
    {
      header: 'Amount',
      accessor: 'formattedAmount',
      className: 'font-semibold text-slate-900 font-mono text-xs',
    },
    {
      header: 'Payment',
      accessor: 'paymentStatus',
      render: (row) => (
        <span
          className={`admin-badge ${
            row.paymentStatus === 'Paid'
              ? 'admin-badge-success'
              : row.paymentStatus === 'Refunded'
              ? 'admin-badge-danger'
              : 'admin-badge-warning'
          }`}
        >
          {row.paymentMethod} • {row.paymentStatus}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const badgeMap = {
          Pending: 'admin-badge-warning',
          Confirmed: 'admin-badge-info',
          Processing: 'admin-badge-warning',
          Packed: 'admin-badge-info',
          Shipped: 'admin-badge-info',
          OutForDelivery: 'admin-badge-info',
          Delivered: 'admin-badge-success',
          Cancelled: 'admin-badge-danger',
          Returned: 'admin-badge-danger',
        };
        return (
          <span className={`admin-badge ${badgeMap[row.status] || 'admin-badge-info'}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      header: 'Courier',
      accessor: 'courier',
      render: (row) => <span className="font-medium text-slate-700">{row.courier}</span>,
    },
    {
      header: 'Tracking',
      accessor: 'trackingNumber',
      render: (row) => (
        <span className="font-mono text-slate-500 text-[11px]">
          {row.trackingNumber || 'Pending'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openUpdateModal(row)}
            className="p-1 rounded text-slate-500 hover:text-admin-accent hover:bg-slate-100 transition-colors"
            title="Update Fulfillment"
          >
            <Edit3 size={14} />
          </button>
          <Link
            to={`/orders/${row.id}`}
            className="p-1 rounded text-slate-500 hover:text-admin-accent hover:bg-slate-100 transition-colors"
            title="Inspect Details"
          >
            <Eye size={14} />
          </Link>
        </div>
      ),
    },
  ];

  const filterControls = (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setPage(1);
        }}
        className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-admin-accent"
      >
        <option value="all">Status: All</option>
        <option value="Pending">Pending</option>
        <option value="Confirmed">Confirmed</option>
        <option value="Processing">Processing</option>
        <option value="Packed">Packed</option>
        <option value="Shipped">Shipped</option>
        <option value="OutForDelivery">Out For Delivery</option>
        <option value="Delivered">Delivered</option>
        <option value="Cancelled">Cancelled</option>
        <option value="Returned">Returned</option>
      </select>

      {/* Payment Filter */}
      <select
        value={paymentFilter}
        onChange={(e) => {
          setPaymentFilter(e.target.value);
          setPage(1);
        }}
        className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-admin-accent"
      >
        <option value="all">Payment: All</option>
        <option value="Pending">Payment: Pending</option>
        <option value="Paid">Payment: Paid</option>
        <option value="Refunded">Payment: Refunded</option>
        <option value="Failed">Payment: Failed</option>
      </select>

      {/* Courier Filter */}
      <select
        value={courierFilter}
        onChange={(e) => {
          setCourierFilter(e.target.value);
          setPage(1);
        }}
        className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-admin-accent"
      >
        <option value="all">Courier: All</option>
        <option value="DTDC Express">DTDC Express</option>
        <option value="BlueDart Air">BlueDart Air</option>
        <option value="Delhivery Surface">Delhivery Surface</option>
      </select>

      {/* Date Filters */}
      <input
        type="date"
        value={startDate}
        onChange={(e) => {
          setStartDate(e.target.value);
          setPage(1);
        }}
        className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none"
        title="Start Date"
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => {
          setEndDate(e.target.value);
          setPage(1);
        }}
        className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none"
        title="End Date"
      />

      {(statusFilter !== 'all' ||
        paymentFilter !== 'all' ||
        courierFilter !== 'all' ||
        startDate ||
        endDate ||
        search) && (
        <button
          onClick={() => {
            setStatusFilter('all');
            setPaymentFilter('all');
            setCourierFilter('all');
            setStartDate('');
            setEndDate('');
            setSearch('');
            setPage(1);
          }}
          className="text-xs text-slate-500 hover:text-slate-800 underline font-medium px-1"
        >
          Reset
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Order Fulfillment & Logistics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage patron orders, dispatch assignments, and track courier manifests in real-time.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md transition-colors shadow-xs self-start"
          title="Refresh Orders"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Orders Table */}
      <DataTable
        title="Consignment Ledger"
        description="Verified customer orders synced directly with MongoDB Atlas."
        columns={columns}
        data={orders}
        loading={loading}
        filters={filterControls}
        searchValue={search}
        onSearchChange={handleSearchSubmit}
        searchPlaceholder="Search order #, customer, phone..."
        pagination={{
          currentPage: page,
          totalPages: pages,
          totalItems: total,
          pageSize: limit,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      {/* Quick Status Update Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Update Order #${selectedOrder?.id}`}
        subtitle="Modify shipment status, assign courier details, or update payment record."
      >
        <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Fulfillment Status
            </label>
            <select
              value={modalStatus}
              onChange={(e) => setModalStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 focus:outline-none focus:border-admin-accent"
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Packed">Packed</option>
              <option value="Shipped">Shipped</option>
              <option value="OutForDelivery">Out For Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled (Restores Inventory)</option>
              <option value="Returned">Returned (Restores Inventory)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Payment Status
            </label>
            <select
              value={modalPayment}
              onChange={(e) => setModalPayment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 focus:outline-none focus:border-admin-accent"
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Refunded">Refunded</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Courier Carrier</label>
              <input
                type="text"
                value={modalCarrier}
                onChange={(e) => setModalCarrier(e.target.value)}
                placeholder="e.g. DTDC Express"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 focus:outline-none focus:border-admin-accent"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">AWB Tracking #</label>
              <input
                type="text"
                value={modalTracking}
                onChange={(e) => setModalTracking(e.target.value)}
                placeholder="e.g. AWB-9821034"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 focus:outline-none focus:border-admin-accent font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Internal Audit Memo</label>
            <textarea
              rows={2}
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="e.g. Package dispatched via air courier hub #4"
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 focus:outline-none focus:border-admin-accent"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2 bg-admin-accent hover:bg-admin-accent-hover text-white rounded font-medium disabled:opacity-50"
            >
              {updating ? 'Saving Changes...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
