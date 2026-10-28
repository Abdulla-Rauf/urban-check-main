import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Shield, ShieldCheck } from 'lucide-react';
import { ADMIN_NAV_GROUPS } from '../constants';
import { useSidebarStore } from '../store/sidebarStore';
import { useAdminAuthStore } from '../store/adminAuthStore';

export const Sidebar = () => {
  const { isCollapsed, toggleCollapsed } = useSidebarStore();
  const { admin } = useAdminAuthStore();

  return (
    <aside
      className={`bg-admin-sidebar text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/40">
        <Link to="/dashboard" className="flex items-center space-x-2 overflow-hidden">
          <div className="w-8 h-8 rounded bg-urban-teal text-white flex items-center justify-center font-bold text-sm tracking-wider flex-shrink-0">
            UC
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-wider text-white">
                URBAN CHECK
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase -mt-0.5">
                Staff Console
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={toggleCollapsed}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Admin Role Chip */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-xs text-slate-300 font-medium">{admin?.name || 'Staff Admin'}</span>
          </div>
          <span className="text-[9px] uppercase tracking-wider bg-urban-teal/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
            {admin?.role || 'Super Admin'}
          </span>
        </div>
      )}

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {ADMIN_NAV_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <h4 className="px-3 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                {group.title}
              </h4>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-urban-teal text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      } ${isCollapsed ? 'justify-center' : 'space-x-3'}`
                    }
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={17} className="flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30 text-[10px] text-slate-400 text-center">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <span>Urban Check Ops</span>
            <span className="text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              v1.0.0
            </span>
          </div>
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
        )}
      </div>
    </aside>
  );
};
