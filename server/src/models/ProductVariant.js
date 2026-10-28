import mongoose from 'mongoose';

export const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'Variant SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    size: {
      type: String,
      required: [true, 'Size is required'],
      trim: true,
      index: true,
    },
    color: {
      type: String,
      required: [true, 'Color name is required'],
      trim: true,
      index: true,
    },
    colorHex: {
      type: String,
      default: '#111111',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    salePrice: {
      type: Number,
      min: [0, 'Sale price must be positive'],
      default: null,
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);
