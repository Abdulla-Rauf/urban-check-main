import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Package } from 'lucide-react';

export const CustomerDetailAdminPage = () => {
  const { id } = useParams();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/customers"
        className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={14} className="mr-1" />
        <span>Return to Customers</span>
      </Link>

      <div className="pb-4 border-b border-slate-200">
        <span className="text-[10px] uppercase font-mono text-slate-400">Customer #{id || 'CUST-1001'}</span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
          Elena Rostova
        </h1>
        <p className="text-xs text-slate-500">Tier: VIP Atelier Client • Joined November 2025</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-2">
          <span className="text-slate-400 text-[10px] uppercase font-medium">Lifetime Acquisition Value</span>
          <span className="text-xl font-bold text-slate-900 block">₹68,450</span>
          <span className="text-slate-500">8 completed orders</span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-2">
          <span className="text-slate-400 text-[10px] uppercase font-medium">Average Order Size</span>
          <span className="text-xl font-bold text-slate-900 block">₹8,556</span>
          <span className="text-slate-500">Zero return requests</span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-2">
          <span className="text-slate-400 text-[10px] uppercase font-medium">Contact Details</span>
          <p className="text-slate-800 font-medium">elena@example.com</p>
          <p className="text-slate-500">+91 98765 43210</p>
        </div>
      </div>
    </div>
  );
};
