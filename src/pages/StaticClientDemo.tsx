import { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, Target, Users, Lock } from 'lucide-react';
import CalendarView from '../components/CalendarView';
import type { Meeting } from '../types/database';

const CLIENT_MEETINGS: Meeting[] = [
  {
    id: 'client-1',
    sdr_id: 'sdr-grace',
    client_id: 'client-circuitbay',
    scheduled_date: new Date(2025, 10, 12, 10, 0, 0).toISOString(),
    booked_at: new Date(2025, 10, 5, 12, 0, 0).toISOString(),
    status: 'confirmed',
    confirmed_at: new Date(2025, 10, 6, 9, 0, 0).toISOString(),
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Alex Johnson',
    contact_email: 'alex.johnson@example.com',
    contact_phone: null,
    company: 'CircuitBay',
    title: 'VP of Sales',
    linkedin_page: null,
    notes: 'Discovery call on outbound process and data integrations.',
    source: 'cold_email',
    created_at: new Date(2025, 10, 5, 12, 0, 0).toISOString(),
    updated_at: new Date(2025, 10, 10, 12, 0, 0).toISOString(),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: new Date(2025, 10, 6, 9, 0, 0).toISOString(),
    icp_checked_by: 'sdr-grace',
    icp_notes: null,
  },
  {
    id: 'client-2',
    sdr_id: 'sdr-ryan',
    client_id: 'client-harrington',
    scheduled_date: new Date(2025, 10, 13, 14, 30, 0).toISOString(),
    booked_at: new Date(2025, 10, 6, 12, 0, 0).toISOString(),
    status: 'confirmed',
    confirmed_at: new Date(2025, 10, 7, 9, 0, 0).toISOString(),
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Jordan Lee',
    contact_email: 'jordan.lee@example.com',
    contact_phone: null,
    company: 'CrestBridge',
    title: 'Director of Sales',
    linkedin_page: null,
    notes: 'Deep dive on qualification and handoff criteria.',
    source: 'referral',
    created_at: new Date(2025, 10, 6, 12, 0, 0).toISOString(),
    updated_at: new Date(2025, 10, 9, 12, 0, 0).toISOString(),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: new Date(2025, 10, 7, 9, 0, 0).toISOString(),
    icp_checked_by: 'sdr-ryan',
    icp_notes: null,
  },
  {
    id: 'client-3',
    sdr_id: 'sdr-grace',
    client_id: 'client-harrington',
    scheduled_date: new Date(2025, 10, 17, 9, 0, 0).toISOString(),
    booked_at: new Date(2025, 10, 8, 12, 0, 0).toISOString(),
    status: 'confirmed',
    confirmed_at: new Date(2025, 10, 9, 9, 0, 0).toISOString(),
    held_at: null,
    no_show: false,
    no_longer_interested: false,
    contact_full_name: 'Taylor Smith',
    contact_email: 'taylor.smith@example.com',
    contact_phone: null,
    company: 'Harrington Consulting',
    title: 'Head of Revenue Operations',
    linkedin_page: null,
    notes: 'Review pipeline coverage and next steps.',
    source: 'referral',
    created_at: new Date(2025, 10, 8, 12, 0, 0).toISOString(),
    updated_at: new Date(2025, 10, 9, 12, 0, 0).toISOString(),
    timezone: 'America/New_York',
    icp_status: 'approved',
    icp_checked_at: new Date(2025, 10, 9, 9, 0, 0).toISOString(),
    icp_checked_by: 'sdr-grace',
    icp_notes: null,
  },
];

export default function StaticClientDemo() {
  const [activeTab, setActiveTab] = useState<'overview' | 'meetings' | 'calendar'>('overview');
  const now = useMemo(() => new Date(2025, 10, 12, 12, 0, 0), []);
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const meetingsWithClientMeta = useMemo(
    () =>
      CLIENT_MEETINGS.map(meeting => ({
        ...meeting,
        clients: { name: meeting.company },
      })) as Array<Meeting & { clients: { name: string } }>,
    []
  );

  return (
    <div className="flex flex-col bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      <header className="shadow-lg border-b bg-gradient-to-r from-white via-emerald-50/30 to-white border-emerald-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                  Pype
                </span>
                <span className="bg-gradient-to-r from-cyan-600 to-teal-500 bg-clip-text text-transparent">
                  Flow
                </span>
              </h1>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-gray-800">Client Dashboard</p>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                    Demo Environment (read-only)
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500">{monthLabel}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-white text-gray-600 border'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'meetings'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-white text-gray-600 border'
              }`}
              onClick={() => setActiveTab('meetings')}
            >
              Meetings
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'calendar'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-white text-gray-600 border'
              }`}
              onClick={() => setActiveTab('calendar')}
            >
              Calendar
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Lead Sample (Locked)
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              ICP (Locked)
            </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1 w-full">
        {activeTab === 'overview' && (
          <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h3>
              <CalendarIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">4</p>
            <p className="text-sm text-gray-500 mt-2">
              Meetings scheduled with your SDR team this month
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Held This Month</h3>
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">3</p>
            <p className="text-sm text-gray-500 mt-2">
              Completed discovery or demo calls so far
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Goal Progress</h3>
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">75%</p>
            <p className="text-sm text-gray-500 mt-2">
              Toward this month&apos;s meeting goals with your SDR team
            </p>
          </div>
        </div>

        {/* Simple table of upcoming meetings */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h2>
            <span className="text-sm text-gray-500">Read-only demo view</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SDR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prospect
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">Wed, Nov 12</td>
                  <td className="px-6 py-4 whitespace-nowrap">10:00 AM</td>
                  <td className="px-6 py-4 whitespace-nowrap">Grace Laughlin</td>
                  <td className="px-6 py-4 whitespace-nowrap">Alex Johnson · CircuitBay</td>
                  <td className="px-6 py-4 whitespace-normal">
                    Discovery call on outbound process and data integrations.
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">Thu, Nov 13</td>
                  <td className="px-6 py-4 whitespace-nowrap">2:30 PM</td>
                  <td className="px-6 py-4 whitespace-nowrap">Ryan Chen</td>
                  <td className="px-6 py-4 whitespace-nowrap">Jordan Lee · CrestBridge</td>
                  <td className="px-6 py-4 whitespace-normal">
                    Deep dive on qualification and handoff criteria.
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">Mon, Nov 17</td>
                  <td className="px-6 py-4 whitespace-nowrap">9:00 AM</td>
                  <td className="px-6 py-4 whitespace-nowrap">Grace Laughlin</td>
                  <td className="px-6 py-4 whitespace-nowrap">Taylor Smith · Harrington</td>
                  <td className="px-6 py-4 whitespace-normal">
                    Review pipeline coverage and next steps.
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">Wed, Nov 19</td>
                  <td className="px-6 py-4 whitespace-nowrap">1:00 PM</td>
                  <td className="px-6 py-4 whitespace-nowrap">Lynn Lovelace</td>
                  <td className="px-6 py-4 whitespace-nowrap">Morgan Davis · bluecrest</td>
                  <td className="px-6 py-4 whitespace-normal">
                    Strategy alignment on ICP and expansion efforts.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}

        {activeTab === 'meetings' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Meetings</h3>
              <span className="text-sm text-gray-500">Read-only view</span>
            </div>
            <div className="space-y-4">
              {CLIENT_MEETINGS.map(meeting => (
                <div key={meeting.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(meeting.scheduled_date).toLocaleDateString()} ·{' '}
                        {new Date(meeting.scheduled_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        EST
                      </p>
                      <p className="text-sm text-gray-600">
                        SDR:{' '}
                        <span className="font-medium">
                          {(meeting.sdr_id ? meeting.sdr_id.replace('sdr-', '') : 'team').toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        meeting.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {meeting.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">
                    {meeting.contact_full_name} · {meeting.company}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{meeting.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <CalendarView
              meetings={meetingsWithClientMeta as any}
              defaultDate={new Date(2025, 10, 12, 12, 0, 0)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
