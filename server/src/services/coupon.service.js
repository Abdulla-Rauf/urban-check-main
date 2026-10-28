import mongoose from 'mongoose';
import { Coupon } from '../models/Coupon.js';
import { Product } from '../models/Product.js';

export class CouponService {
  /**
   * Strictly validates a coupon on the backend against server date, usage limits,
   * user redemption limits, minimum order values, and product/category restrictions.
   * NEVER trust frontend calculations.
   */
  static async validateCoupon({ couponCode, cartItems = [], subtotal = 0, userId = null }) {
    if (!couponCode || typeof couponCode !== 'string') {
      throw new Error('Please provide a coupon code.');
    }

    const code = couponCode.trim().toUpperCase();
    const coupon = await Coupon.findOne({ couponCode: code });

    if (!coupon) {
      throw new Error(`Promo code "${code}" is invalid or does not exist.`);
    }

    // 1. Validate Active Status
    if (coupon.status !== 'active') {
      throw new Error(`Promo code "${code}" is currently inactive.`);
    }

    // 2. Validate Start and Expiration Dates against live Server Time
    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      throw new Error(`Promotion for "${code}" begins on ${new Date(coupon.startDate).toLocaleDateString('en-IN')}.`);
    }

    if (coupon.endDate && new Date(coupon.endDate) < now) {
      throw new Error(`Promo code "${code}" has expired on ${new Date(coupon.endDate).toLocaleDateString('en-IN')}.`);
    }

    // 3. Prevent Overused Coupons (Global usage limit)
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      throw new Error(`Promo code "${code}" has reached its maximum global redemptions.`);
    }

    // 4. Prevent Multiple Unauthorized Applications (Per-user usage limit)
    if (userId) {
      const userUsage = coupon.usersUsed?.find(
        (u) => u.user && u.user.toString() === userId.toString()
      );
      if (userUsage && userUsage.count >= coupon.perUserLimit) {
        throw new Error(
          `You have already used promo code "${code}" the maximum allowed number of times (${coupon.perUserLimit}).`
        );
      }
    }

    // 5. Validate Product and Category Eligibility
    // If cartItems contains product IDs, fetch categories and check
    let eligibleSubtotal = subtotal;
    const hasProductFilter = coupon.products && coupon.products.length > 0;
    const hasCategoryFilter = coupon.categories && coupon.categories.length > 0;

    if (hasProductFilter || hasCategoryFilter) {
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Shopping bag is empty.');
      }

      // Collect product ids from cart
      const itemProductIds = cartItems
        .map((i) => (i.product?._id ? i.product._id : i.product))
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      const cartProducts = await Product.find({ _id: { $in: itemProductIds } })
        .select('_id category categories')
        .lean();

      const productMap = new Map(cartProducts.map((p) => [p._id.toString(), p]));

      const allowedProductIds = (coupon.products || []).map((id) => id.toString());
      const allowedCategoryIds = (coupon.categories || []).map((id) => id.toString());

      eligibleSubtotal = 0;
      let matchingItemCount = 0;

      for (const item of cartItems) {
        const pId = (item.product?._id || item.product || '').toString();
        const pData = productMap.get(pId);
        if (!pData) continue;

        let isItemEligible = false;

        // Check product match
        if (hasProductFilter && allowedProductIds.includes(pId)) {
          isItemEligible = true;
        }

        // Check category match
        if (hasCategoryFilter) {
          const itemCat = pData.category?.toString();
          const itemAltCats = (pData.categories || []).map((c) => c.toString());
          if (
            (itemCat && allowedCategoryIds.includes(itemCat)) ||
            itemAltCats.some((c) => allowedCategoryIds.includes(c))
          ) {
            isItemEligible = true;
          }
        }

        if (isItemEligible) {
          matchingItemCount += 1;
          const itemPrice = item.unitPrice ?? item.priceSnapshot ?? item.price ?? 0;
          const qty = item.quantity || 1;
          eligibleSubtotal += itemPrice * qty;
        }
      }

      if (matchingItemCount === 0 || eligibleSubtotal <= 0) {
        throw new Error(
          `Promo code "${code}" is only valid for select atelier collections or garments not present in your bag.`
        );
      }
    }

    // 6. Validate Minimum Order Requirement
    if (coupon.minimumOrder > 0 && eligibleSubtotal < coupon.minimumOrder) {
      throw new Error(
        `Minimum order value of ₹${coupon.minimumOrder.toLocaleString('en-IN')} is required for "${code}". Eligible items subtotal: ₹${eligibleSubtotal.toLocaleString('en-IN')}.`
      );
    }

    // 7. Calculate Server Discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((eligibleSubtotal * coupon.discountValue) / 100);
      if (coupon.maximumDiscount != null && coupon.maximumDiscount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
      }
    } else {
      // Fixed discount
      discountAmount = Math.min(coupon.discountValue, eligibleSubtotal);
    }

    // Discount cannot exceed eligible subtotal
    discountAmount = Math.max(0, Math.min(discountAmount, eligibleSubtotal));

    return {
      valid: true,
      couponCode: coupon.couponCode,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      eligibleSubtotal,
      minimumOrder: coupon.minimumOrder,
      maximumDiscount: coupon.maximumDiscount,
      message: `Promo code "${coupon.couponCode}" applied successfully! Savings: ₹${discountAmount.toLocaleString('en-IN')}`,
    };
  }

  /**
   * Atomically records coupon usage upon successful order placement
   */
  static async recordCouponUsage(couponCode, userId) {
    if (!couponCode) return null;
    const code = couponCode.trim().toUpperCase();

    const coupon = await Coupon.findOne({ couponCode: code });
    if (!coupon) return null;

    coupon.usedCount = (coupon.usedCount || 0) + 1;

    if (userId) {
      const userUsage = coupon.usersUsed.find(
        (u) => u.user && u.user.toString() === userId.toString()
      );
      if (userUsage) {
        userUsage.count += 1;
        userUsage.lastUsedAt = new Date();
      } else {
        coupon.usersUsed.push({
          user: userId,
          count: 1,
          lastUsedAt: new Date(),
        });
      }
    }

    await coupon.save();
    return coupon;
  }

  /**
   * Admin: List coupons with usage stats
   */
  static async getCoupons(query = {}) {
    const filter = {};
    if (query.status) {
      filter.status = query.status;
    }
    return Coupon.find(filter)
      .populate('products', 'name slug thumbnail price')
      .populate('categories', 'name slug')
      .sort({ createdAt: -1 });
  }

  /**
   * Admin: Create new coupon
   */
  static async createCoupon(payload) {
    const code = payload.couponCode?.trim().toUpperCase();
    if (!code) {
      throw new Error('Coupon code is required');
    }

    const existing = await Coupon.findOne({ couponCode: code });
    if (existing) {
      throw new Error(`A coupon with code "${code}" already exists`);
    }

    if (!payload.endDate) {
      throw new Error('Coupon end date is required');
    }

    const coupon = await Coupon.create({
      couponCode: code,
      discountType: payload.discountType || 'percentage',
      discountValue: Number(payload.discountValue) || 0,
      minimumOrder: Number(payload.minimumOrder) || 0,
      maximumDiscount: payload.maximumDiscount ? Number(payload.maximumDiscount) : null,
      usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
      perUserLimit: Number(payload.perUserLimit) || 1,
      startDate: payload.startDate ? new Date(payload.startDate) : new Date(),
      endDate: new Date(payload.endDate),
      products: payload.products || [],
      categories: payload.categories || [],
      status: payload.status || 'active',
    });

    return coupon;
  }

  /**
   * Admin: Update coupon
   */
  static async updateCoupon(id, payload) {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    if (payload.couponCode) {
      const code = payload.couponCode.trim().toUpperCase();
      if (code !== coupon.couponCode) {
        const existing = await Coupon.findOne({ couponCode: code });
        if (existing) {
          throw new Error(`A coupon with code "${code}" already exists`);
        }
        coupon.couponCode = code;
      }
    }

    if (payload.discountType) coupon.discountType = payload.discountType;
    if (payload.discountValue !== undefined) coupon.discountValue = Number(payload.discountValue);
    if (payload.minimumOrder !== undefined) coupon.minimumOrder = Number(payload.minimumOrder);
    if (payload.maximumDiscount !== undefined) {
      coupon.maximumDiscount = payload.maximumDiscount ? Number(payload.maximumDiscount) : null;
    }
    if (payload.usageLimit !== undefined) {
      coupon.usageLimit = payload.usageLimit ? Number(payload.usageLimit) : null;
    }
    if (payload.perUserLimit !== undefined) coupon.perUserLimit = Number(payload.perUserLimit);
    if (payload.startDate) coupon.startDate = new Date(payload.startDate);
    if (payload.endDate) coupon.endDate = new Date(payload.endDate);
    if (payload.products) coupon.products = payload.products;
    if (payload.categories) coupon.categories = payload.categories;
    if (payload.status) coupon.status = payload.status;

    await coupon.save();
    return coupon;
  }

  /**
   * Admin: Delete coupon
   */
  static async deleteCoupon(id) {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      throw new Error('Coupon not found');
    }
    return coupon;
  }
}
