import React from 'react';
import { MeetingCard } from './MeetingCard';
import type { Meeting } from '../types/database';

interface MeetingsListProps {
  meetings: Meeting[];
  title: string;
  onDelete?: (meetingId: string) => void;
  onUpdateHeldDate?: (meetingId: string, heldDate: string | null) => void;
  onUpdateConfirmedDate?: (meetingId: string, confirmedDate: string | null) => void;
  onUpdateMeeting?: (meetingId: string, updates: Partial<Meeting>) => void;
  showMeetingStatus?: boolean;
}

export default function MeetingsList({ 
  meetings, 
  title, 
  onDelete, 
  onUpdateHeldDate,
  onUpdateConfirmedDate,
  onUpdateMeeting,
  showMeetingStatus = false
}: MeetingsListProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {meetings.length === 0 ? (
        <p className="text-gray-500 text-sm">No meetings to display</p>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onDelete={onDelete}
              onUpdateHeldDate={onUpdateHeldDate}
              onUpdateConfirmedDate={onUpdateConfirmedDate}
              onUpdateMeeting={onUpdateMeeting}
              showActions={true}
              showDateControls={showMeetingStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}