import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Meeting } from '../types/database';

interface MeetingContact {
  contact_full_name: string;
  contact_email: string;
  contact_phone?: string;
}

export function useMeetings(sdrId?: string | null, supabaseClient = supabase) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchMeetings() {
    try {
      // Start base query
      let query = supabaseClient
        .from('meetings')
        .select('*, clients(name)')
        .order('scheduled_date', { ascending: true });
      // Apply SDR filter only when sdrId is provided
      if (sdrId) {
        query = query.eq('sdr_id', sdrId);
      }
      const { data, error } = await query;

      if (error) throw error;

      // Debug: Log query results in development
      if (import.meta.env.MODE === 'development' && sdrId) {
        console.log('🔍 useMeetings Debug:');
        console.log('SDR ID filter:', sdrId);
        console.log('Raw data count:', data?.length || 0);
        console.log('All SDR IDs in raw data:', [...new Set((data || []).map((m: any) => m.sdr_id))]);
        
        // Check if filtering is working
        const filteredData = (data || []).filter((m: any) => m.sdr_id === sdrId);
        console.log('Filtered data count:', filteredData.length);
        
        if (data && data.length !== filteredData.length) {
          console.warn('⚠️ Data filtering issue detected!');
          console.warn('Expected only SDR ID:', sdrId);
          console.warn('Found SDR IDs:', [...new Set((data || []).map((m: any) => m.sdr_id))]);
        }
      }

      // Check for past meetings that haven't been marked as held/no-show
      const now = new Date();
      const todayString = now.toISOString().split('T')[0];
      const updatedMeetings = await Promise.all((data || []).map(async (meeting) => {
        const meetingDateString = meeting.scheduled_date.split('T')[0];
        
        // If meeting is in the past and still pending, mark as no-show
        if (meetingDateString < todayString && meeting.status === 'pending' && !meeting.no_show && !meeting.held_at) {
          const { error: updateError } = await supabaseClient
            .from('meetings')
            .update({
              no_show: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', meeting.id);

          if (updateError) {
            console.error('Failed to update past meeting:', updateError);
            return meeting;
          }

          return {
            ...meeting,
            no_show: true,
            updated_at: new Date().toISOString()
          };
        }

        return meeting;
      }));
      

      setMeetings(updatedMeetings);
      setError(null);
    } catch (err) {
      console.error('Meetings fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch meetings');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMeetings();

    // Subscribe to meeting changes, but only trigger refresh if the change affects this SDR
    const subscription = supabaseClient
    .channel('meetings-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meetings'
      },
      (payload) => {
        console.log('Meeting change detected:', {
          event: payload.eventType,
          meetingId: payload.new?.id,
          sdr_id: payload.new?.sdr_id,
          currentSdrId: sdrId,
          created_at: payload.new?.created_at,
          timestamp: new Date().toISOString()
        });
        
        // Only refresh if this change affects the current SDR's meetings
        const changedMeetingSdrId = payload.new?.sdr_id;
        if (sdrId && changedMeetingSdrId === sdrId) {
          console.log('Change affects current SDR, refreshing meetings');
          fetchMeetings();
        } else if (!sdrId) {
          // For manager dashboard (sdrId is null), refresh on any change
          console.log('Manager dashboard - refreshing on any change');
          fetchMeetings();
        } else {
          console.log('Change does not affect current SDR, skipping refresh');
        }
      }
    )
    .subscribe();

    return () => {
      supabaseClient.removeChannel(subscription);
    };
  }, [sdrId, supabaseClient]);

  async function addMeeting(
    clientId: string,
    scheduledDate: string,
    sdrId: string,
    meetingDetails: any
  ) {
    try {
      const { status: _, ...cleanDetails } = meetingDetails;
    
      const { data, error } = await supabaseClient
        .from('meetings')
        .insert([{
          client_id: clientId,
          sdr_id: sdrId,
          scheduled_date: scheduledDate,
          status: 'pending',  // Hardcoded to pending
          no_show: false,     // Explicit defaults
          held_at: null,
          created_at: new Date().toISOString(),
          ...cleanDetails
        }])
        .select('*');

      if (error) throw error;
      await fetchMeetings();
      return data?.[0];
    } catch (err) {
      console.error('Error adding meeting:', err);
      throw err;
    }
  }
  async function updateMeeting(updatedMeeting: Meeting) {
  try {
    const { error } = await supabaseClient
      .from('meetings')
      .update({
        contact_full_name: updatedMeeting.contact_full_name,
        contact_email: updatedMeeting.contact_email,
        contact_phone: updatedMeeting.contact_phone,
        scheduled_date: updatedMeeting.scheduled_date,
        status: updatedMeeting.status,
        no_show: updatedMeeting.no_show,
        company: updatedMeeting.company,
        linkedin_page: updatedMeeting.linkedin_page,
        notes: updatedMeeting.notes,
        timezone: updatedMeeting.timezone, // Save prospect's timezone
        updated_at: new Date().toISOString()
      })
      .eq('id', updatedMeeting.id);

    if (error) throw error;
    await fetchMeetings();
  } catch (err) {
    console.error('Update meeting error:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to update meeting');
  }
}

  async function updateMeetingHeldDate(meetingId: string, heldDate: string | null) {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (heldDate) {
        updateData.held_at = heldDate;
        updateData.no_show = false; // Explicitly set no_show to false when marking as held
      } else {
        updateData.held_at = null;
        
        const { data: meeting } = await supabaseClient
          .from('meetings')
          .select('scheduled_date')
          .eq('id', meetingId)
          .single();
          
        if (meeting) {
          const meetingDateString = meeting.scheduled_date.split('T')[0];
          const todayString = new Date().toISOString().split('T')[0];
          
          if (meetingDateString < todayString) {
            updateData.no_show = true;
          }
        }
      }

      const { error } = await supabaseClient
        .from('meetings')
        .update(updateData)
        .eq('id', meetingId);

      if (error) throw error;
      await fetchMeetings();
    } catch (err) {
      console.error('Update meeting held date error:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update meeting held date');
    }
  }

  async function updateMeetingConfirmedDate(meetingId: string, confirmedDate: string | null) {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (confirmedDate) {
        updateData.confirmed_at = confirmedDate;
        updateData.status = 'confirmed';
      } else {
        updateData.confirmed_at = null;
        updateData.status = 'pending';
      }

      const { error } = await supabaseClient
        .from('meetings')
        .update(updateData)
        .eq('id', meetingId);

      if (error) throw error;
      await fetchMeetings();
    } catch (err) {
      console.error('Update meeting confirmed date error:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update meeting confirmed date');
    }
  }

  async function deleteMeeting(meetingId: string) {
    try {
      const { error } = await supabaseClient
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) throw error;
      await fetchMeetings();
    } catch (err) {
      console.error('Delete meeting error:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete meeting');
    }
  }

  // Calculate pending meetings using the same logic as Team Meetings
  const pendingMeetings = meetings.filter(
    meeting => meeting.status === 'pending' && !meeting.no_show
  ).length;

  return { 
    meetings, 
    loading, 
    error, 
    addMeeting, 
    updateMeeting,
    updateMeetingHeldDate,
    updateMeetingConfirmedDate,
    deleteMeeting, 
    fetchMeetings,
    pendingMeetings
  };
}