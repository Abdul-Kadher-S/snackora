'use client';

import React, { useState, useEffect } from 'react';
import { Offer } from '@/types';
import { Plus, Ticket, Trash2, CheckCircle2, RefreshCw, X, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

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
  const [saving, setSaving] = useState(false);
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

    setSaving(true);
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          title: title.trim(),
          description: description.trim(),
          discountType,
          discountValue: parseFloat(discountValue) || 10,
          minOrderValue: parseFloat(minOrderValue) || 0,
          active: true,
        }),
      });

      if (res.ok) {
        showToast(`Promo coupon ${code.toUpperCase()} created!`, 'success');
        setIsModalOpen(false);
        setCode('');
        setTitle('');
        setDescription('');
        fetchOffers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
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
            Create percentage discounts, flat discounts, and midnight promo codes.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#FF6B00] hover:bg-[#EA580C] text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Promo Code</span>
        </button>
      </div>

      {/* Offers List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading offers...</div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950 text-amber-300 font-black text-xs rounded-xl border border-amber-700/80 tracking-wider uppercase">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>{offer.code}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                    ACTIVE
                  </span>
                </div>

                <h3 className="font-bold text-white text-base mb-1">{offer.title}</h3>
                <p className="text-xs text-slate-400 mb-3">{offer.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-700 text-xs text-slate-400 flex items-center justify-between">
                <span>
                  {offer.discountType === 'PERCENTAGE'
                    ? `${offer.discountValue}% OFF`
                    : `Flat ₹${offer.discountValue} OFF`}
                </span>
                <span>Min Order: ₹{offer.minOrderValue}</span>
              </div>
            </div>
          ))
        )}
      </div>

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
