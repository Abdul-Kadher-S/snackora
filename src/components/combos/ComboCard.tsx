'use client';

import React from 'react';
import Image from 'next/image';
import { Product, ComboItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { VegBadge } from '@/components/ui/VegBadge';
import { Plus, Minus, Flame, Sparkles, Star, CheckCircle2 } from 'lucide-react';

interface ComboCardProps {
  product: Product;
  onOpenDetails?: (product: Product) => void;
}

export function ComboCard({ product, onOpenDetails }: ComboCardProps) {
  const { getItemQuantity, addToCart, updateQuantity } = useCart();
  const quantity = getItemQuantity(product.id);
  const isOutOfStock = !product.available || product.stock <= 0;

  let items: ComboItem[] = [];
  if (product.comboItems) {
    try {
      items = JSON.parse(product.comboItems);
    } catch {}
  }

  const savings =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(product.originalPrice - product.price)
      : null;

  return (
    <div className="group relative bg-gradient-to-b from-orange-50/50 via-white to-white rounded-3xl border-2 border-orange-200/80 hover:border-orange-500 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Top Banner Tag */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white px-3.5 py-1.5 flex items-center justify-between text-xs font-black tracking-wider uppercase shadow-xs">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 fill-white animate-pulse" />
          <span>COMBO VALUE DEAL</span>
        </div>
        {savings && (
          <span className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-black">
            SAVE ₹{savings}
          </span>
        )}
      </div>

      {/* Multi-Product Visual Montage */}
      <div
        onClick={() => onOpenDetails?.(product)}
        className="p-4 bg-gradient-to-br from-amber-500/5 to-orange-500/10 cursor-pointer"
      >
        {items.length >= 2 ? (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-2">
            {items.map((item, idx) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-orange-200/80 overflow-hidden relative shadow-md group-hover:scale-105 transition-transform">
                    <Image
                      src={item.imageUrl || product.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 text-center max-w-[70px] truncate">
                    {item.name}
                  </span>
                </div>
                {idx < items.length - 1 && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-xs shadow-md shrink-0 mb-4">
                    +
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100 shadow-md">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4
              onClick={() => onOpenDetails?.(product)}
              className="font-black text-slate-900 text-base sm:text-lg leading-tight hover:text-[#FF6B00] cursor-pointer transition-colors"
            >
              {product.name}
            </h4>
            <div className="shrink-0 pt-0.5">
              <VegBadge type={product.foodType} />
            </div>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {product.description}
          </p>

          {/* Included Items Checklist */}
          {items.length > 0 && (
            <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-2.5 mb-3.5 space-y-1">
              <p className="text-[10px] font-black text-orange-950 uppercase tracking-wider">
                Inside this Combo ({items.length} Items):
              </p>
              <div className="space-y-0.5">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
            {product.discount > 0 && (
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">
                {product.discount}% OFF BUNDLE
              </span>
            )}
          </div>

          {/* Cart Buttons */}
          <div>
            {isOutOfStock ? (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                Out of Stock
              </span>
            ) : quantity === 0 ? (
              <button
                type="button"
                onClick={() => addToCart(product)}
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-[#EA580C] hover:to-orange-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-orange-500/25 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Combo</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-orange-50 border border-[#FF6B00]/40 rounded-2xl px-2 py-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="w-7 h-7 rounded-xl bg-white text-[#FF6B00] border border-orange-200 flex items-center justify-center font-bold hover:bg-orange-100 transition active:scale-90 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-5 text-center text-sm font-black text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="w-7 h-7 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center font-bold hover:bg-[#EA580C] transition active:scale-90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
