import React, { useState, useEffect } from 'react';
import { format, subMonths } from 'date-fns';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import {Plus, Trash2, AlertCircle, Users, Target, Edit } from 'lucide-react';
import type { Client, Profile } from '../types/database';

interface ClientManagementProps {
  sdrs: Profile[];
  onUpdate: () => void;
}

interface ClientWithAssignments extends Client {
  assignments: Array<{
    id: string;
    sdr_id: string;
    monthly_target: number;
    monthly_set_target: number;
    monthly_hold_target: number;
  }>;
  monthly_target: number;
  monthly_set_target: number;
  monthly_hold_target: number;
}

export default function ClientManagement({ sdrs, onUpdate }: ClientManagementProps) {
  const [clients, setClients] = useState<ClientWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Sort option state
  const [sortOption, setSortOption] = useState<'alphabetical' | 'target' | 'date'>('alphabetical');

  // New client form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientTarget, setNewClientTarget] = useState<number>(0);
  const [showAddClient, setShowAddClient] = useState(false);

  // Edit mode for client target
  const [clientEditMode, setClientEditMode] = useState<string | null>(null);


  // Assignment form state
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedSDR, setSelectedSDR] = useState<string | null>(null);
  const [monthlyHoldTarget, setMonthlyHoldTarget] = useState<number>(0);
  const [monthlySetTarget, setMonthlySetTarget] = useState<number>(0);
  const [newClientHoldTarget, setNewClientHoldTarget] = useState<number>(0);
  const [newClientSetTarget, setNewClientSetTarget] = useState<number>(0);
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Month selector state
  const now = new Date();
  const currentMonth = format(now, 'yyyy-MM');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(now, i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    };
  });

  const [clientDraftTargets, setClientDraftTargets] = useState<Record<string, number>>({});
  const [assignmentDraftTargets, setAssignmentDraftTargets] = useState<Record<string, number>>({});


  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption, selectedMonth]);

  async function fetchClients() {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*');

      if (clientsError) throw clientsError;

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('month', selectedMonth);

      if (assignmentsError) throw assignmentsError;

      const processedClients = (clientsData || []).map((client: any) => ({
        ...client,
        assignments: (assignmentsData || []).filter((a: any) => a.client_id === client.id)
      }));

      let sortedClients = [...processedClients];
      if (sortOption === 'alphabetical') {
        sortedClients.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortOption === 'target') {
        sortedClients.sort((a, b) => {
          const aAssignedSet = a.assignments.reduce((sum: number, x: any) => sum + (x.monthly_set_target || 0), 0);
          const bAssignedSet = b.assignments.reduce((sum: number, x: any) => sum + (x.monthly_set_target || 0), 0);
          const aPct = a.monthly_set_target > 0 ? aAssignedSet / a.monthly_set_target : 0;
          const bPct = b.monthly_set_target > 0 ? bAssignedSet / b.monthly_set_target : 0;
          return bPct - aPct;
        });
      } else if (sortOption === 'date') {
        sortedClients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      setClients(sortedClients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateClientTarget(clientId: string, newSetTarget: number, newHoldTarget: number) {
    if (newSetTarget < 0 || newHoldTarget < 0) return;

    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('clients')
        .update({ 
          monthly_set_target: newSetTarget,
          monthly_hold_target: newHoldTarget
        })
        .eq('id', clientId);

      if (updateError) throw updateError;

      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId 
            ? { 
                ...client, 
                monthly_set_target: newSetTarget,
                monthly_hold_target: newHoldTarget
              }
            : client
        )
      );

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update target');
    }
  }

  async function handleUpdateSDRTarget(sdrId: string, clientId: string, newSetTarget: number, newHoldTarget: number) {
    if (newSetTarget < 0 || newHoldTarget < 0) return;

    try {
      setError(null);
      // Use selectedMonth as currentMonth for correct month logic
      const currentMonth = selectedMonth;

      const { data: existingAssignment, error: checkError } = await supabase
        .from('assignments')
        .select('id')
        .eq('sdr_id', sdrId)
        .eq('client_id', clientId)
        .eq('month', currentMonth)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingAssignment) {
        const { error: updateError } = await supabase
          .from('assignments')
          .update({
            monthly_set_target: newSetTarget,
            monthly_hold_target: newHoldTarget,
            month: currentMonth,
          })
          .eq('id', existingAssignment.id)
          .eq('month', currentMonth);

        if (updateError) throw updateError;
      }

      setClients(prevClients =>
        prevClients.map(client => {
          if (client.id === clientId) {
            const updatedAssignments = client.assignments.map(assignment =>
              assignment.sdr_id === sdrId
                ? {
                    ...assignment,
                    monthly_set_target: newSetTarget,
                    monthly_hold_target: newHoldTarget
                  }
                : assignment
            );
            return { ...client, assignments: updatedAssignments };
          }
          return client;
        })
      );

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update SDR target');
    }
  }

  async function handleAddClient(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
    const { error: insertError } = await supabase
      .from('clients')
      .insert([{ 
        name: newClientName,
        monthly_set_target: newClientSetTarget,
        monthly_hold_target: newClientHoldTarget
      }]);

    if (insertError) throw insertError;

    setSuccess('Client added successfully');
    setNewClientName('');
    setNewClientSetTarget(0);
    setNewClientHoldTarget(0);
    setShowAddClient(false);
    await fetchClients();
    onUpdate();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to add client');
  } finally {
    setLoading(false);
  }
}

 async function handleAssignClient(e: React.FormEvent) {
  e.preventDefault();
  if (!selectedClient || !selectedSDR) return;

  // ... existing duplicate check code ...

  try {
    // Use selectedMonth as currentMonth for correct month logic
    const currentMonth = selectedMonth;

    const { data: existingAssignment, error: checkError } = await supabase
      .from('assignments')
      .select('*')
      .eq('client_id', selectedClient)
      .eq('sdr_id', selectedSDR)
      .eq('month', currentMonth)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingAssignment) {
      const { error: updateError } = await supabase
        .from('assignments')
        .update({
          monthly_set_target: monthlySetTarget,
          monthly_hold_target: monthlyHoldTarget,
          month: currentMonth,
        })
        .eq('id', existingAssignment.id)
        .eq('month', currentMonth);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('assignments')
        .insert([{
          client_id: selectedClient,
          sdr_id: selectedSDR,
          monthly_set_target: monthlySetTarget,
          monthly_hold_target: monthlyHoldTarget,
          month: currentMonth,
        }]);

      if (insertError) throw insertError;
    }

    setSuccess('Client assigned successfully');
    setSelectedClient(null);
    setSelectedSDR(null);
    setMonthlySetTarget(0);
    setMonthlyHoldTarget(0);
    setShowAssignForm(false);
    await fetchClients();
    onUpdate();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to assign client');
  } finally {
    setLoading(false);
  }
}

  async function handleDeleteClient(clientId: string) {
    if (!confirm('Are you sure you want to delete this client? This will remove all assignments and meetings associated with this client.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (deleteError) throw deleteError;

      setSuccess('Client deleted successfully');
      await fetchClients();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Manage Clients</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                id="sort"
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value as any);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="alphabetical">Alphabetical</option>
                <option value="target">% Target Assigned</option>
                <option value="date">Date Added</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAddClient(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Client List */}
      <div className="p-8">
        <div className="space-y-8">
          {clients.map((client) => {
            const totalAssignedSetTarget = client.assignments.reduce(
              (sum, assignment) => sum + (assignment.monthly_set_target || 0),
              0
            );
            const totalAssignedHoldTarget = client.assignments.reduce(
              (sum, assignment) => sum + (assignment.monthly_hold_target || 0),
              0
            );
            const setAssignmentPercentage = client.monthly_set_target > 0
              ? (totalAssignedSetTarget / client.monthly_set_target) * 100
              : 0;
            const holdAssignmentPercentage = client.monthly_hold_target > 0
              ? (totalAssignedHoldTarget / client.monthly_hold_target) * 100
              : 0;
            // Use setAssignmentPercentage or holdAssignmentPercentage as needed in the UI
            // (see below for usage)
                          return (
                <div
                  key={client.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 space-y-6 hover:shadow-xl transition-all duration-200 hover:border-gray-300"
                >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{client.name}</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Monthly Targets:</span>
                          {clientEditMode === client.id ? (
                            <>
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">Set</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={clientDraftTargets[`${client.id}-set`] ?? client.monthly_set_target}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) {
                                      setClientDraftTargets(prev => ({ 
                                        ...prev, 
                                        [`${client.id}-set`]: val 
                                      }));
                                    }
                                  }}
                                  className="w-20 px-2 py-1 border border-indigo-500 rounded-md"
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">Hold</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={clientDraftTargets[`${client.id}-hold`] ?? client.monthly_hold_target}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) {
                                      setClientDraftTargets(prev => ({ 
                                        ...prev, 
                                        [`${client.id}-hold`]: val 
                                      }));
                                    }
                                  }}
                                  className="w-20 px-2 py-1 border border-indigo-500 rounded-md"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex flex-col">
                                <span className="text-sm">Set: {client.monthly_set_target}</span>
                                <span className="text-sm">Hold: {client.monthly_hold_target}</span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {client.assignments.length} SDR{client.assignments.length !== 1 ? 's' : ''} assigned
                          </span>
                          <span className="text-sm font-medium">
                            (Set: {setAssignmentPercentage.toFixed(1)}% assigned, Hold: {holdAssignmentPercentage.toFixed(1)}% assigned)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Wrap Assign SDR and Edit buttons with a condition that disables them when clientEditMode === client.id */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedClient(client.id);
                          setShowAssignForm(true);
                        }}
                        disabled={clientEditMode === client.id}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                          clientEditMode === client.id
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:ring-indigo-500 border border-indigo-200'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        Assign SDR
                      </button>

                          <button
                            onClick={() => {
                              setClientEditMode(client.id);
                              setClientDraftTargets(prev => ({ ...prev, [client.id]: client.monthly_target }));
                              const draftAssignments: Record<string, number> = {};
                              client.assignments.forEach(a => {
                                draftAssignments[`${client.id}-${a.sdr_id}-set`]  = a.monthly_set_target;
                                draftAssignments[`${client.id}-${a.sdr_id}-hold`] = a.monthly_hold_target;
                              });
                              setAssignmentDraftTargets(prev => ({ ...prev, ...draftAssignments }));
                            }}
                        disabled={clientEditMode === client.id}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
                          clientEditMode === client.id
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500 border border-blue-200'
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </div>

                    {clientEditMode === client.id && (
                    <>
                      <button
                        onClick={() => {
                          const newClientSet  = clientDraftTargets[`${client.id}-set`]  ?? client.monthly_set_target;
                          const newClientHold = clientDraftTargets[`${client.id}-hold`] ?? client.monthly_hold_target;
                          handleUpdateClientTarget(client.id, newClientSet, newClientHold);
                          client.assignments.forEach(a => {
                            const setKey  = `${client.id}-${a.sdr_id}-set`;
                            const holdKey = `${client.id}-${a.sdr_id}-hold`;
                            const newSet  = assignmentDraftTargets[setKey]  ?? a.monthly_set_target;
                            const newHold = assignmentDraftTargets[holdKey] ?? a.monthly_hold_target;
                            handleUpdateSDRTarget(a.sdr_id, client.id, newSet, newHold);
                          });
                          setClientEditMode(null);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => {
                          setClientEditMode(null);
                          setClientDraftTargets(prev => {
                            const copy = { ...prev };
                            delete copy[client.id];
                            return copy;
                          });
                          setAssignmentDraftTargets(prev => {
                            const copy = { ...prev };
                            client.assignments.forEach(a => delete copy[`${client.id}-${a.sdr_id}`]);
                            return copy;
                          });
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                    
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="p-1 text-red-600 hover:text-red-700 focus:outline-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Assignments */}
                {client.assignments.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">SDR Assignments</h4>
                    {client.assignments.map((assignment, index) => {
                      const sdr = sdrs.find((s) => s.id === assignment.sdr_id);
                      const assignmentSetPercentage = client.monthly_set_target > 0
                        ? (assignment.monthly_set_target / client.monthly_set_target) * 100
                        : 0;
                      const assignmentHoldPercentage = client.monthly_hold_target > 0
                        ? (assignment.monthly_hold_target / client.monthly_hold_target) * 100
                        : 0;

                      // Color scheme for SDR cards - 10 unique colors
                      const colorSchemes = [
                        { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' },
                        { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-600' },
                        { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', icon: 'text-purple-600' },
                        { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: 'text-orange-600' },
                        { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', icon: 'text-pink-600' },
                        { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800', icon: 'text-teal-600' },
                        { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', icon: 'text-indigo-600' },
                        { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-600' },
                        { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' },
                        { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', icon: 'text-cyan-600' }
                      ];
                      
                      // Improved hash function for SDR color assignment
                      const getSDRColorScheme = (sdrId: string, sdrName?: string) => {
                        // Combine id and name for more uniqueness
                        const str = sdrId + (sdrName || '');
                        let hash = 5381;
                        for (let i = 0; i < str.length; i++) {
                          hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
                        }
                        return colorSchemes[Math.abs(hash) % colorSchemes.length];
                      };
                      
                      const colorScheme = sdr ? getSDRColorScheme(sdr.id, sdr.full_name) : colorSchemes[0];

                      return (
                        <div
                          key={`${client.id}-${assignment.sdr_id}`}
                          className={`flex items-center justify-between ${colorScheme.bg} ${colorScheme.border} border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${colorScheme.bg} ${colorScheme.border} border`}>
                              <Users className={`w-5 h-5 ${colorScheme.icon}`} />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-sm font-bold ${colorScheme.text}`}>
                                {sdr?.full_name}
                              </span>
                              <span className="text-xs text-gray-500">SDR</span>
                            </div>
                          </div>
                                                      <div className="flex items-center gap-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${colorScheme.bg} ${colorScheme.border} border`}>
                                  <Target className={`w-4 h-4 ${colorScheme.icon}`} />
                                </div>
                                {clientEditMode === client.id ? (
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={assignmentDraftTargets[`${client.id}-${assignment.sdr_id}-set`] ?? assignment.monthly_set_target}
                                      onChange={e => {
                                        const v = parseInt(e.target.value) || 0;
                                        setAssignmentDraftTargets(prev => ({
                                          ...prev,
                                          [`${client.id}-${assignment.sdr_id}-set`]: v
                                        }));
                                      }}
                                      className="w-16 px-2 py-1 text-center border border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      value={assignmentDraftTargets[`${client.id}-${assignment.sdr_id}-hold`] ?? assignment.monthly_hold_target}
                                      onChange={e => {
                                        const v = parseInt(e.target.value) || 0;
                                        setAssignmentDraftTargets(prev => ({
                                          ...prev,
                                          [`${client.id}-${assignment.sdr_id}-hold`]: v
                                        }));
                                      }}
                                      className="w-16 px-2 py-1 text-center border border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <div className="flex gap-4">
                                      <div className="text-center">
                                        <span className={`text-lg font-bold ${colorScheme.text}`}>
                                          {assignment.monthly_set_target}
                                        </span>
                                        <div className="text-xs text-gray-500">Set Target</div>
                                      </div>
                                      <div className="text-center">
                                        <span className={`text-lg font-bold ${colorScheme.text}`}>
                                          {assignment.monthly_hold_target}
                                        </span>
                                        <div className="text-xs text-gray-500">Held Target</div>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Set: {assignmentSetPercentage.toFixed(1)}% | Hold: {assignmentHoldPercentage.toFixed(1)}%
                                    </div>
                                  </div>
                                )}
                              {clientEditMode === client.id && (
                                <button
                                  onClick={async () => {
                                    if (!confirm('Are you sure you want to delete this SDR assignment?')) return;
                                    const now = new Date();
                                    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                                    const { data: existingAssignment, error: checkError } = await supabase
                                      .from('assignments')
                                      .select('id')
                                      .eq('sdr_id', assignment.sdr_id)
                                      .eq('client_id', client.id)
                                      .order('month', { ascending: false }) 
                                      .limit(1)                                      
                                      .maybeSingle();
                                    if (checkError) {
                                      toast.error('Failed to find assignment to delete');
                                      return;
                                    }
                                    if (existingAssignment) {
                                      const { error: deleteError } = await supabase
                                        .from('assignments')
                                        .delete()
                                        .eq('id', existingAssignment.id);
                                      if (deleteError) {
                                        toast.error('Failed to delete assignment');
                                        return;
                                      }
                                      setClients(prevClients =>
                                        prevClients.map(c =>
                                          c.id === client.id
                                            ? { ...c, assignments: c.assignments.filter(a => a.sdr_id !== assignment.sdr_id) }
                                            : c
                                        )
                                      );
                                      toast.success('SDR assignment deleted');
                                    }
                                  }}
                                  className="p-1 text-red-500 hover:text-red-700 focus:outline-none"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 text-gray-400 text-sm italic p-4 bg-gray-50 rounded-md border border-dashed border-gray-200">
                      <span>Looks like this client has no SDR assigned yet.</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Client</h2>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label
                  htmlFor="clientName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Client Name
                </label>
                <input
                  type="text"
                  id="clientName"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="clientSetTarget"
                  className="block text-sm font-medium text-gray-700"
                >
                  Monthly Set Target
                </label>
                <input
                  type="number"
                  id="clientSetTarget"
                  min="0"
                  value={newClientSetTarget}
                  onChange={(e) => setNewClientSetTarget(parseInt(e.target.value) || 0)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="clientHoldTarget"
                  className="block text-sm font-medium text-gray-700"
                >
                  Monthly Held Target
                </label>
                <input
                  type="number"
                  id="clientHoldTarget"
                  min="0"
                  value={newClientHoldTarget}
                  onChange={(e) => setNewClientHoldTarget(parseInt(e.target.value) || 0)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Client Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Assign Client to SDR</h2>
            <form onSubmit={handleAssignClient} className="space-y-4">
              <div>
                <label
                  htmlFor="sdr"
                  className="block text-sm font-medium text-gray-700"
                >
                  Select SDR
                </label>
                <select
                  id="sdr"
                  value={selectedSDR || ''}
                  onChange={(e) => setSelectedSDR(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select an SDR</option>
                  {sdrs.map((sdr) => (
                    <option key={sdr.id} value={sdr.id}>
                      {sdr.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="holdTarget"
                  className="block text-sm font-medium text-gray-700"
                >
                  Monthly Meeting Held Target
                </label>
                <input
                  type="number"
                  id="holdTarget"
                  min="0"
                  value={monthlyHoldTarget === 0 ? '' : monthlyHoldTarget}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setMonthlyHoldTarget(!isNaN(val) ? val : 0);
                  }}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="setTarget"
                  className="block text-sm font-medium text-gray-700"
                >
                  Monthly Meeting Set Target
                </label>
                <input
                  type="number"
                  id="setTarget"
                  min="0"
                  value={monthlySetTarget === 0 ? '' : monthlySetTarget}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setMonthlySetTarget(!isNaN(val) ? val : 0);
                  }}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignForm(false);
                    setSelectedClient(null);
                    setSelectedSDR(null);
                    setMonthlySetTarget(0);
                    setMonthlyHoldTarget(0);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Assign Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}