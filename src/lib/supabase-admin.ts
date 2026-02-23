import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase Admin Config:', {
  url: supabaseUrl ? '✓ Set' : '✗ Missing',
  serviceKey: supabaseServiceKey ? `✓ Set (${supabaseServiceKey.substring(0, 20)}...)` : '✗ Missing',
});

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase service role key not found. Admin operations will not work.');
  console.error('Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file');
}

// Create Supabase client with service role key for admin operations
export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

if (supabaseAdmin) {
  console.log('✓ Supabase Admin client created successfully');
} else {
  console.error('✗ Failed to create Supabase Admin client');
}
