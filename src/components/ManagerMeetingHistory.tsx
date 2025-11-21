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
  darkTheme?: boolean;
}

export default function ManagerMeetingHistory({ 
  meetings, 
  loading, 
  error,
  onUpdateHeldDate,
  onUpdateConfirmedDate,
  darkTheme = false
}: ManagerMeetingHistoryProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    now.toISOString().slice(0, 7)
  );
  const [searchTerm, setSearchTerm] = useState('');
  // Filter, sort, and group state (match SDR Meeting History UX)
  const [filterBy, setFilterBy] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'client' | 'contact' | 'sdr'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState<'none' | 'client' | 'sdr'>('none');
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
      <div className={`p-6 rounded-lg shadow-md ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
        <div className={`flex items-center gap-2 ${darkTheme ? 'text-red-400' : 'text-red-600'}`}>
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

  // Get unique SDRs and clients for filter dropdowns / grouping
  const uniqueClients = Array.from(
    new Set(
      allMonthMeetings.map(m => (m as any).clients?.name).filter(Boolean)
    )
  ) as string[];

  const uniqueSDRs = Array.from(
    new Set(
      allMonthMeetings.map(m => (m as any).sdr_name || 'Unknown SDR').filter(Boolean)
    )
  ) as string[];

  // Apply search, filter, sort, and grouping
  const processMeetings = (sourceMeetings: Meeting[]) => {
    // Step 1: Search filter
    let filtered = sourceMeetings.filter(meeting => {
      const searchString = `${(meeting as any).sdr_name || ''} ${(meeting as any).clients?.name || ''} ${meeting.contact_full_name || ''} ${meeting.contact_email || ''} ${meeting.contact_phone || ''}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });

    // Step 2: Filter by client or SDR
    if (filterBy !== 'all') {
      if (filterBy.startsWith('client_')) {
        const clientName = filterBy.replace('client_', '');
        filtered = filtered.filter(meeting => (meeting as any).clients?.name === clientName);
      } else if (filterBy.startsWith('sdr_')) {
        const sdrName = filterBy.replace('sdr_', '');
        filtered = filtered.filter(meeting => ((meeting as any).sdr_name || 'Unknown SDR') === sdrName);
      }
    }

    // Step 3: Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        const dateA = new Date(a.scheduled_date).getTime();
        const dateB = new Date(b.scheduled_date).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === 'client') {
        const clientA = ((a as any).clients?.name || '').toLowerCase();
        const clientB = ((b as any).clients?.name || '').toLowerCase();
        comparison = clientA.localeCompare(clientB);
      } else if (sortBy === 'contact') {
        const contactA = (a.contact_full_name || '').toLowerCase();
        const contactB = (b.contact_full_name || '').toLowerCase();
        comparison = contactA.localeCompare(contactB);
      } else if (sortBy === 'sdr') {
        const sdrA = ((a as any).sdr_name || 'Unknown SDR').toLowerCase();
        const sdrB = ((b as any).sdr_name || 'Unknown SDR').toLowerCase();
        comparison = sdrA.localeCompare(sdrB);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Step 4: Group
    if (groupBy === 'client') {
      const grouped: Record<string, Meeting[]> = {};
      filtered.forEach(meeting => {
        const clientName = (meeting as any).clients?.name || 'No Client';
        if (!grouped[clientName]) {
          grouped[clientName] = [];
        }
        grouped[clientName].push(meeting);
      });
      return { grouped, ungrouped: null };
    }

    if (groupBy === 'sdr') {
      const grouped: Record<string, Meeting[]> = {};
      filtered.forEach(meeting => {
        const sdrName = (meeting as any).sdr_name || 'Unknown SDR';
        if (!grouped[sdrName]) {
          grouped[sdrName] = [];
        }
        grouped[sdrName].push(meeting);
      });
      return { grouped, ungrouped: null };
    }

    return { grouped: null, ungrouped: filtered };
  };

  const processedMeetings = processMeetings(allMonthMeetings);

  // For rendering and exports, flatten grouped structure into a single array
  const filteredMeetings =
    processedMeetings.ungrouped ||
    Object.values(processedMeetings.grouped || {}).flat();

  const allTimeStats = calculateAllTimeStats();
  const monthlyStats = calculateMonthlyStats();
  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label;

  return (
    <div className="space-y-6">
      {/* All-time Stats */}
      <div className={`rounded-lg shadow-md p-6 ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
        <h2 className={`text-xl font-semibold mb-6 ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>All-time Team Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Total Meetings Booked</p>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>{allTimeStats.totalBooked}</p>
          </div>
          <div>
            <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Total Meetings Held</p>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-green-400' : 'text-green-600'}`}>{allTimeStats.totalHeld}</p>
          </div>
          <div>
            <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Total No Shows</p>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-red-400' : 'text-red-600'}`}>{allTimeStats.totalNoShow}</p>
          </div>
          <div>
            <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Total Pending</p>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-yellow-400' : 'text-yellow-600'}`}>{allTimeStats.totalPending}</p>
          </div>
          <div>
            <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Held Rate</p>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-indigo-400' : 'text-indigo-600'}`}>
              {allTimeStats.showRate.toFixed(1)}%
            </p>
            <p className={`text-xs ${darkTheme ? 'text-slate-500' : 'text-gray-500'}`}>
              {(() => {
                const heldAndNoShow = allTimeStats.totalHeld + allTimeStats.totalNoShow;
                return `${allTimeStats.totalHeld} / ${heldAndNoShow}`;
              })()}
            </p>
          </div>
          <div>
            <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>No Show Rate</p>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-red-400' : 'text-red-600'}`}>
              {allTimeStats.noShowRate.toFixed(1)}%
            </p>
            <p className={`text-xs ${darkTheme ? 'text-slate-500' : 'text-gray-500'}`}>
              {(() => {
                const heldAndNoShow = allTimeStats.totalHeld + allTimeStats.totalNoShow;
                return `${allTimeStats.totalNoShow} / ${heldAndNoShow}`;
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Stats and Controls */}
      <div className={`rounded-lg shadow-md p-6 ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>{selectedMonthLabel}</h2>
          <div className="flex gap-2 items-center">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
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
            <div className={`rounded-lg shadow-xl p-6 w-full max-w-md ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>Export Meetings</h3>
              <div className="mb-4">
                <p className={`text-sm mb-2 ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>Select columns to include:</p>
                <div className="grid grid-cols-2 gap-2">
                  {columnOptions.map(col => (
                    <label key={col.key} className={`flex items-center gap-2 text-sm ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>
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
                        className={darkTheme ? 'accent-indigo-500' : ''}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className={`px-4 py-2 rounded-md ${darkTheme ? 'text-slate-200 bg-[#2d3139] hover:bg-[#353941]' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
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
            className={`rounded-lg p-4 cursor-pointer transition-all duration-200 border-2 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] hover:border-blue-800/50 hover:bg-blue-900/20' : 'bg-gray-50 border-transparent hover:border-blue-200 hover:bg-blue-50'}`}
            onClick={() => openMeetingsModal('booked')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-medium ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Meetings Booked</h3>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>{monthlyStats.totalBooked}</p>
          </div>

          <div 
            className={`rounded-lg p-4 cursor-pointer transition-all duration-200 border-2 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] hover:border-green-800/50 hover:bg-green-900/20' : 'bg-gray-50 border-transparent hover:border-green-200 hover:bg-green-50'}`}
            onClick={() => openMeetingsModal('held')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-medium ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Meetings Held</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-green-400' : 'text-green-600'}`}>{monthlyStats.totalHeld}</p>
          </div>

          <div 
            className={`rounded-lg p-4 cursor-pointer transition-all duration-200 border-2 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] hover:border-red-800/50 hover:bg-red-900/20' : 'bg-gray-50 border-transparent hover:border-red-200 hover:bg-red-50'}`}
            onClick={() => openMeetingsModal('noShows')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-medium ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>No Shows</h3>
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-red-400' : 'text-red-600'}`}>{monthlyStats.totalNoShow}</p>
          </div>

          <div 
            className={`rounded-lg p-4 cursor-pointer transition-all duration-200 border-2 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] hover:border-yellow-800/50 hover:bg-yellow-900/20' : 'bg-gray-50 border-transparent hover:border-yellow-200 hover:bg-yellow-50'}`}
            onClick={() => openMeetingsModal('pending')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-medium ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Pending</h3>
              <Hourglass className="w-5 h-5 text-yellow-600" />
            </div>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-yellow-400' : 'text-yellow-600'}`}>{monthlyStats.totalPending}</p>
          </div>

          <div className={`rounded-lg p-4 ${darkTheme ? 'bg-[#1d1f24] border border-[#2d3139]' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-medium ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Held Rate</h3>
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-indigo-400' : 'text-indigo-600'}`}>
              {monthlyStats.showRate.toFixed(1)}%
            </p>
            <p className={`text-xs mt-1 ${darkTheme ? 'text-slate-500' : 'text-gray-500'}`}>
              {(() => {
                const heldAndNoShow = monthlyStats.totalHeld + monthlyStats.totalNoShow;
                return `${monthlyStats.totalHeld} / ${heldAndNoShow}`;
              })()}
            </p>
          </div>
          <div className={`rounded-lg p-4 ${darkTheme ? 'bg-[#1d1f24] border border-[#2d3139]' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-medium ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>No Show Rate</h3>
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-red-400' : 'text-red-600'}`}>
              {monthlyStats.noShowRate.toFixed(1)}%
            </p>
            <p className={`text-xs mt-1 ${darkTheme ? 'text-slate-500' : 'text-gray-500'}`}>
              {(() => {
                const heldAndNoShow = monthlyStats.totalHeld + monthlyStats.totalNoShow;
                return `${monthlyStats.totalNoShow} / ${heldAndNoShow}`;
              })()}
            </p>
          </div>
        </div>

        {/* Search Bar and Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search Bar */}
            <div className="relative flex-1 w-full lg:w-auto min-w-[300px]">
              <input
                type="text"
                placeholder="Search meetings by SDR, client, contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                  darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'
                }`}
              />
              <Search
                className={`absolute left-3 top-2.5 w-4 h-4 ${
                  darkTheme ? 'text-slate-500' : 'text-gray-400'
                }`}
              />
            </div>

            {/* Filter, Sort, Group Controls */}
            <div className="flex flex-wrap gap-3 items-end w-full lg:w-auto">
              {/* Filter */}
              <div className="flex-1 lg:flex-initial min-w-[160px]">
                <label
                  className={`block text-xs font-medium mb-1 ${
                    darkTheme ? 'text-slate-200' : 'text-gray-700'
                  }`}
                >
                  Filter
                </label>
                <select
                  value={filterBy}
                  onChange={e => setFilterBy(e.target.value)}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkTheme ? 'bg-[#232529] border-[#2d3139] text-slate-100' : 'border-gray-300'
                  }`}
                >
                  <option value="all">All Meetings</option>
                  {uniqueClients.length > 0 && (
                    <optgroup label="By Client">
                      {uniqueClients.map(clientName => (
                        <option key={`client_${clientName}`} value={`client_${clientName}`}>
                          {clientName}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {uniqueSDRs.length > 0 && (
                    <optgroup label="By SDR">
                      {uniqueSDRs.map(sdrName => (
                        <option key={`sdr_${sdrName}`} value={`sdr_${sdrName}`}>
                          {sdrName}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Sort By */}
              <div className="flex-1 lg:flex-initial min-w-[140px]">
                <label
                  className={`block text-xs font-medium mb-1 ${
                    darkTheme ? 'text-slate-200' : 'text-gray-700'
                  }`}
                >
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={e =>
                    setSortBy(e.target.value as 'date' | 'client' | 'contact' | 'sdr')
                  }
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkTheme ? 'bg-[#232529] border-[#2d3139] text-slate-100' : 'border-gray-300'
                  }`}
                >
                  <option value="date">Date</option>
                  <option value="client">Client</option>
                  <option value="contact">Contact</option>
                  <option value="sdr">SDR</option>
                </select>
              </div>

              {/* Order */}
              <div className="flex-1 lg:flex-initial min-w-[120px]">
                <label
                  className={`block text-xs font-medium mb-1 ${
                    darkTheme ? 'text-slate-200' : 'text-gray-700'
                  }`}
                >
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkTheme ? 'bg-[#232529] border-[#2d3139] text-slate-100' : 'border-gray-300'
                  }`}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>

              {/* Group By */}
              <div className="flex-1 lg:flex-initial min-w-[140px]">
                <label
                  className={`block text-xs font-medium mb-1 ${
                    darkTheme ? 'text-slate-200' : 'text-gray-700'
                  }`}
                >
                  Group By
                </label>
                <select
                  value={groupBy}
                  onChange={e => setGroupBy(e.target.value as 'none' | 'client' | 'sdr')}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkTheme ? 'bg-[#232529] border-[#2d3139] text-slate-100' : 'border-gray-300'
                  }`}
                >
                  <option value="none">None</option>
                  <option value="client">Client</option>
                  <option value="sdr">SDR</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Meetings List */}
        <div className="space-y-4">
          {groupBy !== 'none' && processedMeetings.grouped ? (
            // Render grouped by client or SDR
            Object.entries(processedMeetings.grouped).map(([groupLabel, groupMeetings]) => (
              <div key={groupLabel} className="mb-6">
                <h4
                  className={`text-sm font-semibold mb-3 ${
                    darkTheme ? 'text-slate-300' : 'text-gray-700'
                  }`}
                >
                  {groupLabel} ({groupMeetings.length})
                </h4>
                <div className="space-y-4">
                  {groupMeetings.map(meeting => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      onUpdateHeldDate={onUpdateHeldDate}
                      onUpdateConfirmedDate={onUpdateConfirmedDate}
                      showDateControls={true}
                      showSDR={true}
                      darkTheme={darkTheme}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Render ungrouped
            filteredMeetings.map(meeting => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onUpdateHeldDate={onUpdateHeldDate}
                onUpdateConfirmedDate={onUpdateConfirmedDate}
                showDateControls={true}
                showSDR={true}
                darkTheme={darkTheme}
              />
            ))
          )}
          {filteredMeetings.length === 0 && (
            <p className={`text-center ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
              {searchTerm || filterBy !== 'all'
                ? 'No meetings found matching your filters'
                : 'No meetings for this month'}
            </p>
          )}
        </div>
      </div>

      {/* Modal for meetings breakdown */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className={`rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                {modalType === 'booked' ? 'All Meetings Booked This Month' :
                 modalType === 'held' ? 'Meetings Held This Month' :
                 modalType === 'noShows' ? 'No-Show Meetings This Month' :
                 modalType === 'pending' ? 'Pending Meetings This Month' : 'Modal'}
              </h3>
              <button onClick={closeModal} className={`text-2xl font-bold ${darkTheme ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}>&times;</button>
            </div>
            
            <div className="space-y-4">
              {/* Summary section */}
              <div className={`p-4 rounded-lg ${
                modalType === 'booked' ? (darkTheme ? 'bg-indigo-900/20' : 'bg-indigo-50') :
                modalType === 'held' ? (darkTheme ? 'bg-green-900/20' : 'bg-green-50') :
                modalType === 'pending' ? (darkTheme ? 'bg-yellow-900/20' : 'bg-yellow-50') :
                (darkTheme ? 'bg-red-900/20' : 'bg-red-50')
              }`}>
                <h4 className={`text-lg font-semibold mb-2 ${
                  modalType === 'booked' ? (darkTheme ? 'text-indigo-200' : 'text-indigo-900') :
                  modalType === 'held' ? (darkTheme ? 'text-green-200' : 'text-green-900') :
                  modalType === 'pending' ? (darkTheme ? 'text-yellow-200' : 'text-yellow-900') :
                  (darkTheme ? 'text-red-200' : 'text-red-900')
                }`}>
                  {modalType === 'booked' ? 'All Meetings Booked This Month' :
                   modalType === 'held' ? 'Meetings Held This Month' :
                   modalType === 'pending' ? 'Pending Meetings This Month' :
                   'No-Show Meetings This Month'}
                </h4>
                <p className={`text-2xl font-bold ${
                  modalType === 'booked' ? (darkTheme ? 'text-indigo-300' : 'text-indigo-700') :
                  modalType === 'held' ? (darkTheme ? 'text-green-300' : 'text-green-700') :
                  modalType === 'pending' ? (darkTheme ? 'text-yellow-300' : 'text-yellow-700') :
                  (darkTheme ? 'text-red-300' : 'text-red-700')
                }`}>
                  {modalType === 'booked' ? monthlyStats.totalBooked :
                   modalType === 'held' ? monthlyStats.totalHeld :
                   modalType === 'pending' ? monthlyStats.totalPending :
                   monthlyStats.totalNoShow}
                </p>
                <p className={`text-sm ${
                  modalType === 'booked' ? (darkTheme ? 'text-indigo-300' : 'text-indigo-600') :
                  modalType === 'held' ? (darkTheme ? 'text-green-300' : 'text-green-600') :
                  modalType === 'pending' ? (darkTheme ? 'text-yellow-300' : 'text-yellow-600') :
                  (darkTheme ? 'text-red-300' : 'text-red-600')
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
                          darkTheme={darkTheme}
                        />
                      ))
                    ) : (
                      <div className={`text-center py-8 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                        <Calendar className={`w-12 h-12 mx-auto mb-2 ${darkTheme ? 'text-slate-600' : 'text-gray-300'}`} />
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