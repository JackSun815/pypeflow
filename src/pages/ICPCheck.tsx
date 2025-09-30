import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Check, X, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useSDRs } from '../hooks/useSDRs';
import { useAllClients } from '../hooks/useAllClients';
import { useAgency } from '../contexts/AgencyContext';
import type { Meeting } from '../types/database';
import { MeetingCard } from '../components/MeetingCard';

interface MeetingWithDetails extends Meeting {
  sdr_name?: string;
  client_name?: string;
  clients?: { name?: string } | null;
}

export default function ICPCheck() {
  const { profile } = useAuth();
  const { agency } = useAgency();
  const { sdrs } = useSDRs();
  const { clients } = useAllClients();
  const [meetings, setMeetings] = useState<MeetingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithDetails | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [icpNotes, setIcpNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Fetch meetings that need ICP review
  useEffect(() => {
    if (agency?.id) {
      fetchICPMeetings();
    }
  }, [agency?.id]);

  async function fetchICPMeetings() {
    try {
      setLoading(true);
      
      if (!agency?.id) {
        setError('Agency information not available. Please refresh the page.');
        return;
      }
      
      // Try to fetch meetings with ICP status filter first
      let query = supabase
        .from('meetings')
        .select(`
          *,
          clients(name),
          profiles!meetings_sdr_id_fkey(full_name)
        `)
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false });

      // Try to filter by icp_status if the column exists
      try {
        query = query.eq('icp_status', 'pending');
      } catch (err) {
        // If icp_status column doesn't exist, fetch all meetings
        console.log('ICP status column not available, fetching all meetings');
      }

      const { data, error } = await query;

      if (error) {
        // If the error is about missing icp_status column, try again without the filter
        if (error.message && error.message.includes('icp_status')) {
          console.log('Retrying without ICP status filter');
          
          const { data: retryData, error: retryError } = await supabase
            .from('meetings')
            .select(`
              *,
              clients(name),
              profiles!meetings_sdr_id_fkey(full_name)
            `)
            .eq('agency_id', agency.id)
            .order('created_at', { ascending: false });
            
          if (retryError) {
            setError('Failed to fetch meetings. Please run the database migration to enable ICP functionality.');
            return;
          }
          
          const meetingsWithDetails = (retryData || []).map((meeting: any) => ({
            ...meeting,
            sdr_name: meeting.profiles?.full_name || 'Unknown SDR',
            client_name: meeting.clients?.name || 'Unknown Client',
            icp_status: 'pending' // Default for meetings without ICP status
          }));
          
          setMeetings(meetingsWithDetails);
          return;
        } else {
          throw error;
        }
      }

      // Transform the data to include SDR and client names
      const meetingsWithDetails = (data || []).map((meeting: any) => ({
        ...meeting,
        sdr_name: meeting.profiles?.full_name || 'Unknown SDR',
        client_name: meeting.clients?.name || 'Unknown Client',
        icp_status: meeting.icp_status || 'pending'
      }));

      setMeetings(meetingsWithDetails);
    } catch (err) {
      console.error('Error fetching ICP meetings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  }

  async function handleICPAction(meetingId: string, action: 'approve' | 'deny') {
    if (!profile?.id) {
      setError('Manager profile not found');
      return;
    }

    try {
      setProcessingAction(true);
      
      // Start with just the notes update
      const updateData: any = {
        notes: icpNotes ? `ICP ${action.toUpperCase()}: ${icpNotes}` : `ICP ${action.toUpperCase()}`
      };

      // Try to update with ICP fields first
      try {
        updateData.icp_status = action === 'approve' ? 'approved' : 'denied';
        updateData.icp_checked_at = new Date().toISOString();
        
        // Only set icp_checked_by if we have a valid UUID (not an email)
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id);
        if (isValidUUID) {
          updateData.icp_checked_by = profile.id;
        } else {
          console.log('Profile ID is not a valid UUID, skipping icp_checked_by field');
        }
        
        updateData.icp_notes = icpNotes || null;
      } catch (err) {
        // If ICP fields don't exist, just update notes
        console.log('ICP fields not available, updating notes only');
      }

      const { error } = await supabase
        .from('meetings')
        .update(updateData)
        .eq('id', meetingId);

      if (error) {
        // If the error is about missing ICP columns or invalid UUID, try again with just notes
        if (error.message && (error.message.includes('icp_status') || error.message.includes('icp_checked_at') || error.message.includes('icp_checked_by') || error.message.includes('invalid input syntax for type uuid'))) {
          console.log('ICP columns not available or invalid UUID, updating notes only');
          
          const notesUpdateData = {
            notes: icpNotes ? `ICP ${action.toUpperCase()}: ${icpNotes}` : `ICP ${action.toUpperCase()}`
          };
          
          const { error: notesError } = await supabase
            .from('meetings')
            .update(notesUpdateData)
            .eq('id', meetingId);
            
          if (notesError) {
            setError('Failed to update meeting notes. Please run the database migration to enable full ICP functionality.');
            return;
          }
          
          // Show a message that ICP features are not fully available
          alert(`Meeting marked as ${action} (notes only). Please run the database migration to enable full ICP functionality.`);
        } else {
          throw error;
        }
      }

      // Remove the meeting from the pending list
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      
      // Reset modal state
      setSelectedMeeting(null);
      setShowNotesModal(false);
      setIcpNotes('');
      
      // Show success message
      const actionText = action === 'approve' ? 'approved' : 'denied';
      console.log(`Meeting ${actionText} successfully`);
      
    } catch (err) {
      console.error('Error updating ICP status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update ICP status');
    } finally {
      setProcessingAction(false);
    }
  }

  function openActionModal(meeting: MeetingWithDetails) {
    setSelectedMeeting(meeting);
    setShowNotesModal(true);
    setIcpNotes('');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ICP Check</h1>
              <p className="text-sm text-gray-600 mt-1">
                Review and approve/deny meetings for ICP qualification
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ Database migration not applied - using notes-only mode
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{meetings.length} pending review</span>
              </div>
            </div>
          </div>
        </div>

        {/* Meetings List */}
        {meetings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No meetings are currently pending ICP review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending ICP Review
                        </span>
                        <span className="text-sm text-gray-500">
                          Booked {new Date(meeting.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Meeting Details</h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Contact: </span>
                            <span className="text-gray-900">{meeting.contact_full_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Email: </span>
                            <span className="text-gray-900">{meeting.contact_email || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Company: </span>
                            <span className="text-gray-900">{meeting.company || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Scheduled: </span>
                            <span className="text-gray-900">
                              {new Date(meeting.scheduled_date).toLocaleDateString()} at{' '}
                              {new Date(meeting.scheduled_date).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Team Info</h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">SDR: </span>
                            <span className="text-gray-900">{meeting.sdr_name}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Client: </span>
                            <span className="text-gray-900">{meeting.client_name}</span>
                          </div>
                          {meeting.notes && (
                            <div>
                              <span className="font-medium text-gray-700">Notes: </span>
                              <span className="text-gray-900">{meeting.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openActionModal(meeting)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => openActionModal(meeting)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <X className="w-4 h-4" />
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ICP Review Notes (Optional)
            </h3>
            
            <textarea
              value={icpNotes}
              onChange={(e) => setIcpNotes(e.target.value)}
              placeholder="Add any notes about this ICP decision..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedMeeting(null);
                  setIcpNotes('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleICPAction(selectedMeeting.id, 'approve')}
                disabled={processingAction}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {processingAction ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Approve
              </button>
              <button
                onClick={() => handleICPAction(selectedMeeting.id, 'deny')}
                disabled={processingAction}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {processingAction ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Deny
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
