import { useMemo } from 'react';
import { Calendar as CalendarIcon, Target, Users } from 'lucide-react';

export default function StaticClientDemo() {
  // Lock demo "today" to Nov 12, 2025 (for consistency)
  const now = useMemo(() => new Date(2025, 10, 12, 12, 0, 0), []);
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      {/* Header */}
      <header className="shadow-lg border-b bg-gradient-to-r from-white via-emerald-50/30 to-white border-emerald-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
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
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1 w-full">
        {/* Summary cards */}
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
      </main>
    </div>
  );
}


