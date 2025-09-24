import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabase-admin';

interface Agency {
  id: string;
  name: string;
  subdomain: string;
  settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AgencyContextType {
  agency: Agency | null;
  setAgency: (agency: Agency | null) => void;
  loading: boolean;
  error: string | null;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

interface AgencyProviderProps {
  children: ReactNode;
}

export function AgencyProvider({ children }: AgencyProviderProps) {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    determineAgency();
  }, []);

  // Re-run agency determination when URL changes or user logs in/out
  useEffect(() => {
    const handleStorageChange = () => {
      determineAgency();
    };

    const handleLocationChange = () => {
      determineAgency();
    };

    const handleUserLogin = () => {
      determineAgency();
    };

    // Listen for localStorage changes (user login/logout)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for URL changes
    window.addEventListener('popstate', handleLocationChange);
    
    // Listen for custom user login event
    window.addEventListener('userLogin', handleUserLogin);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('userLogin', handleUserLogin);
    };
  }, []);

  async function determineAgency() {
    try {
      setLoading(true);
      setError(null);

      // Get subdomain from hostname
      const hostname = window.location.hostname;
      const subdomain = extractSubdomain(hostname);
      
      console.log('Determining agency - hostname:', hostname, 'subdomain:', subdomain);
      
      if (subdomain) {
        // Try to fetch agency by subdomain
        console.log('Fetching agency by subdomain from hostname:', subdomain);
        await fetchAgencyBySubdomain(subdomain);
      } else {
        // Check for agency parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const agencyParam = urlParams.get('agency');
        
        console.log('No subdomain found, checking URL params. Agency param:', agencyParam);
        
        if (agencyParam) {
          // Try to fetch agency by subdomain from URL parameter
          console.log('Fetching agency by URL parameter:', agencyParam);
          await fetchAgencyBySubdomain(agencyParam);
        } else {
          // Check if user is logged in and has agency information
          const currentUser = localStorage.getItem('currentUser');
          if (currentUser) {
            try {
              const userData = JSON.parse(currentUser);
              if (userData.agency_id) {
                console.log('Loading agency from user context:', userData.agency_id);
                await fetchAgencyById(userData.agency_id);
                return;
              }
            } catch (err) {
              console.log('Failed to parse user data:', err);
            }
          }
          
          // Load default agency, but don't fail if it doesn't exist
          console.log('No agency specified, loading default agency');
          try {
            await fetchDefaultAgency();
          } catch (err) {
            console.log('Default agency not found, continuing without agency');
            setAgency(null);
            setError(null); // Don't treat this as an error for public pages
          }
        }
      }
    } catch (err) {
      console.error('Failed to determine agency:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agency');
      setAgency(null);
    } finally {
      setLoading(false);
    }
  }

  function extractSubdomain(hostname: string): string | null {
    // Handle localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Check for port-based subdomain simulation
      const port = window.location.port;
      if (port === '3001') return 'agency1';
      if (port === '3002') return 'agency2';
      return null;
    }

    // Handle production domains
    const parts = hostname.split('.');
    
    // For pypeflow.com domain structure: agency.pypeflow.com
    if (parts.length >= 2 && parts[parts.length - 1] === 'com' && parts[parts.length - 2] === 'pypeflow') {
      // Ignore 'www' as it's not a real subdomain
      if (parts[0] === 'www') {
        return null;
      }
      return parts[0]; // Return the subdomain part
    }
    
    // For other domain structures
    if (parts.length >= 3) {
      return parts[0]; // Return the first part as subdomain
    }
    
    return null;
  }

  async function fetchAgencyBySubdomain(subdomain: string) {
    try {
      // Try admin client first, then fall back to regular client
      const client = supabaseAdmin || supabase;
      console.log('Fetching agency by subdomain:', subdomain, 'using client:', client === supabaseAdmin ? 'admin' : 'regular');
      
      const { data, error } = await client
        .from('agencies')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching agency:', error);
        if (error.code === 'PGRST116') {
          // No rows returned - subdomain not found
          throw new Error(`Agency with subdomain "${subdomain}" not found`);
        }
        throw error;
      }

      setAgency(data);
      console.log(`Loaded agency: ${data.name} (${data.subdomain})`);
    } catch (err) {
      console.error('Failed to fetch agency by subdomain:', err);
      throw err;
    }
  }

  async function fetchAgencyById(agencyId: string) {
    try {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('agencies')
        .select('*')
        .eq('id', agencyId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error(`Agency with ID "${agencyId}" not found`);
        }
        throw error;
      }

      setAgency(data);
      console.log(`Loaded agency: ${data.name} (${data.subdomain})`);
    } catch (err) {
      console.error('Failed to fetch agency by ID:', err);
      throw err;
    }
  }

  async function fetchDefaultAgency() {
    try {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('agencies')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Default agency not found. Please contact support.');
        }
        throw error;
      }

      setAgency(data);
      console.log(`Loaded default agency: ${data.name}`);
    } catch (err) {
      console.error('Failed to fetch default agency:', err);
      throw err;
    }
  }

  const contextValue: AgencyContextType = {
    agency,
    setAgency,
    loading,
    error
  };

  return (
    <AgencyContext.Provider value={contextValue}>
      {children}
    </AgencyContext.Provider>
  );
}

export function useAgency() {
  const context = useContext(AgencyContext);
  if (context === undefined) {
    throw new Error('useAgency must be used within an AgencyProvider');
  }
  return context;
}
