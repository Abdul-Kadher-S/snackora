'use client';

import React, { useState } from 'react';
import { Product, Category } from '@/types';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Navbar } from '@/components/layout/Navbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Footer } from '@/components/layout/Footer';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryCarousel } from '@/components/home/CategoryCarousel';
import { CuratedProductRow } from '@/components/home/CuratedProductRow';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';
import { Sparkles, Flame, Moon, Coins, Heart, Globe, Coffee, Package } from 'lucide-react';
import Link from 'next/link';

interface HomeClientProps {
  categories: Category[];
  products: Product[];
}

export function HomeClient({ categories, products }: HomeClientProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Curated lists
  const popularProducts = products
    .filter((p) => p.rating >= 4.8)
    .slice(0, 4);

  const midnightCravings = products
    .filter((p) =>
      p.tags.toLowerCase().includes('midnight') ||
      p.tags.toLowerCase().includes('maggi') ||
      p.tags.toLowerCase().includes('burger') ||
      p.tags.toLowerCase().includes('noodles')
    )
    .slice(0, 4);

  const under50Products = products
    .filter((p) => p.price <= 50)
    .slice(0, 4);

  const studentCombos = products
    .filter((p) => p.category?.slug === 'combos' || p.tags.includes('combo'))
    .slice(0, 4);

  const sweetTooth = products
    .filter(
      (p) =>
        p.taste === 'SWEET' ||
        p.category?.slug === 'chocolates-sweets' ||
        p.category?.slug === 'bakery' ||
        p.category?.slug === 'ice-cream'
    )
    .slice(0, 4);

  const refreshYourself = products
    .filter((p) => p.category?.slug === 'beverages' || p.tags.includes('coffee') || p.tags.includes('shake'))
    .slice(0, 4);

  const internationalPicks = products
    .filter((p) => p.origin === 'INTERNATIONAL' || p.category?.slug === 'international-snacks')
    .slice(0, 4);

  const newArrivals = products.slice(-4).reverse();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroBanner />

        {/* Categories Bar */}
        <CategoryCarousel categories={categories} />

        {/* 1. Popular Near You */}
        <CuratedProductRow
          title="Popular Near You"
          subtitle="Top rated snacks trending in campus hostel rooms tonight"
          icon="🔥"
          products={popularProducts}
          viewAllHref="/search?sortBy=popular"
          onOpenDetails={(p) => setSelectedProduct(p)}
        />

        {/* 2. Midnight Cravings */}
        <CuratedProductRow
          title="Midnight Cravings"
          subtitle="Hot Maggi, loaded burgers, spicy rolls & cheesy fries"
          icon="🌙"
          products={midnightCravings}
          viewAllHref="/search?category=fast-food"
          onOpenDetails={(p) => setSelectedProduct(p)}
        />

        {/* 3. Under ₹50 (Pocket Money Friendly) */}
        <CuratedProductRow
          title="Under ₹50 Bites"
          subtitle="Affordable snacks that satisfy hunger without hurting your pocket"
          icon="🪙"
          products={under50Products}
          viewAllHref="/search?maxPrice=50"
          onOpenDetails={(p) => setSelectedProduct(p)}
        />

        {/* 4. Student Combos */}
        <CuratedProductRow
          title="Student & Exam Combos"
          subtitle="Carefully bundled all-nighter energy packs and party feasts"
          icon="🎓"
          products={studentCombos}
          viewAllHref="/search?category=combos"
          onOpenDetails={(p) => setSelectedProduct(p)}
        />

        {/* 5. Refresh Yourself */}
        <CuratedProductRow
          title="Refresh Yourself"
          subtitle="Chilled frappes, cold coffee, energy drinks, and fruit juices"
          icon="🥤"
          products={refreshYourself}
          viewAllHref="/search?category=beverages"
          onOpenDetails={(p) => setSelectedProduct(p)}
        />

        {/* 6. Sweet Tooth */}
        <CuratedProductRow
          title="Sweet Tooth Desires"
          subtitle="Chocolates, brownies, molten lava cakes, and ice cream tubs"
          icon="🍫"
          products={sweetTooth}
          viewAllHref="/search?taste=SWEET"
          onOpenDetails={(p) => setSelectedProduct(p)}
        />

        {/* 7. International Picks */}
        <CuratedProductRow
          title="International Picks"
          subtitle="Korean spicy ramen, Takis, Pringles, and imported goodies"
          icon="🌍"
          products={internationalPicks}
          viewAllHref="/search?origin=INTERNATIONAL"
          onOpenDetails={(p) => setSelectedProduct(p)}
        />

        {/* 8. New Arrivals */}
        <CuratedProductRow
          title="New Arrivals"
          subtitle="Freshly stocked snacks added to our campus catalog"
          icon="✨"
          products={newArrivals}
          viewAllHref="/search?sortBy=newest"
          onOpenDetails={(p) => setSelectedProduct(p)}
        />

        {/* Empty Catalog Notice */}
        {products.length === 0 && (
          <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-orange-100 text-[#FF6B00] flex items-center justify-center mx-auto shadow-sm">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Fresh Snacks Coming Soon!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Our campus snack menu is being refreshed. You will be able to order right from your room as soon as items are listed!
            </p>
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSelectRelated={(p) => setSelectedProduct(p)}
      />
    </div>
  );
}
