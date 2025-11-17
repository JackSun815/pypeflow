import React, { useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import StaticManagerDemo from '../pages/StaticManagerDemo';

interface DemoViewerProps {
  type: 'manager' | 'sdr' | 'client';
  onClose: () => void;
}

export default function DemoViewer({ type, onClose }: DemoViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // For now, show the static Manager Demo for all demo types.
  // SDR and Client dashboards require tokens that need to be set up.
  // You can extend this later to support SDR/Client demos with proper token handling.
  const renderDashboard = () => {
    return <StaticManagerDemo />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-2xl ${isFullscreen ? 'w-full h-full' : 'w-full max-w-[95vw] h-[90vh]'} flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">
              {type === 'manager' ? 'Manager Dashboard Demo' : type === 'sdr' ? 'SDR Dashboard Demo' : 'Client Dashboard Demo'}
            </h2>
            <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium">Read-Only Mode</span>
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
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            {renderDashboard()}
          </div>
        </div>
      </div>
    </div>
  );
}

