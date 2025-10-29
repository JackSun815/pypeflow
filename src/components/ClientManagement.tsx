import React, { useState, useEffect } from 'react';
import { format, subMonths } from 'date-fns';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import {Plus, Trash2, AlertCircle, Users, Target, Edit } from 'lucide-react';
import type { Client, Profile, Meeting } from '../types/database';
import { useAgency } from '../contexts/AgencyContext';

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

// Add interface for meeting metrics
interface MeetingMetrics {
  setCount: number;
  heldCount: number;
}

export default function ClientManagement({ sdrs, onUpdate }: ClientManagementProps) {
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
    action: 'remove_client' | 'add_client' | 'assign_client' | 'update_target' | 'copy_month';
    data: any;
    timestamp: number;
  }>>([]);
  const [canUndo, setCanUndo] = useState(false);

  // Unassigned clients modal state
  const [showUnassignedModal, setShowUnassignedModal] = useState(false);
  const [unassignedClients, setUnassignedClients] = useState<ClientWithAssignments[]>([]);

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

      console.log('🔍 Fetched assignments for month', selectedMonth, ':', assignmentsData);
      console.log('🔍 All clients data:', clientsData);

      // Only show clients that either:
      // 1. Have assignments in the current month, OR
      // 2. Were created in the current month (for newly added clients)
      // BUT exclude clients that have been explicitly hidden (marked with sdr_id: null and negative targets)
      // AND exclude inactive assignments (soft deleted)
      const processedClients = (clientsData || [])
        .map((client: any) => ({
          ...client,
          assignments: (assignmentsData || []).filter((a: any) => 
            a.client_id === client.id && 
            !(a.sdr_id === null && a.monthly_set_target === -1) && // Exclude hidden markers
            a.is_active !== false // Exclude inactive assignments
          )
        }))
        .filter((client: any) => {
          // Check if client has a hidden marker for this month
          const hasHiddenMarker = (assignmentsData || []).some((a: any) => 
            a.client_id === client.id && 
            a.sdr_id === null && 
            a.monthly_set_target === -1
          );
          
          if (hasHiddenMarker) {
            console.log(`🔍 Client "${client.name}" excluded: has hidden marker`);
            return false; // Exclude clients with hidden markers
          }
          
          // Check if client has assignments in this month
          const hasAssignments = (assignmentsData || []).some((a: any) => 
            a.client_id === client.id && 
            a.sdr_id !== null && 
            a.monthly_set_target !== -1 &&
            a.is_active !== false
          );
          
          // Check if the selected month is on or after the client's creation month
          // This allows newly added clients to appear only in the month they were created and future months
          const clientCreatedDate = new Date(client.created_at);
          const clientCreatedMonth = format(clientCreatedDate, 'yyyy-MM');
          
          // Show client if the selected month is the same as or after the month it was created
          const isSelectedMonthAfterCreation = selectedMonth >= clientCreatedMonth;
          
          console.log(`🔍 Client "${client.name}":`, {
            hasAssignments,
            isSelectedMonthAfterCreation,
            clientCreatedDate: clientCreatedDate.toISOString(),
            clientCreatedMonth,
            selectedMonth,
            assignments: client.assignments
          });
          
          // Show client if it has assignments OR the selected month is on/after its creation month
          // This allows newly added clients to appear in the month they were added and future months only
          const shouldShow = hasAssignments || isSelectedMonthAfterCreation;
          if (!shouldShow) {
            console.log(`🔍 Client "${client.name}" excluded: no assignments and not created this month`);
          }
          return shouldShow;
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
      setError(null);
      
      const { error: updateError } = await supabase
        .from('clients')
        .update({ 
          monthly_set_target: newSetTarget,
          monthly_hold_target: newHoldTarget
        })
        .eq('id', String(clientId));

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

  // Check for duplicate assignment
  const existingAssignment = clients.find(client => 
    client.id === selectedClient && 
    client.assignments.some(assignment => assignment.sdr_id === selectedSDR)
  );

  if (existingAssignment) {
    setError('This SDR is already assigned to this client for the selected month');
    return;
  }

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
      monthlyHoldTarget
    });

    const { data: existingAssignment, error: checkError } = await supabase
      .from('assignments')
      .select('*')
      .eq('client_id', String(selectedClient))
      .eq('sdr_id', String(selectedSDR))
      .eq('month', String(currentMonth))
      .maybeSingle();

    if (checkError) throw checkError;

    console.log('🔍 Existing assignment check:', existingAssignment);

    if (existingAssignment) {
      const { error: updateError } = await supabase
        .from('assignments')
        .update({
          monthly_set_target: monthlySetTarget,
          monthly_hold_target: monthlyHoldTarget,
          month: String(currentMonth),
        })
        .eq('id', String(existingAssignment.id))
        .eq('month', String(currentMonth));

      if (updateError) throw updateError;
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
        }])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw insertError;
      }

      console.log('✅ Assignment created successfully:', insertedAssignment);

      // Add to undo stack for new assignments
      addToUndoStack('assign_client', {
        assignmentId: insertedAssignment.id,
        clientId: String(selectedClient),
        sdrId: String(selectedSDR)
      });
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
      
      // Fetch all clients and their assignments for the selected month
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .is('archived_at', null);

      if (clientsError) throw clientsError;

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('month', selectedMonth);

      if (assignmentsError) throw assignmentsError;

      // Prepare data for export
      const exportData = [];
      
      for (const client of clientsData || []) {
        const clientAssignments = (assignmentsData || []).filter(a => 
          a.client_id === client.id && 
          !(a.sdr_id === null && a.monthly_set_target === -1) && // Exclude exclusion markers
          a.is_active !== false // Exclude inactive assignments
        );

        if (clientAssignments.length > 0) {
          // Client has assignments
          for (const assignment of clientAssignments) {
            const sdr = sdrs.find(s => s.id === assignment.sdr_id);
            exportData.push({
              'Client Name': client.name,
              'SDR Name': sdr?.full_name || 'Unknown SDR',
              'Month': selectedMonth,
              'Monthly Set Target': assignment.monthly_set_target,
              'Monthly Hold Target': assignment.monthly_hold_target,
              'Client Monthly Set Target': client.monthly_set_target,
              'Client Monthly Hold Target': client.monthly_hold_target,
              'Client Created': new Date(client.created_at).toLocaleDateString(),
              'Client Updated': new Date(client.updated_at).toLocaleDateString()
            });
          }
        } else {
          // Client has no assignments for this month
          exportData.push({
            'Client Name': client.name,
            'SDR Name': 'No SDR Assigned',
            'Month': selectedMonth,
            'Monthly Set Target': 0,
            'Monthly Hold Target': 0,
            'Client Monthly Set Target': client.monthly_set_target,
            'Client Monthly Hold Target': client.monthly_hold_target,
            'Client Created': new Date(client.created_at).toLocaleDateString(),
            'Client Updated': new Date(client.updated_at).toLocaleDateString()
          });
        }
      }

      // Convert to CSV and download
      const headers = Object.keys(exportData[0] || {});
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
      link.setAttribute('download', `client_assignments_${selectedMonth}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(`Successfully exported ${exportData.length} records to CSV file`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setLoading(false);
    }
  }

  async function copyFromPreviousMonth() {
    try {
      setLoading(true);
      setError(null);
      
      // Check if agency is available
      if (!agency?.id) {
        setError('Agency information not available. Please refresh the page and try again.');
        return;
      }
      
      // Get the previous month (the month before the currently selected month)
      const currentMonthIndex = monthOptions.findIndex(m => m.value === selectedMonth);
      const previousMonth = monthOptions[currentMonthIndex + 1]?.value;
      
      if (!previousMonth) {
        setError('No previous month available to copy from');
        return;
      }

      // Fetch all clients and assignments from the previous month
      const { data: previousClients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('agency_id', agency.id)
        .is('archived_at', null);

      if (clientsError) throw clientsError;

      const { data: previousAssignments, error: fetchError } = await supabase
        .from('assignments')
        .select('*')
        .eq('agency_id', agency.id)
        .eq('month', previousMonth);

      if (fetchError) throw fetchError;

      // Use the same logic as fetchClients to determine which clients were visible in the previous month
      const visibleClientsInPreviousMonth = (previousClients || [])
        .map((client: any) => ({
          ...client,
          assignments: (previousAssignments || []).filter((a: any) => 
            a.client_id === client.id && 
            !(a.sdr_id === null && a.monthly_set_target === -1) && // Exclude hidden markers
            a.is_active !== false // Exclude inactive assignments
          )
        }))
        .filter((client: any) => {
          // Check if client has a hidden marker for the previous month
          const hasHiddenMarker = (previousAssignments || []).some((a: any) => 
            a.client_id === client.id && 
            a.sdr_id === null && 
            a.monthly_set_target === -1
          );
          return !hasHiddenMarker; // Only include clients that were NOT hidden
        });

      // Get all valid assignments for clients that were visible in the previous month
      const finalValidAssignments = visibleClientsInPreviousMonth
        .flatMap(client => client.assignments)
        .filter(assignment => assignment.sdr_id !== null); // Ensure we only get real assignments, not hidden markers

      if (fetchError) throw fetchError;

      if (!finalValidAssignments || finalValidAssignments.length === 0) {
        setError(`No valid assignments found in ${monthOptions.find(m => m.value === previousMonth)?.label} to copy`);
        return;
      }

      // Get existing assignments for the current month (for undo)
      const { data: existingAssignments, error: fetchExistingError } = await supabase
        .from('assignments')
        .select('*')
        .eq('agency_id', agency.id)
        .eq('month', selectedMonth);

      if (fetchExistingError) throw fetchExistingError;

      // Delete any existing assignments for the current month
      const { error: deleteError } = await supabase
        .from('assignments')
        .delete()
        .eq('agency_id', agency.id)
        .eq('month', selectedMonth);

      if (deleteError) throw deleteError;

      // Add to undo stack before making changes
      addToUndoStack('copy_month', {
        deletedAssignments: existingAssignments || []
      });

      // Copy assignments from previous month to current month
      const newAssignments = finalValidAssignments.map(assignment => ({
        client_id: assignment.client_id,
        sdr_id: assignment.sdr_id,
        monthly_set_target: assignment.monthly_set_target,
        monthly_hold_target: assignment.monthly_hold_target,
        month: selectedMonth,
        is_active: assignment.is_active !== false, // Ensure is_active is properly set
        agency_id: agency?.id, // Add agency_id from context
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      console.log('Copying assignments:', newAssignments);
      console.log('Number of assignments to insert:', newAssignments.length);

      // Validate the data before inserting
      const validAssignments = newAssignments.filter(assignment => {
        const isValid = assignment.client_id && 
                       assignment.sdr_id && 
                       assignment.month && 
                       typeof assignment.monthly_set_target === 'number' && 
                       typeof assignment.monthly_hold_target === 'number';
        
        if (!isValid) {
          console.warn('Invalid assignment found:', assignment);
        }
        return isValid;
      });

      if (validAssignments.length !== newAssignments.length) {
        console.warn(`Filtered out ${newAssignments.length - validAssignments.length} invalid assignments`);
      }

      if (validAssignments.length === 0) {
        setError('No valid assignments to copy after validation');
        return;
      }

      const { error: insertError } = await supabase
        .from('assignments')
        .insert(validAssignments);

      if (insertError) {
        console.error('Insert error details:', insertError);
        console.error('Data being inserted:', newAssignments);
        throw insertError;
      }

      setSuccess(`Successfully copied ${validAssignments.length} client assignments from ${monthOptions.find(m => m.value === previousMonth)?.label} to ${monthOptions.find(m => m.value === selectedMonth)?.label}`);
      
      // Refresh the client list
      await fetchClients();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy from previous month');
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
  function addToUndoStack(action: 'remove_client' | 'add_client' | 'assign_client' | 'update_target' | 'copy_month', data: any) {
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
        case 'copy_month':
          await undoCopyMonth(lastAction.data);
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

  async function undoCopyMonth(data: { deletedAssignments: any[] }) {
    // Restore deleted assignments
    if (data.deletedAssignments.length > 0) {
      const { error } = await supabase
        .from('assignments')
        .upsert(data.deletedAssignments);

      if (error) throw error;
    }
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Manage Clients</h2>
            {/* Month-specific client management - no archived toggle needed */}
          </div>
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
              {selectedMonth === currentMonth && (
                <span className="text-xs text-gray-500">(Current)</span>
              )}
            </div>

            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border ${
                canUndo 
                  ? 'text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200' 
                  : 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
              }`}
              title={canUndo ? `Undo last action (${undoStack.length} actions available)` : 'No actions to undo'}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Undo
            </button>
            <button
              onClick={async () => {
                if (confirm(`Migrate all clients and assignments from ${monthOptions.find(m => m.value === selectedMonth) === monthOptions[1] ? monthOptions[2]?.label : monthOptions[1]?.label} to ${monthOptions.find(m => m.value === selectedMonth)?.label}?\n\nThis will:\n• Migrate all client assignments\n• Migrate all target values\n• Overwrite any existing assignments for ${monthOptions.find(m => m.value === selectedMonth)?.label}`)) {
                  await copyFromPreviousMonth();
                }
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 border border-green-200"
              title="Migrate all clients and assignments from previous month"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Migrate
            </button>
            <button
              onClick={() => {
                if (confirm('Export client assignments to CSV?')) {
                  exportToExcel();
                }
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 border border-blue-200"
              title="Export all clients and assignments to Excel"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
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
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
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
          console.log('🔍 Target Overview Debug for', selectedMonth);
          console.log('📊 Unassigned clients:', unassignedClients.length);
          console.log('📊 Total client set target:', totalClientSetTarget);
          console.log('📊 Total client held target:', totalClientHeldTarget);
          console.log('📊 Total assigned set target:', totalAssignedSetTarget);
          console.log('📊 Total assigned held target:', totalAssignedHeldTarget);
          console.log('📊 Unassigned set target (sum of individual):', unassignedSetTarget);
          console.log('📊 Unassigned held target (sum of individual):', unassignedHeldTarget);

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Client Targets */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Total Client Targets</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Set Target:</span>
                    <span className="font-semibold text-blue-600">{totalClientSetTarget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hold Target:</span>
                    <span className="font-semibold text-green-600">{totalClientHeldTarget}</span>
                  </div>
                </div>
              </div>

              {/* Assigned Targets */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned to SDRs</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Set Target:</span>
                    <span className="font-semibold text-blue-600">{totalAssignedSetTarget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hold Target:</span>
                    <span className="font-semibold text-green-600">{totalAssignedHeldTarget}</span>
                  </div>
                </div>
              </div>

              {/* Unassigned Targets */}
              <div 
                className={`bg-white p-4 rounded-lg border border-gray-200 ${(unassignedSetTarget > 0 || unassignedHeldTarget > 0) ? 'cursor-pointer hover:bg-gray-50 hover:border-orange-300 transition-colors' : ''}`}
                onClick={(unassignedSetTarget > 0 || unassignedHeldTarget > 0) ? handleUnassignedClick : undefined}
                title={(unassignedSetTarget > 0 || unassignedHeldTarget > 0) ? 'Click to view unassigned clients' : 'No unassigned targets'}
              >
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Unassigned
                  {(unassignedSetTarget > 0 || unassignedHeldTarget > 0) && (
                    <span className="text-xs text-orange-600"></span>
                  )}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Set Target:</span>
                    <span className={`font-semibold ${unassignedSetTarget > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                      {unassignedSetTarget}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hold Target:</span>
                    <span className={`font-semibold ${unassignedHeldTarget > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
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
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
                  onChange={(e) => setNewClientSetTarget(e.target.value === '' ? '' : parseInt(e.target.value))}
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
                  onChange={(e) => setNewClientHoldTarget(e.target.value === '' ? '' : parseInt(e.target.value))}
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
                  htmlFor="client"
                  className="block text-sm font-medium text-gray-700"
                >
                  Select Client
                </label>
                <select
                  id="client"
                  value={selectedClient || ''}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

              {/* SDR Summary Section */}
              {selectedSDR && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    SDR Total Goals for {monthOptions.find(m => m.value === selectedMonth)?.label}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 font-medium">SDR Total Set Goal:</div>
                      <div className="text-lg font-bold text-orange-600">
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
                      <div className="text-gray-600 font-medium">SDR Total Held Goal:</div>
                      <div className="text-lg font-bold text-purple-600">
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

      {/* Unassigned Clients Modal */}
      {showUnassignedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Unassigned Clients - {monthOptions.find(m => m.value === selectedMonth)?.label}
              </h2>
              <button
                onClick={() => setShowUnassignedModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh]">
              {unassignedClients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
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
                      <div key={client.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                          <button
                            onClick={() => {
                              setSelectedClient(client.id);
                              setShowAssignForm(true);
                              setShowUnassignedModal(false);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            <Users className="w-4 h-4" />
                            Assign SDR
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Set Targets</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Target:</span>
                                <span className="font-medium">{client.monthly_set_target}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Assigned:</span>
                                <span className="font-medium text-green-600">{totalAssignedSetTarget}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Unassigned:</span>
                                <span className="font-medium text-orange-600">{unassignedSetTarget}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Hold Targets</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Target:</span>
                                <span className="font-medium">{client.monthly_hold_target}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Assigned:</span>
                                <span className="font-medium text-green-600">{totalAssignedHoldTarget}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Unassigned:</span>
                                <span className="font-medium text-orange-600">{unassignedHoldTarget}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {client.assignments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Assignments</h4>
                            <div className="space-y-1">
                              {client.assignments.map((assignment) => {
                                const sdr = sdrs.find(s => s.id === assignment.sdr_id);
                                return (
                                  <div key={assignment.id} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{sdr?.full_name || 'Unknown SDR'}:</span>
                                    <span className="font-medium">
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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

