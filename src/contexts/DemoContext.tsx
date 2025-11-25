import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface DemoContextType {
  isDemoMode: boolean;
  setIsDemoMode: (value: boolean) => void;
  demoAgencySubdomain: string | null;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

// Demo agency subdomain - must match the `subdomain` field in the `agencies` table
// This ensures demo routes use the dedicated Demo Environment instead of the default OSP agency
const DEMO_AGENCY_SUBDOMAIN = 'demo';

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  
  // Check if user is authenticated by checking localStorage directly (since useAuth might not be ready yet)
  const isAuthenticated = () => {
    return !!localStorage.getItem('currentUser');
  };
  
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // If user is authenticated, never use demo mode (unless explicitly on /demo route)
    if (isAuthenticated()) {
      return false;
    }
    // For unauthenticated users, check URL or localStorage
    return window.location.pathname.startsWith('/demo') || 
           localStorage.getItem('demoMode') === 'true';
  });

  const [demoAgencySubdomain, setDemoAgencySubdomain] = useState<string | null>(null);

  useEffect(() => {
    // If user is authenticated, always disable demo mode
    const authenticated = isAuthenticated();
    if (authenticated) {
      if (isDemoMode) {
        setIsDemoMode(false);
      }
      localStorage.removeItem('demoMode');
      return;
    }

    // Only allow demo mode for unauthenticated users
    if (isDemoMode) {
      // Set demo mode in localStorage only for unauthenticated users
      localStorage.setItem('demoMode', 'true');
      
      // Force demo agency in URL so AgencyContext can pick it up
      const urlParams = new URLSearchParams(window.location.search);
      const agencyParam = urlParams.get('agency');
      const effectiveSubdomain = DEMO_AGENCY_SUBDOMAIN;

      // `agency` is interpreted as subdomain by `AgencyContext`
      setDemoAgencySubdomain(effectiveSubdomain);

      // Ensure the URL always uses the demo agency while in demo mode
      if (agencyParam !== effectiveSubdomain) {
        const url = new URL(window.location.href);
        url.searchParams.set('agency', effectiveSubdomain);
        window.history.replaceState({}, '', url.toString());

        // Notify listeners (like AgencyContext) that the "location" effectively changed
        // so they can re-run agency detection.
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } else {
      localStorage.removeItem('demoMode');
    }
  }, [isDemoMode, user, profile]);

  return (
    <DemoContext.Provider value={{ isDemoMode, setIsDemoMode, demoAgencySubdomain }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    // Return default values if not in a provider (not in demo mode)
    return { isDemoMode: false, setIsDemoMode: () => {} };
  }
  return context;
}

