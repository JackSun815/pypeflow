import React, { useState } from 'react';
import { Target, Calendar, HelpCircle, Clock, CheckCircle, X, User, Mail, Phone, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import type { Meeting } from '../types/database';

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
  meetings: Meeting[];
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
  meetings,
}: DashboardMetricsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'setTarget' | 'heldTarget' | 'meetingsSet' | 'meetingsHeld' | 'pending' | 'noShows' | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<any>(null);

  const overallProgress = totalSetTarget > 0 ? (totalMeetingsSet / totalSetTarget) * 100 : 0;
  const isOnTrack = overallProgress >= monthProgress;

  // Filter meetings for current month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthlyMeetings = meetings.filter(meeting => {
    const createdDate = new Date(meeting.created_at);
    return createdDate >= monthStart && createdDate <= monthEnd;
  });

  // Filter meetings by category
  const meetingsSet = monthlyMeetings;
  const meetingsHeld = monthlyMeetings.filter(m => m.held_at !== null && !m.no_show);
  const pendingMeetings = monthlyMeetings.filter(m => m.status === 'pending' && !m.no_show);
  const noShowMeetings = monthlyMeetings.filter(m => m.no_show);

  const handleCardClick = (type: 'setTarget' | 'heldTarget' | 'meetingsSet' | 'meetingsHeld' | 'pending' | 'noShows') => {
    let title = '';
    let content = null;

    switch (type) {
      case 'setTarget':
        title = 'Monthly Set Targets by Client';
        content = {
          type: 'setTarget',
          data: clients.map(client => ({
            name: client.name,
            target: client.monthly_set_target || 0
          }))
        };
        break;
      case 'heldTarget':
        title = 'Monthly Held Targets by Client';
        content = {
          type: 'heldTarget',
          data: clients.map(client => ({
            name: client.name,
            target: client.monthly_hold_target || 0
          }))
        };
        break;
      case 'meetingsSet':
        title = 'Meetings Set This Month';
        content = {
          type: 'meetingsSet',
          data: {
            total: totalMeetingsSet,
            target: totalSetTarget,
            percentage: overallProgress,
            meetings: meetingsSet
          }
        };
        break;
      case 'meetingsHeld':
        title = 'Meetings Held This Month';
        content = {
          type: 'meetingsHeld',
          data: {
            total: totalHeldMeetings,
            target: totalHeldTarget,
            percentage: totalHeldTarget > 0 ? (totalHeldMeetings / totalHeldTarget) * 100 : 0,
            meetings: meetingsHeld
          }
        };
        break;
      case 'pending':
        title = 'Pending Meetings';
        content = {
          type: 'pending',
          data: {
            total: totalPendingMeetings,
            meetings: pendingMeetings
          }
        };
        break;
      case 'noShows':
        title = 'No-Show Meetings';
        content = {
          type: 'noShows',
          data: {
            total: totalNoShowMeetings,
            meetings: noShowMeetings
          }
        };
        break;
    }

    setModalContent(content);
    setModalTitle(title);
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalContent(null);
    setModalTitle('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string, noShow: boolean) => {
    if (noShow) return 'bg-red-100 text-red-700';
    if (status === 'confirmed') return 'bg-green-100 text-green-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getStatusText = (status: string, noShow: boolean) => {
    if (noShow) return 'No Show';
    if (status === 'confirmed') return 'Confirmed';
    return 'Pending';
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg hover:border-2 hover:border-indigo-200 transition-all duration-200 border-2 border-transparent"
          onClick={() => handleCardClick('setTarget')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">Monthly Set Target</h3>
          </div>
          <div className="space-y-1 bg-indigo-50 p-3 rounded-md">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-indigo-700">{totalSetTarget.toLocaleString()}</span>
              <span className="text-sm text-gray-600">set goal</span>
            </div>
            <p className="text-xs text-gray-500">{(monthProgress ?? 0).toFixed(1)}% of month completed</p>

          </div>
        </div>

        <div 
          className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg hover:border-2 hover:border-indigo-200 transition-all duration-200 border-2 border-transparent"
          onClick={() => handleCardClick('heldTarget')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">Monthly Held Target <Target className="w-5 h-5 text-indigo-500" /></h3>
          </div>
          <div className="space-y-1 bg-indigo-50 p-3 rounded-md">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-indigo-700">{totalHeldTarget.toLocaleString()}</span>
              <span className="text-sm text-gray-600">held goal</span>
            </div>
            <p className="text-xs text-gray-500">{(monthProgress ?? 0).toFixed(1)}% of month completed</p>

          </div>
        </div>

        <div 
          className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg hover:border-2 hover:border-green-200 transition-all duration-200 border-2 border-transparent"
          onClick={() => handleCardClick('meetingsSet')}
        >
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

        <div 
          className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg hover:border-2 hover:border-green-200 transition-all duration-200 border-2 border-transparent"
          onClick={() => handleCardClick('meetingsHeld')}
        >
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

        <div 
          className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg hover:border-2 hover:border-yellow-200 transition-all duration-200 border-2 border-transparent"
          onClick={() => handleCardClick('pending')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 group relative">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-1">Pending <HelpCircle className="w-4 h-4 text-gray-400" />
                <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <p className="mb-2">Meetings that need confirmation:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>All new meetings start as pending</li>
                    <li>Need to be manually confirmed</li>
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

        <div 
          className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg hover:border-2 hover:border-red-200 transition-all duration-200 border-2 border-transparent"
          onClick={() => handleCardClick('noShows')}
        >
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{modalTitle}</h2>
              <button
                onClick={closeModal}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {modalContent?.type === 'setTarget' ? (
                <div className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">Total Set Target: {totalSetTarget}</h3>
                    <p className="text-sm text-indigo-700">Breakdown by client:</p>
                  </div>
                  {modalContent.data.map((client: any) => (
                    <div key={client.name} className="bg-gray-50 p-4 rounded-md shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{client.name}</h3>
                      <p className="text-sm text-gray-700">Set Target: {client.target}</p>
                    </div>
                  ))}
                </div>
              ) : modalContent?.type === 'heldTarget' ? (
                <div className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">Total Held Target: {totalHeldTarget}</h3>
                    <p className="text-sm text-indigo-700">Breakdown by client:</p>
                  </div>
                  {modalContent.data.map((client: any) => (
                    <div key={client.name} className="bg-gray-50 p-4 rounded-md shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{client.name}</h3>
                      <p className="text-sm text-gray-700">Held Target: {client.target}</p>
                    </div>
                  ))}
                </div>
              ) : modalContent?.type === 'meetingsSet' ? (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Meetings Set This Month</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-2xl font-bold text-green-700">{modalContent.data.total}</p>
                        <p className="text-sm text-green-600">Meetings Set</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-indigo-700">{modalContent.data.target}</p>
                        <p className="text-sm text-indigo-600">Target</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            modalContent.data.percentage >= monthProgress ? 'bg-green-600' : 'bg-yellow-600'
                          }`}
                          style={{ width: `${Math.min(modalContent.data.percentage, 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${
                        modalContent.data.percentage >= monthProgress ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {modalContent.data.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {modalContent.data.percentage >= monthProgress ? 'On track!' : 'Behind target'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {modalContent.data.meetings.length > 0 ? (
                      modalContent.data.meetings.map((meeting: Meeting) => (
                        <div key={meeting.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <h4 className="font-semibold text-gray-900">{meeting.contact_full_name}</h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(meeting.status, meeting.no_show)}`}>
                                  {getStatusText(meeting.status, meeting.no_show)}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                {meeting.contact_email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3" />
                                    <span>{meeting.contact_email}</span>
                                  </div>
                                )}
                                {meeting.contact_phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3" />
                                    <span>{meeting.contact_phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="w-3 h-3" />
                                  <span>{formatDate(meeting.scheduled_date)}</span>
                                </div>
                                {meeting.company && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3" />
                                    <span>{meeting.company}</span>
                                  </div>
                                )}
                                {meeting.title && (
                                  <p className="text-xs text-gray-500 mt-1">{meeting.title}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No meetings set this month</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : modalContent?.type === 'meetingsHeld' ? (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Meetings Held This Month</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-2xl font-bold text-green-700">{modalContent.data.total}</p>
                        <p className="text-sm text-green-600">Meetings Held</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-indigo-700">{modalContent.data.target}</p>
                        <p className="text-sm text-indigo-600">Target</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            modalContent.data.percentage >= 100 ? 'bg-green-600' : 'bg-yellow-600'
                          }`}
                          style={{ width: `${Math.min(modalContent.data.percentage, 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${
                        modalContent.data.percentage >= 100 ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {modalContent.data.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {modalContent.data.percentage >= 100 ? 'Target achieved!' : 'Working towards target'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {modalContent.data.meetings.length > 0 ? (
                      modalContent.data.meetings.map((meeting: Meeting) => (
                        <div key={meeting.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <h4 className="font-semibold text-gray-900">{meeting.contact_full_name}</h4>
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                  Held
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                {meeting.contact_email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3" />
                                    <span>{meeting.contact_email}</span>
                                  </div>
                                )}
                                {meeting.contact_phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3" />
                                    <span>{meeting.contact_phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="w-3 h-3" />
                                  <span>{formatDate(meeting.scheduled_date)}</span>
                                </div>
                                {meeting.company && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3" />
                                    <span>{meeting.company}</span>
                                  </div>
                                )}
                                {meeting.title && (
                                  <p className="text-xs text-gray-500 mt-1">{meeting.title}</p>
                                )}
                                {meeting.held_at && (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="w-3 h-3" />
                                    <span className="text-xs">Held on {formatDate(meeting.held_at)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No meetings held this month</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : modalContent?.type === 'pending' ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">Pending Meetings</h3>
                    <p className="text-2xl font-bold text-yellow-700">{modalContent.data.total}</p>
                    <p className="text-sm text-yellow-600">Meetings awaiting confirmation</p>
                    <div className="mt-4">
                      <p className="text-sm text-gray-700">
                        These meetings have been scheduled but are still pending confirmation from the prospect.
                        You can confirm them once you receive confirmation from the contact.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {modalContent.data.meetings.length > 0 ? (
                      modalContent.data.meetings.map((meeting: Meeting) => (
                        <div key={meeting.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <h4 className="font-semibold text-gray-900">{meeting.contact_full_name}</h4>
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                                  Pending
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                {meeting.contact_email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3" />
                                    <span>{meeting.contact_email}</span>
                                  </div>
                                )}
                                {meeting.contact_phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3" />
                                    <span>{meeting.contact_phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="w-3 h-3" />
                                  <span>{formatDate(meeting.scheduled_date)}</span>
                                </div>
                                {meeting.company && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3" />
                                    <span>{meeting.company}</span>
                                  </div>
                                )}
                                {meeting.title && (
                                  <p className="text-xs text-gray-500 mt-1">{meeting.title}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No pending meetings</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : modalContent?.type === 'noShows' ? (
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">No-Show Meetings</h3>
                    <p className="text-2xl font-bold text-red-700">{modalContent.data.total}</p>
                    <p className="text-sm text-red-600">Meetings marked as no-shows</p>
                    <div className="mt-4">
                      <p className="text-sm text-gray-700">
                        These meetings were scheduled but the prospect did not attend. 
                        No-shows are tracked separately from your targets and don't count against your performance.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {modalContent.data.meetings.length > 0 ? (
                      modalContent.data.meetings.map((meeting: Meeting) => (
                        <div key={meeting.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <h4 className="font-semibold text-gray-900">{meeting.contact_full_name}</h4>
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                                  No Show
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                {meeting.contact_email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3" />
                                    <span>{meeting.contact_email}</span>
                                  </div>
                                )}
                                {meeting.contact_phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3" />
                                    <span>{meeting.contact_phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="w-3 h-3" />
                                  <span>{formatDate(meeting.scheduled_date)}</span>
                                </div>
                                {meeting.company && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3" />
                                    <span>{meeting.company}</span>
                                  </div>
                                )}
                                {meeting.title && (
                                  <p className="text-xs text-gray-500 mt-1">{meeting.title}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No no-show meetings</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No information available for this category.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}