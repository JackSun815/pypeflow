import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAgency } from '../contexts/AgencyContext';
import type { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface SDRWithMetrics extends Profile {
  totalMeetingsSet: number;
  totalConfirmedMeetings: number;
  totalPendingMeetings: number;
  totalHeldMeetings: number;
  totalNoShowMeetings: number;
  clients: Array<{
    id: string;
    name: string;
    monthly_set_target: number;
    monthly_hold_target: number;
    meetingsSet: number;
    meetingsHeld: number;
    confirmedMeetings: number;
    pendingMeetings: number;
  }>;
}

export function useSDRs(selectedMonth?: string) {
  const { agency } = useAgency();
  
  const [sdrs, setSDRs] = useState<SDRWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchSDRs() {
    try {
      // Get month's start and end dates (use UTC to match database timestamps and useClients logic)
      // Use selectedMonth if provided, otherwise use current month
      let monthStart: Date, monthEnd: Date;
      
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        monthStart = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1));
        monthEnd = new Date(Date.UTC(parseInt(year), parseInt(month), 1));
      } else {
        const now = new Date();
        monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
      }

      // Fetch all SDRs (both active and inactive)
      // The filtering by active status will be done in the component based on context
      let sdrQuery = supabase
        .from('profiles')
        .select('id, full_name, role, active, updated_at')
        .eq('role', 'sdr' as any);
      
      if (agency) {
        sdrQuery = sdrQuery.eq('agency_id', agency.id as any);
      }
      
      const { data: sdrProfiles, error: sdrError } = await sdrQuery
        .order('active', { ascending: false }) // Active SDRs first
        .order('full_name', { ascending: true }) as any;

      if (sdrError) throw sdrError;

      // Fetch assignments for all SDRs for the selected month
      const monthString = selectedMonth || `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
      let assignmentsQuery = supabase
        .from('assignments')
        .select(`
          sdr_id,
          client_id,
          monthly_set_target,
          monthly_hold_target,
          is_active,
          clients (
            id,
            name,
            monthly_set_target,
            monthly_hold_target
          )
        `)
        .eq('month', monthString as any);
      
      if (agency) {
        assignmentsQuery = assignmentsQuery.eq('agency_id', agency.id as any);
      }
      
      const { data: assignments, error: assignmentsError } = await assignmentsQuery as any;
      if (assignmentsError) throw assignmentsError;

      // Fetch ALL meetings (we'll filter by created_at and held_at in JS for accurate counts)
      // Use same filtering logic as useMeetings to ensure consistency
      let meetingsQuery = supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false }) // Get newest first to avoid missing recent meetings
        .limit(10000); // Ensure we get enough meetings
      
      if (agency) {
        // Include legacy meetings that may not have an agency_id set (same as useMeetings)
        meetingsQuery = meetingsQuery.or(`agency_id.eq.${agency.id},agency_id.is.null`) as any;
      }
      
      const { data: allMeetings, error: meetingsError } = await meetingsQuery as any;

      if (meetingsError) throw meetingsError;

      // Process and combine the data
      const sdrsWithMetrics = sdrProfiles?.map((sdr: Profile) => {
        // Get all meetings for this SDR
        const sdrMeetings = allMeetings?.filter(
          (meeting: any) => meeting.sdr_id === sdr.id
        ) || [];

        // Calculate client-specific metrics
        // First, get all unique clients from assignments for this SDR
        const sdrAssignments = (assignments || []).filter((assignment: any) => assignment.sdr_id === sdr.id);
        const uniqueClients = new Map();
        
        // Collect all unique clients and their assignments
        sdrAssignments.forEach((assignment: any) => {
          if (assignment.clients && assignment.clients.id) {
            const clientId = assignment.clients.id;
            if (!uniqueClients.has(clientId)) {
              uniqueClients.set(clientId, {
                id: assignment.clients.id,
                name: assignment.clients.name,
                assignments: []
              });
            }
            uniqueClients.get(clientId).assignments.push(assignment);
          }
        });

        // Calculate metrics for each unique client (count ALL meetings for that client, not per-assignment)
        const clients = Array.from(uniqueClients.values()).map((clientInfo: any) => {
          // Get ALL meetings for this client (not filtered by assignment)
          const clientMeetings = sdrMeetings.filter(
            (meeting: any) => meeting.client_id === clientInfo.id
          );

          // Meetings SET: filter by created_at (when meeting was booked)
          const clientMeetingsSet = clientMeetings.filter((meeting: any) => {
            const createdDate = new Date(meeting.created_at);
            const isInMonth = createdDate >= monthStart && createdDate < monthEnd;
            const icpStatus = meeting.icp_status;
            const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
            return isInMonth && !isICPDisqualified;
          });

          // Meetings HELD: filter by scheduled_date (month it was scheduled for) - matches SDRDashboard logic
          const clientMeetingsHeld = clientMeetings.filter((meeting: any) => {
            if (!meeting.held_at || meeting.no_show) return false;
            const scheduledDate = new Date(meeting.scheduled_date);
            const isInMonth = scheduledDate >= monthStart && scheduledDate < monthEnd;
            const icpStatus = meeting.icp_status;
            const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
            return isInMonth && !isICPDisqualified;
          });

          // Match the exact pending meetings calculation from Team Meetings
          const pendingMeetings = clientMeetingsSet.filter(
            (meeting: any) => meeting.status === 'pending' && !meeting.no_show
          ).length;

          // Use the first assignment's targets (or sum them if needed - for now using first)
          const firstAssignment = clientInfo.assignments[0];
          // Sum targets from all active assignments for this client
          const monthly_set_target = clientInfo.assignments
            .filter((a: any) => a.is_active !== false)
            .reduce((sum: number, a: any) => sum + (a.monthly_set_target || 0), 0) || (firstAssignment?.monthly_set_target || 0);
          const monthly_hold_target = clientInfo.assignments
            .filter((a: any) => a.is_active !== false)
            .reduce((sum: number, a: any) => sum + (a.monthly_hold_target || 0), 0) || (firstAssignment?.monthly_hold_target || 0);

          return {
            id: clientInfo.id,
            name: clientInfo.name,
            monthly_set_target,
            monthly_hold_target,
            meetingsSet: clientMeetingsSet.length,
            meetingsHeld: clientMeetingsHeld.length,
            confirmedMeetings: clientMeetingsSet.filter(
              (meeting: any) => meeting.status === 'confirmed' && !meeting.no_show
            ).length,
            pendingMeetings
          };
        });

        // Calculate total meetings for this SDR
        // Meetings SET: filter by created_at
        const sdrMeetingsSet = sdrMeetings.filter((meeting: any) => {
          const createdDate = new Date(meeting.created_at);
          const isInMonth = createdDate >= monthStart && createdDate < monthEnd;
          const icpStatus = meeting.icp_status;
          const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
          return isInMonth && !isICPDisqualified;
        });

        // Meetings HELD: filter by scheduled_date (month it was scheduled for) - matches SDRDashboard logic
        const sdrMeetingsHeld = sdrMeetings.filter((meeting: any) => {
          if (!meeting.held_at || meeting.no_show) return false;
          const scheduledDate = new Date(meeting.scheduled_date);
          const isInMonth = scheduledDate >= monthStart && scheduledDate < monthEnd;
          const icpStatus = meeting.icp_status;
          const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
          return isInMonth && !isICPDisqualified;
        });

        const totalConfirmedMeetings = sdrMeetingsSet.filter(
          (meeting: any) => meeting.status === 'confirmed' && !meeting.no_show
        ).length;

        // Match the exact pending meetings calculation from Team Meetings
        const totalPendingMeetings = sdrMeetingsSet.filter(
          (meeting: any) => meeting.status === 'pending' && !meeting.no_show
        ).length;

        const totalHeldMeetings = sdrMeetingsHeld.length;

        const totalNoShows = sdrMeetingsSet.filter(
          (meeting: any) => meeting.no_show === true
        ).length;

        return {
          ...sdr,
          clients,
          totalMeetingsSet: sdrMeetingsSet.length,
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
  }, [agency, selectedMonth]);

  return { sdrs, loading, error, fetchSDRs };
}