import React from 'react';
import { Calendar, Target, Plus, CheckCircle, Edit, User, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { formatTimeFromISOString } from '../utils/timeUtils';
import { MeetingCard } from './MeetingCard';

interface ClientCardProps {
  name: string;
  monthly_set_target: number;
  monthly_hold_target: number;
  confirmedMeetings: number;
  pendingMeetings: number;
  heldMeetings: number;
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
}

export default function ClientCard({
  name,
  monthly_set_target,
  monthly_hold_target,
  confirmedMeetings,
  pendingMeetings,
  heldMeetings,
  todaysMeetings,
  onAddMeeting,
  onConfirmMeeting,
  onEditMeeting,
  isInactive = false,
  deactivatedAt,
  goalTiers = []
}: ClientCardProps) {
  // Calculate progress percentages
  const setProgress = monthly_set_target > 0 ? ((confirmedMeetings + pendingMeetings) / monthly_set_target) * 100 : 0;
  const heldProgress = monthly_hold_target > 0 ? (heldMeetings / monthly_hold_target) * 100 : 0;
  
  // Calculate month progress
  const now = new Date();
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
    <div 
      className={`rounded-lg shadow-md p-6 relative group ${
        isInactive 
          ? 'bg-gray-50 border-2 border-dashed border-gray-300 opacity-75 hover:opacity-90' 
          : 'bg-white'
      }`}
      title={isInactive ? `This client was removed from this month${deactivatedAt ? ' on ' + new Date(deactivatedAt).toLocaleDateString() : ''}. All meetings are preserved. Toggle "Show Inactive Clients" in the menu to hide.` : ''}
    >
      {isInactive && (
        <div className="absolute top-3 right-3 bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded-full border border-orange-200">
          Inactive
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <h3 className={`text-lg font-semibold ${isInactive ? 'text-gray-600' : 'text-gray-900'}`}>{name}</h3>
        <button
          onClick={() => {
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
            Set: {confirmedMeetings + pendingMeetings}/{monthly_set_target} | Held: {heldMeetings}/{monthly_hold_target}
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
          <div className="mt-4 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Today's Meetings</h4>
            <div className="space-y-3">
              {todaysMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onEdit={onEditMeeting}
                  onUpdateConfirmedDate={onConfirmMeeting ? (id: string, date: string | null) => onConfirmMeeting(id) : undefined}
                  showDateControls={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}