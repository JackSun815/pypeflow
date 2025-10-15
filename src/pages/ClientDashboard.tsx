import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Users, AlertCircle, Rocket, X, Plus, Phone, User, Mail, Building, CheckCircle, AlertTriangle, CalendarDays, MessageSquare, Download, Upload, Edit2, Trash2, FileSpreadsheet, Copy, Send, Moon, Sun, ChevronDown, ChevronUp, Linkedin, BarChart2 } from 'lucide-react';
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
  held_at?: string | null;
  no_show?: boolean;
  no_longer_interested?: boolean;
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

interface EmailAccount {
  id: string;
  email: string;
  domain: string;
  status: 'active' | 'inactive';
}

interface SubjectVariant {
  id: string;
  label: string;
  text: string;
}

interface EmailStep {
  id: string;
  stepNumber: number;
  subjectVariants: SubjectVariant[];
  emailBody: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  steps: EmailStep[];
}

interface LinkedInAccount {
  id: string;
  profileName: string;
  profileUrl: string;
  dailyLimit: number;
  weeklyLimit: number;
  status: 'active' | 'inactive';
  activeCampaign?: string;
}

interface MessageVariant {
  id: string;
  label: string;
  text: string;
}

interface LinkedInStep {
  id: string;
  stepNumber: number;
  messageVariants: MessageVariant[];
}

interface LinkedInCampaign {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  steps: LinkedInStep[];
}

interface CallSequence {
  id: string;
  name: string;
  dials: number;
  connects: number;
  conversations: number;
  leads: number;
  meetings: number;
}

interface EmailSequence {
  id: string;
  name: string;
  totalSent: number;
  opened: number;
  replied: number;
  clicked: number;
  bounced: number;
  meetings: number;
}

interface LinkedInSequence {
  id: string;
  name: string;
  connectionRequests: number;
  connections: number;
  replies: number;
  leads: number;
  meetings: number;
}

export default function ClientDashboard() {
  const { token } = useParams<{ token: string }>();
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'meetings' | 'calendar' | 'icp' | 'lead-sample' | 'email' | 'linkedin' | 'analytics' | 'cold-calling'>('overview');
  
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

  // Email state
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([]);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmailAccount, setNewEmailAccount] = useState({ email: '', domain: '' });
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);

  // LinkedIn state
  const [linkedInAccounts, setLinkedInAccounts] = useState<LinkedInAccount[]>([]);
  const [linkedInCampaigns, setLinkedInCampaigns] = useState<LinkedInCampaign[]>([]);
  const [showLinkedInForm, setShowLinkedInForm] = useState(false);
  const [newLinkedInAccount, setNewLinkedInAccount] = useState({ 
    profileName: '', 
    profileUrl: '', 
    dailyLimit: 50, 
    weeklyLimit: 250 
  });
  const [editingLinkedInCampaign, setEditingLinkedInCampaign] = useState<LinkedInCampaign | null>(null);

  // Analytics state
  const [analyticsTab, setAnalyticsTab] = useState<'calls' | 'emails' | 'linkedin'>('calls');
  const [callSequences, setCallSequences] = useState<CallSequence[]>([]);
  const [emailSequences, setEmailSequences] = useState<EmailSequence[]>([]);
  const [linkedInSequences, setLinkedInSequences] = useState<LinkedInSequence[]>([]);
  const [showSequenceForm, setShowSequenceForm] = useState(false);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('clientDashboard_theme');
    return saved === 'dark';
  });

  // Collapsible sections state
  const [isPastDueCollapsed, setIsPastDueCollapsed] = useState(false);
  const [isUpcomingCollapsed, setIsUpcomingCollapsed] = useState(false);
  const [isHeldCollapsed, setIsHeldCollapsed] = useState(false);

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
      setEmailAccounts(loadClientData('email_accounts', []));
      setEmailCampaigns(loadClientData('email_campaigns', []));
      setLinkedInAccounts(loadClientData('linkedin_accounts', []));
      setLinkedInCampaigns(loadClientData('linkedin_campaigns', []));
      setCallSequences(loadClientData('call_sequences', []));
      setEmailSequences(loadClientData('email_sequences', []));
      setLinkedInSequences(loadClientData('linkedin_sequences', []));
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

  useEffect(() => {
    if (clientInfo) {
      saveClientData('email_accounts', emailAccounts);
    }
  }, [emailAccounts, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('email_campaigns', emailCampaigns);
    }
  }, [emailCampaigns, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('linkedin_accounts', linkedInAccounts);
    }
  }, [linkedInAccounts, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('linkedin_campaigns', linkedInCampaigns);
    }
  }, [linkedInCampaigns, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('call_sequences', callSequences);
    }
  }, [callSequences, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('email_sequences', emailSequences);
    }
  }, [emailSequences, clientInfo]);

  useEffect(() => {
    if (clientInfo) {
      saveClientData('linkedin_sequences', linkedInSequences);
    }
  }, [linkedInSequences, clientInfo]);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('clientDashboard_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Update meeting status using the correct database fields
  const updateMeetingStatus = async (meetingId: string, action: 'held' | 'cancelled' | 'no-show') => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (action === 'held') {
        // Mark as held: set held_at timestamp, clear no_show flag
        updateData.held_at = new Date().toISOString();
        updateData.no_show = false;
        updateData.no_longer_interested = false;
      } else if (action === 'no-show') {
        // Mark as no-show: set no_show flag
        updateData.no_show = true;
      } else if (action === 'cancelled') {
        // Mark as cancelled: set no_longer_interested flag
        updateData.no_longer_interested = true;
      }

      const { error } = await supabase
        .from('meetings')
        .update(updateData)
        .eq('id', meetingId as any);

      if (error) throw error;

      // Refresh meetings to get updated data
      if (clientInfo) {
        await fetchMeetings(clientInfo.id);
      }

      alert(`Meeting marked as ${action === 'held' ? 'held' : action === 'no-show' ? 'no-show' : 'cancelled'}`);
    } catch (err) {
      console.error('Error updating meeting status:', err);
      alert('Failed to update meeting status. Please try again.');
    }
  };

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

  // Email helper functions
  const addEmailAccount = () => {
    if (!newEmailAccount.email || !newEmailAccount.domain) {
      alert('Please enter both email and domain');
      return;
    }

    const account: EmailAccount = {
      id: Date.now().toString(),
      email: newEmailAccount.email,
      domain: newEmailAccount.domain,
      status: 'active'
    };

    setEmailAccounts(prev => [...prev, account]);
    setNewEmailAccount({ email: '', domain: '' });
    setShowEmailForm(false);
  };

  const toggleEmailStatus = (id: string) => {
    setEmailAccounts(prev => prev.map(acc =>
      acc.id === id ? { ...acc, status: acc.status === 'active' ? 'inactive' : 'active' } : acc
    ));
  };

  const deleteEmailAccount = (id: string) => {
    if (confirm('Are you sure you want to delete this email account?')) {
      setEmailAccounts(prev => prev.filter(acc => acc.id !== id));
    }
  };

  const copyAllEmails = () => {
    const emails = emailAccounts.map(acc => acc.email).join('\n');
    navigator.clipboard.writeText(emails);
    alert('All email addresses copied to clipboard!');
  };

  const createNewCampaign = () => {
    const campaign: EmailCampaign = {
      id: Date.now().toString(),
      name: 'New Campaign',
      status: 'inactive',
      steps: [{
        id: Date.now().toString() + '-step-1',
        stepNumber: 1,
        subjectVariants: [
          { id: 'A', label: 'A', text: '' },
          { id: 'B', label: 'B', text: '' },
          { id: 'C', label: 'C', text: '' },
          { id: 'D', label: 'D', text: '' },
          { id: 'E', label: 'E', text: '' }
        ],
        emailBody: ''
      }]
    };
    setEmailCampaigns(prev => [...prev, campaign]);
    setEditingCampaign(campaign);
  };

  const updateCampaign = (campaignId: string, updates: Partial<EmailCampaign>) => {
    setEmailCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, ...updates } : c
    ));
    if (editingCampaign?.id === campaignId) {
      setEditingCampaign(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteCampaign = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      setEmailCampaigns(prev => prev.filter(c => c.id !== id));
      if (editingCampaign?.id === id) {
        setEditingCampaign(null);
      }
    }
  };

  const addCampaignStep = (campaignId: string) => {
    const campaign = emailCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const newStep: EmailStep = {
      id: Date.now().toString() + '-step-' + (campaign.steps.length + 1),
      stepNumber: campaign.steps.length + 1,
      subjectVariants: [
        { id: 'A', label: 'A', text: '' },
        { id: 'B', label: 'B', text: '' },
        { id: 'C', label: 'C', text: '' },
        { id: 'D', label: 'D', text: '' },
        { id: 'E', label: 'E', text: '' }
      ],
      emailBody: ''
    };

    updateCampaign(campaignId, {
      steps: [...campaign.steps, newStep]
    });
  };

  const updateCampaignStep = (campaignId: string, stepId: string, updates: Partial<EmailStep>) => {
    const campaign = emailCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const updatedSteps = campaign.steps.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    );

    updateCampaign(campaignId, { steps: updatedSteps });
  };

  const updateSubjectVariant = (campaignId: string, stepId: string, variantId: string, text: string) => {
    const campaign = emailCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const updatedSteps = campaign.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          subjectVariants: step.subjectVariants.map(v =>
            v.id === variantId ? { ...v, text } : v
          )
        };
      }
      return step;
    });

    updateCampaign(campaignId, { steps: updatedSteps });
  };

  const deleteCampaignStep = (campaignId: string, stepId: string) => {
    const campaign = emailCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;
    
    if (campaign.steps.length <= 1) {
      alert('Campaign must have at least one step');
      return;
    }

    if (confirm('Are you sure you want to delete this step?')) {
      const updatedSteps = campaign.steps
        .filter(step => step.id !== stepId)
        .map((step, index) => ({ ...step, stepNumber: index + 1 }));
      
      updateCampaign(campaignId, { steps: updatedSteps });
    }
  };

  const addSubjectVariant = (campaignId: string, stepId: string) => {
    const campaign = emailCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const step = campaign.steps.find(s => s.id === stepId);
    if (!step) return;

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const usedLabels = step.subjectVariants.map(v => v.label);
    const nextLabel = letters.split('').find(letter => !usedLabels.includes(letter));

    if (!nextLabel) {
      alert('Maximum number of variants reached');
      return;
    }

    const newVariant: SubjectVariant = {
      id: nextLabel,
      label: nextLabel,
      text: ''
    };

    const updatedSteps = campaign.steps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          subjectVariants: [...s.subjectVariants, newVariant]
        };
      }
      return s;
    });

    updateCampaign(campaignId, { steps: updatedSteps });
  };

  const deleteSubjectVariant = (campaignId: string, stepId: string, variantId: string) => {
    const campaign = emailCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const step = campaign.steps.find(s => s.id === stepId);
    if (!step) return;

    if (step.subjectVariants.length <= 1) {
      alert('Step must have at least one subject variant');
      return;
    }

    if (confirm('Are you sure you want to delete this variant?')) {
      const updatedSteps = campaign.steps.map(s => {
        if (s.id === stepId) {
          return {
            ...s,
            subjectVariants: s.subjectVariants.filter(v => v.id !== variantId)
          };
        }
        return s;
      });

      updateCampaign(campaignId, { steps: updatedSteps });
    }
  };

  // LinkedIn helper functions
  const addLinkedInAccount = () => {
    if (!newLinkedInAccount.profileName || !newLinkedInAccount.profileUrl) {
      alert('Please enter both profile name and URL');
      return;
    }

    const account: LinkedInAccount = {
      id: Date.now().toString(),
      profileName: newLinkedInAccount.profileName,
      profileUrl: newLinkedInAccount.profileUrl,
      dailyLimit: newLinkedInAccount.dailyLimit,
      weeklyLimit: newLinkedInAccount.weeklyLimit,
      status: 'active'
    };

    setLinkedInAccounts(prev => [...prev, account]);
    setNewLinkedInAccount({ profileName: '', profileUrl: '', dailyLimit: 50, weeklyLimit: 250 });
    setShowLinkedInForm(false);
  };

  const toggleLinkedInStatus = (id: string) => {
    setLinkedInAccounts(prev => prev.map(acc =>
      acc.id === id ? { ...acc, status: acc.status === 'active' ? 'inactive' : 'active' } : acc
    ));
  };

  const deleteLinkedInAccount = (id: string) => {
    if (confirm('Are you sure you want to delete this LinkedIn account?')) {
      setLinkedInAccounts(prev => prev.filter(acc => acc.id !== id));
    }
  };

  const createNewLinkedInCampaign = () => {
    const campaign: LinkedInCampaign = {
      id: Date.now().toString(),
      name: 'New LinkedIn Campaign',
      status: 'inactive',
      steps: [{
        id: Date.now().toString() + '-step-1',
        stepNumber: 1,
        messageVariants: [
          { id: 'A', label: 'A', text: '' }
        ]
      }]
    };
    setLinkedInCampaigns(prev => [...prev, campaign]);
    setEditingLinkedInCampaign(campaign);
  };

  const updateLinkedInCampaign = (campaignId: string, updates: Partial<LinkedInCampaign>) => {
    setLinkedInCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, ...updates } : c
    ));
    if (editingLinkedInCampaign?.id === campaignId) {
      setEditingLinkedInCampaign(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteLinkedInCampaign = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      setLinkedInCampaigns(prev => prev.filter(c => c.id !== id));
      if (editingLinkedInCampaign?.id === id) {
        setEditingLinkedInCampaign(null);
      }
    }
  };

  const addLinkedInCampaignStep = (campaignId: string) => {
    const campaign = linkedInCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const newStep: LinkedInStep = {
      id: Date.now().toString() + '-step-' + (campaign.steps.length + 1),
      stepNumber: campaign.steps.length + 1,
      messageVariants: [
        { id: 'A', label: 'A', text: '' }
      ]
    };

    updateLinkedInCampaign(campaignId, {
      steps: [...campaign.steps, newStep]
    });
  };

  const updateLinkedInMessageVariant = (campaignId: string, stepId: string, variantId: string, text: string) => {
    const campaign = linkedInCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const updatedSteps = campaign.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          messageVariants: step.messageVariants.map(v =>
            v.id === variantId ? { ...v, text } : v
          )
        };
      }
      return step;
    });

    updateLinkedInCampaign(campaignId, { steps: updatedSteps });
  };

  const deleteLinkedInStep = (campaignId: string, stepId: string) => {
    const campaign = linkedInCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;
    
    if (campaign.steps.length <= 1) {
      alert('Campaign must have at least one step');
      return;
    }

    if (confirm('Are you sure you want to delete this step?')) {
      const updatedSteps = campaign.steps
        .filter(step => step.id !== stepId)
        .map((step, index) => ({ ...step, stepNumber: index + 1 }));
      
      updateLinkedInCampaign(campaignId, { steps: updatedSteps });
    }
  };

  const addLinkedInMessageVariant = (campaignId: string, stepId: string) => {
    const campaign = linkedInCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const step = campaign.steps.find(s => s.id === stepId);
    if (!step) return;

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const usedLabels = step.messageVariants.map(v => v.label);
    const nextLabel = letters.split('').find(letter => !usedLabels.includes(letter));

    if (!nextLabel) {
      alert('Maximum number of variants reached');
      return;
    }

    const newVariant: MessageVariant = {
      id: nextLabel,
      label: nextLabel,
      text: ''
    };

    const updatedSteps = campaign.steps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          messageVariants: [...s.messageVariants, newVariant]
        };
      }
      return s;
    });

    updateLinkedInCampaign(campaignId, { steps: updatedSteps });
  };

  const deleteLinkedInMessageVariant = (campaignId: string, stepId: string, variantId: string) => {
    const campaign = linkedInCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const step = campaign.steps.find(s => s.id === stepId);
    if (!step) return;

    if (step.messageVariants.length <= 1) {
      alert('Step must have at least one message variant');
      return;
    }

    if (confirm('Are you sure you want to delete this variant?')) {
      const updatedSteps = campaign.steps.map(s => {
        if (s.id === stepId) {
          return {
            ...s,
            messageVariants: s.messageVariants.filter(v => v.id !== variantId)
          };
        }
        return s;
      });

      updateLinkedInCampaign(campaignId, { steps: updatedSteps });
    }
  };

  // Analytics helper functions
  const addCallSequence = (sequence: Partial<CallSequence>) => {
    const newSequence: CallSequence = {
      id: Date.now().toString(),
      name: sequence.name || 'New Sequence',
      dials: sequence.dials || 0,
      connects: sequence.connects || 0,
      conversations: sequence.conversations || 0,
      leads: sequence.leads || 0,
      meetings: sequence.meetings || 0
    };
    setCallSequences(prev => [...prev, newSequence]);
    setShowSequenceForm(false);
  };

  const updateCallSequence = (id: string, updates: Partial<CallSequence>) => {
    setCallSequences(prev => prev.map(seq => seq.id === id ? { ...seq, ...updates } : seq));
  };

  const deleteCallSequence = (id: string) => {
    if (confirm('Are you sure you want to delete this sequence?')) {
      setCallSequences(prev => prev.filter(seq => seq.id !== id));
    }
  };

  const addEmailSequence = (sequence: Partial<EmailSequence>) => {
    const newSequence: EmailSequence = {
      id: Date.now().toString(),
      name: sequence.name || 'New Sequence',
      totalSent: sequence.totalSent || 0,
      opened: sequence.opened || 0,
      replied: sequence.replied || 0,
      clicked: sequence.clicked || 0,
      bounced: sequence.bounced || 0,
      meetings: sequence.meetings || 0
    };
    setEmailSequences(prev => [...prev, newSequence]);
    setShowSequenceForm(false);
  };

  const updateEmailSequence = (id: string, updates: Partial<EmailSequence>) => {
    setEmailSequences(prev => prev.map(seq => seq.id === id ? { ...seq, ...updates } : seq));
  };

  const deleteEmailSequence = (id: string) => {
    if (confirm('Are you sure you want to delete this sequence?')) {
      setEmailSequences(prev => prev.filter(seq => seq.id !== id));
    }
  };

  const addLinkedInSequenceStats = (sequence: Partial<LinkedInSequence>) => {
    const newSequence: LinkedInSequence = {
      id: Date.now().toString(),
      name: sequence.name || 'New Sequence',
      connectionRequests: sequence.connectionRequests || 0,
      connections: sequence.connections || 0,
      replies: sequence.replies || 0,
      leads: sequence.leads || 0,
      meetings: sequence.meetings || 0
    };
    setLinkedInSequences(prev => [...prev, newSequence]);
    setShowSequenceForm(false);
  };

  const updateLinkedInSequenceStats = (id: string, updates: Partial<LinkedInSequence>) => {
    setLinkedInSequences(prev => prev.map(seq => seq.id === id ? { ...seq, ...updates } : seq));
  };

  const deleteLinkedInSequenceStats = (id: string) => {
    if (confirm('Are you sure you want to delete this sequence?')) {
      setLinkedInSequences(prev => prev.filter(seq => seq.id !== id));
    }
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

      // Log meeting statuses for debugging
      console.log('Fetched meetings with statuses:', meetingsWithSdrName.map((m: any) => ({
        id: m.id,
        contact: m.contact_full_name,
        date: m.scheduled_date,
        status: m.status,
        held_at: m.held_at,
        no_show: m.no_show,
        no_longer_interested: m.no_longer_interested
      })));

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

  // Categorize meetings more intelligently using database fields
  const now = new Date();
  
  // Helper function to determine if a meeting is finalized
  const isMeetingFinalized = (meeting: Meeting) => {
    return !!(meeting.held_at || meeting.no_show || meeting.no_longer_interested);
  };
  
  // Past due meetings that need action (past date but not finalized) - sorted with most overdue first
  const pastDueMeetings = meetings
    .filter(meeting => {
      const meetingDate = new Date(meeting.scheduled_date);
      return meetingDate < now && !isMeetingFinalized(meeting);
    })
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  // Upcoming future meetings (future date and not finalized) - sorted with closest first
  const upcomingMeetings = meetings
    .filter(meeting => {
      const meetingDate = new Date(meeting.scheduled_date);
      return meetingDate >= now && !isMeetingFinalized(meeting);
    })
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  // Completed meetings - includes meetings with held_at, no_show, or no_longer_interested - sorted with most recent first
  const completedMeetings = meetings
    .filter(meeting => isMeetingFinalized(meeting))
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  const confirmedMeetings = meetings.filter(meeting => 
    meeting.status === 'confirmed'
  );

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Dark mode helper classes
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const cardBorder = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const textTertiary = isDarkMode ? 'text-gray-500' : 'text-gray-500';

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'
    }`}>
      {/* Header */}
      <header className={`shadow-lg border-b relative overflow-hidden transition-colors duration-200 ${
        isDarkMode
          ? 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-gray-600'
          : 'bg-gradient-to-r from-white via-purple-50/30 to-white border-purple-100'
      }`}>
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
                  <div className={`h-8 w-px ${
                    isDarkMode
                      ? 'bg-gradient-to-b from-gray-500 to-gray-400'
                      : 'bg-gradient-to-b from-purple-300 to-purple-500'
                  }`}></div>
                  <div className="flex flex-col">
                    <p className={`text-lg font-semibold ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Client Dashboard</p>
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>{currentMonth}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div 
                className={`flex items-center gap-3 cursor-pointer hover:scale-105 transition-all duration-300 group px-4 py-2 rounded-xl border ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-gray-700 to-gray-600 border-gray-500'
                    : 'bg-gradient-to-r from-purple-100 to-blue-100 border-purple-200'
                }`}
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
                <span className={`text-sm font-semibold transition-colors ${
                  isDarkMode 
                    ? 'text-gray-200 group-hover:text-white' 
                    : 'text-purple-700 group-hover:text-purple-800'
                }`}>{clientInfo?.name}</span>
                <Rocket className={`w-4 h-4 transition-colors rocket-easter-egg-client ${
                  isDarkMode
                    ? 'text-gray-300 group-hover:text-gray-100'
                    : 'text-purple-600 group-hover:text-purple-700'
                }`} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className={`mb-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-blue-400 hover:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 transition-colors ${activeTab === 'overview' ? '' : 'group-hover:text-indigo-500'}`} />
                Overview
              </span>
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`${
                activeTab === 'meetings'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-blue-400 hover:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 transition-colors ${activeTab === 'meetings' ? '' : 'group-hover:text-green-500'}`} />
                Meetings
              </span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`${
                activeTab === 'calendar'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-blue-400 hover:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 transition-colors ${activeTab === 'calendar' ? '' : 'group-hover:text-purple-500'}`} />
                Calendar
              </span>
            </button>
            <button
              onClick={() => setActiveTab('icp')}
              title="Review and refine your ideal customer profile and targeting criteria. See which companies and decision makers we are reaching out to on your behalf."
              className={`${
                activeTab === 'icp'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-blue-400 hover:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Users className={`w-4 h-4 transition-colors ${activeTab === 'icp' ? '' : 'group-hover:text-orange-500'}`} />
                ICP Targeting
              </span>
            </button>
            <button
              onClick={() => setActiveTab('lead-sample')}
              title="View and manage lead samples - add, import, and export example leads that match your ICP"
              className={`${
                activeTab === 'lead-sample'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-blue-400 hover:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className={`w-4 h-4 transition-colors ${activeTab === 'lead-sample' ? '' : 'group-hover:text-teal-500'}`} />
                Lead Sample
              </span>
            </button>
            <button
              onClick={() => setActiveTab('email')}
              title="Manage email accounts, domains, and campaign sequences"
              className={`${
                activeTab === 'email'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-blue-400 hover:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Send className={`w-4 h-4 transition-colors ${activeTab === 'email' ? '' : 'group-hover:text-rose-500'}`} />
                Email
              </span>
            </button>
            <button
              onClick={() => setActiveTab('linkedin')}
              title="Manage LinkedIn accounts and outreach campaigns"
              className={`${
                activeTab === 'linkedin'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-blue-400 hover:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Linkedin className={`w-4 h-4 transition-colors ${activeTab === 'linkedin' ? '' : 'group-hover:text-blue-600'}`} />
                LinkedIn
              </span>
            </button>
            <button
              onClick={() => setActiveTab('cold-calling')}
              title="View SDR assignment, progress tracking, and manage cold calling talk tracks"
              className={`${
                activeTab === 'cold-calling'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-blue-400 hover:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <Phone className={`w-4 h-4 transition-colors ${activeTab === 'cold-calling' ? '' : 'group-hover:text-emerald-500'}`} />
                Cold Calling
              </span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              title="Track and manage outreach analytics across all channels"
              className={`${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-blue-400 hover:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
              } group whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              <span className="flex items-center gap-2">
                <BarChart2 className={`w-4 h-4 transition-colors ${activeTab === 'analytics' ? '' : 'group-hover:text-violet-500'}`} />
                Analytics
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
                className={`${cardBg} rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg hover:border-2 hover:border-blue-200 transition-all duration-200 border-2 border-transparent`}
                onClick={() => handleMetricClick('upcoming')}
                title="Click to view upcoming meetings"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${textPrimary} flex items-center gap-2`}>Upcoming Meetings</h3>
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <div className={`space-y-1 p-3 rounded-md ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-blue-700">{upcomingMeetings.length}</span>
                    <span className={`text-sm ${textSecondary}`}>scheduled</span>
                  </div>
                </div>
              </div>

              <div 
                className={`${cardBg} rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg hover:border-2 hover:border-green-200 transition-all duration-200 border-2 border-transparent`}
                onClick={() => handleMetricClick('confirmed')}
                title="Click to view confirmed meetings"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${textPrimary} flex items-center gap-2`}>Confirmed Meetings</h3>
                  <Clock className="w-6 h-6 text-green-500" />
                </div>
                <div className={`space-y-1 p-3 rounded-md ${isDarkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-green-700">{confirmedMeetings.length}</span>
                    <span className={`text-sm ${textSecondary}`}>confirmed</span>
                  </div>
                </div>
              </div>

              <div 
                className={`${cardBg} rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg hover:border-2 hover:border-purple-200 transition-all duration-200 border-2 border-transparent`}
                onClick={() => handleMetricClick('total')}
                title="Click to view all meetings"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${textPrimary} flex items-center gap-2`}>Total Meetings</h3>
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <div className={`space-y-1 p-3 rounded-md ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-purple-700">{meetings.length}</span>
                    <span className={`text-sm ${textSecondary}`}>total</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Meetings - SDR Style */}
            <div className={`${cardBg} rounded-lg shadow-md`}>
              <div className={`p-4 border-b ${cardBorder}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>Recent Meetings</h3>
                  <span className={`text-sm ${textTertiary}`}>{meetings.slice(0, 5).length} meetings</span>
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
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div 
                onClick={() => pastDueMeetings.length > 0 && scrollToSection('past-due-section')}
                className={`${cardBg} rounded-lg shadow-md p-4 border-l-4 border-orange-500 ${pastDueMeetings.length > 0 ? 'cursor-pointer hover:shadow-lg transform hover:scale-105' : ''} transition-all duration-200`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary}`}>Past Due</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>{pastDueMeetings.length}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-500" />
                </div>
              </div>
              <div 
                onClick={() => upcomingMeetings.length > 0 && scrollToSection('upcoming-section')}
                className={`${cardBg} rounded-lg shadow-md p-4 border-l-4 border-blue-500 ${upcomingMeetings.length > 0 ? 'cursor-pointer hover:shadow-lg transform hover:scale-105' : ''} transition-all duration-200`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary}`}>Upcoming</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>{upcomingMeetings.length}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div 
                onClick={() => completedMeetings.length > 0 && scrollToSection('held-section')}
                className={`${cardBg} rounded-lg shadow-md p-4 border-l-4 border-green-500 ${completedMeetings.length > 0 ? 'cursor-pointer hover:shadow-lg transform hover:scale-105' : ''} transition-all duration-200`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary}`}>Held</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>{completedMeetings.length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className={`${cardBg} rounded-lg shadow-md p-4 border-l-4 border-purple-500`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary}`}>Total</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>{meetings.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Past Due / Action Required Section */}
            {pastDueMeetings.length > 0 && (
              <div id="past-due-section" className={`${cardBg} rounded-lg shadow-md border-2 border-orange-300 scroll-mt-6`}>
                <div 
                  onClick={() => setIsPastDueCollapsed(!isPastDueCollapsed)}
                  className={`p-6 border-b ${cardBorder} bg-gradient-to-r from-orange-50 to-red-50 ${isDarkMode ? 'from-orange-900/20 to-red-900/20' : ''} cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-orange-600 animate-pulse" />
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${textPrimary} flex items-center gap-2`}>
                          Action Required - Past Due Meetings
                          <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">{pastDueMeetings.length}</span>
                        </h3>
                        <p className={`text-sm ${textSecondary} mt-1`}>Please update the status of these past meetings</p>
                      </div>
                    </div>
                    <button className={`p-2 hover:bg-orange-100 rounded-lg transition-colors ${textPrimary}`}>
                      {isPastDueCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {!isPastDueCollapsed && (
                <div className="p-6">
                  {pastDueMeetings.map((meeting) => (
                    <div key={meeting.id} className={`border ${cardBorder} rounded-xl p-5 mb-4 hover:shadow-lg transition-all duration-200 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gradient-to-r from-orange-50/50 to-white'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-orange-900/50' : 'bg-orange-100'}`}>
                              <User className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <h4 className={`text-lg font-semibold ${textPrimary}`}>
                                {meeting.contact_full_name || 'Meeting'}
                              </h4>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(meeting.scheduled_date).toLocaleDateString()}
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium">
                                  <Clock className="w-3 h-3" />
                                  {new Date(meeting.scheduled_date).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                <span className="text-xs text-orange-600 font-semibold">
                                  ({Math.floor((now.getTime() - new Date(meeting.scheduled_date).getTime()) / (1000 * 60 * 60 * 24))} days ago)
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {meeting.contact_email && (
                              <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">Email:</span>
                                <span>{meeting.contact_email}</span>
                              </div>
                            )}
                            {meeting.company && (
                              <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                                <Building className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">Company:</span>
                                <span>{meeting.company}</span>
                              </div>
                            )}
                            <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">SDR:</span>
                              <span>{meeting.sdr_name}</span>
                            </div>
                          </div>
                          
                          {meeting.notes && (
                            <div className={`mt-3 p-3 rounded-lg border-l-4 border-orange-400 ${isDarkMode ? 'bg-gray-600/50' : 'bg-gray-50'}`}>
                              <p className={`text-sm ${textSecondary} leading-relaxed`}>
                                <span className={`font-medium ${textPrimary}`}>Notes:</span> {meeting.notes}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="mt-4 flex items-center gap-3">
                            <p className={`text-sm font-medium ${textPrimary}`}>Update Status:</p>
                            <button
                              onClick={() => updateMeetingStatus(meeting.id, 'held')}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Meeting Held
                            </button>
                            <button
                              onClick={() => updateMeetingStatus(meeting.id, 'no-show')}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                            >
                              <AlertTriangle className="w-4 h-4" />
                              No-Show
                            </button>
                            <button
                              onClick={() => updateMeetingStatus(meeting.id, 'cancelled')}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancelled
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}

            {/* Upcoming Meetings Section */}
            <div id="upcoming-section" className={`${cardBg} rounded-lg shadow-md scroll-mt-6`}>
              <div 
                onClick={() => setIsUpcomingCollapsed(!isUpcomingCollapsed)}
                className={`p-6 border-b ${cardBorder} cursor-pointer hover:opacity-80 transition-opacity`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-50'}`}>
                      <CalendarDays className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${textPrimary}`}>Upcoming Meetings</h3>
                      <p className={`text-sm ${textSecondary} mt-1`}>{upcomingMeetings.length} meetings scheduled</p>
                    </div>
                  </div>
                  <button className={`p-2 hover:bg-blue-100 rounded-lg transition-colors ${textPrimary}`}>
                    {isUpcomingCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {!isUpcomingCollapsed && (
              <div className="p-6">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className={`border ${cardBorder} rounded-xl p-5 mb-4 hover:shadow-lg transition-all duration-200 ${isDarkMode ? 'bg-gray-700/50 hover:border-blue-400' : 'bg-gradient-to-r from-blue-50/30 to-white hover:border-blue-300'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-full ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className={`text-lg font-semibold ${textPrimary}`}>
                              {meeting.contact_full_name || 'Meeting'}
                            </h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className={`inline-flex items-center gap-1 text-xs ${textSecondary}`}>
                                <Calendar className="w-3 h-3" />
                                {new Date(meeting.scheduled_date).toLocaleDateString()}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-xs ${textSecondary}`}>
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
                            <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Email:</span>
                              <span>{meeting.contact_email}</span>
                            </div>
                          )}
                          {meeting.company && (
                            <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                              <Building className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Company:</span>
                              <span>{meeting.company}</span>
                            </div>
                          )}
                          <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">SDR:</span>
                            <span>{meeting.sdr_name}</span>
                          </div>
                        </div>
                        
                        {meeting.notes && (
                          <div className={`mt-3 p-3 rounded-lg border-l-4 border-blue-400 ${isDarkMode ? 'bg-gray-600/50' : 'bg-gray-50'}`}>
                            <p className={`text-sm ${textSecondary} leading-relaxed`}>
                              <span className={`font-medium ${textPrimary}`}>Notes:</span> {meeting.notes}
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
                    <div className={`p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <Calendar className={`w-8 h-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                    <p className={`font-medium ${textSecondary}`}>No upcoming meetings scheduled</p>
                    <p className={`text-sm mt-1 ${textTertiary}`}>New meetings will appear here once scheduled</p>
                  </div>
                )}
              </div>
              )}
            </div>

            {/* Held Meetings History Section */}
            <div id="held-section" className={`${cardBg} rounded-lg shadow-md scroll-mt-6`}>
              <div 
                onClick={() => setIsHeldCollapsed(!isHeldCollapsed)}
                className={`p-6 border-b ${cardBorder} cursor-pointer hover:opacity-80 transition-opacity`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/50' : 'bg-green-50'}`}>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${textPrimary}`}>Held Meetings</h3>
                      <p className={`text-sm ${textSecondary} mt-1`}>{completedMeetings.length} meetings held, cancelled, or no-show</p>
                    </div>
                  </div>
                  <button className={`p-2 hover:bg-green-100 rounded-lg transition-colors ${textPrimary}`}>
                    {isHeldCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {!isHeldCollapsed && (
              <div className="p-6">
                {completedMeetings.map((meeting) => (
                  <div key={meeting.id} className={`border ${cardBorder} rounded-xl p-5 mb-4 hover:shadow-lg transition-all duration-200 ${isDarkMode ? 'bg-gray-700/50 hover:border-gray-500' : 'bg-gradient-to-r from-gray-50/30 to-white hover:border-gray-300'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                            <User className={`w-4 h-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                          </div>
                          <div>
                            <h4 className={`text-lg font-semibold ${textPrimary}`}>
                              {meeting.contact_full_name || 'Meeting'}
                            </h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className={`inline-flex items-center gap-1 text-xs ${textSecondary}`}>
                                <Calendar className="w-3 h-3" />
                                {new Date(meeting.scheduled_date).toLocaleDateString()}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-xs ${textSecondary}`}>
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
                            <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Email:</span>
                              <span>{meeting.contact_email}</span>
                            </div>
                          )}
                          {meeting.company && (
                            <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                              <Building className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Company:</span>
                              <span>{meeting.company}</span>
                            </div>
                          )}
                          <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">SDR:</span>
                            <span>{meeting.sdr_name}</span>
                          </div>
                        </div>
                        
                        {meeting.notes && (
                          <div className={`mt-3 p-3 rounded-lg border-l-4 ${isDarkMode ? 'bg-gray-600/50 border-gray-500' : 'bg-gray-50 border-gray-200'}`}>
                            <p className={`text-sm ${textSecondary} leading-relaxed`}>
                              <span className={`font-medium ${textPrimary}`}>Notes:</span> {meeting.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        {(() => {
                          // Derive display status from database fields
                          const displayStatus = meeting.held_at 
                            ? 'held' 
                            : meeting.no_show 
                            ? 'no-show' 
                            : meeting.no_longer_interested 
                            ? 'cancelled' 
                            : meeting.status;
                          
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                              displayStatus === 'held' 
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : displayStatus === 'cancelled'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : displayStatus === 'no-show'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : displayStatus === 'confirmed'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : displayStatus === 'pending'
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {displayStatus === 'held' ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : displayStatus === 'cancelled' ? (
                                <X className="w-4 h-4" />
                              ) : displayStatus === 'confirmed' ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <AlertTriangle className="w-4 h-4" />
                              )}
                              {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1).replace('-', ' ')}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
                {completedMeetings.length === 0 && (
                  <div className="text-center py-12">
                    <div className={`p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <CheckCircle className={`w-8 h-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                    <p className={`font-medium ${textSecondary}`}>No held meetings yet</p>
                    <p className={`text-sm mt-1 ${textTertiary}`}>Held meetings will appear here</p>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Meeting Calendar</h3>
              <p className="text-sm text-gray-600 mt-1">View all meetings in the calendar</p>
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

        {activeTab === 'email' && (
          <div className="space-y-6">
            {/* Email Accounts & Domains Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Email Accounts & Domains</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage your email accounts and domains for campaigns</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={copyAllEmails}
                    disabled={emailAccounts.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="w-4 h-4" />
                    Copy All Emails
                  </button>
                  <button
                    onClick={() => setShowEmailForm(!showEmailForm)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Account
                  </button>
                </div>
              </div>

              {/* Add Email Form */}
              {showEmailForm && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Email Account</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={newEmailAccount.email}
                        onChange={(e) => setNewEmailAccount({ ...newEmailAccount, email: e.target.value })}
                        placeholder="pamela@chiefofficerai.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                      <input
                        type="text"
                        value={newEmailAccount.domain}
                        onChange={(e) => setNewEmailAccount({ ...newEmailAccount, domain: e.target.value })}
                        placeholder="chiefofficerai.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={addEmailAccount}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Account
                    </button>
                    <button
                      onClick={() => {
                        setShowEmailForm(false);
                        setNewEmailAccount({ email: '', domain: '' });
                      }}
                      className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">Important: Add these email addresses to your contacts</h4>
                    <p className="text-sm text-yellow-800">
                      To ensure you receive all forwarded emails and prevent them from being marked as spam, please add these email addresses to your contacts in Gmail or Outlook. This is especially important due to the lookalike domains being used.
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Accounts Table */}
              {emailAccounts.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Email Accounts Yet</h3>
                  <p className="text-gray-600 mb-4">Add your first email account to get started</p>
                  <button
                    onClick={() => setShowEmailForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Account
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Account</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {emailAccounts.map((account) => (
                        <tr key={account.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{account.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{account.domain}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleEmailStatus(account.id)}
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                                account.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full ${
                                account.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              {account.status}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => deleteEmailAccount(account.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Email Campaigns Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Email Campaigns</h2>
                  <p className="text-sm text-gray-600 mt-1">Create and manage email campaign sequences</p>
                </div>
                <button
                  onClick={createNewCampaign}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  New Campaign
                </button>
              </div>

              {/* Campaign List */}
              {emailCampaigns.length === 0 ? (
                <div className="text-center py-12">
                  <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Campaigns Yet</h3>
                  <p className="text-gray-600 mb-4">Create your first email campaign to get started</p>
                  <button
                    onClick={createNewCampaign}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Campaign
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {emailCampaigns.map((campaign) => (
                    <div key={campaign.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <input
                            type="text"
                            value={campaign.name}
                            onChange={(e) => updateCampaign(campaign.id, { name: e.target.value })}
                            className="text-xl font-bold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none px-2 py-1"
                          />
                          <button
                            onClick={() => updateCampaign(campaign.id, { 
                              status: campaign.status === 'active' ? 'inactive' : 'active' 
                            })}
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                              campaign.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              campaign.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                            {campaign.status}
                          </button>
                        </div>
                        <button
                          onClick={() => deleteCampaign(campaign.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Campaign Steps */}
                      {campaign.steps.map((step) => (
                        <div key={step.id} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Step {step.stepNumber}</h3>
                            {campaign.steps.length > 1 && (
                              <button
                                onClick={() => deleteCampaignStep(campaign.id, step.id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Delete step"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          {/* Subject Lines A/B Testing */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Subject Lines (A/B Testing)
                              </label>
                              <button
                                onClick={() => addSubjectVariant(campaign.id, step.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                Add Variant
                              </button>
                            </div>
                            <div className="space-y-2">
                              {step.subjectVariants.map((variant) => (
                                <div key={variant.id} className="flex items-center gap-2">
                                  <span className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded font-semibold text-sm flex-shrink-0">
                                    {variant.label}
                                  </span>
                                  <input
                                    type="text"
                                    value={variant.text}
                                    onChange={(e) => updateSubjectVariant(campaign.id, step.id, variant.id, e.target.value)}
                                    placeholder={`Subject line variant ${variant.label}`}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                  {step.subjectVariants.length > 1 && (
                                    <button
                                      onClick={() => deleteSubjectVariant(campaign.id, step.id, variant.id)}
                                      className="text-red-600 hover:text-red-900 transition-colors flex-shrink-0"
                                      title="Delete variant"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Email Body */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Body
                            </label>
                            <textarea
                              value={step.emailBody}
                              onChange={(e) => updateCampaignStep(campaign.id, step.id, { emailBody: e.target.value })}
                              placeholder="Enter your email body content here..."
                              rows={8}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      ))}

                      {/* Add Step Button */}
                      <button
                        onClick={() => addCampaignStep(campaign.id)}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Step
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'linkedin' && (
          <div className="space-y-6">
            {/* LinkedIn Accounts Section */}
            <div className={`${cardBg} rounded-lg shadow-md p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${textPrimary}`}>LinkedIn Accounts</h2>
                  <p className={`text-sm ${textSecondary} mt-1`}>Manage your LinkedIn profiles for outreach</p>
                </div>
                <button
                  onClick={() => setShowLinkedInForm(!showLinkedInForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Account
                </button>
              </div>

              {showLinkedInForm && (
                <div className={`mb-6 p-6 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>New LinkedIn Account</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
                        Profile Name
                      </label>
                      <input
                        type="text"
                        value={newLinkedInAccount.profileName}
                        onChange={(e) => setNewLinkedInAccount(prev => ({ ...prev, profileName: e.target.value }))}
                        placeholder="John Doe"
                        className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-white'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
                        Profile URL
                      </label>
                      <input
                        type="url"
                        value={newLinkedInAccount.profileUrl}
                        onChange={(e) => setNewLinkedInAccount(prev => ({ ...prev, profileUrl: e.target.value }))}
                        placeholder="https://linkedin.com/in/johndoe"
                        className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-white'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
                        Daily Limit
                      </label>
                      <input
                        type="number"
                        value={newLinkedInAccount.dailyLimit}
                        onChange={(e) => setNewLinkedInAccount(prev => ({ ...prev, dailyLimit: parseInt(e.target.value) || 0 }))}
                        className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-white'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
                        Weekly Limit
                      </label>
                      <input
                        type="number"
                        value={newLinkedInAccount.weeklyLimit}
                        onChange={(e) => setNewLinkedInAccount(prev => ({ ...prev, weeklyLimit: parseInt(e.target.value) || 0 }))}
                        className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-white'}`}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => {
                        setShowLinkedInForm(false);
                        setNewLinkedInAccount({ profileName: '', profileUrl: '', dailyLimit: 50, weeklyLimit: 250 });
                      }}
                      className={`px-4 py-2 border ${cardBorder} rounded-lg ${textSecondary} hover:bg-gray-100 transition-colors`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addLinkedInAccount}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Account
                    </button>
                  </div>
                </div>
              )}

              {/* LinkedIn Accounts Table */}
              {linkedInAccounts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>
                          Profile
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>
                          Status
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>
                          Active Campaign
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>
                          Daily Limit
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>
                          Weekly Limit
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
                      {linkedInAccounts.map(account => (
                        <tr key={account.id}>
                          <td className={`px-4 py-4 whitespace-nowrap`}>
                            <div className="flex items-center">
                              <Linkedin className="w-5 h-5 text-blue-600 mr-2" />
                              <div>
                                <div className={`text-sm font-medium ${textPrimary}`}>{account.profileName}</div>
                                <a href={account.profileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                  View Profile
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className={`px-4 py-4 whitespace-nowrap`}>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              account.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {account.status}
                            </span>
                          </td>
                          <td className={`px-4 py-4 whitespace-nowrap text-sm ${textSecondary}`}>
                            {account.activeCampaign || '-'}
                          </td>
                          <td className={`px-4 py-4 whitespace-nowrap text-sm ${textSecondary}`}>
                            {account.dailyLimit}
                          </td>
                          <td className={`px-4 py-4 whitespace-nowrap text-sm ${textSecondary}`}>
                            {account.weeklyLimit}
                          </td>
                          <td className={`px-4 py-4 whitespace-nowrap text-sm ${textSecondary}`}>
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleLinkedInStatus(account.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {account.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => deleteLinkedInAccount(account.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`text-center py-8 ${textSecondary}`}>
                  <Linkedin className={`w-12 h-12 mx-auto mb-2 ${textTertiary}`} />
                  <p>No LinkedIn accounts added yet</p>
                </div>
              )}
            </div>

            {/* LinkedIn Campaigns Section */}
            <div className={`${cardBg} rounded-lg shadow-md p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${textPrimary}`}>LinkedIn Campaigns</h2>
                  <p className={`text-sm ${textSecondary} mt-1`}>Create and manage your LinkedIn outreach sequences</p>
                </div>
                <button
                  onClick={createNewLinkedInCampaign}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Campaign
                </button>
              </div>

              {linkedInCampaigns.length > 0 ? (
                <div className="space-y-6">
                  {linkedInCampaigns.map(campaign => (
                    <div key={campaign.id} className={`border ${cardBorder} rounded-lg p-6 ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4 flex-1">
                          <input
                            type="text"
                            value={campaign.name}
                            onChange={(e) => updateLinkedInCampaign(campaign.id, { name: e.target.value })}
                            className={`text-xl font-bold ${textPrimary} bg-transparent border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-2 py-1`}
                          />
                          <button
                            onClick={() => updateLinkedInCampaign(campaign.id, { status: campaign.status === 'active' ? 'inactive' : 'active' })}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              campaign.status === 'active'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {campaign.status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                        <button
                          onClick={() => deleteLinkedInCampaign(campaign.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {campaign.steps.map((step) => (
                        <div key={step.id} className={`mb-6 p-4 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className={`text-lg font-semibold ${textPrimary}`}>Step {step.stepNumber}</h4>
                            <button
                              onClick={() => deleteLinkedInStep(campaign.id, step.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <label className={`text-sm font-medium ${textPrimary}`}>
                                Message Variants (A/B Testing)
                              </label>
                              <button
                                onClick={() => addLinkedInMessageVariant(campaign.id, step.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Add Variant
                              </button>
                            </div>
                            <div className="space-y-2">
                              {step.messageVariants.map(variant => (
                                <div key={variant.id} className="flex items-start gap-2">
                                  <div className={`px-3 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} border ${cardBorder} rounded-lg font-medium text-sm min-w-[40px] text-center ${textPrimary}`}>
                                    {variant.label}
                                  </div>
                                  <textarea
                                    value={variant.text}
                                    onChange={(e) => updateLinkedInMessageVariant(campaign.id, step.id, variant.id, e.target.value)}
                                    placeholder="Enter your LinkedIn message..."
                                    rows={3}
                                    className={`flex-1 px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                  />
                                  {step.messageVariants.length > 1 && (
                                    <button
                                      onClick={() => deleteLinkedInMessageVariant(campaign.id, step.id, variant.id)}
                                      className="text-red-600 hover:text-red-800 mt-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => addLinkedInCampaignStep(campaign.id)}
                        className="w-full px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                      >
                        Add Follow-up Step
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${textSecondary}`}>
                  <Send className={`w-12 h-12 mx-auto mb-2 ${textTertiary}`} />
                  <p>No campaigns created yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Header */}
            <div className={`${cardBg} rounded-lg shadow-md p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-3xl font-bold ${textPrimary}`}>Analytics</h2>
                </div>
              </div>

              {/* Channel Toggle */}
              <div className="flex gap-2 border-b border-gray-200">
                <button
                  onClick={() => setAnalyticsTab('calls')}
                  className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                    analyticsTab === 'calls'
                      ? 'border-blue-500 text-blue-600'
                      : isDarkMode
                        ? 'border-transparent text-gray-400 hover:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-blue-500'
                  }`}
                >
                  Call Stats
                </button>
                <button
                  onClick={() => setAnalyticsTab('emails')}
                  className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                    analyticsTab === 'emails'
                      ? 'border-blue-500 text-blue-600'
                      : isDarkMode
                        ? 'border-transparent text-gray-400 hover:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-blue-500'
                  }`}
                >
                  Email Stats
                </button>
                <button
                  onClick={() => setAnalyticsTab('linkedin')}
                  className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                    analyticsTab === 'linkedin'
                      ? 'border-blue-500 text-blue-600'
                      : isDarkMode
                        ? 'border-transparent text-gray-400 hover:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-blue-500'
                  }`}
                >
                  LinkedIn Stats
                </button>
              </div>
            </div>

            {/* Call Stats */}
            {analyticsTab === 'calls' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Total Dials</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {callSequences.reduce((sum, seq) => sum + seq.dials, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Connects</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {callSequences.reduce((sum, seq) => sum + seq.connects, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {callSequences.reduce((sum, seq) => sum + seq.dials, 0) > 0
                        ? ((callSequences.reduce((sum, seq) => sum + seq.connects, 0) / callSequences.reduce((sum, seq) => sum + seq.dials, 0)) * 100).toFixed(1)
                        : '0.0'}% rate
                    </p>
                  </div>
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Conversations</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {callSequences.reduce((sum, seq) => sum + seq.conversations, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {callSequences.reduce((sum, seq) => sum + seq.connects, 0) > 0
                        ? ((callSequences.reduce((sum, seq) => sum + seq.conversations, 0) / callSequences.reduce((sum, seq) => sum + seq.connects, 0)) * 100).toFixed(1)
                        : '0.0'}% rate
                    </p>
                  </div>
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Leads</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {callSequences.reduce((sum, seq) => sum + seq.leads, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Meetings</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {callSequences.reduce((sum, seq) => sum + seq.meetings, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {callSequences.reduce((sum, seq) => sum + seq.conversations, 0) > 0
                        ? ((callSequences.reduce((sum, seq) => sum + seq.meetings, 0) / callSequences.reduce((sum, seq) => sum + seq.conversations, 0)) * 100).toFixed(1)
                        : '0.0'}% rate
                    </p>
                  </div>
                </div>

                {/* Add Sequence Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSequenceForm(!showSequenceForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Sequence
                  </button>
                </div>

                {/* Add Sequence Form */}
                {showSequenceForm && (
                  <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                    <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Add Call Sequence</h3>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      addCallSequence({
                        name: formData.get('name') as string,
                        dials: parseInt(formData.get('dials') as string) || 0,
                        connects: parseInt(formData.get('connects') as string) || 0,
                        conversations: parseInt(formData.get('conversations') as string) || 0,
                        leads: parseInt(formData.get('leads') as string) || 0,
                        meetings: parseInt(formData.get('meetings') as string) || 0
                      });
                      e.currentTarget.reset();
                    }}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Sequence Name *</label>
                          <input
                            name="name"
                            type="text"
                            placeholder="e.g., October"
                            required
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Dials</label>
                          <input
                            name="dials"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Connects</label>
                          <input
                            name="connects"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Conversations</label>
                          <input
                            name="conversations"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Leads</label>
                          <input
                            name="leads"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Meetings</label>
                          <input
                            name="meetings"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowSequenceForm(false)}
                          className={`px-4 py-2 border ${cardBorder} rounded-lg ${textSecondary} hover:bg-gray-100 transition-colors`}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Sequences Table */}
                <div className={`${cardBg} rounded-lg shadow-md overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Sequence Name</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Dials</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Connects</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Connect Rate</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Conversations</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Conversation Rate</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Leads</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Meetings</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Meeting Rate</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
                        {callSequences.map(sequence => (
                          <tr key={sequence.id}>
                            <td className={`px-4 py-4`}>
                              <input
                                type="text"
                                value={sequence.name}
                                onChange={(e) => updateCallSequence(sequence.id, { name: e.target.value })}
                                className={`bg-transparent border-none ${textPrimary} font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.dials}
                                onChange={(e) => updateCallSequence(sequence.id, { dials: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.connects}
                                onChange={(e) => updateCallSequence(sequence.id, { connects: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4 text-sm ${textSecondary}`}>
                              {sequence.dials > 0 ? ((sequence.connects / sequence.dials) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.conversations}
                                onChange={(e) => updateCallSequence(sequence.id, { conversations: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4 text-sm ${textSecondary}`}>
                              {sequence.connects > 0 ? ((sequence.conversations / sequence.connects) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.leads}
                                onChange={(e) => updateCallSequence(sequence.id, { leads: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.meetings}
                                onChange={(e) => updateCallSequence(sequence.id, { meetings: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4 text-sm ${textSecondary}`}>
                              {sequence.conversations > 0 ? ((sequence.meetings / sequence.conversations) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className={`px-4 py-4`}>
                              <button
                                onClick={() => deleteCallSequence(sequence.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {callSequences.length === 0 && (
                      <div className={`text-center py-12 ${textSecondary}`}>
                        <BarChart2 className={`w-12 h-12 mx-auto mb-3 ${textTertiary}`} />
                        <p>No call sequences added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Email Stats */}
            {analyticsTab === 'emails' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Total Sent</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {emailSequences.reduce((sum, seq) => sum + seq.totalSent, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Opened</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {emailSequences.reduce((sum, seq) => sum + seq.opened, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {emailSequences.reduce((sum, seq) => sum + seq.totalSent, 0) > 0
                        ? ((emailSequences.reduce((sum, seq) => sum + seq.opened, 0) / emailSequences.reduce((sum, seq) => sum + seq.totalSent, 0)) * 100).toFixed(1)
                        : '0.0'}% rate
                    </p>
                  </div>
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Replied</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {emailSequences.reduce((sum, seq) => sum + seq.replied, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {emailSequences.reduce((sum, seq) => sum + seq.totalSent, 0) > 0
                        ? ((emailSequences.reduce((sum, seq) => sum + seq.replied, 0) / emailSequences.reduce((sum, seq) => sum + seq.totalSent, 0)) * 100).toFixed(1)
                        : '0.0'}% rate
                    </p>
                  </div>
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Clicked</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {emailSequences.reduce((sum, seq) => sum + seq.clicked, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {emailSequences.reduce((sum, seq) => sum + seq.totalSent, 0) > 0
                        ? ((emailSequences.reduce((sum, seq) => sum + seq.clicked, 0) / emailSequences.reduce((sum, seq) => sum + seq.totalSent, 0)) * 100).toFixed(1)
                        : '0.0'}% rate
                    </p>
                  </div>
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Bounced</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {emailSequences.reduce((sum, seq) => sum + seq.bounced, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Meetings</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {emailSequences.reduce((sum, seq) => sum + seq.meetings, 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Add Sequence Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSequenceForm(!showSequenceForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Sequence
                  </button>
                </div>

                {/* Add Sequence Form */}
                {showSequenceForm && (
                  <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                    <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Add Email Sequence</h3>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      addEmailSequence({
                        name: formData.get('name') as string,
                        totalSent: parseInt(formData.get('totalSent') as string) || 0,
                        opened: parseInt(formData.get('opened') as string) || 0,
                        replied: parseInt(formData.get('replied') as string) || 0,
                        clicked: parseInt(formData.get('clicked') as string) || 0,
                        bounced: parseInt(formData.get('bounced') as string) || 0,
                        meetings: parseInt(formData.get('meetings') as string) || 0
                      });
                      e.currentTarget.reset();
                    }}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Sequence Name *</label>
                          <input
                            name="name"
                            type="text"
                            placeholder="e.g., Chief AI General 7/22"
                            required
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Total Sent</label>
                          <input
                            name="totalSent"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Opened</label>
                          <input
                            name="opened"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Replied</label>
                          <input
                            name="replied"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Clicked</label>
                          <input
                            name="clicked"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Bounced</label>
                          <input
                            name="bounced"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Meetings</label>
                          <input
                            name="meetings"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowSequenceForm(false)}
                          className={`px-4 py-2 border ${cardBorder} rounded-lg ${textSecondary} hover:bg-gray-100 transition-colors`}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Sequences Table */}
                <div className={`${cardBg} rounded-lg shadow-md overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Sequence Name</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Total Sent</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Opened</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Open Rate</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Replied</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Reply Rate</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Clicked</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Bounced</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Meetings</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
                        {emailSequences.map(sequence => (
                          <tr key={sequence.id}>
                            <td className={`px-4 py-4`}>
                              <input
                                type="text"
                                value={sequence.name}
                                onChange={(e) => updateEmailSequence(sequence.id, { name: e.target.value })}
                                className={`bg-transparent border-none ${textPrimary} font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.totalSent}
                                onChange={(e) => updateEmailSequence(sequence.id, { totalSent: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.opened}
                                onChange={(e) => updateEmailSequence(sequence.id, { opened: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4 text-sm ${textSecondary}`}>
                              {sequence.totalSent > 0 ? ((sequence.opened / sequence.totalSent) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.replied}
                                onChange={(e) => updateEmailSequence(sequence.id, { replied: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4 text-sm ${textSecondary}`}>
                              {sequence.totalSent > 0 ? ((sequence.replied / sequence.totalSent) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.clicked}
                                onChange={(e) => updateEmailSequence(sequence.id, { clicked: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.bounced}
                                onChange={(e) => updateEmailSequence(sequence.id, { bounced: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.meetings}
                                onChange={(e) => updateEmailSequence(sequence.id, { meetings: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4`}>
                              <button
                                onClick={() => deleteEmailSequence(sequence.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {emailSequences.length === 0 && (
                      <div className={`text-center py-12 ${textSecondary}`}>
                        <Send className={`w-12 h-12 mx-auto mb-3 ${textTertiary}`} />
                        <p>No email sequences added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* LinkedIn Stats */}
            {analyticsTab === 'linkedin' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Connection Requests</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {linkedInSequences.reduce((sum, seq) => sum + seq.connectionRequests, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Connections</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {linkedInSequences.reduce((sum, seq) => sum + seq.connections, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {linkedInSequences.reduce((sum, seq) => sum + seq.connectionRequests, 0) > 0
                        ? ((linkedInSequences.reduce((sum, seq) => sum + seq.connections, 0) / linkedInSequences.reduce((sum, seq) => sum + seq.connectionRequests, 0)) * 100).toFixed(1)
                        : '0.0'}% rate
                    </p>
                  </div>
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Replies</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {linkedInSequences.reduce((sum, seq) => sum + seq.replies, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {linkedInSequences.reduce((sum, seq) => sum + seq.connections, 0) > 0
                        ? ((linkedInSequences.reduce((sum, seq) => sum + seq.replies, 0) / linkedInSequences.reduce((sum, seq) => sum + seq.connections, 0)) * 100).toFixed(1)
                        : '0.0'}% rate
                    </p>
                  </div>
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Leads</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {linkedInSequences.reduce((sum, seq) => sum + seq.leads, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className={`${cardBg} rounded-lg shadow-md p-4`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Meetings</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>
                      {linkedInSequences.reduce((sum, seq) => sum + seq.meetings, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {linkedInSequences.reduce((sum, seq) => sum + seq.replies, 0) > 0
                        ? ((linkedInSequences.reduce((sum, seq) => sum + seq.meetings, 0) / linkedInSequences.reduce((sum, seq) => sum + seq.replies, 0)) * 100).toFixed(1)
                        : '0.0'}% rate
                    </p>
                  </div>
                </div>

                {/* Add Sequence Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSequenceForm(!showSequenceForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Sequence
                  </button>
                </div>

                {/* Add Sequence Form */}
                {showSequenceForm && (
                  <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                    <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Add LinkedIn Sequence</h3>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      addLinkedInSequenceStats({
                        name: formData.get('name') as string,
                        connectionRequests: parseInt(formData.get('connectionRequests') as string) || 0,
                        connections: parseInt(formData.get('connections') as string) || 0,
                        replies: parseInt(formData.get('replies') as string) || 0,
                        leads: parseInt(formData.get('leads') as string) || 0,
                        meetings: parseInt(formData.get('meetings') as string) || 0
                      });
                      e.currentTarget.reset();
                    }}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Sequence Name *</label>
                          <input
                            name="name"
                            type="text"
                            placeholder="e.g., Q4 Campaign"
                            required
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Connection Requests</label>
                          <input
                            name="connectionRequests"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Connections</label>
                          <input
                            name="connections"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Replies</label>
                          <input
                            name="replies"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Leads</label>
                          <input
                            name="leads"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Meetings</label>
                          <input
                            name="meetings"
                            type="number"
                            placeholder="0"
                            min="0"
                            defaultValue="0"
                            className={`w-full px-4 py-2 border ${cardBorder} rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowSequenceForm(false)}
                          className={`px-4 py-2 border ${cardBorder} rounded-lg ${textSecondary} hover:bg-gray-100 transition-colors`}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Sequences Table */}
                <div className={`${cardBg} rounded-lg shadow-md overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Sequence Name</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Connection Requests</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Connections</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Connection Rate</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Replies</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Reply Rate</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Leads</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Meetings</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
                        {linkedInSequences.map(sequence => (
                          <tr key={sequence.id}>
                            <td className={`px-4 py-4`}>
                              <input
                                type="text"
                                value={sequence.name}
                                onChange={(e) => updateLinkedInSequenceStats(sequence.id, { name: e.target.value })}
                                className={`bg-transparent border-none ${textPrimary} font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.connectionRequests}
                                onChange={(e) => updateLinkedInSequenceStats(sequence.id, { connectionRequests: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.connections}
                                onChange={(e) => updateLinkedInSequenceStats(sequence.id, { connections: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4 text-sm ${textSecondary}`}>
                              {sequence.connectionRequests > 0 ? ((sequence.connections / sequence.connectionRequests) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.replies}
                                onChange={(e) => updateLinkedInSequenceStats(sequence.id, { replies: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4 text-sm ${textSecondary}`}>
                              {sequence.connections > 0 ? ((sequence.replies / sequence.connections) * 100).toFixed(1) : '0.0'}%
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.leads}
                                onChange={(e) => updateLinkedInSequenceStats(sequence.id, { leads: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4`}>
                              <input
                                type="number"
                                value={sequence.meetings}
                                onChange={(e) => updateLinkedInSequenceStats(sequence.id, { meetings: parseInt(e.target.value) || 0 })}
                                className={`w-24 bg-transparent border-none ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
                              />
                            </td>
                            <td className={`px-4 py-4`}>
                              <button
                                onClick={() => deleteLinkedInSequenceStats(sequence.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {linkedInSequences.length === 0 && (
                      <div className={`text-center py-12 ${textSecondary}`}>
                        <Linkedin className={`w-12 h-12 mx-auto mb-3 ${textTertiary}`} />
                        <p>No LinkedIn sequences added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
