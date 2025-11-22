import { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, History, DollarSign, Target } from 'lucide-react';
import CalendarView from '../components/CalendarView';
import UnifiedMeetingLists from '../components/UnifiedMeetingLists';
import type { Meeting } from '../types/database';

const SDR_ID = 'sdr-grace';
const SDR_NAME = 'Grace Laughlin';

const CLIENTS = [
  { id: 'client-circuitbay', name: 'CircuitBay Solutions' },
  { id: 'client-harrington', name: 'Harrington Consulting' },
  { id: 'client-crestbridge', name: 'CrestBridge Biotech' },
  { id: 'client-bluecrest', name: 'bluecrest Analytics' },
];

function makeDate(month: number, day: number, hour: number): string {
  // Local time → ISO
  const d = new Date(2025, month - 1, day, hour, 0, 0);
  return d.toISOString();
}

// Synthetic meetings for Grace
const SDR_MEETINGS: Meeting[] = [
  {
    id: 'grace-1',
    sdr_id: SDR_ID,
    client_id: CLIENTS[0].id,
    scheduled_date: makeDate(11, 5, 10),
    booked_at: makeDate(10, 28, 14),
    status: 'confirmed',
    confirmed_at: makeDate(10, 29, 9),
    held_at: makeDate(11, 5, 10),
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Alex Johnson',
    contact_email: 'alex.johnson@example.com',
    contact_phone: null,
    company: 'CircuitBay Labs',
    title: 'VP of Sales',
    linkedin_page: null,
    notes: 'Interested in Q1 pilot.',
    source: 'cold_email',
    created_at: makeDate(10, 28, 14),
    updated_at: makeDate(11, 5, 12),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: makeDate(10, 29, 9),
    icp_checked_by: SDR_ID,
    icp_notes: null,
  },
  {
    id: 'grace-2',
    sdr_id: SDR_ID,
    client_id: CLIENTS[1].id,
    scheduled_date: makeDate(11, 8, 15),
    booked_at: makeDate(11, 1, 11),
    status: 'confirmed',
    confirmed_at: makeDate(11, 2, 10),
    held_at: makeDate(11, 8, 15),
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Taylor Smith',
    contact_email: 'taylor.smith@example.com',
    contact_phone: null,
    company: 'Harrington Consulting',
    title: 'Head of Revenue Operations',
    linkedin_page: null,
    notes: 'Needs deeper integration details.',
    source: 'linkedin',
    created_at: makeDate(11, 1, 11),
    updated_at: makeDate(11, 8, 17),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: makeDate(11, 2, 10),
    icp_checked_by: SDR_ID,
    icp_notes: null,
  },
  {
    id: 'grace-3',
    sdr_id: SDR_ID,
    client_id: CLIENTS[2].id,
    scheduled_date: makeDate(11, 12, 9),
    booked_at: makeDate(11, 3, 16),
    status: 'confirmed',
    confirmed_at: makeDate(11, 4, 9),
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
    created_at: makeDate(11, 3, 16),
    updated_at: makeDate(11, 4, 9),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: makeDate(11, 4, 9),
    icp_checked_by: SDR_ID,
    icp_notes: null,
  },
  {
    id: 'grace-4',
    sdr_id: SDR_ID,
    client_id: CLIENTS[3].id,
    scheduled_date: makeDate(11, 18, 11),
    booked_at: makeDate(11, 7, 13),
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
    notes: 'Requested case studies before confirming.',
    source: 'inbound',
    created_at: makeDate(11, 7, 13),
    updated_at: makeDate(11, 7, 13),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: makeDate(11, 8, 10),
    icp_checked_by: SDR_ID,
    icp_notes: null,
  },
  {
    id: 'grace-5',
    sdr_id: SDR_ID,
    client_id: CLIENTS[0].id,
    scheduled_date: makeDate(11, 20, 14),
    booked_at: makeDate(11, 9, 10),
    status: 'confirmed',
    confirmed_at: makeDate(11, 10, 9),
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Sam Rivera',
    contact_email: 'sam.rivera@example.com',
    contact_phone: null,
    company: 'CircuitBay Labs',
    title: 'Head of Partnerships',
    linkedin_page: null,
    notes: 'Follow-up on security questions.',
    source: 'cold_email',
    created_at: makeDate(11, 9, 10),
    updated_at: makeDate(11, 10, 9),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: makeDate(11, 10, 9),
    icp_checked_by: SDR_ID,
    icp_notes: null,
  },
  {
    id: 'grace-6',
    sdr_id: SDR_ID,
    client_id: CLIENTS[1].id,
    scheduled_date: makeDate(11, 6, 16),
    booked_at: makeDate(10, 30, 15),
    status: 'confirmed',
    confirmed_at: makeDate(10, 31, 11),
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
    created_at: makeDate(10, 30, 15),
    updated_at: makeDate(11, 6, 17),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: makeDate(10, 31, 11),
    icp_checked_by: SDR_ID,
    icp_notes: null,
  },
  {
    id: 'grace-7',
    sdr_id: SDR_ID,
    client_id: CLIENTS[2].id,
    scheduled_date: makeDate(11, 13, 14),
    booked_at: makeDate(11, 4, 10),
    status: 'confirmed',
    confirmed_at: makeDate(11, 5, 9),
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Riley Chen',
    contact_email: 'riley.chen@example.com',
    contact_phone: null,
    company: 'CrestBridge Biotech',
    title: 'Sales Manager',
    linkedin_page: null,
    notes: 'Follow-up on pricing discussion.',
    source: 'referral',
    created_at: makeDate(11, 4, 10),
    updated_at: makeDate(11, 5, 9),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: makeDate(11, 5, 9),
    icp_checked_by: SDR_ID,
    icp_notes: null,
  },
  {
    id: 'grace-8',
    sdr_id: SDR_ID,
    client_id: CLIENTS[0].id,
    scheduled_date: makeDate(11, 14, 10),
    booked_at: makeDate(11, 6, 14),
    status: 'confirmed',
    confirmed_at: makeDate(11, 7, 11),
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Jamie Park',
    contact_email: 'jamie.park@example.com',
    contact_phone: null,
    company: 'CircuitBay Labs',
    title: 'Director of Operations',
    linkedin_page: null,
    notes: 'Technical deep dive requested.',
    source: 'cold_email',
    created_at: makeDate(11, 6, 14),
    updated_at: makeDate(11, 7, 11),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: makeDate(11, 7, 11),
    icp_checked_by: SDR_ID,
    icp_notes: null,
  },
  {
    id: 'grace-9',
    sdr_id: SDR_ID,
    client_id: CLIENTS[3].id,
    scheduled_date: makeDate(11, 15, 13),
    booked_at: makeDate(11, 8, 15),
    status: 'pending',
    confirmed_at: null,
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Pat Kim',
    contact_email: 'pat.kim@example.com',
    contact_phone: null,
    company: 'bluecrest Analytics',
    title: 'VP of Marketing',
    linkedin_page: null,
    notes: 'Awaiting confirmation from calendar.',
    source: 'inbound',
    created_at: makeDate(11, 8, 15),
    updated_at: makeDate(11, 8, 15),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: makeDate(11, 9, 10),
    icp_checked_by: SDR_ID,
    icp_notes: null,
  },
  {
    id: 'grace-10',
    sdr_id: SDR_ID,
    client_id: CLIENTS[1].id,
    scheduled_date: makeDate(11, 19, 11),
    booked_at: makeDate(11, 10, 12),
    status: 'confirmed',
    confirmed_at: makeDate(11, 11, 9),
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Drew Martinez',
    contact_email: 'drew.martinez@example.com',
    contact_phone: null,
    company: 'Harrington Consulting',
    title: 'Head of Sales',
    linkedin_page: null,
    notes: 'Strategic partnership discussion.',
    source: 'linkedin',
    created_at: makeDate(11, 10, 12),
    updated_at: makeDate(11, 11, 9),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: makeDate(11, 11, 9),
    icp_checked_by: SDR_ID,
    icp_notes: null,
  },
  {
    id: 'grace-11',
    sdr_id: SDR_ID,
    client_id: CLIENTS[2].id,
    scheduled_date: makeDate(11, 21, 15),
    booked_at: makeDate(11, 11, 16),
    status: 'confirmed',
    confirmed_at: makeDate(11, 12, 10),
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Quinn Taylor',
    contact_email: 'quinn.taylor@example.com',
    contact_phone: null,
    company: 'CrestBridge Biotech',
    title: 'Sales Director',
    linkedin_page: null,
    notes: 'Product demo scheduled.',
    source: 'referral',
    created_at: makeDate(11, 11, 16),
    updated_at: makeDate(11, 12, 10),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: makeDate(11, 12, 10),
    icp_checked_by: SDR_ID,
    icp_notes: null,
  },
  {
    id: 'grace-12',
    sdr_id: SDR_ID,
    client_id: CLIENTS[0].id,
    scheduled_date: makeDate(11, 25, 9),
    booked_at: makeDate(11, 13, 14),
    status: 'confirmed',
    confirmed_at: makeDate(11, 14, 9),
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Avery Brown',
    contact_email: 'avery.brown@example.com',
    contact_phone: null,
    company: 'CircuitBay Labs',
    title: 'CTO',
    linkedin_page: null,
    notes: 'Technical evaluation call.',
    source: 'cold_email',
    created_at: makeDate(11, 13, 14),
    updated_at: makeDate(11, 14, 9),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: makeDate(11, 14, 9),
    icp_checked_by: SDR_ID,
    icp_notes: null,
  },
  {
    id: 'grace-13',
    sdr_id: SDR_ID,
    client_id: CLIENTS[3].id,
    scheduled_date: makeDate(11, 26, 14),
    booked_at: makeDate(11, 15, 11),
    status: 'pending',
    confirmed_at: null,
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Blake Wilson',
    contact_email: 'blake.wilson@example.com',
    contact_phone: null,
    company: 'bluecrest Analytics',
    title: 'Director of Revenue',
    linkedin_page: null,
    notes: 'Pending calendar confirmation.',
    source: 'inbound',
    created_at: makeDate(11, 15, 11),
    updated_at: makeDate(11, 15, 11),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: makeDate(11, 16, 9),
    icp_checked_by: SDR_ID,
    icp_notes: null,
  },
];

export default function StaticSDRDemo() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar'>('dashboard');
  // Lock "today" for demo to Nov 12, 2025
  const now = useMemo(() => new Date(2025, 10, 12, 12, 0, 0), []);
  const nowDate = now;

  const enhancedMeetings = useMemo(
    () =>
      SDR_MEETINGS.map(m => {
        const client = CLIENTS.find(c => c.id === m.client_id);
        const clientName = client?.name || 'Unknown Client';
        return {
          ...m,
          sdr_name: SDR_NAME,
          client_name: clientName,
          clients: { name: clientName },
        };
      }),
    []
  );

  const pendingMeetings = enhancedMeetings
    .filter(
      m =>
        m.status === 'pending' &&
        !m.no_show &&
        !m.held_at &&
        new Date(m.scheduled_date) >= nowDate
    )
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const confirmedMeetings = enhancedMeetings
    .filter(m => m.status === 'confirmed' && !m.held_at && !m.no_show)
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const heldMeetings = enhancedMeetings
    .filter(m => !!m.held_at && !m.no_show)
    .sort((a, b) => new Date(b.held_at!).getTime() - new Date(a.held_at!).getTime());

  const noShowMeetings = enhancedMeetings
    .filter(m => m.no_show)
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  const pastDuePendingMeetings = enhancedMeetings
    .filter(m => {
      const isPastDue = new Date(m.scheduled_date) < nowDate;
      const isPending = m.status === 'pending' && !m.no_show && !m.held_at;
      return isPastDue && isPending;
    })
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const monthlyHeld = heldMeetings.length;
  const monthlySet = enhancedMeetings.length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header / Tabs */}
      <header className="shadow-lg border-b bg-gradient-to-r from-white via-blue-50/30 to-white border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                    Pype
                  </span>
                  <span className="bg-gradient-to-r from-cyan-600 to-teal-500 bg-clip-text text-transparent">
                    Flow
                  </span>
                </h1>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-px bg-gradient-to-b from-blue-300 to-blue-500" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-gray-800">SDR Dashboard</p>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        Demo Environment (read-only)
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      Grace Laughlin · November 2025
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Dashboard & Calendar unlocked, others greyed */}
          <div className="border-b border-gray-200 mt-2">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
                }`}
                onClick={() => setActiveTab('dashboard')}
              >
                <span className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Dashboard
                </span>
              </button>
              <button
                className={`group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'calendar'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
                }`}
                onClick={() => setActiveTab('calendar')}
              >
                <span className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Calendar
                </span>
              </button>
              <button
                className="border-transparent text-gray-400 group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-not-allowed"
                title="Locked in demo"
                disabled
              >
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Meeting History
                </span>
              </button>
              <button
                className="border-transparent text-gray-400 group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-not-allowed"
                title="Locked in demo"
                disabled
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Commissions
                </span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Meetings Set (Nov)</h3>
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{monthlySet}</p>
                <p className="text-sm text-gray-500 mt-2">Total meetings on Grace&apos;s calendar</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Meetings Held (Nov)</h3>
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{monthlyHeld}</p>
                <p className="text-sm text-gray-500 mt-2">Completed meetings this month</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">No-Shows (Nov)</h3>
                  <History className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{noShowMeetings.length}</p>
                <p className="text-sm text-gray-500 mt-2">Meetings marked as no-show</p>
              </div>
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
          </>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <CalendarView
              meetings={enhancedMeetings as any}
              defaultDate={new Date(2025, 10, 12, 12, 0, 0)}
            />
          </div>
        )}
      </main>
    </div>
  );
}


