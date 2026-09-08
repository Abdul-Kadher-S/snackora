'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Order } from '@/types';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Navbar } from '@/components/layout/Navbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Footer } from '@/components/layout/Footer';
import { EmptyState } from '@/components/ui/EmptyState';
import { Currency } from '@/components/ui/Currency';
import { Clock, Phone, Search, ChevronRight, PackageOpen, DoorOpen, Building2 } from 'lucide-react';
import { useHostel } from '@/context/HostelContext';

export function OrdersListClient() {
  const { savedPhone } = useHostel();
  const [phoneQuery, setPhoneQuery] = useState(savedPhone || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (phone?: string) => {
    setLoading(true);
    try {
      let url = '/api/orders';
      if (phone && phone.trim()) {
        url += `?phone=${encodeURIComponent(phone.trim())}`;
      } else {
        // Check localStorage for recent order numbers
        const storedOrderNumbers: string[] = JSON.parse(
          localStorage.getItem('snackora_recent_orders') || localStorage.getItem('hb_recent_orders') || '[]'
        );
        if (storedOrderNumbers.length > 0) {
          // fetch by search query
          url += `?search=${encodeURIComponent(storedOrderNumbers[0])}`;
        }
      }

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
    fetchOrders(savedPhone);
  }, [savedPhone]);

  const handleSearchPhone = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(phoneQuery);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your active snack deliveries or review past orders.
          </p>
        </div>

        {/* Find orders by phone */}
        <form onSubmit={handleSearchPhone} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-6">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Search Orders by Mobile Number</span>
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              placeholder="Enter your 10-digit mobile number"
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold text-sm rounded-xl transition shrink-0"
            >
              Find Orders
            </button>
          </div>
        </form>

        {/* Order List or Empty State */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <EmptyState
            type="orders"
            actionHref="/"
            actionText="Start Craving"
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusColor =
                order.status === 'DELIVERED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : order.status === 'CANCELLED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-orange-100 text-[#FF6B00] animate-pulse';

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.orderNumber}`}
                  className="block group bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-base">
                          {order.orderNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColor}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Total (COD)</span>
                        <Currency amount={order.total} className="text-base font-black text-slate-900" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                        {order.hostel}
                      </span>
                      <span className="flex items-center gap-1 text-slate-900 font-bold">
                        <DoorOpen className="w-3.5 h-3.5 text-emerald-600" />
                        Room: {order.roomNumber}
                      </span>
                    </div>
                    <span className="text-slate-400">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
