import crypto from 'crypto';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { RedisService } from './redis.service.js';
import { MarketingService } from './marketing.service.js';
import { localStore } from '../utils/localStore.js';

export class ProductService {
  /**
   * Builds query filter object from request parameters
   */
  static async buildQueryFilter(params) {
    const query = { status: 'active' };

    // 1. Category (matches slug or id, or descendant categories)
    if (params.category) {
      const catParam = params.category.trim();
      const matchedCategory = await Category.findOne({
        $or: [{ slug: catParam.toLowerCase() }, { name: new RegExp(`^${catParam}$`, 'i') }],
      });

      if (matchedCategory) {
        // Find all descendants of this category
        const subCats = await Category.find({ parent: matchedCategory._id });
        const allCatIds = [matchedCategory._id, ...subCats.map((c) => c._id)];
        query.$or = [{ category: { $in: allCatIds } }, { categories: { $in: allCatIds } }];
      }
    }

    // 2. Brand (matches slug or name)
    if (params.brand) {
      const brandParam = params.brand.trim();
      const matchedBrand = await Brand.findOne({
        $or: [{ slug: brandParam.toLowerCase() }, { name: new RegExp(`^${brandParam}$`, 'i') }],
      });

      if (matchedBrand) {
        query.brand = matchedBrand._id;
      }
    }

    // 3. Gender
    if (params.gender) {
      const genderVal = params.gender.trim();
      if (genderVal.toLowerCase() === 'all') {
        // No filter
      } else {
        query.$and = query.$and || [];
        query.$and.push({
          $or: [{ gender: new RegExp(`^${genderVal}$`, 'i') }, { gender: 'Unisex' }],
        });
      }
    }

    // 4. Size (matches embedded variant sizes)
    if (params.size) {
      const sizes = Array.isArray(params.size) ? params.size : params.size.split(',');
      query['variants.size'] = { $in: sizes.map((s) => s.trim()) };
    }

    // 5. Color (matches embedded variant colors)
    if (params.color) {
      const colors = Array.isArray(params.color) ? params.color : params.color.split(',');
      query['variants.color'] = {
        $in: colors.map((c) => new RegExp(`^${c.trim()}$`, 'i')),
      };
    }

    // 6. Price Range
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      query.price = {};
      if (params.minPrice !== undefined && params.minPrice !== '') {
        query.price.$gte = Number(params.minPrice);
      }
      if (params.maxPrice !== undefined && params.maxPrice !== '') {
        query.price.$lte = Number(params.maxPrice);
      }
    }

    // 7. Rating
    if (params.rating) {
      query.rating = { $gte: Number(params.rating) };
    }

    // 8. Availability
    if (params.availability === 'true' || params.inStock === 'true' || params.inStockOnly === 'true') {
      query.inStock = true;
    }

    // 9. Quick Boolean Flags
    if (params.newArrival === 'true' || params.isNewArrival === 'true') {
      query.newArrival = true;
    }

    if (params.featured === 'true' || params.isFeatured === 'true') {
      query.featured = true;
    }

    if (params.isOffer === 'true' || params.offers === 'true') {
      query.discountPercent = { $gt: 0 };
    }

    // 10. Multi-Field Search (name, description, tags, brand name, SKU)
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      const searchRegex = new RegExp(searchTerm, 'i');

      // Also search if brand matches term
      const matchingBrands = await Brand.find({ name: searchRegex }).select('_id');
      const brandIds = matchingBrands.map((b) => b._id);

      const searchConditions = [
        { name: searchRegex },
        { tags: searchRegex },
        { shortDescription: searchRegex },
        { description: searchRegex },
        { 'variants.sku': searchRegex },
      ];

      if (brandIds.length > 0) {
        searchConditions.push({ brand: { $in: brandIds } });
      }

      if (query.$or) {
        query.$and = query.$and || [];
        query.$and.push({ $or: searchConditions });
      } else {
        query.$or = searchConditions;
      }
    }

    return query;
  }

  /**
   * Builds sort specification
   */
  static buildSortOption(sortKey) {
    switch (sortKey) {
      case 'newest':
        return { createdAt: -1 };
      case 'price_asc':
        return { price: 1 };
      case 'price_desc':
        return { price: -1 };
      case 'popularity':
        return { popularity: -1, rating: -1 };
      case 'rating':
        return { rating: -1 };
      case 'featured':
      default:
        return { featured: -1, popularity: -1, _id: -1 };
    }
  }

  /**
   * Resolves brand and category objects for products when stored as IDs or strings
   */
  static resolveProductBrandAndCategory(product) {
    if (!product) return product;
    const p = { ...(product.toObject ? product.toObject() : product) };
    const brands = localStore.getCollection('brands');
    const categories = localStore.getCollection('categories');

    // Resolve Brand
    let brandObj = p.brand;
    let brandName = p.brandName;
    if (typeof p.brand === 'string') {
      const foundBrand = brands.find(
        (b) => (b.id || b._id) === p.brand || b.slug === p.brand || b.name?.toLowerCase() === p.brand.toLowerCase()
      );
      if (foundBrand) {
        brandObj = {
          id: foundBrand.id || foundBrand._id,
          _id: foundBrand.id || foundBrand._id,
          name: foundBrand.name,
          slug: foundBrand.slug,
          logo: foundBrand.logo || foundBrand.image || '',
          image: foundBrand.logo || foundBrand.image || '',
        };
        brandName = foundBrand.name;
      } else {
        brandName = p.brand;
        brandObj = { name: p.brand };
      }
    } else if (p.brand && typeof p.brand === 'object') {
      brandName = p.brand.name || brandName;
      brandObj = p.brand;
    }

    // Resolve Category
    let categoryName = p.categoryName;
    if (typeof p.category === 'string') {
      const foundCat = categories.find(
        (c) => (c.id || c._id) === p.category || c.slug === p.category || c.name?.toLowerCase() === p.category.toLowerCase()
      );
      if (foundCat) {
        categoryName = foundCat.name;
      } else {
        categoryName = p.category;
      }
    } else if (p.category && typeof p.category === 'object') {
      categoryName = p.category.name || categoryName;
    }

    p.brand = brandObj;
    p.brandName = brandName || 'Urban Check';
    p.categoryName = categoryName || 'General';
    return p;
  }

  /**
   * Queries products with server-side filtering, sorting, pagination, and Redis caching
   */
  static async getProducts(params = {}) {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 12));
    const skip = (page - 1) * limit;

    // Cache key hash
    const queryHash = crypto
      .createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex');
    const cacheKey = `uc:products:list:${queryHash}`;

    // Check Redis Cache
    const cachedData = await RedisService.get(cacheKey);
    if (cachedData) {
      return { ...cachedData, fromCache: true };
    }

    let products = null;
    let total = 0;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const filterQuery = await this.buildQueryFilter(params);
        const sortOption = this.buildSortOption(params.sort);

        [products, total] = await Promise.all([
          Product.find(filterQuery)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .populate('brand', 'name slug logo')
            .populate('category', 'name slug parent')
            .lean(),
          Product.countDocuments(filterQuery),
        ]);
      } catch (err) {
        console.warn('MongoDB getProducts fallback:', err.message);
        products = null;
      }
    }

    if (!products) {
      let all = localStore.getCollection('products').filter((p) => p.status === 'active');

      if (params.newArrival === 'true' || params.isNewArrival === 'true' || params.newArrival === true) {
        all = all.filter((p) => p.newArrival || p.isNewArrival);
      }
      if (params.featured === 'true' || params.isFeatured === 'true' || params.featured === true) {
        all = all.filter((p) => p.featured || p.isFeatured);
      }
      if (params.isOffer === 'true' || params.offers === 'true' || params.isOffer === true) {
        all = all.filter((p) => (p.discountPercent || 0) > 0);
      }
      if (params.gender && params.gender !== 'all') {
        const g = params.gender.toLowerCase();
        all = all.filter((p) => !p.gender || p.gender.toLowerCase() === g || p.gender.toLowerCase() === 'unisex');
      }
      if (params.category) {
        const catList = Array.isArray(params.category) ? params.category : [params.category];
        all = all.filter((p) =>
          catList.some((c) =>
            (p.category && p.category.toString() === c) ||
            (p.categoryName && p.categoryName.toLowerCase() === c.toLowerCase()) ||
            (p.categorySlug && p.categorySlug.toLowerCase() === c.toLowerCase())
          )
        );
      }
      if (params.brand) {
        const brandList = Array.isArray(params.brand) ? params.brand : [params.brand];
        all = all.filter((p) =>
          brandList.some((b) =>
            (p.brand && p.brand.toString() === b) ||
            (p.brandName && p.brandName.toLowerCase() === b.toLowerCase())
          )
        );
      }
      if (params.search && params.search.trim()) {
        const q = params.search.trim().toLowerCase();
        all = all.filter((p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.tags && Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q))) ||
          (p.variants && Array.isArray(p.variants) && p.variants.some((v) => v.sku && v.sku.toLowerCase().includes(q)))
        );
      }

      total = all.length;
      products = all.slice(skip, skip + limit);
    }

    const totalPages = Math.ceil(total / limit) || 1;

    // Format products for consumer consumption with resolved brands and categories
    const formattedProducts = products.map((raw) => {
      const p = this.resolveProductBrandAndCategory(raw);
      return {
        ...p,
        id: p._id || p.id,
        colors: Array.from(
          new Map(
            (p.variants || []).map((v) => [v.color, { name: v.color, hex: v.colorHex || '#111111' }])
          ).values()
        ),
        sizes: Array.from(new Set((p.variants || []).map((v) => v.size))),
      };
    });

    const decoratedProducts = await MarketingService.decorateProductsWithOffers(formattedProducts);

    const responsePayload = {
      products: decoratedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };

    // Cache in Redis with 10 minute TTL
    await RedisService.set(cacheKey, responsePayload, 600);

    return responsePayload;
  }

  /**
   * Retrieves single product by slug with caching (30 min TTL)
   */
  static async getProductBySlug(slug) {
    if (!slug) return null;

    const cacheKey = `uc:products:detail:${slug.toLowerCase()}`;
    const cachedProduct = await RedisService.get(cacheKey);
    if (cachedProduct) {
      return { ...cachedProduct, fromCache: true };
    }

    let product = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        product = await Product.findOne({
          slug: slug.toLowerCase(),
          status: 'active',
        })
          .populate('brand', 'name slug logo description')
          .populate('category', 'name slug parent ancestors')
          .lean();
      } catch (err) {
        console.warn('MongoDB getProductBySlug fallback:', err.message);
      }
    }

    if (!product) {
      const all = localStore.getCollection('products');
      product = all.find(
        (p) =>
          p.status === 'active' &&
          (p.slug?.toLowerCase() === slug.toLowerCase() || p.id === slug || p._id === slug)
      );
    }

    if (!product) return null;

    const resolved = this.resolveProductBrandAndCategory(product);
    const formatted = {
      ...resolved,
      id: resolved._id || resolved.id,
      colors: Array.from(
        new Map(
          (resolved.variants || []).map((v) => [v.color, { name: v.color, hex: v.colorHex || '#111111' }])
        ).values()
      ),
      sizes: Array.from(new Set((resolved.variants || []).map((v) => v.size))),
    };

    const [decorated] = await MarketingService.decorateProductsWithOffers([formatted]);
    const finalProduct = decorated || formatted;

    // Cache in Redis with 30 minute TTL
    await RedisService.set(cacheKey, finalProduct, 1800);

    return finalProduct;
  }

  /**
   * Retrieves popular products with Redis caching (15 min TTL)
   */
  static async getPopularProducts(limit = 8) {
    const take = Math.min(24, Math.max(1, parseInt(limit, 10) || 8));
    const cacheKey = `uc:products:popular:${take}`;

    const cached = await RedisService.get(cacheKey);
    if (cached) return { products: cached, fromCache: true };

    let products = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        products = await Product.find({ status: 'active' })
          .sort({ featured: -1, rating: -1, popularity: -1 })
          .limit(take)
          .populate('brand', 'name slug')
          .populate('category', 'name slug')
          .lean();
      } catch (err) {
        console.warn('MongoDB getPopularProducts fallback:', err.message);
      }
    }

    if (!products) {
      const all = localStore.getCollection('products').filter((p) => p.status === 'active');
      products = all.slice(0, take);
    }

    const formatted = products.map((p) => ({
      ...p,
      id: p._id || p.id,
      brandName: p.brand?.name || p.brandName || 'Urban Check',
      categoryName: p.category?.name || p.categoryName || 'General',
    }));

    const decorated = await MarketingService.decorateProductsWithOffers(formatted);

    await RedisService.set(cacheKey, decorated, 900); // 15 mins
    return { products: decorated, fromCache: false };
  }

  /**
   * Retrieves trending products with Redis caching (15 min TTL)
   */
  static async getTrendingProducts(limit = 8) {
    const take = Math.min(24, Math.max(1, parseInt(limit, 10) || 8));
    const cacheKey = `uc:products:trending:${take}`;

    const cached = await RedisService.get(cacheKey);
    if (cached) return { products: cached, fromCache: true };

    let products = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        products = await Product.find({ status: 'active' })
          .sort({ popularity: -1, createdAt: -1 })
          .limit(take)
          .populate('brand', 'name slug')
          .populate('category', 'name slug')
          .lean();
      } catch (err) {
        console.warn('MongoDB getTrendingProducts fallback:', err.message);
      }
    }

    if (!products) {
      const all = localStore.getCollection('products').filter((p) => p.status === 'active');
      products = all.slice(0, take);
    }

    const formatted = products.map((p) => ({
      ...p,
      id: p._id || p.id,
      brandName: p.brand?.name || p.brandName || 'Urban Check',
      categoryName: p.category?.name || p.categoryName || 'General',
    }));

    const decorated = await MarketingService.decorateProductsWithOffers(formatted);

    await RedisService.set(cacheKey, decorated, 900); // 15 mins
    return { products: decorated, fromCache: false };
  }

  /**
   * Retrieves fast search suggestions with Redis caching (10 min TTL)
   */
  static async getSearchSuggestions(query = '', limit = 5) {
    const cleanQuery = String(query || '').trim().toLowerCase();
    if (!cleanQuery) return { suggestions: [] };

    const take = Math.min(10, Math.max(1, parseInt(limit, 10) || 5));
    const cacheKey = `uc:search:suggest:${cleanQuery}:${take}`;

    const cached = await RedisService.get(cacheKey);
    if (cached) return { suggestions: cached, fromCache: true };

    let products = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const regex = new RegExp(cleanQuery, 'i');
        products = await Product.find({
          status: 'active',
          $or: [{ name: regex }, { tags: regex }, { 'variants.sku': regex }],
        })
          .select('name slug thumbnail price brand category')
          .populate('brand', 'name')
          .limit(take)
          .lean();
      } catch (err) {
        console.warn('MongoDB getSearchSuggestions fallback:', err.message);
      }
    }

    if (!products) {
      const all = localStore.getCollection('products').filter((p) => p.status === 'active');
      products = all.filter((p) =>
        (p.name && p.name.toLowerCase().includes(cleanQuery)) ||
        (p.tags && Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(cleanQuery)))
      ).slice(0, take);
    }

    const suggestions = products.map((p) => ({
      id: p._id || p.id,
      name: p.name,
      slug: p.slug,
      thumbnail: p.thumbnail,
      price: p.price,
      brand: p.brand?.name || p.brandName || 'Urban Check',
    }));

    await RedisService.set(cacheKey, suggestions, 600); // 10 mins
    return { suggestions, fromCache: false };
  }

  /**
   * Retrieves unified aggregate Homepage data with Redis caching (5 min TTL)
   */
  static async getHomepageData() {
    const cacheKey = 'uc:homepage';
    const cached = await RedisService.get(cacheKey);
    if (cached) return { ...cached, fromCache: true };

    const [banners, newArrivalsRes, trendingRes, popularRes] = await Promise.all([
      MarketingService.getActiveBanners(),
      this.getProducts({ newArrival: true, limit: 4 }),
      this.getTrendingProducts(4),
      this.getPopularProducts(4),
    ]);

    const payload = {
      heroBanner: banners[0] || null,
      banners: banners || [],
      newArrivals: newArrivalsRes?.products || [],
      trendingProducts: trendingRes?.products || [],
      popularProducts: popularRes?.products || [],
      timestamp: new Date().toISOString(),
    };

    await RedisService.set(cacheKey, payload, 300); // 5 mins
    return { ...payload, fromCache: false };
  }

  /**
   * Admin: Create product
   */
  static async createProduct(productData) {
    const product = new Product(productData);
    await product.save();
    await RedisService.invalidateProductCache(product._id, product.slug);
    return product;
  }

  /**
   * Admin: Update product
   */
  static async updateProduct(id, updateData) {
    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    await RedisService.invalidateProductCache(product._id, product.slug);
    return product;
  }

  /**
   * Admin: Delete product
   */
  static async deleteProduct(id) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    await RedisService.invalidateProductCache(product._id, product.slug);
    return { success: true, message: 'Product successfully removed' };
  }
}
