'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Category } from '@/types';
import { Plus, Edit2, Trash2, RefreshCw, X, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export function CategoriesClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

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
      showToast('Category photo uploaded from gallery successfully!', 'success');
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

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories?includeAll=true');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openNewModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80');
    setActive(true);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setSlug(c.slug);
    setDescription(c.description || '');
    setImageUrl(c.imageUrl || '');
    setActive(c.active);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
        imageUrl: imageUrl.trim() || null,
        active,
      };

      let res;
      if (editingCategory) {
        res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        showToast(
          editingCategory ? 'Category updated!' : 'Category created successfully!',
          'success'
        );
        setIsModalOpen(false);
        fetchCategories();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to save category');
      }
    } catch (e: any) {
      setError(e.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? All products in this category will also be deleted.')) return;
    
    setDeletingId(id);
    const previousCategories = [...categories];
    // Optimistic UI update
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (editingCategory?.id === id) {
      setIsModalOpen(false);
    }

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Category deleted successfully.', 'info');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to delete category', 'error');
        // Rollback
        setCategories(previousCategories);
      }
    } catch (e: any) {
      console.error(e);
      showToast('Network error while deleting category', 'error');
      setCategories(previousCategories);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Category Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Organize snacks into discoverable categories. Expandable at any time.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2.5 bg-[#FF6B00] hover:bg-[#EA580C] text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading categories...</div>
        ) : (
          categories.map((c) => (
            <div
              key={c.id}
              className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4 flex flex-col justify-between shadow-lg hover:border-slate-600 transition"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                  {c.imageUrl ? (
                    <Image src={c.imageUrl} alt={c.name} fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                      HB
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base truncate">{c.name}</h3>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        c.active
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {c.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {c.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                <span>{c._count?.products || 0} products</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(c)}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition text-xs font-semibold flex items-center gap-1"
                    title="Edit category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-600 border border-rose-800/80 text-rose-300 hover:text-white rounded-lg transition text-xs font-bold flex items-center gap-1"
                    title="Delete category"
                  >
                    {deletingId === c.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 font-bold mb-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Healthy Dry Fruits"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Slug (Optional)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. healthy-dry-fruits"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary of items in this category"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                />
              </div>

              {/* Image Upload / URL Input */}
              <div className="space-y-2.5 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <label className="block font-bold text-slate-400 uppercase text-[11px]">
                  Category Photo
                </label>

                <div className="flex items-center gap-3">
                  {imageUrl ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Category Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-900 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 shrink-0">
                      <Upload className="w-5 h-5 mb-1 text-slate-600" />
                      <span className="text-[9px] uppercase font-bold tracking-wider">No Photo</span>
                    </div>
                  )}

                  <div className="flex-1 w-full space-y-1.5">
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
                      className="w-full px-3.5 py-2 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-600 hover:to-orange-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
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

                {/* Direct URL input fallback */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Or paste an Image URL directly:
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="font-bold text-slate-300">Active & Discoverable</span>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors ${
                    active ? 'bg-[#FF6B00]' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      active ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                {editingCategory ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingCategory.id)}
                    disabled={deletingId === editingCategory.id}
                    className="px-3 py-2 bg-rose-950/60 hover:bg-rose-600 border border-rose-800/80 text-rose-300 hover:text-white rounded-xl font-bold flex items-center gap-1.5 transition text-xs"
                  >
                    {deletingId === editingCategory.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Delete Category</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
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
                    className="px-5 py-2 bg-[#FF6B00] hover:bg-[#EA580C] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg text-xs"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Category</span>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
