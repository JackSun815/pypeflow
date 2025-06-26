import React, { useState } from 'react';
import { Calendar, CheckCircle, Mail, Phone, Trash2, User, XCircle, AlertCircle, Save, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatTimeFromISOString } from '../utils/timeUtils';
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
    scheduled_date: meeting.scheduled_date.split('T')[0],
    scheduled_time: meeting.scheduled_date.split('T')[1]?.substring(0, 5) || '09:00',
    status: meeting.status,
    no_show: meeting.no_show
  });

  const [showDetails, setShowDetails] = useState(false);

  const formattedTime = formatTimeFromISOString(meeting.scheduled_date);
  const meetingDate = new Date(meeting.scheduled_date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const todayString = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split('T')[0];
  
  const meetingDateString = meeting.scheduled_date.split('T')[0];
  const isMoreThan3DaysOut = new Date(meetingDateString) > new Date(new Date().setDate(new Date().getDate() + 3));
  const isTomorrow = meetingDateString === tomorrowString;
  const needsConfirmation = meeting.status === 'pending' && isTomorrow;

  const handleInternalSave = () => {
    console.log('Attempting to save meeting with data:', editedData);
    if (!onSave) {
      console.error('No onSave handler provided');
      return;
    }
    
    const scheduledDateTime = `${editedData.scheduled_date}T${editedData.scheduled_time}:00`;
    const updatedMeeting = {
      ...meeting,
      contact_full_name: editedData.contact_full_name,
      contact_email: editedData.contact_email,
      contact_phone: editedData.contact_phone,
      scheduled_date: scheduledDateTime,
      status: editedData.status || 'pending',
      no_show: editedData.no_show,
    };
    
    console.log('Calling onSave with:', updatedMeeting);
    onSave(updatedMeeting);
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
              <AlertCircle className="w-5 h-5" />
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
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onCancel}
                    className="p-1 text-gray-600 hover:text-gray-700 focus:outline-none"
                    title="Cancel"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    console.log('Edit button clicked for meeting:', meeting.id); // Add this line
                    onEdit?.(meeting);
                  }}
                  className="p-1 text-gray-600 hover:text-gray-700 focus:outline-none"
                  title="Edit meeting"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {editable && onDelete && (
                <button
                  onClick={() => onDelete(meeting.id)}
                  className="p-1 text-red-600 hover:text-red-700 focus:outline-none"
                  title="Delete meeting"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={editedData.contact_full_name}
                  onChange={(e) => setEditedData(prev => ({ ...prev, contact_full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={editedData.contact_email}
                  onChange={(e) => setEditedData(prev => ({ ...prev, contact_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={editedData.contact_phone}
                  onChange={(e) => setEditedData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Date
                  </label>
                  <input
                    type="date"
                    value={editedData.scheduled_date}
                    onChange={(e) => setEditedData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Time
                  </label>
                  <TimeSelector
                    value={editedData.scheduled_time}
                    onChange={(time) => setEditedData(prev => ({ ...prev, scheduled_time: time }))}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`confirmed-${meeting.id}`}
                    checked={editedData.status === 'confirmed'}
                    onChange={(e) => setEditedData(prev => ({ 
                      ...prev, 
                      status: e.target.checked ? 'confirmed' : 'pending'
                    }))}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <label htmlFor={`confirmed-${meeting.id}`} className="text-sm text-gray-700">
                    Meeting Confirmed
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`no-show-${meeting.id}`}
                    checked={editedData.no_show}
                    onChange={(e) => setEditedData(prev => ({ ...prev, no_show: e.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <label htmlFor={`no-show-${meeting.id}`} className="text-sm text-gray-700">
                    No Show
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{meetingDate} {formattedTime} EST</span>
              </div>
              {meeting.contact_full_name && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{meeting.contact_full_name}</span>
                </div>
              )}
              {meeting.contact_email && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{meeting.contact_email}</span>
                </div>
              )}
              {meeting.contact_phone && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{meeting.contact_phone}</span>
                </div>
              )}
              {showDateControls && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 w-28">Meeting Held:</label>
                    <input
                      type="date"
                      value={meeting.held_at ? meeting.held_at.split('T')[0] : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        onUpdateHeldDate?.(meeting.id, value ? value : null);
                      }}
                      max={todayString}
                      className="form-input px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  
                  {isMoreThan3DaysOut && meeting.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700 w-28">Meeting Confirmed:</label>
                      <input
                        type="date"
                        value={meeting.confirmed_at ? meeting.confirmed_at.split('T')[0] : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          onUpdateConfirmedDate?.(meeting.id, value ? value : null);
                        }}
                        min={todayString}
                        max={meetingDateString}
                        className="form-input px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                {meeting.no_show && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                    <XCircle className="w-3 h-3" />
                    No Show
                  </span>
                )}
                {meeting.held_at && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3" />
                    Meeting Held
                  </span>
                )}
                {!meeting.held_at && meeting.status === 'confirmed' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    <CheckCircle className="w-3 h-3" />
                    Confirmed
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-2 text-sm text-indigo-600 hover:underline flex items-center gap-1"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showDetails && (
                <div className="mt-2 space-y-2 text-sm text-gray-600">
                  {meeting.title && (
                    <div><span className="font-medium text-gray-700">Title:</span> {meeting.title}</div>
                  )}
                  {meeting.company && (
                    <div><span className="font-medium text-gray-700">Company:</span> {meeting.company}</div>
                  )}
                  {meeting.linkedin_url && (
                    <div><span className="font-medium text-gray-700">LinkedIn:</span> <a href={meeting.linkedin_url} className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">{meeting.linkedin_url}</a></div>
                  )}
                  {meeting.notes && (
                    <div><span className="font-medium text-gray-700">Notes:</span> {meeting.notes}</div>
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