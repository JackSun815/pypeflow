import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAgency } from '../contexts/AgencyContext';
import type { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface SDRWithMetrics extends Profile {
  totalConfirmedMeetings: number;
  totalPendingMeetings: number;
  totalHeldMeetings: number;
  totalNoShowMeetings: number;
  clients: Array<{
    id: string;
    name: string;
    monthly_set_target: number;
    monthly_hold_target: number;
    confirmedMeetings: number;
    pendingMeetings: number;
  }>;
}

export function useSDRs() {
  const { agency } = useAgency();
  
  const [sdrs, setSDRs] = useState<SDRWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchSDRs() {
    try {
      // Get current month's start and end dates
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch all SDRs
      let sdrQuery = supabase
        .from('profiles')
        .select('id, full_name, role, active')
        .eq('role', 'sdr' as any)
        .eq('active', true as any);
      
      if (agency) {
        sdrQuery = sdrQuery.eq('agency_id', agency.id as any);
      }
      
      const { data: sdrProfiles, error: sdrError } = await sdrQuery
        .order('full_name', { ascending: true }) as any;

      if (sdrError) throw sdrError;

      // Fetch assignments for all SDRs
      let assignmentsQuery = supabase
        .from('assignments')
        .select(`
          sdr_id,
          client_id,
          monthly_set_target,
          monthly_hold_target,
          clients (
            id,
            name,
            monthly_set_target,
            monthly_hold_target
          )
        `)
        .eq('month', `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}` as any);
      
      if (agency) {
        assignmentsQuery = assignmentsQuery.eq('agency_id', agency.id as any);
      }
      
      const { data: assignments, error: assignmentsError } = await assignmentsQuery as any;
      if (assignmentsError) throw assignmentsError;

      // Fetch meetings for this month
      let meetingsQuery = supabase
        .from('meetings')
        .select('*')
        .gte('scheduled_date', monthStart.toISOString())
        .lte('scheduled_date', monthEnd.toISOString());
      
      if (agency) {
        meetingsQuery = meetingsQuery.eq('agency_id', agency.id as any);
      }
      
      const { data: meetings, error: meetingsError } = await meetingsQuery as any;

      if (meetingsError) throw meetingsError;

      // Process and combine the data
      const sdrsWithMetrics = sdrProfiles?.map((sdr: Profile) => {
        // Get all meetings for this SDR
        const sdrMeetings = meetings?.filter(
          (meeting: any) => meeting.sdr_id === sdr.id
        ) || [];

        // Calculate client-specific metrics
        const clients = (assignments || [])
          .filter((assignment: any) => assignment.sdr_id === sdr.id)
          .map((assignment: any) => {
            const clientMeetings = sdrMeetings.filter(
              (meeting: any) => meeting.client_id === assignment.client_id
            );

            // Match the exact pending meetings calculation from Team Meetings
            const pendingMeetings = clientMeetings.filter(
              (meeting: any) => meeting.status === 'pending' && !meeting.no_show
            ).length;

            return {
              id: assignment.clients.id,
              name: assignment.clients.name,
              monthly_set_target: assignment.monthly_set_target || 0,
              monthly_hold_target: assignment.monthly_hold_target || 0,
              confirmedMeetings: clientMeetings.filter(
                (meeting: any) => meeting.status === 'confirmed' && !meeting.no_show
              ).length,
              pendingMeetings
            };
          });

        // Calculate total meetings for this SDR
        const totalConfirmedMeetings = sdrMeetings.filter(
          (meeting: any) => meeting.status === 'confirmed' && !meeting.no_show
        ).length;

        // Match the exact pending meetings calculation from Team Meetings
        const totalPendingMeetings = sdrMeetings.filter(
          (meeting: any) => meeting.status === 'pending' && !meeting.no_show
        ).length;

        const totalHeldMeetings = sdrMeetings.filter(
          (meeting: any) => meeting.held_at !== null
        ).length;

        const totalNoShows = sdrMeetings.filter(
          (meeting: any) => meeting.no_show === true
        ).length;

        return {
          ...sdr,
          clients,
          totalConfirmedMeetings,
          totalPendingMeetings,
          totalHeldMeetings,
          totalNoShowMeetings: totalNoShows
        };
      });

      setSDRs(sdrsWithMetrics || []);
      setError(null);
    } catch (err) {
      console.error('SDR data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch SDR data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (agency) {
      fetchSDRs();

      // Subscribe to changes
      const channel = supabase.channel('sdr-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles'
          },
          () => fetchSDRs()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'assignments'
          },
          () => fetchSDRs()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meetings'
          },
          () => fetchSDRs()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [agency]);

  return { sdrs, loading, error, fetchSDRs };
}