import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { orderService } from '../services/orderService';

export const AccountOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        const data = await orderService.getUserOrders();
        if (isMounted) {
          setOrders(data || []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load order history.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Confirmed':
      case 'Processing':
        return 'bg-urban-teal/10 text-urban-teal border-urban-teal/20';
      case 'Packed':
      case 'Shipped':
      case 'OutForDelivery':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Cancelled':
      case 'Returned':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-urban-light-grey text-urban-warm-grey border-urban-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-urban-border pb-4">
        <h2 className="font-serif text-2xl font-normal text-urban-black">Order History</h2>
        <p className="text-xs text-urban-warm-grey mt-1">
          Review your previous acquisitions, bespoke packaging status, and tracking timelines.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-urban-light-grey border border-urban-border" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-900 text-xs flex items-center space-x-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-urban-light-grey border border-urban-border">
          <Package size={40} strokeWidth={1} className="mx-auto text-urban-warm-grey mb-3" />
          <h3 className="font-serif text-lg text-urban-black">No acquisitions registered yet</h3>
          <p className="text-xs text-urban-warm-grey mt-1 mb-6 max-w-sm mx-auto">
            Discover tailored blazers, worsted wool trousers, and signature knitwear.
          </p>
          <Link
            to="/shop"
            className="px-6 py-2.5 bg-urban-black hover:bg-urban-teal text-white text-xs uppercase tracking-editorial transition-colors inline-block"
          >
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.orderNumber}
              className="p-5 border border-urban-border bg-white hover:border-urban-teal/60 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="font-serif text-base font-semibold text-urban-black">
                    #{order.orderNumber}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-widest px-2.5 py-0.5 border font-semibold ${getStatusBadgeStyle(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <p className="text-xs text-urban-warm-grey">
                  Placed on {order.date} • {order.itemsCount} {order.itemsCount === 1 ? 'garment' : 'garments'}
                </p>

                <p className="text-xs text-urban-black font-medium">{order.previewItem}</p>

                <span className="inline-block text-[11px] text-urban-warm-grey">
                  Payment: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid Online'} (
                  {order.paymentStatus})
                </span>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-urban-border">
                <span className="text-base font-serif font-bold text-urban-black">
                  ₹{order.total.toLocaleString('en-IN')}
                </span>
                <Link
                  to={`/account/orders/${order.orderNumber}`}
                  className="inline-flex items-center text-xs uppercase tracking-editorial text-urban-teal font-medium mt-1 hover:underline group"
                >
                  <span>Order Details & Tracking</span>
                  <ArrowRight size={13} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
