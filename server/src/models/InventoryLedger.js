import mongoose from 'mongoose';

const inventoryLedgerSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    transaction: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: [
        'Order Placement',
        'Order Cancellation',
        'Restock',
        'Return',
        'Adjustment',
        'Damaged',
        'Initial Seed',
      ],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity delta is required'],
    },
    previousStock: {
      type: Number,
      required: [true, 'Previous stock level is required'],
    },
    newStock: {
      type: Number,
      required: [true, 'New stock level is required'],
    },
    reference: {
      type: String,
      default: 'System',
      trim: true,
    },
    admin: {
      type: String,
      default: 'System',
      trim: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

inventoryLedgerSchema.index({ createdAt: -1 });

export const InventoryLedger = mongoose.model('InventoryLedger', inventoryLedgerSchema);
