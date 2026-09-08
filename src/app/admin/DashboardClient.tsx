'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Currency } from '@/components/ui/Currency';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Building2,
  DoorOpen,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';

interface AnalyticsData {
  totalRevenue: number;
  todayRevenue: number;
  totalOrdersCount: number;
  todayOrdersCount: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  pendingOrdersCount: number;
  deliveredOrdersCount: number;
  recentOrders: any[];
  topSellingProducts: { name: string; count: number; revenue: number }[];
  last7Days: { date: string; orders: number; revenue: number }[];
}

export function DashboardClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchAnalytics = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else if (res.status === 401) {
        window.location.href = '/admin/login';
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Realtime order subscription
  const { isConnected, isRealtimeAvailable } = useRealtimeOrders({
    onOrderCreated: () => {
      fetchAnalytics(true);
    },
    onOrderUpdated: () => {
      fetchAnalytics(true);
    },
    onSync: () => {
      fetchAnalytics(true);
    },
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(`Order status updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
        fetchAnalytics();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update order status', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#FF6B00] mb-3" />
        <span className="text-sm font-semibold">Loading Admin Analytics...</span>
      </div>
    );
  }

  // Calculate maximum revenue in last 7 days for bar heights
  const maxBarRevenue = Math.max(...data.last7Days.map((d) => d.revenue), 100);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time live campus ordering statistics and inventory monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Realtime Live Indicator Badge */}
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              isConnected
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isConnected ? 'bg-emerald-500' : 'bg-slate-500'
                }`}
              ></span>
            </span>
            <span>{isConnected ? 'Realtime Live' : 'Connecting...'}</span>
          </div>

          <button
            onClick={() => fetchAnalytics(false)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/products?action=new"
            className="px-4 py-2 bg-[#FF6B00] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Today's Revenue */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today&apos;s Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <Currency amount={data.todayRevenue} className="text-xl sm:text-2xl font-black text-white" />
          <span className="text-[10px] text-slate-400 mt-1">Total: ₹{data.totalRevenue}</span>
        </div>

        {/* Today's Orders */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today&apos;s Orders</span>
            <ShoppingBag className="w-4 h-4 text-[#FF6B00]" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-white">{data.todayOrdersCount}</span>
          <span className="text-[10px] text-slate-400 mt-1">All time: {data.totalOrdersCount}</span>
        </div>

        {/* Pending Orders */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Orders</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-400">
            {data.pendingOrdersCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">Needs room delivery</span>
        </div>

        {/* Delivered Orders */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-emerald-400">
            {data.deliveredOrdersCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">Completed successfully</span>
        </div>

        {/* Total Products */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Products</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-white">{data.totalProducts}</span>
          <span className="text-[10px] text-slate-400 mt-1">Listed in store</span>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-rose-400">
            {data.lowStockProducts + data.outOfStockProducts}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">Under 10 units left</span>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Revenue Trend Bar Chart */}
        <div className="lg:col-span-2 bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Daily Revenue & Orders (Last 7 Days)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sales performance across days</p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
              Active Trend
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2">
            {data.last7Days.map((day, idx) => {
              const heightPercent = Math.max(12, Math.round((day.revenue / maxBarRevenue) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₹{day.revenue} ({day.orders})
                  </div>
                  <div className="w-full max-w-[36px] bg-slate-700 rounded-t-xl overflow-hidden relative flex items-end">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-[#FF6B00] to-amber-400 rounded-t-xl transition-all duration-500 group-hover:brightness-110"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[42px]">
                    {day.date.split(',')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Best-Selling Snacks */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Top Selling Snacks</h3>
            <p className="text-xs text-slate-400 mb-4">Highest volume items ordered</p>

            <div className="space-y-3">
              {data.topSellingProducts.length === 0 ? (
                <p className="text-xs text-slate-500">No product sales yet</p>
              ) : (
                data.topSellingProducts.map((prod, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-slate-700 text-slate-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-[150px]" title={prod.name}>
                        {prod.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-[#FF6B00]">{prod.count} sold</span>
                      <span className="text-[10px] text-slate-400 block">₹{prod.revenue}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/admin/products"
            className="mt-4 pt-3 border-t border-slate-700 text-xs font-bold text-[#FF6B00] hover:text-[#EA580C] flex items-center justify-between"
          >
            <span>Manage Catalog</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recent Orders Table with quick status toggle */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Orders Stream</h3>
            <p className="text-xs text-slate-400 mt-0.5">Quickly update order status as delivery progresses</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-[#FF6B00] hover:text-[#EA580C] flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 uppercase font-bold text-slate-400 text-[10px] tracking-wider">
              <tr>
                <th className="p-3 rounded-l-xl">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Room Delivery</th>
                <th className="p-3">Total (COD)</th>
                <th className="p-3">Status</th>
                <th className="p-3 rounded-r-xl text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {data.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                data.recentOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-700/30 transition">
                    <td className="p-3 font-bold text-white whitespace-nowrap">
                      {o.orderNumber}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-200">{o.customerName}</div>
                      <div className="text-[10px] text-slate-400">{o.phone}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-amber-400 block">{o.hostel}</span>
                      <span className="text-emerald-400 font-black">Room: {o.roomNumber}</span>
                    </td>
                    <td className="p-3 font-black text-white">
                      ₹{o.total}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          o.status === 'DELIVERED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : o.status === 'CANCELLED'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-orange-950 text-[#FF6B00] border border-orange-800'
                        }`}
                      >
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {o.status === 'ORDER_RECEIVED' && (
                        <button
                          onClick={() => updateOrderStatus(o.id, 'CONFIRMED')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition"
                        >
                          Confirm
                        </button>
                      )}
                      {o.status === 'CONFIRMED' && (
                        <button
                          onClick={() => updateOrderStatus(o.id, 'PREPARING')}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold transition"
                        >
                          Start Packing
                        </button>
                      )}
                      {o.status === 'PREPARING' && (
                        <button
                          onClick={() => updateOrderStatus(o.id, 'OUT_FOR_DELIVERY')}
                          className="px-2.5 py-1 bg-[#FF6B00] hover:bg-[#EA580C] text-white rounded-lg text-[10px] font-bold transition"
                        >
                          Send Out
                        </button>
                      )}
                      {o.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => updateOrderStatus(o.id, 'DELIVERED')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {o.status === 'DELIVERED' && (
                        <span className="text-[10px] text-emerald-400 font-bold">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
