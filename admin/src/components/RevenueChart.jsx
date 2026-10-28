import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { Calendar, TrendingUp, Filter, Loader2, RefreshCw } from 'lucide-react';

export const RevenueChart = () => {
  const [period, setPeriod] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'yearly'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    formattedTotalRevenue: '₹0',
    totalOrders: 0,
    avgOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ period });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await adminApi.get(`/admin/dashboard/revenue?${params.toString()}`);
      const payload = res.data || res;
      setData(payload.data || []);
      if (payload.summary) {
        setSummary(payload.summary);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch revenue analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, [period]);

  const handleApplyDateFilter = (e) => {
    e.preventDefault();
    fetchRevenue();
  };

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
    setTimeout(() => fetchRevenue(), 0);
  };

  // Find max value to normalize bar heights
  const maxRevenue = data.reduce((max, d) => Math.max(max, d.revenue), 0) || 1;

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200/80 shadow-sm space-y-6">
      {/* Chart Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-slate-900">
              Revenue Velocity Telemetry
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
              Live DB
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Gross turnover, order throughput, and basket averages across billing cycles.
          </p>
        </div>

        {/* Period Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-md border border-slate-200 text-xs">
            {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded capitalize font-medium transition-all ${
                  period === p
                    ? 'bg-white text-admin-accent shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={fetchRevenue}
            className="p-1.5 rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            title="Refresh Revenue"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Date Filter & Metrics Summary Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50/80 rounded-md border border-slate-200/60 text-xs">
        {/* Date Filter Form */}
        <form onSubmit={handleApplyDateFilter} className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-admin-accent"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-admin-accent"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1 bg-slate-800 text-white rounded font-medium hover:bg-slate-900 transition-colors"
          >
            Filter
          </button>

          {(startDate || endDate) && (
            <button
              type="button"
              onClick={handleClearDates}
              className="text-slate-500 hover:text-slate-800 underline font-medium"
            >
              Reset
            </button>
          )}
        </form>

        {/* Aggregated Totals in View */}
        <div className="flex items-center space-x-6">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Period Gross
            </span>
            <span className="text-sm font-bold text-slate-900 font-mono">
              {summary.formattedTotalRevenue}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Orders Placed
            </span>
            <span className="text-sm font-bold text-slate-900 font-mono">
              {summary.totalOrders}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Average Basket
            </span>
            <span className="text-sm font-bold text-slate-900 font-mono">
              ₹{summary.avgOrderValue?.toLocaleString('en-IN') || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Chart Canvas */}
      <div className="relative min-h-[220px] flex items-end justify-between gap-3 pt-8 pb-2 border-b border-slate-200">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
            <Loader2 size={24} className="animate-spin text-admin-accent" />
          </div>
        )}

        {error && (
          <div className="w-full text-center py-10 text-rose-500 text-xs font-medium">
            {error}
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="w-full text-center py-14 text-slate-400 text-xs">
            No order transaction records found within this timeframe.
          </div>
        )}

        {!loading &&
          !error &&
          data.map((item, idx) => {
            const heightPercent = Math.max(8, Math.round((item.revenue / maxRevenue) * 100));
            const isHighest = item.revenue === maxRevenue && maxRevenue > 0;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                {/* Hover Tooltip Card */}
                <div className="absolute bottom-[calc(100%+8px)] z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white p-2.5 rounded shadow-lg text-[11px] whitespace-nowrap min-w-[140px]">
                  <p className="font-semibold text-white border-b border-slate-700 pb-1 mb-1">
                    {item.label}
                  </p>
                  <p className="text-emerald-400 font-mono font-medium">
                    Revenue: {item.formattedRevenue}
                  </p>
                  <p className="text-slate-300">Orders: {item.ordersCount}</p>
                  <p className="text-slate-400">
                    AOV: ₹{item.avgOrderValue?.toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Top value badge on highest bar */}
                {isHighest && (
                  <span className="text-[10px] text-admin-accent font-semibold mb-1 font-mono">
                    Peak
                  </span>
                )}

                {/* Bar */}
                <div
                  className={`w-full max-w-[48px] rounded-t transition-all cursor-pointer ${
                    isHighest
                      ? 'bg-admin-accent hover:bg-admin-accent-hover shadow-sm'
                      : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                {/* X-Axis Label */}
                <span className="text-[11px] font-medium text-slate-500 mt-2 truncate max-w-full text-center">
                  {item.label}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
};
