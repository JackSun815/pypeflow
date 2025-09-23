import React, { useState, useEffect } from 'react';
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

  function getAgencyUrl(subdomain: string): string {
    const hostname = window.location.hostname;
    const port = window.location.port;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${port}?agency=${subdomain}`;
    }
    return `https://${subdomain}.pypeflow.com`;
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
                    <a
                      href={getAgencyUrl(agency.subdomain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {getAgencyUrl(agency.subdomain)}
                    </a>
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
                        navigator.clipboard.writeText(getAgencyUrl(agency.subdomain));
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
    </div>
  );
}
