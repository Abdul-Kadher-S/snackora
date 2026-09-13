'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product, Category, FoodType, TasteProfile, OriginType } from '@/types';
import { useRealtimeProducts } from '@/hooks/useRealtimeProducts';
import { Currency } from '@/components/ui/Currency';
import { VegBadge } from '@/components/ui/VegBadge';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ImageIcon,
  Upload,
  Sparkles,
  Star,
  Flame,
  Zap,
  Tag,
  FolderPlus,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

// Verified high-res snack presets for convenient one-click image selection in admin
const PRESET_FOOD_IMAGES = [
  { label: 'Chips & Namkeen', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80' },
  { label: 'Burger & Fries', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
  { label: 'Chocolates', url: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=600&auto=format&fit=crop&q=80' },
  { label: 'Cold Coffee', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80' },
  { label: 'Samosa & Pakoda', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80' },
  { label: 'Noodles & Maggi', url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80' },
  { label: 'Brownie & Cakes', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80' },
  { label: 'Ice Cream', url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&auto=format&fit=crop&q=80' },
  { label: 'Biscuits & Cookies', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80' },
  { label: 'Midnight Combo', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80' },
];

const DEFAULT_CATEGORY_PRESETS = [
  { name: 'Chips & Namkeen', slug: 'chips-namkeen' },
  { name: 'Chocolates & Sweets', slug: 'chocolates' },
  { name: 'Midnight Combos', slug: 'midnight-combos' },
  { name: 'Beverages & Drinks', slug: 'beverages' },
  { name: 'Ice Creams', slug: 'ice-creams' },
  { name: 'Bakery & Cakes', slug: 'bakery' },
  { name: 'Instant Noodles & Maggi', slug: 'instant-noodles' },
];

export function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const { showToast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Quick Category Creation State inside Modal
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('40');
  const [originalPrice, setOriginalPrice] = useState('50');
  const [discount, setDiscount] = useState('20');
  const [imageUrl, setImageUrl] = useState(PRESET_FOOD_IMAGES[0].url);
  const [stock, setStock] = useState('50');
  const [available, setAvailable] = useState(true);
  const [brand, setBrand] = useState('');
  const [rating, setRating] = useState('4.8');
  const [foodType, setFoodType] = useState<FoodType>('VEG');
  const [taste, setTaste] = useState<TasteProfile>('SPICY');
  const [origin, setOrigin] = useState<OriginType>('INDIAN');
  const [tags, setTags] = useState('snack, hostel, crispy');
  const [earnSnackpoints, setEarnSnackpoints] = useState(true);
  const [isTrending, setIsTrending] = useState(false);
  const [isHalfPrice, setIsHalfPrice] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file too large (maximum size is 5MB)', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setImageUrl(data.url);
      showToast('Product photo uploaded from gallery successfully!', 'success');
    } catch (err: any) {
      console.error('Gallery upload error:', err);
      showToast(err.message || 'Failed to upload photo', 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products?includeInactive=true'),
        fetch('/api/categories?includeAll=true'),
      ]);

      if (prodRes.ok && catRes.ok) {
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        setProducts(prodData);
        setCategories(catData);
        if (catData.length > 0 && !categoryId) {
          setCategoryId(catData[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useRealtimeProducts({
    onProductCreated: (newProd) => {
      setProducts((prev) => {
        if (prev.some((p) => p.id === newProd.id)) return prev;
        return [newProd, ...prev];
      });
    },
    onProductUpdated: (updatedProd) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === updatedProd.id ? { ...p, ...updatedProd } : p))
      );
    },
    onProductDeleted: (deletedId) => {
      setProducts((prev) => prev.filter((p) => p.id !== deletedId));
    },
    onStockUpdated: (payload) => {
      setProducts((prev) =>
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
    onSync: () => {
      loadData();
    },
  });

  const openNewModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setCategoryId(categories[0]?.id || '');
    setPrice('40');
    setOriginalPrice('50');
    setDiscount('20');
    setImageUrl(PRESET_FOOD_IMAGES[0].url);
    setStock('50');
    setAvailable(true);
    setBrand('');
    setRating('4.8');
    setFoodType('VEG');
    setTaste('SPICY');
    setOrigin('INDIAN');
    setTags('crispy, snack, hostel');
    setEarnSnackpoints(true);
    setIsTrending(false);
    setIsHalfPrice(false);
    setFormError('');
    setShowNewCatInput(false);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description);
    setCategoryId(p.categoryId);
    setPrice(String(p.price));
    setOriginalPrice(p.originalPrice ? String(p.originalPrice) : '');
    setDiscount(String(p.discount || 0));
    setImageUrl(p.imageUrl);
    setStock(String(p.stock));
    setAvailable(p.available);
    setBrand(p.brand || '');
    setRating(String(p.rating));
    setFoodType(p.foodType);
    setTaste(p.taste);
    setOrigin(p.origin);
    setTags(p.tags || '');
    setEarnSnackpoints(p.earnSnackpoints !== false);
    setIsTrending(Boolean(p.isTrending));
    setIsHalfPrice(Boolean(p.isHalfPrice));
    setFormError('');
    setShowNewCatInput(false);
    setIsModalOpen(true);
  };

  const handlePriceChange = (newPrice: string) => {
    setPrice(newPrice);
    const p = parseFloat(newPrice);
    const orig = parseFloat(originalPrice);
    if (!isNaN(p) && !isNaN(orig) && orig > p) {
      setDiscount(String(Math.round(((orig - p) / orig) * 100)));
    }
  };

  const handleOriginalPriceChange = (newOrig: string) => {
    setOriginalPrice(newOrig);
    const orig = parseFloat(newOrig);
    const p = parseFloat(price);
    if (!isNaN(p) && !isNaN(orig) && orig > p) {
      setDiscount(String(Math.round(((orig - p) / orig) * 100)));
    }
  };

  const handleDiscountChange = (newDiscount: string) => {
    setDiscount(newDiscount);
    const disc = parseInt(newDiscount);
    const orig = parseFloat(originalPrice);
    if (!isNaN(disc) && !isNaN(orig) && orig > 0) {
      const calculatedPrice = Math.round(orig * (1 - disc / 100));
      setPrice(String(calculatedPrice));
    }
  };

  const handleQuickCreateCategory = async (catName?: string) => {
    const targetName = (catName || newCategoryName).trim();
    if (!targetName) return;

    setCreatingCat(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: targetName }),
      });

      if (res.ok) {
        const createdCat = await res.json();
        showToast(`Category "${createdCat.name}" created!`, 'success');
        setCategories((prev) => [...prev, createdCat]);
        setCategoryId(createdCat.id);
        setNewCategoryName('');
        setShowNewCatInput(false);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create category', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error creating category', 'error');
    } finally {
      setCreatingCat(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 1 || numPrice > 10000) {
      setFormError('Price must be between ₹1 and ₹10,000.');
      return;
    }

    if (!name.trim()) {
      setFormError('Product name is required.');
      return;
    }

    // Auto-create category if none exists and user typed one or picked preset
    let targetCatId = categoryId;
    if (!targetCatId && categories.length > 0) {
      targetCatId = categories[0].id;
    }

    if (!targetCatId) {
      setFormError('Please select or create a category first.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        categoryId: targetCatId,
        price: numPrice,
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        discount: parseInt(discount) || 0,
        imageUrl: imageUrl.trim(),
        stock: parseInt(stock) || 0,
        available,
        brand: brand.trim() || null,
        rating: parseFloat(rating) || 4.8,
        foodType,
        taste,
        origin,
        tags: tags.trim(),
        earnSnackpoints,
        isTrending,
        isHalfPrice,
      };

      let res;
      if (editingProduct) {
        res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save product');
      }

      showToast(
        editingProduct ? 'Product updated successfully!' : 'Product added to catalog!',
        'success'
      );
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (p: Product) => {
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !p.available }),
      });

      if (res.ok) {
        showToast(
          p.available ? `${p.name} hidden from store` : `${p.name} is now live!`,
          'info'
        );
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('Product removed from store.', 'info');
        setDeleteConfirmId(null);
        loadData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete product', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search.trim() === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
      p.tags.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Product Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Add, price, discount, and manage snacks live on campus.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openNewModal}
            className="px-4 py-2.5 bg-[#FF6B00] hover:bg-[#EA580C] text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Snack Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snack, brand, or tag..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none"
        >
          <option value="ALL">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* MOBILE PRODUCT CARDS VIEW (Clean & Touch-friendly on phones) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-400 bg-slate-800/90 rounded-2xl border border-slate-700">
            Loading catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-800/90 rounded-2xl border border-slate-700">
            No snacks found. Tap <strong>+ Add Snack Product</strong> to create one!
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isLow = p.stock > 0 && p.stock <= 8;
            const isOut = p.stock === 0;

            return (
              <div
                key={p.id}
                className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-md space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <VegBadge type={p.foodType} />
                      <h3 className="font-bold text-white text-sm truncate">{p.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                      <span className="text-orange-400 font-semibold">{p.category?.name || 'Snack'}</span>
                      {p.brand && <span>• {p.brand}</span>}
                      <span>• ⭐ {p.rating}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-base font-black text-white">₹{p.price}</span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-xs text-slate-500 line-through">₹{p.originalPrice}</span>
                      )}
                      {p.discount > 0 && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                          {p.discount}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isOut
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : isLow
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-slate-900 text-slate-300'
                      }`}
                    >
                      {isOut ? 'Out of Stock' : `${p.stock} units`}
                    </span>

                    <button
                      onClick={() => handleToggleAvailability(p)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                        p.available
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {p.available ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-bold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase font-bold text-slate-400 text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="p-3.5">Image</th>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price & Discount</th>
                <th className="p-3.5">SnackPoints</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Loading catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= 8;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-700/30 transition">
                      <td className="p-3.5">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                          <Image
                            src={p.imageUrl}
                            alt={p.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <VegBadge type={p.foodType} />
                          <span className="font-bold text-white text-sm">{p.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                          {p.brand && <span>{p.brand}</span>}
                          <span>⭐ {p.rating}</span>
                          <span className="capitalize">{p.taste.toLowerCase()}</span>
                          {p.isTrending && (
                            <span className="bg-amber-950 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-bold">
                              🔥 Trending
                            </span>
                          )}
                          {p.isHalfPrice && (
                            <span className="bg-rose-950 text-rose-400 text-[10px] px-1.5 py-0.5 rounded font-bold">
                              ⚡ Half Price
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="bg-slate-900 text-orange-300 font-semibold px-2.5 py-1 rounded-lg border border-slate-700/80">
                          {p.category?.name || 'Snack'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-white text-sm">₹{p.price}</span>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <span className="text-slate-500 line-through text-[11px]">
                              ₹{p.originalPrice}
                            </span>
                          )}
                        </div>
                        {p.discount > 0 && (
                          <span className="text-[10px] text-emerald-400 font-bold">
                            {p.discount}% OFF applied
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {p.earnSnackpoints ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>Earn {Math.floor(p.price / 10)} pts</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">No pts</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-md ${
                            isOut
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : isLow
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'text-slate-300'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : `${p.stock} units`}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleAvailability(p)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                            p.available
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                              : 'bg-slate-900 text-slate-500 border border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {p.available ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-600 rounded-lg transition"
                            title="Edit product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 rounded-lg transition"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Delete this product?</h3>
            <p className="text-xs text-slate-400 mb-5">
              This action will permanently remove this snack from the store catalog.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL (100% Mobile Optimized Full-Screen Sheet on Mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-scale-up">
            
            {/* STICKY MODAL HEADER */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {editingProduct ? 'Edit Product & Pricing' : '+ Add New Snack Product'}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Fill details and tap Save at bottom
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form onSubmit={handleSaveProduct} id="productForm" className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 font-bold">
                  {formError}
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lay's Magic Masala"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                />
              </div>

              {/* Category Picker & Quick-Creator */}
              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>Category *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(!showNewCatInput)}
                    className="text-xs text-[#FF6B00] font-bold hover:underline flex items-center gap-1"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>{showNewCatInput ? 'Cancel' : '+ New Category'}</span>
                  </button>
                </div>

                {/* Inline Quick Add Category Input */}
                {showNewCatInput && (
                  <div className="flex gap-2 p-2 bg-slate-800/90 rounded-xl border border-orange-500/40">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name (e.g. Midnight Combos)"
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={creatingCat || !newCategoryName.trim()}
                      onClick={() => handleQuickCreateCategory()}
                      className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold rounded-lg text-xs disabled:opacity-50"
                    >
                      {creatingCat ? 'Adding...' : 'Create'}
                    </button>
                  </div>
                )}

                {/* Category Select Dropdown */}
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 text-white"
                >
                  {categories.length === 0 ? (
                    <option value="">No categories yet — select a preset below</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>

                {/* Fast Preset Category Chips for Mobile */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1.5">
                    Quick Preset Categories (Tap to Select / Create):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_CATEGORY_PRESETS.map((preset) => {
                      const existing = categories.find(
                        (c) => c.name.toLowerCase() === preset.name.toLowerCase() || c.slug === preset.slug
                      );
                      const isSelected = existing && categoryId === existing.id;

                      return (
                        <button
                          key={preset.slug}
                          type="button"
                          onClick={() => {
                            if (existing) {
                              setCategoryId(existing.id);
                            } else {
                              handleQuickCreateCategory(preset.name);
                            }
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition ${
                            isSelected
                              ? 'bg-[#FF6B00] text-white border-[#FF6B00] font-bold shadow-xs'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          {preset.name} {existing ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pricing & Discount Grid (Mobile friendly 2-3 cols) */}
              <div className="bg-slate-950/70 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Pricing & Discounts
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      step="1"
                      required
                      value={price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Original Price (₹)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={originalPrice}
                      onChange={(e) => handleOriginalPriceChange(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Discount (% OFF)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={discount}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Appetizing description of taste and portion..."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                />
              </div>

              {/* Stock, Brand, Rating */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Stock *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Lay's"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Rating
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                  />
                </div>
              </div>

              {/* Snack Image: Upload from Device / URL / Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Snack Photo *
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[11px] text-red-400 hover:text-red-300 font-medium"
                    >
                      Clear Image
                    </button>
                  )}
                </div>

                {/* Image Preview & Upload Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
                  {imageUrl ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-900 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 shrink-0">
                      <Upload className="w-6 h-6 mb-1 text-slate-600" />
                      <span className="text-[9px] uppercase font-bold tracking-wider">No Photo</span>
                    </div>
                  )}

                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-600 hover:to-orange-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Uploading Photo...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload from Gallery / Files</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-400">
                      PNG, JPG, WebP up to 5MB. Directly uploads from your phone or PC.
                    </p>
                  </div>
                </div>

                {/* Direct URL input */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Or paste an Image URL directly:
                  </label>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 text-slate-200"
                  />
                </div>

                {/* Presets Grid for Mobile */}
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Quick Preset Photos
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_FOOD_IMAGES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition ${
                          imageUrl === preset.url
                            ? 'bg-[#FF6B00] text-white border-[#FF6B00] font-bold'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Badges & Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setEarnSnackpoints(!earnSnackpoints)}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    earnSnackpoints
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Star className={`w-4 h-4 ${earnSnackpoints ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-bold text-white">SnackPoints</p>
                      <p className="text-[10px] text-slate-400">{earnSnackpoints ? 'Eligible to earn' : 'Disabled'}</p>
                    </div>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${earnSnackpoints ? 'bg-amber-400' : 'bg-slate-600'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsTrending(!isTrending)}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    isTrending
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Flame className={`w-4 h-4 ${isTrending ? 'fill-orange-400 text-orange-400' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-bold text-white">Trending Badge</p>
                      <p className="text-[10px] text-slate-400">{isTrending ? 'Featured on Home' : 'Normal'}</p>
                    </div>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${isTrending ? 'bg-orange-500' : 'bg-slate-600'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsHalfPrice(!isHalfPrice)}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    isHalfPrice
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${isHalfPrice ? 'fill-rose-400 text-rose-400' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-bold text-white">Half Price Deal</p>
                      <p className="text-[10px] text-slate-400">{isHalfPrice ? '50% Deal Active' : 'Regular'}</p>
                    </div>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${isHalfPrice ? 'bg-rose-500' : 'bg-slate-600'}`} />
                </button>
              </div>

              {/* Attributes: FoodType, Taste, Origin */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Food Type
                  </label>
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value as FoodType)}
                    className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="VEG">🌱 Pure Veg</option>
                    <option value="NON_VEG">🍗 Non-Veg</option>
                    <option value="VEGAN">🍃 Vegan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Taste
                  </label>
                  <select
                    value={taste}
                    onChange={(e) => setTaste(e.target.value as TasteProfile)}
                    className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="SPICY">🌶️ Spicy</option>
                    <option value="SWEET">🍫 Sweet</option>
                    <option value="SALTY">🧂 Salty</option>
                    <option value="SOUR">🍋 Sour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Origin
                  </label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value as OriginType)}
                    className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="INDIAN">🇮🇳 Desi</option>
                    <option value="INTERNATIONAL">🌍 World</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="available"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF6B00] bg-slate-800 border-slate-700"
                />
                <label htmlFor="available" className="text-xs font-bold text-slate-300 cursor-pointer">
                  Visible & Available for customer orders
                </label>
              </div>
            </form>

            {/* STICKY BOTTOM ACTION BAR (Always visible on mobile without scrolling) */}
            <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs sm:text-sm transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="productForm"
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-[#FF6B00] hover:bg-[#EA580C] disabled:bg-slate-700 text-white font-black rounded-xl text-xs sm:text-sm transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingProduct ? 'Update Product' : '+ Add to Catalog'}</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
