import React from 'react';
import { Search, Bell, ExternalLink, LogOut, Activity } from 'lucide-react';
import { useAdminAuthStore } from '../store/adminAuthStore';
import { useNavigate } from 'react-router-dom';

export const Topbar = () => {
  const { admin, logout } = useAdminAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-admin-border flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Search Input */}
      <div className="flex items-center space-x-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders, SKU, customer emails, transactions..."
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-1.5 text-xs rounded-md focus:outline-none focus:border-admin-accent focus:bg-white text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Backend API Connection Status Indicator */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] rounded-full">
          <Activity size={12} className="animate-pulse" />
          <span className="font-medium">API Service Online (Port 5000)</span>
        </div>

        {/* Notifications */}
        <button
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full relative transition-colors"
          title="Audit Alerts"
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Admin User dropdown / Profile */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-admin-accent text-white flex items-center justify-center text-xs font-semibold">
            {admin?.name?.charAt(0) || 'A'}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              {admin?.name || 'Administrator'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {admin?.role || 'Super Admin'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors ml-1"
            title="Terminate Staff Session"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
