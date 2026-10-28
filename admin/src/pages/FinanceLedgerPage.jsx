import React from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import { ArrowLeft } from 'lucide-react';

const mockFinancialLedger = [
  { entryId: 'FIN-001', account: 'Accounts Receivable (Razorpay)', debit: 14480, credit: 0, balance: 1482500, ref: 'TXN-9021', date: '2026-09-23' },
  { entryId: 'FIN-002', account: 'Courier Clearing (DTDC)', debit: 0, credit: 220, balance: 1482280, ref: 'SHP-901', date: '2026-09-23' },
  { entryId: 'FIN-003', account: 'Sales Returns Reserve', debit: 0, credit: 5490, balance: 1476790, ref: 'REF-801', date: '2026-09-22' },
];

export const FinanceLedgerPage = () => {
  const columns = [
    { header: 'Entry Ref', accessor: 'entryId', render: (row) => <span className="font-mono text-slate-500">{row.entryId}</span> },
    { header: 'General Ledger Account', accessor: 'account', className: 'font-semibold text-slate-800' },
    {
      header: 'Debit (₹)',
      accessor: 'debit',
      render: (row) => (
        <span className="font-mono text-emerald-600 font-medium">
          {row.debit > 0 ? `+₹${row.debit.toLocaleString('en-IN')}` : '-'}
        </span>
      ),
    },
    {
      header: 'Credit (₹)',
      accessor: 'credit',
      render: (row) => (
        <span className="font-mono text-rose-600 font-medium">
          {row.credit > 0 ? `-₹${row.credit.toLocaleString('en-IN')}` : '-'}
        </span>
      ),
    },
    {
      header: 'Cumulative Balance',
      accessor: 'balance',
      render: (row) => <span className="font-mono font-bold text-slate-900">₹{row.balance.toLocaleString('en-IN')}</span>,
    },
    { header: 'Doc Reference', accessor: 'ref', className: 'font-mono text-slate-500' },
    { header: 'Date', accessor: 'date', className: 'text-slate-400' },
  ];

  return (
    <div className="space-y-6">
      <Link
        to="/finance"
        className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={14} className="mr-1" />
        <span>Back to Finance</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          General Financial Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Double-entry bookkeeping journal matching order receipts against courier payouts.
        </p>
      </div>

      <DataTable
        title="Double-Entry Journal"
        columns={columns}
        data={mockFinancialLedger}
      />
    </div>
  );
};
