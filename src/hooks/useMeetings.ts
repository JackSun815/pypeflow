import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Meeting } from '../types/database';

interface MeetingContact {
  contact_full_name: string;
  contact_email: string;
  contact_phone?: string;
}

export function useMeetings(sdrId?: string | null, supabaseClient = supabase, fetchAll: boolean = false) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchMeetings() {
    // Only fetch all meetings if fetchAll is true (manager dashboard)
    if (fetchAll) {
      try {
        let query = supabaseClient
          .from('meetings')
          .select('*, clients(name)')
          .order('scheduled_date', { ascending: true });
        const { data, error } = await query;
        if (error) throw error;
        setMeetings((data || []) as unknown as Meeting[]);
        setError(null);
      } catch (err) {
        console.error('Meetings fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch meetings');
        setMeetings([]);
      } finally {
        setLoading(false);
      }
      return;
    }
    // For SDR dashboard: only fetch if sdrId is a valid, non-empty string
    if (typeof sdrId !== 'string' || sdrId.length === 0) {
      setMeetings([]);
      setLoading(false);
      return;
    }
    try {
      let query = supabaseClient
        .from('meetings')
        .select('*, clients(name)')
        .order('scheduled_date', { ascending: true })
        .eq('sdr_id', sdrId as any);
      const { data, error } = await query;
      if (error) throw error;
      setMeetings((data || []) as unknown as Meeting[]);
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
          const changedMeetingSdrId = (payload.new as any)?.sdr_id;
          if (fetchAll || (sdrId && changedMeetingSdrId === sdrId)) {
            fetchMeetings();
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(subscription);
    };
  }, [sdrId, supabaseClient, fetchAll]);

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
    const updateData: any = {
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
      updated_at: new Date().toISOString(),
    };
    if (typeof updatedMeeting.held_at !== 'undefined') {
      updateData.held_at = updatedMeeting.held_at;
      if (updatedMeeting.held_at) {
        updateData.status = 'confirmed';
        updateData.no_show = false;
      }
    }
    if (typeof updatedMeeting.icp_status !== 'undefined') {
      updateData.icp_status = updatedMeeting.icp_status;
      updateData.icp_checked_at = new Date().toISOString();
      updateData.icp_checked_by = null; // Optionally set to SDR id if available
    }
    const { error } = await supabaseClient
      .from('meetings')
      .update(updateData)
      .eq('id', updatedMeeting.id as any);

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
          .eq('id', meetingId as any)
          .single();
          
        if (meeting && (meeting as any).scheduled_date) {
          const meetingDateString = (meeting as any).scheduled_date.split('T')[0];
          const todayString = new Date().toISOString().split('T')[0];
          
          if (meetingDateString < todayString) {
            updateData.no_show = true;
          }
        }
      }

      const { error } = await supabaseClient
        .from('meetings')
        .update(updateData)
        .eq('id', meetingId as any);

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
        .eq('id', meetingId as any);

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
        .eq('id', meetingId as any);

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