import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Users, AlertCircle, History, Rocket, X, Plus, Phone, User, Mail, Building, CheckCircle, AlertTriangle, CalendarDays, MessageSquare, Download, Upload, Edit2, Trash2, FileSpreadsheet } from 'lucide-react';
import confetti from 'canvas-confetti';
import CalendarView from '../components/CalendarView';

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
  contact_phone?: string | null;
  company: string | null;
  notes: string | null;
  sdr_name: string;
  created_at: string;
}

interface LeadSample {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  email: string;
  website: string;
  phone: string;
  linkedinProfile: string;
  seniority: string;
  departments: string;
  lists: string;
  numEmployees: string;
  industry: string;
  leadState: string;
  country: string;
  companyAddress: string;
  technologies: string;
  revenue: string;
  accountExecutive: string;
  generalVertical: string;
}

export default function ClientDashboard() {
  const { token } = useParams<{ token: string }>();
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'meetings' | 'calendar' | 'icp' | 'lead-sample' | 'cold-calling'>('overview');
  
  // Modal state for clickable metrics
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<any>(null);

  // ICP Targeting state - client-specific localStorage persistence
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [companyTypes, setCompanyTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState<string[]>([]);
  const [revenue, setRevenue] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [icpNotes, setIcpNotes] = useState<string>('');

  // Input states for adding new items
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newCompanyType, setNewCompanyType] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newEmployeeCount, setNewEmployeeCount] = useState('');
  const [newRevenue, setNewRevenue] = useState('');
  const [newIndustry, setNewIndustry] = useState('');

  // Cold Calling state - client-specific localStorage persistence
  const [sdrs, setSdrs] = useState<Array<{id: string, name: string, title: string, profilePic: string, isActive: boolean}>>([]);
  const [talkTracks, setTalkTracks] = useState<Array<{id: string, name: string, content: string}>>([]);
  const [newTalkTrackName, setNewTalkTrackName] = useState('');
  const [newTalkTrackContent, setNewTalkTrackContent] = useState('');
  
  // SDR form state
  const [showSDRForm, setShowSDRForm] = useState(false);

  // Helper functions for client-specific localStorage
  const getClientKey = (key: string) => {
    return clientInfo ? `client_${clientInfo.id}_${key}` : null;
  };

  const loadClientData = (key: string, defaultValue: any) => {
    const clientKey = getClientKey(key);
    if (!clientKey) return defaultValue;
    const saved = localStorage.getItem(clientKey);
    return saved ? JSON.parse(saved) : defaultValue;
  };

  const saveClientData = (key: string, data: any) => {
    const clientKey = getClientKey(key);
    if (clientKey) {
      localStorage.setItem(clientKey, JSON.stringify(data));
    }
  };
  const [newSDRName, setNewSDRName] = useState('');
  const [newSDRTitle, setNewSDRTitle] = useState('');
  const [newSDRProfilePic, setNewSDRProfilePic] = useState('');
  
  // Talk tracks form state
  const [showTalkTrackForm, setShowTalkTrackForm] = useState(false);
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

  // Lead Sample state
  const [leadSamples, setLeadSamples] = useState<LeadSample[]>([]);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadSample | null>(null);
  const [newLead, setNewLead] = useState<Partial<LeadSample>>({
    name: '',
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    email: '',
    website: '',
    phone: '',
    linkedinProfile: '',
    seniority: '',
    departments: '',
    lists: '',
    numEmployees: '',
    industry: '',
    leadState: '',
    country: '',
    companyAddress: '',
    technologies: '',
    revenue: '',
    accountExecutive: '',
    generalVertical: ''
  });

  // Confetti function
  // const triggerConfetti = () => {
  //   confetti({
  //     particleCount: 100,
  //     spread: 70,
  //     origin: { y: 0.6 }
  //   });
  // };

  // Handle metric card clicks
  const handleMetricClick = (type: 'upcoming' | 'confirmed' | 'total') => {
    let title = '';
    let content = null;

    switch (type) {
      case 'upcoming':
        title = 'Upcoming Meetings';
        content = {
          type: 'upcoming',
          data: upcomingMeetings
        };
        break;
      case 'confirmed':
        title = 'Confirmed Meetings';
        content = {
          type: 'confirmed',
          data: confirmedMeetings
        };
        break;
      case 'total':
        title = 'All Meetings';
        content = {
          type: 'total',
          data: meetings
        };
        break;
    }

    setModalTitle(title);
    setModalContent(content);
    setModalOpen(true);
  };

  // ICP Targeting helper functions - simplified
  const addItem = (array: string[], setter: (arr: string[]) => void, item: string) => {
    if (item.trim() && !array.includes(item.trim())) {
      setter([...array, item.trim()]);
    }
  };

  const removeItem = (array: string[], setter: (arr: string[]) => void, index: number) => {
    setter(array.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent, value: string, addFunction: () => void) => {
    if (e.key === 'Enter' && value.trim()) {
      addFunction();
    }
  };

  // Calculate total active filters
  const totalActiveFilters = jobTitles.length + companyTypes.length + locations.length + employeeCounts.length + revenue.length + industries.length;

  // Load client-specific data when client info is available
  useEffect(() => {
    if (clientInfo) {
      setJobTitles(loadClientData('icp_jobTitles', ['CEO', 'founder', 'owner', 'president', 'project managers', 'sales managers']));
      setCompanyTypes(loadClientData('icp_companyTypes', []));
      setLocations(loadClientData('icp_locations', ['united states']));
      setEmployeeCounts(loadClientData('icp_employeeCounts', []));
      setRevenue(loadClientData('icp_revenue', ['1M - 100M']));
      setIndustries(loadClientData('icp_industries', ['utilities', 'construction', 'commercial construction']));
      setIcpNotes(loadClientData('icp_notes', ''));
      setSdrs(loadClientData('icp_sdrs', []));
      setTalkTracks(loadClientData('icp_talkTracks', [
        { id: '1', name: 'Agentic AI Battle Card', content: 'This is a battle card for Agentic AI discussions...' },
        { id: '2', name: 'Call Script', content: 'Hello, this is [Name] from [Company]...' }
      ]));
      setLeadSamples(loadClientData('lead_samples', []));
    }
  }, [clientInfo]);

  // Save client-specific data to localStorage whenever it changes
  useEffect(() => {
    if (clientInfo) {
      saveClientData('icp_jobTitles', jobTitles);
    }
  }, [jobTitles, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('icp_companyTypes', companyTypes);
    }
  }, [companyTypes, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('icp_locations', locations);
    }
  }, [locations, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('icp_employeeCounts', employeeCounts);
    }
  }, [employeeCounts, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('icp_revenue', revenue);
    }
  }, [revenue, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('icp_industries', industries);
    }
  }, [industries, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('icp_notes', icpNotes);
    }
  }, [icpNotes, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('icp_talkTracks', talkTracks);
    }
  }, [talkTracks, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('icp_sdrs', sdrs);
    }
  }, [sdrs, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('lead_samples', leadSamples);
    }
  }, [leadSamples, clientInfo]);

  // Cold Calling helper functions
  const addSDR = () => {
    if (newSDRName.trim() && newSDRTitle.trim()) {
      const newSDR = {
        id: Date.now().toString(),
        name: newSDRName.trim(),
        title: newSDRTitle.trim(),
        profilePic: newSDRProfilePic.trim() || '',
        isActive: true
      };
      setSdrs(prev => [...prev, newSDR]);
      setNewSDRName('');
      setNewSDRTitle('');
      setNewSDRProfilePic('');
      setShowSDRForm(false);
    }
  };

  const removeSDR = (id: string) => {
    setSdrs(prev => prev.filter(sdr => sdr.id !== id));
  };

  const toggleSDRStatus = (id: string) => {
    setSdrs(prev => prev.map(sdr => 
      sdr.id === id 
        ? { ...sdr, isActive: !sdr.isActive }
        : sdr
    ));
  };

  const addTalkTrack = () => {
    if (newTalkTrackName.trim() && newTalkTrackContent.trim()) {
      const newTrack = {
        id: Date.now().toString(),
        name: newTalkTrackName.trim(),
        content: newTalkTrackContent.trim()
      };
      setTalkTracks(prev => [...prev, newTrack]);
      setNewTalkTrackName('');
      setNewTalkTrackContent('');
      setShowTalkTrackForm(false);
    }
  };

  const removeTalkTrack = (id: string) => {
    setTalkTracks(prev => prev.filter(track => track.id !== id));
  };

  // Lead Sample helper functions
  const addOrUpdateLead = () => {
    if (!newLead.firstName || !newLead.lastName || !newLead.email) {
      alert('Please fill in at least First Name, Last Name, and Email');
      return;
    }

    const fullName = `${newLead.firstName} ${newLead.lastName}`;
    
    if (editingLead) {
      // Update existing lead
      setLeadSamples(prev => prev.map(lead => 
        lead.id === editingLead.id 
          ? { ...newLead, id: editingLead.id, name: fullName } as LeadSample
          : lead
      ));
    } else {
      // Add new lead
      const lead: LeadSample = {
        id: Date.now().toString(),
        name: fullName,
        firstName: newLead.firstName || '',
        lastName: newLead.lastName || '',
        title: newLead.title || '',
        company: newLead.company || '',
        email: newLead.email || '',
        website: newLead.website || '',
        phone: newLead.phone || '',
        linkedinProfile: newLead.linkedinProfile || '',
        seniority: newLead.seniority || '',
        departments: newLead.departments || '',
        lists: newLead.lists || '',
        numEmployees: newLead.numEmployees || '',
        industry: newLead.industry || '',
        leadState: newLead.leadState || '',
        country: newLead.country || '',
        companyAddress: newLead.companyAddress || '',
        technologies: newLead.technologies || '',
        revenue: newLead.revenue || '',
        accountExecutive: newLead.accountExecutive || '',
        generalVertical: newLead.generalVertical || ''
      };
      setLeadSamples(prev => [...prev, lead]);
    }

    // Reset form
    setNewLead({
      name: '',
      firstName: '',
      lastName: '',
      title: '',
      company: '',
      email: '',
      website: '',
      phone: '',
      linkedinProfile: '',
      seniority: '',
      departments: '',
      lists: '',
      numEmployees: '',
      industry: '',
      leadState: '',
      country: '',
      companyAddress: '',
      technologies: '',
      revenue: '',
      accountExecutive: '',
      generalVertical: ''
    });
    setShowLeadForm(false);
    setEditingLead(null);
  };

  const editLead = (lead: LeadSample) => {
    setEditingLead(lead);
    setNewLead(lead);
    setShowLeadForm(true);
  };

  const deleteLead = (id: string) => {
    if (confirm('Are you sure you want to delete this lead sample?')) {
      setLeadSamples(prev => prev.filter(lead => lead.id !== id));
    }
  };

  const exportLeads = () => {
    if (leadSamples.length === 0) {
      alert('No lead samples to export');
      return;
    }

    // Create CSV content
    const headers = [
      'NAME', 'FIRST NAME', 'LAST NAME', 'TITLE', 'COMPANY', 'EMAIL', 
      'WEBSITE', 'PHONE', 'LINKEDIN PROFILE', 'SENIORITY', 'DEPARTMENTS', 
      'LISTS', '# EMPLOYEES', 'INDUSTRY', 'LEAD STATE', 'COUNTRY', 
      'COMPANY ADDRESS', 'TECHNOLOGIES', 'REVENUE', 'ACCOUNT EXECUTIVE', 
      'GENERAL VERTICAL'
    ];
    
    const csvRows = [headers.join(',')];
    
    leadSamples.forEach(lead => {
      const row = [
        lead.name,
        lead.firstName,
        lead.lastName,
        lead.title,
        lead.company,
        lead.email,
        lead.website,
        lead.phone,
        lead.linkedinProfile,
        lead.seniority,
        lead.departments,
        lead.lists,
        lead.numEmployees,
        lead.industry,
        lead.leadState,
        lead.country,
        lead.companyAddress,
        lead.technologies,
        lead.revenue,
        lead.accountExecutive,
        lead.generalVertical
      ].map(field => `"${(field || '').replace(/"/g, '""')}"`);
      
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-samples-${clientInfo?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const importLeads = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        
        if (lines.length < 2) {
          alert('CSV file is empty or invalid');
          return;
        }

        // Skip header row
        const newLeads: LeadSample[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Parse CSV line handling quoted fields
          const values: string[] = [];
          let currentValue = '';
          let insideQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());

          if (values.length < 3) continue; // Skip invalid rows

          const lead: LeadSample = {
            id: Date.now().toString() + '-' + i,
            name: values[0] || `${values[1] || ''} ${values[2] || ''}`.trim(),
            firstName: values[1] || '',
            lastName: values[2] || '',
            title: values[3] || '',
            company: values[4] || '',
            email: values[5] || '',
            website: values[6] || '',
            phone: values[7] || '',
            linkedinProfile: values[8] || '',
            seniority: values[9] || '',
            departments: values[10] || '',
            lists: values[11] || '',
            numEmployees: values[12] || '',
            industry: values[13] || '',
            leadState: values[14] || '',
            country: values[15] || '',
            companyAddress: values[16] || '',
            technologies: values[17] || '',
            revenue: values[18] || '',
            accountExecutive: values[19] || '',
            generalVertical: values[20] || ''
          };

          newLeads.push(lead);
        }

        if (newLeads.length > 0) {
          setLeadSamples(prev => [...prev, ...newLeads]);
          alert(`Successfully imported ${newLeads.length} lead samples`);
        } else {
          alert('No valid leads found in the file');
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error importing CSV file. Please ensure it is properly formatted.');
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

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
        tokenData = JSON.parse(atob(token || ''));
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

      setClientInfo({ id: (clientData as any).id, name: (clientData as any).name });

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
        .eq('client_id', clientId as any)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      const meetingsWithSdrName = data?.map((meeting: any) => ({
        ...meeting,
        sdr_name: meeting.profiles?.full_name || 'Unknown SDR'
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

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-white via-purple-50/30 to-white shadow-lg border-b border-purple-100 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/20 to-transparent"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-4 left-8 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          <div className="absolute top-8 right-12 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-300"></div>
          <div className="absolute top-12 left-1/4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse delay-700"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                <h1 
                  className="text-3xl font-bold cursor-pointer group transition-all duration-300 hover:scale-105 relative z-10"
                  onClick={() => {
                    // Easter egg: confetti and flow animation
                    confetti({
                      particleCount: 50,
                      spread: 70,
                      origin: { y: 0.6 }
                    });
                    
                    // Add flow animation
                    const logo = document.querySelector('.pypeflow-logo-client');
                    if (logo) {
                      logo.classList.add('flow-animation');
                      
                      // Create floating particles
                      for (let i = 0; i < 5; i++) {
                        setTimeout(() => {
                          const particle = document.createElement('div');
                          particle.className = 'flow-particle fixed w-2 h-2 bg-purple-500 rounded-full pointer-events-none z-50';
                          particle.style.cssText = `
                            --flow-x: ${Math.random() * 200 - 100}px;
                            --flow-y: ${Math.random() * 200 - 100}px;
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
                  <span className="pypeflow-logo-client relative">
                    <span className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">Pype</span>
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Flow</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  </span>
                </h1>
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-px bg-gradient-to-b from-purple-300 to-purple-500"></div>
                  <div className="flex flex-col">
                    <p className="text-lg font-semibold text-gray-800">Client Dashboard</p>
                    <p className="text-sm text-gray-500 font-medium">{currentMonth}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:scale-105 transition-all duration-300 group bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-xl border border-purple-200"
                onClick={() => {
                  // Easter egg: confetti and rocket animation
                  confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                  });
                  
                  // Add a subtle bounce effect to the rocket
                  const rocket = document.querySelector('.rocket-easter-egg-client');
                  if (rocket) {
                    rocket.classList.add('animate-bounce');
                    setTimeout(() => {
                      rocket.classList.remove('animate-bounce');
                    }, 1000);
                  }
                }}
                title="🎉 Click for a surprise!"
              >
                <span className="text-sm font-semibold text-purple-700 group-hover:text-purple-800 transition-colors">{clientInfo?.name}</span>
                <Rocket className="w-4 h-4 text-purple-600 group-hover:text-purple-700 transition-colors rocket-easter-egg-client" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Overview
              </span>
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`${
                activeTab === 'meetings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Meetings
              </span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`${
                activeTab === 'calendar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Calendar
              </span>
            </button>
            <button
              onClick={() => setActiveTab('icp')}
              title="Review and refine your ideal customer profile and targeting criteria. See which companies and decision makers we are reaching out to on your behalf."
              className={`${
                activeTab === 'icp'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                ICP Targeting
              </span>
            </button>
            <button
              onClick={() => setActiveTab('lead-sample')}
              title="View and manage lead samples - add, import, and export example leads that match your ICP"
              className={`${
                activeTab === 'lead-sample'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Lead Sample
              </span>
            </button>
            <button
              onClick={() => setActiveTab('cold-calling')}
              title="View SDR assignment, progress tracking, and manage cold calling talk tracks"
              className={`${
                activeTab === 'cold-calling'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Cold Calling
              </span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg hover:border-2 hover:border-blue-200 transition-all duration-200 border-2 border-transparent"
                onClick={() => handleMetricClick('upcoming')}
                title="Click to view upcoming meetings"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">Upcoming Meetings</h3>
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <div className="space-y-1 bg-blue-50 p-3 rounded-md">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-blue-700">{upcomingMeetings.length}</span>
                    <span className="text-sm text-gray-600">scheduled</span>
                  </div>
                </div>
              </div>

              <div 
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg hover:border-2 hover:border-green-200 transition-all duration-200 border-2 border-transparent"
                onClick={() => handleMetricClick('confirmed')}
                title="Click to view confirmed meetings"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">Confirmed Meetings</h3>
                  <Clock className="w-6 h-6 text-green-500" />
                </div>
                <div className="space-y-1 bg-green-50 p-3 rounded-md">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-green-700">{confirmedMeetings.length}</span>
                    <span className="text-sm text-gray-600">confirmed</span>
                  </div>
                </div>
              </div>

              <div 
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg hover:border-2 hover:border-purple-200 transition-all duration-200 border-2 border-transparent"
                onClick={() => handleMetricClick('total')}
                title="Click to view all meetings"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">Total Meetings</h3>
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <div className="space-y-1 bg-purple-50 p-3 rounded-md">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-purple-700">{meetings.length}</span>
                    <span className="text-sm text-gray-600">total</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Meetings - SDR Style */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Meetings</h3>
                  <span className="text-sm text-gray-500">{meetings.slice(0, 5).length} meetings</span>
                </div>
              </div>
              <div className="p-4 max-h-[400px] overflow-y-auto">
                <div className="space-y-3">
                  {meetings.slice(0, 5).length > 0 ? (
                    meetings.slice(0, 5).map((meeting) => (
                      <div
                        key={meeting.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
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
                          <p className="text-xs text-gray-400">
                            SDR: {meeting.sdr_name}
                          </p>
                          {meeting.company && (
                            <p className="text-xs text-gray-400">
                              Company: {meeting.company}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            meeting.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {meeting.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center">No meetings to display</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="space-y-6">
            {/* Upcoming Meetings Section */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h3>
                    <p className="text-sm text-gray-600 mt-1">{upcomingMeetings.length} meetings scheduled</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="border border-gray-200 rounded-xl p-5 mb-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200 bg-gradient-to-r from-blue-50/30 to-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {meeting.contact_full_name || 'Meeting'}
                            </h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {new Date(meeting.scheduled_date).toLocaleDateString()}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {new Date(meeting.scheduled_date).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {meeting.contact_email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Email:</span>
                              <span>{meeting.contact_email}</span>
                            </div>
                          )}
                          {meeting.company && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Company:</span>
                              <span>{meeting.company}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">SDR:</span>
                            <span>{meeting.sdr_name}</span>
                          </div>
                        </div>
                        
                        {meeting.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-200">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              <span className="font-medium text-gray-900">Notes:</span> {meeting.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                          meeting.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          {meeting.status === 'confirmed' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                          {meeting.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingMeetings.length === 0 && (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No upcoming meetings scheduled</p>
                    <p className="text-sm text-gray-400 mt-1">New meetings will appear here once scheduled</p>
                  </div>
                )}
              </div>
            </div>

            {/* Meeting History Section */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <History className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Meeting History</h3>
                    <p className="text-sm text-gray-600 mt-1">{pastMeetings.length} past meetings</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {pastMeetings.map((meeting) => (
                  <div key={meeting.id} className="border border-gray-200 rounded-xl p-5 mb-4 hover:shadow-lg hover:border-gray-300 transition-all duration-200 bg-gradient-to-r from-gray-50/30 to-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-gray-100 rounded-full">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {meeting.contact_full_name || 'Meeting'}
                            </h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {new Date(meeting.scheduled_date).toLocaleDateString()}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {new Date(meeting.scheduled_date).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {meeting.contact_email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Email:</span>
                              <span>{meeting.contact_email}</span>
                            </div>
                          )}
                          {meeting.company && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Company:</span>
                              <span>{meeting.company}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">SDR:</span>
                            <span>{meeting.sdr_name}</span>
                          </div>
                        </div>
                        
                        {meeting.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-200">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              <span className="font-medium text-gray-900">Notes:</span> {meeting.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                          meeting.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          {meeting.status === 'confirmed' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                          {meeting.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {pastMeetings.length === 0 && (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <History className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No past meetings found</p>
                    <p className="text-sm text-gray-400 mt-1">Held meetings will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Meeting Calendar</h3>
              <p className="text-sm text-gray-600 mt-1">View all meetings in calendar format</p>
            </div>
            <div className="p-6">
              <CalendarView 
                meetings={meetings.filter(m => {
                  const icpStatus = (m as any).icp_status;
                  return icpStatus !== 'not_qualified' && icpStatus !== 'rejected' && icpStatus !== 'denied';
                }) as any} 
                colorByStatus={true} 
              />
            </div>
          </div>
        )}

        {activeTab === 'icp' && (
          <div className="space-y-6">
            {/* Active Filters Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Active Filters</h2>
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {totalActiveFilters} filters applied
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Job Titles */}
                {jobTitles.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Titles</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Include:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {jobTitles.map((title, index) => (
                            <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-blue-100">
                              {title}
                              <button
                                onClick={() => removeItem(jobTitles, setJobTitles, index)}
                                className="hover:bg-blue-100 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Company Types */}
                {companyTypes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Company</h3>
                    <div className="flex flex-wrap gap-2">
                      {companyTypes.map((type, index) => (
                        <span key={index} className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-gray-100">
                          {type}
                          <button
                            onClick={() => removeItem(companyTypes, setCompanyTypes, index)}
                            className="hover:bg-gray-100 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Locations */}
                {locations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Company Locations:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {locations.map((location, index) => (
                            <span key={index} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-green-100">
                              {location}
                              <button
                                onClick={() => removeItem(locations, setLocations, index)}
                                className="hover:bg-green-100 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Industries */}
                {industries.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Industry & Keywords</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Industry:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {industries.map((industry, index) => (
                            <span key={index} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-purple-100">
                              {industry}
                              <button
                                onClick={() => removeItem(industries, setIndustries, index)}
                                className="hover:bg-purple-100 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Revenue */}
                {revenue.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Revenue</h3>
                    <div className="flex flex-wrap gap-2">
                      {revenue.map((rev, index) => (
                        <span key={index} className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-yellow-100">
                          {rev}
                          <button
                            onClick={() => removeItem(revenue, setRevenue, index)}
                            className="hover:bg-yellow-100 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Employee Counts */}
                {employeeCounts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Number of Employees</h3>
                    <div className="flex flex-wrap gap-2">
                      {employeeCounts.map((count, index) => (
                        <span key={index} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-orange-100">
                          {count}
                          <button
                            onClick={() => removeItem(employeeCounts, setEmployeeCounts, index)}
                            className="hover:bg-orange-100 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ICP Notes Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">ICP Notes</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Add notes about your ideal customer profile, targeting strategy, or any specific requirements for your SDR team.
              </p>
              <textarea
                value={icpNotes}
                onChange={(e) => setIcpNotes(e.target.value)}
                placeholder="Enter your ICP notes here... (e.g., key decision maker personas, pain points to focus on, industries to avoid, etc.)"
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  {icpNotes.length} characters
                </p>
                <p className="text-xs text-gray-500">
                  Changes are saved automatically
                </p>
              </div>
            </div>

            {/* Input Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Job Titles Input */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Titles</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, newJobTitle, () => {
                      addItem(jobTitles, setJobTitles, newJobTitle);
                      setNewJobTitle('');
                    })}
                    placeholder="Add job title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      addItem(jobTitles, setJobTitles, newJobTitle);
                      setNewJobTitle('');
                    }}
                    className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 border border-blue-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Job Title
                  </button>
                </div>
              </div>

              {/* Company Input */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newCompanyType}
                    onChange={(e) => setNewCompanyType(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, newCompanyType, () => {
                      addItem(companyTypes, setCompanyTypes, newCompanyType);
                      setNewCompanyType('');
                    })}
                    placeholder="Add company type..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                  <button
                    onClick={() => {
                      addItem(companyTypes, setCompanyTypes, newCompanyType);
                      setNewCompanyType('');
                    }}
                    className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 border border-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Company Type
                  </button>
                </div>
              </div>

              {/* Location Input */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, newLocation, () => {
                      addItem(locations, setLocations, newLocation);
                      setNewLocation('');
                    })}
                    placeholder="Add location..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={() => {
                      addItem(locations, setLocations, newLocation);
                      setNewLocation('');
                    }}
                    className="w-full px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center justify-center gap-2 border border-green-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </button>
                </div>
              </div>

              {/* Number of Employees Input */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Number of Employees</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newEmployeeCount}
                    onChange={(e) => setNewEmployeeCount(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, newEmployeeCount, () => {
                      addItem(employeeCounts, setEmployeeCounts, newEmployeeCount);
                      setNewEmployeeCount('');
                    })}
                    placeholder="Add employee count..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={() => {
                      addItem(employeeCounts, setEmployeeCounts, newEmployeeCount);
                      setNewEmployeeCount('');
                    }}
                    className="w-full px-3 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors flex items-center justify-center gap-2 border border-orange-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Employee Count
                  </button>
                </div>
              </div>

              {/* Revenue Input */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newRevenue}
                    onChange={(e) => setNewRevenue(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, newRevenue, () => {
                      addItem(revenue, setRevenue, newRevenue);
                      setNewRevenue('');
                    })}
                    placeholder="Add revenue range..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <button
                    onClick={() => {
                      addItem(revenue, setRevenue, newRevenue);
                      setNewRevenue('');
                    }}
                    className="w-full px-3 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2 border border-yellow-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Revenue
                  </button>
                </div>
              </div>

              {/* Industry Input */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, newIndustry, () => {
                      addItem(industries, setIndustries, newIndustry);
                      setNewIndustry('');
                    })}
                    placeholder="Add industry..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => {
                      addItem(industries, setIndustries, newIndustry);
                      setNewIndustry('');
                    }}
                    className="w-full px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors flex items-center justify-center gap-2 border border-purple-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Industry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lead-sample' && (
          <div className="space-y-6">
            {/* Header with Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Lead Samples</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage example leads that match your ICP targeting criteria
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="csv-upload"
                    accept=".csv,.xlsx,.xls"
                    onChange={importLeads}
                    className="hidden"
                  />
                  <button
                    onClick={() => document.getElementById('csv-upload')?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Upload className="w-4 h-4" />
                    Import CSV
                  </button>
                  <button
                    onClick={exportLeads}
                    disabled={leadSamples.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => {
                      setShowLeadForm(!showLeadForm);
                      setEditingLead(null);
                      setNewLead({
                        name: '',
                        firstName: '',
                        lastName: '',
                        title: '',
                        company: '',
                        email: '',
                        website: '',
                        phone: '',
                        linkedinProfile: '',
                        seniority: '',
                        departments: '',
                        lists: '',
                        numEmployees: '',
                        industry: '',
                        leadState: '',
                        country: '',
                        companyAddress: '',
                        technologies: '',
                        revenue: '',
                        accountExecutive: '',
                        generalVertical: ''
                      });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Add Lead
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  {leadSamples.length} lead samples
                </span>
              </div>
            </div>

            {/* Add/Edit Lead Form */}
            {showLeadForm && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingLead ? 'Edit Lead Sample' : 'Add New Lead Sample'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newLead.firstName || ''}
                      onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newLead.lastName || ''}
                      onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newLead.email || ''}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={newLead.title || ''}
                      onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="CEO"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={newLead.company || ''}
                      onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newLead.phone || ''}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={newLead.website || ''}
                      onChange={(e) => setNewLead({ ...newLead, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                    <input
                      type="url"
                      value={newLead.linkedinProfile || ''}
                      onChange={(e) => setNewLead({ ...newLead, linkedinProfile: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seniority</label>
                    <input
                      type="text"
                      value={newLead.seniority || ''}
                      onChange={(e) => setNewLead({ ...newLead, seniority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="C-Level, VP, Director..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departments</label>
                    <input
                      type="text"
                      value={newLead.departments || ''}
                      onChange={(e) => setNewLead({ ...newLead, departments: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Sales, Marketing..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lists</label>
                    <input
                      type="text"
                      value={newLead.lists || ''}
                      onChange={(e) => setNewLead({ ...newLead, lists: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Target List 1, Campaign A..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1"># Employees</label>
                    <input
                      type="text"
                      value={newLead.numEmployees || ''}
                      onChange={(e) => setNewLead({ ...newLead, numEmployees: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="50-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      value={newLead.industry || ''}
                      onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Technology, Healthcare..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={newLead.leadState || ''}
                      onChange={(e) => setNewLead({ ...newLead, leadState: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="CA, NY..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={newLead.country || ''}
                      onChange={(e) => setNewLead({ ...newLead, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="United States"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                    <input
                      type="text"
                      value={newLead.companyAddress || ''}
                      onChange={(e) => setNewLead({ ...newLead, companyAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="123 Main St, Suite 100, City, State 12345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Technologies</label>
                    <input
                      type="text"
                      value={newLead.technologies || ''}
                      onChange={(e) => setNewLead({ ...newLead, technologies: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Salesforce, HubSpot..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Revenue</label>
                    <input
                      type="text"
                      value={newLead.revenue || ''}
                      onChange={(e) => setNewLead({ ...newLead, revenue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="$1M - $10M"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Executive</label>
                    <input
                      type="text"
                      value={newLead.accountExecutive || ''}
                      onChange={(e) => setNewLead({ ...newLead, accountExecutive: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">General Vertical</label>
                    <input
                      type="text"
                      value={newLead.generalVertical || ''}
                      onChange={(e) => setNewLead({ ...newLead, generalVertical: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="SaaS, Manufacturing..."
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowLeadForm(false);
                      setEditingLead(null);
                      setNewLead({
                        name: '',
                        firstName: '',
                        lastName: '',
                        title: '',
                        company: '',
                        email: '',
                        website: '',
                        phone: '',
                        linkedinProfile: '',
                        seniority: '',
                        departments: '',
                        lists: '',
                        numEmployees: '',
                        industry: '',
                        leadState: '',
                        country: '',
                        companyAddress: '',
                        technologies: '',
                        revenue: '',
                        accountExecutive: '',
                        generalVertical: ''
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addOrUpdateLead}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    {editingLead ? 'Update Lead' : 'Add Lead'}
                  </button>
                </div>
              </div>
            )}

            {/* Leads Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {leadSamples.length === 0 ? (
                <div className="text-center py-12">
                  <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lead Samples Yet</h3>
                  <p className="text-gray-600 mb-4">Add lead samples manually or import from a CSV file</p>
                  <button
                    onClick={() => setShowLeadForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Lead
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># Employees</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seniority</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LinkedIn</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leadSamples.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{lead.title || '-'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{lead.company || '-'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{lead.email}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{lead.phone || '-'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{lead.industry || '-'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {[lead.leadState, lead.country].filter(Boolean).join(', ') || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{lead.numEmployees || '-'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{lead.revenue || '-'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{lead.seniority || '-'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {lead.linkedinProfile ? (
                              <a 
                                href={lead.linkedinProfile} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                View
                              </a>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => editLead(lead)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                title="Edit lead"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteLead(lead.id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Delete lead"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'cold-calling' && (
          <div className="space-y-6">
            {/* SDR Management Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">SDR Management</h2>
                <button
                  onClick={() => setShowSDRForm(!showSDRForm)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add SDR
                </button>
              </div>

              {/* Add SDR Form */}
              {showSDRForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New SDR</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={newSDRName}
                        onChange={(e) => setNewSDRName(e.target.value)}
                        placeholder="Enter SDR name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={newSDRTitle}
                        onChange={(e) => setNewSDRTitle(e.target.value)}
                        placeholder="Enter SDR title..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture URL</label>
                      <input
                        type="url"
                        value={newSDRProfilePic}
                        onChange={(e) => setNewSDRProfilePic(e.target.value)}
                        placeholder="Enter image URL (optional)..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={addSDR}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add SDR
                    </button>
                    <button
                      onClick={() => {
                        setShowSDRForm(false);
                        setNewSDRName('');
                        setNewSDRTitle('');
                        setNewSDRProfilePic('');
                      }}
                      className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* SDR Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sdrs.map((sdr) => (
                  <div key={sdr.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        {sdr.profilePic ? (
                          <img
                            src={sdr.profilePic}
                            alt={sdr.name}
                            className="w-20 h-20 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                              if (nextSibling) {
                                nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-2xl ${sdr.profilePic ? 'hidden' : 'flex'}`}
                          style={{ backgroundColor: '#3B82F6' }}
                        >
                          {sdr.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          sdr.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{sdr.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{sdr.title}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSDRStatus(sdr.id)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            sdr.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            sdr.isActive ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          {sdr.isActive ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => removeSDR(sdr.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {sdrs.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <Phone className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No SDRs Added</h3>
                  <p className="text-gray-600">Click "Add SDR" to add your first SDR.</p>
                </div>
              )}
            </div>

            {/* Talk Tracks Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Talk Tracks</h2>
                <button
                  onClick={() => setShowTalkTrackForm(!showTalkTrackForm)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Talk Track
                </button>
              </div>

              {/* Add New Talk Track Form */}
              {showTalkTrackForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">New Talk Track</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Track Name</label>
                      <input
                        type="text"
                        value={newTalkTrackName}
                        onChange={(e) => setNewTalkTrackName(e.target.value)}
                        placeholder="Enter track name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                      <textarea
                        value={newTalkTrackContent}
                        onChange={(e) => setNewTalkTrackContent(e.target.value)}
                        placeholder="Enter talk track content..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addTalkTrack}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Talk Track
                      </button>
                      <button
                        onClick={() => {
                          setShowTalkTrackForm(false);
                          setNewTalkTrackName('');
                          setNewTalkTrackContent('');
                        }}
                        className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Talk Tracks */}
              <div className="space-y-3">
                {talkTracks.map((track) => (
                  <div key={track.id} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedTrack(expandedTrack === track.id ? null : track.id)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-900">{track.name}</h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTalkTrack(track.id);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className={`transform transition-transform ${expandedTrack === track.id ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    {expandedTrack === track.id && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <p className="text-gray-600 text-sm leading-relaxed pt-3">{track.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {talkTracks.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <Plus className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Talk Tracks</h3>
                  <p className="text-gray-600">Click "Add Talk Track" to create your first talk track.</p>
                </div>
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
      </main>

      {/* Meeting Details Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{modalTitle}</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {modalContent && modalContent.data && modalContent.data.length > 0 ? (
                <div className="space-y-6">
                  {modalContent.data.map((meeting: Meeting) => (
                    <div key={meeting.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 bg-gradient-to-r from-blue-50/20 to-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">
                                {meeting.contact_full_name || 'Meeting'}
                              </h3>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(meeting.scheduled_date).toLocaleDateString()}
                                </span>
                                <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  {new Date(meeting.scheduled_date).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">SDR:</span>
                              <span>{meeting.sdr_name}</span>
                            </div>
                            {meeting.contact_email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">Email:</span>
                                <span className="truncate">{meeting.contact_email}</span>
                              </div>
                            )}
                            {meeting.contact_phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">Phone:</span>
                                <span>{meeting.contact_phone}</span>
                              </div>
                            )}
                            {meeting.company && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Building className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">Company:</span>
                                <span>{meeting.company}</span>
                              </div>
                            )}
                          </div>
                          
                          {meeting.notes && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-200">
                              <p className="text-sm font-medium text-gray-900 mb-1">Notes:</p>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {meeting.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="ml-6 flex flex-col items-end gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                            meeting.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : meeting.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {meeting.status === 'confirmed' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : meeting.status === 'pending' ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                            {meeting.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No meetings found</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
