import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Plus, Trash2, AlertCircle, Target } from 'lucide-react';
import type { CommissionGoalOverride } from '../types/database';

interface MeetingRates {
  booked: number;
  held: number;
}

interface GoalTier {
  percentage: number;
  bonus: number;
}

interface CompensationManagementProps {
  sdrId: string;
  fullName: string;
  onUpdate: () => void;
  onHide?: () => void;
}

export default function CompensationManagement({ sdrId, fullName, onUpdate, onHide }: CompensationManagementProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [commissionType, setCommissionType] = useState<'per_meeting' | 'goal_based'>('goal_based');
  
  // Per-meeting commission structure with updated default rates
  const [meetingRates, setMeetingRates] = useState<MeetingRates>({
    booked: 25,  // Default $25 per meeting booked
    held: 75     // Default $75 additional per meeting held
  });

  // Goal-based commission structure with default tiers
  const [goalTiers, setGoalTiers] = useState<GoalTier[]>([
    { percentage: 140, bonus: 1500 },
    { percentage: 130, bonus: 1200 },
    { percentage: 120, bonus: 900 },
    { percentage: 110, bonus: 700 },
    { percentage: 100, bonus: 500 },
    { percentage: 90, bonus: 400 },
    { percentage: 80, bonus: 350 },
    { percentage: 70, bonus: 300 },
    { percentage: 60, bonus: 200 }
  ]);

  // Commission goal override state
  const [commissionGoalOverride, setCommissionGoalOverride] = useState<number>(0);
  const [hasOverride, setHasOverride] = useState<boolean>(false);
  const [calculatedGoal, setCalculatedGoal] = useState<number>(0);

  // Load existing compensation structure and commission goal override
  useEffect(() => {
    async function loadCompensation() {
      try {
        // Load compensation structure
        const { data, error } = await supabase
          .from('compensation_structures')
          .select('*')
          .eq('sdr_id', sdrId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setCommissionType(data.commission_type);
          setMeetingRates(data.meeting_rates);
          if (data.goal_tiers && data.goal_tiers.length > 0) {
            setGoalTiers(data.goal_tiers);
          }
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
          setCommissionGoalOverride(overrideData.commission_goal);
          setHasOverride(true);
        }

        // Calculate the current goal from assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`
            monthly_hold_target,
            clients (
              monthly_hold_target
            )
          `)
          .eq('sdr_id', sdrId);

        if (assignmentsError) {
          console.error('Load assignments error:', assignmentsError);
        } else {
          const calculatedGoal = assignmentsData?.reduce((sum, assignment) => {
            return sum + (assignment.monthly_hold_target || 0);
          }, 0) || 0;
          setCalculatedGoal(calculatedGoal);
        }
      } catch (err) {
        console.error('Load compensation error:', err);
        // Don't show error for initial load
      }
    }

    loadCompensation();
  }, [sdrId]);

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
              // Delete existing structure first to avoid conflicts
        console.log('[DEBUG] Deleting existing compensation structure for SDR:', sdrId);
        
        const { error: deleteError } = await supabase
          .from('compensation_structures')
          .delete()
          .eq('sdr_id', sdrId);

        if (deleteError) {
          console.error('[DEBUG] Delete existing structure error:', deleteError);
          // Don't throw here as it might not exist
        }

      if (commissionType === 'goal_based') {
        // Validate goal tiers
        if (goalTiers.some(tier => tier.percentage <= 0 || tier.bonus <= 0)) {
          throw new Error('Goal percentages and bonuses must be greater than 0');
        }

        // Sort tiers by percentage descending
        const sortedTiers = [...goalTiers].sort((a, b) => b.percentage - a.percentage);

        // Check for duplicate percentages
        const hasDuplicates = sortedTiers.some((tier, index) => 
          index > 0 && tier.percentage === sortedTiers[index - 1].percentage
        );

        if (hasDuplicates) {
          throw new Error('Each tier must have a unique goal percentage');
        }

        // Insert new structure
        console.log('[DEBUG] Inserting goal-based compensation structure:', {
          sdr_id: sdrId,
          commission_type: 'goal_based',
          goal_tiers: sortedTiers
        });
        
        const { data: insertData, error: insertError } = await supabase
          .from('compensation_structures')
          .insert({
            sdr_id: sdrId,
            commission_type: 'goal_based',
            goal_tiers: sortedTiers,
            meeting_rates: { booked: 0, held: 0 }
          });

        if (insertError) {
          console.error('[DEBUG] Insert compensation structure error:', insertError);
          throw insertError;
        }
        
        console.log('[DEBUG] Compensation structure inserted successfully:', insertData);
      } else {
        // Validate meeting rates
        if (meetingRates.booked < 0 || meetingRates.held < 0) {
          throw new Error('Meeting rates must be greater than or equal to 0');
        }

        // Insert new structure
        console.log('[DEBUG] Inserting per-meeting compensation structure:', {
          sdr_id: sdrId,
          commission_type: 'per_meeting',
          meeting_rates: meetingRates
        });
        
        const { data: insertData, error: insertError } = await supabase
          .from('compensation_structures')
          .insert({
            sdr_id: sdrId,
            commission_type: 'per_meeting',
            meeting_rates: meetingRates,
            goal_tiers: []
          });

        if (insertError) {
          console.error('[DEBUG] Insert compensation structure error:', insertError);
          throw insertError;
        }
        
        console.log('[DEBUG] Compensation structure inserted successfully:', insertData);
      }

      // Save commission goal override
      if (hasOverride) {
        console.log('[DEBUG] Saving commission goal override:', {
          sdr_id: sdrId,
          commission_goal: commissionGoalOverride
        });
        
        // Check if override already exists
        const { data: existingOverride, error: checkError } = await supabase
          .from('commission_goal_overrides')
          .select('id')
          .eq('sdr_id', sdrId)
          .maybeSingle();

        if (checkError) {
          console.error('[DEBUG] Check existing override error:', checkError);
          throw checkError;
        }

        if (existingOverride) {
          // Update existing override
          console.log('[DEBUG] Updating existing commission goal override');
          const { data: overrideData, error: overrideError } = await supabase
            .from('commission_goal_overrides')
            .update({
              commission_goal: commissionGoalOverride,
              updated_at: new Date().toISOString()
            })
            .eq('sdr_id', sdrId);

          if (overrideError) {
            console.error('[DEBUG] Update override error:', overrideError);
            throw overrideError;
          }
          
          console.log('[DEBUG] Override updated successfully:', overrideData);
        } else {
          // Insert new override
          console.log('[DEBUG] Inserting new commission goal override');
          const { data: overrideData, error: overrideError } = await supabase
            .from('commission_goal_overrides')
            .insert({
              sdr_id: sdrId,
              commission_goal: commissionGoalOverride
            });

          if (overrideError) {
            console.error('[DEBUG] Insert override error:', overrideError);
            throw overrideError;
          }
          
          console.log('[DEBUG] Override inserted successfully:', overrideData);
        }
      } else {
        // Remove override if it exists
        console.log('[DEBUG] Removing commission goal override for SDR:', sdrId);
        
        const { error: deleteError } = await supabase
          .from('commission_goal_overrides')
          .delete()
          .eq('sdr_id', sdrId);

        if (deleteError) {
          console.error('[DEBUG] Delete override error:', deleteError);
          // Don't throw here as it might not exist
        }
      }

      setSuccess('Compensation structure updated successfully');
      onUpdate();
    } catch (err) {
      console.error('Save compensation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save compensation structure');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Compensation Structure for {fullName}
        </h2>
        {onHide && (
          <button
            onClick={onHide}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Hide
          </button>
        )}
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Commission Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Type
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setCommissionType('per_meeting')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  commissionType === 'per_meeting'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Per Meeting
              </button>
              <button
                onClick={() => setCommissionType('goal_based')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  commissionType === 'goal_based'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Goal Based
              </button>
            </div>
          </div>

          {/* Per Meeting Rates */}
          {commissionType === 'per_meeting' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Per Booked Meeting Rate ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={meetingRates.booked}
                  onChange={(e) => setMeetingRates(prev => ({
                    ...prev,
                    booked: Math.max(0, parseInt(e.target.value) || 0)
                  }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Per Held Meeting Rate ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={meetingRates.held}
                  onChange={(e) => setMeetingRates(prev => ({
                    ...prev,
                    held: Math.max(0, parseInt(e.target.value) || 0)
                  }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Total commission per held meeting: ${meetingRates.booked + meetingRates.held}
                </p>
              </div>
            </div>
          )}

          {/* Goal Based Tiers */}
          {commissionType === 'goal_based' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Goal Tiers</h3>
                <button
                  onClick={() => setGoalTiers([...goalTiers, { percentage: 0, bonus: 0 }])}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100"
                >
                  <Plus className="w-4 h-4" />
                  Add Tier
                </button>
              </div>
              <div className="space-y-3">
                {goalTiers
                  .sort((a, b) => b.percentage - a.percentage)
                  .map((tier, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Goal Percentage
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="200"
                          value={tier.percentage}
                          onChange={(e) => {
                            const newTiers = [...goalTiers];
                            newTiers[index].percentage = Math.max(0, parseInt(e.target.value) || 0);
                            setGoalTiers(newTiers);
                          }}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bonus Amount ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={tier.bonus}
                          onChange={(e) => {
                            const newTiers = [...goalTiers];
                            newTiers[index].bonus = Math.max(0, parseInt(e.target.value) || 0);
                            setGoalTiers(newTiers);
                          }}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newTiers = goalTiers.filter((_, i) => i !== index);
                          setGoalTiers(newTiers);
                        }}
                        className="p-2 text-red-600 hover:text-red-700 focus:outline-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Commission Goal Override */}
          <div className="pt-6 border-t">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-medium text-gray-700">Commission Goal Override</h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Calculated Goal
                    </label>
                    <p className="text-lg font-semibold text-gray-900">{calculatedGoal} meetings</p>
                    <p className="text-xs text-gray-500">Based on client assignments</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={hasOverride}
                        onChange={(e) => {
                          setHasOverride(e.target.checked);
                          if (!e.target.checked) {
                            setCommissionGoalOverride(0);
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Override commission goal</span>
                    </label>
                  </div>
                  
                  {hasOverride && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Commission Goal
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={commissionGoalOverride}
                        onChange={(e) => setCommissionGoalOverride(Math.max(0, parseInt(e.target.value) || 0))}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter custom goal"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This will override the calculated goal for commission calculations only
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  Save Compensation Structure
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}