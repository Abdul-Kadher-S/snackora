'use client';

import React, { useState, useEffect } from 'react';
import { Offer } from '@/types';
import { Plus, Ticket, Trash2, Power, RefreshCw, X, Loader2, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

function formatTime12h(timeStr: string) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const minuteStr = String(m).padStart(2, '0');
  return `${hour12}:${minuteStr} ${ampm}`;
}

export function OffersClient() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('15');
  const [minOrderValue, setMinOrderValue] = useState('199');
  const [timingType, setTimingType] = useState<'ALWAYS' | 'DATE_RANGE' | 'DAILY_WINDOW'>('ALWAYS');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [dailyStartTime, setDailyStartTime] = useState('00:00');
  const [dailyEndTime, setDailyEndTime] = useState('04:00');
  const [saving, setSaving] = useState(false);

  // Deletion & toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);

  const { showToast } = useToast();

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/offers?activeOnly=false');
      if (res.ok) {
        const data = await res.json();
        setOffers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) return;

    if (timingType === 'DAILY_WINDOW' && (!dailyStartTime || !dailyEndTime)) {
      showToast('Please select both start time and end time for the daily window', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim(),
        discountType,
        discountValue: parseFloat(discountValue) || 10,
        minOrderValue: parseFloat(minOrderValue) || 0,
        active: true,
        validFrom: null,
        validUntil: null,
        dailyStartTime: null,
        dailyEndTime: null,
      };

      if (timingType === 'DATE_RANGE') {
        payload.validFrom = validFrom ? new Date(validFrom).toISOString() : null;
        payload.validUntil = validUntil ? new Date(validUntil).toISOString() : null;
      } else if (timingType === 'DAILY_WINDOW') {
        payload.dailyStartTime = dailyStartTime;
        payload.dailyEndTime = dailyEndTime;
        // Optionally allow date bounds too
        payload.validFrom = validFrom ? new Date(validFrom).toISOString() : null;
        payload.validUntil = validUntil ? new Date(validUntil).toISOString() : null;
      }

      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(`Promo coupon ${code.toUpperCase()} created!`, 'success');
        setIsModalOpen(false);
        setCode('');
        setTitle('');
        setDescription('');
        setTimingType('ALWAYS');
        setValidFrom('');
        setValidUntil('');
        setDailyStartTime('00:00');
        setDailyEndTime('04:00');
        fetchOffers();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create promo code', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while creating offer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (offer: Offer) => {
    const newActive = !offer.active;
    setTogglingId(offer.id);

    try {
      const res = await fetch(`/api/offers/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOffers((prev) =>
          prev.map((item) => (item.id === offer.id ? { ...item, active: updated.active } : item))
        );
        showToast(
          `Promo code ${offer.code} ${newActive ? 'activated' : 'deactivated'} successfully`,
          'success'
        );
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update promo status', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while updating promo status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!offerToDelete) return;
    const { id, code: promoCode } = offerToDelete;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setOffers((prev) => prev.filter((item) => item.id !== id));
        showToast(`Promo code ${promoCode} deleted successfully`, 'success');
        setOfferToDelete(null);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete promo code', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while deleting promo code', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Offers & Promo Codes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create percentage discounts, flat discounts, activate/deactivate, and manage promo codes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOffers}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
            title="Refresh promo codes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-[#FF6B00] hover:bg-[#EA580C] text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Promo Code</span>
          </button>
        </div>
      </div>

      {/* Offers List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && offers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
            <span>Loading offers...</span>
          </div>
        ) : offers.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-300">No promo codes found</p>
            <p className="text-xs text-slate-500 mt-1">Create your first promo code using the button above.</p>
          </div>
        ) : (
          offers.map((offer) => {
            const isToggling = togglingId === offer.id;
            const isDeleting = deletingId === offer.id;

            return (
              <div
                key={offer.id}
                className={`bg-slate-800/90 border rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all duration-200 ${
                  offer.active
                    ? 'border-slate-700/80'
                    : 'border-slate-800/60 bg-slate-900/60 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950 text-amber-300 font-black text-xs rounded-xl border border-amber-700/80 tracking-wider uppercase">
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{offer.code}</span>
                    </div>
                    {offer.active ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-slate-700">
                        DEACTIVATED
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-white text-base mb-1">{offer.title}</h3>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                    {offer.description || 'No description provided'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-700/80">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      {offer.discountType === 'PERCENTAGE'
                        ? `${offer.discountValue}% OFF`
                        : `Flat ₹${offer.discountValue} OFF`}
                    </span>
                    <span>Min Order: ₹{offer.minOrderValue}</span>
                  </div>

                  {/* Expiry & timing display */}
                  <div className="text-[11px] text-slate-400 flex flex-col gap-1 bg-slate-900/60 px-2.5 py-2 rounded-xl border border-slate-800">
                    {offer.dailyStartTime && offer.dailyEndTime && (
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          Everyday: {formatTime12h(offer.dailyStartTime)} – {formatTime12h(offer.dailyEndTime)}
                        </span>
                      </div>
                    )}

                    {offer.validFrom && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>
                          Starts: {new Date(offer.validFrom).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>
                    )}

                    {offer.validUntil ? (
                      new Date(offer.validUntil) < new Date() ? (
                        <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                          <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>
                            Expired: {new Date(offer.validUntil).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            Expires: {new Date(offer.validUntil).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        </div>
                      )
                    ) : (
                      !offer.dailyStartTime && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Always Active (No Expiry)</span>
                        </div>
                      )
                    )}
                  </div>

                  {/* Actions: Activate / Deactivate & Delete */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isToggling || isDeleting}
                      onClick={() => handleToggleActive(offer)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                        offer.active
                          ? 'bg-slate-900/80 hover:bg-amber-950/40 text-amber-300 border-amber-900/50'
                          : 'bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                      }`}
                      title={offer.active ? 'Deactivate this promo code' : 'Activate this promo code'}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Power className="w-3.5 h-3.5" />
                      )}
                      <span>{offer.active ? 'Deactivate' : 'Activate'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isToggling || isDeleting}
                      onClick={() => setOfferToDelete(offer)}
                      className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded-xl transition"
                      title="Delete promo code"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {offerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">Delete Promo Code?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete <span className="text-amber-400 font-bold">{offerToDelete.code}</span>? Customers will no longer be able to use this code.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOfferToDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-xs text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId === offerToDelete.id}
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/50"
              >
                {deletingId === offerToDelete.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white">Create New Coupon Offer</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MIDNIGHT25"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Offer Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 25% Off Midnight Snacks"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Valid on all orders between 12 AM and 4 AM"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Discount Value</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Min Order Value (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>

              {/* Timing / Schedule Settings */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="block font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>Coupon Timing & Availability *</span>
                </label>

                {/* Timing Type Selector */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTimingType('ALWAYS')}
                    className={`py-2 px-2 rounded-xl font-bold text-[11px] transition text-center ${
                      timingType === 'ALWAYS'
                        ? 'bg-[#FF6B00] text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Always Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimingType('DATE_RANGE')}
                    className={`py-2 px-2 rounded-xl font-bold text-[11px] transition text-center ${
                      timingType === 'DATE_RANGE'
                        ? 'bg-[#FF6B00] text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Date & Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimingType('DAILY_WINDOW')}
                    className={`py-2 px-2 rounded-xl font-bold text-[11px] transition text-center ${
                      timingType === 'DAILY_WINDOW'
                        ? 'bg-[#FF6B00] text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Everyday Time
                  </button>
                </div>

                {/* Conditional Fields based on Timing Type */}
                {timingType === 'DATE_RANGE' && (
                  <div className="space-y-2.5 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                    <p className="text-[11px] text-slate-400">
                      Set when this coupon becomes active and when it automatically expires:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-medium text-[11px] text-slate-400 mb-1">
                          Start Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={validFrom}
                          onChange={(e) => setValidFrom(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-[11px] text-slate-400 mb-1">
                          End Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={validUntil}
                          onChange={(e) => setValidUntil(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {timingType === 'DAILY_WINDOW' && (
                  <div className="space-y-2.5 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                    <p className="text-[11px] text-amber-300 font-medium">
                      Everyday at the particular time (e.g. Midnight snack coupon between 12:00 AM and 04:00 AM):
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-medium text-[11px] text-slate-400 mb-1">
                          Daily Start Time *
                        </label>
                        <input
                          type="time"
                          required
                          value={dailyStartTime}
                          onChange={(e) => setDailyStartTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-[11px] text-slate-400 mb-1">
                          Daily End Time *
                        </label>
                        <input
                          type="time"
                          required
                          value={dailyEndTime}
                          onChange={(e) => setDailyEndTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-700/40">
                      <label className="block font-medium text-[11px] text-slate-400 mb-1">
                        Optional Campaign Expiry (Until date)
                      </label>
                      <input
                        type="datetime-local"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#FF6B00] hover:bg-[#EA580C] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Publish Offer</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
