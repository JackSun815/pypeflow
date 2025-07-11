import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { Meeting } from '../types/database';
import { MeetingCard } from './MeetingCard';

interface UnifiedMeetingListsProps {
  editable?: boolean;
  editingMeetingId?: string | null;
  onEdit?: (meeting: Meeting) => void;
  onSave?: (meeting: Meeting) => void;
  onCancel?: () => void;
  pendingMeetings: Meeting[];
  confirmedMeetings: Meeting[];
  completedMeetings: Meeting[];
  noShowMeetings: Meeting[];
  onDelete?: (meetingId: string) => void;
  onUpdateHeldDate?: (meetingId: string, heldDate: string | null) => void;
  onUpdateConfirmedDate?: (meetingId: string, confirmedDate: string | null) => void;
}

export default function UnifiedMeetingLists({
  pendingMeetings,
  confirmedMeetings,
  completedMeetings,
  noShowMeetings,
  onDelete,
  onUpdateHeldDate,
  onUpdateConfirmedDate,
  editable = false,
  editingMeetingId = null,
  onEdit,
  onSave,
  onCancel,
}: UnifiedMeetingListsProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filterMeetings = (meetings: Meeting[]) => {
    return meetings.filter(meeting => {
      const searchString = `${(meeting as any).clients?.name || ''} ${meeting.contact_full_name || ''} ${meeting.contact_email || ''} ${meeting.contact_phone || ''}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });
  };

  const filteredPendingMeetings = filterMeetings(pendingMeetings);
  const filteredConfirmedMeetings = filterMeetings(confirmedMeetings);
  const filteredCompletedMeetings = filterMeetings(completedMeetings);
  const filteredNoShowMeetings = filterMeetings(noShowMeetings);

  const MeetingList = ({ title, meetings }: { title: string; meetings: Meeting[] }) => (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="text-sm text-gray-500">{meetings.length} meetings</span>
        </div>
      </div>
      <div className="p-4 max-h-[800px] overflow-y-auto">
        <div className="space-y-4">
          {meetings.length > 0 ? (
            meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onDelete={onDelete}
                onUpdateHeldDate={onUpdateHeldDate}
                onUpdateConfirmedDate={onUpdateConfirmedDate}
                editable={editable}
                editingMeetingId={editingMeetingId}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                showDateControls={true}
              />
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center">No meetings to display</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search all meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MeetingList title="Pending Meetings" meetings={filteredPendingMeetings} />
        <MeetingList title="Confirmed Meetings" meetings={filteredConfirmedMeetings} />
        <MeetingList title="No Shows" meetings={filteredNoShowMeetings} />
      </div>

      {/* Completed Meetings Section - Full Width */}
      <div className="mt-6">
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg shadow-md border-2 border-green-300">
          <div className="p-4 border-b border-green-300 bg-green-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-green-800">Completed Meetings</h3>
              <span className="text-sm text-green-600">{filteredCompletedMeetings.length} meetings</span>
            </div>
          </div>
          <div className="p-4 max-h-[800px] overflow-y-auto bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompletedMeetings.length > 0 ? (
                filteredCompletedMeetings.map((meeting) => (
                  <div key={meeting.id} className="border border-green-200 rounded-lg bg-white shadow-sm">
                    <MeetingCard
                      meeting={meeting}
                      onDelete={onDelete}
                      onUpdateHeldDate={onUpdateHeldDate}
                      onUpdateConfirmedDate={onUpdateConfirmedDate}
                      editable={editable}
                      editingMeetingId={editingMeetingId}
                      onEdit={onEdit}
                      onSave={onSave}
                      onCancel={onCancel}
                      showDateControls={true}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full">
                  <p className="text-green-600 text-sm text-center">No completed meetings to display</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}