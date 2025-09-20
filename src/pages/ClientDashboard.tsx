import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Users, AlertCircle, History, Rocket, X, Plus } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'meetings' | 'history' | 'calendar' | 'icp'>('overview');
  
  // Modal state for clickable metrics
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'upcoming' | 'confirmed' | 'total' | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<any>(null);

  // ICP Targeting state
  const [jobTitles, setJobTitles] = useState({
    include1: ['GM', 'Asst General Manager', 'CFO', 'IT Security Manager', 'IT Manager'],
    include2: ['General Manager', 'Assistant GM', 'VP of Risk/Risk Officer', 'VP of Fraud', 'IT Director', 'ISO/CISO'],
    include3: ['Director of IT', 'Information Security Manager', 'CISO', 'FSO', 'CFO'],
    managementLevel: ['CXO', 'VP', 'Director']
  });
  
  const [locations, setLocations] = useState({
    personLocations: ['United States'],
    companyLocations: {
      banks: ['Indiana', 'Michigan', 'Illinois', 'Ohio', 'Wisconsin'],
      criticalInfra: ['Colorado'],
      dod: ['United States']
    }
  });
  
  const [industryKeywords, setIndustryKeywords] = useState({
    companyKeywords: ['Banks', 'DoD Government Contractors', 'Manufacturing', 'Critical Infrastructure'],
    industries: ['Manufacturing', 'Finance', 'Utilities']
  });
  
  const [employeeCounts, setEmployeeCounts] = useState({
    smallBanks: '50-500',
    dodContractors: '100-2500',
    criticalInfra: '50-500'
  });
  
  const [revenue, setRevenue] = useState({
    max: '10,000,000,000'
  });
  
  const [companyTypes, setCompanyTypes] = useState(['Public', 'Private']);
  
  const [additionalParams, setAdditionalParams] = useState({
    revenue: 'Is unknown',
    companyType: ['Private Company', 'Public Company', 'Retail Locations'],
    foundedYear: '-',
    customParams: 'Include companies with unknown founding date'
  });

  // Input states for adding new items
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newCompanyType, setNewCompanyType] = useState('');

  // Confetti function
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

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

    setModalType(type);
    setModalTitle(title);
    setModalContent(content);
    setModalOpen(true);
  };

  // ICP Targeting helper functions
  const addJobTitle = (category: keyof typeof jobTitles, title: string) => {
    if (title.trim()) {
      setJobTitles(prev => ({
        ...prev,
        [category]: [...prev[category], title.trim()]
      }));
    }
  };

  const removeJobTitle = (category: keyof typeof jobTitles, index: number) => {
    setJobTitles(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const addLocation = (category: keyof typeof locations.companyLocations, location: string) => {
    if (location.trim()) {
      setLocations(prev => ({
        ...prev,
        companyLocations: {
          ...prev.companyLocations,
          [category]: [...prev.companyLocations[category], location.trim()]
        }
      }));
    }
  };

  const removeLocation = (category: keyof typeof locations.companyLocations, index: number) => {
    setLocations(prev => ({
      ...prev,
      companyLocations: {
        ...prev.companyLocations,
        [category]: prev.companyLocations[category].filter((_, i) => i !== index)
      }
    }));
  };

  const addKeyword = (keyword: string) => {
    if (keyword.trim()) {
      setIndustryKeywords(prev => ({
        ...prev,
        companyKeywords: [...prev.companyKeywords, keyword.trim()]
      }));
    }
  };

  const removeKeyword = (index: number) => {
    setIndustryKeywords(prev => ({
      ...prev,
      companyKeywords: prev.companyKeywords.filter((_, i) => i !== index)
    }));
  };

  const addIndustry = (industry: string) => {
    if (industry.trim()) {
      setIndustryKeywords(prev => ({
        ...prev,
        industries: [...prev.industries, industry.trim()]
      }));
    }
  };

  const removeIndustry = (index: number) => {
    setIndustryKeywords(prev => ({
      ...prev,
      industries: prev.industries.filter((_, i) => i !== index)
    }));
  };

  const addCompanyType = (type: string) => {
    if (type.trim()) {
      setCompanyTypes(prev => [...prev, type.trim()]);
    }
  };

  const removeCompanyType = (index: number) => {
    setCompanyTypes(prev => prev.filter((_, i) => i !== index));
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

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <h1 
                className="text-2xl font-bold text-gray-900 cursor-pointer group transition-all duration-200 hover:scale-105"
                onClick={() => {
                  // Easter egg: confetti and flow animation
                  confetti({
                    particleCount: 50,
                    spread: 70,
                    origin: { y: 0.6 }
                  });
                  
                  // Add flow animation
                  const logo = document.querySelector('.pypeflow-logo');
                  if (logo) {
                    logo.classList.add('flow-animation');
                    
                    // Create floating particles
                    for (let i = 0; i < 5; i++) {
                      setTimeout(() => {
                        const particle = document.createElement('div');
                        particle.className = 'flow-particle fixed w-2 h-2 bg-blue-500 rounded-full pointer-events-none z-50';
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
                <span className="pypeflow-logo relative">
                  Pype
                  <span className="text-cyan-500">Flow</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded"></div>
                </span>
              </h1>
              <div className="h-6 w-px bg-gray-300"></div>
              <p className="text-base font-medium text-gray-700">Client Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm">
                {currentMonth}
              </span>
              <div 
                className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform duration-200 group"
                onClick={() => {
                  // Easter egg: confetti and rocket animation
                  confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                  });
                  
                  // Add a subtle bounce effect to the rocket
                  const rocket = document.querySelector('.rocket-easter-egg');
                  if (rocket) {
                    rocket.classList.add('animate-bounce');
                    setTimeout(() => {
                      rocket.classList.remove('animate-bounce');
                    }, 1000);
                  }
                }}
                title="🎉 Click for a surprise!"
              >
                <span className="text-sm font-medium text-blue-500 group-hover:text-blue-600 transition-colors">{clientInfo?.name}</span>
                <Rocket className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors rocket-easter-egg" />
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
                <Clock className="w-4 h-4" />
                Upcoming Meetings
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Meeting History
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

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Meeting Calendar</h3>
              <p className="text-sm text-gray-600 mt-1">View all meetings in calendar format</p>
            </div>
            <div className="p-6">
              <CalendarView meetings={meetings} colorByStatus={true} />
            </div>
          </div>
        )}

        {activeTab === 'icp' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">ICP / Targeting Parameters</h2>
                  <p className="text-sm text-green-600 mt-1">All changes saved</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Active Filters
                  </div>
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    19 filters applied
                  </div>
                </div>
              </div>
            </div>

            {/* Job Titles Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Titles</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Include:</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {jobTitles.include1.map((title, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {title}
                        <button
                          onClick={() => removeJobTitle('include1', index)}
                          className="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newJobTitle}
                      onChange={(e) => setNewJobTitle(e.target.value)}
                      placeholder="Add job title..."
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        addJobTitle('include1', newJobTitle);
                        setNewJobTitle('');
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Include:</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {jobTitles.include2.map((title, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {title}
                        <button
                          onClick={() => removeJobTitle('include2', index)}
                          className="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Include:</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {jobTitles.include3.map((title, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {title}
                        <button
                          onClick={() => removeJobTitle('include3', index)}
                          className="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Management Level:</label>
                  <div className="flex flex-wrap gap-2">
                    {jobTitles.managementLevel.map((level, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {level}
                        <button
                          onClick={() => removeJobTitle('managementLevel', index)}
                          className="hover:bg-green-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Person Locations:</label>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">United States</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Locations:</label>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">For Banks: </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">Indiana, Michigan, Illinois, Ohio, Wisconsin</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Critical Infra: </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">Colorado</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">DoD: </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">United States</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Industry & Keywords Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry & Keywords</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Keywords Contain ANY Of:</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {industryKeywords.companyKeywords.map((keyword, index) => (
                      <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {keyword}
                        <button
                          onClick={() => removeKeyword(index)}
                          className="hover:bg-purple-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Add keyword..."
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => {
                        addKeyword(newKeyword);
                        setNewKeyword('');
                      }}
                      className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry:</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {industryKeywords.industries.map((industry, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {industry}
                        <button
                          onClick={() => removeIndustry(index)}
                          className="hover:bg-green-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newIndustry}
                      onChange={(e) => setNewIndustry(e.target.value)}
                      placeholder="Add industry..."
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={() => {
                        addIndustry(newIndustry);
                        setNewIndustry('');
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* # Employees Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4"># Employees</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Small Banks: </span>
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">50-500</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">DoD Contractors: </span>
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">100-2500</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Critical Infra: </span>
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">50-500</span>
                </div>
              </div>
            </div>

            {/* Revenue Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Max: </span>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">10,000,000,000</span>
                </div>
              </div>
            </div>

            {/* Company Type Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Type</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {companyTypes.map((type, index) => (
                  <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {type}
                    <button
                      onClick={() => removeCompanyType(index)}
                      className="hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCompanyType}
                  onChange={(e) => setNewCompanyType(e.target.value)}
                  placeholder="Add company type..."
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <button
                  onClick={() => {
                    addCompanyType(newCompanyType);
                    setNewCompanyType('');
                  }}
                  className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Additional Parameters */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Revenue</label>
                  <p className="text-sm text-gray-500">Is unknown</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Type</label>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Private Company</p>
                    <p className="text-sm text-gray-500">Public Company</p>
                    <p className="text-sm text-gray-500">Retail Locations</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Founded Year</label>
                  <p className="text-sm text-gray-500">-</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Parameters</label>
                  <p className="text-sm text-gray-500">Include companies with unknown founding date</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    19 filters applied
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition duration-150">
                    Clear All
                  </button>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-150">
                    Apply Filters
                  </button>
                </div>
              </div>
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
                <div className="space-y-4">
                  {modalContent.data.map((meeting: Meeting) => (
                    <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {meeting.contact_full_name || 'Meeting'}
                          </h3>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600">
                              <strong>Date:</strong> {new Date(meeting.scheduled_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Time:</strong> {new Date(meeting.scheduled_date).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>SDR:</strong> {meeting.sdr_name}
                            </p>
                            {meeting.contact_email && (
                              <p className="text-sm text-gray-600">
                                <strong>Email:</strong> {meeting.contact_email}
                              </p>
                            )}
                            {meeting.contact_phone && (
                              <p className="text-sm text-gray-600">
                                <strong>Phone:</strong> {meeting.contact_phone}
                              </p>
                            )}
                            {meeting.company && (
                              <p className="text-sm text-gray-600">
                                <strong>Company:</strong> {meeting.company}
                              </p>
                            )}
                            {meeting.notes && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700">Notes:</p>
                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1">
                                  {meeting.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            meeting.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800'
                              : meeting.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
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
