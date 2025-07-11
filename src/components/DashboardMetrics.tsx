import React from 'react';
import { Target, Calendar, HelpCircle, Clock, CheckCircle } from 'lucide-react';

interface DashboardMetricsProps {
  clients: Array<{
    name: string;
    monthly_set_target?: number;
    monthly_hold_target?: number;
  }>;
  monthProgress: number;
  totalMeetingGoal: number;
  totalHeldMeetings: number;
  totalSetTarget: number;
  totalHeldTarget: number;
  totalMeetingsSet: number;
  totalPendingMeetings: number;
  totalNoShowMeetings: number;
}

export default function DashboardMetrics({ 
  clients, 
  monthProgress,
  totalMeetingGoal,
  totalHeldMeetings,
  totalSetTarget,
  totalHeldTarget,
  totalMeetingsSet,
  totalPendingMeetings,
  totalNoShowMeetings,
}: DashboardMetricsProps) {
  const overallProgress = totalSetTarget > 0 ? (totalMeetingsSet / totalSetTarget) * 100 : 0;
  const isOnTrack = overallProgress >= monthProgress;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">Monthly Set Target</h3>
        </div>
        <div className="space-y-1 bg-indigo-50 p-3 rounded-md">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-indigo-700">{totalSetTarget.toLocaleString()}</span>
            <span className="text-sm text-gray-600">set goal</span>
          </div>
          <p className="text-xs text-gray-500">{(monthProgress ?? 0).toFixed(1)}% of month completed</p>
          <br></br>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">Monthly Held Target <Target className="w-5 h-5 text-indigo-500" /></h3>
        </div>
        <div className="space-y-1 bg-indigo-50 p-3 rounded-md">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-indigo-700">{totalHeldTarget.toLocaleString()}</span>
            <span className="text-sm text-gray-600">held goal</span>
          </div>
          <p className="text-xs text-gray-500">{(monthProgress ?? 0).toFixed(1)}% of month completed</p>
          <br></br>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 group relative">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-1">Meetings Set <HelpCircle className="w-4 h-4 text-gray-400" />
              <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <p className="mb-2">Meetings successfully scheduled this month:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Includes both confirmed and upcoming meetings</li>
                  <li>Tracked against your monthly set target</li>
                </ul>
              </div>
            </h3>
          </div>
          <Calendar className="w-6 h-6 text-green-500" />
        </div>
        <div className="space-y-1 bg-green-50 p-3 rounded-md">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-green-700">{totalMeetingsSet.toLocaleString()}</span>
            <span className="text-sm text-gray-600">meetings set</span>
          </div>
          <p className="text-sm text-gray-500">Set this month</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOnTrack ? 'bg-green-600' : 'bg-yellow-600'
                }`}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${
              isOnTrack ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {(overallProgress ?? 0).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 group relative">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-1">Meetings Held <HelpCircle className="w-4 h-4 text-gray-400" />
              <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <p className="mb-2">Successfully completed meetings this month:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Meetings marked as held</li>
                  <li>Excludes no-shows</li>
                </ul>
              </div>
            </h3>
          </div>
          <CheckCircle className="w-6 h-6 text-green-500" />
        </div>
        <div className="space-y-1 bg-green-50 p-3 rounded-md">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-green-700">{totalHeldMeetings.toLocaleString()}</span>
            <span className="text-sm text-gray-600">meetings held</span>
          </div>
          <p className="text-sm text-gray-500">Held this month</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  totalHeldTarget > 0 && totalHeldMeetings / totalHeldTarget >= 1
                    ? 'bg-green-600'
                    : 'bg-yellow-600'
                }`}
                style={{
                  width: `${totalHeldTarget > 0 ? (totalHeldMeetings / totalHeldTarget) * 100 : 0}%`
                }}
              />
            </div>
            <span
              className={`text-sm font-medium ${
                totalHeldTarget > 0 && totalHeldMeetings / totalHeldTarget >= 1
                  ? 'text-green-600'
                  : 'text-yellow-600'
              }`}
            >
              {totalHeldTarget > 0 ? ((totalHeldMeetings / totalHeldTarget) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 group relative">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-1">Pending <HelpCircle className="w-4 h-4 text-gray-400" />
              <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <p className="mb-2">Meetings that need confirmation:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Scheduled more than 3 days in advance</li>
                  <li>Need to be confirmed as the date approaches</li>
                </ul>
              </div>
            </h3>
          </div>
          <Clock className="w-6 h-6 text-yellow-500" />
        </div>
        <div className="space-y-1 bg-yellow-50 p-3 rounded-md">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-yellow-700">{totalPendingMeetings.toLocaleString()}</span>
            <span className="text-sm text-gray-600">pending meetings</span>
          </div>
          <p className="text-sm text-gray-500 pb-1">Pending confirmation</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 group relative">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-1">No Shows <HelpCircle className="w-4 h-4 text-gray-400" />
              <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <p className="mb-2">Meetings that were scheduled but not attended by the contact:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Marked as no-show manually or automatically</li>
                </ul>
              </div>
            </h3>
          </div>
          <Clock className="w-6 h-6 text-red-500" />
        </div>
        <div className="space-y-1 bg-red-50 p-3 rounded-md">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-red-700">{(totalNoShowMeetings ?? 0).toLocaleString()}</span>
            <span className="text-sm text-gray-600">no-show meetings</span>
          </div>
          <p className="text-sm text-gray-500 pb-1">Marked as no-shows</p>
        </div>
      </div>
    </div>
  );
}