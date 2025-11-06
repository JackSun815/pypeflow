import { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle, Target, Clock, Search, Download, Hourglass } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { MeetingCard } from './MeetingCard';
import type { Meeting } from '../types/database';
import { DateTime } from 'luxon';

interface MeetingStats {
  totalBooked: number;
  totalHeld: number;
  totalNoShow: number;
  totalPending: number;
  showRate: number;
  noShowRate: number;
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
  const [modalType, setModalType] = useState<'set' | 'held' | 'booked' | 'noShows' | 'pending' | null>(null);

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
  const openMeetingsModal = (type: 'booked' | 'held' | 'noShows' | 'pending') => {
    setModalType(type);
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
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
    const totalPending = meetings.filter(m => m.status === 'pending' && !m.no_show && !m.held_at).length;
    const heldAndNoShow = totalHeld + totalNoShow;
    const showRate = heldAndNoShow > 0 ? (totalHeld / heldAndNoShow) * 100 : 0;
    const noShowRate = heldAndNoShow > 0 ? (totalNoShow / heldAndNoShow) * 100 : 0;

    return {
      totalBooked,
      totalHeld,
      totalNoShow,
      totalPending,
      showRate,
      noShowRate
    };
  };

  // Meetings SET: Filter by created_at (when SDR booked it) AND exclude non-ICP-qualified
  const monthMeetingsSet = meetings.filter(meeting => {
    const isInMonth = meeting.created_at.startsWith(selectedMonth);
    
    // Exclude non-ICP-qualified meetings
    const icpStatus = (meeting as any).icp_status;
    const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
    
    return isInMonth && !isICPDisqualified;
  });

  // Meetings HELD: Filter by scheduled_date (month it was scheduled for) AND exclude non-ICP-qualified
  const monthMeetingsHeld = meetings.filter(meeting => {
    const isInMonth = meeting.scheduled_date.startsWith(selectedMonth);
    
    // Must be actually held
    const isHeld = meeting.held_at !== null && !meeting.no_show;
    
    // Exclude non-ICP-qualified meetings
    const icpStatus = (meeting as any).icp_status;
    const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
    
    return isInMonth && isHeld && !isICPDisqualified;
  });

  // Calculate monthly statistics
  const calculateMonthlyStats = (): MeetingStats => {
    const totalBooked = monthMeetingsSet.length;
    const totalHeld = monthMeetingsHeld.length;
    const totalNoShow = monthMeetingsSet.filter(m => m.no_show).length;
    const totalPending = monthMeetingsSet.filter(m => m.status === 'pending' && !m.no_show && !m.held_at).length;
    const heldAndNoShow = totalHeld + totalNoShow;
    const showRate = heldAndNoShow > 0 ? (totalHeld / heldAndNoShow) * 100 : 0;
    const noShowRate = heldAndNoShow > 0 ? (totalNoShow / heldAndNoShow) * 100 : 0;

    return {
      totalBooked,
      totalHeld,
      totalNoShow,
      totalPending,
      showRate,
      noShowRate
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

  // For display purposes, combine all meetings from the month (both set and held)
  const allMonthMeetings = [...monthMeetingsSet];
  // Add held meetings that aren't already in set meetings
  monthMeetingsHeld.forEach(hm => {
    if (!allMonthMeetings.find(m => m.id === hm.id)) {
      allMonthMeetings.push(hm);
    }
  });

  // Filter meetings based on search term
  const filteredMeetings = allMonthMeetings.filter(meeting => {
    const searchString = `${(meeting as any).sdr_name || ''} ${(meeting as any).clients?.name || ''} ${meeting.contact_full_name || ''} ${meeting.contact_email || ''} ${meeting.contact_phone || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const allTimeStats = calculateAllTimeStats();
  const monthlyStats = calculateMonthlyStats();
  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label;

  return (
    <div className="space-y-6">
      {/* All-time Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">All-time Team Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
            <p className="text-sm text-gray-500">Total Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{allTimeStats.totalPending}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Held Rate</p>
            <p className="text-2xl font-bold text-indigo-600">
              {allTimeStats.showRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {(() => {
                const heldAndNoShow = allTimeStats.totalHeld + allTimeStats.totalNoShow;
                return `${allTimeStats.totalHeld} / ${heldAndNoShow}`;
              })()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">No Show Rate</p>
            <p className="text-2xl font-bold text-red-600">
              {allTimeStats.noShowRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {(() => {
                const heldAndNoShow = allTimeStats.totalHeld + allTimeStats.totalNoShow;
                return `${allTimeStats.totalNoShow} / ${heldAndNoShow}`;
              })()}
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

          <div 
            className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-yellow-50 transition-all duration-200 border-2 border-transparent hover:border-yellow-200"
            onClick={() => openMeetingsModal('pending')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Pending</h3>
              <Hourglass className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">{monthlyStats.totalPending}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Held Rate</h3>
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-indigo-600">
              {monthlyStats.showRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(() => {
                const heldAndNoShow = monthlyStats.totalHeld + monthlyStats.totalNoShow;
                return `${monthlyStats.totalHeld} / ${heldAndNoShow}`;
              })()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">No Show Rate</h3>
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">
              {monthlyStats.noShowRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(() => {
                const heldAndNoShow = monthlyStats.totalHeld + monthlyStats.totalNoShow;
                return `${monthlyStats.totalNoShow} / ${heldAndNoShow}`;
              })()}
            </p>
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
                 modalType === 'pending' ? 'Pending Meetings This Month' : 'Modal'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
            </div>
            
            <div className="space-y-4">
              {/* Summary section */}
              <div className={`p-4 rounded-lg ${
                modalType === 'booked' ? 'bg-indigo-50' :
                modalType === 'held' ? 'bg-green-50' :
                modalType === 'pending' ? 'bg-yellow-50' :
                'bg-red-50'
              }`}>
                <h4 className={`text-lg font-semibold mb-2 ${
                  modalType === 'booked' ? 'text-indigo-900' :
                  modalType === 'held' ? 'text-green-900' :
                  modalType === 'pending' ? 'text-yellow-900' :
                  'text-red-900'
                }`}>
                  {modalType === 'booked' ? 'All Meetings Booked This Month' :
                   modalType === 'held' ? 'Meetings Held This Month' :
                   modalType === 'pending' ? 'Pending Meetings This Month' :
                   'No-Show Meetings This Month'}
                </h4>
                <p className={`text-2xl font-bold ${
                  modalType === 'booked' ? 'text-indigo-700' :
                  modalType === 'held' ? 'text-green-700' :
                  modalType === 'pending' ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {modalType === 'booked' ? monthlyStats.totalBooked :
                   modalType === 'held' ? monthlyStats.totalHeld :
                   modalType === 'pending' ? monthlyStats.totalPending :
                   monthlyStats.totalNoShow}
                </p>
                <p className={`text-sm ${
                  modalType === 'booked' ? 'text-indigo-600' :
                  modalType === 'held' ? 'text-green-600' :
                  modalType === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {modalType === 'booked' ? 'Total meetings scheduled' :
                   modalType === 'held' ? 'Successfully held meetings' :
                   modalType === 'pending' ? 'Meetings awaiting confirmation' :
                   'Meetings marked as no-shows'}
                </p>
              </div>

              {/* Content based on modal type */}
              <div className="space-y-3">
                  {(() => {
                    let filteredMeetings: Meeting[] = [];
                    if (modalType === 'booked') {
                      filteredMeetings = monthMeetingsSet;
                    } else if (modalType === 'held') {
                      filteredMeetings = monthMeetingsHeld;
                    } else if (modalType === 'noShows') {
                      filteredMeetings = monthMeetingsSet.filter(m => m.no_show);
                    } else if (modalType === 'pending') {
                      filteredMeetings = monthMeetingsSet.filter(m => m.status === 'pending' && !m.no_show && !m.held_at);
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
                           modalType === 'pending' ? 'No pending meetings this month' :
                           'No no-show meetings this month'}
                        </p>
                      </div>
                    );
                  })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 