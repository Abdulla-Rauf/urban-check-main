import mongoose from 'mongoose';
import { Banner } from '../models/Banner.js';
import { Offer } from '../models/Offer.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { RedisService, CACHE_KEYS, CACHE_TTL } from './redis.service.js';
import { localStore } from '../utils/localStore.js';

export class MarketingService {
  /* =========================================================================
   * BANNERS
   * ========================================================================= */

  /**
   * Resolves target destination link based on targetType and targetId
   */
  static async resolveTargetUrl(targetType, targetId) {
    if (!targetType) return '/shop';
    const cleanId = (targetId || '').trim();

    switch (targetType) {
      case 'Product':
        if (cleanId) {
          if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
            if (mongoose.connection && mongoose.connection.readyState === 1) {
              try {
                const p = await Product.findById(cleanId).select('slug').lean();
                if (p?.slug) return `/products/${p.slug}`;
              } catch {}
            }
            const p = localStore.getCollection('products').find((item) => item.id === cleanId || item._id === cleanId);
            if (p?.slug) return `/products/${p.slug}`;
          }
          return `/products/${cleanId}`;
        }
        return '/shop';

      case 'Category':
        if (cleanId) {
          if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
            if (mongoose.connection && mongoose.connection.readyState === 1) {
              try {
                const c = await Category.findById(cleanId).select('slug').lean();
                if (c?.slug) return `/categories/${c.slug}`;
              } catch {}
            }
            const c = localStore.getCollection('categories').find((item) => item.id === cleanId || item._id === cleanId);
            if (c?.slug) return `/categories/${c.slug}`;
          }
          return `/categories/${cleanId.toLowerCase()}`;
        }
        return '/categories';

      case 'Brand':
        if (cleanId) {
          if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
            if (mongoose.connection && mongoose.connection.readyState === 1) {
              try {
                const b = await Brand.findById(cleanId).select('slug').lean();
                if (b?.slug) return `/brands/${b.slug}`;
              } catch {}
            }
            const b = localStore.getCollection('brands').find((item) => item.id === cleanId || item._id === cleanId);
            if (b?.slug) return `/brands/${b.slug}`;
          }
          return `/brands/${cleanId.toLowerCase()}`;
        }
        return '/brands';

      case 'Offer':
        return '/offers';

      case 'Page':
      default:
        if (!cleanId) return '/shop';
        return cleanId.startsWith('/') ? cleanId : `/${cleanId}`;
    }
  }

  /**
   * Enriches banners with full applicable product objects, brand logos/names, and calculated offer prices.
   */
  static enrichBannersWithDetails(banners = []) {
    if (!banners || banners.length === 0) return [];
    const localProducts = localStore.getCollection('products');
    const localBrands = localStore.getCollection('brands');

    return banners.map((banner) => {
      const b = banner.toObject ? banner.toObject() : { ...banner };
      const rawApplicable = Array.isArray(b.applicableProducts) ? b.applicableProducts : [];

      // Map: productId -> { discountPercentage, offerPrice }
      const applicableMap = new Map();
      rawApplicable.forEach((item) => {
        if (!item) return;
        if (typeof item === 'object') {
          const id = (item.productId || item.id || item._id || '').toString();
          if (id) {
            applicableMap.set(id, {
              discountPercentage: item.discountPercentage !== undefined && item.discountPercentage !== ''
                ? Number(item.discountPercentage)
                : (Number(b.discountPercentage) || 0),
              offerPrice: item.offerPrice != null && item.offerPrice !== '' ? Number(item.offerPrice) : null,
            });
          }
        } else if (typeof item === 'string') {
          applicableMap.set(item.toString(), {
            discountPercentage: Number(b.discountPercentage) || 0,
            offerPrice: b.offerPrice != null ? Number(b.offerPrice) : null,
          });
        }
      });

      // ONLY include products that were explicitly selected for this banner offer
      let items = [];
      if (applicableMap.size > 0) {
        items = localProducts.filter((p) => {
          const pId = (p.id || p._id || '').toString();
          const pSlug = (p.slug || '').toString();
          return applicableMap.has(pId) || applicableMap.has(pSlug);
        });
      }

      // Decorate each applicable product with its specific individual offer percentage & calculated price
      const decoratedItems = items.map((prod) => {
        const p = { ...prod };
        const pId = (p.id || p._id || '').toString();
        const pSlug = (p.slug || '').toString();
        const config = applicableMap.get(pId) || applicableMap.get(pSlug) || {
          discountPercentage: Number(b.discountPercentage) || 0,
          offerPrice: null,
        };

        const originalPrice = Number(p.price) || 0;
        const individualDiscount = Number(config.discountPercentage) || 0;
        let calculatedOfferPrice = originalPrice;

        if (config.offerPrice != null && Number(config.offerPrice) > 0) {
          calculatedOfferPrice = Number(config.offerPrice);
        } else if (individualDiscount > 0) {
          calculatedOfferPrice = Math.round(originalPrice * (1 - individualDiscount / 100));
        }

        // Resolve brand so client knows "which brand it is"
        let brandObj = p.brand;
        let brandName = p.brandName || 'Urban Check';
        if (typeof p.brand === 'string') {
          const foundBrand = localBrands.find((br) => (br.id || br._id) === p.brand || br.name === p.brand || br.slug === p.brand);
          if (foundBrand) {
            brandObj = {
              id: foundBrand.id || foundBrand._id,
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

        p.brand = brandObj;
        p.brandName = brandName;
        p.originalPrice = originalPrice;
        p.offerPrice = calculatedOfferPrice;
        p.discountPercentage = individualDiscount;
        p.activeOffer = {
          _id: b._id || b.id,
          title: b.title,
          badgeText: individualDiscount > 0 ? `${individualDiscount}% OFF` : (b.offerBadge || 'SPECIAL OFFER'),
          discount: individualDiscount,
          discountType: 'percentage',
          originalPrice: originalPrice,
          offerPrice: calculatedOfferPrice,
        };

        return p;
      });

      b.applicableProductItems = decoratedItems;
      return b;
    });
  }

  /**
   * Homepage dynamic banner retrieval with Redis caching (30 min TTL)
   */
  static async getActiveBanners() {
    const cacheKey = CACHE_KEYS.activeBanners();
    const cached = await RedisService.get(cacheKey);
    if (cached) return cached;

    let banners = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const now = new Date();
        banners = await Banner.find({
          status: 'Active',
          startDate: { $lte: now },
          $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }],
        })
          .sort({ displayOrder: 1, createdAt: -1 })
          .lean();
      } catch (err) {
        console.warn('MongoDB getActiveBanners fallback:', err.message);
      }
    }

    if (!banners) {
      banners = localStore.getCollection('banners')
        .filter((b) => b.status === 'Active')
        .sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
    }

    const enriched = this.enrichBannersWithDetails(banners);
    await RedisService.set(cacheKey, enriched, CACHE_TTL.BANNERS);
    return enriched;
  }

  /**
   * Admin: List all banners
   */
  static async getAllBanners() {
    let banners = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
      } catch (err) {
        console.warn('MongoDB getAllBanners fallback:', err.message);
      }
    }
    if (!banners) {
      banners = localStore.getCollection('banners').sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
    }
    return this.enrichBannersWithDetails(banners);
  }

  /**
   * Admin: Create banner
   */
  static async createBanner(payload) {
    const {
      title,
      subtitle,
      image,
      cta,
      targetType = 'Page',
      targetId,
      offerBadge,
      discountPercentage,
      offerPrice,
      offerPriceRange,
      applicableProducts,
      showOfferProducts = true,
      startDate,
      endDate,
      displayOrder,
      status = 'Active',
    } = payload;

    if (!title || !image) {
      throw new Error('Title and Image are required for marketing banner');
    }

    const targetUrl = await this.resolveTargetUrl(targetType, targetId);

    const bannerDoc = {
      title,
      subtitle: subtitle || '',
      image,
      cta: cta || 'Shop Collection',
      targetType,
      targetId: targetId || '',
      targetUrl,
      offerBadge: offerBadge || (discountPercentage ? `UP TO ${discountPercentage}% OFF` : ''),
      discountPercentage: Number(discountPercentage) || 0,
      offerPrice: offerPrice != null && offerPrice !== '' ? Number(offerPrice) : null,
      offerPriceRange: offerPriceRange || '',
      applicableProducts: Array.isArray(applicableProducts) ? applicableProducts : [],
      showOfferProducts: showOfferProducts !== false,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
      status,
    };

    let result = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const banner = await Banner.create(bannerDoc);
        result = banner.toObject();
      } catch (err) {
        console.warn('MongoDB createBanner fallback:', err.message);
      }
    }

    const localResult = localStore.saveItem('banners', result || bannerDoc);
    await RedisService.invalidateBannerCache();
    return localResult;
  }

  /**
   * Admin: Update banner
   */
  static async updateBanner(id, payload) {
    let result = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const banner = await Banner.findById(id);
        if (banner) {
          if (payload.title !== undefined) banner.title = payload.title;
          if (payload.subtitle !== undefined) banner.subtitle = payload.subtitle;
          if (payload.image !== undefined) banner.image = payload.image;
          if (payload.cta !== undefined) banner.cta = payload.cta;
          if (payload.targetType !== undefined) banner.targetType = payload.targetType;
          if (payload.targetId !== undefined) banner.targetId = payload.targetId;
          if (payload.offerBadge !== undefined) banner.offerBadge = payload.offerBadge;
          if (payload.discountPercentage !== undefined) banner.discountPercentage = Number(payload.discountPercentage);
          if (payload.offerPrice !== undefined) {
            banner.offerPrice = payload.offerPrice != null && payload.offerPrice !== '' ? Number(payload.offerPrice) : null;
          }
          if (payload.offerPriceRange !== undefined) banner.offerPriceRange = payload.offerPriceRange;
          if (payload.applicableProducts !== undefined) banner.applicableProducts = payload.applicableProducts;
          if (payload.showOfferProducts !== undefined) banner.showOfferProducts = payload.showOfferProducts;
          if (payload.startDate !== undefined) banner.startDate = new Date(payload.startDate);
          if (payload.endDate !== undefined) {
            banner.endDate = payload.endDate ? new Date(payload.endDate) : null;
          }
          if (payload.displayOrder !== undefined) banner.displayOrder = Number(payload.displayOrder);
          if (payload.status !== undefined) banner.status = payload.status;

          banner.targetUrl = await this.resolveTargetUrl(banner.targetType, banner.targetId);
          await banner.save();
          result = banner.toObject();
        }
      } catch (err) {
        console.warn('MongoDB updateBanner fallback:', err.message);
      }
    }

    const existing = localStore.getCollection('banners').find((b) => b.id === id || b._id === id);
    const targetUrl = await this.resolveTargetUrl(payload.targetType || existing?.targetType, payload.targetId || existing?.targetId);
    const localResult = localStore.saveItem('banners', {
      ...(existing || {}),
      ...payload,
      targetUrl,
      id,
      _id: id,
    });

    await RedisService.invalidateBannerCache();
    return result || localResult;
  }

  /**
   * Admin: Delete banner
   */
  static async deleteBanner(id) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Banner.findByIdAndDelete(id);
      } catch (err) {
        console.warn('MongoDB deleteBanner fallback:', err.message);
      }
    }

    localStore.deleteItem('banners', id);
    await RedisService.invalidateBannerCache();
    return { success: true, message: 'Banner removed' };
  }

  /* =========================================================================
   * PRODUCT OFFERS
   * ========================================================================= */

  /**
   * Retrieves active promotional offers based on current server date with Redis caching (10 min TTL).
   * Backend is the sole authority for whether an offer is active.
   */
  /**
   * Retrieves active promotional offers based on current server date with Redis caching (10 min TTL).
   * Backend is the sole authority for whether an offer is active.
   */
  static async getActiveOffers() {
    const cacheKey = CACHE_KEYS.activeOffers();
    const cached = await RedisService.get(cacheKey);
    if (cached) return cached;

    let offers = null;
    const now = new Date();

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        offers = await Offer.find({
          status: 'active',
          startDate: { $lte: now },
          endDate: { $gte: now },
        })
          .populate('applicableProducts', 'name slug thumbnail price')
          .populate('applicableCategories', 'name slug')
          .sort({ createdAt: -1 })
          .lean();
      } catch (err) {
        console.warn('MongoDB getActiveOffers fallback:', err.message);
      }
    }

    if (!offers) {
      offers = localStore.getCollection('offers').filter((o) => {
        if (o.status !== 'active') return false;
        const start = o.startDate ? new Date(o.startDate) : null;
        const end = o.endDate ? new Date(o.endDate) : null;
        if (start && start > now) return false;
        if (end && end < now) return false;
        return true;
      });
    }

    await RedisService.set(cacheKey, offers, CACHE_TTL.OFFERS);
    return offers;
  }

  /**
   * Admin: List all offers
   */
  static async getAllOffers() {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        return await Offer.find()
          .populate('applicableProducts', 'name slug thumbnail price')
          .populate('applicableCategories', 'name slug')
          .sort({ createdAt: -1 })
          .lean();
      } catch (err) {
        console.warn('MongoDB getAllOffers fallback:', err.message);
      }
    }
    return localStore.getCollection('offers');
  }

  /**
   * Admin: Create promotional offer
   */
  static async createOffer(payload) {
    const {
      title,
      description,
      bannerImage,
      offerPrice,
      discount,
      discountType = 'percentage',
      badgeText,
      startDate,
      endDate,
      applicableProducts = [],
      applicableCategories = [],
      status = 'active',
    } = payload;

    if (!title) {
      throw new Error('Offer title is required');
    }
    if (!endDate) {
      throw new Error('Offer end date is required');
    }

    const offerDoc = {
      title,
      description: description || '',
      bannerImage: bannerImage || '',
      offerPrice: offerPrice != null && offerPrice !== '' ? Number(offerPrice) : null,
      discount: Number(discount) || 0,
      discountType,
      badgeText: badgeText || (discount ? `${discount}% OFF` : 'SPECIAL OFFER'),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: new Date(endDate),
      applicableProducts,
      applicableCategories,
      status,
    };

    let result = null;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const offer = await Offer.create(offerDoc);
        result = offer.toObject();
      } catch (err) {
        console.warn('MongoDB createOffer fallback:', err.message);
      }
    }

    const localResult = localStore.saveItem('offers', result || offerDoc);
    await RedisService.invalidateOfferCache();
    return localResult;
  }

  /**
   * Admin: Update offer
   */
  static async updateOffer(id, payload) {
    let result = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const offer = await Offer.findById(id);
        if (offer) {
          if (payload.title !== undefined) offer.title = payload.title;
          if (payload.description !== undefined) offer.description = payload.description;
          if (payload.bannerImage !== undefined) offer.bannerImage = payload.bannerImage;
          if (payload.offerPrice !== undefined) {
            offer.offerPrice = payload.offerPrice != null && payload.offerPrice !== '' ? Number(payload.offerPrice) : null;
          }
          if (payload.discount !== undefined) offer.discount = Number(payload.discount);
          if (payload.discountType !== undefined) offer.discountType = payload.discountType;
          if (payload.badgeText !== undefined) offer.badgeText = payload.badgeText;
          if (payload.startDate !== undefined) offer.startDate = new Date(payload.startDate);
          if (payload.endDate !== undefined) offer.endDate = new Date(payload.endDate);
          if (payload.applicableProducts !== undefined) offer.applicableProducts = payload.applicableProducts;
          if (payload.applicableCategories !== undefined) offer.applicableCategories = payload.applicableCategories;
          if (payload.status !== undefined) offer.status = payload.status;

          await offer.save();
          result = offer.toObject();
        }
      } catch (err) {
        console.warn('MongoDB updateOffer fallback:', err.message);
      }
    }

    const existing = localStore.getCollection('offers').find((o) => o.id === id || o._id === id);
    const localResult = localStore.saveItem('offers', {
      ...(existing || {}),
      ...payload,
      id,
      _id: id,
    });

    await RedisService.invalidateOfferCache();
    return result || localResult;
  }

  /**
   * Admin: Delete offer
   */
  static async deleteOffer(id) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await Offer.findByIdAndDelete(id);
      } catch (err) {
        console.warn('MongoDB deleteOffer fallback:', err.message);
      }
    }

    localStore.deleteItem('offers', id);
    await RedisService.invalidateOfferCache();
    return { success: true, message: 'Offer removed' };
  }

  /**
   * Evaluates active offers and promotional banners on products and decorates them with verified server offers & badges.
   */
  static async decorateProductsWithOffers(products = []) {
    if (!products || products.length === 0) return products;

    const [activeOffers, activeBanners] = await Promise.all([
      this.getActiveOffers().catch(() => []),
      this.getActiveBanners().catch(() => []),
    ]);

    const hasOffers = activeOffers && activeOffers.length > 0;
    const hasBanners = activeBanners && activeBanners.length > 0;

    if (!hasOffers && !hasBanners) {
      return products.map((p) => {
        const doc = p.toObject ? p.toObject() : { ...p };
        doc.activeOffer = null;
        return doc;
      });
    }

    return products.map((product) => {
      const p = product.toObject ? product.toObject() : { ...product };
      const pId = (p._id || p.id || '').toString();
      const pSlug = p.slug || '';
      const catId = p.category?._id ? p.category._id.toString() : p.category?.toString() || '';

      let matchingOffer = null;

      // 1. Check active promotional offers
      if (hasOffers) {
        for (const offer of activeOffers) {
          const prodMatch = offer.applicableProducts?.some(
            (ap) => (ap._id || ap.id || ap).toString() === pId || (ap._id || ap.id || ap).toString() === pSlug
          );
          const catMatch = offer.applicableCategories?.some(
            (ac) => (ac._id || ac.id || ac).toString() === catId
          );
          const isGlobal = (!offer.applicableProducts || offer.applicableProducts.length === 0) &&
                           (!offer.applicableCategories || offer.applicableCategories.length === 0);

          if (prodMatch || catMatch || isGlobal) {
            matchingOffer = offer;
            break;
          }
        }
      }

      // 2. Check active promotional banners with applicable products and individual discounts
      if (hasBanners) {
        for (const banner of activeBanners) {
          const bProds = Array.isArray(banner.applicableProducts) ? banner.applicableProducts : [];
          if (bProds.length > 0) {
            let matchedConfig = null;
            for (const item of bProds) {
              const id = typeof item === 'object' ? (item.productId || item.id || item._id || '').toString() : item.toString();
              if (id === pId || id === pSlug) {
                const discount = typeof item === 'object' && item.discountPercentage !== undefined && item.discountPercentage !== ''
                  ? Number(item.discountPercentage)
                  : (Number(banner.discountPercentage) || 0);
                const offerPrice = typeof item === 'object' && item.offerPrice != null && item.offerPrice !== ''
                  ? Number(item.offerPrice)
                  : (banner.offerPrice != null && Number(banner.offerPrice) > 0 ? Number(banner.offerPrice) : null);
                matchedConfig = { discount, offerPrice };
                break;
              }
            }

            if (matchedConfig && (matchedConfig.discount > 0 || matchedConfig.offerPrice)) {
              const currentDiscount = Number(matchingOffer?.discount) || 0;
              if (!matchingOffer || matchedConfig.discount >= currentDiscount) {
                matchingOffer = {
                  _id: banner._id || banner.id,
                  title: banner.title,
                  badgeText: matchedConfig.discount > 0 ? `${matchedConfig.discount}% OFF` : (banner.offerBadge || 'SPECIAL OFFER'),
                  discount: matchedConfig.discount,
                  discountType: 'percentage',
                  offerPrice: matchedConfig.offerPrice,
                };
              }
              break;
            }
          }
        }
      }

      if (matchingOffer) {
        let calculatedOfferPrice = p.price;
        if (matchingOffer.offerPrice != null && matchingOffer.offerPrice > 0) {
          calculatedOfferPrice = matchingOffer.offerPrice;
        } else if (matchingOffer.discount > 0) {
          if (matchingOffer.discountType === 'percentage') {
            calculatedOfferPrice = Math.round(p.price - (p.price * matchingOffer.discount) / 100);
          } else {
            calculatedOfferPrice = Math.max(0, p.price - matchingOffer.discount);
          }
        }

        p.activeOffer = {
          _id: matchingOffer._id,
          title: matchingOffer.title,
          badgeText: matchingOffer.badgeText || 'SPECIAL OFFER',
          discount: matchingOffer.discount,
          discountType: matchingOffer.discountType,
          originalPrice: p.price,
          offerPrice: calculatedOfferPrice,
        };
      } else {
        p.activeOffer = null;
      }

      return p;
    });
  }
}
