'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Product } from '@/types';

interface OrderItemToRepeat {
  productId: string;
  productName: string;
  quantity: number;
}

export function useRepeatOrder() {
  const { addMultipleToCart, setIsCartOpen } = useCart();
  const { showToast } = useToast();
  const [isRepeating, setIsRepeating] = useState(false);

  const repeatOrder = async (items: OrderItemToRepeat[]) => {
    if (!items || items.length === 0) {
      showToast('No items found in this order.', 'error');
      return;
    }

    setIsRepeating(true);
    try {
      // 1. Fetch current catalog products to revalidate live price, stock, and availability
      const res = await fetch('/api/products?includeInactive=true');
      if (!res.ok) {
        throw new Error('Failed to fetch latest product availability.');
      }
      const liveProducts: Product[] = await res.json();
      const productMap = new Map<string, Product>(liveProducts.map((p) => [p.id, p]));

      const itemsToAdd: { product: Product; quantity: number }[] = [];
      const unavailableNames: string[] = [];
      const partialStockNames: string[] = [];

      for (const item of items) {
        const product = productMap.get(item.productId);

        // Check availability & stock
        if (!product || !product.available || product.stock <= 0) {
          unavailableNames.push(item.productName || product?.name || 'Item');
          continue;
        }

        const desiredQty = item.quantity > 0 ? item.quantity : 1;
        const availableQty = Math.min(desiredQty, product.stock);

        if (availableQty < desiredQty) {
          partialStockNames.push(`${product.name} (${availableQty} left)`);
        }

        itemsToAdd.push({
          product,
          quantity: availableQty,
        });
      }

      // Add all available products at their CURRENT price to the cart
      if (itemsToAdd.length > 0) {
        addMultipleToCart(itemsToAdd);
        showToast(
          `Added ${itemsToAdd.length} snack${itemsToAdd.length > 1 ? 's' : ''} to your cart at current prices!`,
          'success'
        );
        // Open the cart drawer for customer review
        setIsCartOpen(true);
      } else {
        showToast('All products from this order are currently out of stock or unavailable.', 'error');
      }

      // Clear notifications about unavailable or partially stocked items
      if (unavailableNames.length > 0) {
        showToast(
          `Unavailable: ${unavailableNames.join(', ')} (skipped - out of stock).`,
          'error'
        );
      }

      if (partialStockNames.length > 0) {
        showToast(
          `Partial stock added: ${partialStockNames.join(', ')}.`,
          'info'
        );
      }
    } catch (err: any) {
      console.error('Error repeating order:', err);
      showToast(err.message || 'Failed to repeat order. Please try again.', 'error');
    } finally {
      setIsRepeating(false);
    }
  };

  return { repeatOrder, isRepeating };
}
