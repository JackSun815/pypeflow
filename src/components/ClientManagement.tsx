import React, { useState, useEffect } from 'react';
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
  }>;
  monthly_target: number;
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

  // Checkbox state for allowing exceeding client monthly target
  const [allowExceedMap, setAllowExceedMap] = useState<Record<string, boolean>>({});

  // Assignment form state
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedSDR, setSelectedSDR] = useState<string | null>(null);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(0);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const [clientDraftTargets, setClientDraftTargets] = useState<Record<string, number>>({});
  const [assignmentDraftTargets, setAssignmentDraftTargets] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption]);

  async function fetchClients() {
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, monthly_target, created_at, assignments(id, sdr_id, monthly_target)');

      if (clientsError) throw clientsError;

      const processedClients = (clientsData || []).map((client: any) => ({
        ...client,
        assignments: client.assignments || [],
      }));

      // Sorting logic
      let sortedClients = [...processedClients];
      if (sortOption === 'alphabetical') {
        sortedClients.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortOption === 'target') {
        sortedClients.sort((a, b) => {
          const aAssigned = a.assignments.reduce((sum: number, x: any) => sum + x.monthly_target, 0);
          const bAssigned = b.assignments.reduce((sum: number, x: any) => sum + x.monthly_target, 0);
          const aPct = a.monthly_target > 0 ? aAssigned / a.monthly_target : 0;
          const bPct = b.monthly_target > 0 ? bAssigned / b.monthly_target : 0;
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

  async function handleUpdateClientTarget(clientId: string, newTarget: number) {
    if (newTarget < 0) return;

    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('clients')
        .update({ monthly_target: newTarget })
        .eq('id', clientId);

      if (updateError) throw updateError;

      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId 
            ? { ...client, monthly_target: newTarget }
            : client
        )
      );

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update target');
    }
  }

  async function handleUpdateSDRTarget(sdrId: string, clientId: string, newTarget: number) {
    if (newTarget < 0) return;

    try {
      setError(null);
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

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
          .update({ monthly_target: newTarget })
          .eq('id', existingAssignment.id);

        if (updateError) throw updateError;
      }

      setClients(prevClients =>
        prevClients.map(client => {
          if (client.id === clientId) {
            const updatedAssignments = client.assignments.map(assignment =>
              assignment.sdr_id === sdrId
                ? { ...assignment, monthly_target: newTarget }
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
          monthly_target: newClientTarget
        }]);

      if (insertError) throw insertError;

      setSuccess('Client added successfully');
      setNewClientName('');
      setNewClientTarget(0);
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

    const isDuplicate = clients.some(client =>
      client.id === selectedClient &&
      client.assignments.some(assignment => assignment.sdr_id === selectedSDR)
    );

    if (isDuplicate) {
      toast.error('This SDR is already assigned to this client for this month.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const { data: existingAssignment, error: checkError } = await supabase
        .from('assignments')
        .select('*')
        .eq('client_id', selectedClient)
        .eq('sdr_id', selectedSDR)
        .eq('month', currentMonth)
        .maybeSingle();

      if (checkError) throw checkError;

      // Check if adding this assignment would exceed the client's monthly target
      if (!existingAssignment) {
        const client = clients.find((c) => c.id === selectedClient);
        if (client) {
          const totalAssigned = client.assignments.reduce((sum, a) => sum + a.monthly_target, 0);
          if (totalAssigned + monthlyTarget > client.monthly_target) {
            toast.error('Assigning this SDR exceeds the client monthly target.');
            setLoading(false);
            return;
          }
        }
      }

      if (existingAssignment) {
        const { error: updateError } = await supabase
          .from('assignments')
          .update({ monthly_target: monthlyTarget })
          .eq('id', existingAssignment.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('assignments')
          .insert([{
            client_id: selectedClient,
            sdr_id: selectedSDR,
            monthly_target: monthlyTarget,
            month: currentMonth,
          }]);

        if (insertError) throw insertError;
      }

      setSuccess('Client assigned successfully');
      setSelectedClient(null);
      setSelectedSDR(null);
      setMonthlyTarget(0);
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
      <div className="p-6">
        <div className="space-y-4">
          {clients.map((client) => {
            const totalAssignedTarget = client.assignments.reduce(
              (sum, assignment) => sum + assignment.monthly_target,
              0
            );
            const assignmentPercentage = client.monthly_target > 0
              ? (totalAssignedTarget / client.monthly_target) * 100
              : 0;

            return (
              <div
                key={client.id}
                className="border border-gray-200 rounded-lg p-4 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Monthly Target:</span>
                          {clientEditMode === client.id ? (
                            <>
                              <input
                                type="number"
                                min="0"
                                value={clientDraftTargets[client.id] ?? client.monthly_target}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val)) {
                                    setClientDraftTargets(prev => ({ ...prev, [client.id]: val }));
                                  }
                                }}
                                className="w-20 px-2 py-1 text-center border border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                             
                            </>
                          ) : (
                            <>
                              <span className="w-20 text-center">{client.monthly_target}</span>
                             
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {client.assignments.length} SDR{client.assignments.length !== 1 ? 's' : ''} assigned
                          </span>
                          <span className="text-sm font-medium">
                            ({assignmentPercentage.toFixed(1)}% of target assigned)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Wrap Assign SDR and Edit buttons with a condition that disables them when clientEditMode === client.id */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedClient(client.id);
                          setShowAssignForm(true);
                        }}
                        disabled={clientEditMode === client.id}
                        className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          clientEditMode === client.id
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:ring-indigo-500'
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
                            draftAssignments[`${client.id}-${a.sdr_id}`] = a.monthly_target;
                          });
                          setAssignmentDraftTargets(prev => ({ ...prev, ...draftAssignments }));
                        }}
                        disabled={clientEditMode === client.id}
                        className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          clientEditMode === client.id
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:ring-indigo-500'
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </div>

                    {clientEditMode === client.id && (
                    <>
                      {/* Checkbox for allowing exceeding client monthly target */}
                      <div className="flex items-center gap-2">
                        <input
                          id={`allow-exceed-${client.id}`}
                          type="checkbox"
                          checked={allowExceedMap[client.id] || false}
                          onChange={(e) =>
                            setAllowExceedMap(prev => ({ ...prev, [client.id]: e.target.checked }))
                          }
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`allow-exceed-${client.id}`}
                          className="text-sm text-gray-600"
                        >
                          Allow exceeded monthly target
                        </label>
                      </div>
                      <button
                        onClick={() => {
                          const newTotalAssigned = client.assignments.reduce((sum, a) => {
                            const key = `${client.id}-${a.sdr_id}`;
                            return sum + (assignmentDraftTargets[key] ?? a.monthly_target);
                          }, 0);
                          const newClientTarget = clientDraftTargets[client.id] ?? client.monthly_target;
                          if (newTotalAssigned > newClientTarget && !allowExceedMap[client.id]) {
                            toast.error('Combined SDR target exceeds client monthly target.');
                            return;
                          }
                          handleUpdateClientTarget(client.id, newClientTarget);
                          client.assignments.forEach((a) => {
                            const key = `${client.id}-${a.sdr_id}`;
                            handleUpdateSDRTarget(a.sdr_id, client.id, assignmentDraftTargets[key]);
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
                {client.assignments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {client.assignments.map((assignment) => {
                      const sdr = sdrs.find((s) => s.id === assignment.sdr_id);
                      const assignmentPercentage = client.monthly_target > 0
                        ? (assignment.monthly_target / client.monthly_target) * 100
                        : 0;

                      return (
                        <div
                          key={`${client.id}-${assignment.sdr_id}`}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                              {sdr?.full_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-gray-400" />
                              {clientEditMode === client.id ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={assignmentDraftTargets[`${client.id}-${assignment.sdr_id}`] ?? assignment.monthly_target}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) {
                                      setAssignmentDraftTargets(prev => ({
                                        ...prev,
                                        [`${client.id}-${assignment.sdr_id}`]: val
                                      }));
                                    }
                                  }}
                                  className="w-20 px-2 py-1 text-center border border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              ) : (
                                <span className="w-20 text-center">{assignment.monthly_target}</span>
                              )}
                              <span className="text-sm text-gray-500">
                                ({assignmentPercentage.toFixed(1)}% of client target)
                              </span>
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
                                      .eq('month', currentMonth)
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
                  htmlFor="clientTarget"
                  className="block text-sm font-medium text-gray-700"
                >
                  Monthly Target
                </label>
                <input
                  type="number"
                  id="clientTarget"
                  min="0"
                  value={newClientTarget}
                  onChange={(e) => setNewClientTarget(parseInt(e.target.value) || 0)}
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
                  htmlFor="target"
                  className="block text-sm font-medium text-gray-700"
                >
                  Monthly Meeting Target
                </label>
                <input
                  type="number"
                  id="target"
                  min="0"
                  value={monthlyTarget === 0 ? '' : monthlyTarget}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setMonthlyTarget(!isNaN(val) ? val : 0);
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
                    setMonthlyTarget(0);
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