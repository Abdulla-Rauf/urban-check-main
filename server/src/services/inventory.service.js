import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { InventoryLedger } from '../models/InventoryLedger.js';
import { RedisService } from './redis.service.js';

export class InventoryService {
  /**
   * Checks current stock availability for an array of items without modifying inventory
   */
  static async checkStockAvailability(items = []) {
    const availability = [];

    for (const item of items) {
      const pId = item.productId || item.product?._id || item.product;
      const sku = item.variant?.sku || item.sku;
      const size = item.variant?.size || item.size;
      const color = item.variant?.color || item.color;
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      const product = await Product.findById(pId).select('name status variants');
      if (!product || product.status !== 'active') {
        availability.push({
          productId: pId,
          sku,
          isAvailable: false,
          availableStock: 0,
          reason: 'Product is no longer active',
        });
        continue;
      }

      const variant =
        product.variants.find((v) => v.sku === sku) ||
        product.variants.find(
          (v) =>
            v.size.toLowerCase() === size?.toLowerCase() &&
            v.color.toLowerCase() === color?.toLowerCase()
        );

      if (!variant || variant.status !== 'active') {
        availability.push({
          productId: pId,
          sku,
          isAvailable: false,
          availableStock: 0,
          reason: 'Variant is discontinued or unavailable',
        });
        continue;
      }

      const currentStock = variant.stock ?? 0;
      if (currentStock < qty) {
        availability.push({
          productId: pId,
          sku: variant.sku,
          isAvailable: false,
          availableStock: currentStock,
          requestedQuantity: qty,
          reason: `Insufficient inventory for ${product.name} (${variant.size}/${variant.color}). Available: ${currentStock}`,
        });
      } else {
        availability.push({
          productId: pId,
          sku: variant.sku,
          isAvailable: true,
          availableStock: currentStock,
          requestedQuantity: qty,
        });
      }
    }

    const hasUnavailable = availability.some((a) => !a.isAvailable);
    return { hasUnavailable, availability };
  }

  /**
   * Atomically validates and reserves stock for each item.
   * If any item is out of stock or race-condition fails, all previously reserved
   * items in the batch are rolled back.
   */
  static async validateAndReserveStock(items = [], reference = 'Order Checkout', admin = 'System') {
    const reservedItems = [];

    try {
      for (const item of items) {
        const pId = item.productId || item.product?._id || item.product;
        const sku = item.variant?.sku || item.sku;
        const size = item.variant?.size || item.size;
        const color = item.variant?.color || item.color;
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

        // Find product and locate the exact variant
        const product = await Product.findById(pId);
        if (!product || product.status !== 'active') {
          throw new Error(`Garment is no longer available in atelier catalog.`);
        }

        const variant =
          product.variants.find((v) => v.sku === sku) ||
          product.variants.find(
            (v) =>
              v.size.toLowerCase() === size?.toLowerCase() &&
              v.color.toLowerCase() === color?.toLowerCase()
          );

        if (!variant || variant.status !== 'active') {
          throw new Error(
            `Variant ${size}/${color} of ${product.name} is not available.`
          );
        }

        const targetSku = variant.sku;
        const prevStock = variant.stock ?? 0;

        // Atomic conditional deduction
        const updateResult = await Product.updateOne(
          {
            _id: product._id,
            'variants.sku': targetSku,
            'variants.stock': { $gte: qty },
          },
          {
            $inc: { 'variants.$.stock': -qty },
          }
        );

        if (updateResult.modifiedCount === 0) {
          throw new Error(
            `Insufficient stock for "${product.name}" (${variant.size} / ${variant.color}). Only ${variant.stock} remaining.`
          );
        }

        reservedItems.push({
          productId: product._id,
          sku: targetSku,
          quantity: qty,
          productName: product.name,
          previousStock: prevStock,
          newStock: prevStock - qty,
        });

        // Audit log in InventoryLedger
        try {
          await InventoryLedger.create({
            sku: targetSku,
            product: product._id,
            productName: product.name,
            transaction: 'Order Placement',
            quantity: -qty,
            previousStock: prevStock,
            newStock: prevStock - qty,
            reference,
            admin,
            note: `Reserved for ${reference}`,
          });
        } catch (ledgerErr) {
          console.error('InventoryLedger write error:', ledgerErr);
        }
      }

      await RedisService.invalidateProductCache();
      return { success: true, reservedItems };
    } catch (err) {
      // Rollback any items reserved before the failure
      await this.releaseReservedStock(reservedItems, reference, admin, 'Rollback on placement failure');
      throw err;
    }
  }

  /**
   * Releases/restores stock for items (used on rollback or order cancellation)
   */
  static async releaseReservedStock(items = [], reference = 'Order Cancellation', admin = 'System', reason = 'Order cancelled') {
    for (const item of items) {
      const pId = item.productId || item.product?._id || item.product;
      const sku = item.variant?.sku || item.sku;
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      if (pId && sku) {
        try {
          const product = await Product.findById(pId);
          const variant = product?.variants?.find((v) => v.sku === sku);
          const prevStock = variant?.stock ?? 0;

          await Product.updateOne(
            {
              _id: pId,
              'variants.sku': sku,
            },
            {
              $inc: { 'variants.$.stock': qty },
            }
          );

          // Audit log in InventoryLedger
          if (product) {
            await InventoryLedger.create({
              sku,
              product: pId,
              productName: product.name,
              transaction: 'Order Cancellation',
              quantity: qty,
              previousStock: prevStock,
              newStock: prevStock + qty,
              reference,
              admin,
              note: reason,
            });
          }
        } catch (err) {
          console.error(
            `Failed to restore stock for product ${pId}, variant ${sku}:`,
            err
          );
        }
      }
    }
    await RedisService.invalidateProductCache();
  }
}

