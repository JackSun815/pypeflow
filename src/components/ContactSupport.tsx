import { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ContactSupportProps {
  isOpen: boolean;
  onClose: () => void;
  darkTheme?: boolean;
  userEmail?: string;
  userName?: string;
  userRole?: string;
}

export default function ContactSupport({
  isOpen,
  onClose,
  darkTheme = false,
  userEmail = '',
  userName = '',
  userRole = ''
}: ContactSupportProps) {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'question' as 'question' | 'technical' | 'bug',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim() || !formData.subject.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call Supabase Edge Function to send email
      const { data, error } = await supabase.functions.invoke('contact-support', {
        body: {
          subject: formData.subject,
          category: formData.category,
          message: formData.message,
          email: userEmail || '',
          userName: userName || 'Unknown User',
          userRole: userRole || 'Unknown'
        }
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Support request submitted successfully!');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          subject: '',
          category: 'question',
          message: ''
        });
        setIsSubmitted(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting support request:', error);
      toast.error(error.message || 'Failed to submit support request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
        <div className={`sticky top-0 ${darkTheme ? 'bg-[#232529]' : 'bg-white'} border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'} p-6 flex items-center justify-between`}>
          <h2 className={`text-xl font-semibold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
            Contact Developers
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${darkTheme ? 'text-slate-400 hover:text-slate-200 hover:bg-[#2d3139]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-8">
              <CheckCircle className={`w-16 h-16 mx-auto mb-4 ${darkTheme ? 'text-green-400' : 'text-green-600'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>
                Thank You!
              </h3>
              <p className={`${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>
                Your support request has been submitted successfully. We'll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <>
              <div className={`mb-6 p-4 rounded-lg ${darkTheme ? 'bg-blue-900/20 border border-blue-800/50' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${darkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <p className={`text-sm font-medium ${darkTheme ? 'text-blue-300' : 'text-blue-900'}`}>
                      We're here to help!
                    </p>
                    <p className={`text-sm mt-1 ${darkTheme ? 'text-blue-200' : 'text-blue-700'}`}>
                      Submit your question, report a technical issue, or report a bug. We'll respond within 24 hours.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'question' | 'technical' | 'bug' })}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                  >
                    <option value="question">General Question</option>
                    <option value="technical">Technical Difficulty</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                    placeholder="Brief description of your issue"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={6}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                    placeholder="Please provide as much detail as possible about your question, technical issue, or bug..."
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${darkTheme ? 'text-slate-200 bg-[#2d3139] hover:bg-[#353941]' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

