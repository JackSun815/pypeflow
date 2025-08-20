import React, { useState } from 'react';
import { Calendar, CheckCircle, Mail, Phone, Trash2, User, XCircle, AlertCircle, Save, Edit2, ChevronDown, ChevronUp, Clipboard } from 'lucide-react';
import { formatTimeFromISOString, formatDateToEST } from '../utils/timeUtils';
import type { Meeting } from '../types/database';
import TimeSelector from './TimeSelector';
import { DateTime } from 'luxon';

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
  showSDR?: boolean;
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
  showSDR = false,
}: MeetingCardProps) {
  const isEditing = editingMeetingId === meeting.id;
  const [editedData, setEditedData] = useState({
    contact_full_name: meeting.contact_full_name || '',
    contact_email: meeting.contact_email || '',
    contact_phone: meeting.contact_phone || '',
    scheduled_date: meeting.scheduled_date, // Full ISO string
    status: meeting.status,
    no_show: meeting.no_show,
    held_at: meeting.held_at,
    icp_status: meeting.icp_status || 'pending',
    company: meeting.company || '',
    linkedin_page: meeting.linkedin_page || '',
    notes: meeting.notes || '',
    timezone: meeting.timezone || 'America/New_York'
  });

  const [collapsed, setCollapsed] = useState(true);
  const [copied, setCopied] = useState(false);

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
      held_at: editedData.held_at,
      icp_status: editedData.icp_status,
      company: editedData.company,
      linkedin_page: editedData.linkedin_page,
      notes: editedData.notes,
      timezone: editedData.timezone
    };
    onSave(updatedMeeting);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const currentTime = getTimePart(editedData.scheduled_date);
    
    // Create a DateTime in EST timezone with the new date and current time
    const [hours, minutes] = currentTime.split(':').map(Number);
    const newDateTime = DateTime.fromObject(
      {
        year: parseInt(newDate.split('-')[0]),
        month: parseInt(newDate.split('-')[1]),
        day: parseInt(newDate.split('-')[2]),
        hour: hours,
        minute: minutes,
        second: 0,
        millisecond: 0
      },
      { zone: 'America/New_York' }
    );
    
    const isoString = newDateTime.toISO();
    if (isoString) {
      setEditedData({
        ...editedData,
        scheduled_date: isoString
      });
    }
  };

  const handleTimeChange = (timeString: string) => {
    // timeString is a full UTC ISO string from TimeSelector
    setEditedData({
      ...editedData,
      scheduled_date: timeString
    });
  };

  // Generate consistent color for client
  const getClientColor = (clientName: string) => {
    const colors = [
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-red-100 text-red-800 border-red-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-cyan-100 text-cyan-800 border-cyan-200'
    ];
    
    // Simple hash function to get consistent color for client name
    let hash = 0;
    for (let i = 0; i < clientName.length; i++) {
      const char = clientName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Generate consistent border color for client
  const getBorderColor = (clientName: string) => {
    const colors = [
      '#6366f1', // indigo
      '#3b82f6', // blue
      '#10b981', // green
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#f59e0b', // yellow
      '#ef4444', // red
      '#14b8a6', // teal
      '#f97316', // orange
      '#06b6d4'  // cyan
    ];
    
    // Simple hash function to get consistent color for client name
    let hash = 0;
    for (let i = 0; i < clientName.length; i++) {
      const char = clientName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const clientName = meeting.client_name || meeting.clients?.name;
  const clientColorClass = clientName ? getClientColor(clientName) : 'bg-gray-100 text-gray-800 border-gray-200';

  // Helper to format the Slack message
  const getSlackMessage = () => {
    // Always format time in EST regardless of prospect's timezone
    const dt = DateTime.fromISO(meeting.scheduled_date, { zone: 'America/New_York' });
    const timeStr = dt.isValid ? dt.toFormat('ccc, LLL d, yyyy, h:mm a') + ' EST' : meeting.scheduled_date;
    return [
      '***MEETING BOOKED',
      meeting.contact_full_name || '',
      meeting.title || '',
      meeting.company || '',
      meeting.contact_email || '',
      meeting.contact_phone || '',
      meeting.linkedin_page || '',
      `Talk track: ${meeting.client_name || meeting.clients?.name || ''}`,
      `Meeting: ${timeStr}`,
      meeting.notes ? `NOTES: ${meeting.notes}` : '',
    ].filter(Boolean).join('\n');
  };

  const handleCopySlack = async () => {
    try {
      await navigator.clipboard.writeText(getSlackMessage());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className={`rounded-lg p-4 ${
        needsConfirmation 
          ? 'bg-amber-50 border-2 border-amber-300 animate-pulse' 
          : 'bg-gray-50'
      } ${clientName ? 'border-l-4' : ''}`} style={{
        borderLeftColor: clientName ? getBorderColor(clientName) : undefined
      }}>
        {/* Collapsed summary row */}
        {!isEditing && collapsed && (
          <div className="flex items-center justify-between cursor-pointer hover:bg-gray-100 rounded-md p-2 -m-2" onClick={() => setCollapsed(false)}>
            <div className="flex flex-col gap-1">
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${clientColorClass} mb-1`}>
                <User className="w-3 h-3 mr-1" />
                {clientName || 'Unknown Client'}
              </span>
              <span className="font-medium text-gray-900">{meeting.contact_full_name || 'Untitled Meeting'}</span>
              <span className="text-xs text-gray-500">{meetingDate} {formattedTime} EST</span>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button className="text-gray-500 hover:text-indigo-600" title="Expand details">
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        {/* Expanded details (or always expanded if editing) */}
        {isEditing || !collapsed ? (
          <>
            <div className="flex justify-between items-start">
              <div className="space-y-1 w-full">
                {/* Client indicator */}
                <div className="mb-2">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${clientColorClass}`}>
                    <User className="w-3 h-3 mr-1" />
                    {clientName || 'Unknown Client'}
                  </span>
                </div>
                {needsConfirmation && (
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <span className="text-sm font-medium">Needs confirmation for tomorrow!</span>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{meeting.contact_full_name || 'Untitled Meeting'}</p>
                    {showSDR && meeting.sdr_name && (
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
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this meeting?')) {
                            onDelete(meeting.id);
                          }
                        }}
                        className="p-1 text-red-600 hover:text-red-700 focus:outline-none"
                        title="Delete meeting"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    {!isEditing && (
                      <button className="text-gray-500 hover:text-indigo-600" title="Collapse details" onClick={() => setCollapsed(true)}>
                        <ChevronUp className="w-5 h-5" />
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
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          value={getDatePart(editedData.scheduled_date)}
                          onChange={handleDateChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                        <TimeSelector
                          value={editedData.scheduled_date}
                          onChange={handleTimeChange}
                          className="w-full"
                        />
                      </div>
                    </div>
                    {/* Meeting Status Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Status</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={(() => {
                          if (editedData.no_show) return 'no_show';
                          if (editedData.held_at) return 'completed';
                          if (editedData.status === 'pending') return 'pending';
                          if (editedData.status === 'confirmed' && !editedData.held_at && !editedData.no_show && new Date(editedData.scheduled_date) < new Date()) return 'past_due';
                          if (editedData.status === 'confirmed') return 'confirmed';
                          return 'pending';
                        })()}
                        onChange={e => {
                          const newStatus = e.target.value;
                          if (newStatus === 'pending') {
                            setEditedData(d => ({ ...d, status: 'pending', held_at: null, no_show: false }));
                          } else if (newStatus === 'confirmed') {
                            setEditedData(d => ({ ...d, status: 'confirmed', held_at: null, no_show: false }));
                          } else if (newStatus === 'past_due') {
                            setEditedData(d => ({ ...d, status: 'confirmed', held_at: null, no_show: false }));
                          } else if (newStatus === 'completed') {
                            setEditedData(d => ({ ...d, status: 'confirmed', held_at: new Date().toISOString(), no_show: false }));
                          } else if (newStatus === 'no_show') {
                            setEditedData(d => ({ ...d, status: 'confirmed', held_at: null, no_show: true }));
                          }
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="past_due">Past Due Pending</option>
                        <option value="completed">Completed</option>
                        <option value="no_show">No Show</option>
                      </select>
                    </div>
                    {/* ICP Status Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ICP Status</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={editedData.icp_status}
                        onChange={e => setEditedData(d => ({ ...d, icp_status: e.target.value as 'pending' | 'approved' | 'denied' }))}
                      >
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prospect's Timezone</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={editedData.timezone || 'America/New_York'}
                        onChange={e => setEditedData({ ...editedData, timezone: e.target.value })}
                      >
                        <option value="America/New_York">EST (Eastern)</option>
                        <option value="America/Chicago">CST (Central)</option>
                        <option value="America/Denver">MST (Mountain)</option>
                        <option value="America/Los_Angeles">PST (Pacific)</option>
                        <option value="America/Phoenix">MST (Arizona)</option>
                        <option value="America/Anchorage">AKST (Alaska)</option>
                        <option value="Pacific/Honolulu">HST (Hawaii)</option>
                      </select>
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
                    <div className="flex items-center gap-2 mt-3">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-gray-700">Meeting Status: </span>
                        {isEditing ? (
                          <select
                            className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={(() => {
                              if (meeting.no_show) return 'no_show';
                              if (meeting.held_at) return 'completed';
                              if (meeting.status === 'pending') return 'pending';
                              if (meeting.status === 'confirmed' && !meeting.held_at && !meeting.no_show && new Date(meeting.scheduled_date) < new Date()) return 'past_due';
                              if (meeting.status === 'confirmed') return 'confirmed';
                              return 'pending';
                            })()}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              const statusLabel = {
                                pending: 'Pending',
                                confirmed: 'Confirmed',
                                past_due: 'Past Due Pending',
                                completed: 'Completed',
                                no_show: 'No Show',
                              }[newStatus] || newStatus;
                              if (!window.confirm(`Are you sure you want to change the Meeting Status to \"${statusLabel}\"?`)) return;
                              let updated = { ...meeting };
                              if (newStatus === 'pending') {
                                updated.status = 'pending';
                                updated.held_at = null;
                                updated.no_show = false;
                              } else if (newStatus === 'confirmed') {
                                updated.status = 'confirmed';
                                updated.held_at = null;
                                updated.no_show = false;
                              } else if (newStatus === 'past_due') {
                                updated.status = 'confirmed';
                                updated.held_at = null;
                                updated.no_show = false;
                              } else if (newStatus === 'completed') {
                                updated.status = 'confirmed';
                                updated.held_at = new Date().toISOString();
                                updated.no_show = false;
                              } else if (newStatus === 'no_show') {
                                updated.status = 'confirmed';
                                updated.held_at = null;
                                updated.no_show = true;
                              }
                              if (onSave) onSave(updated);
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="past_due">Past Due Pending</option>
                            <option value="completed">Completed</option>
                            <option value="no_show">No Show</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            meeting.no_show
                              ? 'bg-red-100 text-red-700'
                              : meeting.held_at
                              ? 'bg-green-100 text-green-700'
                              : meeting.status === 'confirmed' && new Date(meeting.scheduled_date) < new Date() && !meeting.held_at
                              ? 'bg-orange-100 text-orange-700'
                              : meeting.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {meeting.no_show
                              ? 'No Show'
                              : meeting.held_at
                              ? 'Completed'
                              : meeting.status === 'confirmed' && new Date(meeting.scheduled_date) < new Date() && !meeting.held_at
                              ? 'Past Due Pending'
                              : meeting.status === 'confirmed'
                              ? 'Confirmed'
                              : 'Pending'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-gray-700">ICP Status: </span>
                        {isEditing ? (
                          <select
                            className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={meeting.icp_status || 'pending'}
                            onChange={async (e) => {
                              const newIcpStatus = e.target.value as 'pending' | 'approved' | 'denied';
                              const icpLabel = {
                                pending: 'Pending Review',
                                approved: 'Approved',
                                denied: 'Denied',
                              }[newIcpStatus] || newIcpStatus;
                              if (!window.confirm(`Are you sure you want to change the ICP Status to \"${icpLabel}\"?`)) return;
                              let updated = { ...meeting, icp_status: newIcpStatus };
                              if (onSave) onSave(updated);
                            }}
                          >
                            <option value="pending">Pending Review</option>
                            <option value="approved">Approved</option>
                            <option value="denied">Denied</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            (meeting.icp_status || 'pending') === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : (meeting.icp_status || 'pending') === 'denied'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {(meeting.icp_status || 'pending') === 'approved'
                              ? 'Approved'
                              : (meeting.icp_status || 'pending') === 'denied'
                              ? 'Denied'
                              : 'Pending Review'}
                          </span>
                        )}
                      </div>
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
                        {/* Quick action buttons are handled below */}
                      </div>
                    )}
                    {/* Removed extra status badge row, only Meeting Status row remains */}

                    {/* Quick Status Actions */}
                  
                    {/* Expanded details always shown when expanded or editing */}
                    {!collapsed || isEditing ? (
                      <div className="mt-2 space-y-2 text-sm text-gray-600 relative">
                        {/* Client Timezone row */}
                        <div>
                          <span className="font-medium text-gray-700">Prospect's Timezone: </span>
                          <span className="text-gray-900">
                            {(() => {
                              const tz = meeting.timezone || 'America/New_York';
                              const dt = DateTime.now().setZone(tz);
                              return tz + ' (' + dt.offsetNameShort + ')';
                            })()}
                          </span>
                        </div>
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
                        <button
                          onClick={handleCopySlack}
                          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border border-indigo-300 text-indigo-600 bg-white rounded-md hover:bg-indigo-50 hover:border-indigo-400 transition text-sm focus:outline-none"
                          title="Copy meeting info for Slack"
                          type="button"
                        >
                          <Clipboard className="w-4 h-4" />
                          Copy Meeting Info
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
            {copied && (
              <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded shadow text-sm animate-fade-in-out z-50">
                Copied to clipboard!
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}