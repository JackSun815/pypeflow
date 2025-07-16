import React, { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle, TrendingUp, Target, Clock, Search, Download } from 'lucide-react';
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
  // Export modal state
  const [showExport, setShowExport] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'client', 'contact', 'email', 'phone', 'date', 'status', 'notes'
  ]);

  const columnOptions = [
    { key: 'client', label: 'Client Name' },
    { key: 'contact', label: 'Contact Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Notes' },
  ];

  function getMeetingField(meeting: Meeting, key: string) {
    switch (key) {
      case 'client': return (meeting as any).clients?.name || '';
      case 'contact': return meeting.contact_full_name || '';
      case 'email': return meeting.contact_email || '';
      case 'phone': return meeting.contact_phone || '';
      case 'date': return meeting.scheduled_date ? new Date(meeting.scheduled_date).toLocaleString() : '';
      case 'status':
        if (meeting.no_show) return 'No Show';
        if (meeting.held_at) return 'Held';
        return meeting.status === 'confirmed' ? 'Confirmed' : 'Pending';
      case 'notes': return meeting.notes || '';
      default: return '';
    }
  }

  function exportCSV() {
    const header = selectedColumns.map(key => {
      const col = columnOptions.find(c => c.key === key);
      return col ? col.label : key;
    });
    const rows = filteredMeetings.map(meeting =>
      selectedColumns.map(key => {
        let val = getMeetingField(meeting, key);
        // Escape quotes and commas
        if (typeof val === 'string') {
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      })
    );
    const csvContent = [header, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meetings_export_${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExport(false);
  }

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
    const totalHeld = meetings.filter(m => m.held_at !== null && !m.no_show).length;
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

  // Filter meetings for selected month (use only scheduled_date)
  const monthMeetings = meetings.filter(meeting => 
    meeting.scheduled_date.startsWith(selectedMonth)
  );

  // Calculate monthly statistics (align with dashboard)
  const calculateMonthlyStats = (monthMeetings: Meeting[]): MeetingStats => {
    const totalBooked = monthMeetings.length;
    const totalHeld = monthMeetings.filter(m => m.held_at !== null && !m.no_show).length;
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
          <div className="flex gap-2 items-center">
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
            <button
              className="flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium shadow transition"
              onClick={() => setShowExport(true)}
              title="Export meetings"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Export Modal */}
        {showExport && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Export Meetings</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">Select columns to include:</p>
                <div className="grid grid-cols-2 gap-2">
                  {columnOptions.map(col => (
                    <label key={col.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(col.key)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedColumns([...selectedColumns, col.key]);
                          } else {
                            setSelectedColumns(selectedColumns.filter(k => k !== col.key));
                          }
                        }}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  onClick={() => setShowExport(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold"
                  onClick={exportCSV}
                  disabled={selectedColumns.length === 0}
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        )}

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