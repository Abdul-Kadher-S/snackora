import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Navbar } from '@/components/layout/Navbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Footer } from '@/components/layout/Footer';
import { ChevronRight, Sparkles } from 'lucide-react';

// Incremental Static Regeneration with fast 60s cache
export const revalidate = 60;

export default async function CategoriesPage() {
  let categories: any[] = [];
  try {
    categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  } catch (error) {
    console.error('Database query failed in CategoriesPage:', error);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-[#FF6B00] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Snack Marketplace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            All Snack Categories
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            From spicy desi namkeen to imported chocolate wafers, pick your vibe and satisfy your cravings.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/search?category=${cat.slug}`}
              className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-orange-50 flex items-center justify-center text-4xl">
                    🍿
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute bottom-3.5 left-4 right-4 text-white flex items-end justify-between">
                  <div>
                    <h3 className="text-xl font-black tracking-tight">{cat.name}</h3>
                    <span className="text-xs text-orange-200 font-semibold">
                      {cat._count?.products || 0} snacks available
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-[#FF6B00] transition-colors">
                    <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                  {cat.description || 'Browse products in this category.'}
                </p>
                <div className="flex items-center text-xs font-bold text-[#FF6B00] group-hover:text-[#EA580C]">
                  <span>Explore items</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
