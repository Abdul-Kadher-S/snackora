'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useHostel, HOSTEL_BLOCKS } from '@/context/HostelContext';
import { useToast } from '@/context/ToastContext';
import { Currency } from '@/components/ui/Currency';
import { Coupon } from '@/types';
import {
  X,
  Building2,
  DoorOpen,
  User,
  Phone,
  MessageSquare,
  Banknote,
  Loader2,
  CheckCircle2,
  Truck,
  AlertTriangle,
  Ticket,
  Gift,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function CheckoutModal() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    cart,
    subtotal,
    isCheckoutOpen,
    setIsCheckoutOpen,
    clearCart,
    selectedCoupon,
    setSelectedCoupon,
  } = useCart();
  const {
    selectedHostel,
    setSelectedHostel,
    savedRoom,
    setSavedRoom,
    savedName,
    setSavedName,
    savedPhone,
    setSavedPhone,
    isOpen: isStoreOpen,
    deliverySettings,
    isDeliveryAvailable,
    getDeliveryFee,
    getFreeDeliveryRemaining,
  } = useHostel();

  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState(savedName || '');
  const [phone, setPhone] = useState(savedPhone || '');
  const [hostel, setHostel] = useState(selectedHostel || HOSTEL_BLOCKS[0]);
  const [roomNumber, setRoomNumber] = useState(savedRoom || '');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Coupon state
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // Fetch coupons whenever phone is 10 digits or modal opens
  const fetchCoupons = async (targetPhone?: string) => {
    const cleanPhone = (targetPhone || phone).replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setAvailableCoupons([]);
      return;
    }
    setLoadingCoupons(true);
    try {
      const res = await fetch(`/api/coupons?phone=${cleanPhone}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableCoupons(data.available || []);
      }
    } catch (e) {
      console.error('Failed to fetch coupons:', e);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    if (isCheckoutOpen) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        fetchCoupons(cleanPhone);
      }
    }
  }, [isCheckoutOpen, phone]);

  // Sync initial props
  useEffect(() => {
    if (savedName && !customerName) setCustomerName(savedName);
    if (savedPhone && !phone) setPhone(savedPhone);
    if (savedRoom && !roomNumber) setRoomNumber(savedRoom);
    if (selectedHostel && !hostel) setHostel(selectedHostel);
  }, [savedName, savedPhone, savedRoom, selectedHostel]);

  // Do not render CheckoutModal on admin pages or when closed
  if (pathname.startsWith('/admin') || !isCheckoutOpen) return null;

  const deliveryFee = getDeliveryFee(subtotal);
  const freeDeliveryRemaining = getFreeDeliveryRemaining(subtotal);
  const couponDiscount = selectedCoupon ? selectedCoupon.value : 0;
  const finalTotal = Math.max(0, subtotal + deliveryFee - couponDiscount);
  const hostelName = hostel.split(' — ')[0].trim();
  const deliveryAvailable = isDeliveryAvailable(hostel);

  // Name validation
  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError('');
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(name)) {
      setNameError('Please enter your name using letters only.');
    } else {
      setNameError('');
    }
  };

  // Phone validation
  const validatePhone = (ph: string) => {
    if (!ph) {
      setPhoneError('');
      return;
    }
    if (ph.length > 0 && ph.length < 10) {
      setPhoneError('Enter a 10-digit mobile number.');
    } else if (ph.length === 10 && !/^[6-9]/.test(ph)) {
      setPhoneError('Enter a valid Indian mobile number starting with 6-9.');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isStoreOpen) {
      setErrorMsg('Store is currently closed and not accepting new orders.');
      return;
    }

    if (!deliveryAvailable) {
      setErrorMsg(`🚫 Delivery is currently unavailable for ${hostelName}.`);
      return;
    }

    // Frontend validation
    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(customerName.trim())) {
      setErrorMsg('Please enter your name using letters only. Numbers and special characters are not allowed.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!roomNumber.trim()) {
      setErrorMsg('Please enter your room number.');
      return;
    }

    if (cart.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        phone: cleanPhone,
        hostel: hostel.trim(),
        roomNumber: roomNumber.trim().toUpperCase(),
        deliveryNote: deliveryNote.trim(),
        couponId: selectedCoupon?.id || null,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Save student details
      setSavedName(customerName.trim());
      setSavedPhone(cleanPhone);
      setSelectedHostel(hostel.trim());
      setSavedRoom(roomNumber.trim().toUpperCase());
      try {
        localStorage.setItem('snackora_phone', cleanPhone);
        window.dispatchEvent(new Event('snackpoints_updated'));
      } catch {}

      // Confetti!
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch {}

      showToast(`🎉 Order #${data.orderNumber} placed successfully!`, 'success');

      clearCart();
      setIsCheckoutOpen(false);

      // Save order to history
      try {
        const existing = JSON.parse(localStorage.getItem('snackora_recent_orders') || '[]');
        localStorage.setItem(
          'snackora_recent_orders',
          JSON.stringify([data.orderNumber, ...existing.filter((id: string) => id !== data.orderNumber)])
        );
      } catch {}

      router.push(`/orders/${data.orderNumber}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-hidden">
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 shrink-0">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">Checkout</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Enter your details for hostel room delivery
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCheckoutOpen(false)}
            className="w-8 h-8 rounded-full bg-white text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition hover:scale-105 active:scale-95"
            aria-label="Close checkout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form id="checkoutForm" onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 animate-slide-down flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Hostel / Block Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Hostel / Block *</span>
            </label>
            <select
              value={hostel}
              onChange={(e) => {
                setHostel(e.target.value);
                setSelectedHostel(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition text-slate-800 font-semibold"
            >
              {HOSTEL_BLOCKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            {!deliveryAvailable && (
              <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>🚫 Delivery is currently unavailable for {hostelName}.</span>
              </div>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Full Name *</span>
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => {
                const val = e.target.value.replace(/[^A-Za-z\s]/g, '');
                setCustomerName(val);
                validateName(val);
              }}
              placeholder="e.g. Abdul Kadher"
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition font-medium ${
                nameError ? 'border-rose-300' : 'border-slate-200'
              }`}
            />
            {nameError && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">{nameError}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Mobile Number *</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-slate-400">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPhone(val);
                  validatePhone(val);
                  if (val.length === 10) {
                    fetchCoupons(val);
                  }
                }}
                placeholder="9876543210"
                className={`w-full pl-12 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition font-medium ${
                  phoneError ? 'border-rose-300' : 'border-slate-200'
                }`}
              />
            </div>
            {phoneError && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">{phoneError}</p>
            )}
          </div>

          {/* Room Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <DoorOpen className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Room Number *</span>
            </label>
            <input
              type="text"
              required
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. 204, A-312"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition uppercase font-semibold"
            />
          </div>

          {/* Optional Delivery Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Order Note (Optional)</span>
            </label>
            <input
              type="text"
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="e.g. Call when outside, knock twice"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition"
            />
          </div>

          {/* Coupon Section */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-900">Snackora Coupons & Offers</span>
              </div>
              {loadingCoupons && (
                <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              )}
            </div>

            {phone.length < 10 ? (
              <p className="text-[11px] text-amber-700">
                Enter your 10-digit mobile number above to view and apply your coupons.
              </p>
            ) : availableCoupons.length === 0 ? (
              <p className="text-[11px] text-amber-800">
                No active coupons found for this number. Earn SnackPoints on your orders to redeem coupons!
              </p>
            ) : (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCoupon(null)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                    !selectedCoupon
                      ? 'bg-white border-2 border-amber-400 text-amber-800'
                      : 'bg-white/70 border border-amber-200 text-slate-600'
                  }`}
                >
                  <span>Do not use coupon</span>
                  {!selectedCoupon && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>

                {availableCoupons.map((c) => {
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
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#FF6B00]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delivery Fee Status */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-800">Delivery Status</span>
            </div>
            {freeDeliveryRemaining > 0 ? (
              <div>
                <p className="text-xs text-blue-700">
                  🚚 Add ₹{freeDeliveryRemaining.toFixed(0)} more to get FREE delivery!
                </p>
                <div className="mt-1.5 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (subtotal / deliverySettings.freeDeliveryThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-700 font-semibold">🎉 You unlocked FREE delivery!</p>
            )}
            <p className="text-[10px] text-blue-600 mt-1">
              Free delivery on orders above ₹{deliverySettings.freeDeliveryThreshold}
            </p>
          </div>

          {/* Payment Method Notice */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 font-bold">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-sm">CASH ON DELIVERY</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Pay in cash when your order is delivered to your room.
              </p>
            </div>
          </div>

          {/* Bill Summary */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal</span>
              <Currency amount={subtotal} className="font-semibold text-slate-700" />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Delivery</span>
              <span className={`font-semibold ${deliveryFee === 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-600 font-bold">
                <span>Coupon Applied</span>
                <span>-₹{couponDiscount}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Total (COD)</span>
              <Currency amount={finalTotal} className="text-xl font-black text-slate-900" />
            </div>
          </div>
        </form>

        {/* Sticky Action Button Bar (Always on screen) */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white shrink-0 pb-[max(env(safe-area-inset-bottom,0px),12px)]">
          <button
            type="submit"
            form="checkoutForm"
            disabled={isSubmitting || !deliveryAvailable}
            className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#EA580C] disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.98] text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Confirming Order...</span>
              </>
            ) : !deliveryAvailable ? (
              <>
                <AlertTriangle className="w-5 h-5" />
                <span>Delivery Unavailable</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Place Order — ₹{finalTotal.toFixed(0)} (Cash on Delivery)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
