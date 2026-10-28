import mongoose from 'mongoose';

const trackingEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: [
        'Order Placed',
        'Confirmed',
        'Packed',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
      ],
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: {
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
    courier: {
      type: String,
      required: true,
      enum: ['DTDC', 'Delhivery', 'GenericCourier'],
      default: 'DTDC',
      index: true,
    },
    carrierName: {
      type: String,
      default: 'DTDC Express Air',
    },
    awb: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    trackingUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'Order Placed',
        'Confirmed',
        'Packed',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
      ],
      default: 'Confirmed',
      index: true,
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
    origin: {
      hub: { type: String, default: 'Urban Check Atelier Mumbai Dispatch' },
      city: { type: String, default: 'Mumbai' },
      state: { type: String, default: 'Maharashtra' },
      postalCode: { type: String, default: '400001' },
      country: { type: String, default: 'India' },
    },
    destination: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      apartment: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    packageDetails: {
      weightKg: { type: Number, default: 0.8 },
      itemCount: { type: Number, default: 1 },
    },
    trackingEvents: [trackingEventSchema],
    cancellation: {
      cancelledAt: { type: Date, default: null },
      reason: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

export const Shipment = mongoose.model('Shipment', shipmentSchema);
