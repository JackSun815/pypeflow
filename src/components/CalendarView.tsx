import React, { useEffect, useState } from 'react';
import { MeetingCard } from './MeetingCard';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../lib/supabase';
import '../index.css';

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
  title: string;
  start: Date;
  end: Date;
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
}

interface CalendarViewProps {
  meetings: any[]; // raw meetings from hook
}

export default function CalendarView({ meetings }: CalendarViewProps) {
  const [calendarMeetings, setCalendarMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingEvent | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          id,
          scheduled_date,
          status,
          contact_full_name,
          contact_email,
          contact_phone,
          held_at,
          no_show,
          clients(name),
          sdrs: sdr_id(full_name)
        `)
        .order('scheduled_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching meetings:', error);
      } else {
        setCalendarMeetings(data as any[]);
      }
      setLoading(false);
    };
    fetchMeetings();
  }, []);

  const events: MeetingEvent[] = calendarMeetings.map((m) => {
    // Parse local date/time from stored ISO string
    const [datePart, timePart = '09:00'] = (m.scheduled_date || '').split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    const start = new Date(year, month - 1, day, hour, minute);
    const end   = new Date(start.getTime() + 30 * 60 * 1000);
    
    return {
      id: m.id,
      title: m.clients?.name || 'Untitled Meeting',
      start: start,
      end,
      status: m.status,
      contact_full_name: m.contact_full_name,
      contact_email: m.contact_email,
      contact_phone: m.contact_phone,
      held_at: m.held_at,
      no_show: m.no_show,
      sdr_name: m.sdrs?.full_name,
      client_name: m.clients?.name,
      sdr_full_name: m.sdrs?.full_name,
      scheduled_date: m.scheduled_date
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
      {event.client_name || event.title}
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
        {event.client_name || event.title}
      </div>
    );
  };

  const handleSelectEvent = (event: MeetingEvent) => {
    setSelectedMeeting(event);
  };

  if (loading) {
    return <div>Loading calendar...</div>;
  }

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
          <div className="bg-white p-4 rounded shadow-lg max-w-md w-full">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{selectedMeeting.client_name || selectedMeeting.title}</h2>
            </div>
            <MeetingCard meeting={selectedMeeting} />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedMeeting(null)}
                className="px-3 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
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