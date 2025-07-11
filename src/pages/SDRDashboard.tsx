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
import CalendarView from '../components/CalendarView';
import type { Meeting } from '../types/database';

export default function SDRDashboard() {
  const { token } = useParams();
  const location = useLocation();
  const [sdrId, setSdrId] = useState<string | null>(null);
  const [sdrName, setSdrName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [addMeetingError, setAddMeetingError] = useState<string | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<string | null>(null);
  // Add Meeting Modal State
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('09:00');
  const [contactFullName, setContactFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  // New fields for meeting
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [linkedinPage, setLinkedinPage] = useState('');
  const [notes, setNotes] = useState('');

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

  const handleSaveMeeting = async (updatedMeeting: Meeting) => {
  console.log('Saving meeting:', updatedMeeting);
  try {
    await updateMeeting(updatedMeeting);
    setEditingMeeting(null);
  } catch (error) {
    console.error('Failed to update meeting:', error);
  }
};

  const handleCancelEdit = () => {
    setEditingMeeting(null);
  };
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const pendingMeetings = meetings.filter(
    meeting => meeting.status === 'pending' && !meeting.no_show
  ).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const confirmedMeetings = meetings.filter(
    meeting => meeting.status === 'confirmed' && !meeting.held_at
  ).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const completedMeetings = meetings.filter(
    meeting => 
      meeting.status === 'confirmed' && 
      meeting.held_at && 
      !meeting.no_show
  ).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  const noShowMeetings = meetings.filter(
    meeting => meeting.no_show
  ).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  const heldMeetings = meetings.filter(
    meeting => 
      meeting.status === 'confirmed' &&
      !meeting.no_show &&
      new Date(meeting.scheduled_date) < new Date() &&
      new Date(meeting.scheduled_date) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
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

  const handleEditMeeting = (meeting: Meeting) => { 
    console.log('Editing meeting:', meeting.id);
    setEditingMeeting(meeting.id);
  };
  async function handleAddMeeting(e: React.FormEvent) {
  e.preventDefault();
  if (!selectedClientId || !meetingDate || !sdrId || !contactFullName || !contactEmail) {
    setAddMeetingError('Please fill all required fields');
    return;
  }

  try {
    // Use the new EST datetime creation function
    const { createESTDateTime } = await import('../utils/timeUtils');
    const scheduledDateTime = createESTDateTime(meetingDate, meetingTime);
    
    // Explicitly include status: 'pending' when creating a meeting
    const meetingData = {
      contact_full_name: contactFullName,
      contact_email: contactEmail,
      contact_phone: contactPhone || null,
      title: title || null,
      company: company || null,
      linkedin_page: linkedinPage || null,
      notes: notes || null,
      status: 'pending'
    };

    await addMeeting(selectedClientId, scheduledDateTime, sdrId, meetingData);
    
    // Reset form
    setShowAddMeeting(false);
    setMeetingDate('');
    setMeetingTime('09:00');
    setSelectedClientId(null);
    setContactFullName('');
    setContactEmail('');
    setContactPhone('');
    setTitle('');
    setCompany('');
    setLinkedinPage('');
    setNotes('');
    setEditingMeeting(null);
    setAddMeetingError(null);
    
    triggerConfetti();
  } catch (error) {
    console.error('Failed to add meeting:', error);
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
    <>
    {showAddMeeting && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Add New Meeting</h2>
          <form onSubmit={handleAddMeeting} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Date</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Time</label>
              <input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Full Name</label>
              <input
                type="text"
                value={contactFullName}
                onChange={(e) => setContactFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {/* New fields below Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Page</label>
              <input
                type="text"
                value={linkedinPage}
                onChange={(e) => setLinkedinPage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
            {addMeetingError && <p className="text-red-500 text-sm">{addMeetingError}</p>}
            <div className="flex justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMeeting(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition duration-150"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
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
            <Link
              to="calendar"
              className={`text-sm font-medium ${
                location.pathname === `/dashboard/sdr/${token}/calendar`
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Calendar
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
          index
          element={
            <>
              {(() => {
              const calculateMetrics = () => {
              // Calculate targets from clients
                const totalSetTarget = clients.reduce((sum, client) => sum + (client.monthly_set_target || 0), 0);
                const totalHeldTarget = clients.reduce((sum, client) => sum + (client.monthly_hold_target || 0), 0);
                
                // Filter meetings for current month only
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                const monthlyMeetings = meetings.filter(meeting => {
                  const meetingDate = new Date(meeting.scheduled_date);
                  return meetingDate >= monthStart && meetingDate <= monthEnd;
                });

                // Sum up held meetings from all clients (excluding no-shows)
                const totalMeetingsHeld = clients.reduce((sum, client) => {
                  const clientMeetings = monthlyMeetings.filter(m => m.client_id === client.id);
                  const heldCount = clientMeetings.filter(m => 
                    m.status === 'confirmed' && 
                    !m.no_show && 
                    m.held_at !== null
                  ).length;
                  
                  console.log(`Client ${client.name}: ${heldCount} held meetings`);
                  return sum + heldCount;
                }, 0);
                
                console.log('Total held meetings calculated:', totalMeetingsHeld);
                console.log('Monthly meetings:', monthlyMeetings.length);
                console.log('Meetings with held_at:', monthlyMeetings.filter(m => m.held_at !== null).length);

                return {
                  totalSetTarget,
                  totalHeldTarget,
                  totalMeetingsSet: monthlyMeetings.filter(m => !m.no_show).length, // Exclude no-shows from set count
                  totalMeetingsHeld,
                  totalPendingMeetings: monthlyMeetings.filter(m => m.status === 'pending' && !m.no_show).length,
                  totalNoShowMeetings: monthlyMeetings.filter(m => m.no_show).length
                };
              };

            const metrics = calculateMetrics();

                return (
                  <div className="mb-8">
                    <DashboardMetrics 
                      clients={clients}
                      monthProgress={monthProgress}
                      totalMeetingGoal={totalMeetingGoal}
                      totalHeldMeetings={metrics.totalMeetingsHeld}
                      totalSetTarget={metrics.totalSetTarget}
                      totalHeldTarget={metrics.totalHeldTarget}
                      totalMeetingsSet={metrics.totalMeetingsSet}
                      totalPendingMeetings={metrics.totalPendingMeetings}
                      totalNoShowMeetings={metrics.totalNoShowMeetings}
                    />
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {clients.map((client) => (
                  <ClientCard
                    key={client.id}
                    name={client.name}
                    monthly_set_target={client.monthly_set_target}
                    monthly_hold_target={client.monthly_hold_target}
                    confirmedMeetings={client.confirmedMeetings}
                    pendingMeetings={client.pendingMeetings}
                    heldMeetings={client.heldMeetings}
                    todaysMeetings={client.todaysMeetings}
                    onAddMeeting={() => {
                      setSelectedClientId(client.id); 
                      setShowAddMeeting(true); // Show the modal
                    }}
                    onConfirmMeeting={(meetingId) => {
                      handleMeetingConfirmedDateUpdate(meetingId, todayDateString);
                    }}
                    onEditMeeting={(meeting) => {
                      setSelectedClientId(meeting.client_id);
                      handleEditMeeting(meeting);
                    }}
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
                  editable={true}
                  editingMeetingId={editingMeeting}
                  onEdit={handleEditMeeting}
                  onDelete={deleteMeeting}
                  onSave={handleSaveMeeting}
                  onCancel={handleCancelEdit}
                  onUpdateHeldDate={handleMeetingHeldDateUpdate}
                  onUpdateConfirmedDate={handleMeetingConfirmedDateUpdate}
                  showMeetingStatus={true}
                />
              </div>

              <UnifiedMeetingLists
                pendingMeetings={pendingMeetings}
                confirmedMeetings={confirmedMeetings}
                completedMeetings={completedMeetings}
                noShowMeetings={noShowMeetings}
                editable={true}
                editingMeetingId={editingMeeting}
                onEdit={handleEditMeeting}
                onDelete={deleteMeeting}
                onSave={handleSaveMeeting}
                onCancel={handleCancelEdit}
                onUpdateHeldDate={handleMeetingHeldDateUpdate}
                onUpdateConfirmedDate={handleMeetingConfirmedDateUpdate}
              />
            </>
          }
        />
        <Route 
          path="history" 
          element={
            <MeetingsHistory 
              meetings={meetings} 
              loading={meetingsLoading} 
              error={meetingsError} 
              onUpdateHeldDate={handleMeetingHeldDateUpdate} 
              onUpdateConfirmedDate={handleMeetingConfirmedDateUpdate} 
            />
          } 
        />
        <Route path="commissions" element={<Commissions sdrId={sdrId || ''} />} />
        <Route path="calendar" element={<CalendarView meetings={meetings} />} />
      </Routes>
    </main>
  </div>
  </>
);
}