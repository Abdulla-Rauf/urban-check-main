import React from 'react';
import { MetricCard } from '../components/MetricCard';
import { BarChart3, Users, Clock, ShoppingCart } from 'lucide-react';

export const AnalyticsPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Analytics & Conversion Intelligence
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Audience engagement, checkout funnel drop-offs, and channel performance metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Conversion Rate"
          value="3.42%"
          change="+0.8%"
          isPositive={true}
          timeframe="vs. 2.6% industry bench"
          icon={ShoppingCart}
        />
        <MetricCard
          title="Monthly Unique Visitors"
          value="48,200"
          change="+24.2%"
          isPositive={true}
          timeframe="Editorial campaigns"
          icon={Users}
        />
        <MetricCard
          title="Avg Session Duration"
          value="4m 18s"
          change="+18s"
          isPositive={true}
          timeframe="High lookbook dwell"
          icon={Clock}
        />
        <MetricCard
          title="Cart Abandonment"
          value="58.2%"
          change="-4.1%"
          isPositive={true}
          timeframe="Recovered via mail"
          icon={BarChart3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Acquisition Channels</h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Direct / Lookbook Brand Recognition</span>
                <span className="font-semibold text-slate-800">42%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-admin-accent h-full" style={{ width: '42%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Organic Luxury Fashion Search</span>
                <span className="font-semibold text-slate-800">28%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-admin-accent/80 h-full" style={{ width: '28%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Instagram Atelier Drops</span>
                <span className="font-semibold text-slate-800">20%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-admin-accent/60 h-full" style={{ width: '20%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Device Distribution</h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Mobile Safari & Chrome</span>
                <span className="font-semibold text-slate-800">74%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full" style={{ width: '74%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600">Desktop Workstations</span>
                <span className="font-semibold text-slate-800">26%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full" style={{ width: '26%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
