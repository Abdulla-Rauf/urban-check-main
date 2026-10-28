import mongoose from 'mongoose';
import { productVariantSchema } from './ProductVariant.js';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      default: '',
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand reference is required'],
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Primary category reference is required'],
      index: true,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        index: true,
      },
    ],
    images: {
      type: [String],
      required: [true, 'At least one product image is required'],
    },
    thumbnail: {
      type: String,
      default: '',
    },
    secondaryImage: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      required: [true, 'Gender classification is required'],
      enum: ['Men', 'Women', 'Kids', 'Unisex'],
      index: true,
    },
    material: {
      type: String,
      default: '',
    },
    details: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      index: true,
      default: [],
    },
    price: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price must be non-negative'],
      index: true,
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    popularity: {
      type: Number,
      default: 0,
      index: true,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
      index: true,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    newArrival: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
      index: true,
    },
    inStock: {
      type: Boolean,
      default: true,
      index: true,
    },
    variants: [productVariantSchema],
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      keywords: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Text index for multi-field search
productSchema.index(
  {
    name: 'text',
    description: 'text',
    shortDescription: 'text',
    tags: 'text',
  },
  {
    weights: {
      name: 10,
      tags: 5,
      shortDescription: 3,
      description: 1,
    },
    name: 'ProductTextIndex',
  }
);

// Compound indexes for server-side facet filtering and sorting
productSchema.index({ status: 1, gender: 1, price: 1 });
productSchema.index({ status: 1, category: 1, price: 1 });
productSchema.index({ status: 1, brand: 1, price: 1 });
productSchema.index({ status: 1, newArrival: 1, createdAt: -1 });
productSchema.index({ status: 1, featured: 1, popularity: -1 });
productSchema.index({ status: 1, popularity: -1, rating: -1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, price: 1 });
productSchema.index({ 'variants.sku': 1 });
productSchema.index({ status: 1, inStock: 1, price: 1 });

export const Product = mongoose.model('Product', productSchema);
