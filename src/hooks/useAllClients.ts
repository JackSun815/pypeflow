import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAgency } from '../contexts/AgencyContext';
import type { Client } from '../types/database';

export function useAllClients() {
  const { agency } = useAgency();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchAllClients() {
    try {
      let clientsQuery = supabase
        .from('clients')
        .select('*')
        .is('archived_at', null) // Only fetch non-archived clients
        .order('name', { ascending: true });
      
      if (agency) {
        clientsQuery = clientsQuery.eq('agency_id', agency.id);
      }
      
      const { data, error } = await clientsQuery as any;

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
    if (agency) {
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
    }
  }, [agency]);

  return { clients, loading, error, fetchAllClients };
}
