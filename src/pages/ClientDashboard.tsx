import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Users, Target, AlertCircle, ExternalLink, Building } from 'lucide-react';

interface ClientInfo {
  id: string;
  name: string;
}

interface Meeting {
  id: string;
  scheduled_date: string;
  status: 'pending' | 'confirmed';
  contact_full_name: string | null;
  contact_email: string | null;
  company: string | null;
  notes: string | null;
  sdr_name: string;
  created_at: string;
}

export default function ClientDashboard() {
  const { token } = useParams<{ token: string }>();
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'meetings' | 'history'>('overview');

  useEffect(() => {
    if (!token) {
      setError('Invalid access token');
      setLoading(false);
      return;
    }

    validateTokenAndFetchData();
  }, [token]);

  async function validateTokenAndFetchData() {
    try {
      // For now, use simple token validation until database migration is applied
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token));
      } catch {
        throw new Error('Invalid token format');
      }

      if (!tokenData.id || tokenData.type !== 'client_access') {
        throw new Error('Invalid token');
      }

      // Check if token is expired
      if (tokenData.exp && Date.now() > tokenData.exp) {
        throw new Error('Token has expired');
      }

      // For now, we'll need to get client info from the clients list
      // This is a temporary solution until we have the database migration
      const clientId = tokenData.id;
      
      // We'll need to fetch client info from the clients table
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('id', clientId)
        .single();

      if (clientError || !clientData) {
        throw new Error('Client not found');
      }

      setClientInfo({ id: clientData.id, name: clientData.name });

      // Fetch meetings for this client
      await fetchMeetings(clientId);

    } catch (err) {
      console.error('Token validation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to validate access token');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMeetings(clientId: string) {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          profiles!meetings_sdr_id_fkey(full_name)
        `)
        .eq('client_id', clientId)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      const meetingsWithSdrName = data?.map(meeting => ({
        ...meeting,
        sdr_name: (meeting as any).profiles?.full_name || 'Unknown SDR'
      })) || [];

      setMeetings(meetingsWithSdrName);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading client dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Please contact your account manager for access to the client dashboard.
          </p>
        </div>
      </div>
    );
  }

  const upcomingMeetings = meetings.filter(meeting => 
    new Date(meeting.scheduled_date) >= new Date() && meeting.status === 'pending'
  );

  const confirmedMeetings = meetings.filter(meeting => 
    meeting.status === 'confirmed'
  );

  const pastMeetings = meetings.filter(meeting => 
    new Date(meeting.scheduled_date) < new Date()
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
                <p className="text-sm text-gray-600">{clientInfo?.name}</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('meetings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'meetings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upcoming Meetings
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Meeting History
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Upcoming Meetings</p>
                    <p className="text-2xl font-semibold text-gray-900">{upcomingMeetings.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Confirmed Meetings</p>
                    <p className="text-2xl font-semibold text-gray-900">{confirmedMeetings.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Meetings</p>
                    <p className="text-2xl font-semibold text-gray-900">{meetings.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Meetings */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Meetings</h3>
              </div>
              <div className="p-6">
                {meetings.slice(0, 5).map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {meeting.contact_full_name || 'Meeting'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(meeting.scheduled_date).toLocaleDateString()} at{' '}
                        {new Date(meeting.scheduled_date).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      <p className="text-xs text-gray-500">SDR: {meeting.sdr_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        meeting.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {meeting.status}
                      </span>
                    </div>
                  </div>
                ))}
                {meetings.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No meetings scheduled yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h3>
            </div>
            <div className="p-6">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {meeting.contact_full_name || 'Meeting'}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {meeting.contact_email && (
                          <span className="block">Email: {meeting.contact_email}</span>
                        )}
                        {meeting.company && (
                          <span className="block">Company: {meeting.company}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Scheduled: {new Date(meeting.scheduled_date).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        SDR: {meeting.sdr_name}
                      </p>
                      {meeting.notes && (
                        <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                          {meeting.notes}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      meeting.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {meeting.status}
                    </span>
                  </div>
                </div>
              ))}
              {upcomingMeetings.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">No upcoming meetings scheduled</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Meeting History</h3>
            </div>
            <div className="p-6">
              {pastMeetings.map((meeting) => (
                <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {meeting.contact_full_name || 'Meeting'}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {meeting.contact_email && (
                          <span className="block">Email: {meeting.contact_email}</span>
                        )}
                        {meeting.company && (
                          <span className="block">Company: {meeting.company}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Scheduled: {new Date(meeting.scheduled_date).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        SDR: {meeting.sdr_name}
                      </p>
                      {meeting.notes && (
                        <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                          {meeting.notes}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      meeting.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {meeting.status}
                    </span>
                  </div>
                </div>
              ))}
              {pastMeetings.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">No past meetings found</p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Client Dashboard - {clientInfo?.name}</p>
          <p className="mt-1">
            For support, please contact your account manager or SDR.
          </p>
        </div>
      </div>
    </div>
  );
}
