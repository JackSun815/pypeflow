import React, { useMemo, useState } from 'react';
import { X, Maximize2, Minimize2, Briefcase, Users, User } from 'lucide-react';
import ManagerDemoPreview from '../pages/ManagerDemoPreview';

interface DemoViewerProps {
  type: 'manager' | 'sdr' | 'client';
  onClose: () => void;
}

const SDR_PROFILE_ID = 'a51a5f5a-4d83-4e52-85e0-6f63e0ce3eca';
const CLIENT_PROFILE_ID = '7693120d-82a6-4156-add8-4517f122deb3';

function encodePayload(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload);
  if (typeof btoa === 'function') {
    return encodeURIComponent(btoa(json));
  }
  return encodeURIComponent(json);
}

export default function DemoViewer({ type, onClose }: DemoViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeRole, setActiveRole] = useState<'manager' | 'sdr' | 'client'>(type);

  const sdrUrl = useMemo(() => {
    const token = encodePayload({
      id: SDR_PROFILE_ID,
      timestamp: Date.now(),
      type: 'sdr_access',
    });
    return `https://www.pypeflow.com/dashboard/sdr/${token}`;
  }, []);

  const clientUrl = useMemo(() => {
    const token = encodePayload({
      id: CLIENT_PROFILE_ID,
      timestamp: Date.now(),
      type: 'client_access',
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });
    return `https://www.pypeflow.com/dashboard/client/${token}`;
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
                onClick={() => setActiveRole(role.id)}
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
            <iframe
              src={currentUrl}
              title="PypeFlow Demo Dashboard"
              className="w-full h-full border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}

