import mongoose from 'mongoose';

const recentlyViewedItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const recentlyViewedSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for browsing history'],
      unique: true,
      index: true,
    },
    items: {
      type: [recentlyViewedItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const RecentlyViewed = mongoose.model('RecentlyViewed', recentlyViewedSchema);
