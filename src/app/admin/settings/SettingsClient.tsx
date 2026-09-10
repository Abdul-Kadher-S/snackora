import React, { useState, useEffect } from 'react';
import { Power, Clock, Bell, Save, Loader2, Truck, MessageCircle, AlertCircle, Send } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export function SettingsClient() {
  const [isOpen, setIsOpen] = useState(true);
  const [operatingHours, setOperatingHours] = useState('6:00 PM – 3:30 AM');
  const [announcement, setAnnouncement] = useState('⚡ Snackora is LIVE! Order snacks delivered to your room!');
  
  // Delivery settings
  const [deliveryCharge, setDeliveryCharge] = useState('20');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState('200');
  const [annexDelivery, setAnnexDelivery] = useState(true);
  const [noyyalNewDelivery, setNoyyalNewDelivery] = useState(true);
  const [noyyalDelivery, setNoyyalDelivery] = useState(true);
  const [whatsappUrl, setWhatsappUrl] = useState('https://chat.whatsapp.com/IwYuJsn8xTF5UDL1uk8hqb?s=cl&p=a&mlu=4&ilr=4');
  
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.isOpen !== undefined) setIsOpen(data.isOpen === 'true');
        if (data.operatingHours) setOperatingHours(data.operatingHours);
        if (data.announcement) setAnnouncement(data.announcement);
        if (data.delivery_charge) setDeliveryCharge(data.delivery_charge);
        if (data.free_delivery_threshold) setFreeDeliveryThreshold(data.free_delivery_threshold);
        if (data.annex_delivery_enabled !== undefined) setAnnexDelivery(data.annex_delivery_enabled !== 'false');
        if (data.noyyal_new_delivery_enabled !== undefined) setNoyyalNewDelivery(data.noyyal_new_delivery_enabled !== 'false');
        if (data.noyyal_delivery_enabled !== undefined) setNoyyalDelivery(data.noyyal_delivery_enabled !== 'false');
        if (data.whatsapp_group_url) setWhatsappUrl(data.whatsapp_group_url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOpen: isOpen ? 'true' : 'false',
          operatingHours: operatingHours.trim(),
          announcement: announcement.trim(),
          delivery_charge: deliveryCharge,
          free_delivery_threshold: freeDeliveryThreshold,
          annex_delivery_enabled: annexDelivery ? 'true' : 'false',
          noyyal_new_delivery_enabled: noyyalNewDelivery ? 'true' : 'false',
          noyyal_delivery_enabled: noyyalDelivery ? 'true' : 'false',
          whatsapp_group_url: whatsappUrl.trim(),
        }),
      });
      if (res.ok) {
        showToast('Settings saved and synced!', 'success');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Snackora Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Control store status, delivery settings, and announcements.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Status */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Power className={`w-5 h-5 ${isOpen ? 'text-emerald-400' : 'text-rose-400'}`} />
              <h3 className="text-base font-black text-white">Store Status</h3>
            </div>
            <p className="text-xs text-slate-400">
              {isOpen ? '🟢 OPEN: Accepting orders.' : '🔴 CLOSED: Not accepting orders.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-2 shadow-lg ${
              isOpen ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            {isOpen ? 'OPEN (Click to Close)' : 'CLOSED (Click to Open)'}
          </button>
        </div>

        {/* Operating Hours */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">Operating Hours & Announcement</h3>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Operating Hours
            </label>
            <input
              type="text"
              value={operatingHours}
              onChange={(e) => setOperatingHours(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Banner Announcement
            </label>
            <textarea
              rows={2}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
            />
          </div>
        </div>

        {/* Delivery Management */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
            <Truck className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-black text-white">Delivery Management</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Delivery Charge (₹)
              </label>
              <input
                type="number"
                min="0"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Free Delivery Above (₹)
              </label>
              <input
                type="number"
                min="0"
                value={freeDeliveryThreshold}
                onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
              />
            </div>
          </div>

          {/* Per-hostel delivery toggles */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Hostel Delivery Availability
            </label>
            <div className="space-y-3">
              {[
                { label: 'Annex — Fixed Time', value: annexDelivery, setter: setAnnexDelivery },
                { label: 'Noyyal New Block — Anytime', value: noyyalNewDelivery, setter: setNoyyalNewDelivery },
                { label: 'Noyyal Old Block — Anytime', value: noyyalDelivery, setter: setNoyyalDelivery },
              ].map((hostel) => (
                <div key={hostel.label} className="flex items-center justify-between bg-slate-900 rounded-xl px-4 py-3 border border-slate-700">
                  <span className="text-sm font-semibold text-white">{hostel.label}</span>
                  <button
                    type="button"
                    onClick={() => hostel.setter(!hostel.value)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${
                      hostel.value
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {hostel.value ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WhatsApp Group */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black text-white">WhatsApp Group</h3>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              WhatsApp Group URL
            </label>
            <input
              type="url"
              value={whatsappUrl}
              onChange={(e) => setWhatsappUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#FF6B00] hover:bg-[#EA580C] disabled:bg-slate-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 flex items-center gap-2 text-sm transition hover:scale-105 active:scale-95"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Telegram Bot Diagnostic Tool */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
          <Send className="w-5 h-5 text-sky-400" />
          <h3 className="text-base font-black text-white">Telegram Order Bot Diagnostic</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Verify if your Vercel environment variables (<code className="text-sky-400 bg-slate-900 px-1 py-0.5 rounded">TELEGRAM_BOT_TOKEN</code> and <code className="text-sky-400 bg-slate-900 px-1 py-0.5 rounded">TELEGRAM_CHAT_ID</code>) are active and test sending a live alert.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={testingTelegram}
            onClick={async () => {
              setTestingTelegram(true);
              try {
                const res = await fetch('/api/admin/test-telegram');
                const data = await res.json();
                if (res.ok && data.success) {
                  showToast('Test notification delivered to Telegram! 🚀', 'success');
                  alert(`✅ SUCCESS!\n\n${data.message}\n\nCheck your Telegram group/chat for the test message!`);
                } else {
                  const errorMsg = data.hint || data.error || (data.telegramError && data.telegramError.description) || 'Failed to send test alert';
                  showToast(errorMsg, 'error');
                  alert(`❌ TELEGRAM DIAGNOSTIC ERROR:\n\n${errorMsg}\n\n${data.details ? JSON.stringify(data.details, null, 2) : ''}\n\n👉 NOTE: If you just added environment variables in Vercel, you MUST Redeploy your project in Vercel Dashboard for them to take effect!`);
                }
              } catch (err: any) {
                console.error(err);
                showToast('Failed to connect to Telegram test endpoint', 'error');
              } finally {
                setTestingTelegram(false);
              }
            }}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            {testingTelegram ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Testing Telegram Connection...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Test Telegram Alert</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/60 text-xs space-y-2 text-slate-300">
          <p className="font-bold text-white flex items-center gap-1.5">
            <span>ℹ️</span> Why messages might not arrive:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
            <li><strong>Vercel Redeploy needed:</strong> After adding environment variables in Vercel Settings, you <em>must</em> trigger a Redeploy (Deployments → Redeploy) or push a git commit.</li>
            <li><strong>Group permissions:</strong> If sending to a Telegram Group, the bot must be added into the group and granted <strong>Admin permissions</strong>.</li>
            <li><strong>Negative Chat ID:</strong> Telegram group chat IDs always start with a minus sign (e.g., <code className="text-amber-300">-100xxxxxxxxxx</code>).</li>
            <li><strong>Direct chat:</strong> If sending to a private chat, you must press <strong>/start</strong> in the bot first.</li>
          </ul>
        </div>
      </div>

      {/* Danger Zone: Clear Store Data */}
      <div className="bg-rose-950/40 border border-rose-800/60 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-rose-900/60 pb-3">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <h3 className="text-base font-black text-white">Danger Zone: Reset Store Data</h3>
        </div>
        <p className="text-xs text-rose-200/80 leading-relaxed">
          Wipe all dummy/existing categories, products, orders, coupons, and customer history. Use this to completely reset your store before launching.
        </p>
        <div>
          <button
            type="button"
            disabled={resetting}
            onClick={async () => {
              const confirmation = window.prompt(
                'Type "RESET" to confirm deleting ALL products, categories, orders, and dummy data permanently:'
              );
              if (confirmation !== 'RESET') {
                if (confirmation !== null) alert('Action cancelled. You must type RESET in all caps.');
                return;
              }

              setResetting(true);
              try {
                const res = await fetch('/api/admin/reset-database', { method: 'POST' });
                if (res.ok) {
                  const data = await res.json();
                  showToast(data.message || 'All store data cleared!', 'success');
                  setTimeout(() => {
                    window.location.reload();
                  }, 1200);
                } else {
                  const err = await res.json();
                  showToast(err.error || 'Failed to reset store data', 'error');
                }
              } catch (err: any) {
                console.error(err);
                showToast('Failed to connect to reset API', 'error');
              } finally {
                setResetting(false);
              }
            }}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            {resetting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Clearing Store Data...</span>
              </>
            ) : (
              <span>🗑️ Delete All Categories, Products & Orders</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
