import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import {
  Package,
  AlertTriangle,
  XCircle,
  Clock,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState('add'); // 'add', 'subtract', 'set'
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Physical count replenishment');
  const [adjustReference, setAdjustReference] = useState('PO-2026-INWARD');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (filter !== 'all') params.append('filter', filter);
      if (search.trim()) params.append('search', search.trim());

      const res = await adminApi.get(`/admin/inventory?${params.toString()}`);
      const payload = res.data || res;
      setItems(payload.items || []);
      setTotal(payload.total || 0);
      setPages(payload.pages || 1);
      if (payload.summary) {
        setSummary(payload.summary);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, filter]);

  const openAdjustModal = (variant) => {
    setSelectedVariant(variant);
    setAdjustType('add');
    setAdjustQty('10');
    setAdjustReason('Purchase inward consignment');
    setAdjustReference(`PO-${Date.now().toString().slice(-4)}`);
    setIsModalOpen(true);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedVariant) return;

    try {
      setSubmittingAdjust(true);
      await adminApi.post('/admin/inventory/adjust', {
        sku: selectedVariant.sku,
        adjustmentType: adjustType,
        quantity: parseInt(adjustQty, 10),
        reason: adjustReason,
        reference: adjustReference,
      });

      setIsModalOpen(false);
      fetchInventory();
    } catch (err) {
      alert(err.message || 'Failed to adjust inventory');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const columns = [
    {
      header: 'SKU Variant',
      accessor: 'sku',
      render: (row) => (
        <div>
          <span className="font-mono font-semibold text-slate-800 block">{row.sku}</span>
          <span className="text-[10px] text-slate-400">{row.brand}</span>
        </div>
      ),
    },
    {
      header: 'Garment Piece',
      accessor: 'productName',
      render: (row) => (
        <span className="font-medium text-slate-900 block max-w-xs truncate">
          {row.productName}
        </span>
      ),
    },
    {
      header: 'Size & Color',
      accessor: 'size',
      render: (row) => (
        <div className="flex items-center space-x-1.5">
          <span className="font-mono font-semibold px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
            {row.size}
          </span>
          <span className="text-slate-600">{row.color}</span>
        </div>
      ),
    },
    {
      header: 'Available Stock',
      accessor: 'inStock',
      render: (row) => (
        <span
          className={`font-mono font-bold text-xs ${
            row.inStock === 0
              ? 'text-rose-600'
              : row.inStock <= row.threshold
              ? 'text-amber-600'
              : 'text-slate-900'
          }`}
        >
          {row.inStock} units
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const badgeMap = {
          'In Stock': 'admin-badge-success',
          'Low Stock': 'admin-badge-warning',
          'Out of Stock': 'admin-badge-danger',
        };
        return (
          <span className={`admin-badge ${badgeMap[row.status] || 'admin-badge-info'}`}>
            {row.status === 'Low Stock' && <AlertTriangle size={11} className="mr-1 inline" />}
            {row.status === 'Out of Stock' && <XCircle size={11} className="mr-1 inline" />}
            {row.status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => openAdjustModal(row)}
          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded font-medium text-xs transition-colors"
        >
          <SlidersHorizontal size={12} />
          <span>Adjust</span>
        </button>
      ),
    },
  ];

  const filterControls = (
    <div className="flex items-center space-x-2">
      <select
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setPage(1);
        }}
        className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-admin-accent"
      >
        <option value="all">Stock Filter: All</option>
        <option value="low_stock">Low Stock (≤5)</option>
        <option value="out_of_stock">Out of Stock (0)</option>
        <option value="in_stock">In Stock (&gt;5)</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time physical stock positions, threshold alerts, and warehouse movements.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInventory}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md transition-colors shadow-xs"
            title="Refresh Inventory"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <Link
            to="/inventory/ledger"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium shadow-xs transition-colors"
          >
            <BookOpen size={14} />
            <span>Audit Movement Ledger</span>
          </Link>
        </div>
      </div>

      {/* 6 Inventory Dashboard KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Total Stock"
          value={summary ? summary.totalStock : '...'}
          timeframe="All Units in Atelier"
          icon={Package}
          isPositive={true}
          change="Available"
        />
        <MetricCard
          title="Low Stock"
          value={summary ? summary.lowStock : '...'}
          timeframe="Threshold (≤5)"
          icon={AlertTriangle}
          isAlert={summary?.lowStock > 0}
          change={summary?.lowStock > 0 ? 'Urgent' : 'Clear'}
        />
        <MetricCard
          title="Out of Stock"
          value={summary ? summary.outOfStock : '...'}
          timeframe="Depleted SKUs"
          icon={XCircle}
          isAlert={summary?.outOfStock > 0}
          change={summary?.outOfStock > 0 ? 'Depleted' : 'Zero'}
        />
        <MetricCard
          title="Reserved"
          value={summary ? summary.reserved : '...'}
          timeframe="In Pending Orders"
          icon={Clock}
          isPositive={true}
          change="Allocated"
        />
        <MetricCard
          title="Sold"
          value={summary ? summary.sold : '...'}
          timeframe="Dispatched & Handed"
          icon={CheckCircle2}
          isPositive={true}
          change="Fulfilled"
        />
        <MetricCard
          title="Returned"
          value={summary ? summary.returned : '...'}
          timeframe="Returned Pieces"
          icon={RotateCcw}
          isPositive={true}
          change="Inspected"
        />
      </div>

      {/* SKU Inventory Table */}
      <DataTable
        title="Physical SKU Allocations"
        description="Granular stock inventory tracked by size, color and warehouse SKU."
        columns={columns}
        data={items}
        loading={loading}
        filters={filterControls}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search SKU, piece, or color..."
        pagination={{
          currentPage: page,
          totalPages: pages,
          totalItems: total,
          pageSize: limit,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      {/* Manual Stock Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Adjust Stock for ${selectedVariant?.sku}`}
        subtitle={`Product: ${selectedVariant?.productName} (${selectedVariant?.size} / ${selectedVariant?.color})`}
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200 flex justify-between items-center font-mono">
            <span className="text-slate-500">Current Stock Level:</span>
            <span className="font-bold text-slate-900 text-sm">
              {selectedVariant?.inStock} units
            </span>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Adjustment Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'add', label: 'Add Stock (+)' },
                { type: 'subtract', label: 'Deduct Stock (-)' },
                { type: 'set', label: 'Set Absolute (=)' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setAdjustType(opt.type)}
                  className={`py-2 px-3 rounded border text-center font-medium transition-colors ${
                    adjustType === opt.type
                      ? 'bg-admin-accent text-white border-admin-accent'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              {adjustType === 'set' ? 'New Target Stock Level' : 'Quantity Delta'}
            </label>
            <input
              type="number"
              required
              min={1}
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              placeholder="e.g. 10"
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 focus:outline-none focus:border-admin-accent font-mono"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Adjustment Reason</label>
            <input
              type="text"
              required
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Factory delivery consignment PO-2026-09"
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 focus:outline-none focus:border-admin-accent"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Document Reference</label>
            <input
              type="text"
              value={adjustReference}
              onChange={(e) => setAdjustReference(e.target.value)}
              placeholder="e.g. PO-88219"
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 focus:outline-none focus:border-admin-accent font-mono"
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
              disabled={submittingAdjust}
              className="px-4 py-2 bg-admin-accent hover:bg-admin-accent-hover text-white rounded font-medium disabled:opacity-50"
            >
              {submittingAdjust ? 'Updating Ledger...' : 'Commit Stock Delta'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
