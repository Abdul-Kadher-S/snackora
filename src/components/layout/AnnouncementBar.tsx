'use client';

import React from 'react';
import { useHostel } from '@/context/HostelContext';
import { Truck } from 'lucide-react';

export function AnnouncementBar() {
  const { bannerNotice, isOpen, deliverySettings } = useHostel();

  if (!isOpen) {
    return (
      <div className="bg-rose-600 text-white text-center py-2 px-4 text-xs font-bold">
        🔴 Snackora is currently closed. We&apos;ll be back soon!
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white text-center py-2 px-4 text-xs font-semibold overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap">
        <span>{bannerNotice}</span>
        <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
          <Truck className="w-3 h-3" />
          Free delivery above ₹{deliverySettings.freeDeliveryThreshold}
        </span>
      </div>
    </div>
  );
}
