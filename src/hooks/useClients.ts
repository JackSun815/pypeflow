import { useEffect, useState } from 'react';
import { supabase, withRetry } from '../lib/supabase';
import type { Client, Meeting } from '../types/database';

interface ClientWithMetrics extends Client {
  monthlyTarget: number;
  confirmedMeetings: number;
  pendingMeetings: number;
  todaysMeetings: Meeting[];
}

export function useClients(sdrId?: string | null) {
  const [clients, setClients] = useState<ClientWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalMeetingGoal, setTotalMeetingGoal] = useState(0);
  const [totalBookedMeetings, setTotalBookedMeetings] = useState(0);
  const [totalPendingMeetings, setTotalPendingMeetings] = useState(0);

  async function fetchClients() {
    try {
      if (!sdrId) {
        setClients([]);
        setLoading(false);
        return;
      }

      // Get current month's start and end dates
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch assigned clients with their targets for the current month
      const { data: assignments, error: assignmentsError } = await withRetry(() =>
        supabase
          .from('assignments')
          .select(`
            monthly_target,
            clients (
              id,
              name,
              monthly_target
            )
          `)
          .eq('sdr_id', sdrId)
          .eq('month', monthStart.toISOString().split('T')[0])
      );

      if (assignmentsError) throw assignmentsError;

      // Calculate total meeting goal from assignments
      const totalGoal = assignments?.reduce((sum, assignment: any) => 
        sum + (assignment.monthly_target || 0), 0) || 0;
      setTotalMeetingGoal(totalGoal);

      // Fetch meetings for this month
      const { data: meetings, error: meetingsError } = await withRetry(() =>
        supabase
          .from('meetings')
          .select('*, clients(name)')
          .eq('sdr_id', sdrId)
          .gte('scheduled_date', monthStart.toISOString())
          .lte('scheduled_date', monthEnd.toISOString())
      );

      if (meetingsError) throw meetingsError;

      // Process and combine the data
      const clientsWithMetrics = (assignments || []).map((assignment: any) => {
        // Filter meetings for this client
        const clientMeetings = meetings?.filter(
          (meeting) => meeting.client_id === assignment.clients.id
        ) || [];

        // Get today's meetings for this client
        const todayMeetings = clientMeetings.filter(
          (meeting) => 
            new Date(meeting.scheduled_date).toDateString() === new Date().toDateString()
        );

        // Match the exact pending meetings calculation from Team Meetings
        const pendingMeetings = clientMeetings.filter(
          meeting => meeting.status === 'pending' && !meeting.no_show
        ).length;

        // Calculate confirmed meetings for this client
        const confirmedMeetings = clientMeetings.filter(
          (meeting) => meeting.status === 'confirmed' && !meeting.no_show
        ).length;

        return {
          id: assignment.clients.id,
          name: assignment.clients.name,
          monthlyTarget: assignment.monthly_target || 0,
          confirmedMeetings,
          pendingMeetings,
          todaysMeetings: todayMeetings || []
        };
      });

      // Calculate total meetings for this month
      const monthlyMeetings = meetings || [];
      
      // Calculate total confirmed meetings (excluding no-shows)
      const totalConfirmed = monthlyMeetings.filter(
        meeting => meeting.status === 'confirmed' && !meeting.no_show
      ).length;

      // Match the exact pending meetings calculation from Team Meetings
      const totalPending = monthlyMeetings.filter(
        meeting => meeting.status === 'pending' && !meeting.no_show
      ).length;

      setTotalBookedMeetings(totalConfirmed);
      setTotalPendingMeetings(totalPending);
      setClients(clientsWithMetrics);
      setError(null);
    } catch (err) {
      console.error('Client data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch client data');
      setClients([]);
      setTotalMeetingGoal(0);
      setTotalBookedMeetings(0);
      setTotalPendingMeetings(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClients();

    // Subscribe to changes in meetings and assignments
    const channel = supabase.channel('client-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        () => fetchClients()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings'
        },
        () => fetchClients()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sdrId]);

  return { 
    clients, 
    loading, 
    error, 
    fetchClients, 
    totalMeetingGoal,
    totalBookedMeetings,
    totalPendingMeetings
  };
}