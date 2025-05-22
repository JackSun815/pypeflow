import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Plus, Trash2, AlertCircle } from 'lucide-react';

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
}

export default function CompensationManagement({ sdrId, fullName, onUpdate }: CompensationManagementProps) {
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

  // Load existing compensation structure
  useEffect(() => {
    async function loadCompensation() {
      try {
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
      await supabase
        .from('compensation_structures')
        .delete()
        .eq('sdr_id', sdrId);

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
        const { error: insertError } = await supabase
          .from('compensation_structures')
          .insert({
            sdr_id: sdrId,
            commission_type: 'goal_based',
            goal_tiers: sortedTiers,
            meeting_rates: { booked: 0, held: 0 }
          });

        if (insertError) throw insertError;
      } else {
        // Validate meeting rates
        if (meetingRates.booked < 0 || meetingRates.held < 0) {
          throw new Error('Meeting rates must be greater than or equal to 0');
        }

        // Insert new structure
        const { error: insertError } = await supabase
          .from('compensation_structures')
          .insert({
            sdr_id: sdrId,
            commission_type: 'per_meeting',
            meeting_rates: meetingRates,
            goal_tiers: []
          });

        if (insertError) throw insertError;
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
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Compensation Structure for {fullName}
        </h2>
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