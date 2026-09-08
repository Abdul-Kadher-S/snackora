'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';
import { ChevronRight } from 'lucide-react';

interface CuratedProductRowProps {
  title: string;
  subtitle?: string;
  icon?: string;
  products: Product[];
  viewAllHref?: string;
  onOpenDetails: (product: Product) => void;
}

export function CuratedProductRow({
  title,
  subtitle,
  icon,
  products,
  viewAllHref,
  onOpenDetails,
}: CuratedProductRowProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-6 md:py-8 border-b border-slate-100 last:border-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <div className="flex items-center gap-2">
              {icon && <span className="text-xl md:text-2xl">{icon}</span>}
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {title}
              </h3>
            </div>
            {subtitle && (
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>

          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-xs md:text-sm font-bold text-[#FF6B00] hover:text-[#EA580C] flex items-center gap-1 group transition shrink-0"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {products.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
