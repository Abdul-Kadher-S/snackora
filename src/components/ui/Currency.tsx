import React from 'react';

interface CurrencyProps {
  amount: number;
  className?: string;
  showOriginal?: number | null;
}

export function Currency({ amount, className = '', showOriginal }: CurrencyProps) {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span className="font-bold tracking-tight">₹{formatted}</span>
      {showOriginal && showOriginal > amount && (
        <span className="text-xs text-slate-400 line-through font-normal">
          ₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(showOriginal)}
        </span>
      )}
    </span>
  );
}

export function formatRupees(amount: number): string {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;
}
