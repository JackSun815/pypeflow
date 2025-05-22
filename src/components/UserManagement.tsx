import React, { useState } from 'react';
import { Mail, AlertCircle, UserPlus, Key, Check } from 'lucide-react';

interface Manager {
  email: string;
  fullName: string;
  password: string;
}

export default function UserManagement() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingManager, setEditingManager] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [managers, setManagers] = useState<Manager[]>(() => {
    const savedManagers = localStorage.getItem('managers');
    return savedManagers ? JSON.parse(savedManagers) : [];
  });

  async function handleAddManager(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate input
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

      // Create new manager
      const newManager = {
        email,
        fullName,
        password
      };

      // Update local storage
      const updatedManagers = [...managers, newManager];
      localStorage.setItem('managers', JSON.stringify(updatedManagers));
      setManagers(updatedManagers);

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Manage Users</h2>
        </div>

        <form onSubmit={handleAddManager} className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Add New Manager</h3>

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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  <UserPlus className="w-4 h-4" />
                  Add Manager
                </>
              )}
            </button>
          </div>
        </form>

        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Current Managers</h3>
          <div className="space-y-3">
            {managers.map((manager) => (
              <div
                key={manager.email}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{manager.fullName}</p>
                  <p className="text-xs text-gray-500">{manager.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {editingManager === manager.email ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleUpdatePassword(manager.email)}
                        className="p-1 text-green-600 hover:text-green-700 focus:outline-none"
                        title="Save new password"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingManager(manager.email);
                        setNewPassword('');
                        setError(null);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <Key className="w-4 h-4" />
                      Edit Password
                    </button>
                  )}
                </div>
              </div>
            ))}
            {managers.length === 0 && (
              <p className="text-sm text-gray-500">No managers have been added yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}