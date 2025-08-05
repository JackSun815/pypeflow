import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, Target, AlertCircle, ChevronRight } from 'lucide-react';
import { useMeetings } from '../hooks/useMeetings';
import { useClients } from '../hooks/useClients';
import { supabase } from '../lib/supabase';
import type { CommissionGoalOverride } from '../types/database';

interface CommissionStructure {
  commission_type: 'per_meeting' | 'goal_based';
  meeting_rates: {
    booked: number;
    held: number;
  };
  goal_tiers: Array<{
    percentage: number;
    bonus: number;
  }>;
}

export default function Commissions({ sdrId }: { sdrId: string }) {
  const { meetings } = useMeetings(sdrId);
  const { clients } = useClients(sdrId);
  const [structure, setStructure] = useState<CommissionStructure | null>(null);
  const [mockMeetings, setMockMeetings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commissionGoalOverride, setCommissionGoalOverride] = useState<CommissionGoalOverride | null>(null);

  // Calculate held goal and held meetings for commissions
  const calculatedGoal = clients.reduce((sum, client) => sum + (client.monthly_hold_target || 0), 0);
  const heldGoal = commissionGoalOverride ? commissionGoalOverride.commission_goal : calculatedGoal;
  const heldMeetings = meetings.filter(m => 
    m.status === 'confirmed' && 
    !m.no_show && 
    m.held_at !== null
  ).length;

  useEffect(() => {
    async function loadCompensation() {
      if (!sdrId) {
        setError('Invalid SDR ID');
        setLoading(false);
        return;
      }

      try {
        // Load compensation structure
        const { data, error: fetchError } = await supabase
          .from('compensation_structures')
          .select('*')
          .eq('sdr_id', sdrId)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (!data) {
          setStructure({
            commission_type: 'per_meeting',
            meeting_rates: {
              booked: 0,
              held: 0
            },
            goal_tiers: []
          });
        } else {
          setStructure(data);
        }

        // Load commission goal override
        const { data: overrideData, error: overrideError } = await supabase
          .from('commission_goal_overrides')
          .select('*')
          .eq('sdr_id', sdrId)
          .maybeSingle();

        if (overrideError && overrideError.code !== 'PGRST116') {
          console.error('Load override error:', overrideError);
        }

        if (overrideData) {
          setCommissionGoalOverride(overrideData);
        }

        setError(null);
      } catch (err) {
        console.error('Load compensation error:', err);
        setError('Failed to load commission structure');
      } finally {
        setLoading(false);
      }
    }

    loadCompensation();
  }, [sdrId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">No commission structure configured</p>
          </div>
        </div>
      </div>
    );
  }

  const calculateCommission = (meetingsCount: number) => {
    if (structure.commission_type === 'per_meeting') {
      const bookedCommission = meetingsCount * structure.meeting_rates.booked;
      const heldCommission = meetingsCount * structure.meeting_rates.held;
      return bookedCommission + heldCommission;
    } else {
      // Calculate progress based on input meetings vs held goal
      const percentageAchieved = heldGoal > 0 
        ? (meetingsCount / heldGoal) * 100 
        : 0;

      const sortedTiers = [...structure.goal_tiers].sort((a, b) => b.percentage - a.percentage);
      for (const tier of sortedTiers) {
        if (percentageAchieved >= tier.percentage) {
          return tier.bonus;
        }
      }
      return 0;
    }
  };

  const confirmedMeetings = meetings.filter(m => m.status === 'confirmed').length;
  const actualCommission = calculateCommission(heldMeetings);
  const mockCommission = calculateCommission(mockMeetings);

  // Calculate progress based on held meetings vs held goal
  const progressPercentage = heldGoal > 0 
    ? (heldMeetings / heldGoal) * 100 
    : 0;

  // Calculate meetings needed for next tier
  const calculateNextTierInfo = () => {
    if (structure.commission_type !== 'goal_based' || !heldGoal) return null;

    const sortedTiers = [...structure.goal_tiers].sort((a, b) => a.percentage - b.percentage);
    const currentPercentage = progressPercentage;

    for (const tier of sortedTiers) {
      if (tier.percentage > currentPercentage) {
        const targetMeetings = Math.ceil((tier.percentage / 100) * heldGoal);
        const meetingsNeeded = targetMeetings - heldMeetings;
        return {
          percentage: tier.percentage,
          bonus: tier.bonus,
          meetingsNeeded,
          targetMeetings
        };
      }
    }
    return null;
  };

  const nextTierInfo = calculateNextTierInfo();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Current Month Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Current Commission</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${actualCommission.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Based on {heldMeetings} held meetings
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Meeting Held Goal</h3>
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{heldGoal}</p>
            {commissionGoalOverride && (
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Overridden
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Calculated goal: {calculatedGoal} meetings
                </p>
              </div>
            )}
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium text-gray-900">
                  {heldMeetings}/{heldGoal} meetings
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Commission Type</h3>
              <Calculator className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 capitalize">
              {structure.commission_type.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Commission Structure */}
        {structure.commission_type === 'per_meeting' ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Commission Rates</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Per Booked Meeting</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${structure.meeting_rates.booked}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Additional per Held Meeting</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${structure.meeting_rates.held}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm font-medium text-gray-900">Total per Held Meeting</span>
                  <span className="text-sm font-medium text-indigo-600">
                    ${structure.meeting_rates.booked + structure.meeting_rates.held}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Goal Tiers</h2>
              {nextTierInfo && (
                <div className="mt-2 p-3 bg-indigo-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-indigo-600" />
                    <p className="text-sm text-indigo-900">
                      <span className="font-medium">{nextTierInfo.meetingsNeeded} more meetings</span>
                      {' '}needed to reach {nextTierInfo.percentage}% tier (${nextTierInfo.bonus.toLocaleString()} bonus)
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300"
                      style={{
                        width: `${(heldMeetings / nextTierInfo.targetMeetings) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {structure.goal_tiers
                  .sort((a, b) => b.percentage - a.percentage)
                  .map((tier, index) => {
                    const targetMeetings = Math.ceil((tier.percentage / 100) * heldGoal);
                    const isAchieved = heldMeetings >= targetMeetings;
                    const isNext = nextTierInfo?.percentage === tier.percentage;

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          isAchieved
                            ? 'bg-green-50'
                            : isNext
                            ? 'bg-indigo-50'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Target className={`w-5 h-5 ${
                              isAchieved
                                ? 'text-green-600'
                                : isNext
                                ? 'text-indigo-600'
                                : 'text-gray-400'
                            }`} />
                            <span className="font-medium text-gray-900">
                              {tier.percentage}% Goal
                            </span>
                          </div>
                          <span className={`text-sm font-medium ${
                            isAchieved
                              ? 'text-green-600'
                              : isNext
                              ? 'text-indigo-600'
                              : 'text-gray-600'
                          }`}>
                            ${tier.bonus.toLocaleString()} bonus
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="h-2 bg-white rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isAchieved
                                  ? 'bg-green-600'
                                  : isNext
                                  ? 'bg-indigo-600'
                                  : 'bg-gray-300'
                              }`}
                              style={{ width: `${(heldMeetings / targetMeetings) * 100}%` }}
                            />
                          </div>
                          <div className="mt-1 flex justify-between text-xs">
                            <span className="text-gray-500">
                              {targetMeetings} meetings needed
                            </span>
                            <span className={`font-medium ${
                              isAchieved
                                ? 'text-green-600'
                                : isNext
                                ? 'text-indigo-600'
                                : 'text-gray-600'
                            }`}>
                              {heldMeetings}/{targetMeetings} held
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Commission Calculator */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Commission Calculator</h2>
          </div>
          <div className="p-6">
            <div className="max-w-md space-y-4">
              <div>
                <label
                  htmlFor="mockMeetings"
                  className="block text-sm font-medium text-gray-700"
                >
                  Number of Meetings
                </label>
                <input
                  type="number"
                  id="mockMeetings"
                  min="0"
                  value={mockMeetings}
                  onChange={(e) => setMockMeetings(Math.max(0, parseInt(e.target.value) || 0))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Projected Commission</span>
                    <span className="font-medium text-gray-900">
                      ${mockCommission.toLocaleString()}
                    </span>
                  </div>
                  {structure.commission_type === 'goal_based' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Goal Progress</span>
                      <span className="font-medium text-gray-900">
                        {mockMeetings}/{heldGoal} meetings
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}