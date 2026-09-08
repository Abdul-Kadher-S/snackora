'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Order, OrderStatus } from '@/types';
import { Currency } from '@/components/ui/Currency';
import {
  Search,
  RefreshCw,
  Phone,
  Building2,
  DoorOpen,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bike,
  ChefHat,
  XCircle,
  MessageSquare,
  Banknote,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'ORDER_RECEIVED', label: 'Received' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { showToast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = '/api/orders';
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(`Order status updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
        fetchOrders();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update order status', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Hostel Orders Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dispatch late night snack orders directly to student hostel room doors.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Orders</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === f.key
                  ? 'bg-[#FF6B00] text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID (#HB-XXXX), student name, room number, or phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-12 text-center text-slate-400">
            No orders match the selected filters.
          </div>
        ) : (
          orders.map((order) => {
            const isCancelled = order.status === 'CANCELLED';
            const isDelivered = order.status === 'DELIVERED';

            return (
              <div
                key={order.id}
                className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-lg transition hover:border-slate-600 space-y-4"
              >
                {/* Top Row: Order Number, Time, Status Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/70 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg font-black text-white">{order.orderNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          isDelivered
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : isCancelled
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-orange-950 text-[#FF6B00] border border-orange-800'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>

                  {/* Status Changer Select */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-semibold text-slate-400">Update Status:</span>
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 cursor-pointer"
                    >
                      <option value="ORDER_RECEIVED">Order Received</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PREPARING">Preparing / Packing</option>
                      <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Middle Row: Prominent Delivery Destination Callout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Delivery Location - PROMINENTLY HIGHLIGHTED */}
                  <div className="md:col-span-2 bg-gradient-to-r from-orange-950/40 to-slate-900 border border-orange-500/30 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5 mb-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Deliver To Room:</span>
                      </span>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-base font-bold text-slate-200">{order.hostel}</span>
                        <span className="text-xl font-black text-amber-300 bg-amber-950/80 px-3 py-0.5 rounded-xl border border-amber-700">
                          {order.roomNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 flex flex-wrap items-center gap-4">
                        <span><strong>Student:</strong> {order.customerName}</span>
                        <a
                          href={`tel:${order.phone}`}
                          className="flex items-center gap-1 text-[#FF6B00] hover:underline font-bold"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>+91 {order.phone}</span>
                        </a>
                      </div>
                    </div>

                    {order.deliveryNote && (
                      <p className="text-xs text-slate-400 italic mt-2.5 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                        &ldquo;{order.deliveryNote}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Payment & COD Badge */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 mb-1">
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Payment Due (COD)</span>
                      </span>
                      <Currency amount={order.total} className="text-2xl font-black text-white my-1" />
                      <span className="text-[11px] text-emerald-300 font-semibold block">
                        Collect exact cash at door
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 mt-2">
                      Delivery Fee: ₹0 (Hostel Free Policy)
                    </span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Items ({order.items.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {item.product?.imageUrl && (
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                              <Image
                                src={item.product.imageUrl}
                                alt={item.productName}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="truncate">
                            <span className="font-bold text-white block truncate">
                              {item.productName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Qty: {item.quantity} × ₹{item.price}
                            </span>
                          </div>
                        </div>
                        <span className="font-black text-white shrink-0 ml-2">₹{item.subtotal}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Quick Progression Buttons */}
                <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {order.status === 'ORDER_RECEIVED' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Order</span>
                      </button>
                    )}
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Start Packing</span>
                      </button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                        className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <Bike className="w-3.5 h-3.5" />
                        <span>Send Out for Delivery</span>
                      </button>
                    )}
                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Delivered & Cash Collected</span>
                      </button>
                    )}
                  </div>

                  {!isCancelled && !isDelivered && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold hover:underline"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
