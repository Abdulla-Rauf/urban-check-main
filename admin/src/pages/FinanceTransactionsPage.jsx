import React from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import { ArrowLeft } from 'lucide-react';

const mockTransactions = [
  { id: 'TXN-9021', orderId: 'ORD-9821', gateway: 'Razorpay PG', type: 'Credit (Order)', amount: 14480, status: 'Success', date: '2026-09-23 10:15:00' },
  { id: 'TXN-9020', orderId: 'ORD-9820', gateway: 'Razorpay PG', type: 'Credit (Order)', amount: 8990, status: 'Success', date: '2026-09-23 09:30:00' },
  { id: 'TXN-9019', orderId: 'ORD-9812', gateway: 'Razorpay PG', type: 'Debit (Refund)', amount: 5490, status: 'Success', date: '2026-09-22 17:00:00' },
];

export const FinanceTransactionsPage = () => {
  const columns = [
    { header: 'Txn ID', accessor: 'id', render: (row) => <span className="font-mono text-slate-500">{row.id}</span> },
    { header: 'Order Ref', accessor: 'orderId', render: (row) => <span className="font-mono font-medium text-admin-accent">{row.orderId}</span> },
    { header: 'Payment Gateway', accessor: 'gateway', className: 'text-slate-600' },
    { header: 'Transaction Nature', accessor: 'type', className: 'font-medium text-slate-800' },
    {
      header: 'Settlement Amount',
      accessor: 'amount',
      render: (row) => (
        <span
          className={`font-mono font-bold ${
            row.type.includes('Credit') ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {row.type.includes('Credit') ? '+' : '-'}₹{row.amount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Gateway Status',
      accessor: 'status',
      render: (row) => <span className="admin-badge admin-badge-success">{row.status}</span>,
    },
    { header: 'Timestamp', accessor: 'date', className: 'text-slate-400 font-mono' },
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
          Payment Gateway Transactions
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time payment gateway logs, capture events, and transaction IDs.
        </p>
      </div>

      <DataTable
        title="Gateway Activity Log"
        columns={columns}
        data={mockTransactions}
      />
    </div>
  );
};
