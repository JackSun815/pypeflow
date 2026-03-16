import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a reusable retry function with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Notify about retry if callback provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }
      
      // Wait with exponential backoff before retrying
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the throw above, but TypeScript needs it
  throw lastError;
}

// Custom fetch implementation with timeout and retry
const customFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const isBrowser = typeof window !== 'undefined';
const isIframeContext = isBrowser && window.self !== window.top;
const supabaseStorageKey = isIframeContext ? 'supabase.auth.token.iframe' : 'supabase.auth.token';
const supabaseStorage = isBrowser ? window.localStorage : undefined;

// Create Supabase client with retry and error handling
const baseClientOptions: any = {
  auth: {
    autoRefreshToken: !isIframeContext,
    persistSession: !isIframeContext,
    detectSessionInUrl: !isIframeContext,
    storageKey: supabaseStorageKey,
    storage: isIframeContext ? undefined : supabaseStorage
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000)
  },
  // Use custom fetch implementation with retry
  fetch: (url: string, options?: RequestInit) => withRetry(
    () => customFetch(url, options),
    3,
    1000,
    (attempt, error) => {
      console.warn(`Retrying failed request (attempt ${attempt}/3):`, error.message);
    }
  )
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, baseClientOptions);

// Stateless, sessionless Supabase client for public SDR dashboard
const publicClientOptions: any = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    storage: undefined
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  },
  fetch: (url: string, options?: RequestInit) => withRetry(
    () => customFetch(url, options),
    3,
    1000,
    (attempt, error) => {
      console.warn(`[Public] Retrying failed request (attempt ${attempt}/3):`, error.message);
    }
  )
};

export const supabasePublic = createClient<Database>(supabaseUrl, supabaseAnonKey, publicClientOptions);

// Note: Agency-aware client is now handled in useAgencyClient hook
// Note: The Supabase JS client handles its own WebSocket reconnection internally.
// Do not manually call removeAllChannels() or subscribe() on network events,
// as doing so destroys subscriptions set up by hooks (useSDRs, useMeetings, etc.)
// that won't be re-established.