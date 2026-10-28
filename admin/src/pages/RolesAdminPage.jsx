import React from 'react';
import { DataTable } from '../components/DataTable';
import { ShieldCheck, Plus } from 'lucide-react';

const mockRoles = [
  { id: 'ROL-1', name: 'Super Admin', description: 'Unrestricted master access to all platform systems, finances, and user permissions', usersCount: 1, permissions: ['*'] },
  { id: 'ROL-2', name: 'Product Manager', description: 'Catalog, category, brand, and stock management', usersCount: 2, permissions: ['products:write', 'categories:write', 'inventory:read'] },
  { id: 'ROL-3', name: 'Order Manager', description: 'Order fulfillment, returns, refunds, customer support', usersCount: 3, permissions: ['orders:write', 'shipments:write', 'returns:write'] },
  { id: 'ROL-4', name: 'Inventory Manager', description: 'Stock ledger, warehouse inwards, threshold alerts', usersCount: 1, permissions: ['inventory:write', 'ledger:read'] },
  { id: 'ROL-5', name: 'Finance Manager', description: 'Transactions, revenue reports, financial reconciliation', usersCount: 1, permissions: ['finance:read', 'finance:export'] },
  { id: 'ROL-6', name: 'Content Manager', description: 'Homepage banners, promotional campaigns, editorial offers', usersCount: 1, permissions: ['marketing:write', 'banners:write'] },
];

export const RolesAdminPage = () => {
  const columns = [
    { header: 'Role ID', accessor: 'id', render: (row) => <span className="font-mono text-slate-500">{row.id}</span> },
    {
      header: 'Role Title',
      accessor: 'name',
      render: (row) => (
        <span className="font-semibold text-slate-900 flex items-center space-x-1.5">
          <ShieldCheck size={14} className="text-admin-accent" />
          <span>{row.name}</span>
        </span>
      ),
    },
    { header: 'Access Scope Description', accessor: 'description', className: 'text-slate-600 max-w-sm' },
    { header: 'Assigned Personnel', accessor: 'usersCount', render: (row) => `${row.usersCount} operators` },
    {
      header: 'Permission Matrix',
      accessor: 'permissions',
      render: (row) => (
        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
          {row.permissions.join(', ')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Roles & RBAC Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure fine-grained role capabilities across catalog, fulfillment, marketing, and ledger.
          </p>
        </div>
        <button
          onClick={() => alert('New RBAC Role Definition')}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-admin-accent hover:bg-admin-accent-hover text-white rounded-md text-xs font-medium shadow-sm transition-colors"
        >
          <Plus size={15} />
          <span>New Role</span>
        </button>
      </div>

      <DataTable
        title="Role Capability Definitions"
        columns={columns}
        data={mockRoles}
      />
    </div>
  );
};
