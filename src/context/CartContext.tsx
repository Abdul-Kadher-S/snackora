'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Coupon, AppliedPromo } from '@/types';
import { useToast } from './ToastContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  addMultipleToCart: (items: { product: Product; quantity: number }[]) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  selectedCoupon: Coupon | null;
  setSelectedCoupon: (coupon: Coupon | null) => void;
  appliedPromo: AppliedPromo | null;
  setAppliedPromo: (promo: AppliedPromo | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'snackora_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const { showToast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to storage', e);
    }
  }, [cart, isLoaded]);

  const addToCart = (product: Product, quantity: number = 1) => {
    if (!product.available || product.stock <= 0) {
      showToast(`${product.name} is currently out of stock!`, 'error');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      const newQty = currentQty + quantity;

      if (newQty > product.stock) {
        showToast(`Max stock reached (${product.stock} available)`, 'error');
        return;
      }

      const updated = [...cart];
      updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
      setCart(updated);
      showToast(`Added another ${product.name}!`, 'success');
    } else {
      if (quantity > product.stock) {
        showToast(`Only ${product.stock} left in stock!`, 'error');
        return;
      }
      setCart([...cart, { product, quantity }]);
      showToast(`${product.name} added to cart!`, 'success');
    }
  };

  const addMultipleToCart = (items: { product: Product; quantity: number }[]) => {
    setCart((currentCart) => {
      const updated = [...currentCart];
      for (const item of items) {
        if (!item.product.available || item.product.stock <= 0) continue;
        const existingIdx = updated.findIndex((i) => i.product.id === item.product.id);
        const desiredQty = item.quantity > 0 ? item.quantity : 1;
        if (existingIdx > -1) {
          const currentQty = updated[existingIdx].quantity;
          const newQty = Math.min(currentQty + desiredQty, item.product.stock);
          updated[existingIdx] = { ...updated[existingIdx], quantity: newQty };
        } else {
          const newQty = Math.min(desiredQty, item.product.stock);
          updated.push({ product: item.product, quantity: newQty });
        }
      }
      return updated;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    if (quantity > item.product.stock) {
      showToast(`Only ${item.product.stock} units available!`, 'error');
      return;
    }

    setCart(cart.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
  };

  const removeFromCart = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    if (item) {
      showToast(`${item.product.name} removed from cart.`, 'info');
    }
    setCart(cart.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCoupon(null);
    setAppliedPromo(null);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  };

  const getItemQuantity = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Auto-adjust promo discount when subtotal changes
  useEffect(() => {
    if (!appliedPromo) return;
    if (cart.length === 0) {
      setAppliedPromo(null);
      return;
    }
    if (appliedPromo.minOrderValue && subtotal < appliedPromo.minOrderValue) {
      if (appliedPromo.discountAmount !== 0) {
        setAppliedPromo((prev) => (prev ? { ...prev, discountAmount: 0 } : null));
      }
      return;
    }
    let calculated = 0;
    if (appliedPromo.discountType === 'PERCENTAGE') {
      calculated = Math.round((subtotal * appliedPromo.discountValue) / 100);
    } else {
      calculated = appliedPromo.discountValue;
    }
    calculated = Math.min(calculated, subtotal);
    if (appliedPromo.discountAmount !== calculated) {
      setAppliedPromo((prev) => (prev ? { ...prev, discountAmount: calculated } : null));
    }
  }, [subtotal, cart.length, appliedPromo]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        addMultipleToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemQuantity,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        selectedCoupon,
        setSelectedCoupon,
        appliedPromo,
        setAppliedPromo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
