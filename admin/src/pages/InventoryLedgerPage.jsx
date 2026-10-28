import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/api';
import { DataTable } from '../components/DataTable';
import { ArrowLeft, RefreshCw, Filter } from 'lucide-react';

export const InventoryLedgerPage = () => {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (transactionFilter !== 'all') params.append('transaction', transactionFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await adminApi.get(`/admin/inventory/ledger?${params.toString()}`);
      const payload = res.data || res;
      setEntries(payload.items || []);
      setTotal(payload.total || 0);
      setPages(payload.pages || 1);
    } catch (err) {
      console.error('Failed to load inventory ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [page, transactionFilter]);

  const columns = [
    {
      header: 'Date & Time',
      accessor: 'createdAt',
      render: (row) => (
        <span className="font-mono text-slate-500 text-[11px]">
          {new Date(row.createdAt).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'SKU Code',
      accessor: 'sku',
      render: (row) => (
        <span className="font-mono font-semibold text-slate-800 text-xs">{row.sku}</span>
      ),
    },
    {
      header: 'Product Garment',
      accessor: 'productName',
      render: (row) => (
        <span className="font-medium text-slate-900 block max-w-xs truncate">
          {row.productName}
        </span>
      ),
    },
    {
      header: 'Transaction Type',
      accessor: 'transaction',
      render: (row) => {
        const badgeMap = {
          'Order Placement': 'admin-badge-warning',
          'Order Cancellation': 'admin-badge-info',
          Restock: 'admin-badge-success',
          Adjustment: 'admin-badge-info',
          'Initial Seed': 'admin-badge-info',
          Return: 'admin-badge-warning',
          Damaged: 'admin-badge-danger',
        };
        return (
          <span className={`admin-badge ${badgeMap[row.transaction] || 'admin-badge-info'}`}>
            {row.transaction}
          </span>
        );
      },
    },
    {
      header: 'Delta Quantity',
      accessor: 'quantity',
      render: (row) => (
        <span
          className={`font-mono font-bold text-xs ${
            row.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
        </span>
      ),
    },
    {
      header: 'Previous Stock',
      accessor: 'previousStock',
      className: 'font-mono text-slate-500',
    },
    {
      header: 'New Stock',
      accessor: 'newStock',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900">{row.newStock} units</span>
      ),
    },
    {
      header: 'Reference',
      accessor: 'reference',
      render: (row) => (
        <span className="font-mono text-slate-600 text-[11px]">{row.reference || '—'}</span>
      ),
    },
    {
      header: 'Actor / Admin',
      accessor: 'admin',
      render: (row) => <span className="text-slate-600 font-medium">{row.admin}</span>,
    },
  ];

  const filterControls = (
    <div className="flex items-center space-x-2">
      <select
        value={transactionFilter}
        onChange={(e) => {
          setTransactionFilter(e.target.value);
          setPage(1);
        }}
        className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-admin-accent"
      >
        <option value="all">Transaction: All</option>
        <option value="Order Placement">Order Placement</option>
        <option value="Order Cancellation">Order Cancellation</option>
        <option value="Adjustment">Adjustment</option>
        <option value="Restock">Restock</option>
        <option value="Initial Seed">Initial Seed</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/inventory"
        className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={14} className="mr-1" />
        <span>Return to Inventory Positions</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Stock Movement Audit Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable transaction records detailing every stock inward, order reservation, and manual delta.
          </p>
        </div>

        <button
          onClick={fetchLedger}
          className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md transition-colors shadow-xs self-start"
          title="Refresh Ledger"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Ledger Table */}
      <DataTable
        title="Stock Movement Ledger"
        description="Chronological audit records synced from MongoDB InventoryLedger collection."
        columns={columns}
        data={entries}
        loading={loading}
        filters={filterControls}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search SKU, product, or reference..."
        pagination={{
          currentPage: page,
          totalPages: pages,
          totalItems: total,
          pageSize: limit,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />
    </div>
  );
};
