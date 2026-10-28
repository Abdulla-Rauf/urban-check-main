import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Plus, Edit2, Trash2, Power, Eye, RefreshCw, AlertTriangle } from 'lucide-react';

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(12);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Archive modal state
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [productToArchive, setProductToArchive] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (genderFilter !== 'all') params.append('gender', genderFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await adminApi.get(`/admin/products?${params.toString()}`);
      const payload = res.data || res;
      setProducts(payload.items || []);
      setTotal(payload.total || 0);
      setPages(payload.pages || 1);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, statusFilter, genderFilter]);

  const handleToggleStatus = async (product) => {
    try {
      const newStatus = product.status === 'active' ? 'draft' : 'active';
      await adminApi.patch(`/admin/products/${product.id}/status`, { status: newStatus });
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Failed to toggle product status');
    }
  };

  const handleConfirmArchive = async () => {
    if (!productToArchive) return;
    try {
      setActionLoading(true);
      await adminApi.delete(`/admin/products/${productToArchive.id}`);
      setArchiveModalOpen(false);
      setProductToArchive(null);
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Failed to archive product');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Garment',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-12 rounded bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
            {row.thumbnail ? (
              <img src={row.thumbnail} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                No Img
              </div>
            )}
          </div>
          <div>
            <Link
              to={`/products/${row.id}/edit`}
              className="font-medium text-slate-900 hover:text-admin-accent hover:underline block"
            >
              {row.name}
            </Link>
            <span className="text-[10px] text-slate-400 font-mono">
              {row.brand} • {row.category}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Gender',
      accessor: 'gender',
      render: (row) => <span className="font-medium text-slate-600">{row.gender}</span>,
    },
    {
      header: 'Price',
      accessor: 'formattedPrice',
      className: 'font-semibold text-slate-900 font-mono',
    },
    {
      header: 'Variants',
      accessor: 'variantsCount',
      render: (row) => (
        <span className="font-mono text-slate-600">{row.variantsCount} options</span>
      ),
    },
    {
      header: 'Total Stock',
      accessor: 'totalStock',
      render: (row) => (
        <div className="flex items-center space-x-1.5">
          <span
            className={`font-mono font-bold ${
              row.totalStock === 0
                ? 'text-rose-600'
                : row.isLowStock
                ? 'text-amber-600'
                : 'text-slate-900'
            }`}
          >
            {row.totalStock} units
          </span>
          {row.isLowStock && (
            <span title="Low stock variants exist">
              <AlertTriangle size={13} className="text-amber-500" />
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span
          className={`admin-badge ${
            row.status === 'active'
              ? 'admin-badge-success'
              : row.status === 'draft'
              ? 'admin-badge-warning'
              : 'admin-badge-danger'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Link
            to={`/products/${row.id}/edit`}
            className="p-1 rounded text-slate-500 hover:text-admin-accent hover:bg-slate-100 transition-colors"
            title="Edit Garment"
          >
            <Edit2 size={14} />
          </Link>

          <button
            onClick={() => handleToggleStatus(row)}
            className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition-colors"
            title={row.status === 'active' ? 'Set to Draft' : 'Activate'}
          >
            <Power size={14} />
          </button>

          <button
            onClick={() => {
              setProductToArchive(row);
              setArchiveModalOpen(true);
            }}
            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
            title="Archive / Deactivate"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const filterControls = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setPage(1);
        }}
        className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-admin-accent"
      >
        <option value="all">Status: All</option>
        <option value="active">Active</option>
        <option value="draft">Draft</option>
      </select>

      <select
        value={genderFilter}
        onChange={(e) => {
          setGenderFilter(e.target.value);
          setPage(1);
        }}
        className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-admin-accent"
      >
        <option value="all">Gender: All</option>
        <option value="Men">Men</option>
        <option value="Women">Women</option>
        <option value="Unisex">Unisex</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Catalog & Garment Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, curate, and adjust master apparel items in the Urban Check atelier collection.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchProducts}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md transition-colors shadow-xs"
            title="Refresh Catalog"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <Link
            to="/products/new"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-admin-accent hover:bg-admin-accent-hover text-white rounded-md text-xs font-medium shadow-xs transition-colors"
          >
            <Plus size={15} />
            <span>Create New Product</span>
          </Link>
        </div>
      </div>

      {/* Products Table */}
      <DataTable
        title="Master Product Catalog"
        description="Active and drafted pieces currently managed in the MongoDB database."
        columns={columns}
        data={products}
        loading={loading}
        filters={filterControls}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search title, tag, or SKU..."
        pagination={{
          currentPage: page,
          totalPages: pages,
          totalItems: total,
          pageSize: limit,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      {/* Archive / Deactivate Confirmation Modal */}
      <Modal
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        title="Archive Garment"
        subtitle={`Are you sure you want to deactivate "${productToArchive?.name}"?`}
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Archiving this piece will hide it from the customer storefront catalog immediately while
            preserving past order history and invoice snapshots intact.
          </p>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setArchiveModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmArchive}
              disabled={actionLoading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium disabled:opacity-50"
            >
              {actionLoading ? 'Archiving...' : 'Yes, Archive Garment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
