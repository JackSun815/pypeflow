import React, { useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabase-admin';
import { useAuth } from '../hooks/useAuth';

interface Agency {
  id: string;
  name: string;
  subdomain: string;
  is_active: boolean;
  created_at: string;
  settings: Record<string, any>;
}

export default function AgencyManagement() {
  const { profile } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [newAgency, setNewAgency] = useState({
    name: '',
    subdomain: '',
    settings: {}
  });
  
  // User management state
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'manager' as 'manager' | 'sdr'
  });

  // Manager management state
  const [showManagersModal, setShowManagersModal] = useState(false);
  const [agencyManagers, setAgencyManagers] = useState<any[]>([]);
  const [editingManager, setEditingManager] = useState<any>(null);
  const [showEditManagerModal, setShowEditManagerModal] = useState(false);

  useEffect(() => {
    // Only fetch agencies if user is super admin
    if (profile?.super_admin) {
      fetchAgencies();
    }
  }, [profile?.super_admin]);

  // Check if user is super admin - moved after all hooks
  if (!profile?.super_admin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  async function fetchAgencies() {
    try {
      setLoading(true);
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('agencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgencies(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch agencies:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agencies');
    } finally {
      setLoading(false);
    }
  }

  async function createAgency() {
    try {
      if (!newAgency.name.trim() || !newAgency.subdomain.trim()) {
        setError('Name and subdomain are required');
        return;
      }

      // Validate subdomain format
      const subdomainRegex = /^[a-z0-9-]+$/;
      if (!subdomainRegex.test(newAgency.subdomain)) {
        setError('Subdomain can only contain lowercase letters, numbers, and hyphens');
        return;
      }

      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('agencies')
        .insert([{
          name: newAgency.name.trim(),
          subdomain: newAgency.subdomain.trim(),
          settings: newAgency.settings
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          setError('Subdomain already exists');
        } else {
          throw error;
        }
        return;
      }
      
      setAgencies(prev => [data, ...prev]);
      setShowCreateModal(false);
      setNewAgency({ name: '', subdomain: '', settings: {} });
      setError(null);
    } catch (err) {
      console.error('Failed to create agency:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agency');
    }
  }

  async function toggleAgencyStatus(agencyId: string, isActive: boolean) {
    try {
      const client = supabaseAdmin || supabase;
      const { error } = await client
        .from('agencies')
        .update({ is_active: isActive })
        .eq('id', agencyId);

      if (error) throw error;
      
      setAgencies(prev => prev.map(agency => 
        agency.id === agencyId ? { ...agency, is_active: isActive } : agency
      ));
    } catch (err) {
      console.error('Failed to update agency:', err);
      setError(err instanceof Error ? err.message : 'Failed to update agency');
    }
  }

  async function updateAgency() {
    try {
      if (!editingAgency) return;
      
      if (!editingAgency.name.trim() || !editingAgency.subdomain.trim()) {
        setError('Name and subdomain are required');
        return;
      }

      // Validate subdomain format
      const subdomainRegex = /^[a-z0-9-]+$/;
      if (!subdomainRegex.test(editingAgency.subdomain)) {
        setError('Subdomain can only contain lowercase letters, numbers, and hyphens');
        return;
      }

      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('agencies')
        .update({
          name: editingAgency.name.trim(),
          subdomain: editingAgency.subdomain.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAgency.id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          setError('Subdomain already exists');
        } else {
          throw error;
        }
        return;
      }
      
      setAgencies(prev => prev.map(agency => 
        agency.id === editingAgency.id ? data : agency
      ));
      setShowEditModal(false);
      setEditingAgency(null);
      setError(null);
    } catch (err) {
      console.error('Failed to update agency:', err);
      setError(err instanceof Error ? err.message : 'Failed to update agency');
    }
  }

  function startEdit(agency: Agency) {
    setEditingAgency({ ...agency });
    setShowEditModal(true);
    setError(null);
  }

  function getAgencyUrl(subdomain: string, useSubdomain: boolean = false): string {
    const hostname = window.location.hostname;
    const port = window.location.port;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${port}/dashboard/manager?agency=${subdomain}`;
    }
    
    if (useSubdomain) {
      return `https://${subdomain}.pypeflow.com`;
    } else {
      // Use parameter-based URL as fallback - redirect to manager dashboard
      return `https://www.pypeflow.com/dashboard/manager?agency=${subdomain}`;
    }
  }

  async function createAgencyUser() {
    try {
      if (!selectedAgency || !newUser.email || !newUser.password || !newUser.full_name) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUser.email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Validate password length
      if (newUser.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      const client = supabaseAdmin || supabase;
      
      // Create user profile
      const { data: profileData, error: profileError } = await client
        .from('profiles')
        .insert({
          email: newUser.email.trim(),
          full_name: newUser.full_name.trim(),
          role: newUser.role,
          active: true,
          agency_id: selectedAgency.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        if (profileError.code === '23505') {
          setError('A user with this email already exists');
        } else {
          throw profileError;
        }
        return;
      }

      // Store manager credentials in database with hashed password
      if (newUser.role === 'manager') {
        const passwordHash = bcrypt.hashSync(newUser.password, 10);

        const { error: credsError } = await supabase
          .from('manager_credentials')
          .upsert(
            {
              email: newUser.email.trim(),
              password_hash: passwordHash,
              full_name: newUser.full_name.trim(),
              role: 'manager',
              agency_id: selectedAgency.id,
              agency_subdomain: selectedAgency.subdomain,
              super_admin: false,
              developer: false
            } as any,
            { onConflict: 'email' }
          );

        if (credsError) {
          console.error('Failed to save manager credentials:', credsError);
          throw new Error('Manager created but failed to save credentials. Please contact support.');
        }
      }

      // Reset form and close modal
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        role: 'manager'
      });
      setShowUserModal(false);
      setSelectedAgency(null);
      setError(null);

      alert(`Manager created successfully! They can now log in at: ${getAgencyUrl(selectedAgency.subdomain, false)}`);
      
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  }

  async function viewAgencyManagers(agency: Agency) {
    try {
      setSelectedAgency(agency);
      setLoading(true);
      setError(null);

      const client = supabaseAdmin || supabase;
      
      const { data: managers, error } = await client
        .from('profiles')
        .select('id, email, full_name, role, active, created_at')
        .eq('agency_id', agency.id)
        .eq('role', 'manager')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAgencyManagers(managers || []);
      setShowManagersModal(true);
    } catch (err) {
      console.error('Error fetching managers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch managers');
    } finally {
      setLoading(false);
    }
  }

  async function editManager(manager: any) {
    setEditingManager(manager);
    setShowEditManagerModal(true);
  }

  async function updateManager(updatedManager: any) {
    try {
      setLoading(true);
      setError(null);

      const client = supabaseAdmin || supabase;
      
      const { error } = await client
        .from('profiles')
        .update({
          email: updatedManager.email.trim(),
          full_name: updatedManager.full_name.trim(),
          active: updatedManager.active
        })
        .eq('id', updatedManager.id);

      if (error) throw error;

      // Update local state
      setAgencyManagers(prev => 
        prev.map(manager => 
          manager.id === updatedManager.id ? updatedManager : manager
        )
      );

      setShowEditManagerModal(false);
      setEditingManager(null);
      alert('Manager updated successfully!');
      
    } catch (err) {
      console.error('Error updating manager:', err);
      setError(err instanceof Error ? err.message : 'Failed to update manager');
    } finally {
      setLoading(false);
    }
  }

  async function deleteManager(managerId: string) {
    if (!confirm('Are you sure you want to delete this manager? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const client = supabaseAdmin || supabase;
      
      // Soft delete by setting active to false
      const { error } = await client
        .from('profiles')
        .update({ active: false })
        .eq('id', managerId);

      if (error) throw error;

      // Update local state
      setAgencyManagers(prev => 
        prev.map(manager => 
          manager.id === managerId ? { ...manager, active: false } : manager
        )
      );

      alert('Manager deleted successfully!');
      
    } catch (err) {
      console.error('Error deleting manager:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete manager');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading agencies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Agency Management</h1>
              {profile?.developer && (
                <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
                  Developer Mode
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-2">Manage multi-tenant agencies for your SDR dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                localStorage.removeItem('currentUser');
                window.location.href = '/login';
              }}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Create New Agency
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agency Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subdomain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agencies.map((agency) => (
                <tr key={agency.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{agency.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{agency.subdomain}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div>
                        <a
                          href={getAgencyUrl(agency.subdomain, false)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {getAgencyUrl(agency.subdomain, false)}
                        </a>
                        <span className="text-xs text-green-600 ml-2">✓ Working</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">
                          {getAgencyUrl(agency.subdomain, true)}
                        </span>
                        <span className="text-xs text-orange-600 ml-2">⚠ Needs DNS setup</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      agency.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {agency.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button
                      onClick={() => {
                        setSelectedAgency(agency);
                        setShowUserModal(true);
                      }}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium hover:bg-purple-200"
                    >
                      Assign Manager
                    </button>
                    <button
                      onClick={() => viewAgencyManagers(agency)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200"
                    >
                      View Managers
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(agency.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => startEdit(agency)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleAgencyStatus(agency.id, !agency.is_active)}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        agency.is_active
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {agency.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getAgencyUrl(agency.subdomain, false));
                        // You could add a toast notification here
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium hover:bg-gray-200"
                    >
                      Copy URL
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {agencies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No agencies found. Create your first agency to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Agency Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Agency</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agency Name
                  </label>
                  <input
                    type="text"
                    value={newAgency.name}
                    onChange={(e) => setNewAgency(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Acme Sales Agency"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subdomain
                  </label>
                  <input
                    type="text"
                    value={newAgency.subdomain}
                    onChange={(e) => setNewAgency(prev => ({ ...prev, subdomain: e.target.value.toLowerCase() }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., acme-sales"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only lowercase letters, numbers, and hyphens allowed
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAgency({ name: '', subdomain: '', settings: {} });
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createAgency}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Create Agency
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agency Modal */}
      {showEditModal && editingAgency && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Agency</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agency Name
                  </label>
                  <input
                    type="text"
                    value={editingAgency.name}
                    onChange={(e) => setEditingAgency(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Acme Sales Agency"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subdomain
                  </label>
                  <input
                    type="text"
                    value={editingAgency.subdomain}
                    onChange={(e) => setEditingAgency(prev => prev ? { ...prev, subdomain: e.target.value.toLowerCase() } : null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., acme-sales"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only lowercase letters, numbers, and hyphens allowed
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAgency(null);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateAgency}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Update Agency
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showUserModal && selectedAgency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create Manager for {selectedAgency.name}
                </h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedAgency(null);
                    setNewUser({ email: '', password: '', full_name: '', role: 'manager' });
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., john@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'manager' | 'sdr' }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="manager">Manager</option>
                    <option value="sdr">SDR</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800">
                  <strong>Login URL:</strong> {getAgencyUrl(selectedAgency.subdomain, false)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  The manager will be able to log in using these credentials at the URL above.
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedAgency(null);
                    setNewUser({ email: '', password: '', full_name: '', role: 'manager' });
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createAgencyUser}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                >
                  Create Manager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Managers Modal */}
      {showManagersModal && selectedAgency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Managers for {selectedAgency.name}
                </h3>
                <button
                  onClick={() => {
                    setShowManagersModal(false);
                    setSelectedAgency(null);
                    setAgencyManagers([]);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {agencyManagers.map((manager) => (
                      <tr key={manager.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {manager.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {manager.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            manager.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {manager.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(manager.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => editManager(manager)}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteManager(manager.id)}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {agencyManagers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No managers found for this agency.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Manager Modal */}
      {showEditManagerModal && editingManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Manager
                </h3>
                <button
                  onClick={() => {
                    setShowEditManagerModal(false);
                    setEditingManager(null);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editingManager.full_name}
                    onChange={(e) => setEditingManager(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={editingManager.email}
                    onChange={(e) => setEditingManager(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., john@example.com"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingManager.active}
                      onChange={(e) => setEditingManager(prev => ({ ...prev, active: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditManagerModal(false);
                    setEditingManager(null);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateManager(editingManager)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Update Manager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
