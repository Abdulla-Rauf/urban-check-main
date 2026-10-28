import React, { useState } from 'react';
import { Save, Globe, Shield, Truck } from 'lucide-react';

export const SettingsAdminPage = () => {
  const [settings, setSettings] = useState({
    storeName: 'Urban Check',
    supportEmail: 'concierge@urbancheck.com',
    currency: 'INR (₹)',
    gstTaxRate: 12,
    freeShippingThreshold: 2500,
    defaultCourier: 'DTDC Express Priority',
    maintenanceMode: false,
    clientDomain: 'https://urbancheck.com',
    adminDomain: 'https://admin.urbancheck.com',
    apiDomain: 'https://api.urbancheck.com',
  });

  const handleSave = (e) => {
    e.preventDefault();
    alert('Settings successfully updated');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Platform System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure domain mappings, currency rates, tax rules, and courier parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Domain Architecture */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm border-b border-slate-100 pb-3">
            <Globe size={16} className="text-admin-accent" />
            <span>Multi-Domain Topology</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Customer Website</label>
              <input
                type="text"
                disabled
                value={settings.clientDomain}
                className="w-full bg-slate-100 border border-slate-200 rounded p-2 text-slate-600 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Local: http://localhost:5173</span>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Admin Dashboard</label>
              <input
                type="text"
                disabled
                value={settings.adminDomain}
                className="w-full bg-slate-100 border border-slate-200 rounded p-2 text-slate-600 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Local: http://localhost:5174</span>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">API Gateway</label>
              <input
                type="text"
                disabled
                value={settings.apiDomain}
                className="w-full bg-slate-100 border border-slate-200 rounded p-2 text-slate-600 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Local: http://localhost:5000</span>
            </div>
          </div>
        </div>

        {/* Commercial & Shipping Rules */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm border-b border-slate-100 pb-3">
            <Truck size={16} className="text-admin-accent" />
            <span>Commercial & Shipping Configurations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Complimentary Shipping Threshold (₹)</label>
              <input
                type="number"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 focus:outline-none focus:border-admin-accent"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Standard Apparel GST (%)</label>
              <input
                type="number"
                value={settings.gstTaxRate}
                onChange={(e) => setSettings({ ...settings, gstTaxRate: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 focus:outline-none focus:border-admin-accent"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Default Courier Integration</label>
              <select
                value={settings.defaultCourier}
                onChange={(e) => setSettings({ ...settings, defaultCourier: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 focus:outline-none focus:border-admin-accent"
              >
                <option value="DTDC Express Priority">DTDC Express Priority</option>
                <option value="Delhivery Surface">Delhivery Surface</option>
                <option value="Blue Dart Air">Blue Dart Air</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">Customer Concierge Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 focus:outline-none focus:border-admin-accent"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-admin-accent hover:bg-admin-accent-hover text-white font-medium rounded flex items-center space-x-1.5 shadow"
          >
            <Save size={14} />
            <span>Save System Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
