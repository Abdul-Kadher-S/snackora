'use client';

import React, { useState } from 'react';
import { useHostel } from '@/context/HostelContext';
import { useToast } from '@/context/ToastContext';
import { X, Lock, Phone, ArrowRight, Loader2, KeyRound, CheckCircle2, UserCheck } from 'lucide-react';

export function CustomerLoginModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, customerLogin, customerSetupPin } = useHostel();
  const { showToast } = useToast();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSettingUpPin, setIsSettingUpPin] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');

  if (!isLoginModalOpen) return null;

  const handleClose = () => {
    setIsLoginModalOpen(false);
    setError('');
    setIsSettingUpPin(false);
    setPin('');
    setConfirmPin('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!/^\d{4}$/.test(pin.trim())) {
      setError('PIN must be exactly 4 digits (numbers only).');
      return;
    }

    setLoading(true);

    if (isSettingUpPin) {
      if (pin.trim() !== confirmPin.trim()) {
        setError('PIN confirmation does not match.');
        setLoading(false);
        return;
      }

      const res = await customerSetupPin({
        phone: cleanPhone,
        pin: pin.trim(),
        confirmPin: confirmPin.trim(),
      });

      if (res.success) {
        showToast('🎉 Your 4-digit PIN is set and you are logged in!', 'success');
        handleClose();
      } else {
        setError(res.error || 'Failed to setup PIN');
      }
      setLoading(false);
      return;
    }

    // Normal Login
    const res = await customerLogin(cleanPhone, pin.trim());
    if (res.success) {
      showToast('🎉 Welcome back to SNACKORA!', 'success');
      handleClose();
    } else if (res.needPinSetup) {
      setIsSettingUpPin(true);
      setSetupMessage(res.error || 'Welcome back! Please create your 4-digit PIN to secure your account.');
    } else {
      setError(res.error || 'Invalid credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col animate-scale-up">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF6B00] flex items-center justify-center mb-4">
          {isSettingUpPin ? <KeyRound className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          {isSettingUpPin ? 'Create your 4-digit PIN' : 'Welcome back to SNACKORA'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          {isSettingUpPin
            ? setupMessage || 'Create a 4-digit PIN for your account.'
            : 'Enter your registered mobile number and 4-digit PIN to access your saved room and orders.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Mobile Number:</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                disabled={isSettingUpPin}
                className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 disabled:opacity-60"
              />
            </div>
          </div>

          {/* 4-Digit PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>{isSettingUpPin ? 'Create your 4-digit PIN:' : '4-Digit PIN:'}</span>
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-black tracking-[0.4em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
            />
            <span className="text-[10px] text-slate-400 block mt-1">4 digits, numbers only</span>
          </div>

          {/* Confirm PIN if Setting Up */}
          {isSettingUpPin && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Confirm your 4-digit PIN:</span>
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-black tracking-[0.4em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
              />
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || phone.length !== 10 || pin.length !== 4 || (isSettingUpPin && confirmPin.length !== 4)}
            className="w-full py-3 bg-[#FF6B00] hover:bg-[#EA580C] disabled:bg-slate-300 text-white font-bold rounded-xl text-sm shadow-md shadow-orange-500/20 transition hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isSettingUpPin ? 'Save PIN & Login' : 'Login'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-4">
          First-time customer? Place your first order to create an account and set your PIN.
        </p>
      </div>
    </div>
  );
}
