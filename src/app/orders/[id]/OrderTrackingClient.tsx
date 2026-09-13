'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Order, OrderStatus } from '@/types';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Navbar } from '@/components/layout/Navbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Footer } from '@/components/layout/Footer';
import { Currency } from '@/components/ui/Currency';
import { VegBadge } from '@/components/ui/VegBadge';
import { useRepeatOrder } from '@/hooks/useRepeatOrder';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bike,
  Home,
  XCircle,
  RotateCw,
  RotateCcw,
  MapPin,
  Phone,
  Banknote,
  ArrowRight,
  ShieldCheck,
  Building2,
  DoorOpen,
  ShoppingBag,
} from 'lucide-react';

interface OrderTrackingClientProps {
  initialOrder: Order;
}

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
  {
    status: 'ORDER_RECEIVED',
    label: 'Order Received',
    desc: 'We have received your order details',
    icon: Clock,
  },
  {
    status: 'CONFIRMED',
    label: 'Order Confirmed',
    desc: 'Hostel dispatch verified your room',
    icon: CheckCircle2,
  },
  {
    status: 'PREPARING',
    label: 'Packing Snacks',
    desc: 'Items are being packed fresh from the hub',
    icon: ChefHat,
  },
  {
    status: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    desc: 'Delivery boy is on the way to your room',
    icon: Bike,
  },
  {
    status: 'DELIVERED',
    label: 'Delivered',
    desc: 'Handed over at your hostel door. Enjoy!',
    icon: Home,
  },
];

export function OrderTrackingClient({ initialOrder }: OrderTrackingClientProps) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { repeatOrder, isRepeating } = useRepeatOrder();

  // Poll for status updates every 6 seconds so customer sees live progress when admin changes it
  const refreshOrderStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(refreshOrderStatus, 6000);
    return () => clearInterval(interval);
  }, [order.id]);

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Celebration Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
            {isCancelled ? (
              <XCircle className="w-9 h-9 text-rose-600" />
            ) : order.status === 'DELIVERED' ? (
              <Home className="w-9 h-9 text-emerald-600" />
            ) : (
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            )}
          </div>

          <span className="text-xs uppercase font-bold tracking-widest text-slate-400 block mb-1">
            Order Confirmation
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
            {isCancelled
              ? 'This order was cancelled'
              : order.status === 'DELIVERED'
              ? 'Delivered to your room!'
              : '🎉 Your cravings are on the way!'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Order <strong className="text-[#FF6B00] font-black">{order.orderNumber}</strong> • Placed on{' '}
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>

          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() =>
                repeatOrder(
                  order.items.map((i) => ({
                    productId: i.productId,
                    productName: i.productName,
                    quantity: i.quantity,
                  }))
                )
              }
              disabled={isRepeating}
              className="px-4 py-2 bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRepeating ? 'animate-spin' : ''}`} />
              <span>{isRepeating ? 'Checking Stock...' : 'Repeat Order'}</span>
            </button>

            <button
              onClick={refreshOrderStatus}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking...' : 'Refresh Status'}</span>
            </button>
          </div>
        </div>

        {/* Live Order Status Stepper */}
        {!isCancelled && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm mb-6">
            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Order Tracker</span>
            </h3>

            <div className="relative">
              {/* Stepper Grid */}
              <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-5 gap-3">
                {STATUS_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.status} className="flex md:flex-col items-center gap-3 md:text-center">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                          isCurrent
                            ? 'bg-[#FF6B00] text-white ring-4 ring-orange-100 shadow-lg scale-110'
                            : isCompleted
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 md:w-full">
                        <h4
                          className={`text-xs sm:text-sm font-bold leading-tight ${
                            isCurrent
                              ? 'text-[#FF6B00]'
                              : isCompleted
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Hostel Room Delivery Info */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                <MapPin className="w-4 h-4 text-[#FF6B00]" />
                <span>Hostel Delivery Destination</span>
              </div>

              <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-[#FF6B00]" />
                  <span className="font-bold text-slate-800 text-sm">{order.hostel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-emerald-600" />
                  <span className="text-base font-black text-slate-900">Room: {order.roomNumber}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <p>
                  <strong>Recipient:</strong> {order.customerName}
                </p>
                <p className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <strong>Phone:</strong> +91 {order.phone}
                </p>
                {order.deliveryNote && (
                  <p className="text-slate-500 bg-slate-50 p-2.5 rounded-xl mt-2 italic border border-slate-100">
                    &ldquo;{order.deliveryNote}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <ShieldCheck className="w-4 h-4" /> Doorstep Room Dispatch
              </span>
              <span>10-15 min ETA</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Payment Method</span>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-emerald-950">CASH ON DELIVERY</span>
                  <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    PAY AT ROOM
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-1">
                  Please hand over exact cash to the delivery boy upon receiving your items.
                </p>
              </div>

              {/* Bill Details */}
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Hostel Room Delivery</span>
                  <span className="font-bold uppercase">₹0 (FREE)</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
                  <span>Total Amount Due</span>
                  <Currency amount={order.total} className="text-lg text-slate-900" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm mb-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Items in this Order ({order.items.length})
          </h3>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {item.product?.imageUrl && (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                      <Image
                        src={item.product.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      {item.product?.foodType && <VegBadge type={item.product.foodType} />}
                      <h4 className="text-sm font-bold text-slate-800">{item.productName}</h4>
                    </div>
                    <p className="text-xs text-slate-400">
                      ₹{item.price} × {item.quantity}
                    </p>
                  </div>
                </div>

                <Currency amount={item.subtotal} className="text-sm text-slate-900 font-bold" />
              </div>
            ))}
          </div>
        </div>

        {/* Back to Home & Repeat Order CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() =>
              repeatOrder(
                order.items.map((i) => ({
                  productId: i.productId,
                  productName: i.productName,
                  quantity: i.quantity,
                }))
              )
            }
            disabled={isRepeating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 transition hover:scale-105 active:scale-95 text-sm cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isRepeating ? 'animate-spin' : ''}`} />
            <span>{isRepeating ? 'Revalidating Stock...' : 'Repeat This Order'}</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm transition hover:scale-105 active:scale-95 text-sm"
          >
            <span>Browse More Snacks</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
