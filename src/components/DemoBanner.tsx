import React from 'react';
import { AlertCircle, Lock } from 'lucide-react';

export default function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold">Demo Mode - Read Only</p>
            <p className="text-sm text-blue-100">
              This is a sandbox environment. All data is read-only and changes cannot be saved.
            </p>
          </div>
        </div>
        <a
          href="/login"
          className="px-4 py-2 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors text-sm"
        >
          Sign In for Full Access
        </a>
      </div>
    </div>
  );
}

export function LockedTabMessage({ featureName }: { featureName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-gray-50 rounded-lg p-8 max-w-md w-full text-center border-2 border-dashed border-gray-300">
        <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{featureName} is Locked</h3>
        <p className="text-gray-600 mb-6">
          This feature is not available in demo mode. Contact us to unlock full access to all features.
        </p>
        <a
          href="mailto:support@pypeflow.com?subject=Request Full Access"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Contact to Unlock
        </a>
      </div>
    </div>
  );
}









