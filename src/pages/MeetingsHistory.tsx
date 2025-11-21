import React, { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle, TrendingUp, Target, Clock, Search, Download, Hourglass } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { MeetingCard } from '../components/MeetingCard';
import type { Meeting } from '../types/database';
import { DateTime } from 'luxon';
import { supabase } from '../lib/supabase';
import type { Assignment, Client } from '../types/database';

interface MeetingStats {
  totalBooked: number;
  totalHeld: number;
  totalNoShow: number;
  totalPending: number;
  showRate: number;
  noShowRate: number;
  percentToGoal: number;
}

interface MeetingsHistoryProps {
  meetings: Meeting[];
  loading: boolean;
  error: string | null;
  onUpdateHeldDate: (meetingId: string, heldDate: string | null) => void;
  onUpdateConfirmedDate: (meetingId: string, confirmedDate: string | null) => void;
  sdrId: string; // <-- Accept sdrId as a prop
  darkTheme?: boolean;
}

export default function MeetingsHistory({ 
  meetings, 
  loading, 
  error,
  onUpdateHeldDate,
  onUpdateConfirmedDate,
  sdrId,
  darkTheme = false
}: MeetingsHistoryProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    now.toISOString().slice(0, 7)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [goalType, setGoalType] = useState<'set' | 'held'>('set'); // Toggle for % to Goal
  // Filter, sort, and group state
  const [filterBy, setFilterBy] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'client' | 'contact'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState<'none' | 'client'>('none');
  // Export modal state
  const [showExport, setShowExport] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'client', 'contact', 'email', 'phone', 'date', 'status', 'notes'
  ]);

  // Assignment and modal state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'set' | 'held' | 'booked' | 'held' | 'noShows' | 'pending' | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);

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
    a.download = `meetings_export_${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExport(false);
  }

  // Fetch assignments for the selected month and sdrId
  React.useEffect(() => {
    if (!sdrId || !selectedMonth) {
      console.log('[DEBUG] Missing required data:', { sdrId, selectedMonth });
      return;
    }
    setAssignmentsLoading(true);
    setAssignmentsError(null);
    console.log('[DEBUG] Fetching assignments for:', { sdrId, selectedMonth });
    
    // First, let's check if there are any assignments at all for this SDR
    supabase
      .from('assignments')
      .select('*')
      .eq('sdr_id', sdrId as any)
      .then(({ data: allAssignments, error: allError }) => {
        console.log('[DEBUG] All assignments for SDR:', allAssignments);
        if (allError) console.log('[DEBUG] Error fetching all assignments:', allError);
      });

    // Now fetch assignments for the specific month with assignment targets
    supabase
      .from('assignments')
      .select(`
        id,
        sdr_id,
        client_id,
        monthly_target,
        monthly_set_target,
        monthly_hold_target,
        month,
        clients (
          id,
          name,
          monthly_set_target,
          monthly_hold_target
        )
      `)
      .eq('sdr_id', sdrId as any)
      .eq('month', selectedMonth as any)
      .then(({ data, error }) => {
        if (error) {
          console.log('[DEBUG] Error fetching assignments:', error);
          setAssignmentsError(error.message);
        } else {
          console.log('[DEBUG] Assignments data for month:', data);
          setAssignments((data ?? []) as unknown as Assignment[]);
        }
        setAssignmentsLoading(false);
      });
  }, [sdrId, selectedMonth]);



  // Fetch clients for assignments (when modal opens)
  React.useEffect(() => {
    if (!modalOpen || assignments.length === 0) return;
    setClientsLoading(true);
    setClientsError(null);
    const clientIds = assignments.map(a => a.client_id);
    if (clientIds.length === 0) {
      setClients([]);
      setClientsLoading(false);
      return;
    }
    supabase
      .from('clients')
      .select('*')
      .in('id', clientIds as any)
      .then(({ data, error }) => {
        if (error) setClientsError(error.message);
        else setClients((data ?? []) as unknown as Client[]);
        setClientsLoading(false);
      });
  }, [modalOpen, assignments]);

  // Calculate targets from assignments (sum up assignment targets, not client targets)
  const totalSetTarget = assignments.length > 0 
    ? assignments.reduce((sum, a) => {
        return sum + ((a as any).monthly_set_target || 0);
      }, 0)
    : 0; // Show 0 if no assignments for this month/SDR
  
  const totalHeldTarget = assignments.length > 0
    ? assignments.reduce((sum, a) => {
        return sum + ((a as any).monthly_hold_target || 0);
      }, 0)
    : 0; // Show 0 if no assignments for this month/SDR
  
  console.log('[DEBUG] totalSetTarget:', totalSetTarget, 'totalHeldTarget:', totalHeldTarget, 'assignments:', assignments);

  // Modal open helpers
  const openTargetModal = (type: 'set' | 'held') => {
    setModalType(type);
    setModalOpen(true);
  };
  
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

  // Calculate all-time statistics (exclude non-ICP-qualified meetings)
  const calculateAllTimeStats = (): MeetingStats => {
    // Filter out non-ICP-qualified meetings
    const icpQualifiedMeetings = meetings.filter(m => {
      const icpStatus = (m as any).icp_status;
      return icpStatus !== 'not_qualified' && icpStatus !== 'rejected' && icpStatus !== 'denied';
    });
    
    const totalBooked = icpQualifiedMeetings.length;
    const totalHeld = icpQualifiedMeetings.filter(m => m.held_at !== null && !m.no_show).length;
    const totalNoShow = icpQualifiedMeetings.filter(m => m.no_show).length;
    const totalPending = icpQualifiedMeetings.filter(m => m.status === 'pending' && !m.no_show && !m.held_at).length;
    const heldAndNoShow = totalHeld + totalNoShow;
    const showRate = heldAndNoShow > 0 ? (totalHeld / heldAndNoShow) * 100 : 0;
    const noShowRate = heldAndNoShow > 0 ? (totalNoShow / heldAndNoShow) * 100 : 0;

    return {
      totalBooked,
      totalHeld,
      totalNoShow,
      totalPending,
      showRate,
      noShowRate,
      percentToGoal: 0 // Not used anymore but kept for interface compatibility
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

  // Calculate monthly statistics (align with dashboard)
  const calculateMonthlyStats = (): MeetingStats => {
    const totalBooked = monthMeetingsSet.length;
    const totalHeld = monthMeetingsHeld.length;
    const totalNoShow = monthMeetingsSet.filter(m => m.no_show).length;
    const totalPending = monthMeetingsSet.filter(m => m.status === 'pending' && !m.no_show && !m.held_at).length;
    const heldAndNoShow = totalHeld + totalNoShow;
    const showRate = heldAndNoShow > 0 ? (totalHeld / heldAndNoShow) * 100 : 0;
    const noShowRate = heldAndNoShow > 0 ? (totalNoShow / heldAndNoShow) * 100 : 0;
    
    // Use the appropriate target based on goalType toggle
    const monthlyTarget = goalType === 'set' ? totalSetTarget : totalHeldTarget;
    const actualValue = goalType === 'set' ? totalBooked : totalHeld;
    const percentToGoal = monthlyTarget > 0 ? (actualValue / monthlyTarget) * 100 : 0;

    return {
      totalBooked,
      totalHeld,
      totalNoShow,
      totalPending,
      showRate,
      noShowRate,
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

  // For display purposes, combine all meetings from the month (both set and held)
  const allMonthMeetings = [...monthMeetingsSet];
  // Add held meetings that aren't already in set meetings
  monthMeetingsHeld.forEach(hm => {
    if (!allMonthMeetings.find(m => m.id === hm.id)) {
      allMonthMeetings.push(hm);
    }
  });

  // Get unique clients for filter dropdown
  const uniqueClients = Array.from(new Set(
    allMonthMeetings.map(m => (m as any).clients?.name).filter(Boolean)
  )) as string[];

  // Process meetings: filter, sort, and group
  const processMeetings = (meetings: Meeting[]) => {
    // Step 1: Search filter
    let filtered = meetings.filter(meeting => {
      const searchString = `${(meeting as any).clients?.name || ''} ${meeting.contact_full_name || ''} ${meeting.contact_email || ''} ${meeting.contact_phone || ''}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });

    // Step 2: Client filter
    if (filterBy !== 'all') {
      const clientName = filterBy.replace('client_', '');
      filtered = filtered.filter(meeting => (meeting as any).clients?.name === clientName);
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

    return { grouped: null, ungrouped: filtered };
  };

  const processedMeetings = processMeetings(allMonthMeetings);
  
  // For backward compatibility, create a flat array for the existing rendering
  const filteredMeetings = processedMeetings.ungrouped || 
    Object.values(processedMeetings.grouped || {}).flat();

  const allTimeStats = calculateAllTimeStats();
  const monthlyStats = calculateMonthlyStats();
  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label;

  // Debug logging for SDR Meeting History
  console.log('\n=== SDR DASHBOARD - MEETING HISTORY DEBUG ===');
  console.log('SDR ID:', sdrId);
  console.log('Selected Month:', selectedMonth);
  console.log(`Meetings SET (${monthMeetingsSet.length}):`, monthMeetingsSet.map(m => ({
    id: m.id,
    created_at: m.created_at,
    scheduled_date: m.scheduled_date,
    client_id: m.client_id,
    status: m.status,
    held_at: m.held_at,
    no_show: m.no_show
  })));
  console.log(`Meetings HELD (${monthMeetingsHeld.length}):`, monthMeetingsHeld.map(m => ({
    id: m.id,
    created_at: m.created_at,
    scheduled_date: m.scheduled_date,
    client_id: m.client_id,
    status: m.status,
    held_at: m.held_at,
    no_show: m.no_show
  })));
  console.log('=== END SDR MEETING HISTORY DEBUG ===\n');

  return (
    <div className="space-y-6">
      {/* All-time Stats */}
      <div className={`rounded-lg shadow-md p-6 ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
        <h2 className={`text-xl font-semibold mb-6 ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>All-time Performance</h2>
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
            <p className={`text-xs mt-1 ${darkTheme ? 'text-slate-500' : 'text-gray-500'}`}>
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
            <p className={`text-xs mt-1 ${darkTheme ? 'text-slate-500' : 'text-gray-500'}`}>
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

        {/* NEW TARGETS TO BE ADDED HERE */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
          {/* Monthly Set Target Card */}
          <div
            className={`rounded-lg p-4 cursor-pointer transition ${darkTheme ? 'bg-[#1d1f24] hover:bg-indigo-900/20 border border-[#2d3139] hover:border-indigo-800/50' : 'bg-gray-50 hover:bg-indigo-50'}`}
            onClick={() => openTargetModal('set')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-medium ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Monthly Set Target</h3>
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-indigo-400' : 'text-indigo-600'}`}>{totalSetTarget}</p>
          </div>
          {/* Monthly Held Target Card */}
          <div
            className={`rounded-lg p-4 cursor-pointer transition ${darkTheme ? 'bg-[#1d1f24] hover:bg-green-900/20 border border-[#2d3139] hover:border-green-800/50' : 'bg-gray-50 hover:bg-green-50'}`}
            onClick={() => openTargetModal('held')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-medium ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Monthly Held Target</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-green-400' : 'text-green-600'}`}>{totalHeldTarget}</p>
          </div>
          {/* Existing monthly stats cards */}
          <div 
            className={`rounded-lg p-4 cursor-pointer transition-all duration-200 border-2 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] hover:border-indigo-800/50 hover:bg-indigo-900/20' : 'bg-gray-50 border-transparent hover:border-indigo-200 hover:bg-indigo-50'}`}
            onClick={() => openMeetingsModal('booked')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-medium ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Meetings Booked</h3>
              <Calendar className="w-5 h-5 text-indigo-600" />
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

          <div className={`rounded-lg p-4 ${darkTheme ? 'bg-[#1d1f24] border border-[#2d3139]' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-medium ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>% to Goal</h3>
                <div className={`flex rounded-md border ${darkTheme ? 'border-[#2d3139] bg-[#232529]' : 'border-gray-300 bg-white'}`}>
                  <button
                    onClick={() => setGoalType('set')}
                    className={`px-2 py-0.5 text-xs font-medium transition-colors rounded-l-md ${
                      goalType === 'set'
                        ? 'bg-indigo-600 text-white'
                        : darkTheme ? 'text-slate-300 hover:bg-[#2d3139]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Set
                  </button>
                  <button
                    onClick={() => setGoalType('held')}
                    className={`px-2 py-0.5 text-xs font-medium transition-colors rounded-r-md ${
                      goalType === 'held'
                        ? 'bg-indigo-600 text-white'
                        : darkTheme ? 'text-slate-300 hover:bg-[#2d3139]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Held
                  </button>
                </div>
              </div>
              <TrendingUp className={`w-5 h-5 ${darkTheme ? 'text-slate-400' : 'text-gray-600'}`} />
            </div>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
              {monthlyStats.percentToGoal.toFixed(1)}%
            </p>
            <p className={`text-xs mt-1 ${darkTheme ? 'text-slate-500' : 'text-gray-500'}`}>
              {goalType === 'set' ? `${monthlyStats.totalBooked} / ${totalSetTarget}` : `${monthlyStats.totalHeld} / ${totalHeldTarget}`}
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
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
              />
              <Search className={`absolute left-3 top-2.5 w-4 h-4 ${darkTheme ? 'text-slate-500' : 'text-gray-400'}`} />
            </div>
            
            {/* Filter, Sort, Group Controls - Inline */}
            <div className="flex flex-wrap gap-3 items-end w-full lg:w-auto">
              <div className="flex-1 lg:flex-initial min-w-[140px]">
                <label className={`block text-xs font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Filter</label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkTheme ? 'bg-[#232529] border-[#2d3139] text-slate-100' : 'border-gray-300'
                  }`}
                >
                  <option value="all">All Clients</option>
                  {uniqueClients.map(clientName => (
                    <option key={clientName} value={`client_${clientName}`}>
                      {clientName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 lg:flex-initial min-w-[120px]">
                <label className={`block text-xs font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'client' | 'contact')}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkTheme ? 'bg-[#232529] border-[#2d3139] text-slate-100' : 'border-gray-300'
                  }`}
                >
                  <option value="date">Date</option>
                  <option value="client">Client</option>
                  <option value="contact">Contact</option>
                </select>
              </div>
              <div className="flex-1 lg:flex-initial min-w-[120px]">
                <label className={`block text-xs font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkTheme ? 'bg-[#232529] border-[#2d3139] text-slate-100' : 'border-gray-300'
                  }`}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
              <div className="flex-1 lg:flex-initial min-w-[120px]">
                <label className={`block text-xs font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Group By</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as 'none' | 'client')}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkTheme ? 'bg-[#232529] border-[#2d3139] text-slate-100' : 'border-gray-300'
                  }`}
                >
                  <option value="none">None</option>
                  <option value="client">Client</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Meetings List */}
        <div className="space-y-4">
          {groupBy === 'client' && processedMeetings.grouped ? (
            // Render grouped by client
            Object.entries(processedMeetings.grouped).map(([clientName, clientMeetings]) => (
              <div key={clientName} className="mb-6">
                <h4 className={`text-sm font-semibold mb-3 ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
                  {clientName} ({clientMeetings.length})
                </h4>
                <div className="space-y-4">
                  {clientMeetings.map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      onUpdateHeldDate={onUpdateHeldDate}
                      onUpdateConfirmedDate={onUpdateConfirmedDate}
                      showDateControls={true}
                      darkTheme={darkTheme}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Render ungrouped
            filteredMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onUpdateHeldDate={onUpdateHeldDate}
                onUpdateConfirmedDate={onUpdateConfirmedDate}
                showDateControls={true}
                darkTheme={darkTheme}
              />
            ))
          )}
          {filteredMeetings.length === 0 && (
            <p className={`text-center ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
              {searchTerm || filterBy !== 'all' ? 'No meetings found matching your filters' : 'No meetings for this month'}
            </p>
          )}
        </div>
      </div>
      {/* Modal for assigned clients and meetings */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className={`rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                {modalType === 'set' ? 'Monthly Set Target Clients' : 
                 modalType === 'held' ? 'Monthly Held Target Clients' :
                 modalType === 'booked' ? 'Meetings Booked This Month' :
                 modalType === 'noShows' ? 'No-Show Meetings This Month' :
                 modalType === 'pending' ? 'Pending Meetings This Month' : 'Modal'}
              </h3>
              <button onClick={closeModal} className={`text-2xl font-bold ${darkTheme ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}>&times;</button>
            </div>
            
            {/* Target modals (existing functionality) */}
            {(modalType === 'set' || modalType === 'held') && (
              <>
                {assignmentsLoading || clientsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                  </div>
                ) : assignmentsError || clientsError ? (
                  <div className={darkTheme ? 'text-red-400' : 'text-red-600'}>{assignmentsError || clientsError}</div>
                ) : (
                  <div>
                    {assignments.length === 0 ? (
                      <p className={darkTheme ? 'text-slate-400' : 'text-gray-500'}>No assignments for this month.</p>
                    ) : (
                      <ul className={`divide-y ${darkTheme ? 'divide-[#2d3139]' : 'divide-gray-200'}`}>
                        {assignments.map(a => {
                          const clientName = (a as any).clients?.name || clients.find(c => c.id === a.client_id)?.name || 'Client';
                          const target = modalType === 'set' ? (a as any).monthly_set_target : (a as any).monthly_hold_target;
                          return (
                            <li key={a.id} className={`py-2 flex justify-between items-center ${darkTheme ? 'text-slate-200' : ''}`}>
                              <span className={`font-medium ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>{clientName}</span>
                              <span className={darkTheme ? 'text-slate-400' : 'text-gray-600'}>Target: {target}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Meetings modals (new functionality) */}
            {(modalType === 'booked' || modalType === 'held' || modalType === 'noShows' || modalType === 'pending') && (
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
                    {modalType === 'booked' ? 'Meetings Booked This Month' :
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
                     modalType === 'held' ? 'Successfully completed meetings' :
                     modalType === 'pending' ? 'Meetings awaiting confirmation' :
                     'Meetings marked as no-shows'}
                  </p>
                </div>

                {/* Meetings list */}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}