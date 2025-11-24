import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Target, AlertCircle, ChevronRight, History, Calendar } from 'lucide-react';
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

interface HistoricalCommissionData {
  month: string;
  year: number;
  monthName: string;
  heldGoal: number;
  heldMeetings: number;
  progressPercentage: number;
  commission: number;
  commissionGoalOverride?: number;
}

export default function Commissions({ sdrId, darkTheme = false }: { sdrId: string; darkTheme?: boolean }) {
  const { meetings } = useMeetings(sdrId);
  const { clients } = useClients(sdrId);
  const [structure, setStructure] = useState<CommissionStructure | null>(null);
  const [mockMeetings, setMockMeetings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commissionGoalOverride, setCommissionGoalOverride] = useState<CommissionGoalOverride | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalCommissionData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Calculate held goal and held meetings for commissions
  const calculatedGoal = clients.reduce((sum, client) => sum + (client.monthly_hold_target || 0), 0);
  const heldGoal = commissionGoalOverride ? commissionGoalOverride.commission_goal : calculatedGoal;
  
  // Filter meetings to current month only - using scheduled_date (month it was scheduled for)
  // This matches the logic used in SDRDashboard, ManagerDashboard, and useClients hook
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
  
  const heldMeetings = meetings.filter(m => {
    // Must be actually held and not a no-show, and not no_longer_interested
    if (!m.held_at || m.no_show || (m as any).no_longer_interested) return false;
    
    // Filter by scheduled_date (month it was scheduled for)
    const scheduledDate = new Date(m.scheduled_date);
    const isInMonth = scheduledDate >= monthStart && scheduledDate < nextMonthStart;
    
    // Exclude non-ICP-qualified meetings
    const icpStatus = (m as any).icp_status;
    const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
    
    return isInMonth && !isICPDisqualified;
  }).length;

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
          .eq('sdr_id', sdrId as any)
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
          setStructure(data as unknown as CommissionStructure);
        }

        // Load commission goal override
        const { data: overrideData, error: overrideError } = await supabase
          .from('commission_goal_overrides')
          .select('*')
          .eq('sdr_id', sdrId as any)
          .maybeSingle();

        if (overrideError && overrideError.code !== 'PGRST116') {
          console.error('Load override error:', overrideError);
        }

        if (overrideData) {
          setCommissionGoalOverride(overrideData as unknown as CommissionGoalOverride);
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

  // Function to fetch historical commission data
  const fetchHistoricalData = async () => {
    if (!sdrId || !structure) return;
    
    setHistoryLoading(true);
    try {
      // Get the last 12 months of data
      const now = new Date();
      const historicalData: HistoricalCommissionData[] = [];
      
      for (let i = 1; i <= 12; i++) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), 1));
        const nextMonthStart = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth() + 1, 1));
        const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Fetch assignments for this month
        const { data: assignments } = await supabase
          .from('assignments')
          .select('monthly_hold_target')
          .eq('sdr_id', sdrId as any)
          .eq('month', monthKey as any);
        
        // Fetch meetings for this month - we'll filter by scheduled_date in JS
        const { data: monthMeetings } = await supabase
          .from('meetings')
          .select('*')
          .eq('sdr_id', sdrId as any);
        
        // Calculate held meetings using scheduled_date (month it was scheduled for)
        // This matches the logic used elsewhere in the app
        const heldMeetings = (monthMeetings || []).filter((m: any) => {
          // Must be actually held and not a no-show, and not no_longer_interested
          if (!m.held_at || m.no_show || m.no_longer_interested) return false;
          
          // Filter by scheduled_date (month it was scheduled for)
          const scheduledDate = new Date(m.scheduled_date);
          const isInMonth = scheduledDate >= monthStart && scheduledDate < nextMonthStart;
          
          // Exclude non-ICP-qualified meetings
          const icpStatus = m.icp_status;
          const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
          
          return isInMonth && !isICPDisqualified;
        }).length;
        
        // Calculate held goal
        const heldGoal = (assignments || []).reduce((sum, assignment: any) => 
          sum + (assignment.monthly_hold_target || 0), 0
        );
        
        // Calculate commission for this month using the correct goal for that month
        const commission = calculateCommission(heldMeetings, heldGoal);
        
        // Calculate progress percentage
        const progressPercentage = heldGoal > 0 ? (heldMeetings / heldGoal) * 100 : 0;
        
        historicalData.push({
          month: monthKey,
          year: targetDate.getFullYear(),
          monthName: targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          heldGoal,
          heldMeetings,
          progressPercentage,
          commission
        });
      }
      
      setHistoricalData(historicalData.reverse()); // Show oldest first
    } catch (err) {
      console.error('Error fetching historical data:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${darkTheme ? 'bg-[#16191f]' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`rounded-lg shadow-md p-6 flex justify-center ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen p-6 ${darkTheme ? 'bg-[#16191f]' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`rounded-lg shadow-md p-6 ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
            <div className={`flex items-center gap-2 ${darkTheme ? 'text-red-400' : 'text-red-600'}`}>
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
      <div className={`min-h-screen p-6 ${darkTheme ? 'bg-[#16191f]' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`rounded-lg shadow-md p-6 text-center ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
            <p className={darkTheme ? 'text-slate-400' : 'text-gray-500'}>No commission structure configured</p>
          </div>
        </div>
      </div>
    );
  }

  const calculateCommission = (meetingsCount: number, goalOverride?: number) => {
    // Use provided goal override, or fall back to component's heldGoal
    const goal = goalOverride !== undefined ? goalOverride : heldGoal;
    
    if (structure.commission_type === 'per_meeting') {
      // For per-meeting commission:
      // - Meetings up to the goal get only the "booked" rate ($25)
      // - Meetings beyond the goal get both "booked" + "held" rates ($25 + $75 = $100)
      if (goal > 0 && meetingsCount > goal) {
        // Some meetings are beyond the goal
        const meetingsUpToGoal = goal;
        const meetingsBeyondGoal = meetingsCount - goal;
        const commissionUpToGoal = meetingsUpToGoal * structure.meeting_rates.booked;
        const commissionBeyondGoal = meetingsBeyondGoal * (structure.meeting_rates.booked + structure.meeting_rates.held);
        return commissionUpToGoal + commissionBeyondGoal;
      } else {
        // All meetings are within the goal, only get "booked" rate
        return meetingsCount * structure.meeting_rates.booked;
      }
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
    <div className={`min-h-screen p-6 ${darkTheme ? 'bg-[#16191f]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Current Month Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`rounded-lg shadow-md p-6 ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-medium ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Current Commission</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
              ${actualCommission.toLocaleString()}
            </p>
            <p className={`text-sm mt-1 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
              Based on {heldMeetings} held meetings
            </p>
          </div>

          <div className={`rounded-lg shadow-md p-6 ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-medium ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Meeting Held Goal</h3>
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <p className={`text-2xl font-bold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>{heldGoal}</p>
            {commissionGoalOverride && (
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${darkTheme ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                  Overridden
                </span>
                <p className={`text-xs mt-1 ${darkTheme ? 'text-slate-500' : 'text-gray-500'}`}>
                  Calculated goal: {calculatedGoal} meetings
                </p>
              </div>
            )}
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span className={darkTheme ? 'text-slate-400' : 'text-gray-500'}>Progress</span>
                <span className={`font-medium ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                  {heldMeetings}/{heldGoal} meetings
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${darkTheme ? 'bg-slate-700' : 'bg-gray-200'}`}>
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className={`rounded-lg shadow-md p-6 ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-medium ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Commission Type</h3>
              <Calculator className="w-5 h-5 text-indigo-600" />
            </div>
            <p className={`text-2xl font-bold capitalize ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
              {structure.commission_type.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Commission Structure */}
        {structure.commission_type === 'per_meeting' ? (
          <div className={`rounded-lg shadow-md overflow-hidden ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
            <div className={`p-6 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>Commission Rates</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>Per Booked Meeting</span>
                  <span className={`text-sm font-medium ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                    ${structure.meeting_rates.booked}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>Additional per Held Meeting</span>
                  <span className={`text-sm font-medium ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                    ${structure.meeting_rates.held}
                  </span>
                </div>
                <div className={`flex items-center justify-between pt-4 border-t ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
                  <span className={`text-sm font-medium ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>Total per Held Meeting</span>
                  <span className={`text-sm font-medium ${darkTheme ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    ${structure.meeting_rates.booked + structure.meeting_rates.held}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`rounded-lg shadow-md overflow-hidden ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
            <div className={`p-6 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>Goal Tiers</h2>
              {nextTierInfo && (
                <div className={`mt-2 p-3 rounded-md ${darkTheme ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-indigo-600" />
                    <p className={`text-sm ${darkTheme ? 'text-indigo-200' : 'text-indigo-900'}`}>
                      <span className="font-medium">{nextTierInfo.meetingsNeeded} more meetings</span>
                      {' '}needed to reach {nextTierInfo.percentage}% tier (${nextTierInfo.bonus.toLocaleString()} bonus)
                    </p>
                  </div>
                  <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${darkTheme ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}>
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
                            ? (darkTheme ? 'bg-green-900/20' : 'bg-green-50')
                            : isNext
                            ? (darkTheme ? 'bg-indigo-900/20' : 'bg-indigo-50')
                            : (darkTheme ? 'bg-[#1d1f24]' : 'bg-gray-50')
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Target className={`w-5 h-5 ${
                              isAchieved
                                ? 'text-green-600'
                                : isNext
                                ? 'text-indigo-600'
                                : (darkTheme ? 'text-slate-500' : 'text-gray-400')
                            }`} />
                            <span className={`font-medium ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                              {tier.percentage}% Goal
                            </span>
                          </div>
                          <span className={`text-sm font-medium ${
                            isAchieved
                              ? (darkTheme ? 'text-green-400' : 'text-green-600')
                              : isNext
                              ? (darkTheme ? 'text-indigo-400' : 'text-indigo-600')
                              : (darkTheme ? 'text-slate-400' : 'text-gray-600')
                          }`}>
                            ${tier.bonus.toLocaleString()} bonus
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className={`h-2 rounded-full overflow-hidden ${darkTheme ? 'bg-[#2d3139]' : 'bg-white'}`}>
                            <div
                              className={`h-full transition-all duration-300 ${
                                isAchieved
                                  ? 'bg-green-600'
                                  : isNext
                                  ? 'bg-indigo-600'
                                  : (darkTheme ? 'bg-slate-600' : 'bg-gray-300')
                              }`}
                              style={{ width: `${(heldMeetings / targetMeetings) * 100}%` }}
                            />
                          </div>
                          <div className="mt-1 flex justify-between text-xs">
                            <span className={darkTheme ? 'text-slate-400' : 'text-gray-500'}>
                              {targetMeetings} meetings needed
                            </span>
                            <span className={`font-medium ${
                              isAchieved
                                ? (darkTheme ? 'text-green-400' : 'text-green-600')
                                : isNext
                                ? (darkTheme ? 'text-indigo-400' : 'text-indigo-600')
                                : (darkTheme ? 'text-slate-400' : 'text-gray-600')
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
        <div className={`rounded-lg shadow-md overflow-hidden ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
          <div className={`p-6 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>Commission Calculator</h2>
          </div>
          <div className="p-6">
            <div className="max-w-md space-y-4">
              <div>
                <label
                  htmlFor="mockMeetings"
                  className={`block text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}
                >
                  Number of Meetings
                </label>
                <input
                  type="number"
                  id="mockMeetings"
                  min="0"
                  value={mockMeetings}
                  onChange={(e) => setMockMeetings(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                />
              </div>

              <div className={`rounded-lg p-4 ${darkTheme ? 'bg-[#1d1f24]' : 'bg-gray-50'}`}>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={darkTheme ? 'text-slate-400' : 'text-gray-500'}>Projected Commission</span>
                    <span className={`font-medium ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                      ${mockCommission.toLocaleString()}
                    </span>
                  </div>
                  {structure.commission_type === 'goal_based' && (
                    <div className="flex justify-between text-sm">
                      <span className={darkTheme ? 'text-slate-400' : 'text-gray-500'}>Goal Progress</span>
                      <span className={`font-medium ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                        {mockMeetings}/{heldGoal} meetings
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Commission History */}
        <div className={`rounded-lg shadow-md overflow-hidden ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
          <div className={`p-6 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                <History className="w-5 h-5" />
                Commission History
              </h2>
              <button
                onClick={() => {
                  if (!showHistory) {
                    fetchHistoricalData();
                  }
                  setShowHistory(!showHistory);
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${darkTheme ? 'text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50' : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'}`}
              >
                <Calendar className="w-4 h-4" />
                {showHistory ? 'Hide History' : 'Show History'}
              </button>
            </div>
          </div>
          
          {showHistory && (
            <div className="p-6">
              {historyLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : historicalData.length > 0 ? (
                <div className="space-y-4">
                  {historicalData.map((data) => (
                    <div
                      key={data.month}
                      className={`border rounded-lg p-4 transition-colors ${darkTheme ? 'border-[#2d3139] hover:bg-[#1d1f24]' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-lg font-medium ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                          {data.monthName}
                        </h3>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${darkTheme ? 'text-green-400' : 'text-green-600'}`}>
                            ${data.commission.toLocaleString()}
                          </p>
                          <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Commission Earned</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Held Goal</p>
                          <p className={`text-lg font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                            {data.heldGoal} meetings
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Meetings Held</p>
                          <p className={`text-lg font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                            {data.heldMeetings} meetings
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Goal Progress</p>
                          <p className={`text-lg font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                            {data.progressPercentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className={`w-full rounded-full h-2 ${darkTheme ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(data.progressPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className={`w-12 h-12 mx-auto mb-4 ${darkTheme ? 'text-slate-600' : 'text-gray-400'}`} />
                  <p className={darkTheme ? 'text-slate-400' : 'text-gray-500'}>No historical commission data available</p>
                  <p className={`text-sm mt-1 ${darkTheme ? 'text-slate-500' : 'text-gray-400'}`}>
                    Historical data will appear here once you have held months with meetings
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}