'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

interface UseRealtimeOrdersOptions {
  onOrderCreated?: (order: any) => void;
  onOrderUpdated?: (order: any) => void;
  onSync?: () => void;
  showToastNotification?: boolean;
}

// Simple Web Audio API chime for new orders (no external assets needed)
function playOrderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Play two-tone bell chime (800Hz -> 1000Hz)
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now + 0.15); // E6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch {
    // Audio playback may be blocked by browser autoplay policy before user interaction
  }
}

export function useRealtimeOrders(options: UseRealtimeOrdersOptions = {}) {
  const { onOrderCreated, onOrderUpdated, onSync, showToastNotification = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [isRealtimeAvailable, setIsRealtimeAvailable] = useState(false);
  const { showToast } = useToast();

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleNewOrder = useCallback((order: any) => {
    playOrderChime();
    if (showToastNotification) {
      const orderNum = order.orderNumber || (order.id ? `#${order.id.slice(-6)}` : 'New Order');
      const customer = order.customerName ? ` from ${order.customerName}` : '';
      const room = order.roomNumber ? ` (Room ${order.roomNumber})` : '';
      showToast(`🔔 New Order ${orderNum}${customer}${room}!`, 'success');
    }
    if (optionsRef.current.onOrderCreated) {
      optionsRef.current.onOrderCreated(order);
    }
    if (optionsRef.current.onSync) {
      optionsRef.current.onSync();
    }
  }, [showToastNotification, showToast]);

  const handleOrderUpdate = useCallback((order: any) => {
    if (optionsRef.current.onOrderUpdated) {
      optionsRef.current.onOrderUpdated(order);
    }
    if (optionsRef.current.onSync) {
      optionsRef.current.onSync();
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsRealtimeAvailable(false);
      setIsConnected(false);
      return;
    }

    setIsRealtimeAvailable(true);

    // Channel for both Postgres CDC and Direct Broadcasts
    const channel = supabase.channel('snackora_orders_live', {
      config: {
        broadcast: { ack: false },
      },
    });

    // 1. Listen to Supabase Broadcast events
    channel.on('broadcast', { event: 'ORDER_CREATED' }, (payload) => {
      if (payload.payload) {
        handleNewOrder(payload.payload);
      }
    });

    channel.on('broadcast', { event: 'ORDER_UPDATED' }, (payload) => {
      if (payload.payload) {
        handleOrderUpdate(payload.payload);
      }
    });

    // 2. Listen to PostgreSQL CDC (postgres_changes) on "Order" table
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'Order' },
      (payload) => {
        handleNewOrder(payload.new);
      }
    );

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'Order' },
      (payload) => {
        handleOrderUpdate(payload.new);
      }
    );

    // 3. Subscribe & monitor connection status
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        // Sync orders on connect / reconnect
        if (optionsRef.current.onSync) {
          optionsRef.current.onSync();
        }
      } else if (status === 'CLOSED' || status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleNewOrder, handleOrderUpdate]);

  return {
    isConnected,
    isRealtimeAvailable,
  };
}
