import React from 'react';

export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col animate-pulse">
      <div className="w-full aspect-[4/3] bg-slate-200 rounded-xl mb-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 bg-slate-200 rounded-sm" />
        <div className="w-16 h-4 bg-slate-200 rounded" />
      </div>
      <div className="w-3/4 h-5 bg-slate-200 rounded mb-1.5" />
      <div className="w-full h-3 bg-slate-200 rounded mb-1" />
      <div className="w-2/3 h-3 bg-slate-200 rounded mb-4" />
      <div className="mt-auto pt-2 flex items-center justify-between">
        <div className="w-16 h-6 bg-slate-200 rounded" />
        <div className="w-20 h-8 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[80px] animate-pulse">
      <div className="w-16 h-16 rounded-2xl bg-slate-200" />
      <div className="w-12 h-3 bg-slate-200 rounded" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
