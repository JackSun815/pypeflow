import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, AlertCircle, TrendingUp, Target, Clock, Search, Download, Users } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { MeetingCard } from './MeetingCard';
import type { Meeting } from '../types/database';
import { DateTime } from 'luxon';
import { supabase } from '../lib/supabase';
import type { Assignment, Client } from '../types/database';

interface MeetingStats {
  totalBooked: number;
  totalHeld: number;
  totalNoShow: number;
  showRate: number;
  percentToGoal: number;
}

interface ManagerMeetingHistoryProps {
  meetings: Meeting[];
  loading: boolean;
  error: string | null;
  onUpdateHeldDate: (meetingId: string, heldDate: string | null) => Promise<void>;
  onUpdateConfirmedDate: (meetingId: string, confirmedDate: string | null) => Promise<void>;
}

export default function ManagerMeetingHistory({ 
  meetings, 
  loading, 
  error,
  onUpdateHeldDate,
  onUpdateConfirmedDate
}: ManagerMeetingHistoryProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    now.toISOString().slice(0, 7)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'sdr', 'client', 'contact', 'email', 'phone', 'date', 'status', 'notes'
  ]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'set' | 'held' | 'booked' | 'noShows' | 'bySDR' | null>(null);
  const [modalMeetings, setModalMeetings] = useState<Meeting[]>([]);
  const [modalTitle, setModalTitle] = useState('');

  const columnOptions = [
    { key: 'sdr', label: 'SDR Name' },
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
      case 'sdr': return (meeting as any).sdr_name || 'Unknown SDR';
      case 'client': return (meeting as any).clients?.name || '';
      case 'contact': return meeting.contact_full_name || '';
      case 'email': return meeting.contact_email || '';
      case 'phone': return meeting.contact_phone || '';
      case 'date':
        if (meeting.scheduled_date) {
          const timezone = meeting.timezone || 'America/New_York';
          const dt = DateTime.fromISO(meeting.scheduled_date, { zone: timezone });
          return dt.toFormat('ccc, LLL d, h:mm a') + ' ' + (dt.offsetNameShort || timezone);
        }
        return '';
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
    a.download = `manager_meetings_export_${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExport(false);
  }

  // Modal open helpers
  const openMeetingsModal = (type: 'booked' | 'held' | 'noShows' | 'bySDR') => {
    setModalType(type);
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalMeetings([]);
    setModalTitle('');
  };

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

  // Filter meetings for selected month (use created_at instead of scheduled_date)
  const monthMeetings = meetings.filter(meeting => 
    meeting.created_at.startsWith(selectedMonth)
  );

  // Calculate monthly statistics
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
  let monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(now, i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    };
  });
  // Always add the next month as an option at the start
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  monthOptions = [
    {
      value: format(nextMonth, 'yyyy-MM'),
      label: format(nextMonth, 'MMMM yyyy')
    },
    ...monthOptions
  ];

  // Filter meetings based on search term
  const filteredMeetings = monthMeetings.filter(meeting => {
    const searchString = `${(meeting as any).sdr_name || ''} ${(meeting as any).clients?.name || ''} ${meeting.contact_full_name || ''} ${meeting.contact_email || ''} ${meeting.contact_phone || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const allTimeStats = calculateAllTimeStats();
  const monthlyStats = calculateMonthlyStats(monthMeetings);
  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label;

  // Group meetings by SDR for the modal
  const meetingsBySDR = monthMeetings.reduce((acc, meeting) => {
    const sdrName = (meeting as any).sdr_name || 'Unknown SDR';
    if (!acc[sdrName]) {
      acc[sdrName] = [];
    }
    acc[sdrName].push(meeting);
    return acc;
  }, {} as Record<string, Meeting[]>);

  return (
    <div className="space-y-6">
      {/* All-time Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">All-time Team Performance</h2>
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
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow transition"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                  onClick={exportCSV}
                  disabled={selectedColumns.length === 0}
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
          <div 
            className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-all duration-200 border-2 border-transparent hover:border-blue-200"
            onClick={() => openMeetingsModal('booked')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Meetings Booked</h3>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{monthlyStats.totalBooked}</p>
          </div>

          <div 
            className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-green-50 transition-all duration-200 border-2 border-transparent hover:border-green-200"
            onClick={() => openMeetingsModal('held')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Meetings Held</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{monthlyStats.totalHeld}</p>
          </div>

          <div 
            className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-red-50 transition-all duration-200 border-2 border-transparent hover:border-red-200"
            onClick={() => openMeetingsModal('noShows')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">No Shows</h3>
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{monthlyStats.totalNoShow}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Show Rate</h3>
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {monthlyStats.showRate.toFixed(1)}%
            </p>
          </div>

          <div 
            className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-all duration-200 border-2 border-transparent hover:border-blue-200"
            onClick={() => openMeetingsModal('bySDR')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">By SDR</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{Object.keys(meetingsBySDR).length}</p>
            <p className="text-xs text-gray-500">SDRs</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search meetings by SDR, client, contact..."
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
              showSDR={true}
            />
          ))}
          {filteredMeetings.length === 0 && (
            <p className="text-center text-gray-500">
              {searchTerm ? 'No meetings found matching your search' : 'No meetings for this month'}
            </p>
          )}
        </div>
      </div>

      {/* Modal for meetings breakdown */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {modalType === 'booked' ? 'All Meetings Booked This Month' :
                 modalType === 'held' ? 'Meetings Held This Month' :
                 modalType === 'noShows' ? 'No-Show Meetings This Month' :
                 modalType === 'bySDR' ? 'Meetings by SDR This Month' : 'Modal'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
            </div>
            
            <div className="space-y-4">
              {/* Summary section */}
              <div className={`p-4 rounded-lg ${
                modalType === 'booked' ? 'bg-indigo-50' :
                modalType === 'held' ? 'bg-green-50' :
                modalType === 'noShows' ? 'bg-red-50' :
                'bg-blue-50'
              }`}>
                <h4 className={`text-lg font-semibold mb-2 ${
                  modalType === 'booked' ? 'text-indigo-900' :
                  modalType === 'held' ? 'text-green-900' :
                  modalType === 'noShows' ? 'text-red-900' :
                  'text-blue-900'
                }`}>
                  {modalType === 'booked' ? 'All Meetings Booked This Month' :
                   modalType === 'held' ? 'Meetings Held This Month' :
                   modalType === 'noShows' ? 'No-Show Meetings This Month' :
                   'Meetings by SDR This Month'}
                </h4>
                <p className={`text-2xl font-bold ${
                  modalType === 'booked' ? 'text-indigo-700' :
                  modalType === 'held' ? 'text-green-700' :
                  modalType === 'noShows' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  {modalType === 'booked' ? monthlyStats.totalBooked :
                   modalType === 'held' ? monthlyStats.totalHeld :
                   modalType === 'noShows' ? monthlyStats.totalNoShow :
                   Object.keys(meetingsBySDR).length}
                </p>
                <p className={`text-sm ${
                  modalType === 'booked' ? 'text-indigo-600' :
                  modalType === 'held' ? 'text-green-600' :
                  modalType === 'noShows' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {modalType === 'booked' ? 'Total meetings scheduled' :
                   modalType === 'held' ? 'Successfully completed meetings' :
                   modalType === 'noShows' ? 'Meetings marked as no-shows' :
                   'Number of SDRs with meetings'}
                </p>
              </div>

              {/* Content based on modal type */}
              {modalType === 'bySDR' ? (
                <div className="space-y-4">
                  {Object.entries(meetingsBySDR).map(([sdrName, sdrMeetings]) => {
                    const sdrStats = calculateMonthlyStats(sdrMeetings);
                    return (
                      <div key={sdrName} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-semibold text-gray-900 mb-3">{sdrName}</h5>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Booked</p>
                            <p className="text-lg font-bold text-gray-900">{sdrStats.totalBooked}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Held</p>
                            <p className="text-lg font-bold text-green-600">{sdrStats.totalHeld}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">No Shows</p>
                            <p className="text-lg font-bold text-red-600">{sdrStats.totalNoShow}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Show Rate</p>
                            <p className="text-lg font-bold text-indigo-600">{sdrStats.showRate.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {sdrMeetings.map((meeting) => (
                            <MeetingCard
                              key={meeting.id}
                              meeting={meeting}
                              onUpdateHeldDate={onUpdateHeldDate}
                              onUpdateConfirmedDate={onUpdateConfirmedDate}
                              showDateControls={true}
                              showSDR={false}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    let filteredMeetings: Meeting[] = [];
                    if (modalType === 'booked') {
                      filteredMeetings = monthMeetings;
                    } else if (modalType === 'held') {
                      filteredMeetings = monthMeetings.filter(m => m.held_at !== null && !m.no_show);
                    } else if (modalType === 'noShows') {
                      filteredMeetings = monthMeetings.filter(m => m.no_show);
                    }
                    
                    return filteredMeetings.length > 0 ? (
                      filteredMeetings.map((meeting) => (
                        <MeetingCard
                          key={meeting.id}
                          meeting={meeting}
                          onUpdateHeldDate={onUpdateHeldDate}
                          onUpdateConfirmedDate={onUpdateConfirmedDate}
                          showDateControls={true}
                          showSDR={true}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>
                          {modalType === 'booked' ? 'No meetings booked this month' :
                           modalType === 'held' ? 'No meetings held this month' :
                           'No no-show meetings this month'}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 