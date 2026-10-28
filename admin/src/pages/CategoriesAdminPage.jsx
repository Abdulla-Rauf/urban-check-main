import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/DataTable';
import { Plus, Trash2, X } from 'lucide-react';
import adminApi from '../services/api';

export const CategoriesAdminPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    status: 'active',
  });

  const loadCategories = () => {
    setLoading(true);
    adminApi.get('/admin/categories')
      .then((res) => {
        const data = res?.data || res;
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCategories();
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

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    try {
      setSaving(true);
      await adminApi.post('/admin/categories', formData);
      setIsModalOpen(false);
      setFormData({ name: '', slug: '', description: '', status: 'active' });
      loadCategories();
    } catch (err) {
      alert(err.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove category "${name}"?`)) {
      try {
        await adminApi.delete(`/admin/categories/${id}`);
        loadCategories();
      } catch (err) {
        alert(err.message || 'Failed to delete category');
      }
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id', render: (row) => <span className="font-mono text-slate-500">{row.id || row._id}</span> },
    { header: 'Category Name', accessor: 'name', className: 'font-semibold text-slate-900' },
    { header: 'Slug', accessor: 'slug', className: 'font-mono text-slate-500' },
    { header: 'Assigned Products', accessor: 'productsCount', render: (row) => `${row.productsCount || 0} SKUs` },
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
          onClick={() => handleDeleteCategory(row.id || row._id, row.name)}
          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
          title="Delete Category"
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
            Categories Taxonomy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize catalog hierarchy and customer navigation taxonomy.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-admin-accent hover:bg-admin-accent-hover text-white rounded-md text-xs font-medium shadow-sm transition-colors"
        >
          <Plus size={15} />
          <span>Add Category</span>
        </button>
      </div>

      <DataTable
        title="Active Categories"
        columns={columns}
        data={categories}
      />

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-semibold text-slate-900 text-sm">Add Category</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Outerwear"
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
                  placeholder="e.g. outerwear"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-admin-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Editorial description of this collection..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-admin-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-admin-accent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
