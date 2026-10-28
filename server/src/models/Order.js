import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
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
    brand: {
      type: String,
      default: 'Urban Check Atelier',
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
      min: [0, 'Purchase price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    apartment: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    postalCode: { type: String, required: true },
    landmark: { type: String, default: '' },
  },
  { _id: false }
);

const paymentSnapshotSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['COD', 'Razorpay'],
      default: 'COD',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded', 'PartiallyRefunded'],
      default: 'Pending',
      required: true,
    },
    transactionId: {
      type: String,
      default: '',
    },
    gatewayOrderId: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const trackingEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, default: '' },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const shipmentSnapshotSchema = new mongoose.Schema(
  {
    courier: {
      type: String,
      enum: ['DTDC', 'Delhivery', 'GenericCourier'],
      default: 'DTDC',
    },
    carrier: {
      type: String,
      default: 'DTDC Express Air',
    },
    awb: {
      type: String,
      default: '',
    },
    trackingNumber: {
      type: String,
      default: '',
    },
    shipmentId: {
      type: String,
      default: '',
    },
    trackingUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'Confirmed',
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
    pickupDate: {
      type: Date,
      default: null,
    },
    deliveryDate: {
      type: Date,
      default: null,
    },
    trackingEvents: [trackingEventSchema],
    timeline: [
      {
        status: { type: String, required: true },
        label: { type: String, required: true },
        location: { type: String, default: 'Urban Check Atelier Dispatch' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    items: [orderItemSchema],
    shippingAddress: {
      type: addressSnapshotSchema,
      required: true,
    },
    billingAddress: {
      type: addressSnapshotSchema,
    },
    pricing: {
      subtotal: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      couponCode: { type: String, default: '' },
      couponDiscount: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true },
    },
    orderStatus: {
      type: String,
      enum: [
        'Pending',
        'Order Placed',
        'Confirmed',
        'Processing',
        'Packed',
        'Shipped',
        'Out for Delivery',
        'OutForDelivery',
        'Delivered',
        'Cancelled',
        'Returned',
        'Refunded',
      ],
      default: 'Confirmed',
      index: true,
    },
    payment: {
      type: paymentSnapshotSchema,
      required: true,
    },
    shipment: {
      type: shipmentSnapshotSchema,
      required: true,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
    cancellation: {
      reason: { type: String, default: '' },
      cancelledAt: { type: Date, default: null },
      cancelledBy: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for customer order history queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
