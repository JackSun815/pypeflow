import React, { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle, TrendingUp, Target, Clock, Search } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { MeetingCard } from '../components/MeetingCard';
import type { Meeting } from '../types/database';

interface MeetingStats {
  totalBooked: number;
  totalHeld: number;
  totalNoShow: number;
  showRate: number;
  percentToGoal: number;
}

interface MeetingsHistoryProps {
  meetings: Meeting[];
  loading: boolean;
  error: string | null;
  onUpdateHeldDate: (meetingId: string, heldDate: string | null) => void;
  onUpdateConfirmedDate: (meetingId: string, confirmedDate: string | null) => void;
}

export default function MeetingsHistory({ 
  meetings, 
  loading, 
  error,
  onUpdateHeldDate,
  onUpdateConfirmedDate
}: MeetingsHistoryProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    now.toISOString().slice(0, 7)
  );
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Calculate all-time statistics
  const calculateAllTimeStats = (): MeetingStats => {
    const totalBooked = meetings.length;
    const totalHeld = meetings.filter(m => m.held_at !== null).length;
    const totalNoShow = meetings.filter(m => m.no_show).length;
    const showRate = totalBooked > 0 ? (totalHeld / totalBooked) * 100 : 0;
    const monthlyTarget = 50; // Example monthly target
    const averageMonthlyBookings = totalBooked / 12; // Simplified calculation
    const percentToGoal = (averageMonthlyBookings / monthlyTarget) * 100;

    return {
      totalBooked,
      totalHeld,
      totalNoShow,
      showRate,
      percentToGoal
    };
  };

  // Calculate monthly statistics
  const calculateMonthlyStats = (monthMeetings: Meeting[]): MeetingStats => {
    const totalBooked = monthMeetings.length;
    const totalHeld = monthMeetings.filter(m => m.held_at !== null).length;
    const totalNoShow = monthMeetings.filter(m => m.no_show).length;
    const showRate = totalBooked > 0 ? (totalHeld / totalBooked) * 100 : 0;
    const monthlyTarget = 50; // Example monthly target
    const percentToGoal = (totalBooked / monthlyTarget) * 100;

    return {
      totalBooked,
      totalHeld,
      totalNoShow,
      showRate,
      percentToGoal
    };
  };

  // Generate month options for the last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(now, i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    };
  });

  // Filter meetings for selected month
  const monthMeetings = meetings.filter(meeting => 
    meeting.scheduled_date.startsWith(selectedMonth) ||
    (meeting.held_at && meeting.held_at.startsWith(selectedMonth))
  );

  // Filter meetings based on search term
  const filteredMeetings = monthMeetings.filter(meeting => {
    const searchString = `${(meeting as any).clients?.name || ''} ${meeting.contact_full_name || ''} ${meeting.contact_email || ''} ${meeting.contact_phone || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const allTimeStats = calculateAllTimeStats();
  const monthlyStats = calculateMonthlyStats(monthMeetings);
  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label;

  return (
    <div className="space-y-6">
      {/* All-time Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">All-time Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div>
            <p className="text-sm text-gray-500">Total Meetings Booked</p>
            <p className="text-2xl font-bold text-gray-900">{allTimeStats.totalBooked}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Meetings Held</p>
            <p className="text-2xl font-bold text-green-600">{allTimeStats.totalHeld}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total No Shows</p>
            <p className="text-2xl font-bold text-red-600">{allTimeStats.totalNoShow}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Show Rate</p>
            <p className="text-2xl font-bold text-indigo-600">
              {allTimeStats.showRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg. % to Goal</p>
            <p className="text-2xl font-bold text-gray-900">
              {allTimeStats.percentToGoal.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Stats and Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{selectedMonthLabel}</h2>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Meetings Booked</h3>
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{monthlyStats.totalBooked}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Meetings Held</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{monthlyStats.totalHeld}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">No Shows</h3>
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{monthlyStats.totalNoShow}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Show Rate</h3>
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-indigo-600">
              {monthlyStats.showRate.toFixed(1)}%
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">% to Goal</h3>
              <TrendingUp className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {monthlyStats.percentToGoal.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>

        {/* Meetings List */}
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onUpdateHeldDate={onUpdateHeldDate}
              onUpdateConfirmedDate={onUpdateConfirmedDate}
              showDateControls={true}
            />
          ))}
          {filteredMeetings.length === 0 && (
            <p className="text-center text-gray-500">
              {searchTerm ? 'No meetings found matching your search' : 'No meetings for this month'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}