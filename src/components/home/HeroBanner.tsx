'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, Zap, ShieldCheck, Star, Cookie } from 'lucide-react';
import { useHostel } from '@/context/HostelContext';

export function HeroBanner() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { deliverySettings } = useHostel();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/80 via-white to-slate-50 pt-8 pb-12 md:pt-14 md:pb-16 border-b border-slate-100">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Snackora Brand Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-orange-100 text-[#FF6B00] mb-4 shadow-xs">
            <Cookie className="w-4 h-4" />
            <span>SNACKORA</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-4">
            The World of <span className="text-[#FF6B00]">Snacks,</span> Delivered.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 font-medium mb-8 leading-relaxed max-w-2xl mx-auto">
            Chocolates, chips, beverages, ice cream, bakery items, and more — delivered straight to your hostel room.
          </p>

          {/* Quick Search */}
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mb-8">
            <div className="relative flex items-center shadow-xl shadow-orange-500/10 rounded-2xl bg-white border border-slate-200 p-1.5 focus-within:border-[#FF6B00] focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3.5 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search snacks, chocolates, beverages..."
                className="w-full px-3 py-2.5 text-sm md:text-base text-slate-800 bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold rounded-xl text-sm transition shrink-0 shadow-md shadow-orange-500/20 active:scale-95"
              >
                Search
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">Trending:</span>
              {['Lays', 'Dairy Milk', 'Cold Coffee', 'Brownie', 'Ice Cream', 'Cookies'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)}
                  className="bg-white hover:bg-orange-50 text-slate-600 hover:text-orange-700 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-medium transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </form>

          {/* Value Props */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl mx-auto pt-4 border-t border-slate-200/60">
            <div className="flex flex-col items-center p-2 rounded-xl">
              <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#FF6B00] mb-1.5">
                <Zap className="w-4 h-4" />
              </span>
              <span className="font-black text-[11px] sm:text-sm text-slate-900">Fast Delivery</span>
              <span className="text-[10px] text-slate-500">To Your Room</span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl">
              <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-1.5">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="font-black text-[11px] sm:text-sm text-slate-900">Free Above ₹{deliverySettings.freeDeliveryThreshold}</span>
              <span className="text-[10px] text-slate-500">Free Delivery</span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl">
              <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-1.5">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="font-black text-[11px] sm:text-sm text-slate-900">Cash on Delivery</span>
              <span className="text-[10px] text-slate-500">Pay at Door</span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl">
              <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-1.5">
                <Star className="w-4 h-4" />
              </span>
              <span className="font-black text-[11px] sm:text-sm text-slate-900">SnackPoints</span>
              <span className="text-[10px] text-slate-500">Earn & Redeem</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
