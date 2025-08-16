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
    if (!sdrId) {
      setMeetings([]);
      setLoading(false);
      return;
    }
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
      setMeetings(data || []);
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
    // Reset meetings state when sdrId changes
    setMeetings([]);
    setLoading(true);
    setError(null);
    if (!sdrId) {
      setLoading(false);
      return;
    }
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
          const changedMeetingSdrId = payload.new?.sdr_id;
          if (sdrId && changedMeetingSdrId === sdrId) {
            fetchMeetings();
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
    
      // Create the insert data without ICP fields first
      const insertData: any = {
        client_id: clientId,
        sdr_id: sdrId,
        scheduled_date: scheduledDate,
        status: 'pending',  // Hardcoded to pending
        no_show: false,     // Explicit defaults
        held_at: null,
        created_at: new Date().toISOString(),
        ...cleanDetails
      };

      // Try to add ICP status if the column exists
      try {
        insertData.icp_status = 'pending';
      } catch (err) {
        // If ICP column doesn't exist, continue without it
        console.log('ICP status column not available, skipping');
      }

      const { error } = await supabaseClient
        .from('meetings')
        .insert([insertData]);

      if (error) {
        // If the error is about missing ICP column, try again without it
        if (error.message && error.message.includes('icp_status')) {
          console.log('Retrying without ICP status field');
          delete insertData.icp_status;
          
          const { error: retryError } = await supabaseClient
            .from('meetings')
            .insert([insertData]);
            
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
      
      await fetchMeetings();
      return null; // We don't need the returned data since we refresh the list
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