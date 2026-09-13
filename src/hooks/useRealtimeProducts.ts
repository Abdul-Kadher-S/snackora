'use client';

import { useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Product } from '@/types';

interface UseRealtimeProductsOptions {
  onProductCreated?: (product: Product) => void;
  onProductUpdated?: (product: Product) => void;
  onProductDeleted?: (productId: string) => void;
  onStockUpdated?: (payload: { id: string; stock: number; available?: boolean; [key: string]: any }) => void;
  onSync?: () => void;
}

export function useRealtimeProducts(options: UseRealtimeProductsOptions = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase.channel('snackora_products_channel', {
      config: {
        broadcast: { ack: false },
      },
    });

    // 1. Supabase Realtime Broadcast events
    channel.on('broadcast', { event: 'PRODUCT_CREATED' }, (msg) => {
      if (msg.payload && optionsRef.current.onProductCreated) {
        optionsRef.current.onProductCreated(msg.payload);
      }
      if (optionsRef.current.onSync) {
        optionsRef.current.onSync();
      }
    });

    channel.on('broadcast', { event: 'PRODUCT_UPDATED' }, (msg) => {
      if (msg.payload && optionsRef.current.onProductUpdated) {
        optionsRef.current.onProductUpdated(msg.payload);
      }
      if (optionsRef.current.onSync) {
        optionsRef.current.onSync();
      }
    });

    channel.on('broadcast', { event: 'PRODUCT_DELETED' }, (msg) => {
      if (msg.payload?.id && optionsRef.current.onProductDeleted) {
        optionsRef.current.onProductDeleted(msg.payload.id);
      }
      if (optionsRef.current.onSync) {
        optionsRef.current.onSync();
      }
    });

    channel.on('broadcast', { event: 'STOCK_UPDATED' }, (msg) => {
      if (msg.payload && optionsRef.current.onStockUpdated) {
        optionsRef.current.onStockUpdated(msg.payload);
      } else if (msg.payload && optionsRef.current.onProductUpdated) {
        optionsRef.current.onProductUpdated(msg.payload as Product);
      }
      if (optionsRef.current.onSync) {
        optionsRef.current.onSync();
      }
    });

    // 2. PostgreSQL CDC (postgres_changes) on "Product" table
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'Product' },
      (payload) => {
        if (payload.new && optionsRef.current.onProductCreated) {
          optionsRef.current.onProductCreated(payload.new as Product);
        }
        if (optionsRef.current.onSync) {
          optionsRef.current.onSync();
        }
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'Product' },
      (payload) => {
        if (payload.new && optionsRef.current.onProductUpdated) {
          optionsRef.current.onProductUpdated(payload.new as Product);
        }
        if (optionsRef.current.onSync) {
          optionsRef.current.onSync();
        }
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'Product' },
      (payload) => {
        if (payload.old?.id && optionsRef.current.onProductDeleted) {
          optionsRef.current.onProductDeleted(payload.old.id);
        }
        if (optionsRef.current.onSync) {
          optionsRef.current.onSync();
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
