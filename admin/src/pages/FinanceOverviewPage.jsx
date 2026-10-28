import React from 'react';
import { Link } from 'react-router-dom';
import { MetricCard } from '../components/MetricCard';
import { DollarSign, ArrowRightLeft, ScrollText, TrendingUp } from 'lucide-react';

export const FinanceOverviewPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Financial Health & Revenue Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consolidated gross merchandise value, net sales, taxes collected, and gateway settlements.
          </p>
        </div>

        <div className="flex space-x-3">
          <Link
            to="/finance/transactions"
            className="inline-flex items-center space-x-1 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-slate-50"
          >
            <ArrowRightLeft size={13} />
            <span>Transactions</span>
          </Link>
          <Link
            to="/finance/ledger"
            className="inline-flex items-center space-x-1 px-3 py-2 bg-admin-accent text-white rounded text-xs font-medium hover:bg-admin-accent-hover"
          >
            <ScrollText size={13} />
            <span>Financial Ledger</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Net Revenue (MTD)"
          value="₹14,82,500"
          change="+18.4%"
          isPositive={true}
          timeframe="Post discounts & refunds"
          icon={DollarSign}
        />
        <MetricCard
          title="Gross Bookings"
          value="₹15,30,000"
          change="+16.2%"
          isPositive={true}
          timeframe="Total cart checkouts"
          icon={TrendingUp}
        />
        <MetricCard
          title="Taxes Collected (GST 12%)"
          value="₹1,77,900"
          change="Compliant"
          isPositive={true}
          timeframe="Output tax liability"
        />
        <MetricCard
          title="Total Refunds Issued"
          value="₹15,500"
          change="1.04%"
          isPositive={true}
          timeframe="Below 2% risk threshold"
        />
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Revenue Reconciliation Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-4 bg-slate-50 rounded border border-slate-200/80">
            <span className="text-slate-400 block mb-1">Razorpay Direct Gateway</span>
            <span className="text-lg font-bold text-slate-900 block">₹12,40,000</span>
            <span className="text-emerald-600 font-medium">Settled to HDFC Current A/c</span>
          </div>

          <div className="p-4 bg-slate-50 rounded border border-slate-200/80">
            <span className="text-slate-400 block mb-1">Cash on Delivery Pending</span>
            <span className="text-lg font-bold text-slate-900 block">₹2,42,500</span>
            <span className="text-slate-500 font-medium">In courier remittance pipeline</span>
          </div>

          <div className="p-4 bg-slate-50 rounded border border-slate-200/80">
            <span className="text-slate-400 block mb-1">Estimated Net Operating Margin</span>
            <span className="text-lg font-bold text-slate-900 block">61.4%</span>
            <span className="text-emerald-600 font-medium">High luxury atelier margin</span>
          </div>
        </div>
      </div>
    </div>
  );
};
