import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  Users,
  Target,
  Calendar as CalendarIcon,
  BarChart2,
  Building,
  Lock,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import UnifiedMeetingLists from '../components/UnifiedMeetingLists';
import CalendarView from '../components/CalendarView';
import DemoBanner, { LockedTabMessage } from '../components/DemoBanner';
import type { Meeting } from '../types/database';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

type SDR = {
  id: string;
  name: string;
};

type DemoClient = {
  id: string;
  name: string;
  monthly_set_target: number;
  monthly_hold_target: number;
};

const SDRS: SDR[] = [
  { id: 'sdr-riley', name: 'Riley Green' },
  { id: 'sdr-grace', name: 'Grace Laughlin' },
  { id: 'sdr-ryan', name: 'Ryan Chen' },
  { id: 'sdr-lynn', name: 'Lynn Lovelace' },
  { id: 'sdr-chris', name: 'Chris Morten' },
];

const CLIENTS: DemoClient[] = [
  { id: 'client-circuitbay', name: 'CircuitBay Solutions', monthly_set_target: 24, monthly_hold_target: 18 },
  { id: 'client-harrington', name: 'Harrington Consulting', monthly_set_target: 20, monthly_hold_target: 15 },
  { id: 'client-crestbridge', name: 'CrestBridge Biotech', monthly_set_target: 18, monthly_hold_target: 14 },
  { id: 'client-bluecrest', name: 'bluecrest Analytics', monthly_set_target: 22, monthly_hold_target: 17 },
  { id: 'client-northline', name: 'Northline Capital Partners', monthly_set_target: 26, monthly_hold_target: 20 },
];

// Simple helper to create ISO timestamps in 2025 (local time → ISO)
function makeDate(month: number, day: number, hour: number): string {
  // month is 1-based (10 = October, 11 = November, 12 = December)
  const d = new Date(2025, month - 1, day, hour, 0, 0);
  return d.toISOString();
}

// Synthetic meetings placeholder – populated with deterministic demo data
const DEMO_MEETINGS: Meeting[] = [];

// Build 60–80 synthetic meetings across Oct, Nov, Dec 2025
(function initDemoMeetings() {
  let idCounter = 1;

  const baseContacts: Array<[string, string]> = [
    ['Alex Johnson', 'alex.johnson@example.com'],
    ['Taylor Smith', 'taylor.smith@example.com'],
    ['Jordan Lee', 'jordan.lee@example.com'],
    ['Casey Morgan', 'casey.morgan@example.com'],
    ['Sam Rivera', 'sam.rivera@example.com'],
    ['Jamie Patel', 'jamie.patel@example.com'],
    ['Morgan Davis', 'morgan.davis@example.com'],
    ['Avery Brooks', 'avery.brooks@example.com'],
    ['Priya Shah', 'priya.shah@example.com'],
    ['Diego Martinez', 'diego.martinez@example.com'],
    ['Emily Carter', 'emily.carter@example.com'],
    ['Noah Williams', 'noah.williams@example.com'],
    ['Sophia Nguyen', 'sophia.nguyen@example.com'],
    ['Liam O’Connor', 'liam.oconnor@example.com'],
    ['Isabella Rossi', 'isabella.rossi@example.com'],
    ['Ethan Kim', 'ethan.kim@example.com'],
    ['Mia Hernandez', 'mia.hernandez@example.com'],
    ['Logan Fischer', 'logan.fischer@example.com'],
    ['Chloe Brown', 'chloe.brown@example.com'],
    ['Oliver Clark', 'oliver.clark@example.com'],
  ];

  const titles = [
    'VP of Sales',
    'Head of Revenue Operations',
    'Chief Growth Officer',
    'Director of Sales',
    'CRO',
    'Head of Partnerships',
  ];

  const sources: (string | null)[] = ['cold_email', 'linkedin', 'referral', 'inbound', 'direct', null];

  function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Helper: return all weekday days (Mon–Fri) for a given month in 2025
  function getWeekdays(month: 10 | 11 | 12): number[] {
    const days: number[] = [];
    const year = 2025;
    for (let day = 1; day <= 31; day++) {
      const d = new Date(Date.UTC(year, month - 1, day));
      if (d.getUTCMonth() !== month - 1) break;
      const dow = d.getUTCDay(); // 0=Sun,6=Sat
      if (dow >= 1 && dow <= 5) {
        days.push(day);
      }
    }
    return days;
  }

  const OCT_WEEKDAYS = getWeekdays(10);
  const NOV_WEEKDAYS = getWeekdays(11);
  const DEC_WEEKDAYS = getWeekdays(12);

  // Stagger meeting times to avoid heavy overlap in the calendar view (7 AM–5 PM local)
  function timeSlotFor(clientIdx: number, sequenceIndex: number): number {
    const minHour = 7;
    const maxHour = 17;
    const span = maxHour - minHour + 1;
    // Deterministic but spread out based on client + sequence
    const offset = (clientIdx * 7 + sequenceIndex * 3) % span;
    return minHour + offset;
  }

  function createMeeting(params: {
    month: 10 | 11 | 12;
    day: number;
    hour: number;
    clientId: string;
    sdrId: string;
    status: 'pending' | 'confirmed';
    held: boolean;
    noShow?: boolean;
  }) {
    const [contactName, contactEmail] = pick(baseContacts);
    const client = CLIENTS.find(c => c.id === params.clientId);
    const companySnippet = client ? client.name.split(' ')[0] : 'ProspectCo';
    const title = pick(titles);
    const scheduled = makeDate(params.month, params.day, params.hour);
    const bookedAt = makeDate(params.month, Math.max(1, params.day - 7), 15);

    const held_at =
      params.held && !params.noShow
        ? makeDate(params.month, params.day, params.hour + 1)
        : null;

    const no_show = !!params.noShow;

    const meeting: Meeting = {
      id: `demo-meeting-${idCounter++}`,
      sdr_id: params.sdrId,
      client_id: params.clientId,
      scheduled_date: scheduled,
      booked_at: bookedAt,
      status: params.status,
      confirmed_at: params.status === 'confirmed' ? bookedAt : null,
      held_at,
      no_show,
      no_longer_interested: false,
      contact_full_name: contactName,
      contact_email: contactEmail,
      contact_phone: null,
      company: `${companySnippet} Labs`,
      title,
      linkedin_page: null,
      notes: null,
      source: pick(sources),
      created_at: bookedAt,
      updated_at: bookedAt,
      timezone: 'America/New_York',
      icp_status: 'approved',
      icp_checked_at: bookedAt,
      icp_checked_by: 'demo-manager',
      icp_notes: null,
    };

    DEMO_MEETINGS.push(meeting);
  }

  // October (history) – mostly held
  CLIENTS.forEach((client, clientIdx) => {
    const sdr = SDRS[clientIdx % SDRS.length];
    const daysForClient = OCT_WEEKDAYS.slice(clientIdx, clientIdx + 5); // 5 historical meetings per client
    daysForClient.forEach((day, idx) => {
      createMeeting({
        month: 10,
        day,
        hour: timeSlotFor(clientIdx, idx),
        clientId: client.id,
        sdrId: sdr.id,
        status: 'confirmed',
        held: true,
      });
    });
  });

  // November (focus month) – mix of held, upcoming confirmed and pending
  CLIENTS.forEach((client, clientIdx) => {
    const primarySdr = SDRS[clientIdx % SDRS.length];
    const secondarySdr = SDRS[(clientIdx + 2) % SDRS.length];

    // Held meetings (strong but not perfect performance) - early and mid month
    const novHeldDays = NOV_WEEKDAYS.slice(0, 8); // 8 weekday slots
    novHeldDays.forEach((day, idx) => {
      createMeeting({
        month: 11,
        day,
        hour: timeSlotFor(clientIdx, idx),
        clientId: client.id,
        sdrId: primarySdr.id,
        status: 'confirmed',
        held: true,
      });
    });

    // Additional held/confirmed in week of Nov 17–21
    const novWeek3Days = NOV_WEEKDAYS.filter(day => day >= 17 && day <= 21);
    novWeek3Days.forEach((day, idx) => {
      createMeeting({
        month: 11,
        day,
        hour: timeSlotFor(clientIdx, idx + 30),
        clientId: client.id,
        sdrId: primarySdr.id,
        status: 'confirmed',
        held: idx % 2 === 0, // some held, some upcoming
      });
    });

    // Upcoming confirmed (late Nov)
    const novConfirmedDays = NOV_WEEKDAYS.slice(8, 11);
    novConfirmedDays.forEach((day, idx) => {
      createMeeting({
        month: 11,
        day,
        hour: timeSlotFor(clientIdx, idx + 10),
        clientId: client.id,
        sdrId: secondarySdr.id,
        status: 'confirmed',
        held: false,
      });
    });

    // Pending (mid-late month)
    const novPendingDays = NOV_WEEKDAYS.slice(4, 7);
    novPendingDays.forEach((day, idx) => {
      createMeeting({
        month: 11,
        day,
        hour: timeSlotFor(clientIdx, idx + 20),
        clientId: client.id,
        sdrId: secondarySdr.id,
        status: 'pending',
        held: false,
      });
    });
  });

  // December (future pipeline)
  CLIENTS.forEach((client, clientIdx) => {
    const sdr = SDRS[(clientIdx + 1) % SDRS.length];
    const decDays = DEC_WEEKDAYS.slice(0, 2);
    decDays.forEach((day, idx) => {
      createMeeting({
        month: 12,
        day,
        hour: timeSlotFor(clientIdx, idx + 30),
        clientId: client.id,
        sdrId: sdr.id,
        status: 'confirmed',
        held: false,
      });
    });
  });

  // Adjust some November confirmed meetings to be no-shows (approx 20%) for ~80% show rate
  const novemberConfirmed = DEMO_MEETINGS.filter(m => {
    const d = new Date(m.scheduled_date);
    return (
      d >= new Date(Date.UTC(2025, 10, 1)) &&
      d < new Date(Date.UTC(2025, 11, 1)) &&
      m.status === 'confirmed'
    );
  });

  const targetNoShows = Math.round(novemberConfirmed.length * 0.2);
  for (let i = 0; i < targetNoShows && novemberConfirmed.length > 0; i++) {
    const index = (i * 3) % novemberConfirmed.length;
    const m = novemberConfirmed[index];
    m.no_show = true;
    m.held_at = null;
  }
})();

export default function StaticManagerDemo() {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'users' | 'meetings' | 'history' | 'icp'>('overview');
  const [selectedSDRFilter, setSelectedSDRFilter] = useState<string | 'all'>('all');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string | 'all'>('all');

  // Lock "current date" for demo to Wed Nov 12, 2025 (local time)
  const now = useMemo(() => new Date(2025, 10, 12, 12, 0, 0), []);
  const currentMonthLabel = format(now, 'MMMM yyyy');

  // November window for metrics
  const monthStart = new Date(Date.UTC(2025, 10, 1));
  const nextMonthStart = new Date(Date.UTC(2025, 11, 1));

  const novemberMeetings = useMemo(
    () =>
      DEMO_MEETINGS.filter(m => {
        const d = new Date(m.scheduled_date);
        return d >= monthStart && d < nextMonthStart;
      }),
    []
  );

  const totalSetTarget = CLIENTS.reduce((sum, c) => sum + c.monthly_set_target, 0);
  const totalHeldTarget = CLIENTS.reduce((sum, c) => sum + c.monthly_hold_target, 0);

  const monthlyMeetingsSetCount = novemberMeetings.length;
  const monthlyHeldMeetingsCount = novemberMeetings.filter(m => !!m.held_at && !m.no_show).length;
  const monthlyPendingMeetings = novemberMeetings.filter(m => m.status === 'pending' && !m.no_show && !m.held_at).length;
  const monthlyNoShowMeetings = novemberMeetings.filter(m => m.no_show).length;

  const totalMeetingsSet = DEMO_MEETINGS.length;
  const totalHeldMeetings = DEMO_MEETINGS.filter(m => !!m.held_at && !m.no_show).length;
  const totalPendingMeetings = DEMO_MEETINGS.filter(
    m => m.status === 'pending' && !m.no_show && !m.held_at
  ).length;
  const totalNoShowMeetings = DEMO_MEETINGS.filter(m => m.no_show).length;

  const monthProgress = (() => {
    const daysInMonth = new Date(2025, 11, 0).getDate();
    const dayOfMonth = now.getUTCDate();
    return (dayOfMonth / daysInMonth) * 100;
  })();

  // Aggregates reserved for potential future use (currently unused)

  const enhancedMeetings = useMemo(
    () =>
      DEMO_MEETINGS.map(m => {
        const client = CLIENTS.find(c => c.id === m.client_id);
        const clientName = client?.name || 'Unknown Client';
        return {
          ...m,
          sdr_name: SDRS.find(s => s.id === m.sdr_id)?.name || 'Unknown SDR',
          client_name: clientName,
          clients: { name: clientName },
        };
      }),
    []
  );

  const filteredMeetings = useMemo(() => {
    return enhancedMeetings.filter(m => {
      if (selectedSDRFilter !== 'all' && m.sdr_id !== selectedSDRFilter) return false;
      if (selectedClientFilter !== 'all' && m.client_id !== selectedClientFilter) return false;
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DemoBanner />
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">Pype</span>
              <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">Flow</span>
            </h1>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-800">Manager Dashboard</p>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  Demo Environment (read-only mode)
                </span>
              </div>
              <p className="text-sm text-gray-500">{currentMonthLabel}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1 w-full">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 flex items-center justify-between">
          <nav className="-mb-px flex space-x-8">
            {/* Overview */}
            <button
              className={`${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-indigo-500 hover:border-indigo-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Overview
              </span>
            </button>

            {/* Team's Meetings (unlocked, placed next to Overview) */}
            <button
              className={`${
                activeTab === 'meetings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-indigo-500 hover:border-indigo-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              onClick={() => setActiveTab('meetings')}
            >
              <span className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Team&apos;s Meetings
              </span>
            </button>

            {/* Locked tabs follow */}
            <button
              className="border-transparent text-gray-400 hover:text-gray-500 hover:border-gray-300 group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors"
              onClick={() => setActiveTab('clients')}
            >
              <span className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Client Management
                <Lock className="w-3 h-3 text-gray-400" />
              </span>
            </button>
            <button
              className="border-transparent text-gray-400 hover:text-gray-500 hover:border-gray-300 group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors"
              onClick={() => setActiveTab('users')}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                User Management
                <Lock className="w-3 h-3 text-gray-400" />
              </span>
            </button>
            <button
              className="border-transparent text-gray-400 hover:text-gray-500 hover:border-gray-300 group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors"
              onClick={() => setActiveTab('history')}
            >
              <span className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Meeting History
                <Lock className="w-3 h-3 text-gray-400" />
              </span>
            </button>
            <button
              className="border-transparent text-gray-400 hover:text-gray-500 hover:border-gray-300 group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors"
              onClick={() => setActiveTab('icp')}
            >
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                ICP Check
                <Lock className="w-3 h-3 text-gray-400" />
              </span>
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Overview cards (mirroring live dashboard style) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Active SDRs */}
              <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg hover:border-2 hover:border-indigo-200 transition-all duration-200 border-2 border-transparent">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Active SDRs</h3>
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{SDRS.length}</p>
                <p className="text-xs text-indigo-600 mt-2 font-medium">Demo team for this environment</p>
              </div>

              {/* Monthly Set Target */}
              <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg hover:border-2 hover:border-indigo-200 transition-all duration-200 border-2 border-transparent">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Monthly Set Target</h3>
                  <Target className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalSetTarget}</p>
                <p className="text-sm text-gray-500 mt-2">{monthProgress.toFixed(1)}% of month completed</p>
              </div>

              {/* Monthly Held Target */}
              <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg hover:border-2 hover:border-indigo-200 transition-all duration-200 border-2 border-transparent">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Monthly Held Target</h3>
                  <Target className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalHeldTarget}</p>
                <p className="text-sm text-gray-500 mt-2">{monthProgress.toFixed(1)}% of month completed</p>
              </div>
            </div>

            {/* Meetings cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg hover:border-2 hover:border-green-200 transition-all duration-200 border-2 border-transparent">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Meetings Set (Nov)</h3>
                  <CalendarIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{monthlyMeetingsSetCount}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {totalSetTarget > 0 ? ((monthlyMeetingsSetCount / totalSetTarget) * 100).toFixed(1) : '0.0'}% of target
                </p>
                <p className="text-sm text-gray-600 mt-1">Cumulative: {totalMeetingsSet}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg hover:border-2 hover:border-green-200 transition-all duration-200 border-2 border-transparent">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Meetings Held (Nov)</h3>
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{monthlyHeldMeetingsCount}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {totalHeldTarget > 0 ? ((monthlyHeldMeetingsCount / totalHeldTarget) * 100).toFixed(1) : '0.0'}% of target
                </p>
                <p className="text-sm text-gray-600 mt-1">Cumulative: {totalHeldMeetings}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg hover:border-2 hover:border-yellow-200 transition-all duration-200 border-2 border-transparent">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Pending (Nov)</h3>
                  <CalendarIcon className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{monthlyPendingMeetings}</p>
                <p className="text-sm text-gray-500 mt-2">Pending confirmation</p>
                <p className="text-sm text-gray-600 mt-1">Cumulative: {totalPendingMeetings}</p>
              </div>
            </div>

            {/* Cumulative performance summary */}
            <div className="rounded-lg shadow-md p-6 mb-4 bg-white">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Cumulative Performance (All Time)</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{totalMeetingsSet}</p>
                  <p className="text-sm text-gray-600">Total Meetings Set</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{totalHeldMeetings}</p>
                  <p className="text-sm text-gray-600">Total Meetings Held</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{totalPendingMeetings}</p>
                  <p className="text-sm text-gray-600">Total Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{totalNoShowMeetings}</p>
                  <p className="text-sm text-gray-600">Total No-Shows</p>
                </div>
              </div>
            </div>

            {/* Charts row: Monthly Performance + Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="rounded-lg shadow-md p-6 bg-white">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Monthly Performance</h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: ['Set Meetings', 'Held Meetings'],
                      datasets: [
                        {
                          label: 'Target',
                          data: [totalSetTarget, totalHeldTarget],
                          backgroundColor: ['rgba(59, 130, 246, 0.3)', 'rgba(34, 197, 94, 0.3)'],
                          borderColor: ['rgba(59, 130, 246, 1)', 'rgba(34, 197, 94, 1)'],
                          borderWidth: 2,
                        },
                        {
                          label: 'Actual',
                          data: [monthlyMeetingsSetCount, monthlyHeldMeetingsCount],
                          backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)'],
                          borderColor: ['rgba(59, 130, 246, 1)', 'rgba(34, 197, 94, 1)'],
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        title: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="rounded-lg shadow-md p-6 bg-white">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Meeting Status Distribution (Nov)</h3>
                <div className="h-64">
                  <Doughnut
                    data={{
                      labels: ['Held', 'Pending', 'No-Show'],
                      datasets: [
                        {
                          data: [monthlyHeldMeetingsCount, monthlyPendingMeetings, monthlyNoShowMeetings],
                          backgroundColor: [
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(251, 191, 36, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                          ],
                          borderColor: [
                            'rgba(34, 197, 94, 1)',
                            'rgba(251, 191, 36, 1)',
                            'rgba(239, 68, 68, 1)',
                          ],
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                        title: {
                          display: false,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">SDR:</span>
                <select
                  value={selectedSDRFilter}
                  onChange={e => setSelectedSDRFilter(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All SDRs</option>
                  {SDRS.map(sdr => (
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
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Clients</option>
                  {CLIENTS.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calendar */}
            <div className="mb-10">
              <CalendarView
                meetings={filteredMeetings as any}
                defaultDate={new Date(2025, 10, 12, new Date().getHours(), new Date().getMinutes(), 0)}
              />
            </div>

            {/* Unified meeting lists */}
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

        {activeTab === 'clients' && <LockedTabMessage featureName="Client Management" />}
        {activeTab === 'users' && <LockedTabMessage featureName="User Management" />}
        {activeTab === 'history' && <LockedTabMessage featureName="Meeting History" />}
        {activeTab === 'icp' && <LockedTabMessage featureName="ICP Check" />}
      </main>
    </div>
  );
}


