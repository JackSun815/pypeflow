import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useMeetings } from '../hooks/useMeetings';
import { supabasePublic } from '../lib/supabase';
import { AgencyProvider } from '../contexts/AgencyContext';
import ClientCard from '../components/ClientCard';
import MeetingsList from '../components/MeetingsList';
import DashboardMetrics from '../components/DashboardMetrics';
import MeetingsHistory from './MeetingsHistory';
import Commissions from './Commissions';
import { AlertCircle, Calendar, DollarSign, History, Info, Rocket, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import TimeSelector from '../components/TimeSelector';
import UnifiedMeetingLists from '../components/UnifiedMeetingLists';
import CalendarView from '../components/CalendarView';
import type { Meeting } from '../types/database';

// Add custom CSS for flow animation
const flowStyles = `
  .flow-animation {
    animation: flowPulse 0.6s ease-in-out;
  }
  
  @keyframes flowPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  .flow-particle {
    animation: flowFloat 2s ease-out forwards;
  }
  
  @keyframes flowFloat {
    0% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(var(--flow-x, 100px), var(--flow-y, -100px)) scale(0);
      opacity: 0;
    }
  }
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = flowStyles;
  document.head.appendChild(styleElement);
}
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

function SDRDashboardContent() {
  const { token } = useParams();
  const location = useLocation();
  const [sdrId, setSdrId] = useState<string | null>(null);
  const [sdrName, setSdrName] = useState<string | null>(null);
  const [sdrAgencyId, setSdrAgencyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [addMeetingError, setAddMeetingError] = useState<string | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<string | null>(null);
  // Add Meeting Modal State
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [bookedDate, setBookedDate] = useState(''); // Date the meeting was booked/created
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
  const [prospectTimezone, setProspectTimezone] = useState('America/New_York'); // Default to EST
  const [allSDRs, setAllSDRs] = useState<{ id: string; full_name: string | null }[]>([]);
  
  // Theme and chart visibility settings (SDR-specific)
  const [darkTheme, setDarkTheme] = useState(() => {
    if (!sdrId) return false;
    const saved = localStorage.getItem(`sdrDashboardTheme_${sdrId}`);
    return saved === 'dark';
  });
  const [chartVisibility, setChartVisibility] = useState(() => {
    if (!sdrId) return { clientPerformance: true, progressChart: true, meetingsBreakdown: true };
    const saved = localStorage.getItem(`sdrChartVisibility_${sdrId}`);
    return saved ? JSON.parse(saved) : {
      clientPerformance: true,
      progressChart: true,
      meetingsBreakdown: true
    };
  });
  
  // Show inactive assignments toggle (SDR-specific)
  const [showInactiveAssignments, setShowInactiveAssignments] = useState(() => {
    if (!sdrId) return false;
    const saved = localStorage.getItem(`sdrShowInactive_${sdrId}`);
    return saved === 'true';
  });

  // Save theme preference (SDR-specific)
  useEffect(() => {
    if (sdrId) {
      localStorage.setItem(`sdrDashboardTheme_${sdrId}`, darkTheme ? 'dark' : 'light');
    }
  }, [darkTheme, sdrId]);

  // Save chart visibility preferences (SDR-specific)
  useEffect(() => {
    if (sdrId) {
      localStorage.setItem(`sdrChartVisibility_${sdrId}`, JSON.stringify(chartVisibility));
    }
  }, [chartVisibility, sdrId]);

  // Save show inactive preference (SDR-specific)
  useEffect(() => {
    if (sdrId) {
      localStorage.setItem(`sdrShowInactive_${sdrId}`, showInactiveAssignments.toString());
    }
  }, [showInactiveAssignments, sdrId]);

  useEffect(() => {
    function isValidBase64(str: string) {
      try {
        // atob throws if not valid base64
        return btoa(atob(str)) === str;
      } catch (err) {
        return false;
      }
    }

    async function validateToken() {
      if (!token || typeof token !== 'string' || !isValidBase64(token)) {
        setError('No or invalid access token provided');
        setSdrId(null);
        setSdrName(null);
        return;
      }

      let decodedToken: any;
      try {
        decodedToken = JSON.parse(atob(token));
      } catch (err) {
        setError('Malformed access token');
        setSdrId(null);
        setSdrName(null);
        return;
      }

      if (
        !decodedToken.id ||
        !decodedToken.timestamp ||
        decodedToken.type !== 'sdr_access'
      ) {
        setError('Invalid access token structure');
        setSdrId(null);
        setSdrName(null);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${decodedToken.id}&role=eq.sdr&active=eq.true&select=id,full_name,agency_id`, {
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

        console.log('🔍 SDR Profile loaded:', sdrProfile);
        setSdrId(decodedToken.id);
        setSdrName(sdrProfile.full_name);
        setSdrAgencyId(sdrProfile.agency_id);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid or expired access token');
        setSdrId(null);
        setSdrName(null);
        setSdrAgencyId(null);
      }
    }

    validateToken();
  }, [token]);

  useEffect(() => {
    // Fetch all SDRs for color coding and name mapping
    async function fetchAllSDRs() {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?role=eq.sdr&active=eq.true&select=id,full_name`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        });
        if (!response.ok) return;
        const sdrs = await response.json();
        setAllSDRs(sdrs);
      } catch {}
    }
    fetchAllSDRs();
  }, []);

  // Always call hooks at the top level
  const meetingsHook = useMeetings(sdrId, supabasePublic);
  const clientsHook = useClients(sdrId, supabasePublic);

  // Destructure safely
  const meetings = meetingsHook?.meetings || [];
  const loading = meetingsHook?.loading || false;
  const meetingsError = meetingsHook?.error || null;
  const addMeeting = meetingsHook?.addMeeting;
  const updateMeeting = meetingsHook?.updateMeeting;
  const updateMeetingHeldDate = meetingsHook?.updateMeetingHeldDate;
  const updateMeetingConfirmedDate = meetingsHook?.updateMeetingConfirmedDate;
  const deleteMeeting = meetingsHook?.deleteMeeting;
  const fetchMeetings = meetingsHook?.fetchMeetings;

  const clients = clientsHook?.clients || [];
  const clientsLoading = clientsHook?.loading || false;
  const clientsError = clientsHook?.error || null;
  const totalMeetingGoal = clientsHook?.totalMeetingGoal || 0;
  const fetchClients = clientsHook?.fetchClients;


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
  const nowDate = new Date();

  const pendingMeetings = meetings.filter(
    meeting => meeting.status === 'pending' && !meeting.no_show && !meeting.no_longer_interested && (meeting.icp_status || 'pending') !== 'denied' && new Date(meeting.scheduled_date) >= nowDate
  ).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  // Past Due Pending: confirmed or pending, not held, not no_show, not no_longer_interested, scheduled_date < now
  const pastDuePendingMeetings = meetings.filter(
    meeting =>
      (meeting.status === 'confirmed' || meeting.status === 'pending') &&
      !meeting.held_at &&
      !meeting.no_show &&
      !meeting.no_longer_interested &&
      (meeting.icp_status || 'pending') !== 'denied' &&
      new Date(meeting.scheduled_date) < nowDate
  ).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  // Confirmed Meetings: confirmed, not held, not no_show, not no_longer_interested, scheduled_date >= now
  const confirmedMeetings = meetings.filter(
    meeting =>
      meeting.status === 'confirmed' &&
      !meeting.held_at &&
      !meeting.no_show &&
      !meeting.no_longer_interested &&
      new Date(meeting.scheduled_date) >= nowDate
  ).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const heldMeetings = meetings.filter(
    meeting => 
      meeting.status === 'confirmed' && 
      meeting.held_at && 
      !meeting.no_show &&
      !meeting.no_longer_interested &&
      (meeting.icp_status || 'pending') !== 'denied'
  ).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  const noShowMeetings = meetings.filter(
    meeting => meeting.no_show && !meeting.no_longer_interested && (meeting.icp_status || 'pending') !== 'denied'
  ).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  const notIcpQualifiedMeetings = meetings.filter(
    meeting => (meeting.icp_status || 'pending') === 'denied'
  ).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  const noLongerInterestedMeetings = meetings.filter(
    meeting => meeting.no_longer_interested && (meeting.icp_status || 'pending') !== 'denied'
  ).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());


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

  // Removed conflicting Supabase auth check - SDR dashboard uses token-based authentication

  // Debug: Show SDR ID and decoded token in dev mode
  const isDev = import.meta.env.MODE === 'development';
  let decodedTokenDebug: any = null;
  if (isDev && token) {
    try {
      decodedTokenDebug = JSON.parse(atob(token));
    } catch {}
  }

  // Debug: Show environment info in development
  useEffect(() => {
    if (isDev) {
      console.log('🔧 Environment Debug:');
      console.log('Mode:', import.meta.env.MODE);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase Anon Key (first 10 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) + '...');
      console.log('Token:', token);
      console.log('Decoded Token:', decodedTokenDebug);
      console.log('SDR ID:', sdrId);
      console.log('SDR Name:', sdrName);
    }
  }, [isDev, token, sdrId, sdrName]);

  const findMeeting = (meetingId: string) => {
    return meetings.find(m => m.id === meetingId);
  };

  const handleEditMeeting = (meeting: Meeting) => { 
    console.log('Editing meeting:', meeting.id);
    setEditingMeeting(meeting.id);
  };
  async function handleAddMeeting(e: React.FormEvent) {
  e.preventDefault();
  if (!selectedClientId || !meetingDate || !sdrId || !contactFullName || !contactEmail || !bookedDate) {
    setAddMeetingError('Please fill all required fields');
    return;
  }

  try {
    const { createZonedDateTime } = await import('../utils/timeUtils');
    const scheduledDateTime = createZonedDateTime(meetingDate, meetingTime, 'America/New_York'); // Always EST
    
    // Convert bookedDate to ISO timestamp
    const bookedAtTimestamp = new Date(`${bookedDate}T00:00:00Z`).toISOString();
    
    const meetingData = {
      contact_full_name: contactFullName,
      contact_email: contactEmail,
      contact_phone: contactPhone || null,
      title: title || null,
      company: company || null,
      linkedin_page: linkedinPage || null,
      notes: notes || null,
      status: 'pending',
      timezone: prospectTimezone, // Save prospect's timezone for reference
      booked_at: bookedAtTimestamp, // Include the booking date
    };
    await addMeeting(selectedClientId, scheduledDateTime, sdrId, meetingData);
    await fetchClients(); // Refresh client stats after adding a meeting
    setShowAddMeeting(false);
    setBookedDate('');
    setMeetingDate('');
    setMeetingTime('09:00');
    setProspectTimezone('America/New_York');
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
          {isDev && decodedTokenDebug && (
            <div className="mt-4 text-xs text-gray-500 break-all">
              <div><b>Decoded Token:</b></div>
              <pre>{JSON.stringify(decodedTokenDebug, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If sdrId is not set, show loading spinner
  if (!sdrId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (clientsLoading || loading) {
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

  // Drag and drop status change handler
  const handleMeetingStatusChange = async (meetingId: string, newStatus: 'pending' | 'confirmed' | 'held' | 'no-show') => {
    try {
      const { supabase } = await import('../lib/supabase');
      const updates: any = {};
      
      if (newStatus === 'held') {
        // Mark as held
        updates.held_at = new Date().toISOString();
        updates.no_show = false;
      } else if (newStatus === 'no-show') {
        // Mark as no-show
        updates.no_show = true;
        updates.held_at = null;
      } else if (newStatus === 'confirmed') {
        // Mark as confirmed
        updates.status = 'confirmed';
        updates.confirmed_at = new Date().toISOString();
        updates.held_at = null;
        updates.no_show = false;
      } else if (newStatus === 'pending') {
        // Mark as pending
        updates.status = 'pending';
        updates.confirmed_at = null;
        updates.held_at = null;
        updates.no_show = false;
      }
      
      const { error } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', meetingId as any);
      
      if (error) throw error;
      
      // Refetch meetings and clients to update the UI immediately
      if (fetchMeetings) {
        await fetchMeetings();
      }
      if (fetchClients) {
        await fetchClients();
      }
      
      // Trigger confetti for positive actions
      if (newStatus === 'held' || newStatus === 'confirmed') {
        triggerConfetti();
      }
    } catch (error) {
      console.error('Failed to update meeting status:', error);
    }
  };

  // Handler to mark as held
  const handleMarkHeld = async (meetingId: string) => {
    try {
      await updateMeetingHeldDate(meetingId, new Date().toISOString());
    } catch (error) {
      alert('Failed to mark as held');
    }
  };

  // Handler to mark as no show
  const handleMarkNoShow = async (meetingId: string) => {
    try {
      await updateMeeting({ ...meetings.find(m => m.id === meetingId)!, no_show: true });
    } catch (error) {
      alert('Failed to mark as no show');
    }
  };

  // Map sdr_id to full_name for meetings and filter out non-ICP-qualified meetings for calendar
  const meetingsWithSDR = meetings
    .filter(m => {
      // Exclude meetings that are marked as not ICP qualified
      const icpStatus = (m as any).icp_status;
      const isNotQualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
      
      if (icpStatus) {
        console.log(`Meeting ${m.id} ICP status:`, icpStatus, 'Excluded:', isNotQualified);
      }
      
      return !isNotQualified;
    })
    .map(m => ({
      ...m,
      sdr_name: allSDRs.find(s => s.id === m.sdr_id)?.full_name || 'Unknown SDR',
    }));

  return (
    <>
    {showAddMeeting && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Add New Meeting</h2>
          <form onSubmit={handleAddMeeting} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Booked Date 
              </label>
              <input
                type="date"
                value={bookedDate}
                onChange={(e) => setBookedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Prospect's Timezone</label>
              <select
                value={prospectTimezone}
                onChange={e => setProspectTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="America/New_York">EST (Eastern)</option>
                <option value="America/Chicago">CST (Central)</option>
                <option value="America/Denver">MST (Mountain)</option>
                <option value="America/Los_Angeles">PST (Pacific)</option>
                <option value="America/Phoenix">MST (Arizona)</option>
                <option value="America/Anchorage">AKST (Alaska)</option>
                <option value="Pacific/Honolulu">HST (Hawaii)</option>
              </select>
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
    <div className={`min-h-screen transition-colors duration-300 ${darkTheme ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50'}`}>
      <header className={`shadow-lg border-b relative transition-colors duration-300 ${darkTheme ? 'bg-gradient-to-r from-slate-800/95 via-blue-900/95 to-slate-800/95 border-blue-800/50 backdrop-blur-sm' : 'bg-gradient-to-r from-white via-blue-50/30 to-white border-blue-100'}`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/20 to-transparent"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-4 left-8 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="absolute top-8 right-12 w-1 h-1 bg-cyan-400 rounded-full animate-pulse delay-300"></div>
          <div className="absolute top-12 left-1/4 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse delay-700"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                <h1 
                  className="text-3xl font-bold cursor-pointer group transition-all duration-300 hover:scale-105 relative z-10"
                  onClick={() => {
                    // Easter egg: Flow effect animation
                    const logo = document.querySelector('.pypeflow-logo-sdr');
                    if (logo) {
                      // Add flow animation class
                      logo.classList.add('flow-animation');
                      
                      // Create flowing particles effect
                      for (let i = 0; i < 8; i++) {
                        setTimeout(() => {
                          const particle = document.createElement('div');
                          particle.className = 'flow-particle';
                          particle.style.cssText = `
                            position: absolute;
                            width: 4px;
                            height: 4px;
                            background: linear-gradient(45deg, #3b82f6, #06b6d4);
                            border-radius: 50%;
                            pointer-events: none;
                            z-index: 10;
                          `;
                          
                          // Position particles around the logo
                          const rect = logo.getBoundingClientRect();
                          const startX = rect.left + Math.random() * rect.width;
                          const startY = rect.top + Math.random() * rect.height;
                          
                          particle.style.left = startX + 'px';
                          particle.style.top = startY + 'px';
                          
                          document.body.appendChild(particle);
                          
                          // Animate particle flow
                          const animation = particle.animate([
                            { 
                              transform: 'translate(0, 0) scale(1)',
                              opacity: 1
                            },
                            { 
                              transform: `translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) scale(0)`,
                              opacity: 0
                            }
                          ], {
                            duration: 2000,
                            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                          });
                          
                          animation.onfinish = () => {
                            particle.remove();
                          };
                        }, i * 100);
                      }
                      
                      // Remove animation class after effect
                      setTimeout(() => {
                        logo.classList.remove('flow-animation');
                      }, 3000);
                    }
                  }}
                  title="🌊 Click for a flow effect!"
                >
                  <span className="pypeflow-logo-sdr relative">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">Pype</span>
                    <span className="bg-gradient-to-r from-cyan-600 to-teal-500 bg-clip-text text-transparent">Flow</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  </span>
                </h1>
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-px bg-gradient-to-b from-blue-300 to-blue-500"></div>
                  <div className="flex flex-col">
                    <p className={`text-lg font-semibold transition-colors ${darkTheme ? 'text-blue-100' : 'text-gray-800'}`}>SDR Dashboard</p>
                    <p className={`text-sm font-medium transition-colors ${darkTheme ? 'text-blue-200/80' : 'text-gray-500'}`}>{currentMonth}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-100 to-cyan-100 px-4 py-2 rounded-xl border border-blue-200"
                  onClick={() => {
                    // Easter egg: confetti and rocket animation
                    confetti({
                      particleCount: 100,
                      spread: 70,
                      origin: { y: 0.6 }
                    });
                    
                    // Add a subtle bounce effect to the rocket
                    const rocket = document.querySelector('.rocket-easter-egg-sdr');
                    if (rocket) {
                      rocket.classList.add('animate-bounce');
                      setTimeout(() => {
                        rocket.classList.remove('animate-bounce');
                      }, 1000);
                    }
                  }}
                  title="🎉 Click for a surprise!"
                >
                  <span className="text-sm font-semibold text-blue-700 group-hover:text-blue-800 transition-colors">{sdrName}</span>
                  <Rocket className="w-4 h-4 text-blue-600 group-hover:text-blue-700 transition-colors rocket-easter-egg-sdr" />
                </div>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform translate-y-0">
                  <div className="py-2">
                    {/* Theme Toggle */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Theme</span>
                        <button
                          onClick={() => setDarkTheme(!darkTheme)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          {darkTheme ? (
                            <>
                              <Moon className="w-4 h-4 text-gray-700" />
                              <span className="text-sm text-gray-700">Dark</span>
                            </>
                          ) : (
                            <>
                              <Sun className="w-4 h-4 text-gray-700" />
                              <span className="text-sm text-gray-700">Light</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Chart Visibility Toggles */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Chart Visibility</div>
                      
                      <button
                        onClick={() => setChartVisibility((prev: any) => ({ ...prev, clientPerformance: !prev.clientPerformance }))}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mb-1"
                      >
                        <span>Client Performance</span>
                        {chartVisibility.clientPerformance ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => setChartVisibility((prev: any) => ({ ...prev, progressChart: !prev.progressChart }))}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mb-1"
                      >
                        <span>Progress Chart</span>
                        {chartVisibility.progressChart ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => setChartVisibility((prev: any) => ({ ...prev, meetingsBreakdown: !prev.meetingsBreakdown }))}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <span>Meetings Breakdown</span>
                        {chartVisibility.meetingsBreakdown ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    {/* Inactive Assignments Toggle */}
                    <div className="px-4 py-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Display Options</div>
                      
                      <button
                        onClick={() => setShowInactiveAssignments(!showInactiveAssignments)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Show or hide clients that were removed from this month. Their meetings are still preserved."
                      >
                        <span>Show Inactive Clients</span>
                        {showInactiveAssignments ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <Link
              to=""
              className={`${
                location.pathname === `/dashboard/sdr/${token}`
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 transition-colors ${location.pathname === `/dashboard/sdr/${token}` ? '' : 'group-hover:text-indigo-500'}`} />
                Dashboard
              </span>
            </Link>
            <Link
              to="history"
              className={`${
                location.pathname === `/dashboard/sdr/${token}/history`
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <History className={`w-4 h-4 transition-colors ${location.pathname === `/dashboard/sdr/${token}/history` ? '' : 'group-hover:text-green-500'}`} />
                Meeting History
              </span>
            </Link>
            <Link
              to="commissions"
              className={`${
                location.pathname === `/dashboard/sdr/${token}/commissions`
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <DollarSign className={`w-4 h-4 transition-colors ${location.pathname === `/dashboard/sdr/${token}/commissions` ? '' : 'group-hover:text-emerald-500'}`} />
                Commissions
              </span>
            </Link>
            <Link
              to="calendar"
              className={`${
                location.pathname === `/dashboard/sdr/${token}/calendar`
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 transition-colors ${location.pathname === `/dashboard/sdr/${token}/calendar` ? '' : 'group-hover:text-purple-500'}`} />
                Calendar
              </span>
            </Link>
          </nav>
        </div>
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
                // Calculate targets from clients (which are already assignment targets from useClients hook)
                const totalSetTarget = clients.reduce((sum, client) => sum + (client.monthly_set_target || 0), 0);
                const totalHeldTarget = clients.reduce((sum, client) => sum + (client.monthly_hold_target || 0), 0);
                
                const now = new Date();
                const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
                const nextMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
                
                // Meetings SET: Filter by created_at (when SDR booked it) AND exclude non-ICP-qualified
                const monthlyMeetingsSet = meetings.filter(meeting => {
                  const createdDate = new Date(meeting.created_at);
                  const isInMonth = createdDate >= monthStart && createdDate < nextMonthStart;
                  
                  // Exclude non-ICP-qualified meetings
                  const icpStatus = (meeting as any).icp_status;
                  const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
                  
                  return isInMonth && !isICPDisqualified;
                });

                // Meetings HELD: Filter by scheduled_date (month it was scheduled for) AND exclude non-ICP-qualified
                const monthlyMeetingsHeld = meetings.filter(meeting => {
                  const scheduledDate = new Date(meeting.scheduled_date);
                  const isInMonth = scheduledDate >= monthStart && scheduledDate < nextMonthStart;
                  
                  // Must be actually held
                  const isHeld = meeting.held_at !== null && !meeting.no_show;
                  
                  // Exclude non-ICP-qualified meetings
                  const icpStatus = (meeting as any).icp_status;
                  const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
                  
                  return isInMonth && isHeld && !isICPDisqualified;
                });


                const totalMeetingsSet = monthlyMeetingsSet.length;
                const totalMeetingsHeld = monthlyMeetingsHeld.length;
                const totalNoShowMeetings = monthlyMeetingsSet.filter(m => m.no_show).length;
                const totalPendingMeetings = monthlyMeetingsSet.filter(m => m.status === 'pending' && !m.no_show).length;

                return {
                  totalSetTarget,
                  totalHeldTarget,
                  totalMeetingsSet,
                  totalMeetingsHeld,
                  totalPendingMeetings,
                  totalNoShowMeetings
                };
              };

            const metrics = calculateMetrics();

                return (
                  <>
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
                        meetings={meetings}
                      />
                    </div>
                  </>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {(() => {
                  // Filter clients based on inactive toggle
                  const activeClients = clients.filter((c: any) => c.is_active !== false);
                  const inactiveClients = clients.filter((c: any) => c.is_active === false);
                  const displayClients = showInactiveAssignments ? clients : activeClients;
                  
                  
                  return (
                    <>
                      {/* Active Clients */}
                      {activeClients.map((client: any) => (
                        <ClientCard
                          key={client.id}
                          name={client.name}
                          monthly_set_target={client.monthly_set_target}
                          monthly_hold_target={client.monthly_hold_target}
                          confirmedMeetings={client.confirmedMeetings}
                          pendingMeetings={client.pendingMeetings}
                          heldMeetings={client.heldMeetings}
                          todaysMeetings={client.todaysMeetings}
                          isInactive={false}
                          onAddMeeting={() => {
                            setSelectedClientId(client.id);
                            // Set booked date to today by default
                            const today = new Date().toISOString().split('T')[0];
                            setBookedDate(today);
                            setShowAddMeeting(true);
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
                      
                      {/* Inactive Clients - Only shown if toggle is on */}
                      {showInactiveAssignments && inactiveClients.map((client: any) => (
                        <ClientCard
                          key={client.id}
                          name={client.name}
                          monthly_set_target={client.monthly_set_target}
                          monthly_hold_target={client.monthly_hold_target}
                          confirmedMeetings={client.confirmedMeetings}
                          pendingMeetings={client.pendingMeetings}
                          heldMeetings={client.heldMeetings}
                          todaysMeetings={client.todaysMeetings}
                          isInactive={true}
                          deactivatedAt={client.deactivated_at}
                          onAddMeeting={() => {
                            setSelectedClientId(client.id);
                            // Set booked date to today by default
                            const today = new Date().toISOString().split('T')[0];
                            setBookedDate(today);
                            setShowAddMeeting(true);
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
                      
                      {displayClients.length === 0 && (
                        <div className={`col-span-full p-6 rounded-lg shadow-md text-center transition-colors ${darkTheme ? 'bg-slate-800/80 text-blue-200 border border-blue-800/30' : 'bg-white text-gray-500'}`}>
                          <p>No clients assigned for this month</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Remove the Today's Meetings section below */}
              {/*
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
              */}

              <UnifiedMeetingLists
                pendingMeetings={pendingMeetings}
                confirmedMeetings={confirmedMeetings}
                heldMeetings={heldMeetings}
                noShowMeetings={noShowMeetings}
                notIcpQualifiedMeetings={notIcpQualifiedMeetings}
                noLongerInterestedMeetings={noLongerInterestedMeetings}
                pastDuePendingMeetings={pastDuePendingMeetings}
                editable={true}
                editingMeetingId={editingMeeting}
                onEdit={handleEditMeeting}
                onDelete={deleteMeeting}
                onSave={handleSaveMeeting}
                onCancel={handleCancelEdit}
                onUpdateHeldDate={handleMeetingHeldDateUpdate}
                onUpdateConfirmedDate={handleMeetingConfirmedDateUpdate}
                onMeetingStatusChange={handleMeetingStatusChange}
              />

              {/* Data Visualizations - Moved to bottom */}
              {(() => {
                const calculateMetrics = () => {
                  const totalSetTarget = clients.reduce((sum, client) => sum + (client.monthly_set_target || 0), 0);
                  const totalHeldTarget = clients.reduce((sum, client) => sum + (client.monthly_hold_target || 0), 0);
                  
                  const now = new Date();
                  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
                  const nextMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
                  
                  // Meetings SET: Filter by created_at (when SDR booked it)
                  const monthlyMeetingsSet = meetings.filter(meeting => {
                    const createdDate = new Date(meeting.created_at);
                    const isInMonth = createdDate >= monthStart && createdDate < nextMonthStart;
                    
                    // Exclude non-ICP-qualified meetings
                    const icpStatus = (meeting as any).icp_status;
                    const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
                    
                    return isInMonth && !isICPDisqualified;
                  });

                  // Meetings HELD: Filter by scheduled_date (month it was scheduled for)
                  const monthlyMeetingsHeld = meetings.filter(meeting => {
                    const scheduledDate = new Date(meeting.scheduled_date);
                    const isInMonth = scheduledDate >= monthStart && scheduledDate < nextMonthStart;
                    
                    // Must be actually held
                    const isHeld = meeting.held_at !== null && !meeting.no_show;
                    
                    // Exclude non-ICP-qualified meetings
                    const icpStatus = (meeting as any).icp_status;
                    const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
                    
                    return isInMonth && isHeld && !isICPDisqualified;
                  });

                  const totalMeetingsSet = monthlyMeetingsSet.length;
                  const totalMeetingsHeld = monthlyMeetingsHeld.length;
                  const totalNoShowMeetings = monthlyMeetingsSet.filter(m => m.no_show).length;
                  const totalPendingMeetings = monthlyMeetingsSet.filter(m => m.status === 'pending' && !m.no_show).length;

                  return {
                    totalSetTarget,
                    totalHeldTarget,
                    totalMeetingsSet,
                    totalMeetingsHeld,
                    totalPendingMeetings,
                    totalNoShowMeetings
                  };
                };

                const metrics = calculateMetrics();

                return (
                  <>
                    {chartVisibility.progressChart && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-8">
                        {/* Monthly Performance Chart */}
                        <div className={`rounded-lg shadow-md p-6 transition-colors ${darkTheme ? 'bg-slate-800/80 border border-blue-800/30' : 'bg-white'}`}>
                            <h3 className={`text-lg font-semibold mb-4 transition-colors ${darkTheme ? 'text-blue-100' : 'text-gray-900'}`}>Monthly Performance</h3>
                          <div className="h-64">
                              <Bar
                              data={{
                                labels: ['Set Meetings', 'Held Meetings'],
                                datasets: [
                                  {
                                    label: 'Target',
                                    data: [metrics.totalSetTarget, metrics.totalHeldTarget],
                                    backgroundColor: ['rgba(59, 130, 246, 0.3)', 'rgba(34, 197, 94, 0.3)'],
                                    borderColor: ['rgba(59, 130, 246, 1)', 'rgba(34, 197, 94, 1)'],
                                    borderWidth: 2,
                                  },
                                  {
                                    label: 'Actual',
                                    data: [metrics.totalMeetingsSet, metrics.totalMeetingsHeld],
                                    backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)'],
                                    borderColor: ['rgba(59, 130, 246, 1)', 'rgba(34, 197, 94, 1)'],
                                    borderWidth: 2,
                                  },
                                ],
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'top' as const,
                                    labels: {
                                      color: darkTheme ? '#E0E7FF' : '#374151'
                                    }
                                  },
                                  title: {
                                    display: false,
                                  },
                                },
                                scales: {
                                  x: {
                                    ticks: { color: darkTheme ? '#93C5FD' : '#6B7280' },
                                    grid: { color: darkTheme ? '#1E3A8A20' : '#E5E7EB' }
                                  },
                                  y: {
                                    beginAtZero: true,
                                    ticks: { color: darkTheme ? '#93C5FD' : '#6B7280' },
                                    grid: { color: darkTheme ? '#1E3A8A20' : '#E5E7EB' }
                                  },
                                },
                              }}
                            />
                          </div>
                        </div>

                        {/* Meeting Status Distribution */}
                        {chartVisibility.meetingsBreakdown && (
                          <div className={`rounded-lg shadow-md p-6 transition-colors ${darkTheme ? 'bg-slate-800/80 border border-blue-800/30' : 'bg-white'}`}>
                            <h3 className={`text-lg font-semibold mb-4 transition-colors ${darkTheme ? 'text-blue-100' : 'text-gray-900'}`}>Meeting Status Distribution</h3>
                            <div className="h-64">
                              <Doughnut
                            data={{
                              labels: ['Held', 'Pending', 'No-Show'],
                              datasets: [
                                {
                                  data: [metrics.totalMeetingsHeld, metrics.totalPendingMeetings, metrics.totalNoShowMeetings],
                                  backgroundColor: [
                                    'rgba(34, 197, 94, 0.8)',
                                    'rgba(251, 191, 36, 0.8)',
                                    'rgba(239, 68, 68, 0.8)',
                                  ],
                                  borderColor: [
                                    'rgba(34, 197, 94, 1)',
                                    'rgba(251, 191, 36, 1)',
                                    'rgba(239, 68, 68, 1)',
                                  ],
                                  borderWidth: 2,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'bottom' as const,
                                  labels: {
                                    color: darkTheme ? '#E0E7FF' : '#374151'
                                  }
                                },
                                title: {
                                  display: false,
                                },
                              },
                            }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Client Performance Chart */}
                    {clients.length > 0 && chartVisibility.clientPerformance && (
                      <div className={`rounded-lg shadow-md p-6 mb-8 transition-colors ${darkTheme ? 'bg-slate-800/80 border border-blue-800/30' : 'bg-white'}`}>
                        <h3 className={`text-lg font-semibold mb-4 transition-colors ${darkTheme ? 'text-blue-100' : 'text-gray-900'}`}>Client Performance</h3>
                        <div className="h-80">
                          <Bar
                            data={{
                              labels: clients.map(client => client.name),
                              datasets: [
                                {
                                  label: 'Set Target',
                                  data: clients.map(client => client.monthly_set_target || 0),
                                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                  borderColor: 'rgba(59, 130, 246, 1)',
                                  borderWidth: 2,
                                },
                                {
                                  label: 'Set Actual',
                                  data: clients.map(client => {
                                    const now = new Date();
                                    const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
                                    const nextMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
                                    // Count by created_at for "set"
                                    return meetings.filter(meeting => {
                                      const createdDate = new Date(meeting.created_at);
                                      const isInMonth = createdDate >= monthStart && createdDate < nextMonthStart;
                                      
                                      // Exclude non-ICP-qualified meetings
                                      const icpStatus = (meeting as any).icp_status;
                                      const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
                                      
                                      return isInMonth && !isICPDisqualified && meeting.client_id === client.id;
                                    }).length;
                                  }),
                                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                  borderColor: 'rgba(59, 130, 246, 1)',
                                  borderWidth: 2,
                                },
                                {
                                  label: 'Held Target',
                                  data: clients.map(client => client.monthly_hold_target || 0),
                                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                  borderColor: 'rgba(34, 197, 94, 1)',
                                  borderWidth: 2,
                                },
                                {
                                  label: 'Held Actual',
                                  data: clients.map(client => {
                                    const now = new Date();
                                    const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
                                    const nextMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
                                    // Count by scheduled_date for "held"
                                    return meetings.filter(meeting => {
                                      const scheduledDate = new Date(meeting.scheduled_date);
                                      const isInMonth = scheduledDate >= monthStart && scheduledDate < nextMonthStart;
                                      
                                      // Exclude non-ICP-qualified meetings
                                      const icpStatus = (meeting as any).icp_status;
                                      const isICPDisqualified = icpStatus === 'not_qualified' || icpStatus === 'rejected' || icpStatus === 'denied';
                                      
                                      return isInMonth && !isICPDisqualified && 
                                             meeting.client_id === client.id && 
                                             meeting.held_at !== null && 
                                             !meeting.no_show;
                                    }).length;
                                  }),
                                  backgroundColor: 'rgba(34, 197, 94, 0.8)',
                                  borderColor: 'rgba(34, 197, 94, 1)',
                                  borderWidth: 2,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top' as const,
                                  labels: {
                                    color: darkTheme ? '#E0E7FF' : '#374151'
                                  }
                                },
                                title: {
                                  display: false,
                                },
                              },
                              scales: {
                                x: {
                                  ticks: { color: darkTheme ? '#93C5FD' : '#6B7280' },
                                  grid: { color: darkTheme ? '#1E3A8A20' : '#E5E7EB' }
                                },
                                y: {
                                  beginAtZero: true,
                                  ticks: { color: darkTheme ? '#93C5FD' : '#6B7280' },
                                  grid: { color: darkTheme ? '#1E3A8A20' : '#E5E7EB' }
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          }
        />
        <Route 
          path="history" 
          element={
            <MeetingsHistory 
              meetings={meetings} 
              loading={loading} 
              error={meetingsError} 
              onUpdateHeldDate={handleMeetingHeldDateUpdate} 
              onUpdateConfirmedDate={handleMeetingConfirmedDateUpdate} 
              sdrId={sdrId || ''}
            />
          } 
        />
        <Route path="commissions" element={<Commissions sdrId={sdrId || ''} />} />
        <Route path="calendar" element={<CalendarView meetings={meetingsWithSDR} colorByStatus={true} />} />
      </Routes>
    </main>
  </div>
  </>
);
}export default function SDRDashboard() {
  return (
    <AgencyProvider>
      <SDRDashboardContent />
    </AgencyProvider>
  );
}
