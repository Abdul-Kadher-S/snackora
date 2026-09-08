'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ClipboardList, Ticket, Star, Cookie, Search, Bell } from 'lucide-react';

interface EmptyStateProps {
  type: 'cart' | 'orders' | 'coupons' | 'snackpoints' | 'search' | 'notifications';
  title?: string;
  message?: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  suggestions?: string[];
  onSuggestionClick?: (s: string) => void;
}

const EMPTY_STATES = {
  cart: {
    icon: ShoppingBag,
    title: 'Your cart is empty 🛒',
    message: 'Add something tasty from Snackora!',
    color: 'text-[#FF6B00]',
    bgColor: 'bg-orange-50',
  },
  orders: {
    icon: ClipboardList,
    title: 'No orders yet 🍿',
    message: 'Your next snack is waiting!',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  coupons: {
    icon: Ticket,
    title: 'No coupons yet 🎟️',
    message: 'Earn SnackPoints and redeem them for Snackora coupons.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  snackpoints: {
    icon: Star,
    title: '0 SnackPoints ⭐',
    message: 'Start ordering eligible snacks to earn SnackPoints.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
  },
  search: {
    icon: Search,
    title: 'No snacks found 🔍',
    message: 'Try a different keyword or browse our categories.',
    color: 'text-slate-400',
    bgColor: 'bg-slate-50',
  },
  notifications: {
    icon: Bell,
    title: 'No notifications yet 🔔',
    message: 'Place an order to start receiving real-time updates.',
    color: 'text-slate-400',
    bgColor: 'bg-slate-50',
  },
};

export function EmptyState({
  type,
  title,
  message,
  actionText,
  actionHref,
  onAction,
  suggestions,
  onSuggestionClick,
}: EmptyStateProps) {
  const config = EMPTY_STATES[type] || EMPTY_STATES.search;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className={`w-16 h-16 rounded-2xl ${config.bgColor} flex items-center justify-center mb-4`}>
        <Icon className={`w-8 h-8 ${config.color}`} />
      </div>
      <h3 className="text-lg font-black text-slate-800 mb-1">{title || config.title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-4">{message || config.message}</p>

      {suggestions && suggestions.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2 justify-center max-w-sm">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestionClick?.(s)}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-[#FF6B00] text-slate-600 rounded-full border border-slate-200 transition-colors capitalize"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {actionHref && actionText ? (
        <Link
          href={actionHref}
          className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold rounded-xl text-sm transition shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95"
        >
          {actionText}
        </Link>
      ) : actionText ? (
        <button
          type="button"
          onClick={onAction}
          className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold rounded-xl text-sm transition shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95"
        >
          {actionText}
        </button>
      ) : null}
    </div>
  );
}
