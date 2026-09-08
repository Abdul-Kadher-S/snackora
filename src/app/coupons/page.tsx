'use client';

import React, { useState, useEffect } from 'react';
import { useHostel } from '@/context/HostelContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Coupon } from '@/types';
import { Ticket, Gift, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function CouponsPage() {
  const { savedPhone } = useHostel();
  const [available, setAvailable] = useState<Coupon[]>([]);
  const [used, setUsed] = useState<Coupon[]>([]);
  const [expired, setExpired] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'available' | 'used' | 'expired'>('available');
  const [phone, setPhone] = useState(savedPhone || '');

  const fetchCoupons = async (ph: string) => {
    if (!ph || ph.length < 10) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/coupons?phone=${ph}`);
      if (res.ok) {
        const data = await res.json();
        setAvailable(data.available || []);
        setUsed(data.used || []);
        setExpired(data.expired || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (savedPhone) {
      setPhone(savedPhone);
      fetchCoupons(savedPhone);
    } else {
      setLoading(false);
    }
  }, [savedPhone]);

  const renderCoupon = (coupon: Coupon, type: 'available' | 'used' | 'expired') => {
    const expiresAt = new Date(coupon.expiresAt);
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
      <div key={coupon.id} className={`rounded-2xl border p-4 ${
        type === 'available' ? 'border-[#FF6B00] bg-orange-50' : type === 'used' ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-rose-50/50'
      }`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              type === 'available' ? 'bg-[#FF6B00] text-white' : type === 'used' ? 'bg-slate-300 text-white' : 'bg-rose-300 text-white'
            }`}>
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-lg text-slate-900">₹{coupon.value}</p>
              <p className="text-[11px] text-slate-500">Snackora Coupon</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            type === 'available' ? 'bg-emerald-100 text-emerald-700' : type === 'used' ? 'bg-slate-200 text-slate-600' : 'bg-rose-100 text-rose-700'
          }`}>
            {type === 'available' ? 'AVAILABLE' : type === 'used' ? 'USED' : 'EXPIRED'}
          </span>
        </div>

        <div className="space-y-1 text-xs text-slate-500">
          <p>{coupon.pointsSpent} SnackPoints redeemed</p>
          <p>Created: {new Date(coupon.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          {type === 'available' && (
            <p className={`font-semibold ${daysLeft <= 1 ? 'text-rose-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-slate-600'}`}>
              {daysLeft <= 0 ? '⚠️ Expires today' : `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
            </p>
          )}
          {type === 'used' && coupon.usedAt && (
            <p>Used: {new Date(coupon.usedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          )}
          {type === 'expired' && (
            <p>Expired: {expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { key: 'available' as const, label: 'Available', count: available.length, icon: CheckCircle2 },
    { key: 'used' as const, label: 'Used', count: used.length, icon: Clock },
    { key: 'expired' as const, label: 'Expired', count: expired.length, icon: XCircle },
  ];

  const currentList = tab === 'available' ? available : tab === 'used' ? used : expired;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
            <Ticket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Coupons</h1>
          <p className="text-sm text-slate-500 mt-1">Earned from SnackPoints redemption. Valid for 7 days.</p>
        </div>

        {!phone ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto">
            <p className="text-sm text-slate-600 mb-4">Enter your mobile number to view coupons.</p>
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
                onClick={() => fetchCoupons(phone)}
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
        ) : (
          <div>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    tab === t.key
                      ? 'bg-[#FF6B00] text-white shadow-lg shadow-orange-500/20'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    tab === t.key ? 'bg-white/20' : 'bg-slate-100'
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Coupon List */}
            {currentList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Ticket className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">
                  {tab === 'available' ? 'No coupons yet 🎟️' : tab === 'used' ? 'No used coupons.' : 'No expired coupons.'}
                </p>
                {tab === 'available' && (
                  <p className="text-xs text-slate-400 mt-1">Earn SnackPoints and redeem them for Snackora coupons.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentList.map((c) => renderCoupon(c, tab))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
