import React from 'react';
import Link from 'next/link';
import { Heart, Sparkles, MapPin, Banknote, Cookie, MessageCircle } from 'lucide-react';

const WHATSAPP_URL = 'https://chat.whatsapp.com/IwYuJsn8xTF5UDL1uk8hqb?s=cl&p=a&mlu=4&ilr=4';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-24 lg:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 flex items-center justify-center text-white shadow-md">
                <Cookie className="w-5 h-5" />
              </div>
              <span className="font-black text-xl text-white tracking-tight">
                Snack<span className="text-[#FF6B00]">ora</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              The World of Snacks, Delivered. Fast, fresh, and affordable snack delivery crafted exclusively for hostel students.
            </p>
            <div className="pt-2 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Earn SnackPoints on Every Order!</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-white transition">
                  All Categories
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-white transition">
                  Search Snacks
                </Link>
              </li>
              <li>
                <Link href="/snackpoints" className="hover:text-white transition">
                  SnackPoints
                </Link>
              </li>
              <li>
                <Link href="/coupons" className="hover:text-white transition">
                  My Coupons
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Delivery & Payment */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">
              Delivery & Payment
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                <span>Noyyal New Block · Noyyal Old Block · Annex</span>
              </li>
              <li className="flex items-center gap-2">
                <Banknote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Cash on Delivery Only</span>
              </li>
            </ul>
            {/* WhatsApp Group */}
            <div className="mt-4">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Join Snackora WhatsApp Group</span>
              </a>
            </div>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">
              Customer Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/orders" className="hover:text-white transition">
                  Track Active Orders
                </Link>
              </li>
              <li>
                <Link href="/snackpoints" className="hover:text-white transition">
                  SnackPoints Rewards
                </Link>
              </li>
              <li>
                <Link href="/coupons" className="hover:text-white transition">
                  Redeemed Coupons
                </Link>
              </li>
              <li>
                <Link href="/notifications" className="hover:text-white transition">
                  Order Notifications
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Snackora. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>for hostel snack lovers.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
