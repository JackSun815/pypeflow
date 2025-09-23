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
      headers: {
        ...options.headers,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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

// Create Supabase client with retry and error handling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    storage: window.localStorage
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  },
  // Use custom fetch implementation with retry
  fetch: (url, options) => withRetry(
    () => customFetch(url, options),
    3,
    1000,
    (attempt, error) => {
      console.warn(`Retrying failed request (attempt ${attempt}/3):`, error.message);
    }
  )
});

// Stateless, sessionless Supabase client for public SDR dashboard
export const supabasePublic = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
  fetch: (url, options) => withRetry(
    () => customFetch(url, options),
    3,
    1000,
    (attempt, error) => {
      console.warn(`[Public] Retrying failed request (attempt ${attempt}/3):`, error.message);
    }
  )
});

// Note: Agency-aware client is now handled in useAgencyClient hook

// Add online/offline detection
if (typeof window !== 'undefined') {
  let reconnectTimeout: number;

  window.addEventListener('online', () => {
    console.log('Connection restored');
    // Attempt to reconnect realtime subscriptions
    supabase.removeAllChannels();
    clearTimeout(reconnectTimeout);
    reconnectTimeout = window.setTimeout(() => {
      supabase.channel('system').subscribe();
    }, 1000);
  });

  window.addEventListener('offline', () => {
    console.warn('Connection lost');
    clearTimeout(reconnectTimeout);
  });
}