'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Home, Search, Grid3X3, ShoppingBag, ClipboardList } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();

  // Don't show on admin
  if (pathname.startsWith('/admin')) return null;

  const navItems = [
    { href: '/', label: 'Home', icon: Home, exact: true },
    { href: '/categories', label: 'Categories', icon: Grid3X3 },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/orders', label: 'Orders', icon: ClipboardList },
  ];

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/98 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)' }}
    >
      <div className="flex items-center justify-around h-[60px] max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] min-h-[44px] py-1 px-2 rounded-xl transition-all active:scale-90 ${
                active ? 'text-[#FF6B00]' : 'text-slate-400 active:text-slate-600'
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[11px] font-bold leading-tight">{item.label}</span>
            </Link>
          );
        })}
        {/* Cart button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[52px] min-h-[44px] py-1 px-2 rounded-xl transition-all active:scale-90 text-[#FF6B00] relative"
        >
          <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
          {totalItems > 0 && (
            <span className="absolute top-0 right-0.5 min-w-[18px] h-[18px] bg-[#FF6B00] text-white text-[10px] font-black rounded-full flex items-center justify-center px-0.5">
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
          <span className="text-[11px] font-bold leading-tight">Cart</span>
        </button>
      </div>
    </nav>
  );
}
