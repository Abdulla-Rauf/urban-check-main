import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    variant: {
      sku: { type: String, required: true },
      size: { type: String, required: true },
      color: { type: String, required: true },
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    reason: {
      type: String,
      required: [true, 'Return reason is required'],
      enum: [
        'Wrong size',
        'Damaged',
        'Wrong product',
        'Defective',
        'Not as described',
        'Other',
      ],
    },
    description: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    exchangeDetails: {
      currentSize: { type: String, default: '' },
      newSize: { type: String, default: '' },
      newVariantSku: { type: String, default: '' },
      isAvailable: { type: Boolean, default: false },
    },
  },
  { _id: true }
);

const returnStatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: '' },
    updatedBy: { type: String, default: 'System' },
  },
  { _id: false }
);

const returnRequestSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    type: {
      type: String,
      enum: ['Return', 'Exchange'],
      default: 'Return',
      index: true,
    },
    items: [returnItemSchema],
    totalRefundAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        'Requested',
        'UnderReview',
        'Approved',
        'Rejected',
        'PickupScheduled',
        'Received',
        'QualityCheck',
        'RefundApproved',
        'Refunded',
      ],
      default: 'Requested',
      index: true,
    },
    pickupDetails: {
      address: {
        address: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        postalCode: { type: String, default: '' },
      },
      scheduledDate: { type: Date, default: null },
      courierName: { type: String, default: 'DTDC Reverse Cargo' },
      pickupAwb: { type: String, default: '' },
    },
    qualityCheck: {
      passed: { type: Boolean, default: null },
      inspectedAt: { type: Date, default: null },
      inspectedBy: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    refund: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Refund',
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    history: [returnStatusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
returnRequestSchema.index({ user: 1, createdAt: -1 });

export const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);
