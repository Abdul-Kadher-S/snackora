import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

let browserClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client for browser usage with Anon/Publishable key.
 * Returns null if Supabase environment variables are not configured yet.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  if (!browserClient && supabaseUrl && supabaseAnonKey) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return browserClient;
}

/**
 * Broadcasts a real-time order event across all connected admin clients.
 * Safely ignores if Supabase credentials are not configured.
 */
export async function broadcastOrderEvent(
  event: 'ORDER_CREATED' | 'ORDER_UPDATED',
  payload: Record<string, any>
) {
  try {
    const client = getSupabaseClient();
    if (!client) return;

    const channel = client.channel('snackora_admin_realtime');
    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  } catch (error) {
    console.error('Failed to broadcast realtime order event:', error);
  }
}

/**
 * Broadcasts a real-time product/stock event across all connected customer & admin clients.
 * Safely ignores if Supabase credentials are not configured.
 */
export async function broadcastProductEvent(
  event: 'PRODUCT_CREATED' | 'PRODUCT_UPDATED' | 'PRODUCT_DELETED' | 'STOCK_UPDATED',
  payload: Record<string, any>
) {
  try {
    const client = getSupabaseClient();
    if (!client) return;

    const channel = client.channel('snackora_products_live');
    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  } catch (error) {
    console.error('Failed to broadcast realtime product event:', error);
  }
}

/**
 * Broadcasts a real-time snackpoints credit notification across customer clients.
 */
export async function broadcastSnackpointsEvent(
  event: 'SNACKPOINTS_CREDITED',
  payload: {
    phone: string;
    orderNumber: string;
    points: number;
    title: string;
    message: string;
  }
) {
  try {
    const client = getSupabaseClient();
    if (!client) return;

    const channel = client.channel('snackora_customer_notifications');
    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  } catch (error) {
    console.error('Failed to broadcast realtime snackpoints event:', error);
  }
}

