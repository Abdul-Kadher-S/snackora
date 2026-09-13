'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Product, Category, ComboItem } from '@/types';
import {
  Flame,
  Plus,
  Trash2,
  Power,
  RefreshCw,
  X,
  Loader2,
  Upload,
  Sparkles,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ImageIcon,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

// Snack preset images for quick 1-click selection in combo slots
const PRESET_SNACK_IMAGES = [
  { label: 'Burger & Bun', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
  { label: 'Cold Coffee', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80' },
  { label: 'Fries & Cheesy Dip', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80' },
  { label: 'Hot Maggi Noodles', url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80' },
  { label: 'Chocolate Brownie', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80' },
  { label: 'Crispy Chips & Dip', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80' },
  { label: 'Samosa & Chutney', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80' },
  { label: 'Ice Cream Tub', url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&auto=format&fit=crop&q=80' },
  { label: 'Energy Drink / Soda', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80' },
  { label: 'Loaded Sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' },
];

export function CombosClient() {
  const [combos, setCombos] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comboToDelete, setComboToDelete] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Combo Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('99');
  const [originalPrice, setOriginalPrice] = useState('149');
  const [foodType, setFoodType] = useState<'VEG' | 'NON_VEG'>('VEG');
  const [stock, setStock] = useState('50');
  const [mainImageUrl, setMainImageUrl] = useState(PRESET_SNACK_IMAGES[0].url);

  // Number of items in combo: 2, 3, or 4
  const [itemCount, setItemCount] = useState<2 | 3 | 4>(2);
  const [slotItems, setSlotItems] = useState<ComboItem[]>([
    { name: 'Double Cheese Burger', imageUrl: PRESET_SNACK_IMAGES[0].url },
    { name: 'Chilled Cold Coffee', imageUrl: PRESET_SNACK_IMAGES[1].url },
    { name: 'Crispy French Fries', imageUrl: PRESET_SNACK_IMAGES[2].url },
    { name: 'Chocolate Brownie', imageUrl: PRESET_SNACK_IMAGES[4].url },
  ]);

  // File upload refs for slots
  const slotFileRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const [uploadingSlotIndex, setUploadingSlotIndex] = useState<number | null>(null);

  // File upload ref & state for main combo cover image
  const mainCoverFileRef = useRef<HTMLInputElement>(null);
  const [uploadingMainCover, setUploadingMainCover] = useState(false);

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products?includeInactive=true'),
        fetch('/api/categories'),
      ]);

      if (prodRes.ok) {
        const prodData: Product[] = await prodRes.json();
        // Filter products that are combos
        const filtered = prodData.filter(
          (p) =>
            p.comboItems ||
            p.tags?.includes('combo') ||
            p.category?.slug === 'combos' ||
            p.category?.slug === 'midnight-combos'
        );
        setCombos(filtered);
      }

      if (catRes.ok) {
        const catData: Category[] = await catRes.json();
        setCategories(catData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const handleUploadSlotImage = async (index: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image is larger than 5MB', 'error');
      return;
    }

    setUploadingSlotIndex(index);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const newItems = [...slotItems];
        newItems[index] = { ...newItems[index], imageUrl: data.url };
        setSlotItems(newItems);
        // If it's the first slot, also default cover image
        if (index === 0 && !mainImageUrl) {
          setMainImageUrl(data.url);
        }
        showToast(`Product #${index + 1} image uploaded!`, 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to upload image', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Image upload failed', 'error');
    } finally {
      setUploadingSlotIndex(null);
    }
  };

  const handleUploadMainCover = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image is larger than 5MB', 'error');
      return;
    }

    setUploadingMainCover(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMainImageUrl(data.url);
        showToast('Combo cover image uploaded from gallery!', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to upload cover image', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Cover image upload failed', 'error');
    } finally {
      setUploadingMainCover(false);
    }
  };

  const handleCreateCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a combo title', 'error');
      return;
    }

    const numPrice = parseFloat(price);
    const numOrig = parseFloat(originalPrice) || numPrice;
    if (isNaN(numPrice) || numPrice <= 0) {
      showToast('Please enter a valid combo price', 'error');
      return;
    }

    // Prepare active items (2, 3, or 4)
    const activeItems = slotItems.slice(0, itemCount).map((item, i) => ({
      name: item.name?.trim() || `Combo Item ${i + 1}`,
      imageUrl: item.imageUrl || PRESET_SNACK_IMAGES[i % PRESET_SNACK_IMAGES.length].url,
    }));

    // Find or create 'combos' category
    let targetCatId = categories.find(
      (c) => c.slug === 'combos' || c.slug === 'midnight-combos' || c.name.toLowerCase().includes('combo')
    )?.id;

    if (!targetCatId && categories.length > 0) {
      targetCatId = categories[0].id;
    }

    const calculatedDiscount = Math.max(0, Math.round(((numOrig - numPrice) / numOrig) * 100));

    setSaving(true);
    try {
      const payload = {
        name: title.trim(),
        description:
          description.trim() ||
          `Special Combo Offer including ${activeItems.map((it) => it.name).join(' + ')}.`,
        categoryId: targetCatId,
        price: numPrice,
        originalPrice: numOrig,
        discount: calculatedDiscount,
        imageUrl: mainImageUrl || activeItems[0]?.imageUrl || PRESET_SNACK_IMAGES[0].url,
        stock: parseInt(stock) || 50,
        available: true,
        foodType,
        taste: 'SPICY',
        origin: 'INDIAN',
        tags: 'combo,combo-offer,bundle,deal',
        isTrending: true,
        earnSnackpoints: true,
        comboItems: JSON.stringify(activeItems),
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(`Combo "${title}" published successfully!`, 'success');
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        setPrice('99');
        setOriginalPrice('149');
        fetchCombos();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create combo', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while saving combo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (combo: Product) => {
    const newAvail = !combo.available;
    setTogglingId(combo.id);
    try {
      const res = await fetch(`/api/products/${combo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: newAvail }),
      });
      if (res.ok) {
        setCombos((prev) =>
          prev.map((p) => (p.id === combo.id ? { ...p, available: newAvail } : p))
        );
        showToast(`Combo is now ${newAvail ? 'available' : 'unavailable'}`, 'success');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!comboToDelete) return;
    const { id, name } = comboToDelete;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCombos((prev) => prev.filter((p) => p.id !== id));
        showToast(`Combo "${name}" deleted`, 'success');
        setComboToDelete(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Combo Offers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-950 text-orange-400 border border-orange-800/80 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              HOT DEALS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Bundle 2, 3, or 4 snacks together with custom images to create high-converting meal deals for hostel rooms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCombos}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
            title="Refresh combos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-[#EA580C] hover:to-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-orange-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Combo Offer</span>
          </button>
        </div>
      </div>

      {/* Combos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading && combos.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
            <span>Loading combo deals...</span>
          </div>
        ) : combos.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-300">No combo offers created yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first 2, 3, or 4 product bundle with images using the button above.
            </p>
          </div>
        ) : (
          combos.map((combo) => {
            let parsedItems: ComboItem[] = [];
            if (combo.comboItems) {
              try {
                parsedItems = JSON.parse(combo.comboItems);
              } catch {}
            }

            const isToggling = togglingId === combo.id;
            const isDeleting = deletingId === combo.id;

            return (
              <div
                key={combo.id}
                className={`bg-slate-800/90 border rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                  combo.available
                    ? 'border-slate-700/80 hover:border-orange-500/50'
                    : 'border-slate-800/60 bg-slate-900/60 opacity-75'
                }`}
              >
                {/* Header info */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-xl font-black text-[11px] bg-orange-950/90 text-orange-300 border border-orange-800/80 uppercase tracking-wide flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      {parsedItems.length > 0 ? `${parsedItems.length} Products Combo` : 'Combo Bundle'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        combo.available
                          ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80'
                          : 'text-slate-400 bg-slate-900 border-slate-700'
                      }`}
                    >
                      {combo.available ? 'AVAILABLE' : 'OUT OF STOCK'}
                    </span>
                  </div>

                  <h3 className="font-black text-white text-base mb-1">{combo.name}</h3>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                    {combo.description}
                  </p>

                  {/* Attractive Multi-Product Visual Preview */}
                  <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                      <span>Included Snacks ({parsedItems.length || 1})</span>
                    </p>

                    {parsedItems.length > 0 ? (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {parsedItems.map((item, idx) => (
                          <React.Fragment key={idx}>
                            <div className="flex flex-col items-center gap-1 text-center shrink-0 w-20">
                              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden relative shadow-md">
                                <Image
                                  src={item.imageUrl || PRESET_SNACK_IMAGES[0].url}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <span className="text-[10px] text-slate-300 font-bold truncate w-full">
                                {item.name}
                              </span>
                            </div>
                            {idx < parsedItems.length - 1 && (
                              <div className="w-5 h-5 rounded-full bg-orange-950 border border-orange-700 text-orange-400 flex items-center justify-center text-xs font-black shrink-0">
                                +
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden relative shrink-0">
                          <Image
                            src={combo.imageUrl}
                            alt={combo.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-xs text-slate-300 font-medium">Standard Combo Bundle</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing and Actions */}
                <div className="pt-3 border-t border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-white">₹{combo.price}</span>
                      {combo.originalPrice && combo.originalPrice > combo.price && (
                        <span className="text-xs text-slate-500 line-through">₹{combo.originalPrice}</span>
                      )}
                    </div>
                    {combo.originalPrice && combo.originalPrice > combo.price && (
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                        SAVE ₹{Math.round(combo.originalPrice - combo.price)} ({combo.discount}% OFF)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isToggling || isDeleting}
                      onClick={() => handleToggleAvailability(combo)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                        combo.available
                          ? 'bg-slate-900/80 hover:bg-amber-950/40 text-amber-300 border-amber-900/50'
                          : 'bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Power className="w-3.5 h-3.5" />
                      )}
                      <span>{combo.available ? 'Disable Combo' : 'Enable Combo'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isToggling || isDeleting}
                      onClick={() => setComboToDelete(combo)}
                      className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded-xl transition"
                      title="Delete combo"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {comboToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">Delete Combo Offer?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete <span className="text-orange-400 font-bold">{comboToDelete.name}</span>? Customers will no longer see this combo.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setComboToDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-xs text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId === comboToDelete.id}
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/50"
              >
                {deletingId === comboToDelete.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Combo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl text-white my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white">
                  <Flame className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Create Combo Offer</h3>
                  <p className="text-[11px] text-slate-400">Bundle 2, 3, or 4 products with images</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCombo} className="space-y-4 text-xs">
              {/* Combo Title */}
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Combo Name *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midnight Gamer Feast"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Combo Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 1x Loaded Burger + 1x Cold Coffee + 1x Peri Peri Fries"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Combo Price (₹) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-base font-black text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Price customer pays</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-base font-bold text-slate-300 focus:outline-none"
                  />
                  <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">
                    {parseFloat(originalPrice) > parseFloat(price)
                      ? `Save ₹${Math.round(parseFloat(originalPrice) - parseFloat(price))} (${Math.round(
                          ((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100
                        )}% OFF)`
                      : 'Total sum before discount'}
                  </span>
                </div>
              </div>

              {/* Number of Products Selector */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-200 uppercase text-xs flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-orange-400" />
                    <span>How Many Products in this Combo?</span>
                  </label>
                  <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {([2, 3, 4] as const).map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setItemCount(count)}
                        className={`px-3 py-1.5 rounded-lg font-black text-xs transition ${
                          itemCount === count
                            ? 'bg-[#FF6B00] text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {count} Products
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slots Builder */}
                <div className="space-y-3">
                  {Array.from({ length: itemCount }).map((_, index) => {
                    const item = slotItems[index];
                    return (
                      <div
                        key={index}
                        className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-orange-400 uppercase tracking-wide">
                            Product #{index + 1}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Upload or choose snack photo
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                          {/* Item Name */}
                          <div className="sm:col-span-2">
                            <label className="block font-medium text-[11px] text-slate-400 mb-1">
                              Snack Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={item?.name || ''}
                              onChange={(e) => {
                                const newItems = [...slotItems];
                                newItems[index] = { ...newItems[index], name: e.target.value };
                                setSlotItems(newItems);
                              }}
                              placeholder={`e.g. ${
                                index === 0 ? 'Double Cheese Burger' : index === 1 ? 'Cold Coffee' : 'Cheesy Fries'
                              }`}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                            />
                          </div>

                          {/* Image preview & Upload */}
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden relative shrink-0 shadow">
                              <Image
                                src={item?.imageUrl || PRESET_SNACK_IMAGES[index % PRESET_SNACK_IMAGES.length].url}
                                alt={`Slot ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div className="flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={slotFileRefs[index]}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleUploadSlotImage(index, f);
                                }}
                              />
                              <button
                                type="button"
                                disabled={uploadingSlotIndex === index}
                                onClick={() => slotFileRefs[index].current?.click()}
                                className="w-full py-1.5 px-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1"
                              >
                                {uploadingSlotIndex === index ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Upload className="w-3 h-3" />
                                )}
                                <span>Upload Photo</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Quick Presets Picker */}
                        <div className="pt-1">
                          <label className="block text-[10px] text-slate-500 mb-1">
                            Or select from popular presets:
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {PRESET_SNACK_IMAGES.slice(0, 6).map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                  const newItems = [...slotItems];
                                  newItems[index] = {
                                    ...newItems[index],
                                    imageUrl: preset.url,
                                    name: newItems[index]?.name || preset.label,
                                  };
                                  setSlotItems(newItems);
                                }}
                                className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                                  item?.imageUrl === preset.url
                                    ? 'bg-[#FF6B00] text-white border-orange-500 font-bold'
                                    : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cover Banner Image */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-300 uppercase text-xs">
                    Main Combo Cover Image
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Primary card & hero banner image
                  </span>
                </div>

                <div className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mainImageUrl || PRESET_SNACK_IMAGES[0].url}
                      alt="Combo Cover Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PRESET_SNACK_IMAGES[0].url;
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <input
                      type="file"
                      ref={mainCoverFileRef}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadMainCover(f);
                        e.target.value = '';
                      }}
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={uploadingMainCover}
                      onClick={() => mainCoverFileRef.current?.click()}
                      className="w-full px-3.5 py-2 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-600 hover:to-orange-500 active:scale-98 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                    >
                      {uploadingMainCover ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading Cover Photo...</span>
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

                {/* Direct Image URL input fallback */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 font-semibold">
                    Or enter/paste direct Image URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={mainImageUrl}
                      onChange={(e) => setMainImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                    {mainImageUrl && (
                      <button
                        type="button"
                        onClick={() => setMainImageUrl('')}
                        className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition shrink-0"
                        title="Clear URL"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Food Type & Stock */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Food Type</label>
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="VEG">🟢 100% Vegetarian</option>
                    <option value="NON_VEG">🔴 Non-Vegetarian</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Stock Count</label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-[#EA580C] hover:to-orange-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-950/50 cursor-pointer active:scale-95"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Flame className="w-4 h-4 fill-white" />
                  )}
                  <span>Publish Combo Offer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
