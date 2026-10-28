import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    bannerImage: {
      type: String,
      trim: true,
      default: '',
    },
    offerPrice: {
      type: Number,
      min: [0, 'Offer price cannot be negative'],
      default: null,
    },
    discount: {
      type: Number,
      required: [true, 'Discount value or percentage is required'],
      min: [0, 'Discount cannot be negative'],
      default: 0,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    badgeText: {
      type: String,
      default: 'SPECIAL OFFER',
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        index: true,
      },
    ],
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        index: true,
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for querying active offers
offerSchema.index({ status: 1, startDate: 1, endDate: 1 });

/**
 * Server-side evaluation of whether this offer is active at the given moment.
 * NEVER trust frontend time or calculations.
 */
offerSchema.methods.isCurrentlyActive = function (currentDate = new Date()) {
  const now = new Date(currentDate);
  if (this.status !== 'active') return false;
  if (this.startDate && new Date(this.startDate) > now) return false;
  if (this.endDate && new Date(this.endDate) < now) return false;
  return true;
};

// Static helper to find all live offers right now
offerSchema.statics.findActiveOffers = function (currentDate = new Date()) {
  const now = new Date(currentDate);
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
};

export const Offer = mongoose.model('Offer', offerSchema);
