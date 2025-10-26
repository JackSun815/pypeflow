import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { useSDRs } from '../hooks/useSDRs';
import { useAllClients } from '../hooks/useAllClients';
import { useMeetings } from '../hooks/useMeetings';
import { useAgency } from '../contexts/AgencyContext';
import { supabase } from '../lib/supabase';
import UnifiedMeetingLists from '../components/UnifiedMeetingLists';
import type { Meeting } from '../types/database';
import CalendarView from '../components/CalendarView';

export default function TeamMeetings({
  fetchSDRs,
}: {
  meetings: Meeting[];
  fetchSDRs: () => void;
}) {
  const { agency } = useAgency();
  const { sdrs, loading: sdrsLoading } = useSDRs();
  const { clients, loading: clientsLoading } = useAllClients();
  const [selectedSDR, setSelectedSDR] = useState<string | 'all'>('all');
  const [selectedClient, setSelectedClient] = useState<string | 'all'>('all');
  const [allMeetings, setAllMeetings] = useState<(Meeting & { sdr_name?: string })[]>([]);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  
  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    dateRange: 'all', // 'all', 'currentMonth', 'custom'
    startDate: '',
    endDate: '',
    status: 'all', // 'all', 'confirmed', 'pending', 'noShow'
    clientIds: [] as string[],
    sdrIds: [] as string[],
    includeFields: {
      clientInfo: true,
      sdrInfo: true,
      meetingDetails: true,
      timestamps: true
    }
  });

  // Get meetings for the selected SDR
  const { meetings: selectedSDRMeetings } = useMeetings(selectedSDR === 'all' ? null : selectedSDR);

  // Effect to combine all SDR meetings when "all" is selected
  useEffect(() => {
    async function fetchAllMeetings() {
      if (selectedSDR === 'all' && agency?.id) {
        const allSDRMeetings = await Promise.all(
          sdrs.map(async (sdr) => {
            const { data } = await supabase
              .from('meetings')
              .select('*, clients(name)')
              .eq('agency_id', agency.id as any)
              .eq('sdr_id', sdr.id as any);
            
            return (data || []).map((meeting: any) => ({
              ...meeting,
              sdr_name: sdr.full_name || ''
            }));
          })
        );

        setAllMeetings(allSDRMeetings.flat() as any);
      } else {
        setAllMeetings(selectedSDRMeetings.map(meeting => ({
          ...meeting,
          sdr_name: sdrs.find(sdr => sdr.id === selectedSDR)?.full_name || ''
        })));
      }
    }

    fetchAllMeetings();
  }, [selectedSDR, sdrs, selectedSDRMeetings, agency?.id]);

  // Filter meetings by selected client and exclude non-ICP-qualified meetings
  const filteredMeetings = allMeetings.filter(meeting => {
    // Exclude meetings that are marked as not ICP qualified
    const icpStatus = (meeting as any).icp_status;
    const isNotQualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
    if (isNotQualified) return false;
    
    if (selectedClient === 'all') return true;
    return meeting.client_id === selectedClient;
  });

  const handleDeleteMeeting = async (meetingId: string) => {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', meetingId as any);

    if (error) {
      console.error('Error deleting meeting:', error);
    } else {
      setAllMeetings(allMeetings.filter(meeting => meeting.id !== meetingId));
      fetchSDRs();
    }
  };

  const handleSaveMeeting = async (updatedMeeting: Meeting) => {
    const { error } = await supabase
      .from('meetings')
      .update({
        scheduled_date: updatedMeeting.scheduled_date,
        status: updatedMeeting.status,
        no_show: updatedMeeting.no_show,
        company: updatedMeeting.company,           // <-- add this
        linkedin_page: updatedMeeting.linkedin_page, // <-- add this
        notes: updatedMeeting.notes,               // <-- add this
        contact_full_name: updatedMeeting.contact_full_name, // (optional, for completeness)
        contact_email: updatedMeeting.contact_email,         // (optional)
        contact_phone: updatedMeeting.contact_phone,         // (optional)
      } as any)
      .eq('id', updatedMeeting.id as any);

    if (error) {
      console.error('Error updating meeting:', error);
    } else {
      setAllMeetings(allMeetings.map(meeting => 
        meeting.id === updatedMeeting.id ? updatedMeeting : meeting
      ));
      fetchSDRs();
      setEditingMeetingId(null);
    }
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeetingId(meeting.id);
  };

  // Drag and drop status change handler
  const handleMeetingStatusChange = async (meetingId: string, newStatus: 'pending' | 'confirmed' | 'held' | 'no-show') => {
    try {
      const updates: any = {};
      
      if (newStatus === 'held') {
        // Mark as held
        updates.held_at = new Date().toISOString();
        updates.no_show = false;
      } else if (newStatus === 'no-show') {
        // Mark as no-show
        updates.no_show = true;
        updates.held_at = null;
      } else if (newStatus === 'confirmed') {
        // Mark as confirmed
        updates.status = 'confirmed';
        updates.confirmed_at = new Date().toISOString();
        updates.held_at = null;
        updates.no_show = false;
      } else if (newStatus === 'pending') {
        // Mark as pending
        updates.status = 'pending';
        updates.confirmed_at = null;
        updates.held_at = null;
        updates.no_show = false;
      }
      
      const { error } = await supabase
        .from('meetings')
        .update(updates as any)
        .eq('id', meetingId as any);
      
      if (error) throw error;
      
      // Refetch all meetings to update the UI immediately
      const updatedMeetings = allMeetings.map(meeting => 
        meeting.id === meetingId ? { ...meeting, ...updates } : meeting
      );
      setAllMeetings(updatedMeetings);
      fetchSDRs();
    } catch (error) {
      console.error('Failed to update meeting status:', error);
    }
  };

  // Export function for Team's Meetings (organized by SDR)
  const exportTeamMeetings = async () => {
    try {
      // Apply filters to get the meetings to export
      let meetingsToExport = filteredMeetings;

      // Apply date range filter
      if (exportFilters.dateRange === 'currentMonth') {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        meetingsToExport = meetingsToExport.filter(meeting => {
          const meetingDate = new Date(meeting.scheduled_date);
          return meetingDate >= monthStart && meetingDate <= monthEnd;
        });
      } else if (exportFilters.dateRange === 'custom' && exportFilters.startDate && exportFilters.endDate) {
        meetingsToExport = meetingsToExport.filter(meeting => {
          const meetingDate = new Date(meeting.scheduled_date);
          const startDate = new Date(exportFilters.startDate);
          const endDate = new Date(exportFilters.endDate);
          return meetingDate >= startDate && meetingDate <= endDate;
        });
      }

      // Apply status filter
      if (exportFilters.status !== 'all') {
        if (exportFilters.status === 'noShow') {
          meetingsToExport = meetingsToExport.filter(meeting => meeting.no_show);
        } else {
          meetingsToExport = meetingsToExport.filter(meeting => meeting.status === exportFilters.status);
        }
      }

      // Apply client filter
      if (exportFilters.clientIds.length > 0) {
        meetingsToExport = meetingsToExport.filter(meeting => 
          exportFilters.clientIds.includes(meeting.client_id)
        );
      }

      // Apply SDR filter
      if (exportFilters.sdrIds.length > 0) {
        meetingsToExport = meetingsToExport.filter(meeting => 
          exportFilters.sdrIds.includes(meeting.sdr_id)
        );
      }

      // Group meetings by SDR
      const meetingsBySDR = meetingsToExport.reduce((acc, meeting) => {
        const sdrId = meeting.sdr_id;
        if (!acc[sdrId]) {
          acc[sdrId] = [];
        }
        acc[sdrId].push(meeting);
        return acc;
      }, {} as Record<string, (Meeting & { sdr_name?: string })[]>);

      // Prepare export data organized by SDR
      const exportData = [];
      
      for (const [sdrId, sdrMeetings] of Object.entries(meetingsBySDR)) {
        const sdr = sdrs.find(s => s.id === sdrId);
        const sdrName = sdr?.full_name || 'Unknown SDR';
        
        for (const meeting of sdrMeetings) {
          const client = clients.find(c => c.id === meeting.client_id);
          const row: any = {};
          
          if (exportFilters.includeFields.sdrInfo) {
            row['SDR Name'] = sdrName;
          }
          
          if (exportFilters.includeFields.clientInfo) {
            row['Client Name'] = client?.name || 'Unknown Client';
          }
          
          if (exportFilters.includeFields.meetingDetails) {
            row['Meeting Date'] = new Date(meeting.scheduled_date).toLocaleDateString();
            row['Meeting Time'] = new Date(meeting.scheduled_date).toLocaleTimeString();
            row['Status'] = meeting.status;
            row['No Show'] = meeting.no_show ? 'Yes' : 'No';
            row['Contact Name'] = meeting.contact_full_name || '';
            row['Contact Email'] = meeting.contact_email || '';
            row['Contact Phone'] = meeting.contact_phone || '';
            row['Company'] = meeting.company || '';
            row['Notes'] = meeting.notes || '';
          }
          
          if (exportFilters.includeFields.timestamps) {
            row['Booked At'] = new Date(meeting.booked_at).toLocaleString();
            if (meeting.confirmed_at) {
              row['Confirmed At'] = new Date(meeting.confirmed_at).toLocaleString();
            }
            if (meeting.held_at) {
              row['Held At'] = new Date(meeting.held_at).toLocaleString();
            }
          }
          
          exportData.push(row);
        }
      }

      // Convert to CSV and download
      if (exportData.length === 0) {
        alert('No meetings found matching the selected filters.');
        return;
      }

      const headers = Object.keys(exportData[0] || {});
      
      // Helper function to properly escape CSV values
      const escapeCSVValue = (value: any): string => {
        if (value === null || value === undefined) {
          return '';
        }
        
        const stringValue = String(value);
        
        // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      };

      const csvContent = [
        headers.map(escapeCSVValue).join(','),
        ...exportData.map(row => 
          headers.map(header => escapeCSVValue(row[header])).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `team_meetings_by_sdr_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportModalOpen(false);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data. Please try again.');
    }
  };

  
  const nowDate = new Date();
  
  // Helper function to check if a meeting is finalized (held, no-show, or cancelled)
  const isMeetingFinalized = (meeting: Meeting) => {
    return meeting.held_at || meeting.no_show || meeting.no_longer_interested;
  };

  const pendingMeetings = filteredMeetings
    .filter(meeting => meeting.status === 'pending' && !meeting.no_show && !meeting.held_at && new Date(meeting.scheduled_date) >= nowDate)
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  const confirmedMeetings = filteredMeetings
    .filter(meeting => meeting.status === 'confirmed' && !meeting.held_at && !meeting.no_show)
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const heldMeetings = filteredMeetings
    .filter(meeting => meeting.held_at)
    .sort((a, b) => new Date(b.held_at!).getTime() - new Date(a.held_at!).getTime());

  const noShowMeetings = filteredMeetings
    .filter(meeting => meeting.no_show)
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  const pastDuePendingMeetings = filteredMeetings
    .filter(meeting => {
      const isPastDue = new Date(meeting.scheduled_date) < nowDate;
      const isNotFinalized = !isMeetingFinalized(meeting);
      return isPastDue && isNotFinalized && meeting.status === 'pending';
    })
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  if (sdrsLoading || clientsLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-2">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Team's Meetings</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="sdr-filter" className="text-sm font-medium text-gray-700">
                SDR:
              </label>
              <select
                id="sdr-filter"
                value={selectedSDR}
                onChange={(e) => setSelectedSDR(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All SDRs</option>
                {sdrs.map((sdr) => (
                  <option key={sdr.id} value={sdr.id}>
                    {sdr.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="client-filter" className="text-sm font-medium text-gray-700">
                Client:
              </label>
              <select
                id="client-filter"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExportModalOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 border border-blue-200"
                title="Export team meetings organized by SDR"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
        {/* Manager Calendar View */}
        <div className="mb-32 px-4">
          <CalendarView meetings={filteredMeetings} />
        </div>

        {/* Visual Separator */}
        <div className="border-t-2 border-gray-200 my-8"></div>

        {/* Unified Meeting Lists with Drag & Drop */}
        <UnifiedMeetingLists
          pendingMeetings={pendingMeetings}
          confirmedMeetings={confirmedMeetings}
          heldMeetings={heldMeetings}
          noShowMeetings={noShowMeetings}
          pastDuePendingMeetings={pastDuePendingMeetings}
          editable={true}
          editingMeetingId={editingMeetingId}
          onEdit={handleEditMeeting}
          onDelete={handleDeleteMeeting}
          onSave={handleSaveMeeting}
          onCancel={() => { setEditingMeetingId(null); }}
          onMeetingStatusChange={handleMeetingStatusChange}
        />

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Export Team Meetings by SDR</h3>
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Date Range Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Date Range</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="all"
                        checked={exportFilters.dateRange === 'all'}
                        onChange={(e) => setExportFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                        className="mr-2"
                      />
                      All Time
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="currentMonth"
                        checked={exportFilters.dateRange === 'currentMonth'}
                        onChange={(e) => setExportFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                        className="mr-2"
                      />
                      Current Month
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="custom"
                        checked={exportFilters.dateRange === 'custom'}
                        onChange={(e) => setExportFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                        className="mr-2"
                      />
                      Custom Range
                    </label>
                    {exportFilters.dateRange === 'custom' && (
                      <div className="flex gap-4 ml-6">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={exportFilters.startDate}
                            onChange={(e) => setExportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">End Date</label>
                          <input
                            type="date"
                            value={exportFilters.endDate}
                            onChange={(e) => setExportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
                  <select
                    value={exportFilters.status}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="noShow">No Show</option>
                  </select>
                </div>

                {/* SDR Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">SDRs</h4>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {sdrs.map(sdr => (
                      <label key={sdr.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={exportFilters.sdrIds.includes(sdr.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExportFilters(prev => ({ 
                                ...prev, 
                                sdrIds: [...prev.sdrIds, sdr.id] 
                              }));
                            } else {
                              setExportFilters(prev => ({ 
                                ...prev, 
                                sdrIds: prev.sdrIds.filter(id => id !== sdr.id) 
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        {sdr.full_name}
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {exportFilters.sdrIds.length === 0 ? 'All SDRs' : `${exportFilters.sdrIds.length} SDR(s) selected`}
                  </p>
                </div>

                {/* Client Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Clients</h4>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {clients.map(client => (
                      <label key={client.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={exportFilters.clientIds.includes(client.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExportFilters(prev => ({ 
                                ...prev, 
                                clientIds: [...prev.clientIds, client.id] 
                              }));
                            } else {
                              setExportFilters(prev => ({ 
                                ...prev, 
                                clientIds: prev.clientIds.filter(id => id !== client.id) 
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        {client.name}
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {exportFilters.clientIds.length === 0 ? 'All clients' : `${exportFilters.clientIds.length} client(s) selected`}
                  </p>
                </div>

                {/* Include Fields */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Include Fields</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportFilters.includeFields.sdrInfo}
                        onChange={(e) => setExportFilters(prev => ({ 
                          ...prev, 
                          includeFields: { ...prev.includeFields, sdrInfo: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      SDR Information
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportFilters.includeFields.clientInfo}
                        onChange={(e) => setExportFilters(prev => ({ 
                          ...prev, 
                          includeFields: { ...prev.includeFields, clientInfo: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      Client Information
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportFilters.includeFields.meetingDetails}
                        onChange={(e) => setExportFilters(prev => ({ 
                          ...prev, 
                          includeFields: { ...prev.includeFields, meetingDetails: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      Meeting Details
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportFilters.includeFields.timestamps}
                        onChange={(e) => setExportFilters(prev => ({ 
                          ...prev, 
                          includeFields: { ...prev.includeFields, timestamps: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      Timestamps
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={exportTeamMeetings}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}