import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSDRs } from '../hooks/useSDRs';
import { useMeetings } from '../hooks/useMeetings';
import { Users, Target, Calendar, AlertCircle, LogOut, ChevronDown, ChevronRight, Link, ListChecks, CheckCircle, XCircle, Clock } from 'lucide-react';
import CalendarView from '../components/CalendarView';
import SDRManagement from '../components/SDRManagement';
import ClientManagement from '../components/ClientManagement';
import UserManagement from '../components/UserManagement';
import TeamMeetings from './TeamMeetings';
import { supabase } from '../lib/supabase';

export default function ManagerDashboard() {
  const { profile } = useAuth();
  const { sdrs, loading: sdrsLoading, error: sdrsError, fetchSDRs } = useSDRs();
  // Ensures useMeetings fetches all meetings (SDR ID: null)
  console.log('[DEBUG] useMeetings called with SDR ID:', null);
  const { meetings, loading: meetingsLoading } = useMeetings(null);
  const [selectedSDR, setSelectedSDR] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sdrs' | 'clients' | 'users' | 'meetings'>('overview');
  const [expandedSDRs, setExpandedSDRs] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Debug: Log raw meetings and loading state
  useEffect(() => {
    console.log('[DEBUG] meetingsLoading:', meetingsLoading);
    console.log('[DEBUG] meetings count:', meetings.length);
    meetings.forEach(m => {
      console.log(`[DEBUG] meeting id=${m.id} scheduled_date=${m.scheduled_date} no_show=${m.no_show}`);
    });
  }, [meetings, meetingsLoading]);

  // Add SDR names to meetings
  const meetingsWithSDRNames = meetings.map(meeting => {
    const sdr = sdrs.find(sdr => sdr.id === meeting.sdr_id);
    return {
      ...meeting,
      sdr_name: sdr?.full_name || 'Unknown SDR'
    };
  });

  const todayMeetings = meetingsWithSDRNames.filter(
    (meeting) =>
      new Date(meeting.created_at).toDateString() === new Date().toDateString()
  );

  const confirmedToday = meetingsWithSDRNames.filter(
    (meeting) =>
      meeting.status === 'confirmed' &&
      meeting.confirmed_at &&
      new Date(meeting.confirmed_at).toDateString() === new Date().toDateString()
  );

  async function handleLogout() {
    localStorage.removeItem('currentUser');
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  function toggleSDRExpansion(sdrId: string) {
    setExpandedSDRs(prev => ({
      ...prev,
      [sdrId]: !prev[sdrId]
    }));
  }

  function generateAccessToken(sdrId: string): string {
    const tokenData = {
      id: sdrId,
      timestamp: Date.now(),
      type: 'sdr_access'
    };
    return btoa(JSON.stringify(tokenData));
  }

  function getSDRDashboardUrl(sdrId: string): string {
    const token = generateAccessToken(sdrId);
    return `${window.location.origin}/dashboard/sdr/${token}`;
  }

  async function handleCopyUrl(sdrId: string) {
    const url = getSDRDashboardUrl(sdrId);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(sdrId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  }

  if (sdrsLoading || meetingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  console.log('All meetings:', meetings);
  console.log('Held meeting candidates:', meetings.filter(m => 
    m.status === 'confirmed' && 
    m.scheduled_date && 
    new Date(m.scheduled_date) < new Date() && 
    !m.no_show
  ));

  // Calculate month progress
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const monthProgress = (dayOfMonth / daysInMonth) * 100;

  // Calculate metrics similar to SDR dashboard
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);

  // Filter meetings for current month only
  const monthlyMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.scheduled_date);
    return meetingDate >= monthStart && meetingDate <= monthEnd;
  });

  // Calculate total targets from all SDRs (separate set and held targets)
  const totalSetTarget = sdrs.reduce(
    (sum, sdr) => sum + sdr.clients.reduce((acc, client) => acc + (client.monthly_set_target || 0), 0),
    0
  );

  const totalHeldTarget = sdrs.reduce(
    (sum, sdr) => sum + sdr.clients.reduce((acc, client) => acc + (client.monthly_hold_target || 0), 0),
    0
  );

  // Debug logging
  console.log('SDRs data:', sdrs);
  console.log('Total Set Target:', totalSetTarget);
  console.log('Total Held Target:', totalHeldTarget);
  sdrs.forEach(sdr => {
    console.log(`SDR ${sdr.full_name}:`, sdr.clients.map(c => ({
      name: c.name,
      set_target: c.monthly_set_target,
      hold_target: c.monthly_hold_target
    })));
  });

  // Calculate monthly metrics
  const monthlyMeetingsSet = monthlyMeetings.filter(m => !m.no_show).length; // Exclude no-shows from set count
  const monthlyHeldMeetings = monthlyMeetings.filter(m => 
    m.status === 'confirmed' && 
    !m.no_show && 
    m.held_at !== null
  ).length;
  const monthlyPendingMeetings = monthlyMeetings.filter(m => m.status === 'pending' && !m.no_show).length;
  const monthlyNoShowMeetings = monthlyMeetings.filter(m => m.no_show).length;

  // Calculate cumulative metrics (all time)
  const totalMeetingsSet = meetings.filter(m => !m.no_show).length;
  const totalHeldMeetings = meetings.filter(m => 
    m.status === 'confirmed' && 
    !m.no_show && 
    m.held_at !== null
  ).length;
  const totalPendingMeetings = meetings.filter(m => m.status === 'pending' && !m.no_show).length;
  const totalNoShowMeetings = meetings.filter(m => m.no_show).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {profile?.full_name || 'Manager'}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Month Progress: {monthProgress.toFixed(1)}%
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {sdrsError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p>{sdrsError}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`${
                activeTab === 'meetings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <ListChecks className="w-4 h-4" />
              Team's Meetings
            </button>
            <button
              onClick={() => setActiveTab('sdrs')}
              className={`${
                activeTab === 'sdrs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            >
              SDR Management
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`${
                activeTab === 'clients'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
            >
              Client Management
            </button>
            {profile?.super_admin && (
              <button
                onClick={() => setActiveTab('users')}
                className={`${
                  activeTab === 'users'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                User Management
              </button>
            )}
          </nav>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Total SDRs</h3>
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{sdrs.length}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Monthly Set Target</h3>
                  <Target className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalSetTarget}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {monthProgress.toFixed(1)}% of month completed
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Monthly Held Target</h3>
                  <Target className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalHeldTarget}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {monthProgress.toFixed(1)}% of month completed
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Meetings Set</h3>
                  <Calendar className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{monthlyMeetingsSet}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {totalSetTarget > 0 ? ((monthlyMeetingsSet / totalSetTarget) * 100).toFixed(1) : '0.0'}% of target
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Cumulative: {totalMeetingsSet}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Meetings Held</h3>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{monthlyHeldMeetings}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {totalHeldTarget > 0 ? ((monthlyHeldMeetings / totalHeldTarget) * 100).toFixed(1) : '0.0'}% of target
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Cumulative: {totalHeldMeetings}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{monthlyPendingMeetings}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Pending confirmation
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Cumulative: {totalPendingMeetings}
                </p>
              </div>
            </div>

            {/* SDR Performance Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">SDR Performance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SDR Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Set Target
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Held Target
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Meetings Set
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Held
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sdrs.map((sdr) => {
                      // Calculate separate set and held targets for this SDR
                      const totalSetTarget = sdr.clients.reduce(
                        (sum, client) => sum + (client.monthly_set_target || 0),
                        0
                      );
                      const totalHeldTarget = sdr.clients.reduce(
                        (sum, client) => sum + (client.monthly_hold_target || 0),
                        0
                      );

                      // Calculate monthly meetings for this SDR
                      const sdrMonthlyMeetings = monthlyMeetings.filter(m => m.sdr_id === sdr.id);
                      const sdrMeetingsSet = sdrMonthlyMeetings.filter(m => !m.no_show).length;
                      const sdrHeldMeetings = sdrMonthlyMeetings.filter(m => 
                        m.status === 'confirmed' && 
                        !m.no_show && 
                        m.held_at !== null
                      ).length;

                      const setProgress = totalSetTarget > 0 ? (sdrMeetingsSet / totalSetTarget) * 100 : 0;
                      const heldProgress = totalHeldTarget > 0 ? (sdrHeldMeetings / totalHeldTarget) * 100 : 0;
                      const isSetOnTrack = setProgress >= monthProgress;
                      const isHeldOnTrack = heldProgress >= monthProgress;
                      const isExpanded = expandedSDRs[sdr.id];

                      return (
                        <React.Fragment key={sdr.id}>
                          <tr
                            className={`hover:bg-gray-50 cursor-pointer ${
                              selectedSDR === sdr.id ? 'bg-indigo-50' : ''
                            }`}
                            onClick={() => toggleSDRExpansion(sdr.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                                <div className="text-sm font-medium text-gray-900">
                                  {sdr.full_name}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{totalSetTarget}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{totalHeldTarget}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {sdrMeetingsSet}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-gray-900">
                                  {sdrHeldMeetings}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-4 whitespace-nowrap">
                              <div className="flex flex-col items-start">
                                {/* Meetings Set progress bar */}
                                <div className="flex items-center w-full">
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                                    <div
                                      className={`h-full rounded-full transition-all duration-300 ${
                                        isSetOnTrack ? 'bg-green-600' : 'bg-yellow-600'
                                      }`}
                                      style={{ width: `${setProgress}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-sm font-medium ${
                                      isSetOnTrack ? 'text-green-600' : 'text-yellow-600'
                                    }`}
                                  >
                                    {isNaN(setProgress) ? '0.0' : setProgress.toFixed(1)}%
                                  </span>
                                  <div className="ml-2 text-sm text-gray-500">Set</div>
                                </div>
                                {/* Held meetings progress bar */}
                                <div className="flex items-center w-full mt-1">
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                                    <div
                                      className={`h-full rounded-full transition-all duration-300 ${
                                        isHeldOnTrack ? 'bg-green-400' : 'bg-yellow-400'
                                      }`}
                                      style={{ width: `${heldProgress}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-sm font-medium ${
                                      isHeldOnTrack ? 'text-green-600' : 'text-yellow-600'
                                    }`}
                                  >
                                    {isNaN(heldProgress) ? '0.0' : heldProgress.toFixed(1)}%
                                  </span>
                                  <div className="ml-2 text-sm text-gray-500">Held</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyUrl(sdr.id);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              >
                                {copiedId === sdr.id ? (
                                  <>
                                    <Link className="w-4 h-4" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Link className="w-4 h-4" />
                                    Copy URL
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="px-6 py-4 bg-gray-50">
                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                                    Client Assignments
                                  </h4>
                                  {sdr.clients.map((client) => {
                                    // Calculate monthly meetings for this client
                                    const clientMonthlyMeetings = monthlyMeetings.filter(m => 
                                      m.sdr_id === sdr.id && m.client_id === client.id
                                    );
                                    const clientMeetingsSet = clientMonthlyMeetings.filter(m => !m.no_show).length;
                                    const clientHeldMeetings = clientMonthlyMeetings.filter(m => 
                                      m.status === 'confirmed' && 
                                      !m.no_show && 
                                      m.held_at !== null
                                    ).length;
                                    
                                    const clientSetProgress = (client.monthly_set_target || 0) > 0 ? 
                                      (clientMeetingsSet / (client.monthly_set_target || 0)) * 100 : 0;
                                    const isClientSetOnTrack = clientSetProgress >= monthProgress;

                                    return (
                                      <div
                                        key={client.id}
                                        className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm"
                                      >
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">
                                            {client.name}
                                          </p>
                                          <div className="flex items-center gap-4 mt-1">
                                            <span className="text-sm text-gray-500">
                                              Set Target: {client.monthly_set_target || 0}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                              Held Target: {client.monthly_hold_target || 0}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                              Set: {clientMeetingsSet}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                              Held: {clientHeldMeetings}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                              className={`h-full rounded-full transition-all duration-300 ${
                                                isClientSetOnTrack ? 'bg-green-600' : 'bg-yellow-600'
                                              }`}
                                              style={{ width: `${clientSetProgress}%` }}
                                            />
                                          </div>
                                          <span
                                            className={`text-sm font-medium ${
                                              isClientSetOnTrack ? 'text-green-600' : 'text-yellow-600'
                                            }`}
                                          >
                                            {isNaN(clientSetProgress) ? '0.0' : clientSetProgress.toFixed(1)}%
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {sdr.clients.length === 0 && (
                                    <p className="text-sm text-gray-500">
                                      No clients assigned
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Today's Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Meetings Booked Today ({todayMeetings.length})
                </h3>
                <div className="space-y-3">
                  {todayMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${
                        meeting.status === 'pending' ? 'animate-glow-orange ring-2 ring-orange-400' : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {(meeting as any).clients?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(meeting.scheduled_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          Booked by {meeting.sdr_name}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          meeting.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {meeting.status}
                      </span>
                    </div>
                  ))}
                  {todayMeetings.length === 0 && (
                    <p className="text-sm text-gray-500">No meetings booked today</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Meetings Confirmed Today ({confirmedToday.length})
                </h3>
                <div className="space-y-3">
                  {confirmedToday.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {(meeting as any).clients?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(meeting.scheduled_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          Booked by {meeting.sdr_name}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        confirmed
                      </span>
                    </div>
                  ))}
                  {confirmedToday.length === 0 && (
                    <p className="text-sm text-gray-500">No meetings confirmed today</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'meetings' && (
          <>
            <TeamMeetings />
          </>
        )}

        {activeTab === 'sdrs' && (
          <SDRManagement sdrs={sdrs} onInviteSent={fetchSDRs} />
        )}

        {activeTab === 'clients' && (
          <ClientManagement sdrs={sdrs} onUpdate={fetchSDRs} />
        )}

        {activeTab === 'users' && profile?.super_admin && (
          <UserManagement />
        )}
      </main>
    </div>
  );
}