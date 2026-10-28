import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { DataTable } from '../components/DataTable';
import { RefreshCw, UserCheck, ShieldAlert, Mail, Phone } from 'lucide-react';

export const CustomersAdminPage = () => {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await adminApi.get(`/admin/customers?${params.toString()}`);
      const payload = res.data || res;
      setCustomers(payload.items || []);
      setTotal(payload.total || 0);
      setPages(payload.pages || 1);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, statusFilter]);

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs">{row.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            Member since {row.joinedDate}
          </span>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) => (
        <div className="flex items-center space-x-1.5 text-slate-600">
          <Mail size={12} className="text-slate-400 flex-shrink-0" />
          <span className="truncate max-w-[200px]">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (row) => (
        <div className="flex items-center space-x-1.5 text-slate-600 font-mono text-[11px]">
          <Phone size={12} className="text-slate-400 flex-shrink-0" />
          <span>{row.phone}</span>
        </div>
      ),
    },
    {
      header: 'Orders',
      accessor: 'ordersCount',
      render: (row) => (
        <span className="font-mono font-semibold text-slate-800">
          {row.ordersCount} {row.ordersCount === 1 ? 'order' : 'orders'}
        </span>
      ),
    },
    {
      header: 'Total Spent',
      accessor: 'formattedTotalSpent',
      className: 'font-semibold text-slate-900 font-mono text-xs',
    },
    {
      header: 'Last Order',
      accessor: 'lastOrderDate',
      render: (row) => (
        <span className="text-slate-500 font-mono text-[11px]">{row.lastOrderDate}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const badgeMap = {
          Active: 'admin-badge-success',
          Blocked: 'admin-badge-danger',
          Unverified: 'admin-badge-warning',
        };
        return (
          <span className={`admin-badge ${badgeMap[row.status] || 'admin-badge-info'}`}>
            {row.status}
          </span>
        );
      },
    },
  ];

  const filterControls = (
    <div className="flex items-center space-x-2">
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
        <option value="unverified">Unverified</option>
        <option value="inactive">Blocked</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Directory & CRM
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Client patron profiles, lifetime acquisition spend, address books, and account statuses.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md transition-colors shadow-xs self-start"
          title="Refresh Patrons"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Customers Table */}
      <DataTable
        title="Patron Profiles"
        description="Registered customer accounts with aggregated order history and lifetime value."
        columns={columns}
        data={customers}
        loading={loading}
        filters={filterControls}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search name, email, or phone..."
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
