import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      required: [true, 'Banner image URL is required'],
      trim: true,
    },
    cta: {
      type: String,
      default: 'Shop Collection',
      trim: true,
    },
    targetType: {
      type: String,
      required: [true, 'Target type is required'],
      enum: ['Product', 'Category', 'Brand', 'Offer', 'Page'],
      default: 'Page',
    },
    targetId: {
      type: String,
      default: '',
      trim: true,
    },
    targetUrl: {
      type: String,
      default: '/shop',
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    offerBadge: {
      type: String,
      default: '',
      trim: true,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    offerPrice: {
      type: Number,
      default: null,
    },
    offerPriceRange: {
      type: String,
      default: '',
      trim: true,
    },
    applicableProducts: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    showOfferProducts: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active banners sorted by priority
bannerSchema.index({ status: 1, displayOrder: 1, startDate: 1, endDate: 1 });

/**
 * Helper to compute target URL from targetType and targetId if not explicitly provided
 */
bannerSchema.pre('save', function () {
  if (!this.targetUrl || this.targetUrl === '/shop') {
    const id = (this.targetId || '').trim();
    switch (this.targetType) {
      case 'Product':
        this.targetUrl = id ? `/products/${id}` : '/shop';
        break;
      case 'Category':
        this.targetUrl = id ? `/categories/${id.toLowerCase()}` : '/shop';
        break;
      case 'Brand':
        this.targetUrl = id ? `/brands/${id.toLowerCase()}` : '/shop';
        break;
      case 'Offer':
        this.targetUrl = '/offers';
        break;
      case 'Page':
      default:
        this.targetUrl = id.startsWith('/') ? id : `/${id || 'shop'}`;
        break;
    }
  }
});

export const Banner = mongoose.model('Banner', bannerSchema);
