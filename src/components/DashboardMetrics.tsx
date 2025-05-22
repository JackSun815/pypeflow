import React from 'react';
import { Target, Calendar, HelpCircle, Clock, CheckCircle } from 'lucide-react';

interface DashboardMetricsProps {
  clients: Array<{
    name: string;
    monthlyTarget: number;
    confirmedMeetings: number;
    pendingMeetings: number;
  }>;
  monthProgress: number;
  totalMeetingGoal: number;
  totalPendingMeetings: number;
  totalHeldMeetings: number;
}

export default function DashboardMetrics({ 
  clients, 
  monthProgress, 
  totalMeetingGoal,
  totalPendingMeetings,
  totalHeldMeetings 
}: DashboardMetricsProps) {
  const totalConfirmed = clients.reduce((sum, client) => sum + client.confirmedMeetings, 0);
  const totalMeetingsSet = totalConfirmed + totalPendingMeetings;
  const overallProgress = totalMeetingGoal > 0 ? (totalMeetingsSet / totalMeetingGoal) * 100 : 0;
  const isOnTrack = overallProgress >= monthProgress;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Target</h3>
          <Target className="w-6 h-6 text-indigo-600" />
        </div>
        <p className="text-3xl font-bold text-gray-900">{totalMeetingGoal}</p>
        <p className="text-sm text-gray-500 mt-2">
          {monthProgress.toFixed(1)}% of month completed
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 group relative">
            <h3 className="text-lg font-semibold text-gray-900">Meetings Set</h3>
            <HelpCircle className="w-4 h-4 text-gray-400" />
            <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <p className="mb-2">Total meetings set this month:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Confirmed meetings: {totalConfirmed}</li>
                <li>Pending meetings: {totalPendingMeetings}</li>
              </ul>
            </div>
          </div>
          <Calendar className="w-6 h-6 text-indigo-600" />
        </div>
        <p className="text-3xl font-bold text-gray-900">{totalMeetingsSet}</p>
        <div className="flex items-center gap-2 mt-2">
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
            {overallProgress.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 group relative">
            <h3 className="text-lg font-semibold text-gray-900">Meetings Held</h3>
            <HelpCircle className="w-4 h-4 text-gray-400" />
            <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <p className="mb-2">Successfully completed meetings this month:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Meetings marked as held</li>
                <li>Excludes no-shows</li>
              </ul>
            </div>
          </div>
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-3xl font-bold text-gray-900">{totalHeldMeetings}</p>
        <p className="text-sm text-gray-500 mt-2">
          Completed meetings
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 group relative">
            <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
            <HelpCircle className="w-4 h-4 text-gray-400" />
            <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <p className="mb-2">Meetings that need confirmation:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Scheduled more than 3 days in advance</li>
                <li>Need to be confirmed as the date approaches</li>
              </ul>
            </div>
          </div>
          <Clock className="w-6 h-6 text-yellow-600" />
        </div>
        <p className="text-3xl font-bold text-gray-900">{totalPendingMeetings}</p>
        <p className="text-sm text-gray-500 mt-2">
          Awaiting confirmation
        </p>
      </div>
    </div>
  );
}