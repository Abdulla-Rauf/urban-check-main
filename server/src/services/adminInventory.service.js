import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { InventoryLedger } from '../models/InventoryLedger.js';
import { RedisService } from './redis.service.js';

export class AdminInventoryService {
  /**
   * Retrieves aggregated inventory summary metrics
   */
  static async getSummary() {
    // Aggregate stock across all active/draft products
    const products = await Product.find({ status: { $ne: 'archived' } }).select('variants');

    let totalStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        const stock = v.stock ?? 0;
        totalStock += stock;
        if (stock === 0) {
          outOfStock += 1;
        } else if (stock <= 5) {
          lowStock += 1;
        }
      });
    });

    // Aggregate sold, reserved, and returned quantities from Orders
    const orders = await Order.find({}).select('orderStatus items');
    let reserved = 0;
    let sold = 0;
    let returned = 0;

    orders.forEach((o) => {
      const itemsQty = (o.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
      if (['Pending', 'Confirmed', 'Processing', 'Packed'].includes(o.orderStatus)) {
        reserved += itemsQty;
      }
      if (['Shipped', 'OutForDelivery', 'Delivered'].includes(o.orderStatus)) {
        sold += itemsQty;
      }
      if (['Returned', 'Refunded'].includes(o.orderStatus)) {
        returned += itemsQty;
      }
    });

    return {
      totalStock,
      lowStock,
      outOfStock,
      reserved,
      sold,
      returned,
    };
  }

  /**
   * Retrieves all SKU variants across products with status and threshold
   */
  static async getInventoryItems({ page = 1, limit = 20, search = '', filter = 'all' } = {}) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.max(1, parseInt(limit, 10));

    const productQuery = { status: { $ne: 'archived' } };
    const products = await Product.find(productQuery)
      .populate('category', 'name')
      .populate('brand', 'name')
      .lean();

    let items = [];
    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        const stock = v.stock ?? 0;
        let status = 'In Stock';
        if (stock === 0) status = 'Out of Stock';
        else if (stock <= 5) status = 'Low Stock';

        items.push({
          productId: p._id,
          productName: p.name,
          category: p.category?.name || 'Apparel',
          brand: p.brand?.name || 'Urban Check Atelier',
          sku: v.sku,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex || '#111111',
          price: v.price || p.price,
          salePrice: v.salePrice,
          inStock: stock,
          threshold: 5,
          status,
          images: v.images?.length > 0 ? v.images : p.images,
        });
      });
    });

    // Apply search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (it) =>
          it.sku.toLowerCase().includes(q) ||
          it.productName.toLowerCase().includes(q) ||
          it.color.toLowerCase().includes(q) ||
          it.size.toLowerCase().includes(q)
      );
    }

    // Apply filter
    if (filter === 'low_stock') {
      items = items.filter((it) => it.inStock > 0 && it.inStock <= 5);
    } else if (filter === 'out_of_stock') {
      items = items.filter((it) => it.inStock === 0);
    } else if (filter === 'in_stock') {
      items = items.filter((it) => it.inStock > 5);
    }

    const total = items.length;
    const paginatedItems = items.slice(skip, skip + take);

    return {
      items: paginatedItems,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / take) || 1,
      limit: take,
    };
  }

  /**
   * Retrieves paginated audit ledger of inventory movements
   */
  static async getLedger({ page = 1, limit = 20, search = '', transaction = 'all' } = {}) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.max(1, parseInt(limit, 10));

    const filterQuery = {};
    if (transaction && transaction !== 'all') {
      filterQuery.transaction = transaction;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filterQuery.$or = [
        { sku: regex },
        { productName: regex },
        { reference: regex },
        { admin: regex },
      ];
    }

    const [entries, total] = await Promise.all([
      InventoryLedger.find(filterQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      InventoryLedger.countDocuments(filterQuery),
    ]);

    return {
      items: entries,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / take) || 1,
      limit: take,
    };
  }

  /**
   * Adjusts stock for a specific SKU variant and appends audit ledger entry
   */
  static async adjustStock({
    productId,
    sku,
    adjustmentType = 'add', // 'add', 'subtract', 'set'
    quantity = 0,
    reason = 'Manual audit adjustment',
    reference = 'Manual',
    adminName = 'Super Admin',
  }) {
    if (!sku) throw new Error('Variant SKU is required for stock adjustment');

    const product = productId
      ? await Product.findById(productId)
      : await Product.findOne({ 'variants.sku': sku });

    if (!product) throw new Error('Product not found for SKU: ' + sku);

    const variantIndex = product.variants.findIndex((v) => v.sku === sku);
    if (variantIndex === -1) throw new Error(`SKU ${sku} not found on product ${product.name}`);

    const previousStock = product.variants[variantIndex].stock ?? 0;
    const qty = parseInt(quantity, 10);
    if (isNaN(qty)) throw new Error('Quantity must be a valid number');

    let newStock = previousStock;
    let delta = 0;

    if (adjustmentType === 'add') {
      delta = Math.abs(qty);
      newStock = previousStock + delta;
    } else if (adjustmentType === 'subtract') {
      delta = -Math.abs(qty);
      newStock = Math.max(0, previousStock + delta);
    } else if (adjustmentType === 'set') {
      newStock = Math.max(0, qty);
      delta = newStock - previousStock;
    }

    // Apply update to product variant
    product.variants[variantIndex].stock = newStock;
    await product.save();

    // Create ledger entry
    const transactionType =
      delta > 0
        ? adjustmentType === 'add' && reason.toLowerCase().includes('purchase')
          ? 'Restock'
          : 'Adjustment'
        : 'Adjustment';

    const ledgerEntry = await InventoryLedger.create({
      sku,
      product: product._id,
      productName: product.name,
      transaction: transactionType,
      quantity: delta,
      previousStock,
      newStock,
      reference,
      admin: adminName,
      note: reason,
    });

    await RedisService.invalidateProductCache(product._id, product.slug);

    return {
      success: true,
      sku,
      previousStock,
      newStock,
      delta,
      ledgerEntry,
    };
  }
}
