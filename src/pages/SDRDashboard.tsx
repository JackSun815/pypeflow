import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useMeetings } from '../hooks/useMeetings';
import { supabasePublic } from '../lib/supabase';
import { AgencyProvider } from '../contexts/AgencyContext';
import { useDemo } from '../contexts/DemoContext';
import ClientCard from '../components/ClientCard';
import MeetingsList from '../components/MeetingsList';
import DashboardMetrics from '../components/DashboardMetrics';
import MeetingsHistory from './MeetingsHistory';
import Commissions from './Commissions';
import { AlertCircle, Calendar, DollarSign, History, Info, Rocket, Sun, Moon, Eye, EyeOff, Upload, FileSpreadsheet, X } from 'lucide-react';
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
  const { isDemoMode } = useDemo();
  const [sdrId, setSdrId] = useState<string | null>(null);
  const [sdrName, setSdrName] = useState<string | null>(null);
  const [sdrAgencyId, setSdrAgencyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Detect if we're in an iframe (demo viewer) and prevent navigation escapes
  const isInIframe = window.self !== window.top;
  const urlParams = new URLSearchParams(window.location.search);
  const isIframeDemo = isInIframe || urlParams.get('iframe') === 'true';

  useEffect(() => {
    if (isIframeDemo) {
      console.log('[SDRDashboard] Running in iframe demo mode, navigation restricted');
      // Override any attempts to navigate the parent
      if (window.top && window.top !== window.self) {
        try {
          // Prevent access to parent
          Object.defineProperty(window, 'top', {
            get: () => window.self,
            configurable: false
          });
        } catch (e) {
          // Silently fail if already defined
        }
      }
    }
  }, [isIframeDemo]);
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
  
  // Import Meetings Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  
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
    if (isDemoMode) {
      alert('Updating meetings is disabled in demo mode.');
      return;
    }
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

  // Lock "current time" for demo mode so the dashboard always shows the same sample period
  const demoNow = useMemo(
    () => (isDemoMode ? new Date('2025-11-15T12:00:00Z') : new Date()),
    [isDemoMode]
  );

  const currentMonth = demoNow.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const nowDate = demoNow;

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

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      let rows: any[] = [];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        // Parse CSV file
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          throw new Error('CSV file must have at least a header row and one data row');
        }

        // Parse header
        const headers = parseCSVLine(lines[0]);
        const headerMap: Record<string, number> = {};
        headers.forEach((header, index) => {
          const normalizedHeader = header.trim().toLowerCase().replace(/\s+/g, ' ');
          headerMap[normalizedHeader] = index;
        });

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length === 0 || values.every(v => !v.trim())) continue; // Skip empty rows
          
          const row: any = {};
          Object.keys(headerMap).forEach(key => {
            const index = headerMap[key];
            row[key] = values[index]?.trim() || '';
          });
          rows.push(row);
        }
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel file using SheetJS (xlsx)
        try {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Parse Excel with cell type detection to handle dates/times properly
          // Use raw: false to get formatted strings, but we'll also check for serial numbers
          rows = XLSX.utils.sheet_to_json(worksheet, { 
            defval: '', 
            raw: false, // Get formatted strings when possible
            dateNF: 'mm/dd/yyyy' // Date format
          });
          
          // Helper to convert Excel serial number to time string
          const convertExcelSerialToTime = (serial: number): string => {
            // Get the decimal part (time)
            const timeFraction = serial % 1;
            const totalSeconds = Math.floor(timeFraction * 86400); // 86400 seconds in a day
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            
            // Format as HH:MM AM/PM
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
            return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
          };
          
          // Also parse with raw values to detect serial numbers that weren't converted
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: true });
          
          // Merge: use formatted strings when available, but check raw values for serial numbers
          rows = rows.map((row: any, index: number) => {
            const rawRow = rawRows[index] || {};
            const convertedRow: any = {};
            
            for (const key in row) {
              const formattedValue = row[key];
              const rawValue = rawRow[key];
              
              // If formatted value looks like a serial number (numeric string), check raw value
              if (typeof rawValue === 'number' && rawValue > 0 && rawValue < 1000000) {
                // Check if it's a time serial (has significant decimal part)
                if (rawValue % 1 !== 0 && rawValue > 1) {
                  // Date + time combination - extract time part
                  convertedRow[key] = convertExcelSerialToTime(rawValue);
                } else if (rawValue < 1) {
                  // Pure time (fraction of day)
                  convertedRow[key] = convertExcelSerialToTime(rawValue);
                } else {
                  // Use formatted value (should be a date string)
                  convertedRow[key] = formattedValue;
                }
              } else {
                // Use formatted value as-is
                convertedRow[key] = formattedValue;
              }
            }
            
            return convertedRow;
          });
        } catch (err) {
          throw new Error('Failed to parse Excel file. Please check the file format or use CSV format.');
        }
      } else {
        throw new Error('Unsupported file format. Please use .csv, .xlsx, or .xls files.');
      }

      if (rows.length === 0) {
        throw new Error('No data rows found in the file.');
      }

      // Map column names (case-insensitive, flexible matching)
      const normalizeColumnName = (name: string) => {
        return name.toLowerCase()
          .replace(/[_\s]+/g, ' ')
          .trim()
          .replace(/\s+/g, ' ');
      };

      // Process each row and create meetings
      const { createZonedDateTime } = await import('../utils/timeUtils');
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

        try {
          // Map columns to meeting fields
          const getValue = (possibleNames: string[]) => {
            // First pass: exact matches
            for (const name of possibleNames) {
              const normalized = normalizeColumnName(name);
              for (const key in row) {
                const keyNormalized = normalizeColumnName(key);
                if (keyNormalized === normalized) {
                  const value = row[key];
                  return value != null ? String(value).trim() : '';
                }
              }
            }
            
            // Second pass: smart partial matches for truncated column names
            // This handles cases like "Meeting Da" (truncated) matching "Meeting Date"
            for (const name of possibleNames) {
              const normalized = normalizeColumnName(name);
              const nameWords = normalized.split(/\s+/);
              const lastWord = nameWords[nameWords.length - 1] || ''; // e.g., "date", "time", "email"
              
              for (const key in row) {
                const keyNormalized = normalizeColumnName(key);
                const keyWords = keyNormalized.split(/\s+/);
                const keyLastWord = keyWords[keyWords.length - 1] || '';
                
                // Check if key starts with name (for truncated columns)
                // AND the last words match (to distinguish "date" from "time")
                const startsWithName = keyNormalized.startsWith(normalized) || normalized.startsWith(keyNormalized);
                
                // Check if last words are compatible (e.g., "da" matches "date" but not "time")
                // If key is truncated, check if the full word starts with the truncated part
                // If full word is provided, check if it starts with the key part
                const lastWordMatch = lastWord && keyLastWord && (
                  keyLastWord === lastWord ||
                  (keyLastWord.length <= lastWord.length && lastWord.startsWith(keyLastWord)) ||
                  (lastWord.length <= keyLastWord.length && keyLastWord.startsWith(lastWord))
                );
                
                // If key is shorter (truncated), check if it's a prefix of name
                // If name is shorter, check if it's a prefix of key
                const isTruncatedMatch = keyNormalized.length < normalized.length 
                  ? normalized.startsWith(keyNormalized) && lastWordMatch
                  : keyNormalized.startsWith(normalized) && lastWordMatch;
                
                if (isTruncatedMatch || (startsWithName && lastWordMatch && nameWords.length === keyWords.length)) {
                  const value = row[key];
                  return value != null ? String(value).trim() : '';
                }
              }
            }
            
            return '';
          };

          const contactFullName = getValue(['Contact Full Name', 'Contact Name', 'Full Name', 'Name', 'Contact']);
          const contactEmail = getValue(['Contact Email', 'Email', 'Email Address']);
          const meetingDateStr = getValue(['Meeting Date', 'Date', 'Scheduled Date', 'Meeting Scheduled Date', 'Meeting Da']);
          const meetingTimeStr = getValue(['Meeting Time', 'Time', 'Scheduled Time', 'Meeting Scheduled Time', 'Meeting Tir']);
          const clientName = getValue(['Client Name', 'Client', 'Company Name']);
          const contactPhone = getValue(['Contact Phone', 'Phone', 'Phone Number']);
          const title = getValue(['Title', 'Job Title', 'Position']);
          const company = getValue(['Company', 'Company Name']);
          const linkedinPage = getValue(['LinkedIn Page', 'LinkedIn', 'LinkedIn URL', 'LinkedIn Profile', 'LinkedIn Pa']);
          const prospectTimezone = getValue(['Prospect Timezone', 'Timezone', 'Time Zone', 'Prospect Ti']) || 'America/New_York';
          const notes = getValue(['Notes', 'Note', 'Comments']);
          const bookedDateStr = getValue(['Meeting Booked Date', 'Booked Date', 'Created Date']);

          // Validate required fields (ensure they're non-empty strings)
          if (!contactFullName || !contactEmail || !meetingDateStr || !meetingTimeStr || 
              !String(contactFullName).trim() || !String(contactEmail).trim() || 
              !String(meetingDateStr).trim() || !String(meetingTimeStr).trim()) {
            errors.push(`Row ${rowNum}: Missing required fields (Contact Full Name, Email, Meeting Date, or Meeting Time)`);
            errorCount++;
            continue;
          }

          // Find client by name
          let clientId = selectedClientId;
          if (clientName && !clientId) {
            const foundClient = clients.find(c => 
              c.name.toLowerCase().trim() === clientName.toLowerCase().trim()
            );
            if (!foundClient) {
              errors.push(`Row ${rowNum}: Client "${clientName}" not found. Please select a client first or ensure the client name matches exactly.`);
              errorCount++;
              continue;
            }
            clientId = foundClient.id;
          }

          if (!clientId) {
            errors.push(`Row ${rowNum}: No client selected. Please select a client or include Client Name in the spreadsheet.`);
            errorCount++;
            continue;
          }

          // Parse meeting date and time (ensure strings)
          const meetingDateStrClean = String(meetingDateStr).trim();
          const meetingTimeStrClean = String(meetingTimeStr).trim();
          
          if (!meetingDateStrClean) {
            throw new Error(`Row ${rowNum}: Meeting Date is required.`);
          }
          
          if (!meetingTimeStrClean) {
            throw new Error(`Row ${rowNum}: Meeting Time is required.`);
          }
          
          let meetingDate: string;
          let meetingTime: string;

          // Try to parse date in various formats
          // Format 1: MM/DD/YYYY or M/D/YYYY
          let dateMatch = meetingDateStrClean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (dateMatch) {
            meetingDate = `${dateMatch[3]}-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`;
          } else {
            // Format 2: YYYY-MM-DD
            dateMatch = meetingDateStrClean.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (dateMatch) {
              meetingDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
            } else {
              // Format 3: "Fri, Nov 21, 2025" or "Friday November 21st 2025" or "November 21, 2025"
              const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
              const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
              
              let monthIndex = -1;
              let day = '';
              let year = '';
              
              // Try full month name
              for (let i = 0; i < monthNames.length; i++) {
                const regex = new RegExp(monthNames[i] + '\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})', 'i');
                const match = meetingDateStrClean.match(regex);
                if (match) {
                  monthIndex = i;
                  day = match[1];
                  year = match[2];
                  break;
                }
              }
              
              // Try abbreviated month name
              if (monthIndex === -1) {
                for (let i = 0; i < monthAbbr.length; i++) {
                  const regex = new RegExp(monthAbbr[i] + '\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})', 'i');
                  const match = meetingDateStrClean.match(regex);
                  if (match) {
                    monthIndex = i;
                    day = match[1];
                    year = match[2];
                    break;
                  }
                }
              }
              
              if (monthIndex !== -1 && day && year) {
                meetingDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${day.padStart(2, '0')}`;
              } else {
                throw new Error(`Row ${rowNum}: Unable to parse date "${meetingDateStrClean}". Supported formats: MM/DD/YYYY, YYYY-MM-DD, or "Month Day, Year"`);
              }
            }
          }

          // Parse time (handle formats like "10:00 AM EST", "10:00 AM", "10:00", etc.)
          // First check if it's an Excel serial number
          let timeStrToParse = meetingTimeStrClean;
          const excelSerialMatch = meetingTimeStrClean.match(/^(\d+\.?\d*)$/);
          if (excelSerialMatch) {
            const serialValue = parseFloat(meetingTimeStrClean);
            // Excel serial numbers for time are typically < 1 (fraction of day) or have decimal part
            if (serialValue > 0 && serialValue < 1000000) {
              // Convert Excel serial to time
              const timeFraction = serialValue % 1; // Get decimal part (time)
              const totalSeconds = Math.floor(timeFraction * 86400); // 86400 seconds in a day
              const hours = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              
              // Format as HH:MM AM/PM
              const period = hours >= 12 ? 'PM' : 'AM';
              const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
              timeStrToParse = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
            }
          }
          
          // Remove timezone indicators first
          const timeStrClean = timeStrToParse.replace(/\s*(EST|PST|CST|MST|EDT|PDT|CDT|MDT|UTC|GMT)\s*/i, '').trim();
          
          const timeMatch = timeStrClean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2];
            const ampm = timeMatch[3]?.toUpperCase();
            
            if (ampm === 'PM' && hours !== 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            
            meetingTime = `${String(hours).padStart(2, '0')}:${minutes}`;
          } else {
            // Try 24-hour format
            const time24Match = timeStrClean.match(/(\d{1,2}):(\d{2})/);
            if (time24Match) {
              meetingTime = `${time24Match[1].padStart(2, '0')}:${time24Match[2]}`;
            } else {
              throw new Error(`Row ${rowNum}: Unable to parse time "${meetingTimeStrClean}". Supported formats: "HH:MM AM/PM" or "HH:MM"`);
            }
          }

          // Create scheduled datetime
          const scheduledDateTime = createZonedDateTime(meetingDate, meetingTime, 'America/New_York');

          // Parse booked date if provided
          let bookedAtTimestamp: string | null = null;
          if (bookedDateStr) {
            const bookedDateMatch = bookedDateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})|(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (bookedDateMatch) {
              let bookedDate: string;
              if (bookedDateMatch[1]) {
                bookedDate = `${bookedDateMatch[3]}-${bookedDateMatch[1].padStart(2, '0')}-${bookedDateMatch[2].padStart(2, '0')}`;
              } else {
                bookedDate = `${bookedDateMatch[4]}-${bookedDateMatch[5].padStart(2, '0')}-${bookedDateMatch[6].padStart(2, '0')}`;
              }
              bookedAtTimestamp = new Date(`${bookedDate}T00:00:00Z`).toISOString();
            }
          } else {
            // Default to today if not provided
            bookedAtTimestamp = new Date().toISOString();
          }

          // Create meeting data (matching database schema)
          // Note: addMeeting function will add: client_id, sdr_id, scheduled_date, status, agency_id, etc.
          const meetingData = {
            contact_full_name: contactFullName,
            contact_email: contactEmail,
            contact_phone: contactPhone || null,
            title: title || null,
            company: company || null,
            linkedin_page: linkedinPage || null, // Database field uses underscore
            notes: notes || null,
            timezone: prospectTimezone || 'America/New_York',
            booked_at: bookedAtTimestamp, // timestamp with time zone
            // status, no_show, held_at are set by addMeeting function
          };

          await addMeeting(clientId, scheduledDateTime, sdrId!, meetingData);
          successCount++;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : `Row ${rowNum}: Unknown error`;
          errors.push(errorMsg);
          errorCount++;
        }
      }

      // Refresh clients after import
      await fetchClients();

      // Show results
      if (successCount > 0) {
        setImportSuccess(`Successfully imported ${successCount} meeting(s).${errorCount > 0 ? ` ${errorCount} error(s) occurred.` : ''}`);
        if (errorCount > 0 && errors.length > 0) {
          setImportError(errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ''));
        }
        triggerConfetti();
      } else {
        setImportError(`Failed to import meetings:\n${errors.slice(0, 10).join('\n')}`);
      }
    } catch (err) {
      console.error('Import error:', err);
      setImportError(err instanceof Error ? err.message : 'Failed to import meetings. Please check the file format.');
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Helper function to parse CSV line (handles quoted fields)
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentValue += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // End of field
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    // Add last field
    values.push(currentValue.trim());
    return values;
  };

  async function handleAddMeeting(e: React.FormEvent) {
    e.preventDefault();

    if (isDemoMode) {
      alert('Creating meetings is disabled in demo mode.');
      return;
    }

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

  const now = demoNow;
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
    if (isDemoMode) {
      alert('Updating meetings is disabled in demo mode.');
      return;
    }
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
    if (isDemoMode) {
      alert('Updating meetings is disabled in demo mode.');
      return;
    }
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
    if (isDemoMode) {
      alert('Updating meetings is disabled in demo mode.');
      return;
    }
    try {
      const { supabase } = await import('../lib/supabase');
      const updates: any = {};
      
      if (newStatus === 'held') {
        // Mark as held - use scheduled_date instead of current time
        const meeting = meetings.find(m => m.id === meetingId);
        if (meeting && meeting.scheduled_date) {
          updates.held_at = meeting.scheduled_date;
        } else {
          updates.held_at = new Date().toISOString();
        }
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
    if (isDemoMode) {
      alert('Updating meetings is disabled in demo mode.');
      return;
    }
    try {
      // Use scheduled_date instead of current time
      const meeting = meetings.find(m => m.id === meetingId);
      const heldDate = meeting && meeting.scheduled_date ? meeting.scheduled_date : new Date().toISOString();
      await updateMeetingHeldDate(meetingId, heldDate);
    } catch (error) {
      alert('Failed to mark as held');
    }
  };

  // Handler to mark as no show
  const handleMarkNoShow = async (meetingId: string) => {
    if (isDemoMode) {
      alert('Updating meetings is disabled in demo mode.');
      return;
    }
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
        <div className={`p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
          <h2 className={`text-xl font-bold mb-6 text-center ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>Add New Meeting</h2>
          <form onSubmit={handleAddMeeting} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>
                Meeting Booked Date 
              </label>
              <input
                type="date"
                value={bookedDate}
                onChange={(e) => setBookedDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Meeting Date</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Meeting Time</label>
              <input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Contact Full Name</label>
              <input
                type="text"
                value={contactFullName}
                onChange={(e) => setContactFullName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Contact Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
              />
            </div>
            {/* New fields below Contact Phone */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>LinkedIn Page</label>
              <input
                type="text"
                value={linkedinPage}
                onChange={(e) => setLinkedinPage(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Prospect's Timezone</label>
              <select
                value={prospectTimezone}
                onChange={e => setProspectTimezone(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
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
              <label className={`block text-sm font-medium mb-1 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139] text-slate-100' : 'border-gray-300'}`}
                rows={3}
              />
            </div>
            {addMeetingError && <p className={`text-sm ${darkTheme ? 'text-red-400' : 'text-red-500'}`}>{addMeetingError}</p>}
            <div className="flex justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMeeting(false)}
                className={`px-4 py-2 rounded-md transition duration-150 ${darkTheme ? 'bg-[#2d3139] hover:bg-[#353941] text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
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

    {/* Import Meetings Modal */}
    {showImportModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${darkTheme ? 'bg-[#232529]' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold ${darkTheme ? 'text-slate-100' : 'text-gray-900'}`}>Import Meetings from Spreadsheet</h2>
            <button
              onClick={() => {
                setShowImportModal(false);
                setImportError(null);
                setImportSuccess(null);
              }}
              className={darkTheme ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className={`text-sm mb-4 ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>
                Upload an Excel (.xlsx, .xls) or CSV file with meeting data. Each row should represent one meeting.
              </p>
              <div className={`text-xs mb-4 p-4 rounded-lg ${darkTheme ? 'bg-[#1d1f24] border border-[#2d3139] text-slate-300' : 'bg-gray-50 border border-gray-200 text-gray-600'}`}>
                <p className="font-semibold mb-2">Required columns:</p>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li><strong>Contact Full Name</strong> - Full name of the contact</li>
                  <li><strong>Contact Email</strong> - Email address</li>
                  <li><strong>Meeting Date</strong> - Format: MM/DD/YYYY, YYYY-MM-DD, or "Month Day, Year" (e.g., "November 21, 2025")</li>
                  <li><strong>Meeting Time</strong> - Format: "HH:MM AM/PM" or "HH:MM" (e.g., "10:00 AM" or "14:00")</li>
                  <li><strong>Client Name</strong> - Must match an existing client name exactly (or select a client before importing)</li>
                </ul>
                <p className="font-semibold mb-2">Optional columns:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Contact Phone</li>
                  <li>Title</li>
                  <li>Company</li>
                  <li>LinkedIn Page</li>
                  <li>Prospect Timezone (defaults to America/New_York if not provided)</li>
                  <li>Notes</li>
                  <li>Meeting Booked Date</li>
                </ul>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>
                Select File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileImport}
                disabled={importing}
                className={`block w-full text-sm ${darkTheme ? 'text-slate-300' : 'text-gray-500'} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold ${
                  darkTheme 
                    ? 'file:bg-blue-600 file:text-white file:hover:bg-blue-700' 
                    : 'file:bg-blue-50 file:text-blue-700 file:hover:bg-blue-100'
                } file:cursor-pointer cursor-pointer`}
              />
            </div>

            {importError && (
              <div className={`p-4 rounded-lg ${darkTheme ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm ${darkTheme ? 'text-red-300' : 'text-red-600'}`}>{importError}</p>
              </div>
            )}

            {importSuccess && (
              <div className={`p-4 rounded-lg ${darkTheme ? 'bg-green-900/30 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                <p className={`text-sm ${darkTheme ? 'text-green-300' : 'text-green-600'}`}>{importSuccess}</p>
              </div>
            )}

            {importing && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className={`ml-3 ${darkTheme ? 'text-slate-300' : 'text-gray-600'}`}>Importing meetings...</span>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportError(null);
                  setImportSuccess(null);
                }}
                className={`px-4 py-2 rounded-md transition-colors ${darkTheme ? 'bg-[#2d3139] hover:bg-[#353941] text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    <div className={`min-h-screen transition-colors duration-300 ${darkTheme ? 'bg-[#16191f]' : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50'}`}>
      <header className={`shadow-lg border-b relative transition-colors duration-300 ${darkTheme ? 'bg-[#1d1f24] border-[#2d3139]' : 'bg-gradient-to-r from-white via-blue-50/30 to-white border-blue-100'}`}>
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
                <div className={`absolute right-0 top-full mt-2 w-72 rounded-xl shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform translate-y-0 ${darkTheme ? 'bg-[#232529] border-[#2d3139]' : 'bg-white border-gray-200'}`}>
                  <div className="py-2">
                    {/* Theme Toggle */}
                    <div className={`px-4 py-3 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${darkTheme ? 'text-slate-200' : 'text-gray-700'}`}>Theme</span>
                        <button
                          type="button"
                          onClick={() => setDarkTheme(!darkTheme)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${darkTheme ? 'bg-[#2d3139] hover:bg-[#353941] text-slate-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                        >
                          {darkTheme ? (
                            <>
                              <Moon className="w-4 h-4" />
                              <span className="text-sm">Dark</span>
                            </>
                          ) : (
                            <>
                              <Sun className="w-4 h-4" />
                              <span className="text-sm">Light</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Chart Visibility Toggles */}
                    <div className={`px-4 py-3 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
                      <div className={`text-xs font-semibold uppercase mb-2 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Chart Visibility</div>
                      
                      <button
                        onClick={() => setChartVisibility((prev: any) => ({ ...prev, clientPerformance: !prev.clientPerformance }))}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors mb-1 ${darkTheme ? 'text-slate-200 hover:bg-[#2d3139]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span>Client Performance</span>
                        {chartVisibility.clientPerformance ? (
                          <Eye className={`w-4 h-4 ${darkTheme ? 'text-green-400' : 'text-green-600'}`} />
                        ) : (
                          <EyeOff className={`w-4 h-4 ${darkTheme ? 'text-slate-500' : 'text-gray-400'}`} />
                        )}
                      </button>
                      
                      <button
                        onClick={() => setChartVisibility((prev: any) => ({ ...prev, progressChart: !prev.progressChart }))}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors mb-1 ${darkTheme ? 'text-slate-200 hover:bg-[#2d3139]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span>Progress Chart</span>
                        {chartVisibility.progressChart ? (
                          <Eye className={`w-4 h-4 ${darkTheme ? 'text-green-400' : 'text-green-600'}`} />
                        ) : (
                          <EyeOff className={`w-4 h-4 ${darkTheme ? 'text-slate-500' : 'text-gray-400'}`} />
                        )}
                      </button>
                      
                      <button
                        onClick={() => setChartVisibility((prev: any) => ({ ...prev, meetingsBreakdown: !prev.meetingsBreakdown }))}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${darkTheme ? 'text-slate-200 hover:bg-[#2d3139]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span>Meetings Breakdown</span>
                        {chartVisibility.meetingsBreakdown ? (
                          <Eye className={`w-4 h-4 ${darkTheme ? 'text-green-400' : 'text-green-600'}`} />
                        ) : (
                          <EyeOff className={`w-4 h-4 ${darkTheme ? 'text-slate-500' : 'text-gray-400'}`} />
                        )}
                      </button>
                    </div>
                    
                    {/* Inactive Assignments Toggle */}
                    <div className={`px-4 py-3 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
                      <div className={`text-xs font-semibold uppercase mb-2 ${darkTheme ? 'text-slate-400' : 'text-gray-500'}`}>Display Options</div>
                      
                      <button
                        onClick={() => setShowInactiveAssignments(!showInactiveAssignments)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${darkTheme ? 'text-slate-200 hover:bg-[#2d3139]' : 'text-gray-700 hover:bg-gray-50'}`}
                        title="Show or hide clients that were removed from this month. Their meetings are still preserved."
                      >
                        <span>Show Inactive Clients</span>
                        {showInactiveAssignments ? (
                          <Eye className={`w-4 h-4 ${darkTheme ? 'text-green-400' : 'text-green-600'}`} />
                        ) : (
                          <EyeOff className={`w-4 h-4 ${darkTheme ? 'text-slate-500' : 'text-gray-400'}`} />
                        )}
                      </button>
                    </div>
                    
                    {/* Import Meetings Button */}
                    <div className="px-4 py-3">
                      <button
                        onClick={() => setShowImportModal(true)}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${darkTheme ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        title="Import meetings from Excel or CSV file"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Import Meetings</span>
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
        <div className={`mb-6 border-b ${darkTheme ? 'border-[#2d3139]' : 'border-gray-200'}`}>
          <nav className="-mb-px flex space-x-8">
            <Link
              to=""
              className={`${
                location.pathname === `/dashboard/sdr/${token}`
                  ? darkTheme ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                  : darkTheme ? 'border-transparent text-slate-300 hover:text-blue-400 hover:border-blue-400/50' : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 transition-colors ${location.pathname === `/dashboard/sdr/${token}` ? '' : darkTheme ? 'group-hover:text-blue-400' : 'group-hover:text-indigo-500'}`} />
                Dashboard
              </span>
            </Link>
            <Link
              to="calendar"
              className={`${
                location.pathname === `/dashboard/sdr/${token}/calendar`
                  ? darkTheme ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                  : darkTheme ? 'border-transparent text-slate-300 hover:text-blue-400 hover:border-blue-400/50' : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 transition-colors ${location.pathname === `/dashboard/sdr/${token}/calendar` ? '' : darkTheme ? 'group-hover:text-blue-400' : 'group-hover:text-purple-500'}`} />
                Calendar
              </span>
            </Link>
            <Link
              to="history"
              className={`${
                location.pathname === `/dashboard/sdr/${token}/history`
                  ? darkTheme ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                  : darkTheme ? 'border-transparent text-slate-300 hover:text-blue-400 hover:border-blue-400/50' : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <History className={`w-4 h-4 transition-colors ${location.pathname === `/dashboard/sdr/${token}/history` ? '' : darkTheme ? 'group-hover:text-blue-400' : 'group-hover:text-green-500'}`} />
                Meeting History
              </span>
            </Link>
            <Link
              to="commissions"
              className={`${
                location.pathname === `/dashboard/sdr/${token}/commissions`
                  ? darkTheme ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                  : darkTheme ? 'border-transparent text-slate-300 hover:text-blue-400 hover:border-blue-400/50' : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <DollarSign className={`w-4 h-4 transition-colors ${location.pathname === `/dashboard/sdr/${token}/commissions` ? '' : darkTheme ? 'group-hover:text-blue-400' : 'group-hover:text-emerald-500'}`} />
                Commissions
              </span>
            </Link>
          </nav>
        </div>
      {(clientsError || meetingsError) && (
        <div className={`mb-6 p-4 rounded-lg ${darkTheme ? 'bg-red-900/20 border border-red-800/50' : 'bg-red-50 border border-red-200'}`}>
          <div className={`flex items-center gap-2 ${darkTheme ? 'text-red-300' : 'text-red-700'}`}>
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
                // Filter to only active clients (matching manager dashboard logic)
                const activeClients = clients.filter((c: any) => c.is_active !== false);
                
                // Calculate targets from active clients only
                const totalSetTarget = activeClients.reduce((sum, client) => sum + (client.monthly_set_target || 0), 0);
                const totalHeldTarget = activeClients.reduce((sum, client) => sum + (client.monthly_hold_target || 0), 0);
                
                const monthStart = new Date(Date.UTC(demoNow.getFullYear(), demoNow.getMonth(), 1));
                const nextMonthStart = new Date(Date.UTC(demoNow.getFullYear(), demoNow.getMonth() + 1, 1));
                
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
                        darkTheme={darkTheme}
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
                          totalMeetingsSet={client.totalMeetingsSet}
                          todaysMeetings={client.todaysMeetings}
                          isInactive={false}
                          allMeetings={meetings}
                          clientId={client.id}
                          darkTheme={darkTheme}
                          onAddMeeting={() => {
                            if (isDemoMode) {
                              alert('Creating meetings is disabled in demo mode.');
                              return;
                            }
                            setSelectedClientId(client.id);
                            // Set booked date to today by default (locked in demo mode)
                            const today = now.toISOString().split('T')[0];
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
                          totalMeetingsSet={client.totalMeetingsSet}
                          todaysMeetings={client.todaysMeetings}
                          darkTheme={darkTheme}
                          isInactive={true}
                          deactivatedAt={client.deactivated_at}
                          allMeetings={meetings}
                          clientId={client.id}
                          onAddMeeting={() => {
                            if (isDemoMode) {
                              alert('Creating meetings is disabled in demo mode.');
                              return;
                            }
                            setSelectedClientId(client.id);
                            // Set booked date to today by default (locked in demo mode)
                            const today = now.toISOString().split('T')[0];
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
                darkTheme={darkTheme}
              />

              {/* Data Visualizations - Moved to bottom */}
              {(() => {
                const calculateMetrics = () => {
                  // Filter to only active clients (matching manager dashboard logic)
                  const activeClients = clients.filter((c: any) => c.is_active !== false);
                  
                  // Calculate targets from active clients only
                  const totalSetTarget = activeClients.reduce((sum, client) => sum + (client.monthly_set_target || 0), 0);
                  const totalHeldTarget = activeClients.reduce((sum, client) => sum + (client.monthly_hold_target || 0), 0);
                  
                  const monthStart = new Date(Date.UTC(demoNow.getFullYear(), demoNow.getMonth(), 1));
                  const nextMonthStart = new Date(Date.UTC(demoNow.getFullYear(), demoNow.getMonth() + 1, 1));
                  
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
              darkTheme={darkTheme}
            />
          } 
        />
        <Route path="commissions" element={<Commissions sdrId={sdrId || ''} darkTheme={darkTheme} />} />
        <Route path="calendar" element={<CalendarView meetings={meetingsWithSDR} colorByStatus={true} darkTheme={darkTheme} />} />
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
