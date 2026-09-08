import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function StarRating({ rating, className = '', size = 'sm' }: StarRatingProps) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div
      className={`inline-flex items-center gap-1 bg-emerald-700 text-white font-semibold px-1.5 py-0.5 rounded-md ${textSize} ${className}`}
    >
      <span>{rating.toFixed(1)}</span>
      <Star className={`${iconSize} fill-white text-white`} />
    </div>
  );
}
