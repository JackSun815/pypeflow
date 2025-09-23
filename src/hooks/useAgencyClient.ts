import { useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAgency } from '../contexts/AgencyContext';

export function useAgencyClient() {
  const { agency } = useAgency();
  
  return useMemo(() => {
    // Always return the regular supabase client
    // Agency filtering will be handled in individual hooks
    return supabase;
  }, [agency]);
}

// Helper function to add agency filter to queries
export function addAgencyFilter(query: any, agencyId: string, table: string) {
  const tenantTables = [
    'profiles', 
    'clients', 
    'meetings', 
    'assignments', 
    'commission_goal_overrides', 
    'compensation_structures'
  ];
  
  if (tenantTables.includes(table)) {
    return query.eq('agency_id', agencyId);
  }
  
  return query;
}
