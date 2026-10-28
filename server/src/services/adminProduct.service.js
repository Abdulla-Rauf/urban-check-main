import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { InventoryLedger } from '../models/InventoryLedger.js';
import { RedisService } from './redis.service.js';
import { localStore } from '../utils/localStore.js';

export class AdminProductService {
  /**
   * Retrieves paginated products with search and category filters
   */
  static async getProducts({
    page = 1,
    limit = 15,
    search = '',
    category,
    brand,
    gender,
    status,
    sort = '-createdAt',
  } = {}) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.max(1, parseInt(limit, 10));

    let products = null;
    let total = 0;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const query = {};

        if (status && status !== 'all') {
          query.status = status;
        } else {
          query.status = { $ne: 'archived' };
        }

        if (gender && gender !== 'all') {
          query.gender = gender;
        }

        if (category && category !== 'all') {
          query.category = category;
        }

        if (brand && brand !== 'all') {
          query.brand = brand;
        }

        if (search && search.trim()) {
          const regex = new RegExp(search.trim(), 'i');
          query.$or = [
            { name: regex },
            { description: regex },
            { tags: regex },
            { 'variants.sku': regex },
          ];
        }

        [products, total] = await Promise.all([
          Product.find(query)
            .populate('brand', 'name slug')
            .populate('category', 'name slug')
            .sort(sort)
            .skip(skip)
            .limit(take)
            .lean(),
          Product.countDocuments(query),
        ]);
      } catch (dbErr) {
        console.warn('MongoDB admin product query failed, using local store:', dbErr.message);
        products = null;
      }
    }

    if (!products) {
      // Local store query
      let all = localStore.getCollection('products');

      if (status && status !== 'all') {
        all = all.filter((p) => p.status === status);
      } else {
        all = all.filter((p) => p.status !== 'archived');
      }

      if (gender && gender !== 'all') {
        all = all.filter((p) => p.gender && p.gender.toLowerCase() === gender.toLowerCase());
      }

      if (category && category !== 'all') {
        all = all.filter((p) => p.category === category || p.categoryId === category);
      }

      if (brand && brand !== 'all') {
        all = all.filter((p) => p.brand === brand || p.brandId === brand);
      }

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        all = all.filter((p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.tags && Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q))) ||
          (p.variants && Array.isArray(p.variants) && p.variants.some((v) => v.sku && v.sku.toLowerCase().includes(q)))
        );
      }

      total = all.length;
      products = all.slice(skip, skip + take);
    }

    const localBrands = localStore.getCollection('brands');
    const localCategories = localStore.getCollection('categories');

    const formatted = products.map((p) => {
      const totalStock = (p.variants || []).reduce((acc, v) => acc + (v.stock ?? 0), 0);
      const lowStockVariants = (p.variants || []).filter(
        (v) => (v.stock ?? 0) <= 5 && (v.stock ?? 0) > 0
      );

      const bId = p.brand?._id || p.brandId || (typeof p.brand === 'string' ? p.brand : '');
      const matchedBrand = localBrands.find((b) => b.id === bId || b._id === bId || b.name === bId);
      const brandName = p.brand?.name || matchedBrand?.name || (typeof p.brand === 'string' && !p.brand.startsWith('item_') ? p.brand : 'Urban Check Atelier');

      const cId = p.category?._id || p.categoryId || (typeof p.category === 'string' ? p.category : '');
      const matchedCategory = localCategories.find((c) => c.id === cId || c._id === cId || c.name === cId);
      const categoryName = p.category?.name || matchedCategory?.name || (typeof p.category === 'string' && !p.category.startsWith('item_') ? p.category : 'Apparel');

      return {
        id: p._id || p.id,
        _id: p._id || p.id,
        name: p.name,
        slug: p.slug,
        thumbnail: p.thumbnail || p.images?.[0] || '',
        images: p.images || [],
        brand: brandName,
        brandId: bId,
        category: categoryName,
        categoryId: cId,
        price: p.price,
        formattedPrice: '₹' + (Number(p.price) || 0).toLocaleString('en-IN'),
        originalPrice: p.originalPrice || 0,
        discountPercent: p.discountPercent || 0,
        gender: p.gender,
        material: p.material || '',
        tags: p.tags || [],
        status: p.status,
        variantsCount: p.variants?.length || 0,
        variants: p.variants || [],
        totalStock,
        isLowStock: lowStockVariants.length > 0,
        createdAt: p.createdAt,
      };
    });

    return {
      items: formatted,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / take) || 1,
      limit: take,
    };
  }

  /**
   * Retrieves single product by ID or slug
   */
  static async getProductById(id) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
        const query = isObjectId ? { _id: id } : { slug: id };

        const product = await Product.findOne(query)
          .populate('brand')
          .populate('category')
          .lean();

        if (product) return product;
      } catch (err) {
        console.warn('MongoDB getProductById fallback:', err.message);
      }
    }

    const localList = localStore.getCollection('products');
    const localProduct = localList.find((p) => p.id === id || p._id === id || p.slug === id);
    if (!localProduct) {
      throw new Error(`Product ${id} not found.`);
    }

    return localProduct;
  }

  /**
   * Generates a unique slug from product name
   */
  static async generateSlug(name) {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;

    const checkExists = async (testSlug) => {
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          const found = await Product.findOne({ slug: testSlug });
          if (found) return true;
        } catch {
          // fallback
        }
      }
      const localList = localStore.getCollection('products');
      return localList.some((p) => p.slug === testSlug);
    };

    while (await checkExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    return slug;
  }

  /**
   * Creates a new fashion product with variants and logs initial stock
   */
  static async createProduct(data, adminName = 'Super Admin') {
    if (!data.name) throw new Error('Product name is required');
    if (!data.brand) throw new Error('Brand is required');
    if (!data.category) throw new Error('Category is required');
    if (data.price === undefined || data.price === '') throw new Error('Price is required');

    const slug = data.slug ? data.slug.toLowerCase().trim() : await this.generateSlug(data.name);

    // Format variants
    const rawVariants = data.variants && data.variants.length > 0 ? data.variants : [];
    const formattedVariants = rawVariants.map((v, idx) => ({
      sku: (v.sku || `${slug.toUpperCase().slice(0, 8)}-V${idx + 1}`).toUpperCase().trim(),
      size: v.size || 'M',
      color: v.color || 'Default',
      colorHex: v.colorHex || '#111111',
      price: Number(v.price || data.price),
      salePrice: v.salePrice ? Number(v.salePrice) : null,
      stock: Math.max(0, parseInt(v.stock, 10) || 0),
      images: v.images || [],
      status: v.status || 'active',
    }));

    if (formattedVariants.length === 0) {
      formattedVariants.push({
        sku: `${slug.toUpperCase().slice(0, 8)}-M-BLK`,
        size: 'M',
        color: 'Classic Black',
        colorHex: '#111111',
        price: Number(data.price),
        salePrice: data.salePrice ? Number(data.salePrice) : null,
        stock: Math.max(0, parseInt(data.stock, 10) || 10),
        images: data.images || [],
        status: 'active',
      });
    }

    const images = Array.isArray(data.images) && data.images.length > 0
      ? data.images.filter(Boolean)
      : ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=85'];

    const productPayload = {
      name: data.name.trim(),
      slug,
      description: data.description || 'Mastercrafted garment from the Urban Check atelier.',
      shortDescription: data.shortDescription || '',
      brand: data.brand,
      category: data.category,
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : 0,
      discountPercent: data.discountPercent ? Number(data.discountPercent) : 0,
      gender: data.gender || 'Unisex',
      material: data.material || '',
      tags: Array.isArray(data.tags)
        ? data.tags
        : typeof data.tags === 'string'
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      images,
      thumbnail: data.thumbnail || images[0] || '',
      status: data.status || 'active',
      inStock: formattedVariants.some((v) => v.stock > 0),
      variants: formattedVariants,
      seo: {
        metaTitle: data.seo?.metaTitle || data.name,
        metaDescription: data.seo?.metaDescription || data.shortDescription || data.description?.slice(0, 160) || '',
        keywords: Array.isArray(data.seo?.keywords)
          ? data.seo.keywords
          : typeof data.seo?.keywords === 'string'
          ? data.seo.keywords.split(',').map((k) => k.trim()).filter(Boolean)
          : [],
      },
    };

    let saved = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const newProduct = new Product(productPayload);
        saved = await newProduct.save();

        for (const v of formattedVariants) {
          if (v.stock > 0) {
            try {
              await InventoryLedger.create({
                sku: v.sku,
                product: saved._id,
                productName: saved.name,
                transaction: 'Initial Seed',
                quantity: v.stock,
                previousStock: 0,
                newStock: v.stock,
                reference: 'Catalog Initialization',
                admin: adminName,
                note: `Initial stock for ${saved.name} (${v.size}/${v.color})`,
              });
            } catch (ledgerErr) {
              console.error('Ledger write error:', ledgerErr.message);
            }
          }
        }
      } catch (dbErr) {
        console.warn('MongoDB product create fallback:', dbErr.message);
      }
    }

    // Always mirror to local store for offline/reconnection guarantee
    const localSaved = localStore.saveItem('products', saved ? saved.toObject() : productPayload);

    await RedisService.invalidateProductCache(localSaved._id || localSaved.id, localSaved.slug);
    return localSaved;
  }

  /**
   * Updates an existing product
   */
  static async updateProduct(id, data, adminName = 'Super Admin') {
    let updated = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const product = await Product.findById(id);
        if (product) {
          if (data.name) product.name = data.name.trim();
          if (data.description !== undefined) product.description = data.description;
          if (data.shortDescription !== undefined) product.shortDescription = data.shortDescription;
          if (data.brand) product.brand = data.brand;
          if (data.category) product.category = data.category;
          if (data.price !== undefined) product.price = Number(data.price);
          if (data.originalPrice !== undefined) product.originalPrice = Number(data.originalPrice);
          if (data.discountPercent !== undefined) product.discountPercent = Number(data.discountPercent);
          if (data.gender) product.gender = data.gender;
          if (data.material !== undefined) product.material = data.material;
          if (data.status) product.status = data.status;

          if (data.tags !== undefined) {
            product.tags = Array.isArray(data.tags)
              ? data.tags
              : typeof data.tags === 'string'
              ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
              : [];
          }

          if (Array.isArray(data.images) && data.images.length > 0) {
            product.images = data.images.filter(Boolean);
            product.thumbnail = data.thumbnail || product.images[0] || '';
          }

          if (Array.isArray(data.variants)) {
            product.variants = data.variants.map((v, idx) => ({
              sku: (v.sku || `${product.slug.toUpperCase().slice(0, 8)}-V${idx + 1}`).toUpperCase().trim(),
              size: v.size || 'M',
              color: v.color || 'Classic Black',
              colorHex: v.colorHex || '#111111',
              price: Number(v.price || product.price),
              salePrice: v.salePrice ? Number(v.salePrice) : null,
              stock: Math.max(0, parseInt(v.stock, 10) || 0),
              images: v.images || [],
              status: v.status || 'active',
            }));
          }

          product.inStock = product.variants.some((v) => (v.stock ?? 0) > 0);
          await product.save();
          updated = product.toObject();
        }
      } catch (dbErr) {
        console.warn('MongoDB product update fallback:', dbErr.message);
      }
    }

    const localList = localStore.getCollection('products');
    const existing = localList.find((p) => p.id === id || p._id === id);
    const merged = { ...(existing || {}), ...data, id, _id: id };
    const localResult = localStore.saveItem('products', updated || merged);

    await RedisService.invalidateProductCache(id, localResult.slug);
    return localResult;
  }

  /**
   * Toggles product status between active, draft, and archived
   */
  static async toggleProductStatus(id, newStatus) {
    const valid = ['active', 'draft', 'archived'];
    if (!valid.includes(newStatus)) throw new Error('Invalid product status.');

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Product.findByIdAndUpdate(id, { status: newStatus });
      } catch (err) {
        console.warn('MongoDB toggle status fallback:', err.message);
      }
    }

    const localList = localStore.getCollection('products');
    const existing = localList.find((p) => p.id === id || p._id === id);
    if (existing) {
      localStore.saveItem('products', { ...existing, status: newStatus });
    }

    await RedisService.invalidateProductCache(id, existing?.slug);
    return { id, status: newStatus };
  }

  /**
   * Archives (soft-deletes) product
   */
  static async archiveProduct(id) {
    return this.toggleProductStatus(id, 'archived');
  }
}

