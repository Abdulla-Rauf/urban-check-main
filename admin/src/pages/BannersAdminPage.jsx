import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Layers, Tag, Search, Check, X } from 'lucide-react';
import { marketingService } from '../services/marketingService';
import { adminApi } from '../services/api';

export const BannersAdminPage = () => {
  const [banners, setBanners] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    cta: 'Shop Collection',
    targetType: 'Page',
    targetId: 'shop',
    displayOrder: 1,
    offerBadge: '',
    discountPercentage: 0,
    offerPrice: '',
    offerPriceRange: '',
    applicableProducts: [],
    showOfferProducts: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'Active',
  });

  const loadBanners = async () => {
    setIsLoading(true);
    try {
      const data = await marketingService.getBanners();
      setBanners(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load banners');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await adminApi.get('/admin/products?limit=100');
      const payload = res.data || res;
      setAvailableProducts(payload.items || []);
    } catch (err) {
      console.warn('Failed to load products for banner:', err);
    }
  };

  useEffect(() => {
    loadBanners();
    loadProducts();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingBanner(null);
    setProductSearch('');
    setFormData({
      title: '',
      subtitle: '',
      image: '',
      cta: 'Shop Collection',
      targetType: 'Page',
      targetId: 'shop',
      displayOrder: banners.length + 1,
      offerBadge: '',
      discountPercentage: 0,
      offerPrice: '',
      offerPriceRange: '',
      applicableProducts: [],
      showOfferProducts: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'Active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner) => {
    setEditingBanner(banner);
    setProductSearch('');

    const rawApplicable = Array.isArray(banner.applicableProducts) ? banner.applicableProducts : [];
    const normalizedApplicable = rawApplicable.map((item) => {
      if (typeof item === 'object') {
        return {
          productId: item.productId || item.id || item._id,
          discountPercentage: item.discountPercentage !== undefined && item.discountPercentage !== ''
            ? Number(item.discountPercentage)
            : (Number(banner.discountPercentage) || 0),
          offerPrice: item.offerPrice != null ? Number(item.offerPrice) : null,
        };
      }
      return {
        productId: item,
        discountPercentage: Number(banner.discountPercentage) || 0,
        offerPrice: null,
      };
    });

    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image: banner.image,
      cta: banner.cta || 'Shop Collection',
      targetType: banner.targetType || 'Page',
      targetId: banner.targetId || '',
      displayOrder: banner.displayOrder ?? 1,
      offerBadge: banner.offerBadge || '',
      discountPercentage: banner.discountPercentage || 0,
      offerPrice: banner.offerPrice != null ? banner.offerPrice : '',
      offerPriceRange: banner.offerPriceRange || '',
      applicableProducts: normalizedApplicable,
      showOfferProducts: banner.showOfferProducts !== false,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
      status: banner.status || 'Active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const getProductConfig = (prodId) => {
    if (!Array.isArray(formData.applicableProducts)) return null;
    return formData.applicableProducts.find((item) => {
      if (typeof item === 'object') {
        return (item.productId || item.id || item._id) === prodId;
      }
      return item === prodId;
    });
  };

  const isProductSelected = (prodId) => {
    return !!getProductConfig(prodId);
  };

  const getProductDiscount = (prodId) => {
    const config = getProductConfig(prodId);
    if (config && typeof config === 'object' && config.discountPercentage !== undefined && config.discountPercentage !== '') {
      return Number(config.discountPercentage);
    }
    return Number(formData.discountPercentage) || 0;
  };

  const handleToggleProduct = (prodId) => {
    setFormData((prev) => {
      const currentList = Array.isArray(prev.applicableProducts) ? prev.applicableProducts : [];
      const existsIndex = currentList.findIndex((item) => {
        const id = typeof item === 'object' ? (item.productId || item.id || item._id) : item;
        return id === prodId;
      });

      let nextList;
      if (existsIndex >= 0) {
        nextList = currentList.filter((_, idx) => idx !== existsIndex);
      } else {
        nextList = [
          ...currentList,
          {
            productId: prodId,
            discountPercentage: Number(prev.discountPercentage) || 0,
            offerPrice: null,
          },
        ];
      }
      return { ...prev, applicableProducts: nextList };
    });
  };

  const handleUpdateProductDiscount = (prodId, discountVal) => {
    const discount = Math.max(0, Math.min(100, Number(discountVal) || 0));
    setFormData((prev) => {
      const currentList = Array.isArray(prev.applicableProducts) ? prev.applicableProducts : [];
      const nextList = currentList.map((item) => {
        const id = typeof item === 'object' ? (item.productId || item.id || item._id) : item;
        if (id === prodId) {
          return {
            productId: prodId,
            discountPercentage: discount,
            offerPrice: null,
          };
        }
        return typeof item === 'object'
          ? item
          : { productId: item, discountPercentage: Number(prev.discountPercentage) || 0, offerPrice: null };
      });
      return { ...prev, applicableProducts: nextList };
    });
  };

  const handleSelectAllProducts = () => {
    const generalDiscount = Number(formData.discountPercentage) || 0;
    setFormData((prev) => ({
      ...prev,
      applicableProducts: availableProducts.map((p) => ({
        productId: p.id || p._id,
        discountPercentage: generalDiscount,
        offerPrice: null,
      })),
    }));
  };

  const handleClearProducts = () => {
    setFormData((prev) => ({
      ...prev,
      applicableProducts: [],
    }));
  };

  const handleApplyDiscountToAll = () => {
    const generalDiscount = Number(formData.discountPercentage) || 0;
    setFormData((prev) => {
      const currentList = Array.isArray(prev.applicableProducts) ? prev.applicableProducts : [];
      return {
        ...prev,
        applicableProducts: currentList.map((item) => {
          const id = typeof item === 'object' ? (item.productId || item.id || item._id) : item;
          return {
            productId: id,
            discountPercentage: generalDiscount,
            offerPrice: null,
          };
        }),
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Banner title is required');
      return;
    }
    if (!formData.image.trim()) {
      setFormError('Banner image URL is required');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const formattedApplicable = (formData.applicableProducts || []).map((item) => {
        if (typeof item === 'object') {
          return {
            productId: item.productId || item.id || item._id,
            discountPercentage: Number(item.discountPercentage) || Number(formData.discountPercentage) || 0,
            offerPrice: item.offerPrice != null && item.offerPrice !== '' ? Number(item.offerPrice) : null,
          };
        }
        return {
          productId: item,
          discountPercentage: Number(formData.discountPercentage) || 0,
          offerPrice: null,
        };
      });

      const payload = {
        ...formData,
        applicableProducts: formattedApplicable,
        displayOrder: Number(formData.displayOrder) || 1,
        discountPercentage: Number(formData.discountPercentage) || 0,
        offerPrice: formData.offerPrice !== '' ? Number(formData.offerPrice) : null,
        endDate: formData.endDate ? formData.endDate : null,
      };

      if (editingBanner) {
        await marketingService.updateBanner(editingBanner._id || editingBanner.id, payload);
      } else {
        await marketingService.createBanner(payload);
      }

      setIsModalOpen(false);
      await loadBanners();
    } catch (err) {
      setFormError(err.message || 'Failed to save banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete banner "${title}"?`)) {
      try {
        await marketingService.deleteBanner(id);
        await loadBanners();
      } catch (err) {
        alert(err.message || 'Failed to delete banner');
      }
    }
  };

  const handleToggleStatus = async (banner) => {
    const newStatus = banner.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await marketingService.updateBanner(banner._id || banner.id, { status: newStatus });
      await loadBanners();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const filteredProducts = availableProducts.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(q);
    const brandMatch = (p.brandName || p.brand?.name || p.brand || '').toLowerCase().includes(q);
    return nameMatch || brandMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Marketing Banners & Campaigns
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic homepage hero slides, campaign discounts (e.g. Black Friday), and set individual offer percentages per product.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium shadow-sm transition-colors"
        >
          <Plus size={15} />
          <span>New Banner</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
          {error}
        </div>
      )}

      {/* Banners Grid & Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Layers size={16} className="text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Active & Scheduled Banners ({banners.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Sorted by Display Priority
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Loading promotional banners...
          </div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No marketing banners configured. Click "New Banner" to launch your first campaign.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Preview</th>
                  <th className="py-3 px-4">Title & Subtitle</th>
                  <th className="py-3 px-4">Campaign Offer & Products</th>
                  <th className="py-3 px-4">Target & Link</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {banners.map((banner) => (
                  <tr key={banner._id || banner.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-16 h-10 rounded border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0">
                        <img
                          src={banner.image}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400';
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{banner.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{banner.subtitle || '—'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">CTA: "{banner.cta || 'Shop Now'}"</div>
                    </td>
                    <td className="py-3 px-4">
                      {banner.applicableProducts && banner.applicableProducts.length > 0 ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Tag size={11} className="mr-1" />
                            {banner.offerBadge || `${banner.applicableProducts.length} Applicable Products`}
                          </span>
                          <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                            {banner.applicableProducts.length} Selected Products
                          </div>
                          <div className="text-[10px] text-slate-400">
                            (Individual discounts active)
                          </div>
                        </div>
                      ) : banner.discountPercentage > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {banner.discountPercentage}% OFF
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Standard Banner</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center space-x-1.5">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                          {banner.targetType}
                        </span>
                        {banner.targetId && (
                          <span className="font-mono text-[10px] text-slate-500">
                            ({banner.targetId})
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-teal-700 truncate max-w-[180px] mt-0.5">
                        {banner.targetUrl || '/shop'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      #{banner.displayOrder}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} className="text-slate-400" />
                        <span>
                          {banner.startDate ? new Date(banner.startDate).toLocaleDateString('en-IN') : 'Immediate'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {banner.endDate ? `Until ${new Date(banner.endDate).toLocaleDateString('en-IN')}` : 'Indefinite'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(banner)}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          banner.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        {banner.status}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(banner)}
                          className="p-1 text-slate-500 hover:text-slate-900 transition-colors"
                          title="Edit banner"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(banner._id || banner.id, banner.title)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete banner"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col animate-in fade-in duration-150">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingBanner ? 'Edit Marketing Banner & Campaign' : 'Create New Marketing Banner & Campaign'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                  {formError}
                </div>
              )}

              {/* Basic Banner Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Black Friday Special Drop"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Subtitle / Editorial Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. Black Friday Shopping Upto 80% offers"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  High-Resolution Banner Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 font-mono"
                />
                {formData.image && (
                  <div className="mt-2 h-24 w-full rounded border border-slate-200 overflow-hidden bg-slate-50">
                    <img
                      src={formData.image}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* PROMOTIONAL OFFER & APPLICABLE PRODUCTS BOX */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Tag size={14} className="text-amber-600" />
                      <span>Campaign Offer & Individual Product Discounts</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Select which products are applicable and set their individual offer percentages. ONLY these selected products will show in this campaign offer.
                    </p>
                  </div>
                  {formData.discountPercentage > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded">
                      Default {formData.discountPercentage}% OFF
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Offer Tag / Badge Text
                    </label>
                    <input
                      type="text"
                      value={formData.offerBadge}
                      onChange={(e) => setFormData({ ...formData, offerBadge: e.target.value })}
                      placeholder="e.g. Black Friday • Up to 80% OFF"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-slate-800"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-medium text-slate-700">
                        Default Discount (%)
                      </label>
                      {formData.applicableProducts.length > 0 && (
                        <button
                          type="button"
                          onClick={handleApplyDiscountToAll}
                          className="text-[10px] text-teal-700 hover:text-teal-900 underline"
                          title="Apply this percentage to all selected products below"
                        >
                          Apply to All
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discountPercentage}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setFormData((prev) => ({
                          ...prev,
                          discountPercentage: val,
                          offerBadge: prev.offerBadge || (val > 0 ? `UP TO ${val}% OFF` : ''),
                          offerPriceRange: prev.offerPriceRange || (val > 0 ? `Up to ${val}% OFF` : ''),
                        }));
                      }}
                      placeholder="e.g. 80"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Offer Price Range / Tagline
                    </label>
                    <input
                      type="text"
                      value={formData.offerPriceRange}
                      onChange={(e) => setFormData({ ...formData, offerPriceRange: e.target.value })}
                      placeholder="e.g. Upto 80% OFF / From ₹999"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>

                {/* Applicable Products Selection Checklist */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-slate-800 text-xs">
                      Applicable Products ({formData.applicableProducts.length} selected for this offer)
                    </label>
                    <div className="space-x-2 text-[11px]">
                      <button
                        type="button"
                        onClick={handleSelectAllProducts}
                        className="text-slate-700 hover:text-slate-900 underline font-medium"
                      >
                        Select All ({availableProducts.length})
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handleClearProducts}
                        className="text-slate-500 hover:text-red-600 underline"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>

                  {/* Search within available products */}
                  <div className="relative mb-2">
                    <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Filter catalog products by name or brand..."
                      className="w-full border border-slate-300 rounded pl-8 pr-3 py-1.5 text-xs bg-white focus:outline-none focus:border-slate-800"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded bg-white divide-y divide-slate-100">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        No catalog products found.
                      </div>
                    ) : (
                      filteredProducts.map((p) => {
                        const pId = p.id || p._id;
                        const isSelected = isProductSelected(pId);
                        const originalPrice = Number(p.price) || 0;
                        const discount = getProductDiscount(pId);
                        const calculatedOfferPrice =
                          discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice;

                        return (
                          <div
                            key={pId}
                            onClick={() => handleToggleProduct(pId)}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 gap-2 hover:bg-slate-50 cursor-pointer transition-colors ${
                              isSelected ? 'bg-teal-50/40 border-l-4 border-teal-600' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // handled by row click
                                className="rounded border-slate-300 text-slate-900 focus:ring-0"
                              />
                              <img
                                src={p.thumbnail || p.images?.[0] || 'https://via.placeholder.com/60'}
                                alt={p.name}
                                className="w-9 h-9 rounded object-cover flex-shrink-0 border border-slate-200"
                              />
                              <div className="truncate">
                                <div className="font-semibold text-slate-900 text-xs truncate">{p.name}</div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  Brand: <span className="font-semibold text-slate-700">{p.brandName || p.brand?.name || p.brand || 'Urban Check'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Individual Offer Percentage input & Live Calculation */}
                            <div
                              className="flex items-center space-x-3 self-end sm:self-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isSelected ? (
                                <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded px-2 py-1 shadow-2xs">
                                  <span className="text-[10px] text-slate-500 font-medium">Individual Offer:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={discount}
                                    onChange={(e) => handleUpdateProductDiscount(pId, e.target.value)}
                                    className="w-12 text-center border border-slate-300 rounded px-1 py-0.5 text-xs font-mono font-bold text-emerald-800 bg-white focus:outline-none focus:border-slate-800"
                                  />
                                  <span className="text-[11px] font-bold text-slate-700">%</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400">Not Applicable</span>
                              )}

                              <div className="text-right flex-shrink-0 min-w-[95px]">
                                <div className="text-xs font-semibold text-slate-900">
                                  {isSelected && discount > 0 ? (
                                    <span className="text-emerald-700 font-bold">
                                      ₹{calculatedOfferPrice.toLocaleString('en-IN')}
                                    </span>
                                  ) : (
                                    <span>₹{originalPrice.toLocaleString('en-IN')}</span>
                                  )}
                                </div>
                                {isSelected && discount > 0 ? (
                                  <div className="text-[10px] text-slate-400 line-through">
                                    ₹{originalPrice.toLocaleString('en-IN')} (-{discount}%)
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-400">Original Price</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Target & Call to Action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Call To Action Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.cta}
                    onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                    placeholder="e.g. Shop Collection"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Display Priority Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Target Type *
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 bg-white"
                  >
                    <option value="Page">Page (Custom URL or /shop)</option>
                    <option value="Product">Product (Slug or ID)</option>
                    <option value="Category">Category (Slug or ID)</option>
                    <option value="Brand">Brand (Slug or ID)</option>
                    <option value="Offer">Offer (/offers)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Target ID / Identifier
                  </label>
                  <input
                    type="text"
                    value={formData.targetId}
                    onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                    placeholder={
                      formData.targetType === 'Category'
                        ? 'e.g. outerwear'
                        : formData.targetType === 'Product'
                        ? 'e.g. wool-trench-coat'
                        : formData.targetType === 'Brand'
                        ? 'e.g. atelier-nord'
                        : 'e.g. shop'
                    }
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-slate-800 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingBanner ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
