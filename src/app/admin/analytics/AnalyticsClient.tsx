'use client';

import React, { useState, useEffect } from 'react';
import { Currency } from '@/components/ui/Currency';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  Layers,
  Award,
  Calendar,
  RefreshCw,
  Zap,
} from 'lucide-react';

export function AnalyticsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#FF6B00] mb-3" />
        <span className="text-sm font-semibold">Loading Campus Sales Analytics...</span>
      </div>
    );
  }

  const aov = data.totalOrdersCount > 0 ? Math.round(data.totalRevenue / data.totalOrdersCount) : 0;
  const maxRevenue = Math.max(...data.last7Days.map((d: any) => d.revenue), 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sales & Demand Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Analyze campus snack trends, revenue velocity, and popular night-time orders.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Main Metric KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Total Platform Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <Currency amount={data.totalRevenue} className="text-2xl font-black text-white" />
          <span className="text-[10px] text-emerald-400 font-semibold block mt-1">All orders via COD</span>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Average Order Value (AOV)</span>
            <TrendingUp className="w-4 h-4 text-[#FF6B00]" />
          </div>
          <Currency amount={aov} className="text-2xl font-black text-white" />
          <span className="text-[10px] text-slate-400 block mt-1">Per room delivery</span>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Completed Deliveries</span>
            <ShoppingBag className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-2xl font-black text-white">{data.deliveredOrdersCount}</span>
          <span className="text-[10px] text-slate-400 block mt-1">
            {Math.round((data.deliveredOrdersCount / Math.max(1, data.totalOrdersCount)) * 100)}% completion rate
          </span>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Active Catalog</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-black text-white">{data.totalProducts}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Across {data.categoriesCount} categories</span>
        </div>
      </div>

      {/* Daily Revenue Distribution Chart */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Daily Revenue Volume (Last 7 Days)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Track peak snacking nights</p>
          </div>
          <span className="text-xs font-bold text-[#FF6B00] bg-orange-950 px-2.5 py-1 rounded-lg border border-orange-800">
            Night Shift Stats
          </span>
        </div>

        <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 pt-6 pb-2">
          {data.last7Days.map((day: any, idx: number) => {
            const heightPercent = Math.max(14, Math.round((day.revenue / maxRevenue) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[11px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 px-2 py-0.5 rounded shadow">
                  ₹{day.revenue}
                </div>
                <div className="w-full max-w-[48px] bg-slate-700/80 rounded-t-xl overflow-hidden relative flex items-end">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-[#FF6B00] to-amber-400 rounded-t-xl transition-all duration-500 group-hover:brightness-110"
                  />
                </div>
                <span className="text-xs font-bold text-slate-300 truncate max-w-[60px]">
                  {day.date.split(',')[0]}
                </span>
                <span className="text-[10px] text-slate-500">{day.orders} ord</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 5 Products Leaderboard */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Most Ordered Snack Leaderboard</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 uppercase font-bold text-slate-400 text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Snack Name</th>
                <th className="p-3">Total Units Sold</th>
                <th className="p-3 text-right">Gross Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {data.topSellingProducts.map((p: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-700/30">
                  <td className="p-3 font-bold text-[#FF6B00]">#{idx + 1}</td>
                  <td className="p-3 font-bold text-white">{p.name}</td>
                  <td className="p-3 text-slate-200 font-semibold">{p.count} units</td>
                  <td className="p-3 text-right font-black text-white">₹{p.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
