'use client';

import React, { useState, useEffect } from 'react';
import { useHostel } from '@/context/HostelContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { SnackNotification } from '@/types';
import { Bell, CheckCircle2, Loader2, ShoppingBag, Star, Ticket, MessageSquare, Gift } from 'lucide-react';

const TYPE_ICONS: Record<string, any> = {
  ORDER: ShoppingBag,
  SNACKPOINTS: Star,
  COUPON: Ticket,
  ADMIN_MESSAGE: MessageSquare,
  OFFER: Gift,
  INFO: Bell,
};

export default function NotificationsPage() {
  const { savedPhone } = useHostel();
  const [notifications, setNotifications] = useState<SnackNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState(savedPhone || '');

  const fetchNotifications = async (ph: string) => {
    if (!ph || ph.length < 10) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?phone=${ph}`);
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (savedPhone) {
      setPhone(savedPhone);
      fetchNotifications(savedPhone);
    } else {
      setLoading(false);
    }
  }, [savedPhone]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
            <p className="text-xs text-slate-500 mt-1">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {!phone ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto">
            <p className="text-sm text-slate-600 mb-4">Enter your mobile number to view notifications.</p>
            <div className="flex gap-2">
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
              />
              <button
                onClick={() => fetchNotifications(phone)}
                className="px-4 py-2.5 bg-[#FF6B00] text-white font-bold rounded-xl text-sm"
              >
                View
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No notifications yet</p>
            <p className="text-xs text-slate-400 mt-1">Place an order to start receiving updates.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              return (
                <div
                  key={n.id}
                  className={`bg-white rounded-2xl border p-4 flex items-start gap-3 transition ${
                    !n.read ? 'border-[#FF6B00]/30 bg-orange-50/30' : 'border-slate-200'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    !n.read ? 'bg-[#FF6B00] text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-[#FF6B00] shrink-0 mt-2" />
                  )}
                </div>
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
