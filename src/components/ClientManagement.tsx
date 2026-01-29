import React, { useState, useEffect, useRef } from 'react';
import { format, subMonths } from 'date-fns';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import {Plus, Trash2, AlertCircle, Users, Target, Edit } from 'lucide-react';
import type { Client, Profile, Meeting } from '../types/database';
import { useAgency } from '../contexts/AgencyContext';
import { logger, calculateChanges } from '../lib/logger';

interface ClientManagementProps {
  sdrs: Profile[];
  onUpdate: () => void;
  darkTheme?: boolean;
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

// Add interface for meeting metrics
interface MeetingMetrics {
  setCount: number;
  heldCount: number;
}

export default function ClientManagement({ sdrs, onUpdate, darkTheme = false }: ClientManagementProps) {
  const { agency } = useAgency();
  const [clients, setClients] = useState<ClientWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Sort option state
  const [sortOption, setSortOption] = useState<'alphabetical' | 'target' | 'date'>('alphabetical');
  // Removed archived functionality - now using month-specific client management

  // New client form state
  const [newClientName, setNewClientName] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);

  // Edit mode for client target
  const [clientEditMode, setClientEditMode] = useState<string | null>(null);


  // Assignment form state
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedSDR, setSelectedSDR] = useState<string | null>(null);
  const [monthlyHoldTarget, setMonthlyHoldTarget] = useState<number>(0);
  const [monthlySetTarget, setMonthlySetTarget] = useState<number>(0);
  const [newClientHoldTarget, setNewClientHoldTarget] = useState<number | string>(0);
  const [newClientSetTarget, setNewClientSetTarget] = useState<number | string>(0);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [allClients, setAllClients] = useState<Client[]>([]);

  // Month selector state
  const now = new Date();
  const currentMonth = format(now, 'yyyy-MM');
  
  // Initialize selectedMonth from localStorage or default to current month
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const saved = localStorage.getItem('clientManagementSelectedMonth');
    return saved || currentMonth;
  });

  // Generate month options: next month + current month + 5 previous months
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthOptions = [
    {
      value: format(nextMonth, 'yyyy-MM'),
      label: format(nextMonth, 'MMMM yyyy')
    },
    {
      value: format(now, 'yyyy-MM'),
      label: format(now, 'MMMM yyyy')
    },
    ...Array.from({ length: 5 }, (_, i) => {
      const date = subMonths(now, i + 1);
      return {
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy')
      };
    })
  ];

  // Save selectedMonth to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('clientManagementSelectedMonth', selectedMonth);
  }, [selectedMonth]);

  const [clientDraftTargets, setClientDraftTargets] = useState<Record<string, number>>({});
  const [assignmentDraftTargets, setAssignmentDraftTargets] = useState<Record<string, number>>({});
  const [meetingMetrics, setMeetingMetrics] = useState<Record<string, Record<string, MeetingMetrics>>>({});
  const [meetings, setMeetings] = useState<any[]>([]);

  // Undo system
  const [undoStack, setUndoStack] = useState<Array<{
    action: 'remove_client' | 'add_client' | 'assign_client' | 'update_target';
    data: any;
    timestamp: number;
  }>>([]);
  const [canUndo, setCanUndo] = useState(false);

  // Unassigned clients modal state
  const [showUnassignedModal, setShowUnassignedModal] = useState(false);
  const [unassignedClients, setUnassignedClients] = useState<ClientWithAssignments[]>([]);

  // File input ref for CSV import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to calculate unassigned clients
  const calculateUnassignedClients = () => {
    return clients.filter(client => {
      const totalAssignedSetTarget = client.assignments.reduce((sum, assignment) => sum + (assignment.monthly_set_target || 0), 0);
      const totalAssignedHoldTarget = client.assignments.reduce((sum, assignment) => sum + (assignment.monthly_hold_target || 0), 0);
      
      const hasUnassignedSetTarget = client.monthly_set_target > totalAssignedSetTarget;
      const hasUnassignedHoldTarget = client.monthly_hold_target > totalAssignedHoldTarget;
      
      return hasUnassignedSetTarget || hasUnassignedHoldTarget;
    });
  };

  // Function to handle unassigned targets click
  const handleUnassignedClick = () => {
    const unassigned = calculateUnassignedClients();
    setUnassignedClients(unassigned);
    setShowUnassignedModal(true);
  };


  useEffect(() => {
    fetchClients();
    fetchAllClients();
    fetchMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption, selectedMonth]);

  async function fetchClients() {
    try {
      if (!agency?.id) {
        setError('Agency information not available. Please refresh the page.');
        return;
      }

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('agency_id', agency.id)
        .is('archived_at', null); // Only fetch non-archived clients

      if (clientsError) throw clientsError;

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('agency_id', agency.id)
        .eq('month', String(selectedMonth));

      if (assignmentsError) throw assignmentsError;

      // Fetch month-specific client targets
      const { data: clientTargetsData, error: clientTargetsError } = await supabase
        .from('client_monthly_targets')
        .select('*')
        .eq('agency_id', agency.id)
        .eq('month', String(selectedMonth));

      if (clientTargetsError) throw clientTargetsError;

      // Debug logs removed for cleaner console output

      // Only show clients that have assignments in the selected month
      // Exception: Show newly created clients in the month they were created (even without assignments)
      // Clients will NOT auto-populate into future months - they must be explicitly imported
      const processedClients = (clientsData || [])
        .map((client: any) => {
          // Find month-specific targets for this client
          const monthlyTarget = (clientTargetsData || []).find((t: any) => t.client_id === client.id);
          
          // Use month-specific targets if they exist, otherwise fall back to client's default targets
          const monthly_set_target = monthlyTarget?.monthly_set_target ?? client.monthly_set_target ?? 0;
          const monthly_hold_target = monthlyTarget?.monthly_hold_target ?? client.monthly_hold_target ?? 0;
          
          return {
          ...client,
            monthly_set_target, // Override with month-specific target
            monthly_hold_target, // Override with month-specific target
          assignments: (assignmentsData || []).filter((a: any) => 
            a.client_id === client.id && 
            !(a.sdr_id === null && a.monthly_set_target === -1) && // Exclude hidden markers
            a.is_active !== false // Exclude inactive assignments
          )
          };
        })
        .filter((client: any) => {
          // Check if client has a hidden marker for this month
          const hasHiddenMarker = (assignmentsData || []).some((a: any) => 
            a.client_id === client.id && 
            a.sdr_id === null && 
            a.monthly_set_target === -1
          );
          
          if (hasHiddenMarker) {
            return false; // Exclude clients with hidden markers
          }
          
          // Check if client has assignments in this specific month
          const hasAssignments = (assignmentsData || []).some((a: any) => 
            a.client_id === client.id && 
            a.sdr_id !== null && 
            a.monthly_set_target !== -1 &&
            a.is_active !== false
          );
          
          // Check if client has monthly targets set for this month
          // This ensures clients remain visible even after all assignments are removed
          const hasMonthlyTarget = (clientTargetsData || []).some((t: any) => 
            t.client_id === client.id && 
            t.month === selectedMonth
          );
          
          // Show client if it has assignments OR has monthly targets for this month
          return hasAssignments || hasMonthlyTarget;
        });

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
      if (!agency?.id) {
        setError('Agency information not available');
        return;
      }

      setError(null);
      
      // Get old values for audit log
      const oldClient = clients.find(c => c.id === clientId);
      const oldValues = {
        monthly_set_target: oldClient?.monthly_set_target || 0,
        monthly_hold_target: oldClient?.monthly_hold_target || 0
      };
      
      const newValues = {
        monthly_set_target: newSetTarget,
        monthly_hold_target: newHoldTarget
      };
      
      // Upsert month-specific client target (create or update)
      // Check if target exists for this month
      const { data: existingTarget } = await supabase
        .from('client_monthly_targets')
        .select('id')
        .eq('client_id', clientId)
        .eq('month', selectedMonth)
        .eq('agency_id', agency.id)
        .maybeSingle();

      let updateError;
      if (existingTarget) {
        // Update existing target
        const { error } = await supabase
          .from('client_monthly_targets')
        .update({ 
          monthly_set_target: newSetTarget,
            monthly_hold_target: newHoldTarget,
            updated_at: new Date().toISOString()
        })
          .eq('id', existingTarget.id);
        updateError = error;
      } else {
        // Insert new target
        const { error } = await supabase
          .from('client_monthly_targets')
          .insert({
            client_id: clientId,
            month: selectedMonth,
            agency_id: agency.id,
            monthly_set_target: newSetTarget,
            monthly_hold_target: newHoldTarget
          });
        updateError = error;
      }

      if (updateError) {
        console.error('Failed to update client monthly target:', updateError);
        throw updateError;
      }

      // Log the update
      const clientName = clients.find(c => c.id === clientId)?.name || 'Unknown Client';
      await logger.logClientAction(
        'update',
        clientId,
        calculateChanges(oldValues, newValues),
        oldValues,
        newValues,
        { client_name: clientName }
      );

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

      await fetchClients(); // Refresh to get updated data
      onUpdate();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update target';
      console.error('Error updating client target:', err);
      
      // Check if the error is about the table not existing
      if (errorMessage.includes('does not exist') || errorMessage.includes('client_monthly_targets')) {
        setError(`Database table not found. Please run the migration: ${errorMessage}`);
      } else {
        setError(errorMessage);
      }
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
        .eq('sdr_id', String(sdrId))
        .eq('client_id', String(clientId))
        .eq('month', String(currentMonth))
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingAssignment) {
        const { error: updateError } = await supabase
          .from('assignments')
          .update({
            monthly_set_target: newSetTarget,
            monthly_hold_target: newHoldTarget,
            month: String(currentMonth),
          })
          .eq('id', String(existingAssignment.id))
          .eq('month', String(currentMonth));

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
    if (!agency?.id) {
      setError('Agency information not available. Please refresh the page and try again.');
      return;
    }
    // Insert the client with proper targets
    const { data: insertedClient, error: insertError } = await supabase
      .from('clients')
      .insert([{ 
        name: newClientName,
        monthly_set_target: typeof newClientSetTarget === 'string' ? parseInt(newClientSetTarget) || 0 : newClientSetTarget,
        monthly_hold_target: typeof newClientHoldTarget === 'string' ? parseInt(newClientHoldTarget) || 0 : newClientHoldTarget,
        agency_id: agency?.id
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    // Create a monthly target entry for the selected month
    // This ensures the client is visible in this month even without assignments
    const { error: monthlyTargetError } = await supabase
      .from('client_monthly_targets')
      .upsert([{
        client_id: insertedClient.id,
        month: selectedMonth,
        agency_id: agency?.id,
        monthly_set_target: typeof newClientSetTarget === 'string' ? parseInt(newClientSetTarget) || 0 : newClientSetTarget,
        monthly_hold_target: typeof newClientHoldTarget === 'string' ? parseInt(newClientHoldTarget) || 0 : newClientHoldTarget,
      }], {
        onConflict: 'client_id,month,agency_id'
      });

    if (monthlyTargetError) {
      console.error('Error creating monthly target:', monthlyTargetError);
      // Don't throw - the client was created successfully, just log the error
    }
    
    // Log client creation
    await logger.logClientAction(
      'create',
      insertedClient.id,
      undefined,
      undefined,
      {
        name: newClientName,
        monthly_set_target: insertedClient.monthly_set_target,
        monthly_hold_target: insertedClient.monthly_hold_target
      },
      { client_name: newClientName }
    );

    // Add to undo stack after successful creation
    addToUndoStack('add_client', {
      clientId: insertedClient.id,
      clientName: newClientName
    });

    // Client will now appear in the list immediately
    const selectedMonthName = monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth;
    setSuccess(`Client "${newClientName}" added successfully and is now visible in the ${selectedMonthName} list. You can now assign SDRs to this client.`);
    setNewClientName('');
    setNewClientSetTarget(0);
    setNewClientHoldTarget(0);
    setShowAddClient(false);
    await fetchClients();
    await fetchAllClients();
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

  try {
    setLoading(true);
    setError(null);
    
    // Use selectedMonth as currentMonth for correct month logic
    const currentMonth = selectedMonth;

    console.log('🔍 Assignment Debug:', {
      selectedClient,
      selectedSDR,
      currentMonth,
      monthlySetTarget,
      monthlyHoldTarget,
      agencyId: agency?.id
    });

    // First check: Look for existing assignment in database (including inactive ones)
    const { data: existingAssignment, error: checkError } = await supabase
      .from('assignments')
      .select('*')
      .eq('client_id', String(selectedClient))
      .eq('sdr_id', String(selectedSDR))
      .eq('month', String(currentMonth))
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing assignment:', checkError);
      throw checkError;
    }

    console.log('🔍 Existing assignment check:', existingAssignment);

    if (existingAssignment) {
      // If assignment exists but is inactive, reactivate it
      if (existingAssignment.is_active === false) {
        console.log('🔄 Reactivating inactive assignment...');
        const { error: updateError } = await supabase
          .from('assignments')
          .update({
            monthly_set_target: monthlySetTarget,
            monthly_hold_target: monthlyHoldTarget,
            month: String(currentMonth),
            is_active: true,
          })
          .eq('id', String(existingAssignment.id));

        if (updateError) {
          console.error('❌ Update error (reactivate):', updateError);
          throw updateError;
        }
      } else {
        // Update existing active assignment
        console.log('🔄 Updating existing assignment...');
        const { error: updateError } = await supabase
          .from('assignments')
          .update({
            monthly_set_target: monthlySetTarget,
            monthly_hold_target: monthlyHoldTarget,
            month: String(currentMonth),
          })
          .eq('id', String(existingAssignment.id));

        if (updateError) {
          console.error('❌ Update error:', updateError);
          throw updateError;
        }
      }
    } else {
      console.log('🔍 Creating new assignment...');
      
      const { data: insertedAssignment, error: insertError } = await supabase
        .from('assignments')
        .insert([{
          client_id: String(selectedClient),
          sdr_id: String(selectedSDR),
          monthly_set_target: monthlySetTarget,
          monthly_hold_target: monthlyHoldTarget,
          month: String(currentMonth),
          agency_id: agency?.id,
          is_active: true,
        }])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        console.error('❌ Insert error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        
        // If it's a unique constraint violation, try to find and update/reactivate the existing assignment
        if (insertError.code === '23505' || insertError.message?.includes('unique') || insertError.message?.includes('duplicate')) {
          console.log('🔄 Unique constraint violation detected, attempting to find and reactivate existing assignment...');
          
          const { data: existingAssignmentRetry, error: retryCheckError } = await supabase
            .from('assignments')
            .select('*')
            .eq('client_id', String(selectedClient))
            .eq('sdr_id', String(selectedSDR))
            .eq('month', String(currentMonth))
            .maybeSingle();
          
          if (retryCheckError) {
            console.error('❌ Error finding existing assignment on retry:', retryCheckError);
            throw insertError; // Throw original error
          }
          
          if (existingAssignmentRetry) {
            console.log('🔄 Found existing assignment, reactivating and updating...');
            const { error: reactivateError } = await supabase
              .from('assignments')
              .update({
                monthly_set_target: monthlySetTarget,
                monthly_hold_target: monthlyHoldTarget,
                month: String(currentMonth),
                is_active: true,
              })
              .eq('id', String(existingAssignmentRetry.id));
            
            if (reactivateError) {
              console.error('❌ Error reactivating assignment:', reactivateError);
              throw reactivateError;
            }
            
            console.log('✅ Assignment reactivated successfully');
            // Skip undo stack for reactivated assignments (they're updates, not new)
            // Continue to success flow below
          } else {
            // Couldn't find existing assignment, throw original error
            throw insertError;
          }
        } else {
          throw insertError;
        }
      } else {
        // Only add to undo stack if this was a new assignment (not a reactivation)
        console.log('✅ Assignment created successfully:', insertedAssignment);

        // Log assignment creation
        const clientName = allClients.find(c => c.id === insertedAssignment.client_id)?.name || 'Unknown Client';
        const sdrName = sdrs.find(s => s.id === insertedAssignment.sdr_id)?.full_name || 'Unknown SDR';
        await logger.logClientAction(
          'create',
          insertedAssignment.client_id,
          { action: 'assign_sdr' },
          undefined,
          {
            sdr_id: insertedAssignment.sdr_id,
            monthly_set_target: insertedAssignment.monthly_set_target,
            monthly_hold_target: insertedAssignment.monthly_hold_target,
            month: insertedAssignment.month
          },
          { client_name: clientName, sdr_name: sdrName, action: 'assign_sdr' }
        );

        // Add to undo stack for new assignments
        addToUndoStack('assign_client', {
          assignmentId: insertedAssignment.id,
          clientId: String(selectedClient),
          sdrId: String(selectedSDR)
        });
      }
    }

    // Ensure the client has a monthly target entry for this month
    // This makes the client visible even if all assignments are later removed
    const client = allClients.find(c => c.id === selectedClient);
    if (client) {
      const { error: monthlyTargetError } = await supabase
        .from('client_monthly_targets')
        .upsert([{
          client_id: selectedClient,
          month: currentMonth,
          agency_id: agency?.id,
          monthly_set_target: client.monthly_set_target || 0,
          monthly_hold_target: client.monthly_hold_target || 0,
        }], {
          onConflict: 'client_id,month,agency_id'
        });

      if (monthlyTargetError) {
        console.error('Error creating/updating monthly target:', monthlyTargetError);
        // Don't throw - the assignment was successful, just log the error
      }
    }

    setSuccess('Client assigned successfully');
    setSelectedClient(null);
    setSelectedSDR(null);
    setMonthlySetTarget(0);
    setMonthlyHoldTarget(0);
    setShowAssignForm(false);
    
    console.log('🔄 Refreshing client list...');
    await fetchClients();
    onUpdate();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to assign client');
  } finally {
    setLoading(false);
  }
}

  async function handleDeleteClient(clientId: string) {
    const client = clients.find(c => c.id === clientId);
    const clientName = client?.name || 'this client';
    const selectedMonthName = monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth;
    
    // Check if client has assignments for the selected month
    const hasCurrentMonthAssignments = client?.assignments.length > 0;
    
    // Check if client has historical data from other months
    const { data: historicalAssignments, error: checkError } = await supabase
      .from('assignments')
      .select('id, month')
      .eq('client_id', clientId)
      .neq('month', selectedMonth);

    if (checkError) {
      setError('Failed to check client history');
      return;
    }

    const hasOtherMonthsData = historicalAssignments && historicalAssignments.length > 0;
    
    let confirmMessage;
    if (hasCurrentMonthAssignments) {
      if (hasOtherMonthsData) {
        confirmMessage = `Remove "${clientName}" from ${selectedMonthName}?\n\n✅ This will:\n• Remove all SDR assignments for ${selectedMonthName}\n• Preserve all historical data from other months\n• Keep all past meeting records intact\n\nThe client will still appear in previous months' data.`;
      } else {
        confirmMessage = `Remove "${clientName}" from ${selectedMonthName}?\n\n⚠️ This client only has assignments for ${selectedMonthName}.\nRemoving will hide the client from the active list, but preserve any meeting data.`;
      }
    } else {
      // Client has no assignments for this month, but we still want to "remove" it from view
      if (hasOtherMonthsData) {
        confirmMessage = `Hide "${clientName}" from ${selectedMonthName}?\n\nThis client has no assignments for ${selectedMonthName} but has historical data.\nHiding will remove it from this month's view while preserving all historical data.`;
      } else {
        confirmMessage = `Hide "${clientName}" from the active client list?\n\n⚠️ This client has no assignments or historical data.\nThis will hide it from view but keep the client record intact.`;
      }
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Add to undo stack before making changes
      addToUndoStack('remove_client', {
        clientId,
        clientName,
        assignments: client?.assignments || []
      });

      if (hasCurrentMonthAssignments) {
        // Instead of deleting assignments, mark them as inactive for this month
        const { error: updateError } = await supabase
          .from('assignments')
          .update({ 
            is_active: false,
            deactivated_at: new Date().toISOString(),
            deactivation_reason: 'client_removed_from_month'
          })
          .eq('client_id', clientId)
          .eq('month', selectedMonth);

        if (updateError) throw updateError;
        
        setSuccess(`"${clientName}" removed from ${selectedMonthName}. All meetings are preserved. It will still appear in other months.`);
      } else {
        // For clients without assignments, we need to mark them as hidden for this month
        // We'll create a special assignment record with null sdr_id to indicate "hidden"
        const { error: hideError } = await supabase
          .from('assignments')
          .insert([{
            client_id: clientId,
            sdr_id: null, // Special marker for hidden clients
            monthly_set_target: -1, // Special marker value
            monthly_hold_target: -1, // Special marker value
            month: selectedMonth,
            agency_id: agency?.id, // Add agency_id for multi-tenant support
          }]);

        if (hideError) throw hideError;
        
        setSuccess(`"${clientName}" hidden from ${selectedMonthName} view.`);
      }
      
      await fetchClients();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove client from month');
    } finally {
      setLoading(false);
    }
  }

  async function exportToExcel() {
    try {
      setLoading(true);
      setError(null);
      
      if (!agency?.id) {
        setError('Agency information not available');
        return;
      }

      // Fetch assignments for the selected month only
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*, clients(name, id), profiles(full_name, id)')
        .eq('agency_id', agency.id)
        .eq('month', selectedMonth)
        .eq('is_active', true)
        .not('sdr_id', 'is', null);

      if (assignmentsError) throw assignmentsError;

      if (!assignmentsData || assignmentsData.length === 0) {
        setError(`No assignments found for ${monthOptions.find(m => m.value === selectedMonth)?.label}`);
        return;
      }

      // Prepare data for export in import-friendly format
      const exportData = assignmentsData.map((assignment: any) => ({
        'Client Name': assignment.clients?.name || '',
        'Client ID': assignment.client_id,
        'SDR Name': assignment.profiles?.full_name || '',
        'SDR ID': assignment.sdr_id,
        'Monthly Set Target': assignment.monthly_set_target || 0,
        'Monthly Hold Target': assignment.monthly_hold_target || 0
      }));

      // Convert to CSV and download
      const headers = ['Client Name', 'Client ID', 'SDR Name', 'SDR ID', 'Monthly Set Target', 'Monthly Hold Target'];
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `assignments_${selectedMonth}_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(`Successfully exported ${exportData.length} assignments to CSV file`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setLoading(false);
    }
  }

  async function importFromCSV(file: File) {
    try {
      setLoading(true);
      setError(null);
      
      if (!agency?.id) {
        setError('Agency information not available');
        return;
      }
      
      // Read the CSV file
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setError('CSV file is empty or invalid');
        return;
      }

      // Parse CSV headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      // Validate required headers
      const requiredHeaders = ['Client Name', 'Client ID', 'SDR ID', 'Monthly Set Target', 'Monthly Hold Target'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        setError(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      // Parse data rows
      const assignments = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle CSV parsing with proper quote handling
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          
          if (char === '"') {
            if (insideQuotes && line[j + 1] === '"') {
              currentValue += '"';
              j++;
            } else {
              insideQuotes = !insideQuotes;
            }
          } else if (char === ',' && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());
        
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Validate row data
        const clientId = row['Client ID']?.trim();
        const sdrId = row['SDR ID']?.trim();
        const setTarget = parseInt(row['Monthly Set Target']) || 0;
        const holdTarget = parseInt(row['Monthly Hold Target']) || 0;
        
        if (!clientId || !sdrId) {
          errors.push(`Row ${i + 1}: Missing Client ID or SDR ID`);
          continue;
        }
        
        if (isNaN(setTarget) || isNaN(holdTarget)) {
          errors.push(`Row ${i + 1}: Invalid target values`);
          continue;
        }
        
        assignments.push({
          client_id: clientId,
          sdr_id: sdrId,
          monthly_set_target: setTarget,
          monthly_hold_target: holdTarget,
          month: selectedMonth,
          agency_id: agency.id,
          is_active: true
        });
      }

      if (assignments.length === 0) {
        setError('No valid assignments found in CSV file');
        return;
      }

      // Check for existing assignments for this month
      const { data: existingAssignments } = await supabase
        .from('assignments')
        .select('*')
        .eq('agency_id', agency.id)
        .eq('month', selectedMonth);

      const hasExisting = existingAssignments && existingAssignments.length > 0;
      
      if (hasExisting) {
        const confirmMessage = `Found ${existingAssignments.length} existing assignment(s) for ${monthOptions.find(m => m.value === selectedMonth)?.label}.\n\nImporting will REPLACE all existing assignments.\n\nContinue?`;
        
        if (!confirm(confirmMessage)) {
          setLoading(false);
          return;
        }

        // Delete existing assignments
      const { error: deleteError } = await supabase
        .from('assignments')
        .delete()
        .eq('agency_id', agency.id)
        .eq('month', selectedMonth);

      if (deleteError) throw deleteError;
      }

      // Insert new assignments
      const { error: insertError } = await supabase
        .from('assignments')
        .insert(assignments);

      if (insertError) throw insertError;

      let successMessage = `Successfully imported ${assignments.length} assignment(s) for ${monthOptions.find(m => m.value === selectedMonth)?.label}`;
      
      if (errors.length > 0) {
        successMessage += `\n\nWarnings:\n${errors.join('\n')}`;
      }

      setSuccess(successMessage);
      
      // Refresh the client list
      await fetchClients();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV file');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllClients() {
    try {
      if (!agency?.id) {
        return;
      }

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('agency_id', agency.id)
        .is('archived_at', null) // Only fetch non-archived clients
        .order('name', { ascending: true });

      if (clientsError) throw clientsError;
      setAllClients(clientsData || []);
    } catch (err) {
      console.error('Failed to fetch all clients:', err);
    }
  }

  async function fetchMeetings() {
    try {
      if (!agency?.id) {
        return;
      }

      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);

      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .eq('agency_id', agency.id)
        .gte('scheduled_date', startDate.toISOString().split('T')[0])
        .lte('scheduled_date', endDate.toISOString().split('T')[0]);

      if (meetingsError) throw meetingsError;
      setMeetings(meetingsData || []);
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
      setMeetings([]);
    }
  }

  // Add action to undo stack
  function addToUndoStack(action: 'remove_client' | 'add_client' | 'assign_client' | 'update_target', data: any) {
    const undoItem = {
      action,
      data,
      timestamp: Date.now()
    };
    
    setUndoStack(prev => {
      const newStack = [undoItem, ...prev.slice(0, 9)]; // Keep last 10 actions
      setCanUndo(newStack.length > 0);
      return newStack;
    });
  }

  // Undo last action
  async function handleUndo() {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[0];
    setUndoStack(prev => {
      const newStack = prev.slice(1);
      setCanUndo(newStack.length > 0);
      return newStack;
    });

    try {
      setLoading(true);
      setError(null);

      switch (lastAction.action) {
        case 'remove_client':
          await undoRemoveClient(lastAction.data);
          break;
        case 'add_client':
          await undoAddClient(lastAction.data);
          break;
        case 'assign_client':
          await undoAssignClient(lastAction.data);
          break;
        case 'update_target':
          await undoUpdateTarget(lastAction.data);
          break;
      }

      setSuccess(`Undid ${lastAction.action.replace('_', ' ')} action`);
      await fetchClients();
      await fetchAllClients();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to undo action');
    } finally {
      setLoading(false);
    }
  }

  // Undo functions for each action type
  async function undoRemoveClient(data: { clientId: string; clientName: string; assignments: any[] }) {
    // Restore assignments that were soft deleted
    if (data.assignments.length > 0) {
      const { error } = await supabase
        .from('assignments')
        .update({ 
          is_active: true,
          deactivated_at: null,
          deactivation_reason: null
        })
        .eq('client_id', data.clientId)
        .eq('month', selectedMonth)
        .eq('is_active', false);

      if (error) throw error;
    }

    // Remove hidden marker if it exists
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('client_id', data.clientId)
      .eq('month', selectedMonth)
      .is('sdr_id', null)
      .eq('monthly_set_target', -1);

    if (deleteError) throw deleteError;
  }

  async function undoAddClient(data: { clientId: string; clientName: string }) {
    // Delete the client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', data.clientId);

    if (error) throw error;
  }

  async function undoAssignClient(data: { assignmentId: string; clientId: string; sdrId: string }) {
    // Delete the assignment
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', data.assignmentId);

    if (error) throw error;
  }

  async function undoUpdateTarget(data: { clientId: string; oldSetTarget: number; oldHoldTarget: number }) {
    // Restore old targets
    const { error } = await supabase
      .from('clients')
      .update({ 
        monthly_set_target: data.oldSetTarget,
        monthly_hold_target: data.oldHoldTarget
      })
      .eq('id', data.clientId);

    if (error) throw error;
  }

  // Removed archived client functions - now using month-specific management

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
      <div className={`p-6 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className={`text-lg font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>Manage Clients</h2>
            {/* Month-specific client management - no archived toggle needed */}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className={`text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Sort by:</label>
              <select
                id="sort"
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value as any);
                }}
                className={`border rounded px-2 py-1 text-sm ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
              >
                <option value="alphabetical">Alphabetical</option>
                <option value="target">% Target Assigned</option>
                <option value="date">Date Added</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className={`text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`border rounded px-2 py-1 text-sm ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
              >
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {selectedMonth === currentMonth && (
                <span className={`text-xs ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>(Current)</span>
              )}
            </div>

            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border ${
                canUndo 
                  ? darkTheme ? 'text-orange-300 bg-orange-900/30 hover:bg-orange-900/50 border-orange-800/50' : 'text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200'
                  : darkTheme ? 'text-slate-500 bg-[#1d1f24] border-[#2d3139] cursor-not-allowed' : 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
              }`}
              title={canUndo ? `Undo last action (${undoStack.length} actions available)` : 'No actions to undo'}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Undo
            </button>
            <button
              onClick={() => {
                if (confirm('Export client assignments to CSV?')) {
                  exportToExcel();
                }
              }}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded hover:bg-blue-100 border ${darkTheme ? 'text-blue-300 bg-blue-900/30 border-blue-800/50 hover:bg-blue-900/50' : 'text-blue-700 bg-blue-50 border-blue-200'}`}
              title="Export all clients and assignments to CSV"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  importFromCSV(file);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }
              }}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded hover:bg-green-100 border ${darkTheme ? 'text-green-300 bg-green-900/30 border-green-800/50 hover:bg-green-900/50' : 'text-green-700 bg-green-50 border-green-200'}`}
              title="Import client assignments from CSV"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import
            </button>
            <button
              onClick={() => setShowAddClient(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

      {/* Overview Section */}
      <div className={`p-6 border-b ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139]' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
          <Target className="w-5 h-5" />
          Target Overview - {monthOptions.find(m => m.value === selectedMonth)?.label}
        </h3>
        
        {/* Calculate overview metrics */}
        {(() => {
          // Use the same calculation logic as the unassigned clients modal
          const unassignedClients = clients.filter(client => {
            const totalAssignedSetTarget = client.assignments.reduce((sum, assignment) => sum + (assignment.monthly_set_target || 0), 0);
            const totalAssignedHoldTarget = client.assignments.reduce((sum, assignment) => sum + (assignment.monthly_hold_target || 0), 0);
            
            const hasUnassignedSetTarget = client.monthly_set_target > totalAssignedSetTarget;
            const hasUnassignedHoldTarget = client.monthly_hold_target > totalAssignedHoldTarget;
            
            return hasUnassignedSetTarget || hasUnassignedHoldTarget;
          });

          // Calculate unassigned amounts by adding up each client's unassigned amounts
          const unassignedSetTarget = unassignedClients.reduce((sum, client) => {
            const totalAssignedSetTarget = client.assignments.reduce((acc, assignment) => acc + (assignment.monthly_set_target || 0), 0);
            const unassignedAmount = client.monthly_set_target - totalAssignedSetTarget;
            return sum + Math.max(0, unassignedAmount); // Only add positive unassigned amounts
          }, 0);

          const unassignedHeldTarget = unassignedClients.reduce((sum, client) => {
            const totalAssignedHoldTarget = client.assignments.reduce((acc, assignment) => acc + (assignment.monthly_hold_target || 0), 0);
            const unassignedAmount = client.monthly_hold_target - totalAssignedHoldTarget;
            return sum + Math.max(0, unassignedAmount); // Only add positive unassigned amounts
          }, 0);

          // Calculate total client targets for display
          const totalClientSetTarget = clients.reduce((sum, client) => sum + (client.monthly_set_target || 0), 0);
          const totalClientHeldTarget = clients.reduce((sum, client) => sum + (client.monthly_hold_target || 0), 0);

          // Calculate total assigned targets for display
          const totalAssignedSetTarget = clients.reduce((sum, client) => 
            sum + (client.assignments || []).reduce((acc, assignment) => acc + (assignment.monthly_set_target || 0), 0), 0
          );
          const totalAssignedHeldTarget = clients.reduce((sum, client) => 
            sum + (client.assignments || []).reduce((acc, assignment) => acc + (assignment.monthly_hold_target || 0), 0), 0
          );

          // Debug logging
          // Debug logs removed for cleaner console output

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Client Targets */}
              <div className={`p-4 rounded-lg border ${darkTheme ? 'bg-[#232529] border-[#2d3139]' : 'bg-white border-gray-200'}`}>
                <h4 className={`text-sm font-medium mb-2 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Total Client Targets</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>Set Target:</span>
                    <span className={`font-semibold ${darkTheme ? 'text-blue-400' : 'text-blue-600'}`}>{totalClientSetTarget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>Hold Target:</span>
                    <span className={`font-semibold ${darkTheme ? 'text-green-400' : 'text-green-600'}`}>{totalClientHeldTarget}</span>
                  </div>
                </div>
              </div>

              {/* Assigned Targets */}
              <div className={`p-4 rounded-lg border ${darkTheme ? 'bg-[#232529] border-[#2d3139]' : 'bg-white border-gray-200'}`}>
                <h4 className={`text-sm font-medium mb-2 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Assigned to SDRs</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>Set Target:</span>
                    <span className={`font-semibold ${darkTheme ? 'text-blue-400' : 'text-blue-600'}`}>{totalAssignedSetTarget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>Hold Target:</span>
                    <span className={`font-semibold ${darkTheme ? 'text-green-400' : 'text-green-600'}`}>{totalAssignedHeldTarget}</span>
                  </div>
                </div>
              </div>

              {/* Unassigned Targets */}
              <div 
                className={`p-4 rounded-lg border ${darkTheme ? 'bg-[#232529] border-[#2d3139]' : 'bg-white border-gray-200'} ${(unassignedSetTarget > 0 || unassignedHeldTarget > 0) ? darkTheme ? 'cursor-pointer hover:bg-[#2d3139] hover:border-orange-800/50 transition-colors' : 'cursor-pointer hover:bg-gray-50 hover:border-orange-300 transition-colors' : ''}`}
                onClick={(unassignedSetTarget > 0 || unassignedHeldTarget > 0) ? handleUnassignedClick : undefined}
                title={(unassignedSetTarget > 0 || unassignedHeldTarget > 0) ? 'Click to view unassigned clients' : 'No unassigned targets'}
              >
                <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>
                  Unassigned
                  {(unassignedSetTarget > 0 || unassignedHeldTarget > 0) && (
                    <span className={`text-xs ${darkTheme ? 'text-orange-400' : 'text-orange-600'}`}></span>
                  )}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>Set Target:</span>
                    <span className={`font-semibold ${unassignedSetTarget > 0 ? (darkTheme ? 'text-orange-400' : 'text-orange-600') : (darkTheme ? 'text-slate-400' : 'text-gray-500')}`}>
                      {unassignedSetTarget}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>Hold Target:</span>
                    <span className={`font-semibold ${unassignedHeldTarget > 0 ? (darkTheme ? 'text-orange-400' : 'text-orange-600') : (darkTheme ? 'text-slate-400' : 'text-gray-500')}`}>
                      {unassignedHeldTarget}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

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
                  className={`border rounded-xl shadow-lg p-6 space-y-6 hover:shadow-xl transition-all duration-200 ${darkTheme ? 'bg-[#232529] border-[#2d3139] hover:border-[#3a3f47]' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-4 ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>{client.name}</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Target className={`w-4 h-4 ${darkTheme ? 'text-slate-500' : 'text-gray-400'}`} />
                          <span className={`text-sm ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>Monthly Targets:</span>
                          {clientEditMode === client.id ? (
                            <>
                              <div className="flex flex-col">
                                <label className={`text-xs ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Set</label>
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
                                  className={`w-20 px-2 py-1 border border-indigo-500 rounded-md ${darkTheme ? 'bg-[#1d1f24] text-slate-100' : ''}`}
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className={`text-xs ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Hold</label>
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
                                  className={`w-20 px-2 py-1 border border-indigo-500 rounded-md ${darkTheme ? 'bg-[#1d1f24] text-slate-100' : ''}`}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex flex-col">
                                <span className={`text-sm ${darkTheme ? 'text-slate-200' : 'text-gray-900'}`}>Set: {client.monthly_set_target}</span>
                                <span className={`text-sm ${darkTheme ? 'text-slate-200' : 'text-gray-900'}`}>Hold: {client.monthly_hold_target}</span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className={`w-4 h-4 ${darkTheme ? 'text-slate-500' : 'text-gray-400'}`} />
                          <span className={`text-sm ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>
                            {client.assignments.length} SDR{client.assignments.length !== 1 ? 's' : ''} assigned
                          </span>
                          <span className={`text-sm font-medium ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>
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
                            ? darkTheme ? 'bg-[#2d3139] text-slate-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : darkTheme ? 'text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50 focus:ring-indigo-500 border border-indigo-800/50' : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:ring-indigo-500 border border-indigo-200'
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
                            ? darkTheme ? 'bg-[#2d3139] text-slate-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : darkTheme ? 'text-blue-300 bg-blue-900/30 hover:bg-blue-900/50 focus:ring-blue-500 border border-blue-800/50' : 'text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500 border border-blue-200'
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
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded hover:bg-gray-200 ${darkTheme ? 'text-slate-300 bg-[#2d3139] hover:bg-[#353941]' : 'text-gray-600 bg-gray-100'}`}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                    
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${darkTheme ? 'text-red-300 bg-red-900/30 hover:bg-red-900/50' : 'text-red-700 bg-red-50 hover:bg-red-100'}`}
                      title={`Remove from ${monthOptions.find(m => m.value === selectedMonth)?.label}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>

                {/* Assignments */}
                {client.assignments.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    <h4 className={`text-sm font-semibold mb-3 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>SDR Assignments</h4>
                    {client.assignments.map((assignment, index) => {
                      const sdr = sdrs.find((s) => s.id === assignment.sdr_id);
                      const assignmentSetPercentage = client.monthly_set_target > 0
                        ? (assignment.monthly_set_target / client.monthly_set_target) * 100
                        : 0;
                      const assignmentHoldPercentage = client.monthly_hold_target > 0
                        ? (assignment.monthly_hold_target / client.monthly_hold_target) * 100
                        : 0;

                      // Color scheme for SDR cards - 10 unique colors
                      const colorSchemes = darkTheme ? [
                        { bg: 'bg-blue-900/20', border: 'border-blue-800/50', text: 'text-blue-300', icon: 'text-blue-400' },
                        { bg: 'bg-green-900/20', border: 'border-green-800/50', text: 'text-green-300', icon: 'text-green-400' },
                        { bg: 'bg-purple-900/20', border: 'border-purple-800/50', text: 'text-purple-300', icon: 'text-purple-400' },
                        { bg: 'bg-orange-900/20', border: 'border-orange-800/50', text: 'text-orange-300', icon: 'text-orange-400' },
                        { bg: 'bg-pink-900/20', border: 'border-pink-800/50', text: 'text-pink-300', icon: 'text-pink-400' },
                        { bg: 'bg-teal-900/20', border: 'border-teal-800/50', text: 'text-teal-300', icon: 'text-teal-400' },
                        { bg: 'bg-indigo-900/20', border: 'border-indigo-800/50', text: 'text-indigo-300', icon: 'text-indigo-400' },
                        { bg: 'bg-yellow-900/20', border: 'border-yellow-800/50', text: 'text-yellow-300', icon: 'text-yellow-400' },
                        { bg: 'bg-red-900/20', border: 'border-red-800/50', text: 'text-red-300', icon: 'text-red-400' },
                        { bg: 'bg-cyan-900/20', border: 'border-cyan-800/50', text: 'text-cyan-300', icon: 'text-cyan-400' }
                      ] : [
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
                                      className={`w-16 px-2 py-1 text-center border border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] text-slate-100' : ''}`}
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
                                      className={`w-16 px-2 py-1 text-center border border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] text-slate-100' : ''}`}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <div className="flex gap-4">
                                      <div className="text-center">
                                        <span className={`text-lg font-bold ${colorScheme.text}`}>
                                          {assignment.monthly_set_target}
                                        </span>
                                        <div className={`text-xs ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Set Target</div>
                                      </div>
                                      <div className="text-center">
                                        <span className={`text-lg font-bold ${colorScheme.text}`}>
                                          {assignment.monthly_hold_target}
                                        </span>
                                        <div className={`text-xs ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Held Target</div>
                                      </div>
                                    </div>
                                    <div className={`text-xs mt-1 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
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
                    <div className={`flex items-center gap-2 text-sm italic p-4 rounded-md border border-dashed ${darkTheme ? 'text-slate-400 bg-[#1d1f24] border-[#2d3139]' : 'text-gray-400 bg-gray-50 border-gray-200'}`}>
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
          <div className={`rounded-lg shadow-xl p-6 w-full max-w-md ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>Add New Client</h2>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label
                  htmlFor="clientName"
                  className={`block text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}
                >
                  Client Name
                </label>
                <input
                  type="text"
                  id="clientName"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  required
                  className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label
                  htmlFor="clientSetTarget"
                  className={`block text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}
                >
                  Monthly Set Target
                </label>
                <input
                  type="number"
                  id="clientSetTarget"
                  min="0"
                  value={newClientSetTarget}
                  onChange={(e) => setNewClientSetTarget(e.target.value === '' ? '' : parseInt(e.target.value))}
                  required
                  className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label
                  htmlFor="clientHoldTarget"
                  className={`block text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}
                >
                  Monthly Held Target
                </label>
                <input
                  type="number"
                  id="clientHoldTarget"
                  min="0"
                  value={newClientHoldTarget}
                  onChange={(e) => setNewClientHoldTarget(e.target.value === '' ? '' : parseInt(e.target.value))}
                  required
                  className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${darkTheme ? 'text-slate-200 bg-[#2d3139] hover:bg-[#353941]' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
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
          <div className={`rounded-lg shadow-xl p-6 w-full max-w-md ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>Assign Client to SDR</h2>
            <form onSubmit={handleAssignClient} className="space-y-4">
              <div>
                <label
                  htmlFor="client"
                  className={`block text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}
                >
                  Select Client
                </label>
                <select
                  id="client"
                  value={selectedClient || ''}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  required
                  className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                >
                  <option value="">Select a client</option>
                  {allClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="sdr"
                  className={`block text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}
                >
                  Select SDR
                </label>
                <select
                  id="sdr"
                  value={selectedSDR || ''}
                  onChange={(e) => setSelectedSDR(e.target.value)}
                  required
                  className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                >
                  <option value="">Select an SDR</option>
                  {sdrs.filter(sdr => sdr.active !== false).map((sdr) => (
                    <option key={sdr.id} value={sdr.id}>
                      {sdr.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SDR Summary Section */}
              {selectedSDR && (
                <div className={`rounded-lg p-4 border ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139]' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className={`text-sm font-semibold mb-3 ${darkTheme ? 'text-slate-200' : 'text-gray-800'}`}>
                    SDR Total Goals for {monthOptions.find(m => m.value === selectedMonth)?.label}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className={`font-medium ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>SDR Total Set Goal:</div>
                      <div className={`text-lg font-bold ${darkTheme ? 'text-orange-400' : 'text-orange-600'}`}>
                        {(() => {
                          // Calculate total set target across all SDR's client assignments for this month
                          const sdrAssignments = clients.filter(client => 
                            client.assignments.some(assignment => assignment.sdr_id === selectedSDR)
                          );
                          return sdrAssignments.reduce((total, client) => {
                            const assignment = client.assignments.find(a => a.sdr_id === selectedSDR);
                            return total + (assignment?.monthly_set_target || 0);
                          }, 0);
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className={`font-medium ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>SDR Total Held Goal:</div>
                      <div className={`text-lg font-bold ${darkTheme ? 'text-purple-400' : 'text-purple-600'}`}>
                        {(() => {
                          // Calculate total held target across all SDR's client assignments for this month
                          const sdrAssignments = clients.filter(client => 
                            client.assignments.some(assignment => assignment.sdr_id === selectedSDR)
                          );
                          return sdrAssignments.reduce((total, client) => {
                            const assignment = client.assignments.find(a => a.sdr_id === selectedSDR);
                            return total + (assignment?.monthly_hold_target || 0);
                          }, 0);
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label
                  htmlFor="holdTarget"
                  className={`block text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}
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
                  className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label
                  htmlFor="setTarget"
                  className={`block text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}
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
                  className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
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
                  className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${darkTheme ? 'text-slate-200 bg-[#2d3139] hover:bg-[#353941]' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
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

      {/* Unassigned Clients Modal */}
      {showUnassignedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                Unassigned Clients - {monthOptions.find(m => m.value === selectedMonth)?.label}
              </h2>
              <button
                onClick={() => setShowUnassignedModal(false)}
                className={darkTheme ? 'text-slate-400 hover:text-slate-200 transition-colors' : 'text-gray-400 hover:text-gray-600 transition-colors'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh]">
              {unassignedClients.length === 0 ? (
                <div className={`text-center py-8 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                  <Target className={`w-12 h-12 mx-auto mb-4 ${darkTheme ? 'text-slate-600' : 'text-gray-300'}`} />
                  <p>No unassigned clients found for this month.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unassignedClients.map((client) => {
                    const totalAssignedSetTarget = client.assignments.reduce((sum, assignment) => sum + (assignment.monthly_set_target || 0), 0);
                    const totalAssignedHoldTarget = client.assignments.reduce((sum, assignment) => sum + (assignment.monthly_hold_target || 0), 0);
                    
                    const unassignedSetTarget = client.monthly_set_target - totalAssignedSetTarget;
                    const unassignedHoldTarget = client.monthly_hold_target - totalAssignedHoldTarget;
                    
                    return (
                      <div key={client.id} className={`rounded-lg p-4 border ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139]' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className={`text-lg font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>{client.name}</h3>
                          <button
                            onClick={() => {
                              setSelectedClient(client.id);
                              setShowAssignForm(true);
                              setShowUnassignedModal(false);
                            }}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${darkTheme ? 'text-blue-300 bg-blue-900/30 border-blue-800/50 hover:bg-blue-900/50' : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'}`}
                          >
                            <Users className="w-4 h-4" />
                            Assign SDR
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className={`text-sm font-medium mb-2 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Set Targets</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className={darkTheme ? 'text-slate-300' : 'text-gray-600'}>Total Target:</span>
                                <span className={`font-medium ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>{client.monthly_set_target}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className={darkTheme ? 'text-slate-300' : 'text-gray-600'}>Assigned:</span>
                                <span className={`font-medium ${darkTheme ? 'text-green-400' : 'text-green-600'}`}>{totalAssignedSetTarget}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className={darkTheme ? 'text-slate-300' : 'text-gray-600'}>Unassigned:</span>
                                <span className={`font-medium ${darkTheme ? 'text-orange-400' : 'text-orange-600'}`}>{unassignedSetTarget}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className={`text-sm font-medium mb-2 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Hold Targets</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className={darkTheme ? 'text-slate-300' : 'text-gray-600'}>Total Target:</span>
                                <span className={`font-medium ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>{client.monthly_hold_target}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className={darkTheme ? 'text-slate-300' : 'text-gray-600'}>Assigned:</span>
                                <span className={`font-medium ${darkTheme ? 'text-green-400' : 'text-green-600'}`}>{totalAssignedHoldTarget}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className={darkTheme ? 'text-slate-300' : 'text-gray-600'}>Unassigned:</span>
                                <span className={`font-medium ${darkTheme ? 'text-orange-400' : 'text-orange-600'}`}>{unassignedHoldTarget}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {client.assignments.length > 0 && (
                          <div className={`mt-3 pt-3 border-t ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
                            <h4 className={`text-sm font-medium mb-2 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Current Assignments</h4>
                            <div className="space-y-1">
                              {client.assignments.map((assignment) => {
                                const sdr = sdrs.find(s => s.id === assignment.sdr_id);
                                return (
                                  <div key={assignment.id} className="flex justify-between text-sm">
                                    <span className={darkTheme ? 'text-slate-300' : 'text-gray-600'}>{sdr?.full_name || 'Unknown SDR'}:</span>
                                    <span className={`font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-900'}`}>
                                      Set: {assignment.monthly_set_target}, Hold: {assignment.monthly_hold_target}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowUnassignedModal(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${darkTheme ? 'text-slate-200 bg-[#2d3139] hover:bg-[#353941]' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

