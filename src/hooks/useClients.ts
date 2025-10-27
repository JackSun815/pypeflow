import { useEffect, useState } from 'react';
import { supabase, withRetry } from '../lib/supabase';
import { useAgency } from '../contexts/AgencyContext';
import type { Client, Meeting } from '../types/database';

interface ClientWithMetrics extends Client {
  monthly_set_target: number;
  monthly_hold_target: number;
  confirmedMeetings: number;
  pendingMeetings: number;
  todaysMeetings: Meeting[];
  heldMeetings: number;
  totalMeetingsSet: number;
}

export function useClients(sdrId?: string | null, supabaseClient?: any) {
  const { agency } = useAgency();
  const client = supabaseClient || supabase;
  
  const [clients, setClients] = useState<ClientWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalMeetingGoal, setTotalMeetingGoal] = useState(0);
  const [totalBookedMeetings, setTotalBookedMeetings] = useState(0);
  const [totalPendingMeetings, setTotalPendingMeetings] = useState(0);
  const [sdrAgencyId, setSdrAgencyId] = useState<string | null>(null);

  async function fetchClients() {
    try {
      if (!sdrId) {
        setClients([]);
        setLoading(false);
        return;
      }

      // If no agency from context, fetch SDR's agency_id
      let agencyIdToUse = agency?.id;
      if (!agencyIdToUse || agencyIdToUse === '00000000-0000-0000-0000-000000000000') {
        if (!sdrAgencyId) {
          // Fetch SDR's agency_id
          const { data: sdrData } = await client
            .from('profiles')
            .select('agency_id')
            .eq('id', sdrId)
            .single();
          
          if (sdrData?.agency_id) {
            agencyIdToUse = sdrData.agency_id;
            setSdrAgencyId(sdrData.agency_id);
            console.log('📌 Fetched SDR agency_id:', sdrData.agency_id);
          }
        } else {
          agencyIdToUse = sdrAgencyId;
        }
      }

      // Get current month's start and end dates (use UTC to match database timestamps)
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
      const nextMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));

      // Fetch assigned clients with their targets for the current month
      let assignmentsQuery = client
        .from('assignments')
        .select(`
          *,
          clients!inner (
            id,
            name,
            monthly_set_target,
            monthly_hold_target,
            created_at,
            updated_at,
            archived_at
          )
        `)
        .is('clients.archived_at', null) // Only fetch assignments for non-archived clients
        .eq('sdr_id', sdrId as any)
        .eq('month', `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, '0')}` as any);
        // Fetch both active and inactive assignments - filtering will happen in the component
      
      if (agencyIdToUse) {
        assignmentsQuery = assignmentsQuery.eq('agency_id', agencyIdToUse);
      }
      
      const assignmentsResult = await (async () => await withRetry(() => assignmentsQuery))() as any;
      const assignmentsData = (typeof assignmentsResult === 'object' && assignmentsResult !== null && 'data' in assignmentsResult) ? assignmentsResult.data : [];
      const assignmentsError = (typeof assignmentsResult === 'object' && assignmentsResult !== null && 'error' in assignmentsResult) ? assignmentsResult.error : null;
      if (assignmentsError) throw assignmentsError;
      const assignments = assignmentsData || [];

      // Calculate total meeting goal from ACTIVE assignments only (using set target)
      const activeAssignments = Array.isArray(assignments) ? assignments.filter((a: any) => a.is_active !== false) : [];
      
      const monthStr = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, '0')}`;
      const totalSetGoal = activeAssignments.reduce((sum: any, assignment: any) => 
        sum + (assignment.monthly_set_target || 0), 0);
      const totalHeldGoal = activeAssignments.reduce((sum: any, assignment: any) => 
        sum + (assignment.monthly_hold_target || 0), 0);
      
      setTotalMeetingGoal(totalSetGoal);

      // Fetch all meetings for this SDR (filter by created_at in JS)
      let meetingsQuery = client
        .from('meetings')
        .select('*, clients(name)')
        .eq('sdr_id', sdrId as any)
        .order('created_at', { ascending: false }) // Get newest first
        .limit(10000); // Ensure we get enough meetings
      
      if (agencyIdToUse) {
        meetingsQuery = meetingsQuery.eq('agency_id', agencyIdToUse);
      }
      
      const meetingsResult = await (async () => await withRetry(() => meetingsQuery))() as any;
      const meetingsData = (typeof meetingsResult === 'object' && meetingsResult !== null && 'data' in meetingsResult) ? meetingsResult.data : [];
      const meetingsError = (typeof meetingsResult === 'object' && meetingsResult !== null && 'error' in meetingsResult) ? meetingsResult.error : null;
      if (meetingsError) throw meetingsError;
      const meetings = meetingsData || [];

      // After fetching meetings and assignments, ensure they are arrays
      const safeMeetings = Array.isArray(meetings) ? meetings : [];
      const safeAssignments = Array.isArray(assignments) ? assignments : [];

      // Meetings SET: Filter by created_at (when SDR booked it) AND exclude non-ICP-qualified
      const clientsWithMetrics = safeAssignments.map((assignment: any) => {
        // Meetings SET: by created_at in current month
        const clientMeetingsSet = safeMeetings.filter(
          (meeting) => {
            const isForThisClient = meeting.client_id === assignment.clients.id;
            const createdDate = new Date(meeting.created_at);
            const isInMonth = createdDate >= monthStart && createdDate < nextMonthStart;
            const icpStatus = (meeting as any).icp_status;
            const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
            
            return isForThisClient && isInMonth && !isICPDisqualified;
          }
        );

        // Meetings HELD: by held_at timestamp in current month
        const clientMeetingsHeld = safeMeetings.filter(
          (meeting) => {
            const isForThisClient = meeting.client_id === assignment.clients.id;
            const isHeld = meeting.held_at !== null && !meeting.no_show;
            
            if (!isHeld) return false;
            
            const heldDate = new Date(meeting.held_at);
            const isInMonth = heldDate >= monthStart && heldDate < nextMonthStart;
            const icpStatus = (meeting as any).icp_status;
            const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
            
            return isForThisClient && isInMonth && !isICPDisqualified;
          }
        );

        // Confirmed meetings (status = confirmed, not no-show) - from SET meetings
        const confirmedMeetings = clientMeetingsSet.filter(
          meeting => meeting.status === 'confirmed' && !meeting.no_show
        ).length;

        // Pending meetings (status = pending, not no-show, not held) - from SET meetings
        const pendingMeetings = clientMeetingsSet.filter(
          meeting => meeting.status === 'pending' && !meeting.no_show && !meeting.held_at
        ).length;

        // Held meetings count
        const heldMeetings = clientMeetingsHeld.length;

        // Total meetings set (include all ICP-qualified meetings in SET, including no-shows)
        const totalMeetingsSet = clientMeetingsSet.length;
        

        return {
          ...assignment.clients, // Spread all client properties (including created_at, updated_at)
          monthly_set_target: assignment.monthly_set_target || 0,
          monthly_hold_target: assignment.monthly_hold_target || 0,
          confirmedMeetings,
          pendingMeetings,
          heldMeetings,
          todaysMeetings: clientMeetingsSet.filter(
            meeting => new Date(meeting.scheduled_date).toDateString() === new Date().toDateString()
          ),
          totalMeetingsSet,
          is_active: assignment.is_active !== false, // Include active status
          deactivated_at: assignment.deactivated_at,
          deactivation_reason: assignment.deactivation_reason
        };
      });
      // Then update your total counts to match:
      const monthlyMeetings = safeMeetings;

      // Total confirmed (status = confirmed and not no-show)
      const totalConfirmed = monthlyMeetings.filter(
        meeting => meeting.status === 'confirmed' && !meeting.no_show
      ).length;

      // Total pending (status = pending and not no-show)
      const totalPending = monthlyMeetings.filter(
        meeting => meeting.status === 'pending' && !meeting.no_show
      ).length;

      // Total held (must have held_at date)
      const totalHeld = monthlyMeetings.filter(
        meeting => meeting.held_at !== null && meeting.status === 'confirmed'
      ).length;

      // Total no-shows
      const totalNoShows = monthlyMeetings.filter(
        meeting => meeting.no_show
      ).length;

      
      setTotalBookedMeetings(totalConfirmed);
      setTotalPendingMeetings(totalPending);
      setClients(clientsWithMetrics);
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
    if (agency) {
      fetchClients();

      // Subscribe to changes in meetings and assignments
      const channel = client.channel('client-changes')
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
        client.removeChannel(channel);
      };
    }
  }, [sdrId, client, agency]);

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
