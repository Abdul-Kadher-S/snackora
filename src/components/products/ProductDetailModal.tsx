'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { VegBadge } from '@/components/ui/VegBadge';
import { StarRating } from '@/components/ui/StarRating';
import { Currency } from '@/components/ui/Currency';
import { useCart } from '@/context/CartContext';
import { X, Plus, Minus, ShoppingBag, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectRelated?: (product: Product) => void;
}

export function ProductDetailModal({ product, onClose, onSelectRelated }: ProductDetailModalProps) {
  const { getItemQuantity, addToCart, updateQuantity } = useCart();
  const [related, setRelated] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    if (!product) return;

    // Fetch related products for "You may also like"
    setLoadingRelated(true);
    fetch(`/api/products/${product.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.relatedProducts) {
          setRelated(data.relatedProducts);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingRelated(false));
  }, [product]);

  if (!product) return null;

  const quantity = getItemQuantity(product.id);
  const isOutOfStock = !product.available || product.stock <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-md backdrop-blur-md flex items-center justify-center transition hover:scale-110 active:scale-95"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="max-h-[85vh] overflow-y-auto">
          {/* Top Banner Image */}
          <div className="relative w-full h-64 md:h-72 bg-slate-100">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Badges on image */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="bg-white/95 px-2.5 py-1 rounded-lg backdrop-blur-md">
                  <VegBadge type={product.foodType} showText />
                </div>
                <StarRating rating={product.rating} size="md" />
              </div>
              {product.discount > 0 && (
                <span className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-md">
                  {product.discount}% OFF SPECIAL
                </span>
              )}
            </div>
          </div>

          {/* Details Content */}
          <div className="p-5 md:p-6">
            {/* Title & Brand */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                {product.name}
              </h3>
              {product.brand && (
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.brand}
                </span>
              )}
            </div>

            {/* Price section */}
            <div className="flex items-baseline gap-3 mb-4">
              <Currency
                amount={product.price}
                showOriginal={product.originalPrice}
                className="text-2xl font-black text-slate-900"
              />
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
                <Zap className="w-3.5 h-3.5 fill-emerald-500" /> ₹0 Free Hostel Delivery
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {product.description}
            </p>

            {/* Food attributes grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
              <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100 text-center">
                <span className="text-[10px] uppercase font-bold text-orange-600 block">Taste</span>
                <span className="text-xs font-bold text-slate-800 capitalize">{product.taste.toLowerCase()}</span>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-600 block">Origin</span>
                <span className="text-xs font-bold text-slate-800 capitalize flex items-center justify-center gap-1">
                  <Globe className="w-3 h-3 text-blue-500" /> {product.origin.toLowerCase()}
                </span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Stock</span>
                <span className="text-xs font-bold text-slate-800">
                  {product.stock > 0 ? `${product.stock} units ready` : 'Sold out'}
                </span>
              </div>
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-600 block">Hostel Room</span>
                <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-500" /> 10-15 mins
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-4 p-4 bg-slate-900 text-white rounded-2xl mb-6 shadow-lg">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Total Price (COD)</p>
                <Currency
                  amount={product.price * (quantity > 0 ? quantity : 1)}
                  className="text-xl font-black text-white"
                />
              </div>

              {isOutOfStock ? (
                <button
                  disabled
                  className="px-6 py-3 bg-slate-800 text-slate-400 font-bold rounded-xl cursor-not-allowed text-sm"
                >
                  Out of Stock
                </button>
              ) : quantity === 0 ? (
                <button
                  onClick={() => addToCart(product)}
                  className="px-6 py-3 bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-2 text-sm transition hover:scale-105 active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              ) : (
                <div className="flex items-center bg-[#FF6B00] text-white rounded-xl shadow-md overflow-hidden font-bold">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="px-3.5 py-2 hover:bg-[#EA580C] transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 min-w-[32px] text-center text-sm">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="px-3.5 py-2 hover:bg-[#EA580C] transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* "You may also like" related products */}
            {related.length > 0 && (
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <span>✨ You may also like</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {related.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onSelectRelated?.(rel)}
                      className="group/rel cursor-pointer bg-slate-50 hover:bg-orange-50/50 p-2 rounded-xl border border-slate-100 transition flex flex-col"
                    >
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-white mb-1.5">
                        <Image
                          src={rel.imageUrl}
                          alt={rel.name}
                          fill
                          sizes="120px"
                          className="object-cover group-hover/rel:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1 group-hover/rel:text-[#FF6B00]">
                        {rel.name}
                      </p>
                      <Currency amount={rel.price} className="text-xs text-slate-900 mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
