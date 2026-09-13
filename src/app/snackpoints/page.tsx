'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useHostel } from '@/context/HostelContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { SNACKPOINT_TIERS } from '@/types';
import {
  Star,
  Gift,
  Clock,
  TrendingUp,
  Loader2,
  Bell,
  BellRing,
  BellOff,
  User,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function SnackPointsPage() {
  const { customer, isCustomerLoggedIn, setIsLoginModalOpen } = useHostel();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Push notification permission state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [notifSupported, setNotifSupported] = useState(true);
  const [notifStatusMsg, setNotifStatusMsg] = useState<string | null>(null);

  // Initial notification status check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!('Notification' in window)) {
        setNotifSupported(false);
        setPushEnabled(false);
      } else {
        setNotifSupported(true);
        const storedPref = localStorage.getItem('snackora_points_notif');
        if (storedPref === 'true' && Notification.permission === 'granted') {
          setPushEnabled(true);
        } else {
          setPushEnabled(false);
        }
      }
    }
  }, []);

  const handleToggleNotifications = async (targetState: boolean) => {
    setNotifStatusMsg(null);
    if (!('Notification' in window)) {
      setNotifStatusMsg('Push notifications are not supported by this browser.');
      return;
    }

    if (targetState) {
      // User wants to turn ON
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setPushEnabled(true);
          localStorage.setItem('snackora_points_notif', 'true');
          setNotifStatusMsg('✅ Push notifications active! You will be alerted when SnackPoints are credited.');
          // Fire a sample test confirmation notification
          try {
            new Notification('⭐ SnackPoints Alerts Activated', {
              body: 'You will receive instant alerts whenever your earned SnackPoints are credited upon order delivery!',
              icon: '/favicon.ico',
            });
          } catch {}
        } else if (permission === 'denied') {
          setPushEnabled(false);
          localStorage.setItem('snackora_points_notif', 'false');
          setNotifStatusMsg('⚠️ Notifications are blocked in your browser settings. Please allow notifications in browser permissions.');
        } else {
          setPushEnabled(false);
          localStorage.setItem('snackora_points_notif', 'false');
        }
      } catch (err) {
        console.error('Failed to request notification permission:', err);
        setNotifStatusMsg('Failed to enable notifications. Please check your browser settings.');
      }
    } else {
      // User wants to turn OFF
      setPushEnabled(false);
      localStorage.setItem('snackora_points_notif', 'false');
      setNotifStatusMsg('Push notifications turned OFF.');
    }
  };

  const fetchData = useCallback(async (ph: string) => {
    const clean = (ph || '').replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/snackpoints?phone=${clean}`);
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
        try {
          if (resData.availableSnackpoints !== undefined) {
            localStorage.setItem('snackora_cached_points', String(resData.availableSnackpoints));
          }
          window.dispatchEvent(new Event('snackpoints_updated'));
        } catch {}
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorMsg(errJson.error || 'Unable to load SnackPoints.');
      }
    } catch (e: any) {
      console.error('Failed to fetch SnackPoints:', e);
      setErrorMsg('Connection error. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch only for the logged-in customer's phone
  useEffect(() => {
    if (isCustomerLoggedIn && customer?.phone) {
      fetchData(customer.phone);
    } else {
      setData(null);
    }
  }, [isCustomerLoggedIn, customer?.phone, fetchData]);

  // Listen for realtime snackpoints update events
  useEffect(() => {
    const handleUpdated = () => {
      if (customer?.phone) {
        fetchData(customer.phone);
      }
    };
    window.addEventListener('snackpoints_updated', handleUpdated);
    return () => window.removeEventListener('snackpoints_updated', handleUpdated);
  }, [customer?.phone, fetchData]);

  const handleRedeem = async (points: number) => {
    if (!customer?.phone) return;
    setRedeeming(true);
    try {
      const clean = customer.phone.replace(/\D/g, '').slice(-10);
      const res = await fetch('/api/snackpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, points }),
      });
      if (res.ok) {
        try {
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
        {/* Header Banner */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
            <Star className="w-8 h-8 text-white fill-white/20" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">SnackPoints Rewards</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Earn points on eligible purchases and redeem them for instant discounts on your favorite snacks!
          </p>
        </div>

        {/* NOT LOGGED IN STATE */}
        {!isCustomerLoggedIn || !customer ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-md mx-auto shadow-sm space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto text-[#FF6B00]">
              <User className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">Sign in to View Your Points</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Only the points in your own account are displayed. Please log in with your mobile number and PIN to access your SnackPoints and redeem rewards.
              </p>
            </div>

            {/* Benefits list */}
            <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-600 border border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Earn SnackPoints automatically on eligible snack orders</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Redeem points for up to ₹20 off per order</span>
              </div>
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Get push notifications when points are credited upon delivery</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black rounded-2xl text-sm transition shadow-lg shadow-orange-500/25 active:scale-95 flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Log In with Mobile Number</span>
            </button>
          </div>
        ) : (
          /* LOGGED IN CUSTOMER VIEW */
          <div className="space-y-6">
            {/* Account Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">
                      {customer.name ? customer.name : 'Your Account'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    +91 {customer.phone}
                    {customer.roomNumber ? ` • Room ${customer.roomNumber}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchData(customer.phone)}
                disabled={loading}
                className="self-start sm:self-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                title="Refresh SnackPoints balance"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* PUSH NOTIFICATION SETTINGS CARD */}
            <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                    {pushEnabled ? (
                      <BellRing className="w-5 h-5 animate-bounce" />
                    ) : (
                      <BellOff className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900">
                        Delivery Push Notifications
                      </h3>
                      {pushEnabled ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                          OFF
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Receive an instant push alert when your SnackPoints are credited as soon as admin marks your order delivered.
                    </p>
                  </div>
                </div>

                {/* Turn ON / OFF Switch */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {pushEnabled ? (
                    <button
                      type="button"
                      onClick={() => handleToggleNotifications(false)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <BellOff className="w-3.5 h-3.5" />
                      <span>Turn OFF</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleNotifications(true)}
                      className="px-4 py-2 bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold rounded-xl text-xs transition shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>Turn ON Alerts</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status feedback message */}
              {notifStatusMsg && (
                <div className="text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-orange-200/80 text-slate-700 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>{notifStatusMsg}</span>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Balance Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-5 shadow-lg shadow-orange-500/15">
                <Star className="w-5 h-5 mb-2 opacity-90 fill-white/20" />
                <p className="text-3xl font-black">
                  {loading && !data ? '...' : data?.availableSnackpoints || 0}
                </p>
                <p className="text-xs font-bold opacity-90 mt-1">Available to Redeem</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                <Clock className="w-5 h-5 mb-2 text-slate-400" />
                <p className="text-3xl font-black text-slate-900">
                  {loading && !data ? '...' : data?.pendingSnackpoints || 0}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1">Pending Delivery</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                <TrendingUp className="w-5 h-5 mb-2 text-emerald-500" />
                <p className="text-3xl font-black text-slate-900">
                  {loading && !data ? '...' : data?.totalEarned || 0}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1">Total Earned</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                <Gift className="w-5 h-5 mb-2 text-purple-500" />
                <p className="text-3xl font-black text-slate-900">
                  {loading && !data ? '...' : data?.totalRedeemed || 0}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1">Redeemed</p>
              </div>
            </div>

            {/* Redeem Tiers */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-black text-slate-900">Redeem for Snackora Coupons</h2>
                <span className="text-xs text-slate-500 font-medium">Max ₹20 discount per order</span>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Convert your available SnackPoints directly into exclusive coupons valid on your orders.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SNACKPOINT_TIERS.map((tier) => {
                  const canRedeem = (data?.availableSnackpoints || 0) >= tier.points;
                  return (
                    <div
                      key={tier.points}
                      className="border border-slate-200 rounded-2xl p-4 text-center flex flex-col justify-between hover:border-orange-300 transition"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-500">{tier.points} points</p>
                        <p className="text-2xl font-black text-[#FF6B00] my-1">₹{tier.value}</p>
                        <p className="text-[11px] text-slate-400">Coupon Discount</p>
                      </div>
                      <button
                        onClick={() => handleRedeem(tier.points)}
                        disabled={!canRedeem || redeeming}
                        className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                          canRedeem
                            ? 'bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-md shadow-orange-500/20'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {redeeming ? 'Redeeming...' : canRedeem ? 'Redeem ₹' + tier.value : 'Need more pts'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Points History */}
            {data?.transactions && data.transactions.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <h2 className="text-base font-black text-slate-900 mb-4">Points History</h2>
                <div className="divide-y divide-slate-100">
                  {data.transactions.map((tx: any) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{tx.description || tx.type}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </p>
                      </div>
                      <span
                        className={`font-black text-sm ${
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
