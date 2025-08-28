import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Client } from '../types/database';

export function useAllClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchAllClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('archived_at', null) // Only fetch non-archived clients
        .order('name', { ascending: true });

      if (error) throw error;

      setClients(data || []);
      setError(null);
    } catch (err) {
      console.error('All clients fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllClients();

    // Subscribe to changes
    const channel = supabase.channel('all-clients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients'
        },
        () => fetchAllClients()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { clients, loading, error, fetchAllClients };
}
