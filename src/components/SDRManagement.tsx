import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Trash2, AlertCircle, Copy, Check, Link } from 'lucide-react';
import CompensationManagement from './CompensationManagement';
import type { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface SDRManagementProps {
  sdrs: Profile[];
  onInviteSent: () => void;
}

export default function SDRManagement({ sdrs, onInviteSent }: SDRManagementProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSDR, setSelectedSDR] = useState<string | null>(null);

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  function generateAccessToken(sdrId: string): string {
    // Include more data in the token for better security and validation
    const tokenData = {
      id: sdrId,
      timestamp: Date.now(),
      type: 'sdr_access',
      exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days expiration
    };
    return btoa(JSON.stringify(tokenData));
  }

  function getDashboardUrl(sdrId: string): string {
    const token = generateAccessToken(sdrId);
    return `${window.location.origin}/dashboard/sdr/${token}`;
  }

  async function handleAddSDR(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Check if email already exists in profiles
      const { data: existingSDR } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (existingSDR) {
        if (existingSDR.active) {
          throw new Error('An SDR with this email already exists');
        }

        // Reactivate the SDR
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            active: true,
            full_name: fullName,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSDR.id);

        if (updateError) throw updateError;

        setSuccess('SDR reactivated successfully');
        onInviteSent();
        setEmail('');
        setFullName('');
        return;
      }

      // Create new SDR profile
      const { data: newSDR, error: createError } = await supabase
        .from('profiles')
        .insert([{
          email,
          full_name: fullName,
          role: 'sdr',
          active: true
        }])
        .select()
        .single();

      if (createError) throw createError;

      setSuccess('SDR added successfully');
      setEmail('');
      setFullName('');
      onInviteSent();
    } catch (err) {
      console.error('Add SDR error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add SDR');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSDR(sdrId: string) {
    if (!confirm('Are you sure you want to remove this SDR? This will deactivate their account.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', sdrId);

      if (updateError) throw updateError;

      setSuccess('SDR removed successfully');
      onInviteSent();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove SDR');
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Manage SDRs</h2>
        </div>

        <form onSubmit={handleAddSDR} className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Add New SDR</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          onUpdate={onInviteSent}
        />
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Current SDRs</h3>
          <div className="space-y-3">
            {sdrs.map((sdr) => (
              <div
                key={sdr.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{sdr.full_name}</p>
                  <p className="text-xs text-gray-500">{sdr.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created {sdr.created_at && new Date(sdr.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSDR(selectedSDR === sdr.id ? null : sdr.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {selectedSDR === sdr.id ? 'Hide Compensation' : 'Manage Compensation'}
                  </button>
                  <button
                    onClick={() => handleCopyUrl(sdr.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
                    onClick={() => handleDeleteSDR(sdr.id)}
                    className="p-2 text-red-600 hover:text-red-700 focus:outline-none"
                    title="Remove SDR"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {sdrs.length === 0 && (
              <p className="text-sm text-gray-500">No SDRs have been added yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}