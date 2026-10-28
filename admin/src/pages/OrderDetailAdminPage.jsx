import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../services/api';
import { ArrowLeft, Truck, PackageCheck, User, MapPin, Loader2, Clock } from 'lucide-react';

export const OrderDetailAdminPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.get(`/admin/orders/${id}`);
      setOrder(res.data || res);
    } catch (err) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      const res = await adminApi.patch(`/admin/orders/${id}/status`, {
        orderStatus: newStatus,
      });
      setOrder(res.data || res);
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-admin-accent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link to="/orders" className="text-xs text-slate-500 hover:underline">
          &larr; Back to Orders
        </Link>
        <div className="p-6 bg-white rounded-lg border border-slate-200 text-center">
          <p className="text-sm font-semibold text-rose-600">{error || 'Order not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        to="/orders"
        className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={14} className="mr-1" />
        <span>Back to Orders</span>
      </Link>

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
            Order Reference
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            #{order.id}
          </h1>
          <p className="text-xs text-slate-500">
            Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
          </p>
        </div>

        {/* Fulfillment Status Control */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={order.orderStatus}
            disabled={updating}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-admin-accent cursor-pointer"
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped</option>
            <option value="OutForDelivery">Out For Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Returned">Returned</option>
          </select>
          {updating && <Loader2 size={14} className="animate-spin text-admin-accent" />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* Order Items */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-semibold text-slate-900 text-sm">Line Items & Garment Snapshots</h3>

          <div className="divide-y divide-slate-100">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-14 bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">
                        {item.name}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block text-xs">{item.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      SKU: {item.variant?.sku} | Size: {item.variant?.size} | Color:{' '}
                      {item.variant?.color}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-semibold text-slate-900 block text-xs">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ₹{item.price.toLocaleString('en-IN')} &times; {item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-1.5 text-right font-mono">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>₹{order.pricing?.subtotal?.toLocaleString('en-IN') || 0}</span>
            </div>
            {order.pricing?.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Atelier Benefit</span>
                <span>-₹{order.pricing.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Express Air Courier</span>
              <span>
                {order.pricing?.shipping === 0
                  ? 'Complimentary'
                  : `₹${order.pricing?.shipping?.toLocaleString('en-IN')}`}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>GST (5%)</span>
              <span>₹{order.pricing?.tax?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total</span>
              <span>₹{order.pricing?.grandTotal?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Customer & Fulfillment Info */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold border-b border-slate-100 pb-2">
              <User size={15} />
              <span>Customer Information</span>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-slate-900 block">{order.customer?.name}</span>
              <span className="text-slate-500 block">{order.customer?.email}</span>
              <span className="text-slate-500 font-mono block">{order.customer?.phone}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold border-b border-slate-100 pb-2">
              <MapPin size={15} />
              <span>Delivery Destination</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {order.shippingAddress?.address}
              {order.shippingAddress?.apartment && `, ${order.shippingAddress?.apartment}`}
              <br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
              {order.shippingAddress?.postalCode}
              <br />
              {order.shippingAddress?.country}
              {order.shippingAddress?.landmark && ` (Landmark: ${order.shippingAddress.landmark})`}
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold border-b border-slate-100 pb-2">
              <Truck size={15} />
              <span>Fulfillment & Dispatch</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Carrier:</span>
                <span className="font-medium text-slate-900">{order.shipment?.carrier || 'DTDC Express'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">AWB Tracking:</span>
                <span className="font-mono text-slate-900 font-semibold">
                  {order.shipment?.trackingNumber || 'Pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-medium text-slate-900">
                  {order.payment?.method} ({order.payment?.status})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
