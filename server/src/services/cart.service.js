import mongoose from 'mongoose';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { CouponService } from './coupon.service.js';

export class CartService {
  /**
   * Recalculates cart items against live database records.
   * NEVER trusts frontend prices. Validates coupons strictly server-side.
   */
  static async recalculateCartItems(rawItems = [], couponCode = null, userId = null) {
    if (!rawItems || rawItems.length === 0) {
      return {
        items: [],
        totals: {
          subtotal: 0,
          discount: 0,
          couponCode: '',
          couponDiscount: 0,
          couponError: null,
          appliedCoupon: null,
          shipping: 0,
          tax: 0,
          grandTotal: 0,
          totalItems: 0,
          hasUnavailableItems: false,
        },
      };
    }

    // Extract product IDs
    const productIds = rawItems
      .map((item) => (item.product?._id ? item.product._id : item.product))
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const products = await Product.find({ _id: { $in: productIds } })
      .populate('brand', 'name slug')
      .populate('category', 'name slug')
      .lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const processedItems = [];
    let subtotal = 0;
    let discount = 0;
    let totalItems = 0;
    let hasUnavailableItems = false;

    for (const item of rawItems) {
      const pId = (item.product?._id || item.product || '').toString();
      const product = productMap.get(pId);

      const requestedSku = item.variant?.sku;
      const requestedSize = item.variant?.size;
      const requestedColor = item.variant?.color;
      let requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);

      // Check product existence and status
      if (!product || product.status !== 'active') {
        hasUnavailableItems = true;
        processedItems.push({
          _id: item._id,
          product: {
            _id: pId,
            name: product?.name || 'Garment',
            slug: product?.slug || '',
            thumbnail: product?.thumbnail || product?.images?.[0] || '',
          },
          variant: {
            sku: requestedSku || 'UNKNOWN',
            size: requestedSize || 'M',
            color: requestedColor || 'Standard',
          },
          quantity: requestedQty,
          priceSnapshot: item.priceSnapshot || 0,
          unitPrice: 0,
          originalPrice: 0,
          itemSubtotal: 0,
          itemDiscount: 0,
          isAvailable: false,
          status: 'unavailable',
          reason: 'This atelier piece is no longer available',
          availableStock: 0,
        });
        continue;
      }

      // Match variant
      const variants = product.variants || [];
      let matchedVariant = null;

      if (requestedSku) {
        matchedVariant = variants.find((v) => v.sku === requestedSku);
      }
      if (!matchedVariant && requestedSize && requestedColor) {
        matchedVariant = variants.find(
          (v) =>
            v.size.toLowerCase() === requestedSize.toLowerCase() &&
            v.color.toLowerCase() === requestedColor.toLowerCase()
        );
      }
      if (!matchedVariant && variants.length > 0) {
        matchedVariant = variants[0];
      }

      // If variant missing or inactive
      if (!matchedVariant || matchedVariant.status === 'inactive' || matchedVariant.status === 'discontinued') {
        hasUnavailableItems = true;
        processedItems.push({
          _id: item._id,
          product: {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            brand: product.brand,
            thumbnail: product.thumbnail || product.images?.[0] || '',
          },
          variant: {
            sku: requestedSku || matchedVariant?.sku || 'UNKNOWN',
            size: requestedSize || matchedVariant?.size || 'M',
            color: requestedColor || matchedVariant?.color || 'Standard',
          },
          quantity: requestedQty,
          priceSnapshot: item.priceSnapshot || 0,
          unitPrice: 0,
          originalPrice: 0,
          itemSubtotal: 0,
          itemDiscount: 0,
          isAvailable: false,
          status: 'unavailable',
          reason: 'Selected size or color variant is unavailable',
          availableStock: 0,
        });
        continue;
      }

      // Check stock
      const availableStock = Math.max(0, matchedVariant.stock ?? 0);
      let isAvailable = true;
      let reason = '';

      if (availableStock <= 0) {
        isAvailable = false;
        hasUnavailableItems = true;
        reason = 'Currently sold out';
      } else if (requestedQty > availableStock) {
        requestedQty = availableStock;
        reason = `Quantity adjusted to maximum available atelier stock (${availableStock})`;
      }

      // Recalculate verified prices directly from DB
      const verifiedUnitPrice =
        matchedVariant.salePrice != null && matchedVariant.salePrice > 0
          ? matchedVariant.salePrice
          : matchedVariant.price || product.price;

      const verifiedOriginalPrice =
        matchedVariant.price || product.originalPrice || verifiedUnitPrice;

      const itemSubtotal = isAvailable ? verifiedUnitPrice * requestedQty : 0;
      const itemDiscount =
        isAvailable && verifiedOriginalPrice > verifiedUnitPrice
          ? (verifiedOriginalPrice - verifiedUnitPrice) * requestedQty
          : 0;

      if (isAvailable) {
        subtotal += itemSubtotal;
        discount += itemDiscount;
        totalItems += requestedQty;
      }

      processedItems.push({
        _id: item._id,
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          thumbnail: product.thumbnail || product.images?.[0] || '',
          images: product.images || [],
        },
        variant: {
          sku: matchedVariant.sku,
          size: matchedVariant.size,
          color: matchedVariant.color,
          colorHex: matchedVariant.colorHex || '#111111',
          stock: matchedVariant.stock,
        },
        quantity: requestedQty,
        priceSnapshot: verifiedUnitPrice,
        unitPrice: verifiedUnitPrice,
        originalPrice: verifiedOriginalPrice,
        itemSubtotal,
        itemDiscount,
        isAvailable,
        status: isAvailable ? 'available' : 'out_of_stock',
        reason,
        availableStock,
      });
    }

    let couponDiscount = 0;
    let appliedCoupon = null;
    let couponError = null;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      try {
        const availableItems = processedItems.filter((i) => i.isAvailable);
        const valResult = await CouponService.validateCoupon({
          couponCode: couponCode.trim(),
          cartItems: availableItems,
          subtotal,
          userId,
        });
        if (valResult.valid) {
          couponDiscount = valResult.discountAmount;
          appliedCoupon = {
            code: valResult.couponCode,
            discountType: valResult.discountType,
            discountValue: valResult.discountValue,
            discountAmount: valResult.discountAmount,
            message: valResult.message,
          };
        }
      } catch (cErr) {
        couponError = cErr.message;
      }
    }

    // Courier logic: Free shipping above ₹2,500
    const shipping = subtotal >= 2500 || subtotal === 0 ? 0 : 250;
    // 5% standard GST included / breakdown
    const tax = Math.round(Math.max(0, subtotal - couponDiscount) * 0.05);
    const grandTotal = Math.max(0, subtotal - couponDiscount + shipping);

    return {
      items: processedItems,
      totals: {
        subtotal,
        discount,
        couponCode: appliedCoupon?.code || (couponCode ? couponCode.trim().toUpperCase() : ''),
        couponDiscount,
        couponError,
        appliedCoupon,
        shipping,
        tax,
        grandTotal,
        totalItems,
        hasUnavailableItems,
      },
    };
  }

  /**
   * Retrieves or initializes cart for authenticated user
   */
  static async getCart(userId, couponCode = null) {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const { items, totals } = await this.recalculateCartItems(cart.items, couponCode, userId);

    // Synchronize price snapshots and clamped quantities back to cart document
    let modified = false;
    cart.items.forEach((cartItem, idx) => {
      const processed = items[idx];
      if (processed && processed.isAvailable) {
        if (cartItem.priceSnapshot !== processed.priceSnapshot) {
          cartItem.priceSnapshot = processed.priceSnapshot;
          modified = true;
        }
        if (cartItem.quantity !== processed.quantity) {
          cartItem.quantity = processed.quantity;
          modified = true;
        }
      }
    });

    if (modified) {
      await cart.save();
    }

    return {
      _id: cart._id,
      user: userId,
      items,
      totals,
      updatedAt: cart.updatedAt,
    };
  }

  /**
   * Adds an item to the user's cart with recalculation
   */
  static async addItem(userId, { productId, sku, size, color, quantity = 1 }) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const addQty = Math.max(1, parseInt(quantity, 10) || 1);

    // Check if matching item exists
    const existingIndex = cart.items.findIndex((item) => {
      const sameProduct = item.product.toString() === productId.toString();
      if (!sameProduct) return false;
      if (sku && item.variant?.sku === sku) return true;
      if (size && color && item.variant?.size === size && item.variant?.color === color) return true;
      return false;
    });

    // Lookup product to fetch initial verified price snapshot
    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      throw new Error('Garment is not available for purchase');
    }

    let matchedVariant = null;
    if (sku) {
      matchedVariant = product.variants.find((v) => v.sku === sku);
    }
    if (!matchedVariant && size && color) {
      matchedVariant = product.variants.find(
        (v) => v.size.toLowerCase() === size.toLowerCase() && v.color.toLowerCase() === color.toLowerCase()
      );
    }
    if (!matchedVariant && product.variants.length > 0) {
      matchedVariant = product.variants[0];
    }

    const priceSnapshot =
      matchedVariant?.salePrice || matchedVariant?.price || product.price || 0;

    const variantData = {
      sku: matchedVariant?.sku || sku || 'DEFAULT-SKU',
      size: matchedVariant?.size || size || 'M',
      color: matchedVariant?.color || color || 'Standard',
    };

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += addQty;
      cart.items[existingIndex].priceSnapshot = priceSnapshot;
    } else {
      cart.items.push({
        product: productId,
        variant: variantData,
        quantity: addQty,
        priceSnapshot,
      });
    }

    await cart.save();
    return this.getCart(userId);
  }

  /**
   * Updates item quantity
   */
  static async updateQuantity(userId, itemId, quantity) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new Error('Cart not found');
    }

    const newQty = parseInt(quantity, 10);
    if (newQty <= 0) {
      return this.removeItem(userId, itemId);
    }

    const item = cart.items.id(itemId);
    if (!item) {
      throw new Error('Item not found in shopping bag');
    }

    item.quantity = newQty;
    await cart.save();
    return this.getCart(userId);
  }

  /**
   * Removes an item from cart
   */
  static async removeItem(userId, itemId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new Error('Cart not found');
    }

    cart.items.pull({ _id: itemId });
    await cart.save();
    return this.getCart(userId);
  }

  /**
   * Clears cart
   */
  static async clearCart(userId) {
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return {
      user: userId,
      items: [],
      totals: {
        subtotal: 0,
        discount: 0,
        shipping: 0,
        tax: 0,
        grandTotal: 0,
        totalItems: 0,
        hasUnavailableItems: false,
      },
    };
  }

  /**
   * Synchronizes guest cart into user account upon login
   */
  static async syncGuestCart(userId, guestItems = []) {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    if (!Array.isArray(guestItems) || guestItems.length === 0) {
      return this.getCart(userId);
    }

    for (const gItem of guestItems) {
      const pId = gItem.productId || gItem.id || gItem.product?._id || gItem.product;
      if (!pId || !mongoose.Types.ObjectId.isValid(pId)) continue;

      const sku = gItem.variant?.sku || gItem.sku;
      const size = gItem.variant?.size || gItem.size || 'M';
      const color = gItem.variant?.color || gItem.color || 'Standard';
      const qty = Math.max(1, parseInt(gItem.quantity, 10) || 1);

      const existingIndex = cart.items.findIndex((item) => {
        if (item.product.toString() !== pId.toString()) return false;
        if (sku && item.variant?.sku === sku) return true;
        if (item.variant?.size === size && item.variant?.color === color) return true;
        return false;
      });

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += qty;
      } else {
        cart.items.push({
          product: pId,
          variant: { sku: sku || 'SKU', size, color },
          quantity: qty,
          priceSnapshot: gItem.price || 0,
        });
      }
    }

    await cart.save();
    return this.getCart(userId);
  }

  /**
   * Recalculates guest cart without saving to MongoDB
   */
  static async calculateGuestCart(guestItems = [], couponCode = null) {
    return this.recalculateCartItems(guestItems, couponCode, null);
  }
}
