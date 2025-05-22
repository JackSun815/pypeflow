import React from 'react';
import { Calendar, Target, Plus, CheckCircle, Edit, User, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { formatTimeFromISOString } from '../utils/timeUtils';

interface ClientCardProps {
  name: string;
  monthlyTarget: number;
  confirmedMeetings: number;
  pendingMeetings: number;
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
  onEditMeeting?: (meetingId: string) => void;
  goalTiers?: Array<{
    percentage: number;
    bonus: number;
  }>;
}

export default function ClientCard({
  name,
  monthlyTarget,
  confirmedMeetings,
  pendingMeetings,
  todaysMeetings,
  onAddMeeting,
  onConfirmMeeting,
  onEditMeeting,
  goalTiers = []
}: ClientCardProps) {
  // Calculate progress percentage
  const progress = (confirmedMeetings / monthlyTarget) * 100;
  
  // Calculate month progress
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const monthProgress = (dayOfMonth / daysInMonth) * 100;

  // Determine status color
  const getStatusColor = () => {
    if (progress >= monthProgress) return 'text-green-600';
    if (progress >= monthProgress - 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate meetings needed for each tier
  const getTierProgress = (percentage: number) => {
    const targetMeetings = Math.ceil((percentage / 100) * monthlyTarget);
    const meetingsNeeded = Math.max(0, targetMeetings - confirmedMeetings);
    const tierProgress = (confirmedMeetings / targetMeetings) * 100;
    return { targetMeetings, meetingsNeeded, tierProgress };
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <button
          onClick={onAddMeeting}
          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          Add Meeting
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            Target: {confirmedMeetings}/{monthlyTarget} meetings
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            Pending: {pendingMeetings} meetings
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className={`font-semibold ${getStatusColor()}`}>
              {progress.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
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
                const isAchieved = confirmedMeetings >= targetMeetings;

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
              {todaysMeetings.map((meeting) => {
                const formattedTime = formatTimeFromISOString(meeting.scheduled_date);
                
                return (
                  <div
                    key={meeting.id}
                    className="bg-gray-50 p-3 rounded-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {formattedTime} EST
                      </span>
                      <div className="flex items-center gap-2">
                        {meeting.status === 'pending' ? (
                          <button
                            onClick={() => onConfirmMeeting(meeting.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-sm text-green-700 hover:text-green-800 focus:outline-none"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Confirm
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Confirmed
                          </span>
                        )}
                        
                        {onEditMeeting && (
                          <button
                            onClick={() => onEditMeeting(meeting.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-sm text-indigo-700 hover:text-indigo-800 focus:outline-none"
                            title="Edit meeting details"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Contact information */}
                    {meeting.contact_full_name && (
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span>{meeting.contact_full_name}</span>
                        </div>
                        {meeting.contact_email && (
                          <div className="flex items-center gap-1 mt-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="text-xs">{meeting.contact_email}</span>
                          </div>
                        )}
                        {meeting.contact_phone && (
                          <div className="flex items-center gap-1 mt-1">
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-xs">{meeting.contact_phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}