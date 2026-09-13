'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import { useRealtimeProducts } from '@/hooks/useRealtimeProducts';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Navbar } from '@/components/layout/Navbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Footer } from '@/components/layout/Footer';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryCarousel } from '@/components/home/CategoryCarousel';
import { CuratedProductRow } from '@/components/home/CuratedProductRow';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';
import { ComboCard } from '@/components/combos/ComboCard';
import { Sparkles, Flame, Moon, Coins, Heart, Globe, Coffee, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface HomeClientProps {
  categories: Category[];
  products: Product[];
}

export function HomeClient({ categories, products }: HomeClientProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productList, setProductList] = useState<Product[]>(products);

  useEffect(() => {
    setProductList(products);
  }, [products]);

  // Realtime product, stock, and availability subscription
  useRealtimeProducts({
    onProductCreated: (newProd) => {
      setProductList((prev) => {
        if (prev.some((p) => p.id === newProd.id)) return prev;
        return [newProd, ...prev];
      });
    },
    onProductUpdated: (updatedProd) => {
      setProductList((prev) =>
        prev.map((p) => (p.id === updatedProd.id ? { ...p, ...updatedProd } : p))
      );
    },
    onProductDeleted: (deletedId) => {
      setProductList((prev) => prev.filter((p) => p.id !== deletedId));
    },
    onStockUpdated: (payload) => {
      setProductList((prev) =>
        prev.map((p) => {
          if (p.id === payload.id) {
            const newStock = payload.stock !== undefined ? payload.stock : p.stock;
            const newAvail = payload.available !== undefined ? payload.available : p.available;
            return { ...p, ...payload, stock: newStock, available: newAvail };
          }
          return p;
        })
      );
    },
    onSync: async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProductList(data);
        }
      } catch {}
    },
  });

  // Curated lists
  const popularProducts = productList
    .filter((p) => p.rating >= 4.8)
    .slice(0, 4);

  const midnightCravings = productList
    .filter((p) =>
      p.tags.toLowerCase().includes('midnight') ||
      p.tags.toLowerCase().includes('maggi') ||
      p.tags.toLowerCase().includes('burger') ||
      p.tags.toLowerCase().includes('noodles')
    )
    .slice(0, 4);

  const under50Products = productList
    .filter((p) => p.price <= 50)
    .slice(0, 4);

  const studentCombos = productList.filter(
    (p) => Boolean(p.comboItems) || p.category?.slug === 'combos' || p.category?.slug === 'midnight-combos' || p.tags.includes('combo')
  );

  const sweetTooth = productList
    .filter(
      (p) =>
        p.taste === 'SWEET' ||
        p.category?.slug === 'chocolates-sweets' ||
        p.category?.slug === 'bakery' ||
        p.category?.slug === 'ice-cream'
    )
    .slice(0, 4);

  const refreshYourself = productList
    .filter((p) => p.category?.slug === 'beverages' || p.tags.includes('coffee') || p.tags.includes('shake'))
    .slice(0, 4);

  const internationalPicks = productList
    .filter((p) => p.origin === 'INTERNATIONAL' || p.category?.slug === 'international-snacks')
    .slice(0, 4);

  const newArrivals = productList.slice(-4).reverse();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroBanner />

        {/* Categories Bar */}
        <CategoryCarousel categories={categories} />

        {/* 🔥 Special Mega Combo Offers Section (2+ products) */}
        {studentCombos.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">🔥</span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Mega Combo Offers
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-wider">
                    SAVE BIG
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Bundled snack packs with 2, 3, or 4 items at discounted hostel rates
                </p>
              </div>

              <Link
                href="/search?category=combos"
                className="text-xs sm:text-sm font-bold text-[#FF6B00] hover:text-[#EA580C] transition flex items-center gap-1 shrink-0"
              >
                <span>View All Combos</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {studentCombos.slice(0, 6).map((combo) => (
                <ComboCard
                  key={combo.id}
                  product={combo}
                  onOpenDetails={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          </section>
        )}

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
        {productList.length === 0 && (
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
