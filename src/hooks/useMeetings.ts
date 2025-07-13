import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Meeting } from '../types/database';

interface MeetingContact {
  contact_full_name: string;
  contact_email: string;
  contact_phone?: string;
}

export function useMeetings(sdrId?: string | null) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchMeetings() {
    try {
      // Start base query
      let query = supabase
        .from('meetings')
        .select('*, clients(name)')
        .order('scheduled_date', { ascending: true });
      // Apply SDR filter only when sdrId is provided
      if (sdrId) {
        query = query.eq('sdr_id', sdrId);
      }
      const { data, error } = await query;

      if (error) throw error;

      // Check for past meetings that haven't been marked as held/no-show
      const now = new Date();
      const todayString = now.toISOString().split('T')[0];
      const updatedMeetings = await Promise.all((data || []).map(async (meeting) => {
        const meetingDateString = meeting.scheduled_date.split('T')[0];
        
        // If meeting is in the past and still pending, mark as no-show
        if (meetingDateString < todayString && meeting.status === 'pending' && !meeting.no_show && !meeting.held_at) {
          const { error: updateError } = await supabase
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

    // Subscribe to ALL meeting changes to ensure manager dashboard stays updated
     const subscription = supabase
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
          created_at: payload.new?.created_at,
          timestamp: new Date().toISOString()
        });
        fetchMeetings();
      }
    )
    .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [sdrId]);

  async function addMeeting(
    clientId: string,
    scheduledDate: string,
    sdrId: string,
    meetingDetails: any
  ) {
    try {
      const { status: _, ...cleanDetails } = meetingDetails;
    
      const { data, error } = await supabase
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
    const { error } = await supabase
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
        
        const { data: meeting } = await supabase
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

      const { error } = await supabase
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

      const { error } = await supabase
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
      const { error } = await supabase
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