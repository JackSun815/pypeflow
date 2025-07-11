import React, { useState } from 'react';
import { Calendar, CheckCircle, Mail, Phone, Trash2, User, XCircle, AlertCircle, Save, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatTimeFromISOString, formatDateToEST } from '../utils/timeUtils';
import type { Meeting } from '../types/database';
import TimeSelector from './TimeSelector';

interface MeetingCardProps {
  meeting: Meeting & { sdr_name?: string; client_name?: string; clients?: { name?: string } | null };
  onDelete?: (meetingId: string) => void;
  onSave?: (meeting: Meeting) => void;
  onEdit?: (meeting: Meeting) => void;
  onCancel?: () => void;
  editable?: boolean;
  onUpdateHeldDate?: (meetingId: string, heldDate: string | null) => void;
  onUpdateConfirmedDate?: (meetingId: string, confirmedDate: string | null) => void;
  showDateControls?: boolean;
  editingMeetingId?: string | null;
}

export function MeetingCard({
  meeting,
  onDelete,
  onSave,
  onEdit,
  onCancel,
  editable = false,
  editingMeetingId = null,
  onUpdateHeldDate,
  onUpdateConfirmedDate,
  showDateControls = false,
}: MeetingCardProps) {
  const isEditing = editingMeetingId === meeting.id;
  const [editedData, setEditedData] = useState({
    contact_full_name: meeting.contact_full_name || '',
    contact_email: meeting.contact_email || '',
    contact_phone: meeting.contact_phone || '',
    scheduled_date: meeting.scheduled_date, // Full ISO string
    status: meeting.status,
    no_show: meeting.no_show,
    company: meeting.company || '',
    linkedin_page: meeting.linkedin_page || '',
    notes: meeting.notes || ''
  });

  const [showDetails, setShowDetails] = useState(false);

  // Helper functions
  const getDatePart = (isoString: string) => isoString.split('T')[0];
  const getTimePart = (isoString: string) => isoString.split('T')[1]?.substring(0, 5) || '00:00';

  // Formatted display values
  const formattedTime = formatTimeFromISOString(meeting.scheduled_date);
  const meetingDate = new Date(meeting.scheduled_date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Date calculations
  const todayString = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split('T')[0];
  
  const meetingDateString = getDatePart(meeting.scheduled_date);
  const isMoreThan3DaysOut = new Date(meetingDateString) > new Date(new Date().setDate(new Date().getDate() + 3));
  const isTomorrow = meetingDateString === tomorrowString;
  const needsConfirmation = meeting.status === 'pending' && isTomorrow;

  const handleInternalSave = () => {
    if (!onSave) {
      console.error('No onSave handler provided');
      return;
    }
    
    const updatedMeeting = {
      ...meeting,
      contact_full_name: editedData.contact_full_name,
      contact_email: editedData.contact_email,
      contact_phone: editedData.contact_phone,
      scheduled_date: editedData.scheduled_date,
      status: editedData.status || 'pending',
      no_show: editedData.no_show,
      company: editedData.company,
      linkedin_page: editedData.linkedin_page,
      notes: editedData.notes
    };
    
    onSave(updatedMeeting);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const currentTime = getTimePart(editedData.scheduled_date);
    const newDateTime = `${newDate}T${currentTime}:00Z`;
    
    setEditedData({
      ...editedData,
      scheduled_date: newDateTime
    });
  };

  const handleTimeChange = (timeString: string) => {
    // timeString is a full UTC ISO string from TimeSelector
    setEditedData({
      ...editedData,
      scheduled_date: timeString
    });
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className={`rounded-lg p-4 ${
        needsConfirmation 
          ? 'bg-amber-50 border-2 border-amber-300 animate-pulse' 
          : 'bg-gray-50'
      }`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1 w-full">
          {needsConfirmation && (
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <span className="text-sm font-medium">Needs confirmation for tomorrow!</span>
            </div>
          )}

          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">{meeting.client_name || meeting.clients?.name || meeting.contact_full_name || 'Untitled Meeting'}</p>
              {meeting.sdr_name && (
                <p className="text-sm text-gray-500">Booked by {meeting.sdr_name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleInternalSave}
                    className="p-1 text-green-600 hover:text-green-700 focus:outline-none"
                    title="Save changes"
                  >
                    Save
                  </button>
                  <button
                    onClick={onCancel}
                    className="p-1 text-gray-600 hover:text-gray-700 focus:outline-none"
                    title="Cancel"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onEdit?.(meeting)}
                  className="p-1 text-gray-600 hover:text-gray-700 focus:outline-none"
                  title="Edit meeting"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
              {editable && onDelete && (
                <button
                  onClick={() => onDelete(meeting.id)}
                  className="p-1 text-red-600 hover:text-red-700 focus:outline-none"
                  title="Delete meeting"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={editedData.contact_full_name}
                  onChange={e => setEditedData({ ...editedData, contact_full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={editedData.contact_email}
                  onChange={e => setEditedData({ ...editedData, contact_email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={editedData.contact_phone}
                  onChange={e => setEditedData({ ...editedData, contact_phone: e.target.value })}
                />
              </div>

              <div className="flex space-x-2">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={getDatePart(editedData.scheduled_date)}
                    onChange={handleDateChange}
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <TimeSelector
                    value={editedData.scheduled_date}
                    onChange={handleTimeChange}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={editedData.status}
                  onChange={e => setEditedData({ ...editedData, status: e.target.value as 'pending' | 'confirmed' })}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={editedData.company}
                  onChange={e => setEditedData({ ...editedData, company: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={editedData.linkedin_page}
                  onChange={e => setEditedData({ ...editedData, linkedin_page: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={editedData.notes}
                  onChange={e => setEditedData({ ...editedData, notes: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-700">Meeting Time: </span>
                <span className="text-gray-900">{meetingDate} {formattedTime} EST</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-700">Created Time (EST): </span>
                <span className="text-gray-900">
                  {formatDateToEST(meeting.created_at, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
              {meeting.contact_full_name && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Contact: </span>
                  <span className="text-gray-900">{meeting.contact_full_name}</span>
                </div>
              )}
              {meeting.contact_email && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Email: </span>
                  <span className="text-gray-900">{meeting.contact_email}</span>
                </div>
              )}
              
              {showDateControls && (
                <div className="space-y-2 mt-3">
                  {/* Date controls if needed */}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                {meeting.no_show && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                    No Show
                  </span>
                )}
                {meeting.held_at && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    Meeting Held
                  </span>
                )}
                {!meeting.held_at && meeting.status === 'confirmed' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    Confirmed
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-2 text-sm text-indigo-600 hover:underline"
              >
                {showDetails ? (
                  <><ChevronUp className="inline-block w-4 h-4 mr-1" /> Hide Details</>
                ) : (
                  <><ChevronDown className="inline-block w-4 h-4 mr-1" /> Show Details</>
                )}
              </button>
              {showDetails && (
                <div className="mt-2 space-y-2 text-sm text-gray-600">
                  {meeting.contact_phone && (
                    <div>
                      <span className="font-medium text-gray-700">Phone Number: </span>
                      <span className="text-gray-900">{meeting.contact_phone}</span>
                    </div>
                  )}
                  {meeting.company && (
                    <div>
                      <span className="font-medium text-gray-700">Company: </span>
                      <span className="text-gray-900">{meeting.company}</span>
                    </div>
                  )}
                  {meeting.linkedin_page && (
                    <div>
                      <span className="font-medium text-gray-700">LinkedIn: </span>
                      <span className="text-gray-900">{meeting.linkedin_page}</span>
                    </div>
                  )}
                  {meeting.notes && (
                    <div>
                      <span className="font-medium text-gray-700">Notes: </span>
                      <span className="text-gray-900 whitespace-pre-wrap">{meeting.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}