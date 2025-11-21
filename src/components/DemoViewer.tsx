import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, Briefcase, Users, User } from 'lucide-react';
import ManagerDemoPreview from '../pages/ManagerDemoPreview';

interface DemoViewerProps {
  type: 'manager' | 'sdr' | 'client';
  onClose: () => void;
}

// Static production token URLs that are validated by the backend.
// Use relative paths so the demo works consistently in local dev and on pypeflow.com
// without breaking out of the sandbox/iframe context.
const SDR_DEMO_URL =
  '/dashboard/sdr/eyJpZCI6ImE1MWE1ZjVhLTRkODMtNGU1Mi04NWUwLTZmNjNlMGNlM2VjYSIsInRpbWVzdGFtcCI6MTc2MzQwODM3MTE2OSwidHlwZSI6InNkcl9hY2Nlc3MifQ==?agency=demo';
const CLIENT_DEMO_URL =
  '/dashboard/client/eyJpZCI6Ijc2OTMxMjBkLTgyYTYtNDE1Ni1hZGQ4LTQ1MTdmMTIyZGViMyIsInRpbWVzdGFtcCI6MTc2MzQwODQxMjM2OSwidHlwZSI6ImNsaWVudF9hY2Nlc3MiLCJleHAiOjE3OTQ5NDQ0MTIzNjl9?agency=demo';

export default function DemoViewer({ type, onClose }: DemoViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeRole, setActiveRole] = useState<'manager' | 'sdr' | 'client'>(type);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sdrUrl = SDR_DEMO_URL;
  const clientUrl = CLIENT_DEMO_URL;

  // Prevent iframe from affecting parent window via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from pypeflow.com
      if (event.origin !== 'https://www.pypeflow.com' && event.origin !== 'https://pypeflow.com') {
        return;
      }
      
      // Block any navigation attempts from iframe
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'navigation' || event.data.action === 'navigate' || event.data.type === 'redirect') {
          console.warn('Navigation attempt blocked in demo mode');
          return;
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const currentUrl = activeRole === 'sdr' ? sdrUrl : clientUrl;

  const handleRoleChange = (role: 'manager' | 'sdr' | 'client') => {
    setActiveRole(role);
    setIframeError(false);
  };

  const handleIframeLoad = () => {
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

  const roleButtons = [
    {
      id: 'manager',
      label: 'Manager',
      icon: Briefcase,
      gradient: 'bg-gradient-to-r from-indigo-600 via-purple-500 to-blue-500',
    },
    {
      id: 'sdr',
      label: 'SDR',
      icon: Users,
      gradient: 'bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500',
    },
    {
      id: 'client',
      label: 'Client',
      icon: User,
      gradient: 'bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500',
    },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl ${
          isFullscreen ? 'w-full h-full' : 'w-full max-w-[95vw] h-[90vh]'
        } flex flex-col transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">Interactive Demo Suite</h2>
              <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium">
                Read-Only Mode
              </span>
            </div>
            <p className="text-sm text-white/80">
              Explore the exact experience for Managers, SDRs, and Clients.
            </p>
          </div>
          <div className="bg-white/15 rounded-full p-1 flex gap-2">
            {roleButtons.map(role => (
              <button
                key={role.id}
                onClick={() => handleRoleChange(role.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all shadow ${role.gradient} ${
                  activeRole === role.id
                    ? 'text-white border border-white/70 shadow-lg'
                    : 'text-white/85 opacity-80 hover:opacity-100'
                }`}
              >
                <role.icon className="w-4 h-4" />
                {role.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              title="Close Demo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 border-t border-gray-200">
          {activeRole === 'manager' ? (
            <div className="h-full overflow-auto">
              <ManagerDemoPreview />
            </div>
          ) : (
            <div className="relative w-full h-full">
              {iframeError ? (
                <div className="flex items-center justify-center h-full bg-white">
                  <div className="text-center p-8">
                    <p className="text-gray-600 mb-4">Unable to load demo dashboard.</p>
                    <button
                      onClick={() => {
                        setIframeError(false);
                        // Force iframe reload by changing key
                        const iframe = document.querySelector('iframe[title="PypeFlow Demo Dashboard"]') as HTMLIFrameElement;
                        if (iframe) {
                          iframe.src = iframe.src;
                        }
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  key={`${activeRole}-${currentUrl}`}
                  src={currentUrl}
                  title="PypeFlow Demo Dashboard"
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  referrerPolicy="no-referrer-when-downgrade"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  allow="clipboard-read; clipboard-write"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

