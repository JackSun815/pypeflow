import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface SDRWithMetrics extends Profile {
  totalConfirmedMeetings: number;
  totalPendingMeetings: number;
  totalHeldMeetings: number;
  totalNoShowMeetings: number;
}

export function useSDRs() {
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
      const { data: sdrProfiles, error: sdrError } = await supabase
        .from('profiles')
        .select('id, full_name, role, active')
        .eq('role', 'sdr')
        .eq('active', true)
        .order('full_name', { ascending: true });

      if (sdrError) throw sdrError;

      // Fetch assignments for all SDRs
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          sdr_id,
          client_id,
          monthly_target,
          clients (
            id,
            name,
            monthly_target
          )
        `)
        .eq('month', `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`)
      if (assignmentsError) throw assignmentsError;

      // Fetch meetings for this month
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .gte('scheduled_date', monthStart.toISOString())
        .lte('scheduled_date', monthEnd.toISOString());

      if (meetingsError) throw meetingsError;

      // Process and combine the data
      const sdrsWithMetrics = sdrProfiles?.map((sdr: Profile) => {
        // Get all meetings for this SDR
        const sdrMeetings = meetings?.filter(
          (meeting) => meeting.sdr_id === sdr.id
        ) || [];

        // Calculate client-specific metrics
        const clients = (assignments || [])
          .filter((assignment: any) => assignment.sdr_id === sdr.id)
          .map((assignment: any) => {
            const clientMeetings = sdrMeetings.filter(
              (meeting) => meeting.client_id === assignment.client_id
            );

            // Match the exact pending meetings calculation from Team Meetings
            const pendingMeetings = clientMeetings.filter(
              meeting => meeting.status === 'pending' && !meeting.no_show
            ).length;

            return {
              id: assignment.clients.id,
              name: assignment.clients.name,
              monthlyTarget: assignment.monthly_target,
              confirmedMeetings: clientMeetings.filter(
                (meeting) => meeting.status === 'confirmed' && !meeting.no_show
              ).length,
              pendingMeetings
            };
          });

        // Calculate total meetings for this SDR
        const totalConfirmedMeetings = sdrMeetings.filter(
          (meeting) => meeting.status === 'confirmed' && !meeting.no_show
        ).length;

        // Match the exact pending meetings calculation from Team Meetings
        const totalPendingMeetings = sdrMeetings.filter(
          meeting => meeting.status === 'pending' && !meeting.no_show
        ).length;

        const totalHeldMeetings = sdrMeetings.filter(
          (meeting) => meeting.held_at !== null
        ).length;

        const totalNoShows = sdrMeetings.filter(
          (meeting) => meeting.no_show === true
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
  }, []);

  return { sdrs, loading, error, fetchSDRs };
}