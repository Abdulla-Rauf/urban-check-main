import React from 'react';
import { DataTable } from '../components/DataTable';
import { UserPlus } from 'lucide-react';

const mockStaff = [
  { id: 'ADM-1', name: 'Elena Rostova', email: 'elena@urbancheck.com', role: 'Super Admin', status: 'Active', lastLogin: 'Today, 08:30 AM' },
  { id: 'ADM-2', name: 'Kabir Singhania', email: 'kabir@urbancheck.com', role: 'Product Manager', status: 'Active', lastLogin: 'Yesterday, 03:15 PM' },
  { id: 'ADM-3', name: 'Aarav Desai', email: 'aarav@urbancheck.com', role: 'Order Manager', status: 'Active', lastLogin: 'Today, 09:00 AM' },
  { id: 'ADM-4', name: 'Simran Walia', email: 'simran@urbancheck.com', role: 'Finance Manager', status: 'Active', lastLogin: '2026-09-21' },
];

export const AdminUsersPage = () => {
  const columns = [
    { header: 'Staff ID', accessor: 'id', render: (row) => <span className="font-mono text-slate-500">{row.id}</span> },
    { header: 'Full Name', accessor: 'name', className: 'font-semibold text-slate-900' },
    { header: 'Work Email', accessor: 'email', className: 'text-slate-500' },
    {
      header: 'Assigned Role',
      accessor: 'role',
      render: (row) => (
        <span className="font-medium text-admin-accent bg-admin-accent-light px-2 py-0.5 rounded text-[11px]">
          {row.role}
        </span>
      ),
    },
    {
      header: 'Account Status',
      accessor: 'status',
      render: (row) => <span className="admin-badge admin-badge-success">{row.status}</span>,
    },
    { header: 'Last Active Session', accessor: 'lastLogin', className: 'text-slate-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Administrative Staff Users
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authenticated operators, operational staff, and security access.
          </p>
        </div>
        <button
          onClick={() => alert('Invite staff operator dialog')}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-admin-accent hover:bg-admin-accent-hover text-white rounded-md text-xs font-medium shadow-sm transition-colors"
        >
          <UserPlus size={15} />
          <span>Invite Staff Member</span>
        </button>
      </div>

      <DataTable
        title="Active Internal Personnel"
        columns={columns}
        data={mockStaff}
      />
    </div>
  );
};
