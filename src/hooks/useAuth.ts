import { useEffect, useState } from 'react';

type Profile = {
  id: string;
  role: 'sdr' | 'manager';
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  active: boolean;
  super_admin?: boolean;
};

export function useAuth() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(currentUser);
      const now = new Date().toISOString();

      // Create a profile object from the stored user data
      const userProfile: Profile = {
        id: userData.email, // Using email as ID for simplicity
        role: 'manager',
        full_name: userData.fullName || 'Manager',
        email: userData.email,
        created_at: now,
        updated_at: now,
        active: true,
        super_admin: userData.super_admin || false
      };

      setUser({ id: userProfile.id });
      setProfile(userProfile);
      setError(null);
    } catch (err) {
      console.error('Auth error:', err);
      setError('Authentication failed');
      setUser(null);
      setProfile(null);
      localStorage.removeItem('currentUser');
    }

    setLoading(false);
  }, []);

  return { user, profile, loading, error };
}