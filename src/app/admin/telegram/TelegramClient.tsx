'use client';

import React, { useState } from 'react';
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Bot,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Info,
  Smartphone,
  Users,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export function TelegramClient() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/test-telegram');
      const data = await res.json();
      setResult({ status: res.status, ok: res.ok, data });
      if (res.ok && data.success) {
        showToast('Test notification sent successfully! 🚀', 'success');
      } else {
        showToast(data.hint || data.error || 'Test failed. Check diagnostic info.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      setResult({
        status: 500,
        ok: false,
        data: { error: 'Network connection failed to /api/admin/test-telegram' },
      });
      showToast('Network error testing Telegram API', 'error');
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shadow-lg shadow-sky-500/10">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Telegram Order Alerts
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Instant delivery notifications dispatched to your staff group whenever a customer places an order.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="px-6 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-black rounded-2xl text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Testing Connection...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Test Notification</span>
            </>
          )}
        </button>
      </div>

      {/* Result Diagnostic Box */}
      {result && (
        <div
          className={`p-6 rounded-3xl border transition-all animate-fade-in ${
            result.ok && result.data.success
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.ok && result.data.success ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-2 flex-1">
              <h3 className="text-base font-black text-white">
                {result.ok && result.data.success
                  ? '🎉 Connection Successful!'
                  : '❌ Telegram Delivery Test Failed'}
              </h3>
              <p className="text-xs sm:text-sm">
                {result.data.message ||
                  result.data.hint ||
                  result.data.error ||
                  (result.data.telegramError && result.data.telegramError.description)}
              </p>

              {result.data.details && (
                <div className="mt-3 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Environment Variables Detected:</p>
                  <div>TELEGRAM_BOT_TOKEN: <span className="text-amber-300">{result.data.details.TELEGRAM_BOT_TOKEN}</span></div>
                  <div>TELEGRAM_CHAT_ID: <span className="text-amber-300">{result.data.details.TELEGRAM_CHAT_ID}</span></div>
                </div>
              )}

              {result.data.telegramError && (
                <div className="mt-3 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono text-rose-300">
                  <p className="text-slate-400 font-bold uppercase text-[10px] mb-1">Telegram API Raw Response:</p>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(result.data.telegramError, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3 Step Setup Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-sm">
              1
            </div>
            <h3 className="font-bold text-white text-sm">1. Create Bot & Token</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Open <strong>@BotFather</strong> on Telegram, send <code className="text-sky-300 bg-slate-900 px-1 rounded">/newbot</code>, choose a bot name, and copy the HTTP API Token.
            </p>
          </div>
          <div className="pt-2">
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition"
            >
              <span>Open BotFather</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-sm">
              2
            </div>
            <h3 className="font-bold text-white text-sm">2. Add Bot as Group Admin</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create your Telegram Staff group, add your bot into it, and promote it to <strong>Administrator</strong> with message permissions.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] text-slate-500 font-semibold">
              Group Chat IDs begin with <code className="text-amber-300">-100...</code>
            </span>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-lg space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
              3
            </div>
            <h3 className="font-bold text-white text-sm">3. Add Variables to Vercel</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In Vercel Dashboard → Project Settings → <strong>Environment Variables</strong>:
            </p>
            <div className="text-[11px] font-mono bg-slate-900 p-2 rounded-lg text-slate-300 space-y-1 border border-slate-700">
              <div>TELEGRAM_BOT_TOKEN</div>
              <div>TELEGRAM_CHAT_ID</div>
            </div>
          </div>
          <p className="text-[11px] text-amber-300 font-medium">
            ⚠️ Must trigger a Redeploy after adding vars!
          </p>
        </div>
      </div>

      {/* Example Order Notification Preview */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">Live Notification Message Preview</h3>
          </div>
          <span className="text-xs text-slate-400">Telegram HTML Format</span>
        </div>

        <div className="bg-[#182533] border border-sky-900/40 rounded-2xl p-4 text-xs font-mono text-slate-200 leading-relaxed max-w-lg shadow-inner">
          <div className="text-white font-bold mb-1">🚨 NEW ORDER #SB-1042 🚨</div>
          <div className="text-slate-400 mb-2">🕒 Time: 11:30 PM, 10 Sep</div>
          <div>👤 <b>Customer:</b> Rohan Sharma</div>
          <div>📞 <b>Phone:</b> <span className="text-sky-400 underline">+91 9876543210</span></div>
          <div>🏢 <b>Block:</b> Noyyal Old Block</div>
          <div>🚪 <b>Room:</b> 304</div>
          <div className="my-2 border-t border-slate-700/60 pt-2">
            <div>🛒 <b>Order Items:</b></div>
            <div className="pl-2 text-slate-300">
              <div>1. <b>Kurkure Solid Masti</b> × 2 — ₹40</div>
              <div>2. <b>Red Bull 250ml</b> × 1 — ₹125</div>
            </div>
          </div>
          <div className="border-t border-slate-700/60 pt-2 space-y-0.5">
            <div>💰 <b>Subtotal:</b> ₹165</div>
            <div>🚚 <b>Delivery Fee:</b> ₹20</div>
            <div className="font-bold text-emerald-400">💵 TOTAL PAYABLE: ₹185</div>
            <div className="text-slate-400">💳 Payment: Cash on Delivery (COD)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
