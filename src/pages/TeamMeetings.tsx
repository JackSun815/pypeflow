import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, XCircle, Edit2, Trash2 } from 'lucide-react';
import { useSDRs } from '../hooks/useSDRs';
import { useMeetings } from '../hooks/useMeetings';
import { supabase } from '../lib/supabase';
import ScrollableMeetingList from '../components/ScrollableMeetingList';
import type { Meeting } from '../types/database';
import CalendarView from '../components/CalendarView';

export default function TeamMeetings({
  meetings,
  fetchSDRs,
}: {
  meetings: Meeting[];
  fetchSDRs: () => void;
}) {
  const [highlightPending, setHighlightPending] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setHighlightPending(false), 10000);
    return () => clearTimeout(timer);
  }, []);
  const { sdrs, loading: sdrsLoading } = useSDRs();
  const [selectedSDR, setSelectedSDR] = useState<string | 'all'>('all');
  const [allMeetings, setAllMeetings] = useState<(Meeting & { sdr_name?: string })[]>([]);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [draftMeeting, setDraftMeeting] = useState<Partial<Meeting>>({});

  // Get meetings for the selected SDR
  const { meetings: selectedSDRMeetings } = useMeetings(selectedSDR === 'all' ? null : selectedSDR);

  // Effect to combine all SDR meetings when "all" is selected
  useEffect(() => {
    async function fetchAllMeetings() {
      if (selectedSDR === 'all') {
        const allSDRMeetings = await Promise.all(
          sdrs.map(async (sdr) => {
            const { data } = await supabase
              .from('meetings')
              .select('*, clients(name)')
              .eq('sdr_id', sdr.id);
            
            return (data || []).map(meeting => ({
              ...meeting,
              sdr_name: sdr.full_name
            }));
          })
        );

        setAllMeetings(allSDRMeetings.flat());
      } else {
        setAllMeetings(selectedSDRMeetings.map(meeting => ({
          ...meeting,
          sdr_name: sdrs.find(sdr => sdr.id === selectedSDR)?.full_name
        })));
      }
    }

    fetchAllMeetings();
  }, [selectedSDR, sdrs, selectedSDRMeetings]);

  const handleDeleteMeeting = async (meetingId: string) => {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', meetingId);

    if (error) {
      console.error('Error deleting meeting:', error);
    } else {
      setAllMeetings(allMeetings.filter(meeting => meeting.id !== meetingId));
      fetchSDRs();
    }
  };

  const handleSaveMeeting = async (updatedMeeting: Meeting) => {
    const { error } = await supabase
      .from('meetings')
      .update({
        scheduled_date: updatedMeeting.scheduled_date,
        status: updatedMeeting.status,
        no_show: updatedMeeting.no_show,
        company: updatedMeeting.company,           // <-- add this
        linkedin_page: updatedMeeting.linkedin_page, // <-- add this
        notes: updatedMeeting.notes,               // <-- add this
        contact_full_name: updatedMeeting.contact_full_name, // (optional, for completeness)
        contact_email: updatedMeeting.contact_email,         // (optional)
        contact_phone: updatedMeeting.contact_phone,         // (optional)
      })
      .eq('id', updatedMeeting.id);

    if (error) {
      console.error('Error updating meeting:', error);
    } else {
      setAllMeetings(allMeetings.map(meeting => 
        meeting.id === updatedMeeting.id ? updatedMeeting : meeting
      ));
      fetchSDRs();
      setEditingMeetingId(null);
      setDraftMeeting({});
    }
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeetingId(meeting.id);
    setDraftMeeting({
      ...meeting,
      scheduled_date: meeting.scheduled_date,
      status: meeting.status,
      no_show: meeting.no_show,
    });
  };

  
  // Get today's date string for comparison
  const todayString = new Date().toISOString().split('T')[0];

  // Filter and sort meetings into categories
  const todaysMeetings = allMeetings.filter(
    meeting => meeting.scheduled_date.split('T')[0] === todayString
  ).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const pendingMeetings = allMeetings
    .filter(meeting => meeting.status === 'pending' && !meeting.no_show)
    .sort((a, b) => {
      const dateA = new Date(a.scheduled_date);
      const dateB = new Date(b.scheduled_date);
      const today = new Date();
      
      // Calculate absolute difference from today
      const diffA = Math.abs(dateA.getTime() - today.getTime());
      const diffB = Math.abs(dateB.getTime() - today.getTime());
      
      return diffA - diffB;
    });

  const confirmedMeetings = allMeetings
    .filter(meeting => meeting.status === 'confirmed')
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const noShowMeetings = allMeetings
    .filter(meeting => meeting.no_show)
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  if (sdrsLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SDR Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Team's Meetings</h2>
          <select
            value={selectedSDR}
            onChange={(e) => setSelectedSDR(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All SDRs</option>
            {sdrs.map((sdr) => (
              <option key={sdr.id} value={sdr.id}>
                {sdr.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Manager Calendar View */}
      <div className="mb-8">
        <CalendarView meetings={allMeetings} />
      </div>

  

      {/* Meeting Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScrollableMeetingList
          title="Today's Meetings"
          icon={<Calendar className="w-5 h-5 text-indigo-600" />}
          meetings={todaysMeetings}
          showDateControls={true}
          editable={true}
          onSave={handleSaveMeeting}
          onDelete={handleDeleteMeeting}
          onCancel={() => { setEditingMeetingId(null); fetchSDRs(); }}
          onEdit={handleEditMeeting}
          editingMeetingId={editingMeetingId}
        />
        <div className={`${highlightPending ? 'animate-glow-orange ring-2 ring-orange-400' : ''}`}>
          <ScrollableMeetingList
            title="Pending Meetings"
            icon={<Clock className="w-5 h-5 text-yellow-600" />}
            meetings={pendingMeetings}
            showDateControls={true}
            editable={true}
            onSave={handleSaveMeeting}
            onDelete={handleDeleteMeeting}
            onCancel={() => { setEditingMeetingId(null); fetchSDRs(); }}
            onEdit={handleEditMeeting}
            editingMeetingId={editingMeetingId}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScrollableMeetingList
          title="Confirmed Meetings"
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          meetings={confirmedMeetings}
          showDateControls={true}
          editable={true}
          onSave={handleSaveMeeting}
          onDelete={handleDeleteMeeting}
          onCancel={() => { setEditingMeetingId(null); fetchSDRs(); }}
          onEdit={handleEditMeeting}
          editingMeetingId={editingMeetingId}
        />

        <ScrollableMeetingList
          title="No Shows"
          icon={<XCircle className="w-5 h-5 text-red-600" />}
          meetings={noShowMeetings}
          showDateControls={true}
          editable={true}
          onSave={handleSaveMeeting}
          onDelete={handleDeleteMeeting}
          onCancel={() => { setEditingMeetingId(null); fetchSDRs(); }}
          onEdit={handleEditMeeting}
          editingMeetingId={editingMeetingId}
        />
      </div>
    </div>
  );
}