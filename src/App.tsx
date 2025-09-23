import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AgencyProvider, useAgency } from './contexts/AgencyContext';
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

      {/* Blog routes - public */}
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      
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

  // Don't show loading state for public routes
  if (loading && !window.location.pathname.startsWith('/dashboard/sdr/') && window.location.pathname !== '/') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error && !window.location.pathname.startsWith('/dashboard/sdr/') && window.location.pathname !== '/') {
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

  return (
    <HelmetProvider>
      <AgencyProvider>
        <Router>
          <GoogleAnalytics />
          <AppRoutes />
        </Router>
      </AgencyProvider>
    </HelmetProvider>
  );
}

export default App;