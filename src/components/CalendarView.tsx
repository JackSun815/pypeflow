import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { Meeting } from '../types/database';
import '../index.css';
import { Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { DateTime } from 'luxon';

// setup locales for date-fns
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

export interface MeetingEvent {
  id: string;
  title?: string;
  start: Date;
  end: Date;
  created_at: string;
  status: 'pending' | 'confirmed' | 'no_show';
  contact_full_name?: string;
  contact_email?: string;
  contact_phone?: string;
  held_at?: string;
  no_show?: boolean;
  sdr_name?: string;
  scheduled_date?: string;
  client_name?: string;
  clients?: { name?: string } | null;
  sdr_full_name?: string;
  company?: string;
  linkedin_url?: string;
  notes?: string;
  timezone?: string; // Added timezone to MeetingEvent
  sdr_id?: string; // Added sdr_id to MeetingEvent
}

interface CalendarViewProps {
  meetings: Meeting[];
  colorByStatus?: boolean;
  defaultDate?: Date;
  darkTheme?: boolean;
}

// Add a color palette for SDRs
const SDR_COLORS = [
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
function getSDRColor(sdrId: string) {
  let hash = 0;
  for (let i = 0; i < sdrId.length; i++) {
    hash = ((hash << 5) - hash) + sdrId.charCodeAt(i);
    hash = hash & hash;
  }
  return SDR_COLORS[Math.abs(hash) % SDR_COLORS.length];
}

export default function CalendarView({ meetings, colorByStatus = false, defaultDate, darkTheme = false }: CalendarViewProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingEvent | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Debug logging
  console.log('CalendarView received meetings:', meetings.length);
  console.log('Sample meeting data:', meetings.slice(0, 3));

  const events: MeetingEvent[] = meetings.map((m) => {
    // Always use EST for calendar display since all meetings are booked in EST
    let start: Date;
    let end: Date;
    if (m.scheduled_date) {
      // Parse the meeting time as EST
      const dt = DateTime.fromISO(m.scheduled_date, { zone: 'America/New_York' });
      // Create Date object using the EST time components (not converted to local timezone)
      // This ensures calendar displays the actual EST time regardless of user's local timezone
      start = new Date(dt.year, dt.month - 1, dt.day, dt.hour, dt.minute, dt.second);
      end = new Date(dt.year, dt.month - 1, dt.day, dt.hour, dt.minute + 30, dt.second);
    } else {
      start = new Date();
      end = new Date(start.getTime() + 30 * 60 * 1000);
    }
    return {
      ...m,
      start,
      end,
      title: m.title || undefined, // Use prospect's title, not SDR name
    };
  });

  console.log('Calendar events created:', events.length);

  // Status color palette
  const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#10b981',
    held: '#3b82f6',
    no_show: '#ef4444',
  };

  // Style events for month/week/day views
  const eventStyleGetter = (event: MeetingEvent) => {
    if (colorByStatus) {
      let status = event.status;
      if (status === 'confirmed' && event.held_at) status = 'held';
      if (event.no_show) status = 'no_show';
      const color = STATUS_COLORS[status] || '#6366f1';
      return { 
        style: { 
          backgroundColor: color, 
          color: '#fff', 
          borderRadius: '4px', 
          border: darkTheme ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #E5E7EB',
          boxShadow: darkTheme ? '0 2px 4px rgba(0, 0, 0, 0.4)' : '0 1px 2px rgba(0, 0, 0, 0.1)'
        } 
      };
    } else {
      const color = event.sdr_id ? getSDRColor(event.sdr_id) : '#82ed94';
      return { 
        style: { 
          backgroundColor: color, 
          color: '#fff', 
          borderRadius: '4px', 
          border: darkTheme ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #E5E7EB',
          boxShadow: darkTheme ? '0 2px 4px rgba(0, 0, 0, 0.4)' : '0 1px 2px rgba(0, 0, 0, 0.1)'
        } 
      };
    }
  };

  // Custom event component for month/week/day views (used for month, week, and day)
  const CustomEvent = ({ event }: { event: MeetingEvent }) => {
    let preview = '';
    if (event.contact_full_name && event.client_name) {
      preview = `${event.contact_full_name} - ${event.client_name}`;
    } else if (event.contact_full_name) {
      preview = event.contact_full_name;
    } else if (event.client_name) {
      preview = event.client_name;
    } else {
      preview = event.title;
    }
    // Add SDR name
    return (
      <div className="rbc-event-content flex flex-col">
        <span>{preview}</span>
        {event.sdr_name && (
          <span className="text-xs" style={{ color: darkTheme ? 'rgba(255, 255, 255, 0.8)' : '#e0e7ff' }}>SDR: {event.sdr_name}</span>
        )}
      </div>
    );
  };

  // Custom event component specifically for agenda view
  const CustomAgendaEvent = ({ event }: { event: MeetingEvent }) => {
    let statusText = '';
    let statusColor = '';
    let backgroundColor = '';
    
    if (darkTheme) {
      switch (event.status) {
        case 'pending': 
          statusColor = '#fbbf24';
          statusText = 'Pending';
          backgroundColor = '#3d2e0f'; // Dark yellow background
          break;
        case 'confirmed': 
          statusColor = '#34d399';
          statusText = 'Confirmed';
          backgroundColor = '#0f2e1f'; // Dark green background
          break;
        case 'no_show': 
          statusColor = '#f87171';
          statusText = 'No Show';
          backgroundColor = '#3d1a1a'; // Dark red background
          break;
        default: 
          statusColor = '#9ca3af';
          statusText = 'Unknown';
          backgroundColor = '#2d2d2d'; // Dark gray background
      }
    } else {
      switch (event.status) {
        case 'pending': 
          statusColor = '#F59E0B';
          statusText = 'Pending';
          backgroundColor = '#FEF3C7'; // Light yellow background
          break;
        case 'confirmed': 
          statusColor = '#10B981';
          statusText = 'Confirmed';
          backgroundColor = '#D1FAE5'; // Light green background
          break;
        case 'no_show': 
          statusColor = '#EF4444';
          statusText = 'No Show';
          backgroundColor = '#FEE2E2'; // Light red background
          break;
        default: 
          statusColor = '#6B7280';
          statusText = 'Unknown';
          backgroundColor = '#F3F4F6'; // Light gray background
      }
    }

    // Format time showing EST times (dates are already in EST from event mapping)
    const formatTime = (date: Date) => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `${displayHours}:${displayMinutes} ${ampm} EST`;
    };

    return (
      <div 
        className="agenda-event-item"
        style={{ 
          backgroundColor: backgroundColor, 
          borderRadius: '8px', 
          padding: '12px',
          margin: '4px 0',
          border: darkTheme ? `1px solid ${statusColor}40` : '1px solid #E5E7EB',
          boxShadow: darkTheme ? '0 2px 6px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border"
                style={{
                  color: statusColor,
                  borderColor: statusColor,
                  backgroundColor: darkTheme ? '#1a1a1a' : 'white'
                }}
              >
                {statusText}
              </span>
              {event.held_at && (
                <span 
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border"
                  style={{
                    borderColor: darkTheme ? '#34d399' : '#10b981',
                    color: darkTheme ? '#34d399' : '#10b981',
                    backgroundColor: darkTheme ? '#1a1a1a' : 'white'
                  }}
                >
                  Held
                </span>
              )}
            </div>
            
            <h4 className={`font-semibold mb-1 ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`} title={event.sdr_name ? `SDR: ${event.sdr_name}` : undefined}>
              {event.client_name || event.contact_full_name || 'Untitled Meeting'}
              {event.sdr_name && (
                <span className="ml-2 text-xs font-normal" style={{ color: getSDRColor(event.sdr_id || '') }}>
                  SDR: {event.sdr_name}
                </span>
              )}
            </h4>
            
            <div className={`text-sm space-y-1 ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>
              <div className="flex items-center gap-2">
                <span className="font-medium">Time:</span>
                <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
              </div>
              
              {event.contact_full_name && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Contact:</span>
                  <span>{event.contact_full_name}</span>
                </div>
              )}
              
              {event.title && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Title:</span>
                  <span>{event.title}</span>
                </div>
              )}
              
              {event.contact_email && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <span className={darkTheme ? 'text-blue-400' : 'text-blue-600'}>{event.contact_email}</span>
                </div>
              )}
              
              {event.company && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Company:</span>
                  <span>{event.company}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className={`text-xs ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
              {event.start.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </div>
            {event.notes && (
              <div className={`text-xs max-w-xs truncate ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`} title={event.notes}>
                📝 {event.notes.substring(0, 50)}...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleSelectEvent = (event: MeetingEvent) => {
    setSelectedMeeting(event);
    setShowDetails(false);
    console.log('Selected meeting:', event);
  };

  // Legend logic
  let legend = null;
  if (!colorByStatus) {
    const uniqueSDRs = Array.from(new Set(events.map(e => e.sdr_id + '|' + (e.sdr_name || 'Unknown SDR'))))
      .map(str => {
        const [id, name] = str.split('|');
        return { id, name };
      });
    legend = (
      <div className="flex flex-wrap gap-4 mb-4">
        {uniqueSDRs.map(sdr => (
          <div key={sdr.id} className="flex items-center gap-2">
            <span style={{ backgroundColor: getSDRColor(sdr.id), width: 16, height: 16, display: 'inline-block', borderRadius: 4 }} />
            <span className={`text-sm ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>{sdr.name}</span>
          </div>
        ))}
      </div>
    );
  } else {
    legend = (
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2"><span style={{ backgroundColor: STATUS_COLORS.pending, width: 16, height: 16, display: 'inline-block', borderRadius: 4 }} /> <span className={`text-sm ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Pending</span></div>
        <div className="flex items-center gap-2"><span style={{ backgroundColor: STATUS_COLORS.confirmed, width: 16, height: 16, display: 'inline-block', borderRadius: 4 }} /> <span className={`text-sm ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Confirmed</span></div>
        <div className="flex items-center gap-2"><span style={{ backgroundColor: STATUS_COLORS.held, width: 16, height: 16, display: 'inline-block', borderRadius: 4 }} /> <span className={`text-sm ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Held</span></div>
        <div className="flex items-center gap-2"><span style={{ backgroundColor: STATUS_COLORS.no_show, width: 16, height: 16, display: 'inline-block', borderRadius: 4 }} /> <span className={`text-sm ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>No Show</span></div>
      </div>
    );
  }

  return (
    <div className="calendar-wrapper" style={{ height: '700px' }}>
      {legend}
      <style>
        {darkTheme ? `
          /* Google Maps-inspired Dark Theme */
          .rbc-calendar {
            background: #1a1a1a !important;
            color: #e8eaed !important;
          }
          
          .rbc-header {
            background: #1a1a1a !important;
            border-bottom: 1px solid #3c4043 !important;
            color: #e8eaed !important;
            padding: 10px 0 !important;
          }
          
          .rbc-header button {
            color: #e8eaed !important;
          }
          
          .rbc-header button:hover {
            background: #2d2d2d !important;
          }
          
          .rbc-toolbar {
            background: #1a1a1a !important;
            border-bottom: 1px solid #3c4043 !important;
            color: #e8eaed !important;
            padding: 12px !important;
          }
          
          .rbc-toolbar button {
            color: #e8eaed !important;
            background: #2d2d2d !important;
            border: 1px solid #3c4043 !important;
          }
          
          .rbc-toolbar button:hover {
            background: #3c4043 !important;
          }
          
          .rbc-toolbar button.rbc-active {
            background: #4285f4 !important;
            border-color: #4285f4 !important;
            color: white !important;
          }
          
          .rbc-today {
            background: #2d2d2d !important;
          }
          
          .rbc-off-range-bg {
            background: #1a1a1a !important;
          }
          
          .rbc-day-bg {
            border-color: #3c4043 !important;
          }
          
          .rbc-time-slot {
            border-top: 1px solid #3c4043 !important;
          }
          
          .rbc-time-header-gutter {
            background: #1a1a1a !important;
            border-right: 1px solid #3c4043 !important;
          }
          
          .rbc-time-content {
            border-top: 2px solid #3c4043 !important;
          }
          
          .rbc-time-header-content {
            border-left: 1px solid #3c4043 !important;
          }
          
          .rbc-day-slot .rbc-time-slot {
            border-top: 1px solid #2d2d2d !important;
          }
          
          .rbc-current-time-indicator {
            background: #ea4335 !important;
          }
          
          .rbc-time-view {
            border: 1px solid #3c4043 !important;
          }
          
          .rbc-month-view {
            border: 1px solid #3c4043 !important;
          }
          
          .rbc-day-view {
            border: 1px solid #3c4043 !important;
          }
          
          .rbc-agenda-view {
            background: #1a1a1a !important;
            border-radius: 8px;
            border: 1px solid #3c4043 !important;
          }
          
          .rbc-agenda-view table {
            border-collapse: separate;
            border-spacing: 0;
          }
          
          .rbc-agenda-view .rbc-agenda-date-cell {
            background: #2d2d2d !important;
            font-weight: 600;
            color: #e8eaed !important;
            padding: 12px 16px;
            border-bottom: 1px solid #3c4043 !important;
          }
          
          .rbc-agenda-view .rbc-agenda-time-cell {
            padding: 8px 16px;
            color: #9aa0a6 !important;
            font-size: 0.875rem;
          }
          
          .rbc-agenda-view .rbc-agenda-event-cell {
            padding: 8px 16px;
            border-bottom: 1px solid #2d2d2d !important;
            background: #1a1a1a !important;
          }
          
          .agenda-event-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            transition: all 0.2s ease;
          }
          
          .rbc-agenda-view .rbc-agenda-content {
            background: #1a1a1a !important;
          }
          
          .rbc-agenda-view .rbc-agenda-empty {
            padding: 40px;
            text-align: center;
            color: #9aa0a6 !important;
            font-style: italic;
          }
          
          .rbc-event {
            border: none !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
          }
          
          .rbc-event-content {
            color: white !important;
            font-weight: 500 !important;
          }
          
          .rbc-selected {
            background: rgba(66, 133, 244, 0.2) !important;
          }
        ` : `
          .rbc-agenda-view {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .rbc-agenda-view table {
            border-collapse: separate;
            border-spacing: 0;
          }
          
          .rbc-agenda-view .rbc-agenda-date-cell {
            background: #F9FAFB;
            font-weight: 600;
            color: #374151;
            padding: 12px 16px;
            border-bottom: 1px solid #E5E7EB;
          }
          
          .rbc-agenda-view .rbc-agenda-time-cell {
            padding: 8px 16px;
            color: #6B7280;
            font-size: 0.875rem;
          }
          
          .rbc-agenda-view .rbc-agenda-event-cell {
            padding: 8px 16px;
            border-bottom: 1px solid #F3F4F6;
          }
          
          .agenda-event-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
          }
          
          .rbc-agenda-view .rbc-agenda-content {
            background: white;
          }
          
          .rbc-agenda-view .rbc-agenda-empty {
            padding: 40px;
            text-align: center;
            color: #6B7280;
            font-style: italic;
          }
        `}
      </style>
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        views={['month', 'week', 'day', 'agenda']}
        defaultDate={defaultDate || new Date()}
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        components={{
          event: CustomEvent,
          agenda: {
            event: CustomAgendaEvent
          }
        }}
        formats={{
          eventTimeRangeFormat: () => '',
          eventTimeRangeStartFormat: () => '',
          eventTimeRangeEndFormat: () => '',
          agendaTimeFormat: 'h:mm a', // keep time in agenda view
        }}
        step={30}
        timeslots={2}
        min={new Date(0, 0, 0, 0, 0, 0)} // Start at midnight (12:00 AM)
        max={new Date(0, 0, 0, 23, 59, 59)} // End at 11:59 PM (full 24 hours)
        scrollToTime={new Date(0, 0, 0, new Date().getHours(), new Date().getMinutes(), 0)} // Scroll near user's current time
      />
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className={`p-6 rounded shadow-lg max-w-md w-full ${darkTheme ? 'bg-[#1a1a1a] border border-[#3c4043]' : 'bg-white'}`}>
            <div className="mb-4">
              {/* Client indicator badge */}
              {(selectedMeeting.client_name || selectedMeeting.clients?.name) && (
                <div className="mb-2">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    {selectedMeeting.client_name || selectedMeeting.clients?.name}
                  </span>
                </div>
              )}
              <h2 className={`text-xl font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                {selectedMeeting.contact_full_name || 'Untitled Meeting'}
              </h2>
              {selectedMeeting.sdr_name && (
                <p className={`text-sm mt-1 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>SDR: {selectedMeeting.sdr_name}</p>
              )}
            </div>
            <div className={`text-sm space-y-2 ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
              <div>
                <span className={`font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Meeting Time: </span>
                <span className={darkTheme ? 'text-slate-100' : 'text-gray-900'}>
                  {selectedMeeting.start.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })} at {selectedMeeting.start.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })} EST
                </span>
              </div>
              <div>
                <span className={`font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Created Time: </span>
                <span className={darkTheme ? 'text-slate-100' : 'text-gray-900'}>
                  {new Date(selectedMeeting.created_at).toLocaleString('en-US', {
                    timeZone: 'America/New_York',
                    year: 'numeric', month: 'numeric', day: 'numeric',
                    hour: 'numeric', minute: '2-digit', hour12: true,
                  })} EST
                </span>
              </div>
              {selectedMeeting.contact_full_name && (
                <div>
                  <span className={`font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Contact: </span>
                  <span className={darkTheme ? 'text-slate-100' : 'text-gray-900'}>{selectedMeeting.contact_full_name}</span>
                </div>
              )}
              {selectedMeeting.contact_email && (
                <div>
                  <span className={`font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Email: </span>
                  <span className={darkTheme ? 'text-slate-100' : 'text-gray-900'}>{selectedMeeting.contact_email}</span>
                </div>
              )}
              {selectedMeeting.contact_phone && (
                <div>
                  <span className={`font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Phone: </span>
                  <span className={darkTheme ? 'text-slate-100' : 'text-gray-900'}>{selectedMeeting.contact_phone}</span>
                </div>
              )}
              <div>
                <span className={`font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Status: </span>
                <span className={darkTheme ? 'text-slate-100' : 'text-gray-900'}>
                  {selectedMeeting.status.charAt(0).toUpperCase() + selectedMeeting.status.slice(1)}
                </span>
              </div>
              <button
                onClick={() => {
                  console.log(showDetails ? 'Hiding details for' : 'Showing details for', selectedMeeting);
                  setShowDetails(!showDetails);
                }}
                className={`mt-2 text-sm hover:underline ${darkTheme ? 'text-blue-400' : 'text-blue-600'}`}
              >
                {showDetails ? (
                  <><ChevronUp className="inline-block w-4 h-4 mr-1" /> Hide Details</>
                ) : (
                  <><ChevronDown className="inline-block w-4 h-4 mr-1" /> Show Details</>
                )}
              </button>
              
              {showDetails && (
                <div className="mt-2 space-y-2">
                  {/* Calendar Display Timezone */}
                  <div>
                    <span className={`font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Calendar Display: </span>
                    <span className={darkTheme ? 'text-slate-100' : 'text-gray-900'}>All times shown in EST</span>
                  </div>
                  {/* Client Timezone row */}
                  <div>
                    <span className={`font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Client Timezone: </span>
                    <span className={darkTheme ? 'text-slate-100' : 'text-gray-900'}>
                      {(() => {
                        const tz = selectedMeeting.timezone || 'America/New_York';
                        const dt = DateTime.now().setZone(tz);
                        return tz + ' (' + dt.offsetNameShort + ')';
                      })()}
                    </span>
                  </div>
                  {selectedMeeting.company && (
                    <div>
                      <span className={`font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Company: </span>
                      <span className={darkTheme ? 'text-slate-100' : 'text-gray-900'}>{selectedMeeting.company}</span>
                    </div>
                  )}
                  {selectedMeeting.title && (
                    <div>
                      <span className={`font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Title: </span>
                      <span className={darkTheme ? 'text-slate-100' : 'text-gray-900'}>{selectedMeeting.title}</span>
                    </div>
                  )}
                  {selectedMeeting.linkedin_url && (
                    <div>
                      <span className={`font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>LinkedIn: </span>
                      <span className={darkTheme ? 'text-slate-100' : 'text-gray-900'}>{selectedMeeting.linkedin_url}</span>
                    </div>
                  )}
                  {selectedMeeting.notes && (
                    <div>
                      <span className={`font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Notes: </span>
                      <span className={`whitespace-pre-wrap ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>{selectedMeeting.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedMeeting(null)}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}