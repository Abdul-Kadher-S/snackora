'use client';

import React from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { VegBadge } from '@/components/ui/VegBadge';
import { Currency } from '@/components/ui/Currency';
import { useCart } from '@/context/CartContext';
import { Plus, Minus, Flame, Star, Zap } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpenDetails?: (product: Product) => void;
}

export function ProductCard({ product, onOpenDetails }: ProductCardProps) {
  const { getItemQuantity, addToCart, updateQuantity } = useCart();
  const quantity = getItemQuantity(product.id);
  const isOutOfStock = !product.available || product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  // Half price display
  const displayPrice = product.isHalfPrice && product.originalPrice
    ? Math.round(product.originalPrice / 2)
    : product.price;

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
        {product.isHalfPrice && (
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
            <Zap className="w-3 h-3" />
            HALF PRICE
          </div>
        )}
        {product.isTrending && !product.isHalfPrice && (
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
            <Flame className="w-3 h-3" />
            TRENDING
          </div>
        )}
        {product.discount > 0 && !product.isHalfPrice && (
          <div className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            {product.discount}% OFF
          </div>
        )}
        {product.earnSnackpoints && (
          <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
            <Star className="w-3 h-3" />
            SnackPoints
          </div>
        )}
      </div>

      {/* Image Container */}
      <div
        onClick={() => onOpenDetails?.(product)}
        className="relative w-full aspect-[4/3] bg-slate-50 cursor-pointer overflow-hidden"
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-108 transition-transform duration-500"
        />

        {/* Veg badge */}
        <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs p-1 rounded-md shadow-xs">
          <VegBadge type={product.foodType} />
        </div>

        {/* Out of Stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2">
            <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              OUT OF STOCK
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-3.5 flex flex-col flex-1">
        {/* Product Title */}
        <h4
          onClick={() => onOpenDetails?.(product)}
          className="font-bold text-slate-800 text-sm md:text-base leading-snug line-clamp-1 hover:text-[#FF6B00] cursor-pointer transition-colors"
          title={product.name}
        >
          {product.name}
        </h4>

        {/* Short description */}
        <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-2 leading-relaxed">
          {product.description}
        </p>

        {/* Stock visibility */}
        {!isOutOfStock && (
          <div className="mb-2">
            {isLowStock ? (
              <p className="text-[11px] text-rose-600 font-bold">
                ⚡ Only {product.stock} left!
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 font-medium">
                {product.stock} available
              </p>
            )}
          </div>
        )}

        {/* Footer: Price & Add Button */}
        <div className="mt-auto pt-2.5 flex items-center justify-between gap-1.5 border-t border-slate-100">
          <div className="flex flex-col min-w-0 pr-1">
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-black text-slate-900 leading-tight">₹{displayPrice}</span>
              {(product.isHalfPrice || product.originalPrice) && product.originalPrice && (
                <span className="text-[10px] sm:text-xs text-slate-400 line-through">₹{product.originalPrice}</span>
              )}
            </div>
          </div>

          {/* Add to cart / Quantity steppers */}
          <div className="shrink-0">
            {isOutOfStock ? (
              <span className="inline-flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-xl cursor-not-allowed">
                Out of Stock
              </span>
            ) : quantity === 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product);
                }}
                className="px-3 sm:px-4 py-1.5 min-h-[34px] sm:min-h-[36px] bg-orange-50 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-white border border-orange-300 hover:border-[#FF6B00] text-xs font-bold rounded-xl transition-all duration-200 shadow-xs hover:shadow-md active:scale-95 flex items-center gap-1.5 shrink-0"
                aria-label={`Add ${product.name} to cart`}
              >
                <span>ADD</span>
                <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              </button>
            ) : (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center bg-[#FF6B00] text-white rounded-xl shadow-md font-bold text-xs animate-scale-up h-[34px] sm:h-[36px] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="w-8 h-full flex items-center justify-center hover:bg-[#EA580C] transition active:scale-90"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <span className="px-1 text-center font-black min-w-[20px] select-none text-xs">{quantity}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (quantity < product.stock) {
                      updateQuantity(product.id, quantity + 1);
                    }
                  }}
                  disabled={quantity >= product.stock}
                  className="w-8 h-full flex items-center justify-center hover:bg-[#EA580C] transition active:scale-90 disabled:opacity-50"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
