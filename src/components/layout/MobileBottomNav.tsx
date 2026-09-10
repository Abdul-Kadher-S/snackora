'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Home, Search, Ticket, ShoppingBag, ClipboardList } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();

  // Don't show on admin
  if (pathname.startsWith('/admin')) return null;

  const navItems = [
    { href: '/', label: 'Home', icon: Home, exact: true },
    { href: '/coupons', label: 'Discount Coupon', icon: Ticket, exact: false },
    { href: '/search', label: 'Search', icon: Search, exact: false },
    { href: '/orders', label: 'Orders', icon: ClipboardList, exact: false },
  ];

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/98 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      <div className="flex items-center justify-around h-[62px] max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 text-center ${
                active ? 'text-[#FF6B00] font-black' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] sm:text-[11px] font-bold leading-tight truncate max-w-[70px]">
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* Cart button */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 text-[#FF6B00] relative text-center"
          aria-label="Open Cart"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] bg-[#FF6B00] text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 shadow-sm">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold leading-tight mt-0.5">Cart</span>
        </button>
      </div>
    </nav>
  );
}
