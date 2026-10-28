import React from 'react';
import { DataTable } from '../components/DataTable';

const mockAuditLogs = [
  { id: 'LOG-901', action: 'STATUS_UPDATE', entity: 'Order ORD-9820', actor: 'Aarav Desai (Order Manager)', ip: '103.21.54.12', timestamp: '2026-09-23 09:30:15' },
  { id: 'LOG-900', action: 'STOCK_ADJUSTMENT', entity: 'SKU UC-TRS-002 (+50)', actor: 'System / Inward PO-2026-88', ip: '10.0.4.12', timestamp: '2026-09-22 14:30:00' },
  { id: 'LOG-899', action: 'PRICE_UPDATE', entity: 'Product UC-JKT-001 (₹8990)', actor: 'Kabir Singhania (Product Manager)', ip: '49.36.12.8', timestamp: '2026-09-22 11:15:20' },
  { id: 'LOG-898', action: 'ROLE_ASSIGNED', entity: 'Staff User Simran Walia', actor: 'Elena Rostova (Super Admin)', ip: '103.21.54.12', timestamp: '2026-09-21 16:40:00' },
];

export const AuditLogsPage = () => {
  const columns = [
    { header: 'Event ID', accessor: 'id', render: (row) => <span className="font-mono text-slate-500">{row.id}</span> },
    {
      header: 'Action Taken',
      accessor: 'action',
      render: (row) => <span className="font-mono font-bold text-slate-800 text-[11px]">{row.action}</span>,
    },
    { header: 'Target Entity', accessor: 'entity', className: 'font-medium text-slate-900' },
    { header: 'Staff Actor', accessor: 'actor', className: 'text-slate-700' },
    { header: 'IP Origin', accessor: 'ip', className: 'font-mono text-slate-400 text-[11px]' },
    { header: 'Recorded Time', accessor: 'timestamp', className: 'text-slate-500 font-mono' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Security & Operational Audit Logs
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tamper-evident record of all staff interventions, stock adjustments, pricing changes, and role assignments.
        </p>
      </div>

      <DataTable
        title="Audit Events Trail"
        columns={columns}
        data={mockAuditLogs}
      />
    </div>
  );
};
