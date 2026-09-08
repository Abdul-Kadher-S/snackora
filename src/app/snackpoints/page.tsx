'use client';

import React, { useState, useEffect } from 'react';
import { useHostel } from '@/context/HostelContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { SNACKPOINT_TIERS } from '@/types';
import { Star, Gift, Clock, TrendingUp, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function SnackPointsPage() {
  const { savedPhone, setSavedPhone } = useHostel();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [phone, setPhone] = useState(savedPhone || '');

  const fetchData = async (ph: string) => {
    const clean = (ph || '').replace(/\D/g, '');
    if (clean.length !== 10) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/snackpoints?phone=${clean}`);
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
        setSavedPhone(clean);
        try {
          localStorage.setItem('snackora_saved_phone', clean);
          localStorage.setItem('snackora_phone', clean);
          if (resData.availableSnackpoints !== undefined) {
            localStorage.setItem('snackora_cached_points', String(resData.availableSnackpoints));
          }
          window.dispatchEvent(new Event('snackpoints_updated'));
        } catch {}
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let p = savedPhone;
    if (!p && typeof window !== 'undefined') {
      p =
        localStorage.getItem('snackora_saved_phone') ||
        localStorage.getItem('snackora_phone') ||
        localStorage.getItem('hb_user_phone') ||
        '';
    }

    if (p && p.replace(/\D/g, '').length === 10) {
      const clean = p.replace(/\D/g, '');
      setPhone(clean);
      fetchData(clean);
    } else {
      setLoading(false);
    }
  }, [savedPhone]);

  const handleRedeem = async (points: number) => {
    setRedeeming(true);
    try {
      const clean = phone.replace(/\D/g, '');
      const res = await fetch('/api/snackpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, points }),
      });
      if (res.ok) {
        try {
          localStorage.setItem('snackora_saved_phone', clean);
          localStorage.setItem('snackora_phone', clean);
          window.dispatchEvent(new Event('snackpoints_updated'));
        } catch {}
        fetchData(clean);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to redeem');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
            <Star className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">SnackPoints</h1>
          <p className="text-sm text-slate-500 mt-1">Earn points on eligible purchases. Redeem for Snackora coupons.</p>
        </div>

        {!phone ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto">
            <p className="text-sm text-slate-600 mb-4">Enter your mobile number to view your SnackPoints.</p>
            <div className="flex gap-2">
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPhone(val);
                  if (val.length === 10) {
                    fetchData(val);
                  }
                }}
                placeholder="9876543210"
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
              />
              <button
                onClick={() => fetchData(phone)}
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
          <div className="space-y-6">
            {/* Balance Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-4 shadow-lg">
                <Star className="w-5 h-5 mb-2 opacity-80" />
                <p className="text-2xl font-black">{data?.availableSnackpoints || 0}</p>
                <p className="text-xs opacity-80">Available</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <Clock className="w-5 h-5 mb-2 text-slate-400" />
                <p className="text-2xl font-black text-slate-900">{data?.pendingSnackpoints || 0}</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <TrendingUp className="w-5 h-5 mb-2 text-emerald-500" />
                <p className="text-2xl font-black text-slate-900">{data?.totalEarned || 0}</p>
                <p className="text-xs text-slate-500">Total Earned</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <Gift className="w-5 h-5 mb-2 text-purple-500" />
                <p className="text-2xl font-black text-slate-900">{data?.totalRedeemed || 0}</p>
                <p className="text-xs text-slate-500">Redeemed</p>
              </div>
            </div>

            {/* Redeem Tiers */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-1">Redeem SnackPoints</h2>
              <p className="text-xs text-slate-500 mb-4">Convert your points into Snackora coupons. Max ₹20 per order.</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SNACKPOINT_TIERS.map((tier) => {
                  const canRedeem = (data?.availableSnackpoints || 0) >= tier.points;
                  return (
                    <div
                      key={tier.points}
                      className="border border-slate-200 rounded-2xl p-4 text-center flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-500">{tier.points} points</p>
                        <p className="text-2xl font-black text-[#FF6B00] my-1">₹{tier.value}</p>
                      </div>
                      <button
                        onClick={() => handleRedeem(tier.points)}
                        disabled={!canRedeem || redeeming}
                        className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition ${
                          canRedeem
                            ? 'bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-md'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {redeeming ? '...' : canRedeem ? 'Redeem' : 'Need more pts'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* History */}
            {data?.transactions && data.transactions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-base font-bold text-slate-900 mb-3">Points History</h2>
                <div className="divide-y divide-slate-100">
                  {data.transactions.map((tx: any) => (
                    <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{tx.description || tx.type}</p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`font-black ${
                          tx.type === 'EARN'
                            ? 'text-emerald-600'
                            : tx.type === 'REDEEM'
                            ? 'text-purple-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {tx.type === 'REDEEM' ? '-' : '+'}
                        {tx.points} pts
                      </span>
                    </div>
                  ))}
                </div>
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
