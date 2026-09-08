'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product, Category, FoodType, TasteProfile, OriginType } from '@/types';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Navbar } from '@/components/layout/Navbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductGridSkeleton } from '@/components/ui/SkeletonLoader';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';

interface SearchClientProps {
  categories: Category[];
}

export function SearchClient({ categories }: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial params
  const initialQ = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialFoodType = searchParams.get('foodType') || '';
  const initialTaste = searchParams.get('taste') || '';
  const initialOrigin = searchParams.get('origin') || '';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const initialSortBy = searchParams.get('sortBy') || 'recommended';

  // State
  const [query, setQuery] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedFoodType, setSelectedFoodType] = useState(initialFoodType);
  const [selectedTaste, setSelectedTaste] = useState(initialTaste);
  const [selectedOrigin, setSelectedOrigin] = useState(initialOrigin);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [inStockOnly, setInStockOnly] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state when URL params change
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setSelectedFoodType(searchParams.get('foodType') || '');
    setSelectedTaste(searchParams.get('taste') || '');
    setSelectedOrigin(searchParams.get('origin') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setSortBy(searchParams.get('sortBy') || 'recommended');
  }, [searchParams]);

  // Fetch products matching filters
  const fetchFilteredProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append('search', query.trim());
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedFoodType) params.append('foodType', selectedFoodType);
      if (selectedTaste) params.append('taste', selectedTaste);
      if (selectedOrigin) params.append('origin', selectedOrigin);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (inStockOnly) params.append('inStockOnly', 'true');
      if (sortBy) params.append('sortBy', sortBy);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredProducts();
  }, [
    query,
    selectedCategory,
    selectedFoodType,
    selectedTaste,
    selectedOrigin,
    minPrice,
    maxPrice,
    inStockOnly,
    sortBy,
  ]);

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setSelectedFoodType('');
    setSelectedTaste('');
    setSelectedOrigin('');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSortBy('recommended');
    router.push('/search');
  };

  const handlePricePreset = (min: string, max: string) => {
    if (minPrice === min && maxPrice === max) {
      setMinPrice('');
      setMaxPrice('');
    } else {
      setMinPrice(min);
      setMaxPrice(max);
    }
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedFoodType ? 1 : 0) +
    (selectedTaste ? 1 : 0) +
    (selectedOrigin ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search header & control bar */}
        <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by snack name, brand, craving or taste..."
                className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-between">
              {/* Mobile Filter Toggle Button */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="md:hidden flex items-center gap-1.5 px-4 py-3 bg-orange-50 text-[#FF6B00] border border-orange-200 rounded-2xl font-bold text-xs"
              >
                <Filter className="w-4 h-4" />
                <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
              </button>

              <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs md:text-sm font-semibold text-slate-700">
                <ArrowUpDown className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <span className="text-slate-400 mr-1 hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="recommended">Recommended</option>
                  <option value="popular">Popularity</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="discount">Biggest Discount</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active filter badges strip */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-400">Active Filters:</span>

              {selectedCategory && (
                <span className="inline-flex items-center gap-1 bg-orange-50 text-[#FF6B00] border border-orange-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                  <span>Category: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}</span>
                  <button onClick={() => setSelectedCategory('')}><X className="w-3.5 h-3.5" /></button>
                </span>
              )}

              {selectedFoodType && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                  <span>Type: {selectedFoodType}</span>
                  <button onClick={() => setSelectedFoodType('')}><X className="w-3.5 h-3.5" /></button>
                </span>
              )}

              {selectedTaste && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                  <span>Taste: {selectedTaste}</span>
                  <button onClick={() => setSelectedTaste('')}><X className="w-3.5 h-3.5" /></button>
                </span>
              )}

              {selectedOrigin && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                  <span>Origin: {selectedOrigin}</span>
                  <button onClick={() => setSelectedOrigin('')}><X className="w-3.5 h-3.5" /></button>
                </span>
              )}

              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                  <span>Price: ₹{minPrice || '0'} - ₹{maxPrice || '1000'}</span>
                  <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}><X className="w-3.5 h-3.5" /></button>
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                  <span>In Stock Only</span>
                  <button onClick={() => setInStockOnly(false)}><X className="w-3.5 h-3.5" /></button>
                </span>
              )}

              <button
                onClick={resetFilters}
                className="text-xs text-rose-600 font-bold hover:underline ml-auto flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body: Desktop Sidebar + Product Grid */}
        <div className="flex gap-6 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block w-64 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm shrink-0 space-y-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#FF6B00]" />
                <h3 className="font-bold text-slate-900 text-sm">Filters</h3>
              </div>
              {activeFiltersCount > 0 && (
                <button onClick={resetFilters} className="text-[11px] text-rose-600 font-semibold hover:underline">
                  Clear
                </button>
              )}
            </div>

            {/* Price Presets */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Price Budget
              </h4>
              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'Under ₹50', min: '0', max: '50' },
                  { label: '₹50 – ₹100', min: '50', max: '100' },
                  { label: '₹100 – ₹250', min: '100', max: '250' },
                  { label: '₹250 – ₹500', min: '250', max: '500' },
                  { label: '₹500 – ₹1,000', min: '500', max: '1000' },
                ].map((p) => {
                  const isSelected = minPrice === p.min && maxPrice === p.max;
                  return (
                    <button
                      key={p.label}
                      onClick={() => handlePricePreset(p.min, p.max)}
                      className={`w-full text-left px-3 py-1.5 rounded-xl font-medium transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-orange-50 text-[#FF6B00] font-bold border border-orange-200'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{p.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Category
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1 text-xs pr-1">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                    !selectedCategory ? 'bg-orange-50 text-[#FF6B00] font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(selectedCategory === c.slug ? '' : c.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                      selectedCategory === c.slug
                        ? 'bg-orange-50 text-[#FF6B00] font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    {c._count && (
                      <span className="text-[10px] text-slate-400 font-normal">{c._count.products}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Type */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Food Preference
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {['VEG', 'NON_VEG', 'VEGAN'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedFoodType(selectedFoodType === type ? '' : type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      selectedFoodType === type
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {type === 'VEG' ? '🌱 Veg' : type === 'NON_VEG' ? '🍗 Non-Veg' : '🍃 Vegan'}
                  </button>
                ))}
              </div>
            </div>

            {/* Taste Profile */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Taste Profile
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {['SPICY', 'SWEET', 'SALTY', 'SOUR'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTaste(selectedTaste === t ? '' : t)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition border ${
                      selectedTaste === t
                        ? 'bg-orange-500 text-white border-orange-500 font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Origin */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Origin
              </h4>
              <div className="flex gap-2">
                {['INDIAN', 'INTERNATIONAL'].map((o) => (
                  <button
                    key={o}
                    onClick={() => setSelectedOrigin(selectedOrigin === o ? '' : o)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      selectedOrigin === o
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {o === 'INDIAN' ? '🇮🇳 Desi' : '🌍 Intl'}
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">In Stock Only</span>
              <button
                onClick={() => setInStockOnly(!inStockOnly)}
                className={`w-10 h-6 rounded-full p-1 transition-colors ${
                  inStockOnly ? 'bg-[#FF6B00]' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    inStockOnly ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="flex-1 min-w-0">
            {/* Header info */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs md:text-sm font-semibold text-slate-500">
                Showing <strong className="text-slate-900">{products.length}</strong> snacks found
              </p>
            </div>

            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : products.length === 0 ? (
              <EmptyState
                type="search"
                suggestions={['lays', 'cold coffee', 'maggi', 'samosa', 'chocolate', 'brownie']}
                onSuggestionClick={(s) => setQuery(s)}
                onAction={resetFilters}
                actionText="Clear All Filters"
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-5">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onOpenDetails={(item) => setSelectedProduct(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Drawer Modal */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs md:hidden animate-fade-in">
            <div className="flex-1" onClick={() => setMobileFilterOpen(false)} />
            <div className="w-4/5 max-w-sm bg-white h-full p-5 overflow-y-auto flex flex-col space-y-5 animate-slide-left shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-900 text-base">Filter Snacks</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Price */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Budget
                </h4>
                <div className="space-y-1 text-xs">
                  {[
                    { label: 'Under ₹50', min: '0', max: '50' },
                    { label: '₹50 – ₹100', min: '50', max: '100' },
                    { label: '₹100 – ₹250', min: '100', max: '250' },
                    { label: '₹250 – ₹500', min: '250', max: '500' },
                    { label: '₹500 – ₹1,000', min: '500', max: '1000' },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => handlePricePreset(p.min, p.max)}
                      className={`w-full text-left px-3 py-2 rounded-xl ${
                        minPrice === p.min && maxPrice === p.max
                          ? 'bg-orange-50 text-[#FF6B00] font-bold'
                          : 'text-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Category
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-left px-2 py-1.5 rounded-lg ${
                      !selectedCategory ? 'bg-orange-50 text-[#FF6B00] font-bold' : 'text-slate-700'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(selectedCategory === c.slug ? '' : c.slug)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg ${
                        selectedCategory === c.slug
                          ? 'bg-orange-50 text-[#FF6B00] font-bold'
                          : 'text-slate-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Close & Apply */}
              <div className="pt-4 border-t border-slate-100 flex gap-2 mt-auto">
                <button
                  onClick={resetFilters}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Reset
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-2.5 bg-[#FF6B00] text-white font-bold rounded-xl text-xs"
                >
                  Show Results
                </button>
              </div>
            </div>
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
