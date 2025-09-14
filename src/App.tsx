import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import SDRDashboard from './pages/SDRDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';

function App() {
  const { user, profile, loading, error } = useAuth();

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
    <Router>
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

        {/* Blog routes - public */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />

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
          </>
        ) : null}
      </Routes>
    </Router>
  );
}

export default App;