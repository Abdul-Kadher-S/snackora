'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  RefreshCw,
  Search,
  Save,
  Check,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export function InventoryClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?includeInactive=true');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        const edits: Record<string, number> = {};
        data.forEach((p: Product) => {
          edits[p.id] = p.stock;
        });
        setStockEdits(edits);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStockChange = (id: string, value: number) => {
    setStockEdits((prev) => ({
      ...prev,
      [id]: Math.max(0, value),
    }));
  };

  const handleSaveStock = async (product: Product) => {
    const newStock = stockEdits[product.id];
    if (newStock === undefined) return;

    setSavingId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });

      if (res.ok) {
        showToast(`Stock updated for ${product.name} to ${newStock} units`, 'success');
        fetchProducts();
      } else {
        showToast('Failed to update stock', 'error');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
  );

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Inventory & Stock Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitor snack levels, restock fast-selling midnight items, and prevent stock-outs.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stock Health Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">In Stock Healthy</span>
            <div className="text-xl font-black text-white">
              {products.filter((p) => p.stock > 10).length} items
            </div>
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Low Stock Warning</span>
            <div className="text-xl font-black text-amber-400">{lowStockCount} items (&le;10 units)</div>
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Out of Stock</span>
            <div className="text-xl font-black text-rose-400">{outOfStockCount} items (0 units)</div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter snacks by name or brand..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase font-bold text-slate-400 text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="p-3.5">Snack</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Current Status</th>
                <th className="p-3.5">Adjust Stock Quantity</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filtered.map((p) => {
                const currentEdit = stockEdits[p.id] !== undefined ? stockEdits[p.id] : p.stock;
                const isChanged = currentEdit !== p.stock;
                const isLow = p.stock > 0 && p.stock <= 10;
                const isOut = p.stock === 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-700/30 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                          <Image src={p.imageUrl} alt={p.name} fill sizes="40px" className="object-cover" />
                        </div>
                        <div>
                          <span className="font-bold text-white block text-sm">{p.name}</span>
                          <span className="text-[10px] text-slate-400">{p.brand || 'Hostel Store'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-400 font-medium">
                      {p.category?.name || 'Snacks'}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isOut
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : isLow
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {isOut ? 'Out of Stock' : isLow ? `Low Stock (${p.stock})` : `In Stock (${p.stock})`}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {/* Quick -5 */}
                        <button
                          onClick={() => handleStockChange(p.id, currentEdit - 5)}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px] font-bold text-slate-300"
                        >
                          -5
                        </button>

                        <button
                          onClick={() => handleStockChange(p.id, currentEdit - 1)}
                          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <input
                          type="number"
                          min={0}
                          value={currentEdit}
                          onChange={(e) => handleStockChange(p.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
                        />

                        <button
                          onClick={() => handleStockChange(p.id, currentEdit + 1)}
                          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>

                        {/* Quick +10 */}
                        <button
                          onClick={() => handleStockChange(p.id, currentEdit + 10)}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px] font-bold text-emerald-400"
                        >
                          +10
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      {isChanged ? (
                        <button
                          onClick={() => handleSaveStock(p)}
                          disabled={savingId === p.id}
                          className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto shadow-md"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save ({currentEdit})</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">Up to date</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
