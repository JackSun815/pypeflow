import React, { useState, useEffect } from 'react';
import { useParams, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useMeetings } from '../hooks/useMeetings';
import ClientCard from '../components/ClientCard';
import MeetingsList from '../components/MeetingsList';
import DashboardMetrics from '../components/DashboardMetrics';
import MeetingsHistory from './MeetingsHistory';
import Commissions from './Commissions';
import { AlertCircle, Calendar, DollarSign, History, Info, Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';
import TimeSelector from '../components/TimeSelector';
import UnifiedMeetingLists from '../components/UnifiedMeetingLists';

export default function SDRDashboard() {
  const { token } = useParams();
  const location = useLocation();
  const [sdrId, setSdrId] = useState<string | null>(null);
  const [sdrName, setSdrName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('09:00');
  const [contactFullName, setContactFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [addMeetingError, setAddMeetingError] = useState<string | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<string | null>(null);

  const { clients, loading: clientsLoading, error: clientsError, totalMeetingGoal } = useClients(sdrId);
  const { 
    meetings, 
    loading: meetingsLoading, 
    error: meetingsError, 
    addMeeting, 
    updateMeeting,
    updateMeetingHeldDate,
    updateMeetingConfirmedDate,
    deleteMeeting 
  } = useMeetings(sdrId);

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const pendingMeetings = meetings.filter(
    meeting => meeting.status === 'pending' && !meeting.no_show
  ).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const confirmedMeetings = meetings.filter(
    meeting => meeting.status === 'confirmed'
  ).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const noShowMeetings = meetings.filter(
    meeting => meeting.no_show
  ).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  const heldMeetings = meetings.filter(
    meeting => meeting.held_at !== null
  ).length;

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('No access token provided');
        return;
      }

      try {
        const decodedToken = JSON.parse(atob(token));
        
        if (!decodedToken.id || !decodedToken.timestamp || decodedToken.type !== 'sdr_access') {
          throw new Error('Invalid access token');
        }

        if (Date.now() - decodedToken.timestamp > 30 * 24 * 60 * 60 * 1000) {
          throw new Error('Access token has expired');
        }

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${decodedToken.id}&role=eq.sdr&active=eq.true&select=id,full_name`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch SDR profile');
        }

        const [sdrProfile] = await response.json();

        if (!sdrProfile) {
          throw new Error('Invalid or inactive SDR account');
        }

        setSdrId(decodedToken.id);
        setSdrName(sdrProfile.full_name);
        setError(null);
      } catch (err) {
        console.error('Token validation error:', err);
        setError(err instanceof Error ? err.message : 'Invalid or expired access token');
        setSdrId(null);
        setSdrName(null);
      }
    }

    validateToken();
  }, [token]);

  const findMeeting = (meetingId: string) => {
    return meetings.find(m => m.id === meetingId);
  };

  const handleEditMeeting = (meetingId: string) => {
    const meeting = findMeeting(meetingId);
    if (!meeting) return;

    setEditingMeeting(meetingId);
    setSelectedClientId(meeting.client_id);
    
    const dateParts = meeting.scheduled_date.split('T');
    setMeetingDate(dateParts[0] || '');
    
    if (dateParts.length > 1 && dateParts[1]) {
      setMeetingTime(dateParts[1].substring(0, 5));
    } else {
      setMeetingTime('09:00');
    }
    
    setContactFullName(meeting.contact_full_name || '');
    setContactEmail(meeting.contact_email || '');
    setContactPhone(meeting.contact_phone || '');
    setShowAddMeeting(true);
  };

  async function handleAddMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientId || !meetingDate || !sdrId || !contactFullName || !contactEmail) return;

    try {
      const scheduledDateTime = `${meetingDate}T${meetingTime}:00.000Z`;
      
      await addMeeting(selectedClientId, scheduledDateTime, sdrId, {
        contact_full_name: contactFullName,
        contact_email: contactEmail,
        contact_phone: contactPhone
      });
      
      setShowAddMeeting(false);
      setMeetingDate('');
      setMeetingTime('09:00');
      setSelectedClientId(null);
      setContactFullName('');
      setContactEmail('');
      setContactPhone('');
      setEditingMeeting(null);
      setAddMeetingError(null);
      
      triggerConfetti();
    } catch (error) {
      setAddMeetingError(error instanceof Error ? error.message : 'Failed to add meeting');
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (clientsLoading || meetingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const monthProgress = (dayOfMonth / daysInMonth) * 100;

  const todayDateString = now.toISOString().split('T')[0];
  
  const todayMeetings = meetings.filter(
    (meeting) => {
      const meetingDateString = meeting.scheduled_date.split('T')[0];
      return meetingDateString === todayDateString;
    }
  );

  const handleMeetingHeldDateUpdate = async (meetingId: string, heldDate: string | null) => {
    try {
      await updateMeetingHeldDate(meetingId, heldDate);
      if (heldDate) {
        triggerConfetti();
      }
    } catch (error) {
      console.error('Failed to update meeting held date:', error);
    }
  };

  const handleMeetingConfirmedDateUpdate = async (meetingId: string, confirmedDate: string | null) => {
    try {
      await updateMeetingConfirmedDate(meetingId, confirmedDate);
      if (confirmedDate) {
        triggerConfetti();
      }
    } catch (error) {
      console.error('Failed to update meeting confirmed date:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {sdrName}
            </h1>
            <div className="flex items-center gap-2 text-lg text-gray-600">
              <span>{currentMonth}</span>
              <Rocket className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <Link
              to=""
              className={`text-sm font-medium ${
                location.pathname === `/dashboard/sdr/${token}`
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Dashboard
              </span>
            </Link>
            <Link
              to="history"
              className={`text-sm font-medium ${
                location.pathname === `/dashboard/sdr/${token}/history`
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-1">
                <History className="w-4 h-4" />
                Meeting History
              </span>
            </Link>
            <Link
              to="commissions"
              className={`text-sm font-medium ${
                location.pathname === `/dashboard/sdr/${token}/commissions`
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Commissions
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {(clientsError || meetingsError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p>{clientsError || meetingsError}</p>
            </div>
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <>
                <div className="mb-8">
                  <DashboardMetrics 
                    clients={clients}
                    monthProgress={monthProgress}
                    totalMeetingGoal={totalMeetingGoal}
                    totalPendingMeetings={pendingMeetings.length}
                    totalHeldMeetings={heldMeetings}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {clients.map((client) => (
                    <ClientCard
                      key={client.id}
                      name={client.name}
                      monthlyTarget={client.monthlyTarget}
                      confirmedMeetings={client.confirmedMeetings}
                      pendingMeetings={client.pendingMeetings}
                      todaysMeetings={client.todaysMeetings}
                      onAddMeeting={() => {
                        setSelectedClientId(client.id);
                        setShowAddMeeting(true);
                        setEditingMeeting(null);
                        setAddMeetingError(null);
                        setMeetingDate('');
                        setMeetingTime('09:00');
                        setContactFullName('');
                        setContactEmail('');
                        setContactPhone('');
                      }}
                      onConfirmMeeting={(meetingId) => {
                        handleMeetingConfirmedDateUpdate(meetingId, todayDateString);
                      }}
                      onEditMeeting={handleEditMeeting}
                    />
                  ))}
                  {clients.length === 0 && (
                    <div className="col-span-full p-6 bg-white rounded-lg shadow-md text-center">
                      <p className="text-gray-500">No clients assigned for this month</p>
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <MeetingsList
                    title="Today's Meetings"
                    meetings={todayMeetings}
                    onDelete={deleteMeeting}
                    onUpdateHeldDate={handleMeetingHeldDateUpdate}
                    onUpdateConfirmedDate={handleMeetingConfirmedDateUpdate}
                    onUpdateMeeting={updateMeeting}
                    showMeetingStatus={true}
                  />
                </div>

                <UnifiedMeetingLists
                  pendingMeetings={pendingMeetings}
                  confirmedMeetings={confirmedMeetings}
                  noShowMeetings={noShowMeetings}
                  onDelete={deleteMeeting}
                  onUpdateHeldDate={handleMeetingHeldDateUpdate}
                  onUpdateConfirmedDate={handleMeetingConfirmedDateUpdate}
                  onUpdateMeeting={updateMeeting}
                />

                {showAddMeeting && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                      <h2 className="text-xl font-semibold mb-4">
                        {editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
                      </h2>
                      {addMeetingError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700">{addMeetingError}</p>
                        </div>
                      )}
                      <form onSubmit={handleAddMeeting} className="space-y-4">
                        <div>
                          <label
                            htmlFor="contactFullName"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Contact Full Name
                          </label>
                          <input
                            id="contactFullName"
                            type="text"
                            required
                            value={contactFullName}
                            onChange={(e) => setContactFullName(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="contactEmail"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Contact Email
                          </label>
                          <input
                            id="contactEmail"
                            type="email"
                            required
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="contactPhone"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Contact Phone Number
                          </label>
                          <input
                            id="contactPhone"
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="(123) 456-7890"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="meetingDate"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Meeting Date (EST)
                          </label>
                          <input
                            type="date"
                            id="meetingDate"
                            required
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            min={todayDateString}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor="meetingTime"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Meeting Time (EST)
                            </label>
                            <div className="text-xs text-indigo-600 font-medium flex items-center">
                              <Info className="w-3 h-3 mr-1" />
                              All times in EST
                            </div>
                          </div>
                          <TimeSelector
                            value={meetingTime}
                            onChange={setMeetingTime}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddMeeting(false);
                              setEditingMeeting(null);
                              setAddMeetingError(null);
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          >
                            {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </>
            }
          />
          <Route path="/history" element={<MeetingsHistory meetings={meetings} loading={meetingsLoading} error={meetingsError} onUpdateHeldDate={handleMeetingHeldDateUpdate} onUpdateConfirmedDate={handleMeetingConfirmedDateUpdate} />} />
          <Route path="/commissions" element={<Commissions sdrId={sdrId || ''} />} />
        </Routes>
      </main>
    </div>
  );
}