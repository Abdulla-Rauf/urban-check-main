import React from 'react';
import { ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';

export const MetricCard = ({ title, value, change, isPositive, isAlert, timeframe, icon: Icon }) => {
  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded bg-slate-50 text-slate-600">
            <Icon size={16} />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
          {value}
        </span>

        {isAlert ? (
          <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle size={12} />
            <span>{change}</span>
          </span>
        ) : (
          <span
            className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
              isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {isPositive ? <ArrowUpRight size={13} className="mr-0.5" /> : <ArrowDownRight size={13} className="mr-0.5" />}
            {change}
          </span>
        )}
      </div>

      {timeframe && (
        <span className="text-[11px] text-slate-400 mt-2 font-medium">
          {timeframe}
        </span>
      )}
    </div>
  );
};
