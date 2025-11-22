import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AgencyProvider, useAgency } from './contexts/AgencyContext';
import { DemoProvider } from './contexts/DemoContext';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import SDRDashboard from './pages/SDRDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import AgencyManagement from './pages/AgencyManagement';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Sitemap from './pages/Sitemap';
import GoogleAnalytics from './components/GoogleAnalytics';
import ManagerDemoPreview from './pages/ManagerDemoPreview';
import Documentation from './pages/Documentation';

// Component to handle routing with agency context
function AppRoutes() {
  const { user, profile } = useAuth();
  const { agency, loading: agencyLoading } = useAgency();

  // Show loading while agency is being determined
  if (agencyLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading agency...</p>
        </div>
      </div>
    );
  }

  // Show error if agency loading failed, but allow public pages to work
  if (!agency && (user && profile)) {
    // Only show agency error for authenticated users who need agency access
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Agency Not Found</h1>
          <p className="text-gray-600 mb-4">
            The requested agency could not be found or is not active.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => {
                // Remove agency parameter and reload
                const url = new URL(window.location.href);
                url.searchParams.delete('agency');
                window.location.href = url.toString();
              }}
              className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Go to Default Agency
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public landing page - show for unauthenticated users */}
      {!user || !profile ? (
        <Route path="/" element={<LandingPage />} />
      ) : (
        <Route
          path="/"
          element={
            profile.role === 'manager' ? (
              <Navigate to="/dashboard/manager" replace />
            ) : (
              <Navigate to="/dashboard/sdr" replace />
            )
          }
        />
      )}
      
      {/* Public SDR dashboard routes */}
      <Route path="/dashboard/sdr/:token/*" element={<SDRDashboard />} />

      {/* Public client dashboard routes */}
      <Route path="/dashboard/client/:token/*" element={<ClientDashboard />} />

      {/* Demo/Sandbox routes - read-only versions */}
      <Route
        path="/demo/manager"
        element={<ManagerDemoPreview />}
      />
      <Route path="/demo/sdr" element={
        <DemoProvider>
          <SDRDashboard />
        </DemoProvider>
      } />
      <Route path="/demo/client" element={
        <DemoProvider>
          <ClientDashboard />
        </DemoProvider>
      } />

      {/* Blog routes - public */}
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      
      {/* Documentation route - public */}
      <Route path="/docs" element={<Documentation />} />
      
      {/* SEO routes */}
      <Route path="/sitemap.xml" element={<Sitemap />} />

      {/* Login route */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      {user && profile ? (
        <>
          <Route
            path="/dashboard/manager"
            element={
              profile.role === 'manager' ? (
                <ManagerDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/dashboard/sdr"
            element={
              profile.role === 'sdr' ? (
                <SDRDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/admin/agencies"
            element={
              profile.super_admin ? (
                <AgencyManagement />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </>
      ) : null}
    </Routes>
  );
}

function App() {
  const { loading, error } = useAuth();

  // Detect if we're running inside an iframe to prevent navigation escapes
  const isInIframe = window.self !== window.top;
  const urlParams = new URLSearchParams(window.location.search);
  const isIframeDemo = isInIframe || urlParams.get('iframe') === 'true';
  
  React.useEffect(() => {
    if (isIframeDemo) {
      console.log('[App] Iframe demo mode detected - using hash routing');
    }
  }, [isIframeDemo]);

  // Determine if we're on a public, token-based dashboard route or the public landing page.
  // These routes should NOT be blocked by the global auth loading/error states, because they
  // rely on token-based access instead of a signed-in Supabase session.
  const path = window.location.pathname;
  const isPublicTokenRoute =
    path.startsWith('/dashboard/sdr/') || path.startsWith('/dashboard/client/');
  const isPublicLanding = path === '/';

  // Lightweight debug hook so we can understand what App thinks this route is doing in prod.
  // This is intentionally left in production builds to help debug issues on pypeflow.com.
  // It only logs basic routing flags and does NOT log any sensitive data.
  try {
    // Use a separate try/catch to avoid ever crashing render due to console issues.
    console.debug('[App] Render', {
      path,
      loading,
      hasError: !!error,
      isPublicTokenRoute,
      isPublicLanding,
    });
  } catch {
    // Swallow any console errors – rendering should never fail because of logging.
  }

  // Don't show loading state for public routes
  if (loading && !isPublicTokenRoute && !isPublicLanding) {
    try {
      console.debug('[App] Showing global loading screen', {
        path,
        loading,
        isPublicTokenRoute,
        isPublicLanding,
      });
    } catch {}

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error && !isPublicTokenRoute && !isPublicLanding) {
    try {
      console.error('[App] Auth error in protected route', {
        path,
        message: error,
        isPublicTokenRoute,
        isPublicLanding,
      });
    } catch {}

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const RouterComponent = isIframeDemo ? HashRouter : BrowserRouter;

  return (
    <HelmetProvider>
      <AgencyProvider>
        <DemoProvider>
          <RouterComponent>
            <GoogleAnalytics />
            <AppRoutes />
          </RouterComponent>
        </DemoProvider>
      </AgencyProvider>
    </HelmetProvider>
  );
}

export default App;