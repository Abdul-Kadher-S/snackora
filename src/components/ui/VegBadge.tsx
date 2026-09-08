import React from 'react';
import { FoodType } from '@/types';
import { Leaf } from 'lucide-react';

interface VegBadgeProps {
  type: FoodType;
  showText?: boolean;
  className?: string;
}

export function VegBadge({ type, showText = false, className = '' }: VegBadgeProps) {
  if (type === 'VEGAN') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`} title="100% Vegan">
        <div className="w-4 h-4 rounded-sm border border-emerald-600 flex items-center justify-center p-0.5 bg-emerald-50">
          <Leaf className="w-3 h-3 text-emerald-600 fill-emerald-600" />
        </div>
        {showText && <span className="text-xs font-semibold text-emerald-700">Vegan</span>}
      </div>
    );
  }

  if (type === 'NON_VEG') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`} title="Non-Vegetarian">
        <div className="w-4 h-4 rounded-sm border border-rose-600 flex items-center justify-center p-0.5 bg-white">
          <div className="w-2 h-2 rounded-full bg-rose-600" />
        </div>
        {showText && <span className="text-xs font-semibold text-rose-700">Non-Veg</span>}
      </div>
    );
  }

  // Default VEG
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`} title="Pure Vegetarian">
      <div className="w-4 h-4 rounded-sm border border-emerald-600 flex items-center justify-center p-0.5 bg-white">
        <div className="w-2 h-2 rounded-full bg-emerald-600" />
      </div>
      {showText && <span className="text-xs font-semibold text-emerald-700">Veg</span>}
    </div>
  );
}
