'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Category } from '@/types';
import { ArrowRight, ChevronRight } from 'lucide-react';

interface CategoryCarouselProps {
  categories: Category[];
}

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  return (
    <section className="py-6 md:py-8 border-b border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Explore Snack Categories
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Everything from chips and ice cream to midnight combo meals
            </p>
          </div>

          <Link
            href="/categories"
            className="text-xs md:text-sm font-bold text-[#FF6B00] hover:text-[#EA580C] flex items-center gap-1 group transition"
          >
            <span>See All</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Horizontal scrollable categories row */}
        <div className="flex items-center gap-3 md:gap-5 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/search?category=${cat.slug}`}
              className="group flex flex-col items-center min-w-[84px] md:min-w-[100px] text-center"
            >
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-orange-50 border border-orange-100/80 overflow-hidden shadow-xs group-hover:shadow-lg group-hover:border-[#FF6B00] group-hover:scale-105 transition-all duration-300">
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 64px, 80px"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-[#FF6B00] text-sm">
                    {cat.name.slice(0, 2)}
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-slate-700 group-hover:text-[#FF6B00] mt-2 line-clamp-2 max-w-[90px] leading-tight transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
