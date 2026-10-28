import mongoose from 'mongoose';

const refundHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Approved', 'Processing', 'Completed', 'Failed'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
    adminName: {
      type: String,
      default: 'System Concierge',
    },
    transactionId: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const refundSchema = new mongoose.Schema(
  {
    refundNumber: {
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
    returnRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReturnRequest',
      default: null,
      index: true,
    },
    returnNumber: {
      type: String,
      default: '',
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
      phone: { type: String, default: '' },
    },
    amount: {
      type: Number,
      required: [true, 'Refund amount is required'],
      min: [0, 'Refund amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    method: {
      type: String,
      enum: [
        'OriginalPaymentMethod',
        'Razorpay',
        'BankTransfer',
        'StoreCredit',
        'Manual',
      ],
      default: 'OriginalPaymentMethod',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Processing', 'Completed', 'Failed'],
      default: 'Pending',
      index: true,
    },
    reason: {
      type: String,
      default: 'Customer return reversal',
    },
    gatewayDetails: {
      provider: { type: String, default: 'Razorpay' },
      paymentId: { type: String, default: '' },
      gatewayRefundId: { type: String, default: '' },
      speed: { type: String, enum: ['normal', 'optimum'], default: 'normal' },
      arn: { type: String, default: '' }, // Acquirer Reference Number
      rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    processedAt: {
      type: Date,
      default: null,
    },
    history: [refundHistorySchema],
  },
  {
    timestamps: true,
  }
);

refundSchema.index({ user: 1, createdAt: -1 });

export const Refund = mongoose.model('Refund', refundSchema);
