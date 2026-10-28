import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/DataTable';
import { Plus, Trash2, X } from 'lucide-react';
import adminApi from '../services/api';

export const BrandsAdminPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '',
    origin: '',
    description: '',
    status: 'active',
  });

  const loadBrands = () => {
    setLoading(true);
    adminApi.get('/admin/brands')
      .then((res) => {
        const data = res?.data || res;
        if (Array.isArray(data)) {
          setBrands(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load brands:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleNameChange = (e) => {
    const val = e.target.value;
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug || autoSlug,
    }));
  };

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    try {
      setSaving(true);
      await adminApi.post('/admin/brands', formData);
      setIsModalOpen(false);
      setFormData({ name: '', slug: '', logo: '', origin: '', description: '', status: 'active' });
      loadBrands();
    } catch (err) {
      alert(err.message || 'Failed to create brand');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBrand = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove brand label "${name}"?`)) {
      try {
        await adminApi.delete(`/admin/brands/${id}`);
        loadBrands();
      } catch (err) {
        alert(err.message || 'Failed to delete brand');
      }
    }
  };

  const columns = [
    {
      header: 'Logo / Image',
      accessor: 'logo',
      render: (row) => {
        const img = row.logo || row.image;
        return img ? (
          <div className="w-9 h-9 rounded border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
            <img
              src={img}
              alt={row.name}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs flex-shrink-0">
            {row.name ? row.name.slice(0, 2).toUpperCase() : 'BR'}
          </div>
        );
      },
    },
    {
      header: 'Brand Sub-label',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name}</div>
          <div className="text-[11px] font-mono text-slate-400">{row.slug}</div>
        </div>
      ),
    },
    { header: 'Design Studio Origin', accessor: 'origin', className: 'text-slate-600', render: (row) => row.origin || 'Milan / India' },
    { header: 'Catalog Products', accessor: 'productsCount', render: (row) => `${row.productsCount || 0} Items` },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span
          className={`admin-badge ${
            row.status === 'Active' || row.status === 'active' ? 'admin-badge-success' : 'admin-badge-danger'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button
          onClick={() => handleDeleteBrand(row.id || row._id, row.name)}
          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
          title="Delete Brand"
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Brand Labels & Studios
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal atelier labels under the Urban Check brand umbrella.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-admin-accent hover:bg-admin-accent-hover text-white rounded-md text-xs font-medium shadow-sm transition-colors"
        >
          <Plus size={15} />
          <span>Add Brand Label</span>
        </button>
      </div>

      <DataTable
        title="Portfolio Studios"
        columns={columns}
        data={brands}
      />

      {/* Add Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-slate-900 text-sm">Add Brand Label</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBrand} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Urban Check Atelier"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-admin-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. urban-check-atelier"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-admin-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Brand Logo / Image URL
                </label>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  placeholder="https://... (SVG / PNG / WebP)"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-admin-accent"
                />
                {formData.logo && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="w-10 h-10 rounded border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={formData.logo}
                        alt="Logo preview"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500">Logo Preview</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Design Studio Origin
                </label>
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="e.g. Milan / India"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-admin-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Editorial description of the brand atelier..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-admin-accent"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-admin-accent hover:bg-admin-accent-hover text-white rounded text-xs font-medium transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
