'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useHostel } from '@/context/HostelContext';
import {
  ShoppingBag,
  Search,
  Star,
  Ticket,
  Bell,
  Cookie,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();
  const { savedPhone } = useHostel();
  const [pointsBalance, setPointsBalance] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('snackora_cached_points');
      if (cached !== null && !isNaN(parseInt(cached, 10))) {
        return parseInt(cached, 10);
      }
    }
    return null;
  });

  const fetchPoints = useCallback(() => {
    let phone = savedPhone;
    if (!phone && typeof window !== 'undefined') {
      phone =
        localStorage.getItem('snackora_saved_phone') ||
        localStorage.getItem('snackora_phone') ||
        localStorage.getItem('hb_user_phone') ||
        '';
    }

    const clean = (phone || '').replace(/\D/g, '');
    if (clean.length === 10) {
      fetch(`/api/snackpoints?phone=${clean}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && (data.availableSnackpoints !== undefined || data.points !== undefined)) {
            const pts = Number(data.availableSnackpoints ?? data.points?.availablePoints ?? data.points ?? 0);
            setPointsBalance(pts);
            try {
              localStorage.setItem('snackora_cached_points', String(pts));
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, [savedPhone]);

  useEffect(() => {
    fetchPoints();

    // Listen for custom points updates (order placed, points redeemed, phone entered, etc.)
    const handleUpdate = () => fetchPoints();
    window.addEventListener('snackpoints_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('snackpoints_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchPoints]);

  // Don't show customer navbar on admin pages
  if (pathname.startsWith('/admin')) return null;

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-2 md:gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 md:gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight text-slate-900 group-hover:text-[#FF6B00] transition-colors leading-none">
                  Snack<span className="text-[#FF6B00]">ora</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5 hidden sm:block">
                  The World of Snacks, Delivered.
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <Link
              href="/"
              className={`px-3 py-2 rounded-xl text-sm font-bold transition ${
                isActive('/') ? 'text-[#FF6B00] bg-orange-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>
            <Link
              href="/categories"
              className={`px-3 py-2 rounded-xl text-sm font-bold transition ${
                isActive('/categories')
                  ? 'text-[#FF6B00] bg-orange-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Categories
            </Link>
            <Link
              href="/search"
              className={`px-3 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ${
                isActive('/search')
                  ? 'text-[#FF6B00] bg-orange-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Link>
            <Link
              href="/orders"
              className={`px-3 py-2 rounded-xl text-sm font-bold transition ${
                isActive('/orders')
                  ? 'text-[#FF6B00] bg-orange-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              My Orders
            </Link>
            <Link
              href="/coupons"
              className={`px-3 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ${
                isActive('/coupons')
                  ? 'text-[#FF6B00] bg-orange-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Ticket className="w-4 h-4 text-purple-500" />
              <span>Coupons</span>
            </Link>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Quick Button for small screens */}
            <Link
              href="/search"
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* SnackPoints Dynamic Balance Badge (Visible directly near Cart) */}
            <Link
              href="/snackpoints"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black rounded-2xl shadow-md shadow-amber-500/20 text-xs sm:text-sm transition hover:scale-105 active:scale-95 group shrink-0"
              title="View your Available SnackPoints"
            >
              <Star className="w-4 h-4 fill-slate-950 text-slate-950 shrink-0 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline font-bold text-slate-900/90">SnackPoints:</span>
              <span className="bg-white/40 px-1.5 py-0.5 rounded-lg font-black text-slate-950">
                {pointsBalance !== null ? pointsBalance : 0} pts
              </span>
            </Link>

            {/* Notifications */}
            <Link
              href="/notifications"
              className="p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-3.5 sm:px-4 py-2 bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 flex items-center gap-2 text-xs sm:text-sm transition hover:scale-105 active:scale-95"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-[#FF6B00] text-xs font-black flex items-center justify-center shadow-xs animate-bounce">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
