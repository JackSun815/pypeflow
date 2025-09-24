import React, { useState } from 'react';
import { LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Developer admin login - goes directly to agency management
      if (email === 'jack.sun121601@gmail.com' && password === 'asdfasdf') {
        localStorage.setItem('currentUser', JSON.stringify({
          email,
          role: 'manager',
          super_admin: true,
          developer: true
        }));
        window.location.href = '/admin/agencies';
        return;
      }

      // Super admin login
      if (email === 'eric@parakeet.io' && password === 'asdfasdf') {
        localStorage.setItem('currentUser', JSON.stringify({
          email,
          role: 'manager',
          super_admin: true
        }));
        window.location.href = '/dashboard/manager';
        return;
      }

      // Check for agency credentials in local storage
      const agencyCredentials = localStorage.getItem('agencyCredentials');
      const credentials = agencyCredentials ? JSON.parse(agencyCredentials) : {};
      const userCredential = credentials[email];

      if (userCredential && userCredential.password === password) {
        localStorage.setItem('currentUser', JSON.stringify(userCredential));
        
        // Dispatch custom event to notify agency context of login
        window.dispatchEvent(new CustomEvent('userLogin', { 
          detail: { agencyId: userCredential.agency_id } 
        }));
        
        // Redirect based on role, preserving agency context
        const agencyParam = userCredential.agency_subdomain ? `?agency=${userCredential.agency_subdomain}` : '';
        
        if (userCredential.role === 'manager') {
          window.location.href = `/dashboard/manager${agencyParam}`;
        } else {
          window.location.href = `/dashboard/sdr${agencyParam}`;
        }
        return;
      }

      // Check for manager credentials in local storage (legacy)
      const savedManagers = localStorage.getItem('managers');
      const managers = savedManagers ? JSON.parse(savedManagers) : [];
      const manager = managers.find((m: any) => m.email === email && m.password === password);

      if (manager) {
        localStorage.setItem('currentUser', JSON.stringify({
          email: manager.email,
          fullName: manager.fullName,
          role: 'manager'
        }));
        window.location.href = '/dashboard/manager';
        return;
      }

      throw new Error('Invalid email or password');
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Management Dashboard
        </h1>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
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
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
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
                <LogIn className="w-4 h-4" />
                Sign in
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need access? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
}