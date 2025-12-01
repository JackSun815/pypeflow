import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAgency } from '../contexts/AgencyContext';
import { Mail, AlertCircle, Check, Link, UserPlus, Key, Building, Users, Shield, UserX, UserCheck, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import CompensationManagement from './CompensationManagement';


interface ClientToken {
  id: string;
  client_id: string;
  token: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  client_name: string;
}

interface ClientWithTargets {
  id: string;
  name: string;
  monthly_target: number;
  monthly_set_target: number;
  monthly_hold_target: number;
  cumulative_set_target: number;
  cumulative_hold_target: number;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface SDRProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface UnifiedUserManagementProps {
  sdrs: SDRProfile[];
  clients: ClientWithTargets[];
  onUpdate: () => void;
  darkTheme?: boolean;
}

export default function UnifiedUserManagement({ sdrs, clients, onUpdate, darkTheme = false }: UnifiedUserManagementProps) {
  const { agency } = useAgency();
  const [activeTab, setActiveTab] = useState<'managers' | 'sdrs' | 'clients'>('managers');
  
  // Manager state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingManager, setEditingManager] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [managers, setManagers] = useState<any[]>([]);

  // SDR state
  const [sdrEmail, setSdrEmail] = useState('');
  const [sdrFullName, setSdrFullName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSDR, setSelectedSDR] = useState<string | null>(null);

  // Client state
  const [clientTokens, setClientTokens] = useState<ClientToken[]>([]);

  // Load managers and client tokens when agency changes
  useEffect(() => {
    if (agency) {
      fetchManagers();
      fetchClientTokens();
    }
  }, [agency, clients]);

  async function fetchManagers() {
    try {
      if (!agency) return;

      const { data: managers, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, active, created_at')
        .eq('agency_id', agency.id as any)
        .eq('role', 'manager' as any)
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;

      setManagers(managers || []);
    } catch (err) {
      console.error('Error fetching managers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch managers');
      setManagers([]);
    }
  }

  async function fetchClientTokens() {
    try {
      // Generate tokens for all clients (similar to SDRs)
      const tokensWithClientName = clients.map((client) => ({
        id: client.id,
        client_id: client.id,
        token: generateClientAccessToken(client.id),
        is_active: true,
        created_at: new Date().toISOString(),
        expires_at: null,
        last_used_at: null,
        client_name: client.name
      }));

      setClientTokens(tokensWithClientName);
    } catch (err) {
      console.error('Error generating client tokens:', err);
      setClientTokens([]);
    }
  }

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  function generateAccessToken(sdrId: string): string {
    const tokenData = {
      id: sdrId,
      timestamp: Date.now(),
      type: 'sdr_access',
      exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days expiration
    };
    return btoa(JSON.stringify(tokenData));
  }

  function generateClientAccessToken(clientId: string): string {
    const tokenData = {
      id: clientId,
      timestamp: Date.now(),
      type: 'client_access',
      exp: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year expiration
    };
    return btoa(JSON.stringify(tokenData));
  }

  function getDashboardUrl(sdrId: string): string {
    const token = generateAccessToken(sdrId);
    return `${window.location.origin}/dashboard/sdr/${token}`;
  }

  function getClientDashboardUrl(token: string): string {
    return `${window.location.origin}/dashboard/client/${token}`;
  }

  // Manager functions
  async function handleAddManager(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!agency) {
        throw new Error('Agency context is required to create managers');
      }

      if (!email || !fullName || !password) {
        throw new Error('All fields are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Check if manager already exists
      if (managers.some(m => m.email === email)) {
        throw new Error('A manager with this email already exists');
      }

      // Create manager profile in database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: email.trim(),
          full_name: fullName.trim(),
          role: 'manager' as any,
          active: true,
          agency_id: agency.id as any,
          created_at: new Date().toISOString()
        } as any)
        .select()
        .single() as any;

      if (profileError) {
        if (profileError.code === '23505') {
          throw new Error('A user with this email already exists');
        } else {
          throw profileError;
        }
      }

      // Store user credentials in localStorage for login simulation
      const agencyCredentials = localStorage.getItem('agencyCredentials');
      const credentials = agencyCredentials ? JSON.parse(agencyCredentials) : {};
      
      credentials[email] = {
        email: email.trim(),
        password: password,
        full_name: fullName.trim(),
        role: 'manager',
        agency_id: agency.id,
        agency_subdomain: agency.subdomain,
        profile_id: profileData?.id
      };
      
      localStorage.setItem('agencyCredentials', JSON.stringify(credentials));

      // Refresh managers list
      await fetchManagers();

      setSuccess('Manager added successfully');
      setEmail('');
      setFullName('');
      setPassword('');
    } catch (err) {
      console.error('Add manager error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add manager');
    } finally {
      setLoading(false);
    }
  }

  function handleUpdatePassword(managerEmail: string) {
    if (!newPassword) {
      setError('New password is required');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      const updatedManagers = managers.map(manager => 
        manager.email === managerEmail 
          ? { ...manager, password: newPassword }
          : manager
      );

      localStorage.setItem('managers', JSON.stringify(updatedManagers));
      setManagers(updatedManagers);
      setEditingManager(null);
      setNewPassword('');
      setSuccess('Password updated successfully');
      setError(null);
    } catch (err) {
      console.error('Update password error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password');
    }
  }

  // SDR functions
  async function handleAddSDR(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!agency) {
        throw new Error('Agency context is required to create SDRs');
      }

      if (!isValidEmail(sdrEmail)) {
        throw new Error('Please enter a valid email address');
      }

      // Use any type to bypass strict type checking
      const { data: existingSDR, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', sdrEmail as any)
        .maybeSingle() as any;

      if (checkError) throw checkError;

      if (existingSDR) {
        if (existingSDR.active) {
          throw new Error('An SDR with this email already exists');
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            active: true,
            full_name: sdrFullName,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', existingSDR.id);

        if (updateError) throw updateError;

        setSuccess('SDR reactivated successfully');
        onUpdate();
        setSdrEmail('');
        setSdrFullName('');
        return;
      }

      const { error: createError } = await supabase
        .from('profiles')
        .insert([{
          email: sdrEmail,
          full_name: sdrFullName,
          role: 'sdr',
          active: true,
          agency_id: agency?.id
        }] as any);

      if (createError) throw createError;

      setSuccess('SDR added successfully');
      setSdrEmail('');
      setSdrFullName('');
      onUpdate();
    } catch (err) {
      console.error('Add SDR error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add SDR');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleSDRActive(sdrId: string, currentlyActive: boolean) {
    const action = currentlyActive ? 'deactivate' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} this SDR? ${currentlyActive ? 'They will no longer be able to access their dashboard.' : 'They will be able to access their dashboard again.'}`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the secure database function that bypasses RLS
      const { data, error: rpcError } = await supabase.rpc('toggle_sdr_active', {
        sdr_id: sdrId,
        new_active_status: !currentlyActive
      });

      if (rpcError) {
        console.error('RPC error details:', rpcError);
        throw new Error(`Failed to ${action} SDR: ${rpcError.message}`);
      }

      console.log('Toggle result:', data);
      setSuccess(`SDR ${action}d successfully`);
      onUpdate();
    } catch (err) {
      console.error('Toggle active error:', err);
      setError(err instanceof Error ? err.message : `Failed to ${action} SDR. Please ensure you have the necessary permissions.`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSDR(sdrId: string, sdrName: string) {
    if (!confirm(`⚠️ WARNING: Are you sure you want to permanently delete ${sdrName}?\n\nThis will DELETE ALL of their data including:\n• All meetings and booking history\n• All compensation records\n• Dashboard access\n• This action CANNOT be undone!`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Delete compensation structures first (if any)
      const { error: compensationError } = await supabase
        .from('compensation_structures')
        .delete()
        .eq('sdr_id', sdrId);

      if (compensationError) {
        console.error('Compensation deletion error:', compensationError);
        // Continue even if this fails - might not have any records
      }

      // Delete the profile (CASCADE will handle meetings and assignments)
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', sdrId);

      if (deleteError) {
        console.error('Profile deletion error:', deleteError);
        throw new Error(`Failed to delete SDR: ${deleteError.message}`);
      }

      setSuccess('SDR and all associated data permanently deleted');
      onUpdate();
    } catch (err) {
      console.error('Delete SDR error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete SDR. Please ensure you have the necessary permissions.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyUrl(sdrId: string) {
    const url = getDashboardUrl(sdrId);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(sdrId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  }

  // Client functions

  async function handleCopyClientUrl(token: string) {
    const url = getClientDashboardUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(token);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  }

  async function handleToggleClientArchive(clientId: string, currentlyArchived: boolean) {
    const action = currentlyArchived ? 'unarchive' : 'archive';
    if (!confirm(`Are you sure you want to ${action} this client?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newArchivedAt = currentlyArchived ? null : new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('clients')
        .update({ 
          archived_at: newArchivedAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (updateError) throw updateError;

      setSuccess(`Client ${action}d successfully`);
      onUpdate();
    } catch (err) {
      console.error('Toggle client archive error:', err);
      setError(err instanceof Error ? err.message : `Failed to ${action} client`);
    } finally {
      setLoading(false);
    }
  }

  const renderManagers = () => (
    <div className="space-y-6">
      <div className={`rounded-lg shadow-md overflow-hidden ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
        <div className={`p-6 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
            <Shield className="w-5 h-5" />
            Manage Managers
          </h2>
        </div>

        <form onSubmit={handleAddManager} className={`p-6 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-medium mb-4 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Add New Manager</h3>

          {error && (
            <div className={`mb-4 p-3 border rounded-md flex items-center gap-2 ${darkTheme ? 'bg-red-900/20 border-red-800/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className={`mb-4 p-3 border rounded-md ${darkTheme ? 'bg-green-900/20 border-green-800/50 text-green-300' : 'bg-green-50 border-green-200 text-green-700'}`}>
              <p className="text-sm">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className={`block text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
              />
            </div>

            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                title="Please enter a valid email address"
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add Manager
                </>
              )}
            </button>
          </div>
        </form>

        <div className="p-6">
          <h3 className={`text-sm font-medium mb-4 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Current Managers</h3>
          <div className="space-y-3">
            {managers.map((manager) => (
              <div
                key={manager.id}
                className={`flex items-center justify-between p-4 rounded-lg ${darkTheme ? 'bg-[#1d1f24]' : 'bg-gray-50'}`}
              >
                <div>
                  <p className={`text-sm font-medium ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>{manager.full_name}</p>
                  <p className={`text-xs ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>{manager.email}</p>
                  <p className={`text-xs ${darkTheme ? 'text-slate-500' : 'text-gray-400'}`}>
                    Created: {new Date(manager.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    manager.active 
                      ? darkTheme ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                      : darkTheme ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                  }`}>
                    {manager.active ? 'Active' : 'Inactive'}
                  </span>
                  {editingManager === manager.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className={`px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkTheme ? 'bg-[#232529] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                      />
                      <button
                        onClick={() => handleUpdatePassword(manager.email)}
                        className={`p-1 focus:outline-none ${darkTheme ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'}`}
                        title="Save new password"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingManager(manager.id);
                        setNewPassword('');
                        setError(null);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${darkTheme ? 'text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50' : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'}`}
                    >
                      <Key className="w-4 h-4" />
                      Edit Password
                    </button>
                  )}
                </div>
              </div>
            ))}
            {managers.length === 0 && (
              <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>No managers have been added yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSDRs = () => (
    <div className="space-y-6">
      <div className={`rounded-lg shadow-md overflow-hidden ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
        <div className={`p-6 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
            <Users className="w-5 h-5" />
            Manage SDRs
          </h2>
        </div>

        <form onSubmit={handleAddSDR} className={`p-6 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-medium mb-4 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Add New SDR</h3>

          {error && (
            <div className={`mb-4 p-3 border rounded-md flex items-center gap-2 ${darkTheme ? 'bg-red-900/20 border-red-800/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className={`mb-4 p-3 border rounded-md ${darkTheme ? 'bg-green-900/20 border-green-800/50 text-green-300' : 'bg-green-50 border-green-200 text-green-700'}`}>
              <p className="text-sm">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="sdrFullName" className={`block text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>
                Full Name
              </label>
              <input
                id="sdrFullName"
                type="text"
                required
                value={sdrFullName}
                onChange={(e) => setSdrFullName(e.target.value)}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
              />
            </div>

            <div>
              <label htmlFor="sdrEmail" className={`block text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>
                Email Address
              </label>
              <input
                id="sdrEmail"
                type="email"
                required
                value={sdrEmail}
                onChange={(e) => setSdrEmail(e.target.value)}
                pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                title="Please enter a valid email address"
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Add SDR
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {selectedSDR && (
        <CompensationManagement
          sdrId={selectedSDR}
          fullName={sdrs.find(sdr => sdr.id === selectedSDR)?.full_name || ''}
          onUpdate={onUpdate}
          onHide={() => setSelectedSDR(null)}
        />
      )}

      <div className={`rounded-lg shadow-md overflow-hidden ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
        <div className="p-6">
          <h3 className={`text-sm font-medium mb-4 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Active SDRs</h3>
          <div className="space-y-3">
            {sdrs.filter(sdr => sdr.active).map((sdr) => (
              <div
                key={sdr.id}
                className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${darkTheme ? 'bg-[#1d1f24] border-green-600' : 'bg-gray-50 border-green-500'}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>{sdr.full_name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${darkTheme ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'}`}>
                      Active
                    </span>
                  </div>
                  <p className={`text-xs ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>{sdr.email}</p>
                  <p className={`text-xs mt-1 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                    Created {sdr.created_at && new Date(sdr.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSDR(selectedSDR === sdr.id ? null : sdr.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${darkTheme ? 'text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50' : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'}`}
                  >
                    {selectedSDR === sdr.id ? 'Hide Compensation' : 'Manage Compensation'}
                  </button>
                  <button
                    onClick={() => handleCopyUrl(sdr.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${darkTheme ? 'text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50' : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'}`}
                    title="Copy dashboard URL"
                  >
                    {copiedId === sdr.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Link className="w-4 h-4" />
                        Copy URL
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleSDRActive(sdr.id, sdr.active)}
                    className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${darkTheme ? 'text-red-300 bg-red-900/30 hover:bg-red-900/50' : 'text-red-700 bg-red-50 hover:bg-red-100'}`}
                    title="Deactivate SDR"
                  >
                    <UserX className="w-4 h-4" />
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
            {sdrs.filter(sdr => sdr.active).length === 0 && (
              <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>No active SDRs</p>
            )}
          </div>
        </div>
      </div>

      {sdrs.filter(sdr => !sdr.active).length > 0 && (
        <div className={`rounded-lg shadow-md overflow-hidden ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
          <div className="p-6">
            <h3 className={`text-sm font-medium mb-4 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Inactive SDRs</h3>
            <div className="space-y-3">
              {sdrs.filter(sdr => !sdr.active).map((sdr) => (
                <div
                  key={sdr.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-l-4 opacity-75 ${darkTheme ? 'bg-[#1d1f24] border-slate-600' : 'bg-gray-100 border-gray-400'}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>{sdr.full_name}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${darkTheme ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>
                        Inactive
                      </span>
                    </div>
                    <p className={`text-xs ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>{sdr.email}</p>
                    <p className={`text-xs mt-1 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                      Created {sdr.created_at && new Date(sdr.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleSDRActive(sdr.id, sdr.active)}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${darkTheme ? 'text-green-300 bg-green-900/30 hover:bg-green-900/50' : 'text-green-700 bg-green-50 hover:bg-green-100'}`}
                      title="Reactivate SDR"
                    >
                      <UserCheck className="w-4 h-4" />
                      Reactivate
                    </button>
                    <button
                      onClick={() => handleDeleteSDR(sdr.id, sdr.full_name || 'this SDR')}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${darkTheme ? 'text-red-300 bg-red-900/30 hover:bg-red-900/50' : 'text-red-700 bg-red-50 hover:bg-red-100'}`}
                      title="Permanently delete this SDR and all their data"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete 
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {sdrs.length === 0 && (
        <div className={`rounded-lg shadow-md overflow-hidden p-6 ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
          <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>No SDRs have been added yet</p>
        </div>
      )}
    </div>
  );

  const renderClients = () => (
    <div className="space-y-6">
      <div className={`rounded-lg shadow-md overflow-hidden ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
        <div className={`p-6 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
            <Building className="w-5 h-5" />
            Client Dashboard Access
          </h2>
        </div>

        <div className="p-6">
          <h3 className={`text-sm font-medium mb-4 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Active Clients</h3>
          <div className="space-y-3">
            {clientTokens.filter(token => {
              const client = clients.find(c => c.id === token.client_id);
              return !client?.archived_at;
            }).map((token) => {
              const client = clients.find(c => c.id === token.client_id);
              return (
              <div
                key={token.id}
                className={`flex items-center justify-between p-4 rounded-lg ${darkTheme ? 'bg-[#1d1f24]' : 'bg-gray-50'}`}
              >
                <div>
                  <p className={`text-sm font-medium ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>{token.client_name}</p>
                  <p className={`text-xs ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                    Set Target: {client?.monthly_set_target || 0} | Hold Target: {client?.monthly_hold_target || 0}
                  </p>
                  <p className={`text-xs ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                    Created {new Date(token.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyClientUrl(token.token)}
                    className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${darkTheme ? 'text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50' : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'}`}
                    title="Copy dashboard URL"
                  >
                    {copiedId === token.token ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Link className="w-4 h-4" />
                        Copy URL
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleClientArchive(token.client_id, false)}
                    className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${darkTheme ? 'text-orange-300 bg-orange-900/30 hover:bg-orange-900/50' : 'text-orange-700 bg-orange-50 hover:bg-orange-100'}`}
                    title="Archive client"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                </div>
              </div>
            )})}
            {clientTokens.filter(token => {
              const client = clients.find(c => c.id === token.client_id);
              return !client?.archived_at;
            }).length === 0 && (
              <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>No active clients</p>
            )}
          </div>
        </div>
      </div>

      {clientTokens.filter(token => {
        const client = clients.find(c => c.id === token.client_id);
        return client?.archived_at;
      }).length > 0 && (
        <div className={`rounded-lg shadow-md overflow-hidden ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
          <div className="p-6">
            <h3 className={`text-sm font-medium mb-4 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Archived Clients</h3>
            <div className="space-y-3">
              {clientTokens.filter(token => {
                const client = clients.find(c => c.id === token.client_id);
                return client?.archived_at;
              }).map((token) => {
                const client = clients.find(c => c.id === token.client_id);
                return (
                <div
                  key={token.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-l-4 opacity-75 ${darkTheme ? 'bg-[#1d1f24] border-slate-600' : 'bg-gray-100 border-gray-400'}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${darkTheme ? 'text-slate-300' : 'text-gray-700'}`}>{token.client_name}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${darkTheme ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>
                        Archived
                      </span>
                    </div>
                    <p className={`text-xs ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                      Set Target: {client?.monthly_set_target || 0} | Hold Target: {client?.monthly_hold_target || 0}
                    </p>
                    <p className={`text-xs ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>
                      Archived {client?.archived_at && new Date(client.archived_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleClientArchive(token.client_id, true)}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${darkTheme ? 'text-green-300 bg-green-900/30 hover:bg-green-900/50' : 'text-green-700 bg-green-50 hover:bg-green-100'}`}
                      title="Unarchive client"
                    >
                      <ArchiveRestore className="w-4 h-4" />
                      Unarchive
                    </button>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
      )}
      
      {clientTokens.length === 0 && (
        <div className={`rounded-lg shadow-md overflow-hidden p-6 ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
          <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>No clients have been added yet. Add clients in the Client Management page.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className={`rounded-lg shadow-md overflow-hidden ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
        <div className={`border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('managers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'managers'
                  ? darkTheme ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                  : darkTheme ? 'border-transparent text-slate-300 hover:text-blue-400 hover:border-blue-400/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Managers
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sdrs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sdrs'
                  ? darkTheme ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                  : darkTheme ? 'border-transparent text-slate-300 hover:text-blue-400 hover:border-blue-400/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                SDRs
              </div>
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clients'
                  ? darkTheme ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                  : darkTheme ? 'border-transparent text-slate-300 hover:text-blue-400 hover:border-blue-400/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Clients
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'managers' && renderManagers()}
      {activeTab === 'sdrs' && renderSDRs()}
      {activeTab === 'clients' && renderClients()}
    </div>
  );
}