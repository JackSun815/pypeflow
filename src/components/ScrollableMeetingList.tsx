import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { Meeting } from '../types/database';
import { MeetingCard } from './MeetingCard';


interface ScrollableMeetingListProps {
  title: string;
  icon: React.ReactNode;
  meetings: Meeting[];
  onEdit?: (meeting: Meeting) => void;
  editingMeetingId?: string | null;
  onDelete?: (meetingId: string) => void;
  onUpdateHeldDate?: (meetingId: string, heldDate: string | null) => void;
  onUpdateConfirmedDate?: (meetingId: string, confirmedDate: string | null) => void;
  editable?: boolean;
  onSave?: (meeting: Meeting) => void;
  onCancel?: () => void;
  showActions?: boolean;
  showDateControls?: boolean;
}

export default function ScrollableMeetingList({
  title,
  icon,
  meetings,
  onEdit,
  editingMeetingId,
  onDelete,
  onUpdateHeldDate,
  onUpdateConfirmedDate,
  editable = false,
  onSave,
  onCancel,
  showActions = false,
  showDateControls = false
}: ScrollableMeetingListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredMeetings = meetings.filter(meeting => {
    const searchString = `${(meeting as any).clients?.name || ''} ${meeting.contact_full_name || ''} ${meeting.contact_email || ''} ${meeting.contact_phone || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white rounded-lg shadow-md h-[calc(100vh-24rem)] flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {icon}
          </div>
          <span className="text-sm text-gray-500">{filteredMeetings.length} meetings</span>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {filteredMeetings.length > 0 ? (
            filteredMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onDelete={onDelete}
                onUpdateHeldDate={onUpdateHeldDate}
                onUpdateConfirmedDate={onUpdateConfirmedDate}
                editable={editable}
                onSave={onSave}
                onCancel={onCancel}
                showActions={showActions}
                showDateControls={showDateControls}
                onEdit={onEdit}
                isEditing={editingMeetingId === meeting.id}
              />
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center">
              {searchTerm ? 'No meetings found matching your search' : 'No meetings to display'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}