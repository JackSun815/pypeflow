import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { Meeting } from '../types/database';
import '../index.css';
import { Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

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
  sdr_full_name?: string;
  company?: string;
  linkedin_url?: string;
  notes?: string;
}

interface CalendarViewProps {
  meetings: Meeting[];
}

export default function CalendarView({ meetings }: CalendarViewProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingEvent | null>(null);
  const [showDetails, setShowDetails] = useState(false);


  const events: MeetingEvent[] = meetings.map((m) => {
    // Parse local date/time from stored ISO string
    const [datePart, timePart = '09:00'] = (m.scheduled_date || '').split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    const start = new Date(year, month - 1, day, hour, minute);
    const end   = new Date(start.getTime() + 30 * 60 * 1000);
    
    return {
      id: m.id,
      title: m.title,
      start: start,
      end,
      created_at: m.created_at,
      status: m.status,
      contact_full_name: m.contact_full_name,
      contact_email: m.contact_email,
      contact_phone: m.contact_phone,
      held_at: m.held_at,
      no_show: m.no_show,
      sdr_name: m.sdrs?.full_name,
      client_name: m.clients?.name,
      sdr_full_name: m.sdrs?.full_name,
      scheduled_date: m.scheduled_date,
      company: m.company,
      linkedin_url: m.linkedin_page,
      notes: m.notes
    };
  });

  // Style events for month/week/day views
  const eventStyleGetter = (event: MeetingEvent) => {
    let backgroundColor = '';
    switch (event.status) {
      case 'pending': backgroundColor = '#FFBF00'; break; // yellow
      case 'confirmed': backgroundColor = '#48D035'; break; // green
      case 'no_show': backgroundColor = '#FECACA'; break; // red
      default: backgroundColor = '#E5E7EB';
    }
    return { style: { backgroundColor, borderRadius: '4px', border: 'none' } };
  };

  // Custom event component for month/week/day views
  const CustomEvent = ({ event }: { event: MeetingEvent }) => (
    <div className="rbc-event-content">
      {event.client_name || event.contact_full_name || event.title}
    </div>
  );

  // Custom event component specifically for agenda view
  const CustomAgendaEvent = ({ event }: { event: MeetingEvent }) => {
    let backgroundColor = '';
    switch (event.status) {
      case 'pending': backgroundColor = '#FFBF00'; break;
      case 'confirmed': backgroundColor = '#48D035'; break;
      case 'no_show': backgroundColor = '#FECACA'; break;
      default: backgroundColor = '#E5E7EB';
    }

    return (
      <div 
        className="rbc-event-content" 
        style={{ 
          backgroundColor, 
          borderRadius: '4px', 
          padding: '4px 8px',
          margin: '2px 0'
        }}
      >
        {event.client_name || event.contact_full_name || event.title}
      </div>
    );
  };

  const handleSelectEvent = (event: MeetingEvent) => {
    setSelectedMeeting(event);
    setShowDetails(false);
    console.log('Selected meeting:', event);
  };

  return (
    <div className="calendar-wrapper" style={{ height: '700px' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        views={['month', 'week', 'day', 'agenda']}
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        components={{
          event: CustomEvent,
          agenda: {
            event: CustomAgendaEvent
          }
        }}
      />
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedMeeting.client_name || selectedMeeting.contact_full_name || selectedMeeting.title}
              </h2>
            </div>
            <div className="text-sm text-gray-700 space-y-2">
              <div>
                <span className="font-medium text-gray-700">Meeting Time: </span>
                <span className="text-gray-900">{selectedMeeting.start.toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created Time: </span>
                <span className="text-gray-900">
                  {new Date(selectedMeeting.created_at).toLocaleString('en-US', {
                    timeZone: 'America/New_York',
                    year: 'numeric', month: 'numeric', day: 'numeric',
                    hour: 'numeric', minute: '2-digit', hour12: true,
                  })}
                </span>
              </div>
              {selectedMeeting.contact_full_name && (
                <div>
                  <span className="font-medium text-gray-700">Contact: </span>
                  <span className="text-gray-900">{selectedMeeting.contact_full_name}</span>
                </div>
              )}
              {selectedMeeting.contact_email && (
                <div>
                  <span className="font-medium text-gray-700">Email: </span>
                  <span className="text-gray-900">{selectedMeeting.contact_email}</span>
                </div>
              )}
              {selectedMeeting.contact_phone && (
                <div>
                  <span className="font-medium text-gray-700">Phone: </span>
                  <span className="text-gray-900">{selectedMeeting.contact_phone}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Status: </span>
                <span className="text-gray-900">
                  {selectedMeeting.status.charAt(0).toUpperCase() + selectedMeeting.status.slice(1)}
                </span>
              </div>
              <button
                onClick={() => {
                  console.log(showDetails ? 'Hiding details for' : 'Showing details for', selectedMeeting);
                  setShowDetails(!showDetails);
                }}
                className="mt-2 text-sm text-indigo-600 hover:underline"
              >
                {showDetails ? (
                  <><ChevronUp className="inline-block w-4 h-4 mr-1" /> Hide Details</>
                ) : (
                  <><ChevronDown className="inline-block w-4 h-4 mr-1" /> Show Details</>
                )}
              </button>
              
              {showDetails && (
                
                <div className="mt-2 space-y-2">
                  {selectedMeeting.company && (
                    <div>
                      <span className="font-medium text-gray-700">Company: </span>
                      <span className="text-gray-900">{selectedMeeting.company}</span>
                    </div>
                  )}
                  {selectedMeeting.title && (
                    <div>
                      <span className="font-medium text-gray-700">Title: </span>
                      <span className="text-gray-900">{selectedMeeting.title}</span>
                    </div>
                  )}
                  {selectedMeeting.linkedin_url && (
                    <div>
                      <span className="font-medium text-gray-700">LinkedIn: </span>
                      <span className="text-gray-900">{selectedMeeting.linkedin_url}</span>
                    </div>
                  )}
                  {selectedMeeting.notes && (
                    <div>
                      <span className="font-medium text-gray-700">Notes: </span>
                      <span className="text-gray-900 whitespace-pre-wrap">{selectedMeeting.notes}</span>
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