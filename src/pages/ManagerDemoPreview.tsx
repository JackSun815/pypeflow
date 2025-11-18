import { useMemo, useState } from 'react';
import DashboardMetrics from '../components/DashboardMetrics';
import ClientCard from '../components/ClientCard';
import CalendarView from '../components/CalendarView';
import UnifiedMeetingLists from '../components/UnifiedMeetingLists';
import DemoBanner from '../components/DemoBanner';
import type { Meeting } from '../types/database';
import { BarChart2, Calendar as CalendarIcon, Building, Users, Lock } from 'lucide-react';

type PreviewClient = {
  id: string;
  name: string;
  monthly_set_target: number;
  monthly_hold_target: number;
  isInactive?: boolean;
  deactivated_at?: string;
};

type PreviewSDR = {
  id: string;
  name: string;
};

const PREVIEW_CLIENTS: PreviewClient[] = [
  { id: 'client-circuitbay', name: 'CircuitBay Solutions', monthly_set_target: 24, monthly_hold_target: 18 },
  { id: 'client-harrington', name: 'Harrington Consulting', monthly_set_target: 20, monthly_hold_target: 15 },
  { id: 'client-crestbridge', name: 'CrestBridge Biotech', monthly_set_target: 18, monthly_hold_target: 14 },
  { id: 'client-bluecrest', name: 'bluecrest Analytics', monthly_set_target: 22, monthly_hold_target: 17 },
  { id: 'client-northline', name: 'Northline Capital Partners', monthly_set_target: 26, monthly_hold_target: 20, isInactive: true, deactivated_at: '2025-11-01T12:00:00.000Z' },
];

const PREVIEW_SDRS: PreviewSDR[] = [
  { id: 'sdr-grace', name: 'Grace Laughlin' },
  { id: 'sdr-riley', name: 'Riley Green' },
  { id: 'sdr-ryan', name: 'Ryan Chen' },
];

const MEETINGS: Meeting[] = [
  {
    id: 'mtg-1',
    sdr_id: 'sdr-grace',
    client_id: 'client-circuitbay',
    scheduled_date: '2025-11-05T15:00:00.000Z',
    booked_at: '2025-10-28T14:00:00.000Z',
    status: 'confirmed',
    confirmed_at: '2025-10-29T09:00:00.000Z',
    held_at: '2025-11-05T16:00:00.000Z',
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Alex Johnson',
    contact_email: 'alex.johnson@example.com',
    contact_phone: null,
    company: 'CircuitBay',
    title: 'VP of Sales',
    linkedin_page: null,
    notes: 'Interested in pilot.',
    source: 'cold_email',
    created_at: '2025-10-28T14:00:00.000Z',
    updated_at: '2025-11-05T18:00:00.000Z',
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: '2025-10-29T09:00:00.000Z',
    icp_checked_by: null,
    icp_notes: null,
  },
  {
    id: 'mtg-2',
    sdr_id: 'sdr-riley',
    client_id: 'client-harrington',
    scheduled_date: '2025-11-08T20:30:00.000Z',
    booked_at: '2025-11-01T16:00:00.000Z',
    status: 'confirmed',
    confirmed_at: '2025-11-02T11:00:00.000Z',
    held_at: '2025-11-08T21:30:00.000Z',
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Taylor Smith',
    contact_email: 'taylor.smith@example.com',
    contact_phone: null,
    company: 'Harrington Consulting',
    title: 'Head of Revenue Operations',
    linkedin_page: null,
    notes: 'Needs integration details.',
    source: 'linkedin',
    created_at: '2025-11-01T16:00:00.000Z',
    updated_at: '2025-11-08T22:00:00.000Z',
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: '2025-11-02T11:00:00.000Z',
    icp_checked_by: null,
    icp_notes: null,
  },
  {
    id: 'mtg-3',
    sdr_id: 'sdr-grace',
    client_id: 'client-crestbridge',
    scheduled_date: '2025-11-12T14:00:00.000Z',
    booked_at: '2025-11-03T18:00:00.000Z',
    status: 'confirmed',
    confirmed_at: '2025-11-04T14:00:00.000Z',
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Jordan Lee',
    contact_email: 'jordan.lee@example.com',
    contact_phone: null,
    company: 'CrestBridge Biotech',
    title: 'Director of Sales',
    linkedin_page: null,
    notes: 'Key account; ensure follow-up.',
    source: 'referral',
    created_at: '2025-11-03T18:00:00.000Z',
    updated_at: '2025-11-04T14:00:00.000Z',
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: '2025-11-04T14:00:00.000Z',
    icp_checked_by: null,
    icp_notes: null,
  },
  {
    id: 'mtg-4',
    sdr_id: 'sdr-ryan',
    client_id: 'client-bluecrest',
    scheduled_date: '2025-11-18T17:30:00.000Z',
    booked_at: '2025-11-07T15:00:00.000Z',
    status: 'pending',
    confirmed_at: null,
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Casey Morgan',
    contact_email: 'casey.morgan@example.com',
    contact_phone: null,
    company: 'bluecrest Analytics',
    title: 'CRO',
    linkedin_page: null,
    notes: 'Requested case studies.',
    source: 'inbound',
    created_at: '2025-11-07T15:00:00.000Z',
    updated_at: '2025-11-07T15:00:00.000Z',
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: '2025-11-08T15:00:00.000Z',
    icp_checked_by: null,
    icp_notes: null,
  },
  {
    id: 'mtg-5',
    sdr_id: 'sdr-grace',
    client_id: 'client-circuitbay',
    scheduled_date: '2025-11-20T19:00:00.000Z',
    booked_at: '2025-11-09T15:00:00.000Z',
    status: 'confirmed',
    confirmed_at: '2025-11-10T14:00:00.000Z',
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Sam Rivera',
    contact_email: 'sam.rivera@example.com',
    contact_phone: null,
    company: 'CircuitBay',
    title: 'Head of Partnerships',
    linkedin_page: null,
    notes: 'Follow-up on security questions.',
    source: 'cold_email',
    created_at: '2025-11-09T15:00:00.000Z',
    updated_at: '2025-11-10T14:00:00.000Z',
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: '2025-11-10T14:00:00.000Z',
    icp_checked_by: null,
    icp_notes: null,
  },
  {
    id: 'mtg-6',
    sdr_id: 'sdr-riley',
    client_id: 'client-harrington',
    scheduled_date: '2025-11-06T21:00:00.000Z',
    booked_at: '2025-10-30T19:00:00.000Z',
    status: 'confirmed',
    confirmed_at: '2025-10-31T16:00:00.000Z',
    held_at: null,
    no_show: true,
    no_longer_interested: false,
    contact_full_name: 'Morgan Davis',
    contact_email: 'morgan.davis@example.com',
    contact_phone: null,
    company: 'Harrington Consulting',
    title: 'VP of Sales',
    linkedin_page: null,
    notes: 'No-show; reschedule needed.',
    source: 'cold_email',
    created_at: '2025-10-30T19:00:00.000Z',
    updated_at: '2025-11-06T22:00:00.000Z',
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: '2025-10-31T16:00:00.000Z',
    icp_checked_by: null,
    icp_notes: null,
  },
  {
    id: 'mtg-7',
    sdr_id: 'sdr-ryan',
    client_id: 'client-northline',
    scheduled_date: '2025-11-10T14:30:00.000Z',
    booked_at: '2025-11-02T15:00:00.000Z',
    status: 'confirmed',
    confirmed_at: '2025-11-03T13:00:00.000Z',
    held_at: '2025-11-10T15:30:00.000Z',
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Oliver Clark',
    contact_email: 'oliver.clark@example.com',
    contact_phone: null,
    company: 'Northline Capital',
    title: 'Managing Partner',
    linkedin_page: null,
    notes: 'Quarterly review.',
    source: 'referral',
    created_at: '2025-11-02T15:00:00.000Z',
    updated_at: '2025-11-10T17:00:00.000Z',
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: '2025-11-03T13:00:00.000Z',
    icp_checked_by: null,
    icp_notes: null,
  },
  {
    id: 'mtg-8',
    sdr_id: 'sdr-grace',
    client_id: 'client-bluecrest',
    scheduled_date: '2025-11-24T16:00:00.000Z',
    booked_at: '2025-11-14T18:00:00.000Z',
    status: 'pending',
    confirmed_at: null,
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Chloe Brown',
    contact_email: 'chloe.brown@example.com',
    contact_phone: null,
    company: 'bluecrest Analytics',
    title: 'VP Growth',
    linkedin_page: null,
    notes: 'Waiting on legal review.',
    source: 'referral',
    created_at: '2025-11-14T18:00:00.000Z',
    updated_at: '2025-11-14T18:00:00.000Z',
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: '2025-11-15T12:00:00.000Z',
    icp_checked_by: null,
    icp_notes: null,
  },
  {
    id: 'mtg-9',
    sdr_id: 'sdr-riley',
    client_id: 'client-circuitbay',
    scheduled_date: '2025-11-28T19:30:00.000Z',
    booked_at: '2025-11-18T14:00:00.000Z',
    status: 'confirmed',
    confirmed_at: '2025-11-18T15:00:00.000Z',
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Priya Shah',
    contact_email: 'priya.shah@example.com',
    contact_phone: null,
    company: 'CircuitBay',
    title: 'Revenue Ops Lead',
    linkedin_page: null,
    notes: 'Budget approvals pending.',
    source: 'inbound',
    created_at: '2025-11-18T14:00:00.000Z',
    updated_at: '2025-11-18T15:00:00.000Z',
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: '2025-11-18T15:00:00.000Z',
    icp_checked_by: null,
    icp_notes: null,
  }
];

export default function ManagerDemoPreview() {
  const [activeTab, setActiveTab] = useState<'overview' | 'meetings'>('overview');
  const [selectedSDRFilter, setSelectedSDRFilter] = useState<'all' | string>('all');
  const [selectedClientFilter, setSelectedClientFilter] = useState<'all' | string>('all');

  const now = useMemo(() => new Date(2025, 10, 12, 12, 0, 0), []);
  const monthProgress = useMemo(() => {
    const daysInMonth = new Date(2025, 11, 0).getDate();
    return ((now.getDate() / daysInMonth) * 100);
  }, [now]);

  const enhancedMeetings = useMemo(
    () =>
      MEETINGS.map(meeting => ({
        ...meeting,
        client_name: PREVIEW_CLIENTS.find(c => c.id === meeting.client_id)?.name || 'Client',
        sdr_name: PREVIEW_SDRS.find(s => s.id === meeting.sdr_id)?.name || 'SDR',
      })),
    []
  );

  const totalSetTarget = PREVIEW_CLIENTS.reduce((sum, client) => sum + client.monthly_set_target, 0);
  const totalHeldTarget = PREVIEW_CLIENTS.reduce((sum, client) => sum + client.monthly_hold_target, 0);
  const totalMeetingsSet = enhancedMeetings.length;
  const totalHeldMeetings = enhancedMeetings.filter(m => m.held_at && !m.no_show).length;
  const totalPendingMeetings = enhancedMeetings.filter(m => m.status === 'pending' && !m.no_show).length;
  const totalNoShowMeetings = enhancedMeetings.filter(m => m.no_show).length;

  const clientsWithMetrics = PREVIEW_CLIENTS.map(client => {
    const meetingsForClient = enhancedMeetings.filter(m => m.client_id === client.id);
    const confirmedMeetings = meetingsForClient.filter(m => m.status === 'confirmed' && !m.no_show).length;
    const pendingMeetings = meetingsForClient.filter(m => m.status === 'pending' && !m.no_show).length;
    const heldMeetings = meetingsForClient.filter(m => m.held_at && !m.no_show).length;
    const todaysMeetings = meetingsForClient
      .filter(m => new Date(m.scheduled_date).toDateString() === now.toDateString())
      .map(m => ({
        id: m.id,
        scheduled_date: m.scheduled_date,
        status: m.status,
        contact_full_name: m.contact_full_name,
        contact_email: m.contact_email,
        contact_phone: m.contact_phone,
      }));

    return {
      ...client,
      confirmedMeetings,
      pendingMeetings,
      heldMeetings,
      totalMeetingsSet: meetingsForClient.length,
      todaysMeetings,
    };
  });

  const filteredMeetings = useMemo(() => {
    return enhancedMeetings.filter(meeting => {
      if (selectedSDRFilter !== 'all' && meeting.sdr_id !== selectedSDRFilter) return false;
      if (selectedClientFilter !== 'all' && meeting.client_id !== selectedClientFilter) return false;
      return true;
    });
  }, [enhancedMeetings, selectedSDRFilter, selectedClientFilter]);

  const nowDate = now;

  const pendingMeetings = filteredMeetings
    .filter(m => m.status === 'pending' && !m.no_show && !m.held_at && new Date(m.scheduled_date) >= nowDate)
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const confirmedMeetings = filteredMeetings
    .filter(m => m.status === 'confirmed' && !m.held_at && !m.no_show)
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const heldMeetings = filteredMeetings
    .filter(m => !!m.held_at && !m.no_show)
    .sort((a, b) => new Date(b.held_at!).getTime() - new Date(a.held_at!).getTime());

  const noShowMeetings = filteredMeetings
    .filter(m => m.no_show)
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  const pastDuePendingMeetings = filteredMeetings
    .filter(m => {
      const isPastDue = new Date(m.scheduled_date) < nowDate;
      const isPending = m.status === 'pending' && !m.no_show && !m.held_at;
      return isPastDue && isPending;
    })
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const handleReadOnlyAction = () => {
    alert('This action is disabled in the read-only demo.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DemoBanner />
      <header className="bg-white shadow border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
                Pype
              </span>
              <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                Flow
              </span>
            </h1>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-800">Manager Dashboard</p>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  Demo Environment (read-only)
                </span>
              </div>
              <p className="text-sm text-gray-500">November 2025</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <nav className="-mb-px flex space-x-8 px-4 sm:px-6 lg:px-8">
            <button
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart2 className="w-4 h-4" />
              Overview
            </button>
            <button
              className={`${
                activeTab === 'meetings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
              onClick={() => setActiveTab('meetings')}
            >
              <CalendarIcon className="w-4 h-4" />
              Team&apos;s Meetings
            </button>
            <button className="border-transparent text-gray-400 pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors cursor-not-allowed">
              <Building className="w-4 h-4" />
              Client Management
              <Lock className="w-3 h-3" />
            </button>
            <button className="border-transparent text-gray-400 pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors cursor-not-allowed">
              <Users className="w-4 h-4" />
              User Management
              <Lock className="w-3 h-3" />
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1 w-full">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <DashboardMetrics
              clients={PREVIEW_CLIENTS}
              monthProgress={monthProgress}
              totalMeetingGoal={totalSetTarget}
              totalHeldMeetings={totalHeldMeetings}
              totalSetTarget={totalSetTarget}
              totalHeldTarget={totalHeldTarget}
              totalMeetingsSet={totalMeetingsSet}
              totalPendingMeetings={totalPendingMeetings}
              totalNoShowMeetings={totalNoShowMeetings}
              meetings={enhancedMeetings}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {clientsWithMetrics.map(client => (
                <ClientCard
                  key={client.id}
                  name={client.name}
                  monthly_set_target={client.monthly_set_target}
                  monthly_hold_target={client.monthly_hold_target}
                  confirmedMeetings={client.confirmedMeetings}
                  pendingMeetings={client.pendingMeetings}
                  heldMeetings={client.heldMeetings}
                  totalMeetingsSet={client.totalMeetingsSet}
                  todaysMeetings={client.todaysMeetings}
                  onAddMeeting={handleReadOnlyAction}
                  onConfirmMeeting={handleReadOnlyAction}
                  allMeetings={enhancedMeetings}
                  clientId={client.id}
                  isInactive={client.isInactive}
                  deactivatedAt={client.deactivated_at}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">SDR:</span>
                <select
                  value={selectedSDRFilter}
                  onChange={e => setSelectedSDRFilter(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All SDRs</option>
                  {PREVIEW_SDRS.map(sdr => (
                    <option key={sdr.id} value={sdr.id}>
                      {sdr.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Client:</span>
                <select
                  value={selectedClientFilter}
                  onChange={e => setSelectedClientFilter(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Clients</option>
                  {PREVIEW_CLIENTS.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-10">
              <CalendarView
                meetings={filteredMeetings as any}
                defaultDate={new Date(2025, 10, 12, 12, 0, 0)}
              />
            </div>

            <UnifiedMeetingLists
              pendingMeetings={pendingMeetings as any}
              confirmedMeetings={confirmedMeetings as any}
              heldMeetings={heldMeetings as any}
              noShowMeetings={noShowMeetings as any}
              pastDuePendingMeetings={pastDuePendingMeetings as any}
              editable={false}
              editingMeetingId={null}
              onEdit={() => {}}
              onDelete={() => {}}
              onSave={() => {}}
              onCancel={() => {}}
              onMeetingStatusChange={() => {}}
            />
          </div>
        )}
      </main>
    </div>
  );
}
