'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Currency } from '@/components/ui/Currency';
import { VegBadge } from '@/components/ui/VegBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Coupon } from '@/types';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Building2,
  Truck,
  Ticket,
  Gift,
  Check,
  Loader2,
  Phone,
} from 'lucide-react';
import { useHostel } from '@/context/HostelContext';

export function CartDrawer() {
  const pathname = usePathname();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    totalItems,
    setIsCheckoutOpen,
    selectedCoupon,
    setSelectedCoupon,
  } = useCart();

  const {
    selectedHostel,
    savedPhone,
    getDeliveryFee,
    getFreeDeliveryRemaining,
    deliverySettings,
    isDeliveryAvailable,
  } = useHostel();

  const [phone, setPhone] = useState(savedPhone || '');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // Fetch coupons for this phone number
  const fetchCoupons = async (ph?: string) => {
    const clean = (ph || phone).replace(/\D/g, '');
    if (clean.length !== 10) {
      setCoupons([]);
      return;
    }
    setLoadingCoupons(true);
    try {
      const res = await fetch(`/api/coupons?phone=${clean}`);
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.available || []);
      }
    } catch (e) {
      console.error('Error fetching coupons:', e);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    if (isCartOpen) {
      if (savedPhone) {
        setPhone(savedPhone);
        fetchCoupons(savedPhone);
      } else if (phone.length === 10) {
        fetchCoupons(phone);
      }
    }
  }, [isCartOpen, savedPhone]);

  // Do not render CartDrawer on admin pages or when closed
  if (pathname.startsWith('/admin') || !isCartOpen) return null;

  const deliveryFee = getDeliveryFee(subtotal);
  const freeRemaining = getFreeDeliveryRemaining(subtotal);
  const couponDiscount = selectedCoupon ? selectedCoupon.value : 0;
  const finalTotal = Math.max(0, subtotal + deliveryFee - couponDiscount);
  const hostelName = selectedHostel.split(' — ')[0];
  const deliveryOk = isDeliveryAvailable(selectedHostel);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-hidden">
      <div className="hidden sm:block flex-1" onClick={() => setIsCartOpen(false)} />

      <div className="relative w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-down overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900">Your Cart</h3>
              <span className="bg-orange-100 text-[#FF6B00] text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Delivering to: <strong className="text-slate-700">{hostelName}</strong></span>
            </p>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-9 h-9 rounded-full bg-white text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition hover:scale-105 active:scale-95"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Progress */}
        <div className={`px-4 py-2.5 border-b flex items-center gap-2 text-xs font-semibold ${
          freeRemaining > 0
            ? 'bg-blue-50 border-blue-100 text-blue-800'
            : 'bg-emerald-50 border-emerald-100 text-emerald-800'
        }`}>
          <Truck className="w-4 h-4 shrink-0" />
          {freeRemaining > 0 ? (
            <div className="flex-1">
              <span>🚚 Add ₹{freeRemaining.toFixed(0)} more to get FREE delivery!</span>
              <div className="mt-1 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (subtotal / deliverySettings.freeDeliveryThreshold) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <span>🎉 You unlocked FREE delivery!</span>
          )}
        </div>

        {/* Delivery unavailable warning */}
        {!deliveryOk && (
          <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-100 text-xs text-rose-700 font-semibold">
            🚫 Delivery is currently unavailable for {hostelName}.
          </div>
        )}

        {/* Cart Content: Items & Coupons */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {cart.length === 0 ? (
            <EmptyState
              type="cart"
              actionText="Browse Snacks"
              onAction={() => setIsCartOpen(false)}
            />
          ) : (
            <>
              {/* Product items */}
              <div className="divide-y divide-slate-100">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                    {/* Product image */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                      <div className="absolute top-1 right-1 bg-white/90 rounded p-0.5">
                        <VegBadge type={product.foodType} />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs md:text-sm truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">
                        ₹{product.price} each
                      </p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">
                        ₹{product.price * quantity}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center bg-slate-100 rounded-lg p-0.5 font-bold text-xs">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white text-slate-700 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-slate-900">{quantity}</span>
                        <button
                          onClick={() => {
                            if (quantity < product.stock) {
                              updateQuantity(product.id, quantity + 1);
                            }
                          }}
                          disabled={quantity >= product.stock}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white text-slate-700 transition disabled:opacity-40"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupons & Discounts Section In Cart */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black text-amber-900">Snackora Coupons</span>
                  </div>
                  {loadingCoupons && (
                    <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  )}
                </div>

                {phone.length < 10 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-amber-800">
                      Enter your mobile number to view and apply your coupons:
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">+91</span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setPhone(val);
                            if (val.length === 10) {
                              fetchCoupons(val);
                            }
                          }}
                          placeholder="9876543210"
                          className="w-full pl-9 pr-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => fetchCoupons(phone)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ) : coupons.length === 0 ? (
                  <div className="flex items-center justify-between text-[11px] text-amber-800">
                    <span>No active coupons for {phone}.</span>
                    <button
                      type="button"
                      onClick={() => setPhone('')}
                      className="text-[10px] text-amber-600 font-bold underline"
                    >
                      Change #
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span>Select a coupon to apply discount:</span>
                      <button
                        type="button"
                        onClick={() => setPhone('')}
                        className="text-amber-700 font-bold underline"
                      >
                        Change #
                      </button>
                    </div>

                    {coupons.map((c) => {
                      const isSelected = selectedCoupon?.id === c.id;
                      const expiresAt = new Date(c.expiresAt);
                      const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCoupon(isSelected ? null : c)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-white border-2 border-[#FF6B00] text-[#FF6B00] shadow-xs'
                              : 'bg-white/80 border border-amber-200 text-slate-700 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Gift className="w-3.5 h-3.5 text-[#FF6B00]" />
                            <span>₹{c.value} Snackora Coupon</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${daysLeft <= 1 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                              {daysLeft <= 0 ? 'Expires today' : `${daysLeft}d left`}
                            </span>
                            {isSelected ? (
                              <span className="bg-[#FF6B00] text-white p-0.5 rounded-full">
                                <Check className="w-3 h-3" />
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-[#FF6B00] hover:underline">
                                Apply
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {selectedCoupon && (
                      <button
                        type="button"
                        onClick={() => setSelectedCoupon(null)}
                        className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold underline block pt-1"
                      >
                        Remove selected coupon
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 md:p-5 border-t border-slate-100 bg-slate-50/90 flex flex-col gap-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className={`font-bold ${deliveryFee === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Applied</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
                <span>Total (Cash on Delivery)</span>
                <Currency amount={finalTotal} className="text-lg text-slate-900" />
              </div>
            </div>

            <button
              onClick={() => {
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              }}
              disabled={!deliveryOk}
              className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#EA580C] disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] text-sm"
            >
              <span>
                {deliveryOk
                  ? `Proceed to Checkout — ₹${finalTotal.toFixed(0)}`
                  : 'Delivery Unavailable'}
              </span>
              {deliveryOk && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
