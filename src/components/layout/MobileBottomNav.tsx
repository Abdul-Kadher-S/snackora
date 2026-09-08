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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition ${
                active ? 'text-[#FF6B00]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
        {/* Cart button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition text-[#FF6B00] relative"
        >
          <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 right-1 w-4 h-4 bg-[#FF6B00] text-white text-[9px] font-black rounded-full flex items-center justify-center">
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
          <span className="text-[10px] font-bold">Cart</span>
        </button>
      </div>
    </nav>
  );
}
