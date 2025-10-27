import { useState } from 'react';
import { Calendar, Target, Plus, CheckCircle, User, Mail, Phone, X, Clock, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { MeetingCard } from './MeetingCard';
import type { Meeting } from '../types/database';

interface ClientCardProps {
  name: string;
  monthly_set_target: number;
  monthly_hold_target: number;
  confirmedMeetings: number;
  pendingMeetings: number;
  heldMeetings: number;
  totalMeetingsSet?: number;
  todaysMeetings: Array<{
    id: string;
    scheduled_date: string;
    status: 'pending' | 'confirmed';
    contact_full_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
  }>;
  onAddMeeting: () => void;
  onConfirmMeeting: (meetingId: string) => void;
  onEditMeeting?: (meeting: any) => void;
  isInactive?: boolean;
  deactivatedAt?: string;
  goalTiers?: Array<{
    percentage: number;
    bonus: number;
  }>;
  allMeetings?: Meeting[];
  clientId?: string;
}

export default function ClientCard({
  name,
  monthly_set_target,
  monthly_hold_target,
  confirmedMeetings,
  pendingMeetings,
  heldMeetings,
  totalMeetingsSet,
  todaysMeetings,
  onAddMeeting,
  onConfirmMeeting,
  onEditMeeting,
  isInactive = false,
  deactivatedAt,
  goalTiers = [],
  allMeetings = [],
  clientId
}: ClientCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  
  // Use totalMeetingsSet if provided, otherwise calculate from individual counts
  const meetingsSetCount = totalMeetingsSet ?? (confirmedMeetings + pendingMeetings + heldMeetings);
  
  // Calculate progress percentages
  const heldProgress = monthly_hold_target > 0 ? (heldMeetings / monthly_hold_target) * 100 : 0;
  
  // Filter meetings for this specific client (current month)
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
  
  // Meetings SET: filter by created_at (when meeting was booked)
  const clientMeetings = allMeetings.filter(meeting => {
    const createdDate = new Date(meeting.created_at);
    const isInMonth = createdDate >= monthStart && createdDate < nextMonthStart;
    const icpStatus = (meeting as any).icp_status;
    const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
    return meeting.client_id === clientId && isInMonth && !isICPDisqualified;
  });
  
  // Meetings HELD: filter by held_at timestamp (when meeting was actually held)
  const meetingsHeld = allMeetings.filter(meeting => {
    if (meeting.client_id !== clientId) return false;
    if (!meeting.held_at || meeting.no_show) return false;
    
    const heldDate = new Date(meeting.held_at);
    const isInMonth = heldDate >= monthStart && heldDate < nextMonthStart;
    const icpStatus = (meeting as any).icp_status;
    const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
    
    return isInMonth && !isICPDisqualified;
  });
  
  const meetingsSet = clientMeetings;
  const meetingsPending = clientMeetings.filter(m => m.status === 'pending' && !m.no_show);
  
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
  
  // Calculate month progress
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const monthProgress = (dayOfMonth / daysInMonth) * 100;

  // Consistent color scheme based on percentage
  const getProgressBarColor = () => {
    if (heldProgress >= 100) return 'bg-green-600';
    if (heldProgress >= 75) return 'bg-green-400';
    if (heldProgress >= 50) return 'bg-yellow-500';
    if (heldProgress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  const getProgressTextColor = () => {
    if (heldProgress >= 100) return 'text-green-600';
    if (heldProgress >= 75) return 'text-green-600';
    if (heldProgress >= 50) return 'text-yellow-600';
    if (heldProgress >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  // Calculate meetings needed for each tier (using held target)
  const getTierProgress = (percentage: number) => {
    const targetMeetings = Math.ceil((percentage / 100) * monthly_hold_target);
    const meetingsNeeded = Math.max(0, targetMeetings - heldMeetings);
    const tierProgress = (heldMeetings / targetMeetings) * 100;
    return { targetMeetings, meetingsNeeded, tierProgress };
  };

  return (
    <>
    <div 
      className={`rounded-lg shadow-md p-6 relative group cursor-pointer transition-all ${
        isInactive 
          ? 'bg-gray-50 border-2 border-dashed border-gray-300 opacity-75 hover:opacity-90' 
          : 'bg-white border-2 border-transparent hover:border-blue-300 hover:shadow-xl'
      }`}
      title={isInactive ? `This client was removed from this month${deactivatedAt ? ' on ' + new Date(deactivatedAt).toLocaleDateString() : ''}. All meetings are preserved. Toggle "Show Inactive Clients" in the menu to hide.` : 'Click to view all meetings for this client'}
      onClick={() => !isInactive && setModalOpen(true)}
    >
      {isInactive && (
        <div className="absolute top-3 right-3 bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded-full border border-orange-200">
          Inactive
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <h3 className={`text-lg font-semibold ${isInactive ? 'text-gray-600' : 'text-gray-900'}`}>{name}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            if (!isInactive) {
              console.log("Add Meeting button clicked");
              onAddMeeting();
            }
          }}
          className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md focus:outline-none transition-all ${
            isInactive
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          }`}
          disabled={isInactive}
          title={isInactive ? 'Cannot add meetings to inactive assignments. Ask your manager to reactivate this client.' : 'Add a new meeting'}
        >
          <Plus className="w-4 h-4" />
          Add Meeting
        </button>
      </div>
      
      {isInactive && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-xs text-orange-800 font-medium mb-1">⚠️ Assignment Removed</p>
          <p className="text-xs text-orange-700">
            This client was removed from your assignments for this month. All meetings you booked are still preserved and counted toward your performance.
            {deactivatedAt && (
              <span className="block mt-1 text-orange-600">
                Removed: {new Date(deactivatedAt).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className={`w-5 h-5 ${isInactive ? 'text-gray-300' : 'text-gray-400'}`} />
          <span className={`text-sm ${isInactive ? 'text-gray-500' : 'text-gray-600'}`}>
            Set: {meetingsSetCount}/{monthly_set_target} | Held: {heldMeetings}/{monthly_hold_target}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className={`w-5 h-5 ${isInactive ? 'text-gray-300' : 'text-gray-400'}`} />
          <span className={`text-sm ${isInactive ? 'text-gray-500' : 'text-gray-600'}`}>
            Pending: {pendingMeetings} meetings
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Held Progress</span>
            <span className={`font-semibold ${getProgressTextColor()}`}>
              {heldProgress.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(heldProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>0%</span>
            <span>Month Progress: {monthProgress.toFixed(1)}%</span>
            <span>100%</span>
          </div>
        </div>

        {goalTiers.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Goal Tiers Progress</h4>
            {goalTiers
              .sort((a, b) => b.percentage - a.percentage)
              .map((tier, index) => {
                const { targetMeetings, meetingsNeeded, tierProgress } = getTierProgress(tier.percentage);
                const isAchieved = heldMeetings >= targetMeetings;

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-medium ${isAchieved ? 'text-green-600' : 'text-gray-600'}`}>
                        {tier.percentage}% ({targetMeetings} meetings)
                      </span>
                      <span className={`${isAchieved ? 'text-green-600' : 'text-gray-600'}`}>
                        {isAchieved ? 'Achieved!' : `${meetingsNeeded} more needed`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isAchieved ? 'bg-green-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, tierProgress)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {todaysMeetings.length > 0 && (
          <div className="mt-4 border-t pt-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Today's Meetings</h4>
            <div className="space-y-3">
              {todaysMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting as any}
                  onEdit={onEditMeeting}
                  onUpdateConfirmedDate={onConfirmMeeting ? (id: string) => onConfirmMeeting(id) : undefined}
                  showDateControls={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Client Meetings Modal */}
    {modalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setModalOpen(false)}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
            <h2 className="text-2xl font-semibold text-gray-900">{name} - Meetings This Month</h2>
            <button
              onClick={() => setModalOpen(false)}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-3xl font-bold text-green-700">{meetingsSet.length}</p>
                <p className="text-sm text-green-600">Meetings Set</p>
                <p className="text-xs text-gray-500 mt-1">Target: {monthly_set_target}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-3xl font-bold text-blue-700">{meetingsHeld.length}</p>
                <p className="text-sm text-blue-600">Meetings Held</p>
                <p className="text-xs text-gray-500 mt-1">Target: {monthly_hold_target}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-3xl font-bold text-yellow-700">{meetingsPending.length}</p>
                <p className="text-sm text-yellow-600">Pending</p>
              </div>
            </div>

            {/* Meetings Set Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Meetings Set ({meetingsSet.length})
              </h3>
              <div className="space-y-3">
                {meetingsSet.length > 0 ? (
                  meetingsSet.map((meeting) => (
                    <div key={meeting.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="inline-flex items-center px-2.5 py-1 text-sm font-semibold rounded-md border-2 bg-indigo-100 text-indigo-800 border-indigo-200">
                              <User className="w-3.5 h-3.5 mr-1" />
                              {name}
                            </span>
                          </div>
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

            {/* Meetings Held Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Meetings Held ({meetingsHeld.length})
              </h3>
              <div className="space-y-3">
                {meetingsHeld.length > 0 ? (
                  meetingsHeld.map((meeting) => (
                    <div key={meeting.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="inline-flex items-center px-2.5 py-1 text-sm font-semibold rounded-md border-2 bg-indigo-100 text-indigo-800 border-indigo-200">
                              <User className="w-3.5 h-3.5 mr-1" />
                              {name}
                            </span>
                          </div>
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

            {/* Pending Meetings Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Pending Meetings ({meetingsPending.length})
              </h3>
              <div className="space-y-3">
                {meetingsPending.length > 0 ? (
                  meetingsPending.map((meeting) => (
                    <div key={meeting.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="inline-flex items-center px-2.5 py-1 text-sm font-semibold rounded-md border-2 bg-indigo-100 text-indigo-800 border-indigo-200">
                              <User className="w-3.5 h-3.5 mr-1" />
                              {name}
                            </span>
                          </div>
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
          </div>
        </div>
      </div>
    )}
    </>
  );
}