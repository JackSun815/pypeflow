import React from 'react';
import { Copy, Check } from 'lucide-react';

interface SDRInviteLinkProps {
  email: string;
  fullName: string;
  onClose: () => void;
}

export default function SDRInviteLink({ email, fullName, onClose }: SDRInviteLinkProps) {
  const [copied, setCopied] = React.useState(false);

  // Create a unique invitation link with JWT-like structure
  const inviteData = {
    email,
    fullName,
    role: 'sdr',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days expiration
  };
  
  const inviteToken = btoa(JSON.stringify(inviteData));
  const inviteLink = `${window.location.origin}/signup?invite=${inviteToken}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">SDR Invitation Link</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Share this link with {fullName} to complete their account setup:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50"
              />
              <button
                onClick={handleCopy}
                className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                title={copied ? 'Copied!' : 'Copy link'}
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              This link will expire in 7 days. The SDR will need to use the same email address ({email}) when creating their account.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}