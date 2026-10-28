import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../services/api';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';

export const ProductCreatePage = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [gender, setGender] = useState('Women');
  const [material, setMaterial] = useState('');
  const [tags, setTags] = useState('outerwear, luxury, tailored');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [status, setStatus] = useState('active');

  // Images state
  const [images, setImages] = useState([
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=85',
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // SEO state
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');

  // Variants state
  const [variants, setVariants] = useState([
    { sku: '', size: 'S', color: 'Classic Black', colorHex: '#111111', stock: 10, price: '' },
    { sku: '', size: 'M', color: 'Classic Black', colorHex: '#111111', stock: 15, price: '' },
    { sku: '', size: 'L', color: 'Classic Black', colorHex: '#111111', stock: 8, price: '' },
  ]);

  useEffect(() => {
    async function loadMetadata() {
      try {
        setLoadingOptions(true);
        const [catsRes, brandsRes] = await Promise.all([
          adminApi.get('/categories'),
          adminApi.get('/brands'),
        ]);
        const cList = catsRes.data || catsRes;
        const bList = brandsRes.data || brandsRes;
        setCategories(cList || []);
        setBrands(bList || []);
        if (cList?.length > 0) setCategory(cList[0]._id);
        if (bList?.length > 0) setBrand(bList[0]._id);
      } catch (err) {
        console.error('Failed to load categories/brands:', err);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadMetadata();
  }, []);

  // Auto-generate slug when name changes
  const handleNameChange = (val) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);

    // Auto-fill SEO Title if empty
    if (!metaTitle) setMetaTitle(`${val} — Urban Check Atelier`);
  };

  const handleAddImage = (e) => {
    e.preventDefault();
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Variants helpers
  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        sku: '',
        size: 'M',
        color: 'Classic Black',
        colorHex: '#111111',
        stock: 10,
        price: price || '',
      },
    ]);
  };

  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleQuickAddSizes = (colorName = 'Classic Black', hex = '#111111') => {
    const defaultSizes = ['XS', 'S', 'M', 'L', 'XL'];
    const newVariants = defaultSizes.map((sz) => ({
      sku: `${slug ? slug.toUpperCase().slice(0, 6) : 'UC'}-${sz}-${colorName.slice(0, 3).toUpperCase()}`,
      size: sz,
      color: colorName,
      colorHex: hex,
      stock: 10,
      price: price || '',
    }));
    setVariants(newVariants);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      // Format variants
      const formattedVariants = variants.map((v, i) => ({
        sku: v.sku || `${(slug || 'UC').toUpperCase().slice(0, 8)}-V${i + 1}`,
        size: v.size,
        color: v.color,
        colorHex: v.colorHex || '#111111',
        price: Number(v.price || price),
        stock: Math.max(0, parseInt(v.stock, 10) || 0),
        status: 'active',
      }));

      const payload = {
        name,
        slug,
        description,
        shortDescription,
        brand,
        category,
        gender,
        material,
        tags,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : 0,
        salePrice: salePrice ? Number(salePrice) : null,
        status,
        images,
        thumbnail: images[0] || '',
        variants: formattedVariants,
        seo: {
          metaTitle: metaTitle || name,
          metaDescription: metaDescription || shortDescription,
          keywords,
        },
      };

      await adminApi.post('/admin/products', payload);
      navigate('/products');
    } catch (err) {
      setError(err.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <Link
        to="/products"
        className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={14} className="mr-1" />
        <span>Return to Catalog</span>
      </Link>

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Master Garment
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register a new luxury fashion piece with dynamic SKU variants and SEO metadata.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* SECTION 1: Master Details */}
        <div className="bg-white p-6 rounded-lg border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
            1. Master Garment Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Garment Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Double-Faced Cashmere Wrap Coat"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">URL Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. double-faced-cashmere-wrap-coat"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent"
              >
                <option value="Women">Women</option>
                <option value="Men">Men</option>
                <option value="Unisex">Unisex</option>
                <option value="Kids">Kids</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Brand *</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent"
              >
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Primary Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Material Composition</label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. 100% Mongolian Cashmere, Silk Linings"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Search Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. cashmere, coat, outerwear, winter"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Short Summary</label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="e.g. Architectural double-faced outerwear silhouette."
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Editorial Description *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tailoring, craftsmanship, provenance, and drape..."
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Pricing & Lifecycle */}
        <div className="bg-white p-6 rounded-lg border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
            2. Retail Pricing & Catalog Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Base Price (₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="24500"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Original Price (₹)</label>
              <input
                type="number"
                min={0}
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="28000"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Sale Price (₹)</label>
              <input
                type="number"
                min={0}
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Leave blank if not on sale"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Catalog Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent"
              >
                <option value="active">Active (Visible)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: Visual Imagery */}
        <div className="bg-white p-6 rounded-lg border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">
              3. Visual High-Resolution Imagery
            </h2>
            <span className="text-[11px] text-slate-400">
              {images.length} image{images.length === 1 ? '' : 's'} staged
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Paste image URL (https://...)"
              className="flex-1 bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 focus:outline-none focus:border-admin-accent"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-4 py-2 bg-slate-800 text-white rounded font-medium hover:bg-slate-900 transition-colors"
            >
              Add URL
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative group rounded border border-slate-200 overflow-hidden bg-slate-100 aspect-3/4"
              >
                <img src={img} alt={`Asset ${idx + 1}`} className="w-full h-full object-cover" />
                {idx === 0 && (
                  <span className="absolute top-1 left-1 bg-admin-accent text-white px-1.5 py-0.5 rounded text-[9px] font-bold">
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute bottom-1 right-1 p-1 bg-rose-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: SKU Variants Matrix */}
        <div className="bg-white p-6 rounded-lg border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                4. SKU Variant Inventory Matrix
              </h2>
              <p className="text-[11px] text-slate-400">
                Configure size, color, stock allocations, and variant SKU codes.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleQuickAddSizes('Classic Black', '#111111')}
                className="px-2.5 py-1.5 border border-slate-200 rounded text-slate-700 hover:bg-slate-50 font-medium"
              >
                Quick Add XS–XL
              </button>
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-admin-accent hover:bg-admin-accent-hover text-white rounded font-medium"
              >
                <Plus size={13} />
                <span>Add Variant</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-2.5">SKU Code</th>
                  <th className="p-2.5">Size</th>
                  <th className="p-2.5">Color Name</th>
                  <th className="p-2.5">Color Hex</th>
                  <th className="p-2.5">Stock</th>
                  <th className="p-2.5">Price Override</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variants.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="p-2">
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                        placeholder={`${(slug || 'UC').toUpperCase().slice(0, 6)}-${v.size}`}
                        className="w-32 bg-slate-50 border border-slate-200 rounded p-1.5 font-mono text-slate-900"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={v.size}
                        onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded p-1.5 font-mono text-slate-900"
                      >
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', 'OS'].map(
                          (sz) => (
                            <option key={sz} value={sz}>
                              {sz}
                            </option>
                          )
                        )}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={v.color}
                        onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                        placeholder="e.g. Biscuit Beige"
                        className="w-28 bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-900"
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="color"
                          value={v.colorHex || '#111111'}
                          onChange={(e) => handleVariantChange(idx, 'colorHex', e.target.value)}
                          className="w-6 h-6 border-0 rounded cursor-pointer p-0"
                        />
                        <span className="font-mono text-[10px] text-slate-500">
                          {v.colorHex || '#111111'}
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={v.stock}
                        onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                        className="w-20 bg-slate-50 border border-slate-200 rounded p-1.5 font-mono text-slate-900"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={v.price}
                        onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                        placeholder={price || 'Default'}
                        className="w-24 bg-slate-50 border border-slate-200 rounded p-1.5 font-mono text-slate-900"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        disabled={variants.length === 1}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5: SEO Metadata */}
        <div className="bg-white p-6 rounded-lg border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
            5. SEO Search Engine Optimization
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Product Title — Urban Check Atelier"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Meta Description</label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Concise summary for Google search result snippets..."
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. cashmere, coat, bespoke, luxury outerwear"
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-900 focus:outline-none focus:border-admin-accent"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end items-center space-x-3 pt-4">
          <Link
            to="/products"
            className="px-5 py-2.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-1.5 px-6 py-2.5 bg-admin-accent hover:bg-admin-accent-hover text-white rounded font-medium shadow-xs disabled:opacity-50 transition-colors"
          >
            <Save size={15} />
            <span>{saving ? 'Registering Garment...' : 'Publish to Catalog'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
